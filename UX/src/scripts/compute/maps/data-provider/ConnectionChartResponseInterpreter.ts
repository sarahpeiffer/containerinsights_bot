import { 
    ChartSeriesData,
    Aggregation,
    MetricSeriesAndSummary,
    MetricDataPoint
} from '@appinsights/aichartcore';
import { ICommonComputeTabProps } from '../../ICommonComputeTabProps';
import { AggregationOption } from '../../../shared/AggregationOption';
import { ITimeInterval } from '../../../shared/data-provider/TimeInterval';
import { StringMap } from '../../../shared/StringMap';
import { 
    IMetricChartDescriptor,
    ConnectionMetricChartName,
    ConnectionMetricCharts
} from '../map-connections/ConnectionMetricCharts';

import {
    IMetricDescriptor,
    ConnectionMetrics,
    ConnectionMetricName
} from '../map-connections/ConnectionMetrics';


import {
    ICAApiMetrics,
    ICAApiMetricValues,
    ICAApiConnectionMetrics
} from './IConnectionAnalyticsApi';

import * as GlobalConstants from '../../../shared/GlobalConstants';
if (!(Number.MIN_SAFE_INTEGER)) {
    Number.MIN_SAFE_INTEGER = GlobalConstants.MIN_SAFE_INTEGER;
}

export interface IConnectionChartResponseInterpreter {
    getChartData(
        result: any,
        currentProps: Readonly<ICommonComputeTabProps>,
        timeInterval: ITimeInterval
    ): StringMap<any>;
}

export class ConnectionChartResponseInterpreter implements IConnectionChartResponseInterpreter {

    public getChartData(
        response: any, 
        currentProps: Readonly<ICommonComputeTabProps>,
        timeInterval: ITimeInterval
    ): StringMap<StringMap<ChartSeriesData>> {
        // Naga TODO: Break down this super function
        // Task190094 (https://msecg.visualstudio.com/DefaultCollection/OMS/_workitems/edit/190094)
        let chartSeriesMap = this.createAllDefaultChartSeriesMap(currentProps, timeInterval);

        const connectionMetrics = response.connectionMetrics as ICAApiConnectionMetrics[];
        const metrics = connectionMetrics[0].metrics as ICAApiMetrics[];

        if (!response || !response.startTime || !response.endTime || !connectionMetrics ||
            !metrics) {
                
            return chartSeriesMap;
        }

        metrics.forEach(metric => {
            if (metric.name.value === ConnectionMetricName.ResponseTime) {
                const metricValues = metric.metricValues as ICAApiMetricValues[];

                let minDataPoints: MetricDataPoint[] = [];
                let avgDataPoints: MetricDataPoint[] = [];
                let maxDataPoints: MetricDataPoint[] = [];
                let requestsDataPoints: MetricDataPoint[] = [];

                let requestsSummary = 0;
                let avgSummary = 0;
                let maxSummary = 0;
                let minSummary = Number.MAX_SAFE_INTEGER;

                let count = 0;

                metricValues.forEach(metricValue => {
                    const metricValueTimestamp = new Date(metricValue.timestamp);
                    minDataPoints.push({
                        timestamp: metricValueTimestamp,
                        value: metricValue.minimum
                    });

                    maxDataPoints.push({
                        timestamp: metricValueTimestamp,
                        value: metricValue.maximum
                    });

                    avgDataPoints.push({
                        timestamp: metricValueTimestamp,
                        value: metricValue.average
                    });
                    
                    requestsDataPoints.push({
                        timestamp: metricValueTimestamp,
                        value: metricValue.count
                    });

                    // Naga TODO: Check if there is a better way to calculate summary
                    if (metricValue.minimum < minSummary) {
                        minSummary = metricValue.minimum;
                    }

                    if (metricValue.maximum > maxSummary) {
                        maxSummary = metricValue.maximum;
                    }

                    avgSummary += metricValue.average;
                    requestsSummary += (metricValue.count);

                    count++
                });

                if (count > 0) {
                    avgSummary /= count;
                    requestsSummary /= count;

                    let series = chartSeriesMap[ConnectionMetricChartName.ResponseTime] as StringMap<ChartSeriesData>;
                    let seriesRequests = chartSeriesMap[ConnectionMetricChartName.Requests] as StringMap<ChartSeriesData>;

                    (series[AggregationOption.Min].metricResults.data as MetricSeriesAndSummary[])[0].dataPoints = minDataPoints;
                    (series[AggregationOption.Avg].metricResults.data as MetricSeriesAndSummary[])[0].dataPoints = avgDataPoints;
                    (series[AggregationOption.Max].metricResults.data as MetricSeriesAndSummary[])[0].dataPoints = maxDataPoints;

                    (seriesRequests[AggregationOption.Requests].metricResults.data as MetricSeriesAndSummary[])[0].dataPoints = 
                    requestsDataPoints;

                    (series[AggregationOption.Min].metricResults.data as MetricSeriesAndSummary[])[0].summary = minSummary;
                    (series[AggregationOption.Avg].metricResults.data as MetricSeriesAndSummary[])[0].summary = avgSummary;
                    (series[AggregationOption.Max].metricResults.data as MetricSeriesAndSummary[])[0].summary = maxSummary;

                    (seriesRequests[AggregationOption.Requests].metricResults.data as MetricSeriesAndSummary[])[0].summary = 
                    requestsSummary;
                }
            } else {
                const metricValues = metric.metricValues as ICAApiMetricValues[];
                let totalDataPoints: MetricDataPoint[] = [];
                let totalSummary = 0;
                let count = 0

                metricValues.forEach(metricValue => {
                    const metricValueTimestamp = new Date(metricValue.timestamp);
                    totalDataPoints.push({
                        timestamp: metricValueTimestamp,
                        value: metricValue.total
                    });

                    totalSummary += metricValue.total;
                    count++
                    
                });

                if (count > 0) {
                    totalSummary /= count;

                    let series = undefined

                    if (metric.name.value === ConnectionMetricName.BytesSent ||
                        metric.name.value === ConnectionMetricName.BytesReceived) {
                            series = chartSeriesMap[ConnectionMetricChartName.Traffic] as StringMap<ChartSeriesData>;
                    } else {
                            series = chartSeriesMap[ConnectionMetricChartName.Links] as StringMap<ChartSeriesData>;
                    }

                    const aggregationOpt = ConnectionMetrics.get(metric.name.value).mappedAggregation;
                    (series[aggregationOpt].metricResults.data as MetricSeriesAndSummary[])[0].dataPoints = totalDataPoints;
                    (series[aggregationOpt].metricResults.data as MetricSeriesAndSummary[])[0].summary = totalSummary;

                }

            }
        });

        return chartSeriesMap;
    }

