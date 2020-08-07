/** tpl */
import * as moment from 'moment';
import * as React from 'react';
import { Promise } from 'es6-promise';
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import { TooltipService, ExternalLinkSvg, DropdownMessage } from 'appinsights-iframe-shared';
import { GUID } from '@appinsights/aichartcore';
import { DropdownOption } from '@appinsights/pillscontrol-es5';
import { DropdownOption as HelpDropdownOption } from 'appinsights-iframe-shared';
import * as update from 'immutability-helper';

/** local */
import { IManagedCluster } from './metadata/IManagedCluster';
import { MulticlusterControlPanel } from '../shared/summary-panel/MulticlusterSummaryPanel';
import { MulticlusterMonitoredGridPane } from './grids/monitored/MulticlusterMonitoredGridPane';
import { MulticlusterUnmonitoredGridPane } from './grids/unmonitored/MulticlusterUnmonitoredGridPane';
import { MulticlusterGridBase, CloudEnvironment, CloudEnvironmenDisplayNameMap } from './grids/MulticlusterGridBase';
import { MultiClusterDataProvider } from './data-provider/MultiClusterDataProvider';
import { DraftGridResponseInterpreter } from './data-provider/DraftGridResponseInterpreter'
import { MonitoredClusterMetaData } from './metadata/MonitoredClusterMetaData';
import { ISummaryPanelInfo } from '../shared/summary-panel/ISummaryPanelInfo';
import { IRequestInfo } from './data-provider/IRequestInfo';
import { UnmonitoredClusterMetaData } from './metadata/UnmonitoredClusterMetaData';

/** shared */
import { MessagingProvider } from '../shared/MessagingProvider';
import { DisplayStrings } from './MulticlusterDisplayStrings';
import * as TelemetryStrings from '../shared/TelemetryStrings';
import { ITelemetry, IFinishableTelemetry, TelemetryMainArea, TelemetrySubArea } from '../shared/Telemetry';
import { TelemetryFactory } from '../shared/TelemetryFactory';
import { StringHelpers } from '../shared/Utilities/StringHelpers';
import { IGridLineObject } from '../shared/GridLineObject';
import { ErrorSeverity } from '../shared/data-provider/TelemetryErrorSeverity';
import * as GlobalConstants from '../shared/GlobalConstants';
import { AppInsightsProvider } from '../shared/CustomAppInsightMessagingProvider';
import { ITimeInterval, TimeInterval } from '../shared/data-provider/TimeInterval'
import { ActionBar, ActionItemType, ActionGroup, IActionItem } from '../container/action-bar/ActionBar';
import { TextDropDownPill } from '../shared/pill-component/TextDropDownPill';

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
import '../../styles/multicluster/MulticlusterMainPage.less';

/** svg */
import { RefreshSVG } from '../shared/svg/refresh';

import { LocaleStringsHandler } from '../shared/LocaleStringsHandler';
import { EnvironmentConfig, ContainerInsightsPage } from '../shared/EnvironmentConfig';
import { GettingStartedTabView } from './tabs/getting-started/GettingStartedTabView';
import { BlueLoadingDots, BlueLoadingDotsSize } from '../shared/blue-loading-dots';

/** name of the query used for the telemetry tracking */
const MulticlusterGridQueryName: string = 'MultiAksMonitoredClusterQueryName';

const IdealGridTrendDataPoints: number = 25;


export enum ActionBarConfig {
    MulticlusterMonitoredOrNonMonitoredTab, // action bar config specific to multi cluster
    MultciclusterGettingStartedTab // action bar config specific to multi cluster, specifically when the "getting started" tab is active
}

/**
 * Props of MultiClusterMainaPage
 */
export interface IMulticlusterMainPageProps {
    /** index of the selected tab
     * 0 for monitoredClusters clusters
     * 1 for unmonitored clusters
     * defaults to 0
     */
    selectedTab?: MultiClusterTab;
    isAuthorizationInfoReceived: boolean;
    sequenceNumber: number;
    messageDataRefreshVersion: number;
    processedMulticlusterInitEvent: boolean;
    selectedGlobalSubscriptionCount: number;
    featureFlags: any;
    isError: boolean;
    monitoredClustersList: IManagedCluster[],
    unmonitoredClustersList: IManagedCluster[],
    oneOfSelectedGlobalSubscriptionId: string,
    authHeaderValue: string
}

