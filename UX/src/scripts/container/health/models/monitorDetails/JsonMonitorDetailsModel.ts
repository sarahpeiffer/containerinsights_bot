/**
 * MVVM model for generic (json) health monitor details component
 */
export class JsonMonitorDetailsModel {
    private _details: any;

    /**
     * initializes a new instance of the class
     * @param config monitor state details
     */
    public constructor(details: any) {
        this._details = details || {};
    }

    /**
     * gets monitor state details
     * @returns {any} monitor state details
     */
    public get details(): any {
        return this._details;
    }
}
