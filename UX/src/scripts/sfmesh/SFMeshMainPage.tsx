/**
 * tpl
 */
import * as moment from 'moment';
import * as React from 'react';
import update = require('immutability-helper');
import { ChartSeriesData } from '@appinsights/aichartcore';

/**
 * local
 */
import { ApplicationPane } from './ApplicationPane';
import { SFMeshMetricChart } from './SFMeshMetricChart';

import {
    IInBladeContainerControlPanelProps
} from '../container/control-panel/ContainerControlPanel';
import { MeshControlPanel } from './control-panel/MeshControlPanel';
import { IContainerControlPanelSelections } from '../container/control-panel/ContainerControlPanelSelections';

/**
 * shared
 */
import * as msg from '../shared/MessagingProvider';
import { InitializationInfo, AuthorizationTokenType } from '../shared/InitializationInfo';
import { IWorkspaceInfo } from '../shared/IWorkspaceInfo';
import { RequiredLoggingInfo } from '../shared/RequiredLoggingInfo';
import { BlueLoadingDots, BlueLoadingDotsSize } from '../shared/blue-loading-dots';
import { ErrorSeverity } from '../shared/data-provider/TelemetryErrorSeverity';
import { BladeLoadManager, QueryName } from '../container/messaging/BladeLoadManager';
import { LoadTrackingTerminationReason } from '../container/messaging/IBladeLoadManager';

/**
 * svg
 */
import { AppInsightsProvider } from '../shared/CustomAppInsightMessagingProvider';

import '../../styles/sfmesh/SFMeshMainPage.less';
import { TelemetryMainArea, TelemetrySubArea, ITelemetry } from '../shared/Telemetry';
import { TelemetryFactory } from '../shared/TelemetryFactory';
import { EnvironmentConfig, AzureCloudType } from '../shared/EnvironmentConfig';
import { ICommonContainerTabProps } from '../container/shared/ICommonContainerTabProps';
import { AggregationOption } from '../shared/AggregationOption';
import { IPropertyPanelInterpretedResponse } from '../container/data-provider/KustoPropertyPanelResponseInterpreter';
import { SGDataRowExt } from '../container/grids/shared/SgDataRowExt';
import { IContainerInsightsPreloadState } from '../container/IContainerInsightsPreloadState';
import { IPillSelections } from '../container/ContainerMainPageTypings';

export interface ISFMainPageState extends ICommonContainerTabProps {
    /** version of the state */
    version: number;

    /** index of the selected tab */
    selectedTab: number;

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

    /** data for chart visualization
     * dictionary by chart id (metric) to value, which is itself
     * a dictionary of series ids to chart series data
     */
    chartData: StringMap<StringMap<ChartSeriesData>>;

    /** series selections for the chart */
    chartSeriesSelections: StringMap<any>;

    /** in-blade experience properties */
    inBlade?: {};

    /** live logging information */
    loggingInfo: RequiredLoggingInfo;

    /** true if live log console opened */
    isConsoleOpen: boolean;

    /** Feature flags */
    featureFlags: StringMap<any>;

    /** pill Selections for the CI grids  */
    pillSelectionsOnNavigation: IPillSelections;

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
}

/**
 * Borrows from ContainerMainPage to create a main page for sf mesh
 */
export class SFMeshMainPage extends React.Component<{}, ISFMainPageState> {
    private messagingProvider = new msg.MessagingProvider(new AppInsightsProvider());
    private telemetry: ITelemetry;

