import * as React from 'react';
import * as $ from 'jquery';

import * as msg from '../shared/MessagingProvider';
import { DisplayStrings } from '../shared/DisplayStrings';

import { TimeData, TimeValues } from '@appinsights/pillscontrol-es5';
import { isRelative } from '@appinsights/pillscontrol-es5/dist/TimeUtils';

import { SingleComputeDiskGrid } from './SingleComputeDiskGrid';
import * as Constants from './Constants';

import { InitializationInfo, AuthorizationTokenType } from '../shared/InitializationInfo';
import { LoadingSvg } from '../shared/svg/loading';
import { SingleComputeChartPane } from './SingleComputeChartPane';
import { VirtualMachineMetricCharts } from './VirtualMachineMetricCharts';
import { IDetailsPanel } from '../shared/property-panel/IDetailsPanel';
import { DetailsPane } from '../shared/property-panel/DetailsPane';

import { SearchSVG } from '../shared/svg/search';
import { PropertiesSVG } from '../shared/svg/properties';

import { MapCacheProvider } from './shared/admmaps-wrapper/MapCacheProvider';
import { MapProviderV3 } from './data-provider/MapProviderV3';
import { TelemetryMainArea, ITelemetry, IFinishableTelemetry } from '../shared/Telemetry';
import { PropertyPanelSelector } from './shared/property-panel/entity-properties/PropertyPanelSelector';
import { LogEventPanel } from './shared/property-panel/LogEventPanel';
import { TimeInterval } from '../shared/data-provider/TimeInterval';
import { VmInsightsTelemetryFactory } from '../shared/VmInsightsTelemetryFactory';
import { TelemetryUtils } from './shared/TelemetryUtils';
import { ISeriesSelectorOption } from '../shared/ISeriesSelectorOption';
import { UnmonitoredMachinePropertyPanel } from './shared/property-panel/entity-properties/UnmonitoredMachinePropertyPanel';
import { GUID } from '../../../node_modules/@appinsights/aichartcore';
import { AppInsightsProvider } from '../shared/CustomAppInsightMessagingProvider';
import { ISinglePerfQueryResults } from '../shared/BladeQuery';
import { ErrorSeverity } from '../shared/data-provider/TelemetryErrorSeverity';
import { AlertSVG } from '../shared/svg/alert';
import { IWorkspaceInfo } from '../shared/IWorkspaceInfo';
import { SingleVmPinChartToDashboardMessage } from '../shared/MessagingProvider';
import { SingleControlPanel } from './shared/control-panel/SingleControlPanel';
import { EnvironmentConfig, AzureCloudType } from '../shared/EnvironmentConfig';
import { QuickLink } from '../shared/property-panel/QuickLink';
import { LinkSVG } from '../shared/svg/Link';
import { UrlParameterHelper } from '../shared/UrlParameterHelper';
import { AlertPanelV2, IAlertPanelHeaders } from './shared/property-panel/AlertPanelV2';
import { MachinePropertyPanelAdaptor } from './shared/property-panel/entity-properties/map-entity-adaptor/MachinePropertyPanelAdaptor';
import { WorkbookHelper } from './shared/WorkbookHelper';
import { LocaleStringsHandler } from '../shared/LocaleStringsHandler';
import { WorkbookTemplates } from './shared/WorkbookTemplates';
import { ApiClientRequestInfoBladeName } from '../shared/data-provider/ApiClientRequestInfo';
import { IPropertiesPanelQueryParams } from './shared/property-panel/data-models/PropertiesPanelQueryParams';
import { VmInsightsAlertRulesSignalType, VmInsightsCreateAlertRuleParams } from './shared/blade/AlertParams';
import { LocaleManager } from '../shared/LocaleManager';

/* Required for IE11... this will enable most of the Object.assign functionality on that browser */
import { polyfillObjectAssign } from '../shared/ObjectAssignShim';
polyfillObjectAssign();

import '../../styles/compute/SingleComputePerf.less';
import '../../styles/shared/MainPage.less';

const TelemetryEventsPrefix = 'Compute.{0}.Performance';

export interface ISingleComputePerfProps { }

export interface ISingleVMPerfInitMessage {
    authHeaderValue: string,
    azureCloudType: AzureCloudType;
    computerId: string,
    computerName: string,
    correlationId: any,
    dateTime?: TimeData,
    disablePinChart: boolean,
    disableWorkbook: boolean,
    featureFlags: StringMap<boolean>,
    iframeId: string,
    isDefaultTab: boolean
    queryOnBlade: boolean,
    queryResults: any,
    resourceId?: string,
    sequenceNumber: number,
    workspaceId: string,
    workspaceLocation: string,
}

/**
 * State for SingleComputePerf
 * @export
 * @interface ISingleComputePerfState
 */
export interface ISingleComputePerfState {

    // False for the brief period before onInitSingleComputePerf
    isAuthorizationInfoReceived: boolean;

    // Computer Name we are displaying perf for
    computerName: string;

    // computer workspace
    workspace: IWorkspaceInfo;

    // computer id in the workspace
    computerId: string;

    // the Azure resource id (can be undefined)
    resourceId: string;

    // current selected time
    selectedTime: TimeData;

    // start time for the selected time range
    startDateTimeUtc: Date;

    // end time for the selected time range
    endDateTimeUtc: Date;

