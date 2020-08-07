/**
 * tpl
 */
import { Promise } from 'es6-promise'

/**
 * shared
 */
import { IKustoDataProvider, IKustoQueryOptions } from '../../shared/data-provider/KustoDataProvider';
import { IWorkspaceInfo } from '../../shared/IWorkspaceInfo';
import { ITimeInterval } from '../../shared/data-provider/TimeInterval';
import { StringHelpers } from '../../shared/Utilities/StringHelpers';
import { AggregationOption } from '../../shared/AggregationOption';
import { Prefer } from '../../shared/data-provider/v2/KustoDataProvider';
import { BladeLoadManager } from '../messaging/BladeLoadManager';

/**
 * local
 */
import { ContainerMetricName, ContainerHostMetricName } from '../shared/ContainerMetricsStrings';
import { Placeholder, PlaceholderSubstitute } from './QueryTemplates/CommonQueryTemplate';
import { ContainerQueryTemplate } from './QueryTemplates/ContainerQueryTemplate';
import { NodeQueryTemplate } from './QueryTemplates/NodeQueryTemplate';
import { BladeContext } from '../BladeContext';
import { ControllerQueryTemplate } from './QueryTemplates/ControllerQueryTemplate';
import { ControllerChildrenQueryTemplate } from './QueryTemplates/ControllerChildrenQueryTemplate';

/**
 * max number of rows to return in the result set
 */
const MAX_RESULT_COUNT: number = 10000;

export enum ResourceType {
    Node,
    Pod,
    Container,
    Controller,
    ContainersChildren,
    ControllerChildren,
}

/**
 * Column gird can be sorted on
 */
export enum SortColumn {
    ContainerName,
    Status,
    AggregationPercent,
    Aggregation,
    Pod,
    Node,
    Restarts,
    UpTime,
    Containers
}

/**
 * Grid sort order options
 */
export enum SortOrder {
    Asc,
    Desc
}

/**
 * Provides functionality to read data used to populate grids
 */
export class GridDataProvider {
    /** underlying Kusto data provider */
    private kustoDataProvider: IKustoDataProvider;

    /**
     * Initializes an instance of the class
     * @param kustoDataProvider underlying Kusto data provider
     */
    constructor(kustoDataProvider: IKustoDataProvider) {
        if (!kustoDataProvider) { throw new Error('Parameter @kustoDataProvider may not be null or undefined'); }
        this.kustoDataProvider = kustoDataProvider;
    }

    public getResourceList(
        workspace: IWorkspaceInfo,
        clusterName: string,
        clusterResourceId: string,
        nameSpace: string,
        serviceName: string,
        nodeName: string,
        controllerId: string,
        controllerName: string,
        controllerKind: string,
        nodePool: string,
        timeInterval: ITimeInterval,
        metricName: string,
        sortColumn: SortColumn,
        sortOrder: SortOrder,
        resourceType: ResourceType,
        selectedAggregationOption: AggregationOption,
        searchTerm: string,
        maxResultCount?: number,
        requestId?: string,
        tabName?: string,
        queryName?: string,
    ): Promise<any> {
        let queryTemplate = this.getQueryTemplate(metricName, resourceType);
        let query = this.replaceParamPlaceholders(
            queryTemplate,
            clusterName,
            clusterResourceId,
            nameSpace,
            serviceName,
            nodeName,
            controllerId,
            nodePool,
            timeInterval,
            sortColumn,
            sortOrder,
            selectedAggregationOption,
            searchTerm,
            controllerName,
            controllerKind,
            maxResultCount
        );

        const queryOptions =
            this.getQueryOptions(timeInterval, tabName, queryName, requestId);

        return this.kustoDataProvider.executeDraftQuery({workspace, query, queryOptions});
    }

