/** tpl */
import { Promise } from 'es6-promise';

/** shared */
import { IWorkspaceInfo } from '../IWorkspaceInfo';
import * as Constants from '../GlobalConstants';

/** local */
import { IARMDataProvider } from './ARMDataProvider';
import { ITimeInterval } from './TimeInterval';
import { ApiClientRequestInfo } from './ApiClientRequestInfo';
import { EnvironmentConfig } from '../EnvironmentConfig';

/** Kusto api version */
const API_VERSION = '2017-10-01';

const RESOURCE_CENTRIC_API_VERSION: string = '2018-08-01-preview';

/** Kusto request timeout */
const TIMEOUT_MS = Constants.MaxArmRequestTimeoutMs;

/**
 * Defines query options for Kusto queries
 */
export interface IKustoQueryOptions {
    /** request info header */
    requestInfo?: string;

    requestInfoV2?: ApiClientRequestInfo;

    /** request id */
    requestId?: string;

    /** session id */
    sessionId?: string;

    /** query time interval */
    timeInterval?: ITimeInterval;

    /** prefer header value */
    preferences?: string;

    region?: string;
}

export interface IDraftQueryParams {
    workspace?: IWorkspaceInfo;
    resourceId?: string;
    query: string;
    queryOptions: IKustoQueryOptions;
}

export interface IDraftResponseTable {
    TableName: string;
    Columns: any[];
    Rows: any[];
}

export interface IDraftResponseWorkspaceMapping {
    resourceId: string;
    workspaces: any[]; // Array of workspace resourceIds
}

export interface IDraftQueryResponseWarning {
    code: string;
    limit: number;
    message: string;
    workspaces?: any[];
    regions?: any[];
}

export interface IDraftQueryApiResponse {
    Tables: IDraftResponseTable[];
    workspaceMappings: IDraftResponseWorkspaceMapping[];
    warnings: IDraftQueryResponseWarning[];
}

/**
 * Defines functionality of Log Analytics-Draft data provider
 * Draft service is RP for LA.
 */
export interface IKustoDataProvider {

    executeDraftQuery(queryParams: IDraftQueryParams): Promise<DraftQueryResponse>;

    executeMultiWorkspaceQuery(
        workspaces: IWorkspaceInfo[],
        query: string,
        options?: IKustoQueryOptions): Promise<DraftQueryResponse>;
}

export enum DraftWarningCode {
    WorkspaceLimitExceeded = 'WorkspaceLimitExceeded',
    WorkspaceRegionLimitExceeded = 'WorkspaceRegionLimitExceeded',
    Unknown = 'Unknown'
}

/**
 * This class maintains the Warning code, message and extra meta data returned by Draft API.
 */
export class DraftQueryWarning {
    private warning: IDraftQueryResponseWarning;
    private warningState: DraftWarningCode;
    constructor(warning: IDraftQueryResponseWarning) {
        this.warning = warning;
        if (!this.warning) {
            return;
        }
        if (warning.code) {
            switch (warning.code) {
                case 'WorkspaceLimitExceeded':
                    this.warningState = DraftWarningCode.WorkspaceLimitExceeded;
                    break;
                case 'WorkspaceRegionLimitExceeded':
                    this.warningState = DraftWarningCode.WorkspaceRegionLimitExceeded;
                    break;
                default:
                    this.warningState = DraftWarningCode.Unknown;
                    break;
            }
        }

    }

    public get Warning(): DraftWarningCode {
        return this.warningState;
    }

    public get Limit(): number {
        return this.warning && this.warning.limit;
    }

    public get Message(): string {
        return this.warning && this.warning.message;
    }

    public get SerializedObject(): StringMap<any> {
        return {
            Warning: this.Warning,
            Limit: this.Limit,
            Message: this.Message
        }
    }
}

export class DraftQueryError {
    private error: any;
    constructor(error: any) {
        this.error = error;
    }

    public get StatusCode() {
        return this.error?.httpRequestError?.status;
    }

    public get ErrorMessage() {
        return this.error?.httpRequestError?.responseText?.error?.message;
    }

    public get SerializedErrorObject() {
        return JSON.stringify(this.error);
    }
}

