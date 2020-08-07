/**
 * test tooling
 */
import * as chai from 'chai';

/**
 * code for testing
 */
import { ExponentialBackoffRetryPolicy } from '../../src/scripts/shared/data-provider/ExponentialBackoffRetryPolicy';

const assert = chai.assert;

suite('unit | RetryPolicy', () => {

    suite('execute', () => {

        test('The delays between retries are calculated correctly.', () => {
            // checks for errors in the internal calcualtion of the retry delay in Retry Policy
            // by comparing it against an externally independent calcualtion   
            const retryLimit = 3;
            const initialDelay = 1; // ms      
            const rp: any = new ExponentialBackoffRetryPolicy(retryLimit, initialDelay);
            let count = 0;

            rp.execute(() => {}); // execute initial attempt            
            for (let i = 0; i < retryLimit; i++) { // execute retries with delays
                rp.execute(() => {});
                assert.equal(rp.getDelayMs(), initialDelay * Math.pow(2, count));
                count++;
            }
        });
        test('The number of times ExponentialBackoffRetryPolicy allows execute to be called is equal to the retry limit + 1.', (done) => {
            const retryLimit = 3;
            const initialDelay = 1; // ms      
            const rp: any = new ExponentialBackoffRetryPolicy(retryLimit, initialDelay);

            let retryCount = 0;
            // +2 because we want to try to execute the callback one (or more) time(s)
            // than the ExponentialBackoffRetryPolicy instance should allow
            for (let i = 0; i < retryLimit + 2; i++) { 
                rp.execute(() => retryCount++);
            }
            done();
            assert.equal(retryCount, retryLimit + 1, 'ExponentialBackoffRetryPolicy.execute() should only be called retry limit + 1 times');
        });
        test('There is no delay on the first call to execute', () => {
            const retryLimit = 3;
            const initialDelay = 1; // ms      
            const rp: any = new ExponentialBackoffRetryPolicy(retryLimit, initialDelay);

            let executeCount = 0;
            rp.execute(() => executeCount++);
            // If there was a timeout, executeCount will not increment before assert is called
            assert.equal(executeCount, 1, 'Execute should have be reported as having been called once');
        });
    });

    suite('canRetry', () => {
        test('If the number of retry attempts remaining is less than or equal to zero, canRetry returns false', () => {
            const retryLimit = 3;
            const initialDelay = 1; // ms      
            const rp: any = new ExponentialBackoffRetryPolicy(retryLimit, initialDelay);

            for (let i = 0; i < retryLimit + 1; i++) { 
                rp.execute(() => {});
            }
            assert.equal(rp.canRetry(), false, 'ExponentialBackoffRetryPolicy cannot retry if there are no more retry attempts remaining');
        });

        test('If http error is non-retriable, ExponentialBackoffRetryPolicy will not retry.', () => {
            const retryLimit = 3;
            const initialDelay = 1; // ms      
            const rp: any = new ExponentialBackoffRetryPolicy(retryLimit, initialDelay);

            const noRetryResponseStatusCodes = [400, 401, 403, 404, 418, 503 ];

            for (const noRetryStatusCode of noRetryResponseStatusCodes) {
                const mockError: any = { httpRequestError: { status: noRetryStatusCode } };
                assert.isFalse(
                    rp.canRetry(mockError), 
                    'RetryPolicy should not allow a retry of an operation that encountered a no-retry http response');
            }
        });

        test('If http error is retriable (500), ExponentialBackoffRetryPolicy will retry.', () => {
            const retryLimit = 3;
            const initialDelay = 1; // ms      
            const rp: any = new ExponentialBackoffRetryPolicy(retryLimit, initialDelay);

            const mockError: any = { httpRequestError: { status: 500 } };
            assert.isTrue(
                rp.canRetry(mockError), 
                'RetryPolicy should allow a retry of an operation that encountered a retriable http response');
        });
    });
});
