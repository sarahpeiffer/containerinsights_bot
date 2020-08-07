import * as React from 'react';
import { ChartSeriesData, InteractionsStore, GUID } from '@appinsights/aichartcore';
import { Promise } from 'es6-promise';

import * as Constants from './Constants';
import { ICommonComputeTabProps } from './ICommonComputeTabProps';
import { KustoChartResponseInterpreter } from './data-provider/KustoChartResponseInterpreter';
import { VmInsightsDataProvider } from './data-provider/VmInsightsDataProvider';
import {
    VirtualMachineMetricCharts, IVmMetricTopNChartDescriptor
} from './VirtualMachineMetricCharts';
import { ComputeTopNChartToolTipWrapper } from './ComputeChartPaneToolTipBody';

import * as GlobalConstants from '../shared/GlobalConstants';
import { MessagingProvider } from '../shared/MessagingProvider';
import { DisplayStrings, KustoGrainDisplay } from '../shared/DisplayStrings';
import { ARMDataProvider } from '../shared/data-provider/ARMDataProvider';
import { KustoDataProvider, IKustoQueryOptions, DraftQueryResponse } from '../shared/data-provider/KustoDataProvider';
import { MultiLineChart } from '../shared/MultiLineChart';
import { StringMap } from '../shared/StringMap';
import { ComputerGroupType, ComputerGroup, IResolvedComputerGroup } from '../shared/ComputerGroup';
import { ISeriesSelectorOption } from '../shared/ISeriesSelectorOption';
import { StringHelpers } from '../shared/Utilities/StringHelpers';
import { TimeInterval, ITimeInterval } from '../shared/data-provider/TimeInterval';
import { ITelemetry, TelemetryMainArea } from '../shared/Telemetry';
import { VmInsightsTelemetryFactory } from '../shared/VmInsightsTelemetryFactory';
import { QueryOnSelectHelper } from './shared/QueryOnSelectHelper';
import { ColumnsSvg } from '../shared/svg/columns';
import { CreateAlertSvg } from '../shared/svg/CreateAlert';
import { IWorkspaceInfo } from '../shared/IWorkspaceInfo';
import { AtScaleUtils } from './shared/AtScaleUtils';
import { ChartIcon } from './shared/chart/ChartIcon';
import { PinSVG } from '../shared/svg/pin';
import { MetricSeriesSelector } from '../shared/MetricSeriesSelector';
import { IGetChangeSelectionResult, ChartUtility } from './shared/chart/ChartUtility';
import { SolutionType } from './shared/ControlPanelUtility';
import { ApiClientRequestInfo, ApiClientRequestInfoBladeName } from '../shared/data-provider/ApiClientRequestInfo';

/* required for ie11... this will enable most of the Object.assign functionality on that browser */
import { polyfillObjectAssign } from '../shared/ObjectAssignShim';
polyfillObjectAssign();

import '../../styles/shared/ChartPane.less';
import '../../styles/compute/ChartPane.less';
import '../../styles/shared/ChartHeader.less';
import '../../styles/shared/SeriesSelector.less';
import { InfoTooltipWithoutRenderer } from './shared/InfoTooltipWithoutRenderer';

export interface IComputeTopNChartPaneProps extends ICommonComputeTabProps {
    seriesSelections: StringMap<ISeriesSelectorOption[]>;
    messagingProvider: MessagingProvider;
    isPaneVisible: boolean;
    logPrefix: string;
    featureFlags: StringMap<boolean>;
    enablePinToDashboard: boolean;
    vmScaleSetResourceId?: string;
    onSeriesSelectionsChanged: (chartId: string, optionId: string, isOptionSelected: boolean, newSelections: any) => void;
    onChartDataLoaded: () => void;
    openTableTab(requestedMetric: string): void;
    createAlertRule(requestedMetric: string): void;
    pinToDashboard(chartId: string, showOptionPicker: boolean): void;
}

export interface ISingleTopNChartQueryProps {
    optionId: string; // TODO bb: What is the purpose of this optionId?
    chart: IVmMetricTopNChartDescriptor;
}

export interface IComputeTopNChartPaneState {
    chartData: StringMap<StringMap<ChartSeriesData>>;
    isLoading: boolean;
    isError: StringMap<boolean>;
    timeInterval: ITimeInterval;
    singleTopNChartQuery?: ISingleTopNChartQueryProps;

