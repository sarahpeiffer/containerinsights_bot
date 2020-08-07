/** shared */
import { BaseViewModel } from '../../../shared/BaseViewModel';

/** local */
import { IHealthServicesFactory } from '../factories/HealthServicesFactory';
import { HealthTreeNodeModel } from '../models/HealthTreeNodeModel';
import { HealthState } from '../HealthState';
import { HealthTreeViewModel } from './HealthTreeViewModel';
import { HealthPaneObservableProp } from './HealthPaneObservableProp';
import * as TelemetryStrings from '../../../shared/TelemetryStrings';
import { IHealthMonitorService } from '../services/HealthMonitorService';
import { IHealthMonitor } from '../IHealthMonitor';

/**
 * Health tree node component view model
 */
export class HealthTreeNodeViewModel extends BaseViewModel {
    /** services factory */
    private _healthServicesFactory: IHealthServicesFactory;

    /** tree node model */
    private _model: HealthTreeNodeModel;

    /**
     * initializes an instance of the class
     * @param healthServicesFactory services factory
     * @param parentContext parent context (view model)
     * @param forceUpdate function to refresh component view
     */
    public constructor(
        healthServicesFactory: IHealthServicesFactory,
        parentContext: HealthTreeViewModel,
        forceUpdate: reactForceUpdateHandler,
    ) {
        super(forceUpdate, parentContext);

        if (!healthServicesFactory) { throw new Error(`@healthServicesFactory may not be null at HealthTreeNodeViewModel.ctor()`); }

        this._healthServicesFactory = healthServicesFactory;

        parentContext.handlePropertyChanged(this.onParentPropertyChanged.bind(this));
    }

    /**
     * initializes view model
     * @param monitorIdentifier monitor identifier for the tree node
     */
    public initialize(monitorIdentifier: string): void {
        if (!monitorIdentifier) { throw new Error(`@monitorIdentifier may not be null at HealthTreeNodeViewModel.initialize()`); }

        const healthMonitorService = this._healthServicesFactory.healthMonitorService;
        const healthMonitorTreeService = this._healthServicesFactory.healthMonitorTreeService;
        const displayStringService = this._healthServicesFactory.displayStringService;

        const monitor = healthMonitorService.getMonitor(monitorIdentifier);

        const parentContext = this.parentContext as HealthTreeViewModel;
        const isSelected = (monitorIdentifier === parentContext.selectedMonitorIdentifier);

        this._model = new HealthTreeNodeModel(
            monitorIdentifier,
            displayStringService.getMonitorDisplayStrings(monitor).inContextDisplayName,
            monitor.state,
            monitor.memberSubjectIds,
            isSelected,
            healthMonitorTreeService.isExpanded(monitorIdentifier)
        );

        // initialize must end with either prop page or force update
        this.forceUpdate();
    }

    /**
     * gets monitor identifier
     */
    public get monitorIdentifier(): string {
        return this._model.monitorIdentifier;
    }

    /** 
     * gets a value indicating whether monitor tree node is currently selected 
     */
    public get isSelected(): boolean {
        return this._model.isSelected;
    }

    /** 
     * gets a value indicating whether monitor tree node is expanded 
     */
    public get isExpanded(): boolean {
        return this._model.isExpanded;
    }

    /** 
     * gets a value indicating whether monitor node can be expanded (has children)
     */
    public get isExpandable(): boolean {
        return this.hasChildren;
    }

    /** 
     * gets a value indicating whether monitor has member monitors (children) 
     */
    public get hasChildren(): boolean {
        return (this._model.children && (this._model.children.length > 0)) ? true : false;
    }

    /**
     * gets member monitor (children) instance ids
     */
    public get children(): string[] {
        if (!this._model.children || !this._model.children.length) { return [] };

        if (this._model.sortedChildren) { return this._model.sortedChildren; }

        const displayStringService = this._healthServicesFactory.displayStringService;
        this._model.sortedChildren = displayStringService.getSortedMemberMonitors(this._model.monitorIdentifier)

        return this._model.sortedChildren;
    }

