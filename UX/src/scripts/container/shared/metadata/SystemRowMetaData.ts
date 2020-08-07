import { IGridLineObject, GridLineObject } from '../../../shared/GridLineObject';
import { RowType, IMetaDataBase } from './Shared';

/**
 * System rows... currently used by "Other Processes" and empty failure rows
 */
export class SystemRowMetaData implements IMetaDataBase {
    public rowType: RowType = RowType.System;
    public lastReported: number = 0;

    public nameSpace: string;

    /**
     * .ctor() currently not required
     */
    public constructor() {
    }

    /**
     * helper function which wraps a data entry in a GridLineObject
     * @param record data we want to wrap with metadata
     * @param metaReference metadata for system rows
     */
    public static metaWrapperHelper(record: any, metaReference: SystemRowMetaData): IGridLineObject<SystemRowMetaData> {
        return new GridLineObject(record, metaReference);
    }

    public getSortableKey(): string {
        throw new Error('Not implemented for system rows!');
    }
}
