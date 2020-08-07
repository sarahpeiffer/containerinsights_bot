import * as moment from 'moment';
import { String } from 'typescript-string-operations';

import { DisplayStrings } from '../../../shared/DisplayStrings';
import * as Constants from '../Constants';

import { TrendDataWrapper, RowType, IMetaDataBase } from './Shared'
import { IGridLineObject, MaxValuedGridLineObject } from '../../../shared/GridLineObject';
import { MetricValueFormatter } from '../../../shared/MetricValueFormatter';
import { StringHelpers } from '../../../shared/Utilities/StringHelpers';

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
    TrendList = 7,
    // TrendAggregation = 8,
    Limits = 8,
    ControllerName = 9,
    ControllerKind = 10,
    ContainerID = 11,
    Containers = 12,
    UpTime = 13,
    ContainerInstance = 14,
    StartRestart = 15,
    LastReportedDelta = 16,
    PodStatus = 17,
    NodeIdentity = 18,
    Namespace = 19,
    LastPodInventoryTimeGenerated = 20,
    ClusterId = 21
}

/**
 * Primary metadata and kusto logic for contains used by node, controller and container views
 */
export class ContainerMetaDataLegacy implements IMetaDataBase {
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
    public constructor(resultRow: any, limitOverride?: number) {
        this.trendLine = [];
        this.createRow(resultRow, limitOverride);
        this.addRow(resultRow);
    }

    /**
     * helper function that will wrap a value in metadata utilizing the GridLineObject
     * @param record value to be wrapped in metadata
     * @param metaReference metadata to wrap the value in
     */
    public static metaWrapperHelper(record: any, metaReference: ContainerMetaDataLegacy): IGridLineObject<ContainerMetaDataLegacy> {
        return new MaxValuedGridLineObject(record, metaReference, metaReference.maxValue);
    }

    /**
     * given an array of ContainerMetaDataLegacy go through each of the trend line columns (subnote: I think the trendIndex
     * could be removed if you access the trendLine through metadata instead of the column reference.. something to explore
     * anyway).  A new trend line will be generated from the array based on an "average" operation
     * @param containers list of containers whose trends we would like to sum
     * @param trendIndex the column index of the trend line (see comment above... this may be removable)
     */
    public static addTrends(containers: IGridLineObject<ContainerMetaDataLegacy>[][], trendIndex: number): TrendDataWrapper[] {
        const runningValue: TrendDataWrapper[] = [];

        let value: number[] = [];
        let max: number[] = [];
        let dateTime: Date[] = [];
        const dateTimeIndexHash: StringMap<number> = {};
        let recordCount: number = 0;

        containers.forEach((container: IGridLineObject<ContainerMetaDataLegacy>[], k) => {
            const containerValue: TrendDataWrapper[] = container[trendIndex].value;


            containerValue.forEach((trendItem: TrendDataWrapper) => {
                const itemDate = trendItem.dateTimeUtc;
                if (!itemDate) {
                    return;
                }
                const itemDateString = itemDate.toString();

                let workingIndex = recordCount;
                if (dateTimeIndexHash.hasOwnProperty(itemDateString)) {
                    workingIndex = dateTimeIndexHash[itemDateString];
                } else {
                    dateTimeIndexHash[itemDateString] = recordCount;
                    recordCount++;
                }

                
                dateTime[workingIndex] = trendItem.dateTimeUtc;
                if (!value[workingIndex]) {
                    max[workingIndex] = trendItem.value.maxValue;
                    value[workingIndex] = trendItem.value.valueItem;
                } else {
                    max[workingIndex] += trendItem.value.maxValue;
                    value[workingIndex] += trendItem.value.valueItem;
                }
            });
        });

        for (let i = 0; i < recordCount; i++) {
            runningValue[i] = new TrendDataWrapper(dateTime[i], { maxValue: max[i], valueItem: value[i] })
        }
        const sortedTrends = runningValue.sort((left: TrendDataWrapper, right: TrendDataWrapper): number => {
            return left.dateTimeUtc.getTime() - right.dateTimeUtc.getTime();
        });
        return sortedTrends;
    }

