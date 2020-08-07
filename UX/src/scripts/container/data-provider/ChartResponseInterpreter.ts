import {
    ChartSeriesData,
    MetricUnit,
    Aggregation,
    MissingDataFillingType
} from '@appinsights/aichartcore';

import { ITimeInterval } from '../../shared/data-provider/TimeInterval';
import { NodeCountMetricSeries, PodCountMetricSeries } from '../ContainerMetricChart';
import { DisplayStrings } from '../../shared/DisplayStrings';
import * as AzureColors from '../../shared/AzureColors';
import { AggregationOption } from '../../shared/AggregationOption';

/** Set of properties driving data series visualization */
export interface ISeriesVisualizationProps {
    /** internal id of the metric */
    metricId: string;

    /** aggregation to use to calculate summary fot the whole chart */
    aggregation: Aggregation;

    /** metric display name */
    displayName: string;
}

/**
 * shared code between mdmchartresponseinterpreter and kustochartresponseinterpreter
 */
export abstract class ChartResponseInterpreter {
    /**
     * central entry and decision point for the cluster performance chart response interpretation
     * @param result the raw data
     * @param metricId the metric being polled
     * @param timeInterval the time interval data was pulled over
     * @param isLoadedFromMdm true if the data was loaded from mdm...
     * @param clusterName name of the cluster that is being queried
     */
    public abstract getClusterPerformanceChartData(
        result: any,
        metricId: string,
        timeInterval: ITimeInterval,
        isLoadedFromMdm: boolean,
        clusterName: string,
    ): StringMap<ChartSeriesData>;

    /**
     * central entry and decision point for the cluster node count chart response interpretation
     * @param result the raw data
     * @param timeInterval the time interval data was pulled over
     * @param isLoadedFromMdm true if the data was loaded from mdm...
     * @param clusterName name of the cluster that is being queried
     */
    public abstract getClusterNodeCountChartData(
        result: any,
        timeInterval: ITimeInterval,
        isLoadedFromMdm: boolean,
        clusterName: string,
    ): StringMap<ChartSeriesData>;

    /**
     * central entry and decision point for the cluster pod count chart response interpretation
     * @param result the raw data
     * @param timeInterval the time interval data was pulled over
     * @param isLoadedFromMdm true if the data was loaded from mdm...
     * @param clusterName name of the cluster that is being queried
     */
    public abstract getClusterPodCountChartData(
        result: any,
        timeInterval: ITimeInterval,
        isLoadedFromMdm: boolean,
        clusterName: string,
    ): StringMap<ChartSeriesData>;

    /**
     * Transforms double dictionary (first by cluster second by metric)
     * into a flat dictionary where key is "clusterName | metricId"
     * @param series double dictionary of metric data series
     * @returns single dictionary of metric data series
     */
    public flattenSeriesMap(series: StringMap<StringMap<ChartSeriesData>>): StringMap<ChartSeriesData> {
        const flatSeriesMap: StringMap<ChartSeriesData> = {};

        if (!series) { return flatSeriesMap; }

        for (const clusterName in series) {
            if (!series.hasOwnProperty(clusterName)) { continue; }

            const clusterSeries = series[clusterName];

            for (const seriesKey in clusterSeries) {
                if (!clusterSeries.hasOwnProperty(seriesKey)) { continue; }

                const individualSeries = clusterSeries[seriesKey];

                flatSeriesMap[clusterName + '|' + seriesKey] = individualSeries;
            }
        }

        return flatSeriesMap;
    }

