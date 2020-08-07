/** 3rd party */
import { Promise } from 'es6-promise';

/** local */
import { ITimeInterval } from '../TimeInterval';
import { HttpVerb, IHttpDataProvider, IHttpRequestContent } from './HttpDataProvider';
import { IArmDataProvider } from './ArmDataProvider';
import { IHttpRequestError } from '../HttpRequestError';
import { RetryHttpDataProvider } from './RetryHttpDataProvider';
import { RetryPolicyFactory } from '../RetryPolicyFactory';

/** Kusto api version */
const KUSTO_OVER_ARM_API_VERSION = '2017-10-01';
const DRAFT_API_VERSION = 'v1';

/**
 * Defines query options for Kusto queries
 */
export interface IKustoQueryOptions {
    /** request info header */
    requestInfo?: string;

    /** request id */
    requestId?: string;

    /** session id */
    sessionId?: string;

    /** query time interval */
    timeInterval?: ITimeInterval;

    /** prefer header value */
    preferences?: string;

    /** relative timespan, should be in format like PT30M, PT1H etc. */
    relativeTimeSpan?: string;
}

/**
 * Defines Kusto data provider functionality
 */
export interface IKustoDataProvider {
    /**
     * Executes Kusto query
     * @param workspaceResourceId target workspace Azure resource id
     * @param query query statement
     * @param timeoutMs query timeout in milliseconds
     * @param queryOptions query options
     * @param workspaces list of workspaces where query will be executed
     * @returns promise of async operation with response object as a result
     */
    executeQuery(
        workspaceResourceId: string,
        query: string,
        timeoutMs: number,
        queryOptions?: IKustoQueryOptions,
        workspaces?: string[],
    ): Promise<any>;
}

/**
 * Defines Kusto query properties for batched queries
 */
export interface IKustoQuery {
    /** query identifier */
    queryId: string;
    /** target workspace Azure resource id */
    workspaceResourceId: string;
    /** query statement */
    queryStatement: string;
    /** query timeout in milliseconds */
    timeoutMs: number,
    /** query options */
    options?: IKustoQueryOptions;
}

/**
 * Defines Kusto response properties for batched queries
 */
export interface IKustoResponse {
    /** http request status code */
    status: number;
    /** request result (if not an error) */
    result?: any;
    /** request error (if not successful) */
    error?: IHttpRequestError;
}

/**
 * Defines functionality of Kusto batch request data provider
 */
export interface IKustoBatchDataProvider {
    /**
     * Executes batch of Kusto requests
     * @param queries set of queries to execute
     * @param timeoutMs batch timeout
     * @returns promise of async operation with set or responses as a result
     */
    executeBatch(queries: IKustoQuery[], timeoutMs: number): Promise<StringMap<IKustoResponse>>;
}

/**
 * Preference headers for Draft service
 */
export class Prefer {
    /** Instructs Draft not to load metadata for Kusto functions */
    public static ExcludeFunctions: string = 'exclude-functions';

    /** Instructs Draft not to load metadata for custom Log Analytics fields (_s suffix fields and alike) */
    public static ExcludeCustomFields: string = 'exclude-customFields';

    /** Instructs Draft not to load metadata for custom logs (_CL suffix tables) */
    public static ExcludeCustomLogs: string = 'exclude-customLogs';
}

/**
 * Kusto data provider executing queries through Azure Resource Manager (ARM) service
 */
export class KustoArmDataProvider implements IKustoDataProvider {
    /** source application id (for Kusto telemetry) */
    private applicationId: string;
    /** underlying ARM data provider */
    private armDataProvider: IArmDataProvider;

    /**
     * Initializes instnace of the class
     * @param applicationId source application id (for Kusto telemetry)
     * @param armDataProvider underlying ARM data provider
     */
    constructor(
        applicationId: string,
        armDataProvider: IArmDataProvider,
    ) {
        if (!applicationId) { throw new Error('Parameter @applicationId may not be null or white space'); }
        if (!armDataProvider) { throw new Error('Parameter @armDataProvider may not be null or undefined'); }

        this.applicationId = applicationId;
        this.armDataProvider = armDataProvider;
    }

    /**
     * Executes Kusto query
     * @param workspaceResourceId target workspace Azure resource id
     * @param query query statement
     * @param timeoutMs query timeout in milliseconds
     * @param queryOptions query options
     * @param workspaces list of workspaces where query will be executed
     * @returns promise of async operation with response object as a result
     */
    public executeQuery(
        workspaceResourceId: string,
        query: string,
        timeoutMs: number,
        queryOptions?: IKustoQueryOptions,
        workspaces?: string[],
    ): Promise<any> {
        if (!workspaceResourceId) { throw new Error('Parameter @workspaceResourceId may not be null or white space'); }
        if (!query) { throw new Error('Parameter @query may not be null or white space'); }
        if (timeoutMs <= 0) { throw new Error('Parameter @timeoutMs must be > 0'); }

        return this.armDataProvider.executeRequest(
            HttpVerb.Post,
            this.getRequestPath(workspaceResourceId),
            timeoutMs,
            __getKustoRequestHeaders(this.applicationId, timeoutMs, queryOptions),
            __getKustoRequestBody(query, queryOptions, workspaces));
    }

