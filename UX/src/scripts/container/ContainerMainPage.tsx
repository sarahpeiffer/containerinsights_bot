/// <reference path='./deployments/deployments.d.ts' />
/// <reference path='./health/index.emulator.d.ts' />
/** tpl */
import * as moment from 'moment';
import * as React from 'react';
import * as Constants from './shared/Constants';
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import update = require('immutability-helper');
import { ChartSeriesData, GUID, setFeatureFlagValue } from '@appinsights/aichartcore';
import { TooltipService, DropdownOption, DropdownMessage, ExternalLinkSvg } from 'appinsights-iframe-shared';
import { Promise } from 'es6-promise';
// Hack since imported package in pills doesn't have es6-promise and fails in ie11
if (!(window as any).Promise) {
    (window as any).Promise = Promise;
}

/** local */
import { ContainerMetricChart } from './ContainerMetricChart';
import { ICommonContainerTabProps } from './shared/ICommonContainerTabProps';
import { ContainerClusterPane } from './ContainerClusterPane';
import { ContainerComparisonGridPane } from './grids/containers/ContainerGridPane';
import { ContainerHostGridPane } from './grids/host-hierarchy/ContainerHostGridPane';
import { ContainerControllerGridPane } from './grids/controller-hierarchy/ContainerControllerGridPane';
import {
    ContainerControlPanel,
    IInBladeContainerControlPanelProps,
    IStandAloneContainerControlPanelProps,
    IWorkbookNotebookParams
} from './control-panel/ContainerControlPanel';
import { IContainerControlPanelSelections, ContainerControlPanelSelections, IContainerControlPanelFilterSelections } from './control-panel/ContainerControlPanelSelections';
import { IPropertyPanelDataProvider, PropertyPanelDataProvider } from './data-provider/PropertyPanelDataProvider';
import { CachingPropertyPanelDataProvider } from './data-provider/CachingPropertyPanelDataProvider';
import { IntervalExpirationCache } from './data-provider/IntervalExpirationCache';
import { IInitEventProps } from './messaging/IInitEventProps';
import { ContainerGlobals } from './ContainerGlobals';
import { IContainerInsightsPreloadState } from './IContainerInsightsPreloadState';
import { SGDataRowExt } from './grids/shared/SgDataRowExt';
import {
    IPropertyPanelInterpretedResponse,
    PropertyPanelType,
    KustoPropertyPanelResponseInterpreter
} from './data-provider/KustoPropertyPanelResponseInterpreter';
import { ContainerGridBase, GridSortOrder } from './grids/shared/ContainerGridBase';
import { ActionBar, ActionItemType, IActionItem, ActionGroup } from './action-bar/ActionBar';
import { BladeLoadManager, QueryName } from './messaging/BladeLoadManager';
import { LoadTrackingTerminationReason, BladeLoadPath } from './messaging/IBladeLoadManager';
import { AsyncScriptLoadManager } from './AsyncScriptLoadManager';
import { NewsPaneView } from './news/views/NewsPaneView';

/** shared */
import { DisplayStrings } from '../shared/DisplayStrings';
import * as TelemetryStrings from '../shared/TelemetryStrings';
import * as GlobalConstants from '../shared/GlobalConstants';
import { AuthorizationTokenType, InitializationInfo } from '../shared/InitializationInfo';
import { IWorkspaceInfo } from '../shared/IWorkspaceInfo';
import { WorkspaceListManager } from '../shared/WorkspaceListManager';
import { StringMap } from '../shared/StringMap';
import { ITelemetry, TelemetryMainArea, IFinishableTelemetry } from '../shared/Telemetry';
import { TelemetryFactory } from '../shared/TelemetryFactory';
import { LocalStorageWrapper, ILocalStorageWrapper } from '../shared/data-provider/LocalStorageProvider';
import { ContainerHostMetrics } from './shared/ContainerHostMetrics';
import { ContainerHostMetricName } from './shared/ContainerMetricsStrings';
import { PortalMessagingProvider, ContainerInsightsIFrameIds, IPortalMessagingProvider } from '../shared/messaging/v2/PortalMessagingProvider';
import { ErrorSeverity } from '../shared/data-provider/TelemetryErrorSeverity';
import { AppInsightsProvider } from '../shared/CustomAppInsightMessagingProvider';
import { TimeInterval } from '../shared/data-provider/TimeInterval';
import { KustoDataProvider } from '../shared/data-provider/KustoDataProvider';
import { RetryARMDataProvider } from '../shared/data-provider/RetryARMDataProvider';
import { ARMDataProvider } from '../shared/data-provider/ARMDataProvider';
import { RetryPolicyFactory } from '../shared/data-provider/RetryPolicyFactory';
import { RequiredLoggingInfo } from '../shared/RequiredLoggingInfo';
import { AggregationOption } from '../shared/AggregationOption';
import { BlueLoadingDots, BlueLoadingDotsSize } from '../shared/blue-loading-dots';
import { LocaleManager } from '../shared/LocaleManager';
import { LocaleStringsHandler } from '../shared/LocaleStringsHandler';
import { AuthTokenHandler } from '../shared/AuthTokenHandler';
import { StringHelpers } from '../shared/Utilities/StringHelpers';
import { BannerUtilityHelper } from './shared/banner-bar/BannerUtilityHelper';
import { MdmCustomMetricAvailabilityLocations } from '../shared/MdmCustomMetricAvailabilityLocations';
import { ContainerInsightsPinChartToDashboardMessage, IMessagingProvider, MessagingProvider } from '../shared/MessagingProvider';
import { AzureCloudType, EnvironmentConfig, ContainerInsightsPage } from '../shared/EnvironmentConfig';

/* required for ie11... this will enable most of the Object.assign functionality on that browser */
import { polyfillObjectAssign } from '../shared/ObjectAssignShim';
polyfillObjectAssign();

/** required because number.max_safe_integer and number.min_safe_integer aren't supported in ie11 */
if (!(Number.MAX_SAFE_INTEGER)) {
    Number.MAX_SAFE_INTEGER = GlobalConstants.MAX_SAFE_INTEGER;
}
if (!(Number.MIN_SAFE_INTEGER)) {
    Number.MIN_SAFE_INTEGER = GlobalConstants.MIN_SAFE_INTEGER;
}

/** styles */
import '../../styles/shared/InIn.less';
import '../../styles/container/ContainerMainPage.less';
import '../../styles/shared/DocumentationLink';

/** svg */
import { RefreshSVG } from '../shared/svg/refresh';
import { MulticlusterSVG } from '../shared/svg/multicluster';
import { ContainerMainPageViewModel } from './main-page/viewmodels/ContainerMainPageViewModel';
import { BladeContext } from './BladeContext';
import { LiveMetricsGranularity } from './LiveMetricsPoller';
import { LiveDataProvider } from '../shared/data-provider/LiveDataProvider';
import { IWorkbookCategory } from '../shared/workbooks/WorkbookTemplates';
import { WorkbookHelper } from '../shared/workbooks/WorkbookHelper';
import { PageStartup } from '../shared/PageStartup';
import { AlertSVG } from '../shared/svg/alert';
import { INavigationProps } from './ContainerMainPageTypings';
import { HelperFunctions } from './shared/HelperFunctions';
import { BannerBarManager, BannerType } from './shared/banner-bar/BannerBarManager';
import { KubernetesProxyDataProviderFactory } from '../shared/data-provider/KubernetesProxyDataProviderFactory';
import { KubeConfigMonextHelper } from '../shared/data-provider/kube-config/KubeConfigMonextHelper';

/**
 * Defines properties set in the in-blade case
 */
export interface IInBladeProps {
    /**
     * In-blade workspace
     */
    workspace: IWorkspaceInfo;

    /**
     * In-blade cluster name
     */
    containerClusterName: string;

    /**
     * In-blade container cluster resource id
     */
    containerClusterResourceId: string;

    /**
     * In-blade container cluster resource location
     */
    containerClusterLocation: string;
}


// The main page maintains the nessessary state to initialize the child tab properties, which is why they share a common interface.
interface IContainerMainPageState extends ICommonContainerTabProps {
    sortColumn: number;
    sortOrder: GridSortOrder;
    /** recent post from rss */
    recentBlogPost: Array<any>;

    /** version of the state */
    version: number;

    /** index of the selected tab */
    selectedTab: SingleClusterTab;

    /** true if initialization info was received from hosting Ibiza blade */
    initializationInfoReceived: boolean;

    /** metric selected for the grids */
    selectedGridMetricName: string;

    /** selected grid metric aggregation option */
    selectedGridAggregationOption: AggregationOption;

    /** visualized time interval */
    timeRangeSeconds: number;

    /** workspace list sequence number
     * If workspace list needs to be loaded in chunks by the hosting blade,
     * it will be communicated via message to this page and the fact of the workspace
     * change needs to trigger re-render of [some] components. This sequence number
     * field changes provide such re-rendering ability
     */
    sequenceNumber: number;

    propertyPanelCollapsed: boolean;
    propertyPanelLoading: boolean;
    propertyPanelInterpretedResponse: IPropertyPanelInterpretedResponse;
    /** Tells us whether the user wants the property panel open or closed */
    userWantsPropertyPanelOpen: boolean;
    /** true if the property panel for the first row of the grid has been loaded */
    propertyPanelForFirstRowLoaded: boolean;
    /** the row that is being used to generate the current property panel */
    propertyPanelRow: SGDataRowExt;
    /** the selected row in the grid */
    selectedRow: SGDataRowExt;
    /**
     * data for chart visualization
     * dictionary by chart id (metric) to value, which is itself
     * a dictionary of series ids to chart series data
     */
    chartData: StringMap<StringMap<ChartSeriesData>>;
    /** series selections for the chart */
    chartSeriesSelections: StringMap<any>;
    /** in-blade experience properties */
    inBlade?: IInBladeProps;
    /** live logging information */
    loggingInfo: RequiredLoggingInfo;
    /** true if live log console opened */
    isConsoleOpen: boolean;
    /** Feature flags */
    featureFlags: StringMap<any>;
    /** pill Selections. considering holding all pillSelections in this container object instead of passing them individually  */
    pillSelections: IContainerControlPanelFilterSelections;
    /** true if the grid/charts are loading */
    isTabContentLoading: boolean;
    /** container cluster location  */
    clusterLocation: string;
    /** controls banner visibility */
    isBannerVisible: boolean;
    /** true if preload completed */
    preloadCompleted?: boolean;
    /** preload state */
    preloadState?: IContainerInsightsPreloadState;
    /** flag to control pin chart to dashboard */
    enablePinChartToDashboard: boolean;
    /** if live metrics should be shown */
    // seeLiveMetrics: boolean;
    liveMetricsTurnedOn: boolean;
    liveMetricsGranularity: LiveMetricsGranularity;
    /** if the workspace we are querying on is missing or deleted */
    isWorkspaceDeletedOrMoved: boolean;
}

export enum SingleClusterTab {
    News = 'News',
    ContainerCluster = 'ContainerCluster',
    Health = 'Health',
    Node = 'Node',
    Controller = 'Controller',
    Container = 'Container',
    Deployments = 'Deployments'
}

