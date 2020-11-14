import React, {useEffect, useRef, useState} from "react";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Renderer from "./webGL/Renderer";
import {AppState} from "./reducer";
import {useSelector} from "react-redux";

const useStyles = makeStyles(() => ({
    canvas: {
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
    },
}));

export interface CanvasProps {
    gain: number;
    module: string;
}

export default function Canvas(props: CanvasProps) {
    const classes = useStyles();
    const [renderer, setRenderer] = useState<Renderer | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analyser = useSelector((state: AppState) => state.analyser);
    const delay = useSelector((state: AppState) => state.delay);

    useEffect(() => {
        renderer && renderer.setGain(props.gain);
    }, [props.gain]);

    useEffect(() => {
        renderer && renderer.setModule(props.module);
    }, [props.module]);

    useEffect(() => {
        if(canvasRef.current != null) {
            const ref = canvasRef.current;
            setRenderer(new Renderer(ref));

            return function destroy() {
                renderer && renderer.unload();
            };
        }
        return () => {};
    }, [canvasRef]);

    useEffect(() => {
        if(renderer && analyser) renderer.setAnalyser(analyser);
    }, [renderer, analyser]);

    useEffect(() => {
        if(renderer && delay) renderer.setDelay(delay);
    }, [renderer, delay]);

    return (
        <canvas
            ref={canvasRef}
            className={classes.canvas}
        />
    );
}
