import * as React from 'react';
import update = require('immutability-helper');
import { Promise } from 'es6-promise';

import { DisplayStrings, KustoGrainDisplay } from '../shared/DisplayStrings';
import { ChartSeriesData, InteractionsStore, GUID } from '@appinsights/aichartcore';
import { IQueryResult } from '../shared/BladeQuery';
import { ErrorSeverity } from '../shared/data-provider/TelemetryErrorSeverity';

import * as GlobalConstants from '../shared/GlobalConstants';
import { ARMDataProvider } from '../shared/data-provider/ARMDataProvider';
import { RetryARMDataProvider } from '../shared/data-provider/RetryARMDataProvider';
import { RetryPolicyFactory } from '../shared/data-provider/RetryPolicyFactory';
import { KustoDataProvider, IKustoQueryOptions } from '../shared/data-provider/KustoDataProvider';
import { MultiLineChart } from '../shared/MultiLineChart';
import { MetricSeriesSelector } from '../shared/MetricSeriesSelector';
import { ISeriesSelectorOption } from '../shared/ISeriesSelectorOption';
import { StringHelpers } from '../shared/Utilities/StringHelpers';
import { VmInsightsTelemetryFactory } from '../shared/VmInsightsTelemetryFactory';
import { ITimeInterval, TimeInterval } from '../shared/data-provider/TimeInterval';
import { ITelemetry, TelemetryMainArea } from '../shared/Telemetry';
import { StringMap } from '../shared/StringMap';
import { MessagingProvider } from '../shared/MessagingProvider';
import { ChartUtility, IGetChangeSelectionResult } from './shared/chart/ChartUtility';
import { InfoTooltip } from './shared/InfoTooltip';
import { ChartIcon } from './shared/chart/ChartIcon';
import { PinSVG } from '../shared/svg/pin';
import { CreateAlertSvg } from '../shared/svg/CreateAlert';

import * as Constants from './Constants';
import { VmInsightsDataProvider } from './data-provider/VmInsightsDataProvider';
import { KustoChartResponseInterpreter } from './data-provider/KustoChartResponseInterpreter';
import {
    VirtualMachineMetricCharts,
    VmMetricChartId,
    IVmMetricChartDescriptor,
} from './VirtualMachineMetricCharts';
import { ComputeChartToolTipWrapper } from './ComputeChartPaneToolTipBody';
import { IWorkspaceInfo } from '../shared/IWorkspaceInfo';

/* required for ie11... this will enable most of the Object.assign functionality on that browser */
import { polyfillObjectAssign } from '../shared/ObjectAssignShim';
polyfillObjectAssign();

import '../../styles/shared/ChartPane.less';
import '../../styles/compute/ChartPane.less';
import '../../styles/shared/ChartHeader.less';
import '../../styles/shared/SeriesSelector.less';
import { ApiClientRequestInfo, ApiClientRequestInfoBladeName } from '../shared/data-provider/ApiClientRequestInfo';

export interface ISingleComputeChartPaneProps {
    workspace: IWorkspaceInfo;
    computerName: string;
    resourceId: string;
    initialSeriesSelections: StringMap<ISeriesSelectorOption[]>;
    startDateTimeUtc: Date;
    endDateTimeUtc: Date;
    diskGridHasLatencyCounters: boolean;
    messagingProvider: MessagingProvider;
    isDefaultExperienceOfBlade: boolean;

    /**
     * Append telemetry event name to this prefix before logging them.
     */
    logPrefix: string;

    /** session id to be used in queries */
    sessionId: string;

    /** Notifies of a query completed */
    onQueryCompleted: () => void;

    onSeriesSelectionChanged: (chartId: string, optionId: string, isOptionSelected: boolean) => void;

    /** True if there was query done at the blade */
    queryOnBlade: boolean,

    /** Results of the blade query for disk chart. This will only be defined once the query is finished. */
    bladeDiskChartResult: IQueryResult,

