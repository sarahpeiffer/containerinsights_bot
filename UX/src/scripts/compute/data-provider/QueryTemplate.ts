export class Placeholder {
    public static Granularity: string = '$[trendBinSize]';
    public static StartDateTime: string = '$[startDateTime]';
    public static EndDateTime: string = '$[endDateTime]';
    public static MaxResultCount: string = '$[maxResultCount]';
    public static OrderBy: string = '$[orderByColumnName]';
    public static SortDirection: string = '$[sortDirection]';
    public static TrendExpression: string = '$[trendExpression]';
    public static GroupFilter: string = '$[groupFilter]';
    public static NodeIdentityAndPropsSubquery: string = '$[nodeIdentityAndPropsSubquery]';
    public static MaxListSize: string = '$[maxListSize]';
    public static GroupFunctionName: string = '$[groupFunctionName]';
    public static GroupMembers: string = '$[groupMembers]';
    public static GroupDefinition: string = '$[groupDefinition]';
    public static ComputerName: string = '$[computerName]';
    public static AzureResourceId: string = '$[azureResourceId]';
    public static SelectedCounters: string = '$[selectedCounters]';
    public static NetworkCounterWindows: string = '$[networkCounterWindows]';
    public static NetworkCounterLinux: string = '$[networkCounterLinux]';
    public static MaxRecords: string = '$[maxRecords]';
    public static DisplayNameFilter: string = '$[displayNameFilter]';
    public static AzureResourceIdFilter: string = '$[azureResourceIdFilter]';
    public static ResourceFilter: string = '$[resourceFilter]';
    public static AlertsFilterByResource: string = '$[alertsFilterByResource]';
    public static AlertsFilterByComputerName: string = '$[alertsFilterByComputerName]';
    public static AlertsDefinition: string = '$[alertsDefinition]';
    public static GridDataContainsFilter: string = '$[gridDataContainsFilter]';
    public static ComputerNameFilter: string = '$[computerNameFilter]';
    public static TopNChartPercentileFilter: string = '$[topNChartPercentileFilter]';
    public static TopNSeriesSelectorFilter: string = '$[topNSeriesSelectorFilter]';
    public static PerformanceCounterName: string = '$[performanceCounterName]';
    public static ConnectionFilter: string = '$[connectionFilter]'
    public static AgentId: string = '$[agentId]';

    //TODO refer task 4563861, remove these two
    public static extendedLaResourceId: string = '$[extendedLaResourceId]';
    public static laResourceIdFilter: string = '$[laResourceIdFilter]';
}

export class PlaceholderValue {
    public static NetworkCounterWindows: StringMap<string> = {
        Tx: 'Bytes Sent/sec',
        Rx: 'Bytes Received/sec'
    };
    public static NetworkCounterLinux: StringMap<string> = {
        Tx: 'Total Bytes Transmitted',
        Rx: 'Total Bytes Received'
    }
}

// tslint:disable:max-line-length 
// when we use 'in' table, the first column is used.
export class QueryTemplate {
    public static FilterByComputerNameClause = '| where Computer contains \'$[computerNameFilter]\'';
    public static TopNPercentileFilterClause = 'percentile($[performanceCounterName], $[topNChartPercentileFilter])';
    public static TopNAverageFilterClause = 'avg($[performanceCounterName])';
    public static TopNMinFilterClause = 'min($[performanceCounterName])';
    public static TopNMaxFilerClause = 'max($[performanceCounterName])';
    public static PerfCounterName = 'CounterValue';
    public static InsightsMetricsCounterName = 'Val';

    public static TopByCpu: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
 let endDateTime = datetime(\'$[endDateTime]\');\
 let trendBinSize = $[trendBinSize];\
 let maxResultCount = $[maxResultCount];\
 $[groupDefinition]\
 let summaryPerComputer = totable(Perf\
 | where TimeGenerated >= startDateTime\
 | where TimeGenerated < endDateTime $[groupFilter]\
 | where ObjectName == \'Processor\'\
 | where CounterName == \'% Processor Time\'\
 | where InstanceName == \'_Total\'\
 $[gridDataContainsFilter]\
 | extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
 | summarize hint.shufflekey = ComputerId Average = avg(CounterValue), Max = max(CounterValue), percentiles(CounterValue, 5, 10, 50, 90, 95) by ComputerId, Computer, _ResourceId\
 | project ComputerId, Computer, Average, Max, P5th = percentile_CounterValue_5, P10th = percentile_CounterValue_10, P50th = percentile_CounterValue_50, P90th = percentile_CounterValue_90, P95th = percentile_CounterValue_95, ResourceId = _ResourceId\
 | order by $[orderByColumnName] $[sortDirection], Computer\
 | limit maxResultCount);\
 let computerList = summaryPerComputer | project ComputerId, Computer;\
 $[nodeIdentityAndPropsSubquery]\
 let trend = Perf\
     | where TimeGenerated >= startDateTime\
     | where TimeGenerated < endDateTime\
     | extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
     | where ComputerId in (computerList)\
     | where ObjectName == \'Processor\'\
     | where CounterName == \'% Processor Time\'\
     | where InstanceName == \'_Total\'\
     | summarize hint.shufflekey = ComputerId TrendValue = $[trendExpression] by ComputerId, Computer, bin(TimeGenerated, trendBinSize)\
     | project ComputerId, Computer, TrendPoint = pack(\'TimeGenerated\', TimeGenerated, \'TrendValue\', TrendValue)\
     | summarize hint.shufflekey = ComputerId makelist(TrendPoint) by ComputerId, Computer;\
summaryPerComputer\
| join (trend) on ComputerId\
| join (NodeIdentityAndProps) on ComputerId\
| project NodeId, NodeProps, Average, P5th, P10th, P50th, P90th, P95th, Max, list_TrendPoint, Computer, UseRelativeScale = false, ResourceId';

    // tslint:disable:max-line-length 
    public static TopByMemory: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
 let endDateTime = datetime(\'$[endDateTime]\');\
 let trendBinSize = $[trendBinSize];\
 let maxResultCount = $[maxResultCount];\
 $[groupDefinition]\
 let summaryPerComputer = totable(Perf\
 | where TimeGenerated >= startDateTime\
 | where TimeGenerated < endDateTime $[groupFilter]\
 | where ObjectName == \'Memory\'\
 | where CounterName == \'Available MBytes Memory\' or CounterName == \'Available MBytes\'\
 $[gridDataContainsFilter]\
 | extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
 | summarize hint.shufflekey = ComputerId Average = avg(CounterValue), Min = min(CounterValue), percentiles(CounterValue, 95, 90, 50, 10, 5) by ComputerId, Computer, _ResourceId\
 | project ComputerId, Computer, Average, Min, P95th = percentile_CounterValue_95, P90th = percentile_CounterValue_90, P50th = percentile_CounterValue_50, P10th = percentile_CounterValue_10, P5th = percentile_CounterValue_5, ResourceId = _ResourceId\
 | order by $[orderByColumnName] $[sortDirection], Computer\
 | limit maxResultCount);\
 let computerList = summaryPerComputer | project ComputerId, Computer;\
 $[nodeIdentityAndPropsSubquery]\
 let trend = Perf\
     | where TimeGenerated >= startDateTime\
     | where TimeGenerated < endDateTime\
     | extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
     | where ComputerId in (computerList)\
     | where ObjectName == \'Memory\'\
     | where CounterName == \'Available MBytes Memory\' or CounterName == \'Available MBytes\'\
     | summarize hint.shufflekey = ComputerId TrendValue = $[trendExpression] by ComputerId, Computer, bin(TimeGenerated, trendBinSize)\
     | project ComputerId, Computer, TrendPoint = pack(\'TimeGenerated\', TimeGenerated, \'TrendValue\', TrendValue)\
     | summarize hint.shufflekey = ComputerId makelist(TrendPoint) by ComputerId, Computer;\
summaryPerComputer\
| join (trend) on ComputerId\
| join (NodeIdentityAndProps) on ComputerId\
| project NodeId, NodeProps, Average, P95th, P90th, P50th, P10th, P5th, Min, list_TrendPoint, Computer, UseRelativeScale = false, ResourceId';