    constructor(props?: {}) {
        super(props);

        const endDateTime = moment.utc();
        const startDateTime = moment(endDateTime).add(-6, 'h');

        const initialChartSeriesSelections: StringMap<any> = {};

        /** TODO: add preloading/restructuring to mesh page so this is unnecessary */
        /* If this is not here, telemetry calls break */
        if (!EnvironmentConfig.Instance().isConfigured()) {
            EnvironmentConfig.Instance().initConfig(AzureCloudType.Public, false);
        }

        // set up blade load manager
        BladeLoadManager.Instance().initialize(
            TelemetryMainArea.SFMesh,
            [QueryName.Mesh]);

        this.telemetry = TelemetryFactory.get(TelemetryMainArea.SFMesh);

        for (const chartDescriptor of SFMeshMetricChart.list()) {
            initialChartSeriesSelections[chartDescriptor.chartId] =
                chartDescriptor.defaultSeriesSelections;
        }

        this.state = {
            version: 0,
            selectedTab: 0,
            initializationInfoReceived: false,
            startDateTimeUtc: startDateTime.toDate(),
            endDateTimeUtc: endDateTime.toDate(),
            workspace: null,
            timeRangeSeconds: 60 * 60 * 6,
            clusterName: '',
            clusterLocation: '',
            clusterResourceId: '',
            nameSpace: '',
            serviceName: '',
            hostName: '',
            nodePool: '',
            controllerName: '',
            controllerKind: '',
            selectedGridMetricName: '',
            selectedGridAggregationOption: undefined,
            sequenceNumber: -1,
            propertyPanelCollapsed: true,
            propertyPanelLoading: true, // property panel default state
            propertyPanelInterpretedResponse: { type: undefined, data: undefined },
            propertyPanelForFirstRowLoaded: false,
            propertyPanelRow: undefined,
            selectedRow: undefined,
            userWantsPropertyPanelOpen: true,
            chartSeriesSelections: initialChartSeriesSelections,
            chartData: {},
            loggingInfo: this.createEmptyLoggingInfo(),
            isConsoleOpen: false,
            featureFlags: {},
            isTimeRelative: false,
            pillSelectionsOnNavigation: undefined,
            isTabContentLoading: true,
            isBannerVisible: false,
            enablePinChartToDashboard: false,
        }

        this.messagingProvider.registerProcessor(msg.InitInBladeMessageProcessorType, this.processInitMessage.bind(this));
        this.messagingProvider.registerProcessor(msg.LoadCompleteMessageProcessorType, this.onLoadComplete.bind(this));

        this.onChartDataLoaded = this.onChartDataLoaded.bind(this);
        this.onChartSeriesSelectionsChanged = this.onChartSeriesSelectionsChanged.bind(this);

        this.messagingProvider.startMessaging();

        this.onTabContentLoadingStatusChange = this.onTabContentLoadingStatusChange.bind(this);
    }

    /**
     * Render main page
     */
    public render(): JSX.Element {
        const loading: JSX.Element =
            <div className='MainPage-root center-flex'>
                <BlueLoadingDots size={BlueLoadingDotsSize.large} />
            </div>
        try {
            return (
                <div className='MainPage-root'>
                    <div>
                        {this.renderContentPane()}
                    </div>
                </div>
            )
        } catch (exc) {
            this.telemetry.logException(exc, 'MeshMainPage', ErrorSeverity.Error, null, null);
            return loading;
        }
    }

    /**
     * Render the content pane holding the charts
     */
    private renderContentPane(): JSX.Element {
        let options: IInBladeContainerControlPanelProps = {
            workspace: { id: this.state.clusterName, name: '', location: '' },
            clusterName: this.state.clusterName,
            messagingProvider: this.messagingProvider,
        };
        return (
            <div className='content-root'>
                <MeshControlPanel
                    options={options}
                    onSelectionsChanged={(selections) => this.onControlPanelSelectionsChanged(selections)}
                    idealGrain={1}
                    pillSelections={undefined}
                    isTabContentLoading={this.state.isTabContentLoading}
                    telemetry={this.telemetry}
                    telemetryArea={TelemetrySubArea.SFMesh}
                />
                <ApplicationPane
                    startDateTimeUtc={this.state.startDateTimeUtc}
                    endDateTimeUtc={this.state.endDateTimeUtc}
                    workspace={this.state.workspace}
                    clusterName={this.state.clusterName}
                    clusterResourceId={this.state.clusterResourceId}
                    nameSpace={this.state.nameSpace}
                    controllerName={this.state.controllerName}
                    controllerKind={this.state.controllerKind}
                    serviceName={this.state.serviceName}
                    hostName={this.state.hostName}
                    nodePool={this.state.nodePool}
                    seriesSelections={this.state.chartSeriesSelections}
                    chartData={this.state.chartData}
                    onChartDataLoaded={this.onChartDataLoaded}
                    onSeriesSelectionsChanged={this.onChartSeriesSelectionsChanged}
                    messagingProvider={this.messagingProvider}
                    isTimeRelative={this.state.isTimeRelative}
                    onTabContentLoadingStatusChange={this.onTabContentLoadingStatusChange}
                />
            </div>
        );
    }

