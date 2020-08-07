/**
 * block
 */
import * as $ from 'jquery';
import { Promise } from 'es6-promise'

/**
 * Local
 */
import { RestVerb } from './RestVerb';
import { HttpRequestError } from './HttpRequestError';
import { EnvironmentConfig } from '../EnvironmentConfig';
import { InitializationInfo, AuthorizationTokenType } from '../InitializationInfo';

/**
 * Data provider for ARM.
 */
export interface IARMDataProvider {
    /**
     * Executes a POST request to the arm endpoint + uri 
     * @param uri uri that is combined with the ARM endpoint to create the queryURL
     * @param timeoutMs the length of time the client should wait for a response before returning an error
     * @param data request payload
     * @param headers http headers to set for the request
     * @returns promise to async execution of the request
     */
    executePost(uri: string, timeoutMs: number, data?: string, headers?: StringMap<string>): Promise<any>;

    /**
     * Executes a GET request to the arm endpoint + uri 
     * @param uri uri that is combined with the ARM endpoint to create the queryURL
     * @param timeoutMs the length of time the client should wait for a response before returning an error
     * @param headers http headers to set for the request
     * @returns promise to async execution of the request
     */
    executeGet(uri: string, timeoutMs: number, headers?: StringMap<string>): Promise<any>;
}
/**
 * Implementation of Azure REsource Manager (ARM) data provider.
 */
export class ARMDataProvider implements IARMDataProvider {
    /**
     * .ctor()
     */
    constructor() {
    }

    /**
     * Executes a POST request to the arm endpoint + uri 
     * @param uri uri that is combined with the ARM endpoint to create the queryURL
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
        return this.executeRequest(uri, timeoutMs, RestVerb.Post, data, headers);
    }

    /**
     * Executes a GET request to the arm endpoint + uri 
     * @param uri uri that is combined with the ARM endpoint to create the queryURL
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
     * Executes a request to the arm endpoint + uri 
     * @param uri uri that is combined with the ARM endpoint to create the queryURL
     * @param timeoutMs the length of time the client should wait for a response before returning an error
     * @param requestType GET or POST
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
        return new Promise((resolve, reject) => {
            const ajaxRequestDescriptor = this.getRequestDescriptor(uri, timeoutMs, requestType, data, headers);

            // amend request descriptor with callbacks for success and failure
            ajaxRequestDescriptor.success = 
                (result: any) => { resolve(result); };
            
            ajaxRequestDescriptor.error = 
                (jqXHR: any, textStatus: string, errorThrown: string) => {
                    const error = HttpRequestError.fromJQueryError(jqXHR, textStatus, errorThrown);
                    reject(error); 
                };

            $.ajax(ajaxRequestDescriptor);
        });
    }

    /**
     * Constructs jQuery http request descriptor
     * @param uri uri that is combined with the ARM endpoint to create the queryURL
     * @param timeoutMs the length of time the client should wait for a response before returning an error
     * @param requestType request verb
     * @param data request payload 
     * @param headers http headers to set for the request
     * @returns jQUery object describing ajax request to be executed
     */
    private getRequestDescriptor(
        uri: string,
        timeoutMs: number,
        requestType: RestVerb,
        data?: string,
        headers?: StringMap<string>
    ): any {
        if (!uri) { throw new Error('Parameter @uri may not be null or empty'); }

        const queryUrl = EnvironmentConfig.Instance().getARMEndpoint() + uri;

        // construct request headers
        let requestHeaders = {
            Authorization: InitializationInfo.getInstance().getAuthorizationHeaderValue(AuthorizationTokenType.Arm),
        };

        if (headers) {
            for (const headerName in headers) {
                if (headers.hasOwnProperty(headerName) && (headerName !== 'Authorization')) {
                    requestHeaders[headerName] = headers[headerName];
                }
            }
        }

        return {
            contentType: 'application/json',
            data: data,
            headers: requestHeaders,
            timeout: timeoutMs,
            type: requestType,
            url: queryUrl,
        };
    }
}
