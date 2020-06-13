var Physics = Physics || {};

let color = '#ffffff',
run = true,
mousedown;

let environment,
ballSettings,
pegSettings,
dividerSettings;

let Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Composite = Matter.Composite,
    Composites = Matter.Composites,
    Common = Matter.Common,
    Events = Matter.Events,
    MouseConstraint = Matter.MouseConstraint,
    Mouse = Matter.Mouse,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Vector = Matter.Vector;

let render,
runner,
engine,
world;

class Environment {
    constructor(pageHeight, pageWidth) {
        this.height = pageHeight;
        this.width = pageWidth;
        this.centerX = this.width/2;
        this.centerY = this.height/2;
        this.pause = () => {
            if(run) {
                Runner.stop(runner);
                run = false;
            } else {
                Runner.start(runner, engine);
                run = true;
            }
        }
        this.clear = () => {
            World.clear(world);
            Engine.clear(engine);
            Render.stop(render);
            Runner.stop(runner);
            render.canvas.remove();
            render.canvas = null;
            render.context = null;
            render.textures = {};
            document.body.removeEventListener("mousedown", mousedown);
            Physics.sandbox();
        };
    }
}

class BallSettings {
    constructor() {
        this.size = 40;
        this.friction = 0.00001;
        this.airFriction = 0.001;
        this.density = 0.01;
        this.bounciness = 0.8;
        this.sleepThreshold = 35;
    }
}

class PegSettings {
    constructor() {
        this.shape = "triangle";
        this.rows = 11;
        this.cols = 10;
        this.pegSize = 20;
        this.rowSpacing = 100;
    }
}

class DividerSettings {
    constructor() {
        this.num = 10;
        this.wallHeight = 600;
        this.wallWidth = 10;
    }
}

function guiSetup(pageHeight, pageWidth) {
    environment = new Environment(pageHeight, pageWidth);
    ballSettings = new BallSettings();
    pegSettings = new PegSettings();
    dividerSettings = new DividerSettings(environment);

    let gui = new dat.GUI();

    let ballData = gui.addFolder('Ball Settings');
    ballData.add(ballSettings, 'size', 1, 50, 1);
    ballData.add(ballSettings, 'bounciness', 0.01, 1.5, 0.01);
    ballData.add(ballSettings, 'friction', 0.00001, 1, 0.00001);
    ballData.add(ballSettings, 'airFriction', 0.0001, 0.1, 0.0001);
    ballData.add(ballSettings, 'density', 0.001, 1, 0.001);
    ballData.add(ballSettings, 'sleepThreshold', 0, 100, 1);
    // ballData.open();

    let pegData = gui.addFolder('Peg Settings');
    pegData.add(pegSettings, 'shape', ['circle', 'hexagon', 'triangle', 'square']);
    pegData.add(pegSettings, 'pegSize', 1, 50, 1);
    pegData.add(pegSettings, 'rows', 1, 15, 1);
    pegData.add(pegSettings, 'rowSpacing', 10, 200, 10);

    let dividerData = gui.addFolder('Divider Settings');
    dividerData.add(dividerSettings, 'num', 1, 50, 2);
    dividerData.add(dividerSettings, 'wallHeight', 100, 2000, 100);
    dividerData.add(dividerSettings, 'wallWidth', 1, 50, 1);    

    gui.add(environment, 'pause');
    gui.add(environment, 'clear');
}

Physics.sandbox = function() {
    engine = Engine.create({
        enableSleeping: true
    }),
    world = engine.world;

    render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            width: environment.width,
            height: environment.height,
            wireframes: false
        }
    });

    Render.run(render);
    
    runner = Runner.create();
    Runner.run(runner, engine);

    // let count = 0;

    // timer = setInterval(() => {
    //     if(run && count < ballSettings.ballCount) {
    //         let ball = createBall(Bodies, environment, ballSettings);
    //         Matter.Events.on(ball, "sleepStart", () => { Matter.Body.setStatic(ball, true) });
    //         World.add(engine.world, ball);
    //         count += 1;
    //     }
    // }, ballSettings.frequency);

     // add mouse control
     let mouse = Mouse.create(render.canvas),
     mouseConstraint = MouseConstraint.create(engine, {
         mouse: mouse,
         constraint: {
             stiffness: 0.2,
             render: {
                 visible: false
             }
         }
     });
    World.add(world, mouseConstraint);

    mousedown = function() {
        console.log(mouseConstraint);
        let ball = createBall(Bodies, mouseConstraint, ballSettings);
        World.add(world, ball);
    }

    document.body.addEventListener("mousedown", mousedown);

    let floor = [createFloor(Bodies,environment)];

    let walls = [createWall(Bodies,environment.height,0,environment.centerY),createWall(Bodies,environment.height,environment.width,environment.centerY)];

    pegs = createPegs(Bodies,environment,pegSettings);

    dividers = createDividers(Bodies, environment, dividerSettings);

    World.add(world, floor);
    World.add(world, walls);
    World.add(world, pegs);
    World.add(world, dividers);
}

