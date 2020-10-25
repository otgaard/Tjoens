import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import Canvas from "./Canvas";
import React, {useEffect, useState} from "react";
import Audio from "./webAudio/Audio";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {useDispatch, useSelector} from "react-redux";
import {AppState, setAudioContext} from "./reducer";

const useStyles = makeStyles((theme) => ({
    layout: {
        paddingTop: theme.spacing(8),
        paddingBottom: theme.spacing(8),
    },
}));

enum PlayState {
    PS_PLAYING,
    PS_PAUSED,
    PS_STOPPED,
}

export default function Player() {
    const classes = useStyles();
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const audioElement = useSelector((state: AppState) => state.audioElement);
    const [playState, setPlayState] = useState(PlayState.PS_STOPPED);
    const dispatch = useDispatch();

    const stoppedEv = () => setPlayState(PlayState.PS_STOPPED);

    useEffect(() => {
        if(!audioElement) return;

        console.log("Creating Audio Context");
        const ctx = new window.AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        const source = ctx.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        dispatch(setAudioContext(ctx, audioElement, source, analyser, null));
    }, [audioElement]);

    useEffect(() => {
        if(audioElement) {
            if(playState === PlayState.PS_PLAYING) {
                audioElement.play();
                audioElement.addEventListener("ended", stoppedEv);
            } else if(playState === PlayState.PS_PAUSED) {
                audioElement.pause();
            } else if(playState === PlayState.PS_STOPPED) {
                audioElement.removeEventListener("ended", stoppedEv);
            }
        }
    }, [playState, audioElement, audioFile]);

    return (
        <React.Fragment>
            <Audio file={audioFile} />
            <Container className={classes.layout} maxWidth="md">
                <Grid container spacing={4}>
                    <Grid item key={0} xs={12} sm={6} md={4}>
                        <input
                            accept="audio/*"
                            type="file"
                            onChange={e => setAudioFile(e && e.target && e.target.files && e.target.files[0])}
                        />
                    </Grid>
                    <Grid item key={1} xs={12} sm={6} md={4}>
                        <Button
                            color="secondary"
                            variant="contained"
                            onClick={() => {
                                if(playState === PlayState.PS_STOPPED || playState === PlayState.PS_PAUSED)
                                    setPlayState(PlayState.PS_PLAYING);
                                else if(playState === PlayState.PS_PLAYING)
                                    setPlayState(PlayState.PS_PAUSED);
                            }}
                        >
                            {playState === PlayState.PS_PLAYING ? "Pause" : "Play"}
                        </Button>
                    </Grid>
                    {/*
                    <Grid item key={2} xs={12} sm={6} md={3}>
                        <Button color="secondary" variant="contained">Stop</Button>
                    </Grid>
                    <Grid item key={3} xs={12} sm={6} md={3}>
                        <Button color="secondary" variant="contained">Randomise</Button>
                    </Grid>
                    */}
                    <Grid item key={4} xs={12} sm={12} md={12} style={{height: "500px"}}>
                        <Canvas />
                    </Grid>
                </Grid>
            </Container>
        </React.Fragment>
    );
}