export class DraftQueryResponse {
    private response: IDraftQueryApiResponse;
    private workspaceIds: string[];
    private warnings: DraftQueryWarning[];
    private error: DraftQueryError;
    constructor(response: IDraftQueryApiResponse, error?: any) {
        this.response = response;
        this.error = error && new DraftQueryError(error);
        if (!this.response) {
            this.workspaceIds = [];
            this.warnings = [];
            return;
        }
        if (this.response.workspaceMappings?.[0]?.workspaces) {
            this.workspaceIds = this.response.workspaceMappings[0].workspaces.map((w) => w.resourceId);
        } else {
            this.workspaceIds = [];
        }

        if (this.response.warnings && this.response.warnings.length > 0) {
            this.warnings = this.response.warnings.map((w) => new DraftQueryWarning(w));
        }
    }

    public get Tables(): IDraftResponseTable[] {
        return this.response && this.response.Tables;
    }

    public get WorkspaceIds(): string[] {
        return this.workspaceIds;
    }

    public get WorkspaceCount(): number {
        return this.workspaceIds.length;
    }

    public get Warnings(): DraftQueryWarning[] {
        return this.warnings || [];
    }

    public get Error(): DraftQueryError {
        // BB: Today Draft API is returning 400 status code if there is no data for the given scope.
        // This behavior will change soon in Draft and API will return empty rows.
        // Until then UX should show empty grids if the Draft response code is 400.
        if (this.error?.StatusCode !== 400) {
            return this.error;
        }
        return undefined;
    }

    public get TelemetryProps(): StringMap<string> {
        const props: StringMap<string> = {};
        props.workspaceCount = this.WorkspaceCount + '';
        props.workspaceIds = this.WorkspaceIds.join(','),
        props.warnings = this.Warnings && JSON.stringify(this.Warnings.map((w) => w.SerializedObject))
        return props;
    }
}

/**
 * Kusto / Log Analytics data provider
 * Please look at: https://dev.loganalytics.io/documentation/Using-the-API/Cross-Resource-Queries
 */
export class KustoDataProvider implements IKustoDataProvider {
    /** underlying ARM data provider */
    private armDataProvider: IARMDataProvider;

    /** application id */
    private applicationId: string

    /**
     * ,ctor
     * @param armDataProvider underlying ARM data provider 
     * @param applicationId application identifier to place in x-ms-app header for query api
     */
    constructor(
        armDataProvider: IARMDataProvider,
        applicationId: string
    ) {
        if (!armDataProvider) { throw new Error('Parameter @armDataProvider may not be null or empty'); }
        this.armDataProvider = armDataProvider;
        this.applicationId = applicationId;
    }

    public executeDraftQuery(queryParams: IDraftQueryParams): Promise<DraftQueryResponse> {
        if (!queryParams || !queryParams.query) { throw new Error('Parameter @query may not be null or empty'); }

        // If queryParams has workspace and workspaceLocation then use workspaceCentric query.
        // The advantage of using workspace centric query is, we will avaoid resource to workspace mapping
        // Workspace to azure region mapping at draft end point.
        if (queryParams.workspace && queryParams.workspace.id) {
            return this.executeWorkspaceCentricQuery(queryParams.workspace, queryParams.query, queryParams.queryOptions);
        }

        // If we dont know the workspace and if we know the azure resource then use resource centric query.
        if (queryParams.resourceId) {
            return this.executeResourceCentricQuery(queryParams.resourceId, queryParams.query, queryParams.queryOptions);
        }
        return new Promise((resolse, reject) => { reject('Invalid queryParams') });
    }

    /**
     * Executes cross workspace Draft query. Draft supports max of 10 workspaces only.
     * @param workspaces 
     * @param query 
     * @param options 
     */
    public executeMultiWorkspaceQuery(
        workspaces: IWorkspaceInfo[],
        query: string,
        options?: IKustoQueryOptions): Promise<DraftQueryResponse> {
        if (!workspaces || !workspaces.length || workspaces.length === 0) {
            throw new Error('Parameter @workspaces may not be null or empty');
        }

        if (!query) { throw new Error('Parameter @query may not be null or empty'); }
        const workspaceIds: string[] = workspaces.map((w: IWorkspaceInfo) => w.id);
        const uri = workspaceIds[0] + '/query?api-version=' + API_VERSION;

        let data: any = {
            query: query
        };

        if (options && options.timeInterval) {
            data.timespan = this.getTimespan(options.timeInterval);
        }
        if (workspaces.length === 1 && !!workspaces[0].location) {
            options.region = workspaces[0].location;
        }

        if (workspaceIds.length > 1) {
            // If the query needs to be run across multiple workspaces then we need to follow the
            // Draft team Cross-Resource queries format.
            // Please look at: https://dev.loganalytics.io/documentation/Using-the-API/Cross-Resource-Queries
            // If we want to make Cross workspace ARM call then we should put rest of the workspace resourceIds
            // As 'authorizedResources' field in the ARM call.
            data.authorizedResources = workspaceIds;
            data.workspaces = workspaceIds;
        }
        return this.armDataProvider.executePost(uri, TIMEOUT_MS, JSON.stringify(data), this.getQueryHeaders(options))
            .then((response: IDraftQueryApiResponse) => {
                return new DraftQueryResponse(response);
            });
    }

