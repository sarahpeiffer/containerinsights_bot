import * as React from 'react';
import * as $ from 'jquery';

import {
    Chart,
    ChartSeriesData,
    GUID,
    IAiChartInteractions,
    IAiChartInteractionsData,
    IAiChartInteractionsSeriesData,
    InteractionsStore,
    IChartVisualization,
    MetricSeriesAndSummary,
    UserDataStatus,
    UserDataStatusWithError,
    RefreshReason,
} from '@appinsights/aichartcore';

import { AggregationOption } from './AggregationOption';
import { StringMap } from './StringMap';

import { ITimeInterval } from './data-provider/TimeInterval';
import { IMultiSeriesLineChartTooltip } from './IMultiSeriesLineChartTooltip';

interface IMultiSeriesLineChartProps {
    isLoading: boolean,
    isError: boolean,
    data: any,
    timeInterval: ITimeInterval,
    selectedAggregationOptions: AggregationOption[],
    visualization: IChartVisualization,
    interactionStore: InteractionsStore,
    toolTipReactBody?: IMultiSeriesLineChartTooltip,
    /** chart ariaLabelledbyId maps to chart h2 header */
    ariaLabelledById?: string;
}

interface IMultiSeriesLineChartState {
}

export class MultiSeriesLineChart extends React.Component<IMultiSeriesLineChartProps, IMultiSeriesLineChartState> {
    private id: string;
    private chart: Chart;
    private paneRoot: string;
    private height: number;

    constructor(props: any) {
        super(props);

        this.id = 'chart' + GUID();
        this.paneRoot = 'chartPaneRoot' + GUID();
    }

    /**
     * From a list of visible aggregations and a list of all available data (hashed to match the visiblility names)
     * get a list of the MetricSeriesAndSummary objects already populated with all data to hand over to the chart
     * to render the errors stacked chart
     * @param selectedAggregationOptions aggregations that are currently visible
     * @param allSeriesData hash map of the data entries we can use for the visible aggregations
     * @returns MetricSeriesAndSummary[] list of data to populate the stack chart with
     */
    private static getVisibleErrorSeriesData(
        selectedAggregationOptions: AggregationOption[],
        allSeriesData: StringMap<MetricSeriesAndSummary>
    ): MetricSeriesAndSummary[] {
        let visibleSegments: MetricSeriesAndSummary[] = [];
        selectedAggregationOptions.forEach((option) => {
            const seriesOption = allSeriesData[option];
            if (seriesOption) {
                visibleSegments.push(allSeriesData[option]);
            } else {
                console.warn('missing data in errors chart visibility matrix');
            }
        });
        return visibleSegments;
    }

    private static getVisibleSeriesData(
        selectedAggregationOptions: AggregationOption[],
        allSeriesData: StringMap<ChartSeriesData>
    ): ChartSeriesData[] {
        const result = new Array<ChartSeriesData>();

        if (!allSeriesData) { return result; }

        selectedAggregationOptions.forEach((option) => {
            if (allSeriesData[option] !== undefined) {
                result.push(allSeriesData[option])
            }
        });

        return result;
    }

    private static hasData(data: any): boolean {
        if (!data) { return false; }

        if (data.rawChartSeries && data.rawChartSeries.metricUniqueId
            && data.rawChartSeries.metricUniqueId === 'errors') {

            return this.hasDataStacked(data.rawChartSeries);
        }

        // get average aggregation and assume if data present for that one,
        // data will be present for other aggregations
        const avgSeriesData = data[AggregationOption.Avg];

        if (avgSeriesData && avgSeriesData.metricResults && avgSeriesData.metricResults.data) {
            const avgSeriesDataPoints = (avgSeriesData.metricResults.data as MetricSeriesAndSummary[]);

            return (
                (avgSeriesDataPoints.length > 0) &&
                (avgSeriesDataPoints[0].dataPoints) &&
                (avgSeriesDataPoints[0].dataPoints.length > 0)
            );
        }

        return false;
    }

    // bbax: look through the stacked data, is there anything present?
    private static hasDataStacked(series: ChartSeriesData): boolean {
        if (series && series.metricResults && series.metricResults.data) {
            const seriesTest = series.metricResults.data as MetricSeriesAndSummary[];
            if (!seriesTest || seriesTest.length < 1) {
                return false;
            }

            let dataFound: boolean = false;
            seriesTest.forEach((item) => {
                if (item.dataPoints && item.dataPoints.length > 0) {
                    dataFound = true;
                }
            });
            return dataFound;
        }
        return false;
    }

