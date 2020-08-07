
/**
 * Used by the metadata objects to define their own types
 */
export enum RowType {
    Node = 'node',
    Pod = 'pod',
    Controller = 'controller',
    Container = 'container',
    System = 'system'
}

/**
 * Base interface all metadata objects must implement
 */
export interface IMetaDataBase {
    rowType: RowType;
    lastReported: number;
    timeGenerated?: string;
    statusReason?: string;
    
    nameSpace: string;

    getSortableKey(): string;
}

/**
 * Wrapper to contain the trend data entries which will be kept in metadata
 * Each entry in containers requires a max value and an actual value... this is
 * techically a little overkill since the metadata already contains maxValue but
 * this makes translation in the front end easier
 */
export interface ITrendDataItem {
    maxValue: number;
    valueItem: number;
}

/**
 * Wrapper around the the full trend data item (its time stamp and the data itself)
 */
export class TrendDataWrapper {
    public dateTimeUtc: Date;
    public value: ITrendDataItem;
    
    /**
     * .ctor()
     * @param timeGenerated time this trend point represents in time
     * @param value the value and max value for this point
     */
    public constructor(timeGenerated: Date, value: ITrendDataItem) {
        this.dateTimeUtc = timeGenerated;
        this.value = value;
    }
}
