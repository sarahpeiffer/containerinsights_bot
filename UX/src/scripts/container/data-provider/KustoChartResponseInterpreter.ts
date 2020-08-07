/**
 * tpl
 */
import * as moment from 'moment';
import {
    ChartSeriesData,
    MetricUnit,
    MetricSeriesAndSummary,
    MetricDataPoint,
} from '@appinsights/aichartcore';

/**
 * local
 */
import { AggregationOption } from '../../shared/AggregationOption';
import { NodeCountMetricSeries, PodCountMetricSeries } from '../ContainerMetricChart';
import { ITimeInterval } from '../../shared/data-provider/TimeInterval';
import { StringMap } from '../../shared/StringMap';
import { ChartResponseInterpreter } from './ChartResponseInterpreter';


/** List of 'some' columns in the result of the perf metric query */
enum PerformanceMetricColumnIndex {
    ClusterId = 0,
    MetricId = 1,
    TimeGeneratedArray = 8
}

/** List of 'some' columns in the result of the node count query */
enum NodeCountMetricColumnIndex {
    ClusterId = 0,
    TimeGeneratedArray = 4
}

/** List of 'some' columns in the result of the pod count query */
enum PodCountMetricColumnIndex {
    ClusterId = 0,
    TimeGeneratedArray = 7
}

export class KustoChartResponseInterpreter extends ChartResponseInterpreter {
    /** column indicies of columns containing various aggregations for perf metrics */
    private static aggregationColumn: StringMap<number> = {
        [AggregationOption.Min]: 9,
        [AggregationOption.Avg]: 10,
        [AggregationOption.Max]: 11,
        [AggregationOption.P50]: 12,
        [AggregationOption.P90]: 13,
        [AggregationOption.P95]: 14
    };

    /** column indicies of columns containing various aggregation summaries for perf metrics */
    private static aggregationSummaryColumn: StringMap<number> = {
        [AggregationOption.Min]: 2,
        [AggregationOption.Avg]: 3,
        [AggregationOption.Max]: 4,
        [AggregationOption.P50]: 5,
        [AggregationOption.P90]: 6,
        [AggregationOption.P95]: 7
    };

    /** column indicies of columns containing various aggregations for node counts */
    private static nodeCountColumn: StringMap<number> = {
        [NodeCountMetricSeries.All]: 5,
        [NodeCountMetricSeries.Ready]: 6,
        [NodeCountMetricSeries.NotReady]: 7
    };

    /** column indicies of columns containing various aggregation summaries for node counts */
    private static nodeCountSummaryColumn: StringMap<number> = {
        [NodeCountMetricSeries.All]: 1,
        [NodeCountMetricSeries.Ready]: 2,
        [NodeCountMetricSeries.NotReady]: 3
    };

    /** column indicies of columns containing various aggregations for pod counts */
    private static podCountColumn: StringMap<number> = {
        [PodCountMetricSeries.All]: 8,
        [PodCountMetricSeries.Pending]: 9,
        [PodCountMetricSeries.Running]: 10,
        [PodCountMetricSeries.Succeeded]: 11,
        [PodCountMetricSeries.Failed]: 12,
        [PodCountMetricSeries.Unknown]: 13,
    };

    /** column indicies of columns containing various aggregation summaries for pod counts */
    private static podCountSummaryColumn: StringMap<number> = {
        [PodCountMetricSeries.All]: 1,
        [PodCountMetricSeries.Pending]: 2,
        [PodCountMetricSeries.Running]: 3,
        [PodCountMetricSeries.Succeeded]: 4,
        [PodCountMetricSeries.Failed]: 5,
        [PodCountMetricSeries.Unknown]: 6,
    };


    /** response interpreter singleton */
    private static _instance: ChartResponseInterpreter;

    /**
     * get instance of MDM response interpreter
     */
    public static Instance(): ChartResponseInterpreter {
        if (!this._instance) {
            this._instance = new KustoChartResponseInterpreter();
        }

        return this._instance;
    }


