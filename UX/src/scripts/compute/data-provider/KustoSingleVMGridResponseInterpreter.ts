import { NumberHelpers } from '../../shared/Utilities/NumberHelpers';

/**
 * Query Columns
 * @enum {number}
 */
enum Column {
    InstanceName = 0,
    DiskSizeGB = 1,
    UsedGB = 2,
    P95IOPsRead = 3,
    P95IOPsWrite = 4,
    P95IOPsTransfer = 5,
    P95RateMBRead = 6,
    P95RateMBWrite = 7,
    P95RateMBTransfer = 8,
    P95LatencyRead = 9,
    P95LatencyWrite = 10,
    P95LatencyTransfer = 11,
    LatencyCounterCount = 12
}



/**
 * Interprets the result of SingleVMDiskMetrics
 * @export
 * @class KustoSingleVMGridResponseInterpreter
 */
export class KustoSingleVMGridResponseInterpreter {
    /**
     * Helper in processGridQueryResult to verify the existence and type of the value returned by the query
     * and perform some numeric transformation
     * @private
     * @static
     * @param  {*} obj object retuened by the query
     * @param  {number} numericPropertyIndex  property index
     * @param  {(n: number) => number} transform transformation to be applied
     * @return void 
     * @memberof KustoSingleVMGridResponseInterpreter
     */
    private static transformValue(obj: any, numericPropertyIndex: number, transform: (n: number) => number | string): void {
        if (!obj) {
            return;
        }

        const propertyValue = obj[numericPropertyIndex];
        if (typeof propertyValue !== 'number') {
            return;
        }

        obj[numericPropertyIndex] = transform(propertyValue);
    }

    /**
     * Transform the raw data from Kusto to the format proper to display on UI
     * @argument rawQueryResult: the raw query result returned from Kusto
     * @returns formatted data proper to display on UI plus a boolean indicating latency counters were found
     *          One element in the returned list corresponds to one row on UI table
     */
    public processGridQueryResult(rawQueryResult: any): { data: any[], hasLatencyCounters: boolean } {
        // result must have an array of tables
        if (!rawQueryResult || !rawQueryResult.Tables || (rawQueryResult.Tables.length === 0) || !rawQueryResult.Tables[0]) {
            return undefined;
        }

        const resultRows: any[] = rawQueryResult.Tables[0].Rows;
        if (!resultRows) {
            return undefined;
        }

        const hasEmptyInstanceName: boolean = resultRows.some((resultRow) => resultRow[Column.InstanceName] === '');
        if (hasEmptyInstanceName) {
            return undefined;
        }

        const totalLatencyCounterCount = resultRows.reduce((previousValue: number, currentValue: any) =>
            currentValue[Column.LatencyCounterCount] + previousValue, 0);

        let hasLatencyCounters: boolean;
        if (totalLatencyCounterCount === 0) {
            hasLatencyCounters = false;

            // Delete latency columns (which will be 0) from results
            for (let row of resultRows) {
                delete row[Column.P95LatencyRead];
                delete row[Column.P95LatencyWrite];
                delete row[Column.P95LatencyTransfer]
            }
        } else {
            hasLatencyCounters = true
        }

        // We do not need this column for the grid
        for (let row of resultRows) {
            delete row[Column.LatencyCounterCount];
        }

        // this array contains all the rows processed from the raw data of rawQueryResult
        // one element in the array corresponds to one row
        const processedRows = new Array();

        for (let i = 0; i < resultRows.length; i++) {
            // each row is an array of values for columns
            const resultRow = resultRows[i];

            if (!resultRow) {
                continue;
            }

            if (resultRow[Column.InstanceName] === '_Total') {
                resultRow[Column.InstanceName] = 'Total'
            }

            const roundTransformColumns = [
                Column.DiskSizeGB, Column.P95IOPsRead, Column.P95IOPsWrite,
                Column.P95IOPsTransfer, Column.P95RateMBRead, Column.P95RateMBWrite, Column.P95RateMBTransfer];

            let sizeGB = resultRow[Column.DiskSizeGB];
            for (let i of roundTransformColumns) {
                KustoSingleVMGridResponseInterpreter.transformValue(resultRow, i, (x: number) => NumberHelpers.twoDecimalRound(x));
            }

            let usedGB = resultRow[Column.UsedGB];
            if (sizeGB && usedGB) {
                KustoSingleVMGridResponseInterpreter.transformValue(resultRow, Column.UsedGB,
                    (x: number) => Math.round(100 * usedGB / sizeGB) + '%');
            } else {
                resultRow[Column.UsedGB] = '';
            }

            const multiplyAndRoundTransformColumns = [Column.P95LatencyRead, Column.P95LatencyWrite, Column.P95LatencyTransfer];

            for (let i of multiplyAndRoundTransformColumns) {
                KustoSingleVMGridResponseInterpreter.transformValue(resultRow, i, (x: number) => NumberHelpers.twoDecimalRound(1000 * x));
            }

            processedRows.push(resultRow);
        }

        return { data: processedRows, hasLatencyCounters };
    }
}
