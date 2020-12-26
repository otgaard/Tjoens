import React from "react";
import ReactDOM from "react-dom";
import App from "./UI/App";
import { StylesProvider } from "@material-ui/core/styles";
import {CssBaseline, MuiThemeProvider} from "@material-ui/core";
import {Provider} from "react-redux";
import createMuiTheme from "@material-ui/core/styles/createMuiTheme";
import purple from "@material-ui/core/colors/purple";
import deepOrange from "@material-ui/core/colors/deepOrange";
import {createStore} from "redux";
import {appReducer} from "./reducer";

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
            default: "#222",
            paper: "#333",
        },
        text: {
            primary: "#fff",
            secondary: "#999",
        },
    }
});

const store = createStore(appReducer);

// Setup material-ui theme, Redux store, and css injection for styled-components compatibility

const AppSetupWrapper = () => {
    return (
        <StylesProvider injectFirst>
            <MuiThemeProvider theme={defaultTheme}>
                <React.Fragment>
                    <CssBaseline />
                    <Provider store={store}>
                        <App />
                    </Provider>
                </React.Fragment>
            </MuiThemeProvider>
        </StylesProvider>
    );
}

ReactDOM.render(
    <AppSetupWrapper />,
    document.getElementById("root")
);
