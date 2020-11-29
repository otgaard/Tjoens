/*
The first module, simple bars of the fft histogram
 */

import {FFTChannels, makeContext, Module, ModuleContext, ModuleValue} from "./Module";
import {Program} from "../webGL/GL";

const fragShdrText = `
    #extension GL_OES_standard_derivatives : enable

    precision highp float;
    
    #define BIN_SIZE 512
    #define INV_BIN 1./512.
        
    // Note: This is the maximum fragment uniform capacity.
    //uniform float bins[BIN_SIZE];
    //uniform float maxSample[3*BIN_SIZE];
    
    uniform sampler2D sampleTex;
    uniform float currRow;
    uniform float colourTable[9];
    varying vec2 texcoord;
    
    /*
    // This is required to lookup values dynamically
    float getBin(int val) {
        for(int i = 0; i != BIN_SIZE; ++i) {
            if(i == val) return bins[i];
        }
        
        return 0.;
    }

    float getMaxSample(int val) {
        for(int i = 0; i != BIN_SIZE; ++i) {
            if(i == val) return maxSample[3*i + 1];
        }
        
        return 0.;
    }
    */

    #define INV_BYTE 1./255.

    float seg(vec2 p, vec2 a, vec2 b) {
        vec2 PA = p - a;
        vec2 BA = b - a;
        float proj = clamp(dot(PA, BA)/dot(BA, BA), 0., 1.);
        float len = length(PA - proj*BA);
        return smoothstep(0., 3.*fwidth(texcoord.x), len);
    }

    vec4 unpackColour(in float colourCode) {
        vec4 colour;
        colour.r = floor(colourCode / 65536.);
        colour.g = floor((colourCode - colour.r * 65536.) / 256.);
        colour.b = floor(colourCode - colour.r * 65536. - colour.g * 256.);
        colour.a = 255.;
        return INV_BYTE * colour;
    }

    vec4 getColour(in int id) {
        for(int i = 0; i != 9; ++i) {
            if(i == id) return unpackColour(colourTable[i]);
        }
        return vec4(0.);
    }

    void main() {
    /*
        int bin = int(texcoord.x*float(BIN_SIZE));
        float val = getBin(bin);
        float maxSample = getMaxSample(bin);
        float emit = step(texcoord.y, val);
        int binm1 = int(max(float(bin)-1., 0.));
        int binp1 = int(min(float(bin)+1., float(BIN_SIZE)));
        
        float off = INV_BIN*float(bin);
        float off2 = off+INV_BIN;
        vec2 A = vec2(off, getMaxSample(binm1));
        vec2 B = vec2(off, maxSample);
        vec2 C = vec2(off2, maxSample);
        vec2 D = vec2(off2, getMaxSample(binp1));        
    
        //gl_FragColor = mix(gl_FragColor, emit * vec4(.3, .3, .3, 1.), step(abs(texcoord.x - float(bin)*INV_BIN), fwidth(texcoord.x)));  
        
        //float delta = 3.*(maxSample - val);
        gl_FragColor = vec4(emit * mix(vec3(1., 0., 0.), vec3(1., 1., 0), texcoord.y/val), 1.);
        vec4 col = vec4(maxSample, 0., 1. - maxSample, 1.);
        gl_FragColor = mix(col, gl_FragColor, seg(texcoord, A, B));
        gl_FragColor = mix(col, gl_FragColor, seg(texcoord, B, C));
        gl_FragColor = mix(col, gl_FragColor, seg(texcoord, C, D));
    */
        
        vec2 wrapCoord = vec2(texcoord.x, fract(texcoord.y + currRow));
        float value = texture2D(sampleTex, wrapCoord).r;
        float val = clamp(value * 9., 0., 8.);
        int bin = int(val);
        int binp1 = int(min(floor(val+1.), 8.));
        gl_FragColor = mix(getColour(bin), getColour(binp1), val - float(bin));
        gl_FragColor = mix(vec4(1.), gl_FragColor, seg(texcoord, vec2(0., .5), vec2(1., .5)));   
    }
`;

enum ColourTableType {
    SPECTRUM,
    HEAT,
}

function makeColour(colour: ArrayLike<number>): number {
    let col = (colour.length === 4 ? 255 : colour[3]) << 24;
    col += colour[0] << 16;
    col += colour[1] << 8;
    col += colour[2];
    return col;
}

function makeColourTable(type: ColourTableType): Float32Array {
    if(type === ColourTableType.SPECTRUM) {
        return new Float32Array([
            makeColour([0, 0, 0]),
            makeColour([0,0,255]),
            makeColour([46,43,95]),
            makeColour([0,255,0]),
            makeColour([139,0,255]),
            makeColour([255,0,0]),
            makeColour([255,127,0]),
            makeColour([255,255,0]),
            makeColour([255,255,255]),
        ]);
    } else {
        return new Float32Array();
    }
}

export default class Spectrogram implements Module {
    gl: WebGLRenderingContext = null;
    ctx: ModuleContext = null;
    shdrProg: WebGLProgram = null;
    readonly name = "Spectrogram";

    private posLoc = -1;
    private sampleTexLoc: WebGLUniformLocation = null;
    private currRowLoc: WebGLUniformLocation = null;
    private colourTableLoc: WebGLUniformLocation = null;
    private colourTable = makeColourTable(ColourTableType.SPECTRUM);

    public initialise(gl: WebGLRenderingContext, vtxShdr: WebGLShader): ModuleContext | null {
        this.gl = gl;
        this.ctx = makeContext(1024, 512, 60, FFTChannels.BIN);
        this.ctx.delay = 33./60.;
        this.shdrProg = Program.create(gl, vtxShdr, fragShdrText);

        if(!this.shdrProg || !this.ctx.sampleTex.initialise(gl)) return null;

        gl.useProgram(this.shdrProg);

        this.posLoc = gl.getAttribLocation(this.shdrProg, "position");
        if(this.posLoc !== 0) return null;

        this.sampleTexLoc = gl.getUniformLocation(this.shdrProg, "sampleTex");
        if(this.sampleTexLoc === -1) return null;
        this.currRowLoc = gl.getUniformLocation(this.shdrProg, "currRow");
        if(this.currRowLoc === -1) return null;
        this.colourTableLoc = gl.getUniformLocation(this.shdrProg, "colourTable[0]");
        if(this.colourTableLoc === -1) return null;

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
        this.gl.uniform1f(this.currRowLoc, this.ctx.sampleTex.getCurrentRow()/this.ctx.sampleSize);
        this.gl.uniform1fv(this.colourTableLoc, this.colourTable);
        //this.gl.uniform1fv(this.binsLoc, this.conf.binBuffer);
        //this.gl.uniform1fv(this.maxSamplesLoc, this.conf.minMaxAvg);
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