    /**
     * gets monitor display name
     */
    public get inTreeDisplayName(): string {
        return this._model.inTreeDisplayName;
    }

    /** 
     * gets monitor state 
     */
    public get state(): HealthState {
        return this._model.state;
    }

    /**
     * toggles node expanded state
     */
    public onToggleExpand(): void {
        const healthMonitorTreeService = this._healthServicesFactory.healthMonitorTreeService;

        this._model.toggleExpand();
        healthMonitorTreeService.toggleExpand(this._model.monitorIdentifier);

        const telemetry = this._healthServicesFactory.healthPaneTelemetryService;
        const healthMonitorService: IHealthMonitorService = this._healthServicesFactory.healthMonitorService;
        const monitor: IHealthMonitor = healthMonitorService.getMonitor(this._model.monitorIdentifier);
        const isExpanded = healthMonitorTreeService.isExpanded(this.monitorIdentifier);


        telemetry.logEvent(
            TelemetryStrings.HealthTreeNodeExpandedCollapsed, 
            { 
                monitorSubjectId: monitor ? monitor.subjectId : null, 
                monitorTypeId: monitor ? monitor.typeId : null,
                monitorHealthState: monitor ? monitor.state : null, 
                isExpanded: isExpanded ? 'Expanded' : 'Collapsed' }, 
            null
        );

        this.forceUpdate();
    }

    /**
     * callback invoked when user makes selection in the monitor tree
     * @param monitorIdentifier selected monitor identifier
     */
    public onSelect(monitorIdentifier: string) {
        const parentContext = this.parentContext as HealthTreeViewModel;

        const telemetry = this._healthServicesFactory.healthPaneTelemetryService;
        const healthMonitorService = this._healthServicesFactory.healthMonitorService;
        const sourceMonitor: IHealthMonitor = parentContext.selectedMonitorIdentifier ? 
            healthMonitorService.getMonitor(parentContext.selectedMonitorIdentifier) : 
            null;
        const destinationMonitor = healthMonitorService.getMonitor(monitorIdentifier);

        telemetry.logNavigationEvent(`${TelemetryStrings.HealthTreeNodeSelected}: ${parentContext.selectedMonitorIdentifier}`, `${TelemetryStrings.HealthTreeNodeSelected}: ${monitorIdentifier}`, 
            { 
                sourceMonitorSubjectId: sourceMonitor ? sourceMonitor.subjectId : null,
                sourceMonitorTypeId: sourceMonitor ? sourceMonitor.typeId : null, 
                sourceMonitorHealthState: sourceMonitor ? sourceMonitor.state : null,
                destinationMonitorSubjectId: destinationMonitor ? destinationMonitor.subjectId : null,  
                destinationMonitorTypeId: destinationMonitor ? destinationMonitor.typeId : null,
                destinationMonitorHealthState: destinationMonitor ? destinationMonitor.state : null
            }
        );

        parentContext.selectedMonitorIdentifier = monitorIdentifier;

        this.propertyChanged(HealthPaneObservableProp.SelectedMonitorIdentifier);
    }

    /**
     * callback invoked when parent property changes
     * @param propertyName changed property name
     */
    private onParentPropertyChanged(propertyName: string): void {
        const parentContext = this.parentContext as HealthTreeViewModel;

        if (propertyName === HealthPaneObservableProp.SelectedMonitorIdentifier) {
            const selectedMonitorId = parentContext.selectedMonitorIdentifier;

            // reinitialize tree node view model if this monitor
            // wasn't selected but now is or the other way around
            if (((selectedMonitorId === this.monitorIdentifier) && !this.isSelected) ||
                ((selectedMonitorId !== this.monitorIdentifier) && this.isSelected)) {
                this.initialize(this.monitorIdentifier);
            }
        }
    }
}
