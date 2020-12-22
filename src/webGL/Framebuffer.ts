import {Renderer} from "./Renderer";

export class Framebuffer {
    readonly rndr: Renderer;

    public constructor(rndr: Renderer) {
        this.rndr = rndr;
    }
}