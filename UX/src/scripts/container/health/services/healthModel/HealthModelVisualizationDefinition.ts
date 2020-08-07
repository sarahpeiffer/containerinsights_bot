/** local */
import { IHealthMonitorVisualizationDefinition } from './IHealthMonitorVisualizationDefinition';
import { MonitorTypeId } from './MonitorTypeId';
import { DisplayStrings } from '../../../../shared/DisplayStrings';

// TODO-LOC
/**
 * defines out-of-the-box health model visualization properties
 */
export const HealthModelVisualizationDefinition: StringMap<IHealthMonitorVisualizationDefinition> = {};

// tslint:disable:max-line-length 

/** cluster monitor */
HealthModelVisualizationDefinition[MonitorTypeId.Cluster] = {
    detailsViewTypeName: 'AggregateMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.ClusterMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.ClusterMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.ClusterMonitorDescriptionOverride
};

/** 
 * nodes aspect 
 */
HealthModelVisualizationDefinition[MonitorTypeId.AllNodes] = {
    detailsViewTypeName: 'AggregateMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.NodesMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.NodesMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.NodesMonitorDescriptionOverride
};

HealthModelVisualizationDefinition[MonitorTypeId.AgentNodePool] = {
    detailsViewTypeName: 'AggregateMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.NodePoolMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.NodePoolMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.NodePoolMonitorDescriptionOverride
};

HealthModelVisualizationDefinition[MonitorTypeId.MasterNodePool] = {
    detailsViewTypeName: 'AggregateMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.MasterNodesMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.MasterNodesMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.MasterNodesMonitorDescriptionOverride
};

HealthModelVisualizationDefinition[MonitorTypeId.Node] = {
    detailsViewTypeName: 'AggregateMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.NodeMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.NodeMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.NodeMonitorDescriptionOverride
};

HealthModelVisualizationDefinition[MonitorTypeId.NodeCondition] = {
    detailsViewTypeName: 'NodeStatusMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.NodeStatusMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.NodeStatusMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.NodeStatusMonitorDescriptionOverride
};

HealthModelVisualizationDefinition[MonitorTypeId.NodeCpuUtilization] = {
    detailsViewTypeName: 'NodeCPUMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.NodeCpuMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.NodeCpuMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.NodeCpuMonitorDescriptionOverride
};

HealthModelVisualizationDefinition[MonitorTypeId.NodeMemoryUtilization] = {
    detailsViewTypeName: 'NodeMemoryMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.NodeMemoryMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.NodeMemoryMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.NodeMemoryMonitorDescriptionOverride
};

/**
 * K8s infrastructure aspect
 */
HealthModelVisualizationDefinition[MonitorTypeId.K8sInfrastructure] = {
    detailsViewTypeName: 'AggregateMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.K8sInfraMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.K8sInfraMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.K8sInfraMonitorDescriptionOverride
};

HealthModelVisualizationDefinition[MonitorTypeId.KubeApiStatus] = {
    detailsViewTypeName: 'KubeApiStatusMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.K8sApiServerMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.K8sApiServerMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.K8sApiServerMonitorDescriptionOverride
};

HealthModelVisualizationDefinition[MonitorTypeId.SystemWorkload] = {
    detailsViewTypeName: 'AggregateMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.SystemWorkloadMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.SystemWorkloadMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.SystemWorkloadMonitorDescriptionOverride
};

HealthModelVisualizationDefinition[MonitorTypeId.SystemWorkloadPodsReady] = {
    detailsViewTypeName: 'PodsReadyMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.PodsReadyMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.PodsReadyMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.PodsReadyMonitorDescriptionOverride
};

/**
 * workload aspect
 */
HealthModelVisualizationDefinition[MonitorTypeId.Workload] = {
    detailsViewTypeName: 'AggregateMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.ClusterWorkloadsMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.ClusterWorkloadsMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.ClusterWorkloadsMonitorDescriptionOverride
};

HealthModelVisualizationDefinition[MonitorTypeId.Capacity] = {
    detailsViewTypeName: 'AggregateMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.ClusterCapacityMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.ClusterCapacityMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.ClusterCapacityMonitorDescriptionOverride
};

HealthModelVisualizationDefinition[MonitorTypeId.SubscribedCapacityCpu] = {
    detailsViewTypeName: 'SubscribedCapacityCpuMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.ClusterCpuCapacityMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.ClusterCpuCapacityMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.ClusterCpuCapacityMonitorDescriptionOverride
};

HealthModelVisualizationDefinition[MonitorTypeId.SubscribedCapacityMemory] = {
    detailsViewTypeName: 'SubscribedCapacityMemoryMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.ClusterMemoryCapacityMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.ClusterMemoryCapacityMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.ClusterMemoryCapacityMonitorDescriptionOverride
};

HealthModelVisualizationDefinition[MonitorTypeId.Namespaces] = {
    detailsViewTypeName: 'AggregateMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.NamespacesMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.NamespacesMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.NamespacesMonitorDescriptionOverride
};

HealthModelVisualizationDefinition[MonitorTypeId.Namespace] = {
    detailsViewTypeName: 'AggregateMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.NamespaceMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.NamespaceMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.NamespaceMonitorDescriptionOverride
};

HealthModelVisualizationDefinition[MonitorTypeId.UserWorkload] = {
    detailsViewTypeName: 'AggregateMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.UserWorkloadMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.UserWorkloadMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.UserWorkloadMonitorDescriptionOverride
};

HealthModelVisualizationDefinition[MonitorTypeId.UserWorkloadPodsReady] = {
    detailsViewTypeName: 'PodsReadyMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.WorkloadsPodsReadyMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.WorkloadsPodsReadyMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.WorkloadsPodsReadyMonitorDescriptionOverride
};

HealthModelVisualizationDefinition[MonitorTypeId.ContainerCpuUtilization] = {
    detailsViewTypeName: 'ContainerCpuUtilizationMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.ContainerCpuCapacityMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.ContainerCpuCapacityMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.ContainerCpuCapacityMonitorDescriptionOverride
};

HealthModelVisualizationDefinition[MonitorTypeId.ContainerMemoryUtilization] = {
    detailsViewTypeName: 'ContainerMemoryUtilizationMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.ContainerMemoryMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.ContainerMemoryMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.ContainerMemoryMonitorDescriptionOverride
};

HealthModelVisualizationDefinition[MonitorTypeId.Container] = {
    detailsViewTypeName: 'AggregateMonitorDetailsView',
    standaloneDisplayNameTemplate: DisplayStrings.ContainerMonitorStandAloneDisplayName,
    inContextDisplayNameTemplate: DisplayStrings.ContainerMonitorInContextDisplayName,
    descriptionTemplate: DisplayStrings.ContainerMonitorDescriptionOverride
};


// tslint:enable:max-line-length 
