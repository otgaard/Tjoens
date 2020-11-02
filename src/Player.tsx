import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import Canvas from "./Canvas";
import React, {useEffect, useState} from "react";
import Audio from "./webAudio/Audio";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {useDispatch, useSelector} from "react-redux";
import {AppState, nextTrack, resetTrack, setAudioContext} from "./reducer";
import {Link} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import UploadDialog from "./UploadDialog";
import PlayList from "./UI/PlayList";

const useStyles = makeStyles((theme) => ({
    layout: {
        paddingTop: theme.spacing(8),
        paddingBottom: theme.spacing(8),
    },
}));

function toggleFullScreen() {
    if(!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if(document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// @ts-ignore
window.AudioContext = (window.AudioContext || window.webkitAudioContext);

// @ts-ignore
export const isSafari = window.safari !== undefined;

export const FFT_SIZE = 512;

enum PlayState {
    PS_PLAYING,
    PS_PAUSED,
    PS_STOPPED,
}

export default function Player() {
    const classes = useStyles();
    const [gain, setGain] = useState(.5);
    const audioElement = useSelector((state: AppState) => state.audioElement);
    const [playState, setPlayState] = useState(PlayState.PS_STOPPED);
    const playList = useSelector<AppState, File[]>(state => state.playList);
    const currentTrack = useSelector<AppState, number>(state => state.currentTrack);
    const [currentFile, setCurrentFile] = useState<File | null>(null);
    const dispatch = useDispatch();

    const stoppedEv = () => {
        dispatch(nextTrack());
    };

    const handleChange = (ev: any, newValue: any) => {
        console.log(newValue);
        setGain(newValue);
    };

    useEffect(() => {
        if(!audioElement) return;

        const ctx = new window.AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        const source = ctx.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        dispatch(setAudioContext(ctx, audioElement, source, analyser));
        audioElement.addEventListener("ended", stoppedEv);
    }, [audioElement]);

    useEffect(() => {
        if(audioElement) {
            if(playState === PlayState.PS_PLAYING) {
                if(currentTrack === playList.length) dispatch(resetTrack());
                audioElement.play();
            } else if(playState === PlayState.PS_PAUSED) {
                audioElement.pause();
            }
        }
    }, [playState]);

    useEffect(() => {
        console.log("Starting:", currentTrack, playList);
        if(currentTrack === playList.length) {
            setPlayState(PlayState.PS_STOPPED);
        } else {
            setCurrentFile(playList && currentTrack >= 0 ? playList[currentTrack] : null);
            if(audioElement && currentTrack !== 0) audioElement.play();
        }
    }, [playList, currentTrack]);

    return (
        <React.Fragment>
            <Audio file={currentFile} />
            <Container className={classes.layout} maxWidth="md">
                <Grid container spacing={4}>
                    <Grid item key={0} xs={12} sm={6} md={2}>
                        <UploadDialog />
                    </Grid>
                    <Grid item key={1} xs={12} sm={6} md={2}>
                        <PlayList />
                    </Grid>
                    <Grid item key={2} xs={12} sm={2} md={2}>
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
                    <Grid item key={3} xs={12} sm={6} md={3}>
                        <Grid container spacing={2}>
                            <Typography id="continuous-slider" gutterBottom>
                                Gain
                            </Typography>
                            <Grid item xs>
                                <Slider value={gain}
                                        defaultValue={.5}
                                        step={.05}
                                        marks
                                        min={.05}
                                        max={.95}
                                        valueLabelDisplay="auto"
                                        onChange={handleChange}
                                        aria-labelledby="continuous-slider" />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item key={4} xs={12} sm={2} md={2}>
                        <Link
                            href="https://support.shadowhealth.com/hc/en-us/articles/360009548313-Audio-issues-in-Safari"
                        >
                            Safari Problems
                        </Link>
                    </Grid>
                    <Grid item key={5} xs={12} sm={12} md={12} style={{height: "500px"}}>
                        <Canvas gain={gain}/>
                    </Grid>
                </Grid>
            </Container>
        </React.Fragment>
    );
}
