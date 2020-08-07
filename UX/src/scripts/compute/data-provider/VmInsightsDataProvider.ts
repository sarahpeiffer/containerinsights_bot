import { ComputeMetricName } from '../ComputeMetrics';

import { QueryTemplate, Placeholder } from './QueryTemplate';

/**shared */
import { IWorkspaceInfo } from '../../shared/IWorkspaceInfo';
import { IKustoDataProvider, IKustoQueryOptions, DraftQueryResponse, IDraftResponseTable } from '../../shared/data-provider/KustoDataProvider';
import { ITimeInterval } from '../../shared/data-provider/TimeInterval';
import { StringHelpers } from '../../shared/Utilities/StringHelpers';
import { ComputerGroup, IResolvedComputerGroup } from '../../shared/ComputerGroup';

/* required for ie11... this will enable most of the Object.assign functionality on that browser */
import { polyfillObjectAssign } from '../../shared/ObjectAssignShim';
polyfillObjectAssign();

import { Promise } from 'es6-promise';
import { ConnectionType } from '../shared/property-panel/entity-properties/ConnectionPropertiesPanel';
import { IPropertiesPanelQueryParams } from '../shared/property-panel/data-models/PropertiesPanelQueryParams';

const MAX_RESULT_COUNT: number = 500;

export enum SortColumn {
    Average,
    P5th,
    P10th,
    P50th,
    P90th,
    P95th,
    Min,
    Max,
}

export enum SortDirection {
    Asc,
    Desc
}

export interface IGetComputeResourcesSummary {
    workspaces: IWorkspaceInfo[];
    computerGroup?: IResolvedComputerGroup;
    kustoQueryOptions: IKustoQueryOptions;
}

export class VmInsightsDataProvider {
    private kustoDataProvider: IKustoDataProvider;

    constructor(kustoDataProvider: IKustoDataProvider) {
        this.kustoDataProvider = kustoDataProvider;
    }

    public static fillInTimeParameters(
        queryTemplate: string,
        timeInterval: ITimeInterval
    ): string {
        // bbax: dont ask Kusto for the future... Vitaly said this is a bad idea
        // since some things can happen in the future
        let targetEndDate = timeInterval.getBestGranularEndDate(true);

        return queryTemplate
            .replace(Placeholder.StartDateTime, timeInterval.getBestGranularStartDate().toISOString())
            .replace(Placeholder.EndDateTime, targetEndDate.toISOString())
            .replace(Placeholder.Granularity, timeInterval.getGrainKusto());
    }

    private static getResourceFilter(computerName: string, resourceId: string): string {
        // prefer resourceId where available, fallback to computerName, if necessary
        return StringHelpers.isNullOrEmpty(resourceId)
            ? '| where Computer == \'' + computerName + '\''
            : '| where _ResourceId =~ \'' + resourceId + '\''
    }

    public getVirtualMachineList(
        workspace: IWorkspaceInfo,
        computerGroup: ComputerGroup,
        timeInterval: ITimeInterval,
        metricName: string,
        orderBy: SortColumn,
        sortDirection: SortDirection,
        kustoQueryOptions: IKustoQueryOptions,
        maxResultCount?: number,
        resourceId?: string,
        resourceType?: string,
        gridDataContainsFilter?: string,
        queryInsightsMetrics: boolean = false
    ): Promise<DraftQueryResponse> {
        let queryTemplate = this.getQueryTemplate(metricName, queryInsightsMetrics);
        let query = this.replaceParamPlaceholders(
            queryTemplate,
            timeInterval,
            orderBy,
            sortDirection,
            maxResultCount,
            gridDataContainsFilter,
            queryInsightsMetrics);

        const resolveComputerGroup = computerGroup ? computerGroup.resolve() : Promise.resolve(undefined);
        return resolveComputerGroup.then((resolvedComputerGroup: IResolvedComputerGroup) => {
            return this.fetchAzMonData(query, workspace, resourceId, resourceType, resolvedComputerGroup, kustoQueryOptions);
        });
    }