    // true for a failure to load properties for the vm
    failedToLoadMachineProperties: boolean;

    // true if the property pane is collapsed
    propertyPanelCollapsed: boolean;

    // true while loading properties
    isLoadingMachineProperties: boolean;

    // Selection context of the machine
    machineProperties: DependencyMap.SelectionContext;

    // true if the disk grid query has found latency counters
    diskGridHasLatencyCounters: boolean;

    /** Session id for chart and grid queries */
    sessionId: string;

    /** True if there was query done at the blade */
    queryOnBlade: boolean,

    /** Results of the blade query. This will only be defined once the query is finished. */
    bladeQueryResults: ISinglePerfQueryResults;

    /**
     * If selected time range is absolute then PinToDashboard is disabled.
     */
    enablePinToDashboard: boolean;

    /**
     * For vmss instance, disable workbook drop down
     */
    disableWorkbook: boolean;

    isDefaultExperienceOfBlade: boolean;
    /**
     * Initial selections for all charts
     */
    chartSeriesSelections: StringMap<ISeriesSelectorOption[]>;
}

/** Query name to report as completed to the hosting blade */
const PerfChartQueryName: string = 'VmPerfChartQueryName';

// Filled out in getPropertyPanes with an id for each pane used in logging
let propertyTypes: string[] = [];

/**
 * Displays a page with performance for a single Computer/VM
 * @export
 * @class SingleComputePerf
 * @extends React.Component<ISingleComputePerfProps, ISingleComputePerfState>
 */
export class SingleComputePerf extends React.Component<ISingleComputePerfProps, ISingleComputePerfState> {
    // Used to communicate with the Blade
    private messagingProvider = new msg.MessagingProvider(new AppInsightsProvider());

    private bodyTheme: string;

    /**
     * Used for retrieving properties for the machine
     * @private
     * @type MapCacheProvider
     * @memberof SingleComputePerf
     */
    private mapCacheProvider: MapCacheProvider;

    /**
     * Sequencing helper for all queries
     * @private
     * @memberof SingleComputePerf
     */
    private querySequenceNumber = 0;

    /**
     * Object used to perform telemetry
     * @private
     * @type ITelemetry
     * @memberof SingleComputePerf
     */
    private telemetry: ITelemetry;

    /** used to send the finishLoaded event only once */
    private sentPageLoaded: boolean;

    /**
     * Set to 0 when we will start queries in child components and incremented
     * as each child component finishes its queries to know when all are done
     */
    private childComponentQueryCount: number;

    /** telemetry arround starting and finishing the grid and chart queries */
    private gridOrChartQueryTelemetry: IFinishableTelemetry;

    /**
     * List of featureFlags from parent extension
     */
    private featureFlags: StringMap<boolean>;

    private telemetryEventsPrefix: string;

    /** DisablePinChart */
    private disablePinChart: boolean;

    // Constructs a new object of this type
    constructor(props?: ISingleComputePerfProps) {
        super(props);
        (window as any).vmInstanceComputePerfInsights.performanceMeasures['frame_constructor'] = Date.now();

        const initialChartSeriesSelections: StringMap<ISeriesSelectorOption[]> = this.getChartSeriesSelections();

        this.onInit = this.onInit.bind(this);
        this.onChartSelectionChanged = this.onChartSelectionChanged.bind(this);
        this.messagingProvider.registerProcessor(msg.InitSingleVmComputePerfMessageProcessorType, this.onInit.bind(this));
        this.onPropertyPaneSelected = this.onPropertyPaneSelected.bind(this);
        this.pinToDashboard = this.pinToDashboard.bind(this);
        this.onRefresh = this.onRefresh.bind(this);
        this.createNewAlertRule = this.createNewAlertRule.bind(this);
        this.messagingProvider.registerProcessor(msg.LoadCompleteMessageProcessorType, this.onLoadComplete.bind(this));
        this.messagingProvider.registerProcessor(msg.StyleThemingMessageProcessorType, this.onStyleThemeInit.bind(this));
        this.messagingProvider.registerProcessor(msg.RefreshMessageProcessorType, this.onRefresh);
        this.messagingProvider.registerProcessor(msg.ArmTokenMessageProcessorType, this.onArmTokenReceived.bind(this));

        this.childComponentQueryCount = 0;

        // start messaging exchange with the container
        this.messagingProvider.startMessaging(msg.VmInsightsIFrameIds.SingleVMComputePerf);

        const initialTimeRange = { options: {}, relative: { duration: TimeValues.LastHour } };
        const startAndEnd = TimeInterval.getStartAndEndDate(initialTimeRange, isRelative(initialTimeRange));
        this.sentPageLoaded = false;

        this.state = {
            isAuthorizationInfoReceived: false,
            computerName: '',
            workspace: undefined,
            computerId: '',
            resourceId: undefined,
            selectedTime: initialTimeRange,
            startDateTimeUtc: startAndEnd.start,
            endDateTimeUtc: startAndEnd.end,
            failedToLoadMachineProperties: false,
            propertyPanelCollapsed: true,
            isLoadingMachineProperties: true,
            machineProperties: { entity: {} as any, nodes: [], edge: null },
            diskGridHasLatencyCounters: false,
            sessionId: GUID().toLowerCase(),
            queryOnBlade: false,
            bladeQueryResults: undefined,
            enablePinToDashboard: true,
            disableWorkbook: false,
            isDefaultExperienceOfBlade: false,
            chartSeriesSelections: initialChartSeriesSelections
        };

        this.telemetry = VmInsightsTelemetryFactory.get(TelemetryMainArea.Compute);
        const eventName: string = UrlParameterHelper.getEventSource() || 'SingleVM';
        this.telemetryEventsPrefix = TelemetryEventsPrefix.replace('{0}', eventName);
        this.mapCacheProvider = new MapCacheProvider(new MapProviderV3(this.telemetry, this.telemetryEventsPrefix,
            { bladeName: ApiClientRequestInfoBladeName.Vm, queryName: undefined }));
        this.togglePanelCollapse = this.togglePanelCollapse.bind(this);
        this.onDiskGridQueryCompleted = this.onDiskGridQueryCompleted.bind(this);
        this.onComputeChartQueryCompleted = this.onComputeChartQueryCompleted.bind(this);
        this.setupChildComponentQuery = this.setupChildComponentQuery.bind(this);

        LocaleManager.Instance().setupLocale();

        LocaleStringsHandler.Instance().onTranslation(() => {
            WorkbookTemplates.initialize();
            VirtualMachineMetricCharts.initialize();

            const chartSeriesSelections: StringMap<ISeriesSelectorOption[]> = this.getChartSeriesSelections();
            this.setState({ chartSeriesSelections })
        });
    }

