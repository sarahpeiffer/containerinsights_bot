/** test tooling */
import * as chai from 'chai';

/** code for testing */
import { RetryHttpDataProvider } from '../../../src/scripts/shared/data-provider/v2/RetryHttpDataProvider';

/**
 * mocks
 */
import { FailThenSucceedHttpDataProvider, SucceedThenFailHttpDataProvider } from './MockHttpDataProviders';
import { MockRetryPolicyFactory } from '../RetryPolicyFactoryHelpers';
import { HttpVerb } from '../../../src/scripts/shared/data-provider/v2/HttpDataProvider';

const assert = chai.assert;

suite('unit | RetryHttpDataProvider', () => {

    suite('executeRequest()', () => {
        const verb = HttpVerb.Get;
        const uri: string = '';
        const timeoutMs: number = 0;

        test('If a request succeeds on the first try, there should be no retries.', () => {      
            const rpf = new MockRetryPolicyFactory();      
            const stfHttpDP = new SucceedThenFailHttpDataProvider('success', 'failure'); 
            const RetryHttpDP = new RetryHttpDataProvider(rpf, stfHttpDP); // 1ms initial delay speeds up test

            return new Promise((resolve, reject) => {
                RetryHttpDP.executeRequest(verb, uri, timeoutMs)
                    .then((result) => {
                        assert.equal(stfHttpDP.getNumFailures(), 0, 
                            `The data provider should not have fail`);
                        assert.equal(result, 'success', `The POST should succeed.`);
                        resolve(result);
                    }).catch((error) => {
                        reject(error);
                    });
            });
        });
        test('If request fails, it should retry, and eventually succeed.', () => {            
            // You don't want ftsHttpDP to fail and retry more than the number of retries + initial attempt
            // specified in the RetryHttpDataProvider. I you do, RetryHttpDataProvider will not allow any more retries
            // and the POST will fail and not succeed as intended
            const numTimesToFail = 3; // RetryHttpDataProvider allows for 3 retries by default
            const rpf = new MockRetryPolicyFactory();      
            const fts = new FailThenSucceedHttpDataProvider('success', 'failure', numTimesToFail); 
            const RetryHttpDP = new RetryHttpDataProvider(rpf, fts); // 1ms initial delay speeds up test

            return new Promise((resolve, reject) => {
                RetryHttpDP.executeRequest(verb, uri, timeoutMs)
                    .then((result) => {
                        assert.equal(fts.getNumFailures(), numTimesToFail, 
                            `The data provider should have failed ${numTimesToFail} times before suceeding.`);
                        assert.equal(result, 'success', `The request, after initially failing ${numTimesToFail} times, should succeed.`);
                        resolve(result);
                    }).catch((error) => {
                        reject(error);
                    });
            });
        });
        test('Request should only retry up to the limit that is specified in the RetryPolicy', () => {
            // The ftsHttpDP should only fail 4 times because the RetryPolicy instance for RetryHttpDataProvider will restrict 
            // the number of calls to the data provider to 4 (initial attempt + 3 retries (default))
            const numTimesToFail = 5; // RetryHttpDataProvider allows for an initial attempt + 3 retries by default
            const rpf = new MockRetryPolicyFactory();      
            const ftsHttpDP = new FailThenSucceedHttpDataProvider('success', new Error('failure'), numTimesToFail); 
            const RetryHttpDP = new RetryHttpDataProvider(rpf, ftsHttpDP); // reduce initial delay 1ms to speed up test

            return new Promise((resolve, reject) => {
                RetryHttpDP.executeRequest(verb, uri, timeoutMs)
                    .then((result) => {
                        reject('The POST shouldn\'t succeed.');
                    }).catch((error) => {
                        assert.notEqual(ftsHttpDP.getNumFailures(), numTimesToFail, 
                            'The RetryPolicy should limit the number of calls to the data provider, ' +
                            'thus preventing it from failing a fifth time.');
                        assert.equal(error.message, 'failure', `The request should exhaust all retry attempts and ultimately fail.`);
                        resolve(error);
                    });
            });
        });
        test('If a request fails with a 503 HTTP status code, there should be no retry.', () => {
            const mock503error: any = { httpRequestError: { status: 503 } };
            const numTimesToFail = 2; // RetryHttpDataProvider allows for an initial attempt + 3 retries by default
            const rpf = new MockRetryPolicyFactory();      
            const ftsHttpDP = new FailThenSucceedHttpDataProvider('success', mock503error, numTimesToFail); 
            const RetryHttpDP = new RetryHttpDataProvider(rpf, ftsHttpDP); // reduce initial delay 1ms to speed up test

            return new Promise((resolve, reject) => {
                RetryHttpDP.executeRequest(verb, uri, timeoutMs)
                    .then((result) => {
                        reject('The POST shouldn\'t succeed.');
                    }).catch((error) => {
                        assert.notEqual(ftsHttpDP.getNumFailures(), numTimesToFail, 
                            'The data provider should only be called once and fail ' +
                            'because a 503 error is not retriable');
                        assert.equal(error, mock503error, `The POST should fail and the error should equal the one that was provided.`);
                        resolve(error);
                    });
            });
        });
    });
});
