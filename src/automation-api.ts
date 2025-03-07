import { App, Command, EventRef } from "obsidian";
import AutomatonPlugin from "./main";

export interface AutomationApi {
    app: App;
    plugin: AutomatonPlugin
    getPlugin(identifier: string): any;
}

export interface Automation {
    name?: string;
    description?: string;
    onLoad: (api: AutomationApi) => void;
    onUnload?: (api: AutomationApi) => void;
}