    /**
     * Parses init message args to get auth header and resource id
     * @param args 
     */
    private parseInitArgs(args: any): any {
        if (!args[0] || !args[3]) {
            console.error('Received invalid init message');
            return;
        }
        return {
            'authHeaderValue': args[0],
            'azureCloudType': args[2],
            'applicationResourceId': args[3]
        };
    }

    /**
     * Processes init message from parent
     */
    private processInitMessage(): void {
        let args = this.parseInitArgs(arguments);

        this.updateAuthorizationHeader(args.authHeaderValue);

        /**
         * Currently will not be run, due to async
         */
        if (!EnvironmentConfig.Instance().isConfigured()) {
            EnvironmentConfig.Instance().initConfig(args.azureCloudType, false);
        }

        // Temporary override in case feature flag is not used
        let applicationResourceId: string | undefined = args.applicationResourceId;
        if (applicationResourceId === undefined) {
            // tslint:disable-next-line:max-line-length
            applicationResourceId = '/subscriptions/692aea0b-2d89-4e7e-ae30-fffe40782ee2/resourcegroups/cohadley-mesh/providers/Microsoft.ServiceFabricMesh/applications/VotingApp';
        }
        const workspace = this.workspaceInfoFromResourceId(applicationResourceId);
        //FeatureFlags variable may be undefined when this code is in MPAC. 
        //This if statement prevents crashes, and can be removed after it goes into PROD.
        const inBlade: {} = {
            workspace,
            containerClusterName: applicationResourceId,
            containerClusterResourceId: applicationResourceId,
            containerClusterLocation: ''
        };

        // nothing to do if we already have in-blade state
        if (this.state.inBlade) { return; }

        this.setState({ clusterName: applicationResourceId });
        this.setState((prevState: ISFMainPageState) => {
            const stateUpdate: any = {
                inBlade,
                workspace
            };

            return stateUpdate;
        });

        // record the fact that we received init event
        if (!this.state.initializationInfoReceived) {
            BladeLoadManager.Instance().setPerformanceMeasure('frame_tokenReceived');

            // report the fact that we're done loading if cluster is not onboarded
            if (!workspace) {
                BladeLoadManager.Instance().terminateLoadTracking(LoadTrackingTerminationReason.NotOnboarded);
            }
            this.setState({ initializationInfoReceived: true });
        }
    }

