import RAPIER from "rapier2d-compat";
import { mat4, vec3 } from "gl-matrix";
import { gl, initWebGLContext } from "./webgl-context.js";
import createProgram from "./shader-program.js";
import initRapier2D from "./init-rapier2d.js";
import DebugDrawer from "./debug-drawer.js";
import Keyboard from "./keyboard.js";

async function init() {
    if (!initWebGLContext("renderCanvas")) {
        return;
    }
    await initRapier2D();

    gl.clearColor(0, 0, 0, 1);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    const projMatrix = mat4.create();
    mat4.ortho(projMatrix, -30, 30, -30, 30, 1, -1);
    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, [0, 0, 1], [0, 0, 0], [0, 1, 0]);
    const projViewMatrix = mat4.create();
    mat4.mul(projViewMatrix, projMatrix, viewMatrix);

    const pixelsPerMeter = 1;
    const gravity = { x: 0, y: 0 };
    const world = new RAPIER.World(gravity);

    const colorProgram = await createProgram("assets/shaders/",
        "color.vert", "color.frag");
    const debugDrawer = new DebugDrawer(world, colorProgram, pixelsPerMeter);
    debugDrawer.projViewMatrix = projViewMatrix;

    // Left point trigger
    const leftPointTriggerColliderDesc = RAPIER.ColliderDesc.cuboid(0.5 / pixelsPerMeter, 8 / pixelsPerMeter);
    leftPointTriggerColliderDesc.restitution = 1;
    leftPointTriggerColliderDesc.setTranslation(-25.5 / pixelsPerMeter, 0 / pixelsPerMeter);
    world.createCollider(leftPointTriggerColliderDesc);

    // Right point trigger
    const rightPointTriggerColliderDesc = RAPIER.ColliderDesc.cuboid(0.5 / pixelsPerMeter, 8 / pixelsPerMeter);
    rightPointTriggerColliderDesc.restitution = 1;
    rightPointTriggerColliderDesc.setTranslation(25.5 / pixelsPerMeter, 0 / pixelsPerMeter);
    world.createCollider(rightPointTriggerColliderDesc);

    // Left top wall
    const leftTopWallColliderDesc = RAPIER.ColliderDesc.cuboid(0.5 / pixelsPerMeter, 4 / pixelsPerMeter);
    leftTopWallColliderDesc.restitution = 1;
    leftTopWallColliderDesc.setTranslation(-25.5 / pixelsPerMeter, 12 / pixelsPerMeter);
    world.createCollider(leftTopWallColliderDesc);

    // Left bottom wall
    const leftBottomWallColliderDesc = RAPIER.ColliderDesc.cuboid(0.5 / pixelsPerMeter, 4 / pixelsPerMeter);
    leftBottomWallColliderDesc.restitution = 1;
    leftBottomWallColliderDesc.setTranslation(-25.5 / pixelsPerMeter, -12 / pixelsPerMeter);
    world.createCollider(leftBottomWallColliderDesc);

    // Right top wall
    const rightTopWallColliderDesc = RAPIER.ColliderDesc.cuboid(0.5 / pixelsPerMeter, 4 / pixelsPerMeter);
    rightTopWallColliderDesc.restitution = 1;
    rightTopWallColliderDesc.setTranslation(25.5 / pixelsPerMeter, 12 / pixelsPerMeter);
    world.createCollider(rightTopWallColliderDesc);

    // Right bottom wall
    const rightBottomWallColliderDesc = RAPIER.ColliderDesc.cuboid(0.5 / pixelsPerMeter, 4 / pixelsPerMeter);
    rightBottomWallColliderDesc.restitution = 1;
    rightBottomWallColliderDesc.setTranslation(25.5 / pixelsPerMeter, -12 / pixelsPerMeter);
    world.createCollider(rightBottomWallColliderDesc);

    // Top wall
    const topWallColliderDesc = RAPIER.ColliderDesc.cuboid(25 / pixelsPerMeter, 0.5 / pixelsPerMeter);
    topWallColliderDesc.restitution = 1;
    topWallColliderDesc.setTranslation(0 / pixelsPerMeter, 15.5 / pixelsPerMeter);
    world.createCollider(topWallColliderDesc);

    // Bottom wall
    const bottomWallColliderDesc = RAPIER.ColliderDesc.cuboid(25 / pixelsPerMeter, 0.5 / pixelsPerMeter);
    bottomWallColliderDesc.restitution = 1;
    bottomWallColliderDesc.setTranslation(0 / pixelsPerMeter, -15.5 / pixelsPerMeter);
    world.createCollider(bottomWallColliderDesc);

    // Left racket
    const leftRacketHalfHeight = 2;
    const leftRacketColliderDesc = RAPIER.ColliderDesc.cuboid(1 / pixelsPerMeter,
        leftRacketHalfHeight / pixelsPerMeter);
    leftRacketColliderDesc.restitution = 1;
    const leftRacketRBDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
    leftRacketRBDesc.setTranslation(-20 / pixelsPerMeter, -2.501 / pixelsPerMeter);
    const leftRacketRigidBody = world.createRigidBody(leftRacketRBDesc);
    const leftRacket = world.createCollider(leftRacketColliderDesc, leftRacketRigidBody);
    leftRacket.userData = { name: "leftRacket" };

    // Right racket
    const rightRacketHalfHeight = 2;
    const rightRacketColliderDesc = RAPIER.ColliderDesc.cuboid(1 / pixelsPerMeter,
        rightRacketHalfHeight / pixelsPerMeter);
    rightRacketColliderDesc.restitution = 1;
    const rightRacketRBDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
    rightRacketRBDesc.setTranslation(20 / pixelsPerMeter, 0 / pixelsPerMeter);
    const rightRacketRigidBody = world.createRigidBody(rightRacketRBDesc);
    const rightRacket = world.createCollider(rightRacketColliderDesc, rightRacketRigidBody);
    rightRacket.userData = { name: "rightRacket" };

    // Ball
    const ballColliderDesc = RAPIER.ColliderDesc.cuboid(0.5 / pixelsPerMeter, 0.5 / pixelsPerMeter);
    ballColliderDesc.friction = 0;
    ballColliderDesc.restitution = 1;
    const ballRBDesc = RAPIER.RigidBodyDesc.dynamic();
    ballRBDesc.canSleep = false;
    ballRBDesc.rotationsEnabled = false;
    ballRBDesc.setTranslation(0 / pixelsPerMeter, 0 / pixelsPerMeter);
    ballRBDesc.setLinvel(30, 0);
    const ballRigidBody = world.createRigidBody(ballRBDesc);
    const ballCollider = world.createCollider(ballColliderDesc, ballRigidBody);
    ballCollider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

    let currentTime, lastTime, dt;
    const keyboard = new Keyboard();

    function hitFactor(ballPosY, racketPosY, racketHalfHeight) {
        // ascii art:
        // ||  1 <- at the top of the racket
        // ||
        // ||  0 <- at the middle of the racket
        // ||
        // || -1 <- at the bottom of the racket
        return (ballPosY - racketPosY) / racketHalfHeight;
    }

    function render() {
        requestAnimationFrame(render);

        currentTime = Date.now();
        dt = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        if (keyboard.pressed("KeyW")) {
            const pos = leftRacketRigidBody.translation();
            if (pos.y * pixelsPerMeter < 12.5) {
                pos.y = pos.y + dt;
                leftRacketRigidBody.setTranslation(pos);
            }
        }

        if (keyboard.pressed("KeyS")) {
            const pos = leftRacketRigidBody.translation();
            if (pos.y * pixelsPerMeter > -12.5) {
                pos.y = pos.y - dt;
                leftRacketRigidBody.setTranslation(pos);
            }
        }

        if (keyboard.pressed("ArrowUp")) {
            const pos = rightRacketRigidBody.translation();
            if (pos.y * pixelsPerMeter < 12.5) {
                pos.y = pos.y + dt;
                rightRacketRigidBody.setTranslation(pos);
            }
        }

        if (keyboard.pressed("ArrowDown")) {
            const pos = rightRacketRigidBody.translation();
            if (pos.y * pixelsPerMeter > -12.5) {
                pos.y = pos.y - dt;
                rightRacketRigidBody.setTranslation(pos);
            }
        }

        world.step();

        world.contactsWith(ballCollider, (otherCollider) => {
            const name = otherCollider.userData.name;
            if (name === "leftRacket") {
                console.log("left racket <-> ball");
            } else if (name === "rightRacket") {
                console.log("right racket <-> ball");
                // const ballPosY = ballRigidBody.translation().y * pixelsPerMeter;
                // const racketPosY = rightRacketRigidBody.translation().y * pixelsPerMeter;
                // const y = hitFactor(ballPosY, racketPosY, rightRacketHalfHeight);
                // console.log(y);
            }
        });

        gl.clear(gl.COLOR_BUFFER_BIT);

        // world.debugDraw();
        debugDrawer.drawLines();
    }

    lastTime = Date.now();
    render();
}

init();
