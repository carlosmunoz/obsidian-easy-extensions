import { App } from "obsidian";
import ExtensionPlugin from "./main";

export interface ExtensionApi {
    app: App;
    plugin: ExtensionPlugin
    getPlugin(identifier: string): any;
}

export interface Extension {
    name: string;
    description?: string;
    onLoad: (api: ExtensionApi) => void;
    onUnload?: (api: ExtensionApi) => void;
}

