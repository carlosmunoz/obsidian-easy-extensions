# Obsidian Easy Extensions Plugin

The Easy extensions plugin provides a way to extend Obsidian's functionality without the need to create and install custom plugins. Extensions are javascript objects that live in your vault and can be easily shared with others. The plugin makes the Obsidian APIs available to use, and it also adds its own API to facilitate certain actions.

## Creating your first extension

Extensions are javascript files that the plugin loads from a specified location. A basic extension looks like this:

```js
{
    name: "My First Extension",
    description: "A sample extension",
    onLoad: (api) => {
        // loading code goes here
    },
    onUnload: (api) => {
        // unloading code goes here
    }
}
```

If you prefer to write your extensions as classes, this will also work:

```js
(function() {
    const Extension = class {
        constructor() {
            this.name = "My First Extension";
            this.description = "A sample extension";
        }

        onLoad(api) {
            // loading code goes here
        }

        onUnload(api) {
            // unloading code goes here
        }
    };
    return new Extension();
})();
```

Before creating an extension, go to the plugin settings and configure the location in your vault where your extensions will be stored.

To create an extension you can call the `Create New Extension` command from the command palette. You should now be able to edit your extension js file. An extension has the following properties:

| Name | Optional | Description|
|------|----------|------------|
|name  |No        |Unique name for the extension|
|description|Yes|Something to help you be reminded of the purpose of the extension|
|onLoad|No |Function that takes a single parameter (the extension API) and may return true or false indicating successful execution. This function will be invoked every time the extension is loaded. |
|OnUnload|Yes|Similar function to onLoad that will be invoked every time the extension is unloaded. Every command, event, etc that is registered in the onLoad function must be deregistered in the onUnload function.

## API

The Extension API is a single, convenient way to access obsidian objects like `App` and the Extension plugin itself. It's aim is also to offer simple methods and access to other obsidian utility types (e.g. Notice) to your custom extensions.

For example, to create a notice using the obsidian API during the `onLoad` function you can do something like:

```js
onLoad: (api) => {
    new api.Notice("This is a notice!");
}
```

### Commands
You can also register new commands using the obsidian plugin API; you need to do it by accessing the plugin from the API itself:

```js
onLoad: (api) => {
    api.plugin.addCommand({
        id: 'command-id',
        name: 'Execute some command',
        callback: () => {
            new api.Notice("Command executed!");
        }
    });
}
```

Always remember to remove any commands your extension adds in the `onUnload` method. Otherwise the commands will linger even if the extension is removed. They can still be removed by reloading or uninstalling the plugin, but extensions should be self-contained and clean after themselves.

```js
onUnload: (api) => {
    api.plugin.removeCommand('command-id');
}
```

TODO: Link to the Obsidian command api reference

### Events

Similarly, extensions can register new events using the API and they must also ensure the events are turned off when unloading.

```js
onLoad: (api) => {
    // create and register an event
    this.renameEvt = api.app.vault.on('rename', async (file, oldPath) => {
        console.log('Renaming a file');
    })
    api.plugin.registerEvent(this.renameEvt);
},
onUnload: (api) => {
    // turn the event off when unloading
    api.app.vault.offref(this.renameEvt);
}
```

## Installation



### Manual Installation

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

---

# Obsidian Sample Plugin

This is a sample plugin for Obsidian (https://obsidian.md).

This project uses TypeScript to provide type checking and documentation.
The repo depends on the latest plugin API (obsidian.d.ts) in TypeScript Definition format, which contains TSDoc comments describing what it does.

This sample plugin demonstrates some of the basic functionality the plugin API can do.
- Adds a ribbon icon, which shows a Notice when clicked.
- Adds a command "Open Sample Modal" which opens a Modal.
- Adds a plugin setting tab to the settings page.
- Registers a global click event and output 'click' to the console.
- Registers a global interval which logs 'setInterval' to the console.

## First time developing plugins?

Quick starting guide for new plugin devs:

- Check if [someone already developed a plugin for what you want](https://obsidian.md/plugins)! There might be an existing plugin similar enough that you can partner up with.
- Make a copy of this repo as a template with the "Use this template" button (login to GitHub if you don't see it).
- Clone your repo to a local development folder. For convenience, you can place this folder in your `.obsidian/plugins/your-plugin-name` folder.
- Install NodeJS, then run `npm i` in the command line under your repo folder.
- Run `npm run dev` to compile your plugin from `main.ts` to `main.js`.
- Make changes to `main.ts` (or create new `.ts` files). Those changes should be automatically compiled into `main.js`.
- Reload Obsidian to load the new version of your plugin.
- Enable plugin in settings window.
- For updates to the Obsidian API run `npm update` in the command line under your repo folder.

## Releasing new releases

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: https://github.com/obsidianmd/obsidian-sample-plugin/releases
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments. Note: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- Publish the release.

> You can simplify the version bump process by running `npm version patch`, `npm version minor` or `npm version major` after updating `minAppVersion` manually in `manifest.json`.
> The command will bump version in `manifest.json` and `package.json`, and add the entry for the new version to `versions.json`

## Adding your plugin to the community plugin list

- Check the [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines).
- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at https://github.com/obsidianmd/obsidian-releases to add your plugin.

## How to use

- Clone this repo.
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- `npm run dev` to start compilation in watch mode.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

## Improve code quality with eslint (optional)
- [ESLint](https://eslint.org/) is a tool that analyzes your code to quickly find problems. You can run ESLint against your plugin to find common bugs and ways to improve your code. 
- To use eslint with this project, make sure to install eslint from terminal:
  - `npm install -g eslint`
- To use eslint to analyze this project use this command:
  - `eslint main.ts`
  - eslint will then create a report with suggestions for code improvement by file and line number.
- If your source code is in a folder, such as `src`, you can use eslint with this command to analyze all files in that folder:
  - `eslint .\src\`

## Funding URL

You can include funding URLs where people who use your plugin can financially support it.

The simple way is to set the `fundingUrl` field to your link in your `manifest.json` file:

```json
{
    "fundingUrl": "https://buymeacoffee.com"
}
```

If you have multiple URLs, you can also do:

```json
{
    "fundingUrl": {
        "Buy Me a Coffee": "https://buymeacoffee.com",
        "GitHub Sponsor": "https://github.com/sponsors",
        "Patreon": "https://www.patreon.com/"
    }
}
```

## API Documentation

See https://github.com/obsidianmd/obsidian-api
