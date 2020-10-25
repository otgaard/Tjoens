import {clamp} from "../maths/functions";
import requestAnimFrame from "./requestAnimFrame";

enum Viewport {
    X,
    Y,
    WIDTH,
    HEIGHT,
}


class Shader extends WebGLShader {
    public static create(context: WebGLRenderingContext, type: GLenum, source: string): Shader | null {
        let shdr: Shader | null = context.createShader(type);
        if(shdr === null) return null;

        context.shaderSource(shdr, source);
        context.compileShader(shdr);
        if(context.getShaderParameter(shdr, context.COMPILE_STATUS)) {
            return shdr;
        } else {
            console.log("WebGL " + (type === WebGLRenderingContext.FRAGMENT_SHADER ? "Fragment" : "Vertex") + " Shader:\n" + context.getShaderInfoLog(shdr));
            context.deleteShader(shdr);
            return null;
        }
    }
}

class Program extends WebGLProgram {
    public static create(context: WebGLRenderingContext, vtxShdr: Shader, frgShdr: string): Program | null;
    public static create(context: WebGLRenderingContext, vtxShdr: string, frgShdr: string): Program | null;
    public static create(context: WebGLRenderingContext, vtxShdr: Shader | string, frgShdr: string): Program | null {
        let vshdr = typeof(vtxShdr) === "string" ? Shader.create(context, context.VERTEX_SHADER, vtxShdr) : vtxShdr;
        let fshdr = Shader.create(context, context.FRAGMENT_SHADER, frgShdr);
        let prog: Program | null = context.createProgram();

        if(prog === null || vshdr === null || fshdr === null) return null;

        context.attachShader(prog, vshdr);
        context.attachShader(prog, fshdr);
        context.linkProgram(prog);
        if(context.getProgramParameter(prog, context.LINK_STATUS)) {
            context.deleteShader(vshdr);
            context.deleteShader(fshdr);
            return prog;
        } else {
            console.log("WebGL Program:\n" + context.getProgramInfoLog(prog));
            context.deleteProgram(prog);
            context.deleteShader(vshdr);
            context.deleteShader(fshdr);
            return null;
        }
    }
}

const quadPositions = [
    -1., +1.,
    -1., -1.,
    +1., +1.,
    +1., -1.,
];

const vtxShdr = `
    precision highp float;
    
    attribute vec2 position;
    
    varying vec2 texcoord;
    
    void main() {
        texcoord = .5*(position + vec2(1., 1.));
        gl_Position = vec4(position, 0., 1.);
    }   
`;

const frgShdr = `
    precision highp float;
    
    uniform float bins[16];
    
    varying vec2 texcoord;
    
    // This is required to lookup values dynamically
    float getBin(int val) {
        for(int i = 0; i != 16; ++i) {
            if(i == val) return bins[i];
        }
        
        return 0.;
    }
    
    void main() {
        float val = getBin(int(texcoord.x*16.));
    
        gl_FragColor = vec4(step(texcoord.y, val) * mix(vec3(1., 0., 0.), vec3(1., 1., 0), texcoord.y), 1.);
    }
`;


export default class Renderer {
    private el: HTMLCanvasElement;
    private gl: WebGLRenderingContext;
    private viewport: Int32Array = new Int32Array(4);
    readonly DPR: number;

    private frameId = 0;
    private animate = () => {};
    private currTime = Date.now()/1000.;
    private prevTime = Date.now()/1000.;
    private dt = 0;
    private lastMousePos = new Float32Array(2);
    private lastMouseButton = -1;

    private analyser: AnalyserNode | null;
    // This is far too big, so we break it into 16 bins
    private fftBuffer = new Uint8Array(0);
    private seqLength = 0;
    private bins = new Float32Array(16);

    private prog: Program | null = null;
    private vbuf: WebGLBuffer | null = null;
    private loc0: number = -1;
    private binsLoc: WebGLUniformLocation | null = null;

    public constructor(el: HTMLCanvasElement) {
        this.el = el;
        this.gl = el.getContext("webgl") as WebGLRenderingContext;
        if(!this.gl) throw("Failed to construct WebGL Rendering Context");

        this.analyser = null;
        this.DPR = window.devicePixelRatio;
        this.onResize();

        if(!this.initialise()) {
            throw("Failed to initialise WebGL Renderer");
        }
    }

    public setAnalyser(analyser: AnalyserNode): void {
        this.analyser = analyser;
        this.fftBuffer = new Uint8Array(analyser.frequencyBinCount);
        const count = this.analyser.frequencyBinCount/this.bins.length;
        this.seqLength = Math.floor(count);
        console.log("count:", count, "seqLength:", this.seqLength);
        console.log("seqLength:", this.seqLength);
    }

