import { mat4, quat, vec3 } from "gl-matrix";
import { gl } from "./webgl-context.js";

export default class DebugDrawer {
    constructor(world, program, pixelsPerMeter) {
        this.world = world;
        this.program = program;
        this.pixelsPerMeter = pixelsPerMeter;

        this.projViewMatrix = null;
        this.modelMatrix = mat4.create();
        this.mvpMatrix = mat4.create();

        gl.useProgram(program);
        this.aPositionLocation = gl.getAttribLocation(program, "aPosition");
        this.uMvpMatrixLocation = gl.getUniformLocation(program, "uMvpMatrix");
        this.uColorLocation = gl.getUniformLocation(program, "uColor");

        const vertPositions = [
            -0.5, -0.5,
            0.5, -0.5,
            -0.5, 0.5,
            0.5, 0.5
        ];
        this.vertPosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertPosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPositions),
            gl.STATIC_DRAW);

        this.centerX = 0;
        this.centerY = 0;
        this.centerZ = 0;

        this.position = vec3.create();
        this.rotation = quat.create();
        this.scale = vec3.create();

        this.thickness = 0.3;
        this.length = 0;
        this.tempVec = vec3.create();
        this.unitX = vec3.fromValues(1, 0, 0);

        this.debugRender = null;
    }

    drawLines() {
        gl.useProgram(this.program);
        this.debugRender = this.world.debugRender();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertPosBuffer);
        gl.vertexAttribPointer(this.aPositionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.aPositionLocation);

        const cls = this.debugRender.colors;
        const vtx = this.debugRender.vertices;
        for (let i = 0; i < vtx.length / 4; i++) {
            gl.uniform3f(this.uColorLocation, cls[i * 8], cls[i * 8 + 1], cls[i * 8 + 2]);
            const fromX = vtx[i * 4] * this.pixelsPerMeter;
            const fromY = vtx[i * 4 + 1] * this.pixelsPerMeter;
            const toX = vtx[i * 4 + 2] * this.pixelsPerMeter;
            const toY = vtx[i * 4 + 3] * this.pixelsPerMeter;
            this.drawLine(fromX, fromY, toX, toY);
        }
    }

    drawLine(fromX, fromY, toX, toY) {
        if (fromX > toX) {
            this.centerX = toX + Math.abs(fromX - toX) / 2;
        } else {
            this.centerX = fromX + Math.abs(toX - fromX) / 2;
        }

        if (fromY > toY) {
            this.centerY = toY + Math.abs(fromY - toY) / 2;
        } else {
            this.centerY = fromY + Math.abs(toY - fromY) / 2;
        }

        this.tempVec[0] = toX - fromX;
        this.tempVec[1] = toY - fromY;
        this.length = vec3.length(this.tempVec);
        vec3.normalize(this.tempVec, this.tempVec);

        this.position[0] = this.centerX;
        this.position[1] = this.centerY;
        this.position[2] = 0;
        quat.rotationTo(this.rotation, this.unitX, this.tempVec);
        this.scale[0] = this.length;
        this.scale[1] = this.thickness;
        this.scale[2] = 1;
        mat4.fromRotationTranslationScale(this.modelMatrix, this.rotation,
            this.position, this.scale);
        mat4.mul(this.mvpMatrix, this.projViewMatrix, this.modelMatrix);
        gl.uniformMatrix4fv(this.uMvpMatrixLocation, false, this.mvpMatrix);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}

// import { mat4, quat, vec3 } from "gl-matrix";
// import { gl } from "./webgl-context.js";

// // This class implements debug drawing callbacks that
// // are invoked inside b2World::Step
// export default class DebugDrawer {

//     constructor(program, pixelsPerMeter) {
//         this.program = program;
//         this.pixelsPerMeter = pixelsPerMeter;
//         gl.useProgram(program);

//         const vertPositions = [
//             -0.5, -0.5,
//             0.5, -0.5,
//             -0.5, 0.5,
//             0.5, 0.5
//         ];
//         this.vertPosBuffer = gl.createBuffer();
//         gl.bindBuffer(gl.ARRAY_BUFFER, this.vertPosBuffer);
//         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPositions),
//             gl.STATIC_DRAW);

