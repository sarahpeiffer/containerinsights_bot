/**
 * 3rd party
 */
import * as React from 'react';
import * as moment from 'moment';
import { ChartSeriesData, InteractionsStore } from '@appinsights/aichartcore';

/**
 * shared
//  */
import { MultiLineChart } from '../shared/MultiLineChart';
import { StringHelpers } from '../shared/Utilities/StringHelpers';
import { TimeInterval, ITimeInterval } from '../shared/data-provider/TimeInterval';
import { ILiveDataPoint } from '../shared/data-provider/KubernetesResponseInterpreter';
import { TelemetrySubArea, ITelemetry, TelemetryMainArea } from '../shared/Telemetry';
import { TelemetryFactory } from '../shared/TelemetryFactory';
import { EnvironmentConfig } from '../shared/EnvironmentConfig';
import { ErrorSeverity } from '../shared/data-provider/TelemetryErrorSeverity';
import { MetricSeriesSelector } from '../shared/MetricSeriesSelector';
import { ISeriesSelectorOption } from '../shared/ISeriesSelectorOption';
import { DisplayStrings } from '../shared/DisplayStrings';

/**
 * local
 */
import { ContainerMetricChartId, ContainerMetricChart, IContainerMetricChartDescriptor } from './ContainerMetricChart';
import { LiveMetricsChartResponseInterpreter } from './data-provider/LiveMetricsChartResponseInterpreter';
import { LiveMetricsPoller, LiveMetricsGranularity, LiveMetricsGranularityStrings } from './LiveMetricsPoller';
/**
 * Styles
 */
import '../../styles/shared/ChartPane.less';
import '../../styles/shared/ChartHeader.less';
import { BladeContext } from './BladeContext';
import { LiveDataProvider } from '../shared/data-provider/LiveDataProvider';

const troubleshootURL: string = 'https://docs.microsoft.com/en-us/azure/azure-monitor/insights/container-insights-live-logs';
/**
 * Component state
 */
interface IContainerLivePaneState {
    /** true if data for the pane is being loaded */
    isLoading: boolean;
    /** true if data loading failed */
    isError: boolean;
    /** time interval for data window */
    timeInterval: ITimeInterval;
}

/**
 * Component props
 */
interface IContainerLivePaneProps {
    /** granularity for query frequency */
    granularity: LiveMetricsGranularity;

    /** name space */
    nameSpace: string;

    /** pod's name */
    podName: string;

    /** selections specifying which series to display out of all available in chart data */
    seriesSelections: StringMap<any>;

    /** data for the charts organized by chart id / series id */
    chartData: StringMap<StringMap<ChartSeriesData>>;

    /** region override for Kube API Proxy */
    liveDataProvider: LiveDataProvider;

    /** callback to onvoke when selections are changed */
    onSeriesSelectionsChanged: (chartId: string, newSelections: any) => void;

    /** callback to onvoke when selections are changed */
    onChartDataLoaded: (chartData: StringMap<StringMap<ChartSeriesData>>) => void;
}

/**
 * Visual component displaying pod-level infromation
 */
export class ContainerLiveTabMetricChartPane extends React.Component<IContainerLivePaneProps, IContainerLivePaneState> {

    /** telemetry provider */
    private telemetry: ITelemetry;

    /** get live metrics poller*/
    private liveMetricsPoller: LiveMetricsPoller;

    /** chart interation store */
    private interactionStore: InteractionsStore;

    /** active the live tab metrics */
    private isLiveTabMetrics: boolean;

    /** active the live tab cluster name */
    private clusterName: string;

    /**
     * Component constructor
     * @param props initial set of properties
     */
    constructor(props: IContainerLivePaneProps) {
        super(props);
        this.onToggleChartSeriesOption = this.onToggleChartSeriesOption.bind(this);
        this.updateLiveData = this.updateLiveData.bind(this);

        this.state = {
            isLoading: true,
            isError: false,
            timeInterval: this.getRange(5 * 60)
        };

        this.liveMetricsPoller = new LiveMetricsPoller(
            this.updateLiveData,
            props.liveDataProvider,
            props.nameSpace,
            props.podName,
        );
        this.interactionStore = new InteractionsStore(undefined);
        this.isLiveTabMetrics = true;
        this.clusterName = BladeContext.instance().cluster.givenName;
    }

    /**
     * React callback after component was mounted into DOM
     */
    public componentDidMount(): void {
        try {
            this.liveMetricsPoller.start(this.props.granularity);
        } catch (exc) {
            if (!this.telemetry) {
                this.telemetry.logException(exc, 'PodLivePane liveMetricsPoller start error', ErrorSeverity.Error, null, null);
            }
        }
    }

    /**
     * React callback before component unmounts from DOM
     */
    public componentWillUnmount() {
        // ensure navigating away from this panel will stop polling
        try {
            this.liveMetricsPoller.stop(undefined);
        } catch (exc) {
            if (!this.telemetry) {
                this.telemetry.logException(exc, 'PodLivePane liveMetricsPoller stop error', ErrorSeverity.Error, null, null);
            }
        }
    }

