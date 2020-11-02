import React, {useEffect, useRef} from "react";
import {useDispatch} from "react-redux";
import {setAudioContext} from "../reducer";

export interface AudioProps {
    file: File | null;
}

export default function Audio(props: AudioProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const dispatch = useDispatch();

    useEffect(() => {
        console.log("props.file:", props.file);
        if(props.file != null && audioRef) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if(audioRef.current) {
                    const wasPlaying = !audioRef.current.paused;
                    audioRef.current.src = e.target && e.target.result as string || "";
                    if(wasPlaying) audioRef.current.play();
                    dispatch(setAudioContext(null, audioRef.current, null, null));
                }
            };
            reader.readAsDataURL(props.file);
        }
    }, [props.file]);

    return (
        <audio
            ref={audioRef}
        />
    );
}