// TODO: delete?
interface ITabRegistrationHack {
    legacyIndex: number;
    realIndex: number;
    displayStringForTab: string;
}

/**
 * TEMPORARY HACK... TO BE REMOVED IN MY DEPLOYMENTS PR
 * TODO: then this should be removed correct
 */
export let __selectedTabIndexMapHack: StringMap<ITabRegistrationHack> = {};

export interface IPropertyPanelNavigationProps {
    startDateTimeUtc: Date;
    endDateTimeUtc: Date;
    workspaceId: string;
    clusterResourceId: string;
    clusterName: string;
    hostName: string;
    messagingProvider: IMessagingProvider;
}

// Hack:
export interface WorkbookDropdownInformation {
    workbookCategories: IWorkbookCategory[],
    notebookParams: IWorkbookNotebookParams,
    logPrefix: string
}

/**
 * Storage keys for information stored in local browser storage
 */
enum LocalStorageKeyName {
    GridMetricName = 'ContainerInsights.GridMetricName',
    GridAggregationOption = 'ContainerInsights.GridAggregationOption'
}

/**
 * Cache expiration interval
 */
const propsPanelCacheExpirationIntervalMilliseconds: number = 180000;


export class ContainerMainPage extends React.Component<{}, IContainerMainPageState> {
    private messagingProvider = new MessagingProvider(new AppInsightsProvider());
    private propertyPanelDataProvider: IPropertyPanelDataProvider;

    private workspaceManager: WorkspaceListManager = new WorkspaceListManager();
    private telemetry: ITelemetry;
    private openConsoleTimer: IFinishableTelemetry;
    private pendingQuerySequenceNumber: number = 0; // Enables the UX to only respond to the user's latest asynchronous activity

    private localStorageManager: ILocalStorageWrapper;

    private deployScriptLoadManager: AsyncScriptLoadManager;

    private mainPageContext: ContainerMainPageViewModel;
    private liveDataProvider: LiveDataProvider;

    /** state preserved after last blade render */
    private hoistedState: IContainerMainPageState;
    /** reference to the setInterval for preload script completion check */
    private checkPreloadCompletedInterval: any;

    private controlPanelReference: ContainerControlPanel;

    private healthScriptLoadManager: AsyncScriptLoadManager;

    private _clusterPaneReference: React.RefObject<ContainerClusterPane> = null; // React.createRef<ContainerClusterPane>();

    constructor(props?: {}) {
        super(props);

        this._clusterPaneReference = React.createRef<ContainerClusterPane>();

        setFeatureFlagValue('MissingDataLineStyle', 'n');

        LocaleManager.Instance().setupLocale();
        this.localStorageManager = new LocalStorageWrapper();

        this.controlPanelReference = undefined;
        ContainerGlobals.performanceMeasures['frame_constructor'] = Date.now();

        const propsPanelDataProvider =
            new PropertyPanelDataProvider(
                new KustoDataProvider(
                    new RetryARMDataProvider(new ARMDataProvider(), new RetryPolicyFactory()),
                    GlobalConstants.ContainerInsightsApplicationId
                )
            );

        this.propertyPanelDataProvider =
            new CachingPropertyPanelDataProvider(
                propsPanelDataProvider,
                new IntervalExpirationCache(propsPanelCacheExpirationIntervalMilliseconds)
            );

        const initialChartSeriesSelections: StringMap<any> = {};

        for (const chartDescriptor of ContainerMetricChart.list()) {
            initialChartSeriesSelections[chartDescriptor.chartId] =
                chartDescriptor.defaultSeriesSelections;
        }

        let controlPanelSelections: IContainerControlPanelFilterSelections = ContainerControlPanelSelections.getDefaultSelections();

        this.registerTabs(null, '');

        // bbax: HACK to work around the missing MVVM architecture here, we are going to create these singleton style during render()
        // please review the render() code to see how these get made
        this.mainPageContext = null;
        this.liveDataProvider = null;

        this.hoistedState = this.state = {
            recentBlogPost: new Array<any>(),
            version: 0,
            selectedTab: SingleClusterTab.ContainerCluster,
            initializationInfoReceived: false,
            workspace: null,
            clusterName: '',
            clusterLocation: '',
            clusterResourceId: '',
            startDateTimeUtc: controlPanelSelections.startDateTimeUtc,
            endDateTimeUtc: controlPanelSelections.endDateTimeUtc,
            timeRangeSeconds: controlPanelSelections.timeRangeSeconds,
            isTimeRelative: controlPanelSelections.isTimeRelative,
            nameSpace: controlPanelSelections.nameSpace,
            serviceName: controlPanelSelections.serviceName,
            hostName: controlPanelSelections.hostName,
            nodePool: controlPanelSelections.nodePool,
            controllerName: controlPanelSelections.controllerName,
            controllerKind: controlPanelSelections.controllerKind,
            sortColumn: Constants.DefaultSortColumn,
            sortOrder: ContainerHostMetrics.get(ContainerMainPage.GetGridMetricName(this.localStorageManager))
                .descriptor.isHigherValueBetter
                ? GridSortOrder.Asc
                : GridSortOrder.Desc,
            selectedGridMetricName: ContainerMainPage.GetGridMetricName(this.localStorageManager),
            selectedGridAggregationOption: ContainerMainPage.GetGridMetricAggregationOption(this.localStorageManager),
            sequenceNumber: -1,
            propertyPanelCollapsed: true,
            propertyPanelLoading: true,
            propertyPanelInterpretedResponse: { type: undefined, data: undefined },
            propertyPanelForFirstRowLoaded: false,
            propertyPanelRow: undefined,
            selectedRow: undefined,
            userWantsPropertyPanelOpen: true,
            chartSeriesSelections: initialChartSeriesSelections,
            chartData: {},
            loggingInfo: this.createEmptyLoggingInfo(),
            isConsoleOpen: false,
            featureFlags: undefined,
            nameSearchFilterValue: '',
            shouldApplyExactNameSearchFilterMatch: false,
            pillSelections: controlPanelSelections,
            isTabContentLoading: true,
            isBannerVisible: true,
            enablePinChartToDashboard: true,
            liveMetricsTurnedOn: false,
            liveMetricsGranularity: LiveMetricsGranularity.FiveSeconds,
            isWorkspaceDeletedOrMoved: false,
            preloadCompleted: false
        };

        this.onNameSearchFilterChanged = this.onNameSearchFilterChanged.bind(this);
        this.onSortOrderChanged = this.onSortOrderChanged.bind(this);
        this.onGridRowSelected = this.onGridRowSelected.bind(this);

        this.onTabSelectionChanged = this.onTabSelectionChanged.bind(this);
        this.onTabSelectionChangedInternal = this.onTabSelectionChangedInternal.bind(this);

        this.onTogglePanelCollapse = this.onTogglePanelCollapse.bind(this);

        this.pinChartToDashboard = this.pinChartToDashboard.bind(this);

        this.processInitEvent = this.processInitEvent.bind(this);
        this.onChartDataLoaded = this.onChartDataLoaded.bind(this);
        this.onChartSeriesSelectionsChanged = this.onChartSeriesSelectionsChanged.bind(this);
        this.onGridMetricSelectionChanged = this.onGridMetricSelectionChanged.bind(this);
        this.onToggleGridAggregationOption = this.onToggleGridAggregationOption.bind(this);
        this.isShowLiveLog = this.isShowLiveLog.bind(this);
        this.onConsoleOpen = this.onConsoleOpen.bind(this);
        this.onConsoleClose = this.onConsoleClose.bind(this);

        this.onTabContentLoadingStatusChange = this.onTabContentLoadingStatusChange.bind(this);
        this.onTabContentDataLoadError = this.onTabContentDataLoadError.bind(this);

        this.onTickCheckPreloadCompleted = this.onTickCheckPreloadCompleted.bind(this);
        this.onToggleLiveMetrics = this.onToggleLiveMetrics.bind(this);

        this.setIsBannerVisible = this.setIsBannerVisible.bind(this);

        // start messaging
        const portalMessagingProvider: IPortalMessagingProvider = PortalMessagingProvider.Instance();
        portalMessagingProvider.registerProcessor('init', this.processInitEvent,
            ContainerInsightsIFrameIds.containerInsights);
        portalMessagingProvider.registerProcessor('localeStrings', LocaleStringsHandler.Instance().handleLocaleEvent,
            ContainerInsightsIFrameIds.containerInsights);
        portalMessagingProvider.registerProcessor('microsoftGraphAuthTokenAndTenantID', AuthTokenHandler.Instance().handleAuthTokenEvent,
            ContainerInsightsIFrameIds.containerInsights);

        KubeConfigMonextHelper.Init().withTelemetry(TelemetryFactory.get(TelemetryMainArea.Containers));
        KubernetesProxyDataProviderFactory.Init().withProxyRegionCode(this.getKubernetesProxyRegionCode());

        portalMessagingProvider.registerProcessor(
            'clusterProperties',
            KubeConfigMonextHelper.Instance().handleClusterPropertiesEvent,
            ContainerInsightsIFrameIds.containerInsights
        )
        portalMessagingProvider.registerProcessor(
            'aksProxyAuthorizationToken',
            KubeConfigMonextHelper.Instance().handleAksProxyAuthorizationTokenEvent,
            ContainerInsightsIFrameIds.containerInsights
        )
        portalMessagingProvider.startMessaging(ContainerInsightsIFrameIds.containerInsights);

        // setup v1 messaging provider listeners
        // TODO: transition to v2 above
        // TODO: nib: this really needs to be transitioned to v2...pretty sure the processors registered 
        // TODO: on the portalMessagingProvider don't even run because 
        // TODO: messagingProvider's startMessaging function overwrites the event listener of portalMessagingProvider
        this.messagingProvider.startMessaging(ContainerInsightsIFrameIds.containerInsights);

        LocaleStringsHandler.Instance().onTranslation(() => {
            this.forceUpdate();
        });

        // start interval checking preload script completion
        ContainerGlobals.performanceMeasures['frame_startTickPreloadCompletionCheck'] = Date.now();
    }

    /**
     * Builds a set of network queries expected to execute for a given initial tab
     * @param selectedTabIndex initial open tab (charts/nodes/etc)
     * @returns array of network query names to be run to display data for the tab selected
     */
    private static getExpectedNetworkQueryNames(selectedTabIndex: number): string[] {
        const queryNames = [];

        switch (selectedTabIndex) {
            case 0:
                queryNames.push(QueryName.Charts);
                break;
            case 1:
            case 2:
            case 3:
                queryNames.push(QueryName.Grid);
                queryNames.push(QueryName.PropertyPanel);
                break;
            default:
                throw new Error(`Parameter @selectedTabIndex is invalid - '${selectedTabIndex}'`);
        }

        return queryNames;
    }