    private onChartSeriesSelectionsChanged = (chartId: string, newSelections: any): void => {
        this.setState((prevState: ISFMainPageState) => {
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
     * Strip off sequence number, calculate the time series as differences in milliseconds since auxme (AzureUX_Monitoring) constructor
     * was fired... this is our day zero... we only control the code from AUXM up to the the resolution of ibiza's promise... after that
     * we have zero control... any items registered to window.containerInsights.performanceMeasures object are ALL automatically appended
     * to the event and registered to telemetry... feel free to add timing points as desired but note this event only fires once on load.
     * @param measures measuring points given to us by Monitoring Extension
     */
    private onLoadComplete(measures: StringMap<number>): void {
        const constructorMoment = moment((measures.auxme_constructor as any));

        const finalTelemetryMeasures = Object.assign({}, measures, (window as any).containerInsights.performanceMeasures);

        // bbax: sequenceNumber not really needed here... strip it..
        delete finalTelemetryMeasures.sequenceNumber;

        // bbax: should be a few ms tops different then ibizaResolution, but lets put it here for peace of mind..
        finalTelemetryMeasures['onLoadComplete'] = Date.now();

        // bbax: order the keys so the console.logs are pretty... vanity!
        const keys = Object.keys(finalTelemetryMeasures);
        keys.sort((left, right) => {
            return finalTelemetryMeasures[left] - finalTelemetryMeasures[right];
        });

        // bbax: enumerate the keys, calculate their difference from now()
        console.log('-- Start of Page Load Telemetry Measures --');
        keys.forEach((key) => {
            const measureMoment = moment(finalTelemetryMeasures[key]);
            finalTelemetryMeasures[key] = measureMoment.diff(constructorMoment, 'milliseconds');
            console.log(`${key} : ${finalTelemetryMeasures[key]}`);
        });
        console.log('-- End of Page Load Telemetry Measures --');
    }

    // copied from containermainpage
    private onControlPanelSelectionsChanged(selections: IContainerControlPanelSelections): void {
        this.setState({
            nameSpace: selections.nameSpace,
            serviceName: selections.serviceName,
            hostName: selections.hostName,
            startDateTimeUtc: selections.startDateTimeUtc,
            endDateTimeUtc: selections.endDateTimeUtc,
            timeRangeSeconds: selections.timeRangeSeconds,
            isTimeRelative: selections.isTimeRelative,
            chartData: {},
        });
    }

    // similar to containermainpage
    private updateAuthorizationHeader(authorizationHeaderValue: string) {
        const initInfo = InitializationInfo.getInstance();

        if (initInfo.getAuthorizationHeaderValue(AuthorizationTokenType.Arm) !== authorizationHeaderValue) {
            initInfo.setAuthorizationHeaderValue(AuthorizationTokenType.Arm, authorizationHeaderValue);
        }

        if (!this.state.initializationInfoReceived) {
            (window as any).containerInsights.performanceMeasures['frame_tokenReceived'] = Date.now();
            this.setState({ initializationInfoReceived: true });
        }
    }

    /**
     * Creates a new RequiredLoggingInfo object which only contains null values.
     * This is used to clear previous loggingInfo data in the State.
     */
    private createEmptyLoggingInfo(): RequiredLoggingInfo {
        return new RequiredLoggingInfo(null, null, null, null, null, null, null, null);
    }

    /** Similar to containermainpage
     * Constructs workspace info structure using provided workspace resource id
     * @param workspaceResourceId Azure workspace resource id
     * @returns workspace info structure
     */
    private workspaceInfoFromResourceId(workspaceResourceId?: string): IWorkspaceInfo {
        if (!workspaceResourceId || !this.state.clusterName) {
            return null;
        }

        const idParts: string[] = this.state.clusterName.split('/');

        const workspace: IWorkspaceInfo = {
            id: workspaceResourceId,
            name: idParts[idParts.length - 1],
            location: '',
        };

        return workspace;
    }

    /**
     * Sets chartData state after it has been loaded
     * Similar to containermainpage
     */
    private onChartDataLoaded = (newData: StringMap<StringMap<ChartSeriesData>>): void => {
        (window as any).containerInsights.performanceMeasures['frame_gridDataLoadComplete'] = Date.now();

        BladeLoadManager.Instance().queryCompleted(QueryName.Mesh);

        this.setState({ chartData: newData, isTabContentLoading: false, propertyPanelLoading: false });
    }

    /** same as containermainpage
     * Onclick handler for setting isTabContentLoading
     * @param isLoading true if the tab content is loading
     */
    private onTabContentLoadingStatusChange(isLoading: boolean) {
        this.setState({ isTabContentLoading: isLoading });
    }
}