export enum MultiClusterTab {
    GettingStarted = 0,
    MonitoredClusters = 1,
    UnmonitoredClusters = 2
}

/**
 * The main page maintains the nessessary state to initialize the child tab properties,
 *  which is why they share a common interface.
 */
interface IMulticlusterMainPageState {
    /** index of the selected tab */
    selectedTab: number;
    /** to track error state */
    isError: boolean;
    /** grid data */
    monitoredGridData: any[];
    /** grid data */
    unmonitoredGridData: any[];
    /** for the cluster status summary  */
    summaryPanelInfo: ISummaryPanelInfo;
    /**current selected pill item */
    currentSelectedPillItem: DropdownOption;
    isLoadingMonitoredGrid: boolean;
    isLoadingUnmonitoredGrid: boolean;
    loadedData: boolean;
    /** useful queueing up telemetry calls that need to wait until the app has the right context */
    telemetryQueue: {(): void}[]; 
}

/** Multicluster main page */
export class MulticlusterMainPage extends React.Component<IMulticlusterMainPageProps, IMulticlusterMainPageState> {
    private telemetry: ITelemetry;
    private messagingProvider: MessagingProvider = new MessagingProvider(new AppInsightsProvider());
    private pendingQuerySequenceNumber: number = 0;
    private dataProvider: MultiClusterDataProvider = MulticlusterGridBase.createDataProvider();
    private responseInterpreter: DraftGridResponseInterpreter = new DraftGridResponseInterpreter();
    private hasViewedMonitoredClustersTab: boolean = false;
    private hasViewedUnmonitoredClustersTab: boolean = false;

    constructor(props?: IMulticlusterMainPageProps) {
        super(props);

        const { isError, selectedTab } = props;

        this.state = {
            selectedTab: selectedTab || MultiClusterTab.GettingStarted,
            isLoadingMonitoredGrid: true,
            isLoadingUnmonitoredGrid: true,
            monitoredGridData: [],
            unmonitoredGridData: [],
            summaryPanelInfo: {
                numTotal: null,
                numCritical: null,
                numWarning: null,
                numHealthy: null,
                numUnknown: null,
                numNonMonitored: null,
            },
            currentSelectedPillItem: {
                label: CloudEnvironmenDisplayNameMap[CloudEnvironment[CloudEnvironment.Azure]],
                value: CloudEnvironment.Azure
            },
            loadedData: false,
            isError,
            telemetryQueue: []
        };

        LocaleStringsHandler.Instance().handleLocaleEvent(() => {
            this.forceUpdate();
        });

        this.onCloudEnvironmentDropDownChanged = this.onCloudEnvironmentDropDownChanged.bind(this);

        // TODO: make sure the context is retrieved, the one set in the message handler parent component
        this.telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
    }

    /**
     * renders the main page
     */
    public render(): JSX.Element {
        return (
            <div className='MainPage-root'>
                
                {this.renderContentPane()}
                {TooltipService.getRenderer()} {/*
                    Registers the TooltipService renderer at the outermost div
                    so that it can properly position and display Ibiza-style tooltips
                    that block all other UI interaction when toggled open
                */}
            </div>
        )
    }

     /** 
     * React lifecycle method that executes after the component has been rendered to the DOM 
     * Since no queries are being run on initial loading of the HTML, JS, CSS bundle, we are calculting the
     * finishing of our load time after this component has been rendered
     */
    public componentDidMount() {
        this.messagingProvider.sendFinishedLoading(MulticlusterGridQueryName);
    }

