/**
 * MVVM model for health pane (tab) component
 */
export class HealthPaneModel {
    public _loadFailedReason: any = null;
    
    /** value indicating whether data load completed */
    private _isLoadCompleted: boolean;

    /** value indicating whether data load succeeded */
    private _isLoadSucceeded: boolean;

    /** whether there is some data to visualize */
    private _hasData: boolean;

    /**
     * initializes a new instance of the class
     * @param isLoaded whether data was loaded
     * @param loadSucceeded whether data load succeeded
     * @param hasData whether there is some data to visualize
     */
    private constructor(
        isLoadCompleted: boolean,
        isLoadSucceeded?: boolean,
        hasData?: boolean
    ) {
        this._isLoadCompleted = isLoadCompleted;
        this._isLoadSucceeded = isLoadSucceeded || false;
        this._hasData = hasData || false;
    }

    /**
     * initializes a new instance of the class indicating view is being loaded
     */
    public static get Loading(): HealthPaneModel {
        return new HealthPaneModel(false);
    }

    /**
     * initializes a new instance of the class indicating view failed to load
     */
    public static get Failed(): HealthPaneModel {
        return new HealthPaneModel(true, false);
    }

    /**
     * initializes a new instance of the class indicating view successfully loaded
     * @param hasData value indicating whether health data was present in the store
     */
    public static Succeeded(hasData: boolean): HealthPaneModel {
        return new HealthPaneModel(true, true, hasData);
    }

    /**
     * gets a value indicating whether data load completed
     */
    public get isLoadCompleted(): boolean {
        return this._isLoadCompleted;
    }

    /**
     * gets a value indicating whether data load succeeded
     */
    public get isLoadSucceeded(): boolean {
        return this._isLoadSucceeded;
    }

    /**
     * gets a value indicating whether there is data to visualize
     */
    public get hasData(): boolean {
        return this._hasData;
    }
}
