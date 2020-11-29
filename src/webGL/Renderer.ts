/*
These extensions will be preloaded in the Renderer on initialisation
 */
const preload = [
    "ANGLE_instanced_arrays",
    "EXT_frag_depth",
    "OES_standard_derivatives",
    "OES_texture_float",
    "OES_texture_half_float",
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
        this.gl = el.getContext("webgl") as WebGLRenderingContext;
        if(!this.gl) throw("Failed to construct WebGL Rendering Context");

        this.availExt = this.gl.getSupportedExtensions();
        this.loadedExt = new Array<any>(this.availExt.length);
        this.loadedExt.fill(null);

        const extLoad = preload.concat(extReq);

        for(let i = 0; i !== extLoad.length; ++i) {
            const idx = this.availExt.indexOf(extLoad[i]);
            if(idx === -1) {
                console.log("Unsupported extension requested:", extLoad[i]);
                continue;
            }
            this.loadedExt[idx] = this.gl.getExtension(extLoad[i]);
        }

        console.log("Loaded Extensions:", this.loadedExt.map((v, i) => v ? this.availExt[i] : null));
    }

    public getElement(): HTMLCanvasElement {
        return this.el;
    }

    public getViewport(): Int32Array {
        return this.viewport;
    }

    public setViewport(x: number, y: number, width: number, height: number): void {
        this.viewport.set([x, y, width, height]);
        this.gl.viewport(x, y, width, height);
    }

    public getDPR(): number {
        return this.DPR;
    }


}