    /** 
     * Runs after the render function has finished
     * Great for running network calls after props or state have been updated
     * Great for placing functions that you need to run when props or state change
     * If it is initial load, initialize the grids with the data we get from ARG
     * Otherwise, if the tab is not Getting Started and if its not the initial load or if the data from ARG 
     * has changed, query for the health data fo the monitored clusters     
     */
    public componentDidUpdate(prevProps: IMulticlusterMainPageProps) {
        if (this.props.processedMulticlusterInitEvent && this.props.authHeaderValue) {
            // Initial load mechanism
            if ((this.state.selectedTab === MultiClusterTab.MonitoredClusters || 
                this.state.selectedTab === MultiClusterTab.UnmonitoredClusters) &&
                !this.state.loadedData
            ) {
                this.setState({ loadedData: true }, () => this.messagingProvider.sendRefreshRequestForMultiClusterPage('refreshRequest'));
            } else if ( 
                // prevProps.messageDataRefreshVersion !== 0 because we are not waiting for the init msg. messageDataRefreshVersion
                // starts at 0, then the init msg sets it to 1. We do not want to load data on the get started page. Only when the 
                // user decides to visit the monitored or unmonitored tabs
                this.props.messageDataRefreshVersion > prevProps.messageDataRefreshVersion && prevProps.messageDataRefreshVersion !== 0
            ) { // Refresh
                this.setState(
                    { isError: false }, // Refresh should wipe away past errors
                    () => this.loadData(
                        this.props.monitoredClustersList, 
                        this.props.unmonitoredClustersList, 
                        this.props.selectedGlobalSubscriptionCount
                    )
                );
            }

            // empty telemetry queue because we got all telemetry context needed from init event
            if (this.state.telemetryQueue.length > 0) {
                let telemetryQueue: {(): void}[] = update(this.state.telemetryQueue, []);
                while (telemetryQueue.length > 0) {
                    let telemetryCall: () => void = telemetryQueue.pop();
                    telemetryCall();
                }
                this.setState({ telemetryQueue: [] });
            }
        }
    }

    /** render drop down pill for cloud type */
    private renderCloudTypeDropDownPill(): JSX.Element {
        let dropdownPill: JSX.Element =
            <div className='cloud-type-header-pill'>
                <TextDropDownPill
                    containerId={'cloud-type-drop-down'}
                    selectedItem={this.state.currentSelectedPillItem}
                    dropDownOptions={this.getDropDownOptions()}
                    onSelectionChanged={this.onCloudEnvironmentDropDownChanged}
                    areValuesLoading={false}
                    pillLabel={DisplayStrings.CloudType + DisplayStrings.LabelSeperator} />
            </div>;
        return dropdownPill;
    }

    /** renders the content pane */
    private renderContentPane(): JSX.Element {
        return (
            <div className='content-root'>
                <ActionBar
                    actionItems={this.getActionBarItems()}
                    messagingProvider={this.messagingProvider}
                    isSingleClusterPage={false}
                    helpDropdownoptions={this.getHelpDropdownOptions()}
                />
                {this.renderTabs()}
            </div>
        );
    }

    /** renders the tabs */
    private renderTabs(): JSX.Element {
        return (
            <Tabs
                className='infra-main-tabs'
                selectedTabClassName={'selected-tab'}
                // might have to be selective about applying these classes later
                selectedTabPanelClassName={'react-tabs__tab-panel--selected'}
                selectedIndex={this.state.selectedTab}
                onSelect={this.onTabSelectionChanged.bind(this)}>
                <div className='pane-header'>
                    <TabList >
                        <Tab>{DisplayStrings.GettingStartedTabName}</Tab>
                        <Tab>
                            {
                                StringHelpers.replaceAll(DisplayStrings.MonitoredClustersTab,
                                    '{0}',
                                    this.state.loadedData ? `(${this.props.monitoredClustersList.length})` : '')
                            }
                        </Tab>
                        <Tab>
                            {
                                StringHelpers.replaceAll(DisplayStrings.UnmonitoredClustersTab,
                                    '{0}',
                                    this.state.loadedData ? `(${this.props.unmonitoredClustersList.length})` : '')
                            }
                        </Tab>
                    </TabList>
                </div>
                {this.renderGettingStartedTab()}
                {this.renderMonitoredClustersTab()}
                {this.renderUnmonitoredClustersTab()}
            </Tabs>
        );
    }

    /** Renders the Getting Started tab */
    private renderGettingStartedTab(): JSX.Element {
        return (
            <TabPanel>
                <div className='tab-content'>
                    <GettingStartedTabView 
                        telemetry={this.telemetry}
                        viewMonitoredClustersOnClickHandler={() => this.onTabSelectionChanged(
                            MultiClusterTab.MonitoredClusters, 
                            MultiClusterTab.GettingStarted
                        )}
                        onboardUnmonitoredClustersOnClickHandler={() => this.onTabSelectionChanged(
                            MultiClusterTab.UnmonitoredClusters, 
                            MultiClusterTab.GettingStarted
                        )}
                    />
                </div>
            </TabPanel>
        );  
    }

