export class ContainerQueryConstants {
    public static MaxContainerRows: number = 200;
}

/**
 * Defines blocks used internally in several query templates
 */
class TemplateReusableBlocks {
    /**
     * Query template to visualize top-N list view given container metric
     * This building block has parameter $[metricUsageCounterName] and $[metricLimitCounterName] which allows template defined     
     * gangams : Agent uses config hash as PodUid for controller-less kube system pods to co-relate the cAdvisor perf data
     * since PodUid for these pods is config hash which is not unique across the nodes so we need to include Node for the join
     * include the Node for the join would ensure inventory of all controller less pods co-related with perf data 
     * as long as there is no collision in the hash of these pods on the same node.
     */
    public static MetricTopNTemplate: string =
        `let startDateTime = datetime(\'$[startDateTime]\');\
        let endDateTime = datetime(\'$[endDateTime]\');\
        let trendBinSize = $[trendBinSize];\
        let maxResultCount = $[maxResultCount];\
        let metricUsageCounterName = \'$[metricUsageCounterName]\';\
        let metricLimitCounterName = \'$[metricLimitCounterName]\';\
        let KubePodInventoryTable = KubePodInventory\
        | where TimeGenerated >= startDateTime\
        | where TimeGenerated < endDateTime\
        | where isnotempty(ClusterName)\
        | where isnotempty(Namespace)\
        | where isnotempty(Computer)\
        | project TimeGenerated, ClusterId, ClusterName, Namespace, ServiceName,\
            ControllerName, Node = Computer, Pod = Name,\
            ContainerInstance = ContainerName,\
            ContainerID, \
            ReadySinceNow = format_timespan(endDateTime - ContainerCreationTimeStamp , \'ddd.hh:mm:ss.fff\'), \
            Restarts = ContainerRestartCount, Status = ContainerStatus,\
            ContainerStatusReason = columnifexists('ContainerStatusReason', ''),\
            ControllerKind = ControllerKind, PodStatus;\
            let startRestart = KubePodInventoryTable\
            | summarize arg_min(TimeGenerated, *) by Node, ContainerInstance\
            $[clusterFilter]\
            $[serviceNameFilter]\
            $[nameSpaceFilter]\
            $[nodeNameFilter]\
            $[controllerNameFilter]\
            $[controllerKindFilter]\
            | project Node, ContainerInstance, InstanceName = strcat(ClusterId, '/', ContainerInstance), StartRestart = Restarts;\
            let IdentityTable =  KubePodInventoryTable\
            | summarize arg_max(TimeGenerated, *) by Node, ContainerInstance\
            $[clusterFilter]\
            $[serviceNameFilter]\
            $[nameSpaceFilter]\
            $[nodeNameFilter]\
            $[controllerNameFilter]\
            $[controllerKindFilter]\
            | project ClusterName, Namespace, ServiceName, ControllerName, Node, Pod, ContainerInstance,\
                    InstanceName = strcat(ClusterId, '/', ContainerInstance), ContainerID, ReadySinceNow, Restarts,\
                    Status = iff(Status =~ \'running\', 0, iff(Status=~\'waiting\', 1, iff(Status =~\'terminated\', 2, 3))),\
                    ContainerStatusReason,\
                    ControllerKind, Containers = 1, ContainerName = tostring(split(ContainerInstance, '/')[1]), PodStatus,\
                    LastPodInventoryTimeGenerated = TimeGenerated, ClusterId;\
        let CachedIdentityTable = IdentityTable;\
        let FilteredPerfTable = Perf\
        | where TimeGenerated >= startDateTime\
        | where TimeGenerated < endDateTime\
        | where ObjectName == 'K8SContainer'\
        $[perfInstanceNameFilter]\
        | project Node = Computer, TimeGenerated, CounterName, CounterValue, InstanceName\
        $[nodeNameFilter];\
        let CachedFilteredPerfTable = FilteredPerfTable;\
        let LimitsTable = CachedFilteredPerfTable\
        | where CounterName =~ metricLimitCounterName\
        | summarize arg_max(TimeGenerated, *) by Node, InstanceName\
        | project Node, InstanceName,\
            LimitsValue = iff(CounterName =~ \'cpuLimitNanoCores\', CounterValue/1000000, CounterValue),\
            TimeGenerated;\
        let MetaDataTable = CachedIdentityTable\
        | join kind=leftouter (\
                LimitsTable\
            ) on Node, InstanceName \
            | join kind= leftouter ( startRestart ) on Node, InstanceName\
            | project ClusterName, Namespace, ServiceName, ControllerName, Node, Pod, InstanceName,\
                        ContainerID, ReadySinceNow, Restarts, LimitsValue, Status,\
                        ContainerStatusReason = columnifexists('ContainerStatusReason', ''), ControllerKind, Containers,\
                        ContainerName, ContainerInstance, StartRestart, PodStatus, LastPodInventoryTimeGenerated, ClusterId;\
            let UsagePerfTable = CachedFilteredPerfTable\
            | where CounterName =~ metricUsageCounterName\
            | project TimeGenerated, Node, InstanceName,\
            CounterValue = iff(CounterName =~ \'cpuUsageNanoCores\', CounterValue/1000000, CounterValue);\
                let LastRestartPerfTable = CachedFilteredPerfTable\
                | where CounterName =~ \'restartTimeEpoch\'\
                | summarize arg_max(TimeGenerated, *) by Node, InstanceName\
                | project Node, InstanceName, UpTime = CounterValue,\
                LastReported = TimeGenerated;\
            let AggregationTable = UsagePerfTable\
            | summarize  Aggregation = $[metricUsageAggregation] by Node, InstanceName\
            | project Node, InstanceName, Aggregation;\
            let TrendTable = UsagePerfTable\
            | summarize TrendAggregation = $[metricTrendUsageAggregation]\
                by bin(TimeGenerated, trendBinSize), Node, InstanceName\
            | project TrendTimeGenerated = TimeGenerated, Node, InstanceName , TrendAggregation\
            | summarize TrendList = makelist(pack("timestamp", TrendTimeGenerated, "value", TrendAggregation)) by Node, InstanceName;\
            let containerFinalTable = MetaDataTable\
            | join kind= leftouter( AggregationTable ) on Node, InstanceName\
            | join kind = leftouter (LastRestartPerfTable) on Node, InstanceName\
            | order by $[orderByColumnName] $[sortDirection], ContainerName\
            | join kind =  leftouter ( TrendTable) on Node, InstanceName\
            $[nodePoolContainerQueryTemplateFilter]\
            | project ContainerIdentity = strcat(ContainerName, '|', Pod),  Status,\
            ContainerStatusReason = columnifexists('ContainerStatusReason', ''),\
            Aggregation, Node, Restarts, ReadySinceNow,  TrendList = iif(isempty(TrendList), parse_json('[]'), TrendList),\
            LimitsValue, ControllerName, ControllerKind, ContainerID, Containers,\
            UpTimeNow = datetime_diff('Millisecond', endDateTime, datetime_add('second', toint(UpTime), make_datetime(1970,1,1))),\
            ContainerInstance, StartRestart, LastReportedDelta = datetime_diff(\'Millisecond\', endDateTime, LastReported),\
            PodStatus, InstanceName, Namespace, LastPodInventoryTimeGenerated, ClusterId;`;
        // This query is dependent on startDateTime and endDateTime being provided in MetricTopNTemplate
        // Please refactor it out of the query if you want to use it somewhere else
    public static UnscheduledPods: string =
        `let unscheduledPods = KubePodInventory\
        | where TimeGenerated < endDateTime\
        | where TimeGenerated >= startDateTime\
        | where isnotempty(ClusterName)\
        | where isnotempty(Namespace)\
        | where isempty(Computer)\
        | extend Node = iff(isnotempty(Computer), Computer, 'unscheduled')\
        $[clusterFilter]\
        $[serviceNameFilter]\
        $[nameSpaceFilter]\
        $[nodeNameFilter]\
        | where isempty(ContainerStatus)\
        | where PodStatus == \'Pending\'\
        | summarize arg_max(TimeGenerated, *) by Name\
        | project ContainerIdentity = strcat(\'|\', Name ),\
        Status = iff(ContainerStatus =~ \'running\', 0, iff(ContainerStatus=~\'waiting\', 1, iff(ContainerStatus =~\'terminated\', 2, 3))),\
        ContainerStatusReason = columnifexists('ContainerStatusReason', ''),\
        Aggregation = 0.0, Node, Restarts = toint(0), ReadySinceNow = \'\',\
        TrendList = parse_json('[]'),\
        LimitsValue = 0.0, ControllerName, ControllerKind, ContainerID, Containers = 0, UpTimeNow = tolong(0), ContainerInstance = Name,\
        StartRestart = toint(0), PodStatus, InstanceName = strcat(ClusterId, '/'),\
        Namespace, LastPodInventoryTimeGenerated = TimeGenerated;`;

