/**
 * tpl
 */
import {
    ChartSeriesData,
    MetricUnit,
    MetricSeriesAndSummary,
    MetricDataPoint,
    MissingDataFillingType,
} from '@appinsights/aichartcore';
import * as moment from 'moment';

/**
 * local
 */
import { AggregationOption } from '../../shared/AggregationOption';
import { NodeCountMetricSeries, PodCountMetricSeries, ContainerMetricChartId } from '../ContainerMetricChart';
import { TimeInterval } from '../../shared/data-provider/TimeInterval';
import { StringMap } from '../../shared/StringMap';
import { ChartResponseInterpreter } from './ChartResponseInterpreter';
import { ILiveDataPoint } from '../../shared/data-provider/KubernetesResponseInterpreter';
import { LiveMetricsRangeSeconds } from '../LiveMetricsPoller';

/**
 * Chart Response Interpreter for Live Metrics data points
 */
export class LiveMetricsChartResponseInterpreter extends ChartResponseInterpreter {

    /** response interpreter singleton */
    private static _instance: ChartResponseInterpreter;

    /**
     * Get instance of Live Metrics Chart response interpreter
     */
    public static Instance(): ChartResponseInterpreter {
        if (!this._instance) {
            this._instance = new LiveMetricsChartResponseInterpreter();
        }

        return this._instance;
    }

    /**
     * Interprets results of the query for cluster performance metrics (cpu & memory)
     * @param result query results
     * @param metricId metric to extract ('cpu' or 'memory')
     * @param timeInterval time interval of the query
     * @param isLoadedFromMdm true if the data was loaded from mdm...
     * @param clusterName name of the cluster that is being queried
     * @returns dictionary of time series organized by cluster + aggregtation
     */
    public getClusterPerformanceChartData(
        result: ILiveDataPoint[],
        metricId: ContainerMetricChartId,
        timeInterval: TimeInterval,
        isLoadedFromMdm: boolean,
        clusterName: string,
    ): StringMap<ChartSeriesData> {

        if (!result) { throw new Error('Parameter @resultRows must not be null'); }
        if (!metricId) { throw new Error('Parameter @metricId must not be null'); }
        if (!timeInterval) { throw new Error('Parameter @timeInterval must not be null'); }

        // data series organized by cluster by aggregation
        let series: StringMap<StringMap<ChartSeriesData>> = {};

        series[clusterName] = this.createPerformanceMetricEmptySeriesSet(
            clusterName, MetricUnit.Percent, timeInterval, 0, false
        );

        const seriesOptions = [
            AggregationOption.Min,
            AggregationOption.Avg,
            AggregationOption.Max,
            AggregationOption.P50,
            AggregationOption.P90,
            AggregationOption.P95,
        ];
        const start: Date = timeInterval.getRealStart();
        const end: Date = timeInterval.getRealEnd();

        seriesOptions.forEach(option => {
            let datapoints: MetricDataPoint[] = [];
            for (let i = 0; i < result.length; i++) {
                if (result[i] === null) {
                    continue;
                }
                datapoints.push({
                    timestamp: moment(end).subtract(result.length - 1 - i, 'seconds').toDate(),
                    value: (metricId === ContainerMetricChartId.Cpu) ? result[i].cpu[option] : result[i].memory[option]
                });
            }
            (series[clusterName][option].metricResults.data as MetricSeriesAndSummary[])[0].dataPoints = datapoints;
            // override grain, start, and end since TimeInterval doesn't support PT1S grain.
            series[clusterName][option].metricResults.startTime = moment(start).toDate();
            series[clusterName][option].metricResults.endTime = moment(end).toDate();
            series[clusterName][option].metricResults.timeGrain = 'PT1S';
            series[clusterName][option].visualization.missingDataFillType = MissingDataFillingType.FillWithLastValue;
        });

        return this.flattenSeriesMap(series);
    }

    /**
     * Interprets results of the query for cluster node count
     * @param result query results
     * @param timeInterval time interval of the query
     * @param isLoadedFromMdm true if the data was loaded from mdm...
     * @param clusterName name of the cluster that is being queried
     * @returns dictionary of time series organized by cluster + metric
     */
    public getClusterNodeCountChartData(
        result: ILiveDataPoint[],
        timeInterval: TimeInterval,
        isLoadedFromMdm: boolean,
        clusterName: string,
    ): StringMap<ChartSeriesData> {

        if (!result) { throw new Error('Parameter @result must not be null'); }
        if (!timeInterval) { throw new Error('Parameter @timeInterval must not be null'); }

        let series: StringMap<StringMap<ChartSeriesData>> = {};

        series[clusterName] = this.createNodeCountMetricEmptySeriesSet(clusterName, MetricUnit.Count, timeInterval, 0, false);

        const seriesOptions = [
            NodeCountMetricSeries.All,
            NodeCountMetricSeries.Ready,
            NodeCountMetricSeries.NotReady
        ];
        const start: Date = timeInterval.getRealStart();
        const end: Date = timeInterval.getRealEnd();

        seriesOptions.forEach(option => {
            let datapoints: MetricDataPoint[] = [];
            for (let i = 0; i < result.length; i++) {
                if (result[i] === null) {
                    continue;
                }
                datapoints.push({
                    timestamp: moment(end).subtract(result.length - 1 - i, 'seconds').toDate(),
                    value: result[i].nodeCount[option]
                });
            }
            (series[clusterName][option].metricResults.data as MetricSeriesAndSummary[])[0].dataPoints = datapoints;
            // override grain, start, and end since TimeInterval doesn't support PT1S grain.
            series[clusterName][option].metricResults.startTime = moment(start).toDate();
            series[clusterName][option].metricResults.endTime = moment(end).toDate();
            series[clusterName][option].metricResults.timeGrain = 'PT1S';
            series[clusterName][option].visualization.missingDataFillType = MissingDataFillingType.FillWithLastValue;
        });

        return this.flattenSeriesMap(series);
    }

