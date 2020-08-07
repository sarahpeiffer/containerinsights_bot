/** tpl */
import * as React from 'react';
import { DropdownOption } from '@appinsights/pillscontrol-es5';
import { ChartSeriesData } from '@appinsights/aichartcore';
import update = require('immutability-helper');

/** local */
import { ScrollableConsole } from './ScrollableConsole';
import { ConsoleHeaderBar } from './ConsoleHeaderBar';
import { FetchStatus, ConsoleHeaderStatus } from './ConsoleHeaderStatus';
import { ConsoleUpdateStatus } from './ConsoleUpdateStatus';
import { ConsoleErrorsLink } from './ConsoleErrorsLink';
import { ConsoleSearchBar } from './ConsoleSearchBar';

/** containers */
import * as Constants from '../../container/shared/Constants';
import { ContainerLiveTabMetricChartPane } from '../../container/ContainerLiveTabMetricChartPane';
import { BladeContext } from '../../container/BladeContext';

/** SVGs */
import { PlaySVG } from '../svg/play';
import { PauseSVG } from '../svg/pause';
import { ClearConsoleSVG } from '../svg/clear-console';
import { GreenSvg } from '../svg/green';
import { UnknownSvg } from '../svg/unknown';
import { ChevronDownSvg } from '../svg/chevron-down';
import { ChevronUpSvg } from '../svg/chevron-up';
import { FailedSvg } from '../svg/failed';

/** styles */
import '../../../styles/container/LiveConsole.less'

/** shared */
import { LogBufferManager, ILogItem, BufferType } from '../Utilities/LogBufferManager';
import { LiveDataProvider } from '../data-provider/LiveDataProvider';
import { ErrorSeverity } from '../data-provider/TelemetryErrorSeverity';
import { TelemetryMainArea, ITelemetry } from '../Telemetry';
import { TelemetryFactory } from '../TelemetryFactory';
import { RequiredLoggingInfo } from '../RequiredLoggingInfo';
import { StringHelpers } from '../Utilities/StringHelpers';
import { ADProvider } from '../data-provider/AzureADProvider';
import { DisplayStrings } from '../DisplayStrings';
import { EnvironmentConfig } from '../EnvironmentConfig';
import { LockedConsoleSVG } from '../svg/locked-console';
import { UnlockedConsoleSVG } from '../svg/unlocked-console';
import { EventsDataProvider } from '../data-provider/EventsDataProvider';
import { CellMeasurerCache } from 'react-virtualized';
import { TextDropDownPill } from '../pill-component/TextDropDownPill';
import { RowType } from '../../container/shared/metadata/Shared';
import { LiveMetricsGranularityStrings, LiveMetricsGranularity } from '../../container/LiveMetricsPoller';
import { ContainerMetricChart } from '../../container/ContainerMetricChart';
import { polyfillArrayFrom } from '../ArrayFromShim';
import { TimeFrameSelector } from '../data-provider/IKubernetesDataProvider';

//how often should we fetch new logs
const queryIntervalTimeMS: number = 500;
//number of bytes we are agreeing to store (200MB)
const maxBufferSizeBytes: number = 200000000;
//number of logs to have in a chunk
const chunkSize: number = 10000;
// live log troubleshoot documentation for RBAC
const liveLogsTroubleshootRBAC: string = 'http://aka.ms/livelogRBAC';

/**
 * List of possible tabs on the live console
 */
export enum LiveConsoleTab {
    Logs,
    Events,
    LiveTabMetrics
}

/**
 * List of possible types for the options in the pill selector on the live console
 */
enum LiveConsolePillOptionTypes {
    Cluster = 'Cluster',
    Node = 'Node',
    Namespace = 'Namespace',
    Pod = 'Pod'
}

export interface IErrorMessageFromProxy {
    KubeApiResponse: string;
    KubeApiStatus: Number;
    ProxyResponse: string;
    ProxyStatus: Number;
    Troubleshoot: string;
    PopupStatus: string;
}

/**
 * Props for the Console View Panel
 */
export interface IConsoleViewPanelProps {
    loggingInfo: RequiredLoggingInfo;
    onClose: () => void;
    /** region override for Kube API proxy */
    liveDataProvider: LiveDataProvider;
}

/**
 * The state of the console view panel
 */
interface IConsoleViewPanelState {
    isPaused: boolean;
    isErrorPanelVisible: boolean;
    logVersonNum: number;
    eventVersonNum: number;
    shouldScroll: boolean;
    lastFetchStatus: FetchStatus;
    errorLinkMessage: string;
    lastErrorMessage: IErrorMessageFromProxy;
    logSearchTerm: string;
    eventSearchTerm: string;
    numLogMatches: number;
    numEventMatches: number;
    matchingIndexes: number[];
    currentSelectedLogIndex: number;
    currentSelectedEventIndex: number;
    selectedTab: LiveConsoleTab;
    chartData: StringMap<StringMap<ChartSeriesData>>;
    currentSelectedPillItem: DropdownOption;
    currentSelectedLiveTabPillItem: DropdownOption;
    liveErrorMessage: string;
    liveMetricsGranularity: LiveMetricsGranularity;
    chartSeriesSelections: StringMap<any>;
}

/**
 * The container class for the live console
 */
export class ConsoleViewPanel extends React.PureComponent<IConsoleViewPanelProps, IConsoleViewPanelState> {
    private lastPollTime: Date;
    private eventsDataProvider: EventsDataProvider;
    //TODO: (Task 2628989): Change the mutability of the logBuffer such that it abides by the immutability chain

    private liveLogBuffer: LogBufferManager;
    private eventLogBuffer: LogBufferManager;

    private telemetry: ITelemetry;

    /** The id of the interval used to re-poll */
    private currentInterval: any;
    private disposedComponent: boolean;
    private logFailureCount: number;
    private eventFailureCount: number;

    private fieldSelectorsMap: StringMap<string>;
    private namespaceForEventPollMap: StringMap<string>;
    private pillLabelMap: StringMap<string>;

    /**
     * Log Cache for row measurements used in scrollable console
     */
    private logCache = new CellMeasurerCache({
        defaultHeight: 18,
        fixedWidth: true,
    });

    /**
     * Event Cache for row measurements used in scrollable console
     */
    private eventCache = new CellMeasurerCache({
        defaultHeight: 18,
        fixedWidth: true,
    });

    private currentFieldselectorValue: string;
    private currentNameSpaceForEventPollValue: string;
    private pillSelectionItemList: DropdownOption[];
    private pillSelectedLiveTabTimeInterval: DropdownOption[];

