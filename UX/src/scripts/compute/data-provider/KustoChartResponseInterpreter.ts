/**
 * Third party Imports
 */
import * as moment from 'moment';
import {
    ChartSeriesData,
    Aggregation,
    MetricUnit,
    MetricSeriesAndSummary,
    MetricDataPoint,
    MissingDataFillingType
} from '@appinsights/aichartcore';

/**
 * Local Imports
 */
import * as Constants from '../Constants';
import { ICommonComputeTabProps } from '../ICommonComputeTabProps';
import { ICounter } from '../VirtualMachineMetricCharts';
import { KustoNodeIdentityResponseInterpreter } from './KustoNodeIdentityResponseInterpreter';
import { ISingleTopNChartQueryProps } from '../ComputeTopNChartPane';

/**
 * Shared Imports
 */
import * as AzureColors from '../../shared/AzureColors';
import { DisplayStrings } from '../../shared/DisplayStrings';
import { AggregationOption } from '../../shared/AggregationOption';
import { ITimeInterval } from '../../shared/data-provider/TimeInterval';
import { ITelemetry, TelemetryMainArea } from './../../shared/Telemetry';
import { TelemetryFactory } from './../../shared/TelemetryFactory';
import { StringMap } from '../../shared/StringMap';
import { ErrorSeverity } from '../../shared/data-provider/TelemetryErrorSeverity';

/**
 * Constants
 */
const GET_KUSTOCHART_RESPONSE_EXCEPTION: string = '@getKustoChartResponse';

/** Set of properties driving data series visualization */
interface ISeriesVisualizationProps {
    /** internal id of the metric */
    metricId: string;

    /** aggregation to use to calculate summary fot the whole chart */
    aggregation: Aggregation;

    /** metric display name */
    displayName: string;
}

export interface IChartKustoResult {
    Tables: IChartKustoTable[];
}

export interface IChartKustoTable {
    Rows: any[];
}

export interface IKustoChartResponseInterpreter {
    getChartData(
        result: any,
        targetMetricType: string,
        currentProps: Readonly<ICommonComputeTabProps>,
        timeInterval: ITimeInterval
    ): StringMap<ChartSeriesData>;
}

export class KustoChartResponseInterpreter implements IKustoChartResponseInterpreter {
    private chartAggregationsCount: number = 8;
    private diskUsageChartAggregationsCount: number = 1;
    private topNChartAggregationsCount: number = -2;
    private aggregationsIndices: StringMap<number> = {
        [AggregationOption.Min]: 2,
        [AggregationOption.Avg]: 3,
        [AggregationOption.Max]: 4,
        [AggregationOption.P05]: 5,
        [AggregationOption.P10]: 6,
        [AggregationOption.P50]: 7,
        [AggregationOption.P90]: 8,
        [AggregationOption.P95]: 9,
    };
    private aggregationIndexsForDiskUsageData: StringMap<number> = {
        [AggregationOption.Max]: 2
    };

    /**
     * The index is constant (i.e 5) because we are querying only one aggregation at a time
     */
    private topNIndices: StringMap<number> = {
        [AggregationOption.P05]: 5,
        [AggregationOption.P10]: 5,
        [AggregationOption.P50]: 5,
        [AggregationOption.P90]: 5,
        [AggregationOption.P95]: 5,
        [AggregationOption.Min]: 5,
        [AggregationOption.Max]: 5,
        [AggregationOption.Avg]: 5
    };

