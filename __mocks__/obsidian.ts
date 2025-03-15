export class Modal { }
export class Notice { }
export class Plugin {
    loadData() { }
    saveData() { }
    addRibbonIcon() {
        return {
            addClass: () => { }
        };
    }
    addStatusBarItem() {
        return {
            setText: () => { }
        };
    }
    addCommand() { }
    addSettingTab() { }
    registerDomEvent() { }
    registerInterval() { }
}
export class PluginSettingTab { }
export class Setting { }
export class AbstractInputSuggest { }