    //Loading statuses for each chart
    chartLoadingMap: StringMap<boolean>;
}

export class ComputeTopNChartPane extends React.Component<IComputeTopNChartPaneProps, IComputeTopNChartPaneState> {
    private dataProvider: VmInsightsDataProvider;
    private telemetry: ITelemetry;
    private kustoResponseInterpreter: KustoChartResponseInterpreter;
    private isInitialQuery: boolean = true;

    private sessionId: string = '';
    private interactionStore: InteractionsStore;

    // Helper to evaluate when we need to query based on selection
    private queryOnSelectHelper: QueryOnSelectHelper = new QueryOnSelectHelper();

    constructor(props: IComputeTopNChartPaneProps) {
        super(props);
        this.dataProvider = new VmInsightsDataProvider(
            new KustoDataProvider(new ARMDataProvider(), GlobalConstants.VMInsightsApplicationId));
        this.kustoResponseInterpreter = new KustoChartResponseInterpreter();
        this.interactionStore = new InteractionsStore(undefined);

        this.telemetry = VmInsightsTelemetryFactory.get(TelemetryMainArea.Compute);

        this.onToggleChartSeriesOption = this.onToggleChartSeriesOption.bind(this);

        this.state = {
            isLoading: true,
            isError: {}, // No errors
            timeInterval: new TimeInterval(
                this.props.startDateTimeUtc,
                this.props.endDateTimeUtc,
                Constants.IdealAggregateChartDataPoints),
            chartData: {},
            chartLoadingMap: {}
        }
    }

    public componentWillMount(): void {
        if (this.needRequeryChartsData()) {
            this.queryChartsData();
        }
    }

    public componentDidUpdate(prevProps: Readonly<IComputeTopNChartPaneProps>) {
        if (this.needRequeryChartsData(prevProps)) {
            if (this.props.seriesSelections !== prevProps.seriesSelections) {
                this.queryChartsData(this.state.singleTopNChartQuery);
            } else {
                this.queryChartsData();
            }
        }
    }

    public render(): JSX.Element {
        if (!this.props.isPaneVisible) {
            // TODO ak: replace this null, but verify doesn't cause any regressions
            return <div />;
        }

        const grainDisplayName = this.getGrainDisplayName();

        const charts = new Array<JSX.Element>();

        const chartDescriptorList = this.getTopNChartDescriptorList();

        for (const chartDescriptor of chartDescriptorList) {
            const chartElement = this.renderChart(
                chartDescriptor,
                this.getSeriesSelector(chartDescriptor),
                grainDisplayName);

            charts.push(chartElement);
        }

        return (
            <div className='chart-pane'>
                <div className='chartpane-root compute-chart-paneroot-override'>
                    {charts}
                </div>
            </div>
        );
    }

    /**
     * Creates chart data series selection control
     * @param chartDescriptor chart descriptor
     */
    private getSeriesSelector(chartDescriptor: IVmMetricTopNChartDescriptor) {
        if (!chartDescriptor) { throw new Error('Parameter @chartDescriptor may not be null'); }

        return (
            <MetricSeriesSelector
                selectorId={chartDescriptor.chartId}
                seriesOptions={this.props.seriesSelections[chartDescriptor.chartId]}
                onToggleOption={this.onToggleChartSeriesOption}
                isLoading={this.state.isLoading || this.state.chartLoadingMap[chartDescriptor.chartId]}
            />
        );
    }

    /**
     * Callback invoked when series selection is changed for charts
     * @param chartId chart/metric id
     * @param optionId option id to toggle
     */
    private onToggleChartSeriesOption(chartId: string, optionId: string): void {
        const result: IGetChangeSelectionResult = ChartUtility.GetChangeSelectionResultTopNChart(this.props.seriesSelections[chartId],
            optionId);
        const queryInsightsMetrics: boolean = this.props.featureFlags[Constants.FeatureMap.enableInsightsMetricsQuery];
        const singleChartQuery: ISingleTopNChartQueryProps = {
            chart: VirtualMachineMetricCharts.GetTopNVirtualMachineMetricChart(chartId, queryInsightsMetrics),
            optionId: optionId
        }
        this.setState({
            singleTopNChartQuery: singleChartQuery
        }, () => {
            this.props.onSeriesSelectionsChanged(chartId, optionId, result.isOptionSelected, result.newSelections);
        });
    }