    /**
     * Creates a set of node count time series for a given cluster containing
     * series visualization parameters and empty data
     * @param clusterName cluster name
     * @param metricUnit unit of the metric
     * @param timeInterval series time interval
     * @param paletteShiftIndex starting index in the palette array of colors
     * @param isLoadedFromMDM
     */
    public createNodeCountMetricEmptySeriesSet(
        clusterName: string,
        metricUnit: MetricUnit,
        timeInterval: ITimeInterval,
        paletteShiftIndex: number,
        isLoadedFromMDM: boolean
    ): StringMap<ChartSeriesData> {
        const seriesProps: Array<ISeriesVisualizationProps> = [
            { metricId: NodeCountMetricSeries.All, aggregation: Aggregation.Percentile, displayName: DisplayStrings.LegendCountTotal },
            { metricId: NodeCountMetricSeries.Ready, aggregation: Aggregation.Percentile, displayName: DisplayStrings.LegendCountReady },
            // tslint:disable-next-line:max-line-length
            { metricId: NodeCountMetricSeries.NotReady, aggregation: Aggregation.Percentile, displayName: DisplayStrings.LegendCountNotReady },
        ];

        return this.createEmptySeriesSet(
            clusterName,
            seriesProps,
            metricUnit,
            timeInterval,
            AzureColors.palette,
            paletteShiftIndex,
            isLoadedFromMDM
        );
    }

    /**
     * Creates a set of pod count time series for a given cluster containing
     * series visualization parameters and empty data
     * @param clusterName cluster name
     * @param metricUnit unit of the metric
     * @param timeInterval series time interval
     * @param paletteShiftIndex starting index in the palette array of colors
     * @param isLoadedFromMDM
     */
    public createPodCountMetricEmptySeriesSet(
        clusterName: string,
        metricUnit: MetricUnit,
        timeInterval: ITimeInterval,
        paletteShiftIndex: number,
        isLoadedFromMDM: boolean
    ): StringMap<ChartSeriesData> {
        const seriesProps: Array<ISeriesVisualizationProps> = [
            {
                metricId: PodCountMetricSeries.All,
                aggregation: Aggregation.Percentile,
                displayName: DisplayStrings.LegendCountTotal
            },
            {
                metricId: PodCountMetricSeries.Pending,
                aggregation: Aggregation.Percentile,
                displayName: DisplayStrings.LegendCountPending
            },
            {
                metricId: PodCountMetricSeries.Running,
                aggregation: Aggregation.Percentile,
                displayName: DisplayStrings.LegendCountRunning
            },
            {
                metricId: PodCountMetricSeries.Unknown,
                aggregation: Aggregation.Percentile,
                displayName: DisplayStrings.LegendCountUnknown
            },
            {
                metricId: PodCountMetricSeries.Succeeded,
                aggregation: Aggregation.Percentile,
                displayName: DisplayStrings.LegendCountSucceeded
            },
            {
                metricId: PodCountMetricSeries.Failed,
                aggregation: Aggregation.Percentile,
                displayName: DisplayStrings.LegendCountFailed
            },
        ];

        return this.createEmptySeriesSet(
            clusterName,
            seriesProps,
            metricUnit,
            timeInterval,
            AzureColors.palette,
            paletteShiftIndex,
            isLoadedFromMDM
        );
    }

    /**
     * Creates a set of cpu&memory time series for a given cluster containing
     * series visualization parameters and empty data
     * @param clusterName cluster name
     * @param metricUnit unit of the metric
     * @param timeInterval series time interval
     * @param paletteShiftIndex starting index in the palette array of colors
     * @param isLoadedFromMDM
     */
    public createPerformanceMetricEmptySeriesSet(
        clusterName: string,
        metricUnit: MetricUnit,
        timeInterval: ITimeInterval,
        paletteShiftIndex: number,
        isLoadedFromMDM: boolean
    ): StringMap<ChartSeriesData> {
        const seriesProps: Array<ISeriesVisualizationProps> = [
            { metricId: AggregationOption.Avg, aggregation: Aggregation.Avg, displayName: DisplayStrings.LegendAvg },
            { metricId: AggregationOption.Min, aggregation: Aggregation.Min, displayName: DisplayStrings.LegendMin },
            { metricId: AggregationOption.P50, aggregation: Aggregation.Percentile, displayName: DisplayStrings.LegendP50 },
            { metricId: AggregationOption.P90, aggregation: Aggregation.Percentile, displayName: DisplayStrings.LegendP90 },
            { metricId: AggregationOption.P95, aggregation: Aggregation.Percentile, displayName: DisplayStrings.LegendP95 },
            { metricId: AggregationOption.Max, aggregation: Aggregation.Max, displayName: DisplayStrings.LegendMax },
        ];
        return this.createEmptySeriesSet(
            clusterName,
            seriesProps,
            metricUnit,
            timeInterval,
            AzureColors.palette,
            paletteShiftIndex,
            isLoadedFromMDM
        );
    }