    /**
     * Works arround the fact that DateTime is deserialized as a string by parsing them.
     * DateTimes will show up only for an absolute TimeData
     * @private
     * @static
     * @param  timeData timeData.absolute.startTime is string, need to parsing it to Data object 
     * @return TimeData
     * @memberof SingleComputePerf
     */
    private static TranslateDateTime(timeData: any): TimeData {
        if (!timeData) {
            return { options: {}, relative: { duration: Constants.DefaultTime } };
        }

        if (timeData.relative) {
            return timeData;
        }

        if (timeData.absolute && timeData.absolute.startTime && timeData.absolute.endTime) {
            return {
                absolute: {
                    startTime: new Date(timeData.absolute.startTime),
                    endTime: new Date(timeData.absolute.endTime)
                },
                options: timeData.options
            }
        }

        return { options: {}, relative: { duration: Constants.DefaultTime } };
    }

    /**
     * Renders the page
     * @return JSX.Element
     * @memberof SingleComputePerf
     */
    public render(): JSX.Element {
        if (!this.state.isAuthorizationInfoReceived || !(this.state.computerName || this.state.resourceId)
            || !this.state.workspace || !this.state.workspace.id) {
            return <div className='MainPage-root'>
                {this.getLoadingSVGDiv()}
            </div>;
        }

        const propertyPanelVisibleClassName: string = this.state.propertyPanelCollapsed ? '' : 'narrow';
        const rootClassName: string = `MainPage-root ${propertyPanelVisibleClassName}`;

        return <div className={rootClassName}>
            <div className='content-root'>
                <SingleControlPanel
                    selectedTime={this.state.selectedTime}
                    telemetry={this.telemetry}
                    logPrefix={this.telemetryEventsPrefix}
                    onSelectionsChanged={this.onRefresh}
                    featureFlags={this.featureFlags}
                    messagingProvider={this.messagingProvider}
                    workspace={this.state.workspace}
                    computerName={this.state.computerName}
                    resourceId={this.state.resourceId}
                    disableWorkbook={this.state.disableWorkbook}
                    endDateTimeUtc={this.state.endDateTimeUtc}
                />
                <div className='disk-perf-label-div'>
                    <span className='disk-perf-label'>{DisplayStrings.DiskPerf}</span>
                </div>

                <SingleComputeDiskGrid
                    workspace={this.state.workspace}
                    computerName={this.state.computerName}
                    resourceId={this.state.resourceId}
                    startDateTimeUtc={this.state.startDateTimeUtc}
                    endDateTimeUtc={this.state.endDateTimeUtc}
                    onQueryCompleted={this.onDiskGridQueryCompleted}
                    sessionId={this.state.sessionId}
                    logsPrefix={this.telemetryEventsPrefix}
                    queryOnBlade={this.state.queryOnBlade}
                    bladeQueryResult={this.state.bladeQueryResults?.diskTableQueryResult}
                    featureFlags={this.featureFlags}
                    isDefaultExperienceOfBlade={this.state.isDefaultExperienceOfBlade}
                />
                <SingleComputeChartPane
                    workspace={this.state.workspace}
                    computerName={this.state.computerName}
                    resourceId={this.state.resourceId}
                    initialSeriesSelections={this.state.chartSeriesSelections}
                    startDateTimeUtc={this.state.startDateTimeUtc}
                    endDateTimeUtc={this.state.endDateTimeUtc}
                    diskGridHasLatencyCounters={this.state.diskGridHasLatencyCounters}
                    onQueryCompleted={this.onComputeChartQueryCompleted}
                    onSeriesSelectionChanged={this.onChartSelectionChanged}
                    sessionId={this.state.sessionId}
                    messagingProvider={this.messagingProvider}
                    logPrefix={this.telemetryEventsPrefix}
                    queryOnBlade={this.state.queryOnBlade}
                    bladeDiskChartResult={this.state.bladeQueryResults?.diskChartQueryResult}
                    bladeJoinedChartResult={this.state.bladeQueryResults?.joinedChartQueryResult}
                    featureFlags={this.featureFlags}
                    pinToDashboard={this.pinToDashboard}
                    enablePinToDashboard={this.state.enablePinToDashboard}
                    createAlertRule={this.createNewAlertRule}
                    isDefaultExperienceOfBlade={this.state.isDefaultExperienceOfBlade}
                />
            </div>
            <div className='vm-panel'>
                <DetailsPane
                    isVisible={true}
                    isCollapsed={this.state.propertyPanelCollapsed}
                    isLoading={false}
                    contents={this.getPropertyPanes()}
                    onTogglePanelCollapse={this.togglePanelCollapse}
                    useWideCollapsedPane={true}
                    onPaneSelected={this.onPropertyPaneSelected} />
            </div>
        </div >
    }

