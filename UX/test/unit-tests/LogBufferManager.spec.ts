import { assert } from 'chai';
import { LogBufferManager, MissingDataMessage, LogItem, ILogItem, BufferType } from '../../src/scripts/shared/Utilities/LogBufferManager';
import { Telemetry } from '../../src/scripts/shared/ApplicationInsightsTelemetry';
import { IApplicationInsightsProvider } from '../../src/scripts/shared/data-provider/TelemetryProvider';

const t1a = new LogItem(
    '2018-06-11T22:36:31.000000000Z',
    'T1A');
const t1_5a = new LogItem(
    '2018-06-11T22:36:31.500000000Z',
    'T1_5A');
const t2b = new LogItem(
    '2018-06-11T22:36:32.000000000Z',
    'T2B');
const t2c = new LogItem(
    '2018-06-11T22:36:32.000000000Z',
    'T2C');

const t3d = new LogItem(
    '2018-06-11T22:36:33.000000000Z',
    'T3D');

const t4e = new LogItem(
    '2018-06-11T22:36:34.000000000Z',
    'T4E');

const nullInsightsProvider: IApplicationInsightsProvider = {
    logEvent: () => { },
    logPageView: () => { },
    logException: () => { },
    logExceptionLimited: () => { },
    logDependency: () => { },
    flush: () => { }
};

