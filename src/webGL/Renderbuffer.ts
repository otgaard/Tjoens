import {Renderer} from "./Renderer";

export class Renderbuffer {
    readonly rndr: Renderer;
    private gl: WebGLRenderingContext;
    private resource: WebGLRenderbuffer;
    private width: number;
    private height: number;
    private format: GLenum;

    public constructor(rndr: Renderer, width: number, height: number, format: GLenum=WebGLRenderingContext.RGBA) {
        this.rndr = rndr;
        this.width = width;
        this.height = height;
        this.format = format;
    }

    public initialise(realloc: boolean=false): boolean {
        this.gl = this.rndr.getContext();

        const depthExt = this.rndr.getExtension("WEBGL_depth_texture");
        const colorExt = this.rndr.getExtension("WEBGL_color_buffer_float");
        const hasFloatTex = this.rndr.getExtension("OES_texture_float");

        if(this.format === this.gl.DEPTH_COMPONENT16 || this.format === this.gl.DEPTH_COMPONENT ||
            this.format === this.gl.DEPTH_STENCIL && !depthExt) {
            console.error("WEBGL_depth_texture extension not available");
            return false;
        }

        if(colorExt && (this.format === colorExt.RGBA32F_EXT || this.format === colorExt.RGB32F_EXT) && !hasFloatTex) {
            console.error("WEBGL_color_buffer_float or OES_texture_float extensions not available");
            return false;
        }

        if(this.resource && realloc) {
            this.gl.deleteRenderbuffer(this.resource);
            this.resource = null;
        }
        if(!this.resource) this.resource = this.gl.createRenderbuffer();
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.resource);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.format, this.width, this.height);
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);

        return this.gl.getError() === this.gl.NO_ERROR;
    }
}