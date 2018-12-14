/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog4/triangles.json"; // triangles file loc
var defaultEye = vec3.fromValues(0.5,0.5,0.3); // default eye position in world space
var defaultCenter = vec3.fromValues(0.5,0.5,0.5); // default view direction in world space
var defaultUp = vec3.fromValues(0,1,0); // default view up vector
var lightAmbient = vec3.fromValues(1,1,1); // default light ambient emission
var lightDiffuse = vec3.fromValues(1,1,1); // default light diffuse emission
var lightSpecular = vec3.fromValues(1,1,1); // default light specular emission
var lightPosition = vec3.fromValues(-1,3,-0.5); // default light position
var rotateTheta = Math.PI/50; // how much to rotate models by with each key press
var Blinn_Phong = true;
/* webgl and geometry data */
var gl = null; // the all powerful gl object. It's all here folks!
var inputTriangles = []; // the triangle data as loaded from input files
var numTriangleSets = 0; // how many triangle sets in input scene
var inputEllipsoids = []; // the ellipsoid data as loaded from input files
var numEllipsoids = 0; // how many ellipsoids in the input scene
var vertexBuffers = []; // this contains vertex coordinate lists by set, in triples
var normalBuffers = []; // this contains normal component lists by set, in triples
var triSetSizes = []; // this contains the size of each triangle set
var triangleBuffers = []; // lists of indices into vertexBuffers by set, in triples
var viewDelta = 0; // how much to displace view with each key press

/* shader parameter locations */
var vPosAttribLoc; // where to put position for vertex shader
var mMatrixULoc; // where to put model matrix for vertex shader
var pvmMatrixULoc; // where to put project model view matrix for vertex shader
var ambientULoc; // where to put ambient reflecivity for fragment shader
var diffuseULoc; // where to put diffuse reflecivity for fragment shader
var specularULoc; // where to put specular reflecivity for fragment shader
var shininessULoc; // where to put specular exponent for fragment shader
var Blinn_PhongULoc;
/* interaction variables */
var Eye = vec3.clone(defaultEye); // eye position in world space
var Center = vec3.clone(defaultCenter); // view direction in world space
var Up = vec3.clone(defaultUp); // view up vector in world space

/* texture variables */
var texture = null;
var textures = [];
var textureCoordBuffers = [];
var textureULoc;
var textureCoordALoc;

var Modulate = true;
var ModulateULoc;

var opaqueTriangles = [];
var transparentTriangles = [];

/* Snake 3D */
const INPUT_GAMEBOARD_URL = "https://jtgill92.github.io/Snake3D/gameboard.json"; // gameboard file loc
const boardSize = 20;
var gameboard = [];
var snake1 = [];
var snake2 = [];
var food = [];
var initialTime;
var elapsedTime;
var animationRate = 90;
var AICount = 0;

function initGame() {
    initialTime = (new Date).getTime();
    for(var j = 0; j < boardSize; j++) {
        gameboard[j] = [];
        for(var i = 0; i < boardSize; i++) {
            gameboard[j][i] = [0,0];
        }
    }
    gameboard.model = inputTriangles[0];

    snake1 = [[4,1],[3,1],[2,1]];
    snake1.model = inputTriangles[1];
    snake1.alive = true;

    for(var i = 0; i < snake1.length; i++) {
        gameboard[snake1[i][1]][snake1[i][0]] = [1,0];
    }

    snake2 = [[7,9],[8,9],[9,9]];
    snake2.model = inputTriangles[2];
    snake2.alive = true;

    for(var i = 0; i < snake2.length; i++) {
        gameboard[snake2[i][1]][snake2[i][0]] = [-1,0];
    }

    food[0] = [Math.floor(boardSize/2), Math.floor(boardSize/2)];
    //food[0] = [0,0]
    food.model = inputTriangles[3];
    food.alive = true;
}

function update() {
    if(!food.alive) {respawnFood();}
    if(!snake1.alive) {respawnSnake1();}
    if(!snake2.alive) {respawnSnake2();}
    var snakes = [snake1, snake2];
    for(var i = 0; i < 2; i++) {
        var snake = snakes[i];
        var other = snakes[1-i];
        if(snake.alive) {
            var tail = [snake[snake.length - 1][0],snake[snake.length - 1][1]];
            for(var j = 0; j < snake.length; j++) {
                var x = snake[j][0];
                var y = snake[j][1];
                
                var dir = getDir(x,y);
                snake[j] = [x + dir[0],y + dir[1]];
            }
            if(outOfBounds(snake) || collision(snake,other) || selfCollision(snake)) {
                snake.alive = false;
                gameboard[tail[1]][tail[0]] = [0,0];
                continue;
            }
            gameboard[snake[0][1]][snake[0][0]][0] = gameboard[snake[1][1]][snake[1][0]][0];
            gameboard[snake[0][1]][snake[0][0]][1] = gameboard[snake[1][1]][snake[1][0]][1];

            if(snake[0][0] == food[0][0] && snake[0][1] == food[0][1]) {
                food.alive = false;
                snake[snake.length] = tail;
            } else {
                gameboard[tail[1]][tail[0]] = [0,0];
            }
        }
    }
    if(outOfBounds(snake1)) {
        snake1.alive = false;
    }
    if(collision(snake1,snake2)) {
        snake1.alive = false;
    }
    if(selfCollision(snake1)) {
        snake1.alive = false;
    }
    if(outOfBounds(snake2)) {
        snake2.alive = false;
    }
    if(collision(snake2,snake1)) {
        snake2.alive = false;
    }
    if(selfCollision(snake2)) {
        snake2.alive = false;
    }

    if(!snake1.alive) {
        for(var j = 1; j < snake1.length; j++) {
            var x = snake1[j][0];
            var y = snake1[j][1];
            if(!(x < 0 || x > boardSize - 1 ||
                y < 0 || y > boardSize - 1)) {
                gameboard[y][x] = [0,0]
            }
        }
    }

    if(!snake2.alive) {
        for(var j = 1; j < snake2.length; j++) {
            var x = snake2[j][0];
            var y = snake2[j][1];
            if(!(x < 0 || x > boardSize - 1 ||
                y < 0 || y > boardSize - 1)) {
                gameboard[y][x] = [0,0]
            }
        }
    }

    AICount++;

    if(snake2.alive && AICount > 3) {
        var x = snake2[0][0];
        var y = snake2[0][1];
        var dir = randomDir(x,y);
        gameboard[y][x] = dir;
        AICount = 0;
    }
}

