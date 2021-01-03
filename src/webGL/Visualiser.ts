import {clamp, isSet} from "../maths/functions";
import requestAnimFrame from "./requestAnimFrame";
import {Shader} from "./GL";
import {defaultContext, FFTChannels, Module, ModuleContext, ModuleValue} from "../Modules/Module";
//import Raymarch from "../Modules/Raymarch";
import Histogram from "../Modules/Histogram";
import Spectrogram from "../Modules/Spectrogram";
import Particles from "../Modules/Particles";
import {Renderer} from "./Renderer";

enum Viewport {
    X,
    Y,
    WIDTH,
    HEIGHT,
}

const quadPositions = [
    -1., +1.,
    -1., -1.,
    +1., +1.,
    +1., -1.,
];

const vtxShdr = `#version 300 es
    precision highp float;
    
    in vec2 position;
    
    out vec2 texcoord;
    
    void main() {
        texcoord = .5*(position + vec2(1., 1.));
        gl_Position = vec4(position, 0., 1.);
    }   
`;

const ModuleIndex = {
    "histogram": Histogram,
    "spectrogram": Spectrogram,
    "particles": Particles,
};

export default class Visualiser {
    private el: HTMLCanvasElement;
    private rndr: Renderer;
    private gl: WebGL2RenderingContext;
    private viewport: Int32Array = new Int32Array(4);
    readonly DPR: number;

    private frameId = 0;
    private animate = () => {};
    private currTime = Date.now()/1000.;
    private prevTime = Date.now()/1000.;
    private dt = 0;
    private lastMousePos = new Float32Array(2);
    private lastMouseButton = -1;

    private analyser: AnalyserNode | null = null;
    private delay: DelayNode | null = null;

    private vbuf: WebGLBuffer | null = null;
    private vShdr: WebGLShader | null = null;

    private module: Module | null = null;
    private ctx: ModuleContext = defaultContext;

    public constructor(el: HTMLCanvasElement) {
        this.el = el;

        this.rndr = new Renderer(el);
        this.gl = this.rndr.getContext();
        this.DPR = this.rndr.getDPR();

        if(!this.initialise()) {
            throw("Failed to initialise WebGL Renderer");
        }
    }

    public setDelay(delay: DelayNode): void {
        this.delay = delay;
    }

    public setAnalyser(analyser: AnalyserNode): void {
        this.analyser = analyser;
    }

    public initialise(): boolean {
        const gl = this.gl;

        this.el.addEventListener("mousemove", this.onMouseMove);
        this.el.addEventListener("mousedown", this.onMouseDown);
        this.el.addEventListener("mouseup", this.onMouseUp);
        window.addEventListener("resize", this.onResize);

        this.onResize();

        gl.clearColor(0., 0., 0., 1.);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.vbuf = gl.createBuffer();
        if(!this.vbuf) return false;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadPositions), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.vShdr = Shader.create(gl, gl.VERTEX_SHADER, vtxShdr);
        if(!this.vShdr) {
            console.error("Failed to create vertex shader");
            return false;
        }

        if(!this.ctx.sampleTex.initialise(gl)) {
            console.error("Failed to initialise sample Texture");
            return false;
        }

        this.onResize();

        this.setModule("histogram");

