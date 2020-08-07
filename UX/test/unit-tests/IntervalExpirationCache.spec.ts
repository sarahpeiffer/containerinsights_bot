import { assert } from 'chai';
import { IntervalExpirationCache } from '../../src/scripts/container/data-provider/IntervalExpirationCache'

suite('unit | IntervalExpirationCache', () => {

    test('It should return a previously stored unexpired item', () => {
        const cache = new IntervalExpirationCache(60 * 1000);

        const itemToCache = { value: 'i am cached' };
        const itemKey = 'key';

        cache.addItem(itemKey, itemToCache);
        const itemFromCache = cache.getItem(itemKey);

        assert.deepEqual(itemToCache, itemFromCache);
    });

    test('It should return "undefined" for non-existing key', () => {
        const cache = new IntervalExpirationCache(60 * 1000);

        const itemKey = 'key';

        const itemFromCache = cache.getItem(itemKey);

        assert.equal(undefined, itemFromCache);
    });

    test('It should return "undefined" for expired item', () => {
        const expirationIntervalMs = 25;
        const checkDelayMs = expirationIntervalMs + 5;

        const cache = new IntervalExpirationCache(expirationIntervalMs);

        const itemToCache = { value: 'i am cached' };
        const itemKey = 'key';

        cache.addItem(itemKey, itemToCache);
        
        return new Promise((resolve, reject) => {
            setTimeout(function () {
                const itemFromCache = cache.getItem(itemKey);
                assert.equal(undefined, itemFromCache);
                resolve(null);
            }, checkDelayMs);
        });
    });
});
