/**
 * Local
 */
import { WorkbookTemplateId, WorkbookTypes, GalleryTypes } from './WorkbookIndex';
import { IWorkbookTemplate } from './../WorkbookTemplates';

/**
 * Shared
 */
import { DisplayStrings } from './../../../shared/DisplayStrings';

export class Templates {
    private static templates: IWorkbookTemplate[] = [];

    public static get Templates(): IWorkbookTemplate[] {
        return this.templates;
    }

    static initialize() {
        this.templates = [];

        // Dev
        this.templates.push({
            TemplateId: WorkbookTemplateId.AtScaleDevPerformance,
            GalleryType: GalleryTypes.azureMonitor,
            WorkbookType: WorkbookTypes.vmInsights,
            TemplatePath: 'Community-Workbooks/Virtual Machines - Performance Analysis/Performance Analysis for a Group of VMs (Dev)',
            DisplayName: DisplayStrings.PerformanceAnalysis
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.AtScaleDevPerformanceCounters,
            GalleryType: GalleryTypes.azureMonitor,
            WorkbookType: WorkbookTypes.vmInsights,
            TemplatePath: 'Community-Workbooks/Virtual Machines - Performance Analysis/Performance Counters (Dev)',
            DisplayName: DisplayStrings.PerformanceCounters
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.AtScaleDevConnectionsOverview,
            GalleryType: GalleryTypes.azureMonitor,
            WorkbookType: WorkbookTypes.vmInsights,
            TemplatePath: 'Community-Workbooks/Virtual Machines - Network Dependencies/Connections Overview (Dev)',
            DisplayName: DisplayStrings.ConnectionsOverview
        });
        // Azure Mode
        this.templates.push({
            TemplateId: WorkbookTemplateId.AtScaleAzureModePerformance,
            GalleryType: GalleryTypes.azureMonitor,
            WorkbookType: WorkbookTypes.vmInsights,
            TemplatePath: 'Community-Workbooks/Virtual Machines - Performance Analysis/Performance Analysis for a Group of VMs (Azure Preview)',
            DisplayName: DisplayStrings.PerformanceAnalysis
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.AtScaleAzureModePerformanceCounters,
            GalleryType: GalleryTypes.azureMonitor,
            WorkbookType: WorkbookTypes.vmInsights,
            TemplatePath: 'Community-Workbooks/Virtual Machines - Performance Analysis/Performance Counters (Azure Preview)',
            DisplayName: DisplayStrings.PerformanceCounters
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.AtScaleAzureModeConnectionsOverview,
            GalleryType: GalleryTypes.azureMonitor,
            WorkbookType: WorkbookTypes.vmInsights,
            TemplatePath: 'Community-Workbooks/Virtual Machines - Network Dependencies/Connections Overview (Azure Preview)',
            DisplayName: DisplayStrings.ConnectionsOverview
        });
        // Insights Metrics
        this.templates.push({
            TemplateId: WorkbookTemplateId.SingleVmInsightsMetricsPerformance,
            GalleryType: GalleryTypes.virtualMachines,
            WorkbookType: WorkbookTypes.performanceVM,
            TemplatePath: 'Community-Workbooks/Virtual Machines - Performance Analysis/Performance Analysis for a Single VM (Preview)',
            DisplayName: DisplayStrings.PerformanceAnalysis
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.AtScaleVmInsightsMetricsPerformance,
            GalleryType: GalleryTypes.azureMonitor,
            WorkbookType: WorkbookTypes.vmInsights,
            TemplatePath: 'Community-Workbooks/Virtual Machines - Performance Analysis/Performance Analysis for a Group of VMs (Preview)',
            DisplayName: DisplayStrings.PerformanceAnalysis
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.AtScaleVmInsightsMetricsPerformanceCounters,
            GalleryType: GalleryTypes.azureMonitor,
            WorkbookType: WorkbookTypes.vmInsights,
            TemplatePath: 'Community-Workbooks/Virtual Machines - Performance Analysis/Performance Counters (Preview)',
            DisplayName: DisplayStrings.PerformanceCounters
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.VmssInsightsMetricsPerformance,
            GalleryType: GalleryTypes.virtualMachineScaleSets,
            WorkbookType: WorkbookTypes.workbook,
            TemplatePath: 'Community-Workbooks/Virtual Machine Scale Sets - Performance Analysis/Performance Analysis (Preview)',
            DisplayName: DisplayStrings.PerformanceAnalysis
        });
        // General
        this.templates.push({
            TemplateId: WorkbookTemplateId.SingleVmPerformance,
            GalleryType: GalleryTypes.virtualMachines,
            WorkbookType: WorkbookTypes.performanceVM,
            TemplatePath: 'Community-Workbooks/Virtual Machines - Performance Analysis/Performance Analysis for a Single VM',
            DisplayName: DisplayStrings.PerformanceAnalysis
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.AtScaleVmPerformance,
            GalleryType: GalleryTypes.azureMonitor,
            WorkbookType: WorkbookTypes.vmInsights,
            TemplatePath: 'Community-Workbooks/Virtual Machines - Performance Analysis/Performance Analysis for a Group of VMs',
            DisplayName: DisplayStrings.PerformanceAnalysis
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.AtScaleConnectionsOverview,
            GalleryType: GalleryTypes.azureMonitor,
            WorkbookType: WorkbookTypes.vmInsights,
            TemplatePath: 'Community-Workbooks/Virtual Machines - Network Dependencies/Connections Overview',
            DisplayName: DisplayStrings.ConnectionsOverview
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.SingleVMConnectionsOverview,
            GalleryType: GalleryTypes.virtualMachines,
            WorkbookType: WorkbookTypes.performanceVM,
            TemplatePath: 'Community-Workbooks/Virtual Machines - Network Dependencies/Connections Overview - Single VM',
            DisplayName: DisplayStrings.ConnectionsOverview
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.FailedConnections,
            GalleryType: GalleryTypes.azureMonitor,
            WorkbookType: WorkbookTypes.vmInsights,
            TemplatePath: 'Community-Workbooks/Virtual Machines - Network Dependencies/Failed Connections',
            DisplayName: DisplayStrings.FailedConnections
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.TcpTraffic,
            GalleryType: GalleryTypes.azureMonitor,
            WorkbookType: WorkbookTypes.vmInsights,
            TemplatePath: 'Community-Workbooks/Virtual Machines - Network Dependencies/TCP Traffic',
            DisplayName: DisplayStrings.TcpTraffic
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.SecurityAndAudit,
            GalleryType: GalleryTypes.azureMonitor,
            WorkbookType: WorkbookTypes.vmInsights,
            TemplatePath: 'Community-Workbooks/Virtual Machines - Network Dependencies/Security and Audit',
            DisplayName: DisplayStrings.SecurityAndAudit
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.TrafficComparison,
            GalleryType: GalleryTypes.azureMonitor,
            WorkbookType: WorkbookTypes.vmInsights,
            TemplatePath: 'Community-Workbooks/Virtual Machines - Network Dependencies/Traffic Comparison',
            DisplayName: DisplayStrings.TrafficComparison
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.PerformanceCounters,
            GalleryType: GalleryTypes.azureMonitor,
            WorkbookType: WorkbookTypes.vmInsights,
            TemplatePath: 'Community-Workbooks/Virtual Machines - Performance Analysis/Performance Counters',
            DisplayName: DisplayStrings.PerformanceCounters
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.ActivePorts,
            GalleryType: GalleryTypes.azureMonitor,
            WorkbookType: WorkbookTypes.vmInsights,
            TemplatePath: 'Community-Workbooks/Virtual Machines - Network Dependencies/Active Ports',
            DisplayName: DisplayStrings.ActivePorts
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.OpenPorts,
            GalleryType: GalleryTypes.azureMonitor,
            WorkbookType: WorkbookTypes.vmInsights,
            TemplatePath: 'Community-Workbooks/Virtual Machines - Network Dependencies/Open Ports',
            DisplayName: DisplayStrings.OpenPorts
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.VmssPerformance,
            GalleryType: GalleryTypes.virtualMachineScaleSets,
            WorkbookType: WorkbookTypes.workbook,
            TemplatePath: 'Community-Workbooks/Virtual Machine Scale Sets - Performance Analysis/Performance Analysis',
            DisplayName: DisplayStrings.PerformanceAnalysis
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.VmssConnectionsOverview,
            GalleryType: GalleryTypes.virtualMachineScaleSets,
            WorkbookType: WorkbookTypes.workbook,
            TemplatePath: 'Community-Workbooks/Virtual Machine Scale Sets - Network Dependencies/Connections Overview',
            DisplayName: DisplayStrings.ConnectionsOverview
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.VmssActivePorts,
            GalleryType: GalleryTypes.virtualMachineScaleSets,
            WorkbookType: WorkbookTypes.workbook,
            TemplatePath: 'Community-Workbooks/Virtual Machine Scale Sets - Network Dependencies/Active Ports',
            DisplayName: DisplayStrings.ActivePorts
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.VirtualMachineWorkbookGallery,
            GalleryType: GalleryTypes.virtualMachines,
            WorkbookType: WorkbookTypes.performanceVM,
            DisplayName: DisplayStrings.WorkbookGallery
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.AtScaleVmInsightsGallery,
            GalleryType: GalleryTypes.azureMonitor,
            WorkbookType: WorkbookTypes.vmInsights,
            DisplayName: DisplayStrings.WorkbookGallery
        });
        this.templates.push({
            TemplateId: WorkbookTemplateId.VirtualMachineScaleSetWorkbookGallery,
            GalleryType: GalleryTypes.virtualMachineScaleSets,
            WorkbookType: WorkbookTypes.workbook,
            DisplayName: DisplayStrings.WorkbookGallery
        });
    }
}
