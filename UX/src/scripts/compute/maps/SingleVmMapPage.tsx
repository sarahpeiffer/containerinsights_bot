/**
 * Block imports
 */
import * as React from 'react';
import update = require('immutability-helper');

/**
 * Third Party
 */
import { TimeData, TimeValues } from '@appinsights/pillscontrol-es5';
import { isRelative } from '@appinsights/pillscontrol-es5/dist/TimeUtils';

/**
 * Shared imports
 */
import * as msg from '../../shared/MessagingProvider';
import { InitializationInfo, AuthorizationTokenType } from '../../shared/InitializationInfo';
import { TimeInterval } from '../../shared/data-provider/TimeInterval';
import { ITelemetry, TelemetryMainArea } from '../../shared/Telemetry';
import { VmInsightsTelemetryFactory } from '../../shared/VmInsightsTelemetryFactory';
import { TelemetryUtils } from '../shared/TelemetryUtils';
import { IWorkspaceInfo } from '../../shared/IWorkspaceInfo';
import { BasicMapComponent, MapApiResponse, MapResourceType } from './compute-map/BasicMapComponent';
import { TimeUtils } from '../shared/TimeUtils';
import { AppInsightsProvider } from '../../shared/CustomAppInsightMessagingProvider';
import { SingleControlPanel } from '../shared/control-panel/SingleControlPanel';
import { EnvironmentConfig, AzureCloudType } from '../../shared/EnvironmentConfig';
import { UrlParameterHelper } from '../../shared/UrlParameterHelper';
import { DefaultHealthInfo, GuestHealth, PlatformHealth } from '../../shared/IHealthInfo';
import { VmInsightsThemeMessageProcessor, IVmInsightsThemeMessageResult } from '../shared/VmInsightsThemeMessageProcessor';
import { BlueLoadingDots, BlueLoadingDotsSize } from '../../shared/blue-loading-dots';
import { OnboardingState } from '../shared/OnboardingUtil';
import { ErrorSeverity } from '../../shared/data-provider/TelemetryErrorSeverity';
import { IVmResourceDescriptor } from '../shared/VirtualMachineBase';
import { MapType } from './compute-map/ComputeMapsElement';
import { IVmInsightsSingleVmServiceMapInitMessage, IVmInsightsSingleVmHealthInitMessage } from '../shared/VmInsightsServiceMapModule';
import { LocaleStringsHandler } from '../../shared/LocaleStringsHandler';
import { WorkbookTemplates } from '../shared/WorkbookTemplates';
import { ApiClientRequestInfoBladeName } from '../../shared/data-provider/ApiClientRequestInfo';
import { LocaleManager } from '../../shared/LocaleManager';

/* required for ie11... this will enable most of the Object.assign functionality on that browser */
import { polyfillObjectAssign } from '../../shared/ObjectAssignShim';
polyfillObjectAssign();

/**
 * Styles
 */
import '../../../styles/shared/MainPage.less';
import '../../../styles/compute/ComputeMaps.less';

const VmInstanceMapQueryName: string = 'VmInstanceMapQueryName';
const TelemetryEventsPrefix = 'Compute.{0}.Map';

export interface ISingleVMMapInitMessage {
    authHeaderValue: string;
    azureCloudType: AzureCloudType;
    computerId: string;
    correlationId: string;
    disableWorkbook?: boolean;
    featureFlags: StringMap<boolean>;
    guestState: string;
    iframeId: string;
    language: string;
    mapApiResponse: any;
    onboardingState?: OnboardingState;
    platformState: string;
    resourceId: string;
    sequenceNumber: number;
    vm: IVmResourceDescriptor;
    workspace: any;
}

export interface ISingleVmMapPageProps {
}

