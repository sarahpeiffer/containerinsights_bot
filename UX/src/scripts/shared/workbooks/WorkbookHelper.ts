/**
 * Third party
 */
import * as moment from 'moment';

/**
 * Shared
 */
import { StringMap } from '../StringMap';
import { IMessagingProvider } from '../MessagingProvider';
import { ITelemetry } from '../Telemetry';


export interface IWorkbookParams {
    configurationId?: string;
    workbookTemplateName?: string;
    componentId: string;
    resourceIds: string[];
    type?: string;
    notebookParams?: string;
    source?: string;
    viewerMode?: string;
    newNotebookData?: string;
    galleryResourceType?: string;
    timeContext?: string;
}
export enum WorkbookParams {
    ComponentId = 'componentId',
    ResourceIds = 'resourceIds',
    NewNotebookData = 'newNotebookData',
    Source = 'source',
    WorkBookTemplateName = 'workbookTemplateName',
    ConfigurationId = 'configurationId',
    ViewerMode = 'viewerMode',
    NotebookParams = 'notebookParams'
}

/**
 * `messagingProvider` and `telemetry` are used within `WorkbookHelper` to transmit messages to the
 * parent blade and record telemetry
 *
 * @export
 * @interface IWorkbookProvider
 */
export interface IWorkbookProvider {
    messagingProvider: IMessagingProvider;
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
    computerName: string;
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

export interface ITimeRange {
    durationMs: number;
    endTime?: Date;
}

/** 
* Shared utility method for opening Workbooks
*/
export class WorkbookHelper {
    public static sendOpenWorkbookMessage(
        workbookParams: IWorkbookParams,
        messagingProvider: IMessagingProvider,
        telemetry: ITelemetry,
        telemetryId?: string
    ): void {
        // Array of string Azure resource ids, the resources the workbook will target
        workbookParams.resourceIds = workbookParams.resourceIds || [workbookParams.componentId];
        workbookParams.notebookParams = JSON.stringify(workbookParams.notebookParams);
        workbookParams.timeContext = JSON.stringify(workbookParams.timeContext);
        workbookParams.viewerMode = workbookParams.viewerMode.toString();

        if (messagingProvider && messagingProvider.sendOpenWorkbook) {
            messagingProvider.sendOpenWorkbook(workbookParams);
            telemetry.logEvent(workbookParams.source, Object.assign(workbookParams, { telemetryId: telemetryId || '' }), null);
        }   
    }

    public static convertCITimeStateToTimeRange(
        startDateTimeUtc: Date, 
        endDateTimeUtc: Date, 
        isTimeRelative: boolean, 
        timeRangeSeconds: number
    ) {
        let timeRange: ITimeRange;
        if (isTimeRelative === true) {
            timeRange = {
                durationMs: timeRangeSeconds * 1000
            }
        } else {
            const startMoment = moment(startDateTimeUtc);
            const endMoment = moment(endDateTimeUtc);
            const duration = moment.duration(endMoment.diff(startMoment));
            const durationMs = moment.duration(duration).asMilliseconds();
            timeRange = {
                durationMs,
                endTime: endDateTimeUtc
            }
        }
        return timeRange;
    }
}
