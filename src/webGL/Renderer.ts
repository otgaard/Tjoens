/*
These extensions will be preloaded in the Renderer on initialisation
 */

const preload = [
    "ANGLE_instanced_arrays",
    "EXT_blend_minmax",
    "EXT_frag_depth",
    "OES_standard_derivatives",
    "OES_texture_float",
    "OES_element_index_uint",
    "OES_texture_half_float",
    "OES_vertex_array_object",
    "WEBGL_color_buffer_float",
    "WEBGL_depth_texture",
    "WEBGL_draw_buffers",
    "EXT_texture_filter_anisotropic",
];

export class Renderer {
    public el: HTMLCanvasElement;
    public gl: WebGLRenderingContext;

    readonly availExt: Array<string>;
    private loadedExt: Array<any>;

    private viewport: Int32Array;
    private DPR: number;

    public constructor(el: HTMLCanvasElement, extReq?: Array<string>) {
        this.el = el;

        const options = {
            alpha: true,
            antialias: false,
            depth: true,
            stencil: false,
        };

        this.gl = el.getContext("webgl", options) as WebGLRenderingContext;
        if(!this.gl) throw("Failed to construct WebGL Rendering Context");

        this.DPR = window.devicePixelRatio;

        this.viewport = this.gl.getParameter(this.gl.VIEWPORT);
        console.log(this.gl, this.viewport);

        this.availExt = this.gl.getSupportedExtensions();
        this.loadedExt = new Array<any>(this.availExt.length);
        this.loadedExt.fill(null);

        const extLoad = extReq ? preload.concat(extReq) : preload;

        for(let i = 0; i !== extLoad.length; ++i) {
            const idx = this.availExt.indexOf(extLoad[i]);
            if(idx === -1) {
                console.log("Unsupported extension requested:", extLoad[i]);
                continue;
            }
            this.loadedExt[idx] = this.gl.getExtension(extLoad[i]);
        }
        console.log("Loaded Extensions:", this.loadedExt.map((v, i) => v ? this.availExt[i] : null));
        /* defaults
        this.gl.pixelStorei(this.gl.PACK_ALIGNMENT, 4);
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 4);
        */
    }

    public getElement(): HTMLCanvasElement {
        return this.el;
    }

    public getContext(): WebGLRenderingContext {
        return this.gl;
    }

    public getViewport(): Int32Array {
        return this.viewport;
    }

    public setViewport(x: number | Int32Array, y?: number, width?: number, height?: number): void {
        if(typeof x === "number") {
            this.viewport.set([x as number, y, width, height]);
            this.gl.viewport(x as number, y, width, height);
        } else {
            this.viewport.set(x as Int32Array);
            this.gl.viewport(x[0], x[1], x[2], x[3]);
        }
    }

    public getDPR(): number {
        return this.DPR;
    }

    public getExtension(name: string): any {
        const idx = this.availExt.indexOf(name);
        return idx === -1 ? null : this.loadedExt[idx];
    }
}