export interface ISingleVmMapPageState {
    isAuthorizationInfoReceived: boolean;
    computerId: string;
    workspace: IWorkspaceInfo;
    resourceId: string;
    dateTime: TimeData;
    sequenceNumber: number;
    isDarkMode: boolean;
    mapApiResponse: MapApiResponse;
    disableWorkbook: boolean;
    guestHealth: GuestHealth;
    platformHealth: PlatformHealth;
    // if `undefined`, then async onboarding is not supported
    onboardingState: OnboardingState | undefined;
    vm: IVmResourceDescriptor;
    correlationId: string;
    updateComponent: boolean;
    language: string;
    endDateTimeUtc?: Date;
}

const supportedTimes: TimeValues[] = [
    TimeValues.Last30Minutes,
    TimeValues.LastHour,
    TimeValues.Custom
];

export class SingleVmMapPage extends React.Component<ISingleVmMapPageProps, ISingleVmMapPageState> {
    private messagingProvider = new msg.MessagingProvider(new AppInsightsProvider());
    private telemetry: ITelemetry;
    private initialMapRenderingCompleted: boolean = false;
    private featureFlags: StringMap<boolean>;
    private initMessageReceived: boolean = false;
    private telemetryEventsPrefix: string;
    private bodyTheme: string;

    constructor(props?: ISingleVmMapPageProps) {
        super(props);

        this.telemetry = VmInsightsTelemetryFactory.get(TelemetryMainArea.Maps);
        (window as any).singleVmMapInsights.performanceMeasures['frame_constructor'] = Date.now();

        this.mapsComputerIdChanged = this.mapsComputerIdChanged.bind(this);
        this.onMapComputationCompleted = this.onMapComputationCompleted.bind(this);
        this.onMapComputationStarted = this.onMapComputationStarted.bind(this);
        this.onRefresh = this.onRefresh.bind(this);

        const eventName: string = UrlParameterHelper.getEventSource() || 'SingleVM';
        this.telemetryEventsPrefix = TelemetryEventsPrefix.replace('{0}', eventName);

        const dateTime = { options: {}, relative: { duration: TimeValues.Last30Minutes } };

        this.state = {
            isAuthorizationInfoReceived: false,
            dateTime: dateTime,
            computerId: null,
            resourceId: null,
            workspace: null,
            sequenceNumber: -1,
            isDarkMode: false,
            mapApiResponse: {
                data: undefined,
                errors: undefined,
                telemetryParams: undefined
            },
            disableWorkbook: false,
            guestHealth: DefaultHealthInfo.GUEST_LOADING_STATE,
            platformHealth: DefaultHealthInfo.PLATFORM_LOADING_STATE,
            // make sure to initialize to null since this is still behind a feature flag
            // and we want to support the original case where onboarding check happens
            // before loading the iframe
            onboardingState: undefined,
            vm: undefined,
            correlationId: undefined,
            updateComponent: false,
            language: undefined
        };

        this.messagingProvider.registerProcessor(msg.InitSingleVmComputeMapMessageProcessorType, this.onInit.bind(this));
        this.messagingProvider.registerProcessor(msg.LoadCompleteMessageProcessorType, this.onLoadComplete.bind(this));
        this.messagingProvider.registerProcessor(msg.RefreshMessageProcessorType, this.onRefresh.bind(this));
        this.messagingProvider.registerProcessor(msg.ArmTokenMessageProcessorType, this.onArmTokenReceived.bind(this));
        this.messagingProvider.registerProcessor(msg.StyleThemingMessageProcessorType, this.onStyleThemeInit.bind(this));
        this.messagingProvider.registerProcessor(msg.ServiceMapInitMessageProcessorType, this.onServiceMapInit.bind(this));
        this.messagingProvider.registerProcessor(msg.HealthInitMessageProcessorType, this.onHealthInit.bind(this));

        // tell Ibiza this map component is ready to recevice message.
        this.messagingProvider.startMessaging(msg.VmInsightsIFrameIds.SingleVMComputeMap);

        LocaleManager.Instance().setupLocale();

        LocaleStringsHandler.Instance().onTranslation(() => {
            WorkbookTemplates.initialize();
        });
    }

