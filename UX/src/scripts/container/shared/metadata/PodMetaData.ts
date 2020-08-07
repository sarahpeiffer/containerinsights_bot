import * as moment from 'moment';

import { IGridLineObject, GridLineObject } from '../../../shared/GridLineObject';
import { RowType, IMetaDataBase, TrendDataWrapper } from './Shared';
import { StringHelpers } from '../../../shared/Utilities/StringHelpers';
import { ITimeInterval } from '../../../shared/data-provider/TimeInterval';
import { ITelemetry } from '../../../shared/Telemetry';
import { ContainerMetaData, IContainerKustoMap } from './ContainerMetaData';

export enum ControllerChildrenKustoIndexMap {
    PodId = 0,
    ControllerId = 1,
    ControllerName = 2,
    PodName = 3,
    PodStatus = 4,
    AggregationValue = 5,
    ContainerCount = 6,
    Restarts = 7,
    ReadySinceNow = 8,
    Node = 9,
    TrendList = 10,
    LimitValue = 11,
    LastTimeGenerated = 12,
    Namespace = 13,
    Containers = 14
}

/**
 * Represent a pod row... optionally can contain an owning controllerName used by controller view
 */
export class PodMetaData implements IMetaDataBase {
    public rowType: RowType = RowType.Pod;
    public podName;
    public lastReported;
    public timeGenerated;
    public nameSpace: string;
    public clusterId;

    public trendLine: TrendDataWrapper[];
    public controllerId: string;
    public controllerName: string;
    public controllerKind: string;
    public podStatus: string;

    public aggregationPercentValue: number | string;
    public aggregationValue: number | string;

    public containerCount: number;

    public hostName: string;

    public restartCount: number;
    public upTime: number;

    public maxValue: number;

    public containers: ContainerMetaData[];

    public telemetry: ITelemetry;

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
     * helper function to wrap a pod sgdatarow entry to include this metadata class utilizing
     * the gridlineobject class
     * @param record the value we want metadata attached to
     * @param metaReference the metadata entry we are attaching to the value
     */
    public static metaWrapperHelper(record: any, metaReference: PodMetaData): IGridLineObject<PodMetaData> {
        return new GridLineObject(record, metaReference);
    }

    public formatControllerRow() {
        const statusWrapper = {
            status: this.podStatus.toLocaleLowerCase(),
            lastReported: this.lastReported,
            rowType: RowType.Node,
        };

        return [
            PodMetaData.metaWrapperHelper(this.podName, this),
            PodMetaData.metaWrapperHelper(statusWrapper, this),
            PodMetaData.metaWrapperHelper(this.aggregationPercentValue, this),
            PodMetaData.metaWrapperHelper(this.aggregationValue, this),
            PodMetaData.metaWrapperHelper(this.containerCount, this),
            PodMetaData.metaWrapperHelper(this.restartCount, this),
            PodMetaData.metaWrapperHelper(this.upTime, this),
            PodMetaData.metaWrapperHelper(this.hostName, this),
            PodMetaData.metaWrapperHelper(this.trendLine, this),
        ];
    }

    public getSortableKey(): string {
        return this.podName;
    }

    public get isVirtual(): boolean {
        return (
            StringHelpers.startsWith(this.hostName, 'virtual-kubelet') ||
            StringHelpers.startsWith(this.hostName, 'virtual-node')
        );
    }

    public addRow(trendDateTime: any, valueItem: any) {
        valueItem = valueItem || 0;

        if (trendDateTime !== null) {
            const reported = moment.utc(trendDateTime).toDate();
            this.trendLine.push(new TrendDataWrapper(reported, { maxValue: this.maxValue, valueItem }));
        }
    }

    private createRow(resultRow: any, clusterId: string, timeInterval: ITimeInterval) {
        // this.lastReported = lastReported;
        const lastResportedRaw = resultRow[ControllerChildrenKustoIndexMap.LastTimeGenerated];

        this.lastReported = moment().diff(moment(lastResportedRaw));
        this.podName = resultRow[ControllerChildrenKustoIndexMap.PodName];
        this.nameSpace = resultRow[ControllerChildrenKustoIndexMap.Namespace];
        this.clusterId = clusterId;
        this.timeGenerated = resultRow[ControllerChildrenKustoIndexMap.LastTimeGenerated];

        this.controllerName = resultRow[ControllerChildrenKustoIndexMap.ControllerName];
        this.hostName = resultRow[ControllerChildrenKustoIndexMap.Node];

        this.controllerId = resultRow[ControllerChildrenKustoIndexMap.ControllerId];
        this.controllerKind = 'TODO'; //resultRow[ControllerChildrenKustoIndexMap.ControllerKind];

        this.podStatus = resultRow[ControllerChildrenKustoIndexMap.PodStatus];

        this.aggregationValue = resultRow[ControllerChildrenKustoIndexMap.AggregationValue];

        if (!Number.isFinite(this.aggregationValue as number) || this.aggregationValue < 0) {
            this.aggregationValue = '-';
        }

        this.maxValue = resultRow[ControllerChildrenKustoIndexMap.LimitValue];
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

        this.containerCount = resultRow[ControllerChildrenKustoIndexMap.ContainerCount];
        this.restartCount = resultRow[ControllerChildrenKustoIndexMap.Restarts];
        this.upTime = moment.duration(resultRow[ControllerChildrenKustoIndexMap.ReadySinceNow]).asMilliseconds();

        this.containers = [];

        // JSON.Parse fails on empty strings ¯\_(ツ)_/¯
        if (resultRow[ControllerChildrenKustoIndexMap.Containers] === '') {
            resultRow[ControllerChildrenKustoIndexMap.Containers] = null;
        }

        const containerList = JSON.parse(resultRow[ControllerChildrenKustoIndexMap.Containers]);

        if (containerList) {
            containerList.forEach((container: IContainerKustoMap) => {

                const newContainer = new ContainerMetaData(container, this);
                this.containers.push(newContainer);
                
                const trendLines = container.trendList;
                if (!trendLines || !trendLines.length || trendLines.length < 1) { return; }
    
                trendLines.forEach((trendLine) => {
                    newContainer.addRow(trendLine.timestamp, trendLine.value);
                })
            });
        }
    }
}
