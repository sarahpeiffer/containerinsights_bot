/** shared */
import { BaseViewModel } from '../../../shared/BaseViewModel';

/** local */
import { IHealthServicesFactory, HealthServicesFactory } from '../factories/HealthServicesFactory';
import { HealthAspectsModel } from '../models/HealthAspectsModel';
import { HealthState } from '../HealthState';
import { HealthPaneObservableProp } from './HealthPaneObservableProp';
import { IHealthAspect } from '../IHealthAspect';

/**
 * Health aspects component view model
 */
export class HealthAspectsViewModel extends BaseViewModel {
    /** services factory */
    private _healthServicesFactory: IHealthServicesFactory;

    /** underlying model */
    private _model: HealthAspectsModel;

    /**
     * initializes an instance of the class
     * @param healthServicesFactory services factory
     * @param parentContext parent context (view model)
     * @param forceUpdate function to refresh component view
     */
    public constructor(
        healthServicesFactory: IHealthServicesFactory,
        parentContext: BaseViewModel, 
        forceUpdate: reactForceUpdateHandler,
    ) {
        super(forceUpdate, parentContext);

        if (!healthServicesFactory) { throw new Error(`@healthServicesFactory may not be null at HealthPaneViewModel.ctor()`); }
        
        this._healthServicesFactory = healthServicesFactory;
    }

    /**
     * initializes view model
     */
    public initialize(): void {
        const healthAspectService = this._healthServicesFactory.healthAspectService;
        const healthMonitorService = this._healthServicesFactory.healthMonitorService;

        const monitor = healthMonitorService.getMonitor(healthMonitorService.rootMonitorIdentifier);
        const aspects = healthAspectService.clusterHealthAspects;

        this._model = new HealthAspectsModel(
            monitor.state,
            monitor.firstObservedDateTimeUtc,
            monitor.lastUpdatedDateTimeUtc,
            this.getSelectedAspectIdentifier(aspects),
            aspects
        );
    }

    /**
     * gets cluster health state
     */
    public get state(): HealthState {
        return this._model.state;
    }

    /**
     * gets cluster health state display name
     */
    public get stateDisplayName(): string {
        return HealthServicesFactory.instance.displayStringService.getHealthStateDisplayName(this._model.state);
    }

    /** 
     * gets selected cluster health aspect
     */
    public get selectedAspectIdentifier(): string {
        return this._model.selectedAspectIdentifier;
    }

    /** 
     * sets selected cluster health aspect
     */
    public set selectedAspectIdentifier(aspectIdentifier: string) {
        this._model.selectedAspectIdentifier = aspectIdentifier;

        this.propertyChanged(HealthPaneObservableProp.SelectedAspectIdentifier)
    }

    /** 
     * gets timestamp current cluster state was first observed
     */
    public get absoluteLastStateChangeDateTime(): string {
        return HealthServicesFactory.instance.displayStringService.getFormattedDateTime(
            this._model.firstObservedDateTimeUtc);
    }

    /** 
     * gets timestamp current cluster state was first observed in relative terms to current time
     * @param fromUtcDateTime timestamp to calculate difference from
     */
    public getRelativeLastStateChangeDateTime(): string {
        const serviceFactory = HealthServicesFactory.instance;

        return serviceFactory.displayStringService.getFormattedRelativeDateTime(
            this._model.firstObservedDateTimeUtc, 
            serviceFactory.healthMonitorService.healthDataLoadedTimestamp);
    }

    /** 
     * gets timestamp current cluster state was last updated in store
     */
    public get absoluteStateLastRecalculatedDateTime(): string {
        return HealthServicesFactory.instance.displayStringService.getFormattedDateTime(
            this._model.lastRecalculatedDateTimeUtc);
    }

    /** 
     * gets timestamp current cluster state was last updated in store
     * @param fromUtcDateTime timestamp to calculate difference from
     */
    public getRelativeStateLastRecalculatedDateTime(): string {
        const serviceFactory = HealthServicesFactory.instance;

        return HealthServicesFactory.instance.displayStringService.getFormattedRelativeDateTime(
            this._model.lastRecalculatedDateTimeUtc, 
            serviceFactory.healthMonitorService.healthDataLoadedTimestamp);
    }

    /**
     * gets cluster health aspects
     */
    public get aspects(): IHealthAspect[] {
        return this._model.aspects;
    }

    /**
     * gets aspect identifier to make selected (the worst one by state) when list is visualized
     * @param aspects health aspect list
     */
    private getSelectedAspectIdentifier(aspects: IHealthAspect[]): string {
        if (!aspects || !aspects.length) {
            throw new Error(`@aspects may not be null or empty at HealthAspectsViewModel.getSelectedAspectIdentifier()`);
        }

        const healthMonitorService = this._healthServicesFactory.healthMonitorService;

        let selectedAspectId = aspects[0].aspectIdentifier;
        let worstAspectHealthState = aspects[0].state;

        for (const aspect of aspects) {
            if (healthMonitorService.isWorse(aspect.state, worstAspectHealthState)) {
                worstAspectHealthState = aspect.state;
                selectedAspectId = aspect.aspectIdentifier;
            }
        }

        return selectedAspectId;
    }
}
