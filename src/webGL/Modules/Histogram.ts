/*
The first module, simple bars of the fft histogram
 */

import {Module, ModuleContext, ModuleValue} from "../Module";
import {Program} from "../GL";

const fragShdrText = `
    precision highp float;
    
    #extension GL_OES_standard_derivatives : enable
    
    #define BIN_SIZE 255
    #define INV_BIN 1./255.
    #define HINV_BIN 1./510.
    
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

    float seg(vec2 p, vec2 a, vec2 b) {
        vec2 PA = p - a;
        vec2 BA = b - a;
        float proj = clamp(dot(PA, BA)/dot(BA, BA), 0., 1.);
        float len = length(PA - proj*BA);
        return smoothstep(0., 2.*fwidth(p.x), len);
    }

    void main() {
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
    }
`;

export default class Histogram implements Module {
    gl: WebGLRenderingContext | null = null;
    conf: ModuleContext | null = null;
    shdrProg: WebGLProgram | null = null;
    readonly name = "Histogram";

    private posLoc = -1;
    private binsLoc: WebGLUniformLocation | null = null;
    private maxSamplesLoc: WebGLUniformLocation | null = null;

    public initialise(gl: WebGLRenderingContext, vtxShdr: WebGLShader, conf: ModuleContext): boolean {
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

    public updateContext(value: ModuleValue) {
        (value);
    }

    public analysis(): void {

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