    public componentDidMount(): void {
        if (this.props.visualization && this.props.visualization.toolTip && this.props.visualization.toolTip.enabled) {
            // bbax: dynamic body so the tooltip system doesn't destroy the body once established, react wouldn't like that
            this.props.visualization.toolTip.htmlParentD3SelectPath = '.chartRoot';
        }

        if (this.props.visualization.containerSize && this.props.visualization.containerSize.height > 0) {
            this.height = this.props.visualization.containerSize.height;
        }

        if (this.props.interactionStore) {
            const interactionWrapper: IAiChartInteractions = {
                OnHover: (interactionData: IAiChartInteractionsData) => {
                    if (this.props.interactionStore) {
                        this.props.interactionStore.Actions.OnHover(interactionData);
                    }
                },
                OnLeave: (interactionData: IAiChartInteractionsData) => {
                    if (this.props.interactionStore) {
                        this.props.interactionStore.Actions.OnLeave(interactionData);
                    }
                },
                OnToolTipWillShowPoint: (interactionData: IAiChartInteractionsData) => {
                    if (!this.props.toolTipReactBody) {
                        return;
                    }
                    this.props.toolTipReactBody.setInteractionsData(interactionData as IAiChartInteractionsSeriesData);
                },
            };


            this.chart = new Chart(this.id, undefined, undefined, this.props.visualization, interactionWrapper);
            this.registerFeedbackHooks(this.chart);

        } else {
            this.chart = new Chart(this.id, undefined, undefined, this.props.visualization);
        }


        if (this.props.visualization && this.props.visualization.toolTip && this.props.visualization.toolTip.enabled) {
            this.chart.changeToolTipBody(this.props.toolTipReactBody.getBodyDivDefinition());
        }
        this.updateChartState(this.props);
        this.chart.updateAccessiblityOptions({ ariaLabelledbyId: this.props.ariaLabelledById})
    }

    public componentWillMount(): void {
        window.addEventListener('resize', this.onResize.bind(this));
    }

    public componentWillUnmount(): void {
        window.removeEventListener('resize', this.onResize.bind(this));

        if (this.props.toolTipReactBody) {
            this.props.toolTipReactBody.dispose();
        }
    }

    public componentWillReceiveProps(nextProps: Readonly<IMultiSeriesLineChartProps>, nextContext: any): void {
        this.updateChartState(nextProps);
    }

    public render(): JSX.Element {
        return (
            <div id={this.paneRoot}>
                <div id={this.id} className='chart-container' />
            </div>
        );
    }

    private onResize() {
        this.updateChartState(this.props, RefreshReason.Auto);
    }

    private updateChartState(targetProps: IMultiSeriesLineChartProps, reason?: RefreshReason): void {
        if (!this.chart) { return; }

        if (targetProps.isLoading) {
            this.chart.showSpinner();
        } else {
            this.chart.hideSpinner();
        }

        const queryStatus: UserDataStatusWithError = {
            userDataStatus: targetProps.isError
                ? UserDataStatus.ErrorRetrievingData
                : MultiSeriesLineChart.hasData(targetProps.data) ? UserDataStatus.HasData : UserDataStatus.NoData
        };

        if (targetProps.toolTipReactBody) {
            targetProps.toolTipReactBody.setPrimaryState(targetProps.data, targetProps.timeInterval,
                targetProps.selectedAggregationOptions);
        }

        const containerName = this.paneRoot;
        const containerWidth = $('#' + containerName).width();
        const containerSize = { width: containerWidth, height: this.height };
        this.props.visualization.containerSize = containerSize;
        this.chart.setVisualization(this.props.visualization);

        if (targetProps.data &&
            targetProps.data.rawChartSeries &&
            targetProps.data.rawChartSegmentSeries &&
            targetProps.data.rawChartSeries.metricUniqueId &&
            targetProps.data.rawChartSeries.metricUniqueId === 'errors') {
            let seriesData: ChartSeriesData = targetProps.data.rawChartSeries;
            let seriesSegements: StringMap<MetricSeriesAndSummary> = targetProps.data.rawChartSegmentSeries;

            const result = new Array<ChartSeriesData>();

            const visibleSegements = MultiSeriesLineChart.getVisibleErrorSeriesData(
                targetProps.selectedAggregationOptions, seriesSegements
            );

            seriesData.metricResults.data = visibleSegements;

            result.push(seriesData);

            this.chart.updateData({
                chartSeriesData: result,
                userDataStatusWithError: queryStatus
            }, reason);

            if (this.props.timeInterval) {
                (this.chart.chartControl as any)._viewPortTimeRange = {
                    startTime: this.props.timeInterval.getBestGranularStartDate(),
                    endTime: this.props.timeInterval.getBestGranularEndDate(true)
                };
            }

        } else {
            if (!targetProps.selectedAggregationOptions) {
                throw 'invalid aggregation options state during chart rendering';
            }

            const visibleSeriesData = MultiSeriesLineChart.getVisibleSeriesData(
                targetProps.selectedAggregationOptions, targetProps.data);

            this.chart.updateData(
                {
                    chartSeriesData: visibleSeriesData,
                    userDataStatusWithError: queryStatus
                },
                reason);
            if (this.props.timeInterval) {
                (this.chart.chartControl as any)._viewPortTimeRange = {
                    startTime: this.props.timeInterval.getBestGranularStartDate(),
                    endTime: this.props.timeInterval.getBestGranularEndDate(true)
                };
            }
        }
    }

    private registerFeedbackHooks(chart: Chart) {
        if (!this.props || !this.props.interactionStore || !chart || !chart.chartControl) {
            return;
        }

        const interactionsRegistration = {
            id: chart.chartControl.getUniqueId(),
            OnHover: (interactionsData: IAiChartInteractionsData) => {
                if (interactionsData) {
                    const seriesInteractionData = interactionsData as IAiChartInteractionsSeriesData;
                    if (!seriesInteractionData || !seriesInteractionData.x) {
                        return;
                    }
                    chart.hoverOn(seriesInteractionData.x, true);
                }
            },

            OnLeave: (interactionsData: IAiChartInteractionsData) => {
                chart.clearSelection();
            },
        };

        this.props.interactionStore.Unregister(interactionsRegistration);
        this.props.interactionStore.Register(interactionsRegistration);
    }
}
