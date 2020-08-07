/** tpl */
import { SGDataRow, SGSortOrder } from 'appinsights-iframe-shared';

/** local */
import { IHealthServicesFactory } from '../../factories/HealthServicesFactory';
import { HealthMonitorDetailsContainerViewModel } from './HealthMonitorDetailsContainerViewModel';
import { HealthMonitorDetailsViewModelBase } from './HealthMonitorDetailsViewModelBase';
import { SummaryTile } from './MonitorDetailsTypings';
import { AggregateMonitorDetailsModel } from '../../models/monitorDetails/AggregateMonitorDetailsModel';
import { CIToKubeHealthStateMap, HealthState } from '../../HealthState';
import moment = require('moment');

/**
 * View model for aggregate monitor details component
 */
export class AggregateMonitorDetailsViewModel extends HealthMonitorDetailsViewModelBase {
    private _model: AggregateMonitorDetailsModel;

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
    }

    /** converts the monitor details into SGDataRows for SG */
    public convertModelIntoSGDataRows(): SGDataRow[] {
        let monitors = this.healthServicesFactory.displayStringService.getSortedMemberMonitors(this._model._monitor.subjectId);
        let sgDataRows = monitors.map((monitorId) => {
            let monitor = this.healthServicesFactory.healthMonitorService.getMonitor(monitorId);
            let status = monitor.state;
            let monitorName =
                this.healthServicesFactory.displayStringService.getMonitorDisplayStrings(monitor).inContextDisplayName;
            return new SGDataRow([monitorName, status], monitorId);
        });

        return sgDataRows;
    }

    /**
     * returns the number of monitors in a given health state
     * @param summaryTile 
     */
    public getNumberOfMonitorsInSummaryTile(summaryTile: HealthState | string): number {
        let modelDetails = this._model._monitor.details;
        if (!modelDetails) {
            throw new Error(
                '@this._model.details may not be null in \
                AggregateMonitorDetailsViewModel.convertModelAggregateDetailsIntoSGDataRows()'
            );
        }

        if (!modelDetails.details) {
            throw new Error(
                '@this._model.details.details may not be null in\
                AggregateMonitorDetailsViewModel.convertModelAggregateDetailsIntoSGDataRows()'
            );
        }

        let details = modelDetails.details;
        let monitors: string[] = [];
        if (summaryTile === SummaryTile.Total) {
            for (let status in details) {
                if (details.hasOwnProperty(status)) {
                    monitors = monitors.concat(details[status]);
                }
            }
        } else {
            monitors = details[CIToKubeHealthStateMap(summaryTile as HealthState)] || [];
        }

        return monitors.length;
    }

    /**
     * onClick handler for when one of the items in the summary component is clicked
     * Filters details to those workloads that are in the health condition corresponding to the summary item clicked
     * @param healthState 
     */
    public onSummaryTileClickHandler(healthState: HealthState | string) {
        this._model.summaryTileFilter = healthState;
        this.forceUpdate();
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
            throw new Error(`@monitorIdentifier may not be null at AggregateMonitorDetailsViewModel.createDetailsModel()`);
        }

        const healthMonitorService = this.healthServicesFactory.healthMonitorService;
        const displayStringService = this.healthServicesFactory.displayStringService;
        const monitor = healthMonitorService.getMonitor(monitorIdentifier); // get data
        const rootMonitor = healthMonitorService.getMonitor(healthMonitorService.rootMonitorIdentifier);

        //const details: IAggregateDetails = this.getDetails(monitor); // extract details
        const sortColumn = 0;
        const sortOrder = SGSortOrder.Ascending;

        this._model = new AggregateMonitorDetailsModel(
            //details, 
            monitor,
            sortColumn,
            sortOrder,
            displayStringService.getHealthStateDisplayName(monitor.state),
            rootMonitor.lastUpdatedDateTimeUtc,
            monitor.state,
            monitor.firstObservedDateTimeUtc
        );
    }

    /**
     * extracts the details property from the health monitor with safety checks
     * @param monitor 
     */
    // private getDetails(monitor: IHealthMonitor): IAggregateDetails {
    //     if (!monitor) {
    //         throw new Error('@monitor may not be null in AggregateMonitorDetailsViewModel.getAggregateDetails()');
    //     }

    //     let details: IAggregateDetails = monitor.details;

    //     if (!details) {
    //         throw new Error(
    //             '@monitor.details may not be null in AggregateMonitorDetailsViewModel.getAggregateDetails()'
    //         );
    //     }

    //     return details;
    // }

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
