/** tpl */
import { SGDataRow, SGSortOrder } from 'appinsights-iframe-shared';

/** local */
import { IHealthMonitor } from '../../IHealthMonitor';
import { NodeCpuUtilizationMonitorDetailsModel } from '../../models/monitorDetails/NodeCpuUtilizationMonitorDetailsModel';
import { HealthMonitorDetailsViewModelBase } from './HealthMonitorDetailsViewModelBase';
import { IHealthServicesFactory } from '../../factories/HealthServicesFactory';
import { HealthMonitorDetailsContainerViewModel } from './HealthMonitorDetailsContainerViewModel';
import { INodeCpuUtilizationDetails, IUsageDataObj } from './MonitorDetailsTypings';
import { KubeToCIHealthStateMap, HealthState } from '../../HealthState';
import moment = require('moment');

/** View model for node CPU monitor details component */
export class NodeCpuUtilizationMonitorDetailsViewModel extends HealthMonitorDetailsViewModelBase {
    private _model: NodeCpuUtilizationMonitorDetailsModel;

    /** 
     * initializes an instance of the class
     * @param healthServicesFactory 
     * @param parentContext 
     * @param forceUpdate 
    */
    public constructor(                                                               
        healthServicesFactory: IHealthServicesFactory,
        parentContext: HealthMonitorDetailsContainerViewModel, 
        forceUpdate: reactForceUpdateHandler
    ) {
        super(healthServicesFactory, parentContext, forceUpdate);       
        
        this.onSortColumnChanged = this.onSortColumnChanged.bind(this);
        this.onSortOrderChanged = this.onSortOrderChanged.bind(this);
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

    /** converts the model into SGDataRows for rendering in the SG grid */
    public convertModelIntoSGDataRows(): SGDataRow[] {
        let sgDataRows: SGDataRow[] = [];

        this._model.details.forEach((cpuUtilizationDetail: INodeCpuUtilizationDetails, key: number) => {
            const usage = cpuUtilizationDetail.details.cpuUsageMillicores
            const usagePercentage = cpuUtilizationDetail.details.cpuUtilizationPercentage
            const usageDataObj: IUsageDataObj = {
                usage, 
                usagePercentage
            }

            let sgDataRow = new SGDataRow([
                cpuUtilizationDetail.timestamp, 
                KubeToCIHealthStateMap(cpuUtilizationDetail.state.toLocaleLowerCase()),
                usageDataObj                 
            ], key);
            sgDataRows.push(sgDataRow);
        });

        return sgDataRows;
    }

    /** 
     * gets timestamp current monitor state was last recalculated on the agent
     * @param fromUtcDateTime timestamp to calculate difference from
     */
    public getRelativeStateLastRecalculatedDateTime(): string {
        const healthMonitorService = this.healthServicesFactory.healthMonitorService;

        return this.getFormattedRelativeDateTime(
            this._model.lastRecalculatedDateTimeUtc,
            healthMonitorService.healthDataLoadedTimestamp);
    }

    /** 
     * gets timestamp current monitor state was first observed in relative terms to current time
     * @param fromUtcDateTime timestamp to calculate difference from
     */
    public getRelativeLastStateChangeDateTime(): string {
        const healthMonitorService = this.healthServicesFactory.healthMonitorService;

        return this.getFormattedRelativeDateTime(
            this._model.firstObservedDateTimeUtc, 
            healthMonitorService.healthDataLoadedTimestamp);
    }

    /** gets sortColumn data from the model */
    public get sortColumn(): number {
        return this._model.sortColumn;
    }

    /** gets sortOrder data from the model */
    public get sortOrder(): SGSortOrder {
        return this._model.sortOrder;
    }

     /** 
     * gets monitor state display name
     */
    public get stateDisplayName(): string {
        return this._model.stateDisplayName;
    }

    /** 
     * gets monitor state
     */
    public get state(): HealthState {
        return this._model.state;
    }

    /** 
     * gets timestamp current cluster state was first observed
     */
    public get absoluteLastStateChangeDateTime(): string {
        return this.getFormattedDateTime(this._model.firstObservedDateTimeUtc);
    }

    /** 
     * gets timestamp current monitor state was last recalculated on the agent
     */
    public get absoluteStateLastRecalculatedDateTime(): string {
        return this.getFormattedDateTime(this._model.lastRecalculatedDateTimeUtc);
    }

    /**
     * Creates the model for this monitor details pane
     * @param monitorIdentifier monitor instance id
     */
    protected createDetailsModel(monitorIdentifier: string): void {                   
        if (!monitorIdentifier) { 
            throw new Error(`@monitorIdentifier may not be null at NodeCpuUtilizationMonitorDetailsViewModel.createDetailsModel()`); 
        }

        const healthMonitorService = this.healthServicesFactory.healthMonitorService;    
        const displayStringService = this.healthServicesFactory.displayStringService;
        const monitor = healthMonitorService.getMonitor(monitorIdentifier); // get data
        const rootMonitor = healthMonitorService.getMonitor(healthMonitorService.rootMonitorIdentifier);
        
        const details: INodeCpuUtilizationDetails[] = this.getDetails(monitor); // extract details
        const sortColumn = 0;
        const sortOrder = SGSortOrder.Ascending;

        this._model = new NodeCpuUtilizationMonitorDetailsModel(
            details, 
            sortColumn, 
            sortOrder,
            displayStringService.getHealthStateDisplayName(monitor.state),
            rootMonitor.lastUpdatedDateTimeUtc,
            monitor.state,
            monitor.firstObservedDateTimeUtc
        );             
    }

    /**
     * gets the details property from the health monitor
     * @param monitor
     */
    private getDetails(monitor: IHealthMonitor): INodeCpuUtilizationDetails[] {
        if (!monitor) { 
            throw new Error('@monitor may not be null in NodeCpuUtilizationMonitorDetailsViewModel.getNodeCpuUtilizationDetails()'); 
        }

        let details: INodeCpuUtilizationDetails[] = monitor.details;

        if (!details) {
            throw new Error(
                '@monitor.details may not be null in NodeCpuUtilizationMonitorDetailsViewModel.getNodeCpuUtilizationDetails()'
            );             
        }
        
        return details;
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
     * converts date time value to display string
     * @param dateTime date time to format
     */
    private getFormattedDateTime(dateTime: Date): string {
        if (!dateTime) { return null; } 

        const transitionTimeLocal = moment.utc(dateTime).local();
        
        return transitionTimeLocal.format('LLL');
    }
}