function respawnSnake1() {
    snake1 = [[4,1],[3,1],[2,1]];
    snake1.model = inputTriangles[1];
    snake1.alive = true;

    for(var i = 0; i < snake1.length; i++) {
        for(var j = 0; j < snake2.length; j++) {
        if(snake1[i][0] == snake2[j][0]
            && snake1[i][1] == snake2[j][1]) {
                snake1.alive = false;
            }
        }
    }
    if(snake1.alive){
    for(var i = 0; i < snake1.length; i++) {
        gameboard[snake1[i][1]][snake1[i][0]] = [1,0];
    }}
}

function respawnSnake2() {
    snake2 = [[7,9],[8,9],[9,9]];
    snake2.model = inputTriangles[2];
    snake2.alive = true;

    for(var i = 0; i < snake2.length; i++) {
        for(var j = 0; j < snake1.length; j++) {
        if(snake2[i][0] == snake1[j][0]
            && snake2[i][1] == snake1[j][1]) {
                snake2.alive = false;
            }
        }
    }
    

    if(snake2.alive){
    for(var i = 0; i < snake2.length; i++) {
        gameboard[snake2[i][1]][snake2[i][0]] = [-1,0];
    }}
}

// fix later for version 2.0!
function respawnSnake(s1, s2) {
    var loc = randomLoc;
    var dir;

    var i = Math.floor(Math.random() * 4) + 1;

    if(i == 1 ){//&& loc[0] < 16) {
        dir = [1,0];
    } else if (i == 2){// && loc[1] < 16) {
        dir = [0,1];
    } else if (i == 3){ //&& loc[0] > 3) {
        dir = [-1,0];
    } else if (i == 4){ //&& loc[1] > 3) {
        dir = [0,-1];
    } else {
        respawnSnake(s1,s2);
    }

    s1 = [];    
    s1[0] = [loc[0], loc[1]]
    s1[1] = [loc[0] - dir[0], loc[1] - dir[1]]
    s1[2] = [loc[0] - 2*dir[0], loc[1] - 2*dir[1]]

    for(var i = 0; i < 3; i++) {
        x = s1[i][0];
        y = s1[i][1];
        if(x < 0 || x > boardSize - 1 ||
            y < 0 || y > boardSize - 1) {
            respawnSnake(s1,s2)
        }
        for(var k = 0; k < s2.length; k++) {
        if(s1[i][0] == s2[k][0]
            && s1[j][1] == s2[k][1]) {
                respawnSnake(s1,s2);
            }
        }
    }

    for(var i = 0; i < s1.length; i++) {
        gameboard[s1[i][1]][s1[i][0]] = dir;
    }
    s1.alive = true;
}

function respawnFood() {
    var loc = randomLoc();

    food.alive = true;
    food[0] = loc;

    if(collision(food, snake1) || collision(food, snake2))
        respawnFood();
}

function getDir(i,j) {
    return [gameboard[j][i][0],gameboard[j][i][1]];
}

function outOfBounds(s) {
    if(s[0][0] < 0 ||
        s[0][0] > boardSize - 1  ||
        s[0][1] < 0 ||
        s[0][1] > boardSize - 1) {
        return true;
    }
}

function selfCollision(s) {
    for(var k = 1; k < s.length; k++) {
        if(s[0][0] == s[k][0]
            && s[0][1] == s[k][1]) {
            return true;
        }
    }
}

function collision(s1, s2) {
    for(var k = 0; k < s2.length; k++) {
        if(s1[0][0] == s2[k][0]
            && s1[0][1] == s2[k][1]) {
            return true;
        }
    }
}

function randomDir() {
    var x = snake2[0][0];
    var y = snake2[0][1];
    var dir = getDir(x,y);

    var i = Math.floor(Math.random() * 4) + 1;

    if(i == 1 && x < 16 && dir[0] == 0) {
        return [1,0];
    } else if (i == 2 && y < 16 && dir[1] == 0) {
        return [0,1];
    } else if (i == 3 && x > 3 && dir[0] == 0) {
        return [-1,0];
    } else if (i == 4 && y > 3 && dir[1] == 0) {
        return [0,-1];
    }

    return dir;
}

function randomLoc() {
    var x = Math.floor((Math.random() * boardSize));
    var y = Math.floor((Math.random() * boardSize));

    return [x,y];
}

// ASSIGNMENT HELPER FUNCTIONS

// get the JSON file from the passed URL
function getJSONFile(url,descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET",url,false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now()-startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open "+descr+" file!";
            else
                return JSON.parse(httpReq.response); 
        } // end if good params
    } // end try    
    
    catch(e) {
        console.log(e);
        return(String.null);
    }
} // end get input json file

