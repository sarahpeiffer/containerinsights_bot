/** Block imports */
import * as React from 'react';
import * as $ from 'jquery';
import { Promise } from 'es6-promise';

/** Third Party imports */
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import update = require('immutability-helper');
import { ChartSeriesData, GUID } from '@appinsights/aichartcore';
import { TimeValues, TimeData } from '@appinsights/pillscontrol-es5';
import { isTimeDataEqual, isRelative } from '@appinsights/pillscontrol-es5/dist/TimeUtils';

/** Compute imports */
import { ComputeChartPane } from './ComputeChartPane';
import { ComputeTopNChartPane } from './ComputeTopNChartPane';
import { ComputeGridPane } from './ComputeGridPane';
import { ComputeMetricName, ComputeMetrics } from './ComputeMetrics';
import { VirtualMachineMetricCharts } from './VirtualMachineMetricCharts';
import { MapProviderV3 } from './data-provider/MapProviderV3';
import { ComputerGroupProvider } from './control-panel/ComputerGroupProvider';
import * as Constants from './Constants';

/** Property panel imports */
import { PropertyPanelSelector } from './shared/property-panel/entity-properties/PropertyPanelSelector';
import { MapCacheProvider } from './shared/admmaps-wrapper/MapCacheProvider';
import { LogEventPanel } from './shared/property-panel/LogEventPanel';
import { TimeUtils } from './shared/TimeUtils';
import {
    AtScaleUtils,
    defaultVmssInstance,
    defaultResourceGroupInfo,
    ISyncLocalWorkspaceManagerParams
} from './shared/AtScaleUtils';
import { InsightsUnmonitoredMachine } from './shared/property-panel/InsightsUnmonitoredMachine';
import { GridDataColumn } from './ComputeComparisonGrid';

/** Shared Imports */
import { DisplayStrings } from '../shared/DisplayStrings';
import * as msg from '../shared/MessagingProvider';
import { InitializationInfo, AuthorizationTokenType } from '../shared/InitializationInfo';
import { WorkspaceListManager } from '../shared/WorkspaceListManager';
import { StringMap } from '../shared/StringMap';
import { ITelemetry, TelemetryMainArea } from '../shared/Telemetry';
import { SubscriptionListManager } from '../shared/SubscriptionListManager';
import { TimeInterval } from '../shared/data-provider/TimeInterval';
import { DetailsPane } from '../shared/property-panel/DetailsPane';
import { IDetailsPanel } from '../shared/property-panel/IDetailsPanel';
import { LoadingSvg } from '../shared/svg/loading';
import { ErrorSeverity } from '../shared/data-provider/TelemetryErrorSeverity';
import { VmInsightsTelemetryFactory } from '../shared/VmInsightsTelemetryFactory';
import { SearchSVG } from '../shared/svg/search';
import { AlertSVG } from '../shared/svg/alert';
import { PropertiesSVG } from '../shared/svg/properties';
import { ISeriesSelectorOption } from '../shared/ISeriesSelectorOption';
import { TelemetryUtils, IAtScaleTelemetryContext } from './shared/TelemetryUtils';
import { RetryARMDataProvider } from '../shared/data-provider/RetryARMDataProvider';
import { ARMDataProvider } from '../shared/data-provider/ARMDataProvider';
import { RetryPolicyFactory } from '../shared/data-provider/RetryPolicyFactory';
import { IWorkspaceInfo } from '../shared/IWorkspaceInfo';
import { AppInsightsProvider } from '../shared/CustomAppInsightMessagingProvider';
import { ComputerGroup } from '../shared/ComputerGroup';
import { ComputerGroupSerialization, SerializedComputerGroup } from './shared/ComputerGroupSerialization';
import { AtScalePinChartToDashboardMessage } from '../shared/MessagingProvider';
import { ScaleControlPanel, IScaleControlPanelSelections, HybridControlPanelDropDownType } from './shared/control-panel/ScaleControlPanel';
import { EnvironmentConfig, AzureCloudType } from '../shared/EnvironmentConfig';
import { ISubscriptionInfo } from '../shared/ISubscriptionInfo';
import { ResourceInfo, VmInsightsResourceType } from './shared/ResourceInfo';
import { UrlParameterHelper } from '../shared/UrlParameterHelper';
import { SolutionType } from './shared/ControlPanelUtility';
import { AtScaleOnboardingSection } from './AtScaleOnboardingSection';
import { VmInsightsOnboardingDataProvider } from './data-provider/VmInsightsOnboardingDataProvider';
import { VmInsightsQuicklinks } from './shared/VmInsightsQuicklinks';
import { IAlertPanelHeaders, AlertPanelV2 } from './shared/property-panel/AlertPanelV2';
import { MachinePropertyPanelAdaptor } from './shared/property-panel/entity-properties/map-entity-adaptor/MachinePropertyPanelAdaptor';
import { LocaleStringsHandler } from '../shared/LocaleStringsHandler';
import { WorkbookTemplates } from './shared/WorkbookTemplates';
import { ApiClientRequestInfoBladeName } from '../shared/data-provider/ApiClientRequestInfo';
import { EntityType } from './shared/property-panel/data-models/EntityType';
import { IPropertiesPanelQueryParams } from './shared/property-panel/data-models/PropertiesPanelQueryParams';
import { VmInsightsCreateAlertRuleParams, VmInsightsAlertRulesSignalType } from './shared/blade/AlertParams';
import { LocaleManager } from '../shared/LocaleManager';

import {
    AzureScaleControlPanel, IAzureScaleControlPanelSelections,
    AzureControlPanelDropDownType
} from './shared/control-panel/AzureScaleControlPanel';

/* Required for IE11... this will enable most of the Object.assign functionality on that browser */
import { polyfillObjectAssign } from '../shared/ObjectAssignShim';
polyfillObjectAssign();

/* required for ie11... this will enable most of the Array.find functionality on that browser */
import { polyfillArrayFind } from '../shared/ArrayFindShim';
polyfillArrayFind();

import '../../styles/compute/ComputeMain.less';
import '../../styles/shared/MainPage.less';

/** Query name to report as completed to the hosting blade */
const PerfChartQueryName: string = 'AtScalePerfChartQueryName';
const TelemetryEventsPrefix = 'Compute.AtScale{0}.Performance';

export interface IComputeMainPageProps { }

// Below is the contract for kusto metric data being recieved by blade.
export interface IMetricQueryResult {
    data: any;
    error: any;
    telemetry: any;
    queryId: string;
}

// Below is the contract for kusto metric data being recieved by blade.
export interface IAtScalePerfQueryResults {
    topNQueryResults: IMetricQueryResult[];

    finalTelemetry: any;

    /**
     * Indicates if the data in this object is updated/newlyCreated but not consumed.
     */
    dataUpdated: boolean;

    /**
     * Start time used in the query
     */
    queryStartTime: Date;

    /**
     * End time used in the query
     */
    queryEndTime: Date;

    aggregateChartDataPointCount: number;
}

export interface IIncomingParameters {
    computerGroups: ComputerGroup[];
    selectedGroup: ComputerGroup;
}

export interface IAtScalePerfInitMessage {
    atScaleBladeParameters?: BladeParameters.AtScaleVmInsightsBladeParams;
    authHeaderValue: string;
    azureCloudType: AzureCloudType;
    correlationId: any;
    defaultPerformanceTabSubTab?: number;
    featureFlags: StringMap<boolean>;
    iframeId: string;
    isDefaultTab: boolean;
    localeStrings: string;
    queryOnBlade: boolean;
    queryResults: IAtScalePerfQueryResults;
    sequenceNumber: number;
    subscriptionList: ISubscriptionInfo[];
    timeData?: TimeData;
    vmssBladeParameters?: BladeParameters.VmScaleSetInsightsBladeParams;
    workspaceList: IWorkspaceInfo[];
}

export interface VmResourcePerfBladeParameters {
    computerName: string,
    displayName: string,
    workspaceId: string,
    computerId: string,
    dateTime?: TimeData,
    virtualMachineResourceId?: string
}

const enum PerformanceViewType {
    TopNCharts = 0,
    AggregateCharts = 1,
    TopNList = 2
}

interface ITopNListSelectionContext {
    // TODO bb: We should not use DependencyMap typedef's here. We need to define proper interface for this selected entity.
    // This should be done as seperate task.
    /**
     * Selected machine
     */
    selectedEntity: DependencyMap.SelectionContext;

    /**
     * Workspace to which the selected entity is sending data.
     */
    workspace: IWorkspaceInfo;

    resourceId: string;
}

// The main page maintains the nessessary state to initialize the child tab properties, which is why they share a common interface.
export interface IComputeAzMonPerfState {
    /**
     * Type of solution for which VmInsights is used.
     * Allowed values are Azure and Hybrid
     */
    solutionType: SolutionType;

    selectedTab: PerformanceViewType;

    /**
     * Selected workspace in the Hybrid solution type.
     * We have to maintain selectedWorkspace for Hybrid and Azure mode seperately.
     */
    selectedHybridWorkspace: IWorkspaceInfo;
    isAuthorizationInfoReceived: boolean;
    selectedMetricName: string;
    topNListSelectionContext: ITopNListSelectionContext;
    startDateTimeUtc: Date;
    endDateTimeUtc: Date;
    propertyPanelVisible: boolean;
    propertyPanelLoading: boolean;
    gridRowDataLoadFailed: boolean;
    dateTime: TimeData;
    sequenceNumber: number;

    // series selections for the chart
    chartSeriesSelections: StringMap<ISeriesSelectorOption[]>;

    // data for aggregate chart visualization
    // dictionary by metric name to value, which is itself
    // a dictionary of aggregations (95th, avg, etc) to chart series data
    aggregateChartData: StringMap<StringMap<ChartSeriesData>>;

    /**
     * Quick Link section show on the property Panel.
     */
    quickLinksSection: JSX.Element;

    selectedComputerGroup: ComputerGroup;
    computerGroups: ComputerGroup[];
    computerGroupsLoaded: boolean;

    /**
     * If selected time range is absolute then PinToDashboard is disabled.
     */
    enablePinToDashboard: boolean;
    vmssResourceId: string;
    subscriptionList: ISubscriptionInfo[];
    selectedSubscription: ISubscriptionInfo;
    selectedResourceGroup: ResourceInfo;
    selectedResourceType: VmInsightsResourceType;
    resourceGroups: ResourceInfo[];
    selectedAzureResource: ResourceInfo;
    showAtScaleOnboardingMessage: boolean;
    selectedVmssInstance: ResourceInfo;
    vmssInstances: ResourceInfo[];

