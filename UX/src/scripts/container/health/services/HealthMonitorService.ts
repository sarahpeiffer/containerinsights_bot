/** local */
import { IHealthMonitor } from '../IHealthMonitor';
import { HealthState } from '../HealthState';
import { IHealthModel } from '../IHealthModel';

/**
 * defines health monitor service functionality
 */
export interface IHealthMonitorService {
    /** 
     * gets a value indicating whether any monitor data is present 
     */
    readonly hasData: boolean;

    /** 
     * gets root monitor subject (instance) id 
     */
    readonly rootMonitorIdentifier: string;

    /**
     * gets time health data was loaded from store
     */
    readonly healthDataLoadedTimestamp: Date;

    /**
     * gets monitor from health model given its instance id
     * @param monitorIdentifier monitor (instance) id
     */
    getMonitor(monitorIdentifier: string): IHealthMonitor;

    /**
     * gets a value indicating whether health state of the first monitor
     * is worse than health state of the second
     * @param a first monitor
     * @param b second monitor
     */
    isWorse(a: HealthState, b: HealthState): boolean;
}

/**
 * provides health monitor service functionality
 */
export class HealthMonitorService implements IHealthMonitorService {
    /** health model */
    private _healthModel: IHealthModel;

    /** true if any state data is present */
    private _hasData: boolean;

    /** time health data was loaded */
    private _healthDataLoadedTimestamp: Date;

    /**
     * initializes an instance of the class
     * @param healthModel health model obtained from the store
     */
    constructor(healthModel: IHealthModel) {
        this._healthModel = healthModel;

        // TODO:
        // bbax: this can never be false... see HealthServicesFactory and HealthPaneView... if the healthModel
        // is null code long before this will crash and turn a "NoData" into a true exception
        this._hasData = !!healthModel;

        this._healthDataLoadedTimestamp = new Date();
    }

    /** 
     * gets a value indicating whether any monitor data is present 
     */
    public get hasData(): boolean {
        return this._hasData;
    }

    /** 
     * gets root monitor subject (instance) id 
     */
    public get rootMonitorIdentifier(): string {
        return this._healthModel.topLevelMonitorSubjectId;
    }

    /**
     * gets time health data was loaded from store
     */
    public get healthDataLoadedTimestamp(): Date {
        return this._healthDataLoadedTimestamp;
    }

    /**
     * gets monitor from health model given its instance id
     * @param monitorIdentifier monitor (instance) id
     */
    public getMonitor(monitorIdentifier: string): IHealthMonitor {
        if (!this._hasData) { return null; }

        if (!monitorIdentifier) {
            throw new Error(`@monitorIdentifier may not be null at HealthMonitorService.getMonitor()`)
        }

        const monitor = this._healthModel.monitors[monitorIdentifier];
        if (!monitor) { throw new Error(`Monitor with instance id "${monitorIdentifier}" does not exist in the model`); }

        return monitor;
    }

    /**
     * gets a value indicating whether health state of the first monitor
     * is worse than health state of the second
     * @param a first monitor
     * @param b second monitor
     */
    public isWorse(a: HealthState, b: HealthState): boolean {
        const aIndex = this.getHealthStateOrderIndex(a);
        const bIndex = this.getHealthStateOrderIndex(b);

        return (aIndex > bIndex);
    }

    /**
     * gets health state order index
     * @param state health state
     */
    private getHealthStateOrderIndex(state: HealthState): number {
        switch (state) {
            case HealthState.None:
                return 0;
            case HealthState.Healthy:
                return 1;
            case HealthState.Warning:
                return 2;
            case HealthState.Error:
                return 50;
            case HealthState.Unknown:
                return 50;
            case HealthState.Critical:
                return 100;
            default:
                throw new Error(`State '${HealthState[state]}' is not expected at HealthMonitorService.getHealthStateOrderIndex()`);
        }
    }
}
