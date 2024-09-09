import GLBench from "gl-bench";
import { glMatrix, vec3, mat4 } from "gl-matrix";
import { Simulation } from "./simulation";
import { CreateProgram, CreateShader } from "./webgl/shader";

const cubeVertexSrc = `#version 300 es
in vec3 vPos;
in vec3 vCol;
in mat4 vModelMat;
uniform mat4 uMat;
out vec3 fCol;
void main() {
    fCol = vCol;
    gl_Position = uMat * vModelMat * vec4(vPos, 1);
}
`;
 
const cubeFragmentSrc = `#version 300 es
precision highp float;
in vec3 fCol;
out vec4 oCol;
void main() {
    oCol = vec4(fCol, 1);
}
`;

const cubeBoundsVertexSrc = `#version 300 es
in vec3 vPos;
uniform mat4 uMat;
uniform vec3 uCol;
void main() {
    gl_Position = uMat * vec4(vPos, 1);
}
`;
 
const cubeBoundsFragmentSrc = `#version 300 es
precision highp float;
uniform vec3 uCol;
out vec4 oCol;
void main() {
    oCol = vec4(uCol, 1);
}
`;

class WebGLObj {
    vao: WebGLVertexArrayObject;
    program: WebGLProgram;
    uniforms: {[key: string]: WebGLUniformLocation} = {};
    count: number;
    buffers: {[key: string]: WebGLBuffer} = {};
    data: {[key: string]: Float32Array} = {};
    locations: {[key: string]: number} = {};
}

export class Renderer {

    private ctx: WebGL2RenderingContext;
    private cube: WebGLObj;
    private cubeBounds: WebGLObj;
    //
    private totZoom: number;
    private totSec: number;
    
