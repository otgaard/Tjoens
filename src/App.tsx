import React from "react";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Typography from "@material-ui/core/Typography";
import Player from "./Player";
import {Container} from "@material-ui/core";
import Link from "@material-ui/core/Link";

const useStyles = makeStyles((theme) => ({
    icon: {
        marginRight: theme.spacing(2),
    },
    layout: {
        paddingTop: theme.spacing(6),
        paddingBottom: theme.spacing(4),
    },
    footer: {

    },
}));

export default function App() {
    const classes = useStyles();

    return (
        <div>
            <Container className={classes.layout} maxWidth="lg">
                <main>
                    <Player />
                </main>
            </Container>
            <footer className={classes.footer}>
                <Typography variant="subtitle1" align="center" color="textSecondary" component="p">
                    &copy; 2020,&nbsp;
                    <Link
                        href="https://github.com/otgaard"
                    >
                        Darren Otgaar
                    </Link>
                    .&nbsp;All rights reserved.&nbsp;
                    <Link
                        href="https://support.shadowhealth.com/hc/en-us/articles/360009548313-Audio-issues-in-Safari"
                    >
                        Safari Problems
                    </Link>
                </Typography>
            </footer>
        </div>
    );
}
