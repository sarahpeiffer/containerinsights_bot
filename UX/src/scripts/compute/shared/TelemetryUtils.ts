import { TimeData } from '@appinsights/pillscontrol-es5';
import { isRelative } from '@appinsights/pillscontrol-es5/dist/TimeUtils';

/**
 * Block imports
 */
import * as moment from 'moment';
import { ITelemetry } from '../../shared/Telemetry';
import { TimeInterval } from '../../shared/data-provider/TimeInterval';
import { IFinishableTelemetry } from '../../shared/Telemetry';

/* required for ie11... this will enable most of the Object.assign functionality on that browser */
import { polyfillObjectAssign } from '../../shared/ObjectAssignShim';
import { StringMap } from '../../shared/StringMap';
polyfillObjectAssign();

export interface IAtScaleTelemetryContext {
    solutionType: string;
    hybridScope: {
        workspace: string;
        omsgroup: string;
        servicemapComputer?: string;
    };
    azureScope: {
        subscription: string;
        resourceGroup: string;
        resourceType: string;
        resource: string;
        workspace?: string;
        vmssInstance?: string;
    };
    timerange: TimeData;
}

/**
 * This class has static utilities which can be used by VMInsights telemetry
 */
export class TelemetryUtils {
    /**
     * Util function which is used to log initial Iframe content ready time for VmInsights Compute-Map and Compute-Perf blades.
     * @param azurePortalMeasures Perf measures passed from ibiza blades
     * @param iframePerfMeasures Perf measures captured in local iframe
     * @param telemetry telemetry object
     * @param eventName Custom event name
     */
    public static onLoadComplete(iframePerfMeasures: StringMap<number>, azurePortalMeasures: StringMap<number>,
        telemetry: ITelemetry, eventName: string, customProperties: any = {}): void {
        const constructorMoment = azurePortalMeasures.auxme_templateBladeInit ?
            moment((azurePortalMeasures.auxme_templateBladeInit as any)) :
            moment((azurePortalMeasures.auxme_constructor as any));

        const finalTelemetryMeasures = Object.assign({}, azurePortalMeasures, iframePerfMeasures);

        // remove sequenceNumber and frame_name
        delete finalTelemetryMeasures.sequenceNumber;
        if (finalTelemetryMeasures.frame_name) {
            delete finalTelemetryMeasures.frame_name;
        }


        // bbax: should be a few ms tops different then ibizaResolution, but lets put it here for peace of mind..
        finalTelemetryMeasures['onLoadComplete'] = Date.now();

        // bbax: order the keys so the console.logs are pretty... vanity!
        const keys = Object.keys(finalTelemetryMeasures);
        keys.sort((left, right) => {
            return finalTelemetryMeasures[left] - finalTelemetryMeasures[right];
        });

        keys.forEach((key) => {
            const measureMoment = moment(finalTelemetryMeasures[key]);
            finalTelemetryMeasures[key] = measureMoment.diff(constructorMoment, 'milliseconds');
        });
        telemetry.logEvent(eventName, customProperties, finalTelemetryMeasures);
        telemetry.flush();
    }

    /**
     * Util function to get start time and end time in ISO format in an object
     * @param time TimeData object, typically used in TimeRange control panel
     */
    public static getDateTimeRangeForTelemetry(time: TimeData): StringMap<string> {
        const startAndEnd = TimeInterval.getStartAndEndDate(time, isRelative(time));
        const startAndEndTime: StringMap<string> = {
            startTime: startAndEnd.start.toISOString(),
            endTime: startAndEnd.end.toISOString()
        };
        return startAndEndTime;
    }

    /**
     * Called from the "then" of a Kusto query to complete the Api tracking telemetry.
     * We want to check sequencing and data validation before completing the telemetry event.
     * @returns returns true on successful completion of the telemetry event.
     * @param event Finishable telemetry event
     * @param incorrectSequence boolean value tells whether the data is in sequence or not
     * @param incorrectData boolean value tells whether the received data is correct or not.
     * @param failureMessage message to be thrown when incorrectData is false
     */
    public static completeApiTelemetryEvent(event: IFinishableTelemetry, incorrectSequence: boolean,
        incorrectData: boolean, failureMessage?: string, customProps?: StringMap<any>): boolean {
        if (incorrectSequence) {
            return false;
        }

        if (incorrectData) {
            throw failureMessage;
        }

        event.complete(customProps);
        return true;
    }
}