    /**
     * Creates a set of cpu&memory time series for a given tab live
     * series visualization parameters and empty data
     * @param clusterName cluster name
     * @param metricUnit unit of the metric
     * @param timeInterval series time interval
     * @param paletteShiftIndex starting index in the palette array of colors
     */
    public createLiveTabMetricEmptySeriesSet(
        clusterName: string,
        metricUnit: MetricUnit,
        timeInterval: ITimeInterval,
        paletteShiftIndex: number,
    ): StringMap<ChartSeriesData> {
        let seriesProps: Array<ISeriesVisualizationProps> = [
            { metricId: AggregationOption.Usage, aggregation: Aggregation.Count, displayName: DisplayStrings.OptionUsage },
            { metricId: AggregationOption.Limits, aggregation: Aggregation.Count, displayName: DisplayStrings.OptionLimits },
            { metricId: AggregationOption.Requests, aggregation: Aggregation.Count, displayName: DisplayStrings.OptionRequests }
        ];
        return this.createEmptySeriesSet(
            clusterName,
            seriesProps,
            metricUnit,
            timeInterval,
            AzureColors.palette,
            paletteShiftIndex,
            false
        );
    }

    /**
     * Creates a set of time series for a given cluster containing
     * series visualization parameters and empty data
     * @param clusterName cluster name
     * @param seriesProps data series properties
     * @param metricUnit unit of the metric
     * @param timeInterval series time interval
     * @param paletteShiftIndex starting index in the palette array of colors
     */
    private createEmptySeriesSet(
        clusterName: string,
        seriesProps: Array<ISeriesVisualizationProps>,
        metricUnit: MetricUnit,
        timeInterval: ITimeInterval,
        palette: string[],
        paletteShiftIndex: number,
        isLoadedFromMdm: boolean
    ): StringMap<ChartSeriesData> {
        if (!clusterName) { throw new Error('Parameter @clusterName may not be null or empty'); }

        if (!seriesProps || !seriesProps.length || (seriesProps.length <= 0)) {
            throw new Error('Parameter @seriesProps may not be null or empty');
        }

        if (!timeInterval) { throw new Error('Parameter @timeInterval may not be null or empty'); }

        if (!palette || !palette.length || (palette.length <= 0)) {
            throw new Error('Parameter @palette may not be null or empty');
        }

        let isoGrain: string = timeInterval.getISOInterval().toUpperCase();

        // HACK : For MDM loads we're manually setting the isoGrain to PT1M instead of PT30M.
        // Setting it to the latter causes a bug in the charts code to popup where the zero filling parameter is not respected.
        if (isLoadedFromMdm) {
            isoGrain = 'PT1M';
        }

        const seriesMap = {};

        for (let i = 0; i < seriesProps.length; i++) {
            const props: ISeriesVisualizationProps = seriesProps[i];

            const series: ChartSeriesData = {
                metricUniqueId: clusterName + '|' + props.metricId,
                metricResults: {
                    metricId: {
                        resourceDefinition: {
                            id: clusterName,
                            name: clusterName
                        },
                        name: {
                            id: props.metricId,
                            displayName: props.displayName
                        }
                    },
                    startTime: timeInterval.getBestGranularStartDate(),
                    endTime: timeInterval.getBestGranularEndDate(),
                    timeGrain: isoGrain,
                    aggregation: props.aggregation,
                    data: [{ dataPoints: [], summary: null }]
                },
                visualization: {
                    displayName: props.displayName,
                    resourceDisplayName: clusterName,
                    color: palette[(paletteShiftIndex + i) % palette.length],
                    unit: metricUnit,
                    displaySIUnit: true,
                    // TODO: would rather prefer .NoFill but chart starts
                    //       acting strange where there is lots of gaps
                    missingDataFillType: MissingDataFillingType.FillWithValueInThePath
                }
            };

            seriesMap[props.metricId] = series;
        }

        return seriesMap;
    }
}
