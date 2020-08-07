import { IAiChartInteractionsSeriesData, ChartSeriesData, AiTimeSeriesChart } from '@appinsights/aichartcore';

import { ITimeInterval } from './data-provider/TimeInterval';

export interface IChartTooltip {
    dispose(): void;
    setInteractionsData(
        interactionsData: IAiChartInteractionsSeriesData,
        selectedSeries: ChartSeriesData[],
        chartControl: AiTimeSeriesChart
    ): void;
    setPrimaryState(data: any, timeInterval: ITimeInterval): void;
    getBodyDivDefinition(): string;
}
