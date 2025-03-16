import EasyExtensionsPlugin from '../src/main';

describe('EasyExtensionsPlugin Test', () => {
    let plugin: EasyExtensionsPlugin;

    beforeEach(() => {
        plugin = new EasyExtensionsPlugin({} as any, {} as any);
    });

    test('load extension from js code', () => {
        const extCode = `
            name = "Test Extension";
            description = "This is a test extension";
            settings = [];
            onLoad = (api, settings) => {};
            onUnload = (api, settings) => {};
            `;

        const ext = plugin.loadExtensionFromJsCode(extCode, "test.js");

        expect(ext).toBeDefined();
        expect(ext.name).toBe("Test Extension");
        expect(ext.description).toBe("This is a test extension");
        expect(ext.settings).toEqual([]);
        expect(typeof ext.onLoad).toBe('function');
        expect(typeof ext.onUnload).toBe('function');
    });

    test('call onLoad with api and NO settings', () => {
        // Given
        const api = {
            showNotice: jest.fn()
        };
        const extCode = `
            name = "Test Extension";
            description = "This is a test extension";
            settings = [];
            onLoad = (api) => {
                api.showNotice("Loaded Extension");
            };
            `;
        
        const ext = plugin.loadExtensionFromJsCode(extCode, "test.js");

        ext.onLoad(api, {});
        expect(api.showNotice).toHaveBeenCalledTimes(1);
    });

});