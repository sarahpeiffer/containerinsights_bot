/**
 * Complete collection of workbooks shown to the end-user
 *
 * @export
 * @enum {string}
 */
export enum WorkbookTemplateId {
    // compute
    SingleVmPerformance = 'single-vm-performance',
    AtScaleVmPerformance = 'at-scale-vm-performance',
    VmssPerformance = 'vmss-performance',
    AtScaleConnectionsOverview = 'at-scale-connections-overview',
    VmssConnectionsOverview = 'vmss-connections-overview',
    SingleVMConnectionsOverview = 'single-vm-connections-overview',
    SecurityAndAudit = 'security-and-audit',
    VmEvents = 'vm-events',
    PerformanceCounters = 'performance-counters',
    TrafficComparison = 'traffic-comparison',
    TcpTraffic = 'tcp-traffic',
    FailedConnections = 'failed-connections',
    ActivePorts = 'active-ports',
    VmssActivePorts = 'vmss-active-ports',
    OpenPorts = 'open-ports',
    // containers
    NodeDiskCapacityAKS = 'node-disk-capacity-aks',
    NodeDiskCapacityAKSEngine = 'node-disk-capacity-aks-engine',
    NodeDiskIOAKS = 'node-disk-io-aks',
    NodeDiskIOAKSEngine = 'node-disk-io-aks-engine',
    NodeKubeletAKS = 'node-kubelet-aks',
    NodeKubeletAKSEngine = 'node-kubelet-aks-engine',
    NodeNetworkAKS = 'node-network-aks',
    NodeNetworkAKSEngine = 'node-network-aks-engine',
    NodeGPUAKS = 'node-gpu-aks',
    ContainerInsightsDataUsage = 'billing-data-usage',
    WorkloadDetailsAKS = 'workload-details-aks',
    WorkloadDetailsAKSEngine = 'workload-details-aks-engine',

    // Gallery templates below do not point any specific workbook
    VirtualMachineWorkbookGallery = 'virtual-machine-workbook-gallery',
    VirtualMachineScaleSetWorkbookGallery = 'virtual-machine-scale-set-workbook-gallery',
    ContainerInsightsAKSGallery = 'container-insights-aks-gallery',

    WorkspaceWorkbookGallery = 'workspace-workbook-gallery'
}

/**
 * Complete collection of workbook categories shown to the end-user
 *
 * @export
 * @enum {string}
 */
export enum WorkbookCategoryId {
    // compute
    WorkbookGallery = 'workbook-gallery',
    PerformanceAnalysis = 'performance-analysis',
    NetworkDependencies = 'network-dependencies',
    DraftWorkbooks = 'draft-workbooks',
    // containers
    Node = 'node',
    Billing = 'billing',
    Workload = 'workload'
}

export const WorkbookTypes = {
    performanceVM: 'performance-vm',
    workbook: 'workbook',
    containerInsights: 'container-insights'
};

export const GalleryTypes = {
    workspace: 'microsoft.operationalinsights/workspaces',
    virtualmachines: 'microsoft.compute/virtualmachines',
    virtualMachineScaleSets: 'microsoft.compute/virtualmachinescalesets',
    aks: 'Microsoft.ContainerService/managedClusters',
};