    /**
     * Executes query on a specified workspace
     * @param workspace workspace descriptor
     * @param query query to execute
     * @param options optional query parameters
     * @returns operation promise
     */
    private executeResourceCentricQuery(
        resourceId: string,
        query: string,
        options?: IKustoQueryOptions
    ): Promise<DraftQueryResponse> {
        if (!resourceId) { throw new Error('Parameter @resourceId may not be null or empty'); }
        if (!query) { throw new Error('Parameter @query may not be null or empty'); }

        const uri: string = resourceId + '/providers/microsoft.insights/logs?api-version=' + RESOURCE_CENTRIC_API_VERSION
            + '&scope=hierarchy';
        if (options.requestInfoV2?.queryName && !options.requestInfoV2?.queryName?.endsWith('_rc')) {
            options.requestInfoV2.queryName = options.requestInfoV2.queryName + '_rc';
        } else if (options.requestInfo && !options.requestInfo.endsWith('_rc')) {
            options.requestInfo = options.requestInfo + '_rc';
        }
        return this.executePost(uri, query, options);
    }

    /**
     * Executes query on a specified workspace
     * @param workspaceId workspace Azure resource id
     * @param query query to execute
     * @param options optional query parameters
     * @returns operation promise
     */
    private executeWorkspaceCentricQuery(
        workspace: IWorkspaceInfo,
        query: string,
        options?: IKustoQueryOptions
    ): Promise<DraftQueryResponse> {
        if (!workspace) { throw new Error('Parameter @workspace may not be null or empty'); }
        if (!query) { throw new Error('Parameter @query may not be null or empty'); }

        const uri = workspace.id + '/query?api-version=' + API_VERSION;
        if (workspace.location) {
            options.region = workspace.location;
        }
        return this.executePost(uri, query, options);
    }

    private executePost(uri: string, query: string, options?: IKustoQueryOptions): Promise<DraftQueryResponse> {
        const data: any = {
            query: query
        };
        if (options && options.timeInterval) {
            data.timespan = this.getTimespan(options.timeInterval);
        }

        return this.armDataProvider.executePost(uri, TIMEOUT_MS, JSON.stringify(data), this.getQueryHeaders(options))
            .then((response: IDraftQueryApiResponse) => {
                return new DraftQueryResponse(response);
            });
    }

    /**
     * Build Kusto 'timespan' parameter value
     * @param interval time interval
     * @returns interval data in Kusto's timespan format:
     *          2007-03-01T13:00:00Z/2008-05-11T15:30:00Z
     */
    private getTimespan(interval: ITimeInterval): string {
        const startTime = interval.getBestGranularStartDate();
        const endTime = interval.getBestGranularEndDate(true);

        return startTime.toISOString() + '/' + endTime.toISOString();
    }

    /**
     * Constructs Kusto request headers
     * @param queryOptions query options
     * @returns set of headers for request
     */
    private getQueryHeaders(queryOptions?: IKustoQueryOptions): StringMap<string> {
        // note: 'Prefer' header below forces Kusto to produce 'old format' of the response
        //       - the same one that was in 2017-01-01-preview version
        let preferences = 'response-v1=false,include-workspacemappings=true';

        if (queryOptions && queryOptions.preferences) {
            preferences += ',' + queryOptions.preferences;
        }

        let queryHeaders = {
            'x-ms-app': this.applicationId || Constants.InfraInsightsApplicationId,
            'Prefer': preferences
        };

        if (queryOptions?.requestInfoV2) {
            queryHeaders['x-ms-client-request-info'] = queryOptions.requestInfoV2.ClientRequestInfoString;
        } else if (queryOptions?.requestInfo) {
            queryHeaders['x-ms-client-request-info'] = queryOptions.requestInfo;
        }

        if (queryOptions?.requestId) {
            queryHeaders['x-ms-client-request-id'] = queryOptions.requestId;
        }

        if (queryOptions?.sessionId) {
            queryHeaders['x-ms-client-session-id'] = queryOptions.sessionId;
        }

        if (queryOptions?.region && EnvironmentConfig.Instance()?.isPublic()) {
            queryHeaders['x-ms-azure-region'] = queryOptions.region;
        }
        return queryHeaders;
    }
}
