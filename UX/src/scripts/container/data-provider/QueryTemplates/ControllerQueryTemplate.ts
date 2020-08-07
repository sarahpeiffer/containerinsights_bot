export class ControllerQueryConstants {
    public static MaxControllerRows: number = 250;
    public static MaxPodRows: number = 50;
    public static MaxContainerRows: number = 20;
}

// tslint:disable:max-line-length


/**
 * Defines blocks used internally in several query templates
 */
class TemplateReusableBlocks {
    public static NodeQueryRootBlock: string = `let endDateTime = datetime(\'$[endDateTime]\');\
        let startDateTime = datetime(\'$[startDateTime]\');\
        let trendBinSize = $[trendBinSize];\
        let metricLimitCounterName = \'$[metricLimitCounterName]\';\
        let metricUsageCounterName = \'$[metricUsageCounterName]\';\
        `;

    public static PrimaryInventory: string = `let primaryInventory = KubePodInventory\
        | where TimeGenerated >= startDateTime\
        | where TimeGenerated < endDateTime\
        | where isnotempty(ClusterName) \
        | where isnotempty(Namespace) \
        | extend Node = Computer\
        $[clusterFilter]\
        $[serviceNameFilter]\
        $[nameSpaceFilter]\
        $[nodeNameFilter]\
        $[nodePoolContainerQueryTemplateFilter]\
        $[controllerNameFilter]\
        $[controllerKindFilter]\
        | project TimeGenerated, ClusterId, ClusterName, Namespace, ServiceName, \
            Node = Computer, ControllerName, Pod = Name, \
            ContainerInstance = ContainerName, \
            ContainerID, \
            InstanceName, PerfJoinKey = strcat(ClusterId, '/', ContainerName), \
            ReadySinceNow = format_timespan(endDateTime - ContainerCreationTimeStamp, \'ddd.hh:mm:ss.fff\'), \
            Restarts = ContainerRestartCount, Status = ContainerStatus,\
            ContainerStatusReason = columnifexists('ContainerStatusReason', ''),\
            ControllerKind = ControllerKind, PodStatus, ControllerId = strcat(ClusterId, '/', ControllerName);`;

    public static PodStatusRollup = `let podStatusRollup = primaryInventory \
        | summarize arg_max(TimeGenerated, *) by Pod \
        | project ControllerId, PodStatus, TimeGenerated \
        | summarize count() by ControllerId, PodStatus = iif(TimeGenerated < ago(30m), 'Unknown', PodStatus)\
        | summarize PodStatusList = makelist(pack('Status', PodStatus, 'Count', count_)) by ControllerId;`;

    public static LatestContainersByController = `let latestContainersByController = primaryInventory\
        | where isnotempty(Node)\
        | summarize arg_max(TimeGenerated, *) by PerfJoinKey\
        | project ControllerId, PerfJoinKey;`;

    public static FilteredPerformanceTable = `let filteredPerformance = Perf\
        | where TimeGenerated >= startDateTime\
        | where TimeGenerated < endDateTime\
        | where ObjectName == 'K8SContainer'\
        $[perfInstanceNameFilter]\
        | project TimeGenerated, CounterName, CounterValue, InstanceName, Node = Computer\
        $[nodePoolContainerQueryTemplateFilter]\
        $[nodeNameFilter];`;

    public static MetricsByController = `let metricByController = filteredPerformance\
        | where CounterName =~ metricUsageCounterName\
        | extend PerfJoinKey = InstanceName\
        | summarize Value = $[metricUsageAggregation] by PerfJoinKey, CounterName\
        | join (latestContainersByController) on PerfJoinKey\
        | summarize Value = sum(Value) by ControllerId, CounterName\
        | project ControllerId, CounterName, AggregationValue = iff(CounterName =~ 'cpuUsageNanoCores', Value/1000000, Value);`;

    public static ContainerCountByController = `let containerCountByController = latestContainersByController\
        | summarize ContainerCount = count() by ControllerId;`;

    public static RestartCountByController = `let restartCountsByController = primaryInventory\
        | summarize Restarts = max(Restarts) by ControllerId;`;

    public static OldestRestartByController = `let oldestRestart = primaryInventory\
        | summarize ReadySinceNow = min(ReadySinceNow) by ControllerId;`;

