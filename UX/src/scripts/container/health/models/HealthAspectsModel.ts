/** local */
import { HealthState } from '../HealthState';
import { IHealthAspect } from '../IHealthAspect';

/**
 * MVVM model for health aspects component
 */
export class HealthAspectsModel {
    /** cluster state */
    private _state: HealthState = HealthState.Healthy;

    /** timestamp current cluster state was last observed */
    private _firstObservedDateTimeUtc: Date;

    /** timestamp current cluster state was last updated/delivered to store */
    private _lastUpdatedDateTimeUtc: Date;

    /** selected aspect identifier */
    private _selectedAspectIdentifier: string;

    /** cluster health aspects */
    private _aspects: IHealthAspect[];

    /**
     * initializes an instance of the class
     * @param state monitor state
     * @param firstObservedDateTimeUtc timestamp current monitor state was last observed
     * @param lastUpdatedDateTimeUtc timestamp current cluster state was last updated/delivered to store
     * @param selectedAspectIdentifier selected health aspect identifier
     * @param aspects cluster health aspects
     */
    public constructor(
        state: HealthState,
        firstObservedDateTimeUtc: Date,
        lastUpdatedDateTimeUtc: Date,
        selectedAspectIdentifier: string,
        aspects: IHealthAspect[]
    ) {
        this._state = state;
        this._firstObservedDateTimeUtc = firstObservedDateTimeUtc;
        this._lastUpdatedDateTimeUtc = lastUpdatedDateTimeUtc;
        this._selectedAspectIdentifier = selectedAspectIdentifier;
        this._aspects = aspects;
    }

    /**
     * gets cluster state
     */
    public get state(): HealthState {
        return this._state;
    }

    /**
     * gets timestamp current cluster state was first observed
     */
    public get firstObservedDateTimeUtc(): Date {
        return this._firstObservedDateTimeUtc;
    }

    /**
     * gets timestamp current cluster state was last recalculated/delivered to store
     * note: cluster monitor state is delivered every single time it is recalculated
     *       no matter whether state actually changed or not
     */
    public get lastRecalculatedDateTimeUtc(): Date {
        return this._lastUpdatedDateTimeUtc;
    }

    /** 
     * gets selected health aspect identifier 
     */
    public get selectedAspectIdentifier(): string {
        return this._selectedAspectIdentifier;
    }

    /** 
     * sets selected health aspect identifier 
     */
    public set selectedAspectIdentifier(aspectIdentifier: string) {
        this._selectedAspectIdentifier = aspectIdentifier;
    }

    /**
     * gets cluster health aspect list
     */
    public get aspects(): IHealthAspect[] {
        return this._aspects;
    }
}