    /**
     * Updates the ARM token every 3 seconds.
     * @param data
     */
    private onArmTokenReceived(data: any) {
        if (!data || !data.authHeaderValue) {
            return;
        }

        this.updateAuthorizationHeader(data.authHeaderValue);
    }

    private updateAuthorizationHeader(authorizationHeaderValue: string) {
        const initInfo = InitializationInfo.getInstance();

        if (initInfo.getAuthorizationHeaderValue(AuthorizationTokenType.Arm) !== authorizationHeaderValue) {
            initInfo.setAuthorizationHeaderValue(AuthorizationTokenType.Arm, authorizationHeaderValue);
        }
    }

    /**
     * This method is invoked to create a new alert rule for singleVM metric
     * @param requestedMetric 
     */
    private createNewAlertRule(requestedMetric: string) {
        const message: VmInsightsCreateAlertRuleParams = {
            metricId: requestedMetric,
            resourceId: this.state.resourceId,
            signalType: VmInsightsAlertRulesSignalType.Metric
        };

        this.telemetry.logEvent(`${this.telemetryEventsPrefix}.AlertRuleIconClicked`, { params: JSON.stringify(message) }, null);
        this.messagingProvider.sendCreateAlertRule(message);
    }

    /**
     * Called when a new property pane is selected
     * @param  {number} index
     * @return {void}
     */
    private onPropertyPaneSelected(index: number) {
        this.telemetry.logEvent(
            `${this.telemetryEventsPrefix}.${Constants.PropertyPaneSelectedTelemetryEventName}`,
            {
                pageName: 'SingleComputePerf',
                propertyType: propertyTypes[index],
            },
            null
        );

        this.loadProperties();
    }

    /**
     * Called when the selection changes in a chart to log telemetry for it
     * @private
     * @param  {string} chartId
     * @param  {string} optionId
     * @param  {string} onOrOff
     * @return {void}@memberof SingleComputePerf
     */
    private onChartSelectionChanged(chartId: string, optionId: string, isOptionSelected: boolean) {
        this.telemetry.logEvent(`${this.telemetryEventsPrefix}.ChartSeriesSelectionChanged`, {
            pageName: 'Single VM Perf',
            workspaceId: this.state.workspace && this.state.workspace.id,
            computerId: this.state.computerId,
            computerName: this.state.computerName,
            chartId: chartId,
            optionId: optionId,
            isOptionSelected: isOptionSelected ? 'true' : 'false'
        }, undefined);
    }

    /**
     * Called when the we are about to cause a new query to be issued to start the combined telemetry
     */
    private setupChildComponentQuery(stateChangeThatWillTriggerChildQueries: () => void): void {

        this.setState({ sessionId: GUID().toLowerCase() }, () => {
            this.childComponentQueryCount = 0;
            const allQueriesName = `${this.telemetryEventsPrefix}.All-Queries`;

            const properties = {
                workspaceId: this.state.workspace && this.state.workspace.id,
                computerName: this.state.computerName,
                startDateTimeUtc: this.state.startDateTimeUtc.toISOString(),
                endDateTimeUtc: this.state.endDateTimeUtc.toISOString(),
                sessionId: this.state.sessionId,
                requestInfo: allQueriesName,
            };

            this.gridOrChartQueryTelemetry = this.telemetry.startLogEvent(
                allQueriesName,
                properties,
                undefined
            );

            stateChangeThatWillTriggerChildQueries();
        });
    }

    /**
     * Called when both grid and chart queries are completed to:
     * 1) Send finishLoading if not already sent
     * 2) Complete the combined query telemetry
     */
    private onBothGridAndChartQueriesCompleted() {
        if (!this.sentPageLoaded) {
            this.messagingProvider.sendFinishedLoading({
                networkQueryName: PerfChartQueryName,
                metrics: (window as any).vmInstanceComputePerfInsights.performanceMeasures
            });
            this.sentPageLoaded = true;
        }

        if (this.gridOrChartQueryTelemetry) {
            this.gridOrChartQueryTelemetry.complete();
        }
    }

    /**
     * Called when the disk query has been completed
     * @private
     * @param  {boolean} hasLatencyCounters true if the disk query has found latency performance counters
     * @return {void}@memberof SingleComputePerf
     */
    private onDiskGridQueryCompleted(hasLatencyCounters: boolean) {
        if (!this.state.queryOnBlade) {
            (window as any).vmInstanceComputePerfInsights.performanceMeasures['frame_diskQueryEnd'] = Date.now();
        }
        this.setState({ diskGridHasLatencyCounters: hasLatencyCounters });

        this.childComponentQueryCount++;
        if (this.childComponentQueryCount === 2) {
            this.onBothGridAndChartQueriesCompleted();
        }
    }

