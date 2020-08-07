/** 3rd party */
import { Promise } from 'es6-promise';

/** local */
import { IHttpDataProvider, HttpVerb, IHttpRequestContent } from './HttpDataProvider';
import { RetryHttpDataProvider } from './RetryHttpDataProvider';
import { RetryPolicyFactory } from '../RetryPolicyFactory';

/**
 * Defines Arm data provider functionality
 */
export interface IArmDataProvider {
    /**
     * Executes ARM service request
     * @param verb http verb 
     * @param pathAndQuery full request path and query i.e. /subscriptions?api-version=xyz
     * @param timeoutMs timeout in milliseconds 
     * @param headers request headers (optional)
     * @param content request content (optional)
     * @returns Promise of async operation with response body as a result
     */
    executeRequest(
        verb: HttpVerb,
        pathAndQuery: string, 
        timeoutMs: number,
        headers?: StringMap<string>,
        content?: any,
    ): Promise<any>;
}

/**
 * Provides functionality to make Azure Resource Manager (ARM) service calls
 */
export class ArmDataProvider implements IArmDataProvider {
    /** endpoint i.e. https://management.azure.com */
    private endpoint: string;
    /** delegate to supply authorization header value for the calls */
    private authorizationHeaderProvider: () => string;
    /** underlying http provider */
    private httpDataProvider: IHttpDataProvider;

    /**
     * Initializes an instance of the class
     * @param endpoint endpoint i.e. https://management.azure.com
     * @param authorizationHeaderProvider delegate to supply authorization header value for the calls
     * @param httpDataProvider http data provider to make service requests. If none is provided, default retrying provider is used
     */
    constructor(
        endpoint: string,
        authorizationHeaderProvider: () => string,
        httpDataProvider?: IHttpDataProvider,
    ) {
        if (!endpoint) { throw new Error('Parameter @endpoint cannot be null or white space'); }
        if (!authorizationHeaderProvider) { throw new Error('Parameter @authorizationHeaderProvider cannot be null or white space'); }

        this.endpoint = endpoint;
        this.authorizationHeaderProvider = authorizationHeaderProvider;

        this.httpDataProvider = httpDataProvider || new RetryHttpDataProvider(new RetryPolicyFactory());
    }

    /**
     * Executes ARM service request
     * @param verb http verb 
     * @param pathAndQuery full request path and query i.e. /subscriptions?api-version=xyz
     * @param timeoutMs timeout in milliseconds 
     * @param headers request headers (optional)
     * @param content request content (optional)
     * @returns promise of async operation with response body as a result
     */
    public executeRequest(
        verb: HttpVerb,
        pathAndQuery: string, 
        timeoutMs: number,
        headers?: StringMap<string>,
        content?: any,
    ): Promise<any> {
        if (!pathAndQuery) { throw new Error('Parameter @pathAndQuery may not be null or white space'); }
        if (timeoutMs <= 0) { throw new Error('Parameter @timeoutMs must be > 0'); }

        let httpRequestContent: IHttpRequestContent = null;

        if (content) {
            httpRequestContent = {
                contentType: 'application/json',
                content: JSON.stringify(content),
            };
        }

        const httpRequestUrl = this.endpoint + pathAndQuery;

        const httpRequestHeaders = this.getHttpRequestHeaders(headers);

        return this.httpDataProvider.executeRequest(verb, httpRequestUrl, timeoutMs, httpRequestHeaders, httpRequestContent);
    }

    /**
     * Constructs http request headers
     * @param armRequestHeaders optional ARM request headers supplied for the call
     * @returns headers constructed for http request (having Authorization header at a minimum)
     */
    private getHttpRequestHeaders(armRequestHeaders?: StringMap<string>) {
        let headers = {
            Authorization: this.authorizationHeaderProvider(),
        };

        if (armRequestHeaders) {
            for (const headerName in armRequestHeaders) {
                if (armRequestHeaders.hasOwnProperty(headerName) && (headerName !== 'Authorization')) {
                    headers[headerName] = armRequestHeaders[headerName];
                }
            }
        }

        return headers;
    }
}
