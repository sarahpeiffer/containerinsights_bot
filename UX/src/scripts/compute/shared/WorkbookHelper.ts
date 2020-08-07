/** Shared */
import { StringMap } from '../../shared/StringMap';
import { MessagingProvider } from '../../shared/MessagingProvider';
import { ITelemetry } from '../../shared/Telemetry';

/** Local */
import { IWorkbookTemplate, WorkbookTemplates } from './WorkbookTemplates';
import { WorkbookTemplateId } from './workbooks/WorkbookIndex';

export const WorkbookConstant: StringMap<string> = {
    componentId: 'componentId',
    computerName: 'computerName',
    newNotebookData: 'newNotebookData',
    resourceIds: 'resourceIds',
    source: 'source',
    template: 'template',
    templateName: 'templateName',
    viewerMode: 'viewerMode',
    location: 'Location' // workbook parameter
}

export interface IWorkbookMessage {
    componentId: string;
    resourceIds: string[];
    timeContext?: string;
    type?: string;
    configurationId?: string;
    workbookTemplateName?: string;
    notebookParams?: string;
    viewerMode?: string;
    newNotebookData?: string;
    source?: string;
    galleryResourceType?: string;
}

/**
 * `messagingProvider` and `telemetry` are used within `WorkbookHelper` to transmit messages to the
 * parent blade and record telemetry
 *
 * @export
 * @interface IWorkbookProvider
 */
export interface IWorkbookProvider {
    messagingProvider: MessagingProvider;
    telemetry: ITelemetry;
}

/**
 * `sourceName` is for workbook telemetry to track where the traffic originated from
 *
 * @export
 * @interface IWorkbookNavigate
 * @extends {IWorkbookProvider}
 */
export interface IWorkbookNavigate extends IWorkbookProvider {
    sourceName: string;
}

/**
 * `computerName` is the display name of the computer
 * `workspaceId` is the azure resource ID of the log analytics workspace
 *
 * @export
 * @interface IWorkbookNavigateAtScaleConnectionDetails
 * @extends {IWorkbookNavigate}
 */
export interface IWorkbookNavigateAtScaleConnectionDetails extends IWorkbookNavigate {
    computerName?: string;
    workspaceId: string;
}

/**
 * `computerId` is the azure resource ID of the computer
 * `computerName` is the display name of the computer
 * `workspaceId` is the azure resource ID of the log analytics workspace
 *
 * @export
 * @interface IWorkbookNavigateSingleVmConnectionDetails
 * @extends {IWorkbookNavigate}
 */
export interface IWorkbookNavigateSingleVmConnectionDetails extends IWorkbookNavigate {
    computerId: string;
    computerName: string;
    workspaceId: string;
}

export const metricMap: { [key: string]: string } = {
    ['average']: 'Average = round(avg(CounterValue), 2)',
    ['avg']: 'Average = round(avg(CounterValue), 2)',
    ['min']: 'Min = round(min(CounterValue), 2)',
    ['max']: 'Max = round(max(CounterValue), 2)',
    ['p01']: 'P1st = round(percentile(CounterValue, 1), 2)',
    ['p05']: 'P5th = round(percentile(CounterValue, 5), 2)',
    ['p10']: 'P10th = round(percentile(CounterValue, 10), 2)',
    ['p50']: 'P50th = round(percentile(CounterValue, 50), 2)',
    ['p90']: 'P90th = round(percentile(CounterValue, 90), 2)',
    ['p95']: 'P95th = round(percentile(CounterValue, 95), 2)',
    ['p99']: 'P99th = round(percentile(CounterValue, 99), 2)'
}

export const aggregatorMap: StringMap<string> = {
    'average': 'Average',
    'avg': 'Average',
    'min': 'Min',
    'max': 'Max',
    'p05': 'P5th',
    'p10': 'P10th',
    'p50': 'P50th',
    'p80': 'P80th',
    'p90': 'P90th',
    'p95': 'P95th'
}

// Restore Object and Counter to original metrics so they'll match up in the Workbook template
//   If they were modified by QueryTemplate.ts:SingleVMChart
export const objectNameMap: { [key: string]: string } = {
    ['Cpu']: 'Processor',
    ['DiskIOPS']: 'Logical Disk',
    ['DiskDataRate']: 'Logical Disk',
    ['Logical Disk Used']: 'Logical Disk',
    ['Bytes Sent Rate']: 'Network Adapter',
    ['Bytes Received Rate']: 'Network Adapter'
}

