import React from "react";
import Button from "@material-ui/core/Button";
import SwipeableDrawer from "@material-ui/core/SwipeableDrawer";
import {useState} from "react";
import List from "@material-ui/core/List";
import ListItemText from "@material-ui/core/ListItemText";
import ListItem from "@material-ui/core/ListItem";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {useSelector} from "react-redux";
import {AppState} from "../reducer";
import deepOrange from "@material-ui/core/colors/deepOrange";

const useStyles = makeStyles((theme) => ({
    layout: {
        paddingTop: theme.spacing(8),
        paddingBottom: theme.spacing(8),
    },
    BackdropProps: {
        background: "transparent",
    },
    playlist: {
        height: "100%",
        width: "400px",
    },
    paper: {
        backgroundColor: "rgba(100, 100, 100, .5)",
    },
    listEl: {
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "nowrap",
    },
    selectedText: {
        color: deepOrange[500],
    }
}));

export default function PlayList() {
    const styles = useStyles();
    const playList = useSelector<AppState, File[]>(state => state.playList);
    const currentTrack = useSelector<AppState, number>(state => state.currentTrack);
    const [open, setOpen] = useState(false);

    return (
        <React.Fragment>
            <Button variant="contained" color="primary" onClick={() => setOpen(true)}>PlayList</Button>
            <SwipeableDrawer
                anchor="left"
                classes={{paper: styles.paper}}
                open={open}
                onClose={() => setOpen(false)}
                onOpen={() => setOpen(true)}
                ModalProps={{
                    BackdropProps:{
                        classes: {
                            root: styles.BackdropProps
                        }
                    }
                }}
            >
                <div className={styles.playlist}>
                    <List dense={false}>
                        {
                            playList.map((f, i) => {
                                return (
                                     <ListItem key={i} className={styles.listEl} selected={i == currentTrack}>
                                         <div className={styles.listEl}>
                                             {i === currentTrack ?
                                                 <ListItemText
                                                     classes={{ primary: styles.selectedText }}
                                                     primary={(i + 1) + " - " + f.name}
                                                 /> :
                                                 <ListItemText
                                                     primary={(i + 1) + " - " + f.name}
                                                 />
                                             }
                                         </div>
                                    </ListItem>
                                );
                            })
                        }
                    </List>
                </div>
            </SwipeableDrawer>
        </React.Fragment>
    );
}