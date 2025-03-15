import { AbstractInputSuggest, App, PluginSettingTab, Setting } from "obsidian";
import EasyExtensionsPlugin from "src/main";

export class SettingsTab extends PluginSettingTab {

    plugin: EasyExtensionsPlugin;
    
    constructor(app: App, plugin: EasyExtensionsPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Extensions Folder')
            .setDesc('Folder where extensions are stored')
            .addSearch(search => {
                search.setPlaceholder('extensions')
                    .setValue(this.plugin.settings.extensionFolder)
                    .onChange(async (value) => {
                        new FolderSuggest(this.app, search.inputEl).open();
                        this.plugin.settings.extensionFolder = value;
                        await this.plugin.saveSettings();
                    });

                new FolderSuggest(this.app, search.inputEl);
            });

        new Setting(containerEl)
            .setName("Refresh Extensions")
            .addButton((button) =>
                button
                    .setIcon('refresh-ccw')
                    .onClick(async () => {
                        this.plugin.unloadAllExtensions();
                        await this.plugin.scanAndLoadExtensions();
                        this.display();
                    })
            );

        new Setting(containerEl).setName('Registered Extensions').setHeading();

        this.plugin.extensions.forEach(extWrapper => {
            new Setting(containerEl)
                .setName(extWrapper.instance.name)
                .setDesc(createFragment(fragment => {
                    fragment.appendText((extWrapper.instance.description || '' ));
                    fragment.createEl('br');
                    fragment.appendText(`File: ${extWrapper.filePath}`);
                }));
        });
    }

}

export interface Settings {
    extensionFolder: string;
}

class FolderSuggest extends AbstractInputSuggest<string> {

    private folders: string[];
    private inputEl: HTMLInputElement;

    constructor(app: App, inputEl: HTMLInputElement) {
        super(app, inputEl);
        this.inputEl = inputEl;
        this.folders = app.vault.getAllFolders().map(f => f.path);
    }

    protected getSuggestions(query: string): string[] | Promise<string[]> {
        return this.folders
            .filter(p => p.toLowerCase().startsWith(query.toLowerCase()));
    }

    renderSuggestion(value: string, el: HTMLElement): void {
        el.setText(value);
    }

    selectSuggestion(value: string, evt: MouseEvent | KeyboardEvent): void {
        super.selectSuggestion(value, evt);
        this.inputEl.value = value;
        this.inputEl.dispatchEvent(new Event("input"));
        this.close();
    }
}