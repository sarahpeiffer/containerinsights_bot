import * as React from 'react';
import { ChartSeriesData, InteractionsStore } from '@appinsights/aichartcore';
import { Promise } from 'es6-promise';

import * as Constants from './Constants';
import { ICommonComputeTabProps } from './ICommonComputeTabProps';
import { KustoChartResponseInterpreter } from './data-provider/KustoChartResponseInterpreter';
import { VmInsightsDataProvider } from './data-provider/VmInsightsDataProvider';
import { VirtualMachineMetricCharts, IAggregateVmMetricChartDescriptor } from './VirtualMachineMetricCharts';
import { MessagingProvider } from '../shared/MessagingProvider';
import { ComputeChartToolTipWrapper } from './ComputeChartPaneToolTipBody';

import * as GlobalConstants from '../shared/GlobalConstants';
import { DisplayStrings, KustoGrainDisplay } from '../shared/DisplayStrings';
import { ARMDataProvider } from '../shared/data-provider/ARMDataProvider';
import { KustoDataProvider, IKustoQueryOptions, DraftQueryResponse } from '../shared/data-provider/KustoDataProvider';
import { MultiLineChart } from '../shared/MultiLineChart';
import { StringMap } from '../shared/StringMap';
import { ComputerGroupType, ComputerGroup } from '../shared/ComputerGroup';
import { ISeriesSelectorOption } from '../shared/ISeriesSelectorOption';
import { MetricSeriesSelector } from '../shared/MetricSeriesSelector';
import { StringHelpers } from '../shared/Utilities/StringHelpers';
import { ITimeInterval, TimeInterval } from '../shared/data-provider/TimeInterval';
import { ITelemetry, TelemetryMainArea } from '../shared/Telemetry'
import { VmInsightsTelemetryFactory } from '../shared/VmInsightsTelemetryFactory';
import { QueryOnSelectHelper } from './shared/QueryOnSelectHelper';
import { ComputeKustoQueryOptions } from './shared/ComputeKustoQueryOptions';
import { ColumnsSvg } from '../shared/svg/columns';
import { ChartUtility, IGetChangeSelectionResult } from './shared/chart/ChartUtility';
import { AtScaleUtils } from './shared/AtScaleUtils';
import { ChartIcon } from './shared/chart/ChartIcon';
import { PinSVG } from '../shared/svg/pin';
import { SolutionType } from './shared/ControlPanelUtility';
import { ApiClientRequestInfoBladeName } from '../shared/data-provider/ApiClientRequestInfo';

import '../../styles/shared/ChartPane.less';
import '../../styles/compute/ChartPane.less';
import '../../styles/shared/ChartHeader.less';
import '../../styles/shared/SeriesSelector.less';

export interface IComputeChartPaneProps extends ICommonComputeTabProps {
    chartData: StringMap<StringMap<ChartSeriesData>>;
    seriesSelections: StringMap<ISeriesSelectorOption[]>;
    messagingProvider: MessagingProvider;
    isPaneVisible: boolean;
    logPrefix: string;
    featureFlags: StringMap<boolean>;
    enablePinToDashboard: boolean;
    vmScaleSetResourceId?: string;
    onSeriesSelectionsChanged: (chartId: string, optionId: string, isOptionSelected: boolean, newSelections: any) => void;
    onChartDataLoaded: (chartData: StringMap<StringMap<ChartSeriesData>>) => void;
    openTableTab(requestedMetric: string): void;
    pinToDashboard(chartId: string, showOptionPicker: boolean): void;
}

export interface IComputeChartPaneState {
    isLoading: boolean;
    isError: boolean;
    timeInterval: ITimeInterval
}

export class ComputeChartPane extends React.Component<IComputeChartPaneProps, IComputeChartPaneState> {
    private dataProvider: VmInsightsDataProvider;
    private telemetry: ITelemetry;
    private kustoResponseInterpreter: KustoChartResponseInterpreter;

    private kustoRequestId: string = '';
    private interactionStore: InteractionsStore;
    private isInitialQuery: boolean = true;

    // Helper to evaluate when we need to query based on selection
    private queryOnSelectHelper: QueryOnSelectHelper = new QueryOnSelectHelper();

    constructor(props: IComputeChartPaneProps) {
        super(props);

        this.dataProvider = new VmInsightsDataProvider(
            new KustoDataProvider(new ARMDataProvider(), GlobalConstants.VMInsightsApplicationId));

        this.kustoResponseInterpreter = new KustoChartResponseInterpreter();
        this.interactionStore = new InteractionsStore(undefined);

        this.telemetry = VmInsightsTelemetryFactory.get(TelemetryMainArea.Compute);
        this.onToggleChartSeriesOption = this.onToggleChartSeriesOption.bind(this);

        this.state = {
            isLoading: true,
            isError: false,
            timeInterval: new TimeInterval(
                this.props.startDateTimeUtc,
                this.props.endDateTimeUtc,
                Constants.IdealAggregateChartDataPoints)
        }
    }