    constructor(ctx: WebGL2RenderingContext, simSize: number) {
        this.ctx = ctx;
        this.totZoom = 1;
        this.totSec = 0;
        const maxConcurrentInstances = simSize * simSize * simSize;
        // CUBE
        {
            this.cube = new WebGLObj();
            this.cube.program = CreateProgram(
                ctx,
                CreateShader(ctx, cubeVertexSrc, ctx.VERTEX_SHADER),
                CreateShader(ctx, cubeFragmentSrc, ctx.FRAGMENT_SHADER)
            );
            this.cube.uniforms.uMat = ctx.getUniformLocation(this.cube.program, "uMat");
            this.cube.vao = ctx.createVertexArray();
            ctx.bindVertexArray(this.cube.vao);
            this.cube.locations.pos = ctx.getAttribLocation(this.cube.program, "vPos");
            this.cube.buffers.pos = ctx.createBuffer();
            this.cube.buffers.pos = this.cube.buffers.pos;
            ctx.bindBuffer(ctx.ARRAY_BUFFER, this.cube.buffers.pos);
            const cubePositions = [
                -0.5,-0.5, 0.5, // bl
                -0.5, 0.5, 0.5, // tl
                 0.5,-0.5, 0.5, // br
                 0.5, 0.5, 0.5, // tr
                /////////////////////
                -0.5,-0.5,-0.5, // bl
                -0.5, 0.5,-0.5, // tl
                 0.5,-0.5,-0.5, // br
                 0.5, 0.5,-0.5, // tr
            ];
            ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(cubePositions), ctx.STATIC_DRAW);
            ctx.enableVertexAttribArray(this.cube.locations.pos);
            ctx.vertexAttribPointer(this.cube.locations.pos, 3, ctx.FLOAT, false, 0, 0);
            this.cube.locations.col = ctx.getAttribLocation(this.cube.program, "vCol");
            this.cube.buffers.col = ctx.createBuffer();
            this.cube.data.col = new Float32Array(maxConcurrentInstances * 3);
            ctx.bindBuffer(ctx.ARRAY_BUFFER, this.cube.buffers.col);
            ctx.bufferData(ctx.ARRAY_BUFFER, maxConcurrentInstances * 3 * 4, ctx.DYNAMIC_DRAW);
            ctx.bufferSubData(ctx.ARRAY_BUFFER, 0, this.cube.data.col);
            ctx.enableVertexAttribArray(this.cube.locations.col);
            ctx.vertexAttribPointer(this.cube.locations.col, 3, ctx.FLOAT, false, 0, 0);
            ctx.vertexAttribDivisor(this.cube.locations.col, 1);
            this.cube.locations.mat = ctx.getAttribLocation(this.cube.program, "vModelMat");
            this.cube.buffers.mat = ctx.createBuffer();
            this.cube.data.mat = new Float32Array(maxConcurrentInstances * 16);
            ctx.bindBuffer(ctx.ARRAY_BUFFER, this.cube.buffers.mat);
            ctx.bufferData(ctx.ARRAY_BUFFER, maxConcurrentInstances * 16 * 4, ctx.DYNAMIC_DRAW);
            ctx.bufferSubData(ctx.ARRAY_BUFFER, 0, this.cube.data.mat);
            for (let i = 0; i < 4; ++i) {
                const loc = this.cube.locations.mat + i;
                ctx.enableVertexAttribArray(loc);
                ctx.vertexAttribPointer(loc, 4, ctx.FLOAT, false, 4 * 16, i * 16);
                ctx.vertexAttribDivisor(loc, 1);
            }
            this.cube.buffers.ind = ctx.createBuffer();
            const cubeIndices = [
                0, 1, 2, 2, 3, 1, // front
                4, 5, 6, 6, 7, 5, // back
                1, 3, 5, 5, 7, 3, // top
                0, 2, 4, 4, 6, 2, // bottom
                4, 5, 1, 1, 0, 4, // left
                6, 7, 3, 3, 2, 6, // right
            ];
            ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, this.cube.buffers.ind);
            ctx.bufferData(ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), ctx.STATIC_DRAW);
            ctx.bindVertexArray(null);
            this.cube.count = cubeIndices.length;
        }
        // CUBE BOUNDS
        {
            this.cubeBounds = new WebGLObj();
            this.cubeBounds.program = CreateProgram(
                ctx,
                CreateShader(ctx, cubeBoundsVertexSrc, ctx.VERTEX_SHADER),
                CreateShader(ctx, cubeBoundsFragmentSrc, ctx.FRAGMENT_SHADER)
            );
            this.cubeBounds.uniforms.uMat = ctx.getUniformLocation(this.cubeBounds.program, "uMat");
            this.cubeBounds.uniforms.uCol = ctx.getUniformLocation(this.cubeBounds.program, "uCol");
            this.cubeBounds.vao = ctx.createVertexArray();
            ctx.bindVertexArray(this.cubeBounds.vao);
            this.cubeBounds.locations.pos = ctx.getAttribLocation(this.cubeBounds.program, "vPos");
            this.cubeBounds.buffers.pos = ctx.createBuffer();
            ctx.bindBuffer(ctx.ARRAY_BUFFER, this.cubeBounds.buffers.pos);
            const cubeBoundsPositions = [
                -0.5,-0.5, 0.5, // bl
                -0.5, 0.5, 0.5, // tl
                 0.5,-0.5, 0.5, // br
                 0.5, 0.5, 0.5, // tr
                /////////////////////
                -0.5,-0.5,-0.5, // bl
                -0.5, 0.5,-0.5, // tl
                 0.5,-0.5,-0.5, // br
                 0.5, 0.5,-0.5, // tr
            ];
            ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(cubeBoundsPositions), ctx.STATIC_DRAW);
            ctx.enableVertexAttribArray(this.cubeBounds.locations.pos);
            ctx.vertexAttribPointer(this.cubeBounds.locations.pos, 3, ctx.FLOAT, false, 0, 0);
            this.cubeBounds.buffers.ind = ctx.createBuffer();
            const cubeBoundsIndices = [
                0, 1, 1, 3, 2, 3, 2, 0, // front
                4, 5, 5, 7, 6, 7, 6, 4, // back
                1, 5, 3, 7, // top
                0, 4, 2, 6, // bottom
            ];
            ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, this.cubeBounds.buffers.ind);
            ctx.bufferData(ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeBoundsIndices), ctx.STATIC_DRAW);
            ctx.bindVertexArray(null);
            this.cubeBounds.count = cubeBoundsIndices.length;
        }
    }

    updateViewport(w: number, h: number) {
        const ctx = this.ctx;
        ctx.viewport(0, 0, w, h);
    }

    zoom(delta: number) {
        this.totZoom += delta;
        this.totZoom = Math.min(Math.max(this.totZoom, 0.25), 2.0);
    }

    render(dtSec: number, simulation: Simulation, bench: GLBench) {
        const ctx = this.ctx;
        this.totSec += dtSec;
        //
        ctx.clearColor(0, 0, 0, 1);
        ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);
        ctx.enable(ctx.DEPTH_TEST);
        //
        const aspectRatio = ctx.drawingBufferWidth / ctx.drawingBufferHeight;
        const perspMat = mat4.create();
        mat4.perspective(perspMat, glMatrix.toRadian(45), aspectRatio, 0.1, 50);
        const viewMat = mat4.create();
        mat4.lookAt(viewMat, vec3.fromValues(0, 1 * this.totZoom, 2 * this.totZoom), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
        const cubeBoundsMat = mat4.create();
        mat4.rotateY(cubeBoundsMat, cubeBoundsMat, glMatrix.toRadian(15 * this.totSec));
        //
        //bench.begin("Cubes");
        {
            //bench.begin("Data");
            const data = simulation.data();
            //bench.end("Data");
            //
            const cellSize = 1 / data.size;
            const mat = mat4.create();
            mat4.multiply(mat, mat, perspMat);
            mat4.multiply(mat, mat, viewMat);
            mat4.multiply(mat, mat, cubeBoundsMat);
            mat4.translate(mat, mat, vec3.fromValues(-0.5, -0.5, -0.5)); // move center to back-bottom-left of "cubeBounds"
            mat4.scale(mat, mat, vec3.fromValues(cellSize, cellSize, cellSize));
            mat4.translate(mat, mat, vec3.fromValues(0.5, 0.5, 0.5)); // move center to back-bottom-left of "itself"
            //
            //bench.begin("World exploration");
            let i = 0;
            const pos = vec3.create();
            const col = vec3.create();
            for (let x = 0; x < data.size; ++x)
                for (let y = 0; y < data.size; ++y)
                    for (let z = 0; z < data.size; ++z) {
                        const cell = data.world[x][y][z];
                        if (cell.state != 0) {
                            vec3.set(pos, x, y, z);
                            const matView = new Float32Array(this.cube.data.mat.buffer, 4 * 16 * i, 16);
                            const colView = new Float32Array(this.cube.data.col.buffer, 4 * 3 * i, 3);
                            vec3.copy(colView, simulation.colorRule(cell, col));
                            mat4.identity(matView);
                            mat4.translate(matView, matView, pos);
                            i++;
                        }
                    }
            //bench.end("World exploration");
            if (i != 0) {
                //bench.begin("Buffer upload");
                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.cube.buffers.mat);
                ctx.bufferSubData(ctx.ARRAY_BUFFER, 0, this.cube.data.mat, 0, (i) * 16);
                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.cube.buffers.col);
                ctx.bufferSubData(ctx.ARRAY_BUFFER, 0, this.cube.data.col, 0, (i) * 3);
                //bench.end("Buffer upload");
                //
                //bench.begin("Draw");
                ctx.useProgram(this.cube.program);
                ctx.uniformMatrix4fv(this.cube.uniforms.uMat, false, mat);
                ctx.bindVertexArray(this.cube.vao);
                ctx.drawElementsInstanced(ctx.TRIANGLES, this.cube.count, ctx.UNSIGNED_SHORT, 0, i);
                ctx.bindVertexArray(null);
                ctx.useProgram(null);
                //bench.end("Draw");
            }
        }
        //bench.end("Cubes");
        //
        //bench.begin("Bounds");
        {
            const mat = mat4.create();
            mat4.multiply(mat, mat, perspMat);
            mat4.multiply(mat, mat, viewMat);
            mat4.multiply(mat, mat, cubeBoundsMat);
            ctx.useProgram(this.cubeBounds.program);
            ctx.uniformMatrix4fv(this.cubeBounds.uniforms.uMat, false, mat);
            ctx.uniform3fv(this.cubeBounds.uniforms.uCol, vec3.fromValues(1, 1, 1));
            ctx.bindVertexArray(this.cubeBounds.vao);
            ctx.drawElements(ctx.LINES, this.cubeBounds.count, ctx.UNSIGNED_SHORT, 0);
            ctx.bindVertexArray(null);
            ctx.useProgram(null);
        }
        //bench.end("Bounds");
        //
    }

}
