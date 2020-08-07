/**
 * MVVM model for health monitor tree component
 */
export class HealthTreeModel {
    /** root monitor id */
    private _rootMonitorIdentifier: string;

    /** selected monitor id */
    private _selectedMonitorIdentifier: string;

    /**
     * initializes a new instance of the class
     * @param rootMonitorIdentifier root monitor id
     * @param selectedMonitorIdentifier selected monitor id
     */
    constructor(
        rootMonitorIdentifier: string,
        selectedMonitorIdentifier: string
    ) {
        if (!rootMonitorIdentifier) { throw new Error(`@rootMonitorIdentifier may not be null at HealthTreeModel.ctor()`); }
        this._rootMonitorIdentifier = rootMonitorIdentifier;
        this._selectedMonitorIdentifier = selectedMonitorIdentifier;
    }

    /**
     * gets root monitor identifier
     */
    public get rootMonitorIdentifier(): string {
        return this._rootMonitorIdentifier;
    }

    /**
     * gets selected monitor identifier
     */
    public get selectedMonitorIdentifier(): string {
        return this._selectedMonitorIdentifier;
    }

    /**
     * sets selected monitor identifier
     */
    public set selectedMonitorIdentifier(monitorIdentifier: string) {
        this._selectedMonitorIdentifier = monitorIdentifier;
    }
}