    private seriesProps: Array<ISeriesVisualizationProps> = [
        { metricId: AggregationOption.Min, aggregation: Aggregation.Min, displayName: DisplayStrings.LegendMin },
        { metricId: AggregationOption.Avg, aggregation: Aggregation.Avg, displayName: DisplayStrings.LegendAvg },
        { metricId: AggregationOption.Max, aggregation: Aggregation.Max, displayName: DisplayStrings.LegendMax },
        { metricId: AggregationOption.P05, aggregation: Aggregation.Percentile, displayName: DisplayStrings.LegendP05 },
        { metricId: AggregationOption.P10, aggregation: Aggregation.Percentile, displayName: DisplayStrings.LegendP10 },
        { metricId: AggregationOption.P50, aggregation: Aggregation.Percentile, displayName: DisplayStrings.LegendP50 },
        { metricId: AggregationOption.P90, aggregation: Aggregation.Percentile, displayName: DisplayStrings.LegendP90 },
        { metricId: AggregationOption.P95, aggregation: Aggregation.Percentile, displayName: DisplayStrings.LegendP95 },
    ];

    private diskUsageSeriesProps: Array<ISeriesVisualizationProps> = [
        { metricId: AggregationOption.Max, aggregation: Aggregation.Max, displayName: DisplayStrings.LegendMax },
    ];

    private topNSeriesP05Props: Array<ISeriesVisualizationProps> = [
        { metricId: AggregationOption.P05, aggregation: Aggregation.Percentile, displayName: DisplayStrings.LegendP05 },
    ];

    private topNSeriesP95Props: Array<ISeriesVisualizationProps> = [
        { metricId: AggregationOption.P95, aggregation: Aggregation.Percentile, displayName: DisplayStrings.LegendP95 },
    ];

    /** colors to use on charts */
    private palette: string[] = [
        AzureColors.BLUE, AzureColors.PINK, AzureColors.YELLOW, AzureColors.GREEN,
        AzureColors.DARK_ORANGE, AzureColors.LIGHT_GREEN, AzureColors.LIGHT_BLUE, AzureColors.LIGHT_PINK];

    private telemetry: ITelemetry;

    constructor() {
        this.telemetry = TelemetryFactory.get(TelemetryMainArea.Compute);
    }

    public parseQueryResult(
        result: any,
        targetMetricType: string,
        seriesName: string,
        timeInterval: ITimeInterval,
        shiftPaletteIndex: number
    ): StringMap<ChartSeriesData> {
        // result must have an array of tables
        if (!result || !result.Tables || (result.Tables.length === 0) ||
            !result.Tables[0].Rows || (result.Tables[0].Rows.length === 0) || !result.Tables[0].Rows[0]) {
            // Just return empty series.
            return this.createEmptySeriesSet(
                seriesName, this.seriesProps, this.getMetricUnit(targetMetricType), timeInterval, this.palette, shiftPaletteIndex);
        }

        // first table contains results in array of rows
        const resultRows = result.Tables[0].Rows;

        let series: StringMap<ChartSeriesData> = undefined;

        for (let i = 0; i < resultRows.length; i++) {
            // each row is an array of values for columns
            const resultRow = resultRows[i];
            const metricType = resultRow[0];

            if (metricType === targetMetricType) {
                // the underlying chart wants the actual start and end times snapped to the given time grain.
                let timeStamps: Array<Date> = this.getTimeStamps(resultRow[1], timeInterval.getGrainMinutes());

                series = this.createEmptySeriesSet(
                    seriesName, this.seriesProps, this.getMetricUnit(targetMetricType), timeInterval, this.palette, shiftPaletteIndex);

                let scale: number = undefined;
                if (targetMetricType === 'Available MBytes') {
                    // Assuming everything is using base 2 (see MB vs MiB).
                    scale = Constants.MemoryUnits.MegaBytes;
                } else if (targetMetricType === 'Avg. Disk sec/Transfer') {
                    // use ms instead of seconds as the unit for latency otherwise the number will be too small
                    scale = Constants.MetricUnits.Kilo;
                }
                const summaryIndexOffset: number = this.chartAggregationsCount + 1;
                this.setSeriesValue(series, resultRow, timeStamps,
                    AggregationOption.Min, scale, this.aggregationsIndices, summaryIndexOffset);
                this.setSeriesValue(series, resultRow, timeStamps,
                    AggregationOption.Avg, scale, this.aggregationsIndices, summaryIndexOffset);
                this.setSeriesValue(series, resultRow, timeStamps,
                    AggregationOption.Max, scale, this.aggregationsIndices, summaryIndexOffset);
                this.setSeriesValue(series, resultRow, timeStamps,
                    AggregationOption.P05, scale, this.aggregationsIndices, summaryIndexOffset);
                this.setSeriesValue(series, resultRow, timeStamps,
                    AggregationOption.P10, scale, this.aggregationsIndices, summaryIndexOffset);
                this.setSeriesValue(series, resultRow, timeStamps,
                    AggregationOption.P50, scale, this.aggregationsIndices, summaryIndexOffset);
                this.setSeriesValue(series, resultRow, timeStamps,
                    AggregationOption.P90, scale, this.aggregationsIndices, summaryIndexOffset);
                this.setSeriesValue(series, resultRow, timeStamps,
                    AggregationOption.P95, scale, this.aggregationsIndices, summaryIndexOffset);
            }
        }

        if (!series) {
            // Did not find the target metric, just return empty series.
            return this.createEmptySeriesSet(
                seriesName, this.seriesProps, this.getMetricUnit(targetMetricType), timeInterval, this.palette, shiftPaletteIndex);
        }

        return series;
    }

