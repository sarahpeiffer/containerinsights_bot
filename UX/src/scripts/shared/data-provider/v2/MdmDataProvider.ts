/** 3rd party */
import { Promise } from 'es6-promise';

/** local */
import { HttpVerb } from './HttpDataProvider';
import { IArmDataProvider } from './ArmDataProvider';
import { TimeInterval } from '../TimeInterval';

/** MDM api version */
const MDM_API_VERSION = '2018-01-01';
const MDM_API_PATH = '/providers/microsoft.insights/metrics?';

/**
 * Defines query options for MDM queries
 */
export interface IMdmQueryOptions {
    /** Filters to apply to the query */
    filter?: string;

    /** Aggregation to apply to the query */
    aggregation?: string;
}

/**
 * Defines MDM data provider functionality
 */
export interface IMdmDataProvider {
    /**
     * Executes MDM query
     * @param resourceId target Azure resource id
     * @param metric Metric name
     * @param startDateTimeUtc Start time
     * @param endDateTimeUtc End time
     * @param timeoutMs query timeout in milliseconds
     * @param queryOptions Other specifications for the query
     * @returns promise of async operation with response object as a result
     */
    executeQuery(
        resourceId: string,
        metric: string,
        interval: TimeInterval,
        timeoutMs: number,
        queryOptions: IMdmQueryOptions,
    ): Promise<any>;
}

/**
 * MDM data provider executing queries through Azure Resource Manager (ARM) service
 */
export class MdmArmDataProvider implements IMdmDataProvider {
    /** underlying ARM data provider */
    private armDataProvider: IArmDataProvider;

    /**
     * Initializes instance of the class
     * @param armDataProvider underlying ARM data provider
     */
    constructor(armDataProvider: IArmDataProvider) {
        if (!armDataProvider) { throw new Error('Parameter @armDataProvider may not be null or undefined'); }
        this.armDataProvider = armDataProvider;
    }

    /**
     * Executes MDM query
     * @param resourceId target Azure resource id
     * @param metric Metric name
     * @param interval Time interval
     * @param timeoutMs query timeout in milliseconds
     * @param queryOptions query options
     * @returns promise of async operation with response object as a result
     */
    public executeQuery(
        resourceId: string,
        metric: string,
        interval: TimeInterval,
        timeoutMs: number,
        queryOptions: IMdmQueryOptions
    ): Promise<any> {
        if (!resourceId) { throw new Error('Parameter @resourceId may not be null or white space'); }
        if (timeoutMs <= 0) { throw new Error('Parameter @timeoutMs must be > 0'); }

        return this.armDataProvider.executeRequest(
            HttpVerb.Post,
            this.getRequestPath(resourceId, metric, interval, queryOptions),
            timeoutMs
        );
    }

    /**
     * Constructs the request path
     * @param resId The resource ID being queried
     * @param metric Metric name
     * @param interval Time interval
     * @param queryOptions Specifics of the query such as timespan etc
     * @returns query string for the MDM request
     */
    private getRequestPath(
        resId: string,
        metric: string,
        interval: TimeInterval,
        queryOptions: IMdmQueryOptions
    ): string {
        let queryString: string = resId
            + MDM_API_PATH
            + this.getTimeSpan(interval)
            + '&metricnames='
            + metric;

        if (queryOptions.filter) { // Apply filter if specified
            queryString = queryString
                + '&$filter='
                + queryOptions.filter;
        }

        queryString = queryString
            + '&interval='
            + interval.getISOInterval();

        if (queryOptions.aggregation) { // Apply aggregation if specified
            queryString = queryString
                + '&aggregation='
                + queryOptions.aggregation;
        }

        queryString = queryString
            + '&api-version='
            + MDM_API_VERSION;

        return queryString;
    }

    /**
     * Gets the timespan string for the query
     * @param interval TimeInterval
     * @returns string representing the timespan
     */
    private getTimeSpan(interval: TimeInterval): string {
        return 'timespan='
            + interval.getRealStart().toISOString()
            + '/'
            + interval.getRealEnd().toISOString();
    }
}
