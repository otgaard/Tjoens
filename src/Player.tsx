import Grid from "@material-ui/core/Grid";
import Canvas from "./Canvas";
import React, {useEffect, useState} from "react";
import Audio from "./webAudio/Audio";
import {useDispatch, useSelector} from "react-redux";
import {AppState, nextTrack, PlayState, resetTrack, setAudioContext, setPlayState} from "./reducer";
import Controls from "./UI/Controls";
import {Typography} from "@material-ui/core";
import {FFT_SIZE} from "./Modules/Module";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";

/*
const useStyles = makeStyles((theme) => ({
}));
*/

/*
function toggleFullScreen() {
    if(!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if(document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}
*/

// @ts-ignore
window.AudioContext = (window.AudioContext || window.webkitAudioContext);

// @ts-ignore
export const isSafari = window.safari !== undefined;

export default function Player() {
    const [gain, setGain] = useState(.5);
    const [module, setModule] = useState("histogram");

    const audioElement = useSelector((state: AppState) => state.audioElement);
    const playState = useSelector<AppState, PlayState>(state => state.playState);

    const playList = useSelector<AppState, File[]>(state => state.playList);
    const currentTrack = useSelector<AppState, number>(state => state.currentTrack);
    const [currentFile, setCurrentFile] = useState<File>(null);
    const dispatch = useDispatch();

    const stoppedEv = () => {
        dispatch(nextTrack());
    };

    // @ts-ignore
    const handleChange = (ev: any, newValue: any) => {
        console.log(newValue);
        setGain(newValue);
    };

    useEffect(() => {
        if(!audioElement) return;

        const ctx = new window.AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = FFT_SIZE;

        const delay = ctx.createDelay(1.0);
        delay.delayTime.value = 3./60.;

        const source = ctx.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(delay);
        delay.connect(ctx.destination);
        dispatch(setAudioContext(ctx, audioElement, source, analyser, delay));
        audioElement.addEventListener("ended", stoppedEv);

        //console.log("Audio Context Started");
    }, [audioElement]);

    useEffect(() => {
        //console.log("PLAYSTATE CHANGED");
        if(audioElement) {
            if(playState === PlayState.PS_PLAYING) {
                if(currentTrack === playList.length) dispatch(resetTrack());
                audioElement.play();
            } else if(playState === PlayState.PS_PAUSED) {
                audioElement.pause();
            } else if(playState === PlayState.PS_STOPPED) {
                audioElement.pause();
                dispatch(resetTrack());
            }
        }
    }, [playState]);

    useEffect(() => {
        //console.log("Starting:", currentTrack, playList);
        if(currentTrack === playList.length) {
            dispatch(setPlayState(PlayState.PS_STOPPED));
        } else {
            setCurrentFile(playList && currentTrack >= 0 ? playList[currentTrack] : null);
            if(audioElement && currentTrack !== 0) audioElement.play();
        }
    }, [playList, currentTrack]);

    return (
        <React.Fragment>
            <Audio file={currentFile} />

            <Grid container spacing={5} style={{justifyContent: "space-between"}}>
                <Grid item key={1} xs={6} >
                    <Controls />
                </Grid>

                <Grid item key={2} xs={2}>
                    <InputLabel id="module-select-label">Module</InputLabel>
                    <Select
                        labelId="module-select-label"
                        value={module}
                        onChange={e => {
                            setModule(e.target.value ? e.target.value as string : "histogram");
                        }}
                    >
                        <MenuItem value="histogram">Histogram</MenuItem>
                        <MenuItem value="spectrogram">Spectrogram</MenuItem>
                    </Select>
                </Grid>

                <Grid item key={4} xs={1} >
                    <Typography variant="h3" color="textPrimary" style={{display: "inline", float: "right", color: "#ff5722"}}>
                        Tjoens
                    </Typography>
                </Grid>
                <Grid item key={5} xs={12} sm={12} md={12} style={{height: "600px"}}>
                    <Canvas gain={gain} module={module}/>
                </Grid>
            </Grid>
        </React.Fragment>
    );
}