    /**
     * Constructs Kusto query options set
     * @param timeInterval time interval of the query
     * @param tabName ux tab name
     * @param queryName query name
     * @param requestId request id
     * @param sessionId session id
     * @returns {IKustoQueryOptions} query options for Kusto query
     */
    private getQueryOptions(
        timeInterval: ITimeInterval,
        tabName?: string,
        queryName?: string,
        requestId?: string,
        sessionId?: string
    ): IKustoQueryOptions {
        let queryOptions: IKustoQueryOptions = {
            timeInterval: timeInterval
        };

        let initialLoad: string = 'false';
        if (!BladeLoadManager.Instance().fetchIsInitialLoadComplete()) {
            initialLoad = 'true';
        }

        if (tabName) {
            queryOptions.requestInfo = 'exp=containerinsights,blade=singlecontainer,tabName=' + tabName + ',initial=' + initialLoad;

            if (queryName) {
                queryOptions.requestInfo += ',query=' + queryName;
            }
        }

        if (requestId) { queryOptions.requestId = requestId; }
        if (sessionId) { queryOptions.sessionId = sessionId; }

        queryOptions.preferences = [Prefer.ExcludeFunctions, Prefer.ExcludeCustomFields, Prefer.ExcludeCustomLogs].join(',');

        return queryOptions;
    }

    /**
     * Replaces parameter placeholders in the query template
     * @param queryTemplate query template
     * @param timeInterval query time interval
     * @param clusterName cluster name
     * @param clusterResourceId cluster Azure resource id
     * @param nodeName node name
     * @param namespaceName namespace name
     * @param serviceName serivce name
     * @returns query ready for execution
     */
    private replaceQueryFilterPlaceholders(
        queryTemplate: string,
        timeInterval: ITimeInterval,
        clusterName?: string,
        clusterResourceId?: string,
        nodeName?: string,
        controllerId?: string,
        namespaceName?: string,
        serviceName?: string,
        nodePoolName?: string,
        controllerName?: string,
        controllerKind?: string
    ): string {
        if (!queryTemplate) { return null; };

        let query: string = queryTemplate;
        // nibs: Node pool placeholders must be replaced first because they themselves contain placeholders that have to be replaced
        query = StringHelpers.replaceAll(
            query,
            Placeholder.NodePoolFilter,
            nodePoolName ? PlaceholderSubstitute.NodePoolFilter() : ''
        );
        query = StringHelpers.replaceAll(
            query,
            Placeholder.NodePoolContainerQueryTemplateFilter,
            nodePoolName ? PlaceholderSubstitute.NodePoolContainerQueryTemplateFilter() : ''
        )
        query = StringHelpers.replaceAll(
            query,
            Placeholder.NodePoolChartQueryTemplateClusterPodCountFilter,
            nodePoolName ? PlaceholderSubstitute.NodePoolChartsQueryTemplateClusterPodCountFilter() : ''
        );

        query = StringHelpers.replaceAll(
            query,
            Placeholder.NodePoolNameFilter,
            nodePoolName ? PlaceholderSubstitute.NodePoolNameFilter(nodePoolName) : ''
        );

        query = StringHelpers.replaceAll(
            query,
            Placeholder.ControllerNameFilter,
            controllerName ? PlaceholderSubstitute.ControllerNameFilter(controllerName) : ''
        );

        query = StringHelpers.replaceAll(
            query,
            Placeholder.ControllerKindFilter,
            controllerKind ? PlaceholderSubstitute.ControllerKindFilter(controllerKind) : ''
        );

        query = this.fillInTimeParameters(query, timeInterval);

        const clusterFilter = PlaceholderSubstitute.ClusterFilter(clusterResourceId, clusterName);
        query = StringHelpers.replaceAll(query, Placeholder.ClusterFilter, clusterFilter);

        const nodeNameFilter = nodeName ? PlaceholderSubstitute.NodeNameFilter(nodeName) : '';
        query = StringHelpers.replaceAll(query, Placeholder.NodeNameFilter, nodeNameFilter);

        const computerNameFilter = nodeName ? PlaceholderSubstitute.ComputerNameFilter(nodeName) : '';
        query = StringHelpers.replaceAll(query, Placeholder.ComputerNameFilter, computerNameFilter);

        const controllerIdFilter = controllerId ? PlaceholderSubstitute.ControllerIdFilter(controllerId) : '';
        query = StringHelpers.replaceAll(query, Placeholder.ControllerIdFilter, controllerIdFilter);

        // cluster id may be provided (in in-blade experience) - use it if available to filter Perf table
        // if it is not available, use cluster name and 'has' filter
        // NOTE: In AKS-Engine cluster id may be "made up" using resource group id - in that case
        // cluster id may be present but Perf.InstanceName field will have cluster *name* not *id*
        // therefore check cluster id to be AKS before using it
        let perfInstanceNameFilter =
            (clusterResourceId && BladeContext.instance().cluster.isManagedCluster)
                ? PlaceholderSubstitute.PerfInstanceNameStartsWithFilter(clusterResourceId)
                : clusterName ? PlaceholderSubstitute.PerfInstanceNameHasFilter(clusterName) : '';
        query = StringHelpers.replaceAll(query, Placeholder.PerfInstanceNameFilter, perfInstanceNameFilter);

        // note: namespace name of '~' means 'all but kube-system'
        const namespaceNameFilter = namespaceName
            ? namespaceName === '~'
                ? PlaceholderSubstitute.NamespaceNameExcludeKubeSystemFilter()
                : PlaceholderSubstitute.NamespaceNameFilter(namespaceName)
            : '';
        query = StringHelpers.replaceAll(query, Placeholder.NameSpaceFilter, namespaceNameFilter);

        const serviceNameFilter = serviceName ? PlaceholderSubstitute.ServiceNameFilter(serviceName) : '';
        query = StringHelpers.replaceAll(query, Placeholder.ServiceNameFilter, serviceNameFilter);

        return query;
    }