    /**
     * Called whenever the charts queries have completed
     */
    private onComputeChartQueryCompleted(): void {
        this.childComponentQueryCount++;
        if (this.childComponentQueryCount === 2) {
            this.onBothGridAndChartQueriesCompleted();
        }
    }

    /**
     * measures have sequenceNumber and frame_name. We use frame_name to identify to which IFrame these telemetry measures belong to.
     * We need this field since Map and Perf both are sending onLoadComplete and both messages are coming to this callback.
     */
    private onLoadComplete(data: any): void {
        if (!data || !data.metrics || !data.customProperties) {
            return;
        }
        if (data.customProperties.frame_name && (data.customProperties.frame_name as string).indexOf(PerfChartQueryName) > -1) {
            const eventName = (data.customProperties.frame_name as string).indexOf('OnboardingCheck') > -1 ?
                `${this.telemetryEventsPrefix}.IFrameLoadMeasures`
                : `${this.telemetryEventsPrefix}.OpenedFromAtScaleView.IFrameLoadMeasures`;
            TelemetryUtils.onLoadComplete((window as any).vmInstanceComputePerfInsights.performanceMeasures, data.metrics,
                this.telemetry, eventName, data.customProperties);
        }
    }

    /**
     * Queries for machine properties and alerts
     * @private
     * @return {void}@memberof SingleComputePerf
     */
    private queryMachineProperties() {
        if (!this.state.computerId) {
            return;
        }

        const currentQuerySequenceNumber: number = ++this.querySequenceNumber;
        const telemetryProperties: StringMap<string> = {
            workspaceId: this.state.workspace && this.state.workspace.id,
            computerName: this.state.computerName,
            computerId: this.state.computerId
        };

        this.queryMachineProperty(currentQuerySequenceNumber, telemetryProperties)
            .then((selectionContext: DependencyMap.SelectionContext) => {
                if (selectionContext) {
                    this.setState({
                        machineProperties: selectionContext,
                        isLoadingMachineProperties: false,
                        failedToLoadMachineProperties: false
                    });
                } else {
                    // not an error, just no data
                    this.setState({ isLoadingMachineProperties: false, failedToLoadMachineProperties: false });
                }
            }).catch(err => {
                this.setState({ isLoadingMachineProperties: false, failedToLoadMachineProperties: true });
            });
    }

    /**
     * Returns promise for querying machine property and records relevant telemetry
     *
     * @param currentQuerySequenceNumber helps to track the latest query and ignore previous ones
     * @param telemetryProperties custom properties to pass to telemetry
     */
    private queryMachineProperty(currentQuerySequenceNumber: number, telemetryProperties: StringMap<any>): Promise<any> {
        const eventName = `${this.telemetryEventsPrefix}.QueryMachineProperties`;
        const startQueryTelemetry = this.telemetry.startLogEvent(eventName, telemetryProperties, undefined);
        return this.mapCacheProvider.getMachineWithComputerId(this.state.workspace,
            this.state.computerId, this.state.startDateTimeUtc, this.state.endDateTimeUtc)
            .then((selectionContext: DependencyMap.SelectionContext) => {
                TelemetryUtils.completeApiTelemetryEvent(startQueryTelemetry,
                    currentQuerySequenceNumber !== this.querySequenceNumber,
                    !selectionContext,
                    'Parsed machine property object resulted in no data!');
                return selectionContext;
            }).catch(error => {
                if (currentQuerySequenceNumber === this.querySequenceNumber) {
                    startQueryTelemetry.fail(error, { message: 'Failed to get machine properties' });
                    throw error;
                }
            });
    }

    private loadProperties() {
        if (this.state.isLoadingMachineProperties && !this.state.propertyPanelCollapsed) {
            this.queryMachineProperties();
        }
    }

    /**
     * Toggles the property panel collapse/visible state
     * @private
     * @return {void}@memberof SingleComputePerf
     */
    private togglePanelCollapse(): void {
        this.setState((prevState: ISingleComputePerfState) => {
            return { propertyPanelCollapsed: !prevState.propertyPanelCollapsed };
        }, () => {
            this.loadProperties();
            this.telemetry.logEvent(
                `${this.telemetryEventsPrefix}.${Constants.PropertyPaneToggled}`,
                {
                    pageName: 'SingleComputePerf',
                    isCollapsed: this.state.propertyPanelCollapsed ? 'true' : 'false',
                },
                null);
        });
    }

    /**
     * Small div used in a couple of spots
     * @private
     * @return JSX.Element
     * @memberof SingleComputePerf
     */
    private getLoadingSVGDiv(): JSX.Element {
        return <div className='center-flex'>
            <span className='loading-icon-main'><LoadingSvg /></span>
        </div>;
    }

