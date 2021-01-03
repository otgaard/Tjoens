import {FFTChannels, makeContext, Module, ModuleContext, ModuleValue} from "./Module";
import {Renderer} from "../webGL/Renderer";
import {Framebuffer, TargetOutput} from "../webGL/Framebuffer";
import {BindingLocations, Program} from "../webGL/GL";
import {mat4} from "../maths/Mat4";
import {Texture} from "../webGL/Texture";

const vertShdr = `#version 300 es
precision highp float;

in vec4 position;
flat out int id;

uniform mat4 mvp;
    
void main() {
    gl_Position = mvp * position;
    gl_PointSize = 2.;
    id = gl_VertexID;
}   
`;

const fragShdr = `#version 300 es
precision highp float;

uniform sampler2D colourTex;

flat in int id;

out vec4 fragColour;

vec2 getParticleCoord(in int id) {
    return vec2(1./100., 1./100.) * vec2(float(id % 100) + .5, floor(float(id) / 100.) + .5);
}

void main() {
    fragColour = texture(colourTex, getParticleCoord(id));
}
`;

const simShdr = `#version 300 es
precision highp float;

in vec2 texcoord;

out vec4 fragData[2];

// Static for now
#define WIDTH 100
#define HEIGHT 100
#define INV_W 1./float(WIDTH)
#define INV_H 1./float(HEIGHT)

uniform sampler2D posTex; // [x, y, z, size] buf 0
uniform sampler2D colTex; // [r, g, b, a] buf 1

vec4 getPosition(in vec2 texcoord) {
    vec4 p = texture(posTex, texcoord);
    float n = p.y + .016;
    p.y = n > 1. ? n - 2. : n;
    return p;
}

void main() {
    fragData[0] = getPosition(texcoord);
    float y = .5 * (1. + fragData[0].y);
    fragData[1] = vec4(1, y, .0, 1.);
}
`;


export default class Particles implements Module {
    rndr: Renderer;
    gl: WebGL2RenderingContext = null;
    ctx: ModuleContext = null;
    readonly name = "Particles";

    vbuf: WebGLBuffer;
    shdrProg: Program;
    simProg: Program;
    posLoc: number;

    frameCount: number = 2;
    vaos: WebGLVertexArrayObject[];
    positions: WebGLBuffer[];
    frameBuffers: Framebuffer[];

    writeBuf: number = 0;
    readBuf: number = this.frameCount-1;

    public switchBuffers(): void {
        this.writeBuf = (this.writeBuf + 1) % this.frameCount;
        this.readBuf = (this.readBuf + 1) % this.frameCount;
    }

    public setupBuffers(): boolean {
        const gl = this.gl;
        this.vaos = new Array<WebGLVertexArrayObject>(this.frameCount);
        this.positions = new Array<WebGLBuffer>(this.frameCount);
        this.frameBuffers = new Array<Framebuffer>(this.frameCount);

        // Use 4-element positions to align with texture copy
        const positions = new Float32Array(4*100*100);
        const scale = 1.;
        for(let i = 0; i !== 40000; i += 4) {
            positions[i] = scale * 2.*(Math.random() - .5);
            positions[i+1] = scale * 2.*(Math.random() - .5);
            positions[i+2] = scale * 2.*(Math.random() - .5);
            positions[i+3] = 1.;
        }

        for(let i = 0; i !== this.frameCount; ++i) {
            this.vaos[i] = this.gl.createVertexArray();
            this.gl.bindVertexArray(this.vaos[i]);
            this.positions[i] = this.gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positions[i]);
            gl.bufferData(this.gl.ARRAY_BUFFER, positions, gl.STREAM_DRAW);
            gl.enableVertexAttribArray(this.posLoc);
            gl.vertexAttribPointer(this.posLoc, 4, gl.FLOAT, false, 0, 0);
            this.gl.bindVertexArray(null);

            this.frameBuffers[i] = new Framebuffer(this.rndr, TargetOutput.COLOUR_TEXTURE | TargetOutput.DEPTH_NONE,
                {
                    width: 100,
                    height: 100,
                    count: 2,
                    colourFormat: gl.RGBA,
                    colourDatatype: gl.FLOAT,
                }
            );

            if(!this.frameBuffers[i].initialise()) {
                console.log("Failed to initialise Framebuffer");
                return false;
            }

            // Load positions
            const posTex0 = this.frameBuffers[i].getColourTarget(0) as Texture;
            posTex0.initialise(positions);
            const posTex1 = this.frameBuffers[i].getColourTarget(0) as Texture;
            posTex1.initialise(positions);
        }

        console.log("Buffers Setup");

