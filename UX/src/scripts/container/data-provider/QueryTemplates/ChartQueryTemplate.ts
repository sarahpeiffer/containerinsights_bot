/**
 * shared
 */
import { ITimeInterval } from '../../../shared/data-provider/TimeInterval';
import { StringHelpers } from '../../../shared/Utilities/StringHelpers';

/**
 * local
 */
import { GlobalFilterPlaceholder } from './GlobalFilterPlaceholder';
import { IKubernetesCluster } from '../../IBladeContext';

/**
 * Declares query template placeholder strings
 */
class Placeholder {
    public static Granularity: string = '$[trendBinSize]';
}

/**
 * Query templates for charts on the Cluster tab
 */
// tslint:disable:max-line-length
export class ChartQueryTemplate {
    // TODO: Compute max list size based on the input granularity and stop hardcoding to 1000
    //       once we allow different query granularities to be set by the client
    /**
     * Query for cluster cpu and memory utilization
     */
    public static ClusterCpuAndMemory = `\
    let endDateTime = datetime('$[endDateTime]');\
    let startDateTime = datetime('$[startDateTime]');\
    let trendBinSize = $[trendBinSize];\
    let MaxListSize = 1000;\
    let clusterId = '$[clusterId]';\
    let clusterIdToken = strcat(clusterId, "/");\
    let materializedPerfData  = materialize(Perf\
        | where TimeGenerated < endDateTime\
        | where TimeGenerated >= startDateTime\
        | where InstanceName startswith clusterIdToken\
        | where ObjectName  == 'K8SNode'\
        | summarize arg_max(TimeGenerated, *) by CounterName, Computer, bin(TimeGenerated, trendBinSize)\
        | where CounterName == 'cpuCapacityNanoCores' or CounterName == 'memoryCapacityBytes' or CounterName == 'cpuUsageNanoCores' or CounterName == 'memoryRssBytes'\
        | project TimeGenerated, Computer, CounterName, CounterValue\
        | summarize StoredValue = max(CounterValue) by Computer, CounterName, bin(TimeGenerated, trendBinSize));\
    let rawData = KubeNodeInventory\
    | where TimeGenerated < endDateTime\
    | where TimeGenerated >= startDateTime\
    $[computerNameFilter]\
    | where ClusterId =~ clusterId\
    $[nodePoolFilter]\
    | summarize arg_max(TimeGenerated, *) by Computer, bin(TimeGenerated, trendBinSize)\
    | join( materializedPerfData \
        | where CounterName == 'cpuCapacityNanoCores' or CounterName == 'memoryCapacityBytes'\
        | project Computer, CounterName = iif(CounterName == 'cpuCapacityNanoCores', 'cpu', 'memory'), CapacityValue = StoredValue, TimeGenerated\
    ) on Computer, TimeGenerated\
    | join kind=inner( materializedPerfData \
        | where CounterName == 'cpuUsageNanoCores' or CounterName == 'memoryRssBytes'\
        | project Computer, CounterName = iif(CounterName == 'cpuUsageNanoCores', 'cpu', 'memory'), UsageValue = StoredValue, TimeGenerated\
    ) on Computer, CounterName, TimeGenerated\
    | project Computer, CounterName, TimeGenerated, UsagePercent = UsageValue * 100.0 / CapacityValue;\
    rawData\
    | summarize Min = min(UsagePercent), Avg = avg(UsagePercent), Max = max(UsagePercent), percentiles(UsagePercent, 50, 90, 95)\
             by bin(TimeGenerated, trendBinSize), CounterName\
    | sort by TimeGenerated asc\
    | project CounterName, TimeGenerated, Min, Avg, Max, P50 = percentile_UsagePercent_50, P90 = percentile_UsagePercent_90, P95 = percentile_UsagePercent_95\
    | summarize makelist(TimeGenerated, MaxListSize),\
                makelist(Min, MaxListSize),\
                makelist(Avg, MaxListSize),\
                makelist(Max, MaxListSize),\
                makelist(P50, MaxListSize),\
                makelist(P90, MaxListSize),\
                makelist(P95, MaxListSize) by CounterName\
    | join (\
        rawData\
        | summarize Min = min(UsagePercent), Avg = avg(UsagePercent), Max = max(UsagePercent), percentiles(UsagePercent, 50, 90, 95) by CounterName\
    ) on CounterName\
    | project ClusterId = clusterId, CounterName, Min, Avg, Max, P50 = percentile_UsagePercent_50, P90 = percentile_UsagePercent_90, P95 = percentile_UsagePercent_95,\
              list_TimeGenerated, list_Min, list_Avg, list_Max, list_P50, list_P90, list_P95\
    `;

