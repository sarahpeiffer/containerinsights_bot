/** tpl */
import { SGSortOrder } from 'appinsights-iframe-shared';

/** local */
import { HealthState } from '../../HealthState';
import { IHealthMonitor } from '../../IHealthMonitor';

/**
 * Model for aggregate monitor details component
 */
export class AggregateMonitorDetailsModel {
    private _sortColumn: number;
    private _sortOrder: SGSortOrder;
    private _stateDisplayName: string;
    /** timestamp current monitor state was last recalculated on the agent */
    private _lastRecalculatedDateTimeUtc: Date;
    /** monitor state */
    private _state: HealthState;
    /** timestamp current monitor state was first observed */
    private _firstObservedDateTimeUtc: Date;
    
    /** health condition filter, set by clicking on one of the summary tiles */
    private _summaryTileFilter: HealthState | string;

    /**
     * initializes a new instance of the class
     */
    public constructor(
        public _monitor: IHealthMonitor,
        sortColumn: number, 
        sortOrder: SGSortOrder,
        stateDisplayName: string,
        lastRecalculatedDateTimeUtc: Date,
        state: HealthState,
        firstObservedDateTimeUtc: Date   
    ) {
        //this._details = details;
        this._sortColumn = sortColumn || 0;
        this._sortOrder = sortOrder || SGSortOrder.Ascending;
        this._summaryTileFilter = undefined;
        this._stateDisplayName = stateDisplayName;
        this._lastRecalculatedDateTimeUtc = lastRecalculatedDateTimeUtc;
        this._state = state;
        this._firstObservedDateTimeUtc = firstObservedDateTimeUtc;
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

    /** gets summary filter item from the model */
    public get summaryTileFilter(): HealthState | string {
        return this._summaryTileFilter;
    }

    /** sets summary filter item in the model */
    public set summaryTileFilter(summaryTile: HealthState | string) {
        this._summaryTileFilter = summaryTile;
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
