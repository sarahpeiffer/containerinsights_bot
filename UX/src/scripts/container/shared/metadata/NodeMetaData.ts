import * as moment from 'moment';
import { String } from 'typescript-string-operations';

import * as Constants from '../Constants';

import { IGridLineObject, MaxValuedGridLineObject } from '../../../shared/GridLineObject';
import { DisplayStrings } from '../../../shared/DisplayStrings';
import { TrendDataWrapper, RowType, IMetaDataBase } from './Shared';
import { ITimeInterval } from '../../../shared/data-provider/TimeInterval';
import { ContainerHostMetricName } from '../ContainerMetricsStrings';
import { ITelemetry } from '../../../shared/Telemetry';
import { ErrorSeverity } from '../../../shared/data-provider/TelemetryErrorSeverity';
import { StringHelpers } from '../../../shared/Utilities/StringHelpers';

const millicoreCPUConversionRate = 1000000;


/**
 * Specifies the index of the Container and Controller list Grids
 * index should match the index of respective kusto query projection column
 */
export enum NodeGriKustoQueryColumnIndicesMap {
    ClusterName = 0,
    NodeName = 1,
    LastReceivedDateTime = 2,
    Status = 3,
    ContainerCount = 4,
    UpTimeMs = 5,
    Aggregation = 6,
    LimitValue = 7,
    TrendAggregationArray = 8,
    Labels = 9,
    ClusterId = 10
}

/**
 * Primary metadata object and parsing logic for the node view parents (VMs)
 * this object also understands how to wrap an actual sgdatarow in this metadata
 */
export class NodeMetaData implements IMetaDataBase {
    public nodeName: string;
    public containerCount: number;
    public status: string;
    public aggregationPercentValue: number | string;
    public aggregationValue: number | string;
    public maxValue: number;

    public lastReported: number;
    public upTimeInMilliseconds: number | string;

    public trendLine: TrendDataWrapper[];

    public rowType: RowType = RowType.Node;
    public timeGenerated: string;

    public labels: StringMap<string>;
    public isVirtual: boolean;
    public isUnscheduledPod: boolean;
    
    public nameSpace: string;

    public clusterId: string;
    private telemetry: ITelemetry;

    /**
     * .ctor() setup the metadata object with an initial row of data
     * @param resultRow initial kusto record to start the object off with
     * @param metricName the selected metric (CPU will round certain numbers)
     * @param timeInterval the time interval represented (outside a certain range some data will change)
     */
    public constructor(resultRow: any, metricName: string, timeInterval: ITimeInterval, telemetry: ITelemetry) {
        this.telemetry = telemetry;

        this.trendLine = [];
        this.labels = {};
        this.createRow(resultRow, metricName, timeInterval);
        // this.addRow(resultRow, metricName);
    }

    /**
     * Given a value and a metadata object wrap the value in the metadata object utilizing the GridLineObject class
     * @param record value we want to wrap with metadata
     * @param metaReference the metadata we would like to wrap the value in
     */
    public static metaWrapperHelper(record: any, metaReference: NodeMetaData): IGridLineObject<NodeMetaData> {
        return new MaxValuedGridLineObject(record, metaReference, metaReference.maxValue);
    }

    /**
     * Add an additional kusto row to this metadata... in the case of trend line where there
     * might be dozens or more records pertaining to a single "node" we want to keep track
     * @param resultRow additional kusto row to add to this metadata object
     * @param metricName the metric that is selected
     */
    public addRow(trendDateTime: any, valueItem: any, metricName: string) {
        valueItem = valueItem || 0;

        if (metricName === ContainerHostMetricName.CpuCoreUtilization) {
            valueItem /= millicoreCPUConversionRate;
        }

        // const trendDateTime = resultRow[NodeGriKustoQueryColumnIndicesMap.TrendDateTime];

        if (trendDateTime !== null) {
            const reported = moment.utc(trendDateTime).toDate();
            this.trendLine.push(new TrendDataWrapper(reported, { maxValue: this.maxValue, valueItem }));
        }
    }

    /**
     * Turn this metadata object into a fully wrapped array ready for SGDataRow.. that is an array
     * of metadata wrapped values
     * @returns {IGridLineObject<NodeMetaData>[]} an array of values fully wrapped by metadata ready for selectable grid
     */
    public formatNodeRow(): IGridLineObject<NodeMetaData>[] {
        const row: IGridLineObject<NodeMetaData>[] = [];

        const statusWrapper = {
            status: this.status,
            lastReported: this.lastReported,
            rowType: RowType.Node,
        };

        row.push(
            NodeMetaData.metaWrapperHelper(this.nodeName, this),
            NodeMetaData.metaWrapperHelper(statusWrapper, this),
            NodeMetaData.metaWrapperHelper(this.aggregationPercentValue, this),
            NodeMetaData.metaWrapperHelper(this.aggregationValue, this),
            NodeMetaData.metaWrapperHelper(this.containerCount, this),
            NodeMetaData.metaWrapperHelper(this.upTimeInMilliseconds, this),
            NodeMetaData.metaWrapperHelper('-', this),
            NodeMetaData.metaWrapperHelper(this.trendLine, this),
        );

        return row;
    }

