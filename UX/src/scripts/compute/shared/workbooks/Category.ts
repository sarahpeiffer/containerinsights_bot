/** Local */
import { WorkbookCategoryId, WorkbookTemplateId } from './WorkbookIndex';
import { IWorkbookCategoryDescriptor } from './../WorkbookTemplates';

/** Shared */
import { DisplayStrings } from './../../../shared/DisplayStrings';

export class Category {
    private static atScaleCategories: IWorkbookCategoryDescriptor[] = [];
    private static atScaleInsightsMetricsCategories: IWorkbookCategoryDescriptor[] = [];
    private static atScaleAzureModeCategories: IWorkbookCategoryDescriptor[] = [];
    private static atScaleDevCategories: IWorkbookCategoryDescriptor[] = [];
    private static singleVmCategories: IWorkbookCategoryDescriptor[] = [];
    private static singleVmInsightsMetricsCategories: IWorkbookCategoryDescriptor[] = [];
    private static vmssCategories: IWorkbookCategoryDescriptor[] = [];
    private static vmssInsightsMetricsCategories: IWorkbookCategoryDescriptor[] = [];

    public static get AtScaleCategories(): IWorkbookCategoryDescriptor[] {
        return this.atScaleCategories;
    }

    public static get AtScaleInsightsMetricsCategories(): IWorkbookCategoryDescriptor[] {
        return this.atScaleInsightsMetricsCategories;
    }

    public static get AtScaleAzureModeCategories(): IWorkbookCategoryDescriptor[] {
        return this.atScaleAzureModeCategories;
    }

    public static get AtScaleDevCategories(): IWorkbookCategoryDescriptor[] {
        return this.atScaleDevCategories;
    }

    public static get SingleVmCategories(): IWorkbookCategoryDescriptor[] {
        return this.singleVmCategories;
    }

    public static get SingleVmInsightsMetricsCategories(): IWorkbookCategoryDescriptor[] {
        return this.singleVmInsightsMetricsCategories;
    }

    public static get VmssCategories(): IWorkbookCategoryDescriptor[] {
        return this.vmssCategories;
    }

    public static get VmssInsightsMetricsCategories(): IWorkbookCategoryDescriptor[] {
        return this.vmssInsightsMetricsCategories;
    }

    static initialize() {
        this.atScaleCategories = [
            {
                CategoryId: WorkbookCategoryId.PerformanceAnalysis,
                DisplayName: DisplayStrings.WorkbookPerformanceSectionName,
                WorkbookDescriptors: [WorkbookTemplateId.AtScaleVmPerformance]
            },
            {
                CategoryId: WorkbookCategoryId.NetworkDependencies,
                DisplayName: DisplayStrings.WorkbookNetworkDependenciesSectionName,
                WorkbookDescriptors: [WorkbookTemplateId.AtScaleConnectionsOverview, WorkbookTemplateId.ActivePorts, 
                    WorkbookTemplateId.OpenPorts, WorkbookTemplateId.FailedConnections, WorkbookTemplateId.SecurityAndAudit,
                    WorkbookTemplateId.TcpTraffic, WorkbookTemplateId.TrafficComparison]
            },
            {
                CategoryId: WorkbookCategoryId.WorkbookGallery,
                DisplayName: DisplayStrings.WorkbookGallerySectionName,
                WorkbookDescriptors: [WorkbookTemplateId.AtScaleVmInsightsGallery]
            }
        ];
        this.atScaleInsightsMetricsCategories = [
            {
                CategoryId: WorkbookCategoryId.PerformanceAnalysis,
                DisplayName: DisplayStrings.WorkbookPerformanceSectionName,
                WorkbookDescriptors: [WorkbookTemplateId.AtScaleVmInsightsMetricsPerformance]
            },
            {
                CategoryId: WorkbookCategoryId.NetworkDependencies,
                DisplayName: DisplayStrings.WorkbookNetworkDependenciesSectionName,
                WorkbookDescriptors: [WorkbookTemplateId.AtScaleConnectionsOverview, WorkbookTemplateId.ActivePorts, 
                    WorkbookTemplateId.OpenPorts, WorkbookTemplateId.FailedConnections, WorkbookTemplateId.SecurityAndAudit,
                    WorkbookTemplateId.TcpTraffic, WorkbookTemplateId.TrafficComparison]
            },
            {
                CategoryId: WorkbookCategoryId.WorkbookGallery,
                DisplayName: DisplayStrings.WorkbookGallerySectionName,
                WorkbookDescriptors: [WorkbookTemplateId.AtScaleVmInsightsGallery]
            }
        ];
        this.atScaleAzureModeCategories = [
            {
                CategoryId: WorkbookCategoryId.PerformanceAnalysis,
                DisplayName: DisplayStrings.WorkbookPerformanceSectionName,
                WorkbookDescriptors: [WorkbookTemplateId.AtScaleAzureModePerformance]
            },
            {
                CategoryId: WorkbookCategoryId.NetworkDependencies,
                DisplayName: DisplayStrings.WorkbookNetworkDependenciesSectionName,
                WorkbookDescriptors: [WorkbookTemplateId.AtScaleAzureModeConnectionsOverview]
            },
            {
                CategoryId: WorkbookCategoryId.WorkbookGallery,
                DisplayName: DisplayStrings.WorkbookGallerySectionName,
                WorkbookDescriptors: [WorkbookTemplateId.AtScaleVmInsightsGallery]
            }
        ];
        this.atScaleDevCategories = [
            {
                CategoryId: WorkbookCategoryId.PerformanceAnalysis,
                DisplayName: DisplayStrings.WorkbookPerformanceSectionName,
                WorkbookDescriptors: [WorkbookTemplateId.AtScaleDevPerformance]
            },
            {
                CategoryId: WorkbookCategoryId.NetworkDependencies,
                DisplayName: DisplayStrings.WorkbookNetworkDependenciesSectionName,
                WorkbookDescriptors: [WorkbookTemplateId.AtScaleDevConnectionsOverview]
            },
            {
                CategoryId: WorkbookCategoryId.WorkbookGallery,
                DisplayName: DisplayStrings.WorkbookGallerySectionName,
                WorkbookDescriptors: [WorkbookTemplateId.AtScaleVmInsightsGallery]
            }
        ];
        this.singleVmCategories = [
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
        this.singleVmInsightsMetricsCategories = [
            {
                CategoryId: WorkbookCategoryId.PerformanceAnalysis,
                DisplayName: DisplayStrings.WorkbookPerformanceSectionName,
                WorkbookDescriptors: [WorkbookTemplateId.SingleVmInsightsMetricsPerformance]
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
        this.vmssCategories = [
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
        this.vmssInsightsMetricsCategories = [
            {
                CategoryId: WorkbookCategoryId.PerformanceAnalysis,
                DisplayName: DisplayStrings.WorkbookPerformanceSectionName,
                WorkbookDescriptors: [WorkbookTemplateId.VmssInsightsMetricsPerformance]
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
    }
}
