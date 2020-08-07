/** 3rd party */
import * as $ from 'jquery';
import { Promise } from 'es6-promise';

/** local */
import { HttpRequestError } from '../HttpRequestError';

/**
 * Http request verbs
 */
export enum HttpVerb {
    Get = 'GET',
    Head = 'HEAD',
    Post = 'POST',
    Put = 'PUT',
    Delete = 'DELETE',
    Connect = 'CONNECT',
    Options = 'OPTIONS',
    Trace = 'TRACE',
    Patch = 'PATCH',
}

/**
 * Http request content structure
 */
export interface IHttpRequestContent {
    /** Content-Type value */
    contentType: string,

    /** request payload */
    content: string,
}

/**
 * Defines http data provider functionality
 */
export interface IHttpDataProvider {
    /**
     * Executes http request
     * @param verb http verb 
     * @param url full request url
     * @param timeoutMs timeout in milliseconds 
     * @param headers request headers (optional)
     * @param content request content (optional)
     * @returns Promise of async operation with response body as a result
     */
    executeRequest(
        verb: HttpVerb,
        url: string, 
        timeoutMs: number,
        headers?: StringMap<string>,
        content?: IHttpRequestContent,
    ): Promise<any>;
}

/**
 * Provides functionality to make http data requests
 */
export class HttpDataProvider implements IHttpDataProvider {
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
        if (!url) { throw new Error('Parameter @url cannot be null or white space'); }
        if (timeoutMs <= 0) { throw new Error('Parameter @timeoutMs must be > 0'); }

        return new Promise((resolve, reject) => {
            const ajaxRequestDescriptor = this.getRequestDescriptor(verb, url, timeoutMs, content, headers);

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
     * Creates object describing ajax request
     * @param verb http verb 
     * @param url full request url
     * @param timeoutMs timeout in milliseconds 
     * @param headers request headers (optional)
     * @param content request content (optional)
     * @returns object describing ajax request to be made
     */
    private getRequestDescriptor(
        verb: HttpVerb,
        url: string,
        timeoutMs: number,
        content?: IHttpRequestContent,
        headers?: StringMap<string>
    ): any {
        let descriptor: any = {
            timeout: timeoutMs,
            type: verb,
            url: url,
        };

        if (content) {
            descriptor.contentType = content.contentType;
            descriptor.data = content.content;
        }

        if (headers) {
            descriptor.headers = headers;
        }

        return descriptor;
    }
}
