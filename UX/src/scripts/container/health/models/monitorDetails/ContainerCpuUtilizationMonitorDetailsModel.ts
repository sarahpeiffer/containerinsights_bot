/** local */
import { IContainerCpuUtilizationDetails } from '../../viewmodels/monitorDetails/MonitorDetailsTypings';
import { HealthState } from '../../HealthState';

/**
 * Model for container CPU monitor details component
 */
export class ContainerCpuUtilizationMonitorDetailsModel {
    /** monitor details */
    private _details: IContainerCpuUtilizationDetails[];
    private _stateDisplayName: string;
    /** timestamp current monitor state was last recalculated on the agent */
    private _lastRecalculatedDateTimeUtc: Date;
    /** monitor state */
    private _state: HealthState;
    /** timestamp current monitor state was first observed */
    private _firstObservedDateTimeUtc: Date;

    /**
     * initializes a new instance of the class
     * @param details array of node conditions
     */
    public constructor(
        details: IContainerCpuUtilizationDetails[],
        stateDisplayName: string,
        lastRecalculatedDateTimeUtc: Date,
        state: HealthState,
        firstObservedDateTimeUtc: Date   
    ) {
        this._details = details || [];
        this._stateDisplayName = stateDisplayName;
        this._lastRecalculatedDateTimeUtc = lastRecalculatedDateTimeUtc;
        this._state = state;
        this._firstObservedDateTimeUtc = firstObservedDateTimeUtc;
    }

    /**
     * gets details from the model
     */
    public get details(): IContainerCpuUtilizationDetails[] {
        return this._details;
    }

    /** sets details in the model */
    public set details(details: IContainerCpuUtilizationDetails[]) {
        this._details = details;
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
