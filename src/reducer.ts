const APP_ACTION = "TJOENS";

interface AppAction {
    type: string;
    data: {
        audioContext?: AudioContext | null;
        audioSource?: MediaElementAudioSourceNode | null;
        audioElement?: HTMLAudioElement | null;
        analyser?: AnalyserNode | null;
        audioFile?: File | null;
    }
}

export interface AppState {
    audioContext: AudioContext | null;
    audioSource: MediaElementAudioSourceNode | null;
    audioElement: HTMLAudioElement | null;
    analyser: AnalyserNode | null;
    audioFile: File | null;
}

const initialState: AppState = {
    audioContext: null,
    audioSource: null,
    audioElement: null,
    analyser: null,
    audioFile: null,
};

export function appReducer(state: AppState=initialState, action: AppAction): AppState {
    if(action.type !== APP_ACTION) return state;

    return {
        audioContext: action.data.audioContext || state.audioContext,
        audioSource: action.data.audioSource || state.audioSource,
        audioElement: action.data.audioElement || state.audioElement,
        analyser: action.data.analyser || state.analyser,
        audioFile: action.data.audioFile || state.audioFile,
    };
}

export function setAudioContext(
    ctx: AudioContext | null,
    el: HTMLAudioElement | null,
    source: MediaElementAudioSourceNode | null,
    analyser: AnalyserNode | null,
    file: File | null,
): AppAction {
    return {
        type: APP_ACTION,
        data: {
            audioContext: ctx,
            audioElement: el,
            audioSource: source,
            analyser: analyser,
            audioFile: file,
        }
    };
}

export function setAudioFile(file: File | null): AppAction {
    return {
        type: APP_ACTION,
        data: {
            audioFile: file,
        }
    };
}