    /**
     * Gets metric name displayed in the grids at page load
     * @param localStorageManager browser's locl storage access manager
     */
    private static GetGridMetricName(localStorageManager: ILocalStorageWrapper): string {
        // try to load metric from local storage
        // if not there - default to CPU
        let metricName = localStorageManager.getItem(LocalStorageKeyName.GridMetricName) || ContainerHostMetricName.CpuCoreUtilization;

        // make sure metric is listed in container metrics
        // if not - default to CPU (someone may have changed local storage...)
        return ContainerHostMetrics.get(metricName)
            ? metricName
            : ContainerHostMetricName.CpuCoreUtilization;
    }

    /**
     * Gets metric aggregation option displayed in the grids at page load
     * @param localStorageManager browser's locl storage access manager
     */
    private static GetGridMetricAggregationOption(localStorageManager: ILocalStorageWrapper): AggregationOption {
        const defaultOption = AggregationOption.P95;

        // try to load from local storage if not there - default P95
        let aggregationOption =
            localStorageManager.getItem(LocalStorageKeyName.GridAggregationOption) || defaultOption;

        // make sure metric is listed in aggregation options if not - default to P95
        const typedStoredOption: AggregationOption | undefined = (AggregationOption as any)[aggregationOption];

        return typedStoredOption || defaultOption;
    }

    /**
     * React callback after component was mounted into DOM
     */
    public componentDidMount(): void {
        // start interval for checking if preload completed
        this.checkPreloadCompletedInterval = setInterval(this.onTickCheckPreloadCompleted, 100);

        // check preload completion without waiting on the timer the first time
        // in case it is already completed
        this.onTickCheckPreloadCompleted();
        PageStartup.hackForAutoResizerScrollbarIssue();
    }

    /**
     * Callback for just after component state or props were updated
     * @param prevProps previous set of props
     * @param prevState previoud state
     */
    public componentDidUpdate(prevProps: Readonly<{}>, prevState: Readonly<IContainerMainPageState>): void {
        // store/hoist state so that we can use it in "random" callbacks
        this.hoistedState = this.state;
        PageStartup.hackForAutoResizerScrollbarIssue();

        if (this.state.liveMetricsTurnedOn === true && this.state.selectedTab !== SingleClusterTab.ContainerCluster) {
            this.onToggleLiveMetrics(false);
        }
    }

    /**
     * renders component
     * @returns component visualization
     */
    public render(): JSX.Element {
        const loading: JSX.Element =
            <div className='MainPage-root center-flex'>
                <BlueLoadingDots size={BlueLoadingDotsSize.large} />
            </div>

        try {
            if (!this.state.initializationInfoReceived) { return loading; }

            if (!LocaleStringsHandler.Instance().translated()) {
                return loading;
            }

            // check to see if we're loading for onboarded cluster
            // if not - notify hosting blade and display 'loading'
            if (this.state.inBlade && !this.state.inBlade.workspace) {
                // note: null reason treated as 'not onboarded'
                this.messagingProvider.bladeLoadFailure(null);
                return loading;
            }

            if (this.state.inBlade && this.state.isWorkspaceDeletedOrMoved) {
                this.messagingProvider.sendNavigateToSingleAksClusterReOnboarding();
                return loading;
            }

            // AzMon-for-Containers has additional requirement: at least one workspace in the list
            if (!this.state.inBlade && (!this.workspaceManager || !this.workspaceManager.getSelectedWorkspace())) {
                return loading;
            }

            let contentDetailsPaneHeightCssClassName = 'content-details-pane-normal-height';
            if (this.state.isBannerVisible) {
                contentDetailsPaneHeightCssClassName = 'content-details-pane-height-with-banner';
            }

            return (
                <div className='MainPage-root'>
                    <ActionBar
                        actionItems={this.getActionBarItems()}
                        messagingProvider={this.messagingProvider}
                        isSingleClusterPage={true}
                        helpDropdownoptions={this.getHelpDropdownOptions()}
                        wokbooksDropwonTimeOptions={WorkbookHelper.convertCITimeStateToTimeRange(
                            this.state.startDateTimeUtc,
                            this.state.endDateTimeUtc,
                            this.state.isTimeRelative,
                            this.state.timeRangeSeconds
                        )}
                        telemetry={this.telemetry}
                    />
                    <BannerBarManager
                        clusterResourceId={this.state.inBlade.containerClusterResourceId}
                        localStorageManager={this.localStorageManager}
                        clusterLocation={this.state.inBlade.containerClusterLocation}
                        mdmBannerOnClickHandler={this.grantClusterServicePrincipalMetricPermissions.bind(this)}
                        banners={[BannerType.MdmBanner]}
                        isVisible={this.state.isBannerVisible}
                        setVisibility={this.setIsBannerVisible}
                        selectedTab={this.state.selectedTab}
                    />
                    <div className={`content-details-pane ${contentDetailsPaneHeightCssClassName}`}>
                        {this.renderContentPane()}
                        <div className='chartToolTipContainer' id='chartToolTipContainer'></div>
                        {TooltipService.getRenderer()} {/*
                            /*
                            Registers the TooltipService renderer at the outermost div
                            so that it can properly position and display Ibiza-style tooltips
                            that block all other UI interaction when toggled open
                            */
                        }
                    </div>
                </div>
            );
        } catch (exc) {
            this.telemetry.logException(exc, 'ContainerMainPage', ErrorSeverity.Error, null, null);
            return loading;
        }
    }

    /**
     * Adds the dropdown options to the help dropdown in the action bar
     * TODO: Use display strings for localization
     */
    private getHelpDropdownOptions(): DropdownOption[] {
        let helpDropdownoptions: DropdownOption[] = [];

        helpDropdownoptions.push(new DropdownMessage(
            EnvironmentConfig.Instance().getForumsUrl(),
            'Forums',
            'openForums',
            {},
            <ExternalLinkSvg />
        ));
        helpDropdownoptions.push(new DropdownMessage(
            EnvironmentConfig.Instance().getLearnMoreUrl(ContainerInsightsPage.SingleCluster,
                HelperFunctions.isAKSCluster(this.state.inBlade && this.state.inBlade.containerClusterResourceId ?
                    this.state.inBlade.containerClusterResourceId : '')),
            'Learn more',
            'openCILearnMore',
            {},
            <ExternalLinkSvg />
        ));

        return helpDropdownoptions;
    }

    /**
     * TODO: Delete
     * TEMPORARY HACK... TO BE REMOVED IN MY DEPLOYMENTS PR
     */
    private registerTabs(featureFlags: StringMap<any>, clusterResourceId: string): void {
        // tslint:disable:max-line-length
        __selectedTabIndexMapHack = {};

        let realIndex = 0;

        if (!!featureFlags &&
            !!featureFlags.newsTracking &&
            featureFlags.newsTracking === 'true' &&
            this.showNewsTabNavigation(featureFlags)) {
            __selectedTabIndexMapHack[SingleClusterTab.News] = { legacyIndex: -1, realIndex: realIndex++, displayStringForTab: 'Bot' };
        }

        __selectedTabIndexMapHack[SingleClusterTab.ContainerCluster] = { legacyIndex: 0, realIndex: realIndex++, displayStringForTab: DisplayStrings.ClusterTab };

        if (!!featureFlags &&
            !!featureFlags.healthModel &&
            featureFlags.healthModel === 'true' &&
            this.showClusterHealthModel(featureFlags)) {
            __selectedTabIndexMapHack[SingleClusterTab.Health] = { legacyIndex: -1, realIndex: realIndex++, displayStringForTab: DisplayStrings.ContainerHealthTableTab };
        }

        __selectedTabIndexMapHack[SingleClusterTab.Node] = { legacyIndex: 2, realIndex: realIndex++, displayStringForTab: DisplayStrings.ContainerHostTableTab };
        __selectedTabIndexMapHack[SingleClusterTab.Controller] = { legacyIndex: 3, realIndex: realIndex++, displayStringForTab: DisplayStrings.ContainerControllerTab };
        __selectedTabIndexMapHack[SingleClusterTab.Container] = { legacyIndex: 4, realIndex: realIndex++, displayStringForTab: DisplayStrings.ContainerResourceTableTab };

        if (!!featureFlags &&
            !!featureFlags.deploymentTracking &&
            featureFlags.deploymentTracking === 'true' &&
            EnvironmentConfig.Instance().isLiveDataEnabledEnvironment() &&
            HelperFunctions.isAKSCluster(clusterResourceId)) {
            __selectedTabIndexMapHack[SingleClusterTab.Deployments] = { legacyIndex: -1, realIndex: realIndex++, displayStringForTab: DisplayStrings.containerDeploymentsTabTitle };
        }
        // tslint:enable:max-line-length
    }

    /**
     * TODO: Delete
     * TEMPORARY HACK... TO BE REMOVED IN MY DEPLOYMENTS PR
     */
    private getLegacySelection(index: number): SingleClusterTab {
        const indexKeys = Object.getOwnPropertyNames(__selectedTabIndexMapHack);
        let targetMap: SingleClusterTab = null;
        indexKeys.forEach((key: string) => {
            if (index === __selectedTabIndexMapHack[key].legacyIndex) {
                targetMap = SingleClusterTab[key];
            }
        });
        return targetMap;
    }

    // TODO: Get rid of this because depolyments PR is long done
    private getRealName(index: number): SingleClusterTab {
        const indexKeys = Object.getOwnPropertyNames(__selectedTabIndexMapHack);
        let getRealSelection: SingleClusterTab = null;
        indexKeys.forEach((key: string) => {
            if (index === __selectedTabIndexMapHack[key].realIndex) {
                getRealSelection = SingleClusterTab[key];
            }
        });

        if (!getRealSelection) {
            throw 'Invalid tab index specified, no such tab exists!';
        }

        return getRealSelection;
    }

    /**
      * Function which determines if the banner is visible based on region availability and MDM query failure
      */
    private setIsBannerVisible(isVisible: boolean): void {
        this.setState({
            isBannerVisible: isVisible
        });
    }

    /** Performs periodic check for */
    private onTickCheckPreloadCompleted(): void {
        console.log('PRELOAD MAIN SCRIPT::Waiting...');

        const {
            initializationEvent,
            preloadCompleted,
            isLoadedFromMdm
        } = ContainerGlobals.preloadState;

        // forward initialization event to main page if available
        if (initializationEvent) {
            let bladeLoadPath = isLoadedFromMdm ? BladeLoadPath.Mdm : BladeLoadPath.Kusto;
            BladeLoadManager.Instance().asLoadType(bladeLoadPath);
            this.processInitEvent(initializationEvent);
        }

        // check if preload completed
        if ((preloadCompleted === true) && !this.hoistedState.preloadCompleted) {
            console.log(`PRELOAD MAIN SCRIPT::Seeing preload completed.`);
            clearInterval(this.checkPreloadCompletedInterval);

            this.setState({
                preloadCompleted: true,
                preloadState: ContainerGlobals.preloadState,
            });
        }
    }

    /**
     * Returns selected tab from navigation props
     * @param data init event data
     */
    private getSelectedTabFromNavProps(navigationProps: INavigationProps): number {
        return navigationProps ? (navigationProps.selectedTab || 0) : 0;
    }