    public getSortableKey(): string {
        return this.nodeName;
    }

    /**
     * Used by the constructor, the bulk of our initial metadata originally came from the first record associated
     * with a given node.  we maintain that behavior here for now, but future looking it might be a good idea to
     * validate some of this isn't changing from row to row in the trend data points
     * @param resultRow first kusto row being used to create the initial state of the metadata object
     * @param metricName metric that was selected (CPU is handled special)
     * @param timeInterval time interval selected (used to end metrics on expired nodes)
     */
    private createRow(resultRow: any, metricName: string, timeInterval: ITimeInterval) {
        this.nodeName = resultRow[NodeGriKustoQueryColumnIndicesMap.NodeName];
        this.containerCount = resultRow[NodeGriKustoQueryColumnIndicesMap.ContainerCount];
        this.status = (resultRow[NodeGriKustoQueryColumnIndicesMap.Status] || '').toLocaleLowerCase();

        const aggregationValue = resultRow[NodeGriKustoQueryColumnIndicesMap.Aggregation];
        const rawMaxValue = resultRow[NodeGriKustoQueryColumnIndicesMap.LimitValue] || 1;

        if (metricName === ContainerHostMetricName.CpuCoreUtilization) {
            this.aggregationValue = aggregationValue / millicoreCPUConversionRate;
            this.maxValue = rawMaxValue / millicoreCPUConversionRate;
        } else {
            this.aggregationValue = aggregationValue;
            this.maxValue = rawMaxValue;
        }

        this.aggregationValue = (aggregationValue !== null && this.maxValue !== null && this.maxValue !== 0) ?
            this.aggregationValue :
            DisplayStrings.ContainerMissingPerfMetricTitle;

        this.aggregationPercentValue = (!isNaN(Number(this.aggregationValue)) && this.maxValue !== null && this.maxValue !== 0) ?
            ((this.aggregationValue as number) / this.maxValue) * 100 :
            DisplayStrings.ContainerMissingPerfMetricTitle;

        this.upTimeInMilliseconds = (this.status === 'ready') ? resultRow[NodeGriKustoQueryColumnIndicesMap.UpTimeMs] : '-';

        const rawLastRecievedDateTime = resultRow[NodeGriKustoQueryColumnIndicesMap.LastReceivedDateTime];
        this.timeGenerated = rawLastRecievedDateTime;
        if (rawLastRecievedDateTime) {
            const momentOfLastReport = moment.utc(rawLastRecievedDateTime);
            const endOfTimeRange = moment(timeInterval.getBestGranularEndDate(true));
            this.lastReported = endOfTimeRange.diff(momentOfLastReport);
        }

        if (!this.lastReported || this.lastReported > Constants.LastReportedThreshold) {
            this.aggregationValue = '-';
            this.aggregationPercentValue = '-';
            this.upTimeInMilliseconds = '-';
        }

        try {
            const rawLabelData = resultRow[NodeGriKustoQueryColumnIndicesMap.Labels];
            if (!String.IsNullOrWhiteSpace(rawLabelData)) {
                const labelDatas: StringMap<string>[] = JSON.parse(rawLabelData);
                if (labelDatas) {
                    labelDatas.forEach((labelData) => {
                        const keys = Object.keys(labelData);
                        keys.forEach((key) => {
                            this.labels[key] = labelData[key];
                        });
                    });
                }
            }
        } catch (err) {
            this.telemetry.logException(err, 'NodeMetaData.createRow', ErrorSeverity.Error, null, null);
        }

        this.isVirtual = false;
        this.isUnscheduledPod = false;

        // 'UnscheduledPods' is the constructed node name that we're giving in the NodeQueryTemplate
        if (StringHelpers.equal(this.nodeName, 'unscheduled')) {
            this.isUnscheduledPod = true;
        }

        if (
            StringHelpers.startsWith(this.nodeName, 'virtual-kubelet') ||
            StringHelpers.startsWith(this.nodeName, 'virtual-node')
        ) {
            this.isVirtual = true;
        }

        this.clusterId = resultRow[NodeGriKustoQueryColumnIndicesMap.ClusterId];
    }
}
