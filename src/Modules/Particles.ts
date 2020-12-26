import {FFTChannels, makeContext, Module, ModuleContext, ModuleValue} from "./Module";
import {Renderer} from "../webGL/Renderer";
import {Framebuffer, TargetOutput} from "../webGL/Framebuffer";
import {Program} from "../webGL/GL";
import {mat4} from "../maths/Mat4";

const vertShdr = `
precision highp float;

attribute vec4 position;

uniform mat4 mvp;
    
void main() {
    gl_Position = mvp * position;
    gl_PointSize = 1.;
}   
`;

const fragShdr = `
precision highp float;

void main() {
    gl_FragColor = vec4(1., 1., 1., 1.);
}
`;

export default class Particles implements Module {
    rndr: Renderer;
    gl: WebGLRenderingContext = null;
    ctx: ModuleContext = null;
    readonly name = "Particles";

    vaoExt: OES_vertex_array_object;
    shdrProg: Program;

    frameCount: number = 2;
    vaos: WebGLVertexArrayObjectOES[];
    positions: WebGLBuffer[];
    frameBuffers: Framebuffer[];

    public setupBuffers(): boolean {
        const gl = this.gl;
        this.vaos = new Array<WebGLVertexArrayObjectOES>(this.frameCount);
        this.positions = new Array<WebGLBuffer>(this.frameCount);
        this.frameBuffers = new Array<Framebuffer>(this.frameCount);

        this.vaoExt = this.rndr.getExtension("OES_vertex_array_object");
        if(!this.vaoExt) return false;   // Should never happen, is default on all browsers

        // Use 4-element positions to align with texture copy
        const positions = new Float32Array(4*100*100);
        const scale = 1.;
        for(let i = 0; i !== 40000; i += 4) {
            positions[i] = scale * 2.*(Math.random() - .5);
            positions[i+1] = scale * 2.*(Math.random() - .5);
            positions[i+2] = scale * 2.*(Math.random() - .5);
            positions[i+3] = 1.;
        }

        console.log("positions", positions);

        for(let i = 0; i !== this.frameCount; ++i) {
            this.vaos[i] = this.vaoExt.createVertexArrayOES();
            this.vaoExt.bindVertexArrayOES(this.vaos[i]);
            this.positions[i] = this.gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positions[i]);
            gl.bufferData(this.gl.ARRAY_BUFFER, positions, gl.STREAM_DRAW);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
            this.vaoExt.bindVertexArrayOES(null);

            this.frameBuffers[i] = new Framebuffer(this.rndr, TargetOutput.COLOUR_TEXTURE | TargetOutput.DEPTH_NONE,
                {
                    width: 100,
                    height: 100,
                    colourFormat: gl.RGBA,
                    colourDatatype: gl.FLOAT,
                }
            );

            if(!this.frameBuffers[i].initialise()) {
                console.log("Failed to initialise Framebuffer");
                return false;
            }
        }

        return true;
    }

    public setupShaders(): boolean {
        this.shdrProg = Program.create(this.gl, vertShdr, fragShdr, [[0, "position"]]);
        if(!this.shdrProg) {
            console.log("Failed to compile shader program");
            return false;
        }

        this.gl.useProgram(this.shdrProg);
        const loc = this.gl.getUniformLocation(this.shdrProg, "mvp");
        const [w, h] = this.rndr.getViewport().slice(2, 4);
        const proj = mat4.makePerspective(45., w/h, .5, 10.);
        const model = mat4.makeTranslation(0, 0, -5.);
        const mat = mat4.create();
        mat4.mul(mat, proj, model);
        console.log("mat:", mat);
        this.gl.uniformMatrix4fv(loc, false, mat);
        this.gl.useProgram(null);

        return true;
    }

    public initialise(rndr: Renderer, vtxShdr: WebGLShader): ModuleContext | null {
        (vtxShdr);
        this.rndr = rndr;
        const gl = rndr.getContext();
        this.gl = gl;

        this.setupShaders();

        this.ctx = makeContext(128, 64, 30, FFTChannels.ALL);
        this.ctx.delay = 3./60.;
        if(!this.ctx.sampleTex.initialise(gl)) return null;

        if(!this.setupBuffers()) return null;
        if(!this.setupShaders()) return null;

        this.gl.depthRange(0., 10.);

        if(gl.getError() !== gl.NO_ERROR) {
            console.log("Error during initialisation");
            this.ctx.sampleTex.destroy();
            return null;
        }

        return this.ctx;
    }

    public destroy(): void {
        if(this.ctx) {
            this.ctx.sampleTex.destroy();
        }
    }

    public update(dt: number): void {
        (dt);
    }

    public updateContext(value: ModuleValue) {
        (value);
    }

    public analysis(): void {

    }

    public draw(): void {
        this.gl.clearColor(0., 0., 0., 1.);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.useProgram(this.shdrProg);
        this.vaoExt.bindVertexArrayOES(this.vaos[0]);
        this.gl.drawArrays(this.gl.POINTS, 0, 10000);
        this.gl.useProgram(null);
    }
}
