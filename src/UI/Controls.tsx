import React from "react";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import PlayIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import SkipPreviousIcon from "@material-ui/icons/SkipPrevious";
import SkipNextIcon from "@material-ui/icons/SkipNext";
import StopIcon from "@material-ui/icons/Stop";
import {useDispatch, useSelector} from "react-redux";
import {AppState, nextTrack, PlayState, prevTrack, setPlayState} from "../reducer";
import styled from "styled-components";
import {purple} from "@material-ui/core/colors";
import UploadDialog from "../UploadDialog";
import PlayList from "./PlayList";

interface BCGProps {
    color: string;
}

const BackgroundColorGrid = styled(Grid)<BCGProps>`
    background-color: ${(props: BCGProps) => props.color};
    border-radius: 4px;
`;

export default function Controls() {
    const playState = useSelector<AppState, PlayState>(state => state.playState);
    const dispatch = useDispatch();

    return (
        <BackgroundColorGrid color={purple[500]} container spacing={1} direction="row" alignItems="center" justify="center">
            <Grid item key={0} xs="auto">
                <IconButton onClick={() => dispatch(prevTrack())}>
                    <SkipPreviousIcon htmlColor="#fff" />
                </IconButton>
            </Grid>
            <Grid item key={1} xs="auto">
                <IconButton onClick={
                    () => {
                        if(playState === PlayState.PS_STOPPED || playState === PlayState.PS_PAUSED)
                            dispatch(setPlayState(PlayState.PS_PLAYING));
                        else if(playState === PlayState.PS_PLAYING)
                            dispatch(setPlayState(PlayState.PS_PAUSED));
                    }
                }>
                    { playState === PlayState.PS_PLAYING ? <PauseIcon htmlColor="#fff"  /> : <PlayIcon htmlColor="#fff" /> }
                </IconButton>
            </Grid>
            <Grid item key={2} xs="auto">
                <IconButton onClick={() => dispatch(nextTrack())}>
                    <SkipNextIcon htmlColor="#fff" />
                </IconButton>
            </Grid>
            <Grid item key={3} xs="auto">
                <IconButton onClick={() => dispatch(setPlayState(PlayState.PS_STOPPED))}>
                    <StopIcon htmlColor="#fff" />
                </IconButton>
            </Grid>
            <Grid item key={4} xs={1}>

            </Grid>
            <Grid item key={5} xs="auto">
                <UploadDialog />
            </Grid>
            <Grid item key={6} xs="auto">
                <PlayList />
            </Grid>
        </BackgroundColorGrid>
    );
}