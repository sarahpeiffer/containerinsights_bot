import * as moment from 'moment';

import { String } from 'typescript-string-operations';

import { TrendDataWrapper, RowType, IMetaDataBase } from './Shared'
import { IGridLineObject, MaxValuedGridLineObject } from '../../../shared/GridLineObject';
import { StringHelpers } from '../../../shared/Utilities/StringHelpers';
import { PodMetaData } from './PodMetaData';

export interface ITrendLineKustoMap {
    timestamp: string;
    value: string;
}

export interface IContainerKustoMap {
    containerName: string;

    status: string;

    aggregationValue: number;

    statusReason: string;

    limitValue: number;

    restarts: number;

    readySinceNow: string;

    lastTimeGenerated: string;

    trendList: ITrendLineKustoMap[];
}

/**
 * Specifies the index of the Container  and Controller list Grids
 * index should match the index of respective kusto query projection column
 */
export enum ContainerGridColumn {
    Name = 0,
    Status = 1,
    ContainerStatusReason = 2,
    Aggregation = 3,
    Host = 4,
    Restarts = 5,
    ReadySinceNow = 6,
    TrendTimeGenerated = 7,
    TrendAggregation = 8,
    Limits = 9,
    ControllerName = 10,
    ControllerKind = 11,
    ContainerID = 12,
    Containers = 13,
    UpTime = 14,
    ContainerInstance = 15,
    StartRestart = 16,
    LastReportedDelta = 17,
    PodStatus = 18,
    NodeIdentity = 19,
    Namespace = 20,
    LastPodInventoryTimeGenerated = 21,
    ClusterId = 22
}

/**
 * Primary metadata and kusto logic for contains used by node, controller and container views
 */
export class ContainerMetaData implements IMetaDataBase {
    public name: string;
    public containerName?: string;
    public status: string;
    public statusFixed: string;
    public statusReason?: string;
    public timeGenerated: string;
    public lastReported: number;
    public upTimeInMilliseconds: number | string;

    public host: string;
    public containerInstance: string;
    public podName?: string;
    public controllerKind: string;
    public controllerName: string;
    public podStatus: string;
    public aggregationValue: number | string;
    public maxValue: number;
    public aggregationPercentValue: number | string;
    public containerCount: number;
    public restartCount: number;

    public trendLine: TrendDataWrapper[];

    public rowType: RowType = RowType.Container;
    public nameSpace: string;
    public isUnscheduledPod: boolean;
    public clusterId: string;
    /**
     * .ctor() establish the initial state of metadata based on the first row of the kusto data
     * while additional rows are added later by invoking addRow
     * @param resultRow kusto row used to generate the initial state of the metadata
     * @param limitOverride [optional] on node view, allows the "maxValue" to be overriden by the hosts max
     */
    public constructor(containerData: IContainerKustoMap, parentMeta: PodMetaData) {
        // TODO:
        this.trendLine = [];

        this.createRow(containerData, parentMeta);
        // this.addRow(resultRow);
    }

    /**
     * helper function that will wrap a value in metadata utilizing the GridLineObject
     * @param record value to be wrapped in metadata
     * @param metaReference metadata to wrap the value in
     */
    public static metaWrapperHelper(record: any, metaReference: ContainerMetaData): IGridLineObject<ContainerMetaData> {
        return new MaxValuedGridLineObject(record, metaReference, metaReference.maxValue);
    }

    /**
     * given an array of ContainerMetaData go through each of the trend line columns (subnote: I think the trendIndex
     * could be removed if you access the trendLine through metadata instead of the column reference.. something to explore
     * anyway).  A new trend line will be generated from the array based on an "average" operation
     * @param containers list of containers whose trends we would like to sum
     * @param trendIndex the column index of the trend line (see comment above... this may be removable)
     */
    // public static addTrends(containers: IGridLineObject<ContainerMetaData>[][], trendIndex: number): TrendDataWrapper[] {
    //     const runningValue: TrendDataWrapper[] = [];

    //     let value: number[] = [];
    //     let max: number[] = [];
    //     let dateTime: Date[] = [];
    //     const dateTimeIndexHash: StringMap<number> = {};
    //     let recordCount: number = 0;

    //     containers.forEach((container: IGridLineObject<ContainerMetaData>[], k) => {
    //         const containerValue: TrendDataWrapper[] = container[trendIndex].value;


    //         containerValue.forEach((trendItem: TrendDataWrapper) => {
    //             const itemDate = trendItem.dateTimeUtc;
    //             if (!itemDate) {
    //                 return;
    //             }
    //             const itemDateString = itemDate.toString();