    /**
     * Try to onboard the cluster to MDM
     * Get Tenant ID, Client ID -> Service Principal ID then use it for the role assignment.
     */
    private grantClusterServicePrincipalMetricPermissions(): void {
        const authorizationTokenHandler = AuthTokenHandler.Instance();
        const portalMessageProvider = PortalMessagingProvider.Instance();
        const bannerUtilityHelper = BannerUtilityHelper.Instance();

        authorizationTokenHandler.setIsBannerVisible = this.setIsBannerVisible.bind(this);

        portalMessageProvider.sendMessage('UpdateNotification', { status: 'new' });
        portalMessageProvider.sendMessage('RequestForToken', 'microsoft.graph');
        this.telemetry.logNavigationEvent('bannerButtonAction', 'Enable');

        const onBoardPrereqs = [
            bannerUtilityHelper.getClusterServicePrincipalClientID(this.state.inBlade.containerClusterResourceId)
        ];

        Promise.all(onBoardPrereqs).then((onBoardPrereqResponses) => {
            const principalClientResponse: any = onBoardPrereqResponses[0];
            const authTokenHandlerInstance = AuthTokenHandler.Instance();
            authTokenHandlerInstance.telemetry = this.telemetry;
            authTokenHandlerInstance.localStorageManager = this.localStorageManager;
            authTokenHandlerInstance.containerClusterResourceId = this.state.inBlade.containerClusterResourceId;

            // Adding a check to see if SP exists, else assign permission to addon MSI
            if (principalClientResponse.properties.servicePrincipalProfile &&
                principalClientResponse.properties.servicePrincipalProfile.clientId &&
                principalClientResponse.properties.servicePrincipalProfile.clientId.toLowerCase() !== 'msi') {
                this.setupForOnboarding(principalClientResponse.properties.servicePrincipalProfile.clientId, authTokenHandlerInstance);
            } else if (principalClientResponse.properties.addonProfiles.omsagent &&
                principalClientResponse.properties.addonProfiles.omsagent.identity) {
                const msi = principalClientResponse.properties.addonProfiles.omsagent.identity
                if (msi) {
                    const msiResourceId = msi.resourceId;
                    let index = msiResourceId.lastIndexOf('/');
                    const msiResourceName = msiResourceId.substring(index + 1, msiResourceId.length - 1);
                    authTokenHandlerInstance.onboardServicePrincipalHelper(msi.objectId, msiResourceName,
                        authTokenHandlerInstance.containerClusterResourceId);
                } else {
                    throw ('msi identity object not present in omsagent addon profile');
                }
            }
        }).catch((error: any) => {
            authorizationTokenHandler.handlePermissionGrantFailure(error);
        });
    }

    /**
     * Utilized during enable cluster SPN on the banner.  This function will setup the authorization token handler
     * to be able to onboard the service princpal (if no graph token is present yet), otherwise it will onboard immediately
     * @param servicePrincipalClientId client id of the service principle for the cluster
     */
    private setupForOnboarding(servicePrincipalClientId: string, authTokenHandlerInstance: AuthTokenHandler) {
        if (StringHelpers.isNullOrEmpty(authTokenHandlerInstance.microsoftGraphAuthToken) ||
            StringHelpers.isNullOrEmpty(authTokenHandlerInstance.tenantID)
        ) {
            authTokenHandlerInstance.isPutOpertationRequired = true;
            authTokenHandlerInstance.clusterServicePrincipalClientID = servicePrincipalClientId;
            authTokenHandlerInstance.armAuthToken =
                InitializationInfo.getInstance().getAuthorizationHeaderValue(AuthorizationTokenType.Arm);
        } else {
            authTokenHandlerInstance.onboardServicePrincipal(
                authTokenHandlerInstance.tenantID,
                servicePrincipalClientId,
                this.state.inBlade.containerClusterResourceId
            );
        }
    }

    /**
    * the panel is allowed to actually collapse itself; the state of collapse needs to be owned by main page
    * since he will also collapse the panel; rather then having two 'collapse' states, this differs from the collapse
    * actions to the owner of the control with the side benefit that you can reject a collapse request from the panel
    * @param isUserAction denotes whether this function was invoked through a user's actions
    * @returns {void}
    */
    private onTogglePanelCollapse(isUserAction: boolean = false): void {
        this.setState((prevState: IContainerMainPageState) => {
            return {
                propertyPanelCollapsed: !prevState.propertyPanelCollapsed,
                userWantsPropertyPanelOpen: isUserAction ? !prevState.userWantsPropertyPanelOpen : prevState.userWantsPropertyPanelOpen
            };
        }, () => {
            if (this.state.selectedRow !== this.state.propertyPanelRow) {
                this.onGridRowSelected(this.state.selectedRow);
            }
        });
    }

    private renderContentPane(): JSX.Element {
        const isInBlade: boolean = (this.state.inBlade != null);

        let options: IInBladeContainerControlPanelProps | IStandAloneContainerControlPanelProps = null;
        let idealGrain: number = this.state.selectedTab === SingleClusterTab.ContainerCluster ? Constants.IdealAggregateChartDataPoints
            : Constants.IdealGridTrendDataPoints;

        if (isInBlade) {
            options = {
                workspace: this.state.inBlade.workspace,
                clusterName: this.state.inBlade.containerClusterName,
                messagingProvider: this.messagingProvider,
            };
        } else {
            options = {
                workspaceManager: this.workspaceManager,
                messagingProvider: this.messagingProvider,
                sequenceNumber: this.state.sequenceNumber,
            };
        }

        const hidePills = this.state.liveMetricsTurnedOn ||
            this.state.selectedTab === SingleClusterTab.Deployments ||
            this.state.selectedTab === SingleClusterTab.Health;

        const showLiveMetricsDropdown = this.state.featureFlags.liveMetrics &&
            this.state.selectedTab === SingleClusterTab.ContainerCluster &&
            EnvironmentConfig.Instance().isLiveDataEnabledEnvironment();

        const controlPanel =
            <ContainerControlPanel
                ref={(ref) => { this.controlPanelReference = ref }}
                clusterResourceId={this.state.clusterResourceId}
                clusterName={this.state.clusterName}
                options={options}
                onSelectionsChanged={(selections) => this.onControlPanelSelectionsChanged(selections)}
                idealGrain={idealGrain}
                pillSelections={this.state.pillSelections}
                onToggleLiveMetrics={this.onToggleLiveMetrics}
                seeLiveMetrics={this.state.liveMetricsTurnedOn}
                showLiveMetricsDropdown={showLiveMetricsDropdown}
                hidePills={hidePills}
                showLiveMetricsButton={this.state.selectedTab === SingleClusterTab.ContainerCluster}
                liveMetricsFeatureFlag={this.state.featureFlags.liveMetrics}
                isAksCluster={HelperFunctions.isAKSCluster(this.state.inBlade && this.state.inBlade.containerClusterResourceId ?
                    this.state.inBlade.containerClusterResourceId : '')}
                onChangeLiveMetricsGranularity={(granularity: LiveMetricsGranularity) => {
                    // bbax: dangerous... but only being used for telemetry
                    const prevGranularity = this.state.liveMetricsGranularity;

                    this.setState({ liveMetricsGranularity: granularity }, () => {
                        if (!this._clusterPaneReference || !this._clusterPaneReference.current) { return; }
                        this._clusterPaneReference.current.changeLiveFeatureGrain(this.state.liveMetricsGranularity);
                    });
                    this.telemetry.logEvent('liveMetrics.granularitySwitch', {
                        newGranularity: granularity.toString(),
                        prevGranularity: prevGranularity.toString()
                    }, undefined);
                }}
                liveMetricsGranularity={this.state.liveMetricsGranularity}
            />

        return (
            <div className='content-root'>
                {this.state.selectedTab !== SingleClusterTab.News ? controlPanel : null}
                {this.renderTabs(isInBlade)}
            </div>
        );
    }

    /**
     * Generate the tabs based on the currently hack object containing a list of tab registrations
     * please please make sure you understand this all before changing it... legacy vs real tab
     * selection is vital to functional multi-cluster links
     */
    private generateTabs(): JSX.Element[] {
        const keys: string[] = Object.getOwnPropertyNames(__selectedTabIndexMapHack).sort((left, right) => {
            return __selectedTabIndexMapHack[left].realIndex - __selectedTabIndexMapHack[right].realIndex;
        });

        return keys.map((key) => {
            return <Tab>{__selectedTabIndexMapHack[key].displayStringForTab}</Tab>;
        });
    }

