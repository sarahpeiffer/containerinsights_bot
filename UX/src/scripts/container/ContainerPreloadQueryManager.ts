import * as uuid from 'uuid';
import * as moment from 'moment';
import { Promise } from 'es6-promise';

import { TimeInterval, ITimeInterval } from '../shared/data-provider/TimeInterval';
import { IContainerInsightsPreloadState } from './IContainerInsightsPreloadState';
import { ITelemetryBucket } from '../shared/globals/globals';
import { QueryAvenue, ChartQueryTelemetryEventName, ChartDataProvider, ChartDataProviderFactory } from './data-provider/ChartDataProvider';
import { InitializationInfo, AuthorizationTokenType } from '../shared/InitializationInfo';
import { IQueryManager, IQueryTimeRange } from './ContainerPreloadWorker';
import { IKubernetesCluster } from './IBladeContext';
import { BladeContext } from './BladeContext';
import { ClusterType } from '../multicluster/metadata/IManagedCluster';

/**
 * the charts queries are dual querying against MDM and Kusto now, this
 * interface allows the query creation pipeline to return both sets of promises and
 * keep them named friendly
 */
interface TypedResponses {

    /** request pointers to the mdm promises */
    mdmQueryPromises: Promise<any>[];

    /** request pointer to the kusto promises */
    kustoQueryPromises: Promise<any>[];
}

/**
 * assists with keeping track of mdm/kusto response states... so we can
 * decide how to use data and from which system
 */
interface QueryResponsesState {

    /** current status of the mdm load, success/fail or null/not started */
    mdmLoadStatus: LoadStatus;

    /** current status of the kusto load, success/fail or null/not started */
    kustoLoadStatus: LoadStatus;

    /** if kusto loaded successfully, the raw json response */
    kustoResponse: any;

    /** if mdm loaded successfully, the raw json response */
    mdmResponse: any;

    /** if the processing engine has finished, sets this to true so the second response
     * understands that the preload script is "finished"
     */
    isComplete: boolean;
}

/** status of the load */
enum LoadStatus {
    Success = 'success',
    Failed = 'failed',
    NotStarted = 'not started'
}

/** types of load */
enum LoadType {
    Kusto = 'kusto',
    MDM = 'mdm'
};

/** invoked when query is complete */
export type QueryCompleteHandler = () => void;

/**
 * preload query manager utilized during preload to load data from
 * kusto and mdm and feed the responses to the primary UI scripts
 */
export class ContainerPreloadQueryManager implements IQueryManager {

    /** query avenue: Arm vs. Draft */
    private queryAvenue: QueryAvenue;

    /** data provider we will use to interact with kusto */
    private _dataProvider: ChartDataProvider;

    /** preload state being provided to the main thread */
    private preloadState: IContainerInsightsPreloadState;

    /** performance measures ultimately being provided to telemetry */
    private performanceMeasures: ITelemetryBucket;

    /** callback invoked when the query manager is complete */
    private queryCompleteHandler: QueryCompleteHandler;

    /**
     * .ctor()
     * @param preloadState state which will be given the load details
     * @param performanceMeasures state which will contain the loading telemetry
     * @param queryCompleteHandler [optional] completion handler
     */
    constructor(preloadState: IContainerInsightsPreloadState, performanceMeasures: ITelemetryBucket,
        queryCompleteHandler?: QueryCompleteHandler) {

        this.preloadState = preloadState;
        this.performanceMeasures = performanceMeasures;
        this.queryCompleteHandler = queryCompleteHandler;

        this.handleEnactQueryResult = this.handleEnactQueryResult.bind(this);

        this.queryAvenue = Math.random() < 2 ? QueryAvenue.Arm : QueryAvenue.Draft;
        this._dataProvider =
            new ChartDataProvider(
                ChartDataProviderFactory.CreateKustoDataProvider(this.queryAvenue),
                ChartDataProviderFactory.CreateArmDataProvider());
    }

    /**
     * Allow an external source to set our authorization keys (eg the UI thread allowing
     * the webworker to make network requests)
     * @param authorizationTable list of authorization keys
     */
    public setAuthorizationValues(authorizationTable: StringMap<string>): void {
        const safeAuthTable = authorizationTable || {};
        const auth = Object.keys(safeAuthTable);
        auth.forEach((key: AuthorizationTokenType) => {
            InitializationInfo.getInstance().setAuthorizationHeaderValue(key, safeAuthTable[key]);
        });
    }

