/**
 * Components of a valid http response error
 */
export interface IHttpRequestError {
    /** status code */
    status: number;

    /** original object / error / exception transformed into this http error */
    origin: any;

    /** status text if available */
    statusText?: string;

    /** http response text if available */
    responseText?: string;
}

/**
 * Functionality to construct and manipulate http error responses
 */
export class HttpRequestError {
    /**
     * Constructs error response object using information returned by jQuery ajax
     * @param jqXHR jQuery Xml http request object
     * @param textStatus optional test status returned by jQuery
     * @param errorThrown optional response code
     * @returns object describing http reqeust error, i.e. object with property
     * named httpRequestError implementing IHttpRequestError interface
     * OR
     * object containing input parameters if they are not considered to be 
     * a valid http error response
     */
    public static fromJQueryError(
        jqXHR: any,
        textStatus: string,
        errorThrown: string
    ): any {
        // construct origin descriptor
        const origin = {
            jqXHR,
            textStatus,
            errorThrown
        };

        // consider error to be http error in case it has XmlHttpRequest with status
        // and status is not null, 0 or empty string
        if (!jqXHR || !jqXHR.status) { return origin; }

        const httpRequestError: IHttpRequestError = {
            status: jqXHR.status,
            statusText: jqXHR.statusText,
            responseText: jqXHR.responseText,
            origin
        };

        return { httpRequestError };
    }

    /**
     * Checks whether object provided describes a valid http error response
     * (constructed by this class)
     * @param error Error object to test
     * @returns True if object provided is considerd a valid http response error
     */
    public static isHttpRequestError(error: any): boolean {
        return (error &&
            error.httpRequestError &&
            error.httpRequestError.status &&
            (error.httpRequestError.status > 0) ? true : false);
    }

    /**
     * Checks whether object provided describes http access denied response
     * (constructed by this class)
     * @param error Error object to test
     * @returns True if object provided is considerd to be http access denied response
     */
    public static isAccessDenied(error: any): boolean {
        return (HttpRequestError.isHttpRequestError(error) &&
            ((error.httpRequestError.status === 401) ||
                (error.httpRequestError.status === 403))
            ? true : false);
    }
}
