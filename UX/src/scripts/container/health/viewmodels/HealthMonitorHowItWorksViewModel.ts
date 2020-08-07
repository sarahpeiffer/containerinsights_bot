/** tpl */
import * as moment from 'moment';

/** shared */
import { BaseViewModel } from '../../../shared/BaseViewModel';

/** local */
import { HealthState } from '../HealthState';
import { HealthMonitorHowItWorksModel } from '../models/HealthMonitorHowItWorksModel';
import { IHealthServicesFactory } from '../factories/HealthServicesFactory';
import { HealthPaneObservableProp } from './HealthPaneObservableProp';

/**
 * MVVM view model for health monitor description component
 */
export class HealthMonitorHowItWorksViewModel extends BaseViewModel {
    /** health services factory */
    private _healthServicesFactory: IHealthServicesFactory;

    /** is view model fully initialized and can present data on screen */
    private _isInitialized: boolean;

    /** health monitor description model */
    private _model: HealthMonitorHowItWorksModel;

    /** 
     * initializes an instance of the class
     * @param healthServicesFactory services factory
     * @param parentContext parent view model
     * @param forceUpdate react callback to refresh view
     */
    public constructor(
        healthServicesFactory: IHealthServicesFactory,
        parentContext: BaseViewModel, 
        forceUpdate: reactForceUpdateHandler,
    ) {
        super(forceUpdate, parentContext);

        if (!healthServicesFactory) { 
            throw new Error(`@healthServicesFactory may not be null at HealthMonitorDescriptionViewModel.ctor()`); 
        }
        
        this._healthServicesFactory = healthServicesFactory;

        parentContext.handlePropertyChanged(this.onParentPropertyChanged.bind(this));
    }

    /**
     * initializes view model
     */
    public initialize(): void {
        const healthMonitorService = this._healthServicesFactory.healthMonitorService;
        const displayStringService = this._healthServicesFactory.displayStringService;

        this._model = null;
        this._isInitialized = !!this.parentContext.selectedMonitorIdentifier;

        if (this.parentContext.selectedMonitorIdentifier) {
            const rootMonitor = healthMonitorService.getMonitor(healthMonitorService.rootMonitorIdentifier);
            const monitor = healthMonitorService.getMonitor(this.parentContext.selectedMonitorIdentifier);
            const displayStrings = displayStringService.getMonitorDisplayStrings(monitor);

            this._model = new HealthMonitorHowItWorksModel(
                monitor.state,
                displayStringService.getHealthStateDisplayName(monitor.state),
                displayStrings.standaloneDisplayName,
                displayStrings.description,
                monitor.firstObservedDateTimeUtc,
                rootMonitor.lastUpdatedDateTimeUtc
            );
        }

        this.forceUpdate();
    }

    /**
     * gets a value indicating whether component is fully initialized
     * and can be presented on screen. This may not be the case when 
     * component is placed into DOM but is not visible yet
     */
    public get isInitialized(): boolean {
        return this._isInitialized;
    }

    /** 
     * gets monitor display name to use outside hierarchy
     */
    public get standaloneDisplayName(): string {
        return this._model.standaloneDisplayName;
    }

    /** 
     * gets monitor state
     */
    public get state(): HealthState {
        return this._model.state;
    }

    /** 
     * gets monitor state display name
     */
    public get stateDisplayName(): string {
        return this._model.stateDisplayName;
    }

    /** 
     * gets monitor description
     */
    public get description(): string {
        return this._model.description;
    }

    /** 
     * gets timestamp current cluster state was first observed
     */
    public get absoluteLastStateChangeDateTime(): string {
        return this.getFormattedDateTime(this._model.firstObservedDateTimeUtc);
    }

    /** 
     * gets timestamp current monitor state was first observed in relative terms to current time
     * @param fromUtcDateTime timestamp to calculate difference from
     */
    public getRelativeLastStateChangeDateTime(): string {
        const healthMonitorService = this._healthServicesFactory.healthMonitorService;

        return this.getFormattedRelativeDateTime(
            this._model.firstObservedDateTimeUtc, 
            healthMonitorService.healthDataLoadedTimestamp);
    }

    /** 
     * gets timestamp current monitor state was last recalculated on the agent
     */
    public get absoluteStateLastRecalculatedDateTime(): string {
        return this.getFormattedDateTime(this._model.lastRecalculatedDateTimeUtc);
    }

    /** 
     * gets timestamp current monitor state was last recalculated on the agent
     * @param fromUtcDateTime timestamp to calculate difference from
     */
    public getRelativeStateLastRecalculatedDateTime(): string {
        const healthMonitorService = this._healthServicesFactory.healthMonitorService;

        return this.getFormattedRelativeDateTime(
            this._model.lastRecalculatedDateTimeUtc,
            healthMonitorService.healthDataLoadedTimestamp);
    }

    /**
     * converts date time value to display string
     * @param dateTime date time to format
     */
    private getFormattedDateTime(dateTime: Date): string {
        if (!dateTime) { return null; } 

        const transitionTimeLocal = moment.utc(dateTime).local();
        
        return transitionTimeLocal.format('LLL');
    }

    /** 
     * gets difference between timestamps as display string
     * @param dateTime timestamp to calculate distance to
     * @param fromUtcDateTime timestamp to calculate difference from
     */
    private getFormattedRelativeDateTime(dateTime: Date, fromLocalDateTime: Date): string {
        if (!dateTime) { return null; } 

        const fromMoment = moment(fromLocalDateTime).utc();

        // TODO-LOC: how is this loc'ed?
        return moment.utc(dateTime).from(fromMoment);
    }

    /**
     * handles property change in the parent view model
     * @param propertyName changed property name
     */
    private onParentPropertyChanged(propertyName: string): void {
        if (propertyName === HealthPaneObservableProp.SelectedMonitorIdentifier) {
            this.initialize();
        }
    }
}