    /** Gets the data for the Help dropdown */
    private getHelpDropdownOptions(): HelpDropdownOption[] {
        let helpDropdownOptions: HelpDropdownOption[] = [];

        helpDropdownOptions.push(new DropdownMessage(
            EnvironmentConfig.Instance().getForumsUrl(),
            `${DisplayStrings.HelpDropdownForums}`,
            'openForums',
            {},
            <ExternalLinkSvg />
        ));
        helpDropdownOptions.push(new DropdownMessage(
            EnvironmentConfig.Instance().getLearnMoreUrl(ContainerInsightsPage.Multicluster),
            `${DisplayStrings.HelpDropdownLearnMore}`,
            'openCILearnMore',
            {},
            <ExternalLinkSvg />
        ));

        return helpDropdownOptions;
    }

    /** Render the Monitored Clusters tab */
    private renderMonitoredClustersTab(): JSX.Element {
        return (
            <TabPanel>
                <div className='tab-content'>
                    { !this.props.processedMulticlusterInitEvent || !this.props.authHeaderValue // not click through too
                        ?   <div className='init-msg-loading-dots center-flex not-click-through'>
                                <BlueLoadingDots size={BlueLoadingDotsSize.large} />
                            </div>
                        : <></>
                    }
                    {this.renderCloudTypeDropDownPill()}
                    <MulticlusterControlPanel
                        isLoading={this.state.isLoadingMonitoredGrid}
                        isError={this.state.isError}
                        messagingProvider={this.messagingProvider}
                        summaryPanelInfo={this.state.summaryPanelInfo}
                    />
                    <MulticlusterMonitoredGridPane
                        isLoading={this.state.isLoadingMonitoredGrid}
                        isError={this.state.isError}
                        gridData={this.state.monitoredGridData}
                        messagingProvider={this.messagingProvider}
                        selectedGlobalSubscriptionCount={this.props.selectedGlobalSubscriptionCount}
                    />
                </div>
            </TabPanel>
        );
    }

    /** Renders the unmonitored clusters tab */
    private renderUnmonitoredClustersTab(): JSX.Element {
        return (
            <TabPanel>
                <div className='tab-content'>
                    { !this.props.processedMulticlusterInitEvent || !this.props.authHeaderValue // not click through too
                        ?   <div className='init-msg-loading-dots center-flex not-click-through'>
                                <BlueLoadingDots size={BlueLoadingDotsSize.large} />
                            </div>
                        : <></>
                    }
                    {this.renderCloudTypeDropDownPill()}
                    <MulticlusterControlPanel
                        isLoading={this.state.isLoadingUnmonitoredGrid}
                        isError={this.state.isError}
                        messagingProvider={this.messagingProvider}
                        summaryPanelInfo={this.state.summaryPanelInfo}
                    />
                    <MulticlusterUnmonitoredGridPane
                        isLoading={this.state.isLoadingUnmonitoredGrid}
                        gridData={this.state.unmonitoredGridData}
                        selectedGlobalSubscriptionCount={this.props.selectedGlobalSubscriptionCount}
                        isError={this.state.isError}
                        messagingProvider={this.messagingProvider}
                    />
                </div>
            </TabPanel>
        );
    }

    private loadData(
        monitoredClustersList: IManagedCluster[], 
        unmonitoredClustersList: IManagedCluster[], 
        selectedGlobalSubscriptionCount: number
    ): void {
        this.setState({
            isLoadingMonitoredGrid: true,
            isLoadingUnmonitoredGrid: true,
        }, () => {
            this.initializeMonitoredGrid(monitoredClustersList);
            this.initializeUnmonitoredGrid(unmonitoredClustersList);
            this.initializeSummaryPanel(monitoredClustersList, unmonitoredClustersList);

            this.setState({
               isLoadingUnmonitoredGrid: false,
            }, () => {
                this.queryMonitoredClustersHealth(monitoredClustersList, selectedGlobalSubscriptionCount);
            });
        });
    }

