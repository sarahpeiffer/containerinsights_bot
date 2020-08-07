/** tpl */
import * as moment from 'moment';

/** shared */
import { PortalMessagingProvider } from '../../shared/messaging/v2/PortalMessagingProvider';
import { ITelemetry, TelemetryMainArea } from '../../shared/Telemetry';
import { TelemetryFactory } from '../../shared/TelemetryFactory';
import { polyfillObjectAssign } from '../../shared/ObjectAssignShim';
polyfillObjectAssign();

/** local */
import { ContainerGlobals } from '../ContainerGlobals';
import { IBladeLoadManager, BladeLoadPath, LoadTrackingTerminationReason } from './IBladeLoadManager';

/**
 * Message types exchanged with hosting blade
 */
const QueryCompletedMessageType: string = 'finishedLoadingIFrame';
const LoadCompletedMessageType: string = 'loadComplete';

/**
 * Set of performance emasuring points
 */
export enum PerformanceMeasure {
    SendFinishLoading = 'frame_sendFinishLoading',
    LoadCompleted = 'onLoadComplete',
    FrameQueryStart = 'frame_mainContentQueryStart',
    FrameQueryEnd = 'frame_mainContentQueryEnd',
    LoadTerminated = 'frame_loadTrackingTerminated',
}

/**
 * Set of network query names
 */
export enum QueryName {
    Charts = 'ChartQueryName',
    Grid = 'GridQueryName',
    PropertyPanel = 'PropertyPanelQueryName',
    Mesh = 'MeshChartQueryName',
}


/**
 * Implements functionality to track page load performance
 */
export class BladeLoadManager implements IBladeLoadManager {
    /** set of pending network query names */
    private pendingQueryNames: string[];

    /** telemetry object */
    private telemetry: ITelemetry;

    /** true if manager was initialized */
    private isInitialized: boolean;

    /** true if load completion was reported */
    private isLoadCompleted: boolean;

    /** path the blade was loaded through */
    private bloadeLoadPath: BladeLoadPath;

    /** true if blade load is complete from INITIAL load */
    private isInitialLoadComplete: boolean;

    /**
     * Intantiates an instance of the class
     */
    private constructor() {
        this.bloadeLoadPath = BladeLoadPath.Kusto;
        this.processLoadCompleteMessage = this.processLoadCompleteMessage.bind(this);
        this.isInitialLoadComplete = false;

        PortalMessagingProvider.Instance().registerProcessor(LoadCompletedMessageType, this.processLoadCompleteMessage);
    }

    /**
     * Gets singleton instance
     * @returns instance of the global blade load manager
     */
    public static Instance(): IBladeLoadManager {
        if (!ContainerGlobals.bladeLoadManager) {
            ContainerGlobals.bladeLoadManager = new BladeLoadManager();
        }

        return ContainerGlobals.bladeLoadManager;
    }

    /**
     * Initializes performance tracking instance
     * @param telemetryAreaName area to set on telemetry
     * @param pendingQueryNames set of queries that are expected to execute to fill the page
     */
    public initialize(
        telemetryArea: TelemetryMainArea,
        pendingQueryNames: string[]
    ): void {
        if (!pendingQueryNames || !pendingQueryNames.length) {
            throw new Error(`Parameter @pendingQueryNames may not be null or empty array`);
        }

        if (this.isInitialized) { return; }

        this.pendingQueryNames = pendingQueryNames.slice();
        this.telemetry = TelemetryFactory.get(telemetryArea)
        this.isInitialized = true;
        this.isLoadCompleted = false;
    }

    /**
     * Fetch the current value of isInitialLoadComplete used for tracking INITIAL blade load completion only
     */
    public fetchIsInitialLoadComplete(): boolean {
        return this.isInitialLoadComplete;
    }

    /**
     * set the load type for the blade loadS
     * @param bladeLoadPath type of load (mdm vs kusto)
     */
    public asLoadType(bladeLoadPath: BladeLoadPath): void {
        this.bloadeLoadPath = bladeLoadPath;
    }