    // tslint:disable:max-line-length
    public static TopByDiskSpace: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
 let endDateTime = datetime(\'$[endDateTime]\');\
 let trendBinSize = $[trendBinSize];\
 let maxResultCount = $[maxResultCount];\
 $[groupDefinition]\
 let summaryPerComputerInstance = totable(Perf\
 | where TimeGenerated >= startDateTime\
 | where TimeGenerated < endDateTime $[groupFilter]\
 $[gridDataContainsFilter]\
 | where (ObjectName == \'Logical Disk\' and InstanceName != \'_Total\' and CounterName == \'% Used Space\') or\
         (ObjectName == \'LogicalDisk\' and InstanceName != \'_Total\' and CounterName == \'% Free Space\')\
 | extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
 | project ComputerId, Computer, InstanceName, CounterValue = iif(CounterName == \'% Used Space\', CounterValue, 100 - CounterValue), _ResourceId\
 | summarize hint.shufflekey = ComputerId hint.shufflekey = InstanceName Average = avg(CounterValue), Max = max(CounterValue), percentiles(CounterValue, 5, 10, 50, 90, 95) by ComputerId, Computer, _ResourceId, InstanceName\
 | project ComputerId, Computer, InstanceName, Average, Max, P5th = percentile_CounterValue_5, P10th = percentile_CounterValue_10, P50th = percentile_CounterValue_50, P90th = percentile_CounterValue_90, P95th = percentile_CounterValue_95, ResourceId = _ResourceId\
 | order by $[orderByColumnName] $[sortDirection], InstanceName, ComputerId, Computer\
 | limit maxResultCount);\
 let computerList = summaryPerComputerInstance | project ComputerId, Computer;\
 $[nodeIdentityAndPropsSubquery]\
 let trend = Perf\
        | where TimeGenerated >= startDateTime\
        | where TimeGenerated < endDateTime\
        | extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
        | where ComputerId in (computerList)\
        | where (ObjectName == \'Logical Disk\' and InstanceName != \'_Total\' and CounterName == \'% Used Space\') or\
                (ObjectName == \'LogicalDisk\' and InstanceName != \'_Total\' and CounterName == \'% Free Space\')\
        | project TimeGenerated, ComputerId, Computer, InstanceName, CounterValue = iif(CounterName == \'% Used Space\', CounterValue, 100 - CounterValue)\
        | summarize hint.shufflekey = ComputerId hint.shufflekey = InstanceName TrendValue = $[trendExpression] by bin(TimeGenerated, trendBinSize), ComputerId, Computer, InstanceName\
        | project ComputerId, Computer, InstanceName, TrendPoint = pack(\'TimeGenerated\', TimeGenerated, \'TrendValue\', TrendValue)\
        | summarize hint.shufflekey = ComputerId hint.shufflekey = InstanceName makelist(TrendPoint) by ComputerId, Computer, InstanceName;\
summaryPerComputerInstance\
| join trend on ComputerId, InstanceName\
| join (NodeIdentityAndProps) on ComputerId\
| extend    VolumeId = strcat(InstanceName, \'|\', NodeId),\
            VolumeProps = pack(\'type\', \'NodeVolume\',\
                            \'volumeName\', InstanceName,\
                            \'node\', NodeProps)\
| project VolumeId, VolumeProps, Average, P5th, P10th, P50th, P90th, P95th, Max, list_TrendPoint, Computer, UseRelativeScale = false, ResourceId';

    // tslint:disable:max-line-length 
    public static TopByNetworkReceived: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
    let endDateTime = datetime(\'$[endDateTime]\');\
    let trendBinSize = $[trendBinSize];\
    let maxResultCount = $[maxResultCount];\
    $[groupDefinition]\
    let Network = materialize(Perf\
            | where TimeGenerated >= startDateTime\
            | where TimeGenerated < endDateTime $[groupFilter]\
            | where ObjectName == \'Network\' and CounterName == \'Total Bytes Received\'\
            $[gridDataContainsFilter]\
            | extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
            | order by CounterName asc, InstanceName, ComputerId asc, TimeGenerated asc \
            | extend prev_ComputerId=prev(ComputerId), prev_Value=prev(CounterValue), prev_t=prev(TimeGenerated), prev_instance=prev(InstanceName) \
            | project   TimeGenerated, ComputerId, Computer, _ResourceId,\
                        cValue = iff(prev_ComputerId == ComputerId and prev_instance == InstanceName and CounterValue >= prev_Value and TimeGenerated > prev_t, (CounterValue-prev_Value)/((TimeGenerated-prev_t)/1s), real(0))\
            | summarize CounterValue = sum(cValue) by ComputerId, Computer, _ResourceId, bin(TimeGenerated, 2s)\
        | union (Perf\
            | where TimeGenerated >= startDateTime\
            | where TimeGenerated < endDateTime $[groupFilter]\
            | where ObjectName == \'Network Adapter\' and CounterName == \'Bytes Received/sec\'\
            $[gridDataContainsFilter]\
            | extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId))\
            | summarize CounterValue = sum(CounterValue) by ComputerId, Computer, _ResourceId, bin(TimeGenerated, 2s));\
    let summaryPerComputer = totable(Network\
            | summarize hint.shufflekey = ComputerId Average = avg(CounterValue), Max = max(CounterValue), percentiles(CounterValue, 5, 10, 50, 90, 95) by ComputerId, Computer, _ResourceId\
            | project ComputerId, Computer, Average, Max, P5th = percentile_CounterValue_5, P10th = percentile_CounterValue_10, P50th = percentile_CounterValue_50, P90th = percentile_CounterValue_90, P95th = percentile_CounterValue_95, ResourceId = _ResourceId\
            | order by $[orderByColumnName] $[sortDirection], Computer\
            | limit maxResultCount);\
    let computerList = summaryPerComputer | project ComputerId, Computer;\
    $[nodeIdentityAndPropsSubquery]\
    let trend = Network\
                | where ComputerId in (computerList)\
                | summarize hint.shufflekey = ComputerId TrendValue = $[trendExpression] by ComputerId, Computer, bin(TimeGenerated, trendBinSize)\
                | project ComputerId, Computer, TrendPoint = pack(\'TimeGenerated\', TimeGenerated, \'TrendValue\', TrendValue)\
                | summarize hint.shufflekey = ComputerId makelist(TrendPoint) by ComputerId, Computer;\
    summaryPerComputer\
    | join (trend) on ComputerId\
    | join (NodeIdentityAndProps) on ComputerId\
    | project NodeId, NodeProps, Average, P5th, P10th, P50th, P90th, P95th, Max, list_TrendPoint, Computer, UseRelativeScale = true, ResourceId';

    // tslint:disable:max-line-length 
    public static TopByNetworkSend: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
    let endDateTime = datetime(\'$[endDateTime]\');\
    let trendBinSize = $[trendBinSize];\
    let maxResultCount = $[maxResultCount];\
    $[groupDefinition]\
    let Network = materialize(Perf\
            | where TimeGenerated >= startDateTime\
            | where TimeGenerated < endDateTime $[groupFilter]\
            | where ObjectName == \'Network\' and CounterName == \'Total Bytes Transmitted\'\
            $[gridDataContainsFilter]\
            | extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
            | order by CounterName asc, InstanceName, ComputerId asc, TimeGenerated asc \
            | extend prev_ComputerId=prev(ComputerId), prev_Value=prev(CounterValue), prev_t=prev(TimeGenerated), prev_instance=prev(InstanceName) \
            | project   TimeGenerated, ComputerId, Computer, _ResourceId,\
                        cValue = iff(prev_ComputerId == ComputerId and prev_instance == InstanceName and CounterValue >= prev_Value and TimeGenerated > prev_t, (CounterValue-prev_Value)/((TimeGenerated-prev_t)/1s), real(0))\
            | summarize CounterValue = sum(cValue) by ComputerId, Computer, _ResourceId, bin(TimeGenerated, 2s)\
        | union (Perf\
            | where TimeGenerated >= startDateTime\
            | where TimeGenerated < endDateTime $[groupFilter]\
            | where ObjectName == \'Network Adapter\' and CounterName == \'Bytes Sent/sec\'\
            $[gridDataContainsFilter]\
            | extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId))\
            | summarize CounterValue = sum(CounterValue) by ComputerId, Computer, _ResourceId, bin(TimeGenerated, 2s));\
    let summaryPerComputer = totable(Network\
            | summarize hint.shufflekey = ComputerId Average = avg(CounterValue), Max = max(CounterValue), percentiles(CounterValue, 5, 10, 50, 90, 95) by ComputerId, Computer, _ResourceId\
            | project ComputerId, Computer, Average, Max, P5th = percentile_CounterValue_5, P10th = percentile_CounterValue_10, P50th = percentile_CounterValue_50, P90th = percentile_CounterValue_90, P95th = percentile_CounterValue_95, ResourceId = _ResourceId\
            | order by $[orderByColumnName] $[sortDirection], Computer\
            | limit maxResultCount);\
    let computerList = summaryPerComputer | project ComputerId, Computer;\
    $[nodeIdentityAndPropsSubquery]\
    let trend = Network\
                | where ComputerId in (computerList)\
                | summarize hint.shufflekey = ComputerId TrendValue = $[trendExpression] by ComputerId, Computer, bin(TimeGenerated, trendBinSize)\
                | project ComputerId, Computer, TrendPoint = pack(\'TimeGenerated\', TimeGenerated, \'TrendValue\', TrendValue)\
                | summarize hint.shufflekey = ComputerId makelist(TrendPoint) by ComputerId, Computer;\
    summaryPerComputer\
    | join (trend) on ComputerId\
    | join (NodeIdentityAndProps) on ComputerId\
    | project NodeId, NodeProps, Average, P5th, P10th, P50th, P90th, P95th, Max, list_TrendPoint, Computer, UseRelativeScale = true, ResourceId';

    public static TopByCpuUsingInsightsMetrics: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let trendBinSize = $[trendBinSize];\
let maxResultCount = $[maxResultCount];\
$[groupDefinition]\
let summaryPerComputer = materialize(InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
$[groupFilter]\
| where Origin == \'vm.azm.ms\' and (Namespace == \'Processor\' and Name == \'UtilizationPercentage\')\
    $[gridDataContainsFilter]\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| summarize hint.shufflekey = ComputerId Average = avg(Val), Max = max(Val), percentiles(Val, 5, 10, 50, 90, 95) by ComputerId, Computer, _ResourceId\
| project ComputerId, Computer, Average, Max, P5th = percentile_Val_5, P10th = percentile_Val_10, P50th = percentile_Val_50, P90th = percentile_Val_90, P95th = percentile_Val_95, ResourceId = _ResourceId\
| order by $[orderByColumnName] $[sortDirection], Computer\
| limit maxResultCount);\
let computerList = summaryPerComputer\
| summarize by ComputerId, Computer;\
$[nodeIdentityAndPropsSubquery]\
let trend = InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
| where Origin == \'vm.azm.ms\' and (Namespace == \'Processor\' and Name == \'UtilizationPercentage\')\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| where ComputerId in (computerList)\
| summarize hint.shufflekey = ComputerId TrendValue = $[trendExpression] by ComputerId, Computer, bin(TimeGenerated, trendBinSize)\
| project ComputerId, Computer, TrendPoint = pack(\'TimeGenerated\', TimeGenerated, \'TrendValue\', TrendValue)\
| summarize hint.shufflekey = ComputerId makelist(TrendPoint) by ComputerId, Computer;\
summaryPerComputer\
| join ( trend ) on ComputerId\
| join ( NodeIdentityAndProps ) on ComputerId\
| project NodeId, NodeProps, Average, P5th, P10th, P50th, P90th, P95th, Max, list_TrendPoint, Computer, UseRelativeScale = false, ResourceId';

    public static TopByMemoryUsingInsightsMetrics: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let trendBinSize = $[trendBinSize];\
let maxResultCount = $[maxResultCount];\
$[groupDefinition]\
let summaryPerComputer = materialize(InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
$[groupFilter]\
| where Origin == \'vm.azm.ms\' and (Namespace == \'Memory\' and Name == \'AvailableMB\')\
$[gridDataContainsFilter]\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| summarize hint.shufflekey = ComputerId Average = avg(Val), Max = max(Val), percentiles(Val, 5, 10, 50, 90, 95) by ComputerId, Computer, _ResourceId\
| project ComputerId, Computer, Average, Max, P5th = percentile_Val_5, P10th = percentile_Val_10, P50th = percentile_Val_50, P90th = percentile_Val_90, P95th = percentile_Val_95, ResourceId = _ResourceId\
| order by $[orderByColumnName] $[sortDirection], Computer\
| limit maxResultCount);\
let computerList = summaryPerComputer\
| summarize by ComputerId, Computer;\
$[nodeIdentityAndPropsSubquery]\
let trend = InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
| where Origin == \'vm.azm.ms\' and (Namespace == \'Memory\' and Name == \'AvailableMB\')\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| where ComputerId in (computerList)\
| summarize hint.shufflekey = ComputerId TrendValue = $[trendExpression] by ComputerId, Computer, bin(TimeGenerated, trendBinSize)\
| project ComputerId, Computer, TrendPoint = pack(\'TimeGenerated\', TimeGenerated, \'TrendValue\', TrendValue)\
| summarize hint.shufflekey = ComputerId makelist(TrendPoint) by ComputerId, Computer;\
summaryPerComputer\
| join ( trend ) on ComputerId\
| join ( NodeIdentityAndProps ) on ComputerId\
| project NodeId, NodeProps, Average, P5th, P10th, P50th, P90th, P95th, Max, list_TrendPoint, Computer, UseRelativeScale = false, ResourceId';

    public static TopByDiskSpaceUsingInsightsMetrics: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let trendBinSize = $[trendBinSize];\
let maxResultCount = $[maxResultCount];\
$[groupDefinition]\
let summaryPerComputer = materialize(InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
$[groupFilter]\
| where Origin == \'vm.azm.ms\' and (Namespace == \'LogicalDisk\' and Name == \'FreeSpaceMB\')\
$[gridDataContainsFilter]\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| extend Tags = todynamic(Tags)\
| extend Total = todouble(Tags[\'vm.azm.ms/diskSizeMB\']), MountId = tostring(Tags[\'vm.azm.ms/mountId\'])\
| extend Val = (100.0 - (Val * 100.0)/Total)\
| summarize hint.shufflekey = ComputerId Average = avg(Val), Max = max(Val), percentiles(Val, 5, 10, 50, 90, 95) by MountId, ComputerId, Computer, _ResourceId\
| project MountId, ComputerId, Computer, Average, Max, P5th = percentile_Val_5, P10th = percentile_Val_10, P50th = percentile_Val_50, P90th = percentile_Val_90, P95th = percentile_Val_95, ResourceId = _ResourceId\
| order by $[orderByColumnName] $[sortDirection], MountId, Computer\
| limit maxResultCount);\
let computerList = summaryPerComputer\
| summarize by ComputerId, Computer;\
$[nodeIdentityAndPropsSubquery]\
let trend = InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
| where Origin == \'vm.azm.ms\' and (Namespace == \'LogicalDisk\' and Name == \'FreeSpaceMB\')\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| where ComputerId in (computerList)\
| extend Tags = todynamic(Tags)\
| extend Total = todouble(Tags[\'vm.azm.ms/diskSizeMB\']), MountId = tostring(Tags[\'vm.azm.ms/mountId\'])\
| extend Val = (100.0 - (Val * 100.0)/Total)\
| summarize hint.shufflekey = ComputerId TrendValue = $[trendExpression] by MountId, ComputerId, Computer, bin(TimeGenerated, trendBinSize)\
| project MountId, ComputerId, Computer, TrendPoint = pack(\'TimeGenerated\', TimeGenerated, \'TrendValue\', TrendValue)\
| summarize hint.shufflekey = ComputerId makelist(TrendPoint) by MountId, ComputerId, Computer;\
summaryPerComputer\
| join kind=leftouter ( trend ) on ComputerId, MountId\
| join kind=leftouter ( NodeIdentityAndProps ) on ComputerId\
| extend VolumeId = strcat(MountId, \'|\', NodeId), VolumeProps = pack(\'type\', \'NodeVolume\', \'volumeName\', MountId, \'node\', NodeProps)\
| project VolumeId, VolumeProps, Average, P5th, P10th, P50th, P90th, P95th, Max, list_TrendPoint, Computer, UseRelativeScale = false, ResourceId';

    public static TopByNetworkReceivedUsingInsightsMetrics: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let trendBinSize = $[trendBinSize];\
let maxResultCount = $[maxResultCount];\
$[groupDefinition]\
let summaryPerComputer = materialize(InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
$[groupFilter]\
| where Origin == \'vm.azm.ms\' and (Namespace == \'Network\' and Name == \'ReadBytesPerSecond\')\
$[gridDataContainsFilter]\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| summarize Val = sum(Val) by bin(TimeGenerated, 1m), ComputerId, Computer, _ResourceId\
| summarize hint.shufflekey = ComputerId Average = avg(Val), Max = max(Val), percentiles(Val, 5, 10, 50, 90, 95) by ComputerId, Computer, _ResourceId\
| project ComputerId, Computer, Average, Max, P5th = percentile_Val_5, P10th = percentile_Val_10, P50th = percentile_Val_50, P90th = percentile_Val_90, P95th = percentile_Val_95, ResourceId = _ResourceId\
| order by $[orderByColumnName] $[sortDirection], Computer\
| limit maxResultCount);\
let computerList = summaryPerComputer\
| summarize by ComputerId, Computer;\
$[nodeIdentityAndPropsSubquery]\
let trend = InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
| where Origin == \'vm.azm.ms\' and (Namespace == \'Network\' and Name == \'ReadBytesPerSecond\')\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| where ComputerId in (computerList)\
| summarize Val = sum(Val) by bin(TimeGenerated, 1m), ComputerId, Computer, _ResourceId\
| summarize hint.shufflekey = ComputerId TrendValue = $[trendExpression] by ComputerId, Computer, bin(TimeGenerated, trendBinSize)\
| project ComputerId, Computer, TrendPoint = pack(\'TimeGenerated\', TimeGenerated, \'TrendValue\', TrendValue)\
| summarize hint.shufflekey = ComputerId makelist(TrendPoint) by ComputerId, Computer;\
summaryPerComputer\
| join ( trend ) on ComputerId\
| join ( NodeIdentityAndProps ) on ComputerId\
| project NodeId, NodeProps, Average, P5th, P10th, P50th, P90th, P95th, Max, list_TrendPoint, Computer, UseRelativeScale = false, ResourceId';

    public static TopByNetworkSendUsingInsightsMetrics: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let trendBinSize = $[trendBinSize];\
let maxResultCount = $[maxResultCount];\
$[groupDefinition]\
let summaryPerComputer = materialize(InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
$[groupFilter]\
| where Origin == \'vm.azm.ms\' and (Namespace == \'Network\' and Name == \'WriteBytesPerSecond\')\
$[gridDataContainsFilter]\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| summarize Val = sum(Val) by bin(TimeGenerated, 1m), ComputerId, Computer, _ResourceId\
| summarize hint.shufflekey = ComputerId Average = avg(Val), Max = max(Val), percentiles(Val, 5, 10, 50, 90, 95) by ComputerId, Computer, _ResourceId\
| project ComputerId, Computer, Average, Max, P5th = percentile_Val_5, P10th = percentile_Val_10, P50th = percentile_Val_50, P90th = percentile_Val_90, P95th = percentile_Val_95, ResourceId = _ResourceId\
| order by $[orderByColumnName] $[sortDirection], Computer\
| limit maxResultCount);\
let computerList = summaryPerComputer\
| summarize by ComputerId, Computer;\
$[nodeIdentityAndPropsSubquery]\
let trend = InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
| where Origin == \'vm.azm.ms\' and (Namespace == \'Network\' and Name == \'WriteBytesPerSecond\')\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| where ComputerId in (computerList)\
| summarize Val = sum(Val) by bin(TimeGenerated, 1m), ComputerId, Computer, _ResourceId\
| summarize hint.shufflekey = ComputerId TrendValue = $[trendExpression] by ComputerId, Computer, bin(TimeGenerated, trendBinSize)\
| project ComputerId, Computer, TrendPoint = pack(\'TimeGenerated\', TimeGenerated, \'TrendValue\', TrendValue)\
| summarize hint.shufflekey = ComputerId makelist(TrendPoint) by ComputerId, Computer;\
summaryPerComputer\
| join ( trend ) on ComputerId\
| join ( NodeIdentityAndProps ) on ComputerId\
| project NodeId, NodeProps, Average, P5th, P10th, P50th, P90th, P95th, Max, list_TrendPoint, Computer, UseRelativeScale = false, ResourceId';

    //
    // A query that returns Azure identity properties and Azure-aware compute node id.
    // Used as a subquery in metric queries
    //
    // TODO: refer 4563861 right now we used ServiceMapComputer_CL to determined resource type
    // after oms agent fix, based on perf table resource id, we can distinct the vm scale set and vm. 
    // in this case: we can file onboarding page for these two types.
    public static NodeIdentityAndProps =
        'let EmptyNodeIdentityAndProps = datatable(ComputerId: string, Computer:string, NodeId:string, NodeProps:dynamic, Priority: long) [];\
        let OmsNodeIdentityAndProps = computerList\
        | extend NodeId = ComputerId\
        | extend Priority = 1\
        | extend NodeProps = pack(\'type\', \'StandAloneNode\', \'name\', Computer);\
        let ServiceMapNodeIdentityAndProps = ServiceMapComputer_CL\
        | where TimeGenerated >= startDateTime\
        | where TimeGenerated < endDateTime\
        | extend tempComputerId=iff(isempty(_ResourceId), Computer, _ResourceId) $[extendedLaResourceId]\
        | where tempComputerId in~ (computerList) $[laResourceIdFilter]\
        | summarize arg_max(TimeGenerated, *) by ResourceName_s\
        | extend\
                  AzureCloudServiceNodeIdentity = iif(isnotempty(columnifexists(\'AzureCloudServiceName_s\', \'\')),\
                      strcat(columnifexists(\'AzureCloudServiceInstanceId_s\', \'\'), \'|\',\
                             columnifexists(\'AzureCloudServiceDeployment_g\', \'\')), \'\'),\
                  AzureScaleSetNodeIdentity = iif(isnotempty(columnifexists(\'AzureVmScaleSetName_s\', \'\')),\
                      strcat(columnifexists(\'AzureVmScaleSetInstanceId_s\', \'\'), \'|\',\
                             columnifexists(\'AzureVmScaleSetDeployment_g\', \'\')), \'\'),\
                  ComputerProps =\
                      pack(\'type\', \'StandAloneNode\',\
                           \'name\', DisplayName_s,\
                           \'mappingResourceId\', ResourceId,\
                           \'subscriptionId\', AzureSubscriptionId_g,\
                           \'resourceGroup\', AzureResourceGroup_s,\
                           \'azureResourceId\', columnifexists(\'AzureResourceId_s\', \'\')),\
                  AzureCloudServiceNodeProps =\
                      pack(\'type\', \'AzureCloudServiceNode\',\
                           \'cloudServiceInstanceId\', columnifexists(\'AzureCloudServiceInstanceId_s\', \'\'),\
                           \'cloudServiceRoleName\', columnifexists(\'AzureCloudServiceRoleName_s\', \'\'),\
                           \'cloudServiceDeploymentId\', columnifexists(\'AzureCloudServiceDeployment_g\', \'\'),\
                           \'fullDisplayName\', columnifexists(\'FullDisplayName_s\', \'\'),\
                           \'cloudServiceName\', columnifexists(\'AzureCloudServiceName_s\', \'\'),\
                           \'mappingResourceId\', ResourceId),\
                  AzureScaleSetNodeProps = \
                      pack(\'type\', \'AzureScaleSetNode\',\
                           \'scaleSetInstanceId\', columnifexists(\'AzureName_s\', \'\'),\
                           \'vmScaleSetDeploymentId\', columnifexists(\'AzureVmScaleSetDeployment_g\', \'\'),\
                           \'vmScaleSetName\', columnifexists(\'AzureVmScaleSetName_s\', \'\'),\
                           \'serviceFabricClusterName\', columnifexists(\'AzureServiceFabricClusterName_s\', \'\'),\
                           \'vmScaleSetResourceId\', columnifexists(\'AzureVmScaleSetResourceId_s\', \'\'),\
                           \'resourceGroupName\', columnifexists(\'AzureResourceGroup_s\', \'\'),\
                           \'subscriptionId\', columnifexists(\'AzureSubscriptionId_g\', \'\'),\
                           \'fullDisplayName\', columnifexists(\'FullDisplayName_s\', \'\'),\
                           \'mappingResourceId\', ResourceId)\
        | project   ComputerId,\
                    Computer,\
                    NodeId = case(isnotempty(AzureCloudServiceNodeIdentity), AzureCloudServiceNodeIdentity,\
                               isnotempty(AzureScaleSetNodeIdentity), AzureScaleSetNodeIdentity, Computer),\
                    NodeProps = case(isnotempty(AzureCloudServiceNodeIdentity), AzureCloudServiceNodeProps,\
                                  isnotempty(AzureScaleSetNodeIdentity), AzureScaleSetNodeProps, ComputerProps),\
                    Priority = 2;\
        let NodeIdentityAndProps = union kind=inner isfuzzy = true\
                                          EmptyNodeIdentityAndProps, OmsNodeIdentityAndProps, ServiceMapNodeIdentityAndProps\
                                    | summarize arg_max(Priority, *) by ComputerId;';

    // tslint:disable:max-line-length 
    // TODO: default MaxListSize of makelist construct is 128 and this is not good enough for us with 5min granaluarity in 12hr timewindow
    // We need to compute MaxListSize in the code based on the time granularity and passed to the query when we support lower granularity i.e. 1min
    // for now using MaxListSize as 1000 which is supported max list size
    public static Chart: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
        let endDateTime = datetime(\'$[endDateTime]\');\
        let trendBinSize = $[trendBinSize];\
        let MaxListSize = 1000;\
        $[groupDefinition]\
        let cpuMemoryDisk = Perf\
        | where TimeGenerated >= startDateTime\
        | where TimeGenerated < endDateTime $[groupFilter]\
        | where    (ObjectName == \'Processor\' and InstanceName == \'_Total\' and CounterName == \'% Processor Time\') or\
                   (ObjectName == \'Memory\' and CounterName in ( \'Available MBytes Memory\', \'Available MBytes\')) or \
                   (ObjectName == \'LogicalDisk\' and InstanceName != \'_Total\' and CounterName == \'% Free Space\') or\
                   (ObjectName == \'Logical Disk\' and InstanceName != \'_Total\' and CounterName == \'% Used Space\') \
        | project  TimeGenerated,\
                   cName = case(ObjectName == \'LogicalDisk\' and CounterName == \'% Free Space\', \'% Used Space\',\
                               ObjectName == \'Memory\' and CounterName == \'Available MBytes Memory\', \'Available MBytes\',\
                               CounterName),\
                   cValue = case(ObjectName == \'LogicalDisk\' and CounterName == \'% Free Space\', 100 - CounterValue,\
                               CounterValue < 0, real(0),\
                               CounterValue);\
        let linuxNetwork = Perf\
           | where TimeGenerated >= startDateTime\
           | where TimeGenerated < endDateTime $[groupFilter]\
           | where ObjectName == \'Network\' and CounterName in (\'Total Bytes Transmitted\' , \'Total Bytes Received\')\
           | extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
           | order by CounterName asc, InstanceName, ComputerId asc, TimeGenerated asc \
           | extend prev_ComputerId=prev(ComputerId), prev_Value=prev(CounterValue), prev_t=prev(TimeGenerated), prev_counter=prev(CounterName), prev_instance=prev(InstanceName) \
           | project   TimeGenerated,\
                       cName = iff(CounterName==\'Total Bytes Transmitted\',\'Bytes Sent/sec\',\'Bytes Received/sec\'), \
                       cValue = iff(prev_ComputerId == ComputerId and prev_instance == InstanceName and prev_counter == CounterName and CounterValue >= prev_Value and TimeGenerated > prev_t, (CounterValue-prev_Value)/((TimeGenerated-prev_t)/1s), real(0))\
           | summarize cValue = sum(cValue) by cName, bin(TimeGenerated, 2s);\
        let windowsNetwork = Perf\
               | where TimeGenerated >= startDateTime\
               | where TimeGenerated < endDateTime $[groupFilter]\
               | where ObjectName == \'Network Adapter\' and CounterName in ( \'Bytes Sent/sec\' , \'Bytes Received/sec\')\
               | extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
               | summarize CounterValue = sum(CounterValue) by ComputerId, CounterName, bin(TimeGenerated, 2s)\
               | project TimeGenerated, cName = CounterName, cValue = CounterValue;\
       let rawData = (\
                       (cpuMemoryDisk)\
                       | union (windowsNetwork)\
                       | union (linuxNetwork)\
                   );\
       rawData\
        | fork\
           (summarize min(cValue), avg(cValue), max(cValue), percentiles(cValue, 5, 10, 50, 90, 95) by cName | order by cName)\
           (summarize min(cValue), avg(cValue), max(cValue), percentiles(cValue, 5, 10, 50, 90, 95) by bin(TimeGenerated, trendBinSize), cName\
               | sort by TimeGenerated asc\
               | summarize makelist(TimeGenerated, MaxListSize), makelist(min_cValue, MaxListSize), makelist(avg_cValue, MaxListSize), makelist(max_cValue, MaxListSize), makelist(percentile_cValue_5, MaxListSize), makelist(percentile_cValue_10, MaxListSize), makelist(percentile_cValue_50, MaxListSize), makelist(percentile_cValue_90, MaxListSize), makelist(percentile_cValue_95, MaxListSize) by cName | order by cName)';

    public static AtScaleAggregateChartUsingInsightsMetrics: string = 
    'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let trendBinSize = $[trendBinSize];\
let MaxListSize = 1000;\
$[groupDefinition]\
let cpuMemory = InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
| where Origin == \'vm.azm.ms\'\
| where (Namespace == \'Processor\' and Name == \'UtilizationPercentage\') or (Namespace == \'Memory\' and Name == \'AvailableMB\')\
$[groupFilter]\
| project TimeGenerated, Name, Namespace, Val;\
let disk = InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
| where Origin == \'vm.azm.ms\' and (Namespace == \'LogicalDisk\' and Name == \'FreeSpaceMB\')\
$[groupFilter]\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| extend Tags = todynamic(Tags)\
| extend Total = todouble(Tags[\'vm.azm.ms/diskSizeMB\'])\
| summarize Val = sum(Val), Total = sum(Total)  by bin(TimeGenerated, 1m), ComputerId, Name, Namespace\
| extend Val = (100.0 - (Val * 100.0)/Total)\
| project TimeGenerated, Name, Namespace, Val;\
let network = InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
| where Origin == \'vm.azm.ms\' and Namespace == \'Network\' and Name in (\'WriteBytesPerSecond\', \'ReadBytesPerSecond\')\
$[groupFilter]\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| summarize Val = sum(Val) by bin(TimeGenerated, 1m), ComputerId, Name, Namespace\
| project TimeGenerated, Name, Namespace, Val;\
let rawdatacached = cpuMemory\
| union disk\
| union network\
| project TimeGenerated,\
cName = case(\
Namespace == \'Processor\' and Name == \'UtilizationPercentage\', \'% Processor Time\',\
Namespace == \'Memory\' and Name == \'AvailableMB\', \'Available MBytes\',\
Namespace == \'LogicalDisk\' and Name == \'FreeSpaceMB\', \'% Used Space\',\
Namespace == \'Network\' and Name == \'WriteBytesPerSecond\', \'Bytes Sent/sec\',\
Namespace == \'Network\' and Name == \'ReadBytesPerSecond\', \'Bytes Received/sec\',\
Name\
),\
cValue = case(Val < 0, real(0),Val);\
rawdatacached\
| fork\
    (summarize min(cValue), avg(cValue), max(cValue), percentiles(cValue, 5, 10, 50, 90, 95) by cName| order by cName)\
    (summarize min(cValue), avg(cValue), max(cValue), percentiles(cValue, 5, 10, 50, 90, 95) by bin(TimeGenerated, trendBinSize), cName\
| sort by TimeGenerated asc\
| summarize makelist(TimeGenerated, MaxListSize), makelist(min_cValue, MaxListSize), makelist(avg_cValue, MaxListSize), makelist(max_cValue, MaxListSize), makelist(percentile_cValue_5, MaxListSize), makelist(percentile_cValue_10, MaxListSize), makelist(percentile_cValue_50, MaxListSize), makelist(percentile_cValue_90, MaxListSize), makelist(percentile_cValue_95, MaxListSize) by cName\
| order by cName)';

    // This query finds the top 5 Computers with based on P95 Cpu utilization over the time window
    // And returns avg values for each bin
    public static TopNCpuChart: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let trendBinSize = $[trendBinSize];\
let MaxListSize = 1000;\
$[groupDefinition]\
let cpuSummary=totable(Perf\
| where TimeGenerated >= startDateTime\
| where TimeGenerated < endDateTime $[groupFilter]\
| where (ObjectName == \'Processor\' and InstanceName == \'_Total\' and CounterName == \'% Processor Time\')\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| summarize hint.shufflekey=ComputerId score= $[topNSeriesSelectorFilter] by ComputerId, Computer, CounterName\
| top 5 by score);\
let computerList=(cpuSummary | project ComputerId, Computer);\
$[nodeIdentityAndPropsSubquery]\
cpuSummary\
| join (Perf\
| where TimeGenerated >= startDateTime\
| where TimeGenerated < endDateTime\
| where (ObjectName == \'Processor\' and InstanceName == \'_Total\' and CounterName == \'% Processor Time\')\
| extend ComputerId=iff(isempty(_ResourceId), Computer, _ResourceId)\
| where ComputerId in (computerList)\
| summarize value = $[topNSeriesSelectorFilter] by bin(TimeGenerated, trendBinSize), ComputerId\
| sort by TimeGenerated asc\
| summarize makelist(TimeGenerated, MaxListSize), list_value=makelist(value, MaxListSize) by ComputerId) on ComputerId\
| join (NodeIdentityAndProps) on ComputerId\
| project CounterName, NodeId, NodeProps, score, list_TimeGenerated, list_value\
| order by score desc;';

    // This query finds the top 5 Computers with based on P95 Available over the time window
    // And returns avg values for each bin
    // Memory returns 'asc' as we are interested in computers which have low available memory
    public static TopNMemoryChart: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let trendBinSize = $[trendBinSize];\
let MaxListSize = 1000;\
$[groupDefinition]\
let memorySummary=totable(Perf\
| where TimeGenerated >= startDateTime\
| where TimeGenerated < endDateTime $[groupFilter]\
| where ObjectName == \'Memory\' and CounterName in (\'Available MBytes\', \'Available MBytes Memory\')\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| summarize hint.shufflekey=ComputerId score= $[topNSeriesSelectorFilter] by ComputerId, Computer, CounterName\
| top 5 by score asc);\
let computerList=(memorySummary | project ComputerId, Computer);\
$[nodeIdentityAndPropsSubquery]\
memorySummary\
| join (Perf\
| where TimeGenerated >= startDateTime\
| where TimeGenerated < endDateTime\
| where ObjectName == \'Memory\' and CounterName in (\'Available MBytes\', \'Available MBytes Memory\')\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| where ComputerId in (computerList)\
| summarize value = $[topNSeriesSelectorFilter] by bin(TimeGenerated, trendBinSize), ComputerId\
| sort by TimeGenerated asc\
| summarize makelist(TimeGenerated, MaxListSize), list_value=makelist(value, MaxListSize) by ComputerId) on ComputerId\
| join (NodeIdentityAndProps) on ComputerId\
| project CounterName=\'Available MBytes\', NodeId, NodeProps, score, list_TimeGenerated, list_value\
| order by score asc;';

    // This query finds the top 5 Computers with based on P95 Bytes Sent over the time window
    // And returns avg values for each bin
    public static TopNBytesSentChart: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let trendBinSize = $[trendBinSize];\
let MaxListSize = 1000;\
$[groupDefinition]\
let linuxNetworkSend=Perf \
| where TimeGenerated >= startDateTime\
| where TimeGenerated < endDateTime $[groupFilter]\
| where ObjectName == \'Network\' and CounterName == \'Total Bytes Transmitted\'\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| order by CounterName asc, InstanceName, ComputerId asc, TimeGenerated asc\
| extend prev_ComputerId=prev(ComputerId), prev_Value=prev(CounterValue), prev_t=prev(TimeGenerated), prev_counter=prev(CounterName), prev_instance=prev(InstanceName)\
| project   TimeGenerated,\
            ComputerId,\
            Computer,\
            CounterValue = iff(prev_ComputerId == ComputerId and prev_instance == InstanceName and prev_counter == CounterName and CounterValue >= prev_Value and TimeGenerated > prev_t, (CounterValue-prev_Value)/((TimeGenerated-prev_t)/1s), real(0))\
| summarize hint.shufflekey=ComputerId CounterValue = sum(CounterValue) by ComputerId, Computer, bin(TimeGenerated, 2s);\
let windowsNetworkSend = Perf \
| where TimeGenerated >= startDateTime\
| where TimeGenerated < endDateTime $[groupFilter]\
| where ObjectName == \'Network Adapter\' and CounterName == \'Bytes Sent/sec\'\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| summarize hint.shufflekey=ComputerId CounterValue = sum(CounterValue) by ComputerId, Computer, bin(TimeGenerated, 2s);\
let networkDataSend = union linuxNetworkSend, windowsNetworkSend;\
let networkSendSummary = totable(networkDataSend\
| where TimeGenerated >= startDateTime\
| where TimeGenerated < endDateTime\
| summarize hint.shufflekey=ComputerId score= $[topNSeriesSelectorFilter] by ComputerId, Computer\
| top 5 by score);\
let computerList=(networkSendSummary | project ComputerId, Computer);\
$[nodeIdentityAndPropsSubquery]\
networkSendSummary\
| join (networkDataSend\
| where ComputerId in (computerList)\
| summarize value = $[topNSeriesSelectorFilter] by bin(TimeGenerated, trendBinSize), ComputerId\
| sort by TimeGenerated asc\
| summarize makelist(TimeGenerated, MaxListSize), list_value=makelist(value, MaxListSize) by ComputerId) on ComputerId\
| join (NodeIdentityAndProps) on ComputerId\
| project CounterName = \'Bytes Sent/sec\', NodeId, NodeProps, score, list_TimeGenerated, list_value\
| order by score desc;';

    // This query finds the top 5 Computers with based on P95 Bytes Received over the time window
    // And returns avg values for each bin
    public static TopNBytesReceivedChart: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let trendBinSize = $[trendBinSize];\
let MaxListSize = 1000;\
$[groupDefinition]\
let linuxNetworkReceive=Perf \
| where TimeGenerated >= startDateTime\
| where TimeGenerated < endDateTime $[groupFilter]\
| where ObjectName == \'Network\' and CounterName == \'Total Bytes Received\'\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| order by CounterName asc, InstanceName, ComputerId asc, TimeGenerated asc\
| extend prev_ComputerId=prev(ComputerId), prev_Value=prev(CounterValue), prev_t=prev(TimeGenerated), prev_counter=prev(CounterName), prev_instance=prev(InstanceName)\
| project   TimeGenerated,\
            ComputerId,\
            Computer,\
            CounterValue = iff(prev_ComputerId == ComputerId and prev_instance == InstanceName and prev_counter == CounterName and CounterValue >= prev_Value and TimeGenerated > prev_t, (CounterValue-prev_Value)/((TimeGenerated-prev_t)/1s), real(0))\
| summarize hint.shufflekey=ComputerId CounterValue = sum(CounterValue) by ComputerId, Computer, bin(TimeGenerated, 2s);\
let windowsNetworkReceive=Perf \
| where TimeGenerated >= startDateTime\
| where TimeGenerated < endDateTime $[groupFilter]\
| where ObjectName == \'Network Adapter\' and CounterName == \'Bytes Received/sec\'\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| summarize hint.shufflekey=ComputerId CounterValue = sum(CounterValue) by ComputerId, Computer, bin(TimeGenerated, 2s);\
let networkDataReceive = union linuxNetworkReceive, windowsNetworkReceive;\
let networkReceiveSummary=totable(networkDataReceive\
| where TimeGenerated >= startDateTime\
| where TimeGenerated < endDateTime \
| summarize hint.shufflekey=ComputerId score= $[topNSeriesSelectorFilter] by ComputerId, Computer\
| top 5 by score);\
let computerList=(networkReceiveSummary | project ComputerId, Computer);\
$[nodeIdentityAndPropsSubquery]\
networkReceiveSummary\
| join (networkDataReceive\
    | where ComputerId in (computerList)\
    | summarize value = $[topNSeriesSelectorFilter] by bin(TimeGenerated, trendBinSize), ComputerId\
    | sort by TimeGenerated asc\
    | summarize makelist(TimeGenerated, MaxListSize), list_value=makelist(value, MaxListSize) by ComputerId) on ComputerId\
| join (NodeIdentityAndProps) on ComputerId\
| project CounterName = \'Bytes Received/sec\', NodeId, NodeProps, score, list_TimeGenerated, list_value\
| order by score desc;';

    // This query finds the top 5 Computers with based on Avg Disk Used over the time window
    public static TopNDiskUsedChart: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
        let endDateTime = datetime(\'$[endDateTime]\');\
        let trendBinSize = $[trendBinSize];\
        let MaxListSize = 1000;\
        $[groupDefinition]\
        let diskSummary=totable(Perf\
        | where TimeGenerated >= startDateTime\
        | where TimeGenerated < endDateTime $[groupFilter]\
        | where (ObjectName == \'LogicalDisk\' and InstanceName != \'_Total\' and CounterName in (\'% Free Space\')) or\
                (ObjectName == \'Logical Disk\' and InstanceName != \'_Total\' and CounterName in (\'% Used Space\'))\
        | project TimeGenerated, \
            ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId),\
            Computer,\
            CounterName = \'% Used Space\',\
            CounterValue = case(ObjectName == \'LogicalDisk\' and CounterName == \'% Free Space\', 100 - CounterValue,\
                        CounterValue < 0, real(0),\
                        CounterValue)\
        | summarize hint.shufflekey=ComputerId score= $[topNSeriesSelectorFilter] by ComputerId, Computer, CounterName\
        | top 5 by score);\
        let computerList=(diskSummary | project ComputerId, Computer);\
        $[nodeIdentityAndPropsSubquery]\
        diskSummary\
        | join (Perf\
            | where TimeGenerated >= startDateTime\
            | where TimeGenerated < endDateTime\
            | where (ObjectName == \'LogicalDisk\' and InstanceName != \'_Total\' and CounterName in (\'% Free Space\')) or\
                (ObjectName == \'Logical Disk\' and InstanceName != \'_Total\' and CounterName in (\'% Used Space\'))\
            | extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
            | where ComputerId in (computerList)\
            | project TimeGenerated,\
                ComputerId,\
                CounterName = \'% Used Space\',\
                CounterValue = case(ObjectName == \'LogicalDisk\' and CounterName == \'% Free Space\', 100 - CounterValue,\
                        CounterValue < 0, real(0),\
                        CounterValue)\
            | summarize value = $[topNSeriesSelectorFilter] by bin(TimeGenerated, trendBinSize), ComputerId\
            | sort by TimeGenerated asc\
            | summarize makelist(TimeGenerated, MaxListSize), list_value=makelist(value, MaxListSize) by ComputerId) on ComputerId\
        | join (NodeIdentityAndProps) on ComputerId\
        | project CounterName, NodeId, NodeProps, score, list_TimeGenerated, list_value\
        | order by score desc;';

    public static TopNCpuChartUsingInsightsMetrics: string = 
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let trendBinSize = $[trendBinSize];\
let MaxListSize = 1000;\
$[groupDefinition]\
let summary = materialize(InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
$[groupFilter]\
| where Origin == \'vm.azm.ms\' and (Namespace == \'Processor\' and Name == \'UtilizationPercentage\')\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| summarize hint.shufflekey=ComputerId score= $[topNSeriesSelectorFilter] by ComputerId, Computer\
| top 5 by score);\
let computerList=(summary\
| project ComputerId, Computer);\
$[nodeIdentityAndPropsSubquery]\
summary\
| join (InsightsMetrics\
    | where TimeGenerated between (startDateTime .. endDateTime)\
    | where Origin == \'vm.azm.ms\' and (Namespace == \'Processor\' and Name == \'UtilizationPercentage\')\
    | extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
    | where ComputerId in (computerList)\
    | summarize value = $[topNSeriesSelectorFilter] by bin(TimeGenerated, trendBinSize), ComputerId\
    | sort by TimeGenerated asc\
    | summarize makelist(TimeGenerated, MaxListSize), list_value=makelist(value, MaxListSize) by ComputerId) on ComputerId\
| join (NodeIdentityAndProps) on ComputerId\
| project CounterName = \'% Processor Time\', NodeId, NodeProps, score, list_TimeGenerated, list_value\
| order by score desc;';

    public static TopNMemoryChartUsingInsightsMetrics: string = 
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let trendBinSize = $[trendBinSize];\
let MaxListSize = 1000;\
$[groupDefinition]\
let summary = materialize(InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
$[groupFilter]\
| where Origin == \'vm.azm.ms\' and (Namespace == \'Memory\' and Name == \'AvailableMB\')\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| summarize hint.shufflekey=ComputerId score= $[topNSeriesSelectorFilter] by ComputerId, Computer\
| top 5 by score);\
let computerList=(summary\
| project ComputerId, Computer);\
$[nodeIdentityAndPropsSubquery]\
summary\
| join (InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
| where Origin == \'vm.azm.ms\' and (Namespace == \'Memory\' and Name == \'AvailableMB\')\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| where ComputerId in (computerList)\
| summarize value = $[topNSeriesSelectorFilter] by bin(TimeGenerated, trendBinSize), ComputerId\
| sort by TimeGenerated asc\
| summarize makelist(TimeGenerated, MaxListSize), list_value=makelist(value, MaxListSize) by ComputerId) on ComputerId\
| join (NodeIdentityAndProps) on ComputerId\
| project CounterName = \'Available MBytes\', NodeId, NodeProps, score, list_TimeGenerated, list_value\
| order by score desc;';

    public static TopNBytesSentChartUsingInsightsMetrics: string = 
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let trendBinSize = $[trendBinSize];\
let MaxListSize = 1000;\
$[groupDefinition]\
let summary = materialize(InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
$[groupFilter]\
| where Origin == \'vm.azm.ms\' and (Namespace == \'Network\' and Name == \'WriteBytesPerSecond\')\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| summarize Val = sum(Val) by bin(TimeGenerated, 1m), ComputerId, Computer\
| summarize hint.shufflekey=ComputerId score= $[topNSeriesSelectorFilter] by ComputerId, Computer\
| top 5 by score);\
let computerList=(summary\
| project ComputerId, Computer);\
$[nodeIdentityAndPropsSubquery]\
summary\
| join (InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
| where Origin == \'vm.azm.ms\' and (Namespace == \'Network\' and Name == \'WriteBytesPerSecond\')\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| where ComputerId in (computerList)\
| summarize Val = sum(Val) by bin(TimeGenerated, 1m), ComputerId, Computer\
| summarize value = $[topNSeriesSelectorFilter] by bin(TimeGenerated, trendBinSize), ComputerId\
| sort by TimeGenerated asc\
| summarize makelist(TimeGenerated, MaxListSize), list_value=makelist(value, MaxListSize) by ComputerId) on ComputerId\
| join (NodeIdentityAndProps) on ComputerId\
| project CounterName = \'Bytes Sent/sec\', NodeId, NodeProps, score, list_TimeGenerated, list_value\
| order by score desc;';

    public static TopNBytesReceivedChartUsingInsightsMetrics: string = 
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let trendBinSize = $[trendBinSize];\
let MaxListSize = 1000;\
$[groupDefinition]\
let summary = materialize(InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
$[groupFilter]\
| where Origin == \'vm.azm.ms\' and (Namespace == \'Network\' and Name == \'ReadBytesPerSecond\')\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| summarize Val = sum(Val) by bin(TimeGenerated, 1m), ComputerId, Computer\
| summarize hint.shufflekey=ComputerId score= $[topNSeriesSelectorFilter] by ComputerId, Computer\
| top 5 by score);\
let computerList=(summary\
| project ComputerId, Computer);\
$[nodeIdentityAndPropsSubquery]\
summary\
| join (InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
| where Origin == \'vm.azm.ms\' and (Namespace == \'Network\' and Name == \'ReadBytesPerSecond\')\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| where ComputerId in (computerList)\
| summarize Val = sum(Val) by bin(TimeGenerated, 1m), ComputerId, Computer\
| summarize value = $[topNSeriesSelectorFilter] by bin(TimeGenerated, trendBinSize), ComputerId\
| sort by TimeGenerated asc\
| summarize makelist(TimeGenerated, MaxListSize), list_value=makelist(value, MaxListSize) by ComputerId) on ComputerId\
| join (NodeIdentityAndProps) on ComputerId\
| project CounterName = \'Bytes Received/sec\', NodeId, NodeProps, score, list_TimeGenerated, list_value\
| order by score desc;';

    public static TopNDiskUsedChartUsingInsightsMetrics: string = 
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let trendBinSize = $[trendBinSize];\
let MaxListSize = 1000;\
$[groupDefinition]\
let summary = materialize(InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
$[groupFilter]\
| where Origin == \'vm.azm.ms\' and (Namespace == \'LogicalDisk\' and Name == \'FreeSpaceMB\')\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| extend Tags = todynamic(Tags)\
| extend Total = todouble(Tags[\'vm.azm.ms/diskSizeMB\'])\
| summarize Val = sum(Val), Total = sum(Total)  by bin(TimeGenerated, 1m), ComputerId, Computer, _ResourceId\
| extend Val = (100.0 - (Val * 100.0)/Total)\
| summarize hint.shufflekey=ComputerId score= $[topNSeriesSelectorFilter] by ComputerId, Computer\
| top 5 by score);\
let computerList=(summary\
| project ComputerId, Computer);\
$[nodeIdentityAndPropsSubquery]\
summary\
| join (InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
| where Origin == \'vm.azm.ms\' and (Namespace == \'LogicalDisk\' and Name == \'FreeSpaceMB\')\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| where ComputerId in (computerList)\
| extend Tags = todynamic(Tags)\
| extend Total = todouble(Tags[\'vm.azm.ms/diskSizeMB\'])\
| summarize Val = sum(Val), Total = sum(Total)  by bin(TimeGenerated, 1m), ComputerId, Computer, _ResourceId\
| extend Val = (100.0 - (Val * 100.0)/Total)\
| summarize value = $[topNSeriesSelectorFilter] by bin(TimeGenerated, trendBinSize), ComputerId\
| sort by TimeGenerated asc\
| summarize makelist(TimeGenerated, MaxListSize), list_value=makelist(value, MaxListSize) by ComputerId) on ComputerId\
| join (NodeIdentityAndProps) on ComputerId\
| project CounterName = \'% Used Space\', NodeId, NodeProps, score, list_TimeGenerated, list_value\
| order by score desc;';

    // This query finds disk related metric data for a single VM idenfied by 'Computer' column
    public static SingleVMDiskMetrics: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let data=materialize(Perf \
$[resourceFilter] \
| where TimeGenerated >= startDateTime \
| where TimeGenerated < endDateTime \
| where ObjectName in (\'LogicalDisk\', \'Logical Disk\')\
| where CounterName in (\'Disk Reads/sec\', \'Disk Writes/sec\', \'Disk Transfers/sec\', \'Disk Read Bytes/sec\', \'Disk Write Bytes/sec\', \'Disk Bytes/sec\', \'Logical Disk Bytes/sec\', \'Avg. Disk sec/Read\', \'Avg. Disk sec/Write\', \'Avg. Disk sec/Transfer\', \'Free Megabytes\', \'% Free Space\') or (ObjectName == \'Logical Disk\' and CounterName == \'% Used Space\')\
| project TimeGenerated,\
            InstanceName,\
            CounterName = case(ObjectName == \'Logical Disk\' and CounterName == \'% Used Space\', \'% Free Space\', ObjectName == \'Logical Disk\' and CounterName == \'Logical Disk Bytes/sec\', \'Disk Bytes/sec\', CounterName),\
            CounterValue = case(ObjectName == \'Logical Disk\' and CounterName == \'% Used Space\', 100 - CounterValue, CounterValue < 0, real(0), CounterValue));\
let free=data\
| where CounterName in (\'Free Megabytes\', \'% Free Space\')\
| summarize arg_max(TimeGenerated, CounterValue) by CounterName, InstanceName\
| summarize FreeGB=sumif(CounterValue/1024.0, CounterName == \'Free Megabytes\'), \
            FreePercent = sumif(CounterValue, CounterName == \'% Free Space\') by InstanceName\
| extend DiskSizeGB = FreeGB*(100.0/FreePercent), UsedGB=((100.0-FreePercent)/FreePercent)*FreeGB\
| project InstanceName, DiskSizeGB, UsedGB;\
let rawCounters=data\
| where CounterName in (\'Disk Reads/sec\', \'Disk Writes/sec\', \'Disk Transfers/sec\', \'Disk Read Bytes/sec\', \'Disk Write Bytes/sec\', \'Disk Bytes/sec\', \'Avg. Disk sec/Read\', \'Avg. Disk sec/Write\', \'Avg. Disk sec/Transfer\');\
rawCounters \
| summarize P95=percentile(CounterValue, 95), Count=count() by InstanceName, CounterName\
| summarize P95IOPsRead=sumif(P95, CounterName == \'Disk Reads/sec\'),\
            P95IOPsWrite=sumif(P95, CounterName == \'Disk Writes/sec\'),\
            P95IOPsTransfer=sumif(P95, CounterName == \'Disk Transfers/sec\'),\
            P95RateMBRead=sumif(P95/(1024*1024), CounterName == \'Disk Read Bytes/sec\'),\
            P95RateMBWrite=sumif(P95/(1024*1024), CounterName == \'Disk Write Bytes/sec\'),\
            P95RateMBTransfer=sumif(P95/(1024*1024), CounterName == \'Disk Bytes/sec\'),\
            P95LatencyRead=sumif(P95, CounterName == \'Avg. Disk sec/Read\'),\
            P95LatencyWrite=sumif(P95, CounterName == \'Avg. Disk sec/Write\'),\
            P95LatencyTransfer=sumif(P95, CounterName == \'Avg. Disk sec/Transfer\'),\
            LatencyCounterCount=sumif(Count, CounterName == \'Avg. Disk sec/Read\' or CounterName == \'Avg. Disk sec/Write\' or CounterName == \'Avg. Disk sec/Transfer\') by InstanceName\
| join free on InstanceName\
| project InstanceName, DiskSizeGB, UsedGB, P95IOPsRead, P95IOPsWrite, P95IOPsTransfer, P95RateMBRead, P95RateMBWrite, P95RateMBTransfer, P95LatencyRead, P95LatencyWrite, P95LatencyTransfer, LatencyCounterCount';

    // A comment regarding the line below:
    //  | summarize cValue = sum(cValue) by cName, bin(TimeGenerated, 2s); 
    // The data coming back for one counter has repeated entries like:
    //    2018-08-19T23:00:50.673 Bytes Received/sec 0
    //    2018-08-19T23:00:50.673 Bytes Received/sec 0
    //    2018-08-19T23:00:50.673 Bytes Received/sec 5,775.31982
    // To remove duplicates, we summarize the data adding whatever was within a 2s period.
    // 2s was chosen because the data is gathered at a minimum of 10s appart so 2s is a safe value to get all duplicates
    public static SingleVMChart: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let trendBinSize = $[trendBinSize];\
let MaxListSize = 1000;\
let cpuMemoryDisk=Perf\
| where TimeGenerated >= startDateTime\
| where TimeGenerated < endDateTime\
$[resourceFilter] \
| where (ObjectName == \'Processor\' and InstanceName == \'_Total\' and CounterName == \'% Processor Time\') or\
    (ObjectName == \'Memory\' and CounterName in (\'Available MBytes\', \'Available MBytes Memory\')) or\
    (ObjectName == \'LogicalDisk\' and InstanceName != \'_Total\' and CounterName in (\'Disk Transfers/sec\', \'Disk Bytes/sec\', \'Avg. Disk sec/Transfer\', \'% Free Space\')) or\
    (ObjectName == \'Logical Disk\' and InstanceName != \'_Total\' and CounterName in (\'Disk Transfers/sec\', \'Logical Disk Bytes/sec\', \'% Used Space\'))\
| project TimeGenerated,\
    cName = case(ObjectName == \'Logical Disk\' and CounterName == \'Logical Disk Bytes/sec\', \'Disk Bytes/sec\',\
                ObjectName == \'LogicalDisk\' and CounterName == \'% Free Space\', \'% Used Space\',\
                ObjectName == \'Memory\' and CounterName == \'Available MBytes Memory\', \'Available MBytes\',\
                CounterName),\
    cValue = case(ObjectName == \'LogicalDisk\' and CounterName == \'% Free Space\', 100 - CounterValue,\
                CounterValue < 0, real(0),\
                CounterValue);\
  let windowsNetwork=Perf\
  | where TimeGenerated >= startDateTime\
  | where TimeGenerated < endDateTime\
  $[resourceFilter] \
  | where ObjectName == \'Network Adapter\' and CounterName in (\'Bytes Sent/sec\', \'Bytes Received/sec\')\
  | summarize CounterValue = sum(CounterValue) by CounterName, bin(TimeGenerated, 2s) \
  | project TimeGenerated, cName = CounterName, cValue = case(CounterValue < 0, real(0), CounterValue);\
  let linuxNetwork=Perf\
  | where TimeGenerated >= startDateTime\
  | where TimeGenerated < endDateTime\
  $[resourceFilter] \
  | where ObjectName == \'Network\' and CounterName in (\'Total Bytes Transmitted\', \'Total Bytes Received\')\
  | order by CounterName asc, InstanceName, TimeGenerated asc\
  | extend prev_Value=prev(CounterValue), prev_t=prev(TimeGenerated), prev_counter=prev(CounterName), prev_instance=prev(InstanceName)\
  | project TimeGenerated,\
            cName=case(CounterName==\'Total Bytes Transmitted\',\'Bytes Sent/sec\', CounterName==\'Total Bytes Received\',\'Bytes Received/sec\', CounterName),\
            cValue=iff(prev_counter==CounterName and prev_instance==InstanceName and CounterValue>=prev_Value and TimeGenerated > prev_t, (CounterValue-prev_Value)/((TimeGenerated-prev_t)/1s), real(0))\
  | summarize cValue = sum(cValue) by cName, bin(TimeGenerated, 2s);\
  let rawDataCached = materialize(\
  (cpuMemoryDisk)\
  | union (windowsNetwork)\
  | union (linuxNetwork)\
  );\
  rawDataCached\
  | summarize min(cValue), avg(cValue), max(cValue), percentiles(cValue, 5, 10, 50, 90, 95) by bin(TimeGenerated, trendBinSize), cName\
  | sort by TimeGenerated asc\
  | summarize makelist(TimeGenerated, MaxListSize), makelist(min_cValue, MaxListSize), makelist(avg_cValue, MaxListSize), makelist(max_cValue, MaxListSize), makelist(percentile_cValue_5, MaxListSize), makelist(percentile_cValue_10, MaxListSize), makelist(percentile_cValue_50, MaxListSize), makelist(percentile_cValue_90, MaxListSize), makelist(percentile_cValue_95, MaxListSize) by cName\
  | join\
  (\
      rawDataCached\
      | summarize min(cValue), avg(cValue), max(cValue), percentiles(cValue, 5, 10, 50, 90, 95) by cName\
  )\
  on cName';

    public static SingleVMDiskUsageChart: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let trendBinSize = $[trendBinSize];\
let MaxListSize = 1000;\
let rawDataCached = materialize(Perf\
    | where TimeGenerated >= startDateTime\
    | where TimeGenerated < endDateTime\
    $[resourceFilter] \
    | where\
        (ObjectName == \'Logical Disk\' and InstanceName != \'_Total\' and CounterName == \'% Used Space\') or\
        (ObjectName == \'LogicalDisk\'  and InstanceName != \'_Total\' and CounterName == \'% Free Space\')\
    | project TimeGenerated,\
              InstanceName,\
              cValue = case(CounterName == \'% Free Space\', 100 - CounterValue, CounterValue < 0, real(0), CounterValue));\
    rawDataCached\
    | summarize max(cValue) by InstanceName \
    | top 8 by max_cValue\
    | join (rawDataCached) on InstanceName\
    | summarize max(cValue), global_Max=any(max_cValue) by bin(TimeGenerated, trendBinSize), InstanceName\
    | sort by TimeGenerated asc\
    | summarize makelist(TimeGenerated, MaxListSize), list_max_cValue=makelist(max_cValue, MaxListSize), max_cValue=any(global_Max) by InstanceName';

    public static SingleVMChartUsingInsightsMetrics: string = 
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let trendBinSize = $[trendBinSize];\
let maxListSize = 1000;\
let cpuMemory = materialize(InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
$[resourceFilter]\
| where Origin == \'vm.azm.ms\'\
| where (Namespace == \'Processor\' and Name == \'UtilizationPercentage\') or (Namespace == \'Memory\' and Name == \'AvailableMB\')\
| project TimeGenerated, Name, Namespace, Val);\
let networkDisk = materialize(InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
$[resourceFilter]\
| where Origin == \'vm.azm.ms\'\
| where (Namespace == \'Network\' and Name in (\'WriteBytesPerSecond\', \'ReadBytesPerSecond\'))\
    or (Namespace == \'LogicalDisk\' and Name in (\'TransfersPerSecond\', \'BytesPerSecond\', \'TransferLatencyMs\'))\
| extend ComputerId = iff(isempty(_ResourceId), Computer, _ResourceId)\
| summarize Val = sum(Val) by bin(TimeGenerated, 1m), ComputerId, Name, Namespace\
| project TimeGenerated, Name, Namespace, Val);\
let rawDataCached = cpuMemory\
| union networkDisk\
| extend Val = iif(Name in (\'WriteLatencyMs\', \'ReadLatencyMs\', \'TransferLatencyMs\'), Val/1000.0, Val)\
| project TimeGenerated,\
    cName = case(\
        Namespace == \'Processor\' and Name == \'UtilizationPercentage\', \'% Processor Time\',\
        Namespace == \'Memory\' and Name == \'AvailableMB\', \'Available MBytes\',\
        Namespace == \'LogicalDisk\' and Name == \'TransfersPerSecond\', \'Disk Transfers/sec\',\
        Namespace == \'LogicalDisk\' and Name == \'BytesPerSecond\', \'Disk Bytes/sec\',\
        Namespace == \'LogicalDisk\' and Name == \'TransferLatencyMs\', \'Avg. Disk sec/Transfer\',\
        Namespace == \'Network\' and Name == \'WriteBytesPerSecond\', \'Bytes Sent/sec\',\
        Namespace == \'Network\' and Name == \'ReadBytesPerSecond\', \'Bytes Received/sec\',\
        Name\
    ),\
    cValue = case(Val < 0, real(0),Val);\
rawDataCached\
| summarize min(cValue),\
    avg(cValue),\
    max(cValue),\
    percentiles(cValue, 5, 10, 50, 90, 95) by bin(TimeGenerated, trendBinSize), cName\
| sort by TimeGenerated asc\
| summarize makelist(TimeGenerated, maxListSize),\
    makelist(min_cValue, maxListSize),\
    makelist(avg_cValue, maxListSize),\
    makelist(max_cValue, maxListSize),\
    makelist(percentile_cValue_5, maxListSize),\
    makelist(percentile_cValue_10, maxListSize),\
    makelist(percentile_cValue_50, maxListSize),\
    makelist(percentile_cValue_90, maxListSize),\
    makelist(percentile_cValue_95, maxListSize) by cName\
| join\
(\
    rawDataCached\
    | summarize min(cValue), avg(cValue), max(cValue), percentiles(cValue, 5, 10, 50, 90, 95) by cName\
)\
on cName';

    public static SingleVMDiskUsageChartUsingInsightsMetrics: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let trendBinSize = $[trendBinSize];\
let maxListSize = 1000;\
let rawDataCached = materialize(InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
| where Origin == \'vm.azm.ms\'\
$[resourceFilter]\
| where (Namespace == \'LogicalDisk\' and Name == \'FreeSpacePercentage\')\
| extend Tags = todynamic(Tags)\
| extend InstanceName = tostring(Tags[\'vm.azm.ms/mountId\'])\
| project TimeGenerated, InstanceName,\
    cValue = case(\
        Namespace == \'LogicalDisk\' and Name == \'FreeSpacePercentage\', 100 - Val,\
        Val < 0, real(0),\
        Val\
    ));\
rawDataCached\
| summarize max(cValue) by InstanceName\
| top 8 by max_cValue\
| join\
(\
    rawDataCached\
)\
on InstanceName\
| summarize max(cValue), global_Max=any(max_cValue) by bin(TimeGenerated, trendBinSize), InstanceName\
| sort by TimeGenerated asc\
| summarize makelist(TimeGenerated, maxListSize), list_max_cValue=makelist(max_cValue, maxListSize), max_cValue=any(global_Max) by InstanceName';

    public static SingleVMDiskMetricsUsingInsightsMetrics: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let trendBinSize = $[trendBinSize];\
let maxListSize = 1000;\
let rawDataCached = materialize(InsightsMetrics\
| where TimeGenerated between (startDateTime .. endDateTime)\
| where Origin == \'vm.azm.ms\'\
$[resourceFilter]\
| where Namespace == \'LogicalDisk\' and Name in (\
\'FreeSpaceMB\',\
\'ReadsPerSecond\',\
\'WritesPerSecond\',\
\'TransfersPerSecond\',\
\'ReadBytesPerSecond\',\
\'WriteBytesPerSecond\',\
\'BytesPerSecond\',\
\'ReadLatencyMs\',\
\'WriteLatencyMs\',\
\'TransferLatencyMs\'\
)\
| extend Tags = todynamic(Tags), Val = iif(Name in (\'WriteBytesPerSecond\', \'ReadBytesPerSecond\', \'BytesPerSecond\'), Val/(1024.0 * 1024.0), iif(Name in (\'WriteLatencyMs\', \'ReadLatencyMs\', \'TransferLatencyMs\'), Val/1000.0, Val))\
| extend InstanceName = tostring(Tags[\'vm.azm.ms/mountId\']),\
DiskSizeMB = todecimal(Tags[\'vm.azm.ms/diskSizeMB\'])\
| project TimeGenerated,\
Name,\
InstanceName,\
DiskSizeMB,\
Val = case(\
Val < 0, real(0),\
Val\
));\
let TotalDiskMetrics = rawDataCached\
| where Name != \'FreeSpaceMB\'\
| summarize Val = sum(Val) by bin(TimeGenerated, 1m), Name\
| summarize P95 = percentile(Val, 95), Count=count() by Name, InstanceName = \'_Total\';\
let SeperateUsedDiskSpace = rawDataCached\
| where Name == \'FreeSpaceMB\'\
| summarize ArgMaxVal = arg_max(TimeGenerated, *) by InstanceName\
| project InstanceName, DiskSizeMB, FreeMB = Val;\
let TotalUsedDiskSpace = SeperateUsedDiskSpace\
| summarize DiskSizeMB = sum(DiskSizeMB), FreeMB = sum(FreeMB) by InstanceName = \'_Total\'\
| project InstanceName, DiskSizeMB, FreeMB;\
let AllDiskUsedSpace = SeperateUsedDiskSpace\
| union TotalUsedDiskSpace\
| project InstanceName, DiskSizeGB = round(DiskSizeMB/1024.0, 2), UsedGB = round((DiskSizeMB - FreeMB)/1024.0, 2);\
rawDataCached\
| where Name != \'FreeSpaceMB\'\
| summarize P95 = percentile(Val, 95), Count=count() by Name, InstanceName\
| union TotalDiskMetrics\
| extend Name = case(\
Name == \'ReadsPerSecond\', \'P95IOPsRead\',\
Name == \'WritesPerSecond\', \'P95IOPsWrite\',\
Name == \'TransfersPerSecond\', \'P95IOPsTransfer\',\
Name == \'ReadBytesPerSecond\', \'P95RateMBRead\',\
Name == \'WriteBytesPerSecond\', \'P95RateMBWrite\',\
Name == \'BytesPerSecond\', \'P95RateMBTransfer\',\
Name == \'ReadLatencyMs\', \'P95LatencyRead\',\
Name == \'WriteLatencyMs\', \'P95LatencyWrite\',\
Name == \'TransferLatencyMs\', \'P95LatencyTransfer\',\
Name\
)\
| evaluate pivot(Name, sum(P95))\
| extend LatencyCounterCount= iif(column_ifexists(\'P95LatencyRead\', \'\') != \'\' or column_ifexists(\'P95LatencyWrite\', \'\') != \'\' or column_ifexists(\'P95LatencyTransfer\', \'\') != \'\', Count, 0)\
| extend P95IOPsRead = column_ifexists(\'P95IOPsRead\', 0),\
    P95IOPsWrite = column_ifexists(\'P95IOPsWrite\', 0),\
    P95IOPsTransfer = column_ifexists(\'P95IOPsTransfer\', 0),\
    P95RateMBRead = column_ifexists(\'P95RateMBRead\', 0),\
    P95RateMBWrite = column_ifexists(\'P95RateMBWrite\', 0),\
    P95RateMBTransfer = column_ifexists(\'P95RateMBTransfer\', 0),\
    P95LatencyRead = column_ifexists(\'P95LatencyRead\', 0),\
    P95LatencyWrite = column_ifexists(\'P95LatencyWrite\', 0),\
    P95LatencyTransfer = column_ifexists(\'P95LatencyTransfer\', 0)\
| join AllDiskUsedSpace on InstanceName\
| project InstanceName, DiskSizeGB, UsedGB, P95IOPsRead, P95IOPsWrite, P95IOPsTransfer, P95RateMBRead,\
    P95RateMBWrite, P95RateMBTransfer, P95LatencyRead, P95LatencyWrite, P95LatencyTransfer, LatencyCounterCount';

    public static NetworkChart: string =
        'let trendBinSize = $[trendBinSize];\
let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let computerName = \'$[computerName]\';\
let windowsNetwork=Perf\
| where TimeGenerated >= startDateTime\
| where TimeGenerated < endDateTime\
| where Computer == computerName\
| where ObjectName == \'Network Adapter\' and CounterName == \'$[networkCounterWindows]\'\
| summarize CounterValue = sum(CounterValue) by bin(TimeGenerated, 2s);\
let linuxNetwork=Perf\
| where TimeGenerated >= startDateTime\
| where TimeGenerated < endDateTime\
| where Computer == computerName\
| where ObjectName == \'Network\' and CounterName == \'$[networkCounterLinux]\'\
| order by InstanceName, TimeGenerated asc\
| extend prev_Value=prev(CounterValue), prev_t=prev(TimeGenerated), prev_instance=prev(InstanceName)\
| project TimeGenerated, CounterValue=iff(prev_instance == InstanceName and CounterValue >= prev_Value and TimeGenerated > prev_t, (CounterValue - prev_Value) / ((TimeGenerated - prev_t) / 1s), real(0))\
| summarize CounterValue = sum(CounterValue) by bin(TimeGenerated, 2s);\
let networkData = union windowsNetwork, linuxNetwork;\
networkData\
| summarize $[selectedCounters] by bin(TimeGenerated, trendBinSize)';

    public static OmsComputerGroupClause: string = 'let computers=materialize($[groupFunctionName]);';

    public static ServiceMapComputerGroupClause: string =
        'let computers=materialize(ServiceMapComputer_CL \
 | where TimeGenerated >= startDateTime\
 | where TimeGenerated < endDateTime\
 | where ResourceName_s in ($[groupMembers]) \
 | summarize arg_max(TimeGenerated, Computer) by ResourceId \
 | project Computer);';

    public static ServiceMapComputerGroupWithComputerNameClause: string = 'let computers=datatable(ComputerName:string)[$[groupMembers]];';

    public static ComputerGroupFilterStatement: string = '| where Computer in~ (computers)';

    public static EmptyComputerGroupFilterStatement: string = '| where Computer != Computer';

    public static ServiceMapComputerList: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
ServiceMapComputer_CL \
 | where TimeGenerated >= startDateTime\
 | where TimeGenerated < endDateTime\
 | summarize arg_max(TimeGenerated, FullDisplayName_s, columnifexists(\'AzureResourceId_s\', \'\')) by ResourceName_s \
 $[azureResourceIdFilter]\
 | project Id=ResourceName_s, FullDisplayName_s, DisplayName=FullDisplayName_s \
 $[displayNameFilter] \
 | top $[maxRecords] by FullDisplayName_s asc ';

    //TODO: refer 4563861 after all agent turn la id to azure id. we can remove these two query.
    public static extendedLaResourceId: string = `| extend laResourceId = iff(isempty(_ResourceId),'', 
    replace(@\'virtualmachinescalesets/(.+)/virtualmachines/(\\d+)\', 
    @\'virtualmachinescalesets/\\1/virtualmachines/\\1_\\2\', _ResourceId))
    | extend oldLaResourceId=iff(isempty(_ResourceId),'',replace(@\'virtualmachinescalesets/(.+)/virtualmachines/(\\d+)\',@\'virtualmachines/\\1_\\2\', _ResourceId))`;
    public static laResourceIdFilter: string = 'or laResourceId in (computerList) or oldLaResourceId in (computerList) | extend ComputerId = iff(laResourceId in (computerList), laResourceId, iff(oldLaResourceId in (computerList), oldLaResourceId, tempComputerId))';

    // Alert queries
    public static laAlertsOfAzureResourceClause: string = `let startDateTime = datetime('$[startDateTime]');\
    let endDateTime = datetime('$[endDateTime]');\
    let alerts = Alert\
    | where QueryExecutionStartTime >= startDateTime and QueryExecutionEndTime <= endDateTime\
    | extend ResourceId = iif(isnotempty('_ResourceId'), _ResourceId, ''), Computer = iif(isnotempty('Computer'), Computer, '')\
    $[alertsFilterByResource];`;

    public static laAlertsResourceIdFilter: string = `(ResourceId startswith '$[azureResourceId]')`;
    public static laAlertsComputerNameFilter: string = `(Computer =~ '$[computerName]')`;

    // TODO: Retrieval of Alerts for Groups is completely dependent on Computer column in fired alert.
    // OMS alert object should have both Computer and ResourceId. This feature is being developed by IDC team now
    // and it will available in all regions by end of August.
    public static laAlertsOfComputerGroupClause: string = `let startDateTime = datetime('$[startDateTime]');\
    let endDateTime = datetime('$[endDateTime]');\
    $[groupDefinition]\
    let alerts=Alert\
    | where QueryExecutionStartTime >= startDateTime and QueryExecutionEndTime <= endDateTime\
    | extend Computer = iif(isnotempty(columnifexists('Computer', '')), Computer, '')\
    $[groupFilter];`;

    public static laAlertListQuery: string = `$[alertsDefinition] alerts`;

    public static laAlertSummaryQuery: string = `$[alertsDefinition] alerts | extend severity =\
    case(AlertSeverity == "Critical" or AlertSeverity == "Error" or AlertSeverity == "0", "0",\
    AlertSeverity == "Warning" or AlertSeverity == "2", "2",\
    AlertSeverity == "Informational" or AlertSeverity == "3", "3",\
    AlertSeverity)\
    | summarize count = count() by severity`;
    
    public static ComputeResourcesSummary: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
$[groupDefinition] \
let oms = Heartbeat\
| where TimeGenerated >= startDateTime and TimeGenerated <= endDateTime\
$[groupFilter] \
| extend ComputerId=iff(isempty(_ResourceId), Computer, _ResourceId);\
let omsComputers = oms\
| where ComputerId !contains \'/providers/Microsoft.Compute/virtualMachineScaleSets\'\
| distinct ComputerId;\
let omsVmss = oms\
| parse ComputerId with scaleSet \'/virtualmachines/\' *\
| where scaleSet contains \'/virtualmachinescalesets/\'\
| extend ComputerId = scaleSet\
| distinct ComputerId;\
let omsAll = omsComputers | union omsVmss;\
let serviceMap = ServiceMapComputer_CL\
| where TimeGenerated >= startDateTime and TimeGenerated <= endDateTime\
$[groupFilter] \
| extend ComputerId=iff(isempty(_ResourceId), Computer, _ResourceId);\
let serviceMapComputers = serviceMap\
| where ComputerId !contains \'/providers/Microsoft.Compute/virtualMachineScaleSets\'\
| distinct ComputerId;\
let serviceMapVmss = serviceMap\
| parse ComputerId with scaleSet \'/virtualmachines/\' *\
| where scaleSet contains \'/virtualmachinescalesets/\'\
| extend ComputerId = scaleSet\
| distinct ComputerId;\
let serviceMapAll = serviceMapComputers | union serviceMapVmss;\
let monitored = omsAll\
| join serviceMapAll on ComputerId\
| project-away ComputerId1\
| extend monitored=true;\
let unmonitored = omsAll\
| join kind=leftanti serviceMapAll on ComputerId\
| extend monitored=false;\
let all = monitored\
| union unmonitored;\
all\
| summarize Count=count() by monitored, isVmss = ComputerId contains \'/providers/Microsoft.Compute/virtualMachineScaleSets\'';

    public static ConnectionSummary: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
$[groupDefinition]\
let linksLive = VMConnection\
| where TimeGenerated >= startDateTime and TimeGenerated <= endDateTime\
$[groupFilter]\
| summarize LinksLiveByComputer = argmax(TimeGenerated, LinksLive) by Computer\
| summarize LinksLiveSum = sum(max_TimeGenerated_LinksLive);\
VMConnection\
$[groupFilter]\
| union linksLive\
| summarize LinksFailed=sum(LinksFailed), LinksLive=sum(LinksLiveSum), LinksEstablished=sum(LinksEstablished), LinksTerminated=sum(LinksTerminated)';
    
    public static ConnectionFilterClause: string = '| where AgentId =~ \'$[agentId]\'';
    public static ConnectionSummaryGrid: string =
        'let startDateTime = datetime(\'$[startDateTime]\');\
let endDateTime = datetime(\'$[endDateTime]\');\
let linkMalicious = VMConnection\
$[connectionFilter]\
| where MaliciousIp != ""\
| where TimeGenerated >= startDateTime and TimeGenerated < endDateTime\
| summarize LinksMalicious=sum(LinksEstablished);\
let linkLive = VMConnection\
$[connectionFilter]\
| where TimeGenerated >= startDateTime and TimeGenerated < endDateTime\
| project TimeGenerated, LinksLive\
| summarize MaxLinksLive = sum(LinksLive) by bin(TimeGenerated, 1m)\
| top 1 by MaxLinksLive\
| summarize linksLive = sum(MaxLinksLive);\
VMConnection\
$[connectionFilter]\
| where TimeGenerated >= startDateTime and TimeGenerated < endDateTime\
| union linkMalicious\
| union linkLive\
| summarize LinksFailed=sum(LinksFailed), LinksLive=max(linksLive), LinksMalicious=sum(LinksMalicious), LinksEstablished=sum(LinksEstablished), LinksTerminated=sum(LinksTerminated)';

    public static ConnectionSummaryRowFailed: string = 
        'VMConnection\
$[connectionFilter]\
| where LinksFailed > 0';

    public static ConnectionSummaryRowLive: string = 
        'let startDateTime = datetime(\'$[startDateTime]\');\
        let endDateTime = datetime(\'$[endDateTime]\');\
        let linksLiveSummary= materialize(VMConnection\
        $[connectionFilter]\
        | where TimeGenerated >= startDateTime and TimeGenerated < endDateTime\
        | project TimeGenerated, LinksLive, ConnectionId\
        | summarize MaxLinksLive = sum(LinksLive), time_set = makeset(TimeGenerated), connection_set = makeset(ConnectionId) by bin(TimeGenerated, 1m)\
        | extend startTime = datetime_add(\'minute\',-1,TimeGenerated), endTime = datetime_add(\'minute\',1,TimeGenerated)\
        | top 1 by MaxLinksLive);\
        let startTime = toscalar(linksLiveSummary | project startTime);\
        let endTime = toscalar(linksLiveSummary | project endTime);\
        let timeSet = linksLiveSummary | project time_set | mv-expand time_set;\
        let connectionSet = linksLiveSummary | project connection_set | mv-expand connection_set;\
        VMConnection\
        | where TimeGenerated between(startTime..endTime)\
        $[connectionFilter]\
        | where TimeGenerated in (timeSet) and ConnectionId in (connectionSet)';

    public static ConnectionSummaryRowMalicious: string = 
        'VMConnection\
$[connectionFilter]\
| where MaliciousIp != ""';

    public static ConnectionSummaryRowEstablished: string = 
        'VMConnection\
$[connectionFilter]\
| where LinksEstablished > 0';

    public static ConnectionSummaryRowTerminated: string = 
        'VMConnection\
$[connectionFilter]\
| where LinksTerminated > 0';

    public static ConnectionSummaryViewAll: string = 
        'VMConnection\
$[connectionFilter]';
}

// tslint:enable:max-line-length 
