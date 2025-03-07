import { App, PluginSettingTab, Setting } from "obsidian";
import AutomatonPlugin from "src/main";

export class SettingsTab extends PluginSettingTab {

    plugin: AutomatonPlugin;
    
    constructor(app: App, plugin: AutomatonPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Automations Folder')
            .setDesc('Folder where automations are stored')
            .addText(text => text
                .setPlaceholder('Automations')
                .setValue(this.plugin.settings.automationsFolder)
                .onChange(async (value) => {
                    this.plugin.settings.automationsFolder = value;
                    await this.plugin.saveSettings();
                })
            );

        const headerNames = ['Name', 'Description', 'Active'];

        new Setting(containerEl)
            .setName("Refresh Automations")
            .addButton((button) =>
                button
                    .setIcon('refresh-ccw')
                    .onClick(async () => {
                        this.plugin.unloadAllAutomations();
                        await this.plugin.scanAndLoadAutomations();
                    })
            );

        new Setting(containerEl)
            .setName("Registered Automations")
            .setDesc("Shows a list of all registered automations. Reload the plugin or run the Reload automations command from the palette in case there are any missing.")
        const automationsList = containerEl.createEl('div');
        const table = automationsList.createEl('table', { cls: 'automations-list' });
        const thead = table.createEl('thead');
        const tbody = table.createEl('tbody');
        const tr = thead.createEl('tr');
        headerNames.forEach(headerName => {
            tr.createEl('th', { text: headerName });
        });
        this.plugin.automations.forEach(automation => {
            const tr = tbody.createEl('tr');
            tr.createEl('td', { text: automation.name });
            tr.createEl('td', { text: automation.description });
            tr.createEl('td', { text: 'Yes' });
        });
    }

}

export interface Settings {
    automationsFolder: string;
}