// does stuff when keys are pressed
function handleKeyDown(event) {
    
    const modelEnum = {TRIANGLES: "triangles", ELLIPSOID: "ellipsoid"}; // enumerated model type
    const dirEnum = {NEGATIVE: -1, POSITIVE: 1}; // enumerated rotation direction
    
    function highlightModel(modelType,whichModel) {
        if (handleKeyDown.modelOn != null)
            handleKeyDown.modelOn.on = false;
        handleKeyDown.whichOn = whichModel;
        if (modelType == modelEnum.TRIANGLES)
            handleKeyDown.modelOn = inputTriangles[whichModel]; 
        else
            handleKeyDown.modelOn = inputEllipsoids[whichModel]; 
        handleKeyDown.modelOn.on = true; 
    } // end highlight model
    
    function translateModel(offset) {
        if (handleKeyDown.modelOn != null)
            vec3.add(handleKeyDown.modelOn.translation,handleKeyDown.modelOn.translation,offset);
    } // end translate model

    function rotateModel(axis,direction) {
        if (handleKeyDown.modelOn != null) {
            var newRotation = mat4.create();

            mat4.fromRotation(newRotation,direction*rotateTheta,axis); // get a rotation matrix around passed axis
            vec3.transformMat4(handleKeyDown.modelOn.xAxis,handleKeyDown.modelOn.xAxis,newRotation); // rotate model x axis tip
            vec3.transformMat4(handleKeyDown.modelOn.yAxis,handleKeyDown.modelOn.yAxis,newRotation); // rotate model y axis tip
        } // end if there is a highlighted model
    } // end rotate model
    
    // set up needed view params
    var lookAt = vec3.create(), viewRight = vec3.create(), temp = vec3.create(); // lookat, right & temp vectors
    lookAt = vec3.normalize(lookAt,vec3.subtract(temp,Center,Eye)); // get lookat vector
    viewRight = vec3.normalize(viewRight,vec3.cross(temp,lookAt,Up)); // get view right vector
    
    // highlight static variables
    handleKeyDown.whichOn = handleKeyDown.whichOn == undefined ? -1 : handleKeyDown.whichOn; // nothing selected initially
    handleKeyDown.modelOn = handleKeyDown.modelOn == undefined ? null : handleKeyDown.modelOn; // nothing selected initially

    switch (event.code) {
        
        // move snake
        case "Space": 
            /*if (handleKeyDown.modelOn != null)
                handleKeyDown.modelOn.on = false; // turn off highlighted model
            handleKeyDown.modelOn = null; // no highlighted model
            handleKeyDown.whichOn = -1; // nothing highlighted*/
            break;
        case "ArrowLeft": // left
            if (snake1.alive){
                var x = snake1[0][0];
                var y = snake1[0][1];
                var dir = getDir(x,y);
                if(dir[0] != 1) {
                    gameboard[y][x] = [-1,0];
                }
            }
            break;
        case "ArrowRight": // right
            if (snake1.alive){
                var x = snake1[0][0];
                var y = snake1[0][1];
                var dir = getDir(x,y);
                if(dir[0] != -1) {
                    gameboard[y][x] = [1,0];
                }
            }
            break;
        case "ArrowDown": // down
            if (snake1.alive){
                var x = snake1[0][0];
                var y = snake1[0][1];
                var dir = getDir(x,y);
                if(dir[1] != 1) {
                    gameboard[y][x] = [0,-1];
                }
            }
            break;
        case "ArrowUp": // up
            if (snake1.alive) {
                var x = snake1[0][0];
                var y = snake1[0][1];
                var dir = getDir(x,y);
                if(dir[1] != -1) {
                    gameboard[y][x] = [0,1];
                }
            }
            break;
            
        // move snake
        case "KeyA": // left
            if (snake1.alive){
                var x = snake1[0][0];
                var y = snake1[0][1];
                var dir = getDir(x,y);
                if(dir[0] != 1) {
                    gameboard[y][x] = [-1,0];
                }
            }
            break;
        case "KeyD": // right
            if (snake1.alive) {
                var x = snake1[0][0];
                var y = snake1[0][1];
                var dir = getDir(x,y);
                if(dir[0] != -1) {
                    gameboard[y][x] = [1,0];
                }
            }

            break;
        case "KeyS": // down
            if (snake1.alive) {
                var x = snake1[0][0];
                var y = snake1[0][1];
                var dir = getDir(x,y);
                if(dir[1] != 1) {
                    gameboard[y][x] = [0,-1];
                }
            } 
            break;
        case "KeyW": // up
            if (snake1.alive) {
                var x = snake1[0][0];
                var y = snake1[0][1];
                var dir = getDir(x,y);
                if(dir[1] != -1) {
                    gameboard[y][x] = [0,1];
                }
            }
            break;
        case "KeyQ": // translate view up, rotate counterclockwise with shift
            if (event.getModifierState("Shift"))
                Up = vec3.normalize(Up,vec3.add(Up,Up,vec3.scale(temp,viewRight,-viewDelta)));
            else {
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,Up,viewDelta));
                Center = vec3.add(Center,Center,vec3.scale(temp,Up,viewDelta));
            } // end if shift not pressed
            break;
        case "KeyE": // translate view down, rotate clockwise with shift
            if (event.getModifierState("Shift"))
                Up = vec3.normalize(Up,vec3.add(Up,Up,vec3.scale(temp,viewRight,viewDelta)));
            else {
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,Up,-viewDelta));
                Center = vec3.add(Center,Center,vec3.scale(temp,Up,-viewDelta));
            } // end if shift not pressed
            break;
        case "Escape": // reset view to default
            Eye = vec3.copy(Eye,defaultEye);
            Center = vec3.copy(Center,defaultCenter);
            Up = vec3.copy(Up,defaultUp);
            break;
            
        // model transformation
        case "KeyK": // translate left, rotate left with shift
            if (event.getModifierState("Shift"))
                rotateModel(Up,dirEnum.NEGATIVE);
            else
                translateModel(vec3.scale(temp,viewRight,viewDelta));
            break;
        case "Semicolon": // translate right, rotate right with shift
            if (event.getModifierState("Shift"))
                rotateModel(Up,dirEnum.POSITIVE);
            else
                translateModel(vec3.scale(temp,viewRight,-viewDelta));
            break;
        case "KeyL": // translate backward, rotate up with shift
            if (event.getModifierState("Shift"))
                rotateModel(viewRight,dirEnum.POSITIVE);
            else
                translateModel(vec3.scale(temp,lookAt,-viewDelta));
            break;
        case "KeyO": // translate forward, rotate down with shift
            if (event.getModifierState("Shift"))
                rotateModel(viewRight,dirEnum.NEGATIVE);
            else
                translateModel(vec3.scale(temp,lookAt,viewDelta));
            break;
        case "KeyI": // translate up, rotate counterclockwise with shift 
            if (event.getModifierState("Shift"))
                rotateModel(lookAt,dirEnum.POSITIVE);
            else
                translateModel(vec3.scale(temp,Up,viewDelta));
            break;
        case "KeyP": // translate down, rotate clockwise with shift
            if (event.getModifierState("Shift"))
                rotateModel(lookAt,dirEnum.NEGATIVE);
            else
                translateModel(vec3.scale(temp,Up,-viewDelta));
            break;
        case "KeyB":
        		//Blinn_Phong = !Blinn_Phong;
                Modulate = !Modulate;
        	break;
        case "KeyN":
        		handleKeyDown.modelOn.material.n = (handleKeyDown.modelOn.material.n + 1)%20;
        		console.log(handleKeyDown.modelOn.material.n);
        	break;
        case "Numpad1":
        		vec3.add(handleKeyDown.modelOn.material.ambient, handleKeyDown.modelOn.material.ambient, vec3.fromValues(0.1,0.1,0.1));
        		if(handleKeyDown.modelOn.material.ambient[0] > 1.0)
        			handleKeyDown.modelOn.material.ambient[0] = 0;
        		if(handleKeyDown.modelOn.material.ambient[1] > 1.0)
        			handleKeyDown.modelOn.material.ambient[1] = 0;
        		if(handleKeyDown.modelOn.material.ambient[2] > 1.0)
        			handleKeyDown.modelOn.material.ambient[2] = 0;
        		console.log(handleKeyDown.modelOn.material.ambient);
        	break;
        case "Numpad2":        		 
        		vec3.add(handleKeyDown.modelOn.material.diffuse, handleKeyDown.modelOn.material.diffuse, vec3.fromValues(0.1,0.1,0.1));
        		if(handleKeyDown.modelOn.material.diffuse[0] > 1.0)
        			handleKeyDown.modelOn.material.diffuse[0] = 0;
        		if(handleKeyDown.modelOn.material.diffuse[1] > 1.0)
        			handleKeyDown.modelOn.material.diffuse[1] = 0;
        		if(handleKeyDown.modelOn.material.diffuse[2] > 1.0)
        			handleKeyDown.modelOn.material.diffuse[2] = 0;
        		console.log(handleKeyDown.modelOn.material.diffuse);
        	break;
         case "Numpad3":        		 
        		vec3.add(handleKeyDown.modelOn.material.specular, handleKeyDown.modelOn.material.specular, vec3.fromValues(0.1,0.1,0.1));
        		if(handleKeyDown.modelOn.material.specular[0] > 1.0)
        			handleKeyDown.modelOn.material.specular[0] = 0;
        		if(handleKeyDown.modelOn.material.specular[1] > 1.0)
        			handleKeyDown.modelOn.material.specular[1] = 0;
        		if(handleKeyDown.modelOn.material.specular[2] > 1.0)
        			handleKeyDown.modelOn.material.specular[2] = 0;
        		console.log(handleKeyDown.modelOn.material.specular);
        	break;
        case "Backspace": // reset model transforms to default
            for (var whichTriSet=0; whichTriSet<numTriangleSets; whichTriSet++) {
                vec3.set(inputTriangles[whichTriSet].translation,0,0,0);
                vec3.set(inputTriangles[whichTriSet].xAxis,1,0,0);
                vec3.set(inputTriangles[whichTriSet].yAxis,0,1,0);
            } // end for all triangle sets
            for (var whichEllipsoid=0; whichEllipsoid<numEllipsoids; whichEllipsoid++) {
                vec3.set(inputEllipsoids[whichEllipsoid].translation,0,0,0);
                vec3.set(inputEllipsoids[whichTriSet].xAxis,1,0,0);
                vec3.set(inputEllipsoids[whichTriSet].yAxis,0,1,0);
            } // end for all ellipsoids
            break;
    } // end switch
} // end handleKeyDown

