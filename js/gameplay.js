"use strict";
let mapCanvas = document.getElementById("mapCanvas"),
    mapRenderer = mapCanvas.getContext("2d"),
    overlayCanvas = document.getElementById("overlayCanvas"),
    overlayRenderer = overlayCanvas.getContext("2d"),
    playerCanvas = document.getElementById("playerCanvas"),
    playerRenderer = playerCanvas.getContext("2d"),

    /*
        ***ALL COORDINATE SYSTEMS ARE Y,X***
    */
    coords = [0, 0],
    viewCoords = [0, 0],

    viewArea = [9, 16],
    view = [0, 0],


    animationStart = undefined,
    animationTime = 75,
    canMove = true,

    keysPressed = [];

/**
 * Create a map, add the player, and add key events to the canvas
 */
function init() {
    mapGenInit();

    resizeCanvas();

    placePlayer();

    getView();
    drawView();

    drawPlayer(coords[1] - view[1], coords[0] - view[0]);

    document.addEventListener("keydown", keyHandler);
    document.addEventListener("keyup", keyUpHandler);
}

/**
 * Resets everything
 */
function reset() {
    resetMap();

    clearPlayer();
    placePlayer();
    getView();
    drawView();
    drawPlayer(coords[1] - view[1], coords[0] - view[0]);
}

/**
 * Deals with key presses
 */
function keyHandler(e) {
    let key = e.keyCode

    if (keysPressed.indexOf(key) == -1) {
        keysPressed.push(key);
        switch (true) {
            //Up arrow or W
            case key == 38 || key == 87:
                movePlayer(0);
                break;

            //Right arrow or D
            case key == 39 || key == 68:
                movePlayer(1);
                break;

            //Down arrow or S
            case key == 40 || key == 83:
                movePlayer(2);
                break;

            //Left arrow or A
            case key == 37 || key == 65:
                movePlayer(3);
                break;

            default:
                break;
        }
    }
}

/**
 * Allows keys to work again after they are pressed down
 */
function keyUpHandler(e) {
    if (keysPressed.indexOf(e.keyCode) != -1) {
        keysPressed.splice(keysPressed.indexOf(e.keyCode), 1);
    }
}

/**
 * Moves the player
 */
function movePlayer(direction) {
    if (canMove) {
        //Duplicate the coords and view arrays
        let oldCoords = coords.slice();
        let oldView = view.slice();

        switch (direction) {
            case 0:
                coords[0]--;
                break;

            case 1:
                coords[1]++;
                break;

            case 2:
                coords[0]++;
                break;

            case 3:
                coords[1]--;
                break;

            default:
                console.error("Bad direction value of " + direction);
                break;
        }

        let newTile = getTile(coords[1], coords[0]);

        if (FLOORS.indexOf(newTile.type) != -1 || DOORS.indexOf(newTile.type) != -1) {
            //Check if we need to move the whole view due to the move
            let moveView = false;
            if (coords[0] - view[0] < 2 && view[0] > 0) { view[0]--; moveView = true; }
            if (coords[0] - view[0] > viewArea[0] - 3 && view[0] < mapHeight - viewArea[0]) { view[0]++; moveView = true; }
            if (coords[1] - view[1] < 2 && view[1] > 0) { view[1]--; moveView = true; }
            if (coords[1] - view[1] > viewArea[1] - 3 && view[1] < mapWidth - viewArea[0]) { view[1]++; moveView = true; }

            //Animate the move
            requestAnimationFrame(function (timestamp) {
                animatePlayer(timestamp, moveView, oldCoords, oldView);
            });
        } else {
            //Undo the move
            coords = oldCoords.slice();
            view = oldView.slice();
        }
    }
}

/**
 * Animates moving of the player
 */
