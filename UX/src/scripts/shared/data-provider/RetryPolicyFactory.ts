import { ExponentialBackoffRetryPolicy, IRetryPolicy } from './ExponentialBackoffRetryPolicy';

/**
 * interfaces
 */
export interface IRetryPolicyFactory {
    getRetryPolicy: () => IRetryPolicy; // a function that returns an instance of a class with interface IRetryPolicy
}

/**
 * constants
 */
const DEFAULT_RETRY_LIMIT = 3; // the default number of times an operation can be retried is 3
const DEFUALT_INITIAL_DELAY = 500; // the default initial delay between retries is 500 ms

/**
 * A factory for instantiating various classes with IRetryPolicy
 */
export class RetryPolicyFactory implements IRetryPolicyFactory {

    /**
     * In the future, this may return different retry policies based off of some parameter
     * For now, returns an instance of ExponentialBackoffRetryPolicy given the defaults for retry limit
     * and initial delay for its arguments, our standard retry policy atm
     * @return returns a retry policy
     */
    public getRetryPolicy(): IRetryPolicy {
        return new ExponentialBackoffRetryPolicy(DEFAULT_RETRY_LIMIT, DEFUALT_INITIAL_DELAY);
    }
}
