import React, {useEffect, useRef, useState} from "react";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Renderer from "./webGL/Renderer";

const useStyles = makeStyles((/*theme*/) => ({
    canvas: {
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
    },
}));

/*
export interface CanvasProps {
}
*/

export default function Canvas(/*props: CanvasProps*/) {
    const classes = useStyles();
    const [renderer, setRenderer] = useState<Renderer | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if(canvasRef.current != null) {
            const ref = canvasRef.current;
            ref.width = ref.offsetWidth * window.devicePixelRatio;
            ref.height = ref.offsetHeight * window.devicePixelRatio;
            console.log("Canvas Dims:", ref.offsetWidth, ref.offsetHeight)
            console.log("Viewport:", ref.width, ref.height);
            console.log("DPR:", window.devicePixelRatio);
            setRenderer(new Renderer(ref));

            return function destroy() {
                renderer && renderer.unload();
            }
        }
        return () => {};
    }, [canvasRef]);

    return (
        <canvas
            ref={canvasRef}
            className={classes.canvas}
        />
    );
}
