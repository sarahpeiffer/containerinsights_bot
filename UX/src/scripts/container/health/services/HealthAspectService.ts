/** local */
import { IHealthAspect } from '../IHealthAspect';
import { IHealthServicesFactory } from '../factories/HealthServicesFactory';
import * as TelemetryStrings from '../../../shared/TelemetryStrings';

/**
 * defines health aspects service functionality
 */
export interface IHealthAspectService {
    /**
     * gets cluster health aspect list
     */
    readonly clusterHealthAspects: IHealthAspect[];

    /**
     * gets selected monitor
     * @param aspectIdentifier current selected heath aspect id
     */
    getSelectedMonitorIdentifier(aspectIdentifier: string): string;

    /**
     * sets selected monitor
     * @param aspectIdentifier id of the health aspect which contains selected monitor
     * @param monitorIdentifier selected monitor id
     */
    setSelectedMonitorIdentifier(aspectIdentifier: string, monitorIdentifier: string): void;
}

/**
 * implements health aspects functionality
 */
export class HealthAspectService implements IHealthAspectService {
    /** service factory */
    private _serviceFactory: IHealthServicesFactory;

    /** selected monitor map */
    private _selectedMonitorIdentifier: StringMap<string> = {};

    /**
     * initializes a new instance of the class
     * @param serviceFactory service factory
     */
    constructor (serviceFactory: IHealthServicesFactory) {
        if (!serviceFactory) { throw new Error(`@serviceFactory may not be null at HealthAspectService.ctor()`); }

        this._serviceFactory = serviceFactory;
    }

    /**
     * gets cluster health aspect list
     */
    public get clusterHealthAspects(): IHealthAspect[] {
        const healthMonitorService = this._serviceFactory.healthMonitorService;
        const displayStringService = this._serviceFactory.displayStringService;

        const rootChildren = displayStringService.getSortedMemberMonitors(healthMonitorService.rootMonitorIdentifier);
        if (!rootChildren || !rootChildren.length) { return []; }

        const aspects: IHealthAspect[] = [];

        const telemetry = this._serviceFactory.healthPaneTelemetryService

        for (const aspectMonitorId of rootChildren) {
            const aspectMonitor = healthMonitorService.getMonitor(aspectMonitorId);
            const aspectDisplayStrings = displayStringService.getMonitorDisplayStrings(aspectMonitor);

            aspects.push({
                aspectIdentifier: aspectMonitor.subjectId,
                displayName: aspectDisplayStrings.inContextDisplayName,
                state: aspectMonitor.state,
                stateDisplayName: displayStringService.getHealthStateDisplayName(aspectMonitor.state)
            });

            telemetry.logEvent(
                TelemetryStrings.HealthAspectRecord, 
                { 
                    aspectIdentifier: aspectMonitor.subjectId,
                    displayName: aspectDisplayStrings.inContextDisplayName,
                    state: aspectMonitor.state,
                    stateDisplayName: displayStringService.getHealthStateDisplayName(aspectMonitor.state)
                }, null
            );
        }

        return aspects;
    }

    /**
     * gets selected monitor
     * @param aspectIdentifier current selected heath aspect id
     */
    public getSelectedMonitorIdentifier(aspectIdentifier: string): string {
        if (!aspectIdentifier) { 
            throw new Error(`@aspectIdentifier may not be null at HealthMonitorService.getSelectedMonitorIdentifier()`); 
        }

        return this._selectedMonitorIdentifier[aspectIdentifier];
    }

    /**
     * sets selected monitor
     * @param aspectIdentifier id of the health aspect which contains selected monitor
     * @param monitorIdentifier selected monitor id
     */
    public setSelectedMonitorIdentifier(aspectIdentifier: string, monitorIdentifier: string): void {
        if (!aspectIdentifier) { 
            throw new Error(`@aspectIdentifier may not be null at HealthMonitorService.setSelectedMonitorIdentifier()`); 
        }
        
        this._selectedMonitorIdentifier[aspectIdentifier] = monitorIdentifier;
    }
}
