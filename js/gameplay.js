"use strict";
var coords = [0, 0];

/**
 * Create a map and add key events to the canvas
 */
function init() {
    //Resizes the canvas to fit the map
    renderer.canvas.width = mapWidth * 20;
    renderer.canvas.height = mapHeight * 20;

    document.addEventListener("keydown", keyHandler)

    mapGenInit();
}

/**
 * Deals with key presses
 */
function keyHandler(e) {
    var key = e.keyCode
    switch (true) {
        //Up arrow or W
        case key == 38 || key == 87:
            console.log("up");
            break;
    
        //Right arrow or D
        case key == 39 || key == 68:
            console.log("right");
            break;

        //Down arrow or S
        case key == 40 || key == 83:
            console.log("down");
            break;

        //Left arrow or A
        case key == 37 || key == 65:
            console.log("left");
            break;

        default:
            console.log("key not recognized");
            break;
    }
}

init();