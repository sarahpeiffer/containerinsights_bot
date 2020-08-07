/**
 * container
 */
import { ContainerMetaDataLegacy, ContainerGridColumn } from '../shared/metadata/ContainerMetaDataLegacy';

/**
 * shared
 */
import { IGridLineObject } from '../../shared/GridLineObject';
import { ITimeInterval } from '../../shared/data-provider/TimeInterval';
import { StringMap } from '../../shared/StringMap';
import { NodeMetaData, NodeGriKustoQueryColumnIndicesMap } from '../shared/metadata/NodeMetaData';
import { ITelemetry } from '../../shared/Telemetry';
import { ControllerMetaData, ControllerKustoIndexMap } from '../shared/metadata/ControllerMetaData';
import { PodMetaData, ControllerChildrenKustoIndexMap } from '../shared/metadata/PodMetaData';


export class KustoGridResponseInterpreter {
    private telemetry: ITelemetry;

    public constructor(telemetry: ITelemetry) {
        this.telemetry = telemetry;
    }

    public static getValidBaseResponse(result: any): any[] {
        if (!result || !result.Tables || (result.Tables.length === 0)) {
            return null;
        }

        // first table contains results in array of rows
        const resultRows = result.Tables[0].Rows;

        if (!resultRows) {
            return null;
        }

        return resultRows;
    }

    /**
     * Interprets the query results for the controller grid
     * @param result The result of the controller grid query
     */
    public processControllerGridQueryResult(result: any,
        timeInterval: ITimeInterval, clusterId: string): IGridLineObject<ControllerMetaData>[][] {
        // result must have an array of tables
        const resultRows = KustoGridResponseInterpreter.getValidBaseResponse(result);
        if (!resultRows) {
            return null;
        }

        // hashtable object-name => object-index-in-array
        // const nameDictionary: StringMap<ControllerMetaData> = {};
        const objectList: ControllerMetaData[] = [];

        for (let i = 0; i < resultRows.length; i++) {
            // each row is an array of values for columns
            const resultRow = resultRows[i];
            const metaData = new ControllerMetaData(resultRow, timeInterval, clusterId, this.telemetry);
            objectList.push(metaData);

            // JSON.Parse fails on empty strings ¯\_(ツ)_/¯
            if (resultRow[ControllerKustoIndexMap.TrendLineArray] === '') {
                resultRow[ControllerKustoIndexMap.TrendLineArray] = null;
            }

            const aggregationArray = JSON.parse(resultRow[ControllerKustoIndexMap.TrendLineArray]);

            if (!aggregationArray) { continue; }

            for (let j = 0; j < aggregationArray.length; j++) {
                const aggregationRow = aggregationArray[j];
                metaData.addRow(aggregationRow.timestamp, aggregationRow.value);
            }
        }

        const returnList: IGridLineObject<ControllerMetaData>[][] = [];

        objectList.forEach((row: ControllerMetaData) => {
            returnList.push(row.formatControllerRow());
        });
        return returnList;
    }

    public processControllerChildrenGridQueryResult(result: any,
        timeInterval: ITimeInterval, clusterId: string): IGridLineObject<PodMetaData>[][] {
        // result must have an array of tables
        const resultRows = KustoGridResponseInterpreter.getValidBaseResponse(result);
        if (!resultRows) {
            return null;
        }

        // hashtable object-name => object-index-in-array
        // const nameDictionary: StringMap<ControllerMetaData> = {};
        const objectList: PodMetaData[] = [];

        for (let i = 0; i < resultRows.length; i++) {
            // each row is an array of values for columns
            const resultRow = resultRows[i];
            const metaData = new PodMetaData(resultRow, timeInterval, clusterId, this.telemetry);
            objectList.push(metaData);

            // JSON.Parse fails on empty strings ¯\_(ツ)_/¯
            if (resultRow[ControllerChildrenKustoIndexMap.TrendList] === '') {
                resultRow[ControllerChildrenKustoIndexMap.TrendList] = null;
            }

            const aggregationArray = JSON.parse(resultRow[ControllerChildrenKustoIndexMap.TrendList]);

            if (!aggregationArray) { continue; }

            for (let j = 0; j < aggregationArray.length; j++) {
                const aggregationRow = aggregationArray[j];
                metaData.addRow(aggregationRow.timestamp, aggregationRow.value);
            }
        }

        const returnList: IGridLineObject<PodMetaData>[][] = [];

        objectList.forEach((row: PodMetaData) => {
            returnList.push(row.formatControllerRow());
        });
        return returnList;
    }

