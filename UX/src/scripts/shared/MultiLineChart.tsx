/**
 * Third party
 */
import * as React from 'react';
import * as $ from 'jquery';

import {
    Chart,
    ChartSeriesData,
    GUID,
    IChartVisualization,
    IAiChartInteractions,
    IAiChartInteractionsData,
    IAiChartInteractionsSeriesData,
    InteractionsStore,
    MetricSeriesAndSummary,
    UserDataStatus,
    UserDataStatusWithError,
    RefreshReason,
    AiTimeSeriesChart,
} from '@appinsights/aichartcore';

/**
 * Shared
 */
import { StringMap } from './StringMap'
import { ITimeInterval } from './data-provider/TimeInterval';
import { IChartTooltip } from './IChartTooltip';
import { EnvironmentConfig } from './EnvironmentConfig';

/**
 * Component properties
 */
interface IMultiLineChartProps {
    /** true if data is being loaded */
    isLoading: boolean;
    /** true if there was an error loading data */
    isError: boolean;
    /** optional custom error element to display on top of the chart*/
    customErrorElement?: JSX.Element;
    /** time series data */
    data: StringMap<ChartSeriesData>;
    /** visualized time interval */
    timeInterval: ITimeInterval;
    /** set of data series to be visualized*/
    selectedSeries: string[];
    /** chart visualization properties */
    visualization: IChartVisualization;
    /** data from chart interaction  */
    interactionStore: InteractionsStore;
    /** chart tooltip to display on hover */
    toolTipReactBody?: IChartTooltip;
    /** chart ariaLabelledbyId maps to chart h2 header */
    ariaLabelledById?: string;

    liveMode?: boolean;
    liveMetricsFeatureFlag?: boolean;
}

/**
 * Component state
 */
interface IMultiLineChartState {
}

/**
 * Component representing multiple line charts with ability to select which
 * series to display out of the set of available ones
 */
export class MultiLineChart extends React.Component<IMultiLineChartProps, IMultiLineChartState> {
    private id: string;
    private paneRoot: string;
    private chart: Chart;

    private hoverOnLastX: any;

    /**
     * Constructs instance of the component
     * @param props initial properties
     */
    constructor(props: any) {
        super(props);

        this.id = 'chart' + GUID();
        this.paneRoot = 'chartPaneRoot' + GUID();

        this.onResize = this.onResize.bind(this);
    }

    /**
     * Extracts visible chart series data out of all series
     * @param selectedSeries set of series ids to be visualized
     * @param allSeriesData all chart series data
     * @returns array of all series visualized according to selected series
     */
    private static getVisibleSeriesData(
        selectedSeries: string[],
        allSeriesData: StringMap<ChartSeriesData>
    ): ChartSeriesData[] {
        const result = new Array<ChartSeriesData>();

        if (!allSeriesData || !selectedSeries) { return result; }

        for (let series of selectedSeries) {
            if (allSeriesData[series] !== undefined) {
                result.push(allSeriesData[series])
            }
        }

        return result;
    }

    /**
     * Checks to see if chart data has at least a single data point to visualize
     * @param data chart data
     * @returns true if there is a single data point present in the data
     */
    private static hasData(data: StringMap<ChartSeriesData>): boolean {
        if (!data) { return false; }

        for (const series in data) {
            if (data.hasOwnProperty(series)) {
                let seriesData = data[series];

                if (seriesData && seriesData.metricResults && seriesData.metricResults.data) {
                    const seriesDataPoints = (seriesData.metricResults.data as MetricSeriesAndSummary[]);

                    if ((seriesDataPoints.length > 0) &&
                        (seriesDataPoints[0].dataPoints) &&
                        (seriesDataPoints[0].dataPoints.length > 0)) { return true; }
                }
            }
        }

        return false;
    }

    /**
     * React callback invoked immediately after a component is mounted (inserted into the tree)
     */
    public componentDidMount(): void {
        const interactionsWrapper = this.createInteractionsWrapper();

        this.chart = new Chart(
            this.id,
            undefined,
            undefined,
            this.props.visualization,
            interactionsWrapper);

        this.registerInteractions(this.chart);


        if (this.props.visualization && this.props.visualization.toolTip
            && this.props.visualization.toolTip.enabled && this.props.toolTipReactBody) {
            this.chart.changeToolTipBody(this.props.toolTipReactBody.getBodyDivDefinition());
        }

        this.updateChartState();
        this.chart.updateAccessiblityOptions({ ariaLabelledbyId: this.props.ariaLabelledById })

        window.addEventListener('resize', this.onResize);
    }

    /**
     * React callback invoked when a component is being removed from the DOM
     */
    public componentWillUnmount(): void {
        window.removeEventListener('resize', this.onResize);

        if (this.props.toolTipReactBody) {
            this.props.toolTipReactBody.dispose();
        }
    }