    //             let workingIndex = recordCount;
    //             if (dateTimeIndexHash.hasOwnProperty(itemDateString)) {
    //                 workingIndex = dateTimeIndexHash[itemDateString];
    //             } else {
    //                 dateTimeIndexHash[itemDateString] = recordCount;
    //                 recordCount++;
    //             }

                
    //             dateTime[workingIndex] = trendItem.dateTimeUtc;
    //             if (!value[workingIndex]) {
    //                 max[workingIndex] = trendItem.value.maxValue;
    //                 value[workingIndex] = trendItem.value.valueItem;
    //             } else {
    //                 max[workingIndex] += trendItem.value.maxValue;
    //                 value[workingIndex] += trendItem.value.valueItem;
    //             }
    //         });
    //     });

    //     for (let i = 0; i < recordCount; i++) {
    //         runningValue[i] = new TrendDataWrapper(dateTime[i], { maxValue: max[i], valueItem: value[i] })
    //     }
    //     const sortedTrends = runningValue.sort((left: TrendDataWrapper, right: TrendDataWrapper): number => {
    //         return left.dateTimeUtc.getTime() - right.dateTimeUtc.getTime();
    //     });
    //     return sortedTrends;
    // }


    public addRow(trendDateTime: any, valueItem: any) {
        valueItem = valueItem || 0;

        if (trendDateTime !== null) {
            const reported = moment.utc(trendDateTime).toDate();
            this.trendLine.push(new TrendDataWrapper(reported, { maxValue: this.maxValue, valueItem }));
        }
    }

    public isValid(): boolean {
        return !String.IsNullOrWhiteSpace(this.containerName);
    }

    /**
     * Used by controller view.  Returns an object ready for selectable grid which contains
     * all values required on the controller view wrapped in metadata
     * @returns {IGridLineObject<ContainerMetaData>[]} object to be loaded in SGDataRow and given to selectable grid
     */
    public formatControllerRow(): IGridLineObject<ContainerMetaData>[] {
        const row: IGridLineObject<ContainerMetaData>[] = [];

        const statusWrapper = {
            status: this.status,
            statusReason: this.statusReason,
            lastReported: this.lastReported,
            rowType: RowType.Controller,
        };

        row.push(
            ContainerMetaData.metaWrapperHelper(this.containerName, this),
            ContainerMetaData.metaWrapperHelper(statusWrapper, this),
            ContainerMetaData.metaWrapperHelper(this.aggregationPercentValue, this),
            ContainerMetaData.metaWrapperHelper(this.aggregationValue, this),
            ContainerMetaData.metaWrapperHelper(this.containerCount, this),
            ContainerMetaData.metaWrapperHelper(this.restartCount, this),
            ContainerMetaData.metaWrapperHelper(this.upTimeInMilliseconds, this),
            ContainerMetaData.metaWrapperHelper(this.host, this),
            ContainerMetaData.metaWrapperHelper(this.trendLine, this),
        );

        return row;
    }

    public getSortableKey(): string {
        return this.containerName;
    }

    /**
     * used by constructor to parse the initial kusto data and load out the metadata for a container
     * @param resultRow initial kusto row to setup the intial state of the metadata
     * @param limitOverride [optional] optionally override the maxValue field (used by host view)
     */
    private createRow(containerRecord: IContainerKustoMap, podParent: PodMetaData) {
        this.name = containerRecord.containerName;

        this.status = containerRecord.status;
        this.statusFixed = containerRecord.status;
        this.statusReason = containerRecord.statusReason;
        this.timeGenerated = containerRecord.lastTimeGenerated;
        this.lastReported = moment().diff(moment(this.timeGenerated));

        this.host = podParent.hostName;
        this.containerInstance = containerRecord.containerName;
        this.controllerName = podParent.controllerName;

        this.containerCount = 1;

        this.aggregationValue = containerRecord.aggregationValue;

        if (!Number.isFinite(this.aggregationValue as number) || this.aggregationValue < 0) {
            this.aggregationValue = '-';
        }

        this.maxValue = containerRecord.limitValue;
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

        this.upTimeInMilliseconds = moment.duration(containerRecord.readySinceNow).asMilliseconds();
        this.restartCount = containerRecord.restarts;
        this.nameSpace = podParent.nameSpace;
        this.controllerKind = podParent.controllerKind;
        this.podStatus = podParent.podStatus;

        const names = this.name.split('/');
        this.podName = podParent.podName;
        const containerName = names.length > 1 && names[1] !== '' ? names[1] : '';
        if (containerName !== '') {
            this.containerName = containerName;
        }

        this.clusterId = podParent.clusterId;
    }

    public get isVirtual(): boolean {
        return (
            StringHelpers.startsWith(this.host, 'virtual-kubelet') ||
            StringHelpers.startsWith(this.host, 'virtual-node')
        );
    }
}