    public processContainerGridQueryResult(result: any): IGridLineObject<ContainerMetaDataLegacy>[][] {
        // result must have an array of tables
        const resultRows = KustoGridResponseInterpreter.getValidBaseResponse(result);
        if (!resultRows) {
            return null;
        }

        // hashtable object-name => object-index-in-array
        const nameDictionary: StringMap<ContainerMetaDataLegacy> = {};
        const objectList: ContainerMetaDataLegacy[] = [];

        for (let i = 0; i < resultRows.length; i++) {
            // each row is an array of values for columns
            const resultRow = resultRows[i];
            const name = resultRow[ContainerGridColumn.Name];

            // see if we've seen this object name
            if (nameDictionary[name] === undefined) {
                const metaData = new ContainerMetaDataLegacy(resultRow);
                nameDictionary[name] = metaData;
                objectList.push(metaData);
            } else {
                nameDictionary[name].addRow(resultRow);
            }
        }

        const returnList: IGridLineObject<ContainerMetaDataLegacy>[][] = [];

        objectList.forEach((row) => {
            returnList.push(row.formatContainerRow());
        });
        return returnList;
    }

    /**
     * Interprets Kusto query for host child processes. Column grid data ([]) stored sequentially in []
     * childSort isn't even used here
     * @param metricName name of the selected currently selected metric
     * @param hostLimit 
     * @param result result of the Kusto query
     * @param sortOrder current sort information
     */
    public processContainerGridQueryResultForHost(hostLimit: number, result: any): IGridLineObject<ContainerMetaDataLegacy>[][] {
        // result must have an array of tables
        const resultRows = KustoGridResponseInterpreter.getValidBaseResponse(result);
        if (!resultRows) {
            return null;
        }

        // hashtable object-name => object-index-in-array
        const nameDictionary: StringMap<ContainerMetaDataLegacy> = {};
        const objectList: ContainerMetaDataLegacy[] = [];

        for (let i = 0; i < resultRows.length; i++) {
            // each row is an array of values for columns
            const resultRow = resultRows[i];
            const name = resultRow[ContainerGridColumn.Name];

            // see if we've seen this object name
            if (nameDictionary[name] === undefined) {
                const metaData = new ContainerMetaDataLegacy(resultRow, hostLimit);
                nameDictionary[name] = metaData;
                objectList.push(metaData);
            } else {
                nameDictionary[name].addRow(resultRow);
            }
        }

        const returnList: IGridLineObject<ContainerMetaDataLegacy>[][] = [];

        objectList.forEach((row) => {
            returnList.push(row.formatNodeRow());
        });
        return returnList;
    }

    /**
     * Converts the node query Kusto response into an array of GridLineObjects that correspond to columns in the grid
     * @param metricName 
     * @param result 
     * @param timeInterval 
     */
    public processNodeGridQueryResult(metricName: string, result: any, timeInterval: ITimeInterval): IGridLineObject<NodeMetaData>[][] {
        // result must have an array of tables
        const resultRows = KustoGridResponseInterpreter.getValidBaseResponse(result);
        if (!resultRows) {
            return null;
        }

        const objectList: NodeMetaData[] = [];

        for (let i = 0; i < resultRows.length; i++) {
            // each row is an array of values for columns
            const resultRow = resultRows[i];

            const metaData = new NodeMetaData(resultRow, metricName, timeInterval, this.telemetry);
            objectList.push(metaData);

            try {
                // JSON.Parse fails on empty strings ¯\_(ツ)_/¯
                if (resultRow[NodeGriKustoQueryColumnIndicesMap.TrendAggregationArray] === '') {
                    resultRow[NodeGriKustoQueryColumnIndicesMap.TrendAggregationArray] = null;
                }

                const aggregationArray = JSON.parse(resultRow[NodeGriKustoQueryColumnIndicesMap.TrendAggregationArray]);

                if (!aggregationArray) { continue; }

                for (let j = 0; j < aggregationArray.length; j++) {

                    try {
                        const aggregationRow = aggregationArray[j];

                        metaData.addRow(aggregationRow.TrendTime, aggregationRow.TrendAggregation, metricName);
                    } catch {
                        // tslint:disable-next-line:max-line-length
                        throw 'Invalid aggregation row in node [' + resultRow[NodeGriKustoQueryColumnIndicesMap.ClusterName] + '/' + resultRow[NodeGriKustoQueryColumnIndicesMap.NodeName] + ']';
                    }
                }

            } catch {
                // tslint:disable-next-line:max-line-length
                throw 'Invalid kusto row for node [' + resultRow[NodeGriKustoQueryColumnIndicesMap.ClusterName] + '/' + resultRow[NodeGriKustoQueryColumnIndicesMap.NodeName] + ']';
            }
        }

        const returnList: IGridLineObject<NodeMetaData>[][] = [];

        objectList.forEach((row) => {
            returnList.push(row.formatNodeRow());
        });
        return returnList;
    }
}