function animatePlayer(timeStamp, moveView, oldCoords, oldView) {
    canMove = false;
    if (animationStart == undefined) {
        animationStart = timeStamp;
    }
    let elapsed = timeStamp - animationStart;

    //Check whether to move the view or the player
    if (moveView) {
        //Remove the old view
        clearMap();
        //Draw the new position of the view
        drawView(Math.min(Math.max(((view[1] - oldView[1]) * -1 / animationTime * elapsed), -1), 1) + (view[1] - oldView[1]), Math.min(Math.max(((view[0] - oldView[0]) * -1 / animationTime * elapsed), -1), 1) + (view[0] - oldView[0]));
    } else {
        //Remove the old player
        clearPlayer();
        //Draw the new position of the player
        drawPlayer(Math.min(Math.max(((coords[1] - oldCoords[1]) / animationTime * elapsed), -1), 1) + oldCoords[1] - view[1], Math.min(Math.max(((coords[0] - oldCoords[0]) / animationTime * elapsed), -1), 1) + oldCoords[0] - view[0]);
    }

    //Move to the next frame if we aren't done
    if (elapsed <= animationTime) {
        requestAnimationFrame(function (timestamp) {
            animatePlayer(timestamp, moveView, oldCoords, oldView);
        });
    } else {
        //Make sure no funny business is going on
        drawPlayer(coords[1] - view[1], coords[0] - view[0]);
        drawView();

        animationStart = undefined;
        canMove = true;
    }
}

/**
 * Draws the player onto the canvas
 */
function drawPlayer(x, y) {
    playerRenderer.drawImage(document.getElementById("tiles"), 0, TILES.PLAYER, 20, 20, Math.floor(x * 20), Math.floor(y * 20), 20, 20);
}

/**
 * Sets the player coordinates to a tile where the player can be in the first room
 */
function placePlayer() {
    while (true) {
        let tile = randomFromArray(rooms[0].tiles);

        if (tile.type == TILES.FLOOR || tile.type == TILES.FLOOR_EDGE) {
            coords[0] = tile.y;
            coords[1] = tile.x;
            break;
        }
    }
}

function getView() {
    //Get top left coordinates of view area
    view = [coords[0] - Math.floor(viewArea[0] / 2), coords[1] - Math.floor(viewArea[1] / 3)];
    if (view[1] < 0) { view[1] = 0 }
    if (view[1] > mapWidth - viewArea[1]) { view[1] = mapWidth - viewArea[1] }
    if (view[0] < 0) { view[0] = 0 }
    if (view[0] > mapHeight - viewArea[0]) { view[0] = mapHeight - viewArea[0] }
}

function drawView(offsetX = 0, offsetY = 0) {
    for (let i = -1; i < viewArea[0] + 1; i++) {
        for (let o = -1; o < viewArea[1] + 1; o++) {
            if (mapData[i + view[0]] && mapData[0][o + view[1]]) {
                drawMapCell(o + offsetX, i + offsetY, mapData[i + view[0]][o + view[1]].type);
            }
        }
    }
}

/**
 * Deletes everything on the player canvas
 */
 function clearPlayer() {
    playerRenderer.clearRect(0, 0, playerCanvas.width, playerCanvas.height);
}

/**
 * Deletes the map
 */
function clearMap() {
    mapRenderer.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    overlayRenderer.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
}

/**
 * Opens in fullscreen
 */
function openFullscreen() {
    let elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
    resizeCanvas();
    drawPlayer(coords[1] - view[1], coords[0] - view[0]);
}

function resizeCanvas() {
    mapCanvas.style.width = window.innerWidth + "px";
    mapCanvas.style.height = window.innerWidth / 16 * 9 + "px";
    overlayCanvas.style.width = window.innerWidth + "px";
    overlayCanvas.style.height = window.innerWidth / 16 * 9 + "px";
    playerCanvas.style.width = window.innerWidth + "px";
    playerCanvas.style.height = window.innerWidth / 16 * 9 + "px";

    mapRenderer.canvas.width = viewArea[1] * 20;
    mapRenderer.canvas.height = viewArea[0] * 20;
    overlayRenderer.canvas.width = viewArea[1] * 20;
    overlayRenderer.canvas.height = viewArea[0] * 20;
    playerRenderer.canvas.width = viewArea[1] * 20;
    playerRenderer.canvas.height = viewArea[0] * 20;

    drawView();
}

/**
 * Draws a cell on the map
 */
function drawMapCell(x, y, spritePosition) {
    mapRenderer.drawImage(document.getElementById("tiles"), 0, spritePosition, 20, 20, Math.floor(x * 20), Math.floor(y * 20), 20, 20);
}

/**
 * Draws a cell on the map overlay
 */
function drawOverlayCell(x, y, spritePosition) {
    overlayRenderer.drawImage(document.getElementById("tiles"), 0, spritePosition, 20, 20, Math.floor(x * 20), Math.floor(y * 20), 20, 20);
}

let loadInterval = setInterval(() => {
    if (imageLoaded) {
        clearInterval(loadInterval);
        init();
    }
}, 10);
