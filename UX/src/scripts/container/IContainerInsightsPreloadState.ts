import { ITimeInterval } from '../shared/data-provider/TimeInterval';

/**
 * Telemetry for query run at preloading time
 */
export interface IPreloadQueryTelemetry {
    /** request id */
    requestId: string,

    /** query duration */
    durationMs: number,

    /** whether query failed */
    isError: boolean,

    /** error in query */
    error?: any,

    /** query avenue: Arm/Draft */
    queryAvenue: string
}

/**
 * Telemetry for session run at preloading time
 */
export interface IPreloadSessionTelemetry {
    /** session id */
    sessionId: string,

    /** query duration */
    durationMs: number,

    /** whether query failed */
    isError: boolean,

    /** error in query */
    error?: any,

    /** query avenue: Arm/Draft */
    queryAvenue: string
}

/**
 * State of the preload operation
 */
export interface IContainerInsightsPreloadState {
    /** initialization event received by preload manager */
    initializationEvent?: CustomEvent;

    /** true if preload query was executed */
    preloadPossible?: boolean;

    /** true if preload was completed */
    preloadCompleted?: boolean;

    /** true if preload executed successfully */
    preloadSucceeded?: boolean;

    /** preload error */
    preloadError?: any;

    /** mdm exceptions if any */
    mdmExceptions?: string[];

    /** preload query responses */
    preloadQueryResponses?: any;

    /** workspace resource id */
    workspaceResourceId?: string;

    /** cluster name */
    clusterName?: string;

    /** query time interval */
    timeInterval?: ITimeInterval;

    /** query avenue: Arm vs. Draft */
    queryAvenue?: string;

    /** charts query session telemetry */
    sessionTelemetry?: IPreloadSessionTelemetry;

    /** dictionary of query telemetry organized by query id */
    queryTelemetry?: StringMap<IPreloadQueryTelemetry>;

    /** boolean indicating if the data was loaded through mdm */
    isLoadedFromMdm?: boolean;

    /** boolean indicated if mdm did eventually load but was slower then kusto */
    isMdmSlower?: boolean;
}