    /**
     * Provides title to display chart granularity
     */
    private getGrainDisplayName(): string {
        let grainDisplayName: string = '';

        if (this.state.timeInterval) {
            const translatedTime = KustoGrainDisplay[this.state.timeInterval.getGrainKusto()];

            if (translatedTime) {
                grainDisplayName = StringHelpers.replaceAll(DisplayStrings.AggregateGranularitySubtitle, '{0}', translatedTime);
            }
        }

        return grainDisplayName;
    }

    /**
     * Renders chart with header and series selector
     * @param chartDescriptor chart descriptor
     * @param grainDisplayName granularity disply name
     */
    private renderChart(
        chartDescriptor: IVmMetricTopNChartDescriptor,
        seriesSelector: JSX.Element,
        grainDisplayName: string
    ): JSX.Element {
        if (!chartDescriptor) { return null; }

        const chartAriaHeaderID: string = 'chartHeaderAriaLabel' + chartDescriptor.chartId;
        const data: StringMap<ChartSeriesData> = this.state.chartData[chartDescriptor.chartId];
        const tooltip: ComputeTopNChartToolTipWrapper = new ComputeTopNChartToolTipWrapper(chartDescriptor, data, this.state.timeInterval);
        const customErrorPane: JSX.Element = this.renderErrorPane(data, chartDescriptor.chartId);

        const hyperlinks: JSX.Element[] = [];
        hyperlinks.push(<ChartIcon
            key='list-view'
            action={() => { this.props.openTableTab(chartDescriptor.metricId) }}
            icon={ColumnsSvg}
            title={DisplayStrings.ColumnsSvg}
        />);
        hyperlinks.push(<ChartIcon
            key='pin-to-dashboard'
            isDisabled={!this.props.enablePinToDashboard}
            action={() => { this.props.pinToDashboard(chartDescriptor.chartId, false) }}
            icon={PinSVG}
            title={DisplayStrings.PinSvg}
        />);
        if (this.props.featureFlags[Constants.FeatureMap.vmInsightsAlerts]
            && this.props.solutionType === SolutionType.Hybrid) {
            // AtScale Azure solution alert rule creation is not supported yet
            hyperlinks.push(<ChartIcon
                key='alert-rule'
                action={() => { this.props.createAlertRule(chartDescriptor.chartId) }}
                icon={CreateAlertSvg}
                title={DisplayStrings.AlertSvg}
            />);
        }

        return (
            <div key={chartDescriptor.chartId} className='chartRoot'>
                <div className='chart-header'>
                    <div aria-label={chartDescriptor.chartDisplayName}
                        id={chartAriaHeaderID}
                        className='heading'>
                        <h2>
                            {chartDescriptor.chartDisplayName}
                            <InfoTooltipWithoutRenderer description={chartDescriptor.description} />
                        </h2>
                        <div className='subTitle'>{grainDisplayName}</div>
                    </div>
                    {seriesSelector}
                    <div className='hyperlinks'>{hyperlinks}</div>
                </div>
                <MultiLineChart
                    timeInterval={this.state.timeInterval}
                    isLoading={this.state.isLoading || this.state.chartLoadingMap[chartDescriptor.chartId]}
                    isError={this.state.isError && this.state.isError[chartDescriptor.chartId]}
                    data={data}
                    selectedSeries={this.getMetricSelectedSeries(data, this.props.seriesSelections[chartDescriptor.chartId])}
                    toolTipReactBody={tooltip}
                    visualization={chartDescriptor.visualization}
                    interactionStore={this.interactionStore}
                    ariaLabelledById={chartAriaHeaderID}
                    customErrorElement={customErrorPane}
                />
            </div>
        );
    }

    /**
     * Renders error message over charts
     */
    private renderErrorPane(chartData: StringMap<ChartSeriesData>, chartId: string): JSX.Element {
        if (this.state.isLoading) { return null; }

        let errorMessage: string = null;
        let className: string = null;

        if (this.state.isError && this.state.isError[chartId]) {
            errorMessage = DisplayStrings.DataRetrievalError;
            className = 'chart-message-panel error-msg';
        } else if (chartData === undefined) {
            errorMessage = DisplayStrings.NoDataMsg;
            className = 'chart-message-panel nodata-msg';
        }

        if (!errorMessage) { return null; }

        return (
            <div className={className}>
                <span>{errorMessage}</span>
                <a className='troubleshooting-link' href='https://aka.ms/vminsights/ui/links/faq' target='_blank' tabIndex={0}>
                    {DisplayStrings.TroubleshootingLinkText}
                </a>
            </div>
        );
    }