    private createAllDefaultChartSeriesMap(
        currentProps: Readonly<ICommonComputeTabProps>,
        timeInterval: ITimeInterval
    ): StringMap<StringMap<ChartSeriesData>> {
        let chartSeriesMap: StringMap<StringMap<ChartSeriesData>> = {};
        
        ConnectionMetricCharts.list().forEach(element => {
            let chartDescriptor = element as IMetricChartDescriptor;
            let series: StringMap<ChartSeriesData> = {};

            chartDescriptor.metrics.forEach(m => {
                let metricDescriptor = ConnectionMetrics.get(m) as IMetricDescriptor;
                let chartSeries = this.createSingleDefaultChartSeries(
                    currentProps, metricDescriptor, timeInterval);
                
                series[metricDescriptor.mappedAggregation] = chartSeries;
                
            });

            chartSeriesMap[chartDescriptor.chartName] = series;
           
        });

        return chartSeriesMap;
    }
    
    private createSingleDefaultChartSeries(
        currentProps: Readonly<ICommonComputeTabProps>,
        metricDescriptor: IMetricDescriptor,
        timeInterval: ITimeInterval
    ): ChartSeriesData {
        let isoGrain: string = 'PT' + timeInterval.getGrainKusto().toUpperCase();

        let series: ChartSeriesData = {
            metricUniqueId: metricDescriptor.name,
            metricResults: {
                metricId: {
                    resourceDefinition: {
                        id: '',
                        name: ''
                    },
                    name: {
                        id: metricDescriptor.name,
                        displayName: metricDescriptor.displayName
                    }
                },
                startTime: timeInterval.getBestGranularStartDate(),
                endTime: timeInterval.getBestGranularEndDate(),
                timeGrain: isoGrain,
                aggregation: Aggregation.None,
                data: [{dataPoints: [], summary: null}]
            },
            visualization: {
                displayName: metricDescriptor.visualization.displayName,
                resourceDisplayName: '',
                color: metricDescriptor.visualization.color,
                unit: metricDescriptor.visualization.unit,
                displaySIUnit: metricDescriptor.visualization.displaySIUnit,
                missingDataFillType: metricDescriptor.visualization.missingDataFillType
            }
        };

        return series;
    }
}