    public getAggregateMetricData(
        workspace: IWorkspaceInfo,
        computerGroup: ComputerGroup,
        timeInterval: ITimeInterval,
        kustoQueryOptions: IKustoQueryOptions,
        resourceId?: string,
        resourceType?: string,
        queryInsightsMetrics: boolean = false
    ): Promise<DraftQueryResponse> {
        let queryTemplate = (queryInsightsMetrics)
            ? QueryTemplate.AtScaleAggregateChartUsingInsightsMetrics
            : QueryTemplate.Chart;
        let query = VmInsightsDataProvider.fillInTimeParameters(
            queryTemplate,
            timeInterval);

        const resolveComputerGroup = computerGroup ? computerGroup.resolve() : Promise.resolve(undefined);
        return resolveComputerGroup.then((resolvedComputerGroup: IResolvedComputerGroup) => {
            return this.fetchAzMonData(query, workspace, resourceId, resourceType, resolvedComputerGroup, kustoQueryOptions);
        });
    }

    public getTopNChartMetricData(
        workspace: IWorkspaceInfo,
        computerGroup: IResolvedComputerGroup,
        timeInterval: ITimeInterval,
        queryTemplate: string,
        kustoQueryOptions: IKustoQueryOptions,
        resourceId?: string,
        resourceType?: string,
        aggregationType?: string,
        queryInsightsMetrics: boolean = false
    ): Promise<DraftQueryResponse> {
        let query = VmInsightsDataProvider.fillInTimeParameters(
            queryTemplate,
            timeInterval);

        query = this.replaceNodeIdentityPlaceholders(query);

        // Generate Aggregation clause
        // example percentile(Val, 95), min(Val)...
        let aggregationClause: string = '';
        const performanceCounterName: string = (queryInsightsMetrics)
            ? QueryTemplate.InsightsMetricsCounterName
            : QueryTemplate.PerfCounterName;

        switch (aggregationType) {
            case 'Avg':
                aggregationClause = QueryTemplate.TopNAverageFilterClause;
                break;
            case 'Max':
                aggregationClause = QueryTemplate.TopNMaxFilerClause;
                break;
            case 'Min':
                aggregationClause = QueryTemplate.TopNMinFilterClause;
                break;
            case 'P05':
            case 'P10':
            case 'P50':
            case 'P90':
            case 'P95':
                aggregationClause = StringHelpers.replaceAll(
                    QueryTemplate.TopNPercentileFilterClause, Placeholder.TopNChartPercentileFilter, aggregationType.substring(1));
                break;
            default:
                // Default to 95th percentile
                aggregationClause = StringHelpers.replaceAll(
                    QueryTemplate.TopNPercentileFilterClause, Placeholder.TopNChartPercentileFilter, '95');
                break;
        }
        //Attach counter name
        aggregationClause = StringHelpers.replaceAll(aggregationClause, Placeholder.PerformanceCounterName, performanceCounterName);

        // Attach aggregation clause to query
        query = StringHelpers.replaceAll(query, Placeholder.TopNSeriesSelectorFilter, aggregationClause);

        return this.fetchAzMonData(query, workspace, resourceId, resourceType, computerGroup, kustoQueryOptions);
    }

    public getSingleVMMetricData(
        workspace: IWorkspaceInfo,
        computerName: string,
        resourceId: string,
        timeInterval: ITimeInterval,
        queryOptions: IKustoQueryOptions,
        queryInsightsMetrics: boolean = false
    ): Promise<DraftQueryResponse> {
        const queryTemplate: string = (queryInsightsMetrics)
            ? QueryTemplate.SingleVMChartUsingInsightsMetrics
            : QueryTemplate.SingleVMChart;

        let query = StringHelpers.replaceAll(
            VmInsightsDataProvider.fillInTimeParameters(queryTemplate, timeInterval),
            Placeholder.ResourceFilter, VmInsightsDataProvider.getResourceFilter(computerName, resourceId));

        return Promise.resolve(query)
            .then((query) => {
                return this.kustoDataProvider.executeDraftQuery({ resourceId, workspace, query, queryOptions });
            });
    }