    public static TrendlineByController = `let trendLineByController = filteredPerformance\
        | where CounterName =~ metricUsageCounterName\
        | extend PerfJoinKey = InstanceName\
        | summarize Value = $[metricUsageAggregation] by bin(TimeGenerated, trendBinSize), PerfJoinKey, CounterName\
        | order by TimeGenerated asc\
        | join kind=leftouter (latestContainersByController) on PerfJoinKey\
        | summarize Value=sum(Value) by ControllerId, TimeGenerated, CounterName\
        | project TimeGenerated, Value = iff(CounterName =~ 'cpuUsageNanoCores', Value/1000000, Value), ControllerId\
        | summarize TrendList = makelist(pack("timestamp", TimeGenerated, "value", Value)) by ControllerId;`;

    public static LatestLimit = `let latestLimit = filteredPerformance\
        | where CounterName =~ metricLimitCounterName\
        | extend PerfJoinKey = InstanceName\
        | summarize arg_max(TimeGenerated, *) by PerfJoinKey\
        | join kind=leftouter (latestContainersByController) on PerfJoinKey\
        | summarize Value = sum(CounterValue) by ControllerId, CounterName\
        | project ControllerId, LimitValue = iff(CounterName =~ 'cpuLimitNanoCores', Value/1000000, Value);`;

    public static LatestTimeGenerated = `let latestTimeGeneratedByController = primaryInventory\
        | summarize arg_max(TimeGenerated, *) by ControllerId\
        | project ControllerId, LastTimeGenerated = TimeGenerated;`;

    public static FinalRowJoin = `primaryInventory\
        | distinct ControllerId, ControllerName, ControllerKind, Namespace\
        | join kind=leftouter (podStatusRollup) on ControllerId\
        | join kind=leftouter (metricByController) on ControllerId\
        | join kind=leftouter (containerCountByController) on ControllerId\
        | join kind=leftouter (restartCountsByController) on ControllerId\
        | join kind=leftouter (oldestRestart) on ControllerId\
        | join kind=leftouter (trendLineByController) on ControllerId\
        | join kind=leftouter (latestLimit) on ControllerId\
        | join kind=leftouter (latestTimeGeneratedByController) on ControllerId\
        | project ControllerId, ControllerName, ControllerKind, PodStatusList, AggregationValue, ContainerCount = iif(isempty(ContainerCount), 0, ContainerCount),\
        Restarts, ReadySinceNow, Node = '-', TrendList, LimitValue, LastTimeGenerated, Namespace\
        | limit ${ControllerQueryConstants.MaxControllerRows};`;

    public static CpuOrMemoryMetricTopNTemplate: string =
        TemplateReusableBlocks.NodeQueryRootBlock +
        TemplateReusableBlocks.PrimaryInventory +
        TemplateReusableBlocks.PodStatusRollup +
        TemplateReusableBlocks.LatestContainersByController +
        TemplateReusableBlocks.FilteredPerformanceTable +
        TemplateReusableBlocks.MetricsByController +
        TemplateReusableBlocks.ContainerCountByController +
        TemplateReusableBlocks.RestartCountByController +
        TemplateReusableBlocks.OldestRestartByController +
        TemplateReusableBlocks.TrendlineByController +
        TemplateReusableBlocks.LatestLimit +
        TemplateReusableBlocks.LatestTimeGenerated +
        TemplateReusableBlocks.FinalRowJoin;
}

export class ControllerQueryTemplate {
    public static TopByCpuMilliCore: string =
        TemplateReusableBlocks.CpuOrMemoryMetricTopNTemplate
            .replace('$[metricLimitCounterName]', 'cpuLimitNanoCores')
            .replace('$[metricUsageCounterName]', 'cpuUsageNanoCores');

    public static TopByMemoryRss: string =
        TemplateReusableBlocks.CpuOrMemoryMetricTopNTemplate
            .replace('$[metricLimitCounterName]', 'memoryLimitBytes')
            .replace('$[metricUsageCounterName]', 'memoryRssBytes');

    public static TopByMemoryWorkingSet: string =
        TemplateReusableBlocks.CpuOrMemoryMetricTopNTemplate
            .replace('$[metricLimitCounterName]', 'memoryLimitBytes')
            .replace('$[metricUsageCounterName]', 'memoryWorkingSetBytes');
}