suite('unit | LogBufferManager', () => {
    suite('Merging', () => {
        test('It should add all log items in first message', () => {
            const bufferManager = new LogBufferManager(10000, 10000, new Telemetry(nullInsightsProvider, null), BufferType.LogBuffer);
            const messageOne = [t1a, t2b, t2c];
            bufferManager.merge(messageOne);
            assert.strictEqual<number>(bufferManager.size(), 3);
            assert.strictEqual<ILogItem>(bufferManager.get(0), t1a);
            assert.strictEqual<ILogItem>(bufferManager.get(1), t2b);
            assert.strictEqual<ILogItem>(bufferManager.get(2), t2c);
        });

        test('It should merge two properly overlapping messages', () => {
            //It should merge t1 A, t2 B, t2 C, t3 D and t2 C, t3 D, t4 E into A,B,C,D,E
            const messageOne = [t1a, t2b, t2c, t3d];
            const messageTwo = [t2c, t3d, t4e];
            const bufferManager = new LogBufferManager(10000, 10000, new Telemetry(nullInsightsProvider, null), BufferType.LogBuffer);
            bufferManager.merge(messageOne);
            bufferManager.merge(messageTwo);
            assert.strictEqual<number>(bufferManager.size(), 5);
            assert.strictEqual<ILogItem>(bufferManager.get(0), t1a);
            assert.strictEqual<ILogItem>(bufferManager.get(1), t2b);
            assert.strictEqual<ILogItem>(bufferManager.get(2), t2c);
            assert.strictEqual<ILogItem>(bufferManager.get(3), t3d);
            assert.strictEqual<ILogItem>(bufferManager.get(4), t4e);
        });

        test('It should merge all elements of two non-overlapping messages in different seconds, with error message', () => {
            const bufferManager = new LogBufferManager(10000, 10000, new Telemetry(nullInsightsProvider, null), BufferType.LogBuffer);
            const messageOne = [t1a];
            const messageTwo = [t4e];
            bufferManager.merge(messageOne);
            bufferManager.merge(messageTwo);
            assert.strictEqual<number>(bufferManager.size(), 3);
            assert.strictEqual<ILogItem>(bufferManager.get(0), t1a);
            assert.strictEqual<string>(bufferManager.get(1).logData, MissingDataMessage.logData);
            assert.strictEqual<ILogItem>(bufferManager.get(2), t4e);
        });

        test('It should merge all elements of two non-overlapping messages in same second, with error message', () => {
            const bufferManager = new LogBufferManager(10000, 10000, new Telemetry(nullInsightsProvider, null), BufferType.LogBuffer);
            const messageOne = [t1a];
            const messageTwo = [t1_5a];
            bufferManager.merge(messageOne);
            bufferManager.merge(messageTwo);
            assert.strictEqual<number>(bufferManager.size(), 3);
            assert.strictEqual<ILogItem>(bufferManager.get(0), t1a);
            assert.strictEqual<string>(bufferManager.get(1).logData, MissingDataMessage.logData);
            assert.strictEqual<ILogItem>(bufferManager.get(2), t1_5a);
        });

        test('It should merge two identical messages', () => {
            const bufferManager = new LogBufferManager(10000, 10000, new Telemetry(nullInsightsProvider, null), BufferType.LogBuffer);
            const messageOne = [t1a];
            const messageTwo = [t1a];
            bufferManager.merge(messageOne);
            bufferManager.merge(messageTwo);
            assert.strictEqual<number>(bufferManager.size(), 1);
            assert.strictEqual<ILogItem>(bufferManager.get(0), t1a);
        });

        test('It should merge two messages in same second', () => {
            const bufferManager = new LogBufferManager(10000, 10000, new Telemetry(nullInsightsProvider, null), BufferType.LogBuffer);
            const messageOne = [t1a];
            const messageTwo = [t1a, t1_5a];
            bufferManager.merge(messageOne);
            bufferManager.merge(messageTwo);
            assert.strictEqual<number>(bufferManager.size(), 2);
            assert.strictEqual<ILogItem>(bufferManager.get(0), t1a);
            assert.strictEqual<ILogItem>(bufferManager.get(1), t1_5a);
        });

        test('It should merge all elements of two insufficiently overlapping messages, with error message', () => {
            const bufferManager = new LogBufferManager(10000, 10000, new Telemetry(nullInsightsProvider, null), BufferType.LogBuffer);
            const messageOne = [t1a, t2b];
            const messageTwo = [t2b, t2c, t3d, t4e];
            bufferManager.merge(messageOne);
            bufferManager.merge(messageTwo);
            assert.strictEqual<number>(bufferManager.size(), 7);
            assert.strictEqual<string>(bufferManager.get(2).logData, MissingDataMessage.logData);
        })

        test('It should remove oldest log array when the data goes above the cap', () => {
            //create a buffer which can only store the last three elements in the message, and each inner array stores 1 element.
            const bufferManager = new LogBufferManager(
                (t2c.logData.length + t3d.logData.length + t4e.logData.length) * 2,
                1,
                new Telemetry(nullInsightsProvider, null), BufferType.LogBuffer);
            const messageOne = [t1a, t2b, t2c, t3d, t4e];
            bufferManager.merge(messageOne);
            assert.strictEqual<number>(bufferManager.size(), 3);
            assert.strictEqual<ILogItem>(bufferManager.get(0), t2c);
            assert.strictEqual<ILogItem>(bufferManager.get(1), t3d);
            assert.strictEqual<ILogItem>(bufferManager.get(2), t4e);
        });
    });
    suite('Element retrieval', () => {
        test('It should return undefined when index is below 0', () => {
            const bufferManager = new LogBufferManager(10000, 10000, new Telemetry(nullInsightsProvider, null), BufferType.LogBuffer);
            assert.strictEqual(bufferManager.get(-1), undefined);

        });
        test('It should return undefined when index is above length', () => {
            const bufferManager = new LogBufferManager(10000, 10000, new Telemetry(nullInsightsProvider, null), BufferType.LogBuffer);
            assert.strictEqual(bufferManager.get(1), undefined);

        });
        test('It should return the last element of the first small array', () => {
            const bufferManager = new LogBufferManager(10000, 2, new Telemetry(nullInsightsProvider, null), BufferType.LogBuffer);
            const messageOne = [t1a, t2b, t2c, t3d];
            bufferManager.merge(messageOne);
            assert.strictEqual(bufferManager.get(1), t2b);
        });
        test('It should return the first element of the second small array', () => {
            const bufferManager = new LogBufferManager(10000, 2, new Telemetry(nullInsightsProvider, null), BufferType.LogBuffer);
            const messageOne = [t1a, t2b, t2c, t3d];
            bufferManager.merge(messageOne);
            assert.strictEqual(bufferManager.get(2), t2c);
        });
    });
    suite('Clearing', () => {
        test('It should remove all logs when buffer is cleared', () => {
            const bufferManager = new LogBufferManager(10000, 10000, new Telemetry(nullInsightsProvider, null), BufferType.LogBuffer);
            const messageOne = [t1a, t2b, t2c];
            bufferManager.merge(messageOne);
            bufferManager.clearLogs();
            assert.strictEqual<boolean>(bufferManager.isEmpty(), true);
            assert.strictEqual<number>(bufferManager.size(), 0);
        });
    });
    suite('Utility functions', () => {
        test('It should return the timestamp from the previous second', () => {
            const bufferManager = new LogBufferManager(10000, 10000, new Telemetry(nullInsightsProvider, null), BufferType.LogBuffer);
            const messageOne = [t1a, t2b, t2c];
            bufferManager.merge(messageOne);
            const timestamp = bufferManager.getPreviousSecondTimestamp();
            assert.strictEqual<string>(timestamp, t1a.timeStamp);
        });
        test('It should return undefined when there is no previous second timestamp', () => {
            const bufferManager = new LogBufferManager(10000, 10000, new Telemetry(nullInsightsProvider, null), BufferType.LogBuffer);
            const messageOne = [t2b, t2c];
            bufferManager.merge(messageOne);
            const timestamp = bufferManager.getPreviousSecondTimestamp();
            assert.strictEqual<string>(null, timestamp);
        });
    });
    suite('Searching', () => {
        const ts = '2018-06-11T22:36:31.000000000Z';
        /**
         * Note to self: I placed '_' character just so that all log items have the same byte length, 
         * but it is not a sensible thing to search for in the tests
         */
        const logItem1 = new LogItem(ts, 'theo');
        const logItem2 = new LogItem(ts, '_heo');
        const logItem3 = new LogItem(ts, '__eo');
        const logItem4 = new LogItem(ts, '___o');
        const logItem5 = new LogItem(ts, 'abcd');
        const logItem6 = new LogItem(ts, 'abc_');
        const logItem7 = new LogItem(ts, 'ab__');
        const logItem8 = new LogItem(ts, 'a___');

        test('It should return no matches when search term is not set', () => {
            const bufferManager = new LogBufferManager(10000, 10000, new Telemetry(nullInsightsProvider, null), BufferType.LogBuffer);
            bufferManager.merge([logItem1, logItem2, logItem3, logItem4, logItem5, logItem6, logItem7, logItem8]);
            assert.equal(0, bufferManager.getNumMatches());
        });

        test('It should return no matches when search term does not match any of the strings', () => {
            const bufferManager = new LogBufferManager(10000, 10000, new Telemetry(nullInsightsProvider, null), BufferType.LogBuffer);
            bufferManager.merge([logItem1, logItem2, logItem3, logItem4, logItem5, logItem6, logItem7, logItem8]);
            bufferManager.changeSearchTerm('z');
            assert.equal(0, bufferManager.getNumMatches());
        });

        test('It should return the number of matching strings when items are being added to merge', () => {
            const bufferManager = new LogBufferManager(10000, 10000, new Telemetry(nullInsightsProvider, null), BufferType.LogBuffer);
            //Set search term to a string that matches 4 log items
            bufferManager.changeSearchTerm('o');
            //add just the first two log items.
            bufferManager.merge([logItem1, logItem2, logItem3, logItem4, logItem5, logItem6, logItem7, logItem8]);
            assert.equal(4, bufferManager.getNumMatches());
        });

        test('It should decrement the numMatches when the buffer size needs to be managed', () => {
            //Set the buffer size to be 1 more than the byte size of each log item
            const bufferManager = new LogBufferManager(9, 1, new Telemetry(nullInsightsProvider, null), BufferType.LogBuffer);
            //Set search term to a string that matches 4 log items
            bufferManager.changeSearchTerm('o');
            bufferManager.merge([logItem1, logItem2, logItem3, logItem4]);
            assert.equal(1, bufferManager.getNumMatches());
        });
    });
});
