import { App } from "obsidian";
import { Extension, ExtensionApi } from "./extension-api";
import ExtensionPlugin from "./main";


export class ExtensionApiImpl implements ExtensionApi {

    constructor(public app: App, public plugin: ExtensionPlugin) {
    }

    getPlugin(identifier: string) {
        const plugins = (this.app as any).plugins;
        const p = plugins.getPlugin(identifier);
        if (p) {
            return p;
        }
        return undefined;
    }

    private wrap<T extends (...args: any[]) => any>(
        fn: T,
        onError?: (error: Error, ...args: Parameters<T>) => void
    ): T {
        return ((
            ...args: Parameters<T>
        ): ReturnType<T> => {
            try {
                return fn(...args); // Call the original function
            } catch (error) {
                if (onError) onError(error, ...args); // Handle errors
                throw error; // Re-throw the error unless handled
            }
        }) as T;
    }
}

export class InternalExtensionWrapper {
    constructor(
        public readonly instance: Extension, 
        public readonly filePath: string) {
    }
}
