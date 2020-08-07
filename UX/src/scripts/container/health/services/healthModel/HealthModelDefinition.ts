import { IHealthMonitorDefinition } from './IHealthMonitorDefinition';
import { MonitorTypeId } from './MonitorTypeId';

/**
 * defines out-of-the-box health model shared between agent and UX
 */
export const HealthModelDefinition: StringMap<IHealthMonitorDefinition> = {};

/**
 * cluster top level monitor
 */
HealthModelDefinition[MonitorTypeId.Cluster] = {
    aggregationAlgorithm: 'worstOf',
    parentMonitorTypeId: null
};

/**
 * nodes aspect
 */
HealthModelDefinition[MonitorTypeId.AllNodes] = {
    aggregationAlgorithm: 'worstOf',
    parentMonitorTypeId: 'cluster'
};

HealthModelDefinition[MonitorTypeId.AgentNodePool] = {
    keyLabels: ['agentpool'],
    aggregationAlgorithm: 'percentage',
    parentMonitorTypeId: 'all_nodes'
};

HealthModelDefinition[MonitorTypeId.MasterNodePool] = {
    aggregationAlgorithm: 'percentage',
    parentMonitorTypeId: 'all_nodes'
};

HealthModelDefinition[MonitorTypeId.Node] = {
    keyLabels: ['agentpool', 'kubernetes.io/role', 'kubernetes.io/hostname'],
    aggregationAlgorithm: 'worstOf',
    parentMonitorTypeId: [
        {
            labelName: 'kubernetes.io/role',
            operator: '==',
            operand: 'master',
            parentMonitorTypeId: 'master_node_pool'
        },
        {
            labelName: 'kubernetes.io/role',
            operator: '==',
            operand: 'agent',
            parentMonitorTypeId: 'agent_node_pool'
        }
    ],
    defaultParentMonitorTypeId: 'agent_node_pool'
};

HealthModelDefinition[MonitorTypeId.NodeCondition] = { parentMonitorTypeId: 'node' };
HealthModelDefinition[MonitorTypeId.NodeCpuUtilization] = { parentMonitorTypeId: 'node' };
HealthModelDefinition[MonitorTypeId.NodeMemoryUtilization] = { parentMonitorTypeId: 'node' };

/**
 * K8s infrastructure aspect
 */
HealthModelDefinition[MonitorTypeId.K8sInfrastructure] = {
    aggregationAlgorithm: 'worstOf',
    parentMonitorTypeId: 'cluster'
};

HealthModelDefinition[MonitorTypeId.SystemWorkload] = {
    keyLabels: ['container.azm.ms/namespace', 'container.azm.ms/workload-name'],
    aggregationAlgorithm: 'worstOf',
    parentMonitorTypeId: 'k8s_infrastructure'
};

HealthModelDefinition[MonitorTypeId.KubeApiStatus] = { parentMonitorTypeId: 'k8s_infrastructure' };
HealthModelDefinition[MonitorTypeId.SystemWorkloadPodsReady] = { parentMonitorTypeId: 'system_workload' };

/**
 * workloads aspect
 */
HealthModelDefinition[MonitorTypeId.Workload] = {
    aggregationAlgorithm: 'worstOf',
    parentMonitorTypeId: 'cluster'
};

HealthModelDefinition[MonitorTypeId.Capacity] = {
    aggregationAlgorithm: 'worstOf',
    parentMonitorTypeId: 'all_workloads'
};

HealthModelDefinition[MonitorTypeId.Namespaces] = {
    aggregationAlgorithm: 'worstOf',
    parentMonitorTypeId: 'all_workloads'
};

HealthModelDefinition[MonitorTypeId.Namespace] = {
    keyLabels: ['container.azm.ms/namespace'],
    aggregationAlgorithm: 'worstOf',
    parentMonitorTypeId: 'all_namespaces'
};

HealthModelDefinition[MonitorTypeId.UserWorkload] = {
    keyLabels: ['container.azm.ms/namespace', 'container.azm.ms/workload-name'],
    aggregationAlgorithm: 'worstOf',
    parentMonitorTypeId: 'namespace'
};

HealthModelDefinition[MonitorTypeId.SubscribedCapacityCpu] = { parentMonitorTypeId: 'capacity' };
HealthModelDefinition[MonitorTypeId.SubscribedCapacityMemory] = { parentMonitorTypeId: 'capacity' };

HealthModelDefinition[MonitorTypeId.UserWorkloadPodsReady] = { parentMonitorTypeId: 'user_workload' };

HealthModelDefinition[MonitorTypeId.Container] = {
    keyLabels: ['container.azm.ms/namespace', 'container.azm.ms/workload-name', 'container.azm.ms/container'],
    aggregationAlgorithm: 'percentage',
    parentMonitorTypeId: [
        {
            labelName: 'container.azm.ms/namespace',
            operator: '==',
            operand: 'kube-system',
            parentMonitorTypeId: 'system_workload'
        }
    ],
    defaultParentMonitorTypeId: 'user_workload'
};

HealthModelDefinition[MonitorTypeId.ContainerCpuUtilization] = {
    keyLabels: ['container.azm.ms/namespace', 'container.azm.ms/workload-name', 'container.azm.ms/container'],
    parentMonitorTypeId: 'container'
};
HealthModelDefinition[MonitorTypeId.ContainerMemoryUtilization] = {
    keyLabels: ['container.azm.ms/namespace', 'container.azm.ms/workload-name', 'container.azm.ms/container'],
    parentMonitorTypeId: 'container'
};
