"use strict";

/*
    ***ALL COORDINATE SYSTEMS ARE Y,X***
*/
let mapData = [],
    rooms = [],
    openWalls = [],

    seed = null,
    seededRandom = null,

    mapWidth = 60,
    mapHeight = 30,

    buildAttempts = 0,

    //Tile types
    TILES = {
        EMPTY: 0,
        PLAYER: 20,
        WALL_CORNER: 40,
        WALL_HORIZONTAL: 60,
        WALL_VERTICAL: 80,
        DOOR_HORIZONTAL: 100,
        DOOR_VERTICAL: 120,
        FLOOR_EDGE: 140,
        FLOOR: 160,
        WATER: 180
    },

    WALLS = [TILES.WALL_CORNER, TILES.WALL_VERTICAL, TILES.WALL_HORIZONTAL],
    DOORS = [TILES.DOOR_HORIZONTAL, TILES.DOOR_VERTICAL],
    FLOORS = [TILES.FLOOR, TILES.FLOOR_EDGE],

    //CONFIG VALUES
    variance = 0.2,

    roomSize = Math.floor(((mapWidth + mapHeight) / 2) / 7),

    branches = 4,

    roomAmount = Math.floor((mapWidth * mapHeight) / 150),

    decorationRatios = {
        water: 0.2,
        grass: 0.3,
    };

/**
 * Seeded random function, many thanks to David Bau (http://davidbau.com/archives/2010/01/30/random_seeds_coded_hints_and_quintillions.html)
 */
!function(f,a,c){var s,l=256,p="random",d=c.pow(l,6),g=c.pow(2,52),y=2*g,h=l-1;function n(n,t,r){function e(){for(var n=u.g(6),t=d,r=0;n<g;)n=(n+r)*l,t*=l,r=u.g(1);for(;y<=n;)n/=2,t/=2,r>>>=1;return(n+r)/t}var o=[],i=j(function n(t,r){var e,o=[],i=typeof t;if(r&&"object"==i)for(e in t)try{o.push(n(t[e],r-1))}catch(n){}return o.length?o:"string"==i?t:t+"\0"}((t=1==t?{entropy:!0}:t||{}).entropy?[n,S(a)]:null==n?function(){try{var n;return s&&(n=s.randomBytes)?n=n(l):(n=new Uint8Array(l),(f.crypto||f.msCrypto).getRandomValues(n)),S(n)}catch(n){var t=f.navigator,r=t&&t.plugins;return[+new Date,f,r,f.screen,S(a)]}}():n,3),o),u=new m(o);return e.int32=function(){return 0|u.g(4)},e.quick=function(){return u.g(4)/4294967296},e.double=e,j(S(u.S),a),(t.pass||r||function(n,t,r,e){return e&&(e.S&&v(e,u),n.state=function(){return v(u,{})}),r?(c[p]=n,t):n})(e,i,"global"in t?t.global:this==c,t.state)}function m(n){var t,r=n.length,u=this,e=0,o=u.i=u.j=0,i=u.S=[];for(r||(n=[r++]);e<l;)i[e]=e++;for(e=0;e<l;e++)i[e]=i[o=h&o+n[e%r]+(t=i[e])],i[o]=t;(u.g=function(n){for(var t,r=0,e=u.i,o=u.j,i=u.S;n--;)t=i[e=h&e+1],r=r*l+i[h&(i[e]=i[o=h&o+t])+(i[o]=t)];return u.i=e,u.j=o,r})(l)}function v(n,t){return t.i=n.i,t.j=n.j,t.S=n.S.slice(),t}function j(n,t){for(var r,e=n+"",o=0;o<e.length;)t[h&o]=h&(r^=19*t[h&o])+e.charCodeAt(o++);return S(t)}function S(n){return String.fromCharCode.apply(0,n)}if(j(c.random(),a),"object"==typeof module&&module.exports){module.exports=n;try{s=require("crypto")}catch(n){}}else"function"==typeof define&&define.amd?define(function(){return n}):c["seed"+p]=n}("undefined"!=typeof self?self:this,[],Math);

/**
 * Initializes the map
 */
function mapGenInit() {
    //Create the seeded random function
    if (!seed) seed = Math.random();
    seededRandom = new Math.seedrandom(seed);

    fillMap();
}

/**
 * Fills the map with rooms
 */