    private getQueryTemplate(metricName: string, resource: ResourceType): string {
        if (resource === ResourceType.Node) {
            switch (metricName) {
                case ContainerHostMetricName.CpuCoreUtilization:
                    return NodeQueryTemplate.TopByNodeCpuMilliCore;
                case ContainerHostMetricName.MemoryRssBytes:
                    return NodeQueryTemplate.TopByNodeMemoryRss;
                case ContainerHostMetricName.MemoryWorkingSetBytes:
                    return NodeQueryTemplate.TopByNodeMemoryWorkingSet;
                default:
                    // note: no localization required for internal error messages
                    throw new Error('Not supported metric \'' + metricName + '\'');
            }
        } else if (resource === ResourceType.Controller) {
            switch (metricName) {
                case ContainerMetricName.CpuCoreUtilization:
                case ContainerHostMetricName.CpuCoreUtilization:
                    return ControllerQueryTemplate.TopByCpuMilliCore;
                case ContainerMetricName.MemoryRssBytes:
                case ContainerHostMetricName.MemoryRssBytes:
                    return ControllerQueryTemplate.TopByMemoryRss;
                case ContainerMetricName.MemoryWorkingSetBytes:
                case ContainerHostMetricName.MemoryWorkingSetBytes:
                    return ControllerQueryTemplate.TopByMemoryWorkingSet;
                default:
                    // note: no localization required for internal error messages
                    throw new Error('Not supported metric \'' + metricName + '\'');
            }
        } else if (resource === ResourceType.ContainersChildren) {
            switch (metricName) {
                case ContainerMetricName.CpuCoreUtilization:
                case ContainerHostMetricName.CpuCoreUtilization:
                    return ContainerQueryTemplate.TopByCpuMilliCoreWithUnscheduledPods;
                case ContainerMetricName.MemoryRssBytes:
                case ContainerHostMetricName.MemoryRssBytes:
                    return ContainerQueryTemplate.TopByMemoryRssWithUnscheduledPods;
                case ContainerMetricName.MemoryWorkingSetBytes:
                case ContainerHostMetricName.MemoryWorkingSetBytes:
                    return ContainerQueryTemplate.TopByMemoryWorkingSetWithUnscheduledPods;
                default:
                    // note: no localization required for internal error messages
                    throw new Error('Not supported metric \'' + metricName + '\'');
            }
        } else if (resource === ResourceType.ControllerChildren) {
            switch (metricName) {
                case ContainerMetricName.CpuCoreUtilization:
                case ContainerHostMetricName.CpuCoreUtilization:
                    return ControllerChildrenQueryTemplate.TopByCpuMilliCore;
                case ContainerMetricName.MemoryRssBytes:
                case ContainerHostMetricName.MemoryRssBytes:
                    return ControllerChildrenQueryTemplate.TopByMemoryRss;
                case ContainerMetricName.MemoryWorkingSetBytes:
                case ContainerHostMetricName.MemoryWorkingSetBytes:
                    return ControllerChildrenQueryTemplate.TopByMemoryWorkingSet;
                default:
                    // note: no localization required for internal error messages
                    throw new Error('Not supported metric \'' + metricName + '\'');
            }
        } else if (resource === ResourceType.Container) {
            switch (metricName) {
                case ContainerMetricName.CpuCoreUtilization:
                case ContainerHostMetricName.CpuCoreUtilization:
                    return ContainerQueryTemplate.TopByCpuMilliCore;
                case ContainerMetricName.MemoryRssBytes:
                case ContainerHostMetricName.MemoryRssBytes:
                    return ContainerQueryTemplate.TopByMemoryRss;
                case ContainerMetricName.MemoryWorkingSetBytes:
                case ContainerHostMetricName.MemoryWorkingSetBytes:
                    return ContainerQueryTemplate.TopByMemoryWorkingSet;
                default:
                    // note: no localization required for internal error messages
                    throw new Error('Not supported metric \'' + metricName + '\'');
            }
        }
        return '';
    }