    /** Results of the blade query for joined chart. This will only be defined once the query is finished. */
    bladeJoinedChartResult: IQueryResult,

    /** list of featureFlags from parent extension */
    featureFlags: StringMap<boolean>,

    enablePinToDashboard: boolean,

    /** send pin to dashboard message to blade */
    pinToDashboard(chartId: string, showOptionPicker: boolean): void;

    createAlertRule(requestedMetric: string): void;
}

export interface ISingleComputeChartPaneState {
    timeInterval: ITimeInterval,
    isLoading: boolean,
    isError: boolean

    /** data for chart visualization
     * dictionary by chart id (metric) to value, which is itself
     * a dictionary of series ids to chart series data
     */
    chartData: StringMap<StringMap<ChartSeriesData>>;

    // series selections for the chart
    seriesSelections: StringMap<ISeriesSelectorOption[]>;
}

export class SingleComputeChartPane extends React.Component<ISingleComputeChartPaneProps, ISingleComputeChartPaneState> {
    private dataProvider: VmInsightsDataProvider;
    private kustoResponseInterpreter: KustoChartResponseInterpreter;
    private telemetry: ITelemetry;
    private isInitialQuery: boolean = true;

    private interactionStore: InteractionsStore;

    constructor(props: ISingleComputeChartPaneProps) {
        super(props);
        this.dataProvider =
            new VmInsightsDataProvider(
                new KustoDataProvider(
                    new RetryARMDataProvider(new ARMDataProvider(), new RetryPolicyFactory()),
                    GlobalConstants.VMInsightsApplicationId
                ));
        this.kustoResponseInterpreter = new KustoChartResponseInterpreter();
        this.interactionStore = new InteractionsStore(undefined);
        this.onToggleChartSeriesOption = this.onToggleChartSeriesOption.bind(this);

        this.telemetry = VmInsightsTelemetryFactory.get(TelemetryMainArea.Compute);

        this.state = {
            timeInterval: undefined,
            isLoading: false,
            isError: false,
            seriesSelections: this.props.initialSeriesSelections,
            chartData: {}
        };
    }

