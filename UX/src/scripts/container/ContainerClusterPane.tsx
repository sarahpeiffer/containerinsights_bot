/**
 * 3rd party
 */
import * as React from 'react';
import { Promise } from 'es6-promise';
import { ChartSeriesData, InteractionsStore, GUID } from '@appinsights/aichartcore';

/**
 * shared
 */
import { TimeInterval, ITimeInterval } from '../shared/data-provider/TimeInterval';
import { DisplayStrings, KustoGrainDisplay } from '../shared/DisplayStrings';
import { StringHelpers } from '../shared/Utilities/StringHelpers';
import { MessagingProvider } from '../shared/MessagingProvider';
import { TelemetrySubArea, ITelemetry, TelemetryMainArea } from '../shared/Telemetry';
import { TelemetryFactory } from '../shared/TelemetryFactory';

import * as Constants from './shared/Constants';
import { ICommonContainerTabProps } from './shared/ICommonContainerTabProps';

import { MultiLineChart } from '../shared/MultiLineChart';
import { MetricSeriesSelector } from '../shared/MetricSeriesSelector';
import { ISeriesSelectorOption } from '../shared/ISeriesSelectorOption';
import { ErrorSeverity } from '../shared/data-provider/TelemetryErrorSeverity';
import { HttpRequestError } from '../shared/data-provider/HttpRequestError';
import { EnvironmentConfig } from '../shared/EnvironmentConfig';
import { PinSVG } from '../shared/svg/pin';
import { KeyCodes } from '../shared/KeyCodes';
import { ILiveDataPoint } from '../shared/data-provider/KubernetesResponseInterpreter';

/**
 * local
 */
import { ContainerMetricChartId, ContainerMetricChart, IContainerMetricChartDescriptor } from './ContainerMetricChart';
import { ContainerGridBase } from './grids/shared/ContainerGridBase';
import { ChartDataProvider, ChartDataProviderFactory, QueryAvenue, ChartQueryTelemetryEventName } from './data-provider/ChartDataProvider';
import { ChartResponseInterpreter } from './data-provider/ChartResponseInterpreter';
import { IContainerInsightsPreloadState } from './IContainerInsightsPreloadState';
import { ContainerGlobals } from './ContainerGlobals';
import { BladeLoadManager, QueryName } from './messaging/BladeLoadManager';
import { LoadTrackingTerminationReason } from './messaging/IBladeLoadManager';
import { LiveMetricsPoller, LiveMetricsGranularity, LiveMetricsGranularityStrings } from './LiveMetricsPoller';

/**
 * Styles
 */
import '../../styles/shared/ChartPane.less';
import '../../styles/shared/ChartHeader.less';
import '../../styles/shared/SeriesSelector.less';
import { MdmChartResponseInterpreter } from './data-provider/MdmChartResponseInterpreter';
import { KustoChartResponseInterpreter } from './data-provider/KustoChartResponseInterpreter';
import { LiveMetricsChartResponseInterpreter } from './data-provider/LiveMetricsChartResponseInterpreter';
import { BladeContext } from './BladeContext';
import { ContainerMainPageViewModel } from './main-page/viewmodels/ContainerMainPageViewModel';
import { FailureView } from './error-state/FailureView';
import { LiveDataProvider } from '../shared/data-provider/LiveDataProvider';

enum ResponseType {
    Mdm,
    Kusto,
    LiveMetric
}

/**
 * Component properties
 */
interface IContainerClusterPaneProps extends ICommonContainerTabProps {

    loggingInfo: any;

    liveMetricsFeatureFlag: boolean;

    mainPageContext: ContainerMainPageViewModel;

    liveMetricsGranularity: LiveMetricsGranularity;

    /** region override for Kube API Proxy */
    // kubernetesProxyRegionCode: string;

    /** data for the charts organized by chart id / series id */
    chartData: StringMap<StringMap<ChartSeriesData>>;

    /** selections specifying which series to display out of all available in chart data */
    seriesSelections: StringMap<any>;

    /** callback to invoke when chart data is loaded from the store */
    onChartDataLoaded: (chartData: StringMap<StringMap<ChartSeriesData>>) => void;

    /** callback to invoke when selections are changed */
    onSeriesSelectionsChanged: (chartId: string, newSelections: any) => void;

