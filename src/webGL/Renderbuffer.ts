import {Renderer} from "./Renderer";

export class Renderbuffer {
    readonly rndr: Renderer;
    private gl: WebGL2RenderingContext;
    private resource: WebGLRenderbuffer;
    private width: number;
    private height: number;
    private format: GLenum;

    public constructor(rndr: Renderer, width: number, height: number, format: GLenum=WebGL2RenderingContext.RGBA) {
        this.rndr = rndr;
        this.width = width;
        this.height = height;
        this.format = format;
    }

    public getResource(): WebGLRenderbuffer {
        return this.resource;
    }

    public getFormat(): GLenum {
        return this.format;
    }

    public initialise(realloc: boolean=false): boolean {
        this.gl = this.rndr.getContext();

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

    public bind() {
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.resource);
    }

    public release() {
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
    }
}