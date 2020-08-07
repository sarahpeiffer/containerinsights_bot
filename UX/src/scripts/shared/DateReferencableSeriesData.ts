import {  ChartSeriesData, MetricSeriesAndSummary } from '@appinsights/aichartcore';
import * as ToolTipBody from '../storage/StorageChartPaneToolTipBody';
import { StringMap } from './StringMap';

export class DateReferencableSeriesData {
    rawChartSeries: ChartSeriesData;
    rawChartSegmentSeries: StringMap<MetricSeriesAndSummary>;
    referencableData: StringMap<StringMap<ToolTipBody.ErrorDataComplete>>;
}