function fillMap() {
    //Fills up the map with empty cells
    addCells();

    //Generate the middle room
    newRoom([Math.floor(mapWidth / 2), Math.floor(mapHeight / 2)]);

    let moreRooms = true;
    let roomNumber = 2;
    let abort = false;
    while (moreRooms) {
        roomNumber = rooms.length + 1;

        //Get the possible door locations
        checkForDoors();

        let roomAttempts = 0;
        while (true) {
            //Add a door somewhere
            let doorCoords = undefined;
            let noDoor = true;
            while (noDoor) {
                doorCoords = newDoor();
                if (doorCoords != -1) {
                    noDoor = false;
                }
            }

            //Make a room
            newRoom(getOutside(doorCoords), doorCoords);

            //If a room was made at that door position, exit, otherwise try again with a new door
            if (rooms.length == roomNumber) {
                break;
            } else {
                mapData[doorCoords[1]][doorCoords[0]].type = TILES.WALL_CORNER;

                //If we've tried 10 times already, abort and start over
                if (roomAttempts >= 10) {
                    abort = true;
                    break;
                } else {
                    roomAttempts++;
                }
            }
        }

        if (abort) {
            break;
        }

        if (rooms.length >= roomAmount) {
            moreRooms = false;
            alignWalls();
            //TODO Add decoration
        }
    }

    if (abort) {
        resetMap();
    }
}

