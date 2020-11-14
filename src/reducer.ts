const APP_ACTION = "TJOENS";

export enum PlayState {
    PS_PLAYING,
    PS_PAUSED,
    PS_STOPPED,
}

interface AppAction {
    type: string;
    data: {
        audioContext?: AudioContext | null;
        audioSource?: MediaElementAudioSourceNode | null;
        audioElement?: HTMLAudioElement | null;
        analyser?: AnalyserNode | null;
        delay?: DelayNode | null;
        audioFile?: File | null;
        enqueueFiles?: FileList | null;
        nextTrack?: Boolean | null;
        prevTrack?: Boolean | null;
        resetTrack?: Boolean | null;
        playState?: PlayState | null;
    }
}

export interface AppState {
    audioContext: AudioContext | null;
    audioSource: MediaElementAudioSourceNode | null;
    audioElement: HTMLAudioElement | null;
    analyser: AnalyserNode | null;
    delay: DelayNode | null;
    audioFile: File | null;
    playList: Array<File>;
    currentTrack: number;
    playState: PlayState;
}

const initialState: AppState = {
    audioContext: null,
    audioSource: null,
    audioElement: null,
    analyser: null,
    delay: null,
    audioFile: null,
    playList: new Array<File>(),
    currentTrack: -1,
    playState: PlayState.PS_STOPPED,
};

function concatPlaylist(plist: Array<File>, flist: FileList): Array<File> {
    for(let i = 0; i !== flist.length; ++i) {
        plist.push(flist[i]);
    }
    return plist;
}

export function appReducer(state: AppState=initialState, action: AppAction): AppState {
    if(action.type !== APP_ACTION) return state;

    //console.log("REDUCER", action);

    if(action.data.enqueueFiles) {
        concatPlaylist(state.playList, action.data.enqueueFiles);
        if(state.currentTrack === -1) {
            return {
                ...state,
                currentTrack: 0,
            };
        }
    }

    if(action.data.playState != null) {
        //console.log("setting playstate...", action.data.playState);
        return {
            ...state,
            playState: action.data.playState,
        };
    }

    if(action.data.nextTrack || action.data.prevTrack) {
        return {
            ...state,
            currentTrack:
                action.data.nextTrack
                    ? Math.min(state.currentTrack + 1, state.playList.length)
                    : Math.max(state.currentTrack - 1, 0),
        };
    }

    if(action.data.resetTrack) {
        return {
            ...state,
            currentTrack: 0,
        };
    }

    return {
        ...state,
        audioContext: action.data.audioContext || state.audioContext,
        audioSource: action.data.audioSource || state.audioSource,
        audioElement: action.data.audioElement || state.audioElement,
        analyser: action.data.analyser || state.analyser,
        delay: action.data.delay || state.delay,
        audioFile: action.data.audioFile || state.audioFile,
    };
}

export function setAudioContext(
    ctx: AudioContext | null,
    el: HTMLAudioElement | null,
    source: MediaElementAudioSourceNode | null,
    analyser: AnalyserNode | null,
    delay: DelayNode | null,
): AppAction {
    return {
        type: APP_ACTION,
        data: {
            audioContext: ctx,
            audioElement: el,
            audioSource: source,
            analyser: analyser,
            delay: delay,
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

export function setAudioElement(el: HTMLAudioElement | null): AppAction {
    return {
        type: APP_ACTION,
        data: {
            audioElement: el,
        }
    };
}

export function enqueueFiles(flist: FileList):  AppAction {
    return {
        type: APP_ACTION,
        data: {
            enqueueFiles: flist,
        }
    };
}

export function nextTrack(): AppAction {
    return {
        type: APP_ACTION,
        data: {
            nextTrack: true,
        }
    };
}

export function prevTrack(): AppAction {
    return {
        type: APP_ACTION,
        data: {
            prevTrack: true,
        }
    };
}

export function resetTrack(): AppAction {
    return {
        type: APP_ACTION,
        data: {
            resetTrack: true,
        }
    };
}

export function setPlayState(playState: PlayState): AppAction {
    //console.log("setPlayState");
    return {
        type: APP_ACTION,
        data: {
            playState: playState,
        }
    };
}