export class Shader extends WebGLShader {
    public static create(context: WebGLRenderingContext, type: GLenum, source: string): Shader | null {
        let shdr: Shader | null = context.createShader(type);
        if(shdr === null) return null;

        context.shaderSource(shdr, source);
        context.compileShader(shdr);
        if(context.getShaderParameter(shdr, context.COMPILE_STATUS)) {
            return shdr;
        } else {
            console.log("WebGL " + (type === WebGLRenderingContext.FRAGMENT_SHADER ? "Fragment" : "Vertex") + " Shader:\n" + context.getShaderInfoLog(shdr));
            context.deleteShader(shdr);
            return null;
        }
    }
}

export type BindingLocations = [number, string][];

export class Program extends WebGLProgram {
    public static create(context: WebGLRenderingContext, vtxShdr: Shader, frgShdr: string, bindings?: BindingLocations): Program | null;
    public static create(context: WebGLRenderingContext, vtxShdr: string, frgShdr: string, bindings?: BindingLocations): Program | null;
    public static create(context: WebGLRenderingContext, vtxShdr: Shader | string, frgShdr: string, bindings?: BindingLocations): Program | null {
        let vshdr = typeof(vtxShdr) === "string" ? Shader.create(context, context.VERTEX_SHADER, vtxShdr) : vtxShdr;
        let fshdr = Shader.create(context, context.FRAGMENT_SHADER, frgShdr);
        let prog: Program | null = context.createProgram();

        if(prog === null || vshdr === null || fshdr === null) return null;

        if(bindings) bindings.forEach(e => context.bindAttribLocation(prog, e[0], e[1]));

        context.attachShader(prog, vshdr);
        context.attachShader(prog, fshdr);
        context.linkProgram(prog);
        if(context.getProgramParameter(prog, context.LINK_STATUS)) {
            context.deleteShader(vshdr);
            context.deleteShader(fshdr);
            return prog;
        } else {
            console.log("WebGL Program:\n" + context.getProgramInfoLog(prog));
            context.deleteProgram(prog);
            context.deleteShader(vshdr);
            context.deleteShader(fshdr);
            return null;
        }
    }
}
