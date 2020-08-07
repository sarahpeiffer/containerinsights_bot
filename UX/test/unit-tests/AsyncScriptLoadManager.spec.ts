import { assert } from 'chai';
import { AsyncScriptLoadManager } from '../../src/scripts/container/AsyncScriptLoadManager';

suite('unit | AsyncScriptLoadManager', () => {
    const scriptName = 'script.js';

    // document 'emulator'
    let document: any = {
        createElement: (name: string) => { document[name] = {}; return document[name]; },
        head: {
            appendChild: (element: any): void => {}
        }
    };

    setup(() => {
        (global as any).document = document;
    });

    test('It injects <script> element into document when load() is invoked', () => {
        /** arrange */
        const manager = new AsyncScriptLoadManager(scriptName, () => false, 50, 100);

        /** act */
        return manager.load()
        /** assert */
            .then(() => { 
                assert.fail('must not reach then()'); 
            })
            .catch((error) => {
                assert.isDefined(document.script); 
            });
    });

    test('It injects <script> element with src property of script name', () => {
        /** arrange */
        const manager = new AsyncScriptLoadManager(scriptName, () => false, 50, 100);

        /** act */
        return manager.load()
        /** assert */
            .then(() => {
                assert.fail('must not reach then()');
            })
            .catch((error) => {
                assert.isDefined(document.script);
                assert.equal(document.script.src, scriptName);
            });
    });

    test('It injects <script> element with async = false', () => {
        /** arrange */
        const manager = new AsyncScriptLoadManager(scriptName, () => false, 50, 100);

        /** act */
        return manager.load()
        /** assert */
            .then(() => {
                assert.fail('must not reach then()');
            })
            .catch((error) => {
                assert.isDefined(document.script);
                assert.isFalse(document.script.async);
            });
    });

    test('It resolves promise in case check reports "script is loaded"', () => {
        /** arrange */
        const manager = new AsyncScriptLoadManager(scriptName, () => true, 25, 200);

        /** act */
        return manager.load()
        /** assert */
            .then(() => {
                assert.isTrue(true);
            })
            .catch((error) => {
                assert.fail('must not reach catch()');
            });
    });

    test('It rejects promise in case check throws', () => {
        /** arrange */
        const errorMessage = 'failed';
        const expectedError = new Error(errorMessage);
        const manager = new AsyncScriptLoadManager(scriptName, () => { throw new Error(errorMessage); }, 25, 200);

        /** act */
        return manager.load()
        /** assert */
            .then(() => {
                assert.fail('must not reach then()');
            })
            .catch((error) => {
                assert.isDefined(error.message);
                assert.equal(error.message, expectedError.message);
            });
    });

    test('It rejects promise with timeout in case check never reports "script loaded"', () => {
        /** arrange */
        const expectedError = `Script ${scriptName} load timed out`;
        const manager = new AsyncScriptLoadManager(scriptName, () => false, 25, 200);

        /** act */
        return manager.load()
        /** assert */
            .then(() => {
                assert.fail('must not reach then()');
            })
            .catch((error) => {
                assert.equal(error, expectedError);
            });
    });
});