    /**
     * Renders the tabs in the content in them
     * TODO: delete unused parameter, isInBlade
     */
    private renderTabs(isInBlade: boolean): JSX.Element {
        const showLiveLogs = this.isShowLiveLog();

        // bbax: decide to show your panel based on your presense in the registration... DO NOT EVER show
        // a tab unless its present in that list... if you find yourself without a tab and are wondering
        // why DO NOT HACK YOURSELF into the tabs list, figure out why you aren't in the tab registrations!
        const showClusterHealthModelTab = __selectedTabIndexMapHack.hasOwnProperty(SingleClusterTab.Health);
        const showDeployments = __selectedTabIndexMapHack.hasOwnProperty(SingleClusterTab.Deployments);
        const showNewsTab = __selectedTabIndexMapHack.hasOwnProperty(SingleClusterTab.News);

        // bbax: these are paired up with their corresponding should show statements above... all optional
        // tab panels keep them here for consistency please
        const deploymentsPane = showDeployments ? <TabPanel>{this.getDeploymentsPane()}</TabPanel> : null;
        const newsPane = showNewsTab ? <TabPanel>{this.getNewsPane()}</TabPanel> : null;
        const healthTabPanel = showClusterHealthModelTab ? <TabPanel>{this.renderHealthTab()}</TabPanel> : null;

        const selectedIndex = __selectedTabIndexMapHack[this.state.selectedTab].realIndex;

        // bbax: TODO temp hack to get the missing MVVM pieces wired together until we can refactor the main page to be mvvm based
        if (!this.mainPageContext) {
            this.liveDataProvider = new LiveDataProvider();
            this.mainPageContext = new ContainerMainPageViewModel(this.forceUpdate.bind(this), this.liveDataProvider,
                this.onTabContentLoadingStatusChange.bind(this));
        }

        let selectedTabPanelClassName = 'react-tabs__tab-panel--selected';
        if (this.state.selectedTab === SingleClusterTab.News) {
            selectedTabPanelClassName += ' newstab-panel-selected';
        }

        return (
            <Tabs
                className='infra-main-tabs'
                selectedTabClassName={'selected-tab'}
                selectedTabPanelClassName={selectedTabPanelClassName}
                selectedIndex={selectedIndex}
                onSelect={this.onTabSelectionChanged}>
                <div className='pane-header'>
                    <TabList >
                        {this.generateTabs()}
                    </TabList>
                </div>
                {newsPane}
                <TabPanel>
                    <ContainerClusterPane
                        ref={this._clusterPaneReference}
                        startDateTimeUtc={this.state.startDateTimeUtc}
                        endDateTimeUtc={this.state.endDateTimeUtc}
                        workspace={this.state.workspace}
                        clusterName={this.state.clusterName}
                        clusterResourceId={this.state.clusterResourceId}
                        mainPageContext={this.mainPageContext}
                        nameSpace={this.state.nameSpace}
                        serviceName={this.state.serviceName}
                        hostName={this.state.hostName}
                        nodePool={this.state.nodePool}
                        controllerName={this.state.controllerName}
                        controllerKind={this.state.controllerKind}
                        seriesSelections={this.state.chartSeriesSelections}
                        chartData={this.state.chartData}
                        onChartDataLoaded={this.onChartDataLoaded}
                        onSeriesSelectionsChanged={this.onChartSeriesSelectionsChanged}
                        messagingProvider={this.messagingProvider}
                        isTimeRelative={this.state.isTimeRelative}
                        onTabContentLoadingStatusChange={this.onTabContentLoadingStatusChange}
                        onTabContentDataLoadError={this.onTabContentDataLoadError}
                        preloadCompleted={this.state.preloadCompleted}
                        preloadState={this.state.preloadState}
                        enablePinChartToDashboard={this.state.enablePinChartToDashboard}
                        pinChartToDashboard={this.pinChartToDashboard}
                        liveDataProvider={this.liveDataProvider}
                        loggingInfo={this.state.loggingInfo}
                        // seeLiveMetrics={this.state.seeLiveMetrics}
                        isLiveDataInterfaceVisible={this.state.liveMetricsTurnedOn}
                        // onToggleLiveMetrics={this.onToggleLiveMetrics}
                        liveMetricsFeatureFlag={this.state.featureFlags.liveMetrics}
                        liveMetricsGranularity={this.state.liveMetricsGranularity}
                    />
                </TabPanel>
                {healthTabPanel}
                <TabPanel>
                    <ContainerHostGridPane
                        workspace={this.state.workspace}
                        selectedTab={this.state.selectedTab}
                        featureFlags={this.state.featureFlags}
                        selectedRow={this.state.selectedRow}
                        propertyPanelInterpretedResponse={this.state.propertyPanelInterpretedResponse}
                        isShowLiveLog={this.isShowLiveLog}
                        propertyPanelCollapsed={this.state.propertyPanelCollapsed}
                        propertyPanelLoading={this.state.propertyPanelLoading}
                        onTogglePanelCollapse={this.onTogglePanelCollapse}
                        clusterName={this.state.clusterName}
                        clusterResourceId={this.state.clusterResourceId}
                        aggregationOption={this.state.selectedGridAggregationOption}
                        onMetricSelectionChanged={this.onGridMetricSelectionChanged}
                        messagingProvider={this.messagingProvider}
                        onGridRowSelected={this.onGridRowSelected}
                        onConsoleOpen={this.onConsoleOpen}
                        showLiveLogs={showLiveLogs}
                        loggingInfo={this.state.loggingInfo}
                        onConsoleClose={this.onConsoleClose}
                        isConsoleOpen={this.state.isConsoleOpen}
                        onToggleAggregationOption={this.onToggleGridAggregationOption}
                        onTabSelectionChanged={this.onTabSelectionChangedInternal}
                        shouldApplyExactNameSearchFilterMatch={this.state.shouldApplyExactNameSearchFilterMatch}
                        onTabContentLoadingStatusChange={this.onTabContentLoadingStatusChange}
                        onTabContentDataLoadError={this.onTabContentDataLoadError}
                        liveDataProvider={this.liveDataProvider}
                        metricName={this.state.selectedGridMetricName}
                        startDateTimeUtc={this.state.startDateTimeUtc}
                        endDateTimeUtc={this.state.endDateTimeUtc}
                        isTimeRelative={this.state.isTimeRelative}
                        nameSpace={this.state.nameSpace}
                        serviceName={this.state.serviceName}
                        hostName={this.state.hostName}
                        nodePool={this.state.nodePool}
                        controllerName={this.state.controllerName}
                        controllerKind={this.state.controllerKind}
                        nameSearchFilterValue={this.state.nameSearchFilterValue}
                        sortColumn={this.state.sortColumn}
                        sortOrder={this.state.sortOrder}
                        onSortOrderChanged={this.onSortOrderChanged}
                        onNameSearchFilterChanged={this.onNameSearchFilterChanged}
                    />
                </TabPanel>
                <TabPanel>
                    <ContainerControllerGridPane
                        startDateTimeUtc={this.state.startDateTimeUtc}
                        endDateTimeUtc={this.state.endDateTimeUtc}
                        workspace={this.state.workspace}
                        selectedTab={this.state.selectedTab}
                        featureFlags={this.state.featureFlags}
                        selectedRow={this.state.selectedRow}
                        propertyPanelInterpretedResponse={this.state.propertyPanelInterpretedResponse}
                        isShowLiveLog={this.isShowLiveLog}
                        propertyPanelCollapsed={this.state.propertyPanelCollapsed}
                        propertyPanelLoading={this.state.propertyPanelLoading}
                        onTogglePanelCollapse={this.onTogglePanelCollapse}
                        clusterName={this.state.clusterName}
                        clusterResourceId={this.state.clusterResourceId}
                        nameSpace={this.state.nameSpace}
                        serviceName={this.state.serviceName}
                        hostName={this.state.hostName}
                        nodePool={this.state.nodePool}
                        metricName={this.state.selectedGridMetricName}
                        aggregationOption={this.state.selectedGridAggregationOption}
                        onMetricSelectionChanged={this.onGridMetricSelectionChanged}
                        messagingProvider={this.messagingProvider}
                        onGridRowSelected={this.onGridRowSelected}
                        onConsoleOpen={this.onConsoleOpen}
                        showLiveLogs={showLiveLogs}
                        loggingInfo={this.state.loggingInfo}
                        onConsoleClose={this.onConsoleClose}
                        isConsoleOpen={this.state.isConsoleOpen}
                        onToggleAggregationOption={this.onToggleGridAggregationOption}
                        isTimeRelative={this.state.isTimeRelative}
                        onTabSelectionChanged={this.onTabSelectionChangedInternal}
                        nameSearchFilterValue={this.state.nameSearchFilterValue}
                        shouldApplyExactNameSearchFilterMatch={this.state.shouldApplyExactNameSearchFilterMatch}
                        onTabContentLoadingStatusChange={this.onTabContentLoadingStatusChange}
                        onTabContentDataLoadError={this.onTabContentDataLoadError}
                        liveDataProvider={this.liveDataProvider}
                        sortColumn={this.state.sortColumn}
                        sortOrder={this.state.sortOrder}
                        controllerName={this.state.controllerName}
                        controllerKind={this.state.controllerKind}
                        onSortOrderChanged={this.onSortOrderChanged}
                        onNameSearchFilterChanged={this.onNameSearchFilterChanged}
                    />
                </TabPanel>
                <TabPanel>
                    <ContainerComparisonGridPane
                        startDateTimeUtc={this.state.startDateTimeUtc}
                        endDateTimeUtc={this.state.endDateTimeUtc}
                        workspace={this.state.workspace}
                        selectedTab={this.state.selectedTab}
                        featureFlags={this.state.featureFlags}
                        selectedRow={this.state.selectedRow}
                        propertyPanelInterpretedResponse={this.state.propertyPanelInterpretedResponse}
                        isShowLiveLog={this.isShowLiveLog}
                        propertyPanelCollapsed={this.state.propertyPanelCollapsed}
                        propertyPanelLoading={this.state.propertyPanelLoading}
                        onTogglePanelCollapse={this.onTogglePanelCollapse}
                        clusterName={this.state.clusterName}
                        clusterResourceId={this.state.clusterResourceId}
                        nameSpace={this.state.nameSpace}
                        serviceName={this.state.serviceName}
                        hostName={this.state.hostName}
                        nodePool={this.state.nodePool}
                        controllerName={this.state.controllerName}
                        controllerKind={this.state.controllerKind}
                        metricName={this.state.selectedGridMetricName}
                        aggregationOption={this.state.selectedGridAggregationOption}
                        onMetricSelectionChanged={this.onGridMetricSelectionChanged}
                        messagingProvider={this.messagingProvider}
                        onGridRowSelected={this.onGridRowSelected}
                        onConsoleOpen={this.onConsoleOpen}
                        showLiveLogs={showLiveLogs}
                        loggingInfo={this.state.loggingInfo}
                        onConsoleClose={this.onConsoleClose}
                        isConsoleOpen={this.state.isConsoleOpen}
                        onToggleAggregationOption={this.onToggleGridAggregationOption}
                        isTimeRelative={this.state.isTimeRelative}
                        onTabSelectionChanged={this.onTabSelectionChangedInternal}
                        nameSearchFilterValue={this.state.nameSearchFilterValue}
                        shouldApplyExactNameSearchFilterMatch={this.state.shouldApplyExactNameSearchFilterMatch}
                        onTabContentLoadingStatusChange={this.onTabContentLoadingStatusChange}
                        onTabContentDataLoadError={this.onTabContentDataLoadError}
                        liveDataProvider={this.liveDataProvider}
                        sortColumn={this.state.sortColumn}
                        sortOrder={this.state.sortOrder}
                        onSortOrderChanged={this.onSortOrderChanged}
                        onNameSearchFilterChanged={this.onNameSearchFilterChanged}
                    />
                </TabPanel>
                {deploymentsPane}
            </Tabs>
        );
    }

    private renderHealthTab(): JSX.Element {
        if (this.healthScriptLoadManager && this.healthScriptLoadManager.isLoadCompleted) {
            return <HealthPaneView parentContext={this.mainPageContext} />;
        }

        if (!this.healthScriptLoadManager && (this.state.selectedTab === SingleClusterTab.Health)) {
            // start loading health javascript bundle when we hit health tab the first time
            const script = 'container-health.js';
            this.healthScriptLoadManager =
                new AsyncScriptLoadManager(script, () => typeof HealthPaneView === 'function');

            this.healthScriptLoadManager.load()
                .then(() => { this.forceUpdate(); })
                .catch((error) => {
                    this.telemetry.logException(
                        error, 'ContainerMainPage', ErrorSeverity.Error, { script: script }, null);

                    this.forceUpdate();
                });
        }

        return (
            <div className='health-model-load-msg-container'>
                <BlueLoadingDots size={BlueLoadingDotsSize.medium} />
            </div>
        );
    }

    /**
     * Render the main entry point for the deployments feature (contents of the tab)
     * loading the javascript as needed
     */
    private getDeploymentsPane(): JSX.Element {
        if (this.deployScriptLoadManager && this.deployScriptLoadManager.isLoadCompleted) {
            return (
                <DeploymentsPaneView
                    serviceFactory={ServiceFactory.Instance()}
                    parentContext={this.mainPageContext}
                    telemetry={this.telemetry}
                />
            );
        }

        if (!this.deployScriptLoadManager && (this.state.selectedTab === SingleClusterTab.Deployments)) {
            // start loading health javascript bundle when we hit health tab the first time
            const script = 'container-deployments.js';
            this.deployScriptLoadManager =
                new AsyncScriptLoadManager(script, () => {
                    return typeof DeploymentsPaneView === 'function' &&
                        typeof DeploymentsControlPanelView === 'function' &&
                        typeof ServiceFactory === 'function';
                });

            this.deployScriptLoadManager.load()
                .then(() => { this.forceUpdate(); })
                .catch((error) => {
                    this.telemetry.logException(
                        error, 'ContainerMainPage', ErrorSeverity.Error, { script: script }, null);

                    this.forceUpdate();
                });
        }

        return (
            <div className='deployments-load-msg-container'>
                <BlueLoadingDots size={BlueLoadingDotsSize.medium} />
            </div>
        );
    }
    /**
     * Render the main entry point for the what's news feature (contents of the tab)
     */
    private getNewsPane(): JSX.Element {
        return (
            <NewsPaneView
                parentContext={this.mainPageContext}
                telemetry={this.telemetry}
            />
        );
    }

