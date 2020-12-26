import {Renderer} from "./Renderer";
import {Renderbuffer} from "./Renderbuffer";
import {Texture} from "./Texture";
import {isSet} from "../maths/functions";

export type RenderTarget = Renderbuffer | Texture;

export enum TargetOutput {
    COLOUR_NONE = 1 << 0,
    COLOUR_TEXTURE = 1 << 1,
    COLOUR_RENDERBUFFER = 1 << 2,
    DEPTH_NONE = 1 << 3,
    DEPTH_TEXTURE = 1 << 4,
    DEPTH_RENDERBUFFER = 1 << 5,
}

export interface FramebufferConfig {
    width: number;
    height: number;
    count?: number;             // Number of Colour Buffers
    colourFormat?: GLenum;
    colourDatatype?: GLenum;
    depthFormat?: GLenum;
    depthDatatype?: GLenum;
}

export class Framebuffer {
    readonly rndr: Renderer;
    private gl: WebGLRenderingContext;

    private resource: WebGLFramebuffer;
    private conf: {
        width: number;
        height: number;
        count: number;
        colourFormat: GLenum;
        colourDatatype: GLenum;
        depthFormat: GLenum;
        depthDatatype: GLenum;
    }
    private colourTargets: RenderTarget[];
    private depthTarget: RenderTarget;

    private drawBufExt: WEBGL_draw_buffers;
    private colourExt: WEBGL_color_buffer_float;
    private depthExt: WEBGL_depth_texture;

    private targets: TargetOutput;
    private drawBuffers: GLenum[];

    public constructor(rndr: Renderer, targets: TargetOutput, conf?: FramebufferConfig) {
        this.rndr = rndr;
        this.resource = null;
        this.targets = targets;
        this.conf = {
            width: 0,
            height: 0,
            count: 0,
            colourFormat: null,
            colourDatatype: null,
            depthFormat: null,
            depthDatatype: null,
        };

        this.conf.width = conf ? conf.width : rndr.getViewport()[2];
        this.conf.height = conf ? conf.height : rndr.getViewport()[3];

        this.conf.count = (conf && conf.count) || 1;
        console.log("this.conf:", this.conf);

        const colourTex = isSet(targets, TargetOutput.COLOUR_TEXTURE);
        const colourBuf = isSet(targets, TargetOutput.COLOUR_RENDERBUFFER);

        if(!conf || !conf.colourFormat) {
            if(colourTex) this.conf.colourFormat = WebGLRenderingContext.RGBA;
            if(colourBuf) this.conf.colourFormat = WebGLRenderingContext.RGBA4;
        } else
            this.conf.colourFormat = isSet(targets, TargetOutput.COLOUR_NONE) ? null : conf.colourFormat;

        // Note that COMPONENT16 is used for renderbuffers, COMPONENT for texture
        const depthTex = isSet(targets, TargetOutput.DEPTH_TEXTURE);
        const depthBuf = isSet(targets, TargetOutput.DEPTH_RENDERBUFFER);

        if(!conf || !conf.colourDatatype) this.conf.colourDatatype = WebGLRenderingContext.UNSIGNED_BYTE;
        else this.conf.colourDatatype = conf.colourDatatype;

        if(!conf || !conf.depthFormat) {
            if(depthTex) this.conf.depthFormat = WebGLRenderingContext.DEPTH_COMPONENT;
            if(depthBuf) this.conf.depthFormat = WebGLRenderingContext.DEPTH_COMPONENT16;
        } else
            this.conf.depthFormat = !depthTex && !depthBuf ? null : conf.depthFormat;

        if(!conf || !conf.depthDatatype) this.conf.depthDatatype = WebGLRenderingContext.UNSIGNED_SHORT;
        else this.conf.depthDatatype = conf.depthDatatype;

        this.colourTargets = [];
    }

    public getResource(): WebGLFramebuffer {
        return this.resource;
    }

