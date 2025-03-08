import { App, PluginSettingTab, Setting } from "obsidian";
import ExtensionPlugin from "src/main";

export class SettingsTab extends PluginSettingTab {

    plugin: ExtensionPlugin;
    
    constructor(app: App, plugin: ExtensionPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Extensions Folder')
            .setDesc('Folder where extensions are stored')
            .addText(text => text
                .setPlaceholder('extensions')
                .setValue(this.plugin.settings.extensionFolder)
                .onChange(async (value) => {
                    this.plugin.settings.extensionFolder = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName("Refresh Extensions")
            .addButton((button) =>
                button
                    .setIcon('refresh-ccw')
                    .onClick(async () => {
                        this.plugin.unloadAllExtensions();
                        await this.plugin.scanAndLoadExtensions();
                    })
            );

        containerEl.createEl('h1', { text: 'Registered Extensions' });

        this.plugin.extensions.forEach(extension => {
            new Setting(containerEl)
                .setName(extension.name)
                .setDesc(extension.description || '')
        });
    }

}

export interface Settings {
    extensionFolder: string;
}