    public getSingleVMDiskUsageChartData(
        workspace: IWorkspaceInfo,
        computerName: string,
        resourceId: string,
        timeInterval: ITimeInterval,
        queryOptions: IKustoQueryOptions,
        queryInsightsMetrics: boolean = false
    ): Promise<DraftQueryResponse> {
        const queryTemplate: string = (queryInsightsMetrics)
            ? QueryTemplate.SingleVMDiskUsageChartUsingInsightsMetrics
            : QueryTemplate.SingleVMDiskUsageChart;

        let query = StringHelpers.replaceAll(
            VmInsightsDataProvider.fillInTimeParameters(queryTemplate, timeInterval),
            Placeholder.ResourceFilter, VmInsightsDataProvider.getResourceFilter(computerName, resourceId));

        return Promise.resolve(query)
            .then((query) => {
                return this.kustoDataProvider.executeDraftQuery({ resourceId, workspace, query, queryOptions });
            });
    }

    /**
     * Gets the results of a query for disk performance for a given VM
     * @param  {string} computerName computer (VM) name
     * @param  {string} resourceId Azure resource id
     * @param  {string} workspaceId computer's workspace
     * @param  {ITimeInterval} timeInterval time to query
     * @return Promise<any> 
     * @memberof VmInsightsDataProvider
     */
    public getSingleVMDiskPerfData(
        computerName: string,
        resourceId: string,
        workspace: IWorkspaceInfo,
        timeInterval: ITimeInterval,
        queryOptions: IKustoQueryOptions,
        queryInsightsMetrics: boolean = false
    ): Promise<DraftQueryResponse> {
        const queryTemplate: string = (queryInsightsMetrics)
            ? QueryTemplate.SingleVMDiskMetricsUsingInsightsMetrics
            : QueryTemplate.SingleVMDiskMetrics;

        let query = StringHelpers.replaceAll(
            VmInsightsDataProvider.fillInTimeParameters(queryTemplate, timeInterval),
            Placeholder.ResourceFilter, VmInsightsDataProvider.getResourceFilter(computerName, resourceId));

        return Promise.resolve(query)
            .then((query) => {
                return this.kustoDataProvider.executeDraftQuery({ resourceId, workspace, query, queryOptions });
            });
    }

    public getLaAlertsList(alertsQueryParams: IPropertiesPanelQueryParams): Promise<DraftQueryResponse> {
        if (!alertsQueryParams || !alertsQueryParams.kustoQueryOptions) {
            return Promise.resolve(undefined);
        }
        if (alertsQueryParams.computerGroup) {
            return this.getAlertsQueryClauseForComputerGroup(alertsQueryParams.computerGroup,
                alertsQueryParams.kustoQueryOptions).then((alertsQueryClause) => {
                    let alertsListQuery = StringHelpers.replaceAll(QueryTemplate.laAlertListQuery,
                        Placeholder.AlertsDefinition,
                        alertsQueryClause);
                    return this.kustoDataProvider.executeDraftQuery({
                        resourceId: alertsQueryParams.resourceId,
                        workspace: alertsQueryParams.workspace,
                        query: alertsListQuery,
                        queryOptions: alertsQueryParams.kustoQueryOptions
                    });
                });
        } else {
            let alertsQueryClause: string = this.getAlertsQueryClauseForAzureResource(
                alertsQueryParams.resourceId,
                alertsQueryParams.computerName,
                alertsQueryParams.kustoQueryOptions);
            let alertsListQuery = StringHelpers.replaceAll(QueryTemplate.laAlertListQuery,
                Placeholder.AlertsDefinition,
                alertsQueryClause);
            return this.kustoDataProvider.executeDraftQuery({
                resourceId: alertsQueryParams.resourceId,
                workspace: alertsQueryParams.workspace,
                query: alertsListQuery,
                queryOptions: alertsQueryParams.kustoQueryOptions
            });
        }
    }