// set up the webGL environment
function setupWebGL() {
    
    // Set up keys
    document.onkeydown = handleKeyDown; // call this when key pressed
	 // Get the image canvas, render an image in it
     var imageCanvas = document.getElementById("myImageCanvas"); // create a 2d canvas
      var cw = imageCanvas.width, ch = imageCanvas.height; 
      imageContext = imageCanvas.getContext("2d"); 
      var bkgdImage = new Image(); 
      bkgdImage.crossOrigin = "Anonymous";
      bkgdImage.src = "https://ncsucgclass.github.io/prog4/stars.jpg";
      bkgdImage.onload = function(){
          var iw = bkgdImage.width, ih = bkgdImage.height;
          imageContext.drawImage(bkgdImage,0,0,iw,ih,0,0,cw,ch);   
     } // end onload callback
    
     // create a webgl canvas and set it up
     var webGLCanvas = document.getElementById("myWebGLCanvas"); // create a webgl canvas
     gl = webGLCanvas.getContext("webgl"); // get a webgl object from it
     try {
       if (gl == null) {
         throw "unable to create gl context -- is your browser gl ready?";
       } else {
         //gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
         gl.clearDepth(1.0); // use max when we clear the depth buffer
         gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
       }
     } // end try
     
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL

// read models in, load them into webgl buffers
function loadModels() {
    
    
    inputTriangles = getJSONFile(INPUT_GAMEBOARD_URL,"gameboard"); // read in the triangle data

    try {
        if (inputTriangles == String.null)
            throw "Unable to load triangles file!";
        else {
            var whichSetVert; // index of vertex in current triangle set
            var whichSetTri; // index of triangle in current triangle set
            var vtxToAdd; // vtx coords to add to the coord array
            var normToAdd; // vtx normal to add to the coord array
            var triToAdd; // tri indices to add to the index array
            var maxCorner = vec3.fromValues(Number.MIN_VALUE,Number.MIN_VALUE,Number.MIN_VALUE); // bbox corner
            var minCorner = vec3.fromValues(Number.MAX_VALUE,Number.MAX_VALUE,Number.MAX_VALUE); // other corner

            /* texture code */
            var uvToAdd;
        
            // process each triangle set to load webgl vertex and triangle buffers
            numTriangleSets = inputTriangles.length; // remember how many tri sets
            for (var whichSet=0; whichSet<numTriangleSets; whichSet++) { // for each tri set
                
                // set up hilighting, modeling translation and rotation
                inputTriangles[whichSet].center = vec3.fromValues(0,0,0);  // center point of tri set
                inputTriangles[whichSet].on = false; // not highlighted
                inputTriangles[whichSet].translation = vec3.fromValues(0,0,0); // no translation
                inputTriangles[whichSet].xAxis = vec3.fromValues(1,0,0); // model X axis
                inputTriangles[whichSet].yAxis = vec3.fromValues(0,1,0); // model Y axis

                /*________________________________________________________________________________________*/

                // texture code
                //loadTexture(inputTriangles[whichSet].material.texture, textures);
                inputTriangles[whichSet].textures = [];
                loadTexture(inputTriangles[whichSet].material.texture, inputTriangles[whichSet].textures);

                // set up the texture coordinate arrays
                inputTriangles[whichSet].glUVs = []; // flat uv list for webgl
                var numVerts = inputTriangles[whichSet].vertices.length; // num vertices in tri set
                for (whichSetVert=0; whichSetVert<numVerts; whichSetVert++) { // verts in set
                    uvToAdd = inputTriangles[whichSet].uvs[whichSetVert]; // get uv to add
                    inputTriangles[whichSet].glUVs.push(uvToAdd[0],uvToAdd[1]); // put uvs in set uv list
                } // end for vertices in set

                // send the vertex coords and normals to webGL
                inputTriangles[whichSet].uvbo = gl.createBuffer(); // init empty webgl set texture coord buffer
                gl.bindBuffer(gl.ARRAY_BUFFER,inputTriangles[whichSet].uvbo); // activate that buffer
                gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(inputTriangles[whichSet].glUVs),gl.STATIC_DRAW); // data in

                /*________________________________________________________________________________________*/

                // set up the vertex and normal arrays, define model center and axes
                inputTriangles[whichSet].glVertices = []; // flat coord list for webgl
                inputTriangles[whichSet].glNormals = []; // flat normal list for webgl
                var numVerts = inputTriangles[whichSet].vertices.length; // num vertices in tri set
                for (whichSetVert=0; whichSetVert<numVerts; whichSetVert++) { // verts in set
                    vtxToAdd = inputTriangles[whichSet].vertices[whichSetVert]; // get vertex to add
                    normToAdd = inputTriangles[whichSet].normals[whichSetVert]; // get normal to add
                    inputTriangles[whichSet].glVertices.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]); // put coords in set coord list
                    inputTriangles[whichSet].glNormals.push(normToAdd[0],normToAdd[1],normToAdd[2]); // put normal in set coord list
                    vec3.max(maxCorner,maxCorner,vtxToAdd); // update world bounding box corner maxima
                    vec3.min(minCorner,minCorner,vtxToAdd); // update world bounding box corner minima
                    vec3.add(inputTriangles[whichSet].center,inputTriangles[whichSet].center,vtxToAdd); // add to ctr sum
                } // end for vertices in set
                vec3.scale(inputTriangles[whichSet].center,inputTriangles[whichSet].center,1/numVerts); // avg ctr sum

                // send the vertex coords and normals to webGL
                inputTriangles[whichSet].vbo = gl.createBuffer(); // init empty webgl set vertex coord buffer
                gl.bindBuffer(gl.ARRAY_BUFFER,inputTriangles[whichSet].vbo); // activate that buffer
                gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(inputTriangles[whichSet].glVertices),gl.STATIC_DRAW); // data in
                inputTriangles[whichSet].nbo = gl.createBuffer(); // init empty webgl set normal component buffer
                gl.bindBuffer(gl.ARRAY_BUFFER,inputTriangles[whichSet].nbo); // activate that buffer
                gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(inputTriangles[whichSet].glNormals),gl.STATIC_DRAW); // data in
                
                // set up the triangle index array, adjusting indices across sets
                inputTriangles[whichSet].glTriangles = []; // flat index list for webgl
                triSetSizes[whichSet] = inputTriangles[whichSet].triangles.length; // number of tris in this set
                for (whichSetTri=0; whichSetTri<triSetSizes[whichSet]; whichSetTri++) {
                    triToAdd = inputTriangles[whichSet].triangles[whichSetTri]; // get tri to add
                    inputTriangles[whichSet].glTriangles.push(triToAdd[0],triToAdd[1],triToAdd[2]); // put indices in set list
                } // end for triangles in set

                // send the triangle indices to webGL
                inputTriangles[whichSet].tbo = gl.createBuffer(); // init empty triangle index buffer
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, inputTriangles[whichSet].tbo); // activate that buffer
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(inputTriangles[whichSet].glTriangles),gl.STATIC_DRAW); // data in
                
                if (inputTriangles[whichSet].material.alpha > 0.99) {
                    opaqueTriangles[opaqueTriangles.length] = inputTriangles[whichSet];
                }
                else {
                    for (whichSetTri=0; whichSetTri<triSetSizes[whichSet]; whichSetTri++) {
                        var tri = transparentTriangles.length;

                        transparentTriangles[tri] = [];
                        transparentTriangles[tri].center = inputTriangles[whichSet].center;  // center point of tri set
                        transparentTriangles[tri].on = inputTriangles[whichSet].on; // not highlighted
                        transparentTriangles[tri].whichSet = whichSet; // store set num tri belongs to
                        transparentTriangles[tri].translation = inputTriangles[whichSet].translation; // no translation
                        transparentTriangles[tri].xAxis = inputTriangles[whichSet].xAxis; // model X axis
                        transparentTriangles[tri].yAxis = inputTriangles[whichSet].yAxis; // model Y axis

                        transparentTriangles[tri].textures = inputTriangles[whichSet].textures;
                        transparentTriangles[tri].uvbo = inputTriangles[whichSet].uvbo;
                        transparentTriangles[tri].vbo = inputTriangles[whichSet].vbo;
                        transparentTriangles[tri].nbo = inputTriangles[whichSet].nbo;

                        transparentTriangles[tri].material = inputTriangles[whichSet].material;

                        transparentTriangles[tri].glTriangles = [];
                        triToAdd = inputTriangles[whichSet].triangles[whichSetTri]; // get tri to add
                        transparentTriangles[tri].glTriangles.push(triToAdd[0],triToAdd[1],triToAdd[2]); // put indices in set list

                        transparentTriangles[tri].glCenter = vec3.fromValues(0,0,0);
                        var vert1 = inputTriangles[whichSet].vertices[triToAdd[0]];
                        var vert2 = inputTriangles[whichSet].vertices[triToAdd[1]];
                        var vert3 = inputTriangles[whichSet].vertices[triToAdd[2]];

                        var A = vec3.fromValues(vert1[0],vert1[1],vert1[2]);
                        var B = vec3.fromValues(vert2[0],vert2[1],vert2[2]);
                        var C = vec3.fromValues(vert3[0],vert3[1],vert3[2]);

                        vec3.add(transparentTriangles[tri].glCenter, transparentTriangles[tri].glCenter, A);
                        vec3.add(transparentTriangles[tri].glCenter, transparentTriangles[tri].glCenter, B);
                        vec3.add(transparentTriangles[tri].glCenter, transparentTriangles[tri].glCenter, C);

                        vec3.multiply(transparentTriangles[tri].glCenter,
                            transparentTriangles[tri].glCenter,
                            vec3.fromValues(1/3,1/3,1/3));

                        transparentTriangles[tri].tbo = gl.createBuffer();
                        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, transparentTriangles[tri].tbo); // activate that buffer
                        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(transparentTriangles[tri].glTriangles),gl.STATIC_DRAW); // data in

                    } // end for triangles in set
                }

            } // end for each triangle set 
        	var temp = vec3.create();
        	viewDelta = vec3.length(vec3.subtract(temp,maxCorner,minCorner)) / 100; // set global
        } // end if triangle file loaded
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end load models