    /**
     * Interprets results of the query for cluster performance metrics (cpu & memory)
     * @param result query results
     * @param metricId metric to extract ('cpu' or 'memory')
     * @param timeInterval time interval of the query
     * @returns dictionary of time series organized by cluster + aggregtation
     */
    public getClusterPerformanceChartData(
        result: any,
        metricId: string,
        timeInterval: ITimeInterval
    ): StringMap<ChartSeriesData> {
        const resultRows = this.getResultRows(result);

        if (!resultRows) { throw new Error('Parameter @resultRows must not be null'); }
        if (!metricId) { throw new Error('Parameter @metricId must not be null'); }
        if (!timeInterval) { throw new Error('Parameter @timeInterval must not be null'); }

        // data series organized by cluster by aggregation
        let series: StringMap<StringMap<ChartSeriesData>> = {};

        let clusterIndex: number = 0;

        for (let i = 0; i < resultRows.length; i++) {
            const resultRow = resultRows[i];

            // row should contain 6 aggregations, 6 total values, cluster name, metric name and time array
            if (!resultRow || !resultRow.length || (resultRow.length < 6 + 6 + 3)) {
                throw new Error('Store returned dataset has fewer than required number of columns');
            }

            const clusterId = resultRow[PerformanceMetricColumnIndex.ClusterId];
            const clusterName = this.getClusterNameFromClusterId(clusterId);
            const rowMetricId = resultRow[PerformanceMetricColumnIndex.MetricId];

            if (metricId !== rowMetricId) { continue; }

            // the underlying chart wants the actual start and end times snapped to the given time grain.
            let timeStamps: Array<Date> =
                this.getTimeStamps(resultRow[PerformanceMetricColumnIndex.TimeGeneratedArray], timeInterval.getGrainMinutes());

            series[clusterName] = this.createPerformanceMetricEmptySeriesSet(
                clusterName, MetricUnit.Percent, timeInterval, clusterIndex++, false
            );

            const seriesOption = [
                AggregationOption.Min,
                AggregationOption.Avg,
                AggregationOption.Max,
                AggregationOption.P50,
                AggregationOption.P90,
                AggregationOption.P95,
            ];

            for (let i = 0; i < seriesOption.length; i++) {
                const option = seriesOption[i];
                const dataColumnIndex = KustoChartResponseInterpreter.aggregationColumn[option];
                const summaryColumnIndex = KustoChartResponseInterpreter.aggregationSummaryColumn[option];

                this.setSeriesValue(series[clusterName], resultRow, timeStamps, option, dataColumnIndex, summaryColumnIndex);
            }
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
        const resultRows = this.getResultRows(result);

        if (!resultRows) { throw new Error('Parameter @resultRows must not be null'); }
        if (!timeInterval) { throw new Error('Parameter @timeInterval must not be null'); }

        // data series organized by cluster by aggregation
        let series: StringMap<StringMap<ChartSeriesData>> = {};

        let clusterIndex: number = 0;

        for (let i = 0; i < resultRows.length; i++) {
            const resultRow = resultRows[i];

            // row should contain 3 counts, 3 total values, cluster name and time array
            if (!resultRow || !resultRow.length || (resultRow.length < 3 + 3 + 2)) {
                throw new Error('Store returned dataset has fewer than required number of columns');
            }

            const clusterId = resultRow[NodeCountMetricColumnIndex.ClusterId];
            const clusterName = this.getClusterNameFromClusterId(clusterId);

            // the underlying chart wants the actual start and end times snapped to the given time grain.
            let timeStamps: Array<Date> =
                this.getTimeStamps(resultRow[NodeCountMetricColumnIndex.TimeGeneratedArray], timeInterval.getGrainMinutes());

            series[clusterName] = this.createNodeCountMetricEmptySeriesSet(
                clusterName, MetricUnit.Count, timeInterval, clusterIndex++, false
            );

            const seriesOption = [
                NodeCountMetricSeries.All,
                NodeCountMetricSeries.Ready,
                NodeCountMetricSeries.NotReady,
            ];

            for (let i = 0; i < seriesOption.length; i++) {
                const option = seriesOption[i];
                const dataColumnIndex = KustoChartResponseInterpreter.nodeCountColumn[option];
                const summaryColumnIndex = KustoChartResponseInterpreter.nodeCountSummaryColumn[option];

                this.setSeriesValue(series[clusterName], resultRow, timeStamps, option, dataColumnIndex, summaryColumnIndex);
            }
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
        const resultRows = this.getResultRows(result);

        if (!resultRows) { throw new Error('Parameter @resultRows must not be null'); }
        if (!timeInterval) { throw new Error('Parameter @timeInterval must not be null'); }

        // data series organized by cluster by aggregation
        let series: StringMap<StringMap<ChartSeriesData>> = {};

        let clusterIndex: number = 0;

        for (let i = 0; i < resultRows.length; i++) {
            const resultRow = resultRows[i];

            // row should contain 3 counts, 3 total values, cluster name and time array
            if (!resultRow || !resultRow.length || (resultRow.length < 6 + 6 + 2)) {
                throw new Error('Store returned dataset has fewer than required number of columns');
            }

            const clusterId = resultRow[PodCountMetricColumnIndex.ClusterId];
            const clusterName = this.getClusterNameFromClusterId(clusterId);

            // the underlying chart wants the actual start and end times snapped to the given time grain.
            let timeStamps: Array<Date> =
                this.getTimeStamps(resultRow[PodCountMetricColumnIndex.TimeGeneratedArray], timeInterval.getGrainMinutes());

            series[clusterName] = this.createPodCountMetricEmptySeriesSet(
                clusterName, MetricUnit.Count, timeInterval, clusterIndex++, false
            );

            const seriesOption = [
                PodCountMetricSeries.All,
                PodCountMetricSeries.Pending,
                PodCountMetricSeries.Running,
                PodCountMetricSeries.Succeeded,
                PodCountMetricSeries.Failed,
                PodCountMetricSeries.Unknown,
            ];

            for (let i = 0; i < seriesOption.length; i++) {
                const option = seriesOption[i];
                const dataColumnIndex = KustoChartResponseInterpreter.podCountColumn[option];
                const summaryColumnIndex = KustoChartResponseInterpreter.podCountSummaryColumn[option];

                this.setSeriesValue(series[clusterName], resultRow, timeStamps, option, dataColumnIndex, summaryColumnIndex);
            }
        }

        return this.flattenSeriesMap(series);
    }

    /**
     * Checks incoming Kusto result json contains results and transforms to rows array
     * @param result kusto result
     * @returns array of rows of the result
     */
    private getResultRows(result: any): any[] {
        // result must have an array of tables
        if (!result || !result.tables || (result.tables.length === 0) ||
            !result.tables[0].rows || (result.tables[0].rows.length === 0) || !result.tables[0].rows[0]) {
            return [];
        }

        // first table contains results in array of rows
        return result.tables[0].rows;
    }

    /**
     * Convert string representation of date array received from Kusto into parsed arrar of dates
     * @param rawInput string containing json for string array of dates for time series
     * @param grain chart granularity in minutes
     */
    private getTimeStamps(rawInput: string, grain: number): Array<Date> {
        if (!rawInput) { throw new Error('Parameter @rawInput must not be null'); }

        const parsedInput = JSON.parse(rawInput) as Array<string>;

        if (!parsedInput) { throw new Error('Parameter @rawInput must be string array in json format'); }

        return (parsedInput).map((value) => {
            // The ai chart expects data to be aligned halfway through the given interval
            return moment.utc(value).add(grain / 2, 'minutes').toDate();
        });
    }

    /**
     * Extracts data series from Kusto result row and pushes it to series dictionary
     * @param series dictionary of metric data series to store resulting series
     * @param resultRow source kusto result row
     * @param timeStamps time interval timestam array
     * @param metricId metric id to use as a key to the dictionary
     * @param dataColumnIndex index of the column in source data row containing series data points
     * @param summaryColumnIndex index of the column in source data row containing series summary value
     * @param scale (optional) series scale
     */
    private setSeriesValue(
        series: StringMap<ChartSeriesData>,
        resultRow: any,
        timeStamps: Array<Date>,
        metricId: string,
        dataColumnIndex: number,
        summaryColumnIndex: number,
        scale?: number
    ): void {
        if (!series) { throw new Error('Parameter @series must not be null'); }
        if (!resultRow) { throw new Error('Parameter @resultRow must not be null'); }
        if (!timeStamps) { throw new Error('Parameter @timeStamps must not be null'); }
        if (!metricId) { throw new Error('Parameter @metricId must not be null'); }

        let datapoints = this.createSeries(timeStamps, JSON.parse(resultRow[dataColumnIndex]), scale);
        (series[metricId].metricResults.data as MetricSeriesAndSummary[])[0].dataPoints = datapoints;

        let summary = resultRow[summaryColumnIndex];
        if (scale) {
            summary *= scale;
        }
        (series[metricId].metricResults.data as MetricSeriesAndSummary[])[0].summary = summary;
    }

    /**
     * Constructs metric series data points
     * @param xValues array of dates for x-axes
     * @param yValues array of values for y-axes
     * @param scale (optional) series scale
     * @returns array of series data points
     */
    private createSeries(xValues: Array<Date>, yValues: Array<number>, scale?: number): MetricDataPoint[] {
        if (!xValues) { throw new Error('Parameter @xValues must not be null'); }
        if (!xValues.length) { throw new Error('Parameter @xValues must be non-empty array'); }

        if (!yValues) { throw new Error('Parameter @yValues@ must not be null'); }
        if (!yValues.length) { throw new Error('Parameter @yValues@ must be non-empty array'); }

        let dataPoints: MetricDataPoint[] = [];

        for (let i = 0; i < xValues.length; i++) {
            let yValue: number = yValues[i];
            if (scale) {
                yValue *= scale;
            }
            dataPoints.push({
                timestamp: xValues[i],
                value: yValue
            });
        }
        return dataPoints;
    }

    /**
     * extracts the clusterName from cluster  resource id
     * @param clusterId - cluster resource id
     */
    private getClusterNameFromClusterId(clusterId: string) {
        let clusterName: string = '';
        if (clusterId) {
            if (this.isManagedCluster(clusterId)) {
                const resourceParts = clusterId.split('/');
                if (!resourceParts || !resourceParts.length || resourceParts.length < 9) {
                    throw new Error(`@clusterId is invalid at getClusterNameFromClusterId. Value: "${clusterId}"`);

                }
                clusterName = resourceParts[8];
            } else if (clusterId.toLocaleLowerCase().indexOf('/resourcegroups/') > 0) {
                const resourceGroupParts = clusterId.split('/');
                if (!resourceGroupParts || !resourceGroupParts.length || resourceGroupParts.length < 5) {
                    throw new Error(`@clusterId is invalid at getClusterNameFromClusterId. Value: "${clusterId}"`);
                }
                clusterName = resourceGroupParts[4];
            } else {
                clusterName = clusterId;
            }
        } else {
            throw new Error(`@clusterId is invalid at getClusterNameFromClusterId. Value: "${clusterId}"`);
        }

        return clusterName;
    }

    /**
    * determines whether managed k8s cluster or not
    * @param clusterResourceId - azure resource id of the cluster
    */
    private isManagedCluster(clusterResourceId: string): boolean {
        return (clusterResourceId && (clusterResourceId.toLocaleLowerCase().indexOf('/microsoft.containerservice/managedclusters') >= 0
            || clusterResourceId.toLocaleLowerCase().indexOf('/microsoft.containerservice/openshiftmanagedclusters') >= 0
            || clusterResourceId.toLocaleLowerCase().indexOf('/microsoft.kubernetes/connectedclusters') >= 0)
            || clusterResourceId.toLocaleLowerCase().indexOf('/microsoft.redhatopenshift/openshiftclusters') >= 0);
    }
}