    /**
     * Creates a new LogBufferManager, and a new liveDataProvider
     * @param props The props for the constructor
     */
    constructor(props) {
        super(props);

        let defaultTab = LiveConsoleTab.Logs;
        if (!this.props.loggingInfo.isValidLiveLog()) {
            defaultTab = LiveConsoleTab.Events;
        }
        this.pillSelectedLiveTabTimeInterval = [
            {
                label: LiveMetricsGranularityStrings[LiveMetricsGranularity.OneSecond],
                value: LiveMetricsGranularity.OneSecond
            },
            {
                label: LiveMetricsGranularityStrings[LiveMetricsGranularity.FiveSeconds],
                value: LiveMetricsGranularity.FiveSeconds
            },
            {
                label: LiveMetricsGranularityStrings[LiveMetricsGranularity.FifteenSeconds],
                value: LiveMetricsGranularity.FifteenSeconds
            },
            {
                label: LiveMetricsGranularityStrings[LiveMetricsGranularity.ThirtySeconds],
                value: LiveMetricsGranularity.ThirtySeconds
            },
        ];

        this.setMapsForDropdownSelection();

        this.currentInterval = -1;

        let currentSelectedPillItem;
        switch (this.props.loggingInfo.consoleType) {
            case RowType.Controller:
                currentSelectedPillItem = {
                    label: this.pillLabelMap[LiveConsolePillOptionTypes.Namespace],
                    value: LiveConsolePillOptionTypes.Namespace
                }
                break;
            case RowType.Pod:
            case RowType.Container:
                currentSelectedPillItem = {
                    label: this.pillLabelMap[LiveConsolePillOptionTypes.Pod],
                    value: LiveConsolePillOptionTypes.Pod
                }
                break;
            default:
                currentSelectedPillItem = {
                    label: this.props.loggingInfo.clusterName + ' ( ' + DisplayStrings.ClusterSelectorTitle + ' )',
                    value: LiveConsolePillOptionTypes.Cluster
                };
        }

        const initialChartSeriesSelections: StringMap<any> = {};

        for (const chartDescriptor of ContainerMetricChart.listLive()) {
            initialChartSeriesSelections[chartDescriptor.chartId] =
                chartDescriptor.defaultSeriesSelections;
        }

        this.state = {
            logVersonNum: 0,
            eventVersonNum: 0,
            isPaused: false,
            isErrorPanelVisible: true,
            shouldScroll: true,
            lastFetchStatus: FetchStatus.New,
            errorLinkMessage: DisplayStrings.LiveLogsShowErrors,
            lastErrorMessage: null,
            logSearchTerm: '',
            eventSearchTerm: '',
            numLogMatches: 0,
            numEventMatches: 0,
            matchingIndexes: [],
            currentSelectedLogIndex: 0,
            currentSelectedEventIndex: 0,
            selectedTab: defaultTab,
            currentSelectedPillItem,
            chartData: {},
            liveErrorMessage: '',
            liveMetricsGranularity: LiveMetricsGranularity.FiveSeconds,
            currentSelectedLiveTabPillItem: {
                label: LiveMetricsGranularityStrings[LiveMetricsGranularity.FiveSeconds],
                value: LiveMetricsGranularity.FiveSeconds
            },
            chartSeriesSelections: initialChartSeriesSelections
        };

        this.logFailureCount = 0;
        this.eventFailureCount = 0;
        this.eventsDataProvider = new EventsDataProvider(this.props.liveDataProvider);
        this.onNumMatchesChanged = this.onNumMatchesChanged.bind(this);
        this.liveLogBuffer = new LogBufferManager(
            maxBufferSizeBytes,
            chunkSize,
            TelemetryFactory.get(TelemetryMainArea.Containers),
            BufferType.LogBuffer,
            this.onNumMatchesChanged,
            250
        );

        this.eventLogBuffer = new LogBufferManager(
            maxBufferSizeBytes,
            chunkSize,
            TelemetryFactory.get(TelemetryMainArea.Containers),
            BufferType.EventBuffer,
            this.onNumMatchesChanged,
            250
        );

        this.setConsoleDropDownOptions();

        this.onChartDataLoaded = this.onChartDataLoaded.bind(this);
        this.onConsoleClose = this.onConsoleClose.bind(this);
        this.clearConsole = this.clearConsole.bind(this);
        this.toggleErrorsDiv = this.toggleErrorsDiv.bind(this);
        this.togglePauseConsole = this.togglePauseConsole.bind(this);
        this.toggleStickyScroll = this.toggleStickyScroll.bind(this);
        this.pollServer = this.pollServer.bind(this);
        this.onSearchTermChanged = this.onSearchTermChanged.bind(this);
        if (this.arePropsValid(props)) {
            if (this.props.loggingInfo.isValidLiveLog()) {
                ConsoleHeaderStatus.SetLogTabPresent(true);
            }
            this.pollServer(props);
        }
    }

    /**
     * Clears the search term and sets it to blank
     */
    public onSearchTermCleared(): void {
        this.telemetry.logEvent(
            'ConsoleViewPanel.onSearchTermCleared',
            undefined,
            { selectedTab: this.state.selectedTab }
        )
        this.onSearchTermChanged('');
    }