    // This flag is used when we open singleVMPerf view when user selects a computer or VMSSInstance
    singlVmPerfDiskGridHasLatencyCounters: boolean;
    singleVmPerfSessionId: string;
    azureResources: ResourceInfo[];
    isDefaultExperienceOfBlade: boolean;
}

export class ComputeMainPage extends React.Component<IComputeMainPageProps, IComputeAzMonPerfState> {
    private bodyTheme: string;
    private messagingProvider = new msg.MessagingProvider(new AppInsightsProvider());
    private workspaceManager: WorkspaceListManager;
    private subscriptionListManager: SubscriptionListManager;
    private mapCacheProvider: MapCacheProvider;
    // Filled out in propertyPanelContent with an id for each pane used in logging
    private propertyTypes: string[] = [];

    private telemetry: ITelemetry;

    // Enables the UX to only respond to the user's latest asynchronous activity
    private pendingQuerySequenceNumber: number = 0;

    private telemetryEventsPrefix: string;

    /**
     * We need this flag to track when the initial chart conent and group queries are ready on the IFrame.
     */
    private sentFinishLoading: boolean = false;

    // set to true when the chart query is completed
    private completedChartQuery: boolean = false;

    /**
     * Default group to be selected.
     * Even if getGroupsAPI has failed, the groups drop down will show the default group
     * and the charts are rendered for this default group.
     */
    private defaultGroup: ComputerGroup = ComputerGroupProvider.AllComputersGroup;

    /**
     * True if the page with corresponding index had its page view logged
     */
    private loggedPageView: boolean[] = [false, false, false, false];

    /**
     * List of featureFlags from parent extension
     */
    private featureFlags: StringMap<boolean> = {};
    private vmInsightsOnboardingProvider: VmInsightsOnboardingDataProvider;

    private readonly supportedResourceTypes: Array<VmInsightsResourceType> = [
        VmInsightsResourceType.All,
        VmInsightsResourceType.VirtualMachine,
        VmInsightsResourceType.VirtualMachineScaleSet,
        VmInsightsResourceType.AzureArcMachine
    ];

    constructor(props?: IComputeMainPageProps) {
        super(props);
        this.telemetry = VmInsightsTelemetryFactory.get(TelemetryMainArea.Compute);
        (window as any).atScaleComputePerfInsights.performanceMeasures['frame_constructor'] = Date.now();

        const initialChartSeriesSelections: StringMap<ISeriesSelectorOption[]> = this.getChartSeriesSelections();

        let retryArmDataProvider = new RetryARMDataProvider(new ARMDataProvider(), new RetryPolicyFactory());
        this.rowSelectedOnGrid = this.rowSelectedOnGrid.bind(this);
        this.onMetricChanged = this.onMetricChanged.bind(this);
        this.togglePanelCollapse = this.togglePanelCollapse.bind(this);
        this.setPropertyPanelLoading = this.setPropertyPanelLoading.bind(this);
        this.onNavigateToSinglePerf = this.onNavigateToSinglePerf.bind(this);
        this.onPropertyPaneSelected = this.onPropertyPaneSelected.bind(this);
        this.hidePropertyPanel = this.hidePropertyPanel.bind(this);
        this.onUpdateContext = this.onUpdateContext.bind(this);
        this.onHybridControlPanelSelectionsChanged = this.onHybridControlPanelSelectionsChanged.bind(this);
        this.onComputerGroupsLoaded = this.onComputerGroupsLoaded.bind(this);
        this.onOpenVmOnboarding = this.onOpenVmOnboarding.bind(this);
        this.createNewAlertRule = this.createNewAlertRule.bind(this);
        this.pinToDashboard = this.pinToDashboard.bind(this);
        this.onAzureControlPanelSelectionsChanged = this.onAzureControlPanelSelectionsChanged.bind(this);
        this.onResourceGroupsLoaded = this.onResourceGroupsLoaded.bind(this);
        this.onSolutionTypeChanged = this.onSolutionTypeChanged.bind(this);
        this.onAzureWorkspacesLoaded = this.onAzureWorkspacesLoaded.bind(this);
        this.onSingleVmPerfChartSelectionChanged = this.onSingleVmPerfChartSelectionChanged.bind(this);
        this.onChartSeriesSelectionsChanged = this.onChartSeriesSelectionsChanged.bind(this);
        this.onSingleVmDiskGridQueryCompleted = this.onSingleVmDiskGridQueryCompleted.bind(this);
        this.onVmssInstancesLoaded = this.onVmssInstancesLoaded.bind(this);
        this.onAzureResourceLoaded = this.onAzureResourceLoaded.bind(this);

        this.subscriptionListManager = new SubscriptionListManager();
        this.workspaceManager = new WorkspaceListManager();
        this.vmInsightsOnboardingProvider = new VmInsightsOnboardingDataProvider(retryArmDataProvider, this.telemetry);

        this.telemetryEventsPrefix = TelemetryEventsPrefix.replace('{0}', UrlParameterHelper.getEventSource());
        // telemetry shared between compute and maps, must be passed in here...
        this.mapCacheProvider = new MapCacheProvider(new MapProviderV3(this.telemetry, this.telemetryEventsPrefix,
            { bladeName: ApiClientRequestInfoBladeName.AtScale, queryName: undefined }));

        const dateTime = { options: {}, relative: { duration: TimeValues.LastHour } };
        const startAndEnd = TimeInterval.getStartAndEndDate(dateTime, isRelative(dateTime));
        const selectedTab = PerformanceViewType.TopNCharts;
        this.logPageView(selectedTab);

        this.state = {
            selectedTab: selectedTab,
            isAuthorizationInfoReceived: false,
            startDateTimeUtc: startAndEnd.start,
            endDateTimeUtc: startAndEnd.end,
            selectedComputerGroup: this.defaultGroup,
            selectedMetricName: ComputeMetricName.CpuUtilization,
            dateTime: dateTime,
            sequenceNumber: -1,
            chartSeriesSelections: initialChartSeriesSelections,
            aggregateChartData: {},
            propertyPanelVisible: true,
            gridRowDataLoadFailed: false,
            topNListSelectionContext: undefined,
            propertyPanelLoading: false,
            quickLinksSection: null,
            computerGroups: [ComputerGroupProvider.AllComputersGroup],
            computerGroupsLoaded: false,
            enablePinToDashboard: true,
            vmssResourceId: null,
            solutionType: undefined,
            subscriptionList: [],
            selectedSubscription: undefined,
            selectedResourceGroup: undefined,
            resourceGroups: [defaultResourceGroupInfo],
            selectedAzureResource: undefined,
            selectedResourceType: VmInsightsResourceType.All,
            showAtScaleOnboardingMessage: false,
            selectedHybridWorkspace: undefined,
            selectedVmssInstance: defaultVmssInstance,
            singlVmPerfDiskGridHasLatencyCounters: false,
            singleVmPerfSessionId: GUID().toLowerCase(),
            vmssInstances: [],
            azureResources: [],
            isDefaultExperienceOfBlade: false
        };

        this.messagingProvider.registerProcessor(msg.UpdateAggregatePerfScopeProcessorType, this.onUpdateContext.bind(this));
        this.messagingProvider.registerProcessor(msg.RefreshMessageProcessorType, this.onRefresh.bind(this));
        this.messagingProvider.registerProcessor(msg.InitAtScaleComputePerfMessageProcessorType, this.onInit.bind(this));
        this.messagingProvider.registerProcessor(msg.LoadCompleteMessageProcessorType, this.onLoadComplete.bind(this));
        this.messagingProvider.registerProcessor(msg.StyleThemingMessageProcessorType, this.onStyleThemeInit.bind(this));
        this.messagingProvider.registerProcessor(msg.ArmTokenMessageProcessorType, this.onArmTokenReceived.bind(this));
        this.messagingProvider.registerProcessor(msg.SubscriptionListUpdateMessageProcessorType, this.subscriptionListUpdate.bind(this));

        // start messaging exchange with the container
        this.messagingProvider.startMessaging(msg.VmInsightsIFrameIds.AtScaleComputePerf);

        LocaleManager.Instance().setupLocale();

        LocaleStringsHandler.Instance().onTranslation(() => {
            WorkbookTemplates.initialize();
            VirtualMachineMetricCharts.initialize();
            ComputeMetrics.initialize();

            const chartSeriesSelections: StringMap<ISeriesSelectorOption[]> = this.getChartSeriesSelections();
            this.setState({ chartSeriesSelections });
        });
    }

    /**
     * Returns the ComputerGroup for the selected groupId
     * @param groups
     * @param groupId
     * @return ComputerGroup
     */
    private static getComputerGroup(groups: ComputerGroup[], groupId: string): ComputerGroup {
        if (!groupId || !groups) {
            return undefined;
        }

        return groups.find((group) => group.id.toLowerCase() === groupId.toLowerCase());
    }

    public shouldComponentUpdate(nextProps: IComputeMainPageProps, nextState: IComputeAzMonPerfState) {
        this.updateTelemetryContext(nextState);
        return true;
    }

    public render(): JSX.Element {
        const loadingElement: JSX.Element = (<div className='MainPage-root'>
            <div className='center-flex'>
                <span className='loading-icon-main'><LoadingSvg /></span>
            </div>
        </div>);

        if (!this.state.isAuthorizationInfoReceived) {
            return loadingElement;
        }

        const propertyPanelVisibleClassName: string = this.state.propertyPanelVisible ? 'narrow' : '';
        const rootClassName: string = `MainPage-root ${propertyPanelVisibleClassName}`;
        const propertyPanelVisible: boolean = this.state.selectedTab === PerformanceViewType.TopNList
            && !!this.state.topNListSelectionContext;

        // Details Pane location is hardcoded to show for third tab - which is 'Top N List'
        return (
            <div className={rootClassName}>
                {this.renderContentRoot()}
                <div
                    className='vm-panel'
                    onBlur={(e: React.FocusEvent<HTMLDivElement>) => {
                        if (this.featureFlags && this.featureFlags[Constants.FeatureMap.propertyPanel]) {
                            const currentTarget: EventTarget & HTMLDivElement = e.currentTarget;
                            setTimeout(() => {
                                if (!currentTarget.contains(document.activeElement)
                                    && !this.isVmss()) {
                                    // don't "deselect" for VMSS since we don't have VMSS property panel yet
                                    this.setState({
                                        topNListSelectionContext: undefined
                                    });
                                }
                            }, 0);
                        }
                    }}
                >
                    <DetailsPane
                        isCollapsed={!this.state.propertyPanelVisible}
                        isVisible={propertyPanelVisible}
                        isLoading={this.state.propertyPanelLoading}
                        contents={this.propertyPanelContent()}
                        onTogglePanelCollapse={this.togglePanelCollapse}
                        useWideCollapsedPane={true}
                        onPaneSelected={this.onPropertyPaneSelected}
                        selectedContext={this.state.topNListSelectionContext
                            && this.state.topNListSelectionContext.selectedEntity
                            && this.state.topNListSelectionContext.selectedEntity.entity
                            && this.state.topNListSelectionContext.selectedEntity.entity.id}
                    />
                </div>
            </div>
        );
    }

