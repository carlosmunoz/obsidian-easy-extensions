import { App, Modal, Notice, Plugin, TAbstractFile, TFile, TFolder } from 'obsidian';
import { Extension, ExtensionApi } from './extension-api';
import { ExtensionApiImpl, InternalExtensionWrapper } from "./extension-impl";
import { Settings, SettingsTab } from './settings';

const DEFAULT_SETTINGS: Settings = {
	extensionFolder: 'Extensions'
}

export default class EasyExtensionsPlugin extends Plugin {
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
				const extension: Extension = this.loadExtensionFromJsCode(code) as Extension;
				const intWrapper = new InternalExtensionWrapper(extension, atmFile.path);
				this.extensions.push(intWrapper);

				console.log("Loaded extension: " + extension.name);

				// Load each extension
				const settings = extension.settings || {};
				try {
					extension.onLoad(this.apiImpl, settings);
				}
				catch (e) {
					console.error(e);
					new Notice(`Error loading extension '${extension.name}'. See more in the console.`);
				}
			}
		}
	}

	loadExtensionFromJsCode(code: string): Record<string, any> {
		const loader = new Function(`
			${code}
			const exports = {};
			
			exports.name = name;
			exports.description = description;
			exports.settings = settings;
			exports.onLoad = onLoad;
			exports.onUnload = onUnload;

			return exports;
		`.trim());
		return loader();
	}

	onunload() {
		this.unloadAllExtensions();
	}

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

				let extName = `New Extension`;
				const extDesc = 'Brand new extension';
				const extContent = `
name = "${extName}";
description = "${extDesc}";
settings = [];
onLoad = (api, settings) => {
	new api.Notice("Loaded Extension");
};
onUnload = (api, settings) => {
	new api.Notice("Unloaded Extension");
};
				`;

				// if the file already exists
				let idx = 1;
				while (this.app.vault.getFileByPath(`${extDir.path}/${extName}.js`)) {
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
					const settings = extWrapper.instance.settings || {};
					extWrapper.instance.onUnload(this.apiImpl, settings);
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
