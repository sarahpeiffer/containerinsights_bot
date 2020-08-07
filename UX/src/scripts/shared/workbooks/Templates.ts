/** Local */
import { WorkbookTemplateId, WorkbookTypes, GalleryTypes } from './WorkbookIndex';
import { IWorkbookTemplate } from './WorkbookTemplates';

/** Shared */
import { DisplayStrings } from './../DisplayStrings';
import * as TelemetryStrings from './../TelemetryStrings';

/**
 * If there is no TemplatePath, the gallery of the type specified will be opened
 */
export const Templates: IWorkbookTemplate[] = [
    // VM Insights
    {
        TemplateId: WorkbookTemplateId.SingleVmPerformance,
        GalleryType: GalleryTypes.virtualmachines,
        WorkbookType: WorkbookTypes.performanceVM,
        TemplatePath: 'Community-Workbooks/Virtual Machines - Performance Analysis/Performance Analysis for a Single VM',
        DisplayName: DisplayStrings.PerformanceAnalysis,
        ViewerMode: 'false'
    },
    {
        TemplateId: WorkbookTemplateId.AtScaleVmPerformance,
        GalleryType: GalleryTypes.workspace,
        WorkbookType: WorkbookTypes.workbook,
        TemplatePath: 'Community-Workbooks/Virtual Machines - Performance Analysis/Performance Analysis for a Group of VMs',
        DisplayName: DisplayStrings.PerformanceAnalysis,
        ViewerMode: 'false'
    },
    {
        TemplateId: WorkbookTemplateId.AtScaleConnectionsOverview,
        GalleryType: GalleryTypes.workspace,
        WorkbookType: WorkbookTypes.workbook,
        TemplatePath: 'Community-Workbooks/Virtual Machines - Network Dependencies/Connections Overview',
        DisplayName: DisplayStrings.ConnectionsOverview,
        ViewerMode: 'false'
    },
    {
        TemplateId: WorkbookTemplateId.SingleVMConnectionsOverview,
        GalleryType: GalleryTypes.workspace,
        WorkbookType: WorkbookTypes.workbook,
        TemplatePath: 'Community-Workbooks/Virtual Machines - Network Dependencies/Connections Overview - Single VM',
        DisplayName: DisplayStrings.ConnectionsOverview,
        ViewerMode: 'false'
    },
    {
        TemplateId: WorkbookTemplateId.FailedConnections,
        GalleryType: GalleryTypes.workspace,
        WorkbookType: WorkbookTypes.workbook,
        TemplatePath: 'Community-Workbooks/Virtual Machines - Network Dependencies/Failed Connections',
        DisplayName: DisplayStrings.FailedConnections,
        ViewerMode: 'false'
    },
    {
        TemplateId: WorkbookTemplateId.TcpTraffic,
        GalleryType: GalleryTypes.workspace,
        WorkbookType: WorkbookTypes.workbook,
        TemplatePath: 'Community-Workbooks/Virtual Machines - Network Dependencies/TCP Traffic',
        DisplayName: DisplayStrings.TcpTraffic,
        ViewerMode: 'false'
    },
    {
        TemplateId: WorkbookTemplateId.SecurityAndAudit,
        GalleryType: GalleryTypes.workspace,
        WorkbookType: WorkbookTypes.workbook,
        TemplatePath: 'Community-Workbooks/Virtual Machines - Network Dependencies/Security and Audit',
        DisplayName: DisplayStrings.SecurityAndAudit,
        ViewerMode: 'false'
    },
    {
        TemplateId: WorkbookTemplateId.TrafficComparison,
        GalleryType: GalleryTypes.workspace,
        WorkbookType: WorkbookTypes.workbook,
        TemplatePath: 'Community-Workbooks/Virtual Machines - Network Dependencies/Traffic Comparison',
        DisplayName: DisplayStrings.TrafficComparison,
        ViewerMode: 'false'
    },
    {
        TemplateId: WorkbookTemplateId.PerformanceCounters,
        GalleryType: GalleryTypes.workspace,
        WorkbookType: WorkbookTypes.workbook,
        TemplatePath: 'Community-Workbooks/Virtual Machines - Performance Analysis/Performance Counters',
        DisplayName: DisplayStrings.PerformanceCounters,
        ViewerMode: 'false'
    },
    {
        TemplateId: WorkbookTemplateId.ActivePorts,
        GalleryType: GalleryTypes.workspace,
        WorkbookType: WorkbookTypes.workbook,
        TemplatePath: 'Community-Workbooks/Virtual Machines - Network Dependencies/Active Ports',
        DisplayName: DisplayStrings.ActivePorts,
        ViewerMode: 'false'
    },
    {
        TemplateId: WorkbookTemplateId.OpenPorts,
        GalleryType: GalleryTypes.workspace,
        WorkbookType: WorkbookTypes.workbook,
        TemplatePath: 'Community-Workbooks/Virtual Machines - Network Dependencies/Open Ports',
        DisplayName: DisplayStrings.OpenPorts,
        ViewerMode: 'false'
    },
    {
        TemplateId: WorkbookTemplateId.VirtualMachineWorkbookGallery,
        GalleryType: GalleryTypes.virtualmachines,
        WorkbookType: WorkbookTypes.performanceVM,
        DisplayName: DisplayStrings.WorkbookGallery,
        ViewerMode: 'false'
    },
    {
        TemplateId: WorkbookTemplateId.VirtualMachineScaleSetWorkbookGallery,
        GalleryType: GalleryTypes.virtualMachineScaleSets,
        WorkbookType: WorkbookTypes.workbook,
        DisplayName: DisplayStrings.WorkbookGallery,
        ViewerMode: 'false'
    },
    // Container Insights Workbooks
    {
        TemplateId: WorkbookTemplateId.NodeDiskCapacityAKS,
        GalleryType: GalleryTypes.aks,
        WorkbookType: WorkbookTypes.containerInsights,
        TemplatePath: 'Community-Workbooks/AKS/Node Disk Capacity AKS',
        DisplayName: DisplayStrings.WorkbooksAKSNodeDiskCapacity,
        ViewerMode: 'false',
        TelemetryId: TelemetryStrings.workbookNodeDiskCapacityTelemetryId
    },
    {
        TemplateId: WorkbookTemplateId.NodeDiskCapacityAKSEngine,
        GalleryType: GalleryTypes.workspace,
        WorkbookType: WorkbookTypes.containerInsights,
        TemplatePath: 'Community-Workbooks/AKS/Node Disk Capacity AKS Engine',
        DisplayName: DisplayStrings.WorkbooksAKSNodeDiskCapacity,
        ViewerMode: 'false',
        TelemetryId: TelemetryStrings.workbookNodeDiskCapacityTelemetryId
    },
    {
        TemplateId: WorkbookTemplateId.NodeDiskIOAKS,
        GalleryType: GalleryTypes.aks,
        WorkbookType: WorkbookTypes.containerInsights,
        TemplatePath: 'Community-Workbooks/AKS/Node Disk IO AKS',
        DisplayName: DisplayStrings.WorkbooksAKSNodeDiskIO,
        ViewerMode: 'false',
        TelemetryId: TelemetryStrings.workbookNodeDiskIOTelemetryId
    },
    {
        TemplateId: WorkbookTemplateId.NodeDiskIOAKSEngine,
        GalleryType: GalleryTypes.workspace,
        WorkbookType: WorkbookTypes.containerInsights,
        TemplatePath: 'Community-Workbooks/AKS/Node Disk IO AKS Engine',
        DisplayName: DisplayStrings.WorkbooksAKSNodeDiskIO,
        ViewerMode: 'false',
        TelemetryId: TelemetryStrings.workbookNodeDiskIOTelemetryId
    },
    {
        TemplateId: WorkbookTemplateId.NodeKubeletAKS,
        GalleryType: GalleryTypes.aks,
        WorkbookType: WorkbookTypes.containerInsights,
        TemplatePath: 'Community-Workbooks/AKS/Node Kubelet AKS',
        DisplayName: DisplayStrings.WorkbooksAKSNodeKubelet,
        ViewerMode: 'false',
        TelemetryId: TelemetryStrings.workbookKubeletTelemetryId
    },
    {
        TemplateId: WorkbookTemplateId.NodeKubeletAKSEngine,
        GalleryType: GalleryTypes.workspace,
        WorkbookType: WorkbookTypes.containerInsights,
        TemplatePath: 'Community-Workbooks/AKS/Node Kubelet AKS Engine',
        DisplayName: DisplayStrings.WorkbooksAKSNodeKubelet,
        ViewerMode: 'false',
        TelemetryId: TelemetryStrings.workbookKubeletTelemetryId
    },
    {
        TemplateId: WorkbookTemplateId.NodeNetworkAKS,
        GalleryType: GalleryTypes.aks,
        WorkbookType: WorkbookTypes.containerInsights,
        TemplatePath: 'Community-Workbooks/AKS/Node Network AKS',
        DisplayName: DisplayStrings.WorkbooksAKSNodeNetwork,
        ViewerMode: 'false',
        TelemetryId: TelemetryStrings.workbookNodeNetworkTelemetryId
    },
    {
        TemplateId: WorkbookTemplateId.NodeNetworkAKSEngine,
        GalleryType: GalleryTypes.workspace,
        WorkbookType: WorkbookTypes.containerInsights,
        TemplatePath: 'Community-Workbooks/AKS/Node Network AKS Engine',
        DisplayName: DisplayStrings.WorkbooksAKSNodeNetwork,
        ViewerMode: 'false',
        TelemetryId: TelemetryStrings.workbookNodeNetworkTelemetryId
    },
    {
        TemplateId: WorkbookTemplateId.NodeGPUAKS,
        GalleryType: GalleryTypes.aks,
        WorkbookType: WorkbookTypes.containerInsights,
        TemplatePath: 'Community-Workbooks/AKS/Node GPU',
        DisplayName: DisplayStrings.WorkbooksAKSNodeGPU,
        ViewerMode: 'false',
        TelemetryId: TelemetryStrings.workbookNodeGPUTelemetryId
    },
    {
        TemplateId: WorkbookTemplateId.WorkloadDetailsAKS,
        GalleryType: GalleryTypes.aks,
        WorkbookType: WorkbookTypes.containerInsights,
        TemplatePath: 'Community-Workbooks/AKS/Workload Details AKS',
        DisplayName: DisplayStrings.WorkbooksAKSWorkloadDetails,
        ViewerMode: 'false',
        TelemetryId: TelemetryStrings.workbookWorkloadDetailsTelemetryId
    },
    {
        TemplateId: WorkbookTemplateId.WorkloadDetailsAKSEngine,
        GalleryType: GalleryTypes.workspace,
        WorkbookType: WorkbookTypes.containerInsights,
        TemplatePath: 'Community-Workbooks/AKS/Workload Details AKS Engine',
        DisplayName: DisplayStrings.WorkbooksAKSWorkloadDetails,
        ViewerMode: 'false',
        TelemetryId: TelemetryStrings.workbookWorkloadDetailsTelemetryId
    },
    {
        TemplateId: WorkbookTemplateId.ContainerInsightsDataUsage,
        GalleryType: GalleryTypes.workspace,
        WorkbookType: WorkbookTypes.containerInsights,
        TemplatePath: 'Community-Workbooks/AKS/Billing Usage',
        DisplayName: DisplayStrings.WorkbooksAKSDataUsage,
        ViewerMode: 'false',
        TelemetryId: TelemetryStrings.workbookBillingUsageTelemetryId
    },
    // Container Insights Galleries
    {
        TemplateId: WorkbookTemplateId.ContainerInsightsAKSGallery,
        GalleryType: GalleryTypes.aks,
        WorkbookType: WorkbookTypes.containerInsights,
        DisplayName: DisplayStrings.AKSWorkbookGallery,
        ViewerMode: 'false',
        TelemetryId: TelemetryStrings.workbookGalleryTelemetryId
    },
    // Both VM Insights
    {
        TemplateId: WorkbookTemplateId.WorkspaceWorkbookGallery,
        GalleryType: GalleryTypes.workspace,
        WorkbookType: WorkbookTypes.workbook,
        DisplayName: DisplayStrings.WorkbookGallery,
        ViewerMode: 'false'
    }
];