    /**
     * Processes initialization event from hosting blade
     * @param event event instance
     */
    private processInitEvent(initEvent: CustomEvent): void {
        if (!initEvent.detail || (!initEvent.detail.rawData)) {
            console.warn(`[container-insights] "Init" event received by pre-load script missing detail.rawData`);
            return;
        }
        const data: IInitEventProps = JSON.parse(initEvent.detail.rawData) as IInitEventProps;

        this.updateAuthorizationHeaders(
            data.armAuthorizationHeaderValue,
            data.logAnalyticsAuthorizationHeaderValue
        );

        // set feature flags only if state does not have them already
        // note they don't change through iframe lifetime
        if (data.featureFlags && !this.hoistedState.featureFlags) {
            this.setState({ featureFlags: data.featureFlags });
        }

        const containerClusterResourceId = !!data && data.containerClusterResourceId ? data.containerClusterResourceId : '';
        this.registerTabs(data.featureFlags, containerClusterResourceId);

        BladeContext.instance().initialize(data.containerClusterResourceId,
            data.containerClusterName,
            data.workspaceResourceId,
            data.featureFlags);

        if (data.isInBlade) { // see if we're "in-blade"
            if (!this.hoistedState.inBlade) { // operate on state only if it isn't set yet
                this.setInBladeState(data);
                this.setNavigationProps(data.navigationProps as INavigationProps, data.featureFlags);
            }
        } else {
            this.updateWorkspaceList(data);
        }

        // switch tabs if needed
        const legacyTabName = this.getLegacySelection(this.getSelectedTabFromNavProps(data.navigationProps));
        if (!this.hoistedState.initializationInfoReceived && (this.hoistedState.selectedTab !== legacyTabName)) {
            this.setState({ selectedTab: legacyTabName || SingleClusterTab.ContainerCluster });
        }

        // Set the cloud in our environment config
        if (!EnvironmentConfig.Instance().isConfigured()) {
            EnvironmentConfig.Instance().initConfig(data.azureCloudType, data.isMpac, data.authorizationUrl);
        }

        // Set telemetry
        if (!this.telemetry && EnvironmentConfig.Instance().isConfigured) {
            this.telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
            this.setTelemetryContext(data);
        }

        // record the fact that we received init event
        if (!this.hoistedState.initializationInfoReceived) {
            // set up blade load manager
            BladeLoadManager.Instance().initialize(
                TelemetryMainArea.Containers,
                ContainerMainPage.getExpectedNetworkQueryNames(this.getSelectedTabFromNavProps(data.navigationProps)));

            BladeLoadManager.Instance().setPerformanceMeasure('frame_tokenReceived');

            // report the fact that we're done loading if cluster is not onboarded
            if (data.isInBlade) {
                const workspace = this.workspaceInfoFromResourceId(data.workspaceResourceId);

                if (!workspace) {
                    BladeLoadManager.Instance().terminateLoadTracking(LoadTrackingTerminationReason.NotOnboarded);
                }
            }

            this.setState({ initializationInfoReceived: true });
        }
    }

    /**
     * Sets state for in-blade experience
     * @param initEventData initialization event payload
     */
    private setInBladeState(initEventData: IInitEventProps): void {
        if (!initEventData) { throw new Error('Parameter @initEventData may not be null or undefined'); }

        const workspace = this.workspaceInfoFromResourceId(initEventData.workspaceResourceId);

        const inBlade: IInBladeProps = {
            workspace: workspace,
            containerClusterName: initEventData.containerClusterName,
            containerClusterResourceId: initEventData.containerClusterResourceId,
            containerClusterLocation: initEventData.containerClusterLocation
        };

        this.setState({
            inBlade, workspace,
            clusterName: initEventData.containerClusterName,
            clusterLocation: initEventData.containerClusterLocation,
            clusterResourceId: initEventData.containerClusterResourceId,
            isWorkspaceDeletedOrMoved: false
        });
    }

    /**
     * Sets filters used in navigating to the in-blade experience
     * @param navigationProps navigation filter selections
     */
    private setNavigationProps(navigationProps: INavigationProps, featureFlags?: StringMap<boolean>): void {
        // multiple setState calls are to enable robust testing with a feature flag
        const pillSelections: IContainerControlPanelFilterSelections =
            ContainerControlPanelSelections.getPillSelectionsFromNavigationProps(navigationProps.pillSelections);
        if (!featureFlags.freeTierNavigationEnabled) {
            pillSelections.controllerName = '';
            pillSelections.controllerKind = '';
        }

        // TODO: eventually we should remove the individual pillselections from state and reference them from pillSelections
        this.setState({
            nameSpace: pillSelections.nameSpace,
            serviceName: pillSelections.serviceName,
            hostName: pillSelections.hostName,
            startDateTimeUtc: pillSelections.startDateTimeUtc,
            endDateTimeUtc: pillSelections.endDateTimeUtc,
            timeRangeSeconds: pillSelections.timeRangeSeconds,
            isTimeRelative: pillSelections.isTimeRelative,
            pillSelections: pillSelections,
            selectedTab: this.getLegacySelection(this.getSelectedTabFromNavProps(navigationProps)) ||
                SingleClusterTab.ContainerCluster
        })

        if (featureFlags.freeTierNavigationEnabled) {
            this.setState({
                controllerName: pillSelections.controllerName || '', // 2 buttons that loads 'omsagent' and 'not kube-system'
                controllerKind: pillSelections.controllerKind || '', // always replicaset
                nameSearchFilterValue: navigationProps.searchTerm || '', // already a control for this
                liveMetricsTurnedOn: navigationProps.seeLiveMetrics || false, // add a toggle to brad's blade to test. always false
                sortColumn: navigationProps.sortColumn != null ? navigationProps.sortColumn : 2, // not done. add simple control
                sortOrder: navigationProps.sortOrder != null ? navigationProps.sortOrder :  // not done. add simple control
                    ContainerHostMetrics.get(ContainerMainPage.GetGridMetricName(this.localStorageManager)).descriptor.isHigherValueBetter
                        ? GridSortOrder.Asc
                        : GridSortOrder.Desc
            });
        }
    }

    /**
     * Merges batch of workspaces from init event to workspace managed
     * @param initEventData initialization event payload
     */
    private updateWorkspaceList(initEventData: IInitEventProps): void {
        if (!initEventData) { throw new Error('Parameter @initEventData may not be null or undefined'); }

        if (!this.workspaceManager) {
            throw new Error('Invalid page state, no workspace manager present');
        }

        this.workspaceManager.updateErrorState(initEventData.errorsOnLoadList);
        const refreshRequired =
            this.workspaceManager.modifyWorkspaceList(initEventData.workspacesCacheList, initEventData.isLoaded);

        if (refreshRequired) {
            this.setState({ sequenceNumber: initEventData.sequenceNumber });
        }

        if (this.workspaceManager.setSelectedWorkspace(initEventData.selectedWorkspace)) {
            this.setState({ workspace: this.workspaceManager.getSelectedWorkspace() });
        }
    }

    /**
     * Sets telemetry context
     * @param initEventData initialization event payload
     */
    private setTelemetryContext(initEventData: IInitEventProps): void {
        if (!initEventData) { throw new Error('Parameter @initEventData may not be null or undefined'); }

        let telemetryWorkspaceId = '<not-onboarded>';
        let telemetryWorkspaceName = '<not-onboarded>';

        if (initEventData.workspaceResourceId) {
            const workspace = this.workspaceInfoFromResourceId(initEventData.workspaceResourceId);

            telemetryWorkspaceId = workspace ? workspace.id : '<null>';
            telemetryWorkspaceName = workspace ? workspace.name : '<null>';
        }

        const safeAzureCloudType: string = initEventData.azureCloudType ?
            AzureCloudType[initEventData.azureCloudType] : '<null>';
        this.telemetry.setContext({ cloudType: safeAzureCloudType }, false);

        this.telemetry.setContext({ workspace_id: telemetryWorkspaceId, workspace_name: telemetryWorkspaceName }, false);

        if (initEventData.containerClusterName) {
            this.telemetry.setContext({ cluster_name: initEventData.containerClusterName }, false);
        }

        if (initEventData.containerClusterResourceId) {
            this.telemetry.setContext({ cluster_id: initEventData.containerClusterResourceId }, false);
        }

        if (initEventData.initiatorBlade) {
            this.telemetry.setContext({ initiatorBlade: initEventData.initiatorBlade }, false);
        }
    }