    public getLaAlertsSummary(alertsQueryParams: IPropertiesPanelQueryParams): Promise<DraftQueryResponse> {
        if (!alertsQueryParams || !alertsQueryParams.kustoQueryOptions) {
            return Promise.resolve(undefined);
        }
        if (alertsQueryParams.computerGroup) {

            return this.getAlertsQueryClauseForComputerGroup(
                alertsQueryParams.computerGroup,
                alertsQueryParams.kustoQueryOptions).then((alertsQueryClause) => {
                    let summaryQuery: string = StringHelpers.replaceAll(QueryTemplate.laAlertSummaryQuery,
                        Placeholder.AlertsDefinition, alertsQueryClause);
                    return this.kustoDataProvider.executeDraftQuery({
                        resourceId: alertsQueryParams.resourceId,
                        workspace: alertsQueryParams.workspace,
                        query: summaryQuery,
                        queryOptions: alertsQueryParams.kustoQueryOptions
                    });
                });

        } else {
            let alertsQueryClause: string = this.getAlertsQueryClauseForAzureResource(
                alertsQueryParams.resourceId,
                alertsQueryParams.computerName,
                alertsQueryParams.kustoQueryOptions);
            let summaryQuery: string = StringHelpers.replaceAll(QueryTemplate.laAlertSummaryQuery,
                Placeholder.AlertsDefinition,
                alertsQueryClause);
            return this.kustoDataProvider.executeDraftQuery({
                resourceId: alertsQueryParams.resourceId,
                workspace: alertsQueryParams.workspace,
                query: summaryQuery,
                queryOptions: alertsQueryParams.kustoQueryOptions
            });
        }
    }

    public getConnectionSummary(connectionQueryParams: IPropertiesPanelQueryParams): Promise<DraftQueryResponse> {
        if (!connectionQueryParams || !connectionQueryParams.kustoQueryOptions) {
            return Promise.resolve(undefined);
        }

        let connectionQuery: string = this.getConnectionQuery(
            connectionQueryParams.agentId,
            connectionQueryParams.kustoQueryOptions);
        return this.kustoDataProvider.executeDraftQuery({
            resourceId: connectionQueryParams.resourceId,
            workspace: connectionQueryParams.workspace,
            query: connectionQuery,
            queryOptions: connectionQueryParams.kustoQueryOptions
        });

    }