    /**
     * React callback invoked immediately after updating occurs. This method is not called for the initial render.
     */
    public componentDidUpdate(prevProps: Readonly<IMultiLineChartProps>): void {
        this.updateChartState();
    }

    /**
     * React callback to render component
     */
    public render(): JSX.Element {
        const customErrorPane = this.props.isError && this.props.customErrorElement ? this.props.customErrorElement : null;

        return (
            <div id={this.paneRoot} className='chart-plus-message'>
                <div id={this.id} className='chart-container' />
                {customErrorPane}
            </div>
        );
    }

    /**
     * Creates chart interations wrapper
     */
    private createInteractionsWrapper(): IAiChartInteractions {
        const { interactionStore } = this.props;

        if (!interactionStore) { return null; }

        const interactionWrapper: IAiChartInteractions = {
            OnHover: (data: IAiChartInteractionsData) => {
                interactionStore.Actions.OnHover(data);

                // TODO: bbax... HACK HACK to get live data working...
                const seriesInteractionData = data as IAiChartInteractionsSeriesData;
                if (!seriesInteractionData || !seriesInteractionData.x) {
                    return;
                }
                this.hoverOnLastX = { x: seriesInteractionData.x }
            },
            OnLeave: (data: IAiChartInteractionsData) => {
                interactionStore.Actions.OnLeave(data);

                // TODO: bbax... HACK HACK to get live data working...
                this.hoverOnLastX = null;
            },
            OnToolTipWillShowPoint: (interactionData: IAiChartInteractionsData) => {
                if (this.props.toolTipReactBody) {
                    const visibleSeriesData: ChartSeriesData[] = MultiLineChart.getVisibleSeriesData(
                        this.props.selectedSeries,
                        this.props.data
                    );
                    this.props.toolTipReactBody.setInteractionsData(
                        interactionData as IAiChartInteractionsSeriesData,
                        visibleSeriesData,
                        this.chart.chartControl as AiTimeSeriesChart
                    );
                }
            }
        };

        return interactionWrapper;
    }

    /**
     * Registers interactions
     * @param chart chart component
     */
    private registerInteractions(chart: Chart): void {
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

                    // TODO: bbax... HACK HACK to get live data working...
                    this.hoverOnLastX = { x: seriesInteractionData.x }
                }
            },

            OnLeave: (interactionsData: IAiChartInteractionsData) => {
                chart.clearSelection();

                // TODO: bbax... HACK HACK to get live data working...
                this.hoverOnLastX = null;
            },
        };

        this.props.interactionStore.Unregister(interactionsRegistration);
        this.props.interactionStore.Register(interactionsRegistration);
    }

    /**
     * Callback invoked when component size changes
     */
    private onResize() {
        this.updateChartState(RefreshReason.Resize);
    }

    /**
     * Updates chart state
     * @param reason reason for update
     */
    private updateChartState(reason?: RefreshReason): void {
        if (!this.chart) { return; }

        if (this.props.isLoading) {
            this.chart.showSpinner();
        } else {
            this.chart.hideSpinner();
        }

        if (this.props.toolTipReactBody) {
            this.props.toolTipReactBody.setPrimaryState(this.props.data, this.props.timeInterval);
        }

        let userDataStatus = UserDataStatus.HasData;

        // do not set any user data status (pretend we have data)
        // in case we have custom error message element to display
        if (!this.props.customErrorElement) {
            userDataStatus = this.props.isError
                ? UserDataStatus.ErrorRetrievingData
                : MultiLineChart.hasData(this.props.data) ? UserDataStatus.HasData : UserDataStatus.NoData;
        }

        const queryStatus: UserDataStatusWithError = { userDataStatus };

        const visibleSeriesData = MultiLineChart.getVisibleSeriesData(this.props.selectedSeries, this.props.data);

        const containerName = this.paneRoot;
        const containerWidth = $('#' + containerName).width();
        const containerSize = { width: containerWidth, height: 240 };
        this.props.visualization.containerSize = containerSize;
        this.chart.setVisualization(this.props.visualization);

        this.chart.updateData(
            {
                chartSeriesData: visibleSeriesData,
                userDataStatusWithError: queryStatus,
            },
            reason);

        // TODO: bbax... HACK HACK to get live data working...
        if (this.hoverOnLastX) {
            this.chart.hoverOn(this.hoverOnLastX.x, true);
        }

        if (this.props.timeInterval) {
            if (this.props.liveMetricsFeatureFlag && this.props.liveMode && EnvironmentConfig.Instance().isLiveDataEnabledEnvironment()) {
                (this.chart.chartControl as any)._viewPortTimeRange = {
                    startTime: this.props.timeInterval.getRealStart(),
                    endTime: this.props.timeInterval.getRealEnd()
                };
            } else {
                (this.chart.chartControl as any)._viewPortTimeRange = {
                    startTime: this.props.timeInterval.getBestGranularStartDate(),
                    endTime: this.props.timeInterval.getBestGranularEndDate(true)
                };
            }
        }
    }
}
