/** shared */
import { BaseViewModel } from '../../../shared/BaseViewModel';

/** local */
import { HealthPaneObservableProp } from './HealthPaneObservableProp';
import { HealthState } from '../HealthState';
import { HealthMonitorPropertyPanelHeaderModel } from '../models/HealthMonitorPropertyPanelHeaderModel';
import { IHealthServicesFactory } from '../factories/HealthServicesFactory';

/**
 * MVVM view model for health monitor properties header component
 */
export class HealthMonitorPropertyPanelHeaderViewModel extends BaseViewModel {
    /** health services factory */
    private _healthServicesFactory: IHealthServicesFactory;

    /** true if component is fully initialized and ready for visualization */
    private _isInitialized: boolean;

    /** health monitor config model */
    private _model: HealthMonitorPropertyPanelHeaderModel;

    /** 
     * initializes an instance of the class
     * @param healthServicesFactory services factory
     * @param parentContext parent view model
     * @param forceUpdate react component update handler
     */
    public constructor(
        healthServicesFactory: IHealthServicesFactory,
        parentContext: BaseViewModel, 
        forceUpdate: reactForceUpdateHandler,
    ) {
        super(forceUpdate, parentContext);

        if (!healthServicesFactory) { throw new Error(`@healthServicesFactory may not be null at HealthTreeNodeViewModel.ctor()`); }
        
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
            const monitor = healthMonitorService.getMonitor(this.parentContext.selectedMonitorIdentifier);
            this._model = new HealthMonitorPropertyPanelHeaderModel(
                monitor.state, 
                displayStringService.getMonitorDisplayStrings(monitor).standaloneDisplayName);
        }

        this.forceUpdate();
    }

    /**
     * gets a value indicating whether component is fully initialized and ready for visualization
     */
    public get isInitialized(): boolean {
        return this._isInitialized;
    }

    /** 
     * gets monitor state 
     */
    public get state(): HealthState {
        return this._model.state;
    }

    /** 
     * gets monitor display name
     */
    public get standaloneDisplayName(): string {
        return this._model.standaloneDisplayName;
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
