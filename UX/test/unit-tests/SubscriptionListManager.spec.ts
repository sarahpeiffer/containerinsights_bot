import * as chai from 'chai';
import { SubscriptionListManager } from '../../src/scripts/shared/SubscriptionListManager';
import { ISubscriptionInfo } from '../../src/scripts/shared/ISubscriptionInfo';

const assert = chai.assert;
suite('unit | SubscriptionListManager', () => {
    const emptySubscriptionManager = new SubscriptionListManager();

    const subscriptionManagerWithValues = new SubscriptionListManager();
    subscriptionManagerWithValues.addUnknownSubscription('1');
    subscriptionManagerWithValues.addUnknownSubscription('2');
    subscriptionManagerWithValues.addUnknownSubscription('3');

    const makeSubscription = (uniqueDisplayName: string, subscriptionId: string): ISubscriptionInfo => {
        return {
            displayName: undefined,
            uniqueDisplayName,
            subscriptionId,
            authorizationSource: undefined,
            subscriptionPolicies: undefined,
            state: undefined,
        };
    };

    suite('getSubscriptionById', () => {
        test('It should return undefined for empty list given undefined', () => {
            assert.equal(emptySubscriptionManager.getSubscriptionById(undefined), undefined);
        });
        test('It should return undefined for empty list given a valid value', () => {
            assert.equal(emptySubscriptionManager.getSubscriptionById('hello'), undefined);
        });
        test('It should return a value if one existed', () => {
            const result = subscriptionManagerWithValues.getSubscriptionById('1');
            assert.equal(result.uniqueDisplayName, '1');
            assert.equal(result.subscriptionId, '1');
        });
        test('It should return undefined for populated list given undefined', () => {
            assert.equal(subscriptionManagerWithValues.getSubscriptionById(undefined), undefined);
        });
        test('It should return undefined if item not in populated list', () => {
            assert.equal(subscriptionManagerWithValues.getSubscriptionById('4'), undefined);
        });
    });

    suite('appendSubscriptionList', () => {
        test('It should append a list to an empty subscription manager successfully', () => {
            const subMgr = new SubscriptionListManager();
            const itemA = makeSubscription('A', '1');
            const itemB = makeSubscription('B', '2');
            const itemC = makeSubscription('C', '3');
            const result = subMgr.appendSubscriptionList([
                itemA,
                itemB,
                itemC
            ]);

            assert.isTrue(result);
            assert.equal(itemA, subMgr.getSubscriptionById('1'));
            assert.equal(itemB, subMgr.getSubscriptionById('2'));
            assert.equal(itemC, subMgr.getSubscriptionById('3'));
            assert.equal(undefined, subMgr.getSubscriptionById('random'));
        });
        test('It should fail to insert a duplicate list into the manager', () => {
            const subMgr = new SubscriptionListManager();
            const itemA = makeSubscription('A', '1');
            const itemB = makeSubscription('B', '2');
            const itemC = makeSubscription('C', '3');
            subMgr.appendSubscriptionList([itemA, itemB, itemC]);
            const result = subMgr.appendSubscriptionList([itemA, itemB, itemC]);

            assert.isFalse(result);
            assert.equal(itemA, subMgr.getSubscriptionById('1'));
            assert.equal(itemB, subMgr.getSubscriptionById('2'));
            assert.equal(itemC, subMgr.getSubscriptionById('3'));
            assert.equal(undefined, subMgr.getSubscriptionById('random'));
        });
        test('It should append missing items to partial duplicate list successfully', () => {
            const subMgr = new SubscriptionListManager();
            const itemA = makeSubscription('A', '1');
            const itemB = makeSubscription('B', '2');
            const itemC = makeSubscription('C', '3');
            subMgr.appendSubscriptionList([itemA, itemB]);
            const result = subMgr.appendSubscriptionList([itemA, itemB, itemC]);

            assert.isTrue(result);
            assert.equal(itemA, subMgr.getSubscriptionById('1'));
            assert.equal(itemB, subMgr.getSubscriptionById('2'));
            assert.equal(itemC, subMgr.getSubscriptionById('3'));
            assert.equal(undefined, subMgr.getSubscriptionById('random'));
        });
        test('It should not crash if undefined sent to empty list', () => {
            const subMgr = new SubscriptionListManager();
            const result = subMgr.appendSubscriptionList(undefined);
            assert.isTrue(true);
            assert.isFalse(result);
        });
        test('It should not crash if undefined sent to populated list', () => {
            const subMgr = new SubscriptionListManager();
            const itemA = makeSubscription('A', '1');
            const itemB = makeSubscription('B', '2');
            const itemC = makeSubscription('C', '3');
            subMgr.appendSubscriptionList([itemA, itemB, itemC]);
            const result = subMgr.appendSubscriptionList(undefined);
            assert.isTrue(true);
            assert.isFalse(result);
            assert.equal(itemA, subMgr.getSubscriptionById('1'));
            assert.equal(itemB, subMgr.getSubscriptionById('2'));
            assert.equal(itemC, subMgr.getSubscriptionById('3'));
        });
        test('It should work if duplicates are contained within input', () => {
            const subMgr = new SubscriptionListManager();
            const itemA = makeSubscription('A', '1');
            const itemB = makeSubscription('B', '2');
            const itemC = makeSubscription('C', '3');
            const result = subMgr.appendSubscriptionList([itemA, itemB, itemC, itemC, itemC]);
            assert.isTrue(result);
            assert.equal(itemA, subMgr.getSubscriptionById('1'));
            assert.equal(itemB, subMgr.getSubscriptionById('2'));
            assert.equal(itemC, subMgr.getSubscriptionById('3'));
        });
        test('It should work if duplicates are contained within input and the list', () => {
            const subMgr = new SubscriptionListManager();
            const itemA = makeSubscription('A', '1');
            const itemB = makeSubscription('B', '2');
            const itemC = makeSubscription('C', '3');
            const itemD = makeSubscription('D', '4');
            const itemE = makeSubscription('E', '5');
            let result = subMgr.appendSubscriptionList([itemA, itemB, itemC]);
            assert.isTrue(result);
            result = subMgr.appendSubscriptionList([itemB, itemB, itemC, itemD, itemD, itemE]);
            assert.isTrue(result);
            assert.equal(itemA, subMgr.getSubscriptionById('1'));
            assert.equal(itemB, subMgr.getSubscriptionById('2'));
            assert.equal(itemC, subMgr.getSubscriptionById('3'));
            assert.equal(itemD, subMgr.getSubscriptionById('4'));
            assert.equal(itemE, subMgr.getSubscriptionById('5'));
        });
    });

    suite('addUnknownSubsription', () => {
        test('It should append unknown subscriptions to an empty list successfully', () => {
            const subMgr = new SubscriptionListManager();
            const createdItem = subMgr.addUnknownSubscription('1');
            assert.isTrue(createdItem !== undefined);
            assert.isNotNull(createdItem);
            assert.equal(createdItem.uniqueDisplayName, '1');
            assert.equal(createdItem.displayName, '1');
            assert.equal(createdItem.subscriptionId, '1');
            const foundItem = subMgr.getSubscriptionById('1');
            assert.equal(foundItem, createdItem);
        });
        test('It should append unknown subscriptions to an loaded list successfully', () => {
            const subMgr = new SubscriptionListManager();
            const itemB = makeSubscription('B', '2');
            const itemC = makeSubscription('C', '3');
            subMgr.appendSubscriptionList([itemB, itemC]);

            const createdItem = subMgr.addUnknownSubscription('1');
            assert.isTrue(createdItem !== undefined);
            assert.isNotNull(createdItem);
            assert.equal(createdItem.uniqueDisplayName, '1');
            assert.equal(createdItem.displayName, '1');
            assert.equal(createdItem.subscriptionId, '1');
            const foundItem = subMgr.getSubscriptionById('1');
            assert.equal(foundItem, createdItem);
        });
        test('It should not allow unknown append for a known item', () => {
            const subMgr = new SubscriptionListManager();
            const itemB = makeSubscription('B', '2');
            const itemC = makeSubscription('C', '3');
            subMgr.appendSubscriptionList([itemB, itemC]);

            const createdItem = subMgr.addUnknownSubscription('2');
            assert.equal(itemB, createdItem);
        });
        test('It should not allow undefined subscriptions into the list', () => {
            const subMgr = new SubscriptionListManager();
            const itemB = makeSubscription('B', '2');
            const itemC = makeSubscription('C', '3');
            subMgr.appendSubscriptionList([itemB, itemC]);

            const createdItem = subMgr.addUnknownSubscription(undefined);
            assert.isTrue(createdItem === undefined);
        });
        test('It should not allow empty string subscriptions into the list', () => {
            const subMgr = new SubscriptionListManager();
            const itemB = makeSubscription('B', '2');
            const itemC = makeSubscription('C', '3');
            subMgr.appendSubscriptionList([itemB, itemC]);

            const createdItem = subMgr.addUnknownSubscription('');
            assert.isTrue(createdItem === undefined);
        });
    });
});
