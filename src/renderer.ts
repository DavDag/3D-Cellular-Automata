import { degrees, radians, Vector3, Matrix4 } from "@math.gl/core";
import { Simulation } from "./simulation";
import { CreateProgram, CreateShader } from "./webgl/shader";

const cubeVertexSrc = `#version 300 es
in vec3 vPos;
uniform mat4 uMat;
uniform vec3 uCol;
void main() {
    gl_Position = uMat * vec4(vPos, 1);
}
`;
 
const cubeFragmentSrc = `#version 300 es
precision highp float;
uniform vec3 uCol;
out vec4 oCol;
void main() {
    oCol = vec4(uCol, 1);
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
}

export class Renderer {

    private ctx: WebGL2RenderingContext;
    private cube: WebGLObj;
    private cubeBounds: WebGLObj;

    constructor(ctx: WebGL2RenderingContext) {
        this.ctx = ctx;
        this.cube = new WebGLObj();
        this.cube.program = CreateProgram(
            ctx,
            CreateShader(ctx, cubeVertexSrc, ctx.VERTEX_SHADER),
            CreateShader(ctx, cubeFragmentSrc, ctx.FRAGMENT_SHADER)
        );
        this.cube.uniforms.uMat = ctx.getUniformLocation(this.cube.program, "uMat");
        this.cube.uniforms.uCol = ctx.getUniformLocation(this.cube.program, "uCol");
        this.cubeBounds = new WebGLObj();
        this.cubeBounds.program = CreateProgram(
            ctx,
            CreateShader(ctx, cubeBoundsVertexSrc, ctx.VERTEX_SHADER),
            CreateShader(ctx, cubeBoundsFragmentSrc, ctx.FRAGMENT_SHADER)
        );
        this.cubeBounds.uniforms.uMat = ctx.getUniformLocation(this.cubeBounds.program, "uMat");
        this.cubeBounds.uniforms.uCol = ctx.getUniformLocation(this.cubeBounds.program, "uCol");
        // CUBE
        this.cube.vao = ctx.createVertexArray();
        ctx.bindVertexArray(this.cube.vao);
        const cubePosLoc = ctx.getAttribLocation(this.cube.program, "vPos");
        const cubePosBuff = ctx.createBuffer();
        ctx.bindBuffer(ctx.ARRAY_BUFFER, cubePosBuff);
        const cubePositions = [
            -0.5,-0.5, 0.5, // bl
            -0.5, 0.5, 0.5, // tl
             0.5,-0.5, 0.5, // br
             0.5, 0.5, 0.5, // tr
            ///////////////
            -0.5,-0.5,-0.5, // bl
            -0.5, 0.5,-0.5, // tl
             0.5,-0.5,-0.5, // br
             0.5, 0.5,-0.5, // tr
        ];
        ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(cubePositions), ctx.STATIC_DRAW);
        ctx.enableVertexAttribArray(cubePosLoc);
        ctx.vertexAttribPointer(cubePosLoc, 3, ctx.FLOAT, false, 0, 0);
        const cubeIndBuff = ctx.createBuffer();
        const cubeIndices = [
             0, 1, 2, 2, 3, 1, // front
             4, 5, 6, 6, 7, 5, // back
             1, 3, 5, 5, 7, 3, // top
             0, 2, 4, 4, 6, 2, // bottom
             4, 5, 1, 1, 0, 4, // left
             6, 7, 3, 3, 2, 6, // right
        ];
        ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, cubeIndBuff);
        ctx.bufferData(ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), ctx.STATIC_DRAW);
        ctx.bindVertexArray(null);
        this.cube.count = cubeIndices.length;
        // BOUNDS
        this.cubeBounds.vao = ctx.createVertexArray();
        ctx.bindVertexArray(this.cubeBounds.vao);
        const cubeBoundsPosLoc = ctx.getAttribLocation(this.cubeBounds.program, "vPos");
        const cubeBoundsPosBuff = ctx.createBuffer();
        ctx.bindBuffer(ctx.ARRAY_BUFFER, cubeBoundsPosBuff);
        const cubeBoundsPositions = [
            -0.5,-0.5, 0.5, // bl
            -0.5, 0.5, 0.5, // tl
             0.5,-0.5, 0.5, // br
             0.5, 0.5, 0.5, // tr
            ///////////////
            -0.5,-0.5,-0.5, // bl
            -0.5, 0.5,-0.5, // tl
             0.5,-0.5,-0.5, // br
             0.5, 0.5,-0.5, // tr
        ];
        ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(cubeBoundsPositions), ctx.STATIC_DRAW);
        ctx.enableVertexAttribArray(cubeBoundsPosLoc);
        ctx.vertexAttribPointer(cubeBoundsPosLoc, 3, ctx.FLOAT, false, 0, 0);
        const cubeBoundsIndBuff = ctx.createBuffer();
        const cubeBoundsIndices = [
            0, 1, 1, 3, 2, 3, 2, 0, // front
            4, 5, 5, 7, 6, 7, 6, 4, // back
            1, 5, 3, 7, // top
            0, 4, 2, 6, // bottom
        ];
        ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, cubeBoundsIndBuff);
        ctx.bufferData(ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeBoundsIndices), ctx.STATIC_DRAW);
        ctx.bindVertexArray(null);
        this.cubeBounds.count = cubeBoundsIndices.length;
    }

    updateViewport(w: number, h: number) {
        const ctx = this.ctx;
        ctx.viewport(0, 0, w, h);
    }

    totMs = 0;
    render(dtMs: number, simulation: Simulation) {
        const ctx = this.ctx;
        this.totMs += dtMs;
        //
        ctx.clearColor(0, 0, 0, 0);
        ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);
        ctx.enable(ctx.DEPTH_TEST);
        //
        const perspMat = new Matrix4().perspective({fovy: radians(45), aspect: 1, near: 1, far: 200});
        const viewMat = new Matrix4().lookAt({eye: new Vector3(0, 2, 4), center: new Vector3(0, -0.5, -1), up: new Vector3(0, 1, 0)});
        const cubeBoundsMat = new Matrix4(Matrix4.IDENTITY).rotateY(radians(45 * this.totMs));
        //
        const data = simulation.data();
        const cellSize = 1 / data.size;
        data.world.forEach((cell) => {
            const mat = new Matrix4(Matrix4.IDENTITY)
                .multiplyRight(perspMat)
                .multiplyRight(viewMat)
                .multiplyRight(cubeBoundsMat)
                .translate(new Vector3(-0.5, -0.5, -0.5)) // move center to back-bottom-left of "cubeBounds"
                .scale(cellSize) // size of single cell
                .translate(new Vector3(0.5, 0.5, 0.5)) // move center to back-bottom-left of "itself"
                .translate(cell.pos)
                ;
            ctx.useProgram(this.cube.program);
            ctx.uniformMatrix4fv(this.cube.uniforms.uMat, false, mat);
            ctx.uniform3fv(this.cube.uniforms.uCol, cell.col);
            ctx.bindVertexArray(this.cube.vao);
            ctx.drawElements(ctx.TRIANGLES, this.cube.count, ctx.UNSIGNED_SHORT, 0);
            ctx.bindVertexArray(null);
            ctx.useProgram(null);
        });
        //
        const mat = new Matrix4(Matrix4.IDENTITY)
            .multiplyRight(perspMat)
            .multiplyRight(viewMat)
            .multiplyRight(cubeBoundsMat);
        ctx.useProgram(this.cubeBounds.program);
        ctx.uniformMatrix4fv(this.cubeBounds.uniforms.uMat, false, mat);
        ctx.uniform3fv(this.cubeBounds.uniforms.uCol, new Vector3(1, 1, 1));
        ctx.bindVertexArray(this.cubeBounds.vao);
        ctx.drawElements(ctx.LINES, this.cubeBounds.count, ctx.UNSIGNED_SHORT, 0);
        ctx.bindVertexArray(null);
        ctx.useProgram(null);
        //
    }

}
