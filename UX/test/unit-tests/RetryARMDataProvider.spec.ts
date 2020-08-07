/**
 * test tooling
 */
import * as chai from 'chai';

/**
 * code for testing
 */
import { RetryARMDataProvider } from '../../src/scripts/shared/data-provider/RetryARMDataProvider';

/**
 * mocks
 */
import { FailThenSucceedARMDataProvider, SucceedThenFailARMDataProvider } from './ARMDataProviderHelpers';
import { MockRetryPolicyFactory } from './RetryPolicyFactoryHelpers';

const assert = chai.assert;

suite('unit | RetryARMDataProvider', () => {

    suite('executePost', () => {
        // These values don't matter. They won't be used. RetryARMDataProvider.executePost() requires them however
        const uri: string = '';
        const timeoutMs: number = 0;
        const data: string = '';

        test('If a POST succeeds on the first try, there should be no retries.', () => {      
            const rpf = new MockRetryPolicyFactory();      
            const stfARMDP = new SucceedThenFailARMDataProvider('success', 'failure'); 
            const RetryARMDP = new RetryARMDataProvider(stfARMDP, rpf); // 1ms initial delay speeds up test

            return new Promise((resolve, reject) => {
                RetryARMDP.executePost(uri, timeoutMs, data)
                    .then((result) => {
                        assert.equal(stfARMDP.getNumFailures(), 0, 
                            `The data provider should not have fail`);
                        assert.equal(result, 'success', `The POST should succeed.`);
                        resolve(result);
                    }).catch((error) => {
                        reject(error);
                    });
            });
        });
        test('If POST fails, it should retry, and eventually succeed.', () => {            
            // You don't want ftsARMDP to fail and retry more than the number of retries + initial attempt
            // specified in the RetryARMDataProvider. I you do, RetryARMDataProvider will not allow any more retries
            // and the POST will fail and not succeed as intended
            const numTimesToFail = 3; // RetryARMDataProvider allows for 3 retries by default
            const rpf = new MockRetryPolicyFactory();      
            const fts = new FailThenSucceedARMDataProvider('success', 'failure', numTimesToFail); 
            const RetryARMDP = new RetryARMDataProvider(fts, rpf); // 1ms initial delay speeds up test

            return new Promise((resolve, reject) => {
                RetryARMDP.executePost(uri, timeoutMs, data)
                    .then((result) => {
                        assert.equal(fts.getNumFailures(), numTimesToFail, 
                            `The data provider should have failed ${numTimesToFail} times before suceeding.`);
                        assert.equal(result, 'success', `The POST, after initially failing ${numTimesToFail} times, should succeed.`);
                        resolve(result);
                    }).catch((error) => {
                        reject(error);
                    });
            });
        });
        test('POST operations should only retry up to the limit that is specified in the RetryPolicy', () => {
            // The ftsARMDP should only fail 4 times because the RetryPolicy instance for RetryARMDataProvider will restrict 
            // the number of calls to the data provider to 4 (initial attempt + 3 retries (default))
            const numTimesToFail = 5; // RetryARMDataProvider allows for an initial attempt + 3 retries by default
            const rpf = new MockRetryPolicyFactory();      
            const ftsARMDP = new FailThenSucceedARMDataProvider('success', new Error('failure'), numTimesToFail); 
            const RetryARMDP = new RetryARMDataProvider(ftsARMDP, rpf); // reduce initial delay 1ms to speed up test

            return new Promise((resolve, reject) => {
                RetryARMDP.executePost(uri, timeoutMs, data)
                    .then((result) => {
                        reject('The POST shouldn\'t succeed.');
                    }).catch((error) => {
                        assert.notEqual(ftsARMDP.getNumFailures(), numTimesToFail, 
                            'The RetryPolicy should limit the number of calls to the data provider, ' +
                            'thus preventing it from failing a fifth time.');
                        assert.equal(error.message, 'failure', `The POST should exhaust all retry attempts and ultimately fail.`);
                        resolve(error);
                    });
            });
        });
        test('If a POST fails with a 503 HTTP status code, there should be no retry.', () => {
            const mock503error: any = { httpRequestError: { status: 503 } };
            const numTimesToFail = 2; // RetryARMDataProvider allows for an initial attempt + 3 retries by default
            const rpf = new MockRetryPolicyFactory();      
            const ftsARMDP = new FailThenSucceedARMDataProvider('success', mock503error, numTimesToFail); 
            const RetryARMDP = new RetryARMDataProvider(ftsARMDP, rpf); // reduce initial delay 1ms to speed up test

            return new Promise((resolve, reject) => {
                RetryARMDP.executePost(uri, timeoutMs, data)
                    .then((result) => {
                        reject('The POST shouldn\'t succeed.');
                    }).catch((error) => {
                        assert.notEqual(ftsARMDP.getNumFailures(), numTimesToFail, 
                            'The data provider should only be called once and fail ' +
                            'because a 503 error is not retriable');
                        assert.equal(error, mock503error, `The POST should fail and the error should equal the one that was provided.`);
                        resolve(error);
                    });
            });
        });
    });
});