    /**
     * start the charts query originated by preload process running inside worker thread
     * note: worker thread cannot interface with webpack components and therefore we
     * do some parsing and conversion here once received information from worker
     * @param workspaceId workspace id as a string
     * @param clusterResourceId cluster arm resource id
     * @param clusterName cluster name as a string
     * @param queryTimeRange optional query time range to override the default time range(6h)
     * @param shouldQueryMdm optional if true will query MDM before kusto
     */
    public startChartsQueryPreloadWorker(
        workspaceId: string,
        clusterResourceId: string,
        clusterName: string,
        queryTimeRange: IQueryTimeRange,
        shouldQueryMdm: boolean
    ): void {
        // construct blade context
        const bladeContext = BladeContext.instance();
        bladeContext.initialize(
            clusterResourceId,
            clusterName,
            workspaceId);

        this.startChartsQuery(
            workspaceId,
            bladeContext.cluster,
            queryTimeRange,
            shouldQueryMdm);
    }

    /**
      * Starts api queries
      * @param workspaceId workspace to query for (provided by ibiza)
      * @param cluster cluster information
      * @param pillSelectionsOnNavigation pillselections to apply to the query(provided ibiza CI frameblade)
      */
    public startChartsQuery(
        workspaceId: string,
        cluster: IKubernetesCluster,
        queryTimeRange: IQueryTimeRange,
        shouldQueryMdm: boolean
    ): void {
        // set up telemetry for entire set of queries
        const sessionId: string = uuid();

        let endTime = moment(Date.now());
        let startTime = endTime.clone().subtract(6, 'h');

        if (queryTimeRange) {
            endTime = moment(Date.parse(queryTimeRange.endDateTimeISOString));
            startTime = moment(Date.parse(queryTimeRange.startDateTimeISOString));
        }

        const timeInterval = new TimeInterval(
            startTime.toDate(),
            endTime.toDate(),
            100
        );

        const queryStartTime = Date.now();

        this.preloadState.workspaceResourceId = workspaceId;
        this.preloadState.clusterName = cluster.givenName;
        this.preloadState.timeInterval = timeInterval;
        this.preloadState.queryAvenue = this.queryAvenue;
        this.preloadState.isLoadedFromMdm = false;
        this.preloadState.isMdmSlower = false;
        this.preloadState.queryTelemetry = {};

        this.performanceMeasures['pre_mainContentQueryStart'] = Date.now();

        const queries = this.createQueries(
            timeInterval,
            sessionId,
            workspaceId,
            cluster,
            shouldQueryMdm
        );

        const eventState: QueryResponsesState = {
            mdmLoadStatus: LoadStatus.NotStarted,
            kustoLoadStatus: LoadStatus.NotStarted,
            kustoResponse: null,
            mdmResponse: null,
            isComplete: false
        };

        if (shouldQueryMdm) {
            Promise.all(queries.mdmQueryPromises).then((results) => {
                eventState.mdmLoadStatus = LoadStatus.Success;
                eventState.mdmResponse = {
                    results,
                    sessionId,
                    queryStartTime,
                };
                this.handleEnactQueryResult(eventState, LoadType.MDM);
            }).catch((error) => {
                eventState.mdmLoadStatus = LoadStatus.Failed;
                eventState.mdmResponse = {
                    error,
                    sessionId,
                    queryStartTime,
                };
                this.handleEnactQueryResult(eventState, LoadType.MDM);
            });
        }

        Promise.all(queries.kustoQueryPromises).then((results) => {
            eventState.kustoLoadStatus = LoadStatus.Success;
            eventState.kustoResponse = {
                results,
                sessionId,
                queryStartTime,
            };
            this.handleEnactQueryResult(eventState, LoadType.Kusto);
        }).catch((error) => {
            eventState.kustoLoadStatus = LoadStatus.Failed;
            eventState.kustoResponse = {
                error,
                sessionId,
                queryStartTime,
            };
            this.handleEnactQueryResult(eventState, LoadType.Kusto);
        });
    }

