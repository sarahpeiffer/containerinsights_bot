import { ITimeInterval } from '../../shared/data-provider/TimeInterval';
import { ChartSeriesData, MetricSeriesAndSummary, MetricUnit, MetricDataPoint } from '@appinsights/aichartcore';
import { ChartResponseInterpreter } from './ChartResponseInterpreter';
import { AggregationOption } from '../../shared/AggregationOption';
import { ContainerMetricChartId, NodeCountMetricSeries, PodCountMetricSeries } from '../ContainerMetricChart';

import * as moment from 'moment';
import { ITelemetry } from '../../shared/Telemetry';
import { ErrorSeverity } from '../../shared/data-provider/TelemetryErrorSeverity';

/**
 * index in the response path that includes the cluster name from the mdm response
 */
const clusterNameIndex = 8;

/**
 * Interpret responses from MDM and convert to a format the chart can understand
 */
export class MdmChartResponseInterpreter extends ChartResponseInterpreter {

    /** response interpreter singleton */
    private static _instance: ChartResponseInterpreter;

    public constructor(private telemetry: ITelemetry) {
        super();
    }

    /**
     * get instance of MDM response interpreter
     */
    public static Instance(telemetry: ITelemetry): ChartResponseInterpreter {
        if (!this._instance) {
            this._instance = new MdmChartResponseInterpreter(telemetry);
        }

        return this._instance;
    }

    /**
     * Interprets results of the query for cluster node count
     * @param result query results
     * @param metricId metric being queried for
     * @param timeInterval time interval of the query
     * @returns dictionary of time series organized by cluster + metric
     */
    public getClusterPerformanceChartData(
        result: any,
        metricId: string,
        timeInterval: ITimeInterval
    ): StringMap<ChartSeriesData> {
        const resultRows = this.getResultRows(result, metricId);

        if (!resultRows) { throw new Error('Parameter @resultRows must not be null'); }
        if (!metricId) { throw new Error('Parameter @metricId must not be null'); }
        if (!timeInterval) { throw new Error('Parameter @timeInterval must not be null'); }

        // data series organized by cluster by aggregation
        let series: StringMap<StringMap<ChartSeriesData>> = {};

        let clusterIndex: number = 0;

        for (let i = 0; i < resultRows.length; i++) {
            const resultRow = resultRows[i];
            const rowValue = resultRow.value[0];

            const clusterName = rowValue.id.split('/')[clusterNameIndex];

            if (!series[clusterName]) {
                series[clusterName] =
                    this.createPerformanceMetricEmptySeriesSet(clusterName, MetricUnit.Percent, timeInterval, clusterIndex++, true);
            }

            if (rowValue.timeseries.length < 1) {
                continue;
            }

            let aggregationId = null;
            let columnName = null;
            let summary = null;
            if (i === 0) {
                aggregationId = AggregationOption.Avg;
                columnName = 'average';

                summary = this.getAverage(rowValue.timeseries[0].data, columnName);
            } else {
                aggregationId = AggregationOption.Max;
                columnName = 'maximum';

                summary = this.getMax(rowValue.timeseries[0].data, columnName);
            }

            this.setSeriesValue(series[clusterName],
                rowValue.timeseries[0].data, aggregationId, columnName, summary);
        }

        return this.flattenSeriesMap(series);
    }

    /**
     * Interprets results of the query for cluster node count
     * @param result query results
     * @param timeInterval time interval of the query
     * @returns dictionary of time series organized by cluster + metric
     */
    public getClusterNodeCountChartData(
        result: any,
        timeInterval: ITimeInterval
    ): StringMap<ChartSeriesData> {

        const resultRows = this.getResultRows(result, ContainerMetricChartId.NodeCount);

        if (!resultRows) { throw new Error('Parameter @resultRows must not be null'); }
        if (!timeInterval) { throw new Error('Parameter @timeInterval must not be null'); }

        // data series organized by cluster by aggregation
        let series: StringMap<StringMap<ChartSeriesData>> = {};

        let clusterIndex: number = 0;

        const nodeSeriesNameLookup = [
            NodeCountMetricSeries.Ready,
            NodeCountMetricSeries.NotReady
        ];

        for (let i = 0; i < 2; i++) {
            const resultRow = resultRows[0];
            const rowValue = resultRow.value[0];

            const clusterName = rowValue.id.split('/')[clusterNameIndex];

            if (!series[clusterName]) {
                series[clusterName] = this
                    .createNodeCountMetricEmptySeriesSet(clusterName, MetricUnit.Count, timeInterval, clusterIndex++, true);
            }

            if (rowValue.timeseries.length < 1) {
                continue;
            }

            let aggregationId = nodeSeriesNameLookup[i];
            let columnName = 'total';
            let summary = this.getAverage(rowValue.timeseries[i].data, columnName);

            this.setSeriesValue(series[clusterName],
                rowValue.timeseries[i].data, aggregationId, columnName, summary);
        }

        return this.flattenSeriesMap(series);
    }

