/**
 * 3rd party
 */
import * as React from 'react';
import { 
    ChartSeriesData, 
    Aggregation, 
    InteractionsStore,
    GUID
} from '@appinsights/aichartcore';

/**
 * shared
 */
import { TimeInterval, ITimeInterval } from '../shared/data-provider/TimeInterval';
import { StringHelpers } from '../shared/Utilities/StringHelpers';
import { MessagingProvider } from '../shared/MessagingProvider';
import { TelemetrySubArea, ITelemetry, TelemetryMainArea } from '../shared/Telemetry';
import { TelemetryFactory } from '../shared/TelemetryFactory';
import { InitializationInfo, AuthorizationTokenType } from '../shared/InitializationInfo';

import { ICommonContainerTabProps } from '../container/shared/ICommonContainerTabProps';
import * as Constants from '../shared/GlobalConstants';
import { MultiLineChart } from '../shared/MultiLineChart';
import { MetricSeriesSelector } from '../shared/MetricSeriesSelector';
import { ISeriesSelectorOption } from '../shared/ISeriesSelectorOption';
import { palette } from  '../shared/AzureColors';
import { ErrorSeverity } from '../shared/data-provider/TelemetryErrorSeverity';
import { HttpRequestError } from '../shared/data-provider/HttpRequestError';

/**
 * local
 */
import { IContainerMetricChartDescriptor } from '../container/ContainerMetricChart';
import { SFMeshMetricChart, StatusCountMetricSeries, SFMeshMetricChartId } from './SFMeshMetricChart';
/**
 * Styles
 */
import '../../styles/shared/ChartPane.less'
import '../../styles/shared/ChartPane.less'
import '../../styles/shared/ChartHeader.less'
import '../../styles/shared/SeriesSelector.less'
import { ArmDataProvider } from '../shared/data-provider/v2/ArmDataProvider';
import { MdmArmDataProvider, IMdmQueryOptions } from '../shared/data-provider/v2/MdmDataProvider';
import { EnvironmentConfig, AzureCloudType } from '../shared/EnvironmentConfig';
import { AggregationOption } from '../shared/AggregationOption';
import { DisplayStrings } from '../shared/DisplayStrings';

/**
 * Valid filter options
 */
export enum FilterBy {
    status = 'Status eq \'*\'',
    replica = 'ServiceInstance eq \'*\'',
    service = 'ServiceName eq \'*\''
}

/**
 * Component properties
 */
interface IApplicationPaneProps extends ICommonContainerTabProps {
    /** data for the charts organized by chart id / series id */
    chartData: StringMap<StringMap<ChartSeriesData>>;

    /** selections specifying which series to display out of all available in chart data */
    seriesSelections: StringMap<any>;

    /** callback to invoke when chart data is loaded from the store */
    onChartDataLoaded: (chartData: StringMap<StringMap<ChartSeriesData>>) => void;

    /** callback to onvoke when selections are changed */
    onSeriesSelectionsChanged: (chartId: string, newSelections: any) => void;

    /** Messaging provider to communicate to hosting blade */
    messagingProvider: MessagingProvider;

    /** callback to invoke when the tab content loading status changes */
    onTabContentLoadingStatusChange: (isLoading: boolean) => void;
}

/**
 * Component state
 */
interface IApplicationPaneState {
    /** true if data for the pane is being loaded */
    isLoading: boolean;

    /** true if data loading failed */
    isError: boolean;

    /** time interval for which the data is being displayed */
    timeInterval: ITimeInterval;
}



/**
 * Visual component displaying cluster-level infromation
*/
export class ApplicationPane extends React.Component<IApplicationPaneProps, IApplicationPaneState> {
    /** data provider */
    private dataProvider: MdmArmDataProvider;

    /** chart interation store */
    private interactionStore: InteractionsStore;

    /** telemetry provider */
    private telemetry: ITelemetry;