    /**
     * Query for cluster node count chart
     */
    public static ClusterNodeCount = `\
    let endDateTime = datetime('$[endDateTime]');\
    let startDateTime = datetime('$[startDateTime]');\
    let trendBinSize = $[trendBinSize];\
    let maxListSize = 1000;\
    let clusterId = '$[clusterId]';\
    let rawData =\
    KubeNodeInventory\
    | where TimeGenerated < endDateTime\
    | where TimeGenerated >= startDateTime\
    | where ClusterId =~ clusterId\
    $[nodePoolFilter]\
    | distinct ClusterId, TimeGenerated\
    | summarize ClusterSnapshotCount = count() by Timestamp = bin(TimeGenerated, trendBinSize), ClusterId\
    | join hint.strategy=broadcast (\
        KubeNodeInventory\
        | where TimeGenerated < endDateTime\
        | where TimeGenerated >= startDateTime\
        $[computerNameFilter]\
        | where ClusterId =~ clusterId\
        $[nodePoolFilter]\
        | summarize TotalCount = count(), ReadyCount = sumif(1, Status contains ('Ready'))\
                 by ClusterId, Timestamp = bin(TimeGenerated, trendBinSize)\
        | extend NotReadyCount = TotalCount - ReadyCount\
    ) on ClusterId, Timestamp\
    | project ClusterId, Timestamp,\
              TotalCount = todouble(TotalCount) / ClusterSnapshotCount,\
              ReadyCount = todouble(ReadyCount) / ClusterSnapshotCount,\
              NotReadyCount = todouble(NotReadyCount) / ClusterSnapshotCount;\
    rawData\
    | order by Timestamp asc\
    | summarize makelist(Timestamp, maxListSize),\
                makelist(TotalCount, maxListSize),\
                makelist(ReadyCount, maxListSize),\
                makelist(NotReadyCount, maxListSize)\
            by ClusterId\
    | join (\
        rawData\
        | summarize Avg_TotalCount = avg(TotalCount), Avg_ReadyCount = avg(ReadyCount), Avg_NotReadyCount = avg(NotReadyCount) by ClusterId\
    ) on ClusterId\
    | project ClusterId, Avg_TotalCount, Avg_ReadyCount, Avg_NotReadyCount, list_Timestamp, list_TotalCount, list_ReadyCount, list_NotReadyCount\
    `;

