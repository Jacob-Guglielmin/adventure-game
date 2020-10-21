"use strict";

var mapContainer = document.getElementById("mapContainer"),
mapCells = [],
rooms = [],

seed = null,
seededRandom = null,

mapWidth = 50,
mapHeight = 30,

//Tile types
TILES = {
    WALL: "#ff0000",
    DOOR: "#0000ff",
    FLOOR_EDGE: "#00ff00",
    FLOOR: "#ffffff"
},

//CONFIG VALUES
variance = 0.2,

roomSize = ((mapWidth + mapHeight) / 2) / 7,

branches = 4;

//Seeded random function, many thanks to David Bau (http://davidbau.com/archives/2010/01/30/random_seeds_coded_hints_and_quintillions.html)
!function(f,a,c){var s,l=256,p="random",d=c.pow(l,6),g=c.pow(2,52),y=2*g,h=l-1;function n(n,t,r){function e(){for(var n=u.g(6),t=d,r=0;n<g;)n=(n+r)*l,t*=l,r=u.g(1);for(;y<=n;)n/=2,t/=2,r>>>=1;return(n+r)/t}var o=[],i=j(function n(t,r){var e,o=[],i=typeof t;if(r&&"object"==i)for(e in t)try{o.push(n(t[e],r-1))}catch(n){}return o.length?o:"string"==i?t:t+"\0"}((t=1==t?{entropy:!0}:t||{}).entropy?[n,S(a)]:null==n?function(){try{var n;return s&&(n=s.randomBytes)?n=n(l):(n=new Uint8Array(l),(f.crypto||f.msCrypto).getRandomValues(n)),S(n)}catch(n){var t=f.navigator,r=t&&t.plugins;return[+new Date,f,r,f.screen,S(a)]}}():n,3),o),u=new m(o);return e.int32=function(){return 0|u.g(4)},e.quick=function(){return u.g(4)/4294967296},e.double=e,j(S(u.S),a),(t.pass||r||function(n,t,r,e){return e&&(e.S&&v(e,u),n.state=function(){return v(u,{})}),r?(c[p]=n,t):n})(e,i,"global"in t?t.global:this==c,t.state)}function m(n){var t,r=n.length,u=this,e=0,o=u.i=u.j=0,i=u.S=[];for(r||(n=[r++]);e<l;)i[e]=e++;for(e=0;e<l;e++)i[e]=i[o=h&o+n[e%r]+(t=i[e])],i[o]=t;(u.g=function(n){for(var t,r=0,e=u.i,o=u.j,i=u.S;n--;)t=i[e=h&e+1],r=r*l+i[h&(i[e]=i[o=h&o+t])+(i[o]=t)];return u.i=e,u.j=o,r})(l)}function v(n,t){return t.i=n.i,t.j=n.j,t.S=n.S.slice(),t}function j(n,t){for(var r,e=n+"",o=0;o<e.length;)t[h&o]=h&(r^=19*t[h&o])+e.charCodeAt(o++);return S(t)}function S(n){return String.fromCharCode.apply(0,n)}if(j(c.random(),a),"object"==typeof module&&module.exports){module.exports=n;try{s=require("crypto")}catch(n){}}else"function"==typeof define&&define.amd?define(function(){return n}):c["seed"+p]=n}("undefined"!=typeof self?self:this,[],Math);

/**
 * Initializes all the things
 */
function init() {
    //Create the seeded random function
    if (!seed) seed = Math.random();
    seededRandom = new Math.seedrandom(seed);

    //Resizes the map container to fit the map
    mapContainer.style.width = (mapWidth * 20) + "px";
    mapContainer.style.height = (mapHeight * 20) + "px";

    //Fills up the map with empty cells
    addCells();
    newRoom(Math.floor(mapWidth / 2), Math.floor(mapHeight / 2));
}

/**
 * Returns a random value between min and max (inclusive)
 */
function randomBetween(min, max) {
    return Math.floor(seededRandom() * (max - min + 1) + min);
}

/**
 * Returns a random item from an array
 */
function randomFromArray(array) {
    return array[randomBetween(0, array.length - 1)];
}

/**
 * Determines if two arrays are the same
 */
