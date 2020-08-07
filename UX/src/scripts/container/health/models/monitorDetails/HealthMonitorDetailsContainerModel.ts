/**
 * MVVM model for health monitor details visualization
 */
export class HealthMonitorDetailsContainerModel {
    /** details view type name */
    private _detailsViewTypeName: string;

    /**
     * initializes a new instance of the class
     * @param detailsViewTypeName details view type name
     */
    constructor(detailsViewTypeName: string) {
        this._detailsViewTypeName = detailsViewTypeName;
    }

    /**
     * gets details view type name
     */
    public get detailsViewTypeName(): string {
        return this._detailsViewTypeName;
    }
}
