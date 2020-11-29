import React from "react";
import {useDispatch} from "react-redux";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import {enqueueFiles} from "./reducer";
import IconButton from "@material-ui/core/IconButton";
import PlayListAdd from "@material-ui/icons/PlaylistAdd";

const formatList = ["mp3", "m4a", "aac", "oga", "ogg", "flac", "wav", "pcm", "aiff"];

export default function UploadDialog() {
    const [open, setOpen] = React.useState(false);
    const dispatch = useDispatch();

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Convert the FileList to an array of files for sending to the audio player

        const input = e.target && e.target.files;
        if(!input) return;

        let counter = 0;
        let arr = new Array<File>(input.length);

        for(let i = 0; i !== input.length; ++i) {
            const name = input[i].name;
            const extOff = name.lastIndexOf(".");
            if(extOff === -1) continue;
            if(formatList.includes(name.substr(extOff+1).toLowerCase())) {
                arr[counter] = input[i];
                counter++;
            } else {
                console.log("Skipping:", name);
            }
        }

        const output = arr.slice(0, counter);
        console.log("Output:", output);
        console.log("arr:", arr);

        e.target && e.target.files ? dispatch(enqueueFiles(e.target.files)) : console.log("no files");

        handleClose();
    };

    /*
    const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files) dispatch(enqueueFiles(e.target.files));
        handleClose();
    };
    */

    return (
        <React.Fragment>
            <IconButton onClick={handleClickOpen}>
                <PlayListAdd htmlColor="#fff" />
            </IconButton>
            <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">Add to Playlist</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Select file(s).
                    </DialogContentText>
                    <input
                        type="file"
                        accept="audio/*"
                        onChange={onFilesSelected}
                        multiple={true}
                    />
                    <DialogContentText>
                        <br/>
                        Or Folder (if supported).
                    </DialogContentText>
                    <input
                        // @ts-ignore - Workaround for React issue
                        webkitdirectory=""
                        type="file"
                        accept="audio/*"
                        onChange={onFilesSelected}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
