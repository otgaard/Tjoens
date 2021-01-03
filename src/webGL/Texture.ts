import {Renderer} from "./Renderer";

const COORD_S = 0;
const COORD_T = 1;

const MIN_FILTER = 0;
const MAG_FILTER = 1;

export class Texture {
    readonly rndr: Renderer;
    private gl: WebGL2RenderingContext;

    private resource: WebGLTexture;
    private width: number;
    private height: number;
    private format: GLenum;
    private dataType: GLenum;
    private internalFormat: GLenum;
    private mipmap: boolean = false;
    private wrapMode: [GLenum, GLenum] = [
        WebGL2RenderingContext.CLAMP_TO_EDGE,
        WebGL2RenderingContext.CLAMP_TO_EDGE
    ];
    private filter: [GLenum, GLenum] = [
        WebGL2RenderingContext.NEAREST,
        WebGL2RenderingContext.NEAREST
    ];

    public constructor(
        rndr: Renderer,
        width: number,
        height: number,
        format: GLenum=WebGL2RenderingContext.RGBA,
        dataType: GLenum=WebGL2RenderingContext.UNSIGNED_BYTE,
        internalFormat?: GLenum
    ) {
        this.rndr = rndr;
        this.width = width;
        this.height = height;
        this.format = format;
        this.dataType = dataType;
        this.internalFormat = internalFormat || format;
    }

    public getResource(): WebGLTexture {
        return this.resource;
    }

    public getFormat(): GLenum {
        return this.format;
    }

    public setWrapModeS(value: GLenum, update: boolean=false, bind: boolean=true): void {
        this.wrapMode[COORD_S] = value;
        if(update) {
            if(bind) this.bind();
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.wrapMode[0]);
            if(bind) this.release();
        }
    }

    public setWrapModeT(value: GLenum, update: boolean=false, bind: boolean=true): void {
        this.wrapMode[COORD_T] = value;
        if(update) {
            if(bind) this.bind();
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.wrapMode[0]);
            if(bind) this.release();
        }
    }

    public setMinFilter(value: GLenum, update: boolean=false, bind: boolean=true): void {
        this.filter[MIN_FILTER] = value;
        if(update) {
            if(bind) this.bind();
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.filter[0]);
            if(bind) this.release();
        }
    }

    public setMagFilter(value: GLenum, update: boolean=false, bind: boolean=true): void {
        this.filter[MAG_FILTER] = value;
        if(update) {
            if(bind) this.bind();
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.filter[1]);
            if(bind) this.release();
        }
    }

    public initialise(data: ArrayBufferView=null, realloc: boolean=false): boolean {
        this.gl = this.rndr.getContext();

        if(this.resource && realloc) {
            this.gl.deleteTexture(this.resource);
            this.resource = null;
        }

        if(!this.resource) this.resource = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.resource);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.internalFormat, this.width, this.height, 0, this.format, this.dataType, data);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.wrapMode[COORD_S]);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.wrapMode[COORD_T]);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.filter[MIN_FILTER]);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.filter[MAG_FILTER]);

        if(this.mipmap) this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        return this.gl.getError() === this.gl.NO_ERROR;
    }

    public bind(unit: number=0) {
        this.gl.activeTexture(this.gl.TEXTURE0+unit);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.resource);
    }

    public release(unit: number=0) {
        this.gl.activeTexture(this.gl.TEXTURE0+unit);
        this.gl.bindTexture(this.gl.TEXTURE_2D,  null);
    }


}
