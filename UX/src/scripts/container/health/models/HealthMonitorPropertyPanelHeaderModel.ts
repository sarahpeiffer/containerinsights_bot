/** local */
import { HealthState } from '../HealthState';

/**
 * MVVM model for health monitor property panel header component
 */
export class HealthMonitorPropertyPanelHeaderModel {
    /** monitor state */
    private _state: HealthState;

    private _standaloneDisplayName: string;

    /**
     * initializes a new instance of the class
     * @param state monitor state
     */
    public constructor(
        state: HealthState,
        standaloneDisplayName: string
    ) {
        this._state = state;
        this._standaloneDisplayName = standaloneDisplayName;
    }

    /**
     * gets monitor subject
     */
    public get state(): HealthState {
        return this._state;
    }

    /**
     * gets monitor subject
     */
    public get standaloneDisplayName(): string {
        return this._standaloneDisplayName;
    }
}