    /**
     * Interprets results of the query for cluster pod count
     * @param result query results
     * @param timeInterval time interval of the query
     * @param isLoadedFromMdm true if the data was loaded from mdm...
     * @param clusterName name of the cluster that is being queried
     * @returns dictionary of time series organized by cluster + metric
     */
    public getClusterPodCountChartData(
        result: any,
        timeInterval: TimeInterval,
        isLoadedFromMdm: boolean,
        clusterName: string,
    ): StringMap<ChartSeriesData> {

        if (!result) { throw new Error('Parameter @resultRows must not be null'); }
        if (!timeInterval) { throw new Error('Parameter @timeInterval must not be null'); }

        let series: StringMap<StringMap<ChartSeriesData>> = {};

        series[clusterName] = this.createPodCountMetricEmptySeriesSet(clusterName, MetricUnit.Count, timeInterval, 0, false);

        const seriesOptions = [
            PodCountMetricSeries.All,
            PodCountMetricSeries.Failed,
            PodCountMetricSeries.Pending,
            PodCountMetricSeries.Running,
            PodCountMetricSeries.Succeeded,
            PodCountMetricSeries.Unknown,
        ];
        const start: Date = timeInterval.getRealStart();
        const end: Date = timeInterval.getRealEnd();

        seriesOptions.forEach(option => {
            let datapoints: MetricDataPoint[] = [];
            for (let i = 0; i < result.length; i++) {
                if (result[i] === null) {
                    continue;
                }

                // Test to make sure that every option lines up with the properties found in podCount
                const podCountKeys = Object.keys(result[i].podCount) || [];
                let targetKey = null;
                podCountKeys.forEach((key) => {
                    const loweredKey = key.toLocaleLowerCase();
                    if (loweredKey === option) {
                        targetKey = option;
                    }
                });
                if (targetKey === null) {
                    throw new Error('targetKey cannot be null @getClusterPodCountChartData');
                }

                datapoints.push({
                    timestamp: moment(end).subtract(result.length - 1 - i, 'seconds').toDate(),
                    value: result[i].podCount[option]
                });
            }
            (series[clusterName][option].metricResults.data as MetricSeriesAndSummary[])[0].dataPoints = datapoints;
            // override grain, start, and end since TimeInterval doesn't support PT1S grain.
            series[clusterName][option].metricResults.startTime = moment(start).toDate();
            series[clusterName][option].metricResults.endTime = moment(end).toDate();
            series[clusterName][option].metricResults.timeGrain = 'PT1S';
            series[clusterName][option].visualization.missingDataFillType = MissingDataFillingType.FillWithLastValue;
        });

        return this.flattenSeriesMap(series);
    }

    /**
     * Interprets results of the query for pod performance metrics (cpu & memory)
     * @param result query results
     * @param metricId metric to extract ('cpu' or 'memory')
     * @param timeInterval time interval of the query
     * @returns dictionary of time series organized by pod + aggregtation
     */
    public getPodPerformanceChartData(
        result: ILiveDataPoint[],
        metricId: ContainerMetricChartId,
        timeInterval: TimeInterval,
        clusterName: string
    ): StringMap<ChartSeriesData> {

        if (!result) { throw new Error('Parameter @resultRows must not be null'); }
        if (!metricId) { throw new Error('Parameter @metricId must not be null'); }
        if (!timeInterval) { throw new Error('Parameter @timeInterval must not be null'); }

        // data series organized by pod by aggregation
        let series: StringMap<StringMap<ChartSeriesData>> = {};

        series[clusterName] = this.createLiveTabMetricEmptySeriesSet(clusterName, MetricUnit.Count, timeInterval, 0);

        const seriesOptions = [
            AggregationOption.Usage,
            AggregationOption.Limits,
            AggregationOption.Requests
        ];

        const start: Date = timeInterval.getRealStart();
        const end: Date = timeInterval.getRealEnd();
        seriesOptions.forEach(option => {
            let datapoints: MetricDataPoint[] = [];
            for (let i = 0; i < result.length; i++) {
                if (result[i] === null) {
                    continue;
                }
                if (option === AggregationOption.Usage) {
                    datapoints.push({
                        timestamp: moment(end).subtract(result.length - 1 - i, 'seconds').toDate(),
                        value: (metricId === ContainerMetricChartId.Cpu) ? result[i].cpu[option] : result[i].memory[option]
                    });
                    continue;
                }
                for (let j = 1; j < LiveMetricsRangeSeconds; j++) {
                    datapoints.push({
                        timestamp: moment(start).add(j, 'seconds').toDate(),
                        value: (metricId === ContainerMetricChartId.Cpu) ? result[i].cpu[option] : result[i].memory[option]
                    });
                }
                break;
            }
            (series[clusterName][option].metricResults.data as MetricSeriesAndSummary[])[0].dataPoints = datapoints;
            // override grain, start, and end since TimeInterval doesn't support PT1S grain.
            series[clusterName][option].metricResults.startTime = moment(start).toDate();
            series[clusterName][option].metricResults.endTime = moment(end).toDate();
            series[clusterName][option].metricResults.timeGrain = 'PT1S';
        });
        return this.flattenSeriesMap(series);
    }
}
