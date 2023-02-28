
export function CreateShader(ctx: WebGL2RenderingContext, src: string, type: number): WebGLShader {
    const shader = ctx.createShader(type);
    ctx.shaderSource(shader, src);
    ctx.compileShader(shader);
    const success = ctx.getShaderParameter(shader, ctx.COMPILE_STATUS);
    if (!success) {
        const log = ctx.getShaderInfoLog(shader);
        throw `Unable to compile shader ${log}`;
    }
    return shader;
}

export function CreateProgram(ctx: WebGL2RenderingContext, vertex: WebGLShader, fragment: WebGLShader): WebGLProgram {
    const program = ctx.createProgram();
    ctx.attachShader(program, vertex);
    ctx.attachShader(program, fragment);
    ctx.linkProgram(program);
    const success = ctx.getProgramParameter(program, ctx.LINK_STATUS);
    if (!success) {
        const log = ctx.getProgramInfoLog(program);
        throw `Unable to link program ${log}`;
    }
    return program;
}