    public componentWillMount(): void {
        if (this.needRequeryChartsData(this.props)) {
            this.queryChartsData(this.props);
        }
    }

    public componentWillReceiveProps(nextProps: Readonly<IComputeChartPaneProps>, nextContext: any): void {
        if (this.needRequeryChartsData(nextProps)) {
            this.queryChartsData(nextProps);
        }
    }

    public render(): JSX.Element {
        if (!this.props.isPaneVisible) {
            return <div />;
        }

        const grainDisplayName = this.getGrainDisplayName();
        const charts = new Array<JSX.Element>();
        const chartDescriptorList = VirtualMachineMetricCharts.AggregateVmChartList || [];

        for (const chartDescriptor of chartDescriptorList) {
            const chartElement = this.renderChart(
                chartDescriptor,
                this.getSeriesSelector(chartDescriptor),
                grainDisplayName
            );

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
    private getSeriesSelector(chartDescriptor: IAggregateVmMetricChartDescriptor) {
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
     * Callback invoked when series selection is changed for charts
     * @param chartId chart/metric id
     * @param optionId option id to toggle
     */
    private onToggleChartSeriesOption(chartId: string, optionId: string): void {
        const result: IGetChangeSelectionResult = ChartUtility.GetChangeSelectionResult(this.props.seriesSelections[chartId], optionId);
        this.props.onSeriesSelectionsChanged(chartId, optionId, result.isOptionSelected, result.newSelections);
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
     * @param seriesSelector series selector component
     * @param grainDisplayName granularity display name
     */
    private renderChart(
        chartDescriptor: IAggregateVmMetricChartDescriptor,
        seriesSelector: JSX.Element,
        grainDisplayName: string
    ): JSX.Element {
        if (!chartDescriptor) { return null; }

        const chartAriaHeaderID: string = 'chartHeaderAriaLabel' + chartDescriptor.chartId;
        const data: StringMap<ChartSeriesData> = this.props.chartData[chartDescriptor.chartId];
        const tooltip = new ComputeChartToolTipWrapper(chartDescriptor, data, this.state.timeInterval);

        const hyperlinks: JSX.Element[] = [];
        hyperlinks.push(<ChartIcon
            action={() => { this.props.openTableTab(chartDescriptor.metricId) }}
            icon={ColumnsSvg}
            title={DisplayStrings.ColumnsSvg}
        />);
        hyperlinks.push(<ChartIcon
            isDisabled={!this.props.enablePinToDashboard}
            action={() => { this.props.pinToDashboard(chartDescriptor.chartId, true) }}
            icon={PinSVG}
            title={DisplayStrings.PinSvg}
        />);

        return (
            <div key={chartDescriptor.chartId} className='chartRoot'>
                <div className='chart-header'>
                    <div aria-label={chartDescriptor.chartDisplayName}
                        id={chartAriaHeaderID}
                        className='heading'>
                        <h2>{chartDescriptor.chartDisplayName}</h2>
                        {grainDisplayName ? <div className='subTitle'>{grainDisplayName}</div> : <div className='subTitle'>&nbsp;</div>}
                    </div>
                    {seriesSelector}
                    <div className='hyperlinks'>{hyperlinks}</div>
                </div>
                <MultiLineChart
                    timeInterval={this.state.timeInterval}
                    isLoading={this.state.isLoading}
                    isError={this.state.isError}
                    data={data}
                    selectedSeries={this.getMetricSelectedSeries(data, this.props.seriesSelections[chartDescriptor.chartId])}
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

    private needRequeryChartsData(nextProps: IComputeChartPaneProps): boolean {
        return this.queryOnSelectHelper.needsRequeryNow(
            nextProps.isPaneVisible,
            () => {
                return (this.props.startDateTimeUtc !== nextProps.startDateTimeUtc) ||
                    (this.props.endDateTimeUtc !== nextProps.endDateTimeUtc) ||
                    !AtScaleUtils.areWorkspacesEqual(this.props.workspace, nextProps.workspace) ||
                    (this.props.computerGroup?.id !== nextProps.computerGroup?.id) ||
                    !AtScaleUtils.areAzureResourcesEqual(this.props.azureResourceInfo, nextProps.azureResourceInfo) ||
                    (this.props.azureResourceType !== nextProps.azureResourceType) ||
                    (this.props.solutionType !== nextProps.solutionType);
            });
    }

    private getLogProperties(
        queryProps: Readonly<IComputeChartPaneProps>,
        requestId: string
    ): StringMap<string> {
        const properties: StringMap<string> = {};
        properties['workspaceId'] = queryProps.workspace && queryProps.workspace.id;
        properties['startDateTimeUtc'] = queryProps.startDateTimeUtc.toISOString();
        properties['endDateTimeUtc'] = queryProps.endDateTimeUtc.toISOString();
        properties['requestId'] = requestId;
        properties['resourceId'] = this.props.azureResourceInfo && this.props.azureResourceInfo.id;
        properties['resourceType'] = queryProps.azureResourceType;

        if (queryProps.computerGroup) {
            properties['group_type'] = ComputerGroupType[queryProps.computerGroup.groupType];
            properties['group_id'] = queryProps.computerGroup.id;
        }

        return properties;
    }

    private queryChartsData(queryProps: Readonly<IComputeChartPaneProps>): Promise<any> {
        if (!AtScaleUtils.validatePropsToQueryData(queryProps)) {
            return new Promise(() => { });
        }

        const eventName = `${this.props.logPrefix}.QueryAllAggregateCharts`;

        (window as any).atScaleComputePerfInsights.performanceMeasures['frame_chartDataQueryStart'] = Date.now();

        const queryOption: IKustoQueryOptions = new ComputeKustoQueryOptions(
            {
                queryName: eventName,
                bladeName: queryProps.vmScaleSetResourceId ? ApiClientRequestInfoBladeName.Vmss : ApiClientRequestInfoBladeName.AtScale,
                isInitialBladeLoad: queryProps.isDefaultExperienceOfBlade && this.isInitialQuery
            },
            queryProps.startDateTimeUtc,
            queryProps.endDateTimeUtc,
            Constants.IdealAggregateChartDataPoints);
        this.kustoRequestId = queryOption.requestId;

        this.setState({ isLoading: true, isError: false, timeInterval: queryOption.timeInterval });

        const properties = this.getLogProperties(queryProps, queryOption.requestId);

        const telemetryContext = this.telemetry.startLogEvent(eventName, properties, undefined);

        let azureResourceId: string = AtScaleUtils.getAzureResourceId(queryProps);
        let azureResourceType: string = AtScaleUtils.getAzureResourceType(queryProps.azureResourceType);
        const computerGroup: ComputerGroup = queryProps.solutionType === SolutionType.Hybrid ? queryProps.computerGroup : undefined;
        const queryInsightsMetrics: boolean = this.props.featureFlags[Constants.FeatureMap.enableInsightsMetricsQuery];
        this.isInitialQuery = false;
        return this.dataProvider.getAggregateMetricData(
            queryProps.workspace,
            computerGroup,
            queryOption.timeInterval,
            queryOption,
            azureResourceId || queryProps.vmScaleSetResourceId,
            azureResourceType,
            queryInsightsMetrics
        ).then((result) => {
            (window as any).atScaleComputePerfInsights.performanceMeasures['frame_chartDataQueryEnd'] = Date.now();

            if (queryOption.requestId === this.kustoRequestId) {
                if (this.dataProvider.isEmptyCharts([result])) {
                    const customTelemetryProps: StringMap<string> = Object.assign({ message: 'Empty charts' }, result.TelemetryProps);
                    telemetryContext.complete(customTelemetryProps);
                } else {
                    telemetryContext.complete(result.TelemetryProps);
                }
                // todo bb: refactor queries to use metric name vs. hardcoded string
                // todo bb: refactor not to use UX props
                const chartData = {};

                const mergedChartData = this.kustoResponseInterpreter.mergeAggregateComputerChart(result);

                VirtualMachineMetricCharts.AggregateVmChartList.forEach(chart => {
                    chartData[chart.chartId] =
                        this.kustoResponseInterpreter.getFlattenedChartData(
                            mergedChartData,
                            chart.counters,
                            queryOption.timeInterval);
                });

                queryProps.onChartDataLoaded(chartData);

                this.setState({ isLoading: false, isError: false });
            }
        }).catch((error) => {
            (window as any).atScaleComputePerfInsights.performanceMeasures['frame_chartDataQueryEnd'] = Date.now();
            // check to see if component expects result of this query
            // and don't do anything in case subsequent query was issued
            // before receiving this query results
            if (queryOption.requestId === this.kustoRequestId) {
                this.props.onChartDataLoaded({});
                telemetryContext.fail(error, { message: 'Error in getting AggregateMetric data'});
                const response: DraftQueryResponse = new DraftQueryResponse(undefined, error);
                this.setState({ isLoading: false, isError: !!response.Error });
            }
        });
    }
}