    /**
     * Invoked when network query is completed
     * @param queryName network query name
     */
    public queryCompleted(queryName: string): void {
        if (!queryName) { throw new Error(`Parameter @queryName may not be null or empty`); }

        if (!this.isInitialized) { throw new Error(`Instance of BladeLoadManager must be initialized prior to calling member methods`); }

        // go through the list of network queries we expected to complete and see if the one reported completed 
        // now is on that list; if so - communicate to hosting blade. If not, we likely had user interaction
        // (navigate to different tab) that triggered query we did not expect to run on initial blade load
        this.pendingQueryNames = this.pendingQueryNames.filter((item) => (item !== queryName));
        PortalMessagingProvider.Instance().sendMessage(QueryCompletedMessageType, queryName);

        // record perf measure indicating we completed all queries in case we have nothing
        // else pending in the initial list of queries
        if (this.pendingQueryNames.length === 0) {
            this.setPerformanceMeasure(PerformanceMeasure.FrameQueryEnd);
            this.setPerformanceMeasure(PerformanceMeasure.SendFinishLoading);
        }
    }

    /**
     * Stops load tracking and reports completion immediately
     * @param reason reason load tracking should be stopped
     */
    public terminateLoadTracking(reason: LoadTrackingTerminationReason): void {
        if (!this.isInitialized) { throw new Error(`Instance of BladeLoadManager must be initialized prior to calling member methods`); }

        this.setPerformanceMeasure(PerformanceMeasure.LoadTerminated);
        this.setPerformanceMeasure(`${PerformanceMeasure.LoadTerminated.toString()}_${LoadTrackingTerminationReason[reason]}`);

        // report remaining queries from the list we originally expected to run as completed
        while (this.pendingQueryNames.length > 0) {
            this.queryCompleted(this.pendingQueryNames[0]);
        }
    }

    /**
     * Sets page load perfromance measuring point
     * @param measureName measuring point name
     */
    public setPerformanceMeasure(measureName: string): void {
        if (!this.isInitialized) { throw new Error(`Instance of BladeLoadManager must be initialized prior to calling member methods`); }

        if (!measureName) { throw new Error(`Parameter @measureName may not be null or empty`); }

        if (!ContainerGlobals.performanceMeasures[measureName]) {
            ContainerGlobals.performanceMeasures[measureName] = Date.now();
        }
    }

    /**
     * Processes 'blade load completed' event
     * @param event load completed event
     */
    private processLoadCompleteMessage(event: any): void {
        if (this.isLoadCompleted) { throw new Error(`BladeLoadManager already reported load completed`); }

        if (!event) { throw new Error(`Received null event while expecting 'loadComplete' event`); }
        if (!event.detail) { throw new Error(`Received 'loadComplete' event missing payload`); }
        if (!event.detail.rawData) { throw new Error(`Received 'loadComplete' event missing payload's rawData property`); }

        // bbax: should be a few ms tops different then ibizaResolution, but lets put it here for peace of mind..
        this.setPerformanceMeasure(PerformanceMeasure.LoadCompleted);

        // merge extension-calculated and iframe-calculated measures
        const extensionMeasures = JSON.parse(event.detail.rawData) as StringMap<number>;
        const finalTelemetryMeasures = Object.assign({}, extensionMeasures, ContainerGlobals.performanceMeasures);
        delete finalTelemetryMeasures.sequenceNumber;

        this.logToConsole(finalTelemetryMeasures);

        this.telemetry.logEvent('iFrameLoadMeasures', { bladeLoadPath: this.bloadeLoadPath }, finalTelemetryMeasures);

        this.isLoadCompleted = true;
        this.isInitialLoadComplete = true;
    }

    /**
     * Logs load performance measures to browser's console
     * @param finalTelemetryMeasures set of load telemetry measures
     */
    private logToConsole(finalTelemetryMeasures: StringMap<number>): void {
        const constructorMoment = moment((finalTelemetryMeasures.auxme_constructor as any));

        // bbax: order the keys so the console.logs are pretty... vanity!
        const keys = Object.keys(finalTelemetryMeasures);
        keys.sort((left, right) => {
            return finalTelemetryMeasures[left] - finalTelemetryMeasures[right];
        });

        // bbax: enumerate the keys, calculate their difference from ctor of the blade
        console.log('-- Start of Page Load Telemetry Measures --');

        keys.forEach((key) => {
            const measureMoment = moment(finalTelemetryMeasures[key]);
            finalTelemetryMeasures[key] = measureMoment.diff(constructorMoment, 'milliseconds');
            console.log(`${key} : ${finalTelemetryMeasures[key]}`);
        });

        console.log('-- End of Page Load Telemetry Measures --');
    }
}