// load a given texture
function loadTexture(texFile, texObj) {
    var tri = texObj.length;
    texObj[tri] = gl.createTexture();
    if(texFile == "mint green") {
        gl.bindTexture(gl.TEXTURE_2D, texObj[tri]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([152, 255, 204, 255])); // mint green
    } else if (texFile == "rose") {
        gl.bindTexture(gl.TEXTURE_2D, texObj[tri]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([255, 152, 203, 255])); // rose
    } else if (texFile == "white") {
        gl.bindTexture(gl.TEXTURE_2D, texObj[tri]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([255, 255, 255, 255])); // white
    } else {
    
        gl.bindTexture(gl.TEXTURE_2D, texObj[tri]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([155, 155, 155, 255])); // gray
        texObj[tri].image = new Image();
        texObj[tri].image.crossOrigin = "Anonymous";
        texObj[tri].image.onload = function(){
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
            gl.bindTexture(gl.TEXTURE_2D, texObj[tri]);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texObj[tri].image);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,  gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,  gl.LINEAR);
            gl.bindTexture(gl.TEXTURE_2D, null);
        } 
        var url = "https://jtgill92.github.io/Snake3D/" + texFile;
        texObj[tri].image.src = url;
    }
}

// setup the webGL shaders
function setupShaders() {
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        attribute vec3 aVertexPosition; // vertex position
        attribute vec3 aVertexNormal; // vertex normal
        
        uniform mat4 umMatrix; // the model matrix
        uniform mat4 upvmMatrix; // the project view model matrix
        
        varying vec3 vWorldPos; // interpolated world position of vertex
        varying vec3 vVertexNormal; // interpolated normal for frag shader

        // texturing code
        attribute vec2 aVertexTextureCoord;
        varying vec2 vTextureCoord;

        void main(void) {
            
            // vertex position
            vec4 vWorldPos4 = umMatrix * vec4(aVertexPosition, 1.0);
            vWorldPos = vec3(vWorldPos4.x,vWorldPos4.y,vWorldPos4.z);
            gl_Position = upvmMatrix * vec4(aVertexPosition, 1.0);

            // vertex normal (assume no non-uniform scale)
            vec4 vWorldNormal4 = umMatrix * vec4(aVertexNormal, 0.0);
            vVertexNormal = normalize(vec3(vWorldNormal4.x,vWorldNormal4.y,vWorldNormal4.z));

            vTextureCoord = aVertexTextureCoord; 
        }
    `;
    
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float; // set float to medium precision

        // eye location
        uniform vec3 uEyePosition; // the eye's position in world
        
        // light properties
        uniform vec3 uLightAmbient; // the light's ambient color
        uniform vec3 uLightDiffuse; // the light's diffuse color
        uniform vec3 uLightSpecular; // the light's specular color
        uniform vec3 uLightPosition; // the light's position
        
        // material properties
        uniform vec3 uAmbient; // the ambient reflectivity
        uniform vec3 uDiffuse; // the diffuse reflectivity
        uniform vec3 uSpecular; // the specular reflectivity
        uniform float uShininess; // the specular exponent
        uniform bool Blinn_Phong;  // Blinn_Phong x Phong toggle
        // geometry properties
        varying vec3 vWorldPos; // world xyz of fragment
        varying vec3 vVertexNormal; // normal of fragment

        // texturing code
        uniform sampler2D uTexture;
        varying vec2 vTextureCoord;
        uniform bool Modulate; // Modulate x Replace toggle
        uniform float uAlpha;
            
        void main(void) {
        
            // ambient term
            vec3 ambient = uAmbient*uLightAmbient; 
            
            // diffuse term
            vec3 normal = normalize(vVertexNormal); 
            vec3 light = normalize(uLightPosition - vWorldPos);
            float lambert = max(0.0,dot(normal,light));
            vec3 diffuse = uDiffuse*uLightDiffuse*lambert; // diffuse term
            
            // specular term
            vec3 eye = normalize(uEyePosition - vWorldPos);
            vec3 halfVec = normalize(light+eye);
            float ndotLight = 2.0*dot(normal, light);
            vec3 reflectVec = normalize(ndotLight*normal - light);
            float highlight = 0.0;
            if(Blinn_Phong)
           	 	highlight = pow(max(0.0,dot(normal,halfVec)),uShininess);
           	else 
           		highlight = pow(max(0.0,dot(normal,reflectVec)),uShininess);

            vec3 specular = uSpecular*uLightSpecular*highlight; // specular term
            
            // combine to output color
            vec3 colorOut = ambient + diffuse + specular; // no specular yet
            //gl_FragColor = vec4(colorOut, 1.0);
            //vec4 col = vec4(colorOut, 1.0);
            vec4 CfAf = vec4(colorOut, uAlpha);
            //gl_FragColor = texture2D(uTexture, vTextureCoord);
            vec4 CtAt = texture2D(uTexture, vTextureCoord);
            if(Modulate)
                gl_FragColor = CfAf * CtAt;
            else // Replace
                gl_FragColor = CtAt;
        }
    `;
    
    try {
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                
                // locate and enable vertex attributes
                vPosAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexPosition"); // ptr to vertex pos attrib
                gl.enableVertexAttribArray(vPosAttribLoc); // connect attrib to array
                vNormAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexNormal"); // ptr to vertex normal attrib
                gl.enableVertexAttribArray(vNormAttribLoc); // connect attrib to array
                
                // locate vertex uniforms
                mMatrixULoc = gl.getUniformLocation(shaderProgram, "umMatrix"); // ptr to mmat
                pvmMatrixULoc = gl.getUniformLocation(shaderProgram, "upvmMatrix"); // ptr to pvmmat
                
                // locate fragment uniforms
                var eyePositionULoc = gl.getUniformLocation(shaderProgram, "uEyePosition"); // ptr to eye position
                var lightAmbientULoc = gl.getUniformLocation(shaderProgram, "uLightAmbient"); // ptr to light ambient
                var lightDiffuseULoc = gl.getUniformLocation(shaderProgram, "uLightDiffuse"); // ptr to light diffuse
                var lightSpecularULoc = gl.getUniformLocation(shaderProgram, "uLightSpecular"); // ptr to light specular
                var lightPositionULoc = gl.getUniformLocation(shaderProgram, "uLightPosition"); // ptr to light position
                ambientULoc = gl.getUniformLocation(shaderProgram, "uAmbient"); // ptr to ambient
                diffuseULoc = gl.getUniformLocation(shaderProgram, "uDiffuse"); // ptr to diffuse
                specularULoc = gl.getUniformLocation(shaderProgram, "uSpecular"); // ptr to specular
                shininessULoc = gl.getUniformLocation(shaderProgram, "uShininess"); // ptr to shininess
                Blinn_PhongULoc = gl.getUniformLocation(shaderProgram, "Blinn_Phong");
                // pass global constants into fragment uniforms
                gl.uniform3fv(eyePositionULoc,Eye); // pass in the eye's position
                gl.uniform3fv(lightAmbientULoc,lightAmbient); // pass in the light's ambient emission
                gl.uniform3fv(lightDiffuseULoc,lightDiffuse); // pass in the light's diffuse emission
                gl.uniform3fv(lightSpecularULoc,lightSpecular); // pass in the light's specular emission
                gl.uniform3fv(lightPositionULoc,lightPosition); // pass in the light's position

                // texture code
                alphaULoc = gl.getUniformLocation(shaderProgram, "uAlpha"); // ptr to ambient
                ModulateULoc = gl.getUniformLocation(shaderProgram, "Modulate");
                textureULoc = gl.getUniformLocation(shaderProgram, "uTexture"); // ptr to vertex pos attrib

                textureCoordALoc = gl.getAttribLocation(shaderProgram, "aVertexTextureCoord"); // ptr to vertex pos attrib
                gl.enableVertexAttribArray(textureCoordALoc);

            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders

// render the loaded model
function renderModels() {

    function draw(currSet) {
        // makeModelTransform(currSet);
        mat4.multiply(pvmMatrix,pvMatrix,mMatrix); // project * view * model
        gl.uniformMatrix4fv(mMatrixULoc, false, mMatrix); // pass in the m matrix
        gl.uniformMatrix4fv(pvmMatrixULoc, false, pvmMatrix); // pass in the hpvm matrix
        
        // reflectivity: feed to the fragment shader
        gl.uniform3fv(ambientULoc,currSet.material.ambient); // pass in the ambient reflectivity
        gl.uniform3fv(diffuseULoc,currSet.material.diffuse); // pass in the diffuse reflectivity
        gl.uniform3fv(specularULoc,currSet.material.specular); // pass in the specular reflectivity
        gl.uniform1f(shininessULoc,currSet.material.n); // pass in the specular exponent
        gl.uniform1i(Blinn_PhongULoc, Blinn_Phong);
        // vertex buffer: activate and feed into vertex shader
        gl.bindBuffer(gl.ARRAY_BUFFER,currSet.vbo); // activate
        gl.vertexAttribPointer(vPosAttribLoc,3,gl.FLOAT,false,0,0); // feed
        gl.bindBuffer(gl.ARRAY_BUFFER,currSet.nbo); // activate
        gl.vertexAttribPointer(vNormAttribLoc,3,gl.FLOAT,false,0,0); // feed

        // texture code
        gl.uniform1i(ModulateULoc, Modulate);
        gl.uniform1f(alphaULoc,currSet.material.alpha); // pass in the specular exponent
        gl.bindBuffer(gl.ARRAY_BUFFER, currSet.uvbo);
        gl.vertexAttribPointer(textureCoordALoc, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, currSet.textures[0]);
        gl.uniform1i(textureULoc, 0);
    
        //Enables blending
        gl.enable(gl.BLEND);
        //Blending function for transparencies
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);   
        
        if(currSet.material.alpha < 1.0) {
            //gl.depthMask(gl.GL_FALSE);
            // triangle buffer: activate and render
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,currSet.tbo); // activate
            gl.drawElements(gl.TRIANGLES,3,gl.UNSIGNED_SHORT,0); // render
        }
        else {
            //gl.depthMask(gl.GL_TRUE);
            // triangle buffer: activate and render
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,currSet.tbo); // activate
            gl.drawElements(gl.TRIANGLES,3*currSet.triangles.length,gl.UNSIGNED_SHORT,0); // render
        }
    }
    
    // construct the model transform matrix, based on model state
    function makeModelTransform(currModel) {
        var zAxis = vec3.create(), sumRotation = mat4.create(), temp = mat4.create(), negCtr = vec3.create();

        // move the model to the origin
        mat4.fromTranslation(mMatrix,vec3.negate(negCtr,currModel.center)); 
        
        // scale for highlighting if needed
        // if (currModel.on)
            mat4.multiply(mMatrix,mat4.fromScaling(temp,vec3.fromValues(0.05,0.05,0.05)),mMatrix); // S(1.2) * T(-ctr)
        
        // rotate the model to current interactive orientation
        vec3.normalize(zAxis,vec3.cross(zAxis,currModel.xAxis,currModel.yAxis)); // get the new model z axis
        mat4.set(sumRotation, // get the composite rotation
            currModel.xAxis[0], currModel.yAxis[0], zAxis[0], 0,
            currModel.xAxis[1], currModel.yAxis[1], zAxis[1], 0,
            currModel.xAxis[2], currModel.yAxis[2], zAxis[2], 0,
            0, 0,  0, 1);
        mat4.multiply(mMatrix,sumRotation,mMatrix); // R(ax) * S(1.2) * T(-ctr)
        
        // translate back to model center
        mat4.multiply(mMatrix,mat4.fromTranslation(temp,currModel.center),mMatrix); // T(ctr) * R(ax) * S(1.2) * T(-ctr)

        // translate model to current interactive orientation
        mat4.multiply(mMatrix,mat4.fromTranslation(temp,currModel.translation),mMatrix); // T(pos)*T(ctr)*R(ax)*S(1.2)*T(-ctr)
        
    } // end make model transform
    
    // var hMatrix = mat4.create(); // handedness matrix
    var pMatrix = mat4.create(); // projection matrix
    var vMatrix = mat4.create(); // view matrix
    var mMatrix = mat4.create(); // model matrix
    var pvMatrix = mat4.create(); // hand * proj * view matrices
    var pvmMatrix = mat4.create(); // hand * proj * view * model matrices
    
    window.requestAnimationFrame(renderModels); // set up frame render callback
    elapsedTime = (new Date).getTime() - initialTime;
    if (elapsedTime > animationRate) {
        update();
        initialTime = (new Date).getTime();
    }
    
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    
    // set up projection and view
    // mat4.fromScaling(hMatrix,vec3.fromValues(-1,1,1)); // create handedness matrix
    mat4.perspective(pMatrix,0.5*Math.PI,1,0.1,10); // create projection matrix
    mat4.lookAt(vMatrix,Eye,Center,Up); // create view matrix
    mat4.multiply(pvMatrix,pvMatrix,pMatrix); // projection
    mat4.multiply(pvMatrix,pvMatrix,vMatrix); // projection * view

    var orderedTriangles = [];
    for (var tri=0; tri<transparentTriangles.length; tri++) {
        var currSet = transparentTriangles[tri];

        // make model transform, add to view project
        makeModelTransform(currSet);
        mat4.multiply(pvmMatrix,pvMatrix,mMatrix); // project * view * model

        //var center = currSet.center;
        currSet.worldPos = vec3.create();
        vec3.transformMat4(currSet.worldPos, currSet.glCenter, pvmMatrix);

        currSet.on = inputTriangles[currSet.whichSet].on;
        currSet.material = inputTriangles[currSet.whichSet].material;

        orderedTriangles[orderedTriangles.length] = currSet;

    }
    orderedTriangles.sort(function(a, b){return b.worldPos[2]-a.worldPos[2]});

    var structuredTriangles = opaqueTriangles.concat(orderedTriangles);

    // render each triangle set

    draw(gameboard.model);
    for(var i = 0; i < snake1.length; i++) {
        snake1.model.translation = vec3.fromValues((9 - (snake1[i][0]-.5))*.05,(snake1[i][1]-.5 - 9)*.05,.475);
        makeModelTransform(snake1.model);
        draw(snake1.model);
    }
    for(var i = 0; i < snake2.length; i++) {
        snake2.model.translation = vec3.fromValues((9 - (snake2[i][0]-.5))*.05,(snake2[i][1]-.5 - 9)*.05,.475);
        makeModelTransform(snake2.model);
        draw(snake2.model);
    }
    if(food.alive) {
        food.model.translation = vec3.fromValues((9 - (food[0][0]-.5))*.05,(food[0][1]-.5 - 9)*.05,.475);
        makeModelTransform(food.model);
        draw(food.model);
    }


} // end render model


/* MAIN -- HERE is where execution begins after window load */

function main() {
  
  setupWebGL(); // set up the webGL environment
  loadModels(); // load in the models from tri file
  setupShaders(); // setup the webGL shaders
  initGame()
  renderModels(); // draw the triangles using webGL
  
} // end main
