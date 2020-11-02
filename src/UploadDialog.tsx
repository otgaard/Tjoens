import React from "react";
import {useDispatch} from "react-redux";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import {enqueueFiles} from "./reducer";

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
        if(e.target.files) dispatch(enqueueFiles(e.target.files));
        handleClose();
    };

    return (
        <div>
            <Button variant="contained" color="primary" onClick={handleClickOpen}>
                Upload
            </Button>
            <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">Add to Playlist</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Select a file.
                    </DialogContentText>
                    <input
                        type="file"
                        accept="audio/*"
                        onChange={onFilesSelected}
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
        </div>
    );
}