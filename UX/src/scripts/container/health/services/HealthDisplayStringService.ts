/** tpl */
import * as moment from 'moment';

/** local */
import { HealthState } from '../HealthState';
import { IHealthMonitorVisualizationDefinition } from './healthModel/IHealthMonitorVisualizationDefinition';
import { IHealthMonitorDisplayStrings } from '../IHealthMonitorDisplayStrings';
import { IHealthMonitor } from '../IHealthMonitor';
import { IHealthServicesFactory } from '../factories/HealthServicesFactory';

/**
 * defines health monitor display string service functionality
 */
export interface IHealthDisplayStringService {
    /**
     * gets display strings required for visualizing a monitor
     * @param monitor health monitor
     * @returns set of display strings for monitor provided
     */
    getMonitorDisplayStrings(monitor: IHealthMonitor): IHealthMonitorDisplayStrings;

    /**
     * gets view component name for visualizing monitor details
     * @param monitorIdentifier monitor subject (instance) id
     */
    getMonitorDetailsViewTypeName(monitorIdentifier: string): string;

    /**
     * gets member monitor ids in sort order by display name
     * @param monitorIdentifier parent monitor id
     */
    getSortedMemberMonitors(monitorIdentifier: string): string[];
    
    /**
     * gets monitor state display name
     * @param state monitor state
     */
    getHealthStateDisplayName(state: HealthState): string;

    /**
     * converts date time value to display string
     * @param dateTime date time to format
     */
    getFormattedDateTime(dateTime: Date): string;

    /** 
     * gets difference between timestamps as display string
     * @param dateTime timestamp to calculate distance to
     * @param fromUtcDateTime timestamp to calculate difference from
     */
    getFormattedRelativeDateTime(dateTime: Date, fromLocalDateTime: Date): string;
}

/**
 * monitor subject id, display name tuple for sorting purposes
 */
interface ISortableMonitorTuple {
    subjectId: string,
    displayName: string
}

export class HealthDisplayStringService implements IHealthDisplayStringService {
    /** services factory */
    private _healthServicesFactory: IHealthServicesFactory;

    /** model definitions for monitor visualizations */
    private _modelVisualizationDefinitions: StringMap<IHealthMonitorVisualizationDefinition>;

    /**
     * initializes an instance of the class
     * @param healthServicesFactory services factory
     * @param modelVisualizationDefinitions model definitions for monitor visualizations
     */
    constructor(
        healthServicesFactory: IHealthServicesFactory,
        modelVisualizationDefinitions: StringMap<IHealthMonitorVisualizationDefinition>
    ) {
        if (!healthServicesFactory) {
            throw new Error(`@healthServicesFactory may not be null at HealthLocalizationService.ctor()`);
        }
        if (!modelVisualizationDefinitions) {
            throw new Error(`@modelVisualizationDefinitions may not be null at HealthLocalizationService.ctor()`);
        }

        this._healthServicesFactory = healthServicesFactory;
        this._modelVisualizationDefinitions = modelVisualizationDefinitions;
    }

    /**
     * gets display strings required for visualizing a monitor
     * @param monitor health monitor
     * @returns set of display strings for monitor provided
     */
    public getMonitorDisplayStrings(monitor: IHealthMonitor): IHealthMonitorDisplayStrings {
        if (!monitor) {
            throw new Error(`@monitor may not be null at IHealthLocalizationService.getMonitorDisplayStrings()`);
        }

        const visualizationDefs = this._modelVisualizationDefinitions[monitor.typeId];

        if (!visualizationDefs) {
            return {
                detailsViewTypeName: null, // explicit null would be resolved to default details visualization
                inContextDisplayName: monitor.typeId,
                standaloneDisplayName: monitor.typeId,
                description: ''
            };
        }

        return {
            detailsViewTypeName: visualizationDefs.detailsViewTypeName,
            inContextDisplayName: this.processTemplate(visualizationDefs.inContextDisplayNameTemplate, monitor),
            standaloneDisplayName: this.processTemplate(visualizationDefs.standaloneDisplayNameTemplate, monitor),
            description: this.processTemplate(visualizationDefs.descriptionTemplate, monitor)
        };
    }

    /**
     * gets view component name for visualizing monitor details
     * @param monitorIdentifier monitor subject (instance) id
     */
    public getMonitorDetailsViewTypeName(monitorTypeIdentifier: string): string {
        if (!monitorTypeIdentifier) {
            throw new Error(`@monitorTypeIdentifier may not be null at IHealthLocalizationService.getMonitorDetailsViewTypeName()`);
        }

        const visualizationDefs = this._modelVisualizationDefinitions[monitorTypeIdentifier];

        return visualizationDefs ? visualizationDefs.detailsViewTypeName : null;
    }

