import { HttpRequestError } from './HttpRequestError';
import { HttpResponseStatusCode } from '../GlobalConstants'

/**
 * interfaces
 */
export interface IRetryPolicy {
    canRetry: (error: any) => boolean; // a function that returns whether or not it is acceptable to retry given a particular error
    execute: (operation) => void; // a function that executes an operation in accordance with the retry policy
}

/**
 * Provides a retry policy. 
 * In particular, this retry policy institutes a delay between retries that grows
 * exponentially with respect to the number of retries attempted
 */
export class ExponentialBackoffRetryPolicy implements IRetryPolicy {
    private retryLimit: number;
    private initialDelay: number;
    private retryAttemptsRemaining: number;

    /**
     * retryLimit: specify the number of times the operation passed into this class can be called
     * initialDelay: specify the the term thats multipled by the exponential growth factor to determine the delay between retries
     * retryAttemptsRemaining is retryLimit + 1 because the initial execution of the operation is not considered a retry
     */
    constructor(retryLimit: number, initialDelay: number) {
        this.retryLimit = retryLimit;
        this.initialDelay = initialDelay;
        this.retryAttemptsRemaining = this.retryLimit + 1; // First attempt isn't a retry
    }

    /**
     * Determines if the operation should be retried
     * @param error the error encountered by the operation
     * @return a boolean describing if the operation should be retried or not
     */
    public canRetry(error: any): boolean {
        if (this.retryAttemptsRemaining > 0 && this.isRetriableError(error)) {
            return true;
        }
        return false;
    }

    /**
     * Executes the operation, keeping track of the number of attempts have been made
     * @param operation a callback that invokes the operation that we are applying the retry policy to
     */
    public execute(operation: () => any): void {
        if (this.retryAttemptsRemaining > 0) {
            this.retryAttemptsRemaining--;

            if (this.retryAttemptsRemaining >= this.retryLimit) { // the first execution of the operation is not a retry
                operation();
            } else {
                setTimeout(operation, this.getDelayMs());
            }
        }
    }

    /**
     * Calculates the delay between retries
     * @return returns the delay that will be observed between the previous and current retry
     */
    private getDelayMs(): number {
        return this.initialDelay * Math.pow(2, (this.retryLimit - this.retryAttemptsRemaining - 1));
    }

    /**
     * Determines if the error is one that we should not retry
     * @param error the error encountered by the operation
     * @return a boolean describing if the error is a type that should be retried
     */
    private isRetriableError(error: any): boolean {
        if (HttpRequestError.isHttpRequestError(error)) {
            switch (error.httpRequestError.status) {
                case HttpResponseStatusCode.ServerUnavailable:
                case HttpResponseStatusCode.Unauthorized:
                case HttpResponseStatusCode.NotFound:
                case HttpResponseStatusCode.Forbidden:
                case HttpResponseStatusCode.BadRequest:
                case HttpResponseStatusCode.Teapot:
                case HttpResponseStatusCode.TooManyRequests:
                    return false;
            }
        }

        return true;
    }
}