    /** Current time interval */
    /** TODO: move to state */
    private timeInterval: TimeInterval;
    /**
     * Component constructor
     * @param props initial set of properties
     */
    constructor(props: IApplicationPaneProps) {
        super(props);

        /** TODO: add preloading/restructuring to mesh page so this is unnecessary */
        if (!EnvironmentConfig.Instance().isConfigured()) {
            EnvironmentConfig.Instance().initConfig(AzureCloudType.Public, EnvironmentConfig.Instance().isMPACLegacy());
        }

        this.telemetry = TelemetryFactory.get(TelemetryMainArea.SFMesh);
        this.telemetry.setContext({ subArea: TelemetrySubArea.SFMesh }, false);
        this.telemetry.logPageView(TelemetrySubArea.SFMesh.toString());

        this.state = {
            isLoading: true,
            isError: false,
            timeInterval: null
        };

        this.interactionStore = new InteractionsStore(null);

        this.dataProvider = new MdmArmDataProvider(
            new ArmDataProvider(
                EnvironmentConfig.Instance().getARMEndpoint(),
                () => { return InitializationInfo.getInstance().getAuthorizationHeaderValue(AuthorizationTokenType.Arm) }         
            )

            );
        this.onToggleChartSeriesOption = this.onToggleChartSeriesOption.bind(this);
    }

    public componentDidUpdate(prevProps: Readonly<IApplicationPaneProps>): void {
        if (this.needRequeryChartsData(prevProps)) {
            this.getData(this.props);
        }
    }