    /** Messaging provider to communicate to hosting blade */
    messagingProvider: MessagingProvider;

    /** callback to invoke when the tab content loading status changes */
    onTabContentLoadingStatusChange: (isLoading: boolean) => void;

    /** callback to invoke when the tab content data load results in an error */
    onTabContentDataLoadError: (error: any) => void;

    /** true if preload script completed */
    preloadCompleted: boolean;

    /** if live metrics should be displayed instead of historical data */
    // seeLiveMetrics: boolean;

    // onToggleLiveMetrics: (value: boolean) => void;

    /** preload state */
    preloadState: IContainerInsightsPreloadState;

    /** true indicates enable pin chart to dashboard */
    enablePinChartToDashboard: boolean;

    liveDataProvider: LiveDataProvider;

    isLiveDataInterfaceVisible: boolean;

    /** callback to invoke pinToDashboard*/
    pinChartToDashboard(chartId: string, showOptionPicker: boolean): void;
}

/**
 * Component state
 */
interface IContainerClusterPaneState {
    /** true if data for the pane is being loaded */
    isLoading: boolean;

    /** true if data loading failed */
    isError: boolean;

    /** true to indicate the UI requires a kusto reload during the next interaction */
    isKustoReloadRequired: boolean;

    /** time interval for which the data is being displayed */
    timeInterval: ITimeInterval;

    isLiveDataBackendRunning: boolean;
}

/**
 * Visual component displaying cluster-level infromation
*/
export class ContainerClusterPane extends React.Component<IContainerClusterPaneProps, IContainerClusterPaneState> {
    /** data provider */
    private dataProvider: ChartDataProvider;

    /** tracks sequence number of the last query issued to data store */
    private pendingQuerySequenceNumber: number = 0;

    /** chart interation store */
    private interactionStore: InteractionsStore;

    /** telemetry provider */
    private telemetry: ITelemetry;

    /** data provider query avenue Arm vs. Draft for A/B testing */
    private queryAvenue: QueryAvenue;

    private liveMetricsPoller: LiveMetricsPoller;

    /**
     * Component constructor
     * @param props initial set of properties
     */
    constructor(props: IContainerClusterPaneProps) {
        super(props);

        this.state = {
            isLoading: true,
            isError: false,
            timeInterval: null,
            isKustoReloadRequired: false,
            isLiveDataBackendRunning: false
        };

        this.interactionStore = new InteractionsStore(null);

        // set up data provider. go all ARM
        this.queryAvenue = Math.random() < 2.0 ? QueryAvenue.Arm : QueryAvenue.Draft;

        const kustoDataProvider = ChartDataProviderFactory.CreateKustoDataProvider(this.queryAvenue);
        this.dataProvider = new ChartDataProvider(kustoDataProvider, ChartDataProviderFactory.CreateArmDataProvider());

        ContainerGridBase.createDataProvider();

        this.onToggleChartSeriesOption = this.onToggleChartSeriesOption.bind(this);
        this.onReceiveLiveData = this.onReceiveLiveData.bind(this);

        this.props.mainPageContext.handleEventTrigger('RefreshButton', this.onRefreshButton.bind(this));

        if (this.props.liveMetricsFeatureFlag && EnvironmentConfig.Instance().isLiveDataEnabledEnvironment()) {
            this.liveMetricsPoller = new LiveMetricsPoller(
                this.onReceiveLiveData,
                props.liveDataProvider,
            );
        }
    }

    /**
     * React callback after component was mounted into DOM
     */
    public componentDidMount(): void {  
        if (ContainerGlobals.preloadStatePreviouslyProcessed === true) {
            // initiate backend query in case we're mounting not the first time
            this.queryChartsData(this.props);
        } else if (this.props.preloadCompleted === true) {
            // start preload result check in case preload completed before first mount
            this.onPreloadCompleted();
        } 
    }

    /**
     * React callback before component unmounts from DOM
     */
    public componentWillUnmount() {
        if (this.state.isLiveDataBackendRunning) {
            this.liveMetricsPoller.stop(undefined);
        }
    }