    private initializeMonitoredGrid(monitoredClustersList: IManagedCluster[]) {
        if (!monitoredClustersList || monitoredClustersList.length == null) {
            this.setState({ isError: true });
        } else {
            const monitoredGridData: IGridLineObject<MonitoredClusterMetaData>[][] =
                MulticlusterGridBase.processClusterList(monitoredClustersList, true);
    
            this.setState({ monitoredGridData });
        }
    }

    private initializeUnmonitoredGrid(unmonitoredClustersList: IManagedCluster[]) {
        if (!unmonitoredClustersList || unmonitoredClustersList.length == null) {
            this.setState({ isError: true });
        } else {
            const unmonitoredGridData: IGridLineObject<UnmonitoredClusterMetaData>[][] =
                MulticlusterGridBase.processClusterList(unmonitoredClustersList, false);

            this.setState({ unmonitoredGridData });
        }
    }

    private initializeSummaryPanel(
        monitoredClustersList: IManagedCluster[],
        unmonitoredClustersList: IManagedCluster[],
    ) {
        let summaryPanelInfo: ISummaryPanelInfo = {
            numTotal: null,
            numCritical: null,
            numWarning: null,
            numHealthy: null,
            numUnknown: null,
            numNonMonitored: null,
        };

        // Error case
        if (!monitoredClustersList || monitoredClustersList.length == null || 
            !unmonitoredClustersList || unmonitoredClustersList.length == null) {
            this.setState({
                isError: true,
                summaryPanelInfo
            });
        } else {
            const monitoredClustersCount = monitoredClustersList.length;
            const unmonitoredClustersCount = unmonitoredClustersList.length;
    
            summaryPanelInfo.numTotal = monitoredClustersCount + unmonitoredClustersCount;
            summaryPanelInfo.numNonMonitored = unmonitoredClustersCount;
    
            this.setState({ summaryPanelInfo });
        }
    }

    /**
     * handles grid tab selection change
     * @param index
     * @param last
     * @param event
     */
    private onTabSelectionChanged(index: number, last?: number, event?: Event, tabInitializationInfo?: string): boolean {
        this.setState({ selectedTab: index });

        this.onTabSelectionChangedTelemetry(index, last, event, tabInitializationInfo);

        // Closes onboarding when switching away from unmonitored tab
        if (last === MultiClusterTab.UnmonitoredClusters) {
            this.messagingProvider.sendCloseSingleAksClusterOnboarding();
        }

        return true;
    }

    /** Generates telemetry around tab switching */
    private onTabSelectionChangedTelemetry(toIndex: number, fromIndex?: number, event?: Event, tabInitializationInfo?: string) {
        const indexMap = {
            [MultiClusterTab.GettingStarted]: TelemetryStrings.MultiClusterGettingStartedTab,
            [MultiClusterTab.MonitoredClusters]: TelemetryStrings.MultiClusterMonitoredTab,
            [MultiClusterTab.UnmonitoredClusters]: TelemetryStrings.MultiClusterUnmonitoredTab,
        }

        const from: string = indexMap[fromIndex];
        const to: string = indexMap[toIndex];

        if (!from || !to) {
            this.telemetry.logException(
                'Unknown index being passed to onTabSelectionChanged',
                TelemetryStrings.MultiClusterMainPage, 
                ErrorSeverity.Warn, 
                { from, to }, 
                null
            );
        } else {
            this.telemetry.logNavigationEvent(from, to);
        }

        // for page views. We only want to log these once per blade open, not multiple times like tab switching
        if (toIndex === MultiClusterTab.MonitoredClusters && !this.hasViewedMonitoredClustersTab) {
            if (this.props.processedMulticlusterInitEvent) {
                this.telemetry.logPageView(TelemetrySubArea.MulticlusterMonitoredList)
            } else {
                let telemetryQueue = update(this.state.telemetryQueue, []);
                telemetryQueue.push(() => this.telemetry.logPageView(TelemetrySubArea.MulticlusterMonitoredList));
                this.setState({ telemetryQueue });
            }
            this.hasViewedMonitoredClustersTab = true;
        }
        if (toIndex === MultiClusterTab.UnmonitoredClusters && !this.hasViewedUnmonitoredClustersTab) {
            if (this.props.processedMulticlusterInitEvent) {
                this.telemetry.logPageView(TelemetrySubArea.MulticlusterUnmonitoredList)
            } else {
                let telemetryQueue = update(this.state.telemetryQueue, []);
                telemetryQueue.push(() => this.telemetry.logPageView(TelemetrySubArea.MulticlusterUnmonitoredList));
                this.setState({ telemetryQueue });
            }
            this.hasViewedUnmonitoredClustersTab = true;
        }
    }