    public getConnectionSummaryRowQueryTemplate(connectionQuery: IPropertiesPanelQueryParams, connectionType?: ConnectionType) {
        let query: string;
        switch (connectionType) {
            case ConnectionType.LinkFailed:
                query = StringHelpers.replaceAll(StringHelpers.replaceAll(QueryTemplate.ConnectionSummaryRowFailed,
                    Placeholder.ConnectionFilter, QueryTemplate.ConnectionFilterClause), Placeholder.AgentId, connectionQuery.agentId);
                break;
            case ConnectionType.LinkLive:
                query = VmInsightsDataProvider.fillInTimeParameters(QueryTemplate.ConnectionSummaryRowLive,
                    connectionQuery?.kustoQueryOptions?.timeInterval);
                query = StringHelpers.replaceAll(StringHelpers.replaceAll(query,
                    Placeholder.ConnectionFilter, QueryTemplate.ConnectionFilterClause), Placeholder.AgentId, connectionQuery.agentId);
                break;
            case ConnectionType.LinkMalicious:
                query = StringHelpers.replaceAll(StringHelpers.replaceAll(QueryTemplate.ConnectionSummaryRowMalicious,
                    Placeholder.ConnectionFilter, QueryTemplate.ConnectionFilterClause), Placeholder.AgentId, connectionQuery.agentId);
                break;
            case ConnectionType.LinkEstablished:
                query = StringHelpers.replaceAll(StringHelpers.replaceAll(QueryTemplate.ConnectionSummaryRowEstablished,
                    Placeholder.ConnectionFilter, QueryTemplate.ConnectionFilterClause), Placeholder.AgentId, connectionQuery.agentId);
                break;
            case ConnectionType.LinkTerminated:
                query = StringHelpers.replaceAll(StringHelpers.replaceAll(QueryTemplate.ConnectionSummaryRowTerminated,
                    Placeholder.ConnectionFilter, QueryTemplate.ConnectionFilterClause), Placeholder.AgentId, connectionQuery.agentId);
                break;
            default:
                query = StringHelpers.replaceAll(StringHelpers.replaceAll(QueryTemplate.ConnectionSummaryViewAll,
                    Placeholder.ConnectionFilter, QueryTemplate.ConnectionFilterClause), Placeholder.AgentId, connectionQuery.agentId);
        }
        return query;
    }

    /**
     * Get list of monitored and unmonitored virtual machines and virtual machine scale sets. Unmonitored in this
     * case is defined as machines with Perf MP but don't have (dependency) agent installed.
     *
     * @param {IGetComputeResourcesSummary} params
     * @returns
     * @memberof VmInsightsDataProvider
     */
    public GetComputeResourcesSummary(params: IGetComputeResourcesSummary) {
        const queryTemplate: string = QueryTemplate.ComputeResourcesSummary;
        let query: string = VmInsightsDataProvider.fillInTimeParameters(queryTemplate, params.kustoQueryOptions.timeInterval);
        query = this.replaceGroupFilterPlaceholder(query, params.computerGroup);
        return this.kustoDataProvider.executeMultiWorkspaceQuery(params.workspaces, query);
    }

    /**
     * Sums up all the connection details for a given workspace.
     *
     * @param {IWorkspaceInfo} workspace
     * @param {IKustoQueryOptions} kustoQueryOptions
     * @returns
     * @memberof VmInsightsDataProvider
     */
    public GetConnectionSummary(params: IGetComputeResourcesSummary) {
        const queryTemplate: string = QueryTemplate.ConnectionSummary;
        let query: string = VmInsightsDataProvider.fillInTimeParameters(queryTemplate, params.kustoQueryOptions.timeInterval);
        query = this.replaceGroupFilterPlaceholder(query, params.computerGroup);
        return this.kustoDataProvider.executeMultiWorkspaceQuery(params.workspaces, query);
    }


    /**
     * To check if the chart data retrieved from the API is empty
     * Mainly used for Telemetry purpose
     *
     * @param {DraftQueryResponse[]} responses
     * @returns {boolean}
     * @memberof VmInsightsDataProvider
     */
    public isEmptyCharts(responses: DraftQueryResponse[]): boolean {
        let isChartsEmpty: boolean = false;
        if (!responses || responses.length === 0) {
            return true;
        }
        responses.forEach(response => {
            const tables: IDraftResponseTable[] = response?.Tables;

            if (tables && tables.length > 0) {
                if (tables?.[0]?.Rows.length === 0) {
                    isChartsEmpty = true;
                }
            }
        });
        return isChartsEmpty;
    }

    private getQueryTemplate(metricName: string, queryInsightsMetrics: boolean = false): string {
        if (queryInsightsMetrics) {
            return this.getInsightsMetricsQueryTemplate(metricName);
        }
        return this.getPerfQueryTemplate(metricName);
    }