    private getCurrentScopeSelection(): any {
        // NOTE ak: stringifying certain state variables can cause out-of-memory crashes
        return {
            solutionType: this.state.solutionType,
            selectedTab: JSON.stringify(this.state.selectedTab),
            charts: JSON.stringify({
                chartSeriesSelections: this.state.chartSeriesSelections
            }),
            grid: JSON.stringify({
                selectedMetricName: this.state.selectedMetricName
            }),
            dateTime: JSON.stringify({
                dateTime: this.state.dateTime,
                startDateTimeUtc: this.state.startDateTimeUtc,
                endDateTimeUtc: this.state.endDateTimeUtc
            }),
            hybrid: JSON.stringify({
                selectedHybridWorkspace: this.state.selectedHybridWorkspace,
                // NOTE ak: specify object to prevent stringifying icon svg
                selectedComputerGroup: {
                    id: this.state.selectedComputerGroup?.id,
                    displayName: this.state.selectedComputerGroup?.displayName,
                    groupType: this.state.selectedComputerGroup?.groupType
                },
            }),
            azure: JSON.stringify({
                selectedSubscription: this.state.selectedSubscription,
                selectedResourceGroup: this.state.selectedResourceGroup,
                selectedResourceType: this.state.selectedResourceType,
                selectedAzureResource: this.state.selectedAzureResource
            }),
            vmss: JSON.stringify({
                vmssResourceId: this.state.vmssResourceId,
                selectedVmssInstance: this.state.selectedVmssInstance
            })
        };
    }

    /**
     * Called to set the selections for workspace and computer group
     * If the workspaceId is already selected set the tthis.state.computerGroupId as needed otherwise do:
     *      1) Set  this.state.computerGroups to a one element array based on the computerGroup parameters
     *      2) Set this.state.computerGropuId as needed to computerGroup.id
     *      3) Set this.workspace to the workspace identified by workspaceId
     *      4) Query computer groups in workspace
     *      5) When query is done set this.state.computerGroupId to computerGroup.id parameters or to
     *  null if they are not found in the computerGroups
     * @param  {string} parentStr used in telemetry
     * @param  {IWorkspaceInfo} workspace workspace to select
     * @param  {SerializedComputerGroup} [computerGroup] group to select
     * Specifically, map will set this if it has a computer selected in its combo
     * @return void
     */
    private setPerfWorkspaceAndComputerGroup(
        parentStr: string,
        workspace: IWorkspaceInfo,
        computerGroup: SerializedComputerGroup,
        newState: IComputeAzMonPerfState): void {

        const handledAtStr = parentStr + '.setPerfWorkspaceAndComputerGroup';

        if (computerGroup && (!computerGroup.displayName || !computerGroup.id)) {
            this.telemetry.logException('ComputerGroup should have name and id', handledAtStr, ErrorSeverity.Error, {}, {});
            computerGroup = null;
        }

        if (!workspace) {
            throw 'local caller ensures workspace is set';
        }

        let workspaceAlreadySet = this.state.selectedHybridWorkspace && this.state.selectedHybridWorkspace.id
            && (workspace.id.toLowerCase() === this.state.selectedHybridWorkspace.id.toLowerCase());

        const incomingComputerGroupsAndSelectedGroup: IIncomingParameters =
            this.getIncomingGroupListAndSelectedGroup(computerGroup, !workspaceAlreadySet);

        newState.selectedHybridWorkspace = workspace;
        newState.computerGroups = incomingComputerGroupsAndSelectedGroup.computerGroups;
        newState.selectedComputerGroup = incomingComputerGroupsAndSelectedGroup.selectedGroup;
    }

    private getIncomingGroupListAndSelectedGroup(
        group: SerializedComputerGroup,
        workspaceChanged: boolean): IIncomingParameters {

        // 1. If workspace is changed but groupSelection is invalid then use defaultGroup as the selectedGroup
        // 2. If workspace is changed and the groupSelection is valid
        // then create a group and assign it to state.selectedGroup
        // 3. If workspace is not changed and the groupSelection is valid, then find a group from this.state.computerGroups
        // which matches with the incoming groupId
        // 4. If workspace is not changed and the groupSelection is invalid, do make any changes.

        // If we came from the map and it had a computer selected, the group will be null but we should not
        // reset the group because computerGroups are not being used in the incoming page
        if (workspaceChanged) {
            // Case 1
            if (!group || !group.id || !group.displayName) {
                return { computerGroups: [this.defaultGroup], selectedGroup: this.defaultGroup };
            }

            // Case 2
            const selectedGroup = ComputerGroupSerialization.getComputerGroupFromSerialization(group, this.telemetry);
            return { computerGroups: [selectedGroup], selectedGroup: selectedGroup };
        }

        // Below cases are for workspace unchanged scenario

        // If workspace is not changed and incoming group is also empty then do not change anything.
        if (!group || !group.id || !group.displayName) {
            return { computerGroups: this.state.computerGroups, selectedGroup: this.state.selectedComputerGroup };
        }

        // Workspace is not changed but computerGroup is changed in Map and computerGroups is not yet loaded in perf
        if (!this.state.computerGroupsLoaded) {
            const selectedGroup = ComputerGroupSerialization.getComputerGroupFromSerialization(group, this.telemetry);
            return { computerGroups: [selectedGroup], selectedGroup: selectedGroup };
        }

        // Find appropriate group from this.state.computerGroups
        const selectedGroup = ComputeMainPage.getComputerGroup(this.state.computerGroups, group.id) || this.defaultGroup;
        return { computerGroups: this.state.computerGroups, selectedGroup: selectedGroup };
    }

