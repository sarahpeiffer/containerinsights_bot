import { ControllerQueryConstants } from './ControllerQueryTemplate';


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
        | project TimeGenerated, ClusterId, ClusterName, Namespace, ServiceName, \
            Node = Computer, ControllerName, Pod = Name, \
            ContainerInstance = ContainerName, \
            ContainerID, \
            InstanceName, PerfJoinKey = strcat(ClusterId, '/', ContainerName), \
            ReadySinceNow = format_timespan(endDateTime - ContainerCreationTimeStamp, \'ddd.hh:mm:ss.fff\'), \
            Restarts = ContainerRestartCount, Status = ContainerStatus,\
            ContainerStatusReason = columnifexists('ContainerStatusReason', ''),\
            ControllerKind = ControllerKind, PodStatus, ControllerId = strcat(ClusterId, '/', ControllerName)\
        | extend PodId = strcat(ControllerId, '/', Pod)\
        $[controllerIdFilter];`;

    public static PodStatusRollup = `let latestStatus = primaryInventory\
        | summarize arg_max(TimeGenerated, *) by PodId\
        | project PodId, PodStatus = iif(TimeGenerated < ago(30m), 'Unknown', PodStatus), TimeGenerated;`;

    public static LatestContainersByController = `let latestContainersForController = primaryInventory\
        | where isnotempty(Node)\
        | summarize arg_max(TimeGenerated, *) by PerfJoinKey\
        | project PodId, PerfJoinKey;`;

    public static FilteredPerformanceTable = `let filteredPerformance = Perf\
        | where TimeGenerated >= startDateTime\
        | where TimeGenerated < endDateTime\
        | where ObjectName == 'K8SContainer'\
        $[perfInstanceNameFilter]\
        | project TimeGenerated, CounterName, CounterValue, InstanceName, Node = Computer\
        $[nodePoolContainerQueryTemplateFilter]\
        $[nodeNameFilter];`;

    public static MetricsByPod = `let metricByPod = filteredPerformance\
        | where CounterName =~ metricUsageCounterName\
        | extend PerfJoinKey = InstanceName\
        | summarize Value = $[metricUsageAggregation] by PerfJoinKey, CounterName\
        | join (latestContainersForController) on PerfJoinKey\
        | summarize Value = sum(Value) by PodId, CounterName\
        | project PodId, CounterName, AggregationValue = iff(CounterName =~ 'cpuUsageNanoCores', Value/1000000, Value);`;

    public static ContainerCountByPod = `let containerCountByPod = latestContainersForController\
        | summarize ContainerCount = count() by PodId;`;

    public static RestartCountByController = `let restartCountsByController = primaryInventory\
        | summarize Restarts = max(Restarts) by PodId;`;

    public static OldestRestartByController = `let oldestRestart = primaryInventory\
        | where isnotempty(Node)\
        | summarize arg_max(TimeGenerated, *) by PodId\
        | project PodId, ReadySinceNow;`;

    public static OldestNodeNameByPod = `let oldestNodeName = primaryInventory\
        | summarize arg_max(TimeGenerated, *) by PodId\
        | project Node, PodId;`

    public static TrendlineByController = `let trendLineByPod = filteredPerformance\
        | where CounterName =~ metricUsageCounterName\
        | extend PerfJoinKey = InstanceName\
        | summarize Value = $[metricUsageAggregation] by bin(TimeGenerated, trendBinSize), PerfJoinKey, CounterName\
        | order by TimeGenerated asc\
        | join kind=leftouter (latestContainersForController) on PerfJoinKey\
        | summarize Value=sum(Value) by PodId, TimeGenerated, CounterName\
        | project TimeGenerated, Value = iff(CounterName =~ 'cpuUsageNanoCores', Value/1000000, Value), PodId\
        | summarize TrendList = makelist(pack("timestamp", TimeGenerated, "value", Value)) by PodId;`;

    public static LatestLimit = `let latestLimit = filteredPerformance\
        | where CounterName =~ metricLimitCounterName\
        | extend PerfJoinKey = InstanceName\
        | summarize arg_max(TimeGenerated, *) by PerfJoinKey\
        | join kind=leftouter (latestContainersForController) on PerfJoinKey\
        | summarize Value = sum(CounterValue) by PodId, CounterName\
        | project PodId, LimitValue = iff(CounterName =~ 'cpuLimitNanoCores', Value/1000000, Value);`;

    public static LatestTimeGenerated = `let latestTimeGeneratedByController = primaryInventory\
        | summarize arg_max(TimeGenerated, *) by PodId\
        | project PodId, LastTimeGenerated = TimeGenerated;`;

    public static LatestContainerStatus = `let lastContainerStatus = primaryInventory\
        | where isnotempty(ContainerInstance)\
        | summarize arg_max(TimeGenerated, *) by PerfJoinKey\
        | project PerfJoinKey, Status = iif(TimeGenerated < ago(30m), 'unknown', Status), ContainerStatusReason, Restarts, ReadySinceNow, TimeGenerated;`;


    public static MetricByContainer = `let metricByContainer = filteredPerformance\
        | where CounterName =~ metricUsageCounterName\
        | extend PerfJoinKey = InstanceName\
        | summarize Value = $[metricUsageAggregation] by PerfJoinKey, CounterName\
        | project PerfJoinKey, AggregationValue = iff(CounterName =~ 'cpuUsageNanoCores', Value/1000000, Value);`;

    public static LimitByContainer = `let limitByContainer = filteredPerformance\
        | where CounterName =~ metricLimitCounterName\
        | extend PerfJoinKey = InstanceName\
        | summarize Value = max(CounterValue) by PerfJoinKey, CounterName\
        | project PerfJoinKey, LimitValue = iff(CounterName =~ 'cpuLimitNanoCores', Value/1000000, Value);`;

    public static TrendlineByContainer = `let trendLineByContainer = filteredPerformance\
        | where CounterName =~ metricUsageCounterName\
        | extend PerfJoinKey = InstanceName\
        | summarize Value = $[metricUsageAggregation] by bin(TimeGenerated, trendBinSize), PerfJoinKey, CounterName\
        | order by TimeGenerated asc\
        | project TimeGenerated, Value = iff(CounterName =~ 'cpuUsageNanoCores', Value/1000000, Value), PerfJoinKey\
        | summarize TrendList = makelist(pack("timestamp", TimeGenerated, "value", Value)) by PerfJoinKey;`;


    public static ContainerInventory = `let containerInventory = primaryInventory\
        | distinct PodId, ContainerInstance, PerfJoinKey\
        | where isnotempty(ContainerInstance)\
        | join kind=leftouter (lastContainerStatus) on PerfJoinKey\
        | join kind=leftouter (metricByContainer) on PerfJoinKey\
        | join kind=leftouter (limitByContainer) on PerfJoinKey\
        | join kind=leftouter (trendLineByContainer) on PerfJoinKey\
        | project ContainerInstance, PodId, Status = iif(isempty(Status), 'unknown', Status), Restarts, ReadySinceNow, TimeGenerated, TrendList,\
            AggregationValue = iif(isempty(AggregationValue), todouble(-1), AggregationValue), ContainerStatusReason, LimitValue\
        | summarize Containers = makelist(pack("containerName", ContainerInstance, "status", Status, "aggregationValue", AggregationValue, "statusReason", ContainerStatusReason,\
            "limitValue", LimitValue, "restarts", Restarts, "readySinceNow", ReadySinceNow, "lastTimeGenerated", TimeGenerated, "trendList", TrendList)) by PodId\
        | limit ${ControllerQueryConstants.MaxContainerRows};`;


    public static FinalRowJoin = `primaryInventory\
        | distinct Pod, ControllerId, ControllerName, PodId, Namespace\
        | join kind=leftouter (latestStatus) on PodId\
        | join kind=leftouter (containerCountByPod) on PodId\
        | join kind=leftouter (metricByPod) on PodId\
        | join kind=leftouter (restartCountsByController) on PodId\
        | join kind=leftouter (oldestRestart) on PodId\
        | join kind=leftouter (oldestNodeName) on PodId\
        | join kind=leftouter (trendLineByPod) on PodId\
        | join kind=leftouter (latestLimit) on PodId\
        | join kind=leftouter (latestTimeGeneratedByController) on PodId\
        | join kind=leftouter (containerInventory) on PodId\
        | project ControllerId, ControllerName, PodId, PodName = Pod, PodStatus, AggregationValue = iif(isempty(AggregationValue), todouble(-1), AggregationValue),\
            ContainerCount = iif(isempty(ContainerCount), 0, ContainerCount), Restarts,\
            ReadySinceNow = iif(isempty(ReadySinceNow), format_timespan(ago(1s) - now(), 'ddd.hh:mm:ss.fff'), ReadySinceNow),\
            Node = iif(isempty(Node), '-', Node), TrendList = iif(isempty(TrendList), parse_json('[]'), TrendList),\
            LimitValue = iif(isempty(LimitValue), todouble(1), LimitValue),\
            LastTimeGenerated, Namespace, Containers = iif(isempty(Containers), parse_json('[]'), Containers)\
        | limit ${ControllerQueryConstants.MaxPodRows};`;

    public static CpuOrMemoryMetricTopNTemplate: string =
        TemplateReusableBlocks.NodeQueryRootBlock +
        TemplateReusableBlocks.PrimaryInventory +
        TemplateReusableBlocks.PodStatusRollup +
        TemplateReusableBlocks.LatestContainersByController +
        TemplateReusableBlocks.FilteredPerformanceTable +
        TemplateReusableBlocks.MetricsByPod +
        TemplateReusableBlocks.ContainerCountByPod +
        TemplateReusableBlocks.RestartCountByController +
        TemplateReusableBlocks.OldestRestartByController +
        TemplateReusableBlocks.OldestNodeNameByPod +
        TemplateReusableBlocks.TrendlineByController +
        TemplateReusableBlocks.LatestLimit +
        TemplateReusableBlocks.LatestTimeGenerated +
        TemplateReusableBlocks.LatestContainerStatus + 
        TemplateReusableBlocks.MetricByContainer + 
        TemplateReusableBlocks.LimitByContainer +
        TemplateReusableBlocks.TrendlineByContainer +
        TemplateReusableBlocks.ContainerInventory +
        TemplateReusableBlocks.FinalRowJoin;
}

export class ControllerChildrenQueryTemplate {
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