    public render(): JSX.Element {
        const grainDisplayName = this.getGrainDisplayName();

        const charts = new Array<JSX.Element>();

        let chartDescriptorList = VirtualMachineMetricCharts.SingleVmChartList || [];

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

    public componentWillMount(): void {
        if (this.props.queryOnBlade) {
            this.isInitialQuery = false;
            this.processBladeData();
        } else {
            this.queryChartsData(this.props);
        }
    }

    public componentWillReceiveProps(
        nextProps: Readonly<ISingleComputeChartPaneProps>,
        nextContext: Readonly<ISingleComputeChartPaneState>): void {
        if (this.needRequeryChartsData(nextProps)) {
            this.queryChartsData(nextProps);
        }
    }

    /**
     * Renders chart with header and series selector
     * @param chartDescriptor chart descriptor
     * @param seriesSelector series selector component
     * @param grainDisplayName granularity disply name
     */
    private renderChart(
        chartDescriptor: IVmMetricChartDescriptor,
        seriesSelector: JSX.Element,
        grainDisplayName: string
    ): JSX.Element {
        if (!chartDescriptor) { return null; }
        if (chartDescriptor.chartId === VmMetricChartId.DiskLatency && !this.props.diskGridHasLatencyCounters) {
            return null;
        }

        const chartAriaHeaderID: string = 'chartHeaderAriaLabel' + chartDescriptor.chartId;
        const showSeriesSelector: boolean = chartDescriptor.chartId !== VmMetricChartId.DiskUsed;
        const seriesSelectorElement = showSeriesSelector ? seriesSelector : <div />;
        const data = this.state.chartData[chartDescriptor.chartId];
        const tooltip = new ComputeChartToolTipWrapper(chartDescriptor, data, this.state.timeInterval);

        const hyperlinks: JSX.Element[] = [];
        hyperlinks.push(<ChartIcon
            isDisabled={!this.props.enablePinToDashboard}
            action={() => { this.props.pinToDashboard(chartDescriptor.chartId, false) }}
            icon={PinSVG}
            title={DisplayStrings.PinSvg}
        />);
        if (this.props.featureFlags[Constants.FeatureMap.vmInsightsAlerts]) {
            hyperlinks.push(<ChartIcon
                action={() => { this.props.createAlertRule(chartDescriptor.chartId) }}
                icon={CreateAlertSvg}
                title={DisplayStrings.AlertSvg}
            />);
        }

        return (
            <div className='chartRoot'>
                <div aria-label={chartDescriptor.chartDisplayName}
                    title={chartDescriptor.chartDisplayName}
                    id={chartAriaHeaderID}
                    className='chart-header'>
                    <div className='heading-inline'>
                        <div className='border'>
                            <h2>
                                {chartDescriptor.chartDisplayName}
                                <InfoTooltip description={chartDescriptor.description} />
                            </h2>
                        </div>
                        {grainDisplayName ? <div className='subTitle'>{grainDisplayName}</div> : <div className='subTitle'>&nbsp;</div>}
                    </div>
                    {seriesSelectorElement}
                    <div className='hyperlinks'>{hyperlinks}</div>
                </div>
                <MultiLineChart
                    timeInterval={this.state.timeInterval}
                    isLoading={this.state.isLoading}
                    isError={this.state.isError || data === undefined}
                    data={data}
                    selectedSeries={this.getMetricSelectedSeries(data, this.state.seriesSelections[chartDescriptor.chartId])}
                    toolTipReactBody={tooltip}
                    visualization={chartDescriptor.visualization}
                    interactionStore={this.interactionStore}
                    ariaLabelledById={chartAriaHeaderID}
                />
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
     * Creates chart data series selection control
     * @param chartDescriptor chart descriptor
     */
    private getSeriesSelector(chartDescriptor: IVmMetricChartDescriptor) {
        if (!chartDescriptor) { throw new Error('Parameter @chartDescriptor may not be null'); }

        return (
            <MetricSeriesSelector
                selectorId={chartDescriptor.chartId}
                seriesOptions={this.state.seriesSelections[chartDescriptor.chartId]}
                onToggleOption={this.onToggleChartSeriesOption}
            />
        );
    }

    /**
     * Callback invoked when series selection is changed for charts
     * @param chartId chart/metric id
     * @param optionId option id to toggle
     */
    private onToggleChartSeriesOption(chartId: string, optionId: string): void {
        const result: IGetChangeSelectionResult = ChartUtility.GetChangeSelectionResult(this.state.seriesSelections[chartId], optionId);

        this.setState((prevState: ISingleComputeChartPaneState) => {
            if (!prevState.seriesSelections || !prevState.seriesSelections.hasOwnProperty(chartId)) {
                // appinsights should pick up and log
                throw 'Chart id doesn\'t exist on toggle ' + chartId;
            }

            const seriesSelections = update(prevState.seriesSelections, {
                [chartId]: { $set: result.newSelections }
            });

            return {
                seriesSelections
            };
        });


        this.props.onSeriesSelectionChanged(chartId, optionId, result.isOptionSelected);
    }

    private needRequeryChartsData(nextProps: ISingleComputeChartPaneProps): boolean {
        return (
            (this.props.startDateTimeUtc.getTime() !== nextProps.startDateTimeUtc.getTime()) ||
            (this.props.endDateTimeUtc.getTime() !== nextProps.endDateTimeUtc.getTime()) ||
            ((this.props.workspace && this.props.workspace.id) !== (nextProps.workspace && nextProps.workspace.id)) ||
            (this.props.computerName !== nextProps.computerName) ||
            (this.props.resourceId !== nextProps.resourceId)
        );
    }

    private queryChartsData(queryProps: Readonly<ISingleComputeChartPaneProps>): Promise<any> {
        if (!queryProps) { throw new Error('Parameter @queryProps may not be null'); }
        if (!queryProps.workspace && !queryProps.workspace.id) { throw new Error('Parameter @queryProps.workspaceId may not be null'); }
        if (!(queryProps.computerName || queryProps.resourceId)) {
            throw new Error('At least one of @queryProps.computerName or @queryProps.resourceId must be non-null');
        }
        if (!queryProps.startDateTimeUtc) { throw new Error('Parameter @queryProps.startDateTimeUtc may not be null'); }
        if (!queryProps.endDateTimeUtc) { throw new Error('Parameter @queryProps.endDateTimeUtc may not be null'); }

        const eventName = `${this.props.logPrefix}.QueryAllCharts`;

        // set up telemetry for entire set of queries
        const kustoSessionId = this.props.sessionId;
        if ((window as any).vmInstanceComputePerfInsights && (window as any).vmInstanceComputePerfInsights.performanceMeasures) {
            (window as any).vmInstanceComputePerfInsights.performanceMeasures['frame_chartDataQueryStart'] = Date.now();
        }
        const timeInterval: ITimeInterval = new TimeInterval(
            queryProps.startDateTimeUtc,
            queryProps.endDateTimeUtc,
            Constants.IdealAggregateChartDataPoints
        );

        this.setState({ isLoading: true, isError: false, timeInterval: timeInterval, chartData: {} });

        const baseChartQueryOption: IKustoQueryOptions = {
            requestInfo: undefined,
            sessionId: this.props.sessionId,
            timeInterval: timeInterval
        };

        const queryPromisesListAndReuqestIdList = this.getQueryPromiseList(queryProps, timeInterval, baseChartQueryOption);

        const properties = {
            workspaceId: queryProps.workspace && queryProps.workspace.id,
            computerName: queryProps.computerName,
            resourceId: queryProps.resourceId,
            startDateTimeUtc: timeInterval.getBestGranularStartDate().toISOString(),
            endDateTimeUtc: timeInterval.getBestGranularEndDate().toISOString(),
            sessionId: this.props.sessionId,
            requestIdList: queryPromisesListAndReuqestIdList.requestIdList.join()
        };
        // set up telemetry for entire set of queries and each query individually
        const kustoQueryTelemetry = this.telemetry.startLogEvent(
            eventName,
            properties,
            undefined
        );

        return Promise.all(queryPromisesListAndReuqestIdList.promisesList).then((results) => {
            if ((window as any).vmInstanceComputePerfInsights && (window as any).vmInstanceComputePerfInsights.performanceMeasures) {
                (window as any).vmInstanceComputePerfInsights.performanceMeasures['frame_chartDataQueryEnd'] = Date.now();
            }

            // check to see if component expects result of this query
            // and don't do anything in case subsequent query was issued
            // before receiving this query results
            if (this.props.sessionId === kustoSessionId) {
                if (this.dataProvider.isEmptyCharts(results)) {
                    kustoQueryTelemetry.complete({ message: 'Empty charts'});
                } else {
                    kustoQueryTelemetry.complete();
                }
                const chartData = {};

                const joinedMetricsQueryResults = results[0];
                const diskUsedQueryResults = results[1];

                VirtualMachineMetricCharts.SingleVmChartList.forEach(chart => {
                    if (chart.chartId === VmMetricChartId.DiskUsed) {
                        chartData[chart.chartId] =
                            this.kustoResponseInterpreter.getFlattenedSingleComputeDiskUsageChartData(
                                diskUsedQueryResults,
                                timeInterval);
                    } else {
                        chartData[chart.chartId] =
                            this.kustoResponseInterpreter.getFlattenedChartData(
                                joinedMetricsQueryResults,
                                chart.counters,
                                timeInterval);
                    }
                });

                this.setState({ isLoading: false, isError: false, chartData: chartData }, () => this.props.onQueryCompleted());
            }
        }).catch((error) => {
            if ((window as any).vmInstanceComputePerfInsights && (window as any).vmInstanceComputePerfInsights.performanceMeasures) {
                (window as any).vmInstanceComputePerfInsights.performanceMeasures['frame_chartDataQueryEnd'] = Date.now();
            }
            // check to see if component expects result of this query
            // and don't do anything in case subsequent query was issued
            // before receiving this query results
            if (this.props.sessionId !== kustoSessionId) {
                return;
            }
            kustoQueryTelemetry.fail(error, { message: 'Error get chart data for single VM at ComputeComparisonGrid.tsx' });
            this.setState({ isLoading: false, isError: true }, () => this.props.onQueryCompleted());
        });
    }


    /**
     * In the case where the query is done in the blade, process the data
     * @return void
     */
    private processBladeData(): void {
        let startDateTimeUtc = this.props.startDateTimeUtc;
        let endDateTimeUtc = this.props.endDateTimeUtc;
        let diskChartResult = this.props.bladeDiskChartResult;
        let joinedChartResult = this.props.bladeJoinedChartResult;

        if (!startDateTimeUtc) { throw new Error('Parameter @startDateTimeUtc may not be null'); }
        if (!endDateTimeUtc) { throw new Error('Parameter @endDateTimeUtc may not be null'); }
        if (!diskChartResult) { throw new Error('Parameter @diskChartResult may not be null'); }
        if (!joinedChartResult) { throw new Error('Parameter @joinedChartResult may not be null'); }

        if (!diskChartResult || !joinedChartResult) {
            throw new Error('Parameters @diskChartResult and @joinedChartResult may not be null');
        }

        if (!diskChartResult.error && !diskChartResult.result) {
            this.telemetry.logException(
                'Either @diskChartResult.error or @diskChartResult.result may not be null',
                'SingleComputeDiskGrid.processBladeData',
                ErrorSeverity.Error,
                {},
                undefined);

            return;
        }

        if (!joinedChartResult.error && !joinedChartResult.result) {
            this.telemetry.logException(
                'Either @joinedChartResult.error or @joinedChartResult.result may not be null',
                'SingleComputeDiskGrid.processBladeData',
                ErrorSeverity.Error,
                {},
                undefined);

            return;
        }

        const timeInterval: ITimeInterval = new TimeInterval(
            startDateTimeUtc,
            endDateTimeUtc,
            Constants.IdealAggregateChartDataPoints
        );

        let error = diskChartResult.error || joinedChartResult.error;
        if (error) {
            this.setState({ isLoading: false, isError: true }, () => this.props.onQueryCompleted());
            return;
        }

        const joinedMetricsQueryResults = joinedChartResult.result;
        const diskUsedQueryResults = diskChartResult.result;
        const chartData = {};

        VirtualMachineMetricCharts.SingleVmChartList.forEach(chart => {
            if (chart.chartId === VmMetricChartId.DiskUsed) {
                chartData[chart.chartId] =
                    this.kustoResponseInterpreter.getFlattenedSingleComputeDiskUsageChartData(
                        diskUsedQueryResults,
                        timeInterval);
            } else {
                chartData[chart.chartId] =
                    this.kustoResponseInterpreter.getFlattenedChartData(
                        joinedMetricsQueryResults,
                        chart.counters,
                        timeInterval);
            }
        });

        this.setState({ isLoading: false, isError: false, chartData: chartData }, () => this.props.onQueryCompleted());
    }

    /**
     * Creates and starts kusto queries for charting data
     * @param queryProps properties of the query (filters)
     */
    private getQueryPromiseList(
        queryProps: Readonly<ISingleComputeChartPaneProps>,
        timeInterval: Readonly<ITimeInterval>,
        baseQueryOption: IKustoQueryOptions
    ): { promisesList: Promise<any>[], requestIdList: string[] } {
        if (!queryProps) { throw new Error('Parameter @queryProps may not be null'); }
        if (!timeInterval) { throw new Error('Parameter @queryProps.timeInterval may not be null'); }
        if (!queryProps.workspace && !queryProps.workspace.id) { throw new Error('Parameter @queryProps.workspaceId may not be null'); }
        if (!(queryProps.computerName || queryProps.resourceId)) {
            throw new Error('At least one of @queryProps.computerName or @queryProps.resourceId must not be null');
        }

        const queryInsightsMetrics: boolean = this.props.featureFlags[Constants.FeatureMap.enableInsightsMetricsQuery];
        const joinedChartChartName = 'singleVMPerf.JoinedMetrics-Charts';
        const usedDiskChartName = 'singleVMPerf.DiskUsed-Chart';
        const bladeName: string = this.props.resourceId?.toLowerCase().indexOf('virtualmachinescalesets') ?
            ApiClientRequestInfoBladeName.VmssInstance : ApiClientRequestInfoBladeName.Vm;
        const joinedChartQueryOption: IKustoQueryOptions = Object.assign({
            requestInfo: new ApiClientRequestInfo({
                queryName: joinedChartChartName,
                bladeName,
                isInitialBladeLoad: this.props.isDefaultExperienceOfBlade && this.isInitialQuery
            }),
            requestId: GUID().toLowerCase()
        }, baseQueryOption);

        const diskUsedChartQueryOption: IKustoQueryOptions = Object.assign({
            requestInfo: new ApiClientRequestInfo({
                queryName: usedDiskChartName,
                bladeName,
                isInitialBladeLoad: this.props.isDefaultExperienceOfBlade && this.isInitialQuery
            }),
            requestId: GUID().toLowerCase()
        }, baseQueryOption);

        const baseLogProperties = {
            workspaceId: queryProps.workspace && queryProps.workspace.id,
            computerName: queryProps.computerName,
            resourceId: queryProps.resourceId,
            sessionId: this.props.sessionId,
            startDateTimeUtc: timeInterval.getBestGranularStartDate().toISOString(),
            endDateTimeUtc: timeInterval.getBestGranularEndDate().toISOString()
        };

        const joinedChartProperties = Object.assign({ requestId: joinedChartQueryOption.requestId }, baseLogProperties);
        const diskUsedProperties = Object.assign({ requestId: diskUsedChartQueryOption.requestId }, baseLogProperties);

        const joinedMetricsQueryTelemetry = this.telemetry.startLogEvent(
            `${this.props.logPrefix}.QueryJoinedMetrics-Charts`,
            joinedChartProperties,
            undefined
        );
        const diskUsedQueryTelemetry = this.telemetry.startLogEvent(
            `${this.props.logPrefix}.QueryDiskUsed-Chart`,
            diskUsedProperties,
            undefined
        );
        this.isInitialQuery = false;
        // start queries
        const joinedMetricsQuery = this.dataProvider.getSingleVMMetricData(
            queryProps.workspace,
            queryProps.computerName,
            queryProps.resourceId,
            timeInterval,
            joinedChartQueryOption,
            queryInsightsMetrics)
            .then((results) => { joinedMetricsQueryTelemetry.complete(results.TelemetryProps); return results; })
            .catch((error) => {
                joinedMetricsQueryTelemetry.fail(error, {
                    message: 'Error get singleVMPerf.JoinedMetrics-Charts in SingleComputeChartPane.tsx'
                });
                throw error;
            });

        const diskUsedQuery = this.dataProvider.getSingleVMDiskUsageChartData(
            queryProps.workspace,
            queryProps.computerName,
            queryProps.resourceId,
            timeInterval,
            diskUsedChartQueryOption,
            queryInsightsMetrics)
            .then((results) => { diskUsedQueryTelemetry.complete(results.TelemetryProps); return results; })
            .catch((error) => {
                diskUsedQueryTelemetry.fail(error, { message: 'Error get singleVMPerf.DiskUsed-Chart in SingleComputeChartPane.tsx' });
                throw error;
            });

        return {
            promisesList: [joinedMetricsQuery, diskUsedQuery],
            requestIdList: [joinedChartQueryOption.requestId, diskUsedChartQueryOption.requestId]
        };
    }
}