export const counterNameMap: { [key: string]: string } = {
    ['Available MBytes']: 'Available MBytes Memory',
    ['Disk Bytes/sec']: 'Logical Disk Bytes/sec'
}

/** 
 * Shared utility method for opening Workbooks
 */
export class WorkbookHelper {
    public static SendOpenWorkbookMessage(
        workbookParams: StringMap<any>,
        template: IWorkbookTemplate,
        providerParams: IWorkbookProvider
    ): void {
        const componentId: string = workbookParams[WorkbookConstant.componentId];
        const resourceIds: string[] = workbookParams[WorkbookConstant.resourceIds] || [workbookParams[WorkbookConstant.componentId]];
        const notebookParams: any = JSON.stringify(workbookParams);

        const data: IWorkbookMessage = {
            componentId,
            timeContext: null,
            configurationId: workbookParams[WorkbookConstant.template],
            resourceIds,
            galleryResourceType: template.GalleryType,
            notebookParams,
            type: template.WorkbookType,
            source: workbookParams[WorkbookConstant.source],
            workbookTemplateName: workbookParams[WorkbookConstant.templateName],
            newNotebookData: workbookParams[WorkbookConstant.newNotebookData],
            viewerMode: workbookParams[WorkbookConstant.viewerMode]
        }

        if (providerParams.messagingProvider && providerParams.messagingProvider.sendOpenWorkbook) {
            providerParams.messagingProvider.sendOpenWorkbook(data);
            providerParams.telemetry.logEvent(workbookParams[WorkbookConstant.source], workbookParams, null);
        }
    }

    /**
     * Navigate to AtScale Connection Details workbook
     *
     * @static
     * @param {IWorkbookNavigateAtScaleConnectionDetails} params
     * @memberof WorkbookHelper
     */
    public static NavigateToConnectionDetailWorkbook(params: IWorkbookNavigateAtScaleConnectionDetails): void {
        const template: IWorkbookTemplate = WorkbookTemplates.GetWorkbookTemplate(WorkbookTemplateId.AtScaleConnectionsOverview);

        const workbookParams: StringMap<string> = {};
        workbookParams[WorkbookConstant.source] = params.sourceName;
        workbookParams[WorkbookConstant.viewerMode] = 'true';
        workbookParams[WorkbookConstant.componentId] = params.workspaceId;
        workbookParams[WorkbookConstant.template] = template.TemplatePath;
        workbookParams[WorkbookConstant.templateName] = template.DisplayName;

        // workbook params
        if (params.computerName !== undefined) {
            workbookParams['Computers'] = params.computerName;
            workbookParams['Hierarchy'] = '0';
            workbookParams['ComputerName'] = params.computerName;
        }

        WorkbookHelper.SendOpenWorkbookMessage(workbookParams, template, params);
    }

    /**
     * Navigate to SingleVM Connection Details workbook
     *
     * @static
     * @param {IWorkbookNavigateSingleVmConnectionDetails} params
     * @memberof WorkbookHelper
     */
    public static NavigateToSingleVmConnectionDetailWorkbook(params: IWorkbookNavigateSingleVmConnectionDetails): void {
        const template: IWorkbookTemplate = WorkbookTemplates.GetWorkbookTemplate(WorkbookTemplateId.SingleVMConnectionsOverview);

        const workbookParams: StringMap<any> = {};
        workbookParams[WorkbookConstant.source] = params.sourceName;
        workbookParams[WorkbookConstant.viewerMode] = 'true';
        workbookParams[WorkbookConstant.componentId] = params.computerId;
        workbookParams[WorkbookConstant.resourceIds] = [params.computerId];
        workbookParams[WorkbookConstant.template] = template.TemplatePath;
        workbookParams[WorkbookConstant.templateName] = template.DisplayName;

        // workbook params
        workbookParams['Hierarchy'] = '0';
        workbookParams['ComputerName'] = params.computerName;

        WorkbookHelper.SendOpenWorkbookMessage(workbookParams, template, params);
    }
}