    public componentDidUpdate(prevProps: ISingleVmMapPageProps, prevState: ISingleVmMapPageState) {
        if (this.state.updateComponent) {
            this.setState({
                updateComponent: false
            });
        }
    }

    public render(): JSX.Element {
        let mainContent: JSX.Element = <div className='loading-icon-container center-flex-content'>
            <BlueLoadingDots size={BlueLoadingDotsSize.large} />
        </div>;

        if (this.state.isAuthorizationInfoReceived) {
            mainContent = <BasicMapComponent
                controlBar={this.getControlPanel()}
                mapParams={{
                    mapId: this.state.resourceId || this.state.computerId,
                    mapDisplayName: this.state.vm && this.state.vm.name,
                    mapType: MapType.singlevmmap,
                    resourceType: MapResourceType.serviceMapComputer,
                    resource: this.state.vm && {
                        computerName: this.state.vm.name,
                        azureResourceId: this.state.vm.resourceId,
                        displayName: this.state.vm.name,
                        id: this.state.computerId
                    }
                }}
                workspace={this.state.workspace}
                dateTime={this.state.dateTime}
                computers={null}
                messagingProvider={this.messagingProvider}
                telemetry={this.telemetry}
                logPath={this.telemetryEventsPrefix}
                mapComputerIdChanged={this.mapsComputerIdChanged}
                mapQueryName={VmInstanceMapQueryName}
                mapApiResponse={this.state.mapApiResponse}
                onMapComputationStarted={this.onMapComputationStarted}
                onMapComputationCompleted={this.onMapComputationCompleted}
                featureFlags={this.featureFlags}
                guestHealth={this.state.guestHealth}
                platformHealth={this.state.platformHealth}
                isDarkMode={this.state.isDarkMode}
                onboardingState={this.state.onboardingState}
                vm={this.state.vm}
                forceUpdate={this.state.updateComponent}
                quicklinksDisplaySettings={{
                    showConnectionWorkbookLink: true,
                    showMapLink: false,
                    showPerfViewLink: false,
                    showResourceLink: false,
                    isSingleVm: true
                }}
                language={this.state.language}
                apiRequestInfo={{ bladeName: ApiClientRequestInfoBladeName.Vm, queryName: undefined }}
                enableSimpleMapLayout={true}
            />;
        }

        return <div className='MainPage-root compute-mainpage-root'>{mainContent}</div>;
    }

    private getControlPanel(): JSX.Element {
        return <SingleControlPanel
            selectedTime={this.state.dateTime}
            telemetry={this.telemetry}
            logPrefix={this.telemetryEventsPrefix}
            onSelectionsChanged={this.onRefresh}
            featureFlags={this.featureFlags}
            messagingProvider={this.messagingProvider}
            workspace={this.state.workspace}
            computerName={this.state.computerId}
            resourceId={this.state.resourceId}
            validateTime={TimeUtils.notMoreThanOneHourApart}
            supportedTimes={supportedTimes}
            disableWorkbook={this.state.disableWorkbook}
            onboardingState={this.state.onboardingState}
            endDateTimeUtc={this.state.endDateTimeUtc}
        />;
    }

    /**
     * measures have sequenceNumber and frame_name. We use frame_name to identify to which IFrame these telemetry measures belong to.
     * We need this field since Map and Perf both are sending onLoadComplete and both messages are coming to this callback.
     */
    private onLoadComplete(data: any): void {
        if (!data || !data.metrics || !data.customProperties) {
            return;
        }

        if (data.customProperties.frame_name && data.customProperties.frame_name === VmInstanceMapQueryName) {
            let eventName = `${this.telemetryEventsPrefix}.IFrameLoadMeasure`;
            TelemetryUtils.onLoadComplete((window as any).singleVmMapInsights.performanceMeasures, data.metrics,
                this.telemetry, eventName, data.customProperties);
        }
    }