    /**
     * Constructs ARM request path and query
     * @param workspaceId target Kusto query workspace Azure resource id
     */
    private getRequestPath(workspaceId: string): string {
        return workspaceId + '/query?api-version=' + KUSTO_OVER_ARM_API_VERSION;
    }
}

/**
 * Kusto data provider executing queries through Draft service
 */
export class KustoDraftDataProvider implements IKustoDataProvider, IKustoBatchDataProvider {
    /** Draft service endpoint */
    private endpoint: () => string;
    /** application id (for Kusto telemetry) */
    private applicationId: string;
    /** delegate to obtain Draft authorization token */
    private authorizationHeaderProvider: () => string;
    /** underlying http data provider */
    private httpDataProvider: IHttpDataProvider;

    /**
     * Initializes instance of the class
     * @param endpoint Draft service endpoint
     * @param applicationId application id (for Kusto telemetry)
     * @param authorizationHeaderProvider delegate to obtain Draft authorization token
     * @param httpDataProvider underlying http data provider
     */
    constructor(
        endpoint: () => string,
        applicationId: string,
        authorizationHeaderProvider: () => string,
        httpDataProvider?: IHttpDataProvider,
    ) {
        if (!endpoint) { throw new Error('Parameter @endpoint cannot be null or white space'); }
        if (!applicationId) { throw new Error('Parameter @applicationId cannot be null or white space'); }
        if (!authorizationHeaderProvider) { throw new Error('Parameter @authorizationHeaderProvider cannot be null or white space'); }

        this.endpoint = endpoint;
        this.applicationId = applicationId;
        this.authorizationHeaderProvider = authorizationHeaderProvider;

        this.httpDataProvider = httpDataProvider || new RetryHttpDataProvider(new RetryPolicyFactory());
    }

    /**
     * Executes Kusto query
     * @param workspaceResourceId target workspace Azure resource id
     * @param query query statement
     * @param timeoutMs query timeout in milliseconds
     * @param queryOptions query options
     * @param workspaces list of workspaces where query will be executed
     * @returns promise of async operation with response object as a result
     */
    public executeQuery(
        workspaceResourceId: string,
        query: string,
        timeoutMs: number,
        queryOptions?: IKustoQueryOptions,
        workspaces?: string[],
    ): Promise<any> {
        if (!workspaceResourceId) { throw new Error('Parameter @workspaceResourceId may not be null or white space'); }
        if (!query) { throw new Error('Parameter @query may not be null or white space'); }
        if (timeoutMs <= 0) { throw new Error('Parameter @timeoutMs must be > 0'); }

        const requestUrl =
            this.endpoint()
            + '/'
            + DRAFT_API_VERSION
            + workspaceResourceId
            + '/query';

        const requestContent: IHttpRequestContent = {
            contentType: 'application/json',
            content: JSON.stringify(__getKustoRequestBody(query, queryOptions, workspaces))
        };

        let requestHeaders = __getKustoRequestHeaders(this.applicationId, timeoutMs, queryOptions);

        requestHeaders = this.setAuthorizationHeader(requestHeaders);

        return this.httpDataProvider.executeRequest(
            HttpVerb.Post,
            requestUrl,
            timeoutMs,
            requestHeaders,
            requestContent);
    }

    /**
     * Executes batch of Kusto queries
     * @param queries set of queries to execute
     * @param timeoutMs batch timeout
     * @returns promise of async operation with set or responses as a result
     */
    public executeBatch(queries: IKustoQuery[], timeoutMs: number): Promise<StringMap<any>> {
        if (!queries || (queries.length <= 0)) { throw new Error('Parameter @queries may not be null or empty'); }
        if (timeoutMs <= 0) { throw new Error('Parameter @timeoutMs must be > 0'); }

        const requestUrl = this.endpoint() + '/' + DRAFT_API_VERSION + '/$batch';
        const requestHeaders = this.setAuthorizationHeader();

        const requestContent = this.getRequestContent(queries);

        return this.httpDataProvider.executeRequest(
            HttpVerb.Post,
            requestUrl,
            timeoutMs,
            requestHeaders,
            requestContent)
            .then((httpRequestResult) => {
                return this.parseResponse(httpRequestResult);
            });
    }

