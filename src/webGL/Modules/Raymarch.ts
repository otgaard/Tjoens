/*
Implementation of Raymarching routines as a module for rendering scenes in the visualiser.
 */

import {Module, ModuleConfig, ModuleValue} from "../Module";
import {Program} from "../GL";
import {vec2} from "gl-matrix";

const fragShdrText = `
    #extension GL_OES_standard_derivatives : enable

    precision highp float;    

    uniform vec2 screenDims;
    uniform vec3 pos_rot;
    
    varying vec2 texcoord;
    
    float sdfCircle(in vec2 pos, float rad) {
        return length(pos) - rad;
    }
    
    float sdfRect(in vec2 pos, in vec2 hDims) {
        vec2 dist = abs(pos) - hDims;
        float exD = length(max(dist, 0.));
        float inD = min(max(dist.x, dist.y), 0.);
        return exD + inD;
    }
    
    vec2 translate(in vec2 pos, in vec2 translation) {
        return pos - translation;
    }
    
    vec2 rotate(in vec2 pos, in float angle) {
        float st = sin(angle), ct = cos(angle);
        return vec2(ct*pos.x + st*pos.y, ct*pos.y - st*pos.x);
    }
    
    vec2 scale(in vec2 pos, in float sc) {
        return pos/sc;
    }
    
    float sceneSDF(in vec2 pos) {
        return sdfRect(rotate(translate(pos, pos_rot.xy), pos_rot.z), vec2(100.,50.));
    }
    
    void main() {
        float AR = screenDims.y/screenDims.x;
        vec2 scale = vec2(1., AR);
        float sval = sceneSDF(gl_FragCoord.xy);
        float distDelta = fwidth(sval);
        
        float contour = abs(fract(sval / 20. + .5) - .5) * 20.;
        float lines = smoothstep(2. - distDelta, 2. + distDelta, contour);
        gl_FragColor = vec4(lines*mix(vec3(1., 1., 0.), vec3(0., 0., 1.), sval), 1.);
    }
`;

export default class Raymarch implements Module {
    gl: WebGLRenderingContext | null = null;
    shdrProg: WebGLProgram | null = null;
    conf: ModuleConfig | null = null;
    readonly name = "Raymarch";

    posLoc = -1;
    screenDimsLoc: WebGLUniformLocation | null = -1;
    posRotLoc: WebGLUniformLocation | null = -1;

    public initialise(gl: WebGLRenderingContext, vtxShdr: WebGLShader, conf: ModuleConfig): boolean {
        this.gl = gl;
        this.conf = conf;
        this.shdrProg = Program.create(gl, vtxShdr, fragShdrText);
        if(!this.shdrProg) return false;

        gl.useProgram(this.shdrProg);

        this.posLoc = gl.getAttribLocation(this.shdrProg, "position");
        if(this.posLoc !== 0) return false;

        this.screenDimsLoc = gl.getUniformLocation(this.shdrProg, "screenDims");
        this.gl.uniform2fv(this.screenDimsLoc, this.conf.screenDims);
        this.posRotLoc = gl.getUniformLocation(this.shdrProg, "pos_rot");
        this.gl.uniform3fv(this.posRotLoc, [0., 0., 0.]);

        gl.useProgram(null);
        return this.gl.getError() === this.gl.NO_ERROR;
    }

    public destroy(): boolean {
        return true;
    }

    public updateConf(value: ModuleValue): void {
        if(!this.gl || !this.conf) return;
        this.gl.useProgram(this.shdrProg);
        switch(value) {
            case ModuleValue.SCREENDIMS:
                this.gl.uniform2fv(this.screenDimsLoc, this.conf.screenDims);
                break;
            default:
        }
        this.gl.useProgram(null);
    }

    private pos: vec2 = vec2.create();
    private dest: vec2 = vec2.create();
    private delta: vec2 = vec2.create();
    private curr: vec2 = vec2.create();
    private stepSize: vec2 = vec2.create();
    private rot = 0;
    private bin = 0;
    private timer = 0;

    public update(dt: number): void {
        if(!this.gl || !this.conf) return;

        //console.log("rot:", this.rot);

        this.timer += dt;
        if(this.timer > 2.) {
            this.timer = 0;
            vec2.set(this.pos, this.dest[0], this.dest[1]);
            vec2.set(this.dest, Math.random()*this.conf.screenDims[0], Math.random()*this.conf.screenDims[1]);
            vec2.sub(this.delta, this.dest, this.pos);
            vec2.set(this.stepSize, 1./(2*60), 1./(2*60));
            vec2.mul(this.delta, this.delta, this.stepSize);
            vec2.set(this.curr, this.pos[0], this.pos[1]);
            console.log("change:", this.curr[0], this.curr[1]);
        }

        this.gl.useProgram(this.shdrProg);
        this.gl.uniform2iv(this.screenDimsLoc, this.conf.screenDims);
        const dn = this.conf.minMaxAvg[3*this.bin+2] - this.conf.minMaxAvg[3*this.bin];
        const dx = this.conf.minMaxAvg[3*this.bin+2] - this.conf.minMaxAvg[3*this.bin+1];
        this.rot = dn > Math.abs(dx) ? dn : dx;
        vec2.add(this.curr, this.curr, this.delta);
        this.gl.uniform3fv(this.posRotLoc, [this.curr[0], this.curr[1], this.rot]);
        this.gl.useProgram(null);
    }

    public analysis(): void {

    }

    public draw(): void {
        if(!this.gl) return;

        console.log("draw");

        this.gl.enableVertexAttribArray(this.posLoc);
        this.gl.vertexAttribPointer(this.posLoc, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.useProgram(this.shdrProg);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.gl.useProgram(null);
    }
}