    /**
     * Called to update workspace and group after initialization
     * @param  {string} workspaceId
     * @param  {SerializedComputerGroup} computerGroup
     */
    private onUpdateContext(scopeSelections: BladeParameters.ScopeSelections,
        subscriptionList: BladeParameters.ISubscriptionInfo[],
        workspaceList: IWorkspaceInfo[]): void {
        const newState: IComputeAzMonPerfState = $.extend({}, this.state);

        // TODO ak: do we need to handle vmss?
        this.processAtScaleBladeParameters(scopeSelections, subscriptionList, workspaceList, newState);

        this.setState(newState);
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
                propertyType: this.propertyTypes[index],
            },
            null
        )
    }

    /**
     * measures have sequenceNumber and frame_name. We use frame_name to identify to which IFrame these telemetry measures belong to.
     * We need this field since Map and Perf both are sending onLoadComplete and both messages are coming to this callback.
     */
    private onLoadComplete(data: any): void {
        if (!data || !data.metrics || !data.customProperties) {
            return;
        }
        if (data.customProperties.frame_name === PerfChartQueryName) {
            TelemetryUtils.onLoadComplete((window as any).atScaleComputePerfInsights.performanceMeasures, data.metrics,
                this.telemetry, `${this.telemetryEventsPrefix}.IFrameLoadMeasures`, data.customProperties);
        }
    }

    /**
     * the panel is allowed to actually collapse itself; the state of collapse needs to be owned by main page
     * since he will also collapse the panel; rather then having two 'collapse' states, this difers the collapse
     * actions to the owner of the control with the side benefit that you can reject a collapse request from teh panel
     * @returns {void}
     */
    private togglePanelCollapse(): void {
        this.setState((prevState: IComputeAzMonPerfState) => {
            return {
                propertyPanelVisible: !prevState.propertyPanelVisible
            };
        }, () => {
            this.telemetry.logEvent(
                `${this.telemetryEventsPrefix}.${Constants.PropertyPaneToggled}`,
                {
                    pageName: 'At Scale Perf',
                    isCollapsed: this.state.propertyPanelVisible ? 'true' : 'false',
                },
                null);
        });
    }

    /**
     * Render the overview panel if the selection context allows us to; if nothing is selected or
     * no maps data is available, we show No Data message (and if nothing is selected we also
     * display a helpful hint at how to make data appear)
     * @returns {IDetailsPanel[]}
     */
    private propertyPanelContent(): IDetailsPanel[] {
        const propertyPanelContent: IDetailsPanel[] = [];
        this.propertyTypes = [];

        const context: ITopNListSelectionContext = this.state.topNListSelectionContext;
        if (!context || !context.selectedEntity ||
            (!context.workspace && context.selectedEntity?.entity?.type as number !== EntityType.UnmonitoredMachine)) {
            return propertyPanelContent
        }
        const selectedWorkspace: IWorkspaceInfo = context.workspace;
        const selectionContext: DependencyMap.SelectionContext = context.selectedEntity;
        const azureResourceId: string = context.resourceId;

        let body: JSX.Element = null;
        if (this.state.gridRowDataLoadFailed) {
            body = (<div className='center-flex column-flex'>
                <div>
                    <h2>{DisplayStrings.DataRetrievalError}</h2>
                </div>
            </div>);
        }
        if (body) { // error case
            // add all tabs with error messages.
            // Otherwise the panel will disppear and leaves some white space where the property panel should be
            propertyPanelContent.push({ tabName: DisplayStrings.Properties, tabIcon: <PropertiesSVG />, body });
            propertyPanelContent.push({ tabName: DisplayStrings.LogEvent, tabIcon: <SearchSVG />, body });
            propertyPanelContent.push({ tabName: DisplayStrings.Alerts, tabIcon: <AlertSVG />, body });
            return propertyPanelContent;
        }

        // add quickLinkSection for machine on the grid.
        let contextCopy: any = Object.assign({}, selectionContext);
        if (contextCopy && contextCopy.entity) {
            contextCopy.entity.linkProperties = this.state.quickLinksSection;
        }

        // Property panel
        if (contextCopy && contextCopy.entity) {
            propertyPanelContent.push({
                tabName: DisplayStrings.Properties,
                tabIcon: <PropertiesSVG />,
                body: <PropertyPanelSelector
                    selectedContext={
                        {
                            selectedEntity: contextCopy.entity,
                            selectedScopeFilter: this.state.selectedComputerGroup
                        }
                    }
                    telemetry={this.telemetry}
                    callbackCollection={
                        {
                            onOpenOnboarding: this.onOpenVmOnboarding
                        }
                    }
                    startDateTimeUtc={this.state.startDateTimeUtc}
                    endDateTimeUtc={this.state.endDateTimeUtc}
                    messagingProvider={this.messagingProvider}
                    workspace={this.state.selectedHybridWorkspace}
                />
            });
        }

        let propertyType: string = 'Properties';
        if ((selectionContext.entity as any).isMonitored) {
            propertyType = 'Monitored Machine';
        } else {
            propertyType = 'Unmonitored Machine';
        }
        this.propertyTypes.push(propertyType);

        // Log events panel
        const logEventPanelDisabled: boolean = !(selectionContext.entity
            && selectionContext.entity.type === DependencyMap.EntityType.Machine);
        propertyPanelContent.push({
            tabName: DisplayStrings.LogEvent,
            tabIcon: <SearchSVG />,
            forceRender: true,
            body: !logEventPanelDisabled && <LogEventPanel
                selectedContext={selectionContext}
                workspace={selectedWorkspace}
                resourceId={azureResourceId}
                startDateTimeUtc={this.state.startDateTimeUtc}
                endDateTimeUtc={this.state.endDateTimeUtc}
                messagingProvider={this.messagingProvider}
                telemetryPreFix={'AtScaleVmPerf'}
                telemetryMainArea={TelemetryMainArea.Compute}
                dateTime={this.state.dateTime}
            />,
            disabled: logEventPanelDisabled
        });
        this.propertyTypes.push('LogEvents');

        // Alerts panel V2
        const alertPanelProps = this.getAlertPanelV2Properties();
        // TODO: Because of technical issues, we are enabling alerts panel only for singleVM as of now.
        const alertPanelDisabled: boolean = !(selectionContext.entity && selectionContext.entity.type === DependencyMap.EntityType.Machine)
            || !(alertPanelProps && alertPanelProps.alertQueryParams && alertPanelProps.alertPanelHeaders);
        propertyPanelContent.push({
            tabName: DisplayStrings.Alerts,
            tabIcon: <AlertSVG />,
            body: !alertPanelDisabled && <AlertPanelV2
                alertSummaryQueryProps={alertPanelProps.alertQueryParams}
                panelHeaders={alertPanelProps.alertPanelHeaders}
                telemetry={this.telemetry}
                telemetryPrefix={this.telemetryEventsPrefix}
                messagingProvider={this.messagingProvider}
            />,
            disabled: alertPanelDisabled
        });
        this.propertyTypes.push('Alerts');
        return propertyPanelContent;
    }

    private renderContentRoot(): JSX.Element {
        const selectedWorkspace: IWorkspaceInfo = this.getSelectedHybridWorkspace();
        let scopeSelector: JSX.Element;
        // TODO ak: combine scope selections into single component
        if (this.state.solutionType === SolutionType.Hybrid) {
            scopeSelector = <ScaleControlPanel
                selectedWorkspace={selectedWorkspace}
                workspaceList={this.workspaceManager.getOrderedList()}
                selectedComputerGroup={this.state.selectedComputerGroup}
                vmScaleSetResourceId={this.state.vmssResourceId}
                messagingProvider={this.messagingProvider}
                dateTime={this.state.dateTime}
                onSelectionsChanged={this.onHybridControlPanelSelectionsChanged}
                telemetry={this.telemetry}
                logPrefix={this.telemetryEventsPrefix}
                workspaceManager={this.workspaceManager}
                displaySetting={this.isVmss()
                    ? {
                        showWorkspaceDropDown: false,
                        showGroupDropDown: false,
                        showComputerDropDown: false,
                        showWorkbookDropDown: true,
                        showSwitchToggle: false
                    }
                    : {
                        showWorkspaceDropDown: true,
                        showGroupDropDown: true,
                        showComputerDropDown: false,
                        showWorkbookDropDown: true,
                        showSwitchToggle: true
                    }}
                timeValidation={TimeUtils.notMoreThanThirtyDaysApart}
                supportedTimes={Constants.SupportedPerfTimes}
                onComputerGroupsLoaded={this.onComputerGroupsLoaded}
                defaultComputerGroup={this.defaultGroup}
                featureFlags={this.featureFlags}
                onSolutionTypeChanged={this.onSolutionTypeChanged}
                endDateTimeUtc={this.state.endDateTimeUtc}
            />;
        } else if (this.state.solutionType === SolutionType.Azure) {
            scopeSelector = <AzureScaleControlPanel
                selectedSubscriptionInfo={this.state.selectedSubscription}
                subscriptionsList={this.state.subscriptionList}
                selectedResourceGroupInfo={this.state.selectedResourceGroup}
                logPrefix={this.telemetryEventsPrefix}
                dateTime={this.state.dateTime}
                onSelectionsChanged={this.onAzureControlPanelSelectionsChanged}
                timeValidation={TimeUtils.notMoreThanThirtyDaysApart}
                messagingProvider={this.messagingProvider}
                telemetry={this.telemetry}
                supportedTimes={Constants.SupportedPerfTimes}
                featureFlags={this.featureFlags}
                onResourceGroupsLoaded={this.onResourceGroupsLoaded}
                // TODO ak: rework this logic, adapted from scale control panel
                displaySettings={this.isVmss()
                    ? {
                        enableSubscriptionDropDown: false,
                        enableResourceGroupDropDown: false,
                        enableWorkspaceDropDown: false,
                        enableResourceDropDown: false,
                        enableResourceTypeDropDown: false,
                        enableVmssInstanceDropdown: false,
                        enableWorkbookDropDown: true,
                        enableSwitchToggle: false
                    }
                    : {
                        enableSubscriptionDropDown: true,
                        enableResourceGroupDropDown: true,
                        enableWorkspaceDropDown: false,
                        enableResourceDropDown: false,
                        enableResourceTypeDropDown: true,
                        enableVmssInstanceDropdown: false,
                        enableWorkbookDropDown: true,
                        enableSwitchToggle: true
                    }}
                supportedResourceTypes={this.supportedResourceTypes}
                selectedResourceType={this.state.selectedResourceType}
                onSolutionTypeChanged={this.onSolutionTypeChanged}
                onWorkspacesLoaded={this.onAzureWorkspacesLoaded}
                selectedResource={this.state.selectedAzureResource}
                selectedVmssInstance={this.state.selectedVmssInstance}
                resourceGroups={this.state.resourceGroups}
                resources={this.state.azureResources}
                workspaces={[]}
                vmssInstances={this.state.vmssInstances}
                onVmssInstancesLoaded={this.onVmssInstancesLoaded}
                onResourcesLoaded={this.onAzureResourceLoaded}
                endDateTimeUtc={this.state.endDateTimeUtc}
            />
        }

        let atScaleTabs: JSX.Element = this.getAtScalePerfTabs();

        let atScaleOnboardingSection: JSX.Element;
        // If the selectedScope has zero workspaces then show onboarding message.
        if (this.state.solutionType === SolutionType.Azure
            && this.state.showAtScaleOnboardingMessage) {
            atScaleOnboardingSection = <AtScaleOnboardingSection />;
        }

        return <div className='content-root'>
            {scopeSelector}
            {atScaleOnboardingSection || atScaleTabs}
        </div>
    }

    private getAtScalePerfTabs(): JSX.Element {
        let selectedTabPanelClassName = '';
        if (this.state.selectedTab === 1) {
            selectedTabPanelClassName = 'react-tabs__tab-panel--selected';
        }
        const selectedWorkspace: IWorkspaceInfo = this.getSelectedHybridWorkspace();
        return <Tabs forceRenderTabPanel={true} className='infra-main-tabs'
            selectedTabClassName={'selected-tab'}
            selectedTabPanelClassName={selectedTabPanelClassName}
            selectedIndex={this.state.selectedTab}
            onSelect={this.onTabSelectionChanged.bind(this)}>
            <div className='pane-header compute-pane-header'>
                <TabList>
                    <Tab>{DisplayStrings.TopNMetricsTab}</Tab>
                    <Tab>{DisplayStrings.AggregateMetricsTab}</Tab>
                    <Tab>{DisplayStrings.TableTab}</Tab>
                </TabList>
            </div>
            <TabPanel>
                <ComputeTopNChartPane
                    isPaneVisible={this.state.selectedTab === PerformanceViewType.TopNCharts}
                    startDateTimeUtc={this.state.startDateTimeUtc}
                    endDateTimeUtc={this.state.endDateTimeUtc}
                    workspace={selectedWorkspace}
                    computerGroup={this.state.selectedComputerGroup}
                    messagingProvider={this.messagingProvider}
                    openTableTab={(requestedMetric) => this.onOpenTableForMetric(requestedMetric)}
                    pinToDashboard={this.pinToDashboard}
                    featureFlags={this.featureFlags}
                    seriesSelections={this.state.chartSeriesSelections}
                    onChartDataLoaded={this.onTopNChartDataLoaded}
                    onSeriesSelectionsChanged={this.onChartSeriesSelectionsChanged}
                    logPrefix={this.telemetryEventsPrefix}
                    createAlertRule={this.createNewAlertRule}
                    enablePinToDashboard={this.state.enablePinToDashboard}
                    vmScaleSetResourceId={this.state.vmssResourceId}
                    azureResourceInfo={this.getSelectedAzureResource()}
                    solutionType={this.state.solutionType}
                    azureResourceType={this.state.selectedResourceType}
                    isDefaultExperienceOfBlade={this.state.isDefaultExperienceOfBlade && true}
                />
            </TabPanel>
            <TabPanel>
                <ComputeChartPane
                    isPaneVisible={this.state.selectedTab === PerformanceViewType.AggregateCharts}
                    startDateTimeUtc={this.state.startDateTimeUtc}
                    endDateTimeUtc={this.state.endDateTimeUtc}
                    workspace={selectedWorkspace}
                    computerGroup={this.state.selectedComputerGroup}
                    messagingProvider={this.messagingProvider}
                    openTableTab={(requestedMetric) => this.onOpenTableForMetric(requestedMetric)}
                    seriesSelections={this.state.chartSeriesSelections}
                    chartData={this.state.aggregateChartData}
                    onChartDataLoaded={this.onAggregateChartDataLoaded}
                    onSeriesSelectionsChanged={this.onChartSeriesSelectionsChanged}
                    logPrefix={this.telemetryEventsPrefix}
                    pinToDashboard={this.pinToDashboard}
                    featureFlags={this.featureFlags}
                    enablePinToDashboard={this.state.enablePinToDashboard}
                    vmScaleSetResourceId={this.state.vmssResourceId}
                    azureResourceInfo={this.getSelectedAzureResource()}
                    solutionType={this.state.solutionType}
                    azureResourceType={this.state.selectedResourceType}
                    // TODO: Need to define default tab of perfView
                    isDefaultExperienceOfBlade={this.state.isDefaultExperienceOfBlade && false}
                />
            </TabPanel>
            <TabPanel>
                <ComputeGridPane
                    isPaneVisible={this.state.selectedTab === PerformanceViewType.TopNList}
                    subscriptionListManager={this.subscriptionListManager}
                    startDateTimeUtc={this.state.startDateTimeUtc}
                    endDateTimeUtc={this.state.endDateTimeUtc}
                    workspace={selectedWorkspace}
                    computerGroup={this.state.selectedComputerGroup}
                    metricName={this.state.selectedMetricName}
                    onRowSelected={this.rowSelectedOnGrid}
                    metricChanged={this.onMetricChanged}
                    logPrefix={this.telemetryEventsPrefix}
                    hidePropertyPanel={this.hidePropertyPanel}
                    vmScaleSetResourceId={this.state.vmssResourceId}
                    azureResourceInfo={this.getSelectedAzureResource()}
                    solutionType={this.state.solutionType}
                    azureResourceType={this.state.selectedResourceType}
                    featureFlags={this.featureFlags}
                    isDefaultExperienceOfBlade={this.state.isDefaultExperienceOfBlade && false}
                />
            </TabPanel>
        </Tabs>;

    }

    /**
     * This method returns selected workspace if the scope is Hybrid otherwise returns undefined.
     */
    private getSelectedHybridWorkspace(): IWorkspaceInfo | undefined {
        return this.state.solutionType === SolutionType.Hybrid ? this.state.selectedHybridWorkspace : undefined;
    }

    /**
     * If VMScaleSetInstance is selected then return VMSSINstance as selected resource
     * Else return selectedAzureResouce
     */
    private getSelectedAzureResource(): ResourceInfo {
        if (this.state.solutionType === SolutionType.Azure) {
            const selectedAzureResource: ResourceInfo = new ResourceInfo(this.state.selectedAzureResource);
            if (this.state.selectedVmssInstance && this.state.selectedVmssInstance.id && this.state.selectedVmssInstance.id !== 'all'
                && selectedAzureResource && selectedAzureResource.type === VmInsightsResourceType.VirtualMachineScaleSet) {

                return this.state.selectedVmssInstance;
            }
            return selectedAzureResource;
        }
        return undefined;
    }

    /**
     * This callback is invoked by control Panel child component.
     * After computer groups are loaded in the child component, same data is maintianed in this component as well.
     * NOTE: Do not modify the result returned by child component.
     * @param computerGroups
     */
    private onComputerGroupsLoaded(computerGroups: ComputerGroup[]) {
        this.setState({
            computerGroups: computerGroups,
            computerGroupsLoaded: true
        });
    }

    /**
     * This callback is invoked by control Panel child component.
     * After computer groups are loaded in the child component, same data is maintianed in this component as well.
     * NOTE: Do not modify the result returned by child component.
     * @param computerGroups
     */
    private onResourceGroupsLoaded(resourceGroups: ResourceInfo[]) {
        this.setState({
            resourceGroups: resourceGroups
        });
    }

    private onVmssInstancesLoaded(vmssInstances: ResourceInfo[]) {
        this.setState({
            vmssInstances
        });
    }

    /**
     * Called from the ComputeGridPane to navigate to the single vm perf page
     * @private
     * @param  {string} computerName
     * @param  {string} workspaceId
     * @param  {string} computerId
     * @return {void}@memberof ComputeMainPage
     */
    private onNavigateToSinglePerf(messageData: VmResourcePerfBladeParameters) {
        const logMessageData: any = Object.assign({
            dateTime: JSON.stringify(this.state.dateTime)
        }, messageData);
        const message: any = Object.assign({
            dateTime: this.state.dateTime
        }, messageData);

        this.telemetry.logEvent(`${this.telemetryEventsPrefix}.NavigateToSingleVMPerf`, logMessageData, undefined);
        this.messagingProvider.sendNavigateToSingleComputePerfMessage(message);
    }

    private onOpenVmOnboarding(resourceId: string): void {
        let telemetryPayload = { resourceId: resourceId };
        if (resourceId) {
            this.telemetry.logEvent(`${this.telemetryEventsPrefix}.OpenVmOnboarding`, telemetryPayload, undefined);
            this.messagingProvider.sendOpenOnboardingPane(resourceId);
        } else {
            this.telemetry.logException(`Failed to open onboading, VmResource Id is null or empty`,
                `${this.telemetryEventsPrefix}.OpenVmOnboarding`, ErrorSeverity.Error, telemetryPayload, undefined);
        }
    }

    private setPropertyPanelLoading() {
        this.setState({ propertyPanelLoading: true });
    }

    /** TODO bb: Refactor this method and make it simple
     * This violates our rule about this.state being referenced so why?  In this case hoisting a new
     * state into this component so the children access the new function with the new hoisted state cases
     * the kusto data to re-query... we need to detect that the only change is a new callback function and
     * not call kusto... this would take some re-work so better to accept some risk here
     * @param rowItem the new selected item
     * @returns {void}
     */
    private rowSelectedOnGrid(rowItem: any): void {
        this.setState({
            propertyPanelLoading: true,
            gridRowDataLoadFailed: false
        });

        if (rowItem && rowItem.columnData && rowItem.columnData.length > 0) {
            const combinedEntityProperties: any = rowItem.columnData[GridDataColumn.EntityProperties];
            const resourceId: string = combinedEntityProperties.AzureResourceIdFromOMS;
            const workspacePromise: Promise<IWorkspaceInfo> =
                this.getWorkspaceOfTopNListSelectedEntity(combinedEntityProperties.AzureResourceIdFromOMS);
            workspacePromise.then((workspace: IWorkspaceInfo) => {
                if (!workspace) {
                    this.telemetry.logEvent(`${this.telemetryEventsPrefix}.rowSelectedOnGrid`, {
                        errorMessage: 'Unable to get the workspaceId of the selected computer.',
                        computerId: combinedEntityProperties.azureResourceId,
                        isError: 'true'
                    },
                        {});
                    const unMonitoredMachine: InsightsUnmonitoredMachine =
                        new InsightsUnmonitoredMachine(combinedEntityProperties.AzureResourceIdFromOMS);
                    unMonitoredMachine.isMonitored = false;
                    unMonitoredMachine.displayName = combinedEntityProperties.name || DisplayStrings.undefine;
                    this.setState({
                        topNListSelectionContext: ({
                            workspace, resourceId,
                            selectedEntity: { entity: unMonitoredMachine, nodes: [], edge: null }
                        }),
                        propertyPanelLoading: false,
                        gridRowDataLoadFailed: false
                    });
                    return;
                }

                const quickLinksSection: JSX.Element = <VmInsightsQuicklinks
                    workspace={workspace}
                    computerName={combinedEntityProperties.computer}
                    serviceMapResourceId={combinedEntityProperties.mappingResourceId}
                    azureResourceId={combinedEntityProperties.azureResourceId || combinedEntityProperties.AzureResourceIdFromOMS}
                    dateTime={this.state.dateTime}
                    vmScaleSetResourceId={this.state.vmssResourceId}
                    vmssInstanceId={combinedEntityProperties.scaleSetInstanceId}
                    type={combinedEntityProperties.type}
                    displaySettings={
                        {
                            showMapLink: true,
                            showConnectionWorkbookLink: true,
                            showPerfViewLink: true,
                            showResourceLink: true,
                            isSingleVm: true
                        }
                    }
                    telemetryEventPrefix={this.telemetryEventsPrefix}
                    telemetryProvider={this.telemetry}
                    messagingProvider={this.messagingProvider}
                />;
                this.setState({ quickLinksSection });

                //no mappingResourceId means no dependency agent. we try to show onboarding button for these machine.
                if (!combinedEntityProperties.mappingResourceId) {
                    const unMonitoredMachine: InsightsUnmonitoredMachine =
                        new InsightsUnmonitoredMachine(combinedEntityProperties.AzureResourceIdFromOMS);
                    unMonitoredMachine.isMonitored = false;
                    unMonitoredMachine.displayName = combinedEntityProperties.name || DisplayStrings.undefine;
                    this.setState({
                        topNListSelectionContext: ({
                            workspace, resourceId,
                            selectedEntity: { entity: unMonitoredMachine, nodes: [], edge: null }
                        }),
                        propertyPanelLoading: false,
                        gridRowDataLoadFailed: false
                    });
                    return;
                }
                const thisQuerySequenceNumber: number = ++this.pendingQuerySequenceNumber;
                const mappingResourceId = combinedEntityProperties.mappingResourceId || '';
                const machineId = mappingResourceId.replace(/machines\//, '');
                const computerName = combinedEntityProperties.computer || '';
                this.getPanelDataFromServiceMap(machineId, workspace, this.state).then((entity: any) => {
                    if (thisQuerySequenceNumber !== this.pendingQuerySequenceNumber) {
                        return;
                    }

                    if (!entity) {
                        const error = new Error('Parsed object resulted in no data!');
                        this.telemetry.logException(error, 'ComputeMainPage.rowSelectedOnGrid', ErrorSeverity.Warn,
                            {
                                workspaceIds: workspace.id,
                                resourceId: machineId,
                                computerName: computerName
                            },
                            undefined);

                        // bbax; not an error, just no data
                        this.setState({
                            topNListSelectionContext: ({
                                workspace, resourceId,
                                selectedEntity: { entity: {} as any, nodes: [], edge: null }
                            }),
                            propertyPanelLoading: false,
                            gridRowDataLoadFailed: false,
                            propertyPanelVisible: true
                        });
                        return;
                    }

                    // bbax; success!
                    this.setState({
                        topNListSelectionContext: { workspace, resourceId, selectedEntity: entity },
                        propertyPanelLoading: false,
                        gridRowDataLoadFailed: false,
                        propertyPanelVisible: true
                    });
                }).catch((err) => {
                    this.telemetry.logException(err, 'ComputeMainPage.rowSelectedOnGrid', ErrorSeverity.Warn,
                        {
                            workspaceIds: workspace.id,
                            computerName: mappingResourceId
                        },
                        undefined);

                    let gridRowDataLoadFailed = true;
                    if (err.responseText && err.responseText.indexOf('An invalid resource ID was specified.') !== -1) {
                        gridRowDataLoadFailed = false;
                    }
                    if (thisQuerySequenceNumber !== this.pendingQuerySequenceNumber) {
                        return;
                    }
                    this.setState({
                        topNListSelectionContext: ({ workspace, resourceId, selectedEntity: { entity: {} as any, nodes: [], edge: null } }),
                        propertyPanelLoading: false,
                        gridRowDataLoadFailed
                    });
                });
            });

        } else {
            // bbax; something really bad happened during load, the UI is in a bad state!
            this.setState({ topNListSelectionContext: undefined, propertyPanelLoading: false, gridRowDataLoadFailed: true });
        }
    }

    /**
     * This method returns workspace for the selected row in topN List.
     */
    private getWorkspaceOfTopNListSelectedEntity(resourceId: string): Promise<IWorkspaceInfo> {
        if (this.state.solutionType === SolutionType.Hybrid) {
            return new Promise((resolve, reject) => { resolve(this.state.selectedHybridWorkspace) });
        } else {
            return this.vmInsightsOnboardingProvider.GetVmInsightsOnboardingStatus({
                resourceId, headers: {}, telemetryPrefix: this.telemetryEventsPrefix
            })
                .then((result: IWorkspaceInfo[]) => {
                    return result?.[0];
                });
        }
    }

    /**
     *
     * @param mappingResourceId
     * @param hoistedState
     */
    private getPanelDataFromServiceMap(machineId: string, machineWorkspace: IWorkspaceInfo, hoistedState: IComputeAzMonPerfState)
        : Promise<DependencyMap.SelectionContext> {
        return this.mapCacheProvider.getMachine(machineWorkspace, machineId, this.state.startDateTimeUtc, this.state.endDateTimeUtc);
    }

    /**
     * lifting the metric state up into main page for deeplinking simplicity
     * @param metricName selected metric
     * @returns {void}
     */
    private onMetricChanged(metricName: string): void {
        this.setState({ topNListSelectionContext: undefined, selectedMetricName: metricName });
    }

    /**
     * Method to process initialization message.
     * This information will be recieved only once for each possible soultionType.
     * @param data Initialization message received from blade.
     */
    private onInit(data: IAtScalePerfInitMessage): void {
        const newState: IComputeAzMonPerfState = $.extend({}, this.state);

        if (!data) {
            return;
        }

        // Set the cloud in our environment config
        if (!EnvironmentConfig.Instance().isConfigured()) {
            EnvironmentConfig.Instance().initConfig(data.azureCloudType, EnvironmentConfig.Instance().isMPACLegacy());
        }

        this.telemetry.setContext({
            correlationId: data.correlationId
        }, false);

        this.featureFlags = data.featureFlags;

        // one time initialization
        if (data.timeData) {
            TimeUtils.reconstructAbsoluteDates(data.timeData);
            if (!isTimeDataEqual(data.timeData, this.state.dateTime)) {
                if (TimeUtils.canUseTimeData(data.timeData,
                    Constants.SupportedPerfTimes,
                    TimeUtils.notMoreThanThirtyDaysApart)) {
                    // TODO ak: is this a bug??? this value gets overwritten right after
                    newState.dateTime = data.timeData;
                }

                const startAndEnd = TimeInterval.getStartAndEndDate(data.timeData, isRelative(data.timeData));
                newState.dateTime = data.timeData;
                newState.startDateTimeUtc = startAndEnd.start;
                newState.endDateTimeUtc = startAndEnd.end;
            }
        }

        // For topNChart tab or invalid number keep default topNChart, otherwise set state
        if (data.defaultPerformanceTabSubTab && (data.defaultPerformanceTabSubTab === PerformanceViewType.TopNList
            || data.defaultPerformanceTabSubTab === PerformanceViewType.AggregateCharts)) {
            newState.selectedTab = data.defaultPerformanceTabSubTab;
        }

        this.featureFlags = data.featureFlags;
        this.updateAuthorizationHeader(data.authHeaderValue);

        if (!!data.atScaleBladeParameters && !!data.atScaleBladeParameters.scopeSelections) {
            const subscriptionList: ISubscriptionInfo[] = data.subscriptionList;
            const workspaceList: IWorkspaceInfo[] = data.workspaceList;
            this.processAtScaleBladeParameters(data.atScaleBladeParameters.scopeSelections, subscriptionList, workspaceList, newState);
        }

        if (!!data.vmssBladeParameters) {
            this.processVmssBladeParameters(data.vmssBladeParameters, newState);
        }
        newState.isDefaultExperienceOfBlade = data.isDefaultTab;
        this.setState(newState);
    }

    private processAtScaleBladeParameters(scopeSelections: BladeParameters.ScopeSelections,
        subscriptionList: ISubscriptionInfo[],
        workspaceList: IWorkspaceInfo[],
        newState: IComputeAzMonPerfState): void {

        const solutionType: SolutionType = (scopeSelections?.solutionType as SolutionType) || SolutionType.Azure;

        const newDateTime: TimeData = (scopeSelections && scopeSelections.timeRange && scopeSelections.timeRange.performanceTab
            || this.state.dateTime) as TimeData;

        /* hybrid */
        const hybridScopeSelections: BladeParameters.HybridScopes = scopeSelections.scopes && scopeSelections.scopes.hybrid || {};
        const initWorkspaceList: IWorkspaceInfo[] = workspaceList?.length > 0 ? workspaceList
            : (hybridScopeSelections.workspace && [hybridScopeSelections.workspace]);
        const localWorkspaceManagerParams: ISyncLocalWorkspaceManagerParams = {
            workspaceManager: this.workspaceManager,
            workspaceList: initWorkspaceList,
            selectedWorkspace: hybridScopeSelections.workspace,
            isLoaded: workspaceList?.length > 0,
            telemetry: this.telemetry,
            parentTelemetrySource: 'onInit'
        };

        // BB TODO: Why do we need syncLocalWorkspaceManager
        const updatedWorkspace: IWorkspaceInfo = AtScaleUtils.syncLocalWorkspaceManager(localWorkspaceManagerParams);
        if (!!updatedWorkspace) {
            this.setPerfWorkspaceAndComputerGroup(
                'onInit',
                updatedWorkspace,
                hybridScopeSelections.computerGroup,
                newState
            );
        }

        /* azure */
        const azureScopeSelections: BladeParameters.AzureScopes = scopeSelections.scopes && scopeSelections.scopes.azure || {};
        const selectedSubscription: ISubscriptionInfo = azureScopeSelections.subscription;

        let selectedResourceGroup: ResourceInfo = defaultResourceGroupInfo;
        const currentResourceGroup: BladeParameters.IResourceInfo = azureScopeSelections.resourceGroup;
        if (!!currentResourceGroup) {
            selectedResourceGroup = new ResourceInfo({
                id: currentResourceGroup.id,
                displayName: currentResourceGroup.displayName,
                type: VmInsightsResourceType.ResourceGroup,
                location: currentResourceGroup.location
            });
        }
        const selectedAzureResource: ResourceInfo = AtScaleUtils.getSelectedAzureResource(selectedSubscription,
            selectedResourceGroup);

        let selectedResourceType: VmInsightsResourceType;
        switch (azureScopeSelections.resourceType) {
            case VmInsightsResourceType.VirtualMachine:
                selectedResourceType = VmInsightsResourceType.VirtualMachine;
                break;
            case VmInsightsResourceType.VirtualMachineScaleSet:
            case VmInsightsResourceType.VmScaleSetInstance:
                selectedResourceType = VmInsightsResourceType.VirtualMachineScaleSet;
                break;
            case VmInsightsResourceType.AzureArcMachine:
                selectedResourceType = VmInsightsResourceType.AzureArcMachine;
                break;
            default:
                selectedResourceType = this.supportedResourceTypes[0];
                break;
        }
        /* new state */
        newState.solutionType = solutionType;
        newState.subscriptionList = subscriptionList;
        newState.selectedSubscription = selectedSubscription;
        newState.selectedResourceGroup = selectedResourceGroup;
        newState.selectedAzureResource = selectedAzureResource;
        newState.selectedResourceType = selectedResourceType;
        newState.dateTime = newDateTime;
    }

    /**
     * Force solution type to hybrid mode for VMSS
     *
     * @private
     * @param {BladeParameters.VmScaleSetInsightsBladeParams} data
     * @param {IComputeAzMonPerfState} newState
     * @memberof ComputeMainPage
     */
    private processVmssBladeParameters(data: BladeParameters.VmScaleSetInsightsBladeParams, newState: IComputeAzMonPerfState): void {
        if (data.vmScaleSetResourceId) {
            newState.vmssResourceId = data.vmScaleSetResourceId;
            newState.solutionType = SolutionType.Hybrid;
            newState.selectedComputerGroup = undefined; // If don't clear selectedGroup then 'All' group will be used in the query.
        }
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

    private onStyleThemeInit(theme: any) {
        if (!theme) {
            throw 'No theme object was passed from Azure portal';
        }
        const themeName: string = theme.name;
        if (themeName) {
            let bodyTheme: string = themeName === msg.PortalThemes.Dark ? 'dark' : 'light';
            $('body').removeClass(`${this.bodyTheme}`);
            $('body').addClass(`${bodyTheme}`);
            this.bodyTheme = bodyTheme;
        }
    }

    /**
     * Called when chart data aggegation selections are changed in SingleComputeChartPane
     * @private
     * @param  {string} chartId // id of the chart for which the selections were changed
     * @param {any} newSelections // new aggegation selections
     * @return {void}@memberof SingleComputePerf
     */
    private onChartSeriesSelectionsChanged = (chartId: string, optionId: string, isOptionSelected: boolean, newSelections: any): void => {
        this.setState((prevState: IComputeAzMonPerfState) => {
            if (!prevState.chartSeriesSelections || !prevState.chartSeriesSelections.hasOwnProperty(chartId)) {
                // appinsights should pick up and log
                throw 'Chart id doest exist on toggle ' + chartId;
            }

            // TODO bb: This is called by topNChart and aggregatedChart. Need to update the telemetry name
            const selectedAzureResource: ResourceInfo = this.getSelectedAzureResource();
            const selectedWorkspace: IWorkspaceInfo = this.getSelectedHybridWorkspace();
            this.telemetry.logEvent(`${this.telemetryEventsPrefix}.ChartSeriesSelectionChanged`, {
                pageName: 'Aggregate Perf',
                resourceId: selectedAzureResource && selectedAzureResource.id,
                solutionType: this.state.solutionType,
                workspaceId: selectedWorkspace && selectedWorkspace.id,
                chartId,
                optionId,
                isOptionSelected: isOptionSelected.toString()
            }, undefined);

            const chartSeriesSelections = update(prevState.chartSeriesSelections, {
                [chartId]: { $set: newSelections }
            });

            return {
                chartSeriesSelections
            };
        });
    }

    /**
     * Responds to changes in combo selections
     * @param  {IScaleControlPanelSelections} selections
     */
    private onHybridControlPanelSelectionsChanged(selections: IScaleControlPanelSelections): void {
        const newState: IComputeAzMonPerfState = $.extend({}, this.state);
        switch (selections.type) {
            case HybridControlPanelDropDownType.workspace:
                // workspace change, clear out group list, and make call for them
                newState.selectedHybridWorkspace = selections.selectedWorkspace;
                newState.selectedComputerGroup = ComputerGroupProvider.AllComputersGroup;
                newState.computerGroups = [ComputerGroupProvider.AllComputersGroup];
                newState.topNListSelectionContext = undefined;
                newState.computerGroupsLoaded = false;

                this.messagingProvider.sendUpdatedScopeSelections({
                    scopes: {
                        hybrid: {
                            workspace: selections.selectedWorkspace
                        }
                    }
                });
                break;
            case HybridControlPanelDropDownType.group:
                let selectedGroup = this.state.computerGroups && selections.selectedGroupId ? this.state.computerGroups.find(
                    (group) => group.id.toLowerCase() === selections.selectedGroupId.toLowerCase())
                    : ComputerGroupProvider.AllComputersGroup || ComputerGroupProvider.AllComputersGroup;

                newState.selectedComputerGroup = selectedGroup;
                newState.topNListSelectionContext = undefined;

                const computerGroup: SerializedComputerGroup = ComputerGroupSerialization.getComputerGroupSerialization(selectedGroup)
                this.messagingProvider.sendUpdatedScopeSelections({
                    scopes: {
                        hybrid: {
                            workspace: selections.selectedWorkspace,
                            computerGroup: computerGroup as BladeParameters.SerializedComputerGroup
                        }
                    }
                });
                break;
            case HybridControlPanelDropDownType.time:
                this.onTimeIntervalChanged(newState, selections.selectedTimeRange);
                break;
            default:
                throw 'unexpect drop down selection type';
        }
        this.setState(newState);
    }

    /**
     * Responds to changes made in Azure type selection panel
     * @param selections
     */
    private onAzureControlPanelSelectionsChanged(selections: IAzureScaleControlPanelSelections) {
        let selectedAzureResource: ResourceInfo;
        const newState: IComputeAzMonPerfState = $.extend({}, this.state);
        switch (selections.type) {
            case AzureControlPanelDropDownType.subscription:

                newState.selectedSubscription = selections.selectedSubscription;
                newState.selectedAzureResource = new ResourceInfo({
                    id: selections.selectedSubscription.subscriptionId,
                    displayName: selections.selectedSubscription.displayName,
                    type: VmInsightsResourceType.Subscription
                });
                newState.selectedResourceGroup = undefined;
                newState.selectedVmssInstance = defaultVmssInstance;
                newState.topNListSelectionContext = undefined;

                this.messagingProvider.sendUpdatedScopeSelections({
                    scopes: {
                        azure: {
                            subscription: selections.selectedSubscription
                        }
                    }
                });
                break;
            case AzureControlPanelDropDownType.resourceGroup:
                selectedAzureResource = AtScaleUtils.getSelectedAzureResource(this.state.selectedSubscription,
                    selections.selectedResourceGroup);

                newState.selectedResourceGroup = selections.selectedResourceGroup;
                newState.selectedAzureResource = selectedAzureResource;
                newState.selectedVmssInstance = defaultVmssInstance;
                newState.topNListSelectionContext = undefined;

                this.messagingProvider.sendUpdatedScopeSelections({
                    scopes: {
                        azure: {
                            resourceGroup: selections.selectedResourceGroup && selections.selectedResourceGroup.toJSON()
                        }
                    }
                });
                break;
            case AzureControlPanelDropDownType.resourceType:
                selectedAzureResource = AtScaleUtils.getSelectedAzureResource(this.state.selectedSubscription,
                    this.state.selectedResourceGroup);

                newState.selectedResourceType = selections.selectedResourceType;
                newState.selectedAzureResource = selectedAzureResource;
                newState.selectedVmssInstance = defaultVmssInstance;
                newState.topNListSelectionContext = undefined;

                this.messagingProvider.sendUpdatedScopeSelections({
                    scopes: {
                        azure: {
                            resourceType: selections.selectedResourceType
                        }
                    }
                });
                break;
            case AzureControlPanelDropDownType.resource:
                if (!selections.selectedResource) {
                    return;
                }

                newState.selectedAzureResource = selections.selectedResource;
                newState.selectedVmssInstance = defaultVmssInstance;
                newState.singleVmPerfSessionId = GUID().toLowerCase();
                newState.topNListSelectionContext = undefined;

                this.messagingProvider.sendUpdatedScopeSelections({
                    scopes: {
                        azure: {
                            subscription: this.state.selectedSubscription,
                            resourceGroup: this.state.selectedResourceGroup.toJSON(),
                            resource: selections.selectedResource.toJSON()
                        }
                    }
                });
                break;
            case AzureControlPanelDropDownType.vmssInstance:
                // No need to update workspace list since VMSS workspace and VMSS instance workspace
                // are assumed to be same.
                if (!selections.selectedVmssInstance) {
                    return;
                }

                newState.selectedVmssInstance = selections.selectedVmssInstance;
                newState.singleVmPerfSessionId = GUID().toLowerCase();
                newState.topNListSelectionContext = undefined;

                break;
            case AzureControlPanelDropDownType.time:
                this.onTimeIntervalChanged(newState, selections.selectedTimeRange);
                break;
            default:
                throw 'Unexpected azure control panel dropdown selection type'
        }
        this.setState(newState);
    }

    private onTimeIntervalChanged(newState: IComputeAzMonPerfState, newTimeRange: TimeData): void {
        //renew the time, and make request for computerlist and group list
        // If the selected time range is absolute then disable PinToDashBoard icon in the charts.
        const isTimeRangeRelative: boolean = isRelative(newTimeRange);
        const startAndEnd = TimeInterval.getStartAndEndDate(newTimeRange, isTimeRangeRelative);
        const enablePinToDashboard: boolean = isTimeRangeRelative;

        newState.dateTime = newTimeRange;
        newState.startDateTimeUtc = startAndEnd.start;
        newState.endDateTimeUtc = startAndEnd.end;
        newState.enablePinToDashboard = enablePinToDashboard;
    }

    private onSolutionTypeChanged(solutionType: string): void {
        this.telemetry.logEvent(`${this.telemetryEventsPrefix}.SolutionTypeChanged`, {
            solutionType
        }, {});
        this.setState({
            solutionType: solutionType === 'hybrid' ? SolutionType.Hybrid : SolutionType.Azure,
            topNListSelectionContext: undefined
        });
        // Post solutionType to Blade
        this.messagingProvider.sendVmInsightsSolutionType(solutionType);
    }

    /**
     * This callback will be called whenever azure resources are loaded by azureControlPanel
     * @param resources
     */
    private onAzureResourceLoaded(azureResources: ResourceInfo[]): void {
        this.setState({
            azureResources
        });
    }

    private onAzureWorkspacesLoaded(workspaceList: IWorkspaceInfo[]): void {
        // If the selectedResource is a VM or a VMSS and if there are no active workspaces
        // Then, launch Onbaording blade.
        if ((this.state.selectedAzureResource && this.state.selectedAzureResource.id)
            && (!workspaceList || workspaceList.length === 0)) {
            this.messagingProvider.sendOpenOnboardingPane(this.state.selectedAzureResource.id);
        }

        // TODO: Show different onBoarding message for Single Resource vs resourceGroup/Subscription
        workspaceList = workspaceList || [];
        this.setState((prevState) => {
            let changes: any = {
                showAtScaleOnboardingMessage: { $set: (!workspaceList || workspaceList.length === 0) },
                selectedAzureWorkspaceList: { $set: workspaceList }
            };
            let newState = update(prevState, changes);
            return newState;
        });
    }

    /**
     * Called to log a page view for one of the tabs
     * @param  {number} index index of the selected tab
     */
    private logPageView(index: number): void {
        if (index < 0 || index >= this.loggedPageView.length) {
            throw 'Invalid page view index selection';
        }

        if (this.loggedPageView[index]) {
            return;
        }

        this.loggedPageView[index] = true;

        const page = index === 0 ? 'TopNCharts' : (index === 1 ? 'AggregateCharts' : 'TopNList');
        this.telemetry.logPageView(`${this.telemetryEventsPrefix}.PageView.` + page);
    }

    private onTabSelectionChanged(index: number, last?: number, event?: Event): boolean | void {
        this.setState({ selectedTab: index });
        this.logPageView(index);
        return true;
    }

    private onOpenTableForMetric(requestedMetric: string) {
        this.telemetry.logEvent(`${this.telemetryEventsPrefix}.${Constants.ComputePerfOnOpenTableForMetric}`, { requestedMetric }, null);
        this.setState({ selectedTab: 2, selectedMetricName: requestedMetric });
    }

    private createNewAlertRule(requestedMetric: string) {
        this.telemetry.logEvent(`${this.telemetryEventsPrefix}.createNewAlertRule`, { requestedMetric }, null);
        let resourceId: string;
        let signalType: VmInsightsAlertRulesSignalType;
        if (this.isVmss()) {
            resourceId = this.state.vmssResourceId;
            signalType = VmInsightsAlertRulesSignalType.Metric;
        } else if (this.state.solutionType === SolutionType.Hybrid) {
            resourceId = this.state.selectedHybridWorkspace?.id;
            signalType = VmInsightsAlertRulesSignalType.Log;
        } else {
            resourceId = this.state.selectedAzureResource?.id;
            signalType = VmInsightsAlertRulesSignalType.Metric;
        }
        const alertRuleParams: VmInsightsCreateAlertRuleParams = { resourceId, signalType, metricId: requestedMetric };
        this.telemetry.logEvent(`${this.telemetryEventsPrefix}.AlertRuleIconClicked`,
            {
                params: JSON.stringify(alertRuleParams)
            }, undefined);
        this.messagingProvider.sendCreateAlertRule(alertRuleParams);
    }

    private pinToDashboard(chartId: string, showOptionPicker: boolean) {
        if (!this.state.enablePinToDashboard) {
            return;
        }
        const currentScopeSelection: any = this.getCurrentScopeSelection()
        this.telemetry.logEvent(`${this.telemetryEventsPrefix}.pinToDashboard`, { currentScopeSelection }, null);

        const serializedComputerGroup: SerializedComputerGroup = this.state.selectedComputerGroup
            ? ComputerGroupSerialization.getComputerGroupSerialization(this.state.selectedComputerGroup) : undefined;
        const message: AtScalePinChartToDashboardMessage = {
            metricQueryId: chartId,
            workspaceInfo: this.getSelectedHybridWorkspace(),
            timeRange: this.state.dateTime,
            computerGroup: serializedComputerGroup,
            defaultOptionPicks: this.state.chartSeriesSelections[chartId],
            showOptionPicker,
            selectedTab: this.state.selectedTab,
            azureScopeSelection: {
                selectedResourceGroup: this.state.selectedResourceGroup,
                selectedSubscription: this.state.selectedSubscription,
                selectedResourceType: this.state.selectedResourceType,
                selectedResource: this.state.selectedAzureResource
            },
            solutionType: this.state.solutionType
        }
        this.messagingProvider.sendAtScalePinChartToDashboardMessage(message);
    }

    /**
     * update token, and assign initState once got token
     */
    private updateAuthorizationHeader(authorizationHeaderValue: string) {
        const initInfo = InitializationInfo.getInstance();

        if (initInfo.getAuthorizationHeaderValue(AuthorizationTokenType.Arm) !== authorizationHeaderValue) {
            initInfo.setAuthorizationHeaderValue(AuthorizationTokenType.Arm, authorizationHeaderValue);
        }

        if (!this.state.isAuthorizationInfoReceived) {
            (window as any).atScaleComputePerfInsights.performanceMeasures['frame_tokenReceived'] = Date.now();
            this.setState({ isAuthorizationInfoReceived: true });
        }
    }

    private onAggregateChartDataLoaded = (chartData: StringMap<StringMap<ChartSeriesData>>): void => {
        this.setState({ aggregateChartData: chartData });
    }

    private onTopNChartDataLoaded = (): void => {
        // This is the default tab currently, if at any point in time if we decide to set other tab as default
        // rework sending telemetry appropriately
        if (this.completedChartQuery) {
            return;
        }

        this.completedChartQuery = true;
        this.sendFinishedLoading();
    }

    /**
     * Call sendFinishedLoading if we can and should, that is if map and computersGroups queries completed and we have not already sent
     */
    private sendFinishedLoading() {
        if (!this.sentFinishLoading && this.completedChartQuery) {
            this.messagingProvider.sendFinishedLoading({
                networkQueryName: PerfChartQueryName,
                metrics: (window as any).atScaleComputePerfInsights.performanceMeasures
            });
            this.sentFinishLoading = true;
        }
    }

    private onSingleVmDiskGridQueryCompleted(hasLatencyCounters: boolean) {
        this.setState({
            singlVmPerfDiskGridHasLatencyCounters: hasLatencyCounters
        });
    }

    /**
     * Called when the selection changes in a chart to log telemetry for it
     * @private
     * @param  {string} chartId
     * @param  {string} optionId
     * @param  {string} onOrOff
     * @return {void}@memberof SingleComputePerf
     */
    private onSingleVmPerfChartSelectionChanged(chartId: string, optionId: string, isOptionSelected: boolean) {
        const resource = this.getSelectedAzureResource();
        this.telemetry.logEvent(`${this.telemetryEventsPrefix}.SingleVMPerf.ChartSeriesSelectionChanged`, {
            pageName: 'Single VM Perf',
            computerId: resource.id,
            computerName: resource.displayName,
            chartId: chartId,
            optionId: optionId,
            isOptionSelected: isOptionSelected ? 'true' : 'false'
        }, undefined);
    }

    /**
     * Refreshes the map. Last 30 minutes, for instance, would be the last 30 minutes from now.
     */
    private onRefresh(): void {
        const startAndEnd = TimeInterval.getStartAndEndDate(this.state.dateTime, isRelative(this.state.dateTime));
        this.setState({
            startDateTimeUtc: startAndEnd.start,
            endDateTimeUtc: startAndEnd.end
        });
    }

    /**
     * Updates a state in order to hide the property panel
     */
    private hidePropertyPanel(): void {
        if (this.state.propertyPanelVisible) {
            this.setState({
                propertyPanelVisible: false
            });
        }
    }

    /**
     * This method computers alertQuery parameters and alert panel headers
     * based on selected entity.
     */
    private getAlertPanelV2Properties() {
        const timeInterval = new TimeInterval(this.state.startDateTimeUtc,
            this.state.endDateTimeUtc,
            Constants.IdealAggregateChartDataPoints);
        let alertQueryParams: IPropertiesPanelQueryParams = {
            timeInterval,
            workspace: this.getSelectedHybridWorkspace()
        };

        let alertPanelHeaders: IAlertPanelHeaders;

        // We need to consider below possible usecases while constructing AlertQueryParams
        // 1. If there is any selectionContext then use that selection context to load alert summary.
        // 2. Otherwise, If the IFrame is opened in VMSS context, then we just need to fill vmssResourceId
        // 3. If the iFrame is opened in AtScaleView, then check for solutionType.
        // 3.1. If the solutionType is Hybrid, then alertSummary can belong to either workspace
        // or a computerGroup or a selectedComputer.
        // Else if the solutionType is Azure, then alertSummary can belong to selected azure resource.
        if (this.state.topNListSelectionContext
            && this.state.topNListSelectionContext.selectedEntity
            && this.state.topNListSelectionContext.selectedEntity.entity) {
            const machineDetails = MachinePropertyPanelAdaptor.getMachineAdaptor(this.telemetry,
                this.state.topNListSelectionContext.selectedEntity.entity, this.messagingProvider);
            if (machineDetails) {
                const machineAzureDetails = machineDetails.getAzureVMProperties();
                let computerName = machineDetails.getMachineNameForQuery();
                let azureResourceId: string;
                if (machineAzureDetails) {
                    machineAzureDetails.forEach((azureProp) => {
                        if (azureProp.propertyName === DisplayStrings.ResourceId
                            && azureProp.propertyValues && azureProp.propertyValues.length > 0) {
                            azureResourceId = azureProp.propertyValues[0];
                        }
                    });
                }
                alertQueryParams.workspace = this.state.topNListSelectionContext.workspace;
                alertQueryParams.resourceId = azureResourceId;
                alertQueryParams.computerName = computerName;

                alertPanelHeaders = {
                    panelId: this.state.topNListSelectionContext.selectedEntity.entity.id,
                    displayName: machineDetails.getTitle(),
                    displayIcon: machineDetails.getIcon()
                };
            }
        } else if (this.isVmss()) {
            const resourceDescriptor = AtScaleUtils.getAzureComputeResourceDescriptor(this.state.vmssResourceId);
            if (resourceDescriptor && resourceDescriptor.type === 'microsoft.compute/virtualmachinescalesets') {
                alertQueryParams.resourceId = this.state.vmssResourceId;
                alertPanelHeaders = {
                    panelId: this.state.vmssResourceId,
                    displayName: resourceDescriptor && resourceDescriptor.resources && resourceDescriptor.resources[0],
                    displayIcon: undefined // TODO: Get icon for vmss
                };
            }
        } else if (this.state.solutionType === SolutionType.Azure) {
            const selectedAzureResource = this.getSelectedAzureResource();
            alertQueryParams.resourceId = selectedAzureResource.id;

            alertPanelHeaders = {
                panelId: selectedAzureResource.id,
                displayName: selectedAzureResource.displayName,
                displayIcon: undefined // TODO: Get icon for selected resource
            };
        } else if (this.state.selectedComputerGroup && this.state.selectedComputerGroup.id !== this.defaultGroup.id) {
            // Selected solutionType is Hybrid.
            alertQueryParams.computerGroup = this.state.selectedComputerGroup;

            alertPanelHeaders = {
                panelId: this.state.selectedComputerGroup.id,
                displayName: this.state.selectedComputerGroup.displayName,
                displayIcon: this.state.selectedComputerGroup.icon
            };
        }
        return {
            alertQueryParams,
            alertPanelHeaders
        };
    }

    private subscriptionListUpdate(subscriptionList: ISubscriptionInfo[]): void {
        this.setState({
            subscriptionList
        });
    }

    /**
     * Use the existance of `vmScaleSetResourceId` as a check to see if we're in VMSS mode or not. We should
     * probably implement a neater solution.
     *
     * @private
     * @returns {boolean}
     * @memberof AtScaleComputeMapPage
     */
    private isVmss(): boolean {
        return !!this.state.vmssResourceId;
    }

    private getChartSeriesSelections(): StringMap<ISeriesSelectorOption[]> {
        const chartSeriesSelections: StringMap<ISeriesSelectorOption[]> = {};
        for (const chartDescriptor of VirtualMachineMetricCharts.AggregateVmChartList) {
            chartSeriesSelections[chartDescriptor.chartId] =
                chartDescriptor.defaultSeriesSelections;
        }

        for (const chartDescriptor of VirtualMachineMetricCharts.TopNViewChartList) {
            chartSeriesSelections[chartDescriptor.chartId] =
                chartDescriptor.defaultSeriesSelections;
        }

        return chartSeriesSelections;
    }

    /**
     * This method creates telemetry properties object from current scope selection
     * and updates the telemetry context.
     * @private
     * @memberof ComputeMainPage
     */
    private updateTelemetryContext(state?: IComputeAzMonPerfState): void {
        state = state || this.state;
        const telemetryContext: IAtScaleTelemetryContext = {
            solutionType: state.solutionType?.toString(),
            hybridScope: state.solutionType === SolutionType.Hybrid ? {
                workspace: state.selectedHybridWorkspace?.id,
                omsgroup: state.selectedComputerGroup?.id
            } : null,
            azureScope: state.solutionType === SolutionType.Azure ? {
                subscription: state.selectedSubscription?.subscriptionId,
                resourceGroup: state.selectedResourceGroup?.id,
                resourceType: state.selectedResourceType?.toString(),
                resource: state.selectedAzureResource?.id
            } : null,
            timerange: state.dateTime
        };
        const telemetryProps: StringMap<string> = {};
        Object.keys(telemetryContext).forEach((key) => {
            try {
                telemetryProps[key] = (typeof telemetryContext[key]) === 'object' ?
                    JSON.stringify(telemetryContext[key]) : telemetryContext[key];
            } catch (error) {
                this.telemetry.logException(error, `${this.telemetryEventsPrefix}.updateTelemetryContext`,
                    ErrorSeverity.Error, { key }, {});
            }
        });
        this.telemetry.setContext(telemetryProps, false);
    }
}