    /**
     * React callback after component was updated
     * @param prevProps previous component props
     * @param prevState previous component state
     */
    public componentDidUpdate(
        prevProps: Readonly<IContainerLivePaneProps>,
        prevState: Readonly<IContainerLivePaneState>
    ): void {
        if (prevProps.granularity !== this.props.granularity) {
            this.liveMetricsPoller.restart(this.props.granularity);
        }
    }

    /**
     * Renders component
     * @returns {JSX.Element} component visual
     */
    public render(): JSX.Element {
        try {
            if (EnvironmentConfig.Instance().isConfigured()) {
                if (!this.telemetry) {
                    this.telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
                    this.telemetry.setContext({ subArea: TelemetrySubArea.PodCharts }, false);
                    this.telemetry.logPageView(TelemetrySubArea.PodCharts.toString());
                }
            }
            const grainDisplayName = this.getGrainDisplayName();

            const charts = new Array<JSX.Element>();

            let chartDescriptorList = ContainerMetricChart.listLive() || [];
            for (const chartDescriptor of chartDescriptorList) {
                const chartElement = this.renderChart(chartDescriptor,
                    this.getSeriesSelector(chartDescriptor),
                    grainDisplayName);
                charts.push(chartElement);
            }

            return (
                <div className='chart-pane liveMetrics'>
                    <div className='chartpane-root chart-paneroot-override liveMetricsChartAlign'>{charts}</div>
                </div>
            );
        } catch (exc) {
            this.telemetry.logException(exc, 'PodLivePane', ErrorSeverity.Error, null, null);
            return <div className='chart-pane' />;
        }
    }

    /**
     * received live data during the timeInterval
     * @param err err may have
     * @param data live metrics data
     * @param timeInterval 
     */
    private updateLiveData(
        err: any,
        data: ILiveDataPoint[] | undefined,
        timeInterval: TimeInterval | undefined
    ): void {
        if (err) {
            this.telemetry.logException(err, 'ContainerLiveTabMetricChartPane.updateLiveData', ErrorSeverity.Error, null, null);
            this.setState({ isError: true });
            return;
        }
        this.loadData(data, timeInterval);
    }

    /**
     * Renders chart with header and series selector
     * @param chartDescriptor chart descriptor
     * @param seriesSelector series selector component
     * @param grainDisplayName granularity display name
     */
    private renderChart(
        chartDescriptor: IContainerMetricChartDescriptor,
        seriesSelector: JSX.Element,
        grainDisplayName: string
    ): JSX.Element {
        if (!chartDescriptor) { return null; }

        const customErrorPane: JSX.Element = this.renderErrorPane();
        const chartAriaHeaderID: string = 'chartHeaderAriaLabel' + chartDescriptor.chartId;
        return (
            <div className='liveMetricsChart'>
                <div className='chart-header'>
                    <div aria-label={chartDescriptor.chartDisplayName}
                        title={chartDescriptor.chartDisplayName}
                        id={chartAriaHeaderID}
                        className='chart-header-text'>
                        <h2>{chartDescriptor.chartDisplayName}</h2>
                        {grainDisplayName ? <div className='subTitle'>{grainDisplayName}</div> : <div className='subTitle'>&nbsp;</div>}
                    </div>
                    {seriesSelector}
                </div>
                <MultiLineChart
                    timeInterval={this.state.timeInterval}
                    isLoading={this.state.isLoading}
                    isError={customErrorPane !== null}
                    customErrorElement={customErrorPane}
                    data={this.props.chartData[chartDescriptor.chartId]}
                    selectedSeries={this.getPerformanceMetricSelectedSeries(
                        this.props.chartData[chartDescriptor.chartId],
                        this.props.seriesSelections[chartDescriptor.chartId])}
                    visualization={chartDescriptor.visualization}
                    interactionStore={this.interactionStore}
                    ariaLabelledById={chartAriaHeaderID}
                    liveMode={this.isLiveTabMetrics}
                    liveMetricsFeatureFlag={this.isLiveTabMetrics}
                />
            </div>
        );
    }

    /**
     * Calculates which series will be selected on a chart of cluster performance metric
     * @param chartData chart series data
     * @param seriesSelections selections made by the user via series selections control
     */
    private getPerformanceMetricSelectedSeries(
        chartData: StringMap<ChartSeriesData>,
        seriesSelections: any
    ): string[] {
        const seriesOptions = seriesSelections as ISeriesSelectorOption[];
        if (!chartData ||
            !seriesSelections ||
            !seriesOptions.length ||
            (seriesOptions.length <= 0)
        ) { return null; }

        const selectedSeries = new Array<string>();

        for (let availableSeries in chartData) {
            if (chartData.hasOwnProperty(availableSeries)) {
                for (let i = 0; i < seriesOptions.length; i++) {
                    if (seriesOptions[i].isSelected &&
                        (availableSeries.indexOf('|' + seriesOptions[i].id) > 0)) {
                        selectedSeries.push(availableSeries);
                    }
                }
            }
        }

        return selectedSeries;
    }

