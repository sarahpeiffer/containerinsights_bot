/**
 * Defines reasons to terminate tracking page load performance
 */
export enum LoadTrackingTerminationReason {
    /** user interacted with controls on page */
    UserInteraction,
    /** network query failed to run and subsequent queries will not be run */
    QueryFailure,
    /** cluster visualized is not onboarded to CoIn */
    NotOnboarded
}

/** path the blade was loaded through */
export enum BladeLoadPath {
    Kusto = 'kusto',
    Mdm = 'mdm'
};

/**
 * Defines functionality to track blade/page load performance
 */
export interface IBladeLoadManager {
    /**
     * Initializes performance tracking instance
     * @param telemetryAreaName area to set on telemetry
     * @param pendingQueryNames set of queries that are expected to execute to fill the page
     */
    initialize(telemetryAreaName: string, pendingQueryNames: string[]): void;

    /** what type of load was this blade, kuto or mdm? */
    asLoadType(bladeLoadPath: BladeLoadPath): void;

    /**
     * Invoked when network query is completed
     * @param queryName network query name
     */
    queryCompleted(queryName: string): void;

    /**
     * Fetch the current value of isInitialLoadComplete used for tracking INITIAL blade load completion only
     */
    fetchIsInitialLoadComplete(): boolean;

    /**
     * Stops load tracking and reports completion immediately
     * @param reason reason load tracking should be stopped
     */
    terminateLoadTracking(reason: LoadTrackingTerminationReason): void;

    /**
     * Sets page load perfromance measuring point
     * @param measureName measuring point name
     */
    setPerformanceMeasure(measureName: string): void;
}