    /**
     * React callback after component was updated
     * @param prevProps previous component props
     * @param prevState previous component state
     */
    public componentDidUpdate(
        prevProps: Readonly<IContainerClusterPaneProps>,
        prevState: Readonly<IContainerClusterPaneState>
    ): void {
        // use preload if this is the first time mounting and preload completed
        if (prevProps.preloadCompleted === false && (this.props.preloadCompleted === true)) {
            this.onPreloadCompleted();
        } else if (this.needRequeryChartsData(prevProps)) {
            // bbax: NOTE Live toggle on and off does NOT utilize this area; containermainpage references this
            // pane and invokes toggleLiveFeature directly, to keep things clear I made that code handle all toggle
            this.queryChartsData(this.props);
        }
    }

    public changeLiveFeatureGrain(newGrain) {
        this.setState({}, () => {
            if (!this.state.isLiveDataBackendRunning) { return; }
            this.liveMetricsPoller.restart(newGrain);
        });
    }

    public toggleLiveFeature(systemState: boolean) {
        this.setState({ isLiveDataBackendRunning: systemState }, () => {
            if (this.props.liveMetricsFeatureFlag && EnvironmentConfig.Instance().isLiveDataEnabledEnvironment()) {
                if (systemState) {
                    this.liveMetricsPoller.start(this.props.liveMetricsGranularity);
                } else {
                    this.liveMetricsPoller.stop(undefined);
                    this.queryChartsData(this.props);
                }
            }
        });
    }

    /**
     * Renders component
     * @returns {JSX.Element} component visual
     */
    public render(): JSX.Element {
        try {
            if (this.state.isError && this.props.isLiveDataInterfaceVisible) {
                return this.renderLiveMetricsError();
            }

            if (EnvironmentConfig.Instance().isConfigured()) {
                if (!this.telemetry) {
                    this.telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
                    this.telemetry.setContext({ subArea: TelemetrySubArea.ContainerCharts }, false);
                    this.telemetry.logPageView(TelemetrySubArea.ContainerCharts.toString());
                }
            }

            const grainDisplayName = this.getGrainDisplayName();

            const charts = new Array<JSX.Element>();

            let chartDescriptorList = ContainerMetricChart.list() || [];

            for (const chartDescriptor of chartDescriptorList) {
                const chartElement = this.renderChart(
                    chartDescriptor,
                    this.getSeriesSelector(chartDescriptor),
                    grainDisplayName);

                charts.push(chartElement);
            }

            return (
                <div className='chart-pane'>
                    <div className='chartpane-root chart-paneroot-override'>
                        {charts}
                    </div>
                </div>
            );

        } catch (exc) {
            this.telemetry.logException(exc, 'ContainerClusterPane', ErrorSeverity.Error, null, null);
            return (
                <div className='chart-pane'>
                </div>
            );
        }
    }

    private onRefreshButton() {
        this.props.mainPageContext.clearError();
        this.setState({ isError: false }, () => {
            if (this.liveMetricsPoller === null) { return; }
            if (!this.props.isLiveDataInterfaceVisible) { return; }
            if (this.state.isLiveDataBackendRunning) {
                // bbax: should we even do this?? maybe we should disable the refresh button?
                this.liveMetricsPoller.restart(this.props.liveMetricsGranularity);
            } else {
                this.liveMetricsPoller.start(this.props.liveMetricsGranularity);
            }
        });
    }

    private renderLiveMetricsError() {
        return <FailureView parentContext={this.props.mainPageContext} />
    }

    private onReceiveLiveData(
        err: any,
        data: ILiveDataPoint[] | undefined,
        timeInterval: TimeInterval | undefined
    ): void {
        if (this.props.liveMetricsFeatureFlag && EnvironmentConfig.Instance().isLiveDataEnabledEnvironment()) {
            if (err) {
                this.props.mainPageContext.raiseError(err,
                    JSON.stringify(['/api/v1/nodes', '/apis/metrics.k8s.io/v1beta1/nodes', '/api/v1/pods']));

                this.setState({ isError: true, });
                this.telemetry.logException(err, 'ContainerClusterPane', ErrorSeverity.Error, null, null);
            } else {
                this.props.mainPageContext.clearError();

                // load this data into chart
                this.setState({ isLoading: true });
                this.loadData(data, timeInterval, ResponseType.LiveMetric);
                this.setState({ timeInterval });
            }
        }
    }

