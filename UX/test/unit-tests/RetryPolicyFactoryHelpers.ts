import { IRetryPolicyFactory } from '../../src/scripts/shared/data-provider/RetryPolicyFactory';
import { ExponentialBackoffRetryPolicy, IRetryPolicy } from '../../src/scripts/shared/data-provider/ExponentialBackoffRetryPolicy';

/**
 * Mock RetryPolicyFactory that returns a ExponentialBackoffRetryPolicy that has 1 ms as an initial delay
 * Required to complete tests in a sufficient, reasonable amount of time
 */
export class MockRetryPolicyFactory implements IRetryPolicyFactory {

    /**
     * @return returns a ExponentialBackoffRetryPolicy that has 1 ms as an initial delay (and a retry limit of 3)
     */
    public getRetryPolicy(): IRetryPolicy {
        const retryLimit = 3;
        const initialDelay = 1;
        return new ExponentialBackoffRetryPolicy(retryLimit, initialDelay);
    }
}
