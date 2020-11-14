"use strict";
var playerCanvas = document.getElementById("playerCanvas"),
playerRenderer = playerCanvas.getContext("2d"),

coords = [0, 0],

animationStart = undefined,
canMove = true,

keysPressed = [];

/**
 * Create a map, add the player, and add key events to the canvas
 */
function init() {
    //Resizes the canvases to fit the map
    mapRenderer.canvas.width = mapWidth * 20;
    mapRenderer.canvas.height = mapHeight * 20;
    overlayRenderer.canvas.width = mapWidth * 20;
    overlayRenderer.canvas.height = mapHeight * 20;
    playerRenderer.canvas.width = mapWidth * 20;
    playerRenderer.canvas.height = mapHeight * 20;

    mapGenInit();

    placePlayer();
    drawPlayer(coords[0], coords[1]);

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
    drawPlayer(coords[0], coords[1]);
}

/**
 * Deals with key presses
 */
function keyHandler(e) {
    var key = e.keyCode

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
function movePlayer(direction, oldCoords) {
    //Duplicate the coords array
    var oldCoords = coords.slice();

    switch (direction) {
        case 0:
            coords[1]--;
            break;

        case 1:
            coords[0]++;
            break;

        case 2:
            coords[1]++;
            break;

        case 3:
            coords[0]--;
            break;
    
        default:
            console.error("Bad direction value of " + direction);
            break;
    }

    var newTile = getTile(coords[0], coords[1])

    if (canMove) {
        switch (true) {
            case newTile.type == TILES.FLOOR || newTile.type == TILES.FLOOR_EDGE || newTile.type == TILES.DOOR_HORIZONTAL:
                requestAnimationFrame(function(timestamp) {
                    animatePlayer(timestamp, oldCoords, 0);
                });
                break;
        
            default:
                //Undo the coords change
                coords = oldCoords.slice();
                break;
        }
    } else {
        //Undo the coords change
        coords = oldCoords.slice();
    }
}

/**
 * Animates moving of the player
 */
function animatePlayer(timeStamp, oldCoords, moveType) {
    canMove = false;
    if (animationStart == undefined) {
        animationStart = timeStamp;
    }
    var elapsed = timeStamp - animationStart;

    switch (moveType) {
        case 0:
            //Move to a different space

            //Render the current frame
            //Remove the old player
            clearPlayer();
            //Draw the new position of the player
            drawPlayer(Math.min(Math.max(((coords[0] - oldCoords[0]) / 75 * elapsed), -1), 1) + oldCoords[0], Math.min(Math.max(((coords[1] - oldCoords[1]) / 75 * elapsed), -1), 1) + oldCoords[1]);

            //Move to the next frame if we aren't done
            if (elapsed <= 75) {
                requestAnimationFrame(function(timestamp) {
                    animatePlayer(timestamp, oldCoords, moveType);
                });
            } else {
                animationStart = undefined;
                canMove = true;
            }
            break;
    
        default:
            break;
    }
}

/**
 * Draws the player onto the canvas
 */
function drawPlayer(x, y) {
    playerRenderer.drawImage(document.getElementById("tiles"), 0, TILES.PLAYER, 20, 20, Math.floor(x * 20), Math.floor(y * 20), 20, 20);
}

/**
 * Deletes everything on the player canvas
 */
function clearPlayer() {
    playerRenderer.clearRect(0, 0, playerCanvas.width, playerCanvas.height);
}

/**
 * Sets the player coordinates to a tile where the player can be in the first room
 */
function placePlayer() {
    while (true) {
        var tile = randomFromArray(rooms[0].tiles);

        if (tile.type == TILES.FLOOR || tile.type == TILES.FLOOR_EDGE) {
            coords[0] = tile.x;
            coords[1] = tile.y;
            break;
        }
    }
}

var loadInterval = setInterval(() => {
    if (imageLoaded) {
        clearInterval(loadInterval);
        init();
    }
}, 10);