    private getPerfQueryTemplate(metricName: string): string {
        switch (metricName) {
            case ComputeMetricName.CpuUtilization:
                return QueryTemplate.TopByCpu;
            case ComputeMetricName.AvailableMemoryMBytes:
                return QueryTemplate.TopByMemory;
            case ComputeMetricName.DiskSpaceUsedPercentage:
                return QueryTemplate.TopByDiskSpace;
            case ComputeMetricName.NetworkReceivedPerSec:
                return QueryTemplate.TopByNetworkReceived;
            case ComputeMetricName.NetworkSentPerSec:
                return QueryTemplate.TopByNetworkSend;
            default:
                // note: no localization required for internal error messages
                throw new Error('Not supported perf metric \'' + metricName + '\'');
        }
    }

    private getInsightsMetricsQueryTemplate(metricName: string): string {
        switch (metricName) {
            case ComputeMetricName.CpuUtilization:
                return QueryTemplate.TopByCpuUsingInsightsMetrics;
            case ComputeMetricName.AvailableMemoryMBytes:
                return QueryTemplate.TopByMemoryUsingInsightsMetrics;
            case ComputeMetricName.DiskSpaceUsedPercentage:
                return QueryTemplate.TopByDiskSpaceUsingInsightsMetrics;
            case ComputeMetricName.NetworkReceivedPerSec:
                return QueryTemplate.TopByNetworkReceivedUsingInsightsMetrics;
            case ComputeMetricName.NetworkSentPerSec:
                return QueryTemplate.TopByNetworkSendUsingInsightsMetrics;
            default:
                // note: no localization required for internal error messages
                throw new Error('Not supported insights metric \'' + metricName + '\'');
        }
    }

    /**
     * Replace GroupFilter string with resourceId startwith filter.
     * @param query 
     * @param resourceId 
     */
    private addResourceFilter(query: string, resourceId: string, resourceType?: string): string {
        let filter: string = '| where _ResourceId startswith \'' + resourceId + '\' ';

        if (!StringHelpers.isNullOrEmpty(resourceType)
            && resourceId?.toLowerCase().indexOf(resourceType?.toLowerCase()) === -1) {
            // If the resourceType is not null or empty and if the resourceId does not have resourceType
            // then, add another clause to the filter
            filter = filter + ' and _ResourceId has \'' + resourceType + '\'';
        }

        return StringHelpers.replaceAll(
            StringHelpers.replaceAll(query, Placeholder.GroupFilter, filter),
            Placeholder.GroupDefinition, '');
    }

    private fetchAzMonData(query: string,
        workspace: IWorkspaceInfo,
        resourceId: string,
        resourceType: string,
        computerGroup: IResolvedComputerGroup,
        queryOptions: IKustoQueryOptions): Promise<DraftQueryResponse> {
        if (computerGroup) {
            query = this.replaceGroupFilterPlaceholder(query, computerGroup);
        }
        if (resourceId) {
            query = this.addResourceFilter(query, resourceId, resourceType);
        }
        return this.kustoDataProvider.executeDraftQuery({ resourceId, workspace, query, queryOptions });
    }

    /**
     * 
     * @param queryTemplate 
     * @param usingLaResourceId TODO: refer task 4563861 can be removed after all la resource id same with azure resource id
     */
    private replaceNodeIdentityPlaceholders(
        queryTemplate: string
    ): string {
        return queryTemplate
            .replace(Placeholder.NodeIdentityAndPropsSubquery, QueryTemplate.NodeIdentityAndProps)
            .replace(Placeholder.extendedLaResourceId, QueryTemplate.extendedLaResourceId)
            .replace(Placeholder.laResourceIdFilter, QueryTemplate.laResourceIdFilter);
    }

