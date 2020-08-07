/** 3rd party */
import { Promise } from 'es6-promise';

/** local */
import { IHttpDataProvider, HttpDataProvider, HttpVerb, IHttpRequestContent } from './HttpDataProvider';
import { IRetryPolicyFactory } from '../RetryPolicyFactory';
import { IRetryPolicy } from '../ExponentialBackoffRetryPolicy';

/**
 * Provides retry functionality over http request data provider
 */
export class RetryHttpDataProvider implements IHttpDataProvider {
    /** underlying data provider */
    private dataProvider: IHttpDataProvider;
    /** retry policy factory */
    private retryPolicyFactory: IRetryPolicyFactory;

    /**
     * Initializes an instance of the class
     * @param retryPolicyFactory retry policy factory to create retry policies
     * @param dataProvider underlying data provider to use (optional), if none provided, will use default instance of HttpDataProvider
     */
    constructor(retryPolicyFactory: IRetryPolicyFactory, dataProvider?: IHttpDataProvider) {
        if (!retryPolicyFactory) { throw new Error('Parameter @retryPolicyFactory may not be null'); }

        this.retryPolicyFactory = retryPolicyFactory;
        this.dataProvider = dataProvider || new HttpDataProvider();
    }

    /**
     * Executes http request
     * @param verb http verb 
     * @param url full request url
     * @param timeoutMs timeout in milliseconds 
     * @param headers request headers (optional)
     * @param content request content (optional)
     * @returns Promise of async operation with response body as a result
     */
    public executeRequest(
        verb: HttpVerb,
        url: string, 
        timeoutMs: number,
        headers?: StringMap<string>,
        content?: IHttpRequestContent,
    ): Promise<any> {
        const retryPolicy = this.retryPolicyFactory.getRetryPolicy();

        if (!retryPolicy) {
            throw new Error('this.retryPolicyFactory.getRetryPolicy() returned an null or undefined value');
        }

        return new Promise((resolve, reject) => {
            retryPolicy.execute(() => this.executeOperation(resolve, reject, retryPolicy, verb, url, timeoutMs, headers, content));
        });
    }

    /**
     * Executes http request under outer promise supervision
     * @param resolve promise resolve delegate
     * @param reject promise reject delegate
     * @param retryPolicy retry policy
     * @param verb http verb
     * @param url full request url
     * @param timeoutMs timeout in milliseconds 
     * @param headers request headers (optional)
     * @param content request content (optional)
     * @returns Promise of async operation with response body as a result
     */
    private executeOperation(
        resolve: (value?: any) => void, 
        reject: (error?: any) => void,
        retryPolicy: IRetryPolicy,
        verb: HttpVerb,
        url: string,
        timeoutMs: number,
        headers?: StringMap<string>,
        content?: IHttpRequestContent,
    ): void {
        this.dataProvider.executeRequest(verb, url, timeoutMs, headers, content)
            .then((result) => {
                resolve(result);
            })
            .catch((error) => {
                if (retryPolicy.canRetry(error)) {
                    retryPolicy.execute(
                        () => this.executeOperation(resolve, reject, retryPolicy, verb, url, timeoutMs, headers, content));
                } else {
                    reject(error);
                }
            });
    }
}
