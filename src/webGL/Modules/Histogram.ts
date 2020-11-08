/*
The first module, simple bars of the fft histogram
 */

import {Module, ModuleConfig, ModuleValue} from "../Module";
import {Program} from "../GL";

const fragShdrText = `
    precision highp float;
    
    #extension GL_OES_standard_derivatives : enable
    
    #define BIN_SIZE 90
    #define INV_BIN 1./90.
    
    uniform float bins[BIN_SIZE];
    uniform float maxSample[3*BIN_SIZE];
    
    varying vec2 texcoord;
    
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

    void main() {
        int bin = int(texcoord.x*float(BIN_SIZE));
        float val = getBin(bin);
        float maxSample = getMaxSample(bin);
        float emit = step(texcoord.y, val);
    
        gl_FragColor = vec4(emit * mix(vec3(1., 0., 0.), vec3(1., 1., 0), texcoord.y/val), 1.);
        gl_FragColor = mix(gl_FragColor, emit * vec4(.3, .3, .3, 1.), step(abs(texcoord.x - float(bin)*INV_BIN), fwidth(texcoord.x)));  
        gl_FragColor = mix(gl_FragColor, vec4(0., .4, 1., 1.),  step(abs(texcoord.y - maxSample), fwidth(texcoord.y))); 
    }
`;

export default class Histogram implements Module {
    gl: WebGLRenderingContext | null = null;
    conf: ModuleConfig | null = null;
    shdrProg: WebGLProgram | null = null;
    readonly name = "Histogram";

    private posLoc = -1;
    private binsLoc: WebGLUniformLocation | null = null;
    private maxSamplesLoc: WebGLUniformLocation | null = null;

    public initialise(gl: WebGLRenderingContext, vtxShdr: WebGLShader, conf: ModuleConfig): boolean {
        this.gl = gl;
        this.conf = conf;
        this.shdrProg = Program.create(gl, vtxShdr, fragShdrText);

        if(!this.shdrProg) return false;

        console.log("created program");

        gl.useProgram(this.shdrProg);

        this.posLoc = gl.getAttribLocation(this.shdrProg, "position");
        if(this.posLoc !== 0) return false;

        this.binsLoc = gl.getUniformLocation(this.shdrProg, "bins[0]");
        if(this.binsLoc === -1) return false;
        this.maxSamplesLoc = gl.getUniformLocation(this.shdrProg, "maxSample[0]");
        if(this.maxSamplesLoc === -1) return false;

        gl.useProgram(null);

        return gl.getError() === gl.NO_ERROR;
    }

    public destroy(): boolean {
        return true;
    }

    public update(dt: number): void {
        if(!this.gl || !this.conf) return;

        (dt);

        this.gl.useProgram(this.shdrProg);
        this.gl.uniform1fv(this.binsLoc, this.conf.binBuffer);
        this.gl.uniform1fv(this.maxSamplesLoc, this.conf.minMaxAvg);
        this.gl.useProgram(null);
    }

    public updateConf(value: ModuleValue) {
        (value);
    }

    public analysis(): void {
        /*
        if(!this.conf || !this.conf.fftBuffer) return;
        const fft = this.conf.fftBuffer;

        if(this.binSize != this.conf.fftBuffer.length) {
            this.seqLength = Math.floor(fft.length/this.bins.length);
            this.invScale = 1./(this.seqLength*255);
        }

        this.bins.fill(0);

        const findMax = (bin: number, off: number): number => {
            const start = this.sampleCount*bin, end = this.sampleCount*(bin+1);
            let max = this.samples[start + off];
            for(let i = start; i !== end; ++i) {
                const s = this.samples[start + (i + off) % this.sampleCount];
                if(s > max) max = s;
            }
            return max;
        };

        for(let i = 0; i !== this.bins.length; ++i) {
            for(let j = 0; j !== this.seqLength; ++j) {
                this.bins[i] += fft[i*this.seqLength + j];
            }
            this.bins[i] = gain(this.invScale*this.bins[i], this.conf.gain);
            this.samples[this.sampleCount*i + this.sampleIdx] = this.bins[i];
            this.sampleIdx = (this.sampleIdx+1) % this.sampleCount;
            this.maxSamples[i] = findMax(i, this.sampleIdx);
        }
        */
    }

    public draw(): void {
        if(!this.gl) return;

        this.gl.enableVertexAttribArray(this.posLoc);
        this.gl.vertexAttribPointer(this.posLoc, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.useProgram(this.shdrProg);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.gl.useProgram(null);
    }
}