    /**
     * Renders the ConsoleViewPanel with a ConsoleHeaderBar and ScrollableConsole only when the props are valid. Else, returns null.
     */
    public render(): JSX.Element {
        if (EnvironmentConfig.Instance().isConfigured()) {
            if (!this.telemetry) {
                this.telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
            }
        }
        //check if props have correct value. If not, return null.
        if (this.areThisPropsValid()) {
            const logBuffer = this.state.selectedTab === LiveConsoleTab.Logs ? this.liveLogBuffer : this.eventLogBuffer;
            const versionNum = this.state.selectedTab === LiveConsoleTab.Logs ? this.state.logVersonNum : this.state.eventVersonNum;

            let consoleHeaderTitle: string = DisplayStrings.podName + this.props.loggingInfo.podName;
            let hideSubtitle: boolean = false;

            if (this.state.selectedTab === LiveConsoleTab.Events) {
                if (this.state.currentSelectedPillItem.value === LiveConsolePillOptionTypes.Namespace) {
                    consoleHeaderTitle = DisplayStrings.NameSpaceSelectorTitle + ': ' + this.props.loggingInfo.nameSpace;
                } else if (this.state.currentSelectedPillItem.value === LiveConsolePillOptionTypes.Node) {
                    consoleHeaderTitle = DisplayStrings.HostNameSelectorTitle + ': ' + this.props.loggingInfo.nodeName;
                } else if (this.state.currentSelectedPillItem.value === LiveConsolePillOptionTypes.Cluster) {
                    consoleHeaderTitle = DisplayStrings.ClusterSelectorTitle + ': ' + this.props.loggingInfo.clusterName;
                }
                hideSubtitle = true;
            }
            let consoleView: string = 'consoleViewPanel';
            if (this.state.selectedTab === LiveConsoleTab.LiveTabMetrics) {
                hideSubtitle = true;
                consoleView = 'liveMetricsViewPanel';
            }

            return (
                <div className={consoleView}>
                    <div className='livelog-header-root'>
                        <ConsoleHeaderBar
                            onConsoleClose={this.onConsoleClose}
                            containerName={this.props.loggingInfo.containerInstanceName}
                            podName={this.props.loggingInfo.podName}
                            consoleHeaderTitle={consoleHeaderTitle}
                            hideSubtitle={hideSubtitle}
                            clusterName={this.props.loggingInfo.clusterName}
                            lastErrorMessage={this.state.lastErrorMessage}
                        />

                        <div className='livelog-subheader-root'>
                            {this.renderAvailableTabs(this.telemetry)}
                            {this.state.selectedTab !== LiveConsoleTab.LiveTabMetrics ? this.renderStatus() : ''}
                        </div>

                        <div className='console-header-seperator-line'>&nbsp;</div>

                        {this.renderConsoleControls()}
                    </div>
                    {this.state.selectedTab === LiveConsoleTab.LiveTabMetrics ?
                        <ContainerLiveTabMetricChartPane
                            seriesSelections={this.state.chartSeriesSelections}
                            onSeriesSelectionsChanged={this.onChartSeriesSelectionsChanged}
                            chartData={this.state.chartData}
                            onChartDataLoaded={this.onChartDataLoaded}
                            // kubernetesProxyRegionCode={this.props.kubernetesProxyRegionCode} 
                            liveDataProvider={this.props.liveDataProvider}
                            nameSpace={this.props.loggingInfo.nameSpace}
                            podName={this.props.loggingInfo.podName}
                            granularity={this.state.liveMetricsGranularity}
                        />
                        : <ScrollableConsole
                            versionNum={versionNum}
                            logBuffer={logBuffer}
                            shouldScroll={this.state.shouldScroll}
                            searchTerm={
                                this.state.selectedTab === LiveConsoleTab.Logs
                                    ? this.state.logSearchTerm
                                    : this.state.eventSearchTerm
                            }
                            selectedIndex={this.state.selectedTab === LiveConsoleTab.Events
                                ? this.state.matchingIndexes[this.state.currentSelectedEventIndex]
                                : this.state.matchingIndexes[this.state.currentSelectedLogIndex]
                            }
                            cache={this.state.selectedTab === LiveConsoleTab.Logs
                                ? this.logCache
                                : this.eventCache
                            }
                        />
                    }
                </div>
            )
        } else {
            return <div />;
        }
    }

    /**
     * Updates the searchTerm inside of the state to be the term provided as argument to the function
     * @param term The term that was most recently inputted into the search bar
     */
    public onSearchTermChanged(term: string): void {
        let currSelInd: number = undefined;
        let shouldScroll: boolean = this.state.shouldScroll;

        if (StringHelpers.isNullOrEmpty(term)) {
            shouldScroll = true;
        } else {
            currSelInd = 0;
            shouldScroll = false;
        }

        if (this.state.selectedTab === LiveConsoleTab.Logs) {
            this.setState({
                logSearchTerm: term,
                currentSelectedLogIndex: currSelInd,
                shouldScroll: shouldScroll
            });
            this.liveLogBuffer.changeSearchTerm(term);
        } else {
            this.setState({
                eventSearchTerm: term,
                currentSelectedEventIndex: currSelInd,
                shouldScroll: shouldScroll
            });
            this.eventLogBuffer.changeSearchTerm(term);
        }
    }

    /**
     * Removes all logs from the buffer, updates the version number of the log items, and updates the fetch status.
     */
    public clearConsole() {
        this.telemetry.logEvent(
            'LiveConsoleCleared',
            undefined,
            undefined
        );
        this.logCache.clearAll();
        this.liveLogBuffer.clearLogs();
        this.setState({
            logVersonNum: this.state.logVersonNum + 1,
            lastFetchStatus: FetchStatus.New
        });
    }

    /**
     * Sets shouldScroll to the opposite boolean value
     */
    public toggleStickyScroll() {
        this.setState((prevState: IConsoleViewPanelState) => {
            this.telemetry.logEvent(
                'LiveConsoleScrollToggled',
                {
                    newState: String(!prevState.shouldScroll)
                },
                undefined
            );
            return {
                shouldScroll: !prevState.shouldScroll
            };
        });
    }

    /**
     * Reset the value of disposedComponent to be false
     */
    public componentWillMount(): void {
        this.disposedComponent = false;
    }

    /**
     * Stop polling
     */
    public componentWillUnmount(): void {
        if (this.currentInterval !== -1) {
            clearTimeout(this.currentInterval);
        }
        this.disposedComponent = true;
    }

    /**
     * Toggle state such that the error div is visible or hidden
     */
    public toggleErrorsDiv() {
        this.setState((prevState: IConsoleViewPanelState) => {
            return {
                errorLinkMessage: StringHelpers.equal(prevState.errorLinkMessage, DisplayStrings.LiveLogsShowErrors)
                    ? DisplayStrings.LiveLogsHideErrors
                    : DisplayStrings.LiveLogsShowErrors,
                isErrorPanelVisible: !prevState.isErrorPanelVisible
            };
        });
    }

    /**
     * Sets state such that if logging is paused, we reinitiate fetching of logs, and change isPaused boolean value.
     */
    public togglePauseConsole() {
        this.setState((prevState: IConsoleViewPanelState) => {
            this.telemetry.logEvent(
                'LiveConsolePauseToggled',
                {
                    newState: String(!prevState.isPaused)
                },
                undefined
            );

            if (!prevState.isPaused && this.currentInterval !== -1) {
                clearTimeout(this.currentInterval);
            }

            ConsoleHeaderStatus.TogglePaused();
            return {
                isPaused: !prevState.isPaused,
                lastFetchStatus: (prevState.isPaused) ? FetchStatus.New : FetchStatus.Paused
            };
        }, () => {
            if (!this.state.isPaused) {
                //start polling again
                this.pollServer(this.props);
            }
        });
    }

