/**
 * tpl
 */
import { Promise } from 'es6-promise';
import { GUID } from '@appinsights/aichartcore';

/**
 * local
 */
import { Placeholder } from './QueryTemplates/CommonQueryTemplate';
import { MonitoredClustersQueryTemplate } from './QueryTemplates/MonitoredClustersQueryTemplate';
import { IRequestInfo } from './IRequestInfo';

/**
 * shared
 */
import { IKustoBatchDataProvider, IKustoQueryOptions, IKustoQuery } from '../../shared/data-provider/v2/KustoDataProvider';
import { StringHelpers } from '../../shared/Utilities/StringHelpers';
import { DefaultDraftRequestTimeoutMs, DefaultRelativeTimeSpan } from '../../shared/GlobalConstants';
import { ITimeInterval } from '../../shared/data-provider/TimeInterval';


/**
 *  Implemention of the MultiCluster Data provider
 */
export class MultiClusterDataProvider {
    private draftDataProvider: IKustoBatchDataProvider;

    /**
     * .ctor
     * @param draftDataProvider - underlying Kusto Batch API data provider
     */
    constructor(draftDataProvider: IKustoBatchDataProvider) {
        this.draftDataProvider = draftDataProvider;
    }

    /**
     *  returns monitored clusters stats from backend via Draft API Provider
     * @param requestsInfo - info about the requests in draft query
     * @param timespan - timespan of the request
     * @param sessionId - sessionId for the Draft Batch request
     * @param isInitialLoad - flag indicates whether the initial load or not
     */
    public getMonitoredClustersStats(
        requestsInfo: IRequestInfo[],
        timeInterval: ITimeInterval,
        sessionId: string,
        isInitialLoad: boolean,
    ): Promise<any> {
        if (!requestsInfo || !timeInterval || !sessionId) {
            return new Promise((resolve, reject) => reject(new Error('Missing query parameters')));
        }

        let queryTemplate = MonitoredClustersQueryTemplate.MonitoredClustersStats;
        let queries: IKustoQuery[] = [];
        const requestInfo = `exp=containerinsights,blade=multicontainer,query=MonitoredClustersStats,initial=${isInitialLoad}`;

        let queryOptions: IKustoQueryOptions = {
            requestInfo: requestInfo,
            sessionId: sessionId,
            preferences: 'exclude-functions,exclude-customfields,exclude-customlogs',
        };

        if (isInitialLoad) {
            queryOptions.relativeTimeSpan = DefaultRelativeTimeSpan;
        } else {
            queryOptions.timeInterval = timeInterval;
        }
        //each indiviual Batch request will have its associated requestId
        queryOptions.requestId = GUID().toLowerCase();

        for (let index = 0; index < requestsInfo.length; index++) {
            const clusterResourceIds: string[] = requestsInfo[index].clusterResourceIds;
            const querySring = this.replaceQueryFilterPlaceholders(
                queryTemplate,
                clusterResourceIds);

            const query: IKustoQuery = {
                queryId: requestsInfo[index].requestId.toString(),
                workspaceResourceId: requestsInfo[index].workspaceId,
                queryStatement: querySring,
                timeoutMs: DefaultDraftRequestTimeoutMs,
                options: queryOptions
            };

            queries.push(query);
        }

        return this.draftDataProvider.executeBatch(queries, DefaultDraftRequestTimeoutMs);
    }

    /**
     * Replaces parameter placeholders in the query template
     * @param queryTemplate - query template
     * @param clusterIds - list of  cluster Ids
     * @returns query ready for execution
     */
    private replaceQueryFilterPlaceholders(
        queryTemplate: string,
        clustersIds: string[],

    ): string {

        if (!queryTemplate) { return null; };

        if (!clustersIds || clustersIds.length <= 0) { return null; }

        let clusterFilterString = `| where ClusterId in~ ('${clustersIds[0]}'`;
        for (let index = 1; index < clustersIds.length; index++) {
            clusterFilterString = clusterFilterString + `, '${clustersIds[index]}'`;
        }
        clusterFilterString = clusterFilterString + ')'

        let query = StringHelpers.replaceAll(queryTemplate, Placeholder.MonitoredClustersFilter, clusterFilterString);

        return query;
    }

}
