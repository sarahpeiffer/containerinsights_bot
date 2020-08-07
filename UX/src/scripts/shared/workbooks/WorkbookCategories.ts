/**
 * Local
 */
import { WorkbookCategoryId, WorkbookTemplateId } from './WorkbookIndex';
import { IWorkbookCategoryDescriptor } from './WorkbookTemplates';

/**
 * Shared
 */
import { DisplayStrings } from './../DisplayStrings';

export const AtScaleCategories: IWorkbookCategoryDescriptor[] = [
    {
        CategoryId: WorkbookCategoryId.PerformanceAnalysis,
        DisplayName: DisplayStrings.WorkbookPerformanceSectionName,
        WorkbookDescriptors: [WorkbookTemplateId.AtScaleVmPerformance, WorkbookTemplateId.PerformanceCounters]
    },
    {
        CategoryId: WorkbookCategoryId.NetworkDependencies,
        DisplayName: DisplayStrings.WorkbookNetworkDependenciesSectionName,
        WorkbookDescriptors: [
            WorkbookTemplateId.AtScaleConnectionsOverview, 
            WorkbookTemplateId.ActivePorts, 
            WorkbookTemplateId.OpenPorts,
            WorkbookTemplateId.FailedConnections, 
            WorkbookTemplateId.SecurityAndAudit, 
            WorkbookTemplateId.TcpTraffic,
            WorkbookTemplateId.TrafficComparison
        ]
    },
    {
        CategoryId: WorkbookCategoryId.WorkbookGallery,
        DisplayName: DisplayStrings.WorkbookGallerySectionName,
        WorkbookDescriptors: [WorkbookTemplateId.WorkspaceWorkbookGallery]
    }
];

export const SingleVmCategories: IWorkbookCategoryDescriptor[] = [
    {
        CategoryId: WorkbookCategoryId.PerformanceAnalysis,
        DisplayName: DisplayStrings.WorkbookPerformanceSectionName,
        WorkbookDescriptors: [WorkbookTemplateId.SingleVmPerformance]
    },
    {
        CategoryId: WorkbookCategoryId.NetworkDependencies,
        DisplayName: DisplayStrings.WorkbookNetworkDependenciesSectionName,
        WorkbookDescriptors: [WorkbookTemplateId.SingleVMConnectionsOverview]
    },
    {
        CategoryId: WorkbookCategoryId.WorkbookGallery,
        DisplayName: DisplayStrings.WorkbookGallerySectionName,
        WorkbookDescriptors: [WorkbookTemplateId.VirtualMachineWorkbookGallery]
    }
];

export const AKSClusterCategories: IWorkbookCategoryDescriptor[] = [
    {
        CategoryId: WorkbookCategoryId.Node,
        DisplayName: DisplayStrings.WorkbookCategoryNode,
        WorkbookDescriptors: [
            WorkbookTemplateId.NodeDiskCapacityAKS, 
            WorkbookTemplateId.NodeDiskIOAKS, 
            WorkbookTemplateId.NodeKubeletAKS, 
            WorkbookTemplateId.NodeNetworkAKS,
            WorkbookTemplateId.NodeGPUAKS,
        ]
    },
    {
        CategoryId: WorkbookCategoryId.Billing,
        DisplayName: DisplayStrings.WorkbookCategoryBilling,
        WorkbookDescriptors: [
            WorkbookTemplateId.ContainerInsightsDataUsage
        ]
    },
    {
        CategoryId: WorkbookCategoryId.Workload,
        DisplayName: DisplayStrings.WorkbookCategoryWorkload,
        WorkbookDescriptors: [
            WorkbookTemplateId.WorkloadDetailsAKS
        ]
    },
    {
        CategoryId: WorkbookCategoryId.WorkbookGallery,
        DisplayName: DisplayStrings.WorkbookGallerySectionName,
        WorkbookDescriptors: [WorkbookTemplateId.ContainerInsightsAKSGallery]
    }
];
export const AKSEngineClusterCategories: IWorkbookCategoryDescriptor[] = [
    {
        CategoryId: WorkbookCategoryId.Node,
        DisplayName: DisplayStrings.WorkbookCategoryNode,
        WorkbookDescriptors: [
            WorkbookTemplateId.NodeDiskCapacityAKSEngine,
            WorkbookTemplateId.NodeDiskIOAKSEngine, 
            WorkbookTemplateId.NodeKubeletAKSEngine, 
            WorkbookTemplateId.NodeNetworkAKSEngine,
        ]
    },
    {
        CategoryId: WorkbookCategoryId.Billing,
        DisplayName: DisplayStrings.WorkbookCategoryBilling,
        WorkbookDescriptors: [
            WorkbookTemplateId.ContainerInsightsDataUsage
        ]
    },
    {
        CategoryId: WorkbookCategoryId.Workload,
        DisplayName: DisplayStrings.WorkbookCategoryWorkload,
        WorkbookDescriptors: [
            WorkbookTemplateId.WorkloadDetailsAKSEngine
        ]
    }
]

// TODO: This won't scale, modify this code once we have similar workbooks
// https://msazure.visualstudio.com/InfrastructureInsights/_workitems/edit/4626915
export const VmssCategories: IWorkbookCategoryDescriptor[] = [
    {
        CategoryId: WorkbookCategoryId.PerformanceAnalysis,
        DisplayName: DisplayStrings.WorkbookPerformanceSectionName,
        WorkbookDescriptors: [WorkbookTemplateId.VmssPerformance]
    },
    {
        CategoryId: WorkbookCategoryId.NetworkDependencies,
        DisplayName: DisplayStrings.WorkbookNetworkDependenciesSectionName,
        WorkbookDescriptors: [WorkbookTemplateId.VmssConnectionsOverview, WorkbookTemplateId.VmssActivePorts]
    },
    {
        CategoryId: WorkbookCategoryId.WorkbookGallery,
        DisplayName: DisplayStrings.WorkbookGallerySectionName,
        WorkbookDescriptors: [WorkbookTemplateId.VirtualMachineScaleSetWorkbookGallery]
    }
];
