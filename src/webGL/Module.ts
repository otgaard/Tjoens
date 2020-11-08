/*
A simple module structure for creating WebGL resources, analysis, update, and render functions for the modules.
*/

import {FFT_SIZE} from "../Player";

export interface ModuleContext {
    gain: number;
    screenDims: Int32Array;     // The current screen resolution

    fftSize: number;            // The size of the fft set in the analyser
    fftBuffer: Uint8Array;      // The current fft buffer (changed very frame)
    binSize: number;            // The total bins stored in the sampleBuffer (cyclic buffer)
    binBuffer: Float32Array;    // Normalised to [0..1] Float32
    frameSize: number;          // The total number of frames stored in sampleBuffer (duration of the cyclic buffer)
    sampleBuffer: Float32Array; // The sample buffer storing binSize * frameSize bins of frameSize length
    minMaxAvg: Float32Array;    // The min, max, avg of each bin per frame
    startIdx: number;           // The start idx for the circular buffers (advanced each frame)
}

const BIN_SIZE = 256;
const SAMPLE_FRAMES = 20;

export const defaultContext: ModuleContext = {
    gain: .5,
    screenDims: new Int32Array([0, 0]),
    fftSize: FFT_SIZE,
    fftBuffer: new Uint8Array(FFT_SIZE),
    binSize: BIN_SIZE,
    binBuffer: new Float32Array(BIN_SIZE),
    frameSize: SAMPLE_FRAMES,
    sampleBuffer: new Float32Array(BIN_SIZE*SAMPLE_FRAMES),
    minMaxAvg: new Float32Array(BIN_SIZE*3),
    startIdx: 0,
};

// The Enumerator indicates which fields have updated.
export enum ModuleValue {
    SCREENDIMS,
    GAIN,
    ALL,
}

export interface Module {
    shdrProg: WebGLProgram | null;
    name: string;

    initialise: (gl: WebGLRenderingContext, vtxShdr: WebGLShader, ctx: ModuleContext) => boolean;
    destroy: () => boolean;

    updateContext: (value: ModuleValue) => void;
    analysis?: () => void;
    update: (dt: number) => void;
    draw: () => void;
}