    /**
     * Fills in the time parameters from tiem interval in the query template
     * @param queryTemplate query template
     * @param timeInterval time interval
     */
    private fillInTimeParameters(
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

    /**
     * Replaces the parameter placeholders in the query template
     * @param queryTemplate query template
     * @param clusterName cluster name
     * @param clusterResourceId cluster resource id
     * @param namespaceName namespace name
     * @param serviceName service name
     * @param nodeName node name
     * @param nodePool node pool
     * @param timeInterval time interval
     * @param orderBy sort parameter
     * @param sortDirection sort direction
     * @param selectedAggregationOption aggregration option
     * @param maxResultCount max result count
     */
    private replaceParamPlaceholders(
        queryTemplate: string,
        clusterName: string,
        clusterResourceId: string,
        namespaceName: string,
        serviceName: string,
        nodeName: string,
        controllerId: string,
        nodePool: string,
        timeInterval: ITimeInterval,
        orderBy: SortColumn,
        sortDirection: SortOrder,
        selectedAggregationOption: AggregationOption,
        searchTerm: string,
        controllerName: string,
        controllerKind: string,
        maxResultCount?: number,
    ): string {
        let query = this.replaceQueryFilterPlaceholders(
            queryTemplate,
            timeInterval,
            clusterName,
            clusterResourceId,
            nodeName,
            controllerId,
            namespaceName,
            serviceName,
            nodePool,
            controllerName,
            controllerKind
        );

        // If there is a filter for service and/or namespace, change the join for the KubePodInventory table to inner,
        // in order to remove nodes that don't have belong in the filtered workloads
        if (namespaceName || serviceName) {
            query = StringHelpers.replaceAll(query, Placeholder.KubePodInventoryJoinType, 'inner');
        } else {
            query = StringHelpers.replaceAll(query, Placeholder.KubePodInventoryJoinType, 'leftouter');
        }

        if (!!searchTerm && !StringHelpers.isNullOrEmpty(searchTerm)) {
            query = StringHelpers.replaceAll(query, Placeholder.SearchByNodeName, `| where NodeName contains \'${searchTerm}\' `)
        } else {
            query = StringHelpers.replaceAll(query, Placeholder.SearchByNodeName, '');
        }

        const effectiveMaxResultCount = (maxResultCount == null)
            ? MAX_RESULT_COUNT
            : (maxResultCount < MAX_RESULT_COUNT) ? maxResultCount : MAX_RESULT_COUNT;

        query = StringHelpers.replaceAll(query, Placeholder.MaxResultCount, effectiveMaxResultCount.toString());
        query = StringHelpers.replaceAll(query, Placeholder.OrderBy, SortColumn[orderBy]);
        query = StringHelpers.replaceAll(query, Placeholder.SortDirection, SortOrder[sortDirection].toLowerCase());

        //result aggregation string is same for both usage and trend
        let aggregationString = '';

        switch (selectedAggregationOption) {
            case AggregationOption.Avg:
                aggregationString = 'avg(CounterValue)';
                break;
            case AggregationOption.Min:
                aggregationString = 'min(CounterValue)';
                break;
            case AggregationOption.Max:
                aggregationString = 'max(CounterValue)';
                break
            case AggregationOption.P50:
                aggregationString = 'percentile(CounterValue, 50)';
                break;
            case AggregationOption.P90:
                aggregationString = 'percentile(CounterValue, 90)';
                break;
            case AggregationOption.P95:
                aggregationString = 'percentile(CounterValue, 95)';
                break;

            default:
                throw new Error('Unknown aggregation: ' + selectedAggregationOption);
        }

        query = StringHelpers.replaceAll(query, Placeholder.MetricUsageAggregation, aggregationString);
        query = StringHelpers.replaceAll(query, Placeholder.MetricTrendUsageAggregation, aggregationString);

        return query;
    }
}
