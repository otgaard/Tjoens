import makeStyles from "@material-ui/core/styles/makeStyles";
import createMuiTheme from "@material-ui/core/styles/createMuiTheme";
import {MuiThemeProvider} from "@material-ui/core";
import React from "react";
import CssBaseline from "@material-ui/core/CssBaseline";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import MusicNote from "@material-ui/icons/MusicNote";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import purple from "@material-ui/core/colors/purple";
import deepOrange from "@material-ui/core/colors/deepOrange";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Canvas from "./Canvas";

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

export default function App() {
    const classes = useStyles();

    return (
        <MuiThemeProvider theme={defaultTheme}>
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
                    <Container className={classes.layout} maxWidth="md">
                        <Grid container spacing={4}>
                            <Grid item key={0} xs={12} sm={6} md={3}>
                                <Button color="secondary" variant="contained">Open</Button>
                            </Grid>
                            <Grid item key={1} xs={12} sm={6} md={3}>
                                <Button color="secondary" variant="contained">Start</Button>
                            </Grid>
                            <Grid item key={2} xs={12} sm={6} md={3}>
                                <Button color="secondary" variant="contained">Stop</Button>
                            </Grid>
                            <Grid item key={3} xs={12} sm={6} md={3}>
                                <Button color="secondary" variant="contained">Randomise</Button>
                            </Grid>
                            <Grid item key={4} xs={12} sm={12} md={12} style={{height: "500px"}}>
                                <Canvas />
                            </Grid>
                        </Grid>

                    </Container>
                </main>
                <footer className={classes.footer}>
                    <Typography variant="subtitle1" align="center" color="textSecondary" component="p">
                        Copyright 2020, Darren Otgaar. All rights reserved.
                    </Typography>
                </footer>
            </React.Fragment>
        </MuiThemeProvider>
    );
}