    /**
     * Renders component
     * @returns {JSX.Element} component visual
     * same as our renderCharts
     */
    public render(): JSX.Element {
        const grainDisplayName = this.getGrainDisplayName();

        const charts = new Array<JSX.Element>();

        let chartDescriptorList = SFMeshMetricChart.list() || [];
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
        } else if (this.props.chartData === undefined) {
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
     * Provides title to display chart granularity
     */
    private getGrainDisplayName(): string {
        let timeGrain: string = '';
        if (this.timeInterval) {
            timeGrain = this.timeInterval.getGrainKusto();
        }

        return StringHelpers.replaceAll(DisplayStrings.AggregateGranularitySubtitle, '{0}', timeGrain);
    }

    /**
     * Checks to see if data needs to be re-queried from store based on property changes
     * @param nextProps new set of properties
     * @returns true if data needs to be re-queried
     */
    private needRequeryChartsData(prevProps: IApplicationPaneProps): boolean {
        return (
            (this.props.startDateTimeUtc !== prevProps.startDateTimeUtc) ||
            (this.props.endDateTimeUtc !== prevProps.endDateTimeUtc) ||
            (this.props.workspace !== prevProps.workspace) ||
            (this.props.clusterName !== prevProps.clusterName) ||
            (this.props.hostName !== prevProps.hostName) ||
            (this.props.serviceName !== prevProps.serviceName) ||
            (this.props.nameSpace !== prevProps.nameSpace)
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
        return (
            <div className='chartRoot'>
                <div className='chart-header'>
                    <div>
                        <h2>{chartDescriptor.chartDisplayName}</h2>
                        {grainDisplayName ? <div className='subTitle'>{grainDisplayName}</div> : <div className='subTitle'>&nbsp;</div>}
                    </div>
                    {seriesSelector}
                </div>
                <MultiLineChart
                    timeInterval={this.timeInterval}
                    isLoading={this.state.isLoading}
                    isError={customErrorPane != null}
                    customErrorElement={customErrorPane}
                    data={this.props.chartData[chartDescriptor.chartId]}
                    selectedSeries={this.getPerformanceMetricSelectedSeries(
                        this.props.chartData[chartDescriptor.chartId],
                        this.props.seriesSelections[chartDescriptor.chartId])}
                    visualization={chartDescriptor.visualization}
                    interactionStore={this.interactionStore}
                />
            </div>
        );
    }

    /** nearly identical to containerclusterpane
     * Creates chart data series selection control
     * @param chartDescriptor chart descriptor
     */
    private getSeriesSelector(chartDescriptor: IContainerMetricChartDescriptor) {
        if (!chartDescriptor) { throw new Error('Parameter @chartDescriptor may not be null'); }

        if (this.props.seriesSelections[chartDescriptor.chartId][0].id) {
            return (
                <MetricSeriesSelector
                    selectorId={chartDescriptor.chartId}
                    seriesOptions={this.props.seriesSelections[chartDescriptor.chartId]}
                    onToggleOption={this.onToggleChartSeriesOption}
                />
            );
        } else { // if there are no selections, don't render them
            return undefined;
        }
    }

    /** identical to containerclusterpane
     * Callback invoked when series selection is changed for cluster performance metric (cpu or memory)
     * @param chartId chart/metric id
     * @param optionId option id to toggle
     */
    private onToggleChartSeriesOption(chartId: string, optionId: string): void {
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

    /** Small changes from containercluster (different format for series options)
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
                    if (availableSeries[0] === '$') { // Signifier for charts without series selection
                        selectedSeries.push(availableSeries);
                    }
                    if (seriesOptions[i].isSelected &&
                        (availableSeries.split('#')[0] === seriesOptions[i].id)) {
                            selectedSeries.push(availableSeries);
                    }
                }
            }
        }

        return selectedSeries;
    }

    /**
     * Uses the data provider to query MDM
     * @param queryProps Properties related to the query
     */
    private runQuery(
        queryMetric: string, 
        queryOptions: IMdmQueryOptions
    ): Promise<any> {
        // Return a promise for the query
        return this.dataProvider.executeQuery(
            this.props.clusterName, // Resource ID
            queryMetric,
            this.timeInterval,
            Constants.MaxArmRequestTimeoutMs,
            queryOptions
        );
    }

    /** 
     * Borrowed from KustoChartResponseInterpreter
     * Minor modifications
     */
    private getSummary(series: any): number {
        if (!series || series.length === 0) {
            return 0;
        }
        let total = 0;
        series.forEach((dp: any) => {
            total += dp.value;
        });

        return total / series.length;
    }

    private getAppName(): string {
        let path = this.props.clusterName.split('/');
        return path[path.length - 1];
    }

    /**
     * Adds a metric with proper formatting
     * @param metricname Name of the metric
     * @param series Timeseries of the metric
     * @param queryData data returned from query
     * @param chartData data intended for chart
     */
    private addMetric(
        metricName: string,
        displayName: string, 
        series: any, 
        queryData: any, 
        chartData: StringMap<ChartSeriesData>, 
        aggregation: string,
        paletteShiftIndex: number
    ): void {
        chartData[metricName] = { // add in the metric metadata
            metricUniqueId: metricName.split('#')[0], // used for toggling lines on/off
            metricResults: {
                metricId: {
                    resourceDefinition: {
                        id: this.getAppName() // legend subtitle
                    },
                    name: {
                        id: displayName // Name of the metric in the legend
                    }
                },
                startTime: new Date(queryData.timespan.split('/')[0]),
                endTime: new Date(queryData.timespan.split('/')[1]),
                timeGrain: queryData.interval,
                aggregation: Aggregation.Avg,
                data: [{ dataPoints: [] }]
            },
            visualization: { color: palette[(paletteShiftIndex) % palette.length] }
        };

        let dpoints: any = chartData[metricName].metricResults.data[0].dataPoints;

        for (const point in series.data) {
            if (series.data[point].hasOwnProperty(aggregation)) {
                dpoints.push({
                    timestamp: new Date(series.data[point].timeStamp),
                    value: series.data[point][aggregation]
                });
            }
        }

        chartData[metricName].metricResults.data[0].summary = this.getSummary(dpoints);
    }
    
    /**
     * Converts MDM metrics format to that used by our charts framework
     * @param queryData response to query
     * @param additionalQueryData response to secondary query if necessary
     * @returns data formatted for chart builder
     */
    private handleStatusData(queryData: any): any {
        const self = this;
        let converted: StringMap<ChartSeriesData> = {};
        let shiftIndex: number = 0;

        this.addMetric(
            StatusCountMetricSeries.Total, 
            StatusCountMetricSeries.Total,
            queryData[1].value[0].timeseries[0], 
            queryData[1], 
            converted,
            'average',
            shiftIndex
        );
        shiftIndex++;
        
        queryData[0].value[0].timeseries.forEach(function (series) {
            self.addMetric(
                series.metadatavalues[0].value.toLowerCase(), 
                series.metadatavalues[0].value,
                series, 
                queryData[0], 
                converted,
                'average',
                shiftIndex
            );
            shiftIndex++;
        });

        return converted;
    }

    private handlePerfData(queryData: any): any {
        let converted: StringMap<ChartSeriesData> = {};

        // Used for variable property fields on MDM response
        const aggregation: string[] = ['minimum', 'average', 'maximum'];

        // Used for tag-based toggling of lines
        const aggOptions: AggregationOption[] = [AggregationOption.Min, AggregationOption.Avg, AggregationOption.Max];

        let shiftIndex: number = 0; // Selects unique colors for lines

        // Run through every type of aggregation
        for (let aggIndex: number = 0; aggIndex < queryData.length; aggIndex++) {
            //Run through every service
            for (let serviceIndex: number = 0; serviceIndex < queryData[aggIndex].value[0].timeseries.length; serviceIndex++) {
                let serviceName: string = queryData[aggIndex].value[0].timeseries[serviceIndex].metadatavalues[0].value.split('/').pop();
                this.addMetric(
                    aggOptions[aggIndex] + '#' + serviceName, 
                    serviceName,
                    queryData[aggIndex].value[0].timeseries[serviceIndex], 
                    queryData[aggIndex], 
                    converted,
                    aggregation[aggIndex],
                    shiftIndex
                );
                shiftIndex++;
            }
        }
        return converted;
    }

    private handleReplicaData(queryData: any) {
        const self = this;
        let converted: StringMap<ChartSeriesData> = {};
        let shiftIndex: number = 0;

        queryData.value[0].timeseries.forEach(function (series) {
            // The name of the service is at the end of the path given by MDM
            const serviceName: string = series.metadatavalues[0].value.split('/').pop();
            self.addMetric(
                '$' + serviceName, 
                serviceName,
                series, 
                queryData, 
                converted,
                'average',
                shiftIndex
            );
            shiftIndex++;
        });

        return converted;
    }

    /**
     * Start queries and load responses
     */
    private getData(queryProps: Readonly<IApplicationPaneProps>): void {
        if (!queryProps) { throw new Error('Parameter @queryProps may not be null or undefined'); }
        let self = this;

        // Specifics of the query
        let statusQueryOptions: IMdmQueryOptions = {
            filter: FilterBy.status,
            aggregation: 'Average' // Total for now while metrics are broken
        }

        this.timeInterval = new TimeInterval(
            queryProps.startDateTimeUtc,
            queryProps.endDateTimeUtc,
            60,
            undefined,
            true
        );

        const cpuQueryTelemetry = this.telemetry.startLogEvent(
            'SFMeshApplicationCharts-Cpu-Load',
            {
                applicationResourceId: queryProps.clusterName,
                isTimeRelative: queryProps.isTimeRelative.toString(),
                startDateTimeUtc: queryProps.startDateTimeUtc.toISOString(),
                endDateTimeUtc: queryProps.endDateTimeUtc.toISOString(),
                requestId: GUID().toLowerCase(),
            },
            undefined
        );
        
        const memQueryTelemetry = this.telemetry.startLogEvent(
            'SFMeshApplicationCharts-Mem-Load',
            {
                applicationResourceId: queryProps.clusterName,
                isTimeRelative: queryProps.isTimeRelative.toString(),
                startDateTimeUtc: queryProps.startDateTimeUtc.toISOString(),
                endDateTimeUtc: queryProps.endDateTimeUtc.toISOString(),
                requestId: GUID().toLowerCase(),
            },
            undefined
        );

        const replicaQueryTelemetry = this.telemetry.startLogEvent(
            'SFMeshApplicationCharts-Replica-Load',
            {
                applicationResourceId: queryProps.clusterName,
                isTimeRelative: queryProps.isTimeRelative.toString(),
                startDateTimeUtc: queryProps.startDateTimeUtc.toISOString(),
                endDateTimeUtc: queryProps.endDateTimeUtc.toISOString(),
                requestId: GUID().toLowerCase(),
            },
            undefined
        );

        const statusQueryTelemetry = this.telemetry.startLogEvent(
            'SFMeshApplicationCharts-Status-Load',
            {
                applicationResourceId: queryProps.clusterName,
                isTimeRelative: queryProps.isTimeRelative.toString(),
                startDateTimeUtc: queryProps.startDateTimeUtc.toISOString(),
                endDateTimeUtc: queryProps.endDateTimeUtc.toISOString(),
                requestId: GUID().toLowerCase(),
            },
            undefined
        );

        /** Run the MDM query for cpu */
        let cpuQuery: Promise<any> = Promise.all([
            this.runQuery(SFMeshMetricChartId.Cpu, {filter: FilterBy.service, aggregation: 'Minimum'}),
            this.runQuery(SFMeshMetricChartId.Cpu, {filter: FilterBy.service}),
            this.runQuery(SFMeshMetricChartId.Cpu, {filter: FilterBy.service, aggregation: 'Maximum'})
        ]).then((results) => {
            cpuQueryTelemetry.complete();
            return results;
        }).catch((error) => {
            cpuQueryTelemetry.complete({ isError: 'true' });
            this.reportQueryError('cpu usage', error, queryProps);
            throw(error);
        });
        
        /** Run the MDM query for memory */
        let memQuery: Promise<any> = Promise.all([
            this.runQuery(SFMeshMetricChartId.Memory, {filter: FilterBy.service, aggregation: 'Minimum'}),
            this.runQuery(SFMeshMetricChartId.Memory, {filter: FilterBy.service}),
            this.runQuery(SFMeshMetricChartId.Memory, {filter: FilterBy.service, aggregation: 'Maximum'})
        ]).then((results) => {
            memQueryTelemetry.complete();
            return results;
        }).catch((error) => {
            memQueryTelemetry.complete({ isError: 'true' });
            this.reportQueryError('mem usage', error, queryProps);
            throw(error);
        });

        /** Run the MDM query for replica count */
        let serviceReplicaQuery: Promise<any> = this.runQuery(
            SFMeshMetricChartId.Status, 
            { filter: FilterBy.service }
        ).then((results) => {
            replicaQueryTelemetry.complete();
            return results;
        }).catch((error) => {
            replicaQueryTelemetry.complete({ isError: 'true' });
            this.reportQueryError('replica count', error, queryProps);
            throw(error);
        });
        
        /** Run the MDM query for container status */
        let containerStatusQuery: Promise<any> = Promise.all([
            this.runQuery(SFMeshMetricChartId.Status, statusQueryOptions),
            this.runQuery(SFMeshMetricChartId.Status, {})
        ]).then((results) => {
            statusQueryTelemetry.complete();
            return results;
        }).catch((error) => {
            statusQueryTelemetry.complete({ isError: 'true' });
            this.reportQueryError('container status', error, queryProps);
            throw(error);
        });
        

        /** When all queries resolve, trigger onChartDataLoaded and set the state */
        Promise.all([cpuQuery, memQuery, serviceReplicaQuery, containerStatusQuery]).then(function(responses) {
            let metricData = {};

            metricData[SFMeshMetricChartId.Cpu] = self.handlePerfData(responses[0]);
            metricData[SFMeshMetricChartId.Memory] = self.handlePerfData(responses[1]);
            metricData[SFMeshMetricChartId.Replica] = self.handleReplicaData(responses[2]);
            metricData[SFMeshMetricChartId.Status] = self.handleStatusData(responses[3]);
            
            self.props.onChartDataLoaded(metricData);
            self.setState({ isLoading: false, isError: false }, () => {
                self.props.onTabContentLoadingStatusChange(false);
            });
        }).catch((error) => {
            statusQueryTelemetry.complete({ isError: 'true' });
            this.reportQueryError('container status', error, queryProps);
            this.processQueryError(error, this.props.clusterName);
            throw(error);
        });
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
        queryProps: Readonly<IApplicationPaneProps>
    ): void {
        console.error('Failed to get "' + (queryTitle || '???') + '" data from the store', error);

        this.telemetry.logException(
            error,
            'ApplicationPane.tsx',
            ErrorSeverity.Error,
            this.getDropdownSelections(queryProps),
            undefined
        );
    }

    /**
     * Performs actions necessary for visualization of chart query failures
     * @param error error occurring on chart query
     * @param resourceId resource id for the query
     */
    private processQueryError(error: any, resourceId: string) {
        console.warn('Error while making query for charts data', error);

        if (!resourceId) { throw new Error('Parameter @resourceId may not be null or undefined'); }

        this.setState({ isLoading: false, isError: true }, () => this.props.onTabContentLoadingStatusChange(false));

        if (HttpRequestError.isAccessDenied(error)) {
            this.props.messagingProvider.bladeLoadFailure(`accessDenied`);

            let bladeName: string = 'MeshChartsQuery';
            const errorObj = {
                errorMessage: 'Redirected to hosting blade: Ajax request access denied',
                resourceId,
                bladeName
            };
    
            throw new Error(JSON.stringify(errorObj));
        }
    }

    /**
     * Dropdown info required for query
     * @param queryProps the current set of props in a component when a query is executed
     */
    private getDropdownSelections(queryProps: Readonly<IApplicationPaneProps>): StringMap<string> {
        if (!queryProps) { throw new Error('Parameter @queryProps may not be null'); }

        return {
            application_id: this.props.clusterName || queryProps.clusterName,
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
}
