import { Promise } from 'es6-promise';
/**
 * local
 */
import { ExponentialBackoffRetryPolicy } from './ExponentialBackoffRetryPolicy';
import { IARMDataProvider } from './ARMDataProvider'
import { IRetryPolicyFactory} from './RetryPolicyFactory';
import { RestVerb } from './RestVerb';

/**
 * This is a decorator class for the ARMDataProvider that adds retry functionality.
 */
export class RetryARMDataProvider implements IARMDataProvider {
    private dataProvider: IARMDataProvider;
    private retryPolicyFactory: any;

    /**
     * @param dataProvider the dataProvider that we want to add retry functionality to. The dp has interface IARMDataProvider
     * because all requests are filtered through the ARMDataProvider. Thus, we can add retry functionality to every request 
     * by just adding the retry functionality for the ARMDataProvider class. 
     * @param retryPolicyFactory a factory for manufacturing varous classes with IRetryPolicy.
     */
    constructor(dataProvider: IARMDataProvider, retryPolicyFactory: IRetryPolicyFactory) {
        this.dataProvider = dataProvider;
        this.retryPolicyFactory = retryPolicyFactory;
    }

    /**
     * Wrapper for the executeRequest method, with POST as the type of HTTP request.
     * @param uri uri passed to ARMDataProvider.execute(...) that is combined with the ARM endpoint to create the queryURL
     * @param timeoutMs the length of time the client should wait for a response before returning an error
     * @param data the query 
     * @param headers http headers to set for the request
     * @returns promise to async execution of the request
     */
    public executePost(
        uri: string, 
        timeoutMs: number, 
        data?: string,
        headers?: StringMap<string>
    ): Promise<any> {
        // Each POST will need its own instance of RetryPolicy so that each POST is retried,
        // irrespective of the status of other POSTs made.
        return this.executeRequest(uri, timeoutMs, RestVerb.Post, data, headers);
    }

    /**
     * Wrapper for the executeRequest method, with GET as the type of HTTP request.
     * @param uri uri passed to ARMDataProvider.execute(...) that is combined with the ARM endpoint to create the queryURL
     * @param timeoutMs the length of time the client should wait for a response before returning an error
     * @param headers http headers to set for the request
     * @returns promise to async execution of the request
     */
    public executeGet(
        uri: string, 
        timeoutMs: number, 
        headers?: StringMap<string>
    ): Promise<any> {
        return this.executeRequest(uri, timeoutMs, RestVerb.Get, undefined, headers);
    }

    /**
     * Creates a retry policy that will be appied to ARMDataProvider.execute(...).
     * From here, the retry policy controls when and how many times ARMDataProvider.execute(...) is called
     * @param uri uri passed to ARMDataProvider.execute(...) that is combined with the ARM endpoint to create the queryURL
     * @param timeoutMs the length of time the client should wait for a response before returning an error
     * @param requestType the type of http request to make, such as GET or POST.
     * @param data request payload
     * @param headers http headers to set for the request
     * @returns promise to async execution of the request
     */
    private executeRequest(
        uri: string, 
        timeoutMs: number, 
        requestType: RestVerb, 
        data?: string,
        headers?: StringMap<string>
    ): Promise<any> {
        const retryPolicy = this.retryPolicyFactory.getRetryPolicy();
        if (retryPolicy) {
            return new Promise((resolve, reject) => {
                retryPolicy.execute(() => this.executeOperation(resolve, reject, retryPolicy, uri, timeoutMs, requestType, data, headers));
            });
        } else {
            throw 'this.retryPolicyFactory.getRetryPolicy() returned an invalid value';
        }
    }
    
    /**
     * The retry policy may control how many times a request can be called (and when), but...
     * executeOperation actually handles the problem of calling ARMDataProvider.executePost(...) multiple times
     * and making sure we fulfill the outer promise correctly by calling resolve or reject once
     * If the POST suceeds, we resolve the outer promise with the result.
     * If the POST fails, we check if we can retry...
     * If we can, we call ARMDataProvider.execute(...) again
     * If we can't, we reject the outer promise with the error
     * @param resolve outer promise resolve callback
     * @param reject  outer promise reject callback
     * @param retryPolicy the retry policy attached to this operation's execution
     * @param uri uri passed to ARMDataProvider.execute(...) that is combined with the ARM endpoint to create the queryURL
     * @param timeoutMs the length of time the client should wait for a response before returning an error
     * @param requestType the type of http request to make, such as GET or POST. If the requestType is not implemented in here, this
     *                      function will throw an error.
     * @param data request payload
     * @param headers http headers to set for the request
     */
    private executeOperation(
        resolve: (value?: any) => void, 
        reject: (error?: any) => void,
        retryPolicy: ExponentialBackoffRetryPolicy,
        uri: string,
        timeoutMs: number,
        requestType: RestVerb,
        data?: string,
        headers?: StringMap<string>
    ): void {
        let promise;
        switch (requestType) {
            case RestVerb.Post:
                promise = this.dataProvider.executePost(uri, timeoutMs, data, headers);
                break;
            case RestVerb.Get:
                promise = this.dataProvider.executeGet(uri, timeoutMs, headers);
                break;
            default:
                throw 'RestVerb' + requestType + ' not implemented';
        }
        promise.then((result) => {
            resolve(result);
        })
        .catch((error) => {
            if (retryPolicy.canRetry(error)) {
                retryPolicy.execute(
                    () => this.executeOperation(resolve, reject, retryPolicy, uri, timeoutMs, requestType, data, headers));
            } else {
                reject(error);
            }
        });
    }

}
