/*
A simple module structure for creating WebGL resources, analysis, update, and render functions for the modules.
*/

import {RingTexture} from "../webGL/RingTexture";
import {Renderer} from "../webGL/Renderer";
import {isSet} from "../maths/functions";

export interface ModuleContext {
    gain: number;
    screenDims: Int32Array;     // The current screen resolution

    fftSize: number;            // The size of the fft set in the analyser
    fftBuffer: Uint8Array;      // The current fft buffer (changed very frame)
    binSize: number;            // The total bins stored in the sampleBuffer (cyclic buffer)
    dataBuffer: Uint8Array;     // Interleaved [frequency bin, min, max, avg over sampleBuffer]
    sampleSize: number;         // The total number of frames stored in sampleBuffer (duration of the cyclic buffer)
    sampleBuffer: Uint8Array;   // The sample buffer storing binSize * frameSize bins of frameSize length
    startIdx: number;           // The start idx for the circular buffers (advanced each frame)
    sampleTex: RingTexture;     // A texture storing the sample history.  CurrentRow provides the lead.
    fftChannels: FFTChannels;   // The channels to load into the sample texture
    delay: number;              // Delay in seconds
}

export const FFT_SIZE = 1024;
export const BIN_SIZE = 512;
export const SAMPLE_FRAMES = 60;
export const DEFAULT_DELAY = 3./60.;    // Seems the closest over a number of machines - move to config later

export enum FFTChannels {
    BIN = 1 << 0,
    MIN = 1 << 1,
    MAX = 1 << 2,
    AVG = 1 << 3,
    ALL = 15,
}

function calculateChannelCount(fftCh: FFTChannels): number {
    let ch = 0;
    ch += isSet(fftCh, FFTChannels.BIN) ? 1 : 0;
    ch += isSet(fftCh, FFTChannels.MIN) ? 1 : 0;
    ch += isSet(fftCh, FFTChannels.MAX) ? 1 : 0;
    ch += isSet(fftCh, FFTChannels.AVG) ? 1 : 0;
    return ch;
}

export const defaultContext: ModuleContext = {
    gain: .5,
    screenDims: new Int32Array([0, 0]),
    fftSize: FFT_SIZE,
    fftBuffer: new Uint8Array(FFT_SIZE),
    binSize: BIN_SIZE,
    dataBuffer: new Uint8Array(BIN_SIZE*calculateChannelCount(FFTChannels.BIN)),
    sampleSize: SAMPLE_FRAMES,
    sampleBuffer: new Uint8Array(BIN_SIZE*SAMPLE_FRAMES), // Use a delay to position the current
    startIdx: 0,
    sampleTex: new RingTexture([BIN_SIZE, SAMPLE_FRAMES, calculateChannelCount(FFTChannels.BIN)]),
    fftChannels: FFTChannels.BIN,
    delay: 0,
};

export function makeContext(fftSize: number, binSize: number, samples: number, ch=FFTChannels.ALL): ModuleContext {
    const chCount = calculateChannelCount(ch);

    return {
        gain: .5,
        screenDims: new Int32Array([0, 0]),
        fftSize: fftSize,
        fftBuffer: new Uint8Array(fftSize),
        binSize: binSize,
        dataBuffer: new Uint8Array(binSize * chCount),
        sampleSize: samples,
        sampleBuffer: new Uint8Array(binSize * samples), // Position the delay in the centre.
        startIdx: 0,
        sampleTex: new RingTexture([binSize, samples, chCount]),
        fftChannels: ch,
        delay: 0,
    };
}

// The Enumerator indicates which fields have updated.
export enum ModuleValue {
    SCREENDIMS,
    GAIN,
    ALL,
}

export interface Module {
    name: string;

    initialise: (rndr: Renderer, vtxShdr: WebGLShader, vbuf: WebGLBuffer) => ModuleContext | null;
    destroy: () => void;

    updateContext: (value: ModuleValue) => void;
    analysis?: () => void;
    update: (dt: number) => void;
    draw: () => void;
}