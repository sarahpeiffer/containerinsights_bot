/** tpl */
import { SGSortOrder } from 'appinsights-iframe-shared';

/** local */
import { IWorkloadCapacityMemoryDetails } from '../../viewmodels/monitorDetails/MonitorDetailsTypings';
import { HealthState } from '../../HealthState';

/**
 * Model for workload memory capacity monitor details component
 */
export class WorkloadCapacityMemoryMonitorDetailsModel {
    /** monitor details */
    private _details: IWorkloadCapacityMemoryDetails;
    private _sortColumn: number;
    private _sortOrder: SGSortOrder;
    private _stateDisplayName: string;
    /** timestamp current monitor state was last recalculated on the agent */
    private _lastRecalculatedDateTimeUtc: Date;
    /** monitor state */
    private _state: HealthState;
    /** timestamp current monitor state was first observed */
    private _firstObservedDateTimeUtc: Date;

    /**
     * initializes a new instance of the class
     * @param details details about the health of the monitor
     */
    public constructor(
        details: IWorkloadCapacityMemoryDetails, 
        sortColumn: number, 
        sortOrder: SGSortOrder,
        stateDisplayName: string,
        lastRecalculatedDateTimeUtc: Date,
        state: HealthState,
        firstObservedDateTimeUtc: Date   
    ) {
        this._details = details;
        this._sortColumn = sortColumn || 0;
        this._sortOrder = sortOrder || SGSortOrder.Ascending;
        this._stateDisplayName = stateDisplayName;
        this._lastRecalculatedDateTimeUtc = lastRecalculatedDateTimeUtc;
        this._state = state;
        this._firstObservedDateTimeUtc = firstObservedDateTimeUtc;
    }

    /** gets details from the model */
    public get details(): IWorkloadCapacityMemoryDetails {
        return this._details;
    }

    /** sets details in the model */
    public set details(details: IWorkloadCapacityMemoryDetails) {
        this._details = details;
    }

    /** gets sort column from the model */
    public get sortColumn(): number {
        return this._sortColumn;
    }

    /** sets sort column in the model */
    public set sortColumn(sortColumn: number) {
        this._sortColumn = sortColumn;
    }

    /** gets sort order from the model */
    public get sortOrder(): SGSortOrder {
        return this._sortOrder;
    }

    /** sets sort order in the model */
    public set sortOrder(sortOrder: SGSortOrder) {
        this._sortOrder = sortOrder;
    }

    /**
     * gets state display name
     */
    public get stateDisplayName(): string {
        return this._stateDisplayName;
    }

    /**
     * gets timestamp current monitor state was last evaluated on the agent
     */
    public get lastRecalculatedDateTimeUtc(): Date {
        return this._lastRecalculatedDateTimeUtc;
    }

    /**
     * gets monitor state
     */
    public get state(): HealthState {
        return this._state;
    }

    /**
     * gets timestamp current monitor state was first observed
     */
    public get firstObservedDateTimeUtc(): Date {
        return this._firstObservedDateTimeUtc;
    }
}