    public initialise(): boolean {
        const gl = this.gl;

        this.el.addEventListener("mousemove", this.onMouseMove);
        this.el.addEventListener("mousedown", this.onMouseDown);
        this.el.addEventListener("mouseup", this.onMouseUp);
        window.addEventListener("resize", this.onResize);

        gl.clearColor(0., 0., 0., 1.);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.vbuf = gl.createBuffer();
        if(!this.vbuf) return false;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadPositions), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.prog = Program.create(gl, vtxShdr, frgShdr);
        if(!this.prog) return false;

        gl.useProgram(this.prog);

        this.loc0 = gl.getAttribLocation(this.prog, "position");
        if(this.loc0 !== 0) return false;

        this.binsLoc = gl.getUniformLocation(this.prog, "bins[0]");
        if(this.binsLoc === -1) return false;

        gl.useProgram(null);

        this.animate = () => {
            // @ts-ignore
            this.frameId = requestAnimFrame(this.animate);
            this.update();
            this.render();
        };
        this.animate();

        return gl.getError() === gl.NO_ERROR;
    }

    public unload(): boolean {
        console.log("CLEANUP");
        cancelAnimationFrame(this.frameId);
        this.el.removeEventListener("mousemove", this.onMouseMove);
        this.el.removeEventListener("mousedown", this.onMouseDown);
        this.el.removeEventListener("mouseup", this.onMouseUp);
        window.removeEventListener("resize", this.onResize);
        return true;
    }

    private val = 0;
    private dir = 1;

    /*
    private lastTime = 0;
    private idx = 0;
    */

    private analyse(): void {
        if(!this.analyser) return;
        this.analyser.getByteFrequencyData(this.fftBuffer);
        this.bins.fill(0);
        const invScale = 1./(this.seqLength*255);
        for(let i = 0; i !== this.bins.length; ++i) {
            for(let j = 0; j !== this.seqLength; ++j) {
                this.bins[i] += this.fftBuffer[i*this.seqLength + j];
            }
            this.bins[i] *= invScale;
        }
        this.gl.useProgram(this.prog);
        this.gl.uniform1fv(this.binsLoc, this.bins);

    }

    public update(): void {
        this.prevTime = this.currTime;
        this.currTime = .001 * Date.now();
        this.dt = this.currTime - this.prevTime;

        this.analyse();

        /*
        if(this.currTime - this.lastTime > 10) {
            console.log("FPS:", this.idx/10);
            this.idx = 0;
            this.lastTime = this.currTime;
        } else this.idx += 1;
        */

        if(this.val > 1) {
            this.dir = -1;
            this.val = 1;
        }
        if(this.val < 0) {
            this.dir = +1;
            this.val = 0;
        }
        this.val += this.dt * this.dir;
    }

    public render(): void {
        const gl = this.gl;
        gl.useProgram(this.prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
        gl.enableVertexAttribArray(this.loc0);
        gl.vertexAttribPointer(this.loc0, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.useProgram(null);
    }

    public onResize = (): void => {
        this.el.width = this.el.offsetWidth * this.DPR;
        this.el.height = this.el.offsetHeight * this.DPR;
        this.viewport[2] = this.el.width;
        this.viewport[3] = this.el.height;
        this.gl.viewport(this.viewport[0], this.viewport[1], this.viewport[2], this.viewport[3]);

        console.log("Canvas Dims:", this.el.offsetWidth, this.el.offsetHeight)
        console.log("Viewport:", this.el.width, this.el.height);
        console.log("DPR:", window.devicePixelRatio);
        console.log("viewport:", this.viewport, "devicePixelRatio:", this.DPR);
    };

    // Note: We flip the coordinate space to the default GL space, origin bottom-left
    public onMouseMove = (ev: MouseEvent): void => {
        const x = ev.x - this.el.offsetLeft;
        const y = this.viewport[Viewport.HEIGHT] - (ev.y - this.el.offsetTop);
        this.lastMousePos.set([
            clamp(devicePixelRatio*x, 0, this.viewport[Viewport.WIDTH]),
            clamp(devicePixelRatio*y, 0, this.viewport[Viewport.HEIGHT]),
        ]);
    };

    public onMouseDown = (ev: MouseEvent): void => {
        this.lastMouseButton = ev.button;
    };

    public onMouseUp = (ev: MouseEvent) : void => {
        this.lastMouseButton = this.lastMouseButton === ev.button ? -1 : this.lastMouseButton;
    };
}