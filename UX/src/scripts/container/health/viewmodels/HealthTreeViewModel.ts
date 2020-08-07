/** shared */
import { BaseViewModel } from '../../../shared/BaseViewModel';
import { IDetailsPaneParentViewModel, ITelemetryData } from '../../../shared/property-panel-v2/IDetailsPaneParentViewModel';
import { IDetailsPanelTab } from '../../../shared/property-panel-v2/IDetailsPaneTab';

/** local */
import { IHealthServicesFactory } from '../factories/HealthServicesFactory';
import { HealthAspectsViewModel } from './HealthAspectsViewModel';
import { HealthPaneObservableProp } from './HealthPaneObservableProp';
import { HealthTreeModel } from '../models/HealthTreeModel';
import { IHealthMonitorService } from '../services/HealthMonitorService';
import { IHealthMonitor } from '../IHealthMonitor';
import { TelemetrySubArea } from '../../../shared/Telemetry';

/**
 * health monitor tree component view model
 */
export class HealthTreeViewModel 
            extends BaseViewModel
            implements IDetailsPaneParentViewModel {
    /** services factory */
    private _healthServicesFactory: IHealthServicesFactory;

    /** MVVM model of the component */
    private _model: HealthTreeModel;

    /** property panel header element */
    private _propertyPanelHeader: JSX.Element;

    /** property panel tabs */
    private _propertyPanelTabs: IDetailsPanelTab[] = [];

    /**
     * initializes an instance of the class
     * @param healthServicesFactory services factory
     * @param parentContext parent context (view model)
     * @param forceUpdate function to refresh component view
     */
    public constructor(
        healthServicesFactory: IHealthServicesFactory,
        parentContext: HealthAspectsViewModel, 
        forceUpdate: reactForceUpdateHandler,
    ) {
        super(forceUpdate, parentContext);

        if (!healthServicesFactory) { throw new Error(`@healthServicesFactory may not be null at HealthTreeViewModel.ctor()`); }
        this._healthServicesFactory = healthServicesFactory;

        parentContext.handlePropertyChanged(this.onParentPropertyChanged.bind(this));
    }

    /**
     * initializes view model
     */
    public initialize(): void {
        const parentContext = this.parentContext as HealthAspectsViewModel;
        const selectedAspectId = parentContext.selectedAspectIdentifier;
        const selectedMonitorId = this._healthServicesFactory.healthAspectService.getSelectedMonitorIdentifier(selectedAspectId);

        this._model = new HealthTreeModel(selectedAspectId, selectedMonitorId);

        this.propertyChanged(HealthPaneObservableProp.SelectedMonitorIdentifier);
    }

    /**
     * gets tree root monitor identifier
     */
    public get rootMonitorIdentifier(): string {
        return this._model.rootMonitorIdentifier;
    }

    /**
     * gets selected monitor id
     */
    public get selectedMonitorIdentifier(): string {
        return this._model.selectedMonitorIdentifier;
    }

    /**
     * sets selected monitor id
     */
    public set selectedMonitorIdentifier(monitorIdentifier: string) {
        this._model.selectedMonitorIdentifier = monitorIdentifier;

        // store selected monitor in the service such that we can restore
        // selection when aspect is switched to a different one and back
        const parentContext = this.parentContext as HealthAspectsViewModel;
        const selectedAspectId = parentContext.selectedAspectIdentifier;
        this._healthServicesFactory.healthAspectService.setSelectedMonitorIdentifier(selectedAspectId, monitorIdentifier);

        this.propertyChanged(HealthPaneObservableProp.SelectedMonitorIdentifier);
    }

    /**
     * gets property panel header control
     */
    public get propertyPanelHeader(): JSX.Element {
        return this._propertyPanelHeader;
    }

    /**
     * gets property panel tabs
     */
    public get propertyPanes(): IDetailsPanelTab[] {
        return this._propertyPanelTabs;
    }

    /** 
     * gets a value indicating whether property panel is visible
     */
    public get propertyPanelVisible(): boolean {
        return !!this.selectedMonitorIdentifier;
    }

    /**
     * registers component as property panel header
     * @param headerView header component
     * @param tabs set of property panel tabs
     */
    public registerPropertyPanel(headerView: JSX.Element, tabs: IDetailsPanelTab[]): void {
        this._propertyPanelHeader = headerView;
        this._propertyPanelTabs = tabs;
    }

    public getTelemetryDataForTabChange(): ITelemetryData {
        const monitorId = this.selectedMonitorIdentifier;
        const healthServicesFactory: IHealthServicesFactory = this._healthServicesFactory ;
        const healthMonitorService: IHealthMonitorService = healthServicesFactory.healthMonitorService;
        const monitor: IHealthMonitor = healthMonitorService.getMonitor(monitorId);
        
        const name: string = `${TelemetrySubArea.ContainerHealth}::TabSelectionChanged`;
        const data: any = { monitorId };
        if (monitorId) {
            data.monitorSubjectId = monitor ? monitor.subjectId : null;
            data.monitorTypeId = monitor ? monitor.typeId : null;
            data.healthState = monitor ? monitor.state : null;
        }

        return { name, data };
    }

    public getTelemetrySubArea(): TelemetrySubArea {
        return TelemetrySubArea.ContainerHealth;
    }

    /**
     * callback invoked when parent property changes
     * @param propertyName changed property name
     */
    private onParentPropertyChanged(propertyName: string): void {
        if (propertyName === HealthPaneObservableProp.SelectedAspectIdentifier) {
            this.initialize();
        }
    }
}