    /**
     * Makes the query to get the health data for all the onboarding clusters
     * @param monitoredClustersList 
     * @param selectedGlobalSubscriptionCount 
     */
    private queryMonitoredClustersHealth(
        monitoredClustersList: IManagedCluster[],
        selectedGlobalSubscriptionCount: number
    ) {
        if (this.props.processedMulticlusterInitEvent) {
            const thisQuerySequenceNumber: number = ++this.pendingQuerySequenceNumber;

            // unique sessionId  for entire query
            const sessionId = GUID().toLowerCase();
            let customProps = MulticlusterGridBase.getTelemetryContext(
                monitoredClustersList,
                selectedGlobalSubscriptionCount, 
                this.props.oneOfSelectedGlobalSubscriptionId
            );
            customProps.sessionId = sessionId;

            const draftQueryTelemetry = this.telemetry.startLogEvent(
                'draftGetMonitoredClusterQuery',
                customProps,
                undefined
            );
            const gridQueryTelemetry = this.telemetry.startLogEvent(
                'MonitoredClustersGridDataLoad',
                customProps,
                undefined
            );

            const endDateTime = moment.utc();
            const startDateTime = moment(endDateTime).add(-30, 'm');
            const timeInterval: ITimeInterval = 
                new TimeInterval(startDateTime.toDate(), endDateTime.toDate(), IdealGridTrendDataPoints);

            const workspaceIdToResIdMap: StringMap<string> = 
                MulticlusterGridBase.getWorkspaceIdToResIdMap(monitoredClustersList);
            const results = MulticlusterGridBase.getWorkspaceToMonitoredClustersMapping(monitoredClustersList);
            const existentWorkspacesMapping = results.existentWorkspacesMapping;
            // workspaces either deleted or user doesn't have access
            let nonExistentWorkspaceToClustersMapping: StringMap<string[]> = undefined;
            let workspaceToClustersMapping: StringMap<string[]> = existentWorkspacesMapping;

            //other than initial load use the draft to determine accurately whether the ws deleted or access denied
            if (!this.isInitialLoad()) {
                let tempNonExistentWorkspacesMapping = results.NonExistentWorkspacesMapping;
                for (const workspaceId in tempNonExistentWorkspacesMapping) {
                    if (workspaceId) {
                        workspaceToClustersMapping[workspaceId] = tempNonExistentWorkspacesMapping[workspaceId];
                    }
                }
            } else {
                nonExistentWorkspaceToClustersMapping = results.NonExistentWorkspacesMapping;
            }

            let requestsInfo: IRequestInfo[] = [];
            let requestIndex: number = 0;

            for (const workspaceId in workspaceToClustersMapping) {
                if (workspaceToClustersMapping.hasOwnProperty(workspaceId)) {
                    let workspaceResourceId: string = workspaceId;
                    if (workspaceIdToResIdMap.hasOwnProperty(workspaceId)) {
                        workspaceResourceId = workspaceIdToResIdMap[workspaceId];
                    }
                    const requestInfo: IRequestInfo = {
                        requestId: requestIndex,
                        workspaceId: workspaceId,
                        workspaceResourceId: workspaceResourceId,
                        clusterResourceIds: workspaceToClustersMapping[workspaceId]
                    };
                    requestsInfo.push(requestInfo);
                    requestIndex = requestIndex + 1;
                }
            }

            (window as any).containerInsightsAtScale.performanceMeasures['frame_mainContentQueryStart'] = Date.now();

            if (requestsInfo && requestsInfo.length > 0) {
                const queries = this.createBatchQueries(
                    requestsInfo,
                    timeInterval,
                    sessionId,
                    this.isInitialLoad()
                );
                
                Promise.all(queries).then((results) => {
                    (window as any).containerInsightsAtScale.performanceMeasures['frame_mainContentQueryEnd'] = Date.now();
                    // check to see if component expects result of this query
                    // and don't do anything in case subsequent query was issued
                    // before receiving this query results
                    if (thisQuerySequenceNumber === this.pendingQuerySequenceNumber) {
                        draftQueryTelemetry.complete();

                        let mergedResults: any = results[0];
                        for (let index = 1; index < results.length; index++) {
                            mergedResults = Object.assign(mergedResults, results[index]);
                        }

                        this.handleQueryMonitoredClustersHealthSuccess(
                            mergedResults,
                            monitoredClustersList,
                            gridQueryTelemetry,
                            requestsInfo,
                            nonExistentWorkspaceToClustersMapping
                        );
                    }
                }).catch((error) => {
                    // and don't do anything in case subsequent query was issued
                    // before receiving this query results
                    if (thisQuerySequenceNumber === this.pendingQuerySequenceNumber) {
                        draftQueryTelemetry.complete({ isError: 'true' });

                        this.handleQueryMonitoredClustersHealthFailure(
                            error,
                            monitoredClustersList,
                            selectedGlobalSubscriptionCount,
                        );
                    }
                });
            } else {
                // special case when there are no valid requests.
                // this could happen if all the clusters have non-existent workspaces
                this.handleQueryMonitoredClustersHealthSuccess(
                    undefined,
                    monitoredClustersList,
                    gridQueryTelemetry,
                    requestsInfo,
                    nonExistentWorkspaceToClustersMapping
                );
            }
        }
    }

