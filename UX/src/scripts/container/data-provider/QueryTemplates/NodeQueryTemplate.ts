export class NodeQueryTemplateConstants {
    public static MaxNodeRows: number = 250;
}

/**
 * Defines blocks used internally in several query templates
 */
class TemplateReusableBlocks {


    public static NodeQueryRootBlock: string =
        `let endDateTime = datetime(\'$[endDateTime]\');\
        let startDateTime = datetime(\'$[startDateTime]\');\
        let binSize = $[trendBinSize];\
        let limitMetricName = \'$[metricCapacityCounterName]\';\
        let usedMetricName = \'$[metricUsageCounterName]\';\
        `;

    public static NodeQueryMaterializedNodeInventory: string =
        `let materializedNodeInventory = KubeNodeInventory\
        | where TimeGenerated < endDateTime\
        | where TimeGenerated >= startDateTime\
        | project ClusterName, ClusterId, Node = Computer, TimeGenerated, Status,\
        NodeName = Computer, NodeId = strcat(ClusterId, '/', Computer), Labels\
        $[nodePoolFilter]\
        $[clusterFilter]\
        $[nodeNameFilter];\
        `;

    public static NodeQueryMaterializedPerf: string =
        `let materializedPerf = Perf\
        | where TimeGenerated < endDateTime\
        | where TimeGenerated >= startDateTime\
        | where ObjectName == \'K8SNode\'\
        | extend NodeId = InstanceName;\
        `;

    public static NodeQueryMaterializedPodInventory: string =
        `let materializedPodInventory = KubePodInventory\
        | where TimeGenerated < endDateTime\
        | where TimeGenerated >= startDateTime\
        | where isnotempty(ClusterName)\
        | where isnotempty(Namespace)\
        $[clusterFilter]\
        $[serviceNameFilter]\
        $[controllerNameFilter]\
        $[controllerKindFilter]\
        $[nameSpaceFilter];\
        `;

    public static InventoryOfCluster: string =
        `let inventoryOfCluster = materializedNodeInventory\
        | summarize arg_max(TimeGenerated, Status) by ClusterName, ClusterId, NodeName, NodeId;\
        `;

    public static LabelsByNode: string =
        `let labelsByNode = materializedNodeInventory\
        | summarize arg_max(TimeGenerated, Labels) by ClusterName, ClusterId, NodeName, NodeId;\
        `;

    public static ContainerCountByNode: string =
        `let countainerCountByNode = materializedPodInventory\
        | project ContainerName, NodeId = strcat(ClusterId, '/', Computer)\
        | distinct NodeId, ContainerName\
        | summarize ContainerCount = count() by NodeId;\
        `;

    public static LatestUpTime: string =
        `let latestUptime = materializedPerf\
        | where CounterName == 'restartTimeEpoch'\
        | summarize arg_max(TimeGenerated, CounterValue) by NodeId\
        | extend UpTimeMs = datetime_diff('Millisecond', endDateTime,\
        datetime_add('second', toint(CounterValue), make_datetime(1970,1,1)))\
        | project NodeId, UpTimeMs;\
        `;

    public static LimitByNode: string =
        `let latestLimitOfNodes = materializedPerf\
        | where CounterName == limitMetricName\
        | summarize CounterValue = max(CounterValue) by NodeId\
        | project NodeId, LimitValue = CounterValue;\
        `;

    public static ActualUsageAggregateByNode: string =
        `let actualUsageAggregated = materializedPerf\
        | where CounterName == usedMetricName\
        | summarize Aggregation = $[metricUsageAggregation] by NodeId\
        | project NodeId, Aggregation;\
        `;

    public static UsageAggregateBinnedByNode: string =
        `let aggregateTrendsOverTime = materializedPerf\
        | where CounterName == usedMetricName\
        | summarize TrendAggregation = $[metricUsageAggregation] by NodeId, bin(TimeGenerated, binSize)\
        | project NodeId, TrendAggregation, TrendDateTime = TimeGenerated;\
        `;