    /**
     * add an additional kusto row to this metadata object.  currently doesn't validate the existing metadata against this
     * new row but something we could consider in the future.
     * @param resultRow new kusto row to add to this metadata object
     */
    public addRow(resultRow: any) {
        try {
            const trendArray = resultRow[ContainerGridColumn.TrendList];
            const parsedTrendArray = JSON.parse(trendArray);

            parsedTrendArray.forEach((trendEntry) => {
                const timestamp = trendEntry.timestamp || moment().utc().toISOString();
                const value = trendEntry.value || 0;
                const reported = moment.utc(timestamp).toDate();
                this.trendLine.push(new TrendDataWrapper(reported, { maxValue: this.maxValue, valueItem: value }));
            });
        } catch {
            console.error('Trendline parsing failed... ');
        }


        // 'UnscheduledPods' is the constructed node name that we're giving in the ContainerQueryTemplate
        if (StringHelpers.equal(resultRow[ContainerGridColumn.Host], 'unscheduled')) {
            this.isUnscheduledPod = true;
        }
    }

    public isValid(): boolean {
        return !String.IsNullOrWhiteSpace(this.containerName);
    }

    /**
     * Used by Container view.  Returns an object ready for selectable grid which contains
     * all values required on the container view wrapped in metadata
     * @returns {IGridLineObject<ContainerMetaDataLegacy>[]} object to be loaded in SGDataRow and given to selectable grid
     */
    public formatContainerRow(): IGridLineObject<ContainerMetaDataLegacy>[] {
        const row: IGridLineObject<ContainerMetaDataLegacy>[] = [];

        const statusWrapper = {
            status: this.status,
            statusReason: this.statusReason,
            lastReported: this.lastReported,
            rowType: RowType.Container,
        };

        row.push(
            ContainerMetaDataLegacy.metaWrapperHelper(this.containerName, this),
            ContainerMetaDataLegacy.metaWrapperHelper(statusWrapper, this),
            ContainerMetaDataLegacy.metaWrapperHelper(this.aggregationPercentValue, this),
            ContainerMetaDataLegacy.metaWrapperHelper(this.aggregationValue, this),
            ContainerMetaDataLegacy.metaWrapperHelper(this.podName, this),
            ContainerMetaDataLegacy.metaWrapperHelper(this.host, this),
            ContainerMetaDataLegacy.metaWrapperHelper(this.restartCount, this),
            ContainerMetaDataLegacy.metaWrapperHelper(this.upTimeInMilliseconds, this),
            ContainerMetaDataLegacy.metaWrapperHelper(this.trendLine, this),
        );

        return row;
    }

    /**
     * Used by Node/Host view.  Returns an object ready for selectable grid which contains
     * all values required on the host/node view wrapped in metadata
     * @returns {IGridLineObject<ContainerMetaDataLegacy>[]} object to be loaded in SGDataRow and given to selectable grid
     */
    public formatNodeRow(): IGridLineObject<ContainerMetaDataLegacy>[] {
        const row: IGridLineObject<ContainerMetaDataLegacy>[] = [];

        const statusWrapper = {
            status: this.status,
            lastReported: this.lastReported,
            rowType: RowType.Node,
        };

        row.push(
            ContainerMetaDataLegacy.metaWrapperHelper(this.containerName, this),
            ContainerMetaDataLegacy.metaWrapperHelper(statusWrapper, this),
            ContainerMetaDataLegacy.metaWrapperHelper(this.aggregationPercentValue, this),
            ContainerMetaDataLegacy.metaWrapperHelper(this.aggregationValue, this),
            ContainerMetaDataLegacy.metaWrapperHelper(this.containerCount, this),
            ContainerMetaDataLegacy.metaWrapperHelper(this.upTimeInMilliseconds, this),
            ContainerMetaDataLegacy.metaWrapperHelper(this.controllerName, this),
            ContainerMetaDataLegacy.metaWrapperHelper(this.trendLine, this),
        );

        return row;
    }

    /**
     * Used by controller view.  Returns an object ready for selectable grid which contains
     * all values required on the controller view wrapped in metadata
     * @returns {IGridLineObject<ContainerMetaDataLegacy>[]} object to be loaded in SGDataRow and given to selectable grid
     */
    // public formatControllerRow(): IGridLineObject<ContainerMetaDataLegacy>[] {
    //     const row: IGridLineObject<ContainerMetaDataLegacy>[] = [];

    //     const statusWrapper = {
    //         status: this.status,
    //         statusReason: this.statusReason,
    //         lastReported: this.lastReported,
    //         rowType: RowType.Controller,
    //     };