    /**
     * Retrieves the property panes
     * @private
     * @return IDetailsPanel[]
     * @memberof SingleComputePerf
     */
    private getPropertyPanes(): IDetailsPanel[] {
        let panes: IDetailsPanel[] = [];

        // [aydan]: what should we do when we only have a resourceId?
        // we need to get the VM details, as modelled by service map, but we do not have
        // the service map machineId.

        if (!this.state.computerId) {
            panes.push({
                tabName: DisplayStrings.Properties,
                tabIcon: <PropertiesSVG />,
                body: <UnmonitoredMachinePropertyPanel machineName={this.state.computerName} />,
            });
            propertyTypes = ['Unmonitored Machine'];
            return panes;
        }

        let machinePropertiesBody: JSX.Element = null;
        let eventPanelBody: JSX.Element = null;
        let alertPanelBody: JSX.Element = null;

        if (this.state.failedToLoadMachineProperties) {
            // events depends on the machines query working (for the linux/windows logo among other things)
            // If the machine query is loading or has an error the event panel body will be the same
            // as the machine panel body
            eventPanelBody = machinePropertiesBody = (<div className='center-flex column-flex'>
                <div>
                    <h2>{DisplayStrings.DataRetrievalError}</h2>
                </div>
            </div>);
        } else {
            let contextCopy: any = Object.assign({}, this.state.machineProperties);
            contextCopy.entity.linkProperties = this.getQuickLinksSection();

            machinePropertiesBody = this.state.isLoadingMachineProperties
                ? this.getLoadingSVGDiv()
                : <PropertyPanelSelector
                    selectedContext={{ selectedEntity: contextCopy.entity }}
                    telemetry={this.telemetry}
                    startDateTimeUtc={this.state.startDateTimeUtc}
                    endDateTimeUtc={this.state.endDateTimeUtc}
                    messagingProvider={this.messagingProvider}
                />

            eventPanelBody = this.state.isLoadingMachineProperties ? this.getLoadingSVGDiv() :
                <LogEventPanel
                    selectedContext={this.state.machineProperties}
                    workspace={this.state.workspace}
                    resourceId={this.state.resourceId}
                    startDateTimeUtc={this.state.startDateTimeUtc}
                    endDateTimeUtc={this.state.endDateTimeUtc}
                    messagingProvider={this.messagingProvider}
                    telemetryPreFix={this.telemetryEventsPrefix}
                    telemetryMainArea={TelemetryMainArea.Compute}
                    dateTime={this.state.selectedTime}
                />

            const alertPanelProps = this.getAlertPanelV2Props();
            alertPanelBody = this.state.isLoadingMachineProperties ? this.getLoadingSVGDiv() :
                <AlertPanelV2
                    alertSummaryQueryProps={alertPanelProps && alertPanelProps.alertQueryProps}
                    panelHeaders={alertPanelProps && alertPanelProps.panelHeaders}
                    telemetry={this.telemetry}
                    telemetryPrefix={this.telemetryEventsPrefix}
                    messagingProvider={this.messagingProvider}
                />;
        }

        // id of each item added to propertyPanels by index used in telemetry
        propertyTypes = ['Properties', 'LogEvents', 'Alerts'];

        panes.push({
            tabName: DisplayStrings.Properties,
            tabIcon: <PropertiesSVG />,
            body: machinePropertiesBody,
        });

        panes.push({
            tabName: DisplayStrings.LogEvent,
            tabIcon: <SearchSVG />,
            forceRender: true,
            body: eventPanelBody,
        });

        panes.push({
            tabName: DisplayStrings.Alerts,
            tabIcon: <AlertSVG />,
            body: alertPanelBody
        })

        return panes;
    }

    private getQuickLinksSection(): JSX.Element {
        const linkList: JSX.Element[] = [];

        // get correct computerId if viewed from atscale perf details
        let computerId: string = this.state.computerId;
        if (this.state.machineProperties && this.state.machineProperties.entity) {
            const entity: any = this.state.machineProperties.entity;
            if (entity.hosting && entity.hosting.resourceId) {
                computerId = entity.hosting.resourceId;
            }
        }

        const sourceName: string = `${this.telemetryEventsPrefix}.onNavigateToSingleVmConnectionDetailWorkbook`;
        const computerName: string = this.state.computerName;
        const connectionDetailQuickLink: JSX.Element = <QuickLink
            key={'connection-detail'}
            onClick={() => WorkbookHelper.NavigateToSingleVmConnectionDetailWorkbook({
                sourceName,
                computerId,
                computerName,
                workspaceId: this.state.workspace && this.state.workspace.id,
                messagingProvider: this.messagingProvider,
                telemetry: this.telemetry
            })}
            icon={<LinkSVG />}
            label={DisplayStrings.ConnectionDetail}
        />
        if (!this.state.disableWorkbook) {
            linkList.push(connectionDetailQuickLink);
        }

        const section: JSX.Element = linkList.length > 0
            ? <div className='quick-link-section'>{linkList}</div> : null;

        return section;
    }