    /**
     * Callback invoked when preload script is completed
     */
    private onPreloadCompleted(): void {
        console.log('PRELOAD MAIN SCRIPT::Processing preload results...');

        const {
            preloadPossible,
            preloadSucceeded,
            preloadQueryResponses,
            timeInterval,
            preloadError
        } = this.props.preloadState;

        BladeLoadManager.Instance().setPerformanceMeasure('frame_processPreloadResult');

        if (preloadPossible === false) {
            // check to see if cluster is onboarded to insights (workspace present)
            if (!this.props.workspace) {
                throw new Error('Cluster not onboarded. Cluster Pane (charts) cannot be mounted.');
            }

            // start the query
            console.log('PRELOAD MAIN SCRIPT::Preload was not possible. Triggering frame query.');
            this.queryChartsData(this.props);

            return;
        }

        if (preloadSucceeded === true) {
            console.log(`PRELOAD MAIN SCRIPT::Data found... loading`);
            this.loadData(
                preloadQueryResponses,
                timeInterval,
                this.props.preloadState.isLoadedFromMdm ? ResponseType.Mdm : ResponseType.Kusto,
            );

        } else {
            console.warn(`PRELOAD MAIN SCRIPT::FAILED TO LOAD DATA`);
            this.processQueryError(preloadError, this.props.workspace.id);
        }

        // log telemetry for pre-load script
        this.reportPreloadTelemetry();

        // record the fact that preload result processing was completed
        ContainerGlobals.preloadStatePreviouslyProcessed = true;
    }