    private getAlertsQueryClauseForAzureResource(resourceId: string,
        computerName: string,
        kustoQueryOptions: IKustoQueryOptions): string {
        let query: string = VmInsightsDataProvider.fillInTimeParameters(QueryTemplate.laAlertsOfAzureResourceClause,
            kustoQueryOptions.timeInterval);

        const computerNameFilter: string = StringHelpers.isNullOrEmpty(computerName) ? ''
            : StringHelpers.replaceAll(QueryTemplate.laAlertsComputerNameFilter, Placeholder.ComputerName, computerName);

        const resourceIdFilter: string = StringHelpers.isNullOrEmpty(resourceId) ? ''
            : StringHelpers.replaceAll(QueryTemplate.laAlertsResourceIdFilter,
                Placeholder.AzureResourceId, resourceId)

        let alertsFilterByResource: string = '';
        if (!StringHelpers.isNullOrEmpty(resourceIdFilter) && !StringHelpers.isNullOrEmpty(computerNameFilter)) {
            alertsFilterByResource = `| where ${resourceIdFilter} or ${computerNameFilter}`;
        } else if (!StringHelpers.isNullOrEmpty(resourceIdFilter)) {
            alertsFilterByResource = `| where ${resourceIdFilter}`;
        } else if (!StringHelpers.isNullOrEmpty(computerNameFilter)) {
            alertsFilterByResource = `| where ${computerNameFilter}`
        }
        query = StringHelpers.replaceAll(query, Placeholder.AlertsFilterByResource, alertsFilterByResource);

        return query;
    }

    private getAlertsQueryClauseForComputerGroup(computerGroup: ComputerGroup,
        kustoQueryOptions: IKustoQueryOptions): Promise<string> {
        // TODO: If the group is a subcription or ResourceGroup or VMSS
        // then call getLaAlertsOfAzureResource instead of resolving the group.
        // Today serviceMap API is not returning the azure resource Id of the group.
        // Once we fix the issue in ServiceMap API then enhance the logic here.
        let query: string = VmInsightsDataProvider.fillInTimeParameters(QueryTemplate.laAlertsOfComputerGroupClause,
            kustoQueryOptions.timeInterval);
        return computerGroup.resolve().then((resolvedComputerGroup) => {
            return this.replaceGroupFilterPlaceholder(query, resolvedComputerGroup);
        });
    }

    private getConnectionQuery(agentId: string,
        kustoQueryOptions: IKustoQueryOptions): string {
        let query: string = VmInsightsDataProvider.fillInTimeParameters(QueryTemplate.ConnectionSummaryGrid,
            kustoQueryOptions.timeInterval);

        query = StringHelpers.replaceAll(StringHelpers.replaceAll(query, Placeholder.ConnectionFilter,
            QueryTemplate.ConnectionFilterClause), Placeholder.AgentId, agentId);

        return query;
    }

    private replaceParamPlaceholders(
        queryTemplate: string,
        timeInterval: ITimeInterval,
        orderBy: SortColumn,
        sortDirection: SortDirection,
        maxResultCount?: number,
        gridDataContainsFilter?: string,
        queryInsightsMetrics: boolean = false
    ): string {
        const queryWithTimeValue = VmInsightsDataProvider.fillInTimeParameters(
            queryTemplate, timeInterval);

        const effectiveMaxResultCount = (maxResultCount == null)
            ? MAX_RESULT_COUNT
            : maxResultCount;

        const performanceCounterName: string = (queryInsightsMetrics)
            ? QueryTemplate.InsightsMetricsCounterName
            : QueryTemplate.PerfCounterName;
        let percentileTrendExpression: string =
            QueryTemplate.TopNPercentileFilterClause.replace(Placeholder.PerformanceCounterName, performanceCounterName);
        let trendExpression: string = '';

        switch (orderBy) {
            case SortColumn.P5th:
                trendExpression = percentileTrendExpression.replace(Placeholder.TopNChartPercentileFilter, '5');
                break;
            case SortColumn.P10th:
                trendExpression = percentileTrendExpression.replace(Placeholder.TopNChartPercentileFilter, '10');
                break;
            case SortColumn.P50th:
                trendExpression = percentileTrendExpression.replace(Placeholder.TopNChartPercentileFilter, '50');
                break;
            case SortColumn.P90th:
                trendExpression = percentileTrendExpression.replace(Placeholder.TopNChartPercentileFilter, '90');
                break;
            case SortColumn.P95th:
                trendExpression = percentileTrendExpression.replace(Placeholder.TopNChartPercentileFilter, '95');
                break;
            case SortColumn.Average:
                trendExpression =
                    QueryTemplate.TopNAverageFilterClause.replace(Placeholder.PerformanceCounterName, performanceCounterName);
        }

        let query = queryWithTimeValue
            .replace(Placeholder.MaxResultCount, effectiveMaxResultCount.toString())
            .replace(Placeholder.OrderBy, SortColumn[orderBy])
            .replace(Placeholder.SortDirection, SortDirection[sortDirection].toLowerCase())
            .replace(Placeholder.TrendExpression, trendExpression);
        query = StringHelpers.replaceAll(StringHelpers.replaceAll(query, Placeholder.GridDataContainsFilter, !gridDataContainsFilter ?
            '' : QueryTemplate.FilterByComputerNameClause), Placeholder.ComputerNameFilter, gridDataContainsFilter);

        // Finally replace Node Identity
        return this.replaceNodeIdentityPlaceholders(query);
    }