//         this.aPositionLocation = gl.getAttribLocation(program, "aPosition");
//         this.uMvpMatrixLocation = gl.getUniformLocation(program, "uMvpMatrix");
//         this.uColorLocation = gl.getUniformLocation(program, "uColor");
//         this.mvpMatrix = mat4.create();
//         this.modelMatrix = mat4.create();
//         this.projViewMatrix = null;
//         this.lineWidth = 0.3;
//         this.centerX = 0;
//         this.centerY = 0;
//         this.tempVec = vec3.create();
//         this.fromX = 0;
//         this.fromY = 0;
//         this.toX = 0;
//         this.toY = 0;
//         this.length = 0;
//         this.position = vec3.create();
//         this.rotation = quat.create();
//         this.scale = vec3.create();
//         this.color = vec3.create();
//         this.unitX = vec3.fromValues(1, 0, 0);
//         this.xf = vec3.create();
//         this.radianOffset = 0;
//         this.quatMat = mat4.create();
//         this.q = quat.create();
//     }

//     DrawSolidPolygon(vertices, vertexCount, color) {
//         gl.useProgram(this.program);
//         gl.uniform3f(this.uColorLocation, color.r, color.g, color.b);

//         gl.bindBuffer(gl.ARRAY_BUFFER, this.vertPosBuffer);
//         gl.vertexAttribPointer(this.aPositionLocation, 2, gl.FLOAT, false, 0, 0);
//         gl.enableVertexAttribArray(this.aPositionLocation);

//         this.drawLine(vertices[0], vertices[1]);
//         this.drawLine(vertices[1], vertices[2]);
//         this.drawLine(vertices[2], vertices[3]);
//         this.drawLine(vertices[3], vertices[0]);
//     }

//     drawLine(pointA, pointB) {
//         this.fromX = pointA.x * this.pixelsPerMeter;
//         this.fromY = pointA.y * this.pixelsPerMeter;
//         this.toX = pointB.x * this.pixelsPerMeter;
//         this.toY = pointB.y * this.pixelsPerMeter;
//         if (this.fromX > this.toX) {
//             this.centerX = this.toX + Math.abs(this.fromX - this.toX) / 2;
//         } else {
//             this.centerX = this.fromX + Math.abs(this.toX - this.fromX) / 2;
//         }
//         if (this.fromY > this.toY) {
//             this.centerY = this.toY + Math.abs(this.fromY - this.toY) / 2;
//         } else {
//             this.centerY = this.fromY + Math.abs(this.toY - this.fromY) / 2;
//         }
//         this.tempVec[0] = this.toX - this.fromX;
//         this.tempVec[1] = this.toY - this.fromY;
//         this.length = vec3.length(this.tempVec);
//         vec3.normalize(this.tempVec, this.tempVec);

//         this.position[0] = this.centerX;
//         this.position[1] = this.centerY;
//         this.position[2] = 0;
//         quat.rotationTo(this.rotation, this.unitX, this.tempVec);
//         this.scale[0] = this.length;
//         this.scale[1] = this.lineWidth;
//         this.scale[2] = 1;

//         mat4.identity(this.modelMatrix);
//         mat4.translate(this.modelMatrix, this.modelMatrix, this.xf);
//         quat.identity(this.q);
//         quat.rotateZ(this.q, this.q, this.radianOffset);
//         mat4.fromQuat(this.quatMat, this.q);
//         mat4.mul(this.modelMatrix, this.modelMatrix, this.quatMat);
//         mat4.translate(this.modelMatrix, this.modelMatrix, this.position);
//         mat4.fromQuat(this.quatMat, this.rotation);
//         mat4.mul(this.modelMatrix, this.modelMatrix, this.quatMat);
//         mat4.scale(this.modelMatrix, this.modelMatrix, this.scale);
//         mat4.mul(this.mvpMatrix, this.projViewMatrix, this.modelMatrix);
//         gl.uniformMatrix4fv(this.uMvpMatrixLocation, false, this.mvpMatrix);
//         gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
//     }

//     PushTransform(xf) {
//         // Translation
//         this.xf[0] = xf.p.x * this.pixelsPerMeter;
//         this.xf[1] = xf.p.y * this.pixelsPerMeter;
//         // Rotation
//         this.radianOffset = xf.q.s;
//     }
//     PopTransform(xf) {}
//     DrawPolygon(vertices, vertexCount, color) {}
//     DrawCircle(center, radius, color) {}
//     DrawSolidCircle(center, radius, axis, color) {}
//     DrawSegment(p1, p2, color) {}
//     DrawTransform(xf) {}
//     DrawPoint(p, size, color) {}
// }