    /**
     * Query for active pod count chart
     */
    public static ClusterPodCount = `\
    let endDateTime = datetime('$[endDateTime]');\
    let startDateTime = datetime('$[startDateTime]');\
    let trendBinSize = $[trendBinSize];\
    let maxListSize = 1000;\
    let clusterId = '$[clusterId]';\
    let rawData =\
    KubePodInventory\
    | where TimeGenerated < endDateTime\
    | where TimeGenerated >= startDateTime\
    | where ClusterId =~ clusterId\
    | distinct ClusterId, TimeGenerated\
    | summarize ClusterSnapshotCount = count() by bin(TimeGenerated, trendBinSize), ClusterId\
    | join hint.strategy=broadcast (\
        KubePodInventory\
        | where TimeGenerated < endDateTime\
        | where TimeGenerated >= startDateTime\
        | where ClusterId =~ clusterId\
        $[computerNameFilter]\
        $[serviceNameFilter]\
        $[nameSpaceFilter]\
        $[controllerNameFilter]\
        $[controllerKindFilter]\
        $[nodePoolChartQueryTemplateClusterPodCountFilter]\
        | summarize TotalCount = count(),\
                    PendingCount = sumif(1, PodStatus =~ 'Pending'),\
                    RunningCount = sumif(1, PodStatus =~ 'Running'),\
                    SucceededCount = sumif(1, PodStatus =~ 'Succeeded'),\
                    FailedCount = sumif(1, PodStatus =~ 'Failed')\
                 by ClusterId, bin(TimeGenerated, trendBinSize)\
    ) on ClusterId, TimeGenerated\
    | extend UnknownCount = TotalCount - PendingCount - RunningCount - SucceededCount - FailedCount\
    | project ClusterId, Timestamp = TimeGenerated,\
              TotalCount = todouble(TotalCount) / ClusterSnapshotCount,\
              PendingCount = todouble(PendingCount) / ClusterSnapshotCount,\
              RunningCount = todouble(RunningCount) / ClusterSnapshotCount,\
              SucceededCount = todouble(SucceededCount) / ClusterSnapshotCount,\
              FailedCount = todouble(FailedCount) / ClusterSnapshotCount,\
              UnknownCount = todouble(UnknownCount) / ClusterSnapshotCount;\
    let rawDataCached = rawData;\
    rawDataCached\
    | order by Timestamp asc\
    | summarize makelist(Timestamp, maxListSize),\
                makelist(TotalCount, maxListSize),\
                makelist(PendingCount, maxListSize),\
                makelist(RunningCount, maxListSize),\
                makelist(SucceededCount, maxListSize),\
                makelist(FailedCount, maxListSize),\
                makelist(UnknownCount, maxListSize)\
            by ClusterId\
    | join (\
        rawDataCached\
        | summarize Avg_TotalCount = avg(TotalCount), Avg_PendingCount = avg(PendingCount), Avg_RunningCount = avg(RunningCount), Avg_SucceededCount = avg(SucceededCount), Avg_FailedCount = avg(FailedCount), Avg_UnknownCount = avg(UnknownCount) by ClusterId\
    ) on ClusterId\
    | project ClusterId, Avg_TotalCount, Avg_PendingCount, Avg_RunningCount, Avg_SucceededCount, Avg_FailedCount, Avg_UnknownCount, list_Timestamp, list_TotalCount, list_PendingCount, list_RunningCount, list_SucceededCount, list_FailedCount, list_UnknownCount\
    `;

    /**
     * Replaces parameter placeholders in the query template
     * @param queryTemplate query template
     * @param timeInterval query time interval
     * @param cluster cluster object
     * @param nodeName node name
     * @param namespaceName namespace name
     * @param serviceName serivce name
     * @param nodePoolName node pool
     * @returns query ready for execution
     */
    public static replaceQueryParamPlaceholders(
        queryTemplate: string,
        timeInterval: ITimeInterval,
        cluster: IKubernetesCluster,
        nodeName?: string,
        namespaceName?: string,
        serviceName?: string,
        nodePoolName?: string,
        controllerName?: string,
        controllerKind?: string
    ): string {
        if (!queryTemplate) { return null; };

        let query = GlobalFilterPlaceholder.replacePlaceholders(
            queryTemplate,
            timeInterval,
            cluster,
            nodeName,
            namespaceName,
            serviceName,
            nodePoolName,
            controllerName,
            controllerKind
        );

        query = StringHelpers.replaceAll(query, Placeholder.Granularity, timeInterval.getGrainKusto());

        return query;
    }
}
// tslint:enable:max-line-length
