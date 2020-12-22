import {FFTChannels, makeContext, Module, ModuleContext, ModuleValue} from "./Module";
import {Program} from "../webGL/GL";
import {Texture} from "../webGL/Texture";
import {Renderer} from "../webGL/Renderer";

const fragShdrText = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
varying vec2 texcoord;
uniform sampler2D checkerTex;
void main() {
    gl_FragColor = texture2D(checkerTex, texcoord);
}
`;

const checkerData = [
    0, 0, 0, 255, 255, 255,
    255, 255, 255, 0, 0, 0
];

export default class Particles implements Module {
    rndr: Renderer;
    gl: WebGLRenderingContext = null;
    ctx: ModuleContext = null;
    shdrProg: WebGLProgram = null;
    readonly name = "Particles";

    private posLoc = -1;
    private checker: Texture;
    private checkerTexLoc: WebGLUniformLocation;

    public initialise(rndr: Renderer, vtxShdr: WebGLShader): ModuleContext | null {
        this.rndr = rndr;
        const gl = rndr.getContext();
        this.gl = gl;

        this.ctx = makeContext(128, 64, 30, FFTChannels.ALL);
        this.ctx.delay = 3./60.;
        this.shdrProg = Program.create(gl, vtxShdr, fragShdrText);
        if(!this.shdrProg || !this.ctx.sampleTex.initialise(gl)) return null;

        gl.useProgram(this.shdrProg);

        this.posLoc = gl.getAttribLocation(this.shdrProg, "position");
        if(this.posLoc !== 0) return null;
        this.checkerTexLoc = gl.getUniformLocation(this.shdrProg, "checkerTex");
        this.gl.uniform1i(this.checkerTexLoc, 0);

        gl.useProgram(null);
        if(gl.getError() !== gl.NO_ERROR) {
            this.ctx.sampleTex.destroy();
            return null;
        }

        this.checker = new Texture(rndr, 2, 2, gl.RGB, gl.UNSIGNED_BYTE);
        this.checker.initialise(new Uint8Array(checkerData));

        return this.ctx;
    }

    public destroy(): void {
        if(this.ctx) this.ctx.sampleTex.release();
    }

    public update(dt: number): void {
        (dt);
        return;
    }

    public updateContext(value: ModuleValue) {
        (value);
    }

    public analysis(): void {

    }

    public draw(): void {
        if(!this.gl || !this.ctx) return;

        this.gl.clearColor(1., 0., 0., 1.);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.enableVertexAttribArray(this.posLoc);
        this.gl.vertexAttribPointer(this.posLoc, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.useProgram(this.shdrProg);
        //this.ctx.sampleTex.bind();
        this.checker.bind(0);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.checker.release(0);
        //this.ctx.sampleTex.release();
        this.gl.useProgram(null);

        console.log(this.gl.getError());
    }
}