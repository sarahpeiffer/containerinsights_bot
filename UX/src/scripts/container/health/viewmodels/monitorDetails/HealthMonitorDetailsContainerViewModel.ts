/** shared */
import { BaseViewModel } from '../../../../shared/BaseViewModel';

/** local */
import { HealthPaneObservableProp } from '../HealthPaneObservableProp';
import { IHealthServicesFactory } from '../../factories/HealthServicesFactory';
import { HealthMonitorDetailsContainerModel } from '../../models/monitorDetails/HealthMonitorDetailsContainerModel';

export class HealthMonitorDetailsContainerViewModel extends BaseViewModel {
    /** health services factory */
    private _healthServicesFactory: IHealthServicesFactory;

    /** true if view if fully initialized and ready to be displayed */
    private _isInitialized: boolean;

    /** health monitor description model */
    private _model: HealthMonitorDetailsContainerModel;

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
            throw new Error(`@healthServicesFactory may not be null at HealthMonitorDetailsContainerViewModel.ctor()`); 
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
            const monitor = healthMonitorService.getMonitor(this.parentContext.selectedMonitorIdentifier);
            const detailsViewTypeName = displayStringService.getMonitorDetailsViewTypeName(monitor.typeId);

            this._model = new HealthMonitorDetailsContainerModel(detailsViewTypeName);
        }

        this.propertyChanged(HealthPaneObservableProp.SelectedMonitorIdentifier);
    }

    /**
     * gets a value indicating whether view is fully initialized and ready to be displayed
     */
    public get isInitialized(): boolean {
        return this._isInitialized;
    }

    /**
     * gets monitor details view component type name
     */
    public get detailsViewTypeName(): string {
        return this._model.detailsViewTypeName;
    }

    /**
     * gets selected monitor id
     */
    public get selectedMonitorIdentifier(): string {
        return this.parentContext.selectedMonitorIdentifier;
    }

    /**
     * callback invoked when parent view model's property changes
     * @param propertyName 
     */
    private onParentPropertyChanged(propertyName: string): void {
        if (propertyName === HealthPaneObservableProp.SelectedMonitorIdentifier) {
            this.initialize();
        }
    }
}
