import { SGSortOrder } from 'appinsights-iframe-shared';

/**
 * MVVM model for health monitor configuration component
 */
export class HealthMonitorConfigModel {
    /** monitor configuration properties */
    private _config: StringMap<number | string>;
    /** details view type name */
    private _detailsViewTypeName: string;
    private _sortColumn: number;
    private _sortOrder: SGSortOrder;

    /**
     * initializes a new instance of the class
     * @param config monitor configuration properties
     */
    public constructor(config: StringMap<number | string>, detailsViewTypeName: string, sortColumn: number, sortOrder: SGSortOrder) {
        this._config = config;
        this._detailsViewTypeName = detailsViewTypeName;
        this._sortColumn = sortColumn || 0;
        this._sortOrder = sortOrder || SGSortOrder.Ascending;
    }

    /**
     * gets monitor configuration properties
     * @returns {StringMap<number | string>} monitor configuration properties
     */
    public get config(): StringMap<number | string> {
        return this._config;
    }

    /**
     * gets details view type name
     */
    public get detailsViewTypeName(): string {
        return this._detailsViewTypeName;
    }

     /** gets sort column in the model */
     public get sortColumn(): number {
        return this._sortColumn;
    }

    /** sets sort column in the model */
    public set sortColumn(sortColumn: number) {
        this._sortColumn = sortColumn;
    }

    /** gets sort order in the model */
    public get sortOrder(): SGSortOrder {
        return this._sortOrder;
    }

    /** sets sort order in the model */
    public set sortOrder(sortOrder: SGSortOrder) {
        this._sortOrder = sortOrder;
    }
}
