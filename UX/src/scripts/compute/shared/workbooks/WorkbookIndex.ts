/**
 * Complete collection of workbooks shown to the end-user
 *
 * @export
 * @enum {string}
 */
export enum WorkbookTemplateId {
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
    // Insights Metrics workbooks
    SingleVmInsightsMetricsPerformance = 'single-vm-im-performance',
    VmssInsightsMetricsPerformance = 'vmss-im-performance',
    AtScaleVmInsightsMetricsPerformance = 'at-scale-vm-im-performance',
    AtScaleVmInsightsMetricsPerformanceCounters = 'at-scale-vm-im-performance-counters',
    // Dev workbooks
    AtScaleDevPerformance = 'at-scale-dev-performance',
    AtScaleDevPerformanceCounters = 'at-scale-dev-performance-counters',
    AtScaleDevConnectionsOverview = 'at-scale-dev-connections-overview',
    // Azure mode workbooks
    AtScaleAzureModePerformance = 'at-scale-am-performance',
    AtScaleAzureModePerformanceCounters = 'at-scale-am-performance-counters',
    AtScaleAzureModeConnectionsOverview = 'at-scale-am-connections-overview',
    // Gallery templates below do not point any specific workbook
    VirtualMachineWorkbookGallery = 'virtual-machine-workbook-gallery',
    VirtualMachineScaleSetWorkbookGallery = 'virtual-machine-scale-set-workbook-gallery',
    AtScaleVmInsightsGallery = 'at-scale-vm-insights-gallery'
}

/**
 * Complete collection of workbook categories shown to the end-user
 *
 * @export
 * @enum {string}
 */
export enum WorkbookCategoryId {
    WorkbookGallery = 'workbook-gallery',
    PerformanceAnalysis = 'performance-analysis',
    NetworkDependencies = 'network-dependencies',
    DraftWorkbooks = 'draft-workbooks'
}

export const WorkbookTypes = {
    performanceVM: 'performance-vm',
    workbook: 'workbook',
    vmInsights: 'vm-insights',
    insights: 'insights'
};

export const GalleryTypes = {
    virtualMachines: 'microsoft.compute/virtualmachines',
    virtualMachineScaleSets: 'microsoft.compute/virtualmachinescalesets',
    azureMonitor: 'Azure Monitor'
};