    private onChartSeriesSelectionsChanged = (chartId: string, newSelections: any): void => {
        this.setState((prevState: IConsoleViewPanelState) => {
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

    /**
     * Function to render the available tabs based on the loggingInfo passed down into the component
     * Currently shows events + logs when live console is opened from Containers
     * otherwise we just render the events tab
     * @param telemetry Telemetry provider so that we can log the clicks on the tabs
     */
    private renderAvailableTabs(telemetry: ITelemetry): JSX.Element {
        let liveLogTab = null;
        if (this.props.loggingInfo.isValidLiveLog()) {
            liveLogTab = <div className={this.getTabClass(LiveConsoleTab.Logs)} onClick={() => {
                telemetry.logEvent('LogTabClicked', undefined, undefined);
                this.setState({ selectedTab: LiveConsoleTab.Logs })
            }}>{DisplayStrings.LiveConsoleHeaderLogsText}</div>;
        }

        let eventsTab = null;
        if (this.props.loggingInfo.isvalidEventLog()) {
            eventsTab = <div className={this.getTabClass(LiveConsoleTab.Events)} onClick={() => {
                telemetry.logEvent('EventTabClicked', undefined, undefined);
                this.setState({ selectedTab: LiveConsoleTab.Events })
            }}>{DisplayStrings.LiveConsoleHeaderEventsText}</div>;
        }

        /* BladeContext featureFlags control the tab Live Metrics visualization
           the isTabLiveMetricsFeatureFlag will be removed after the feature development int product
        */
        const isTabLiveMetricsFeatureFlag: boolean =
            BladeContext.instance().featureFlags &&
            BladeContext.instance().featureFlags.tabLiveMetricsModel &&
            EnvironmentConfig.Instance().isLiveDataEnabledEnvironment();
        let liveTabMetrics = null;
        if (isTabLiveMetricsFeatureFlag && this.props.loggingInfo.isvalidLiveTabMetric()) {
            liveTabMetrics = <div className={this.getTabClass(LiveConsoleTab.LiveTabMetrics)} onClick={() => {
                telemetry.logEvent('liveMetricsTabClicked', undefined, undefined);

                if (this.props && this.props.liveDataProvider) {
                    this.props.liveDataProvider.hackClearCacheLimitsAndReqeuestInPod();
                }

                this.setState({ selectedTab: LiveConsoleTab.LiveTabMetrics })
            }}>{DisplayStrings.LiveConsoleHeaderLiveMetricText}</div>;
        }

        return <div className='livelog-tab-root'>
            {liveLogTab}
            {eventsTab}
            {liveTabMetrics}
        </div>
    }

    /**
     * Returns the css class for styling the selected tab
     * @param tab the current selected tab 
     */
    private getTabClass(tab: LiveConsoleTab): string {
        return this.state.selectedTab === tab ? 'livelog-tab livelog-selected-tab' : 'livelog-tab';
    }

    /**
     * Sets the list of options available for the pill filter in the live console
     */
    private setConsoleDropDownOptions(): void {
        switch (this.props.loggingInfo.consoleType) {
            case RowType.Node:
                this.pillSelectionItemList = [
                    {
                        label: this.props.loggingInfo.clusterName + ' ( ' + DisplayStrings.ClusterSelectorTitle + ' )',
                        value: LiveConsolePillOptionTypes.Cluster
                    },
                    {
                        label: this.props.loggingInfo.nodeName + ' ( ' + DisplayStrings.HostNameSelectorTitle + ' )',
                        value: LiveConsolePillOptionTypes.Node
                    }
                ];
                return;
            case RowType.Controller:
                this.pillSelectionItemList = [
                    {
                        label: this.props.loggingInfo.clusterName + '( ' + DisplayStrings.ClusterSelectorTitle + ' )',
                        value: LiveConsolePillOptionTypes.Cluster
                    },
                    {
                        label: this.props.loggingInfo.nameSpace + ' ( ' + DisplayStrings.NameSpaceSelectorTitle + ' )',
                        value: LiveConsolePillOptionTypes.Namespace
                    }
                ];
                return;
            case RowType.Pod:
            case RowType.Container:
                this.pillSelectionItemList = [
                    {
                        label: this.props.loggingInfo.clusterName + ' ( ' + DisplayStrings.ClusterSelectorTitle + ' )',
                        value: LiveConsolePillOptionTypes.Cluster
                    },
                    {
                        label: this.props.loggingInfo.nameSpace + ' ( ' + DisplayStrings.NameSpaceSelectorTitle + ' )',
                        value: LiveConsolePillOptionTypes.Namespace
                    },
                    {
                        label: this.props.loggingInfo.podName + ' ( ' + DisplayStrings.ComparisonGridColumnTitlePods + ' )',
                        value: LiveConsolePillOptionTypes.Pod
                    }
                ];
                return;
            default:
                throw 'unexpected row type';
        }
    }

    /**
     * Function that does the initial setup for the pill filter on the live console so that the correct item is selected
     * and 
     */
    private setMapsForDropdownSelection(): void {
        this.fieldSelectorsMap = {};
        this.namespaceForEventPollMap = {};
        this.pillLabelMap = {};
        this.currentFieldselectorValue = '';
        this.currentNameSpaceForEventPollValue = '';
        switch (this.props.loggingInfo.consoleType) {
            case RowType.Node:
                this.pillLabelMap[LiveConsolePillOptionTypes.Cluster] = this.props.loggingInfo.clusterName
                    + ' ( ' + DisplayStrings.ClusterSelectorTitle + ' )';
                this.pillLabelMap[LiveConsolePillOptionTypes.Node] = this.props.loggingInfo.nodeName
                    + ' ( ' + DisplayStrings.HostNameSelectorTitle + ' )';

                this.namespaceForEventPollMap[LiveConsolePillOptionTypes.Cluster] = '';
                this.namespaceForEventPollMap[LiveConsolePillOptionTypes.Node] = '';

                this.fieldSelectorsMap[LiveConsolePillOptionTypes.Cluster] = '';
                this.fieldSelectorsMap[LiveConsolePillOptionTypes.Node] = 'involvedObject.name=' + this.props.loggingInfo.nodeName;
                break;
            case RowType.Controller:
                this.pillLabelMap[LiveConsolePillOptionTypes.Cluster] = this.props.loggingInfo.clusterName
                    + ' ( ' + DisplayStrings.ClusterSelectorTitle + ' )';
                this.pillLabelMap[LiveConsolePillOptionTypes.Namespace] = this.props.loggingInfo.nameSpace
                    + ' ( ' + DisplayStrings.NameSpaceSelectorTitle + ' )';

                this.namespaceForEventPollMap[LiveConsolePillOptionTypes.Cluster] = '';
                this.namespaceForEventPollMap[LiveConsolePillOptionTypes.Namespace] = this.props.loggingInfo.nameSpace;

                this.fieldSelectorsMap[LiveConsolePillOptionTypes.Cluster] = '';
                this.fieldSelectorsMap[LiveConsolePillOptionTypes.Namespace] = '';

                this.currentNameSpaceForEventPollValue = this.namespaceForEventPollMap[LiveConsolePillOptionTypes.Namespace];
                break;
            case RowType.Pod:
            case RowType.Container:
                this.pillLabelMap[LiveConsolePillOptionTypes.Cluster] = this.props.loggingInfo.clusterName
                    + ' ( ' + DisplayStrings.ClusterSelectorTitle + ' )';
                this.pillLabelMap[LiveConsolePillOptionTypes.Namespace] = this.props.loggingInfo.nameSpace
                    + ' ( ' + DisplayStrings.NameSpaceSelectorTitle + ' )';
                this.pillLabelMap[LiveConsolePillOptionTypes.Pod] = this.props.loggingInfo.podName
                    + ' ( ' + DisplayStrings.ComparisonGridColumnTitlePods + ' )';

                this.namespaceForEventPollMap[LiveConsolePillOptionTypes.Cluster] = '';
                this.namespaceForEventPollMap[LiveConsolePillOptionTypes.Namespace] = this.props.loggingInfo.nameSpace;
                this.namespaceForEventPollMap[LiveConsolePillOptionTypes.Pod] = this.props.loggingInfo.nameSpace;

                this.fieldSelectorsMap[LiveConsolePillOptionTypes.Cluster] = '';
                this.fieldSelectorsMap[LiveConsolePillOptionTypes.Namespace] = '';
                this.fieldSelectorsMap[LiveConsolePillOptionTypes.Pod] = 'involvedObject.name=' + this.props.loggingInfo.podName;

                this.currentFieldselectorValue = this.fieldSelectorsMap[LiveConsolePillOptionTypes.Pod];
                break;
            default:
                throw 'unexpected row type';
        }
    }

    /**
     * Exectues logic to update the pill filter's selected item and info required for querying the live backend
     * @param selectedValue the type of pill option that the end user has clicked
     */
    private onConsoleDropDownChanged(selectedValue: LiveConsolePillOptionTypes): void {
        this.setState({
            currentSelectedPillItem: { label: this.pillLabelMap[selectedValue], value: selectedValue },
        }, () => {
            this.currentFieldselectorValue = this.fieldSelectorsMap[selectedValue];
            this.currentNameSpaceForEventPollValue = this.namespaceForEventPollMap[selectedValue];
            this.telemetry.logEvent('LiveConsolePillSelectionChanged', { label: selectedValue }, undefined);
        });
    }

    /**
     * Exectues logic to update the pill filter's selected item and info required for querying the live backend
     * @param selectedValue the type of pill option that the end user has clicked
     */
    private onLiveMetricTabConsoleDropDownChanged(selectedValue: number): void {
        if (selectedValue === 1) {
            this.setState({
                currentSelectedLiveTabPillItem: this.pillSelectedLiveTabTimeInterval[0],
                liveMetricsGranularity: LiveMetricsGranularity.OneSecond
            })
        }
        if (selectedValue === 5) {
            this.setState({
                currentSelectedLiveTabPillItem: this.pillSelectedLiveTabTimeInterval[1],
                liveMetricsGranularity: LiveMetricsGranularity.FiveSeconds
            })
        }
        if (selectedValue === 15) {
            this.setState({
                currentSelectedLiveTabPillItem: this.pillSelectedLiveTabTimeInterval[2],
                liveMetricsGranularity: LiveMetricsGranularity.FifteenSeconds
            })
        }
        if (selectedValue === 30) {
            this.setState({
                currentSelectedLiveTabPillItem: this.pillSelectedLiveTabTimeInterval[3],
                liveMetricsGranularity: LiveMetricsGranularity.ThirtySeconds
            })
        }

    }

    /**
     * Render the Control panel component of the console containing the search bar and the control buttons
     */
    private renderConsoleControls() {
        const currentSelectedIndexForDisplay: number = this.state.selectedTab === LiveConsoleTab.Logs
            ? this.state.numLogMatches > 0 ? this.state.currentSelectedLogIndex + 1 : 0
            : this.state.numEventMatches > 0 ? this.state.currentSelectedEventIndex + 1 : 0;
        return <div className='console-header-control-line'>
            {this.state.selectedTab !== LiveConsoleTab.LiveTabMetrics ?
                <div className='console-header-search'>
                    <ConsoleSearchBar
                        searchPlaceholder={DisplayStrings.containerLiveSearch}
                        onSearchTermChange={this.onSearchTermChanged}
                        term={
                            this.state.selectedTab === LiveConsoleTab.Logs
                                ? this.state.logSearchTerm
                                : this.state.eventSearchTerm
                        }
                        numMatches={currentSelectedIndexForDisplay}
                        totalItems={this.state.matchingIndexes.length}
                        onSearchTermCleared={this.onSearchTermCleared.bind(this)}
                        prevButton={this.generatePreviousBtn()}
                        nextButton={this.generateNextBtn()}
                    />
                </div> : ''
            }
            {(this.state.selectedTab === LiveConsoleTab.Events) ?
                <div className='console-header-pill'>
                    <TextDropDownPill
                        containerId={'console-controls-drop-down'}
                        selectedItem={this.state.currentSelectedPillItem}
                        dropDownOptions={this.pillSelectionItemList}
                        onSelectionChanged={this.onConsoleDropDownChanged.bind(this)}
                        areValuesLoading={false}
                        pillLabel={'Filter' + DisplayStrings.LabelSeperator} />
                </div> : (this.state.selectedTab === LiveConsoleTab.LiveTabMetrics) ?
                    <div className='console-header-pill'>
                        <TextDropDownPill
                            containerId={'console-controls-drop-down'}
                            selectedItem={this.state.currentSelectedLiveTabPillItem}
                            dropDownOptions={this.pillSelectedLiveTabTimeInterval}
                            onSelectionChanged={this.onLiveMetricTabConsoleDropDownChanged.bind(this)}
                            areValuesLoading={false}
                            pillLabel={DisplayStrings.FrequencySelectorTitle + DisplayStrings.EqualsLabelSeperator} />
                    </div> : ''
            }
            {(this.state.selectedTab !== LiveConsoleTab.LiveTabMetrics) ?
                <div className='console-header-main-controls'>
                    {this.generateStickyOrScrollBtn()}
                    {this.generatePausePlayBtn()}
                    {this.generateClearBtn(this.state.selectedTab)}
                </div> : ''
            }
        </div>
    }

    /**
     * Event listener that changes state to be the new number of matches 
     * @param newNumMatches the new number of matches
     * @param matchingIndexes the indexes the matching values
     */
    private onNumMatchesChanged(newNumMatches: number, matchingIndexes: Set<number>, bufferType: BufferType): void {
        polyfillArrayFrom();
        if (this.state.selectedTab === LiveConsoleTab.Logs && bufferType === BufferType.LogBuffer) {
            this.setState({
                numLogMatches: newNumMatches,
                matchingIndexes: Array.from(matchingIndexes).sort((n1: number, n2: number) => n1 - n2)
            })
        } else if (this.state.selectedTab === LiveConsoleTab.Events && bufferType === BufferType.EventBuffer) {
            this.setState({
                numEventMatches: newNumMatches,
                matchingIndexes: Array.from(matchingIndexes).sort((n1: number, n2: number) => n1 - n2)
            });
        }
    }

    /**
     * Based on the current selected tab it tells on if the prev/next controls should be disabled or active
     */
    private isSearchActionAvailable(): boolean {
        return (
            (
                this.state.selectedTab === LiveConsoleTab.Events
                && !StringHelpers.isNullOrEmpty(this.state.eventSearchTerm)
                && this.state.numEventMatches > 0
            )
            ||
            (
                this.state.selectedTab === LiveConsoleTab.Logs
                && !StringHelpers.isNullOrEmpty(this.state.logSearchTerm)
                && this.state.numLogMatches > 0
            ));
    }

    /**
     * Perform action to move the current selected index backwards.
     * Loops around to the last index if the current selected index is 0.
     */
    private onPrevClick() {
        const selectedIndex: number = this.state.selectedTab === LiveConsoleTab.Events
            ? this.state.currentSelectedEventIndex
            : this.state.currentSelectedLogIndex;

        if (this.isSearchActionAvailable()) {
            const value = selectedIndex > 0
                ? selectedIndex - 1
                : this.state.matchingIndexes.length - 1;
            if (this.state.selectedTab === LiveConsoleTab.Events) {
                this.setState({
                    currentSelectedEventIndex: value
                });
            } else {
                this.setState({
                    currentSelectedLogIndex: value
                });
            }
        }
        this.telemetry.logEvent(
            'ConsoleViewPanel.onPrevClick',
            undefined,
            { selectedIndex: selectedIndex }
        );
    }

    /**
     * Perform action to move the current selected index forwards. 
     * Loops around to the first index if the current selected index is (length-1).
     */
    private onNextClick() {
        const selectedIndex: number = this.state.selectedTab === LiveConsoleTab.Events
            ? this.state.currentSelectedEventIndex
            : this.state.currentSelectedLogIndex;
        if (this.isSearchActionAvailable()) {
            const value = this.state.matchingIndexes.length - 1 > selectedIndex
                ? selectedIndex + 1 : 0;
            if (this.state.selectedTab === LiveConsoleTab.Events) {
                this.setState({
                    currentSelectedEventIndex: value
                });
            } else {
                this.setState({
                    currentSelectedLogIndex: value
                });
            }
        }
        this.telemetry.logEvent(
            'ConsoleViewPanel.onNextClick',
            undefined,
            { selectedIndex: selectedIndex },
        );
    }

    /**
     * Generates the next button for the search bar
     */
    private generateNextBtn() {
        let disabledCss = '';
        if (!this.isSearchActionAvailable()) {
            disabledCss = 'disabledIcon';
        }
        return (
            <button
                className={'consoleSearchBarActionBtn ' + disabledCss}
                onClick={this.onNextClick.bind(this)}
                aria-label={DisplayStrings.NextSearchMatch}
            >
                <ChevronDownSvg />
            </button>
        );
    }

    /**
     * Generates the previous button for the search bar
     */
    private generatePreviousBtn() {
        let disabledCss = '';
        if (!this.isSearchActionAvailable()) {
            disabledCss = 'disabledIcon';
        }
        return (
            <button
                className={'consoleSearchBarActionBtn ' + disabledCss}
                onClick={this.onPrevClick.bind(this)}
                aria-label={DisplayStrings.PreviousSearchMatch}
            >
                <ChevronUpSvg />
            </button>
        );
    }

    /**
     * Generates the sticky or the scroll button based on the state the user has selected the for the scrolling functionality
     */
    private generateStickyOrScrollBtn() {
        const icon = (this.state.shouldScroll) ? <UnlockedConsoleSVG /> : <LockedConsoleSVG />;
        return this.generateBtn(icon, DisplayStrings.Scroll, this.toggleStickyScroll.bind(this));
    }

    /**
     * Generates the toggle to pause fetches of live logs
     * @param isPaused 
     * @param onTogglePausePlay 
     */
    private generatePausePlayBtn() {
        const innerStr = (this.state.isPaused) ? DisplayStrings.Play : DisplayStrings.Pause;
        const icon = (this.state.isPaused) ? <PlaySVG /> : <PauseSVG />;
        return this.generateBtn(icon, innerStr, this.togglePauseConsole);
    }

    /**
 * Generates the clear live console action
 * @param onConsoleClear 
 */
    private generateClearBtn(selectedTab: LiveConsoleTab): JSX.Element {
        if (this.state.selectedTab === LiveConsoleTab.Logs) {
            return this.generateBtn(<ClearConsoleSVG />, DisplayStrings.Clear, this.clearConsole);
        }
        return null;
    }

    /**
     * Generates button with icon and string
     * @param icon The icon to show
     * @param innerStr The text to show next to the icon
     * @param onClick The callback to call when user clicks button
     */
    private generateBtn(icon: JSX.Element, innerStr: string, onClick: () => void) {
        return (
            <button className='consoleHeaderBtn' onClick={onClick}>
                <div className='consoleBtnIcon'>
                    {icon}
                </div>
                <div className='consoleBtnText'>
                    {innerStr}
                </div>
            </button>
        );
    }

    /**
     * Resets the state of the console view panel, and triggers the prop 'onClose' method.
     */
    private onConsoleClose() {
        this.setState({
            isPaused: false,
            shouldScroll: false,
            lastFetchStatus: FetchStatus.New
        })
        // Does the memory get freed up when this component is disposed?
        this.liveLogBuffer.clearLogs();
        this.eventLogBuffer.clearLogs();
        this.props.onClose();
    }

    private renderStatus() {
        let icon: JSX.Element = null;
        let statusToolTip = '';
        switch (this.state.lastFetchStatus) {
            case FetchStatus.Running:
                icon = <GreenSvg />;
                statusToolTip = DisplayStrings.LiveLogsRunning;
                break;
            case FetchStatus.Error:
                icon = <FailedSvg />;
                statusToolTip = DisplayStrings.LiveLogsQueryFailed;
                break;
            case FetchStatus.New:
                icon = <UnknownSvg />;
                statusToolTip = DisplayStrings.LiveLogsStarting;
                break;
            case FetchStatus.Paused:
                icon = <UnknownSvg />;
                statusToolTip = DisplayStrings.LiveLogsReasonPasued;
                break;
        }

        return <div className='livelog-status-root'>
            <div className='console-update-details-header'>
                <ConsoleUpdateStatus />
            </div>
            <div className='console-header-extras' title={statusToolTip}>
                <title>{statusToolTip}</title>
                {icon}
            </div>
            <ConsoleErrorsLink
                onErrorLinkClick={this.toggleErrorsDiv}
                lastErrorMessage={this.state.lastErrorMessage}
                isErrorPanelVisible={this.state.isErrorPanelVisible}
                errorLinkMessage={this.state.errorLinkMessage}
            />
        </div>
    }

    /**
     * Returns true if none of the loggingInfo data inside of a prop is null.
     * Returns false otherwise.
     * @param props The prop to check
     */
    private arePropsValid(props: Readonly<IConsoleViewPanelProps>): boolean {
        return props.loggingInfo.isValidLiveLog() || props.loggingInfo.isvalidEventLog();
    }

    /**
     * Checks if current props are valid
     */
    private areThisPropsValid(): boolean {
        return this.arePropsValid(this.props);
    }

    /**
     * Handles event data by setting it in the event log buffer and updates the fetch status
     * @param data event log items received by the data provider
     */
    private handleEventData(data: any): void {
        this.setState((prevState: IConsoleViewPanelState) => {
            const numNewEvents = this.eventLogBuffer.set(data);

            if (numNewEvents > -1) {
                ConsoleHeaderStatus.AppendEventCount(numNewEvents);
            }

            const currentFetchStatus =
                (this.eventFailureCount > 0 || this.logFailureCount > 0)
                    ? FetchStatus.Error
                    : FetchStatus.Running;

            return {
                eventVersonNum: prevState.eventVersonNum + 1,
                lastFetchStatus: currentFetchStatus
            };
        });
    }

    /**
     * Handles new log data by merging it into the log buffer, and updates the fetch status.
     * @param data new log items received by the data provider
     */
    private handleLogData(data: ILogItem[]): void {
        this.setState((prevState: IConsoleViewPanelState) => {
            const numNewLogs = this.liveLogBuffer.merge(data);
            let lastFetchStatus = FetchStatus.Error;

            if (numNewLogs > -1) {
                lastFetchStatus = FetchStatus.Running;
                ConsoleHeaderStatus.AppendLogCount(numNewLogs);
            } else {
                ConsoleHeaderStatus.TransitionErrorState(false);
            }
            return {
                logVersonNum: prevState.logVersonNum + 1,
                lastFetchStatus: lastFetchStatus
            };
        });
    }

    /**
     * Polls the server with the information provided by the props.
     * @param props The props with which to query the server 
     */
    private pollServer(props: Readonly<IConsoleViewPanelProps>): void {
        if (!this.state.isPaused && !this.disposedComponent) {
            if (!props.loggingInfo.isValidLiveLog() && !props.loggingInfo.isvalidEventLog()) {
                const error: any = new Error('Invalid loggingInfo passed in during pollServer');
                error.loggingInfo = props.loggingInfo;

                this.telemetry.logExceptionLimited(
                    error,
                    error,
                    'ConsoleViewPanel.pollServer',
                    ErrorSeverity.Error,
                    undefined,
                    undefined
                );
                return;
            }

            this.lastPollTime = new Date();

            let liveExperiencePromises = [];
            if (props.loggingInfo.equals(this.props.loggingInfo)) {
                if (props.loggingInfo.isvalidEventLog()) {
                    liveExperiencePromises.push(this.pollEventLogs(props));
                }

                if (props.loggingInfo.isValidLiveLog()) {
                    liveExperiencePromises.push(this.pollLiveLogs(props));
                }
            }

            if (liveExperiencePromises.length < 1) {
                throw new Error('Console open without any promises set to trigger');
            }

            if (this.logFailureCount <= 3 && this.eventFailureCount <= 3) {

                // tslint:disable-next-line:max-line-length
                //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all#Promise.all_fail-fast_behaviour
                // Promise.all behaviour documentation
                // We're catching the errors sepcifically within each seperate promise so no catch statement required here
                Promise.all(liveExperiencePromises).then(() => {
                    //we want to send out requests at a minimum of 500ms apart.
                    const pollTime: number = (new Date().getTime() - this.lastPollTime.getTime());
                    const timeToWait = Math.max(0, queryIntervalTimeMS - pollTime);
                    //telemetry
                    const customMetrics = {
                        'time': pollTime
                    };
                    if (queryIntervalTimeMS - pollTime < 0) {
                        const error: any = new Error('Live Console Multi-Fetch took longer than the alloted query time')
                        this.telemetry.logExceptionLimited(
                            error,
                            error,
                            'ConsoleViewPanel.pollServer',
                            ErrorSeverity.Warn,
                            undefined,
                            customMetrics
                        );
                    } else {
                        this.telemetry.logEvent(
                            'LiveConsoleDataFetch',
                            undefined,
                            customMetrics
                        );
                    }

                    this.currentInterval = setTimeout(this.pollServer, timeToWait, props);
                });
            }
        }
    }

    /**
     * Start a query for the events data using the eventsDataProvider and return a promise which resolves when
     * the data provider has fetched ALL the event items (continue token logic should be oblivious to this function
     * and handled in the eventsDataProvider)
     * @param props Console view panel properties required for starting events query promise
     */
    private pollEventLogs(props: Readonly<IConsoleViewPanelProps>): Promise<void> {
        return this.eventsDataProvider.start(
            this.currentNameSpaceForEventPollValue,
            this.currentFieldselectorValue
        ).then((eventItems) => {
            this.eventFailureCount = 0;
            this.handleEventData(eventItems);
        }).catch((error) => {
            this.eventFailureCount++;
            this.props.liveDataProvider.clearCache();
            this.telemetry.logExceptionLimited(error, error,
                'ConsoleViewPanel.pollServerEvents', ErrorSeverity.Error, undefined, undefined);

            this.setState({
                lastFetchStatus: FetchStatus.Error,
            }, () => {
                ConsoleHeaderStatus.TransitionErrorState(false);
            });

            this.handleCommonLiveDataFetchErrors(error, this.eventFailureCount, props);
        });
    }

    /**
     * Handles common errors that happen on both events and logs
     * @param error error object received from https call which returned in a bad state
     * @param failureCount number of consecutive failed calls for either events or logs
     */
    private handleCommonLiveDataFetchErrors(error: any, failureCount: number, props: Readonly<IConsoleViewPanelProps>) {
        let errorInfo;

        if (
            error.httpRequestError !== null && error.httpRequestError !== undefined
            && error.httpRequestError.responseText !== null && error.httpRequestError.responseText !== undefined
            && error.httpRequestError.status !== null && error.httpRequestError.status !== undefined
        ) {
            errorInfo = JSON.parse(error.httpRequestError.responseText);

            if (
                errorInfo.error !== null && errorInfo.error !== undefined
                && errorInfo.error.code !== null && errorInfo.error.code !== undefined
                && errorInfo.error.message !== null && errorInfo.error.message !== undefined
            ) {

                const errorMessageFromProxy: IErrorMessageFromProxy = {
                    KubeApiResponse: errorInfo.error.code + ' : ' + errorInfo.error.message,
                    KubeApiStatus: error.httpRequestError.status,
                    ProxyResponse: null,
                    ProxyStatus: null,
                    Troubleshoot: liveLogsTroubleshootRBAC,
                    PopupStatus: null
                };
                this.setState({
                    lastErrorMessage: errorMessageFromProxy
                }, () => {
                    ConsoleHeaderStatus.TransitionErrorState(true);
                });
                return;
            }
        }

        if (failureCount > 3) {
            const errorMessageFromProxy: IErrorMessageFromProxy = {
                KubeApiResponse: !(error.responseJSON === undefined)
                    && !(error.responseJSON.message === null || error.responseJSON.message === undefined)
                    ? error.responseJSON.message
                    : null,
                KubeApiStatus: !(error.responseJSON === undefined)
                    && !(error.responseJSON.code === null || error.responseJSON.code === undefined)
                    ? error.responseJSON.code
                    : null,
                ProxyResponse: !(error.statusText === null || error.statusText === undefined)
                    ? error.statusText
                    : null,
                ProxyStatus: !(error.status === null || error.status === undefined)
                    ? error.status
                    : null,
                Troubleshoot: liveLogsTroubleshootRBAC,
                PopupStatus: null
            }

            this.setState({
                lastErrorMessage: errorMessageFromProxy
            }, () => {
                ConsoleHeaderStatus.TransitionErrorState(true);
            });
            return;
        }

        if (props.loggingInfo.equals(this.props.loggingInfo) && !this.state.isPaused && !this.disposedComponent && !error.isFatal) {
            ADProvider.Instance().invalidate();
            this.props.liveDataProvider.clearCache();
        }
    }

    /**
     * Start a query for the live logs data using the liveDataProvider and return a promise which resolves when
     * the data provider has fetched ALL the log items in the said time range. 
     * @param props Console view panel properties required for starting events query promise
     */
    private pollLiveLogs(props: Readonly<IConsoleViewPanelProps>): Promise<any> {
        // update the last poll time
        const timeStampToQuery = this.liveLogBuffer.getNextTimestampToQuery();
        const sinceTime = (!timeStampToQuery)
            ? '5' // 5 seconds in the past if there are no log items
            : timeStampToQuery;
        const timeFrameSelector = (!timeStampToQuery)
            ? TimeFrameSelector.sinceSeconds
            : TimeFrameSelector.sinceTime;
        return this.props.liveDataProvider.getLiveLogs(
            props.loggingInfo.nameSpace,
            props.loggingInfo.podName,
            props.loggingInfo.containerInstanceName,
            sinceTime,
            timeFrameSelector
        ).then((logItems) => {
            this.logFailureCount = 0;
            this.handleLogData(logItems);
        }).catch((error) => {
            this.logFailureCount++;
            // catch 403
            this.telemetry.logExceptionLimited(error, error, 'ConsoleViewPanel.pollServerLogs', ErrorSeverity.Error, undefined, undefined);

            this.setState({
                lastFetchStatus: FetchStatus.Error,
            }, () => {
                ConsoleHeaderStatus.TransitionErrorState(false);
            });

            // Popup blocked or closed without logging in
            if (
                error.message === Constants.ErrorMessageForBlockedPopup
                || error.message === Constants.ErrorMessageForClosingPopup
            ) {
                const errorMessageFromProxy: IErrorMessageFromProxy = {
                    KubeApiResponse: null,
                    KubeApiStatus: null,
                    ProxyResponse: null,
                    ProxyStatus: null,
                    Troubleshoot: error.message === Constants.ErrorMessageForClosingPopup
                        ? liveLogsTroubleshootRBAC
                        : null,
                    PopupStatus: error.message === Constants.ErrorMessageForClosingPopup
                        ? DisplayStrings.PopupIsClosedMsg
                        : DisplayStrings.PopupIsBlockedMsg
                };
                this.setState({
                    lastErrorMessage: errorMessageFromProxy
                }, () => {
                    ConsoleHeaderStatus.TransitionErrorState(true);
                });
                return;
            }

            this.handleCommonLiveDataFetchErrors(error, this.logFailureCount, props);
        });
    }
    /**
     * update the chart data for ContainerLiveTabMetricChartPane
     * @param chartData the latest chart data
     */
    private onChartDataLoaded(chartData: StringMap<StringMap<ChartSeriesData>>): void {
        this.setState({ chartData });
    }
}