    /**
     * handle the query grid data success
     * @param data
     * @param monitoredClustersList
     * @param gridQueryTelemetry
     * @param requestsInfo
     */
    private handleQueryMonitoredClustersHealthSuccess(
        data: any,
        monitoredClustersList: IManagedCluster[],
        gridQueryTelemetry: IFinishableTelemetry,
        requestsInfo: IRequestInfo[],
        nonExistentWorkspaceToClustersMapping?: StringMap<string[]>
    ): void {
        let monitoredGridData: IGridLineObject<MonitoredClusterMetaData>[][] = [];
        if (data) {
            monitoredGridData =
                this.responseInterpreter.processMonitoredClustersGridQueryResult(data,
                    monitoredClustersList,
                    requestsInfo,
                    nonExistentWorkspaceToClustersMapping);
        }

        const summaryPanelInfo = MulticlusterGridBase.tallyClusterStatuses(monitoredGridData, this.state.unmonitoredGridData);

        this.setState({
            monitoredGridData,
            isLoadingMonitoredGrid: false,
            summaryPanelInfo,
        }, () => {
            gridQueryTelemetry.complete();
        });
    }

    /**
     * handle query grid data failure and set the state appropriately
     * @param error  - error from the Draft query
     * @param monitoredClustersList  - list of monitored clusters
     * @param selectedGlobalSubscriptionsCount - count of selected global subscriptions
     * @param oneOfSelectedGlobalSubscriptionId - one of the subscription id from all selected subscription ids
     */
    private handleQueryMonitoredClustersHealthFailure(
        error: any,
        monitoredClustersList: IManagedCluster[],
        selectedGlobalSubscriptionCount: number
    ) {
        this.telemetry.logException(
            error,
            'MultiClusterMonitoredGrid.tsx',
            ErrorSeverity.Error,
            MulticlusterGridBase.getTelemetryContext(
                monitoredClustersList,
                selectedGlobalSubscriptionCount, 
                this.props.oneOfSelectedGlobalSubscriptionId
            ),
            undefined
        );
        this.messagingProvider.sendFinishedLoading(MulticlusterGridQueryName);

        this.setState({
            isLoadingMonitoredGrid: false,
            isError: true
        });

    }

