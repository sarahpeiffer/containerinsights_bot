/** local */
import { HealthState } from '../HealthState';

/**
 * MVVM model for health monitor description component
 */
export class HealthMonitorHowItWorksModel {
    /** monitor state */
    private _state: HealthState;

    /** state display name */
    private _stateDisplayName: string;

    /** monitor display name */
    private _standaloneDisplayName: string;

    /** monitor descritpionstate display name */
    private _description: string;

    /** timestamp current monitor state was first observed */
    private _firstObservedDateTimeUtc: Date;

    /** timestamp current monitor state was last recalculated on the agent */
    private _lastRecalculatedDateTimeUtc: Date;

    /**
     * initializes an instance of the class
     * @param state monitor state
     * @param stateDisplayName state display name
     * @param standaloneDisplayName monitor display name
     * @param description monitor desctiption
     * @param firstObservedDateTimeUtc timestamp current monitor state was first observed
     * @param lastRecalculatedDateTimeUtc timestamp current monitor state was last recalculated on the agent
     */
    public constructor(
        state: HealthState,
        stateDisplayName: string,
        standaloneDisplayName: string,
        description: string,
        firstObservedDateTimeUtc: Date,
        lastRecalculatedDateTimeUtc: Date
    ) {
        this._state = state;
        this._stateDisplayName = stateDisplayName;
        this._standaloneDisplayName = standaloneDisplayName;
        this._description = description;
        this._firstObservedDateTimeUtc = firstObservedDateTimeUtc;
        this._lastRecalculatedDateTimeUtc = lastRecalculatedDateTimeUtc;
    }

    /**
     * gets monitor state
     */
    public get state(): HealthState {
        return this._state;
    }

    /**
     * gets state display name
     */
    public get stateDisplayName(): string {
        return this._stateDisplayName;
    }

    /** 
     * gets monitor display name 
     */
    public get standaloneDisplayName(): string {
        return this._standaloneDisplayName;
    }

    /**
     * gets monitor description
     */
    public get description(): string {
        return this._description;
    }

    /**
     * gets timestamp current monitor state was first observed
     */
    public get firstObservedDateTimeUtc(): Date {
        return this._firstObservedDateTimeUtc;
    }

    /**
     * gets timestamp current monitor state was last evaluated on the agent
     */
    public get lastRecalculatedDateTimeUtc(): Date {
        return this._lastRecalculatedDateTimeUtc;
    }
}
