// This file contains data sent from queries performed in the blade

// A telemetry entry ready for a logEvent call
export interface ITelemetryEntry {
    name: string;
    telemetryObject: any;
}

// The result of a query. Either result or error will not be null
export interface IQueryResult {
    result?: any;
    error?: string;
    telemetry: ITelemetryEntry;
}

// The result of all queries for SingleVMPerf
export interface ISinglePerfQueryResults {
    diskTableQueryResult: IQueryResult;
    diskChartQueryResult: IQueryResult;
    joinedChartQueryResult: IQueryResult;
    finalTelemetry: ITelemetryEntry;
}
