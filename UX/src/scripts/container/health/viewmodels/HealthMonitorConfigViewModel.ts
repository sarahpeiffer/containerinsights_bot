/** shared */
import { BaseViewModel } from '../../../shared/BaseViewModel';

/** local */
import { HealthMonitorConfigModel } from '../models/HealthMonitorConfigModel';
import { IHealthServicesFactory } from '../factories/HealthServicesFactory';
import { HealthPaneObservableProp } from './HealthPaneObservableProp';
import { SGDataRow, SGSortOrder } from 'appinsights-iframe-shared';

/**
 * MVVM view model for health monitor configuration component
 */
export class HealthMonitorConfigViewModel extends BaseViewModel {
    /** health services factory */
    private _healthServicesFactory: IHealthServicesFactory;

    /** is view model fully initialized and can present data on screen */
    private _isInitialized: boolean;

    /** health monitor description model */
    private _model: HealthMonitorConfigModel;

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
            throw new Error(`@healthServicesFactory may not be null at HealthMonitorConfigViewModel.ctor()`); 
        }
        if (!parentContext) { 
            throw new Error(`@parentContext may not be null at HealthMonitorConfigViewModel.ctor()`); 
        }
        
        this._healthServicesFactory = healthServicesFactory;

        parentContext.handlePropertyChanged(this.onParentPropertyChanged.bind(this));
        this.onSortColumnChanged = this.onSortColumnChanged.bind(this);
        this.onSortOrderChanged = this.onSortOrderChanged.bind(this);
    }

    /**
     * initializes view model
     */
    public initialize(): void {
        const healthMonitorService = this._healthServicesFactory.healthMonitorService;
        const displayStringService = this._healthServicesFactory.displayStringService;

        this._model = null;
        this._isInitialized = !!this.parentContext.selectedMonitorIdentifier;

        const sortColumn = 0;
        const sortOrder = SGSortOrder.Ascending;

        if (this.parentContext.selectedMonitorIdentifier) {
            const monitor = healthMonitorService.getMonitor(this.parentContext.selectedMonitorIdentifier);
            const detailsViewTypeName = displayStringService.getMonitorDetailsViewTypeName(monitor.typeId);

            this._model = new HealthMonitorConfigModel(monitor.config, detailsViewTypeName, sortColumn, sortOrder);
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
     * gets a value indicating whether monitor has any configuration properties
     * @returns {boolean} true if monitor has at least one configuration property, false otherwise
     */
    public get hasConfig(): boolean {
        const config = this.config;

        if (!config) { return false; }

        for (const parameterName in config) {
            if (config.hasOwnProperty(parameterName)) { return true; }
        }

        return false;
    }

    /**
     * gets monitor configuration properties
     * @returns {StringMap<number | string>} monitor configuration properties
     */
    public get config(): StringMap<number | string> {
        return this._model.config;
    }

    /**
     * gets monitor details view component type name
     */
    public get detailsViewTypeName(): string {
        return this._model.detailsViewTypeName;
    }

    /** converts the monitor config into SGDataRows for SG */
    public convertModelIntoSGDataRows(): SGDataRow[] {
        let config = this.config;
        if (!config) {
            throw new Error(
                '@this.config may not be null in \
                HealthMonitorConfigViewModel.convertModelIntoSGDataRows()'
            ); 
        }

        let sgDataRows = [];
        for (let property in config) {
            if (config.hasOwnProperty(property)) {
                let value = config[property];
                sgDataRows.push(new SGDataRow([property, value], property));
            }
        }

        return sgDataRows;
    }

    /**
     * onChange handler for sort column. Updates the sort column in the model
     * @param sortColumn 
     */
    public onSortColumnChanged(sortColumn: number) {
        this.onSortOrderChanged(sortColumn, this._model.sortOrder);
    }

    /**
     * onChange handler for sort order. Updates the sort column and sort order in the model
     * @param sortColumn 
     * @param sortOrder 
     */
    public onSortOrderChanged(sortColumn: number, sortOrder: SGSortOrder) {
        this._model.sortColumn = sortColumn;
        this._model.sortOrder = sortOrder;
        this.forceUpdate();
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

    /** gets sortColumn data from the model */
    public get sortColumn(): number {
        return this._model.sortColumn;
    }

    /** gets sortOrder data from the model */
    public get sortOrder(): SGSortOrder {
        return this._model.sortOrder;
    }
}
