import { HealthState } from '../../HealthState';

/** structure of node conditions detail data received from agent */
export interface IMonitorDetails {
    timestamp: string;
    state: string;
    details: any
}

/** structure of node conditions detail data received from agent */
export interface INodeConditionDetails extends IMonitorDetails {
    details: StringMap<INodeConditionStatusDetails>
}

/** structure of node condition status data in node conditions detail data */
export interface INodeConditionStatusDetails {
    Message: string
    Reason: string;
    State: string;
}

export interface INodeMemoryDetails extends IMonitorDetails {
    details: NodeMemoryUtilizationDetails;
}

export interface NodeMemoryUtilizationDetails {
    memoryRssBytes: number;
    memoryUtilizationPercentage: number;
}

export interface INodeCpuUtilizationDetails extends IMonitorDetails {
    details: INodeCpuUtilizationMetricDetails;
}

export interface INodeCpuUtilizationMetricDetails {
    cpuUsageMillicores: number;
    cpuUtilizationPercentage: number;
}

export interface IWorkloadCapacityMemoryDetails extends IMonitorDetails {
    details: IWorkloadCapacityMemoryMetricDetails;
}

export interface IWorkloadCapacityMemoryMetricDetails {
    clusterMemoryCapacity: number;
    clusterMemoryRequests: number;
}

export interface IWorkloadCapacityCpuDetails extends IMonitorDetails {
    details: IWorkloadCapacityCpuMetricDetails;
}

export interface IWorkloadCapacityCpuMetricDetails {
    clusterCpuCapacity: number;
    clusterCpuRequests: number;
}

export interface IWorkloadsPodsReadyDetails extends IMonitorDetails {
    details: IWorkloadsPodsReadyDetailsObject;
}

export interface IWorkloadsPodsReadyDetailsObject {
    podsReady: number;
    totalPods: number;
    workloadName: string;
    namespace: string;
    workloadKind: string;
}
export interface IKubeApiStatusDetails extends IMonitorDetails {
    details: IKubeApiStatusDetailsObject;
}

export interface IKubeApiStatusDetailsObject {
    'audit-id': string;
    'content-type': string;
    date: string;
    connection: string;
    'transfer-encoding': string;
    ResponseCode: number
}

export interface IAggregateDetailsObject { // use this for aggregate details if they are all the same
    pass?: string[];
    fail?: string[];
    warn?: string[];
    error?: string[];
    unknown?: string[];
}

export interface INamespaceAggregateDetails extends IMonitorDetails {
    details: IAggregateDetailsObject;
}

export interface IAggregateDetails extends IMonitorDetails {
    details: IAggregateDetailsObject;
}

export const SummaryTile: ISummaryTile = {
    Critical: HealthState.Critical,
    Error: HealthState.Error,
    Warning: HealthState.Warning,
    Healthy: HealthState.Healthy,
    Unknown: HealthState.Unknown,
    Total: 'Total'
}

export interface ISummaryTile {
    Critical: HealthState;
    Error: HealthState;
    Warning: HealthState;
    Healthy: HealthState;
    Unknown: HealthState;
    Total: string;
}

export interface IContainerCpuUtilizationDetails extends IMonitorDetails {
    details: IContainerCpuUtilizationDetailsObject;
}

export interface IContainerCpuUtilizationDetailsObject {
    cpu_limit_millicores: number;
    cpu_usage_instances: IContainerCpuUtilizationCpuUsageInstancesObject[];
    container: string;
    limit_set: boolean;
}

export interface IContainerCpuUtilizationCpuUsageInstancesObject {
    pod_name: string;
    counter_value: number;
    container: string;
    state: string;
}

export interface IContainerMemoryUtilizationDetails extends IMonitorDetails {
    details: IContainerMemoryUtilizationDetailsObject;
}

export interface IContainerMemoryUtilizationDetailsObject {
    memory_limit_bytes: number;
    memory_usage_instances: IContainerMemoryUtilizationMemoryUsageInstancesObject[];
    container: string;
}

export interface IContainerMemoryUtilizationMemoryUsageInstancesObject {
    pod_name: string;
    counter_value: number;
    container: string;
    state: string;
}

export interface IUsageDataObj {
    usage: number;
    usageLimit?: number
    usagePercentage: number
}