    /**
     * onClick handler for clicking a row in the grid. After passing checks, loads the property panel for the selected row
     * @param row selected row
     * @param queryProps the set of props that existed when the onClick handler was called
     */
    private onGridRowSelected(
        row: SGDataRowExt,
    ): void {
        if (!row) {
            throw new Error('Something is wrong with the selected row');
        }
        this.setState({ selectedRow: row });
        // Don't run a query for a row that has already been selected and already has its pp up
        if (row === this.state.propertyPanelRow) {
            return;
        }
        // Don't run a query for pp if the pp is closed and the user wants it closed
        // nib: On first load, pp is closed buts its supposed to open when the grid loads.
        // If the only condition for not running a query is a closed pp state, then we wouldn't be able to
        // open the pp the very first time with a call to onGridRowSelected because the pp would be closed.
        // We need an additional piece of information that informs when it is ok to have the pp open. That's userWantsPropertyPanelOpen
        if (!this.state.userWantsPropertyPanelOpen && this.state.propertyPanelCollapsed) {
            return;
        }
        if (this.state.propertyPanelCollapsed && this.state.userWantsPropertyPanelOpen) {
            this.onTogglePanelCollapse(false); // open the property panel
        }

        this.onConsoleClose();

        const thisQuerySequenceNumber: number = ++this.pendingQuerySequenceNumber;

        this.setState({ propertyPanelLoading: true });

        const requestId = GUID().toLowerCase();
        let eventProps = this.getDropdownSelections();
        eventProps.requestId = requestId;

        const timeInterval = new TimeInterval(this.state.startDateTimeUtc, this.state.endDateTimeUtc, Constants.IdealGridTrendDataPoints);
        const kustoQueryTelemetry = this.telemetry.startLogEvent('ContainerMainPage :: PropertyPanel :: KustoQuery',
            eventProps,
            undefined
        );

        const propertyPanelQueryTelemetry = this.telemetry.startLogEvent('ContainerMainPage :: PropertyPanel :: TotalLoadTime',
            this.getDropdownSelections(),
            undefined
        );

        this.propertyPanelDataProvider.getData(
            ContainerGridBase.getClusterObjectInfo(row),
            timeInterval,
            this.state.workspace,
            requestId
        ).then((data) => {
            BladeLoadManager.Instance().queryCompleted(QueryName.PropertyPanel);

            // Check to see if component expects the result of this query
            // and don't do anything in case a subsequent query was issued
            // before receiving this query's results
            if (thisQuerySequenceNumber !== this.pendingQuerySequenceNumber) {
                return;
            }

            // query result may be modified by caching data provider to
            // indicate there was a cache hit (isFromCache property could be added)
            let completionProperties = null;

            if (data && data.isFromCache) {
                completionProperties = {
                    cacheHit: data && data.isFromCache
                }
            };

            kustoQueryTelemetry.complete(completionProperties);

            // Assume error state with null, e.g. (!data || !data.Tables || (data.Tables.length === 0))
            let propertyPanelInterpretedResponse: IPropertyPanelInterpretedResponse = null;


            if (data === PropertyPanelType.Unsupported) { // If the user clicks on a row that doesn't support property panel, let em know
                propertyPanelInterpretedResponse = { type: PropertyPanelType.Unsupported, data: undefined };
            } else if (data && data.Tables && (data.Tables.length !== 0)) { // There is a valid Kusto response - interpret it
                const dataRows = data.Tables[0].Rows;

                const dataCols = data.Tables[0].Columns;

                if (dataRows && dataCols) {
                    try {
                        const propertyPanelType = ContainerGridBase.getPropertyPanelType(row);
                        propertyPanelInterpretedResponse =
                            KustoPropertyPanelResponseInterpreter.processPropertyPanelQueryResponse(
                                dataRows,
                                dataCols,
                                propertyPanelType,
                                row
                            );
                    } catch (error) {
                        this.telemetry.logException(
                            error,
                            'ContainerMainPage.tsx',
                            ErrorSeverity.Error,
                            this.getDropdownSelections(),
                            undefined
                        );

                        propertyPanelInterpretedResponse = null;
                    }
                }
            }

            this.setState({
                propertyPanelRow: row,
                propertyPanelInterpretedResponse,
                propertyPanelLoading: false,
            }, () => {
                propertyPanelQueryTelemetry.complete();
            });
        }).catch((error) => {
            BladeLoadManager.Instance().terminateLoadTracking(LoadTrackingTerminationReason.QueryFailure);

            // Check to see if component expects the result of this query
            // and don't do anything in case a subsequent query was issued
            // before receiving this query's results
            if (thisQuerySequenceNumber === this.pendingQuerySequenceNumber) {
                this.telemetry.logException(
                    error,
                    'ContainerMainPage.tsx',
                    ErrorSeverity.Error,
                    this.getDropdownSelections(),
                    undefined
                );
                this.setState({
                    propertyPanelInterpretedResponse: null,
                    propertyPanelLoading: false
                });
            }
        });
    }

    /** Dropdown info. Good for telemetry */
    private getDropdownSelections(): StringMap<string> {
        const workspace = this.state.workspace;

        return {
            workspace_id: workspace ? workspace.id : '<null>',
            workspace_name: workspace ? workspace.name : '<null>',
            cluster_name: this.state.clusterName,
            namespace: this.state.nameSpace,
            service_name: this.state.serviceName,
            host_name: this.state.hostName,
            selected_metric: this.state.selectedGridMetricName,
            isTimeRelative: this.state.isTimeRelative ? 'true' : 'false',
            startDateTimeUtc: this.state.startDateTimeUtc
                ? this.state.startDateTimeUtc.toISOString()
                : null,
            endDateTimeUtc: this.state.endDateTimeUtc
                ? this.state.endDateTimeUtc.toISOString()
                : null,
        }
    }

    /**
     * Trigger a property change that will requery kusto... this will not update the user interface (will cause loading
     * icon to appear and slight grey effect when kusto starts, but thats the kusto loading process)
     * @param option new selected aggregation (not used by UI, but used for kusto)
     * Invoked when grid metric selection changes
     * @param metricName metric name
     */
    private onGridMetricSelectionChanged(metricName: string): void {
        if (this.localStorageManager) {
            this.localStorageManager.setItem(LocalStorageKeyName.GridMetricName, metricName);
        }

        BladeLoadManager.Instance().terminateLoadTracking(LoadTrackingTerminationReason.UserInteraction);

        this.setState({ selectedGridMetricName: metricName });
    }

    /**
     * Invoked when grid metric aggregation option is changed
     * @param selectorId sereies selector id
     * @param option aggergation option selected
     */
    private onToggleGridAggregationOption(selectorId: string, option: AggregationOption): void {
        if (this.localStorageManager) {
            this.localStorageManager.setItem(LocalStorageKeyName.GridAggregationOption, option);
        }

        BladeLoadManager.Instance().terminateLoadTracking(LoadTrackingTerminationReason.UserInteraction);

        this.setState({ selectedGridAggregationOption: option });
    }

    private onChartSeriesSelectionsChanged = (chartId: string, newSelections: any): void => {
        this.setState((prevState: IContainerMainPageState) => {
            if (!prevState.chartSeriesSelections || !prevState.chartSeriesSelections.hasOwnProperty(chartId)) {
                // appinsights should pick up and log
                throw 'Chart id doest exist on toggle ' + chartId;
            }

            const chartSeriesSelections = update(prevState.chartSeriesSelections, {
                [chartId]: { $set: newSelections }
            });

            return {
                chartSeriesSelections
            };
        });
    }

    /** Callback to handle when control panel selections change */
    private onControlPanelSelectionsChanged(selections: IContainerControlPanelSelections): void {
        BladeLoadManager.Instance().terminateLoadTracking(LoadTrackingTerminationReason.UserInteraction);

        // Overwrite the pill selections that were provided on navigation with the control panel selections made.
        // In the future, it'd be better if we didn't seperate selections passed on navigation and selections made
        // while using our application
        const pillSelections: IContainerControlPanelFilterSelections = {
            nameSpace: this.state.pillSelections.nameSpace == null ? null : selections.nameSpace,
            serviceName: this.state.pillSelections.serviceName == null ? null : selections.serviceName,
            hostName: this.state.pillSelections.hostName == null ? null : selections.hostName,
            nodePool: this.state.pillSelections.nodePool == null ? null : selections.nodePool,
            startDateTimeUtc: this.state.pillSelections.startDateTimeUtc == null ?
                null :
                selections.startDateTimeUtc,
            endDateTimeUtc: this.state.pillSelections.endDateTimeUtc == null ?
                null :
                selections.endDateTimeUtc,
            isTimeRelative: this.state.pillSelections.isTimeRelative == null ? null : selections.isTimeRelative,
            timeRangeSeconds: this.state.timeRangeSeconds == null ? null : selections.timeRangeSeconds,
            controllerName: this.state.controllerName == null ? null : selections.controllerName,
            controllerKind: this.state.controllerKind == null ? null : selections.controllerKind
        }

        this.setState({
            workspace: selections.workspace,
            clusterName: selections.clusterName,
            nameSpace: selections.nameSpace,
            serviceName: selections.serviceName,
            hostName: selections.hostName,
            nodePool: selections.nodePool,
            startDateTimeUtc: selections.startDateTimeUtc,
            endDateTimeUtc: selections.endDateTimeUtc,
            timeRangeSeconds: selections.timeRangeSeconds,
            isTimeRelative: selections.isTimeRelative,
            chartData: {},
            controllerName: selections.controllerName,
            controllerKind: selections.controllerKind,
            pillSelections
        });
    }

    /** gets the telemetry strings given a tab name */
    private getTelemetryStringForTab(selectedTab: SingleClusterTab): string {
        switch (selectedTab) {
            case SingleClusterTab.ContainerCluster:
                return TelemetryStrings.ChartsPage;
            case SingleClusterTab.Health:
                return TelemetryStrings.HealthPage;
            case SingleClusterTab.Node:
                return TelemetryStrings.NodeGrid;
            case SingleClusterTab.Controller:
                return TelemetryStrings.ControllerGrid;
            case SingleClusterTab.Container:
                return TelemetryStrings.ContainerGrid;
            case SingleClusterTab.Deployments:
                return TelemetryStrings.Deployments;
            case SingleClusterTab.News:
                return TelemetryStrings.NewsPage;
            default:
                this.telemetry.logException('Unknown index value in getTelemetryStringForTabIndex!',
                    TelemetryStrings.ContainerMainPage, ErrorSeverity.Warn, { indexPassed: selectedTab }, null);
                return '';
        }
    }

    /**
     * What makes this different from onTabSelectionChanged?
     * When the tab changes, we need to keep the selected time range consistent and predictable
     * @param tabName
     * @param nameSearchFilterValue
     */
    private onTabSelectionChangedInternal(tabName: SingleClusterTab, nameSearchFilterValue?: string): boolean | void {
        this.telemetry.logNavigationEvent(
            this.getTelemetryStringForTab(this.state.selectedTab),
            this.getTelemetryStringForTab(tabName),
            nameSearchFilterValue ? { nameSearchFilterValue: nameSearchFilterValue } : null
        );

        this.setState((prevState: IContainerMainPageState): any => {
            // Assume that by default everything is relative time
            let endDateTimeUtc: moment.Moment = moment.utc();
            let startDateTimeUtc: moment.Moment = moment(endDateTimeUtc).add(-this.state.timeRangeSeconds, 's');
            if (!this.state.isTimeRelative) {
                endDateTimeUtc = moment.utc(this.state.endDateTimeUtc);
                startDateTimeUtc = moment.utc(this.state.startDateTimeUtc);
            }
            return {
                selectedTab: tabName,
                endDateTimeUtc: endDateTimeUtc.toDate(),
                startDateTimeUtc: startDateTimeUtc.toDate(),
                propertyPanelForFirstRowLoaded: false,
                isTimeRelative: this.state.isTimeRelative,
                nameSearchFilterValue: nameSearchFilterValue || '',
                propertyPanelCollapsed: tabName === SingleClusterTab.ContainerCluster ? true : this.state.propertyPanelCollapsed,
                shouldApplyExactNameSearchFilterMatch: nameSearchFilterValue ? true : false,
                sortColumn: Constants.DefaultSortColumn // fix to set the sort column to something that's always defined. 
            };
        });

        return true;
    }

    /** Callback for handling tab selection changes */
    private onTabSelectionChanged(index: number, last?: number, event?: Event, nameSearchFilterValue?: string): boolean | void {
        // Initial load is done if the user navigates away from the landing page
        BladeLoadManager.Instance().terminateLoadTracking(LoadTrackingTerminationReason.UserInteraction);

        const tabName: SingleClusterTab = this.getRealName(index);
        nameSearchFilterValue = nameSearchFilterValue || '';
        return this.onTabSelectionChangedInternal(SingleClusterTab[tabName], nameSearchFilterValue);
    }