        // We only use one buffer right now, no need to rebind
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);

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
        cancelAnimationFrame(this.frameId);
        this.el.removeEventListener("mousemove", this.onMouseMove);
        this.el.removeEventListener("mousedown", this.onMouseDown);
        this.el.removeEventListener("mouseup", this.onMouseUp);
        window.removeEventListener("resize", this.onResize);
        return true;
    }

    public setGain(gain: number): void {
        this.ctx.gain = clamp(gain, .05, .95);
        if(this.module) this.module.updateContext(ModuleValue.GAIN);
    }

    public setModule(module: string): void {
        // @ts-ignore
        const mod = new (ModuleIndex[module])();
        if(mod && this.vShdr) {
            // Do this whenever we change the module for screen-space shaders
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbuf);

            const ctx = mod.initialise(this.rndr, this.vShdr, this.vbuf);
            if(mod && ctx) {
                this.module = mod;
                this.ctx = ctx;
                this.ctx.screenDims.set(this.viewport.slice(2, 4));
                if(this.delay) {
                    console.log("Setting delay to:", ctx.delay);
                    this.delay.delayTime.value = ctx.delay;
                }
            } else {
                if(mod) mod.destroy();
            }
        }
    }

    private analyse(): void {
        if(!this.analyser || !this.ctx) return;
        const ctx = this.ctx;

        this.analyser.getByteFrequencyData(ctx.fftBuffer);

        const ch = ctx.sampleTex.getChannels();

        for(let i = 0; i !== ctx.binSize; ++i) {
            const idx = ctx.sampleSize * i;
            const v = ctx.fftBuffer[i];
            ctx.sampleBuffer[idx+ctx.startIdx] = v;

            // TODO: Use differences rather than repeated calculation
            let mma = [1., 0., 0.];
            for(let j = 0; j !== ctx.sampleSize; ++j) {
                const ci = idx + j;
                const val = ctx.sampleBuffer[ci];
                if(val < mma[0]) mma[0] = val;
                if(val > mma[1]) mma[1] = val;
                mma[2] += val;
            }
            mma[2] /= ctx.sampleSize;

            const bufIdx = ch * i;
            let c = 0;

            if(isSet(ctx.fftChannels, FFTChannels.BIN)) {
                ctx.dataBuffer[bufIdx] = v;
                c += 1;
            }

            if(isSet(ctx.fftChannels, FFTChannels.MIN)) {
                ctx.dataBuffer[bufIdx+c] = mma[0];
                c += 1;
            }

            if(isSet(ctx.fftChannels, FFTChannels.MAX)) {
                ctx.dataBuffer[bufIdx+c] = mma[1];
                c += 1;
            }

            if(isSet(ctx.fftChannels, FFTChannels.AVG)) {
                ctx.dataBuffer[bufIdx+c] = mma[2];
            }
        }

        if(!ctx.sampleTex.advanceRow(ctx.dataBuffer)) {
            console.log("warning: advanceRow");
        }

        ctx.startIdx = (ctx.startIdx + 1) % ctx.sampleSize;
    }

    private lastTime = 0;
    private idx = 0;

    public update(): void {
        this.prevTime = this.currTime;
        this.currTime = .001 * Date.now();
        this.dt = this.currTime - this.prevTime;

        this.analyse();
        if(this.module) {
            if(this.module.analysis) this.module.analysis();
            this.module.update(this.dt);
        }

        if(this.currTime - this.lastTime > 10) {
            console.log("FPS:", this.idx/10, this.dt);
            this.idx = 0;
            this.lastTime = this.currTime;
        } else this.idx += 1;
    }

    public render(): void {
        if(this.module) this.module.draw();
    }

    public onResize = (): void => {
        console.log("EL:", this.el.width, this.el.height, this.el.offsetWidth, this.el.offsetHeight);
        this.el.width = this.el.offsetWidth * this.DPR;
        this.el.height = this.el.offsetHeight * this.DPR;
        this.viewport[2] = this.el.width;
        this.viewport[3] = this.el.height;
        this.ctx.screenDims[0] = this.el.width;
        this.ctx.screenDims[1] = this.el.height;
        if(this.module)this.module.updateContext(ModuleValue.SCREENDIMS);
        //console.log(th is.el.width, this.el.height);
        //this.gl.viewport(this.viewport[0], this.viewport[1], this.viewport[2], this.viewport[3]);
        this.rndr.setViewport(this.viewport);
    };

    // Note: We flip the coordinate space to the default GL space, origin bottom-left
    public onMouseMove = (ev: MouseEvent): void => {
        const x = ev.x - this.el.offsetLeft;
        const y = this.viewport[Viewport.HEIGHT] - (ev.y - this.el.offsetTop);
        this.lastMousePos.set([
            clamp(this.DPR*x, 0, this.viewport[Viewport.WIDTH]),
            clamp(this.DPR*y, 0, this.viewport[Viewport.HEIGHT]),
        ]);
    };

    public onMouseDown = (ev: MouseEvent): void => {
        this.lastMouseButton = ev.button;
    };

    public onMouseUp = (ev: MouseEvent) : void => {
        this.lastMouseButton = this.lastMouseButton === ev.button ? -1 : this.lastMouseButton;
    };
}