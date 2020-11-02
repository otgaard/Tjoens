import React from "react";

export interface DirectoryInputProps {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    accept: string;
    type: string;
}

export enum DirectorySupport {
    DS_NONE,
    DS_WEBKIT,      // Support input webkitdirectory
    DS_MOZILLA,     // mozdirectory
}

const supportsDirectoryUpload = (): DirectorySupport => {
    const input = document.createElement("input");

    console.log(input.webkitdirectory);

    // @ts-ignore
    if(typeof(input.webkitdirectory) !== "boolean") {
        console.log("WEBKIT");
        return DirectorySupport.DS_WEBKIT;
    }

    // @ts-ignore
    if(typeof(input.mozdirectory) !== "boolean") {
        console.log("MOZILLA");
        return DirectorySupport.DS_MOZILLA;
    }

    return DirectorySupport.DS_NONE;
};

export const directorySupport = supportsDirectoryUpload();

interface InputAttribs {
    webkitdirectory?: string;
    mozdirectory?: string;
}

export default function DirectoryInput(props: DirectoryInputProps) {
    let attribs: InputAttribs = {};

    switch(directorySupport) {
        case DirectorySupport.DS_WEBKIT:
            attribs["webkitdirectory"] = "";
            break;
        case DirectorySupport.DS_MOZILLA:
            attribs["mozdirectory"] = "";
            break;
        case DirectorySupport.DS_NONE:
        default:
    }
    return (
        <input
            {...attribs}
            accept={props.accept}
            type={props.type}
            onChange={props.onChange}
        />
    );
}