    /**
     * Callback to be invoked when child component triggers map computation
     */
    private onMapComputationStarted(): void {
        if (!this.initialMapRenderingCompleted) {
            (window as any).singleVmMapInsights.performanceMeasures['frame_mapComputationStarted'] = Date.now();
        }
    }

    /**
     * Callback to be invoked when mapComputation is completed.
     */
    private onMapComputationCompleted(): void {
        if (!this.initialMapRenderingCompleted) {
            (window as any).singleVmMapInsights.performanceMeasures['frame_mapComputationCompleted'] = Date.now();
            this.messagingProvider.sendFinishedLoading({
                networkQueryName: VmInstanceMapQueryName,
                metrics: (window as any).singleVmMapInsights.performanceMeasures
            });
            this.initialMapRenderingCompleted = true;
        }
    }

    /**
     * for single VM map, this should go to Azure monitor at scale map, with selected id
     */
    private mapsComputerIdChanged(id: string): void {
        //TODO: go to Azure monitor page.
        this.setState({ computerId: id });
    }

    /**
     * keep updating the token
     * if workspace id or computer id change, update the workspace id and computer id
     */
    private onInit(initMessage: ISingleVMMapInitMessage): void {
        if (!initMessage || this.initMessageReceived) {
            return;
        }

        // Set the cloud in our environment config
        if (!EnvironmentConfig.Instance().isConfigured()) {
            EnvironmentConfig.Instance().initConfig(initMessage.azureCloudType, EnvironmentConfig.Instance().isMPACLegacy());
        }

        this.initMessageReceived = true;
        (window as any).singleVmMapInsights.performanceMeasures[`frame_initMessageReceived`] = Date.now();

        this.setState({ correlationId: initMessage.correlationId, language: initMessage.language });
        this.telemetry.setContext({ correlationId: initMessage.correlationId }, false);

        this.updateAuthorizationHeader(initMessage.authHeaderValue);
        this.featureFlags = initMessage.featureFlags;

        if (initMessage.mapApiResponse && (initMessage.mapApiResponse.data || initMessage.mapApiResponse.error)) {

            (window as any).singleVmMapInsights.performanceMeasures['frame_dataReceivedFromBlade'] = Date.now();

            this.setState((prevState: ISingleVmMapPageState) => {
                const updatedData = update(prevState.mapApiResponse, {
                    data: { $set: initMessage.mapApiResponse.data },
                    errors: { $set: initMessage.mapApiResponse.error },
                    telemetryParams: { $set: initMessage.mapApiResponse.telemetry }
                });

                return { mapApiResponse: updatedData };
            });
        }

        if (initMessage.disableWorkbook) {
            this.setState({ disableWorkbook: initMessage.disableWorkbook });
        }

        if (!this.state.workspace || !(this.state.computerId || this.state.resourceId)
            || this.state.workspace.id !== initMessage.workspace.id || this.state.computerId !== initMessage.computerId
            || this.state.onboardingState !== initMessage.onboardingState
            || JSON.stringify(this.state.vm).toUpperCase() !== JSON.stringify(initMessage.vm).toUpperCase()) {
            this.setState({
                computerId: initMessage.computerId,
                resourceId: initMessage.resourceId,
                workspace: initMessage.workspace,
                onboardingState: initMessage.onboardingState,
                vm: initMessage.vm
            });
            this.telemetry.setContext({
                workspace_id: initMessage.workspace.id,
                workspace_name: initMessage.workspace.name,
                computerId: initMessage.computerId,
                resourceId: initMessage.resourceId,
                onboardingState: JSON.stringify(initMessage.onboardingState),
                vm: JSON.stringify(initMessage.vm)
            }, false);
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

    private updateAuthorizationHeader(authorizationHeaderValue: string) {
        const initInfo = InitializationInfo.getInstance();

        if (initInfo.getAuthorizationHeaderValue(AuthorizationTokenType.Arm) !== authorizationHeaderValue) {
            initInfo.setAuthorizationHeaderValue(AuthorizationTokenType.Arm, authorizationHeaderValue);
        }

        if (!this.state.isAuthorizationInfoReceived) {
            (window as any).singleVmMapInsights.performanceMeasures['frame_tokenReceived'] = Date.now();
            this.setState({ isAuthorizationInfoReceived: true });
        }
    }

    private onRefresh(selectedTime?: TimeData) {
        if (selectedTime) {
            const telemetryStartAndEndTime = TelemetryUtils.getDateTimeRangeForTelemetry(selectedTime);
            this.telemetry.logEvent(`${this.telemetryEventsPrefix}.ScopeSelector.TimeRangeChanged`, telemetryStartAndEndTime, undefined);
            this.updateTimeRangeState(selectedTime);
        } else {
            const startAndEnd = TimeInterval.getStartAndEndDate(this.state.dateTime, isRelative(this.state.dateTime));
            this.setState({
                updateComponent: true,
                endDateTimeUtc: startAndEnd.end
            });
        }
        // TODO ak: request from blade to retrieve latest health updates
    }

    /**
     * Updates the state of the react component with selected time range/latest time range (when user refreshes the blade)
     * and pass the start and end time dates to IFrame's Host-blade
     * @param time
     */
    private updateTimeRangeState(time: TimeData): void {
        const startAndEnd = TimeInterval.getStartAndEndDate(time, isRelative(time));
        this.setState({
            dateTime: time
        }, () => {
            this.messagingProvider.sendTimeRangeToSingleVMMapBlade({
                dateTime: time,
                startDateTimeUtc: startAndEnd.start,
                endDateTimeUtc: startAndEnd.end
            });
        });
    }

    private onStyleThemeInit(theme: any) {
        const result: IVmInsightsThemeMessageResult =
            VmInsightsThemeMessageProcessor.processMessage(theme, this.telemetry, this.telemetryEventsPrefix, this.bodyTheme);
        this.setState({ isDarkMode: result.isDark });
        this.bodyTheme = result.bodyTheme;
    }

    private onServiceMapInit(data: IVmInsightsSingleVmServiceMapInitMessage): void {
        if (!data) {
            this.telemetry.logException('Received no data for Service Map init', 'onServiceMapInit', ErrorSeverity.Error, {
                computerId: this.state.computerId,
                resourceId: this.state.resourceId,
                workspace: JSON.stringify(this.state.workspace),
                vm: JSON.stringify(this.state.vm)
            }, {
                sequenceNumber: this.state.sequenceNumber
            });
            return;
        }
        (window as any).singleVmMapInsights.performanceMeasures['frame_dataReceivedFromBlade'] = Date.now();
        this.setState({
            computerId: data.computerId,
            resourceId: data.resourceId,
            workspace: data.workspace,
            onboardingState: Object.assign(this.state.onboardingState || {}, { servicemap: data.serviceMapOnboardingState }),
            mapApiResponse: data.mapApiResponse,
            correlationId: data.correlationId
        });
    }

    /**
     * May or may not be called by Single VM blade, also this method may be called more than once
     * to either process guest or platform health. This method may not be called at all if the guest
     * and platform health are contained within the iframe init message.
     *
     * @param data init message from single vm blade
     */
    private onHealthInit(data: IVmInsightsSingleVmHealthInitMessage): void {
        if (data.guestState !== undefined) {
            const guestHealth: GuestHealth = GuestHealth[data.guestState.toUpperCase()];
            this.setState({ guestHealth });
        }
        if (data.platformState !== undefined) {
            const platformHealth: PlatformHealth = PlatformHealth[data.platformState.toUpperCase()];
            this.setState({ platformHealth });
        }
        this.setState({
            onboardingState: Object.assign(this.state.onboardingState || {}, { health: data.healthOnboardingState }),
            correlationId: data.correlationId
        });
    }
}
