import { App, CachedMetadata, Command, Editor, EventRef, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TAbstractFile, TFile, TFolder, WorkspaceLeaf } from 'obsidian';
import { Settings, SettingsTab } from './settings';
import { Automation, AutomationApi } from './automation-api';
import { AutomationApiImpl } from "./automation-impl";
import * as path from 'path';

// Remember to rename these classes and interfaces!

// REMOVE
interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: Settings = {
	automationsFolder: 'Automations'
}

export default class AutomatonPlugin extends Plugin {
	settings: Settings;
	apiImpl: AutomationApi = new AutomationApiImpl(this.app, this);
	automations: Automation[] = [];

	async onload() {
		await this.loadSettings();
		this.registerReloadCommand();
		this.registerNewAutomationCommand();
		await this.scanAndLoadAutomations();

		// This creates an icon in the left ribbon.
		// const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
		// 	// Called when the user clicks the icon.
		// 	new Notice('This is a notice!');
		// });
		// Perform additional things with the ribbon
		// ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		// this.addCommand({
		// 	id: 'open-sample-modal-simple',
		// 	name: 'Open sample modal (simple)',
		// 	callback: () => {
		// 		new SampleModal(this.app).open();
		// 	}
		// });
		// This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: 'sample-editor-command',
		// 	name: 'Sample editor command',
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		console.log(editor.getSelection());
		// 		editor.replaceSelection('Sample Editor Command');
		// 	}
		// });
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: 'open-sample-modal-complex',
		// 	name: 'Open sample modal (complex)',
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	}
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingsTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	async scanAndLoadAutomations() {
		this.automations = []; // clear out the existing automations
		const automationsFolder = this.app.vault.getFolderByPath(this.settings.automationsFolder);
		if (!automationsFolder) {
			new Notice('Automations folder not found');
		}
		else {
			const findAutomationFiles = (f: TAbstractFile) => {
				let foundFiles: TFile[] = [];
				if (f instanceof TFile) {
					if (f.extension === 'js') {
						foundFiles.push(f);
					}
				}
				else if (f instanceof TFolder) {
					for (const file of f.children) {
						foundFiles.push(...findAutomationFiles(file));
					}
				}
				return foundFiles;
			};

			for (const atmFile of findAutomationFiles(automationsFolder)) {
				const code = await this.app.vault.read(atmFile);
				const fn = new Function(`return ${code}`);
				//console.log(fn());
				const automation: Automation = fn();
				this.automations.push(automation);

				console.log("Loaded automation: " + automation.name);

				// Load each automation
				try {
					automation.onLoad(this.apiImpl);
				}
				catch (e) {
					console.error(e);
					new Notice(`Error loading automation '${automation.name}'. See more in the console.`);
				}
			}
		}
	}

	onunload() {
		this.unloadAllAutomations();
	}

	// async reloadPlugin() {
	// 	const pluginId = this.manifest.id;

	// 	// Type assertion to access plugins safely
    //     const plugins = (this.app as any).plugins;
    //     if (!plugins || !plugins.disablePlugin || !plugins.enablePlugin) {
    //         console.error("Plugin management API not found.");
    //         return;
    //     }

	// 	await plugins.disablePlugin(pluginId);
	// 	// Wait a bit to ensure unloading is complete
    //     setTimeout(async () => {
    //         // Re-enable the plugin
    //         await plugins.enablePlugin(pluginId);
    //     }, 500);
	// }

	private registerReloadCommand() {
		this.addCommand({
			id: "reload-automations",
			name: "Reload Automations",
			callback: async () => {
				this.unloadAllAutomations();
				await this.scanAndLoadAutomations();
				new Notice("Automations have been reloaded");
			}
		});
	}

	private registerNewAutomationCommand() {
		this.addCommand({
			id: "new-automation",
			name: "Create New Automation",
			callback: async () => {
				const automationsFolder = this.app.vault.getFolderByPath(this.settings.automationsFolder);
				if (!automationsFolder) {
					new Notice('Automations folder not found');
					return;
				}

				var atmName = `new-automation`;
				const atmDesc = 'Brand new automation';
				const atmContent = `{
    name: "New Automation",
    description: "${atmDesc}",
    onLoad: (api) => {
        api.showNotice("Loaded Automation");
    },
    onUnload: (api) => {
        api.showNotice("Unloaded Automation");
    }
}
				`;

				// if the file already exists
				var idx = 1;
				while(this.app.vault.getFileByPath(automationsFolder.path + path.sep + atmName + '.js')) {
					atmName = `${atmName}-${idx++}`;
				}

				const atmFile = await this.app.vault.create(automationsFolder.path + path.sep + atmName + '.js', atmContent);
				// open the automation file
				this.app.workspace.getLeaf(true).openFile(atmFile);
			}
		});
	}

	unloadAllAutomations() {
		this.automations.forEach(automation => {
			if (automation.onUnload) {
				try {
					automation.onUnload(this.apiImpl);	
				} catch (error) {
					console.error(`Error when unloading automation: ${automation.name}`, error);
				}
			}
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