    public getChartData(
        result: any,
        targetMetricType: string,
        currentProps: Readonly<ICommonComputeTabProps>,
        timeInterval: ITimeInterval
    ): StringMap<ChartSeriesData> {
        return this.parseQueryResult(result, targetMetricType,
            currentProps.workspace && currentProps.workspace.name, timeInterval, 0);
    }

    public getFlattenedChartData(
        result: any,
        counters: ICounter[],
        timeInterval: ITimeInterval
    ): StringMap<ChartSeriesData> {
        let series: StringMap<StringMap<ChartSeriesData>> = {};
        let shiftPaletteIndex = 0;
        counters.forEach(counter => {
            if (counter && counter.name && counter.displayString) {
                series[counter.displayString] = this.parseQueryResult(
                    result, counter.name, counter.displayString, timeInterval, shiftPaletteIndex);

                shiftPaletteIndex++;
            }
        });
        return this.flattenSeriesMap(series);
    }

    public getFlattenedTopNChartData(
        result: any,
        counters: ICounter[],
        timeInterval: ITimeInterval,
        singleChartQuery?: ISingleTopNChartQueryProps
    ): StringMap<ChartSeriesData> {
        let data: StringMap<StringMap<ChartSeriesData>> = {};

        if (!this.isTopNChartQueryResultsValid(result)) {
            // Just return empty series.
            return this.flattenSeriesMap(data);
        }

        // first table contains results in array of rows
        const resultRows = result.Tables[0].Rows;

        let shiftPaletteIndex = 0;
        for (let i = 0; i < resultRows.length; i++) {
            const resultRow = resultRows[i];
            // TODO: Do we need to confimr the counter names?
            // There should only be 1 counter in this scenario
            const jsonNodeProps = JSON.parse(resultRow[2]);
            const counterName: string = resultRow[0];
            let computerName: string = KustoNodeIdentityResponseInterpreter.GetName(jsonNodeProps);

            // TODO: Change it back to '\'
            // App insights charts assumes this is an azure resource if it has '\'
            // and tries to parse it and fails. Till that is fixed, '/' will be flipped to '\' 
            // I will update a Bug number once created
            if (computerName.indexOf('/') !== -1) {
                computerName = computerName.split('/').join('\\');
            }

            let scale: number = undefined;
            let aggregation = singleChartQuery ? this.getAggregationOption(singleChartQuery.optionId) : AggregationOption.P95;
            let visulizationProps = singleChartQuery ? this.getTopNVisualizationProps(aggregation) : this.topNSeriesP95Props;
            // TODO: Define counter names as contants
            if (counterName === 'Available MBytes') {
                // Assuming everything is using base 2 (see MB vs MiB).
                scale = Constants.MemoryUnits.MegaBytes;
                // use P05
                aggregation = singleChartQuery ?  aggregation : AggregationOption.P05;
                visulizationProps = singleChartQuery ? visulizationProps : this.topNSeriesP05Props;
            } else if (counterName === 'Avg. Disk sec/Transfer') {
                // use ms instead of seconds as the unit for latency otherwise the number will be too small
                scale = Constants.MetricUnits.Kilo;
            }

            // the underlying chart wants the actual start and end times snapped to the given time grain.
            let timeStamps: Array<Date> = this.getTimeStamps(resultRow[4], timeInterval.getGrainMinutes());
            let series = this.createEmptySeriesSet(
                computerName, visulizationProps, this.getMetricUnit(counterName), timeInterval, this.palette, shiftPaletteIndex);
            this.setSeriesValue(series, resultRow, timeStamps,
                aggregation, scale, this.topNIndices, this.topNChartAggregationsCount);

            data[computerName] = series;
            shiftPaletteIndex++;
        }

        return this.flattenSeriesMap(data);
    }