function resetMap() {
    clearMap();
    mapData = [];
    rooms = [];
    openWalls = [];
    seed = Math.random();
    seededRandom = new Math.seedrandom(seed);
    fillMap();
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
    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

/**
 * Populates the map with empty squares
 */
function addCells() {
    for (let i = 0; i < mapHeight; i++) {
        mapData[i] = [];
        for (let o = 0; o < mapWidth; o++) {
            mapData[i][o] = {type: TILES.EMPTY, room: -1};
        }
    }
}

/**
 * Gets the room tile at any coordinate
 */
function getTile(x, y) {
    if (x >= 0 && y >= 0 && x <= mapWidth - 1 && y <= mapHeight - 1) {
        let tile = mapData[y][x];
        return tile;
    } else {
        return -1;
    }
}

/**
 * Selects a random tile out of a room
 */
function selectRandomTile(room) {
    return randomFromArray(room.tiles);
}

/**
 * Selects a random floor tile
 */
function selectRandomFloor(room) {
    let tile = null;
    while (true) {
        tile = selectRandomTile(room);
        if (FLOORS.indexOf(tile.type) != -1) {
            return tile;
        }
    }
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
 * Identifies which of the neighbouring cells are of a specific type.
 * Returns 1 for up-down, 2 for left-right, 0 for all or none
 * If restrict is not disabled, 0 will also be returned if any cells not in the main direction are the type
 */
function getConnecting(x, y, type, restrict = true) {
    let connections = 0;

    if (type.indexOf(getTile(x, y - 1).type) != -1 && type.indexOf(getTile(x, y + 1).type) != -1) {
        connections += 1;
    }

    if (type.indexOf(getTile(x - 1, y).type) != -1 && type.indexOf(getTile(x + 1, y).type) != -1) {
        connections += 2;
    }

    if (connections == 3 || connections == 0) {
        if (!compareArrays(type, WALLS)) {
            return 0;
        } else {
            let wallConnections = 0;

            if ((WALLS.indexOf(getTile(x, y - 1).type) != -1 || WALLS.indexOf(getTile(x, y - 1).type) != -1) && (WALLS.indexOf(getTile(x, y + 1).type) != -1 || WALLS.indexOf(getTile(x, y + 1).type) != -1)) {
                wallConnections += 1;
            }
        
            if ((WALLS.indexOf(getTile(x - 1, y).type) != -1 || WALLS.indexOf(getTile(x - 1, y).type) != -1) && (WALLS.indexOf(getTile(x + 1, y).type) != -1 || WALLS.indexOf(getTile(x + 1, y).type) != -1)) {
                wallConnections += 2;
            }

            if (wallConnections == 3 || wallConnections == 0) {
                return 0;
            } else {
                if (restrict) {
                    if (wallConnections == 1 && (type.indexOf(getTile(x - 1, y).type) != -1 || type.indexOf(getTile(x + 1, y).type) != -1)) {
                        return 0;
                    }
                    if (wallConnections == 2 && (type.indexOf(getTile(x, y - 1).type) != -1 || type.indexOf(getTile(x, y + 1).type) != -1)) {
                        return 0;
                    }
                    return wallConnections;
                } else {
                    return wallConnections;
                }
            }
        }
    } else {
        if (restrict) {
            if (!compareArrays(type, WALLS)) {
                if (connections == 1 && (type.indexOf(getTile(x - 1, y).type) != -1 || type.indexOf(getTile(x + 1, y).type) != -1)) {
                    return 0;
                }
                if (connections == 2 && (type.indexOf(getTile(x, y - 1).type) != -1 || type.indexOf(getTile(x, y + 1).type) != -1)) {
                    return 0;
                }
                return connections;
            } else {
                if (connections == 1 && (type.indexOf(getTile(x - 1, y).type) != -1 || type.indexOf(getTile(x + 1, y).type) != -1 || DOORS.indexOf(getTile(x - 1, y).type) != -1 || DOORS.indexOf(getTile(x + 1, y).type) != -1)) {
                    return 0;
                }
                if (connections == 2 && (type.indexOf(getTile(x, y - 1).type) != -1 || type.indexOf(getTile(x, y + 1).type) != -1 || DOORS.indexOf(getTile(x, y - 1).type) != -1 || DOORS.indexOf(getTile(x, y + 1).type) != -1)) {
                    return 0;
                }
                return connections;
            }
        } else {
            return connections;
        }
    }
}

/**
 * Sets a room's tile, checking for existing tiles
 */
function setRoomTile(room, x, y, type) {
    if (x >= 0 && y >= 0 && x <= mapWidth - 1 && y <= mapHeight - 1) {
        //Never override a door
        if (DOORS.indexOf(getTile(x, y).type) != -1) {
            return;
        }
        let oldTile = getRoomTile(room, x, y);
        let oldTileType;
        if (oldTile != -1) {
            oldTileType = oldTile.type;
        } else {
            oldTileType = -1;
        }
        if (oldTileType != -1) {
            //Never override anything with a wall
            if (WALLS.indexOf(type) != -1 && !WALLS.indexOf(oldTileType) != -1) {
                return;
            //Never override a door
            } else if (DOORS.indexOf(oldTileType) != -1) {
                return;
            //Never override a floor or water with anything besides water
            } else if ((oldTileType == TILES.FLOOR || oldTileType == TILES.WATER) && type != TILES.WATER) {
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
}

/**
 * Checks to see if any tiles are in the way of the planned expansion
 */
function canExtendRoom(startX, startY, expandX, expandY) {
    for (let x = startX; x < expandX + startX; x++) {
        for (let y = startY; y < expandY + startY; y++) {
            if (x <= 0 || y <= 0 || x >= mapWidth - 1 || y >= mapHeight - 1 || getTile(x, y).type != TILES.EMPTY) {
                return false;
            }
        }
    }
    return true;
}

/**
 * Finds all tiles that would be a good door
 */
function checkForDoors() {
    for (let i = 0; i < rooms.length; i++) {
        let room = rooms[i];
        let goodTiles = [];
        for (const tile of room.tiles) {
            if (WALLS.indexOf(tile.type) != -1) {
                let adjacentWalls = [];
                if (WALLS.indexOf(getRoomTile(room, tile.x, tile.y - 1).type) != -1) {
                    adjacentWalls.push(1);
                }
                if (WALLS.indexOf(getRoomTile(room, tile.x + 1, tile.y).type) != -1) {
                    adjacentWalls.push(2);
                }
                if (WALLS.indexOf(getRoomTile(room, tile.x, tile.y + 1).type) != -1) {
                    adjacentWalls.push(3);
                }
                if (WALLS.indexOf(getRoomTile(room, tile.x - 1, tile.y).type) != -1) {
                    adjacentWalls.push(4);
                }
                if (compareArrays(adjacentWalls, [1, 3]) || compareArrays(adjacentWalls, [2, 4])) {
                    if (getOutside([tile.x, tile.y]) != -1) {
                        goodTiles.push(tile);
                    }
                }
            }
        }
        for (let i = 0; i < goodTiles.length; i++) {
            openWalls.push(goodTiles[i]); 
        }
    }
}

/**
 * Adds a door to the map
 */
function newDoor() {
    let tile = randomFromArray(openWalls);
    //Check to see if that door is valid
    if (getOutside([tile.x, tile.y]) != -1) {
        //Add the door
        let room = getTile(tile.x, tile.y).room;
        setRoomTile(rooms[room], tile.x, tile.y, TILES.DOOR_HORIZONTAL);

        //Select the door and render it
        if (getConnecting(tile.x, tile.y, WALLS) == 1) {
            mapData[tile.y][tile.x].type = TILES.DOOR_VERTICAL;
        } else {
            mapData[tile.y][tile.x].type = TILES.DOOR_HORIZONTAL;
        }
        //The door was successfully placed
        return [tile.x, tile.y];
    } else {
        //This wall isn't open
        openWalls.splice(openWalls.indexOf(tile), 1);
        return -1;
    }
}

/**
 * Aligns all walls to the correct orientation
 */
function alignWalls() {
    for (let i = 0; i < mapData.length; i++) {
        for (let o = 0; o < mapData[i].length; o++) {
            let tile = mapData[i][o];
            if (WALLS.indexOf(tile.type) != -1) {
                switch (getConnecting(o, i, WALLS)) {
                    case 1:
                        mapData[i][o].type = TILES.WALL_VERTICAL;
                        break;

                    case 2:
                        mapData[i][o].type = TILES.WALL_HORIZONTAL;
                        break;

                    default:
                        mapData[i][o].type = TILES.WALL_CORNER;
                        break;
                }
            }
        }
    }
}

/**
 * Returns the location of an empty tile next to a location, if there are none, returns -1
 */
function getOutside(location) {
    if (getTile(location[0], location[1] - 1).type == TILES.EMPTY) {
        return [location[0], location[1] - 1];
    }
    if (getTile(location[0] + 1, location[1]).type == TILES.EMPTY) {
        return [location[0] + 1, location[1]];
    }
    if (getTile(location[0], location[1] + 1).type == TILES.EMPTY) {
        return [location[0], location[1] + 1];
    }
    if (getTile(location[0] - 1, location[1]).type == TILES.EMPTY) {
        return [location[0] - 1, location[1]];
    }
    return -1;
}

/**
 * Creates a new room object
 * 
 * @param coords the x and y coordinates to start generating the room at
 */
function newRoom(coords, parentDoor = -1) {
    let room = {
        x: coords[0],
        y: coords[1],
        baseWidth: randomBetween(3, roomSize),
        baseHeight: randomBetween(3, roomSize),
        tiles: [],
        parentDoor: parentDoor,
        id: rooms.length
    }
    room.steps = Math.max(room.baseWidth + room.baseHeight, roomSize * (1 - seededRandom() * variance));
    planRoom(room);
}

/**
 * Plans a room in terms of shape
 */
function planRoom(room) {
    let width = room.baseWidth,
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

    //Plan where decorations should be
    //Water
    let randomWaterBranch = -1;
    if (seededRandom() < decorationRatios.water || rooms.length == 0) {
        randomWaterBranch = randomBetween(0, branches - 1);
    }

    for (let i = 0; i < branches; i++) {
        let startX = room.x, startY = room.y, expandX = 1, expandY = 1;
        if (room.tiles.length != 0) {
            let randomTile = selectRandomFloor(room);
            startX = randomTile.x;
            startY = randomTile.y;
        }
        for (let o = 0; o < room.steps; o++) {
            //Select a side to expand, priority is on sides that need to be expanded
            let sideToExpand = randomBetween(1, 4);
            if (mustExpand.length != 0) {
                sideToExpand = randomFromArray(mustExpand);
                mustExpand.splice(mustExpand.indexOf(sideToExpand), 1);
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
            if (canExtendRoom(startX, startY, expandX, expandY)) {
                selectRoomTiles(room, startX, startY, expandX, expandY, [i == randomWaterBranch]);
            }
        }  
    }
    buildRoom(room);
}

/**
 * Constructs the room in tiles
 */
function selectRoomTiles(room, startX, startY, expandX, expandY, decoration) {
    let x = 0, y = 0, tilePlacing = TILES.WALL_CORNER;
    for (x = startX - 1; x < expandX + startX + 1; x++) {
        for (y = startY - 1; y < expandY + startY + 1; y++) {
            setRoomTile(room, x, y, tilePlacing);
        }
    }
    tilePlacing = TILES.FLOOR_EDGE;
    for (x = startX; x < expandX + startX; x++) {
        for (y = startY; y < expandY + startY; y++) {
            setRoomTile(room, x, y, tilePlacing);
        }
    }
    tilePlacing = TILES.FLOOR;
    if (decoration[0]) {
        tilePlacing = TILES.WATER;
    }
    for (x = startX + 1; x < expandX + startX - 1; x++) {
        for (y = startY + 1; y < expandY + startY - 1; y++) {
            setRoomTile(room, x, y, tilePlacing);
        }
    }
}

/**
 * Places a room on the map
 */
function buildRoom(room) {
    if (room.tiles.length > 30) {
        for (const tile of room.tiles) {
            mapData[tile.y][tile.x].type = tile.type;
            mapData[tile.y][tile.x].room = room.id;
        }
        rooms[room.id] = room;
        buildAttempts = 0;
    } else {
        if (buildAttempts <= 10) {
            buildAttempts++;
            newRoom([room.x, room.y], room.parentDoor);
        } else {
            console.warn("Took more than 10 attempts to make room " + room.id);
        }
    }
}
