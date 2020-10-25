import React from "react";
import makeStyles from "@material-ui/core/styles/makeStyles";
import createMuiTheme from "@material-ui/core/styles/createMuiTheme";
import {MuiThemeProvider} from "@material-ui/core";
import CssBaseline from "@material-ui/core/CssBaseline";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import MusicNote from "@material-ui/icons/MusicNote";
import Typography from "@material-ui/core/Typography";
import purple from "@material-ui/core/colors/purple";
import deepOrange from "@material-ui/core/colors/deepOrange";
import {createStore} from "redux";
import {Provider} from "react-redux";
import {appReducer} from "./reducer";
import Player from "./Player";

// Halloween Theme?
const defaultTheme = createMuiTheme({
    palette: {
        primary: {
            main: purple[500],

        },
        secondary: {
            main: deepOrange[500],
        },
        background: {
            default: "#222222",
        },
        text: {
            primary: "#ffffff",
            secondary: "#777",
        },
    }
});

const useStyles = makeStyles((theme) => ({
    icon: {
        marginRight: theme.spacing(2),
    },
    layout: {
        paddingTop: theme.spacing(8),
        paddingBottom: theme.spacing(8),
    },
    footer: {

    },
}));

const store = createStore(appReducer);

export default function App() {
    const classes = useStyles();

    return (
        <MuiThemeProvider theme={defaultTheme}>
            <Provider store={store}>
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
                    <main>
                        <Player />
                    </main>
                    <footer className={classes.footer}>
                        <Typography variant="subtitle1" align="center" color="textSecondary" component="p">
                            Copyright 2020, Darren Otgaar. All rights reserved.
                        </Typography>
                    </footer>
                </React.Fragment>
            </Provider>
        </MuiThemeProvider>
    );
}
