import * as moment from 'moment';
import { GridLineObject } from '../../shared/GridLineObject';
import { SortColumn } from './VmInsightsDataProvider';
import { ITelemetry, TelemetryMainArea } from '../../shared/Telemetry';
import { ComputeObjectType, KustoNodeIdentityResponseInterpreter } from './KustoNodeIdentityResponseInterpreter';
import { VmInsightsTelemetryFactory } from '../../shared/VmInsightsTelemetryFactory';
import { ErrorSeverity } from '../../shared/data-provider/TelemetryErrorSeverity';
import { AtScaleUtils } from '../shared/AtScaleUtils';

enum Column {
    ObjectId = 0,
    ObjectProps = 1,
    Average = 2,
    P5th = 3,
    P10th = 4,
    P50th = 5,
    P90th = 6,
    P95th = 7,
    MinOrMax = 8,
    TrendPointsList = 9,
    Computer = 10,
    UseRelativeScale = 11,
    ResourceId = 12,
}

const EmptyRow = 'GetEmptyRowFromKustoResult';
const JsonTrendError = 'FailedToGetTrendInfoFromTheJsonData';
const JsonNameError = 'FailToParseTheJsonNameObject';

interface ITrendPoint {
    TimeGenerated: any,
    TrendValue: any
}

export class KustoGridResponseInterpreter {
    private telemetry: ITelemetry;

    constructor() {
        this.telemetry = VmInsightsTelemetryFactory.get(TelemetryMainArea.Compute);
    }

    public processGridQueryResult(result: any, sortOrder: SortColumn): any[] {
        // result must have an array of tables
        if (!result || !result.Tables || (result.Tables.length === 0) || !result.Tables[0] || !result.Tables[0].Rows) {
            return null;
        }

        // first table contains results in array of rows
        const resultRows = result.Tables[0].Rows;
        const objectList = [];

        const errInfo: StringMap<number[]> = {};

        for (let i = 0; i < resultRows.length; i++) {
            // each row is an array of values for columns
            const resultRow = resultRows[i];

            const objectId = resultRow[Column.ObjectId];
            if (!objectId) {
                if (errInfo[JsonNameError]) {
                    errInfo[JsonNameError].push(i);
                } else {
                    errInfo[JsonNameError] = [i];
                }
                continue;
            }
            const objectProps = resultRow[Column.ObjectProps];
            const averageValue = resultRow[Column.Average];
            const p5thValue = resultRow[Column.P5th];
            const p10thValue = resultRow[Column.P10th];
            const p50thValue = resultRow[Column.P50th];
            const p90thValue = resultRow[Column.P90th];
            const p95thValue = resultRow[Column.P95th];
            const minOrMaxValue = resultRow[Column.MinOrMax];
            const computer = resultRow[Column.Computer];
            const useRelativeScale = resultRow[Column.UseRelativeScale];
            const ResourceId = resultRow[Column.ResourceId];

            let jsonObjectProps;
            try {
                jsonObjectProps = JSON.parse(objectProps);
            } catch (e) {
                if (errInfo[EmptyRow]) {
                    errInfo[EmptyRow].push(i);
                } else {
                    errInfo[EmptyRow] = [i];
                }
                continue;
            }

            let trendPointsList = [];
            try {
                trendPointsList = JSON.parse(resultRow[Column.TrendPointsList]);
            } catch (e) {
                if (errInfo[JsonTrendError]) {
                    errInfo[JsonTrendError].push(i);
                } else {
                    errInfo[JsonTrendError] = [i];
                }
                continue;
            }

            let trendScale = 0;
            // for network query data, find out the largest one as scale.
            if (useRelativeScale && trendPointsList && trendPointsList.length > 0) {
                for (let i = 0; i < trendPointsList.length; i++) {
                    const trendRawPoint: ITrendPoint = trendPointsList[i];

                    let trendValue = trendRawPoint.TrendValue || 0;

                    if (trendValue > trendScale) {
                        trendScale = trendValue;
                    }
                    trendRawPoint.TrendValue = trendValue * 100;
                }
            }

            // for non-network query, always use 1. or if all network datapoint is 0, use 1 too. 
            if (trendScale === 0) {
                trendScale = 1;
            }

            let dataPoints = [];
            if (trendPointsList && trendPointsList.length > 0) {
                for (let i = 0; i < trendPointsList.length; i++) {
                    const trendRawPoint: ITrendPoint = trendPointsList[i];

                    let trendValue = trendRawPoint.TrendValue || 0;

                    const trendDataPoint = {
                        dateTimeUtc: moment.utc(trendRawPoint.TimeGenerated).toDate(),
                        value: trendValue / trendScale
                    };
                    dataPoints.push(trendDataPoint);
                }
            }

            let computerNameObject = jsonObjectProps.type === ComputeObjectType.NodeVolume ?
                jsonObjectProps.node : jsonObjectProps;

            computerNameObject.computer = computer;

            //Needed to add this as API currently returns the same type as that of Azure VM for Azure Arc
            const isArcVm: boolean = computerNameObject?.azureResourceId 
                && AtScaleUtils.isArcVirtualMachine(computerNameObject.azureResourceId);
            let nameObject = new GridLineObject<JSX.Element>(
                KustoNodeIdentityResponseInterpreter.GetName(jsonObjectProps),
                KustoNodeIdentityResponseInterpreter.GetIcon(computerNameObject, isArcVm));

            computerNameObject.vmType = KustoNodeIdentityResponseInterpreter.GetComputerType(computerNameObject, isArcVm);

            const objectData = [nameObject, averageValue, p5thValue, p10thValue, p50thValue,
                p90thValue, p95thValue, minOrMaxValue, dataPoints, computerNameObject, ResourceId];

            objectList.push(objectData);
        }

        if (Object.keys(errInfo).length > 0) {
            const errorProperties: StringMap<string> = {};
            const consoleErrorInfo: StringMap<string> = {};
            for (let key of Object.keys(errInfo)) {
                errorProperties[key] = 'Count:' + errInfo[key].length;
                consoleErrorInfo[key] = errInfo[key].toString();
            }
            this.telemetry.logException('Exceptions when interpreting compute kusto grid data', 'KustoGridResponseInterpreter.tsx',
                ErrorSeverity.Error, errorProperties, null);
            console.log('Exceptions when interpreting compute kusto grid data', consoleErrorInfo);
        }

        return objectList;
    }
}
