import {clamp} from "../maths/functions";

enum Viewport {
    X,
    Y,
    WIDTH,
    HEIGHT,
}

export default class Renderer {
    private el: HTMLCanvasElement;
    private gl: WebGLRenderingContext;
    private viewport: Int32Array;
    readonly DPR: number;

    private lastMousePos = new Float32Array(2);

    public constructor(el: HTMLCanvasElement) {
        this.el = el;
        this.gl = el.getContext("webgl") as WebGLRenderingContext;
        if(!this.gl) throw("Failed to construct WebGL Rendering Context");

        this.viewport = this.gl.getParameter(this.gl.VIEWPORT);
        this.DPR = window.devicePixelRatio;
        console.log("viewport:", this.viewport, "devicePixelRatio:", this.DPR);

        if(!this.initialise()) {
            throw("Failed to initialise WebGL Renderer")
        }
    }

    public initialise(): boolean {
        const gl = this.gl;

        this.el.addEventListener("mousemove", this.onMouseMove);

        gl.clearColor(0., 1., 0., 1.);
        gl.clear(gl.COLOR_BUFFER_BIT);

        return gl.getError() === gl.NO_ERROR;
    }

    public unload(): boolean {
        console.log("CLEANUP");
        return true;
    }

    // Note: We flip the coordinate space to the default GL space, origin bottom-left
    public onMouseMove = (ev: MouseEvent): void => {
        const x = ev.x - this.el.offsetLeft;
        const y = this.viewport[Viewport.HEIGHT] - (ev.y - this.el.offsetTop);
        this.lastMousePos.set([
            clamp(devicePixelRatio*x, 0, this.viewport[Viewport.WIDTH]),
            clamp(devicePixelRatio*y, 0, this.viewport[Viewport.HEIGHT]),
        ]);
        console.log(this.lastMousePos);
    };


}