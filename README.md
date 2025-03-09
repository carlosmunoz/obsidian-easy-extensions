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

Reference: [Obsidian Developer Documentation](https://docs.obsidian.md/Home)

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

This plugin is currently not available via the official Obsidian plugin repository. 

### Manual Installation

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.