        return true;
    }

    public setupShaders(vtxShdr: WebGLShader): boolean {
        const bindings: BindingLocations = [[0, "position"]];

        console.log("Setting up SHADERS");

        // This renders the simulation output
        this.shdrProg = Program.create(this.gl, vertShdr, fragShdr, bindings);
        if(!this.shdrProg) {
            console.log("Failed to compile shader program");
            return false;
        }

        // This shader uses the input vtxShdr (the quad shader) input to execute the simulation
        this.simProg = Program.create(this.gl, vtxShdr, simShdr, bindings);
        if(!this.simProg) {
            console.log("Failed to compile simulation program");
            return false;
        }

        const gl = this.gl;

        gl.useProgram(this.simProg);
        const posTexLoc = this.gl.getUniformLocation(this.simProg, "posTex");
        const colTexLoc = this.gl.getUniformLocation(this.simProg, "colTex");

        this.gl.uniform1i(posTexLoc, 0);
        this.gl.uniform1i(colTexLoc, 1);

        gl.useProgram(null);

        this.gl.useProgram(this.shdrProg);
        const loc = this.gl.getUniformLocation(this.shdrProg, "mvp");
        const colourTexLoc = this.gl.getUniformLocation(this.shdrProg, "colourTex");
        this.gl.uniform1i(colourTexLoc, 0);
        const [w, h] = this.rndr.getViewport().slice(2, 4);

        const proj = mat4.makePerspective(45., w/h, .01, 10.);
        const trans = mat4.makeTranslation(0, 0, -5);
        const mat = mat4.create();
        mat4.mul(mat, proj, trans);

        this.gl.uniformMatrix4fv(loc, false, mat);

        this.posLoc = this.gl.getAttribLocation(this.shdrProg, "position");

        this.gl.useProgram(null);

        console.log("SHADERS SET UP:", this.gl.getError());

        return true;
    }

    public initialise(rndr: Renderer, vtxShdr: WebGLShader, vbuf: WebGLBuffer): ModuleContext | null {
        this.rndr = rndr;

        if(!vbuf) {
            console.error("Error, this shader requires the screen-space buffer");
            return null;
        }
        this.vbuf = vbuf;
        const gl = rndr.getContext();
        this.gl = gl;

        this.ctx = makeContext(128, 64, 30, FFTChannels.ALL);
        this.ctx.delay = 3./60.;
        if(!this.ctx.sampleTex.initialise(gl)) return null;

        if(!this.setupShaders(vtxShdr)) return null;
        if(!this.setupBuffers()) return null;

        this.gl.depthRange(0., 1.);

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

    currVP: Int32Array = new Int32Array(4);
    simVP: Int32Array = new Int32Array([0, 0, 100, 100]);
    theta: number = 0;

    public update(dt: number): void {
        (dt);

        const gl = this.gl;

        this.currVP.set(this.rndr.getViewport());
        this.rndr.setViewport(this.simVP);

        this.frameBuffers[this.writeBuf].bind();

        gl.useProgram(this.simProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        (this.frameBuffers[this.readBuf].getColourTarget(0) as Texture).bind(0);
        (this.frameBuffers[this.readBuf].getColourTarget(1) as Texture).bind(1);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        (this.frameBuffers[this.readBuf].getColourTarget(0) as Texture).release(0);
        (this.frameBuffers[this.readBuf].getColourTarget(1) as Texture).release(1);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.disableVertexAttribArray(0);
        gl.useProgram(null);
        gl.bindVertexArray(null);

        // Perform a copy, from the current write buffer (async)
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, this.positions[this.writeBuf]);
        gl.readBuffer(gl.COLOR_ATTACHMENT0);
        gl.readPixels(0, 0, 100, 100, gl.RGBA, gl.FLOAT, 0);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

        this.frameBuffers[this.writeBuf].release();

        // Now render the read buffer written in the previous frame

        this.rndr.setViewport(this.currVP);

        gl.useProgram(this.shdrProg);
        const loc = gl.getUniformLocation(this.shdrProg, "mvp");
        const [w, h] = this.rndr.getViewport().slice(2, 4);

        const proj = mat4.makePerspective(45., w/h, .01, 10.);
        const trans = mat4.makeTranslation(0, 0, -5);
        mat4.rotate(trans,[0, 1, 0], this.theta);
        this.theta += dt;
        const mat = mat4.create();
        mat4.mul(mat, proj, trans);

        this.gl.uniformMatrix4fv(loc, false, mat);
        this.gl.useProgram(null);
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
        this.gl.bindVertexArray(this.vaos[this.readBuf]);
        (this.frameBuffers[this.readBuf].getColourTarget(1) as Texture).bind(0);
        this.gl.drawArrays(this.gl.POINTS, 0, 10000);
        (this.frameBuffers[this.readBuf].getColourTarget(1) as Texture).release(0);
        this.gl.bindVertexArray(null);
        this.gl.useProgram(null);

        // We only switch the buffers after we have rendered both passes
        this.switchBuffers();
    }
}