    /**
     * Adds authorization header for the request
     * @param headers request headers (optional)
     * @returns request headers with added Authorization header and value
     */
    private setAuthorizationHeader(headers?: StringMap<string>): StringMap<string> {
        let outputHeaders = headers || {};

        outputHeaders.Authorization = this.authorizationHeaderProvider();

        return outputHeaders;
    }

    /**
     * Generates http request content
     * @param queries set of Kusto queries to execute
     */
    private getRequestContent(queries: IKustoQuery[]): IHttpRequestContent {
        if (!queries || (queries.length <= 0)) { throw new Error('Parameter @queries may not be null or empty'); }

        const requests: Array<any> = new Array();

        for (const query of queries) {
            const request = this.getQueryRequest(query);
            requests.push(request);
        }

        const requestContent = {
            'requests': requests
        };

        return {
            contentType: 'application/json',
            content: JSON.stringify(requestContent)
        };
    }

    /**
     * Generates object defining request payload for single Kusto query
     * @param query Kusto query
     * @returns http request payload for the query
     */
    private getQueryRequest(query: IKustoQuery): any {
        if (!query) { throw new Error('Parameter @query may not be null or undefined'); }

        let requestHeaders: StringMap<string> = __getKustoRequestHeaders(this.applicationId, query.timeoutMs, query.options);
        requestHeaders['Content-Type'] = 'application/json';

        return {
            id: query.queryId,
            headers: requestHeaders,
            body: __getKustoRequestBody(query.queryStatement, query.options),
            method: HttpVerb.Post,
            path: '/query',
            workspace: query.workspaceResourceId,
        };
    }

    /**
     * Parses http response received from Draft to construct structured response objects
     * @param httpRequestResult raw http response
     * @returns array of parsed Kusto responses organized into dictionary by query id
     */
    private parseResponse(httpRequestResult: any): StringMap<IKustoResponse> {
        if (!httpRequestResult || !httpRequestResult.responses || (httpRequestResult.responses.length <= 0)) { return {}; }

        let result: StringMap<IKustoResponse> = {};

        for (const response of httpRequestResult.responses) {
            result[response.id] = {
                status: response.status,
                result: response.body
            };

            if (response.status >= 400) {
                result[response.id].error = {
                    origin: response,
                    status: response.status,
                    responseText: response.body,
                }
            }
        }

        return result;
    }
}

/**
 * Kustructs Kusto http request headers
 * @param applicationId application if (for Kusto telemetry)
 * @param timeoutMs timeout in milliseconds
 * @param queryOptions query options
 * @returns dictionary of http request headers
 */
function __getKustoRequestHeaders(
    applicationId: string,
    timeoutMs: number,
    queryOptions?: IKustoQueryOptions,
): StringMap<string> {
    if (!applicationId) { throw new Error('Parameter @applicationId may not be null or white space'); }
    if (timeoutMs <= 0) { throw new Error('Parameter @timeoutMs must be > 0'); }

    let preferences = 'wait=' + Math.round(timeoutMs / 1000.0);

    if (queryOptions && queryOptions.preferences) {
        preferences += ',' + queryOptions.preferences;
    }

    let headers: any = {
        'x-ms-app': applicationId,
        'Prefer': preferences
    };

    if (queryOptions && queryOptions.requestInfo) {
        headers['x-ms-client-request-info'] = queryOptions.requestInfo;
    }

    if (queryOptions && queryOptions.requestId) {
        headers['x-ms-client-request-id'] = queryOptions.requestId;
    }

    if (queryOptions && queryOptions.sessionId) {
        headers['x-ms-client-session-id'] = queryOptions.sessionId;
    }

    return headers;
}

/**
 * Constructs http request body json
 * @param query query statement
 * @param queryOptions questy options
 * @param workspaces optional workspace list
 * @returns http request body object
 */
function __getKustoRequestBody(
    query: string,
    queryOptions?: IKustoQueryOptions,
    workspaces?: string[],
): any {
    if (!query) { throw new Error('Parameter @query may not be null or undefined'); }

    let data: any = { query };

    if (queryOptions) {
        if (queryOptions.relativeTimeSpan) {
            data.timespan = queryOptions.relativeTimeSpan;
        } else if (queryOptions.timeInterval) {
            data.timespan = __getTimespan(queryOptions.timeInterval);
        }
    }

    if (workspaces && workspaces.length > 0) {
        data.workspaces = workspaces;
    }

    return data;
}

/**
 * Creates Kusto 'timespan' parameter value given time interval of the query
 * @param interval query time interval
 * @returns timespan parameter value
 */
function __getTimespan(interval: ITimeInterval): string {
    if (!interval) { throw new Error('Parameter @interval may not be null or undefined'); }

    const startTime = interval.getBestGranularStartDate();
    const endTime = interval.getBestGranularEndDate(true);

    return startTime.toISOString() + '/' + endTime.toISOString();
}