    /** Updates the authroization headers used to make requests to RPs */
    private updateAuthorizationHeaders(
        armAuthorizationHeaderValue: string,
        logAnalyticsAuthorizationHeaderValue: string,
    ): void {
        const initInfo = InitializationInfo.getInstance();

        if (initInfo.getAuthorizationHeaderValue(AuthorizationTokenType.Arm) !== armAuthorizationHeaderValue) {
            initInfo.setAuthorizationHeaderValue(AuthorizationTokenType.Arm, armAuthorizationHeaderValue);
        }

        if (initInfo.getAuthorizationHeaderValue(AuthorizationTokenType.LogAnalytics) !== logAnalyticsAuthorizationHeaderValue) {
            initInfo.setAuthorizationHeaderValue(AuthorizationTokenType.LogAnalytics, logAnalyticsAuthorizationHeaderValue);
        }
    }

    private onChartDataLoaded(chartData: StringMap<StringMap<ChartSeriesData>>): void {
        this.setState({ chartData });
    }

    /**
     * Toggle live metrics view
     * @param value boolean to set seeLiveMetrics to
     */
    private onToggleLiveMetrics(value: boolean) {
        this.setState({ liveMetricsTurnedOn: value }, () => {
            if (!this._clusterPaneReference || !this._clusterPaneReference.current) { return; }
            this._clusterPaneReference.current.toggleLiveFeature(value);
        });

        if (value) {
            this.telemetry.logEvent('liveMetrics.switchOn', undefined, undefined);
        } else {
            this.telemetry.logEvent('liveMetrics.switchOff', undefined, undefined);
        }
    }

    /**
     * Function that changes ContainerMainPage state, which triggers opening of the live console window
     * @param information required information to start getting logs of a container
     */
    private onConsoleOpen(information: RequiredLoggingInfo) {
        //Set the props of the console to be different
        this.telemetry.logEvent(
            'LiveConsoleOpen',
            {
                'consoleType': information.consoleType
            },
            undefined
        );
        this.openConsoleTimer = this.telemetry.startLogEvent(
            'LiveConsoleOpen',
            undefined,
            undefined
        );
        this.setState({
            loggingInfo: information,
            isConsoleOpen: true
        }, () => {
            const element = document.getElementById('scrollableConsole');
            if (!!element && !!element.focus) {
                element.focus();
            }
        });
    }

    /**
     * Function that changes ContainerMainPage state, which triggers closing of the live console window
     */
    private onConsoleClose() {
        if (this.openConsoleTimer) {
            this.openConsoleTimer.complete();
        }
        this.setState({
            loggingInfo: this.createEmptyLoggingInfo(),
            isConsoleOpen: false
        });
    }

    /**
     * Creates a new RequiredLoggingInfo object which only contains null values.
     * This is used to clear previous loggingInfo data in the State.
     */
    private createEmptyLoggingInfo(): RequiredLoggingInfo {
        let loggingInfo: RequiredLoggingInfo = new RequiredLoggingInfo(null, null, null, null, null, null, null, null);
        return loggingInfo;
    }


    /**
     * Constructs workspace info structure using provided workspace resource id
     * @param workspaceResourceId Azure workspace resource id
     * @returns workspace info structure
     */
    private workspaceInfoFromResourceId(workspaceResourceId: string): IWorkspaceInfo {
        if (!workspaceResourceId) {
            return null;
        }

        const idParts: string[] = workspaceResourceId.split('/');

        const workspace: IWorkspaceInfo = {
            id: workspaceResourceId,
            name: idParts[idParts.length - 1],
            location: '',
        };

        return workspace;
    }

    /**
     * Onclick handler for setting isTabContentLoading
     * @param isLoading true if the tab content is loading
     */
    private onTabContentLoadingStatusChange(isLoading: boolean) {
        this.setState({ isTabContentLoading: isLoading });
    }

    /**
     * Onclick handler for setting isTabContentLoading
     * @param isLoading true if the tab content is loading
     */
    private onTabContentDataLoadError(error: any) {
        this.setState({ isTabContentLoading: false });

        if (error &&
            error.httpRequestError &&
            error.httpRequestError.status === 404) {
            this.setState({ isWorkspaceDeletedOrMoved: true });
        }
    }


    /**
     *  Determine whether to show live logging or not
     *  return true to show live logging link else false
     */
    private isShowLiveLog(): boolean {

        let showLiveLogs: boolean = true;

        // live logging not supported yet for aks-engine clusters
        if (
            this.state.inBlade &&
            this.state.inBlade.containerClusterResourceId &&
            !HelperFunctions.isAKSCluster(this.state.inBlade.containerClusterResourceId)
        ) {
            showLiveLogs = false;
        }

        return showLiveLogs;
    }

    /**
     * Generates action items for generating the action bar
     */
    private getActionBarItems(): IActionItem[] {
        let actionItems: IActionItem[] = [];

        // Refresh action button
        const refreshWithTelemetry = () => {
            const telemetryCustomProperties: any = {
                // Change this to subArea?
                area: this.getTelemetryStringForTab(this.state.selectedTab),
                tags: ['ActionBar']
            }
            if (this.controlPanelReference) {
                this.controlPanelReference.refreshOnClickHandler();
            }

            // update version counter in state to let child views know they need to refresh
            this.setState(
                (prevState) => ({ version: prevState.version + 1 }));

            this.mainPageContext.refresh();
            if (this.state.featureFlags.liveMetrics &&
                EnvironmentConfig.Instance().isLiveDataEnabledEnvironment()) {
                this.onToggleLiveMetrics(false);
            }

            this.telemetry.logEvent('refresh', telemetryCustomProperties, null);
        }

        const refreshActionItem = {
            svg: <RefreshSVG />,
            text: DisplayStrings.Refresh,
            action: refreshWithTelemetry,
            actionType: ActionItemType.Button,
            isDisabled: this.state.isTabContentLoading,
            actionGroup: ActionGroup.One
        }
        actionItems.push(refreshActionItem);

        if (this.showMultiClusterNavigation()) {
            // Navigate to Multicluster action button
            const navigateToMulticlusterWithTelemetry = () => {
                this.telemetry.logNavigationEvent(
                    this.getTelemetryStringForTab(this.state.selectedTab),
                    TelemetryStrings.MultiClusterMainPage,
                    { tags: ['ActionBar'] }
                );
                this.messagingProvider.sendNavigateToMulticluster();
            }

            const multiclusterActionItem = {
                svg: <MulticlusterSVG />,
                text: DisplayStrings.MulticlusterButton,
                action: navigateToMulticlusterWithTelemetry,
                actionType: ActionItemType.Button,
                actionGroup: ActionGroup.Two
            }
            actionItems.push(multiclusterActionItem);
        }

        const clusterLocation = this.state.inBlade ? this.state.inBlade.containerClusterLocation.toLocaleLowerCase() : '';
        if (this.state.featureFlags.outofboxmetricalertexp === 'true' &&
            HelperFunctions.isAKSCluster(this.state.clusterResourceId) &&
            MdmCustomMetricAvailabilityLocations.indexOf(clusterLocation) > -1) {
            const navigateToViewAlertsWithTelemetry = () => {
                this.telemetry.logNavigationEvent(
                    this.getTelemetryStringForTab(this.state.selectedTab),
                    TelemetryStrings.ViewAlertsLink,
                    { tags: ['ActionBar'] }
                );
                this.messagingProvider.sendNavigateToViewAlerts();
            }

            const viewAlertsActionItem = {
                svg: <AlertSVG />,
                text: DisplayStrings.ViewAlerts,
                action: () => {
                    navigateToViewAlertsWithTelemetry();
                },
                actionType: ActionItemType.Button,
                actionGroup: ActionGroup.Two
            }
            actionItems.push(viewAlertsActionItem);
        }

        // Feedback dropdown is hard-coded in the ActionBar component itself for now, until it is converted into a button
        // Workbooks and help dropdown is hard-coded : Refactor task ->
        // https://msazure.visualstudio.com/InfrastructureInsights/_workitems/edit/5477439​​​​​​​​​​​​​​

        return actionItems;
    }

    /**
     * Return the override address for the Kube API proxy server, if there has been one passed down through the query parameters
     */
    private getKubernetesProxyRegionCode(): string {
        let regionCode: string = '';

        if (this.state.featureFlags && this.state.featureFlags.liveLogOverride != null) {
            regionCode = this.state.featureFlags.liveLogOverride;
        }

        return regionCode;
    }

    /**
     * Returns a boolean indicating if the health model tab needs to be displayed or not
     */
    private showClusterHealthModel(featureFlags: any): boolean {
        let showClusterHealthModel = false;

        if (featureFlags && featureFlags.healthModel != null) {
            showClusterHealthModel = (featureFlags.healthModel.toLowerCase() === 'true');
        }

        return showClusterHealthModel;
        // return true;
    }

    /**
     *  sends the message to parent blade to pin the selected chart to the dashboard
     * @param chartId - Id of the chart
     * @param showOptionPicker - flag to indicate to show or hide the option picker on the Pinned chart
     */
    private pinChartToDashboard(chartId: string, showOptionPicker: boolean) {

        if (!this.state.enablePinChartToDashboard) {
            return;
        }

        const timeRange = this.state.isTimeRelative
            ? { options: {}, relative: { duration: this.state.timeRangeSeconds * 1000 } } // TimePill expects duration in ms
            : {
                options: { appliedISOGrain: 'Auto' },
                absolute: { startTime: this.state.startDateTimeUtc, endTime: this.state.endDateTimeUtc }
            };

        const message: ContainerInsightsPinChartToDashboardMessage = {
            metricQueryId: chartId,
            clusterResourceId: this.state.clusterResourceId,
            clusterName: this.state.clusterName,
            workspaceResourceId: this.state.workspace.id,
            timeRange: timeRange,
            defaultOptionPicks: this.state.chartSeriesSelections[chartId],
            showOptionPicker
        };

        this.messagingProvider.sendPinContainerInsightsChartToDashboardMessage(message);
    }

    /**
     * Returns a boolean indicating if the MultiClusterNavigation needs to be visible or not
     */
    private showMultiClusterNavigation(): boolean {

        if (EnvironmentConfig.Instance().isBlackforest()) {
            return false;
        }

        return true;
    }

    /**
     * Returns a boolean indicating if the what's new Tab needs to be visible or not
     */
    private showNewsTabNavigation(featureFlags): boolean {

        if (!featureFlags || !featureFlags.newsTracking ||
            featureFlags.newsTracking.toLocaleLowerCase() !== 'true') {
            return false;
        }

        return EnvironmentConfig.Instance().isPublic() || EnvironmentConfig.Instance().isMPAC() ||
            EnvironmentConfig.Instance().isLocalhost();
    }

    private onSortOrderChanged(sortColumn: number, sortOrder: GridSortOrder) {
        this.setState({ sortColumn, sortOrder });
    }

    /**
 * Invoked when name filter value changed
 * @param nameSearchFilterValue name filter value
 */
    private onNameSearchFilterChanged(nameSearchFilterValue: string): void {
        this.setState({ nameSearchFilterValue });
    }
}