       public static StandardQuery = TemplateReusableBlocks.MetricTopNTemplate + 
            `containerFinalTable | limit ${ContainerQueryConstants.MaxContainerRows}`;
    
        public static UnionQuery = TemplateReusableBlocks.MetricTopNTemplate + 
            TemplateReusableBlocks.UnscheduledPods +
            `union containerFinalTable, unscheduledPods | limit ${ContainerQueryConstants.MaxContainerRows}`;
}

export class ContainerQueryTemplate {
    public static TopByCpuMilliCore: string =
        TemplateReusableBlocks.StandardQuery
            .replace('$[metricLimitCounterName]', 'cpuLimitNanoCores')
            .replace('$[metricUsageCounterName]', 'cpuUsageNanoCores');

    public static TopByCpuMilliCoreWithUnscheduledPods: string =
        TemplateReusableBlocks.UnionQuery
            .replace('$[metricLimitCounterName]', 'cpuLimitNanoCores')
            .replace('$[metricUsageCounterName]', 'cpuUsageNanoCores');

    public static TopByMemoryRss: string =
        TemplateReusableBlocks.StandardQuery
            .replace('$[metricLimitCounterName]', 'memoryLimitBytes')
            .replace('$[metricUsageCounterName]', 'memoryRssBytes');

    public static TopByMemoryRssWithUnscheduledPods: string =
        TemplateReusableBlocks.UnionQuery
            .replace('$[metricLimitCounterName]', 'memoryLimitBytes')
            .replace('$[metricUsageCounterName]', 'memoryRssBytes');

    public static TopByMemoryWorkingSet: string =
        TemplateReusableBlocks.StandardQuery
            .replace('$[metricLimitCounterName]', 'memoryLimitBytes')
            .replace('$[metricUsageCounterName]', 'memoryWorkingSetBytes');

    public static TopByMemoryWorkingSetWithUnscheduledPods: string =
        TemplateReusableBlocks.UnionQuery
            .replace('$[metricLimitCounterName]', 'memoryLimitBytes')
            .replace('$[metricUsageCounterName]', 'memoryWorkingSetBytes');
}
