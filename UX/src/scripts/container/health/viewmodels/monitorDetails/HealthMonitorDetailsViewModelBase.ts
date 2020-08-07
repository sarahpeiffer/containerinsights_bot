/** shared */
import { BaseViewModel } from '../../../../shared/BaseViewModel';

/** local */
import { HealthMonitorDetailsContainerViewModel } from './HealthMonitorDetailsContainerViewModel';
import { HealthPaneObservableProp } from '../HealthPaneObservableProp';
import { IHealthMonitorDetailsViewModel } from './IHealthMonitorDetailsViewModel';
import { IHealthServicesFactory } from '../../factories/HealthServicesFactory';

export abstract class HealthMonitorDetailsViewModelBase extends BaseViewModel implements IHealthMonitorDetailsViewModel {
    /** health services factory */
    private _healthServicesFactory: IHealthServicesFactory;

    private _monitorIdentifier: string;

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
            throw new Error(`@healthServicesFactory may not be null at HealthMonitorDetailsViewModelBase.ctor()`); 
        }
        
        this._healthServicesFactory = healthServicesFactory;

        parentContext.handlePropertyChanged(this.onParentPropertyChanged.bind(this));
    }

    /**
     * gets a value indicating whether view is fully initialized and ready for visualization
     */
    public get isInitialized(): boolean {
        return !!this._monitorIdentifier;
    }

    /**
     * initializes monitor details view model
     * @param monitorIdentifier monitor identifier of the monitor displayed
     */
    public initialize(monitorIdentifier: string): void {
        const parentContext = this.parentContext as HealthMonitorDetailsContainerViewModel;

        if (monitorIdentifier === parentContext.selectedMonitorIdentifier) {
            this.createDetailsModel(monitorIdentifier);
            this._monitorIdentifier = monitorIdentifier;

            this.forceUpdate();
        }
    }

    /**
     * when overridden in child class constructs monitor details model
     * @param monitorIdentifier 
     */
    protected abstract createDetailsModel(monitorIdentifier: string);

    /**
     * gets service factory instance
     */
    protected get healthServicesFactory(): IHealthServicesFactory {
        return this._healthServicesFactory;
    }

    /** 
     * gets monitor identifier of the displayed monitor
     */
    public get monitorIdentifier(): string {
        return this._monitorIdentifier;
    }

    /**
     * callback invoked when parent view model's property changes
     * @param propertyName name of the changed property
     */
    private onParentPropertyChanged(propertyName: string): void {
        if (propertyName === HealthPaneObservableProp.SelectedMonitorIdentifier) {
            this.initialize(this._monitorIdentifier);
        }
    }
}