function createBall(Bodies, mouseConstraint, ballSettings){
    return ball = Bodies.circle(mouseConstraint.mouse.position.x, mouseConstraint.mouse.position.y, ballSettings.size, {
        friction: ballSettings.friction,
        frictionAir: ballSettings.airFriction,
        density: ballSettings.density,
        restitution: ballSettings.bounciness,
        sleepThreshold: ballSettings.sleepThreshold
    })
}

function createFloor(Bodies, environment) {
    let wallThickness = 40;
    return Bodies.rectangle(environment.centerX,environment.height,environment.width,wallThickness, {
        render: {
            fillStyle: color,
            strokeStyle: 'C'
        },
    isStatic: true
    })
}

function createWall(Bodies, pageHeight, x, y) {
    let wallThickness = 40;
    return Bodies.rectangle(x,y,wallThickness,pageHeight, {
        render: {
            fillStyle: color,
            strokeStyle: 'C'
        },
        isStatic: true
    })
}

function createPegs(Bodies, environment, pegSettings) {
    let pegs = []
    let xPos, 
    yPos,
    // spacing = environment.centerX/(pegSettings.cols+1)*2;
    spacing = (environment.width-80)/pegSettings.cols;
    for (i = 0; i < pegSettings.rows; i++){
        for(j=0; j < pegSettings.cols; j++){
            yPos = 400+i*pegSettings.rowSpacing;
            if(i%2 == 0){
                xPos = spacing/2 + spacing*j - 80;
            } else {
                xPos = spacing*j + spacing - 80;
            }
            if(pegSettings.shape == "circle") {
                pegs.push(
                    Bodies.circle(xPos, yPos, pegSettings.pegSize, {
                        render: {
                            strokeStyle: '#ffffff',
                            lineWidth: 3
                        },
                        isStatic: true
                    })
                )
            }
            else {
                let numSides;
                let shapeAngle = 0;
                if(pegSettings.shape == "hexagon"){ numSides = 6 };
                if(pegSettings.shape == "square"){ numSides = 4 };
                if(pegSettings.shape == "triangle"){ numSides = 3; shapeAngle = 90*(Math.PI/180) };
                pegs.push(
                    Bodies.polygon(xPos, yPos,numSides,pegSettings.pegSize, {
                        render: {
                            strokeStyle: '#ffffff',
                            lineWidth: 3
                        },
                        angle: shapeAngle,
                        isStatic: true
                    })
                )
            }
        }
    }
    return pegs
}

function createDividers(Bodies, environment, dividerSettings) {
    let dividers = [],
    spacing = environment.centerX/dividerSettings.num*2;

    for(let i = 0; i < dividerSettings.num; i++){
        dividers.push(
            Bodies.rectangle(environment.centerX-spacing/2-spacing*i,environment.height-100,dividerSettings.wallWidth,dividerSettings.wallHeight, {
                render: {
                    fillStyle: color,
                    strokeStyle: 'C'
                },
                isStatic: true
            })
        );
        dividers.push(
            Bodies.rectangle(environment.centerX+spacing/2+spacing*i,environment.height-100,dividerSettings.wallWidth,dividerSettings.wallHeight, {
                render: {
                    fillStyle: color,
                    strokeStyle: 'C'
                },
                isStatic: true
            })
        );
    }
    return dividers
}

window.onload = function() {
    let pageHeight = document.body.clientHeight*2,
    pageWidth = document.body.clientWidth*2;

    guiSetup(pageHeight, pageWidth);
    Physics.sandbox();
}