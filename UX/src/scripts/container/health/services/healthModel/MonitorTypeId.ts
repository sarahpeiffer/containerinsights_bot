/**
 * defines monitor types
 */
export class MonitorTypeId {
    public static Cluster = 'cluster';
    public static AllNodes = 'all_nodes';
    public static Node = 'node';
    public static AgentNodePool = 'agent_node_pool';
    public static MasterNodePool = 'master_node_pool';

    public static K8sInfrastructure = 'k8s_infrastructure';
    public static KubeApiStatus = 'kube_api_status';
    public static SystemWorkload = 'system_workload';

    public static SystemWorkloadPodsReady = 'system_workload_pods_ready';

    public static Workload = 'all_workloads';
    public static Capacity = 'capacity';
    public static SubscribedCapacityCpu = 'subscribed_capacity_cpu';
    public static SubscribedCapacityMemory = 'subscribed_capacity_memory';

    public static Namespace = 'namespace';
    public static Namespaces = 'all_namespaces';
    public static UserWorkload = 'user_workload';

    public static UserWorkloadPodsReady = 'user_workload_pods_ready';

    public static NodeCpuUtilization = 'node_cpu_utilization';
    public static NodeMemoryUtilization = 'node_memory_utilization';
    public static NodeCondition = 'node_condition';

    public static Container = 'container';
    public static ContainerCpuUtilization = 'container_cpu_utilization';
    public static ContainerMemoryUtilization = 'container_memory_utilization';
}
