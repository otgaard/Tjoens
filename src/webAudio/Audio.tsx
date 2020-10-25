import React, {useCallback, useEffect, useState} from "react";
import {useDispatch} from "react-redux";
import {setAudioElement, setAudioFile} from "../reducer";

// @ts-ignore
window.AudioContext = (window.AudioContext || window.webkitAudioContext);

// @ts-ignore
export const isSafari = window.safari !== undefined;

export interface AudioProps {
    file: File | null;
}

export default function Audio(props: AudioProps) {
    const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
    //const audioCtx = useSelector((state: AppState) => state.audioContext);
    const dispatch = useDispatch();

    const onAudioRefChanged = useCallback(ref => {
        setAudioRef(ref);
    },  []);

    useEffect(() => {
        console.log("props.file:", props.file);
        if(props.file != null && audioRef) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if(audioRef) {
                    dispatch(setAudioElement(audioRef));

                    const wasPlaying = !audioRef.paused;
                    audioRef.src = e && e.target && e.target.result as string || "";
                    /*
                    if(!audioCtx) {
                        const ctx = new window.AudioContext();
                        const analyser = ctx.createAnalyser();
                        analyser.fftSize = 256;
                        const source = ctx.createMediaElementSource(audioRef);
                        source.connect(analyser);
                        analyser.connect(ctx.destination);

                        dispatch(setAudioContext(ctx, audioRef, source, analyser, props.file));
                    } else {
                        if(wasPlaying) audioRef.play();
                        dispatch(setAudioFile(props.file));
                    }
                    */

                    if(wasPlaying) audioRef.play();
                    dispatch(setAudioFile(props.file));
                }
            };
            reader.readAsDataURL(props.file);
        }
    }, [props.file]);

    return (
        <audio
            ref={onAudioRefChanged}
        />
    );
}