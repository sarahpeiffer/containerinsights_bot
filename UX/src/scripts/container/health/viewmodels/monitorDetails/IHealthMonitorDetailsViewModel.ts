/**
 * defines initializeable object
 */
export interface IHealthMonitorDetailsViewModel {
    /**
     * gets a value indicating if object is initialized
     */
    readonly isInitialized: boolean;

    /**
     * initializes monitor details view model
     * @param monitorIdentifier monitor identifier of the monitor displayed
     */
    initialize(monitorIdentifier: string): void;
}