    /**
     * Calculates which series will be selected on a chart
     * @param chartData chart series data
     * @param seriesSelections selections made by the user via series selections control
     */
    private getMetricSelectedSeries(
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
                    if ((availableSeries.indexOf('|' + seriesOptions[i].id) > 0)) {
                        selectedSeries.push(availableSeries);
                    }
                }
            }
        }

        return selectedSeries;
    }

    private needRequeryChartsData(prevProps?: IComputeTopNChartPaneProps): boolean {
        const needsRequeryData: boolean = this.queryOnSelectHelper.needsRequeryNow(
            this.props.isPaneVisible,
            () => {
                return (this.props.startDateTimeUtc !== prevProps?.startDateTimeUtc) ||
                    (this.props.endDateTimeUtc !== prevProps?.endDateTimeUtc) ||
                    !AtScaleUtils.areWorkspacesEqual(this.props.workspace, prevProps?.workspace) ||
                    (this.props.computerGroup?.id !== prevProps?.computerGroup?.id) ||
                    !AtScaleUtils.areAzureResourcesEqual(this.props.azureResourceInfo, prevProps?.azureResourceInfo) ||
                    (this.props.azureResourceType !== prevProps?.azureResourceType) ||
                    (this.props.solutionType !== prevProps?.solutionType) ||
                    // FIXME: Object comparion should be replaced with value comparison
                    (this.props.seriesSelections !== prevProps?.seriesSelections);
            });
        return needsRequeryData;
    }

    private getLogProperties(sessionId: string): StringMap<string> {
        const properties: StringMap<string> = {};
        properties['workspaceId'] = this.props.workspace?.id;
        properties['startDateTimeUtc'] = this.props.startDateTimeUtc?.toISOString();
        properties['endDateTimeUtc'] = this.props.endDateTimeUtc?.toISOString();
        properties['sessionId'] = sessionId;
        properties['resourceId'] = this.props.azureResourceInfo?.id;

        if (this.props.computerGroup) {
            properties['group_type'] = ComputerGroupType[this.props.computerGroup.groupType];
            properties['group_id'] = this.props.computerGroup.id;
        }

        return properties;
    }

    private queryChartsData(singleChartQuery?: ISingleTopNChartQueryProps): Promise<any> {
        // If solutionType is azure but there is no selected resource then return.
        // If solutionType is hybrid but there is no selected workspace then return.
        if (!AtScaleUtils.validatePropsToQueryData(this.props)) {
            return new Promise(() => { });
        }

        const eventName = `${this.props.logPrefix}.QueryAllTopNCharts`;

        const sessionId = GUID().toLowerCase();
        this.sessionId = sessionId;

        (window as any).atScaleComputePerfInsights.performanceMeasures['frame_topNChartDataQueryStart'] = Date.now();

        const timeInterval = new TimeInterval(
            this.props.startDateTimeUtc,
            this.props.endDateTimeUtc,
            Constants.IdealAggregateChartDataPoints);

        const chartDescriptorList: IVmMetricTopNChartDescriptor[] = [];
        if (singleChartQuery) {
            chartDescriptorList.push(singleChartQuery.chart);
        } else {
            chartDescriptorList.push(...this.getTopNChartDescriptorList());
        }
        let isError = this.state.isError || {};
        chartDescriptorList.forEach((chart) => {
            isError[chart.chartId] = false;
        });
        if (singleChartQuery) {
            this.setState({ 
                timeInterval, 
                isError, 
                chartLoadingMap: {...this.state.chartLoadingMap, [singleChartQuery.chart.chartId]: true} 
            });
        } else {
            this.setState({ timeInterval, isLoading: true, isError });
        }

        const properties = this.getLogProperties(sessionId);
        const telemetryContext = this.telemetry.startLogEvent(eventName, properties, undefined);
        const queryInsightsMetrics: boolean = this.props.featureFlags[Constants.FeatureMap.enableInsightsMetricsQuery];
        const queryOption: IKustoQueryOptions = {
            sessionId, timeInterval: timeInterval
        };
        this.isInitialQuery = false;
        return this.createQueries(timeInterval, queryOption, this.props.vmScaleSetResourceId, singleChartQuery, queryInsightsMetrics).then(
            (queriesPromise: Promise<DraftQueryResponse>[]) => {
                return Promise.all(queriesPromise).then((results: DraftQueryResponse[]) => {
                    (window as any).atScaleComputePerfInsights.performanceMeasures['frame_topNChartDataQueryEnd'] = Date.now();
                    // check to see if component expects result of this query
                    // and don't do anything in case subsequent query was issued
                    // before receiving this query results
                    if (sessionId === this.sessionId) {
                        if (this.dataProvider.isEmptyCharts(results)) {
                            telemetryContext.complete({ message: 'Empty Charts'});
                        } else {
                            telemetryContext.complete();
                        }
                        let chartData = singleChartQuery ? this.state.chartData : {};
                        let resultsCounter: number = 0;
                        chartDescriptorList.forEach(chart => {
                            chartData[chart.chartId] =
                                this.kustoResponseInterpreter.getFlattenedTopNChartData(
                                    results[resultsCounter],
                                    chart.counters,
                                    timeInterval,
                                    singleChartQuery);
                            isError[chart.chartId] = results[resultsCounter]?.Error ? true : false;
                            resultsCounter++;
                        });
                        if (singleChartQuery) {
                            this.setState({ 
                                chartData: chartData, 
                                isError, 
                                chartLoadingMap: {...this.state.chartLoadingMap, [singleChartQuery.chart.chartId]: false} 
                            });
                        } else {
                            this.setState({ chartData: chartData, isLoading: false, isError });
                        }
                        this.props.onChartDataLoaded();
                    }
                });
            }).catch((error) => {
                (window as any).atScaleComputePerfInsights.performanceMeasures['frame_topNChartDataQueryEnd'] = Date.now();
                // check to see if component expects result of this query
                // and don't do anything in case subsequent query was issued
                // before receiving this query results
                if (sessionId === this.sessionId) {
                    this.props.onChartDataLoaded();
                    telemetryContext.fail(error, { message: 'Error in getting data at ComputeTopNChartPane.tsx' });
                }
            });
    }

    /**
     * Creates and starts kusto queries for charting data
     * @param queryProps properties of the query (filters)
     */
    private createQueries(
        timeInterval: ITimeInterval,
        baseQueryOption: IKustoQueryOptions,
        vmssResourceId?: string,
        singleChartQuery?: ISingleTopNChartQueryProps,
        queryInsightsMetrics: boolean = false
    ): Promise<Promise<DraftQueryResponse>[]> {
        if (!this.props) { throw new Error('Parameter @queryProps may not be null'); }
        if (!this.props.startDateTimeUtc) { throw new Error('Parameter @queryProps.startDateTimeUtc may not be null'); }
        if (!this.props.endDateTimeUtc) { throw new Error('Parameter @queryProps.endDateTimeUtc may not be null'); }

        const properties: StringMap<string> = {};
        properties['startDateTimeUtc'] = timeInterval.getBestGranularStartDate().toISOString();
        properties['endDateTimeUtc'] = timeInterval.getBestGranularEndDate().toISOString();
        properties['session_id'] = baseQueryOption.sessionId;
        properties['resourceType'] = this.props.azureResourceType;

        if (this.props.computerGroup) {
            properties['group_type'] = ComputerGroupType[this.props.computerGroup.groupType];
            properties['group_id'] = this.props.computerGroup.id;
        }

        // TODO bb: Need to pass Azure scope props and hybrid scope props seperately.
        const azureResourceId: string = AtScaleUtils.getAzureResourceId(this.props);
        const azureResourceType: string = AtScaleUtils.getAzureResourceType(this.props.azureResourceType);
        const computerGroup: ComputerGroup = this.props.solutionType === SolutionType.Hybrid ? this.props.computerGroup : undefined;
        // For VMSS Perf tab, do not change the existing behaviour. We will still make single workspace query only.
        return this.getTopNChartMetricDataPromises(this.props.workspace, computerGroup, timeInterval,
            azureResourceId || vmssResourceId, azureResourceType, baseQueryOption, properties, singleChartQuery, queryInsightsMetrics);
    }

    // TODO bb: Define interface for the method parameters
    private getTopNChartMetricDataPromises(workspace: IWorkspaceInfo,
        computerGroup: ComputerGroup,
        timeInterval: ITimeInterval,
        resourceId: string,
        azureResourceType: string,
        baseQueryOption: IKustoQueryOptions,
        queryTelemetryProps: StringMap<string>,
        singleChartQuery?: ISingleTopNChartQueryProps,
        queryInsightsMetrics: boolean = false
    ): Promise<Promise<DraftQueryResponse>[]> {
        queryTelemetryProps['workspaceId'] = workspace && workspace.id;
        queryTelemetryProps['resourceId'] = resourceId;
        const promises: Promise<DraftQueryResponse>[] = [];
        const chartDescriptorList = this.getTopNChartDescriptorList();
        const metricsQueryProps: ISingleTopNChartQueryProps[] = [];
        if (singleChartQuery?.chart) {
            metricsQueryProps.push(singleChartQuery);
        } else {
            chartDescriptorList.forEach(chart => {
                let aggregationType = null;
                this.props.seriesSelections[chart.chartId].forEach(option => {
                    if (option.isSelected) {
                        aggregationType = option.id;
                    }
                });
                metricsQueryProps.push({
                    chart,
                    optionId: aggregationType
                });
            });
        }
        let computerGroupResolved = undefined;
        const resolveComputerGroupPromise: Promise<any> = computerGroup ? computerGroup.resolve() : Promise.resolve(undefined);
        return resolveComputerGroupPromise.then((resolvedComputerGroup: IResolvedComputerGroup) => {
            if (resolvedComputerGroup) {
                computerGroupResolved = resolvedComputerGroup;
            }
        }).then(() => {
            metricsQueryProps.forEach((metricQuery) => {
                promises.push(this.getTopNResourceUsageOfSingleMetric(workspace,
                    computerGroupResolved,
                    timeInterval,
                    resourceId,
                    azureResourceType,
                    metricQuery.chart,
                    baseQueryOption,
                    queryTelemetryProps,
                    metricQuery.optionId,
                    queryInsightsMetrics));
            });
            return promises;
        });
    }

    private getTopNResourceUsageOfSingleMetric(workspace: IWorkspaceInfo,
        computerGroup: IResolvedComputerGroup,
        timeInterval: ITimeInterval,
        resourceId: string,
        azureResourceType: string,
        chart: IVmMetricTopNChartDescriptor,
        baseQueryOption: IKustoQueryOptions,
        queryTelemetryProps: StringMap<string>,
        aggregationType: string,
        queryInsightsMetrics: boolean = false): Promise<DraftQueryResponse> {

        const requestId = GUID().toLowerCase();
        const eventName = `${this.props.logPrefix}.ComputeTopNCharts.` + chart.chartId;
        const queryProperites = Object.assign({ requestId: requestId }, queryTelemetryProps);
        const queryClientRequestInfo: ApiClientRequestInfo = new ApiClientRequestInfo({
            queryName: eventName,
            bladeName: this.props.vmScaleSetResourceId ? ApiClientRequestInfoBladeName.Vmss : ApiClientRequestInfoBladeName.AtScale,
            isInitialBladeLoad: this.props.isDefaultExperienceOfBlade && this.isInitialQuery
        });
        const queryOptions = Object.assign({ requestId, requestInfoV2: queryClientRequestInfo }, baseQueryOption);

        const queryTelemetry = this.telemetry.startLogEvent(
            eventName,
            queryProperites,
            undefined
        );

        return this.dataProvider.getTopNChartMetricData(
            workspace,
            computerGroup,
            timeInterval,
            chart.query,
            queryOptions,
            resourceId,
            azureResourceType,
            aggregationType,
            queryInsightsMetrics)
            .then((results) => { queryTelemetry.complete(results.TelemetryProps); return results; })
            .catch((error) => {
                queryTelemetry.fail(error, { message: 'Error in getting data at ComputeTopNChartPane.tsx' });
                return new DraftQueryResponse(undefined, error);
            });
    }

    /**
     * Returns Top N Chart list based on whether InsightsMetrics is enabled or not
     */
    private getTopNChartDescriptorList(): IVmMetricTopNChartDescriptor[] {
        // This uses InsightsNMetrics table
        if (this.props.featureFlags[Constants.FeatureMap.enableInsightsMetricsQuery]) {
            return VirtualMachineMetricCharts.TopNViewChartListUsingInsightsMetrics || [];
        }

        // This uses perf table
        return VirtualMachineMetricCharts.TopNViewChartList || [];
    }
}