    /**
     * gets member monitor ids in sort order by display name
     * @param monitorIdentifier parent monitor id
     */
    public getSortedMemberMonitors(monitorIdentifier: string): string[] {
        const healthMonitorService = this._healthServicesFactory.healthMonitorService;

        if (!healthMonitorService.hasData) { return null; }

        if (!monitorIdentifier) {
            throw new Error(`@monitorIdentifier may not be null at HealthMonitorService.getSortedMemberMonitors()`)
        }

        const monitors: ISortableMonitorTuple[] = [];
        const memberMonitorIdentifiers = healthMonitorService.getMonitor(monitorIdentifier).memberSubjectIds;

        if (!memberMonitorIdentifiers || !memberMonitorIdentifiers.length) { return []; }

        for (const monitorIdentifier of memberMonitorIdentifiers) {
            const memberMonitor = healthMonitorService.getMonitor(monitorIdentifier);
            const displayName = this.getMonitorDisplayStrings(memberMonitor).inContextDisplayName;

            monitors.push({
                subjectId: monitorIdentifier,
                displayName
            });
        }

        return monitors.sort(this.compareMonitors).map((monitor) => monitor.subjectId);
    }

    /**
     * gets monitor state display name
     * @param state monitor state
     */
    public getHealthStateDisplayName(state: HealthState): string {
        // TODO-LOC
        switch (state) {
            case HealthState.Healthy:
                return 'Healthy';
            case HealthState.Warning:
                return 'Warning';
            case HealthState.Critical:
                return 'Critical';
            case HealthState.None:
                return 'None';
            case HealthState.Error:
                return 'Error';
                case HealthState.Unknown:
                return 'Unknown';
            default:
                return HealthState[state];
        }
    }

    /**
     * converts date time value to display string
     * @param dateTime date time to format
     */
    public getFormattedDateTime(dateTime: Date): string {
        if (!dateTime) { return null; } 

        const transitionTimeLocal = moment.utc(dateTime).local();
        
        return transitionTimeLocal.format('LLL');
    }

    /** 
     * gets difference between timestamps as display string
     * @param dateTime timestamp to calculate distance to
     * @param fromUtcDateTime timestamp to calculate difference from
     */
    public getFormattedRelativeDateTime(dateTime: Date, fromLocalDateTime: Date): string {
        if (!dateTime) { return null; } 

        const fromMoment = moment(fromLocalDateTime).utc();

        // TODO-LOC: how is this loc'ed?
        return moment.utc(dateTime).from(fromMoment);
    }

    /**
     * injects monitor data into string visualization template
     * @param template display string template containing references
     *                 to monitor data such as ${label[<label-name>]}
     * @param monitor monitor for which display string is constructed
     */
    private processTemplate(template: string, monitor: IHealthMonitor): string {
        if (!template) { throw new Error(`@template may not be null at IHealthLocalizationService.processTemplate()`); }
        if (!monitor) { throw new Error(`@monitor may not be null at IHealthLocalizationService.processTemplate()`); }

        return template.replace(/\$\{label\[(.*?)\]\}/gi, function(match, labelName) {
            return (monitor.labels || {})[labelName] || '';
        });
    }

    /**
     * compares two monitors for sorting purposes
     * @param a monitor to compare
     * @param b monitor to compare
     * @returns negative number if monitor a is 'less' in sort order than b, zero if equal, positive number otherwise
     */
    private compareMonitors(a: ISortableMonitorTuple, b: ISortableMonitorTuple): number {
        if (!a || !b) { return 0 };

        let aNumericSuffix: number = null;
        let bNumericSuffix: number = null;
        let aPrefix = null;
        let bPrefix = null;

        if (a.displayName.lastIndexOf('-') > -1) {
            aNumericSuffix = Number(a.displayName.substring(a.displayName.lastIndexOf('-') + 1));
            aPrefix = a.displayName.substring(0, a.displayName.lastIndexOf('-') + 1);
        }

        if (b.displayName.lastIndexOf('-') > -1) {
            bNumericSuffix = Number(b.displayName.substring(b.displayName.lastIndexOf('-') + 1));
            bPrefix = b.displayName.substring(0, b.displayName.lastIndexOf('-') + 1);
        }

        if ((aPrefix !== null) && (aPrefix === bPrefix) && (aNumericSuffix !== NaN) && (bNumericSuffix !== NaN)) { 
            return aNumericSuffix - bNumericSuffix;
        }

        if (a.displayName < b.displayName) { return -1 };
        if (a.displayName > b.displayName) { return 1 };
            
        return 0;
    }
}
