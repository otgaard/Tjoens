import {FFTChannels, makeContext, Module, ModuleContext, ModuleValue} from "./Module";
import {Program} from "../webGL/GL";
import {Texture} from "../webGL/Texture";
import {Renderer} from "../webGL/Renderer";
import {Framebuffer, TargetOutput} from "../webGL/Framebuffer";

const simShdrPass = `
precision highp float;
varying vec2 texcoord;
uniform sampler2D inputTex;
void main() {
    gl_FragColor = vec4(int(texcoord.x < .5), int(texcoord.y < .5), 0., 1.);
}
`;

const fragShdrText = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
varying vec2 texcoord;
uniform sampler2D checkerTex;
void main() {
    gl_FragColor = texture2D(checkerTex, texcoord);
}
`;

const checkerData = new Uint8Array([
    0, 0, 0, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 0, 0, 0, 255,
]);

export default class Particles implements Module {
    rndr: Renderer;
    gl: WebGLRenderingContext = null;
    ctx: ModuleContext = null;
    shdrProg: WebGLProgram = null;
    simProg: WebGLProgram = null;
    readonly name = "Particles";

    private posLoc = -1;
    private checker: Texture;
    private checkerTexLoc: WebGLUniformLocation;

    private framebuffer: Framebuffer;

    public initialise(rndr: Renderer, vtxShdr: WebGLShader): ModuleContext | null {
        this.rndr = rndr;
        const gl = rndr.getContext();
        this.gl = gl;

        this.ctx = makeContext(128, 64, 30, FFTChannels.ALL);
        this.ctx.delay = 3./60.;
        this.shdrProg = Program.create(gl, vtxShdr, fragShdrText);
        if(!this.shdrProg || !this.ctx.sampleTex.initialise(gl)) return null;

        this.simProg = Program.create(gl, vtxShdr, simShdrPass);
        if(!this.simProg) {
            console.log("Sim shader compile failed");
            return null;
        }

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

        this.checker = new Texture(rndr, 2, 2, gl.RGBA, gl.UNSIGNED_BYTE);
        this.checker.initialise(checkerData);

        this.framebuffer = new Framebuffer(
            this.rndr,
            TargetOutput.TO_COLOUR_TEXTURE | TargetOutput.TO_DEPTH_NONE,
        );
        if(!this.framebuffer.initialise()) {
            console.error("failed to initialise framebuffer");
            return null;
        } else {
            console.log("Initialised Framebuffer");
        }

        // See if it's working
        this.framebuffer.bind();
        this.gl.enableVertexAttribArray(this.posLoc);
        this.gl.vertexAttribPointer(this.posLoc, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.useProgram(this.simProg);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.gl.useProgram(null);
        this.framebuffer.release();

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

        this.gl.enableVertexAttribArray(this.posLoc);
        this.gl.vertexAttribPointer(this.posLoc, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.useProgram(this.shdrProg);
        //this.ctx.sampleTex.bind();
        this.checker.bind(0);
        (this.framebuffer.getColourTarget(0) as Texture).bind(0);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        (this.framebuffer.getColourTarget(0) as Texture).bind(0);
        this.checker.release(0);
        //this.ctx.sampleTex.release();
        this.gl.useProgram(null);
    }
}