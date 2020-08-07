import { BladeContext } from '../../BladeContext';

export class Placeholder {
    public static Granularity: string = '$[trendBinSize]';
    public static StartDateTime: string = '$[startDateTime]';
    public static EndDateTime: string = '$[endDateTime]';
    public static MaxResultCount: string = '$[maxResultCount]';
    public static OrderBy: string = '$[orderByColumnName]';
    public static SortDirection: string = '$[sortDirection]';
    public static TrendValuePercentile: string = '$[trendValuePercentile]';
    public static GroupFilter: string = '$[groupFilter]';
    public static NodeIdentityAndPropsSubquery: string = '$[nodeIdentityAndPropsSubquery]';
    public static MaxListSize: string = '$[maxListSize]';
    public static ClusterFilter: string = '$[clusterFilter]';
    public static NameSpaceFilter: string = '$[nameSpaceFilter]';
    public static ServiceNameFilter: string = '$[serviceNameFilter]';
    public static ControllerKindFilter: string = '$[controllerKindFilter]';

    public static ControllerNameFilter: string = '$[controllerNameFilter]';
    public static PodNameFilter: string = '$[podNameFilter]';
    public static ContainerNameFilter: string = '$[containerNameFilter]';
    public static ClusterIdFilter: string = '$[clusterIdFilter]';
    public static ObjectKindFilter: string = '$[objectKindFilter]';
    public static NameFilter: string = '$[nameFilter]';
    public static SelectedTimeRangeFilter: string = '$[selectedTimeRangeFilter]';
    public static TimeGeneratedFilter: string = '$[timeGeneratedFilter]';
    public static PerfInstanceNameFilter: string = '$[perfInstanceNameFilter]'

    // TODO: In the past we used 'node name filter' which was doing
    //       extend Node == Computer and then filtering on Node (name)
    //       that diallows Kusto to use index on Computer field. So,
    //       we're switching queries to filter on Computer (name)
    //       and while we're in flight we'll have both
    //       and will need to delete NodeNameFilter later
    public static NodeNameFilter: string = '$[nodeNameFilter]';
    public static ComputerNameFilter: string = '$[computerNameFilter]';
    public static ControllerIdFilter: string = '$[controllerIdFilter]';
    public static NodePoolNameFilter: string = '$[nodePoolNameFilter]';
    public static NodePoolFilter: string = '$[nodePoolFilter]';
    public static NodePoolContainerQueryTemplateFilter: string = '$[nodePoolContainerQueryTemplateFilter]';
    public static NodePoolChartQueryTemplateClusterPodCountFilter: string = '$[nodePoolChartQueryTemplateClusterPodCountFilter]';
    public static MetricLimitCounterName: string = '$[metricLimitCounterName]';
    public static MetricUsageCounterName: string = '$[metricUsageCounterName]';
    public static MetricCapacityCounterName: string = '$[metricCapacityCounterName]';
    public static MetricUsageAggregation: string = '$[metricUsageAggregation]';
    public static MetricTrendUsageAggregation: string = '$[metricTrendUsageAggregation]';
    public static KubePodInventoryJoinType: string = '$[kubePodInventoryJoinType]';

    public static SearchByNodeName: string = '$[searchByNodeName]';
}

export class PlaceholderSubstitute {
    public static NodeNameFilter(nodeName: string): string { return `| where Node == '${nodeName}'`; }
    public static ComputerNameFilter(computerName: string): string { return `| where Computer == '${computerName}'`; }
    public static ControllerIdFilter(controllerId: string): string { return  `| where ControllerId == '${controllerId}'`; }
    public static PerfInstanceNameStartsWithFilter(substring: string): string { return `| where InstanceName startswith '${substring}'`; }
    public static PerfInstanceNameHasFilter(substring: string): string { return `| where InstanceName has '${substring}'`; }
    public static NamespaceNameFilter(namespaceName: string): string { return `| where Namespace == '${namespaceName}'`; }
    public static NamespaceNameExcludeKubeSystemFilter(): string { return `| where Namespace != \'kube-system\'`; }
    public static ServiceNameFilter(serviceName: string): string { return `| where ServiceName == '${serviceName}'`; }
    public static NodePoolNameFilter(nodePoolName: string): string { return `| where NodePool == '${nodePoolName}'`; }
    public static ControllerNameFilter(controllerName: string): string { return `| where ControllerName == '${controllerName}'`; }
    public static ControllerKindFilter(controllerKind: string): string { return `| where ControllerKind =~ '${controllerKind}'`; }

    public static ClusterFilter(clusterResourceId: string, clusterName: string): string {
        return (clusterResourceId && BladeContext.instance() &&
            BladeContext.instance().cluster &&
            BladeContext.instance().cluster.isManagedCluster
            ? `| where ClusterId =~ '${clusterResourceId}'`
            : clusterName
                ? `| where ClusterName =~ '${clusterName}'`
                : ''
        );
    }

    public static NodePoolFilter(): string {
        return (
            `| extend LabelsJSON = todynamic(Labels)[0]\
            | extend AgentPool = tostring(LabelsJSON.agentpool),\
                KubernetesRole = tostring(LabelsJSON['kubernetes.io/role'])\
            | extend NodePool = iff(isempty(AgentPool), KubernetesRole, AgentPool)\
            $[nodePoolNameFilter]`
        );
    }

    public static NodePoolContainerQueryTemplateFilter(): string {
        return (
            `| where Node in (\
                (KubeNodeInventory\
                | where TimeGenerated >= startDateTime\
                | where TimeGenerated < endDateTime\
                $[clusterFilter]\
                | extend LabelsJSON = todynamic(Labels)[0]\
                | extend AgentPool = tostring(LabelsJSON.agentpool),\
                    KubernetesRole = tostring(LabelsJSON['kubernetes.io/role'])\
                | project Node = Computer, NodePool = iff(isempty(AgentPool), KubernetesRole, AgentPool)\
                $[nodeNameFilter]\
                $[nodePoolNameFilter]\
                | project Node)\
            )`
        );
    }

    public static NodePoolChartsQueryTemplateClusterPodCountFilter(): string {
        return (
            `| where Computer in (\
                (KubeNodeInventory\
                | where TimeGenerated >= startDateTime\
                | where TimeGenerated < endDateTime\
                $[clusterFilter]\
                $[computerNameFilter]\
                | extend LabelsJSON = todynamic(Labels)[0]\
                | extend AgentPool = tostring(LabelsJSON.agentpool),\
                    KubernetesRole = tostring(LabelsJSON['kubernetes.io/role'])\
                | extend NodePool = iff(isempty(AgentPool), KubernetesRole, AgentPool)\
                $[nodePoolNameFilter]\
                | project Computer)\
            )`
        );
    }

}
