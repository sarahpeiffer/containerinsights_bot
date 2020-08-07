import { assert } from 'chai';

import { SettingsManager } from '../../src/scripts/shared/SettingsManager';

class ComplexObject {
    private _more: string;

    public getMore(): string {
        return this._more;
    }
}

const realBefore = () => {
    SettingsManager.LoadSettings({setting: 'test', complex: { _more: 'test' }});
};

const realAfter = () => {
    SettingsManager.ClearSettings();
};

suite('class | SettingsManager', () => {
    suite('function | SettingsManager.LoadSettings()', () => {
        test('happy path', () => {
            SettingsManager.LoadSettings({setting: 'test', complex: { more: 'test' }});
            assert.strictEqual(SettingsManager.Get('setting'), 'test');
            realAfter();
        });

        test('null should be okay', () => {
            assert.doesNotThrow(() => {
                SettingsManager.LoadSettings(null);
                realAfter();
            });
        });
    
        test('empty should be okay', () => {
            assert.doesNotThrow(() => {
                SettingsManager.LoadSettings({});
                realAfter();
            });
        });
    });

    suite('function | SettingsManager.Get()', () => {
        test('Happy Path', () => {
            realBefore();
            assert.strictEqual(SettingsManager.Get('setting'), 'test');
            realAfter();
        });

        test('Get on uninitialized should function and return null', () => {
            assert.isNull(SettingsManager.Get('setting'));
        });

        test('Get on empty settings engine should return null', () => {
            SettingsManager.LoadSettings({});
            assert.isNull(SettingsManager.Get('setting'));
            realAfter();
        });

        test('Get on complex object should do something sane', () => {
            realBefore();
            const complex: string = SettingsManager.Get('complex');
            assert.strictEqual(complex, '{"_more":"test"}');
            realAfter();
        });
    });

    suite('function | SettingsManager.GetObject<T>()', () => {
        test('Happy Path on Very Complex Object', () => {
            realBefore();
            const complex: any = SettingsManager.GetObject('complex', new ComplexObject());

            assert.isNotNull(complex);
            assert.isObject(complex);
            assert.property(complex, '_more');
            assert.instanceOf(complex, ComplexObject);
            assert.strictEqual((complex as ComplexObject).getMore(), 'test');

            realAfter();
        });

        test('Happy Path on Simple Complex Object', () => {
            realBefore();
            const complex: any = SettingsManager.GetObject('complex', {});

            assert.isNotNull(complex);
            assert.isObject(complex);
            assert.property(complex, '_more');
            assert.strictEqual(complex._more, 'test');

            realAfter();
        });

        test('GetObject run against an null SettingsManager should return null', () => {
            assert.isNull(SettingsManager.GetObject('complex', {}));
        });

        test('GetObject on empty settings engine should return null', () => {
            SettingsManager.LoadSettings({});
            assert.isNull(SettingsManager.GetObject('setting', {}));
            realAfter();
        });

        test('GetObject on a simple object should do something sane', () => {
            realBefore();
            const simple = SettingsManager.GetObject('setting', {});

            assert.isNull(simple);
            
            realAfter();
        });
    })
});