function compareArrays(a, b) {
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

/**
 * Populates the map with empty divs
 */
function addCells() {
    for (let i = 0; i < mapHeight; i++) {
        mapCells[i] = [];
        for (let o = 0; o < mapWidth; o++) {
            mapCells[i][o] = document.createElement("div");
            mapCells[i][o].style.width = "20px";
            mapCells[i][o].style.height = "20px";
            mapCells[i][o].classList.add("mapCell");
            mapContainer.appendChild(mapCells[i][o]);
        }
    }
}

/**
 * Selects a random tile out of a room
 */
function selectRandomTile(room) {
    return randomFromArray(room.tiles);
}

/**
 * Gets the tile at a specific coordinate in a room
 */
function getRoomTile(room, x, y) {
    for (const tile of room.tiles) {
        if (tile.x == x && tile.y == y) {
            return tile;
        }
    }
    return -1;
}

/**
 * Sets a room's tile, checking for existing tiles
 */
function setRoomTile(room, x, y, type) {
    var oldTile = getRoomTile(room, x, y);
    if (oldTile != -1) {
        var oldTileType = oldTile.type;
    } else {
        var oldTileType = -1;
    }
    if (oldTileType != -1) {
        //Never override anything with a wall
        if (type == TILES.WALL) {
            return;
        //Never override a floor
        } else if (oldTileType == TILES.FLOOR) {
            return;
        //Override anything else, and remove the old copy of the tile from the room
        } else {
            room.tiles.splice(room.tiles.indexOf(oldTile), 1);
            room.tiles.push({x: x, y: y, type: type});
        }
    } else {
        room.tiles.push({x: x, y: y, type: type});
    }
}

/**
 * Finds all tiles that would be a good door
 */
function checkForDoors(room) {
    var goodTiles = [];
    for (const tile of room.tiles) {
        if (tile.type == TILES.WALL) {
            var adjacentWalls = [];
            if (getRoomTile(room, tile.x, tile.y - 1).type == TILES.WALL) {
                adjacentWalls.push(1);
            }
            if (getRoomTile(room, tile.x + 1, tile.y).type == TILES.WALL) {
                adjacentWalls.push(2);
            }
            if (getRoomTile(room, tile.x, tile.y + 1).type == TILES.WALL) {
                adjacentWalls.push(3);
            }
            if (getRoomTile(room, tile.x - 1, tile.y).type == TILES.WALL) {
                adjacentWalls.push(4);
            }
            if (compareArrays(adjacentWalls, [1, 3]) || compareArrays(adjacentWalls, [2, 4])) {
                goodTiles.push(tile);
            }
        }
    }
    return goodTiles;
}

/**
 * Adds a door to a room
 */
function addDoor(room) {
    var tile = randomFromArray(checkForDoors(room));
    setRoomTile(room, tile.x, tile.y, TILES.DOOR);
}

/**
 * Creates a new room object
 * 
 * @param x the x coordinate to start generating the room at
 * @param y the y coordinate to start generating the room at
 */
function newRoom(x, y) {
    var room = {
        x: x,
        y: y,
        baseWidth: randomBetween(3, roomSize),
        baseHeight: randomBetween(3, roomSize),
        tiles: [],
        id: rooms.length
    }
    room.steps = Math.max(room.baseWidth + room.baseHeight, roomSize * (1 - seededRandom() * variance));

    planRoom(room);
}

/**
 * Plans a room in terms of shape
 */
function planRoom(room) {
    var width = room.baseWidth,
    height = room.baseHeight,
    mustExpand = [];
    
    //Add expansion in both directions to make a rectangle
    while (width > 0 || height > 0) {
        if (width > 0) {
            mustExpand.push(randomFromArray([1, 3]));
            width--;
        }
        if (height > 0) {
            mustExpand.push(randomFromArray([2, 4]));
            height--;
        }
    }

    for (let i = 0; i < branches; i++) {
        var startX = room.x, startY = room.y, expandX = 1, expandY = 1;
        if (room.tiles.length != 0) {
            var randomTile = selectRandomTile(room);
            startX = randomTile.x;
            startY = randomTile.y;
        }
        for (let o = 0; o < room.steps; o++) {
            //Select a side to expand, priority is on sides that need to be expanded
            var sideToExpand = randomBetween(1, 4);
            if (mustExpand.length != 0) {
                sideToExpand = mustExpand[0];
                mustExpand.shift();
            }
            switch (sideToExpand) {
                case 1:
                    expandY++;
                    break;
                case 2:
                    expandX++;
                    break;
                //These move the start tile because reducing expansion isn't useful.
                case 3:
                    startY--;
                    expandY++;
                case 4:
                    startX--;
                    expandX++;
                default:
                    break;
            }
            selectRoomTiles(room, startX, startY, expandX, expandY);
        }  
    }
    addDoor(room);
    buildRoom(room);
}

/**
 * Constructs the room in tiles
 */
function selectRoomTiles(room, startX, startY, expandX, expandY) {
    var x = 0, y = 0;
    for (x = startX - 1; x < expandX + startX + 1; x++) {
        for (y = startY - 1; y < expandY + startY + 1; y++) {
            setRoomTile(room, x, y, TILES.WALL);
        }
    }
    for (x = startX; x < expandX + startX; x++) {
        for (y = startY; y < expandY + startY; y++) {
            setRoomTile(room, x, y, TILES.FLOOR_EDGE);
        }
    }
    for (x = startX + 1; x < expandX + startX - 1; x++) {
        for (y = startY + 1; y < expandY + startY - 1; y++) {
            setRoomTile(room, x, y, TILES.FLOOR);
        }
    }
}

/**
 * Places a room on the map
 */
function buildRoom(room) {
    for (const tile of room.tiles) {
        mapCells[tile.y][tile.x].style.backgroundColor = tile.type;
    }
    rooms[room.id] = room;
}

/**
 * Deletes the map
 */
function clearMap() {
    mapContainer.textContent = "";
}

init();