/*
The first module, simple bars of the fft histogram
 */

import {FFTChannels, makeContext, Module, ModuleContext, ModuleValue} from "./Module";
import {Program} from "../webGL/GL";

const fragShdrText = `
    #extension GL_OES_standard_derivatives : enable

    precision highp float;
    
    #define BIN_SIZE 256
    #define INV_BIN 1./256.
    
    uniform sampler2D sampleTex;
    uniform float currRow;
    varying vec2 texcoord;
    
    float seg(vec2 p, vec2 a, vec2 b) {
        vec2 PA = p - a;
        vec2 BA = b - a;
        float proj = clamp(dot(PA, BA)/dot(BA, BA), 0., 1.);
        float len = length(PA - proj*BA);
        return smoothstep(0., 3.*fwidth(texcoord.x), len);
    }

    void main() {
        float bin = floor(texcoord.x*float(BIN_SIZE)) + .5;
        vec2 binMax = texture2D(sampleTex, vec2(bin*INV_BIN, currRow)).ra;
        float binm1 = floor(max(bin-1., 0.)) + .5;
        float binp1 = floor(min(bin+1., float(BIN_SIZE-1))) + .5;
        float off = INV_BIN*float(int(bin));
        float off2 = off+INV_BIN;
        vec2 A = vec2(off, texture2D(sampleTex, vec2(binm1*INV_BIN, currRow)).a);
        vec2 B = vec2(off, binMax[1]);
        vec2 C = vec2(off2, binMax[1]);
        vec2 D = vec2(off2, texture2D(sampleTex, vec2(binp1*INV_BIN, currRow)).a);        
        
        float emit = step(texcoord.y, binMax[0]);
        gl_FragColor = vec4(emit * mix(vec3(1., 0., 0.), vec3(1., 1., 0), texcoord.y/binMax[0]), 1.);
        vec4 col = vec4(binMax[1], 0., 1. - binMax[1], 1.);
        gl_FragColor = mix(col, gl_FragColor, seg(texcoord, A, B));
        gl_FragColor = mix(col, gl_FragColor, seg(texcoord, B, C));
        gl_FragColor = mix(col, gl_FragColor, seg(texcoord, C, D));
    }
`;

export default class Histogram implements Module {
    gl: WebGLRenderingContext | null = null;
    ctx: ModuleContext | null = null;
    shdrProg: WebGLProgram | null = null;
    readonly name = "Histogram";

    private posLoc = -1;
    private sampleTexLoc: WebGLUniformLocation | null = null;
    private currRowLoc: WebGLUniformLocation | null = null;

    public initialise(gl: WebGLRenderingContext, vtxShdr: WebGLShader): ModuleContext | null {
        this.gl = gl;
        this.ctx = makeContext(512, 256, 20, FFTChannels.BIN | FFTChannels.MAX);
        this.ctx.delay = 5./60.;
        this.shdrProg = Program.create(gl, vtxShdr, fragShdrText);

        if(!this.shdrProg || !this.ctx.sampleTex.initialise(gl)) return null;

        gl.useProgram(this.shdrProg);

        this.posLoc = gl.getAttribLocation(this.shdrProg, "position");
        if(this.posLoc !== 0) return null;

        this.sampleTexLoc = gl.getUniformLocation(this.shdrProg, "sampleTex");
        if(this.sampleTexLoc === -1) return null;
        this.currRowLoc = gl.getUniformLocation(this.shdrProg, "currRow");
        if(this.currRowLoc === -1) return null;

        gl.useProgram(null);

        if(gl.getError() !== gl.NO_ERROR) {
            this.ctx.sampleTex.destroy();
            return null;
        }

        return this.ctx;
    }

    public destroy(): void {
        if(this.ctx) this.ctx.sampleTex.release();
    }

    public update(dt: number): void {
        if(!this.gl || !this.ctx) return;

        (dt);

        this.gl.useProgram(this.shdrProg);
        this.gl.uniform1i(this.sampleTexLoc, 0);
        this.gl.uniform1f(this.currRowLoc, (this.ctx.sampleTex.getCurrentRow()+.5)/this.ctx.sampleSize);

        this.gl.useProgram(null);
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
        this.ctx.sampleTex.bind();
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.ctx.sampleTex.release();
        this.gl.useProgram(null);
    }
}