    /** Generates action items for generating the action bar */
    private getActionBarItems(): IActionItem[] {
        let actionItems: IActionItem[] = [];

        // Refresh action button
        const refreshWithTelemetry = () => {
            const telemetryCustomProperties: any = { area: TelemetrySubArea.MulticlusterMainPage }
            this.setState({ isLoadingMonitoredGrid: true, isLoadingUnmonitoredGrid: true });
            this.messagingProvider.sendRefreshRequestForMultiClusterPage('refreshRequest');
            this.telemetry.logEvent('refresh', telemetryCustomProperties, null);
        }

        const isWrongTab = this.state.selectedTab === MultiClusterTab.GettingStarted;
        const refreshActionItem = {
            svg: <RefreshSVG />,
            text: DisplayStrings.Refresh,
            action: refreshWithTelemetry,
            actionType: ActionItemType.Button,
            isDisabled: isWrongTab || this.state.isLoadingMonitoredGrid || this.state.isLoadingUnmonitoredGrid,
            actionGroup: ActionGroup.One
        }
        actionItems.push(refreshActionItem);

        return actionItems;
    }

    /** Sets the list of options available for the pill filter */
    private getDropDownOptions(): DropdownOption[] {
        return [
            {
                label: CloudEnvironmenDisplayNameMap[CloudEnvironment[CloudEnvironment.Azure]],
                value: CloudEnvironment.Azure
            },
            {
                label: CloudEnvironmenDisplayNameMap[CloudEnvironment[CloudEnvironment.AzureStack]],
                value: CloudEnvironment.AzureStack
            },
            {
                label: CloudEnvironmenDisplayNameMap[CloudEnvironment[CloudEnvironment.NonAzure]],
                value: CloudEnvironment.NonAzure
            },
            {
                label: CloudEnvironmenDisplayNameMap[CloudEnvironment[CloudEnvironment.All]],
                value: CloudEnvironment.All
            }
        ];
    }

    /**
    * Execute logic to update the pill filter's selected item
    * @param selectedValue the type of pill option that the end user has clicked
    */
    private onCloudEnvironmentDropDownChanged(selectedValue: CloudEnvironment): void {
        //set the loading state for both monitored and non-monitored grids
        this.setState({ isLoadingMonitoredGrid: true, isLoadingUnmonitoredGrid: true });
        const telemetryCustomProperties: any = { area: TelemetrySubArea.MulticlusterMainPage }
        this.telemetry.logEvent('environmentPillDropDown', telemetryCustomProperties, null);

        this.setState({
            currentSelectedPillItem: {
                label: CloudEnvironmenDisplayNameMap[CloudEnvironment[selectedValue]],
                value: selectedValue
            }
        }, () => {
            this.messagingProvider.sendEnvironmentChangeRequestToMultiAksClusterPage(selectedValue);
        });
    }

    /**
     * create batch queries
     * @param requestsInfo - request info
     * @param timeInterval - time interval for the query
     * @param sessionId - id of session
     * @param isInitialLoad - flag indicates whether its initial load or not
     */
    private createBatchQueries(
        requestsInfo: IRequestInfo[],
        timeInterval: ITimeInterval,
        sessionId: string,
        isInitialLoad: boolean,
    ): Promise<any>[] {

        if (!requestsInfo) { throw new Error('Parameter @requestsInfo may not be null'); }
        if (!timeInterval) { throw new Error('Parameter @timeInterval may not be null'); }
        if (!sessionId) { throw new Error('Parameter @sessionId may not be null'); }

        let batchQueries: Promise<any>[] = [];

        let startIndex: number = 0;
        let endIndex: number = Math.min(GlobalConstants.MaxAllowedRequestsInBatch, requestsInfo.length);
        let remainingLeft: number = 0;

        do {

            batchQueries.push(this.dataProvider.getMonitoredClustersStats(
                requestsInfo.slice(startIndex, endIndex),
                timeInterval,
                sessionId,
                isInitialLoad
            ).then((results) => {
                return results;
            }).catch((error) => {
                throw error;
            })
            );

            remainingLeft = requestsInfo.length - endIndex;
            startIndex = endIndex;
            endIndex = endIndex + GlobalConstants.MaxAllowedRequestsInBatch;
            if (endIndex > requestsInfo.length) {
                endIndex = requestsInfo.length;
            }

        } while (remainingLeft > 0);

        return batchQueries;
    }

    /** 
     * detect whether its initial Blade Load or not based on msg data version 
     * In the MessageHandler, -1 means its initial load
     * Because we wait until we get the first message from Portal before rendering,
     * messageDataRefreshVersion is incremented and 0 means initial load in this component
     */
    private isInitialLoad(): boolean {
        return (this.props.messageDataRefreshVersion === 0);
    }
}
