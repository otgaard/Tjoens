import React from "react";
import makeStyles from "@material-ui/core/styles/makeStyles";
import createMuiTheme from "@material-ui/core/styles/createMuiTheme";
import {MuiThemeProvider} from "@material-ui/core";
import CssBaseline from "@material-ui/core/CssBaseline";
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
        action: {
            selected: "rgba(0, 0, 0, 0.5)",
        },
        background: {
            default: "#222222",
            paper: "#333333",
        },
        text: {
            primary: "#ffffff",
            secondary: "#999",
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