    /**
     * This is called when the IFrame is receives initial params from Blade
     * @param initMessage 
     */
    private onInit(initMessage: ISingleVMPerfInitMessage) {
        if (!initMessage) {
            return;
        }

        // Set the cloud in our environment config
        if (!EnvironmentConfig.Instance().isConfigured()) {
            EnvironmentConfig.Instance().initConfig(initMessage.azureCloudType, EnvironmentConfig.Instance().isMPACLegacy());
        }

        this.telemetry.setContext({
            correlationId: initMessage.correlationId
        }, false);

        const initInfo = InitializationInfo.getInstance();
        this.featureFlags = initMessage.featureFlags;
        this.setState({ isDefaultExperienceOfBlade: initMessage.isDefaultTab });
        if (initInfo.getAuthorizationHeaderValue(AuthorizationTokenType.Arm) !== initMessage.authHeaderValue) {
            initInfo.setAuthorizationHeaderValue(AuthorizationTokenType.Arm, initMessage.authHeaderValue);
        }

        if (initMessage.disableWorkbook) {
            this.setState({ disableWorkbook: initMessage.disableWorkbook });
        }

        if (initMessage.disablePinChart) {
            this.disablePinChart = initMessage.disablePinChart;
            this.setState({ enablePinToDashboard: false });
        }
        const workspace: IWorkspaceInfo = {
            id: initMessage.workspaceId,
            location: initMessage.workspaceLocation
        };
        if (initMessage.queryOnBlade) {
            if (initMessage.queryResults && initMessage.authHeaderValue && !this.state.isAuthorizationInfoReceived) {
                const selectedTime = SingleComputePerf.TranslateDateTime(initMessage.dateTime);

                const startAndEnd = TimeInterval.getStartAndEndDate(selectedTime, isRelative(selectedTime));

                (window as any).vmInstanceComputePerfInsights.performanceMeasures['frame_tokenReceived'] = Date.now();

                (window as any).vmInstanceComputePerfInsights.performanceMeasures['frame_dataReceivedFromBlade'] = Date.now();
                this.telemetry.setContext({
                    workspace_id: initMessage.workspaceId,
                    computer_id: initMessage.computerId,
                    computer_name: initMessage.computerName,
                    resourceId: initMessage.resourceId
                }, false);

                this.handleOnBladeTelemetry(initMessage.queryResults);
                this.setState({
                    isAuthorizationInfoReceived: true,
                    computerName: initMessage.computerName,
                    workspace,
                    computerId: initMessage.computerId,
                    resourceId: initMessage.resourceId,
                    selectedTime: selectedTime,
                    startDateTimeUtc: startAndEnd.start,
                    endDateTimeUtc: startAndEnd.end,
                    bladeQueryResults: initMessage.queryResults,
                    queryOnBlade: true
                });
            }
        } else if (!this.state.isAuthorizationInfoReceived) {
            const selectedTime: TimeData = SingleComputePerf.TranslateDateTime(initMessage.dateTime);

            const startAndEnd = TimeInterval.getStartAndEndDate(selectedTime, isRelative(selectedTime));

            (window as any).vmInstanceComputePerfInsights.performanceMeasures['frame_tokenReceived'] = Date.now();
            this.telemetry.setContext({
                workspace_id: initMessage.workspaceId,
                computer_id: initMessage.computerId,
                computer_name: initMessage.computerName,
                resourceId: initMessage.resourceId
            }, false);
            this.setupChildComponentQuery(() =>
                this.setState(
                    {
                        isAuthorizationInfoReceived: true,
                        computerName: initMessage.computerName,
                        workspace,
                        computerId: initMessage.computerId,
                        resourceId: initMessage.resourceId,
                        selectedTime: selectedTime,
                        startDateTimeUtc: startAndEnd.start,
                        endDateTimeUtc: startAndEnd.end
                    })
            );
        }
    }

    /**
     * Check a blade object for the correct telemetry. If it is correct, log it otherwise log an exception.
     * @param  {*} bladeQueryResults blade result object
     * @param  {string[]} pathToTelemetry path from the blade object to a telemetry
     * @param  {*} queryStartName name of the start telemetry
     * @param  {*} queryEndName name of the end telemetry
     * @return {void}
     */
    private checkAndLogBladeTelemetry(
        bladeQueryResults: any,
        pathToTelemetry: string[],
        queryStartName: string,
        queryEndName: string): void {
        let path = ''
        let currentObject = bladeQueryResults;
        for (let segment of pathToTelemetry) {
            path += ('.' + segment);
            currentObject = currentObject[segment];
            if (!currentObject) {
                this.telemetry.logException(
                    `'@bladeQueryResults${path} must not be null`,
                    'SiongleComputePerf.isbladeQueryResultTelemetryObjectValid',
                    ErrorSeverity.Error,
                    {},
                    undefined);
                return;
            }
        }

        if (!currentObject.name) {
            this.telemetry.logException(
                `'@bladeQueryResults.${path}.name must not be null`,
                'SiongleComputePerf.isbladeQueryResultTelemetryObjectValid',
                ErrorSeverity.Error,
                {},
                undefined);
            return;
        }

        if (!currentObject.telemetryObject) {
            this.telemetry.logException(
                `'@bladeQueryResults.${path}.telemetryObject must not be null`,
                'SiongleComputePerf.isbladeQueryResultTelemetryObjectValid',
                ErrorSeverity.Error,
                {},
                undefined);
            return;
        }

        if (!currentObject.telemetryObject.start) {
            this.telemetry.logException(
                `'@bladeQueryResults.${path}.telemetryObject.start must not be null`,
                'SiongleComputePerf.isbladeQueryResultTelemetryObjectValid',
                ErrorSeverity.Error,
                {},
                undefined);
            return;
        }

        (window as any).vmInstanceComputePerfInsights.performanceMeasures[queryStartName] = currentObject.telemetryObject.start;

        if (!currentObject.telemetryObject.end) {
            this.telemetry.logException(
                `'@bladeQueryResults.${path}.telemetryObject.end must not be null`,
                'SiongleComputePerf.isbladeQueryResultTelemetryObjectValid',
                ErrorSeverity.Error,
                {},
                undefined);
            return;

        }

        (window as any).vmInstanceComputePerfInsights.performanceMeasures[queryEndName] = currentObject.telemetryObject.end;
        let duration = currentObject.telemetryObject.end - currentObject.telemetryObject.start;
        // Create StringMap from telemetryObject
        const telemetryProps: StringMap<string> = {};
        for (let key in currentObject.telemetryObject) {
            if (key && currentObject.telemetryObject[key]) {
                telemetryProps[key] = JSON.stringify(currentObject.telemetryObject[key]);
            }
        }
        this.telemetry.logEvent(currentObject.name, telemetryProps, { duration });
    }

