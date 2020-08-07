import * as moment from 'moment';

import { IGridLineObject, GridLineObject } from '../../../shared/GridLineObject';
import { RowType, IMetaDataBase, TrendDataWrapper } from './Shared';
import { ITimeInterval } from '../../../shared/data-provider/TimeInterval';
import { ITelemetry } from '../../../shared/Telemetry';
import { DisplayStrings } from '../../../shared/DisplayStrings';

/**
 * Specifies the index of the Container and Controller list Grids
 * index should match the index of respective kusto query projection column
 */
export enum ControllerKustoIndexMap {
    ControllerId = 0,
    ControlerName = 1,
    ControllerKind = 2,
    PodStatusList = 3,
    AggregationValue = 4,
    ContainerCount = 5,
    Restarts = 6,
    ReadySinceNow = 7,
    NodeName = 8,
    TrendLineArray = 9,
    Limit = 10,
    LastReceievedDateTime = 11,
    Namespace = 12,
}

/**
 * Used to represent a controller row on the controller view.
 */
export class ControllerMetaData implements IMetaDataBase {

    public rowType: RowType = RowType.Controller;
    public controllerName;
    public lastReported;
    public timeGenerated;
    public nameSpace: string;
    public clusterId;

    public trendLine: TrendDataWrapper[];
    public controllerId: string;
    public controllerKind: string;
    public statusList: StringMap<number>;

    public aggregationPercentValue: number | string;
    public aggregationValue: number | string;

    public containerCount: number;

    public restartCount: number;
    public upTime: number;

    public maxValue: number;

    public telemetry: ITelemetry;

    /**
     * @param controllerName the name of this controller (used for tie breaking during sorts)
     */
    constructor(resultRow: any, timeInterval: ITimeInterval, clusterId: string, telemetry: ITelemetry) {

        if (Number.isFinite === undefined) {
            Number.isFinite = function (value) {
                return typeof value === 'number' && isFinite(value);
            }
        }

        this.telemetry = telemetry;
        this.trendLine = [];
        this.lastReported = null;

        this.createRow(resultRow, clusterId, timeInterval);
    }

    /**
     * helper function used to wrap a value with metadata using the GridLineObject
     * @param record value we would like to wrap in metadata
     * @param metaReference the metadata we would like to wrap the value with
     */
    public static metaWrapperHelper(record: any, metaReference: ControllerMetaData): IGridLineObject<ControllerMetaData> {
        return new GridLineObject(record, metaReference);
    }

    public formatControllerRow() {
        let controllerName = DisplayStrings.NoAssociatedController;
        if (this.controllerName && this.controllerKind) {
            controllerName = `${this.controllerName} (${this.controllerKind})`;   
        }

        return [
            ControllerMetaData.metaWrapperHelper(controllerName, this),
            ControllerMetaData.metaWrapperHelper(this.statusList, this),
            ControllerMetaData.metaWrapperHelper(this.aggregationPercentValue, this),
            ControllerMetaData.metaWrapperHelper(this.aggregationValue, this),
            ControllerMetaData.metaWrapperHelper(this.containerCount, this),
            ControllerMetaData.metaWrapperHelper(this.restartCount, this),
            ControllerMetaData.metaWrapperHelper(this.upTime, this),
            ControllerMetaData.metaWrapperHelper('-', this),
            ControllerMetaData.metaWrapperHelper(this.trendLine, this),
        ];
    }

    public getSortableKey(): string {
        return this.controllerName;
    }

    public addRow(trendDateTime: any, valueItem: any) {
        valueItem = valueItem || 0;

        if (trendDateTime !== null) {
            const reported = moment.utc(trendDateTime).toDate();
            this.trendLine.push(new TrendDataWrapper(reported, { maxValue: this.maxValue, valueItem: valueItem }));
        }
    }

    private createRow(resultRow: any, clusterId: string, timeInterval: ITimeInterval) {
        // this.lastReported = lastReported;

        this.controllerName = resultRow[ControllerKustoIndexMap.ControlerName];
        this.nameSpace = resultRow[ControllerKustoIndexMap.Namespace];
        this.clusterId = clusterId;
        this.timeGenerated = resultRow[ControllerKustoIndexMap.LastReceievedDateTime];

        this.controllerId = resultRow[ControllerKustoIndexMap.ControllerId];
        this.controllerKind = resultRow[ControllerKustoIndexMap.ControllerKind];

        this.statusList = {};

        // JSON.Parse fails on empty strings ¯\_(ツ)_/¯
        if (resultRow[ControllerKustoIndexMap.PodStatusList] === '') {
            resultRow[ControllerKustoIndexMap.PodStatusList] = null;
        }

        const rawPodStatusList = JSON.parse(resultRow[ControllerKustoIndexMap.PodStatusList]);

        if (rawPodStatusList) {
            rawPodStatusList.forEach((statusEntry) => {
                this.statusList[statusEntry.Status] = statusEntry.Count;
            });
        }

        this.aggregationValue = resultRow[ControllerKustoIndexMap.AggregationValue];

        if (!Number.isFinite(this.aggregationValue as number) || this.aggregationValue < 0) {
            this.aggregationValue = '-';
        }

        this.maxValue = resultRow[ControllerKustoIndexMap.Limit];
        if (!Number.isFinite(this.maxValue) || this.maxValue <= 0) {
            this.maxValue = 1;
            this.aggregationPercentValue = '-';
        } else {
            if (this.aggregationValue === '-') {
                this.aggregationPercentValue = '-';
            } else {
                this.aggregationPercentValue = (this.aggregationValue as number / this.maxValue) * 100;
            }
        }

        this.containerCount = resultRow[ControllerKustoIndexMap.ContainerCount];
        this.restartCount = resultRow[ControllerKustoIndexMap.Restarts];
        this.upTime = moment.duration(resultRow[ControllerKustoIndexMap.ReadySinceNow]).asMilliseconds();
    }
}