    public bind() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.resource);
        if(this.drawBuffers) this.drawBufExt.drawBuffersWEBGL(this.drawBuffers);
    }

    public release() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    public getColourTarget(index: number=0): RenderTarget {
        return this.colourTargets[index];
    }

    public getDepthTarget(): RenderTarget {
        return this.depthTarget;
    }

    /*
    If no targets are passed in, the Framebuffer will set up the appropriate targets based on the data set in the
    constructor.
    */

    public initialise(colourTargets?: RenderTarget[], depthTarget?: RenderTarget, realloc: boolean=false): boolean {
        this.gl = this.rndr.getContext();

        if(!this.resource) {
            this.depthExt = this.rndr.getExtension("WEBGL_depth_texture");
            this.colourExt = this.rndr.getExtension("WEBGL_color_buffer_float");
            this.drawBufExt = this.rndr.getExtension("WEBGL_draw_buffers");

            if(!this.drawBufExt && (colourTargets && colourTargets.length > 1 || this.conf.count > 1)) {
                console.error("Framebuffer requested draw buffers but extension not available");
                return false;
            }

            if(!this.depthExt && this.conf.depthFormat != null) {
                console.error("Depth Texture Extension not supported");
                return false;
            }

            if(!this.colourExt && this.conf.colourDatatype === this.gl.FLOAT) {
                console.error("Floating point render targets not supported");
                return false;
            }
        }

        if(this.resource && realloc) {
            this.gl.deleteFramebuffer(this.resource);
            this.resource = null;
        }

        if(!this.resource) this.resource = this.gl.createFramebuffer();

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.resource);

        if(colourTargets) {
            for(let i = 0; i !== colourTargets.length; ++i) {
                const att = this.drawBufExt ? this.drawBufExt.COLOR_ATTACHMENT0_WEBGL + i : this.gl.COLOR_ATTACHMENT0 + i;
                const res = colourTargets[i].getResource();

                if(colourTargets[i] instanceof Texture) {
                    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, att, this.gl.TEXTURE_2D, res, 0);
                } else if(colourTargets[i] instanceof Renderbuffer) {
                    this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, att, this.gl.RENDERBUFFER, res);
                }

                this.colourTargets.push(colourTargets[i]);
            }

            if(colourTargets.length > 1 && this.drawBufExt) {
                this.drawBuffers = [];
                for(let i = 0; i !== colourTargets.length; ++i) {
                    this.drawBuffers.push(this.drawBufExt.DRAW_BUFFER0_WEBGL+i);
                }
            }
        } else {
            // We set up a single colour buffer render target
            console.log("Initialising Colour Target");
            const att = this.drawBufExt ? this.drawBufExt.COLOR_ATTACHMENT0_WEBGL : this.gl.COLOR_ATTACHMENT0;

            if(isSet(this.targets, TargetOutput.COLOUR_TEXTURE)) {
                console.log("TEXTURE");
                const tex = new Texture(this.rndr, this.conf.width, this.conf.height, this.conf.colourFormat, this.gl.UNSIGNED_BYTE);
                if (!tex.initialise()) return false;
                this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, att, this.gl.TEXTURE_2D, tex.getResource(), 0);
                this.colourTargets.push(tex);
            } else if(isSet(this.targets, TargetOutput.COLOUR_RENDERBUFFER)) {
                console.log("RENDERBUFFER");
                const buf = new Renderbuffer(this.rndr, this.conf.width, this.conf.height, this.conf.colourFormat);
                if(!buf.initialise()) return false;
                this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, att, this.gl.RENDERBUFFER, buf.getResource());
                this.colourTargets.push(buf);
            } else {
                this.colourTargets = null;
            }
        }

        if(depthTarget) {
            const att = depthTarget.getFormat() === this.gl.DEPTH_STENCIL ? this.gl.DEPTH_STENCIL_ATTACHMENT : this.gl.DEPTH_ATTACHMENT;
            if(depthTarget instanceof Texture) {
                this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, att, this.gl.TEXTURE_2D, depthTarget.getResource(), 0);
            } else if(depthTarget instanceof Renderbuffer) {
                this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, att, this.gl.RENDERBUFFER, depthTarget.getResource());
            }
            this.depthTarget = depthTarget;
        } else {
            console.log("Initialising Depth Target");

            let dataType: GLenum;
            if(this.conf.depthFormat === this.gl.DEPTH_STENCIL) {
                dataType = this.depthExt.UNSIGNED_INT_24_8_WEBGL;
            } else if(this.conf.depthFormat === this.gl.DEPTH_COMPONENT) {
                dataType = this.gl.UNSIGNED_INT;
            } else if(this.conf.depthFormat === this.gl.DEPTH_COMPONENT16) {
                dataType = this.gl.UNSIGNED_SHORT;
            }

            const att = this.conf.depthFormat === this.gl.DEPTH_STENCIL ? this.gl.DEPTH_STENCIL_ATTACHMENT : this.gl.DEPTH_ATTACHMENT;
            if(isSet(this.targets, TargetOutput.DEPTH_TEXTURE)) {
                console.log("TEXTURE");
                const tex = new Texture(this.rndr, this.conf.width, this.conf.height, this.conf.depthFormat, dataType);
                if(!tex.initialise()) return false;
                this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, att, this.gl.TEXTURE_2D, tex.getResource(), 0);
                this.depthTarget = tex;
            } else if(isSet(this.targets, TargetOutput.DEPTH_RENDERBUFFER)) {
                console.log("RENDERBUFFER");
                const buf = new Renderbuffer(this.rndr, this.conf.width, this.conf.height, this.conf.depthFormat);
                if(!buf.initialise()) return false;
                this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, att, this.gl.RENDERBUFFER, buf.getResource());
                this.depthTarget = buf;
            } else {
                this.depthTarget = null;
            }
        }

        const err = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        return err === this.gl.FRAMEBUFFER_COMPLETE && this.gl.getError() === this.gl.NO_ERROR;
    }
}