    public getFlattenedSingleComputeDiskUsageChartData(
        result: any,
        timeInterval: ITimeInterval
    ): StringMap<ChartSeriesData> {
        let diskUsageData: StringMap<StringMap<ChartSeriesData>> = {};

        if (!result || !result.Tables || (result.Tables.length === 0) ||
            !result.Tables[0].Rows || (result.Tables[0].Rows.length === 0) || !result.Tables[0].Rows[0]) {
            // Just return empty series.
            return this.flattenSeriesMap(diskUsageData);
        }

        // first table contains results in array of rows
        const resultRows: any[] = result.Tables[0].Rows;

        const hasEmptyInstanceName: boolean = resultRows.some((resultRow) => resultRow[0] === '');
        if (hasEmptyInstanceName) {
            return undefined;
        }

        let shiftPaletteIndex = 0;
        for (let i = 0; i < resultRows.length; i++) {
            const resultRow = resultRows[i];
            let diskName: string = resultRow[0];

            // TODO: Change it back to '\'
            // App insights charts assumes this is an azure resource if it has '\'
            // and tries to parse it and fails. Till that is fixed, '/' will be flipped to '\' 
            // I will update a Bug number once created
            if (diskName.indexOf('/') !== -1) {
                diskName = diskName.split('/').join('\\');
            }

            // the underlying chart wants the actual start and end times snapped to the given time grain.
            let timeStamps: Array<Date> = this.getTimeStamps(resultRow[1], timeInterval.getGrainMinutes());
            let series = this.createEmptySeriesSet(
                diskName, this.diskUsageSeriesProps, this.getMetricUnit(''), timeInterval, this.palette, shiftPaletteIndex);
            this.setSeriesValue(series, resultRow, timeStamps,
                AggregationOption.Max, 1, this.aggregationIndexsForDiskUsageData, this.diskUsageChartAggregationsCount);

            diskUsageData[diskName] = series;
            shiftPaletteIndex++;
        }

        return this.flattenSeriesMap(diskUsageData);
    }

