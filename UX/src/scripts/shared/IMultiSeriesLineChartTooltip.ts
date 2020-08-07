import { DateReferencableSeriesData } from './DateReferencableSeriesData';
import { ITimeInterval } from './data-provider/TimeInterval';
import { IAiChartInteractionsSeriesData } from '@appinsights/aichartcore';
import { AggregationOption } from './AggregationOption';

/**
 * Interface the MultiSeriesLineChart will use to render tooltips... implement this
 * contract to create your own tooltip for a given MELite chart and the chart will obey the rules
 * you define as part of setInteractionsData and setPrimaryState
 */
export interface IMultiSeriesLineChartTooltip {
    /**
     * called during unmount of the MultiSeriesLineChart... this is an opportunity to interact with unmounting in the primary react pipeline
     * @returns void
     */
    dispose(): void;

    /**
     * passthrough from MultiSeriesLineChart from MELite, each mouse movement from MELite will provide an update with potentially
     * new information regarding the X-axis we are moving around (at this time not much Y-axis information though)
     * @param interactionsData a copy of the interactions data object provided by MELite during Tooltip interactions (mouse movement)
     * @returns void
     */
    setInteractionsData(interactionsData: IAiChartInteractionsSeriesData): void;

    /**
     * called during chart update events... this is an opporuntity to adjust to aggregation changes, data changes, etc occuring
     * that cause the chart to re-render and look different (the chart state has changed underneath the tooltip)
     * @param data the data correspending to what the chart is currently displaying
     * @param timeInterval the time interval of the chart
     * @param visibleAggregations the currently visible aggregations on this chart
     * @returns void
     */
    setPrimaryState(data: DateReferencableSeriesData, timeInterval: ITimeInterval, visibleAggregations: AggregationOption[]): void;

    /**
     * given to MELite this defines what the div will look like that we insert the tooltip into
     * @returns void
     */
    getBodyDivDefinition(): string;
}