    /**
     * Reports telemetry for queies executed during pre-load phase
     */
    private reportPreloadTelemetry(): void {
        if (!this.props.preloadState) { return; }

        // log telemetry for preload session
        const {
            sessionTelemetry,
            timeInterval,
            queryTelemetry,
            queryAvenue,
            mdmExceptions
        } = this.props.preloadState;

        if (mdmExceptions && mdmExceptions.length && mdmExceptions.length > 0) {
            console.log(`ContainerClusterPane::Logging ${mdmExceptions.length} exceptions from mdm`);
            mdmExceptions.forEach((exc) => {
                this.telemetry.logException(exc, 'PreloadQueryManager::Unknown', ErrorSeverity.Error, null, null);
            });
        }

        // note: telemetry context supplies other props
        // such as workspace id & name, cluster id, name, etc.
        const commonEventProps: any = {
            isPreload: 'true',
            isLoadedFromMdm: this.props.preloadState.isLoadedFromMdm,
            isMdmSlower: this.props.preloadState.isMdmSlower,
            isTimeRelative: true, // note: preload always relative
            startDateTimeUtc: timeInterval ? timeInterval.getRealStart().toISOString() : null,
            endDateTimeUtc: timeInterval ? timeInterval.getRealEnd().toISOString() : null,
            sessionId: sessionTelemetry ? sessionTelemetry.sessionId : '<unknown>',
        };

        if (sessionTelemetry) {
            const eventProps: any = { ...commonEventProps };
            eventProps.queryAvenue = queryAvenue;

            if (sessionTelemetry.isError) {
                eventProps.isError = true;
            }

            this.telemetry.logEvent(ChartQueryTelemetryEventName.AllKusto, eventProps, { duration: sessionTelemetry.durationMs });
        }

        // log telemetry for the individual preload queries
        if (queryTelemetry) {
            for (const queryId in queryTelemetry) {
                if (queryTelemetry.hasOwnProperty(queryId)) {
                    const query = queryTelemetry[queryId];

                    let eventProps: any = { requestId: query.requestId, ...commonEventProps };
                    eventProps.querAvenue = query.queryAvenue;

                    if (query.isError) {
                        this.telemetry.logException(
                            query.error,
                            'ContainerPreloadManager.ts',
                            ErrorSeverity.Error,
                            eventProps,
                            undefined
                        );
                    }

                    if (query.isError) {
                        eventProps.isError = true;
                    }

                    this.telemetry.logEvent(
                        queryId, eventProps, { duration: query.durationMs });
                }
            }
        }
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
                <a className='troubleshooting-link' href='https://aka.ms/containerhealthtroubleshoot' target='_blank' tabIndex={0}>
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
     * Provides title to display chart granularity
     */
    private getGrainDisplayName(): string {
        let grainDisplayName: string = '';

        if (this.state.timeInterval) {
            let translatedTime: string;
            if (this.props.liveMetricsFeatureFlag &&
                this.props.isLiveDataInterfaceVisible &&
                EnvironmentConfig.Instance().isLiveDataEnabledEnvironment()) {
                translatedTime = LiveMetricsGranularityStrings[this.props.liveMetricsGranularity];
            } else {
                translatedTime = KustoGrainDisplay[this.state.timeInterval.getGrainKusto()];
            }

            if (translatedTime) {
                grainDisplayName = StringHelpers.replaceAll(DisplayStrings.AggregateGranularitySubtitle, '{0}', translatedTime);
            }
        }

        return grainDisplayName;
    }

    /**
     * Checks to see if data needs to be re-queried from store based on property changes
     * @param prevProps previous set of properties
     * @returns true if data needs to be re-queried
     */
    private needRequeryChartsData(prevProps: IContainerClusterPaneProps): boolean {
        return (
            (this.props.startDateTimeUtc !== prevProps.startDateTimeUtc) ||
            (this.props.endDateTimeUtc !== prevProps.endDateTimeUtc) ||
            (this.props.workspace.id !== prevProps.workspace.id) ||
            (this.props.clusterName !== prevProps.clusterName) ||
            (this.props.hostName !== prevProps.hostName) ||
            (this.props.serviceName !== prevProps.serviceName) ||
            (this.props.nameSpace !== prevProps.nameSpace) ||
            (this.props.nodePool !== prevProps.nodePool) ||
            (this.props.controllerName !== prevProps.controllerName) ||
            (this.props.controllerKind !== prevProps.controllerKind)
        );
    }

    /**
     * Renders chart with header and series selector
     * @param chartDescriptor chart descriptor
     * @param seriesSelector series selector component
     */
    private renderChart(
        chartDescriptor: IContainerMetricChartDescriptor,
        seriesSelector: JSX.Element,
        grainDisplayName: string
    ): JSX.Element {
        if (!chartDescriptor) { return null; }

        const customErrorPane: JSX.Element = this.renderErrorPane();
        const chartAriaHeaderID: string = 'chartHeaderAriaLabel' + chartDescriptor.chartId;

        const hyperlinks: JSX.Element[] = [];

        hyperlinks.push(this.createPinChartToDashboardElement(
            chartDescriptor,
            true,
            this.props.pinChartToDashboard,
            this.props.enablePinChartToDashboard));


        return (
            <div className='chartRoot'>
                <div className='chart-header'>
                    <div aria-label={chartDescriptor.chartDisplayName}
                        title={chartDescriptor.chartDisplayName}
                        id={chartAriaHeaderID}
                        className='chart-header-text'>
                        <h2>{chartDescriptor.chartDisplayName}</h2>
                        {grainDisplayName ? <div className='subTitle'>{grainDisplayName}</div> : <div className='subTitle'>&nbsp;</div>}
                    </div>
                    {seriesSelector}
                    <div className='hyperlinks'>{hyperlinks}</div>
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
                    liveMode={this.state.isLiveDataBackendRunning}
                    liveMetricsFeatureFlag={this.props.liveMetricsFeatureFlag}
                />
            </div>
        );
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
     * Callback invoked when series selection is changed for cluster performance metric (cpu or memory)
     * @param chartId chart/metric id
     * @param optionId option id to toggle
     */
    private onToggleChartSeriesOption(chartId: string, optionId: string): void {

        if (this.state.isKustoReloadRequired) {
            this.setState({ isKustoReloadRequired: false });
            this.queryChartsData(this.props);
        }

        const initialSelections = this.props.seriesSelections[chartId] as ISeriesSelectorOption[];
        if (!initialSelections) { return; }

        const resultingSelections = new Array<ISeriesSelectorOption>();

        for (let option of initialSelections) {
            const resultingOption: ISeriesSelectorOption = {
                id: option.id,
                displayName: option.displayName,
                isSelected: optionId === option.id ? !option.isSelected : option.isSelected,
            };

            resultingSelections.push(resultingOption);
        }

        this.props.onSeriesSelectionsChanged(chartId, resultingSelections);
    }

    /**
     * Calculates which series will be selected on a chart of cluster performance metric (cpu, memory)
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
     * Reads chart data from the store
     */
    private queryChartsData(queryProps: IContainerClusterPaneProps): void {
        const thisQuerySequencyNumber: number = ++this.pendingQuerySequenceNumber;

        this.setState({ isLoading: true, isError: false }, () => this.props.onTabContentLoadingStatusChange(true));

        // set up telemetry for entire set of queries
        const sessionId = GUID().toLowerCase();

        let eventProps: any = this.getDropdownSelections(queryProps);
        eventProps.isPreload = false;
        eventProps.sessionId = sessionId;

        const kustoQueryTelemetry = this.telemetry.startLogEvent(
            ChartQueryTelemetryEventName.AllKusto,
            eventProps,
            undefined
        );

        const timeInterval = new TimeInterval(
            queryProps.startDateTimeUtc,
            queryProps.endDateTimeUtc,
            Constants.IdealAggregateChartDataPoints
        );

        BladeLoadManager.Instance().setPerformanceMeasure('frame_mainContentQueryStart');
        const queries = this.createQueries(timeInterval, queryProps, sessionId);

        Promise.all(queries).then((results) => {
            // check to see if component expects result of this query
            // and don't do anything in case subsequent query was issued
            // before receiving this query results
            if (thisQuerySequencyNumber === this.pendingQuerySequenceNumber) {
                kustoQueryTelemetry.complete();
                this.loadData(results, timeInterval, ResponseType.Kusto);
            }
        }).catch((error) => {
            // check to see if component expects result of this query
            // and don't do anything in case subsequent query was issued
            // before receiving this query results
            if (thisQuerySequencyNumber === this.pendingQuerySequenceNumber) {
                kustoQueryTelemetry.complete({ isError: 'true' });

                this.processQueryError(error, queryProps.workspace.id);
            }
        });
    }

    /**
     * Performs actions necessary for visualization of chart query failures
     * @param error error occurring on chart query
     * @param workspaceId workspace id for the query
     */
    private processQueryError(error: any, workspaceId: string) {
        BladeLoadManager.Instance().terminateLoadTracking(LoadTrackingTerminationReason.QueryFailure);

        console.warn('Error while making query for charts data', error);

        if (!workspaceId) { throw new Error('Parameter @workspaceId may not be null or undefined'); }

        this.setState({ isLoading: false, isError: true }, () => this.props.onTabContentDataLoadError(error));

        if (HttpRequestError.isAccessDenied(error)) {
            ContainerGridBase.handleRequestAccessDenied(
                this.props.messagingProvider, workspaceId, 'ContainerChartsQuery');
        }
    }

    /**
     * populate the charts from the data returned by either queryGridData or
     * the preload script / setInterval watch loop
     * @param results data we want to populate the chart with
     * @param timeInterval interval the kusto query was run over
     * @param isMdmResult true if the data being referenced was loaded from mdm
     */
    private loadData(results: any[], timeInterval: ITimeInterval, responseType: ResponseType): void {
        if (!results || !results.length) { throw new Error('Parameter @results has invalid value'); }
        if (!timeInterval) { throw new Error('Parameter @timeInterval may not be null or undefined'); }

        BladeLoadManager.Instance().queryCompleted(QueryName.Charts);

        const chartData = {};

        let perfMetricQueryResult = null;
        let nodeCountQueryResult = null;
        let podCountQueryResult = null;

        if (this.props.liveMetricsFeatureFlag && EnvironmentConfig.Instance().isLiveDataEnabledEnvironment()) {
            if (responseType === ResponseType.Mdm) {
                perfMetricQueryResult = [results[0].responses[0], results[0].responses[1],
                results[0].responses[2], results[0].responses[3]];
                nodeCountQueryResult = [results[0].responses[4]];
                podCountQueryResult = [results[0].responses[5]];
            } else if (responseType === ResponseType.Kusto) {
                perfMetricQueryResult = results[0];
                nodeCountQueryResult = results[1];
                podCountQueryResult = results[2];
            } else if (responseType === ResponseType.LiveMetric) {
                perfMetricQueryResult = results;
                nodeCountQueryResult = results;
                podCountQueryResult = results;
            }
        } else {
            if (responseType === ResponseType.Mdm) {
                perfMetricQueryResult = [results[0].responses[0], results[0].responses[1],
                results[0].responses[2], results[0].responses[3]];
                nodeCountQueryResult = [results[0].responses[4]];
                podCountQueryResult = [results[0].responses[5]];
            } else {
                perfMetricQueryResult = results[0];
                nodeCountQueryResult = results[1];
                podCountQueryResult = results[2];
            }
        }

        let chartResponseInterpreter: ChartResponseInterpreter = null;

        if (this.props.liveMetricsFeatureFlag && EnvironmentConfig.Instance().isLiveDataEnabledEnvironment()) {
            if (responseType === ResponseType.Mdm) {
                chartResponseInterpreter = MdmChartResponseInterpreter.Instance(this.telemetry);
            } else if (responseType === ResponseType.Kusto) {
                chartResponseInterpreter = KustoChartResponseInterpreter.Instance();
            } else if (responseType === ResponseType.LiveMetric) {
                chartResponseInterpreter = LiveMetricsChartResponseInterpreter.Instance();
            }
        } else {
            if (responseType === ResponseType.Mdm) {
                chartResponseInterpreter = MdmChartResponseInterpreter.Instance(this.telemetry);
            } else {
                chartResponseInterpreter = KustoChartResponseInterpreter.Instance();
            }
        }

        const isMdmResult = (responseType === ResponseType.Mdm);

        chartData[ContainerMetricChartId.Cpu] =
            chartResponseInterpreter.getClusterPerformanceChartData(
                perfMetricQueryResult,
                ContainerMetricChartId.Cpu,
                timeInterval,
                isMdmResult,
                this.props.clusterName);

        chartData[ContainerMetricChartId.Memory] =
            chartResponseInterpreter.getClusterPerformanceChartData(
                perfMetricQueryResult,
                ContainerMetricChartId.Memory,
                timeInterval,
                isMdmResult,
                this.props.clusterName);

        chartData[ContainerMetricChartId.NodeCount] =
            chartResponseInterpreter.getClusterNodeCountChartData(
                nodeCountQueryResult,
                timeInterval,
                isMdmResult,
                this.props.clusterName);

        chartData[ContainerMetricChartId.PodCount] =
            chartResponseInterpreter.getClusterPodCountChartData(
                podCountQueryResult,
                timeInterval,
                isMdmResult,
                this.props.clusterName);

        this.props.onChartDataLoaded(chartData);

        this.setState({ isLoading: false, isError: false, timeInterval, isKustoReloadRequired: isMdmResult }, () => {
            this.props.onTabContentLoadingStatusChange(false);
        });
    }

    /**
     * Creates and starts kusto queries for charting data
     * @param timeInterval time interval for the query
     * @param queryProps properties of the query (filters)
     */
    private createQueries(
        timeInterval: ITimeInterval,
        queryProps: Readonly<IContainerClusterPaneProps>,
        sessionId: string
    ): Promise<any>[] {
        if (!timeInterval) { throw new Error('Parameter @timeInterval may not be null'); }
        if (!queryProps) { throw new Error('Parameter @queryProps may not be null'); }

        const cpuAndMemoryRequestId = GUID().toLowerCase();
        const nodeCountRequestId = GUID().toLowerCase();
        const podCountRequestId = GUID().toLowerCase();

        const eventProps: any = this.getDropdownSelections(queryProps);
        eventProps.isPreload = false;
        eventProps.sessionId = sessionId;
        eventProps.queryAvenue = this.queryAvenue.toString();

        const clusterPerformanceQueryTelemetry = this.telemetry.startLogEvent(
            ChartQueryTelemetryEventName.CpuAndMemory,
            { requestId: cpuAndMemoryRequestId, ...eventProps },
            undefined
        );

        const nodeCountQueryTelemetry = this.telemetry.startLogEvent(
            ChartQueryTelemetryEventName.NodeCount,
            { requestId: nodeCountRequestId, ...eventProps },
            undefined
        );

        const podCountQueryTelemetry = this.telemetry.startLogEvent(
            ChartQueryTelemetryEventName.PodCount,
            { requestId: podCountRequestId, ...eventProps },
            undefined
        );

        const bladeContext = BladeContext.instance();

        // start queries
        const perfMetricQuery =
            this.dataProvider.getClusterPerformanceChartData(
                queryProps.workspace.id,
                timeInterval,
                bladeContext.cluster,
                queryProps.hostName,
                cpuAndMemoryRequestId,
                sessionId,
                queryProps.nodePool
            ).then((results) => {
                clusterPerformanceQueryTelemetry.complete();
                return results;
            }).catch((error) => {
                clusterPerformanceQueryTelemetry.complete({ isError: 'true' });
                this.reportQueryError('cpu and memory usage', error, queryProps);
                throw error;
            });

        const nodeCountQuery =
            this.dataProvider.getClusterNodeCountChartData(
                queryProps.workspace.id,
                timeInterval,
                bladeContext.cluster,
                queryProps.hostName,
                nodeCountRequestId,
                sessionId,
                queryProps.nodePool
            ).then((results) => {
                nodeCountQueryTelemetry.complete();
                return results;
            }).catch((error) => {
                nodeCountQueryTelemetry.complete({ isError: 'true' });
                this.reportQueryError('node count', error, queryProps);
                throw error;
            });

        const podCountQuery =
            this.dataProvider.getClusterPodCountChartData(
                queryProps.workspace.id,
                timeInterval,
                bladeContext.cluster,
                queryProps.hostName,
                queryProps.nameSpace,
                queryProps.serviceName,
                podCountRequestId,
                sessionId,
                queryProps.nodePool
            ).then((results) => {
                podCountQueryTelemetry.complete();
                return results;
            }).catch((error) => {
                podCountQueryTelemetry.complete({ isError: 'true' });
                this.reportQueryError('pod count', error, queryProps);
                throw error;
            });

        return [perfMetricQuery, nodeCountQuery, podCountQuery];
    }

    /**
     * Records query error information
     * @param queryTitle Type of query performed
     * @param error error object
     * @param queryProps properties of the query including workspace, filters, etc.
     */
    private reportQueryError(
        queryTitle: string,
        error: any,
        queryProps: Readonly<IContainerClusterPaneProps>
    ): void {
        console.error('Failed to get "' + (queryTitle || '???') + '" data from the store', error);

        this.telemetry.logException(
            error,
            'ContainerClusterPane.tsx',
            ErrorSeverity.Error,
            this.getDropdownSelections(queryProps),
            undefined
        );
    }

    /**
     * Dropdown info required for query
     * @param queryProps the current set of props in a component when a query is executed
     */
    private getDropdownSelections(queryProps: Readonly<IContainerClusterPaneProps>): StringMap<string> {
        if (!queryProps) { throw new Error('Parameter @queryProps may not be null'); }

        const workspace = this.props.workspace || queryProps.workspace;

        return {
            workspace_id: workspace ? workspace.id : '<null>',
            workspace_name: workspace ? workspace.name : '<null>',
            cluster_name: this.props.clusterName || queryProps.clusterName,
            namespace: this.props.nameSpace || queryProps.nameSpace,
            service_name: this.props.serviceName || queryProps.serviceName,
            host_name: this.props.hostName || queryProps.hostName,
            isTimeRelative: this.props.isTimeRelative ? 'true' : 'false',
            startDateTimeUtc: this.props.startDateTimeUtc
                ? this.props.startDateTimeUtc.toISOString() || queryProps.startDateTimeUtc.toISOString()
                : null,
            endDateTimeUtc: this.props.endDateTimeUtc
                ? this.props.endDateTimeUtc.toISOString() || queryProps.endDateTimeUtc.toISOString()
                : null
        };
    }

    /**
     * creats pin chart to dashboard element
     * @param chartDescriptor - descriptor of the chart
     * @param showOptionPicker - flag indicates to show options picker or not.
     * @param pinToDashboard - call back action
     * @param enable - flag to enable or disable pin to dashboard
     */
    private createPinChartToDashboardElement(chartDescriptor: IContainerMetricChartDescriptor, showOptionPicker: boolean,
        pinToDashboard: (chartId: string, showOptionPicker: boolean) => void, enable: boolean): JSX.Element {
        const listHyperlinkElement: JSX.Element = <div className={enable ? 'icon' : 'disabled-icon'} title={DisplayStrings.PinSvg}
            onClick={
                () => {
                    if (enable) {
                        pinToDashboard(chartDescriptor.chartId, showOptionPicker);
                    }
                }
            }
            onKeyPress={(event) => {
                let keycode = (event.keyCode ? event.keyCode : event.which);
                if (enable && (keycode === KeyCodes.ENTER)) {
                    pinToDashboard(chartDescriptor.chartId, showOptionPicker);
                }
            }}
            tabIndex={0}
            aria-label={DisplayStrings.PinSvg}
        >{PinSVG}</div>;
        return listHyperlinkElement;
    }
}
