import { App, Notice } from "obsidian";
import EasyExtensionsPlugin from "./main";

export interface ExtensionApi {
    app: App;
    plugin: EasyExtensionsPlugin;
    Notice: typeof Notice;
    getPlugin(identifier: string): any;
}

export interface Extension {
    name: string;
    description?: string;
    settings?: any;
    onLoad: (api: ExtensionApi, settings?: any) => void;
    onUnload?: (api: ExtensionApi, settings?: any) => void;
}

