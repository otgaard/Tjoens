import React from "react";
import ReactDOM from "react-dom";
import AppBar from "@material-ui/core/AppBar";
import {Toolbar} from "@material-ui/core";
import MusicNote from "@material-ui/icons/MusicNote";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Typography from "@material-ui/core/Typography";
import CssBaseline from "@material-ui/core/CssBaseline";

const useStyles = makeStyles((theme) => ({
    icon: {
        marginRight: theme.spacing(2),
    },
}));

function App() {
    const classes = useStyles();

    return (
        <React.Fragment>
            <CssBaseline />

            <AppBar position="relative">
                <Toolbar>
                    <MusicNote className={classes.icon} />
                    <Typography variant="h6" color="inherit" noWrap>
                        Tjoens - Dis Lekker
                    </Typography>
                </Toolbar>
            </AppBar>
        </React.Fragment>
    );
}

ReactDOM.render(
    <App />,
    document.getElementById("root")
);
