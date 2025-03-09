import { App, Modal, Notice, Plugin, TAbstractFile, TFile, TFolder } from 'obsidian';
import { Extension, ExtensionApi } from './extension-api';
import { ExtensionApiImpl, InternalExtensionWrapper } from "./extension-impl";
import { Settings, SettingsTab } from './settings';

// Remember to rename these classes and interfaces!

// REMOVE
interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: Settings = {
	extensionFolder: 'Extensions'
}

export default class ExtensionPlugin extends Plugin {
	settings: Settings;
	apiImpl: ExtensionApi = new ExtensionApiImpl(this.app, this);
	extensions: InternalExtensionWrapper[] = [];

	async onload() {
		await this.loadSettings();
		this.registerReloadCommand();
		this.registerNewExtensionCommand();
		await this.scanAndLoadExtensions();

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

	async scanAndLoadExtensions() {
		this.extensions = []; // clear out the existing extensions
		const extDir = this.app.vault.getFolderByPath(this.settings.extensionFolder);
		if (!extDir) {
			new Notice('Extensions folder not found');
		}
		else {
			const findExtensionFiles = (f: TAbstractFile) => {
				let foundFiles: TFile[] = [];
				if (f instanceof TFile) {
					if (f.extension === 'js') {
						foundFiles.push(f);
					}
				}
				else if (f instanceof TFolder) {
					for (const file of f.children) {
						foundFiles.push(...findExtensionFiles(file));
					}
				}
				return foundFiles;
			};

			for (const atmFile of findExtensionFiles(extDir)) {
				const code = await this.app.vault.read(atmFile);
				const fn = new Function(`return ${code}`);
				const extension: Extension = fn();
				const intWrapper = new InternalExtensionWrapper(extension, atmFile.path);
				this.extensions.push(intWrapper);

				console.log("Loaded extension: " + extension.name);

				// Load each extension
				try {
					extension.onLoad(this.apiImpl);
				}
				catch (e) {
					console.error(e);
					new Notice(`Error loading extension '${extension.name}'. See more in the console.`);
				}
			}
		}
	}

	onunload() {
		this.unloadAllExtensions();
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
			id: "reload-extensions",
			name: "Reload all extensions",
			callback: async () => {
				this.unloadAllExtensions();
				await this.scanAndLoadExtensions();
				new Notice("Automations have been reloaded");
			}
		});
	}

	private registerNewExtensionCommand() {
		this.addCommand({
			id: "new-extension",
			name: "Create New Extension",
			callback: async () => {
				const extDir = this.app.vault.getFolderByPath(this.settings.extensionFolder);
				if (!extDir) {
					new Notice('Extensions folder not found');
					return;
				}

				var extName = `New Extension`;
				const extDesc = 'Brand new extension';
				const extContent = `{
    name: "${extName}",
    description: "${extDesc}",
    onLoad: (api) => {
        api.showNotice("Loaded Extension");
    },
    onUnload: (api) => {
        api.showNotice("Unloaded Extension");
    }
}
				`;

				// if the file already exists
				var idx = 1;
				while(this.app.vault.getFileByPath(`${extDir.path}/${extName}.js`)) {
					extName = `${extName}-${idx++}`;
				}

				const extFile = await this.app.vault.create(`${extDir.path}/${extName}.js`, extContent);
				// open the extension file
				this.app.workspace.getLeaf(true).openFile(extFile);
			}
		});
	}

	unloadAllExtensions() {
		this.extensions.forEach(extWrapper => {
			if (extWrapper.instance.onUnload) {
				try {
					extWrapper.instance.onUnload(this.apiImpl);	
				} catch (error) {
					console.error(`Error when unloading extension: ${extWrapper.instance.name}`, error);
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