    /**
     * sort out how to manage the responses from mdm and kusto... if mdm fails,
     * kusto is going to be used.  If kusto is faster, kusto will be used.
     * otherwise we can use mdm's response.
     * @param eventState current status of the load
     * @param loadType which of the backends this resonse is managing
     */
    private handleEnactQueryResult(eventState: QueryResponsesState, loadType: LoadType) {
        if (loadType === LoadType.Kusto) {
            if (!eventState.mdmLoadStatus || eventState.mdmLoadStatus === LoadStatus.NotStarted) {
                // mdm loaded slower then kusto
                console.log('PRELOAD_QUERYMANAGER::MDM slower then Kusto!');
                this.preloadState.isMdmSlower = true;
                this.handleLoadKusto(eventState.kustoResponse);
            } else {
                // mdm has already loaded
                if (eventState.isComplete) {
                    // successfully... no need for kusto
                    console.log('PRELOAD_QUERYMANAGER::MDM loaded, no kusto required!');
                } else {
                    // unsuccessfully...
                    console.log('PRELOAD_QUERYMANAGER::MDM crashed!');
                    this.handleLoadKusto(eventState.kustoResponse);
                }
            }
        } else {
            if (!eventState.kustoLoadStatus
                || eventState.kustoLoadStatus === LoadStatus.NotStarted
                || eventState.kustoLoadStatus === LoadStatus.Failed) {
                if (this.handleLoadMdm(eventState.mdmResponse)) {
                    console.log('PRELOAD_QUERYMANAGER::MDM load success!');
                    eventState.isComplete = true;
                } else {
                    console.log('PRELOAD_QUERYMANAGER::MDM load failed!');
                }
            }
        }
    }

    /**
     * add an exception which will eventually be logged by the UI
     * @param mdmException exception message we want to log
     */
    private addMdmException(mdmException: string): void {
        if (!this.preloadState.mdmExceptions) {
            this.preloadState.mdmExceptions = [];
        }

        console.error(mdmException);
        this.preloadState.mdmExceptions.push(mdmException);
    }

    /**
     * manage a mdm response... deal with its telemetry, parsing its data, etc
     * @param mdmResponse the actual mdm response
     */
    private handleLoadMdm(mdmResponse: any): boolean {
        if (mdmResponse && mdmResponse.results) {

            const target = mdmResponse.results[0];
            const responses = target.responses;

            let failed = false;
            responses.forEach((response) => {
                if (!response) {
                    this.addMdmException('PRELOAD SCRIPT::MDM Failed Null response');
                    failed = true;
                    return;
                }

                if (response.httpStatusCode >= 300) {
                    failed = true;
                    return;
                }

                const content = response.content;
                if (!content) {
                    this.addMdmException('PRELOAD SCRIPT::MDM Failed Content null');
                    failed = true;
                    return;
                }

                const valueArray = content.value;
                if (!valueArray || valueArray.length < 1) {
                    this.addMdmException('PRELOAD SCRIPT::MDM Failed value array empty or null');
                    failed = true;
                    return;
                }

                valueArray.forEach((value) => {
                    const timeseries = value.timeseries;
                    if (!timeseries || timeseries.length < 1) {
                        this.addMdmException('PRELOAD SCRIPT::MDM Failed time series empty or null');
                        failed = true;
                    }
                    return;
                });
            });

            if (failed) {
                return false;
            }

            this.preloadState.isLoadedFromMdm = true;

            console.log('PRELOAD SCRIPT::Completed MDM successfully');
            this.recordResult(mdmResponse.sessionId, mdmResponse.queryStartTime, true, mdmResponse.results);
            if (this.queryCompleteHandler) { this.queryCompleteHandler(); }
            return true;
        }
        return false;
    }

    /**
     * manage a kusto response, telemetry, parsing data, etc..
     * @param kustoResponse the raw kusto response
     */
    private handleLoadKusto(kustoResponse: any) {
        if (kustoResponse.error) {
            console.error('PRELOAD SCRIPT::Load query failed. Error:', kustoResponse.error);
            this.recordResult(kustoResponse.sessionId, kustoResponse.queryStartTime, false, kustoResponse.error);
            if (this.queryCompleteHandler) { this.queryCompleteHandler(); }
        } else {
            console.log('PRELOAD SCRIPT::Completed successfully');
            this.recordResult(kustoResponse.sessionId, kustoResponse.queryStartTime, true, kustoResponse.results);
            if (this.queryCompleteHandler) { this.queryCompleteHandler(); }
        }
    }