    /**
     * Merge two tables based on their counter name
     * 
     * TODO: After Kusto team fix join bug, return this join logic back to kusto
     * @param queryResult two tables return from Chart Kusto query, one for summary, one for dataPoints
     */
    public mergeAggregateComputerChart(queryResult: IChartKustoResult): IChartKustoResult {
        if (!this.validChartTableResult(queryResult)) {
            return null;
        }

        const summaryTable = queryResult.Tables[0];
        //cache the first table with its CounterName
        const summaryMap: StringMap<any> = {};
        for (let i = 0; i < summaryTable.Rows.length; i++) {
            const resultRow = summaryTable.Rows[i];
            //resultRow[0] is the CounterName
            summaryMap[resultRow[0]] = resultRow;
        }

        const rowArray = [];
        const dataPointsTable = queryResult.Tables[1];
        //look up the row from cache, concat the datapoint row and summary row
        for (let i = 0; i < dataPointsTable.Rows.length; i++) {
            const summaryRow = summaryMap[dataPointsTable.Rows[i][0]];
            if (!summaryRow) {
                continue;
            }
            const dataPointsRow = dataPointsTable.Rows[i];
            const newRow = dataPointsRow.concat(summaryRow);
            rowArray.push(newRow);
        }

        let result: IChartKustoResult = { Tables: [{ Rows: [] }] };
        result.Tables[0].Rows = rowArray;
        return result;
    }

    /**
     * 1. validate the table size
     * 2. validate table 1 column size, must equal to 9 
     * 3. validate table 2 column size, must equal to 10.
     * @param queryResult 
     */
    private validChartTableResult(queryResult: any): boolean {
        return queryResult && queryResult.Tables && (queryResult.Tables.length >= 2)
            && queryResult.Tables[0].Rows && (queryResult.Tables[0].Rows.length > 0)
            && queryResult.Tables[0].Rows[0].length === 9
            && queryResult.Tables[1].Rows && (queryResult.Tables[1].Rows.length > 0)
            && queryResult.Tables[1].Rows[0].length === 10;
    }

    /**
     * Validates the response for top n charts query
     * @param queryResult
     */
    private isTopNChartQueryResultsValid(queryResult: any) {
        return queryResult && queryResult.Tables
            && (queryResult.Tables.length > 0)
            && queryResult.Tables[0].Rows && (queryResult.Tables[0].Rows.length > 0)
            && queryResult.Tables[0].Rows[0];
    }

    private getTimeStamps(rawInput: string, grain: number): Array<Date> {
        return (JSON.parse(rawInput) as Array<string>).map((value) => {
            // The ai chart expects data to be aligned halfway through the given interval
            return moment.utc(value).add(grain / 2, 'minutes').toDate();
        });
    }

    private setSeriesValue(series: StringMap<ChartSeriesData>,
        resultRow: any,
        timeStamps: Array<Date>,
        aggregation: AggregationOption,
        scale: number,
        aggregationsIndices: StringMap<number>,
        summaryIndexOffset: number
    ) {
        let aggregationIndex: number = aggregationsIndices[aggregation];

        let summaryIndex: number = aggregationIndex + summaryIndexOffset;

        let datapoints = this.createSeries(timeStamps, JSON.parse(resultRow[aggregationIndex]), scale);
        (series[aggregation].metricResults.data as MetricSeriesAndSummary[])[0].dataPoints = datapoints;

        let summary = resultRow[summaryIndex];

        if (scale) {
            summary *= scale;
        }
        (series[aggregation].metricResults.data as MetricSeriesAndSummary[])[0].summary = summary;
    }