    //     row.push(
    //         ContainerMetaDataLegacy.metaWrapperHelper(this.containerName, this),
    //         ContainerMetaDataLegacy.metaWrapperHelper(statusWrapper, this),
    //         ContainerMetaDataLegacy.metaWrapperHelper(this.aggregationPercentValue, this),
    //         ContainerMetaDataLegacy.metaWrapperHelper(this.aggregationValue, this),
    //         ContainerMetaDataLegacy.metaWrapperHelper(this.containerCount, this),
    //         ContainerMetaDataLegacy.metaWrapperHelper(this.restartCount, this),
    //         ContainerMetaDataLegacy.metaWrapperHelper(this.upTimeInMilliseconds, this),
    //         ContainerMetaDataLegacy.metaWrapperHelper(this.host, this),
    //         ContainerMetaDataLegacy.metaWrapperHelper(this.trendLine, this),
    //     );

    //     return row;
    // }

    public getSortableKey(): string {
        return this.containerName;
    }

    /**
     * used by constructor to parse the initial kusto data and load out the metadata for a container
     * @param resultRow initial kusto row to setup the intial state of the metadata
     * @param limitOverride [optional] optionally override the maxValue field (used by host view)
     */
    private createRow(resultRow: any, limitOverride?: number) {
        this.name = resultRow[ContainerGridColumn.Name];
        this.status = MetricValueFormatter.formatContainerStatusCode(resultRow[ContainerGridColumn.Status]);
        this.statusFixed = MetricValueFormatter.getEnglishOnlyContainerStatus(resultRow[ContainerGridColumn.Status]);
        this.statusReason = resultRow[ContainerGridColumn.ContainerStatusReason];
        this.timeGenerated = resultRow[ContainerGridColumn.LastPodInventoryTimeGenerated] || moment().utc().toISOString();
        this.lastReported = resultRow[ContainerGridColumn.LastReportedDelta];

        this.host = resultRow[ContainerGridColumn.Host];
        this.containerInstance = resultRow[ContainerGridColumn.ContainerInstance];
        this.controllerName = resultRow[ContainerGridColumn.ControllerName];

        const rawAggregationValue = resultRow[ContainerGridColumn.Aggregation];

        this.maxValue = 1;
        if (resultRow[ContainerGridColumn.Limits] !== null && resultRow[ContainerGridColumn.Limits] !== undefined) {
            this.maxValue = resultRow[ContainerGridColumn.Limits];
        } else if (typeof limitOverride === 'number') {
            this.maxValue = limitOverride;
        }

        this.containerCount = resultRow[ContainerGridColumn.Containers];

        if (!this.lastReported || this.lastReported > Constants.LastReportedThreshold) {
            this.aggregationValue = '-';
            this.aggregationPercentValue = '-';
            this.upTimeInMilliseconds = '-';
        } else {
            this.aggregationValue = (rawAggregationValue !== null && this.maxValue !== null) ?
                rawAggregationValue : DisplayStrings.ContainerMissingPerfMetricTitle;
            this.upTimeInMilliseconds = resultRow[ContainerGridColumn.UpTime];
            this.aggregationPercentValue = (rawAggregationValue !== null && this.maxValue !== null && this.maxValue !== 0) ?
                (rawAggregationValue / this.maxValue) * 100 : DisplayStrings.ContainerMissingPerfMetricTitle
        }

        const endRestartCount = resultRow[ContainerGridColumn.Restarts];
        const startRestart = resultRow[ContainerGridColumn.StartRestart];

        this.restartCount = endRestartCount - startRestart;
       
        this.nameSpace = resultRow[ContainerGridColumn.Namespace];

        this.controllerKind = resultRow[ContainerGridColumn.ControllerKind];
        this.podStatus = (resultRow[ContainerGridColumn.PodStatus] || '' as string).toLocaleLowerCase();

        const names = this.name.split('|', 2);
        const podName = names.length > 1 && names[1] !== '' ? names[1] : '';
        if (podName !== '') {
            this.podName = podName;
        }

        const containerName = names.length > 0 && names[0] !== '' ? names[0] : '';
        if (containerName !== '') {
            this.containerName = containerName;
        }

        // consider container to be in unknown state in case we are not getting its perf metrics
        if (!this.lastReported || this.lastReported > Constants.LastReportedThreshold) {
            this.status = DisplayStrings.ContainerStatusUnknownTitle;
        }

        this.clusterId = resultRow[ContainerGridColumn.ClusterId];
    }

    public get isVirtual(): boolean {
        return (
            StringHelpers.startsWith(this.host, 'virtual-kubelet') ||
            StringHelpers.startsWith(this.host, 'virtual-node')
        );
    }
}