    /**
     * Creates chart data series selection control
     * @param chartDescriptor chart descriptor
     */
    private getSeriesSelector(chartDescriptor: IContainerMetricChartDescriptor) {
        if (!chartDescriptor) { throw new Error('Parameter @chartDescriptor may not be null'); }

        return (
            <MetricSeriesSelector
                selectorId={chartDescriptor.chartId}
                seriesOptions={this.props.seriesSelections[chartDescriptor.chartId]}
                onToggleOption={this.onToggleChartSeriesOption}
            />
        );
    }

    /**
     * Callback invoked when series selection is changed for cluster performance metric
     * @param chartId chart/metric id
     * @param optionId option id to toggle
     */
    private onToggleChartSeriesOption(chartId: string, optionId: string): void {
        const initialSelections = this.props.seriesSelections[chartId] as ISeriesSelectorOption[];
        if (!initialSelections) { return; }
        // pod's CPU and Memory usage cannot be hidden
        if (optionId === DisplayStrings.OptionAll) { return; }

        const resultingSelections = new Array<ISeriesSelectorOption>();

        for (let option of initialSelections) {
            const resultingOption: ISeriesSelectorOption = {
                id: option.id,
                displayName: option.displayName,
                isSelected: optionId === option.id ? !option.isSelected : option.isSelected
            };
            resultingSelections.push(resultingOption);
        }
        this.props.onSeriesSelectionsChanged(chartId, resultingSelections);
    }

    /**
     * populate the charts from the data returned
     * @param data data we want to populate the chart with
     * @param timeInterval interval time for loadData
     */
    private loadData(data: any[], timeInterval: TimeInterval): void {
        if (!data || !data.length) { throw new Error('Parameter @results has invalid value'); }
        if (!timeInterval) { throw new Error('Parameter @timeInterval may not be null or undefined'); }

        const chartData = {};

        let liveMetricsChartResponseInterpreter: LiveMetricsChartResponseInterpreter = null;

        liveMetricsChartResponseInterpreter = LiveMetricsChartResponseInterpreter.Instance() as LiveMetricsChartResponseInterpreter;

        chartData[ContainerMetricChartId.Cpu] =
            liveMetricsChartResponseInterpreter.getPodPerformanceChartData(
                data,
                ContainerMetricChartId.Cpu,
                timeInterval,
                this.clusterName);

        chartData[ContainerMetricChartId.Memory] =
            liveMetricsChartResponseInterpreter.getPodPerformanceChartData(
                data,
                ContainerMetricChartId.Memory,
                timeInterval,
                this.clusterName);

        this.props.onChartDataLoaded(chartData);

        this.setState({ isLoading: false, isError: false, timeInterval });
    }
    /**
     * Provides title to display chart granularity
     */
    private getGrainDisplayName(): string {
        let grainDisplayName: string = '';
        if (this.state.timeInterval) {
            let translatedTime: string = LiveMetricsGranularityStrings[this.props.granularity];
            if (translatedTime) {
                grainDisplayName = StringHelpers.replaceAll(DisplayStrings.AggregateGranularitySubtitle, '{0}', translatedTime);
            }
        }
        return grainDisplayName;
    }

    /**
     * Renders error message over charts.
     * TODO: Add arbitrary message rendering functionality to ai charts and remove this
     */
    private renderErrorPane(): JSX.Element {
        if (this.state.isLoading) { return null; }

        let errorMessage: string = null;
        let className: string = null;

        if (this.state.isError) {
            errorMessage = DisplayStrings.DataRetrievalError;
            className = 'chart-message-panel error-msg';
        } else if (!this.hasChartData()) {
            errorMessage = DisplayStrings.NoDataMsg;
            className = 'chart-message-panel nodata-msg';
        }

        if (!errorMessage) { return null; }

        return (
            <div className={className}>
                <span>{errorMessage}</span>
                <a className='troubleshooting-link' 
                    href= {troubleshootURL} 
                    target='_blank' tabIndex={0}>
                    {DisplayStrings.ContainerTroubleshootingLinkText}
                </a>
            </div>
        );
    }
    /**
     * Checks if there is data to be displayed in any of the charts
     * @returns {boolean} true if charts have at least one time series to be displayed
     */
    private hasChartData(): boolean {
        let nonEmptyTimeSeriesCount: number = 0;

        if (this.props.chartData) {
            // is chart data really not empty?
            for (const metricName in this.props.chartData) {
                if (this.props.chartData.hasOwnProperty(metricName)) {
                    const metricChartData = this.props.chartData[metricName];

                    for (const seriesName in metricChartData) {
                        if (metricChartData.hasOwnProperty(seriesName)) {
                            nonEmptyTimeSeriesCount++;
                        }
                    }
                }
            }
        }
        return (nonEmptyTimeSeriesCount > 0);
    }
    /**
     * get a time interval in seconds
     * @param seconds 
     */
    private getRange(seconds: number): TimeInterval {
        const end = moment().set({ millisecond: 0 }).toDate();
        const start = moment(end).subtract(seconds, 'seconds').toDate();
        return new TimeInterval(start, end, 100);
    }
}
