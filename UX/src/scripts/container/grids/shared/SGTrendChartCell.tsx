/**
 * tpl
 */
import * as React from 'react';
import { SGCellProps } from 'appinsights-iframe-shared';

/**
 * shared
 */
import { ContainerHostMetrics } from '../../shared/ContainerHostMetrics';
import { BarChart } from '../../../shared/BarChart';
import { ITimeInterval } from '../../../shared/data-provider/TimeInterval';
import { IMetricDescriptor, IMetric } from '../../../shared/MetricDescriptor';
import { ContainerMetricName } from '../../shared/ContainerMetricsStrings';
import { MetricValueFormatter } from '../../../shared/MetricValueFormatter';

export interface ITrendBarChartDataPoint {
    dateTimeUtc: Date,
    value: any
}

export interface IGridState {
    timeInterval: ITimeInterval,
    displayedMetricName: string
}

const getBarXPositionFraction = (dataPoint: ITrendBarChartDataPoint, gridState: IGridState): number => {
    if (!dataPoint) {
        throw new Error('Invalid data point provided to getBarXPositionFraction');
    }
    if (!gridState) {
        throw new Error('Invalid gridState provided to getBarXPositionFraction');
    }

    const dataPointTime: number = dataPoint.dateTimeUtc.valueOf();
    const startTime: number = gridState.timeInterval.getBestGranularStartDate().valueOf();
    const endTime: number = gridState.timeInterval.getBestGranularEndDate().valueOf();
    if (isNaN(dataPointTime) || isNaN(startTime) || isNaN(endTime)) {
        throw new Error('Internal calculations cannot be computed beacuse some or all inputs are not numbers');
    }

    const timeFromStart: number = dataPointTime - startTime;
    const timeInterval: number = endTime - startTime;
    if (isNaN(timeFromStart) || isNaN(timeInterval)) {
        throw new Error('Internal calculations cannot be computed beacuse some or all inputs are not numbers');
    }

    return timeFromStart / timeInterval;
}

const getBarWidthFraction = (dataPoint: ITrendBarChartDataPoint, gridState: IGridState): number => {
    const bucketCount: number = gridState.timeInterval.getBucketCount()
    if (isNaN(bucketCount)) {
        throw new Error('Invalid bucketCount');
    }

    return 1.0 / bucketCount;
}

const getBarHeightFraction = (dataPoint: ITrendBarChartDataPoint, gridState: IGridState) => {
    const hostMetric: IMetric = ContainerHostMetrics.get(gridState.displayedMetricName)
    if (hostMetric == null) {
        throw new Error('Invalid host metric');
    }

    const hostMetricDescriptor: IMetricDescriptor = hostMetric.descriptor;
    if (hostMetricDescriptor == null) {
        throw new Error('Invalid host metric descriptor');
    }

    let barHeightFraction: number = hostMetricDescriptor.getTrendBarHeightFraction(dataPoint.value.valueItem, dataPoint.value.maxValue);
    if (isNaN(barHeightFraction)) {
        throw new Error('Invalid bar height fraction')
    }
    
    return barHeightFraction;
}

const getBarColor = (dataPoint: ITrendBarChartDataPoint, gridState: IGridState) => {
    const hostMetric: IMetric = ContainerHostMetrics.get(gridState.displayedMetricName)
    if (hostMetric == null) {
        throw new Error('Invalid host metric');
    }

    const hostMetricDescriptor: IMetricDescriptor = hostMetric.descriptor;
    if (hostMetricDescriptor == null) {
        throw new Error('Invalid host metric descriptor');
    }

    const barColor: string = hostMetricDescriptor.getTrendBarColor(dataPoint.value.valueItem, dataPoint.value.maxValue);
    if (typeof barColor !== 'string') {
        throw new Error('Invalid barColor')
    }

    return barColor;
}

const getFormattedValue = (value: number, metricName: string) => {
    switch (metricName) {
        case ContainerMetricName.CpuCoreUtilization:
            return MetricValueFormatter.formatMillicoreValue(value, 0);
        case ContainerMetricName.MemoryWorkingSetBytes:
        case ContainerMetricName.MemoryRssBytes:
            return MetricValueFormatter.formatBytesValue(value);
        default:
            throw new Error('Invalid metric name received in tooltip bar');
    }
}

/**
 * A cell definition for a trend chart 
 * @param gridState the state of the grid in which this cell definition will be used
 */
export const SGTrendChartCell = (gridState: IGridState, sgColumnWidthPx: number): React.StatelessComponent<SGCellProps> => {
    return (props: SGCellProps) => {
        if (!props || !props.value) {
            return <div></div>;
        }

        const finalValue = props.value.value || props.value;
        return (
            <BarChart
                data={finalValue}
                getBarWidthFraction={(d) => getBarWidthFraction(d, gridState)}
                getBarHeightFraction={(d) => getBarHeightFraction(d, gridState)}
                getBarXPositionFraction={(d) => getBarXPositionFraction(d, gridState)}
                getBarColor={(d) => getBarColor(d, gridState)}
                getFormattedValue={(d) => { return getFormattedValue(d, gridState.displayedMetricName); }}
                svgWidthPx={sgColumnWidthPx}
            />
        );
    }
}