    /**
     * Creates and starts kusto queries for charting data
     * @param timeInterval time interval for the query
     * @param sessionId properties of the query (filters)
     * @param workspaceId workspace for the query
     * @param cluster cluster information
     * @param shouldQueryMdm if true will populate a promise array for querying mdm
     */
    private createQueries(
        timeInterval: ITimeInterval,
        sessionId: string,
        workspaceId: string,
        cluster: IKubernetesCluster,
        shouldQueryMdm: boolean
    ): TypedResponses {
        if (!timeInterval) { throw new Error('Parameter @timeInterval may not be null'); }

        const cpuAndMemoryRequestId: string = uuid();
        const nodeCountRequestId: string = uuid();
        const podCountRequestId: string = uuid();

        const queryStartTime: number = Date.now();

        // start queries
        const perfMetricQuery =
            this._dataProvider.getClusterPerformanceChartData(
                workspaceId,
                timeInterval,
                cluster,
                '',
                cpuAndMemoryRequestId,
                sessionId,
                ''
            ).then((results) => {
                this.recordQueryTelemetry(
                    ChartQueryTelemetryEventName.CpuAndMemory,
                    Date.now() - queryStartTime,
                    cpuAndMemoryRequestId,
                    false);
                return results;
            }).catch((error) => {
                this.recordQueryTelemetry(
                    ChartQueryTelemetryEventName.CpuAndMemory,
                    Date.now() - queryStartTime,
                    cpuAndMemoryRequestId,
                    true,
                    error);
                throw error;
            });

        const nodeCountQuery =
            this._dataProvider.getClusterNodeCountChartData(
                workspaceId,
                timeInterval,
                cluster,
                '',
                nodeCountRequestId,
                sessionId,
                ''
            ).then((results) => {
                this.recordQueryTelemetry(
                    ChartQueryTelemetryEventName.NodeCount,
                    Date.now() - queryStartTime,
                    nodeCountRequestId,
                    false
                );
                return results;
            }).catch((error) => {
                this.recordQueryTelemetry(
                    ChartQueryTelemetryEventName.NodeCount,
                    Date.now() - queryStartTime,
                    nodeCountRequestId,
                    true,
                    error
                );
                throw error;
            });

        const podCountQuery =
            this._dataProvider.getClusterPodCountChartData(
                workspaceId,
                timeInterval,
                cluster,
                '',
                '',
                '',
                podCountRequestId,
                sessionId,
                ''
            ).then((results) => {
                this.recordQueryTelemetry(
                    ChartQueryTelemetryEventName.PodCount,
                    Date.now() - queryStartTime,
                    podCountRequestId,
                    false
                );
                return results;
            }).catch((error) => {
                this.recordQueryTelemetry(
                    ChartQueryTelemetryEventName.PodCount,
                    Date.now() - queryStartTime,
                    podCountRequestId,
                    true,
                    error
                );
                throw error;
            });

        /** TODO: this should be swapped to a logged exception once MDM is rolled out and stable */
        if (cluster.clusterType !== ClusterType.AKS) {
            shouldQueryMdm = false;
        }

        const mdmQueryPromises = [];
        if (shouldQueryMdm) {
            mdmQueryPromises.push(this._dataProvider.getArmChartData(
                cluster.subscriptionId,
                cluster.resourceGroupName,
                cluster.resourceName,
                timeInterval));
        }

        return {
            kustoQueryPromises: [perfMetricQuery, nodeCountQuery, podCountQuery],
            mdmQueryPromises
        }
    }

    /**
     * Records query telemetry information
     * @param queryId query identifier
     * @param durationMs duration in milliseconds
     * @param requestId request id
     * @param isError true if request failed
     * @param error error object if any
     */
    private recordQueryTelemetry(
        queryId: string,
        durationMs: number,
        requestId: string,
        isError: boolean,
        error?: any
    ): void {
        this.preloadState.queryTelemetry[queryId] = {
            requestId: requestId,
            durationMs: durationMs,
            isError: isError,
            error: error,
            queryAvenue: this.queryAvenue.toString(),
        };

        if (isError) {
            this.preloadState.queryTelemetry[queryId].error = error;
        }
    }

    /**
     * Records session telemetry information
     * @param sessionId query identifier
     * @param durationMs duration in milliseconds
     * @param isError true if session failed
     * @param error error object if any
     */
    private recordSessionTelemetry(
        sessionId: string,
        durationMs: number,
        isError: boolean,
        error?: any
    ): void {
        this.preloadState.sessionTelemetry = {
            sessionId: sessionId,
            durationMs: durationMs,
            isError: isError,
            queryAvenue: this.queryAvenue.toString()
        };

        if (isError) {
            this.preloadState.sessionTelemetry.error = error;
        }
    }

    /**
     * Records query execution result in preload state
     * @param sessionId session id
     * @param queryStartTime preload query start time
     * @param succeded true if query succeeded
     * @param result resulting response in case of success or error if failed
     */
    private recordResult(
        sessionId: string,
        queryStartTime: number,
        succeded: boolean,
        result: any
    ): void {
        this.performanceMeasures['pre_mainContentQueryEnd'] = Date.now();

        this.preloadState.preloadCompleted = true;
        this.preloadState.preloadSucceeded = succeded;

        if (succeded) {
            this.preloadState.preloadQueryResponses = result;
        } else {
            this.preloadState.preloadError = result;
        }

        this.recordSessionTelemetry(sessionId, Date.now() - queryStartTime, !succeded, succeded ? undefined : result);
    }
}