    public static UnScheduledPods: string =
        `let unscheduledPods = materializedPodInventory\
        | where isempty(Computer)\
        | extend Node = Computer\
        $[nodeNameFilter]\
        | where isempty(ContainerStatus)\
        | where PodStatus == 'Pending'\
        | order by TimeGenerated desc\
        | take 1\
        | project ClusterName, NodeName = 'unscheduled', LastReceivedDateTime = TimeGenerated, Status = 'unscheduled', ContainerCount = 0, UpTimeMs = '0', Aggregation = '0',\
        LimitValue = '0', ClusterId;\
        `;

    public static ScheduledPods: string =
        `let scheduledPods = inventoryOfCluster\
        | join kind=leftouter (aggregateTrendsOverTime) on NodeId\
        | extend TrendPoint = pack("TrendTime", TrendDateTime, "TrendAggregation", TrendAggregation)\
        | summarize make_list(TrendPoint) by NodeId, NodeName, Status\
        | join kind=leftouter (labelsByNode) on NodeId\
        | join kind=$[kubePodInventoryJoinType] (countainerCountByNode) on NodeId\
        | join kind=leftouter (latestUptime) on NodeId\
        | join kind=leftouter (latestLimitOfNodes) on NodeId\
        | join kind=leftouter (actualUsageAggregated) on NodeId\
        | project ClusterName, NodeName, ClusterId, list_TrendPoint,\
                LastReceivedDateTime = TimeGenerated,\
                Status,\
                ContainerCount,\
                UpTimeMs,\
                Aggregation, LimitValue,\
                Labels\
        $[searchByNodeName]\
        | limit ${NodeQueryTemplateConstants.MaxNodeRows};\
        `;

    public static MainNodeUIQuery: string =
        `union (scheduledPods), (unscheduledPods)\
        $[searchByNodeName]\
        | project ClusterName, NodeName,\
        LastReceivedDateTime,\
        Status,\
        ContainerCount,\
        UpTimeMs = UpTimeMs_long,\
        Aggregation = Aggregation_real, LimitValue = LimitValue_real,\
        list_TrendPoint,\
        Labels,\
        ClusterId\
        `;

    public static CpuOrMemoryMetricTopNTemplate: string =
        TemplateReusableBlocks.NodeQueryRootBlock +
        TemplateReusableBlocks.NodeQueryMaterializedNodeInventory +
        TemplateReusableBlocks.NodeQueryMaterializedPerf +
        TemplateReusableBlocks.NodeQueryMaterializedPodInventory +
        TemplateReusableBlocks.InventoryOfCluster +
        TemplateReusableBlocks.LabelsByNode +
        TemplateReusableBlocks.ContainerCountByNode +
        TemplateReusableBlocks.LatestUpTime +
        TemplateReusableBlocks.LimitByNode +
        TemplateReusableBlocks.ActualUsageAggregateByNode +
        TemplateReusableBlocks.UsageAggregateBinnedByNode +
        TemplateReusableBlocks.UnScheduledPods +
        TemplateReusableBlocks.ScheduledPods +
        TemplateReusableBlocks.MainNodeUIQuery;
}

export class NodeQueryTemplate {
    public static TopByNodeCpuMilliCore: string = TemplateReusableBlocks.CpuOrMemoryMetricTopNTemplate
        .replace('$[metricCapacityCounterName]', 'cpuCapacityNanoCores')
        .replace('$[metricUsageCounterName]', 'cpuUsageNanoCores');

    public static TopByNodeMemoryRss: string = TemplateReusableBlocks.CpuOrMemoryMetricTopNTemplate
        .replace('$[metricCapacityCounterName]', 'memoryCapacityBytes')
        .replace('$[metricUsageCounterName]', 'memoryRssBytes');

    public static TopByNodeMemoryWorkingSet: string = TemplateReusableBlocks.CpuOrMemoryMetricTopNTemplate
        .replace('$[metricCapacityCounterName]', 'memoryCapacityBytes')
        .replace('$[metricUsageCounterName]', 'memoryWorkingSetBytes');
}