    private replaceGroupFilterPlaceholder(query: string, group: IResolvedComputerGroup): string {
        let filterStatement: string = '';
        let groupDefinition: string = '';

        if (!group) {
            return StringHelpers.replaceAll(
                StringHelpers.replaceAll(query, Placeholder.GroupFilter, filterStatement),
                Placeholder.GroupDefinition, groupDefinition);
        }

        // construct a filter to only target the group members
        if (!StringHelpers.isNullOrEmpty(group.omsFunctionName)) {
            groupDefinition = StringHelpers.replaceAll(
                QueryTemplate.OmsComputerGroupClause,
                Placeholder.GroupFunctionName, group.omsFunctionName);
            filterStatement = QueryTemplate.ComputerGroupFilterStatement;
        } else if (group.members) {
            let members = [];
            // Note: some groups will include computer name for each of their members (dynamic),
            // while others (static) may or may not. If every member has ComputerName, we will use
            // it to optimize the queries. Otherwise, we'll fall back to using the ServiceMap arm resource
            // name, which will require us to query ServiceMapComputer_CL.
            const useComputerName = this.groupMembersHaveComputerName(group);
            for (let i = 0; i < group.members.length; ++i) {
                let member = group.members[i];
                let value = useComputerName ? member.computerName : member.name;
                if (!StringHelpers.isNullOrEmpty(value)) {
                    members.push(`'${value}'`)
                }
            }
            if (members.length > 0) {
                groupDefinition = StringHelpers.replaceAll(
                    useComputerName ? QueryTemplate.ServiceMapComputerGroupWithComputerNameClause :
                        QueryTemplate.ServiceMapComputerGroupClause,
                    Placeholder.GroupMembers, members.join(','));
                filterStatement = QueryTemplate.ComputerGroupFilterStatement;
            } else {
                filterStatement = QueryTemplate.EmptyComputerGroupFilterStatement;
            }
        } else if (!StringHelpers.isNullOrEmpty(group.resourceId)) {
            return this.addResourceFilter(query, group.resourceId);
        }

        return StringHelpers.replaceAll(
            StringHelpers.replaceAll(query, Placeholder.GroupFilter, filterStatement),
            Placeholder.GroupDefinition, groupDefinition);
    }

    private groupMembersHaveComputerName(group: IResolvedComputerGroup): boolean {
        if (!group || !group.members || !group.members.length) {
            return false;
        }

        for (let i = 0; i < group.members.length; ++i) {
            if (StringHelpers.isNullOrEmpty(group.members[i].computerName)) {
                return false;
            }
        }

        return true;
    }
}