    /**
     * For a query run on blade checks and logs all telemetry
     * @param  {ISinglePerfQueryResults} bladeQueryResults
     * @return {void}
     */
    private handleOnBladeTelemetry(bladeQueryResults: ISinglePerfQueryResults) {
        this.checkAndLogBladeTelemetry(bladeQueryResults, ['finalTelemetry'],
            'blade_totalQueryStart', 'blade_totalQueryEnd');
        this.checkAndLogBladeTelemetry(bladeQueryResults, ['diskTableQueryResult', 'telemetry'],
            'blade_diskTableQueryStart', 'blade_diskTableQueryEnd');
        this.checkAndLogBladeTelemetry(bladeQueryResults, ['diskChartQueryResult', 'telemetry'],
            'blade_diskChartQueryStart', 'blade_diskChartQueryEnd');
        this.checkAndLogBladeTelemetry(bladeQueryResults, ['joinedChartQueryResult', 'telemetry'],
            'blade_joinedChartQueryStart', 'blade_joinedChartQueryEnd');
    }

    private onStyleThemeInit(theme: any) {
        if (!theme) {
            throw 'No theme object was passed from Azure portal';
        }
        const themeName: string = theme.name;
        if (themeName) {
            let bodyTheme: string = 'light';
            if (themeName === msg.PortalThemes.Dark) {
                bodyTheme = 'dark';
            }
            $('body').removeClass(`${this.bodyTheme}`);
            $('body').addClass(`${bodyTheme}`);
            this.bodyTheme = bodyTheme;
        }
    }

    private onRefresh(selectedTime?: TimeData) {
        const newSelectedTime: TimeData = selectedTime || this.state.selectedTime;
        const isTimeRangeRelative: boolean = isRelative(newSelectedTime);
        const enablePinToDashboard: boolean = !this.disablePinChart && isTimeRangeRelative;
        const startAndEnd = TimeInterval.getStartAndEndDate(newSelectedTime, isTimeRangeRelative);
        this.setupChildComponentQuery(() =>
            this.setState({
                selectedTime: newSelectedTime,
                startDateTimeUtc: startAndEnd.start,
                endDateTimeUtc: startAndEnd.end,
                enablePinToDashboard: enablePinToDashboard
            }));
    }

    private pinToDashboard(chartId: string, showOptionPicker: boolean) {
        const message: SingleVmPinChartToDashboardMessage = {
            metricQueryId: chartId,
            defaultOptionPicks: this.state.chartSeriesSelections[chartId],
            showOptionPicker,
            computerName: this.state.computerName,
            workspaceId: this.state.workspace && this.state.workspace.id,
            computerId: this.state.computerId,
            timeRange: this.state.selectedTime
        }
        this.messagingProvider.sendSingleVmPinChartToDashboardMessage(message);
    }

    /**
     * This method creates query parameters for AlertsPanel content
     */
    private getAlertPanelV2Props() {
        if (!this.state.machineProperties || !this.state.machineProperties.entity) {
            return {};
        }
        const machinePanelAdaptor = MachinePropertyPanelAdaptor.getMachineAdaptor(this.telemetry,
            this.state.machineProperties.entity, this.messagingProvider);
        if (machinePanelAdaptor) {
            const alertQueryProps: IPropertiesPanelQueryParams = {
                workspace: this.state.workspace,
                timeInterval: new TimeInterval(this.state.startDateTimeUtc,
                    this.state.endDateTimeUtc,
                    Constants.IdealAggregateChartDataPoints),
                computerName: machinePanelAdaptor.getMachineNameForQuery(),
                resourceId: this.state.resourceId
            };
            const panelHeaders: IAlertPanelHeaders = {
                panelId: this.state.resourceId || machinePanelAdaptor.getMachineNameForQuery(),
                displayName: machinePanelAdaptor.getTitle(),
                displayIcon: machinePanelAdaptor.getIcon()
            };
            return {
                alertQueryProps,
                panelHeaders
            }
        }
        return {};
    }

    private getChartSeriesSelections(): StringMap<ISeriesSelectorOption[]> {
        const chartSeriesSelections: StringMap<ISeriesSelectorOption[]> = {};
        for (const chartDescriptor of VirtualMachineMetricCharts.SingleVmChartList) {
            chartSeriesSelections[chartDescriptor.chartId] =
                chartDescriptor.defaultSeriesSelections;
        }
        return chartSeriesSelections;
    }
}