    private createSeries(xValues: Array<Date>, yValues: Array<number>, scale?: number): MetricDataPoint[] {
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

    private getMetricUnit(targetMetricType: string): MetricUnit {
        switch (targetMetricType) {
            case 'Available MBytes':
                return MetricUnit.Bytes;
            case 'Bytes Sent/sec':
            case 'Bytes Received/sec':
            case 'Disk Bytes/sec':
                return MetricUnit.BytesPerSecond;
            case 'Disk Transfers/sec':
                return MetricUnit.Count;
            case 'Avg. Disk sec/Transfer':
                return MetricUnit.MilliSeconds;
            default:
                return MetricUnit.Percent;
        }
    }

    /**
     * Creates a set of time series for a given metric containing 
     * series visualization parameters and empty data
     * @param seriesName series name
     * @param seriesProps data series properties
     * @param metricUnit unit of the metric
     * @param timeInterval series time interval
     * @param palette a pallette of colors to choose from
     * @param paletteShiftIndex starting index in the palette array of colors
     */
    private createEmptySeriesSet(
        seriesName: string,
        seriesProps: Array<ISeriesVisualizationProps>,
        metricUnit: MetricUnit,
        timeInterval: ITimeInterval,
        palette: string[],
        paletteShiftIndex: number
    ): StringMap<ChartSeriesData> {
        const GET_KUSTOCHART_HANDLEDAT: string = '@createEmptySeriesSet';

        if (!seriesName) {
            this.telemetry.logException(
                GET_KUSTOCHART_RESPONSE_EXCEPTION,
                GET_KUSTOCHART_HANDLEDAT,
                ErrorSeverity.Error,
                { reason: 'seriesName cannot be empty' },
                undefined
            );
        }

        if (!seriesProps || !seriesProps.length || (seriesProps.length <= 0)) {
            throw new Error('Parameter @seriesProps may not be null or empty');
        }

        if (!timeInterval) { throw new Error('Parameter @timeInterval may not be null or empty'); }

        if (!palette || !palette.length || (palette.length <= 0)) {
            throw new Error('Parameter @palette may not be null or empty');
        }

        let isoGrain: string = 'PT' + timeInterval.getGrainKusto().toUpperCase();

        const seriesMap = {};

        for (let i = 0; i < seriesProps.length; i++) {
            const props: ISeriesVisualizationProps = seriesProps[i];

            const series: ChartSeriesData = {
                metricUniqueId: props.metricId,
                metricResults: {
                    metricId: {
                        resourceDefinition: {
                            id: seriesName,
                            name: seriesName
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
                    resourceDisplayName: seriesName,
                    color: palette[(paletteShiftIndex + i) % palette.length],
                    unit: metricUnit,
                    displaySIUnit: true,
                    // TODO: would rather prefer .NoFill but chart starts
                    //       acting strange where there is lots of gaps
                    missingDataFillType: MissingDataFillingType.FillWithValueInThePath,
                }
            };

            seriesMap[props.metricId] = series;
        }

        return seriesMap;
    }

    /**
     * Transforms double dictionary (first by seriesName second by metric)
     * into a flat dictionary where key is "seriesName | metricId"
     * @param series double dictionary of metric data series
     * @returns single dictionary of metric data series
     */
    private flattenSeriesMap(series: StringMap<StringMap<ChartSeriesData>>): StringMap<ChartSeriesData> {
        const flatSeriesMap: StringMap<ChartSeriesData> = {};

        if (!series) { return flatSeriesMap; }

        for (const seriesName in series) {
            if (!series.hasOwnProperty(seriesName)) { continue; }

            const clusterSeries = series[seriesName];

            for (const seriesKey in clusterSeries) {
                if (!clusterSeries.hasOwnProperty(seriesKey)) { continue; }

                const individualSeries = clusterSeries[seriesKey];

                flatSeriesMap[seriesName + '|' + seriesKey] = individualSeries;
            }
        }

        return flatSeriesMap;
    }

    private getAggregationOption(optionId: string): AggregationOption {
        switch (optionId) {
            case 'P05': return AggregationOption.P05;
            case 'P10': return AggregationOption.P10;
            case 'P50': return AggregationOption.P50;
            case 'P90': return AggregationOption.P90;
            case 'P95': return AggregationOption.P95;
            case 'Max': return AggregationOption.Max;
            case 'Min': return AggregationOption.Min;
            case 'Avg': return AggregationOption.Avg;
            default: return null;
        }
    }

    private getTopNVisualizationProps(aggregation: string): Array<ISeriesVisualizationProps> {
        let visulizationProps = null;
        this.seriesProps.forEach(seriesProps => {
            if (seriesProps.metricId === aggregation) {
                visulizationProps = seriesProps;
            }
        });
        return [visulizationProps];
    }
}