    /**
     * Interprets results of the query for cluster pod count
     * @param result query results
     * @param timeInterval time interval of the query
     * @returns dictionary of time series organized by cluster + metric
     */
    public getClusterPodCountChartData(
        result: any,
        timeInterval: ITimeInterval
    ): StringMap<ChartSeriesData> {
        const resultRows = this.getResultRows(result, ContainerMetricChartId.PodCount);

        if (!resultRows) { throw new Error('Parameter @resultRows must not be null'); }
        if (!timeInterval) { throw new Error('Parameter @timeInterval must not be null'); }

        // data series organized by cluster by aggregation
        let series: StringMap<StringMap<ChartSeriesData>> = {};

        let clusterIndex: number = 0;

        const resultRow = resultRows[0];
        const rowValue = resultRow.value[0];

        const seriesNameLookup = {
            [PodCountMetricSeries.Running]: true,
            [PodCountMetricSeries.Failed]: true,
            [PodCountMetricSeries.Pending]: true,
            [PodCountMetricSeries.Succeeded]: true,
            [PodCountMetricSeries.Unknown]: true
        };

        for (let i = 0; i < rowValue.timeseries.length; i++) {

            const clusterName = rowValue.id.split('/')[clusterNameIndex];

            if (!series[clusterName]) {
                series[clusterName] = this.createPodCountMetricEmptySeriesSet(clusterName, MetricUnit.Count,
                    timeInterval, clusterIndex++, true);
            }

            if (rowValue.timeseries.length < 1) {
                continue;
            }

            let aggregationId = rowValue.timeseries[i].metadatavalues[0].value;
            aggregationId = aggregationId.toLocaleLowerCase();

            if (!seriesNameLookup[aggregationId]) {
                // log exception
                this.telemetry.logException(`MdmChartResponseInterpreter::getClusterPodCountChartData Received unexpected pod phase ${aggregationId}`,
                    'MdmChartResponseInterpreter', ErrorSeverity.Error, null, null);
                continue;
            }

            const columnName = 'total';
            const summary = this.getAverage(rowValue.timeseries[i].data, columnName);

            this.setSeriesValue(series[clusterName],
                rowValue.timeseries[i].data, aggregationId, columnName, summary);
        }

        return this.flattenSeriesMap(series);
    }

    /**
     * Checks incoming Kusto result json contains results and transforms to rows array
     * @param result kusto result
     * @returns array of rows of the result
     */
    private getResultRows(result: any, metricId: string): any[] {
        // result must have an array of tables
        if (!result || !result.length) {
            return [];
        }

        switch (metricId) {
            case ContainerMetricChartId.Cpu:
                return [
                    result[0].content,
                    result[1].content,
                ];
            case ContainerMetricChartId.Memory:
                return [
                    result[2].content,
                    result[3].content

                ];
            case ContainerMetricChartId.NodeCount:
                return [result[0].content];
            case ContainerMetricChartId.PodCount:
                return [result[0].content];
            default:
                throw new Error('Unsupported metric id');
        }
    }

    /**
     * Populate a series entry in that will eventually be used on the chart
     * @param series empty series hash we are populating with data
     * @param resultRow the row of data we need to convert and populate into the chart
     * @param metricId the metric we are populating
     * @param columnName the name of the column we are populating
     * @param summary a summary value (average for example)
     */
    private setSeriesValue(
        series: StringMap<ChartSeriesData>,
        resultRow: any,
        metricId: string,
        columnName: string,
        summary: number
    ): void {
        (series[metricId].metricResults.data as MetricSeriesAndSummary[])[0].dataPoints =
            this.convertToChartSeries(resultRow, columnName).filter((el) => { return el !== null });

        (series[metricId].metricResults.data as MetricSeriesAndSummary[])[0].summary = summary;
    }

    /**
     * get the maximum entry in a series of mdm data
     * @param resultRowData the data we need a max from
     * @param columnName the column we are accessing (in MDM this can be things like average, total, etc)
     */
    private getMax(resultRowData: any[], columnName: string): number {
        let max = -1;
        resultRowData.forEach((rowItem) => {
            if (!rowItem[columnName]) {
                return;
            }
            if (rowItem[columnName] > max) {
                max = rowItem[columnName];
            }
        });
        if (max < 0) { return 0; }
        return max;
    }

    /**
     * get the average from a series of mdm data
     * @param resultRowData the data we need a max from
     * @param columnName the column we are accessing (in MDM this can be things like average, total, etc)
     */
    private getAverage(resultRowData: any[], columnName: string): number {
        let average = 0;
        let cnt = 0;
        resultRowData.forEach((rowItem) => {
            if (!rowItem[columnName]) {
                return;
            }
            average += rowItem[columnName];
            cnt++;
        });
        if (cnt < 1) { return 0; }
        return average / cnt;
    }

    /**
     * mdm time series come in a form {timestamp: "", *columnName*: *number*}
     * the chart requires {timestamp: "", value: ##}
     * This function converts between these two formats...
     * @param resultRowData the raw data from mdm
     * @param columnName column name from mdm (total, average, maximum, etc)
     */
    private convertToChartSeries(resultRowData, columnName): MetricDataPoint[] {
        return resultRowData.map((rowItem) => {
            const result: any = {};

            if (!rowItem[columnName]) {
                return null;
            }

            result.timestamp = moment.utc(rowItem.timeStamp).toDate();
            result.value = rowItem[columnName];

            return result;
        });
    }
}
