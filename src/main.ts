import { Notice, Plugin, TAbstractFile, TFile, TFolder } from 'obsidian';
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

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingsTab(this.app, this));
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

			for (const extFile of findExtensionFiles(extDir)) {
				this.extensions.push(await this.loadExtension(extFile.path));
			}
		}
	}

	async loadExtension(filePath: string): Promise<InternalExtensionWrapper> {
		const intWrapper = new InternalExtensionWrapper();
		const extFile = this.app.vault.getFileByPath(filePath);
		if(extFile) {
			const code = await this.app.vault.cachedRead(extFile);
			intWrapper.filePath = extFile.path;
			intWrapper.enabled = false;
	
			try {
				const extension: Extension = this.loadExtensionFromJsCode(code, extFile.name) as Extension;
				intWrapper.instance = extension;
				console.log("Loaded extension: " + extension.name);
	
				try {
					// Load each extension
					const settings = extension.settings || {};
					extension.onLoad(this.apiImpl, settings);
					intWrapper.enabled = true;
					intWrapper.status = '🟢';
				}
				catch (e) {
					// this error happens when running the onLoad function from the extension
					intWrapper.enabled = false;
					intWrapper.status = '🛑 Error when loading the extension (see console for more details)';
					console.error(e);
					new Notice(`Error loading extension '${extension.name}'. See more in the console.`);
				}
			}
			catch (error) {
				// this error happens when parsing the extension code
				intWrapper.enabled = false;
				intWrapper.status = '🛑 Error in the extension javascript file (see console for more details)';
				console.error(error);
			}
		}
		else {
			intWrapper.status = 'Extension file not found';
		}
		return intWrapper;
	}

	unloadExtension(extWrapper: InternalExtensionWrapper) {
		if (extWrapper.enabled && extWrapper.instance?.onUnload) {
			try {
				if (extWrapper.instance?.onUnload) {
					const settings = extWrapper.instance.settings || {};
					extWrapper.instance.onUnload(this.apiImpl, settings);
					extWrapper.status = 'Unloaded';
				}
			} 
			catch (error) {
				console.error(`Error when unloading extension: ${extWrapper.instance.name}`, error);
				extWrapper.status = '🛑 Error when unloading the extension (see console for more details)';
			}
			extWrapper.enabled = false;
		}
	}

	loadExtensionFromJsCode(code: string, extFileName: string): Record<string, any>{
		const loader = new Function(`
			${code}
			//# sourceURL=${extFileName}
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
			name: "Create new extension",
			callback: async () => {
				const extDir = this.app.vault.getFolderByPath(this.settings.extensionFolder);
				if (!extDir) {
					new Notice('Extensions folder not found');
					return;
				}

				let extName = `New extension`;
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
			this.unloadExtension(extWrapper);
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
