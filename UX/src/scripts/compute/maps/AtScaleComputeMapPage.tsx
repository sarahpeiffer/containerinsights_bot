/** Block imports */
import * as React from 'react';
import * as $ from 'jquery';

/** Third Party */
import { TimeData, TimeValues } from '@appinsights/pillscontrol-es5';
import { isTimeDataEqual } from '@appinsights/pillscontrol-es5/dist/TimeUtils';

/** Local */
import { BasicMapComponent, MapParams, MapResourceType } from './compute-map/BasicMapComponent';
import { ComputerGroupProvider } from '../control-panel/ComputerGroupProvider';
import { MapType } from './compute-map/ComputeMapsElement';
import * as Constants from '../Constants';

/** Shared imports */
import * as msg from '../../shared/MessagingProvider';
import { InitializationInfo, AuthorizationTokenType } from '../../shared/InitializationInfo';
import { LoadingSvg } from '../../shared/svg/loading';
import { ITelemetry, TelemetryMainArea } from '../../shared/Telemetry';
import { VmInsightsTelemetryFactory } from '../../shared/VmInsightsTelemetryFactory';
import { TelemetryUtils, IAtScaleTelemetryContext } from '../shared/TelemetryUtils';
import { IWorkspaceInfo } from '../../shared/IWorkspaceInfo';
import { ComputerGroup, ComputerGroupType, ServiceMapComputerGroup, ServiceMapGroupType } from '../../shared/ComputerGroup';
import { WorkspaceListManager } from '../../shared/WorkspaceListManager';
import { AppInsightsProvider } from '../../shared/CustomAppInsightMessagingProvider';
import { IComputerInfo } from '../shared/control-panel/ComputerProvider';
import { ScaleControlPanel, IScaleControlPanelSelections, HybridControlPanelDropDownType } from '../shared/control-panel/ScaleControlPanel';
import { TimeUtils } from '../shared/TimeUtils';
import {
    AtScaleUtils,
    defaultVmssInstance,
    defaultResourceGroupInfo,
    ISyncLocalWorkspaceManagerParams
} from '../shared/AtScaleUtils';
import { ComputerGroupSerialization, SerializedComputerGroup } from '../shared/ComputerGroupSerialization';
import { DisplayStrings } from '../../shared/DisplayStrings';
import { EnvironmentConfig, AzureCloudType } from '../../shared/EnvironmentConfig';
import { UrlParameterHelper } from '../../shared/UrlParameterHelper';
import { SolutionType } from '../shared/ControlPanelUtility';
import {
    AzureScaleControlPanel,
    IAzureScaleControlPanelSelections,
    AzureControlPanelDropDownType
} from '../shared/control-panel/AzureScaleControlPanel';
import { ISubscriptionInfo } from '../../shared/ISubscriptionInfo';
import { VmInsightsResourceType, IAzureResourceDescriptor, IResourceInfo, ResourceInfo } from '../shared/ResourceInfo';
import {
    IVmInsightsThemeMessageResult,
    VmInsightsThemeMessageProcessor,
    IVmInsightsThemeMessage
} from '../shared/VmInsightsThemeMessageProcessor';
import { OnboardingState } from '../shared/OnboardingUtil';
import { LocaleStringsHandler } from '../../shared/LocaleStringsHandler';
import { WorkbookTemplates } from '../shared/WorkbookTemplates';
import { ApiClientRequestInfoBladeName } from '../../shared/data-provider/ApiClientRequestInfo';
import { ErrorSeverity } from '../../shared/data-provider/TelemetryErrorSeverity';
import { LocaleManager } from '../../shared/LocaleManager';

/* required for ie11... this will enable most of the Array.find functionality on that browser */
import { polyfillArrayFind } from '../../shared/ArrayFindShim';
polyfillArrayFind();

/** Styles */
import '../../../styles/shared/MainPage.less';
import '../../../styles/compute/ComputeMaps.less';

const AtScaleMapQueryName: string = 'AtScaleMapQueryName';

export interface IAtScaleMapInitMessage {
    atScaleBladeParameters?: BladeParameters.AtScaleVmInsightsBladeParams;
    authHeaderValue: string;
    azureCloudType: AzureCloudType;
    callerBlade: string;
    correlationId: string;
    defaultSelectedDateTime: TimeData;
    featureFlags: StringMap<boolean>;
    iframeId: string;
    language: string;
    localeStrings: string;
    // TODO andrewki: remove this from blade as well
    sequenceNumber: number;
    subscriptionList: ISubscriptionInfo[];
    version: number;
    vmssBladeParameters?: BladeParameters.VmScaleSetInsightsBladeParams;
    workspaceList: IWorkspaceInfo[];
}

export interface IAtScaleComputeMapPageProps { }

export interface IInitialComputerAndGroupState {
    selectedHybridWorkspace: IWorkspaceInfo;
    selectedComputerGroup: ComputerGroup;
    selectedComputer: IComputerInfo;
    computers: IComputerInfo[];
    computerGroups: ComputerGroup[];
    resourceId: string;
}

export interface IAtScaleComputeMapPageState extends IInitialComputerAndGroupState {
    /**
    * Type of solution for which VmInsights is used.
    * Allowed values are Azure and Hybrid
    */
    solutionType: SolutionType;
    isAuthorizationInfoReceived: boolean;
    selectedAzureWorkspace: IWorkspaceInfo;
    azureWorkspaceList: IWorkspaceInfo[];
    dateTime: TimeData;
    sequenceNumber: number;
    isDarkMode: boolean;
    computerGroupsLoaded: boolean;
    computersLoaded: boolean;
    subscriptionList: ISubscriptionInfo[];
    selectedSubscription: ISubscriptionInfo;
    selectedResourceGroup: ResourceInfo;
    resourceGroups: ResourceInfo[];
    selectedAzureResource: ResourceInfo;
    azureResources: ResourceInfo[];
    selectedResourceType: VmInsightsResourceType;
    onboardingState: OnboardingState;
    selectedVmssInstance: ResourceInfo;
    vmssInstances: ResourceInfo[];
    updateComponent: boolean;
    vmssResourceId: string;
    language: string;
}

const TelemetryEventsPrefix: string = 'Compute.AtScale{0}.Map';

/**
 * Scale Map, contains workspace, group, computers, time range drop down selection
 * Will render map based on selection.
 */
export class AtScaleComputeMapPage extends React.Component<IAtScaleComputeMapPageProps, IAtScaleComputeMapPageState> {
    private bodyTheme: string;
    private messagingProvider = new msg.MessagingProvider(new AppInsightsProvider());
    private telemetry: ITelemetry;

    private completedMapRendering: boolean = false;
    private sentFinishedLoading: boolean = false;
    // workspaceManager used to sync with wlm workspaceManager. After message.isLoaded from wlm == true, the sync is done.
    // and workspaceManager is not useful.
    private workspaceManager: WorkspaceListManager;
    private featureFlags: StringMap<boolean>;
    private loadCompleted: boolean = false;
    private telemetryEventsPrefix: string;
    private readonly supportedResourceTypes: Array<VmInsightsResourceType> = [
        VmInsightsResourceType.All,
        VmInsightsResourceType.VirtualMachine,
        VmInsightsResourceType.VirtualMachineScaleSet,
        VmInsightsResourceType.AzureArcMachine
    ];

    constructor(props?: IAtScaleComputeMapPageProps) {
        super(props);

        this.telemetry = VmInsightsTelemetryFactory.get(TelemetryMainArea.Maps);
        this.telemetryEventsPrefix = TelemetryEventsPrefix.replace('{0}', UrlParameterHelper.getEventSource());
        (window as any).computeMapsInsights.performanceMeasures['frame_constructor'] = Date.now();

        this.mapsComputerIdChanged = this.mapsComputerIdChanged.bind(this);
        this.onHybridControlPanelSelectionsChanged = this.onHybridControlPanelSelectionsChanged.bind(this);
        this.onMapComputationStarted = this.onMapComputationStarted.bind(this);
        this.onMapComputationCompleted = this.onMapComputationCompleted.bind(this);
        this.onComputerListIsLoaded = this.onComputerListIsLoaded.bind(this);
        this.onGroupsLoaded = this.onGroupsLoaded.bind(this);
        this.onSolutionTypeChanged = this.onSolutionTypeChanged.bind(this);
        this.onAzureControlPanelSelectionsChanged = this.onAzureControlPanelSelectionsChanged.bind(this);
        this.onResourceGroupsLoaded = this.onResourceGroupsLoaded.bind(this);
        this.onAzureWorkspacesLoaded = this.onAzureWorkspacesLoaded.bind(this);
        this.onAzureResourceLoaded = this.onAzureResourceLoaded.bind(this);
        this.onVmssInstancesLoaded = this.onVmssInstancesLoaded.bind(this);
        this.mapComputerIdChangedExternal = this.mapComputerIdChangedExternal.bind(this);

        this.workspaceManager = new WorkspaceListManager();

        const dateTime = { options: {}, relative: { duration: TimeValues.Last30Minutes } };

        this.state = {
            isAuthorizationInfoReceived: false,
            dateTime: dateTime,
            selectedComputerGroup: null,
            selectedComputer: null,
            selectedAzureWorkspace: null,
            selectedHybridWorkspace: null,
            sequenceNumber: -1,
            isDarkMode: false,
            computers: null,
            computerGroups: null,
            computerGroupsLoaded: false,
            computersLoaded: false,
            resourceId: null,
            subscriptionList: [],
            selectedSubscription: undefined,
            resourceGroups: [defaultResourceGroupInfo],
            selectedResourceGroup: undefined,
            selectedAzureResource: undefined,
            selectedResourceType: undefined,
            solutionType: undefined,
            onboardingState: undefined,
            selectedVmssInstance: defaultVmssInstance,
            vmssInstances: [],
            azureResources: [],
            azureWorkspaceList: [],
            updateComponent: false,
            // TODO ak: see if we can use `resourceId`
            vmssResourceId: undefined,
            language: undefined
        };

        this.onMapRenderCompleted = this.onMapRenderCompleted.bind(this);
        this.getGroupType = this.getGroupType.bind(this);
        this.messagingProvider.registerProcessor(msg.InitAtScaleComputeMapMessageProcessorType, this.onInit.bind(this));
        this.messagingProvider.registerProcessor(msg.LoadCompleteMessageProcessorType, this.onLoadComplete.bind(this));
        this.messagingProvider.registerProcessor(msg.RefreshMessageProcessorType, this.onRefresh.bind(this));
        this.messagingProvider.registerProcessor(msg.MapCustomMessageProcessorType, this.onUpdateContext.bind(this));
        this.messagingProvider.registerProcessor(msg.ArmTokenMessageProcessorType, this.onArmTokenReceived.bind(this));
        this.messagingProvider.registerProcessor(msg.StyleThemingMessageProcessorType, this.onStyleThemeInit.bind(this));
        this.messagingProvider.registerProcessor(msg.SubscriptionListUpdateMessageProcessorType, this.subscriptionListUpdate.bind(this));

        //tell Ibiza this map component is ready to recevice message.
        this.messagingProvider.startMessaging(msg.VmInsightsIFrameIds.AtScaleComputeMap);

        LocaleManager.Instance().setupLocale();

        LocaleStringsHandler.Instance().onTranslation(() => {
            WorkbookTemplates.initialize();
        });
    }

    /**
     * Returns the ComputerGroup for the selected groupId
     * @param groups
     * @param groupId
     * @return ComputerGroup
     */
    private static getComputerGroup(groups: ComputerGroup[], groupId: string): ComputerGroup | undefined {
        if (!groupId || !groups) {
            return undefined;
        }

        return groups.find((group) => group.id.toUpperCase() === groupId.toUpperCase());
    }

    /**
     * Returns the computer for the selected computerId
     * @param computers
     * @param computerId
     * @return IComputerInfo
     */
    private static getComputer(computers: IComputerInfo[], computerId: string): IComputerInfo | undefined {
        if (!computerId || !computers) {
            return undefined;
        }

        return computers.find((computer) => computer.id.toUpperCase() === computerId.toUpperCase());
    }

    public shouldComponentUpdate(nextProps: IAtScaleComputeMapPageProps, nextState: IAtScaleComputeMapPageState) {
        this.telemetry.setContext({
            onboardingState: JSON.stringify(nextState.onboardingState)
        }, false);
        this.updateTelemetryContext(nextState);
        return true;
    }

    public componentDidUpdate(prevProps: IAtScaleComputeMapPageProps, prevState: IAtScaleComputeMapPageState) {
        if (this.state.updateComponent) {
            this.setState({
                updateComponent: false
            });
        }
    }

    public render(): JSX.Element {
        // wait until authorization information is received from the framework
        if (!this.state.isAuthorizationInfoReceived) {
            return <div className='MainPage-root'>
                <div className='center-flex'>
                    <span className='loading-icon-main'><LoadingSvg /></span>
                </div>
            </div>;
        }
        const onboardingState: OnboardingState = this.state.solutionType === SolutionType.Azure && this.state.onboardingState;
        return (
            <div className='MainPage-root compute-mainpage-root'>
                <BasicMapComponent
                    controlBar={this.getControlPanel()}
                    mapParams={this.getSelectedMapParameters()}
                    workspace={this.getSelectedWorkspace()}
                    dateTime={this.state.dateTime}
                    computers={this.state.computers}
                    messagingProvider={this.messagingProvider}
                    telemetry={this.telemetry}
                    logPath={this.telemetryEventsPrefix}
                    mapComputerIdChanged={this.mapComputerIdChangedExternal}
                    mapQueryName={AtScaleMapQueryName}
                    onMapComputationStarted={this.onMapComputationStarted}
                    onMapComputationCompleted={this.onMapComputationCompleted}
                    hasNoComputers={this.showNoServiceMapComputersMessage()}
                    featureFlags={this.featureFlags}
                    getGroupType={this.getGroupType}
                    onboardingState={onboardingState}
                    isDarkMode={this.state.isDarkMode}
                    quicklinksDisplaySettings={{
                        showConnectionWorkbookLink: true,
                        showMapLink: false,
                        showPerfViewLink: true,
                        showResourceLink: true
                    }}
                    forceUpdate={this.state.updateComponent}
                    language={this.state.language}
                    apiRequestInfo={{
                        bladeName: this.state.vmssResourceId ? ApiClientRequestInfoBladeName.Vmss : ApiClientRequestInfoBladeName.AtScale,
                        queryName: undefined,
                        isInitialBladeLoad: false
                    }}
                />
            </div>
        );
    }

    private getControlPanel(): JSX.Element {
        let scopeSelector: JSX.Element;
        if (this.state.solutionType === SolutionType.Hybrid) {
            scopeSelector = <ScaleControlPanel
                selectedWorkspace={this.getSelectedWorkspace()}
                workspaceList={this.workspaceManager.getOrderedList()}
                selectedComputer={this.state.selectedComputer}
                selectedComputerGroup={this.state.selectedComputerGroup}
                vmScaleSetResourceId={this.state.vmssResourceId}
                messagingProvider={this.messagingProvider}
                dateTime={this.state.dateTime}
                onSelectionsChanged={this.onHybridControlPanelSelectionsChanged}
                telemetry={this.telemetry}
                logPrefix={this.telemetryEventsPrefix}
                workspaceManager={this.workspaceManager}
                timeValidation={TimeUtils.notMoreThanOneHourApart}
                supportedTimes={Constants.SupportedMapTimes}
                onComputersLoaded={this.onComputerListIsLoaded}
                onComputerGroupsLoaded={this.onGroupsLoaded}
                computerGroupType={ComputerGroupType.ServiceMapMachineGroup}
                featureFlags={this.featureFlags}
                displaySetting={this.isVmss() ? {
                    showWorkspaceDropDown: false,
                    showGroupDropDown: false,
                    showComputerDropDown: true,
                    showWorkbookDropDown: true,
                    showSwitchToggle: false
                }
                    : {
                        showWorkspaceDropDown: true,
                        showGroupDropDown: true,
                        showComputerDropDown: true,
                        showWorkbookDropDown: true,
                        showSwitchToggle: true
                    }}
                onSolutionTypeChanged={this.onSolutionTypeChanged}
                forceUpdate={this.state.updateComponent}
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
                supportedTimes={Constants.SupportedMapTimes}
                featureFlags={this.featureFlags}
                onResourceGroupsLoaded={this.onResourceGroupsLoaded}
                onVmssInstancesLoaded={this.onVmssInstancesLoaded}
                onSolutionTypeChanged={this.onSolutionTypeChanged}
                selectedWorkspace={this.getSelectedWorkspace()}
                onWorkspacesLoaded={this.onAzureWorkspacesLoaded}
                // TODO ak: rework this logic, put it inside component
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
                        enableWorkspaceDropDown: true,
                        enableResourceDropDown: true,
                        enableResourceTypeDropDown: true,
                        enableVmssInstanceDropdown: true,
                        enableWorkbookDropDown: true,
                        enableSwitchToggle: true
                    }}
                supportedResourceTypes={this.supportedResourceTypes}
                selectedResourceType={this.state.selectedResourceType}
                selectedResource={this.state.selectedAzureResource}
                selectedVmssInstance={this.state.selectedVmssInstance}
                onResourcesLoaded={this.onAzureResourceLoaded}
                resourceGroups={this.state.resourceGroups}
                resources={this.state.azureResources}
                workspaces={this.state.azureWorkspaceList}
                vmssInstances={this.state.vmssInstances}
                forceUpdate={this.state.updateComponent}
            />
        }

        return scopeSelector;
    }

    // We have below cases to determine map type.
    // 1. If the selectedComputer is available and Solutiontype is Hybrid then return the computer
    // 2. If the selectedComputerGroup is available and Solutiontype is Hybrid then return the computerGroup
    // 3. If the solutionType is Azure and selectedResourceType is computer then return the selectedResource
    // 4. If the solutionType is Azure and resourceType is all then return Subscription/ResourceGroup or selectedWorkspace
    // based on number of workspaces in selected azure scope.
    private getSelectedMapParameters(): MapParams {
        let mapId: string;
        let mapDisplayName: string;
        let mapType: MapType;
        let mapResourceType: MapResourceType;
        let mapResource: ComputerGroup | IComputerInfo | IResourceInfo;
        // ak: for vmss, we always assume it is hybrid mode
        if (this.state.solutionType === SolutionType.Hybrid || this.isVmss()) {
            if (this.isVmss() && this.state.resourceId) {
                let resourceDescriptor: IAzureResourceDescriptor = AtScaleUtils.getAzureComputeResourceDescriptor(this.state.resourceId);
                if (resourceDescriptor && resourceDescriptor.type) {
                    const isVmss: boolean = resourceDescriptor.type.toLowerCase() === 'microsoft.compute/virtualmachinescalesets';
                    const displayName = resourceDescriptor.resources && resourceDescriptor.resources.length > 0
                        && resourceDescriptor.resources[0];
                    mapId = this.state.resourceId;
                    mapType = isVmss ? MapType.groupmap : MapType.singlevmmap;
                    mapDisplayName = displayName;
                    mapResource = {
                        id: this.state.resourceId,
                        type: isVmss ? VmInsightsResourceType.VirtualMachineScaleSet : VmInsightsResourceType.VirtualMachine,
                        displayName: displayName,
                        fqdn: displayName,
                        location: undefined
                    };
                    mapResourceType = MapResourceType.azureResource;
                }
            } else if (this.state.selectedComputer && this.state.selectedComputer.id) {
                mapId = this.state.selectedComputer.id;
                mapDisplayName = this.state.selectedComputer.displayName;
                mapType = MapType.singlevmmap;
                mapResource = this.state.selectedComputer;
                mapResourceType = MapResourceType.serviceMapComputer;
            } else if (this.state.selectedComputerGroup && this.state.selectedComputerGroup.id) {
                mapId = this.state.selectedComputerGroup.id;
                mapDisplayName = this.state.selectedComputerGroup.displayName
                mapType = MapType.groupmap;
                mapResource = this.state.selectedComputerGroup;
                mapResourceType = MapResourceType.serviceMapGroup;
            }
        } else {
            // TODO ak: make `ResourceInfo` consistent everywhere
            const selectedAzureResource: ResourceInfo = new ResourceInfo(this.getSelectedAzureResource());

            // ak: only procure mapId with valid resource type and resource combo
            if (this.isValidResourceTypeAndSelectedResource(selectedAzureResource)) {
                mapId = selectedAzureResource && selectedAzureResource.id;
                mapDisplayName = this.getSelectedAzureResourceDisplayName();
                mapType = this.getSelectedAzureResourceMapType();
                mapResource = selectedAzureResource;
                mapResourceType = MapResourceType.azureResource;
            }
        }

        return {
            mapId,
            mapDisplayName,
            mapType,
            resourceType: mapResourceType,
            resource: mapResource
        }
    }

    /**
     * Due to limitation of Service Map API, if a resource type is not 'All', then we need to force
     * the user to select a resource. In other words, we cannot generate a map consisting of just a
     * particular resource type.
     *
     * @private
     * @param {IResourceInfo} selectedAzureResource
     * @returns {boolean}
     * @memberof AtScaleComputeMapPage
     */
    private isValidResourceTypeAndSelectedResource(selectedAzureResource: IResourceInfo): boolean {
        return !!selectedAzureResource
            && (((this.state.selectedResourceType !== VmInsightsResourceType.All)
                && (selectedAzureResource.type === VmInsightsResourceType.VirtualMachine
                    || selectedAzureResource.type === VmInsightsResourceType.VirtualMachineScaleSet
                    || selectedAzureResource.type === VmInsightsResourceType.VmScaleSetInstance
                    || selectedAzureResource.type === VmInsightsResourceType.AzureArcMachine))
                || (this.state.selectedResourceType === VmInsightsResourceType.All));
    }

    /**
     * In AtScale Map Hybrid mode, if the selected workspace does not have any computers then return true.
     */
    private showNoServiceMapComputersMessage(): boolean {
        return this.state.solutionType === SolutionType.Hybrid
            && this.state.computersLoaded
            && (!this.state.computers || this.state.computers.length === 0);
    }

    /**
     * Returns selectedWorkspace based on solutionType
     */
    private getSelectedWorkspace(): IWorkspaceInfo {
        if (this.state.solutionType === SolutionType.Azure) {
            return this.state.selectedAzureWorkspace;
        } else {
            return this.state.selectedHybridWorkspace;
        }
    }

    /**
     * Returns selected ResourceId based on solution type and selected resourceType.
     */
    private getSelectedAzureResource(): IResourceInfo {
        if (this.state.solutionType === SolutionType.Hybrid) {
            return null;
        }
        // Solution type is Azure.
        if (this.state.selectedVmssInstance && this.state.selectedVmssInstance.id
            && this.state.selectedVmssInstance.id.toUpperCase() !== 'all'.toUpperCase() && this.state.selectedAzureResource
            && this.state.selectedAzureResource.type === VmInsightsResourceType.VirtualMachineScaleSet) {
            // Return VMSSInstance Id if there is a selected VMSS instance.
            return this.state.selectedVmssInstance;
        }
        return this.state.selectedAzureResource;
    }

    /**
     * Returns selectedResource's displayName.
     * We need to handle special case for VMSS Instance.
     */
    private getSelectedAzureResourceDisplayName(): string {
        if (this.state.solutionType === SolutionType.Hybrid) {
            return null;
        }

        if (this.state.selectedVmssInstance && this.state.selectedVmssInstance.id
            && this.state.selectedVmssInstance.id.toUpperCase() !== 'all'.toUpperCase() && this.state.selectedAzureResource
            && this.state.selectedAzureResource.type === VmInsightsResourceType.VirtualMachineScaleSet) {
            // Return VMSSInstance Id if there is a selected VMSS instance.
            return this.state.selectedVmssInstance.displayName;
        }
        // If the selectedResourceType is 'all' and the selectedSubscription/ResourceGroup
        // has one or more workspace then set the mapDisplayName to Subscription/ResourceGroup.
        return this.state.selectedAzureResource && this.state.selectedAzureResource.displayName;
    }

    /**
     * Returns mapType.
     * If the selected resource is either VM or VMSSInstance then returns SingleVMMap
     * Else returns groupMap.
     */
    private getSelectedAzureResourceMapType(): MapType {
        if (this.state.solutionType === SolutionType.Hybrid) {
            return null;
        }

        if (this.state.selectedVmssInstance && this.state.selectedVmssInstance.id
            && this.state.selectedVmssInstance.id !== 'all' && this.state.selectedAzureResource
            && this.state.selectedAzureResource.type === VmInsightsResourceType.VirtualMachineScaleSet) {
            // Return VMSSInstance Id if there is a selected VMSS instance.
            return MapType.singlevmmap;
        }
        if (this.state.selectedAzureResource
            && (this.state.selectedAzureResource.type === VmInsightsResourceType.VirtualMachine
                || this.state.selectedAzureResource.type === VmInsightsResourceType.VmScaleSetInstance
                || this.state.selectedAzureResource.type === VmInsightsResourceType.AzureArcMachine)) {
            return MapType.singlevmmap;
        }

        return MapType.groupmap;
    }

    /**
     * measures have sequenceNumber and frame_name. We use frame_name to identify to which IFrame these telemetry measures belong to.
     * We need this field since Map and Perf both are sending onLoadComplete and both messages are coming to this callback.
     */
    private onLoadComplete(data: any): void {
        if (!data || !data.metrics || !data.customProperties || this.loadCompleted) {
            return;
        }
        if (data.customProperties.frame_name && data.customProperties.frame_name === AtScaleMapQueryName) {
            let eventName = `${this.telemetryEventsPrefix}.IFrameLoadMeasure`;
            TelemetryUtils.onLoadComplete((window as any).computeMapsInsights.performanceMeasures, data.metrics,
                this.telemetry, eventName, data.customProperties);
        }
        this.loadCompleted = true;
    }


    /**
     * Call sendFinishedLoading if we can and should, that is if map and computers+groups queries completed and we have not already sent
     */
    private sendFinishedLoading() {
        // If neither computer nor group is selected initially
        // then do not send finishedLoading message since we are not loading any data in IFrame.
        if (this.loadCompleted || (!this.state.selectedComputer && !this.state.selectedComputerGroup)) {
            return;
        }

        if (!this.sentFinishedLoading && this.completedMapRendering) {
            (window as any).computeMapsInsights.performanceMeasures['frame_sendFinishedLoading'] = Date.now();
            this.messagingProvider.sendFinishedLoading({
                networkQueryName: AtScaleMapQueryName,
                metrics: (window as any).computeMapsInsights.performanceMeasures
            });
            this.sentFinishedLoading = true;
        }
    }

    /**
     * Mark the map rendering as completed and check if we can send finished loading
     */
    private onMapRenderCompleted(): void {
        this.completedMapRendering = true;
        this.sendFinishedLoading();
    }

    /**
     * Callback to be invoked when child component triggers map computation
     */
    private onMapComputationStarted(): void {
        if (!this.completedMapRendering) {
            (window as any).computeMapsInsights.performanceMeasures['frame_mapComputationStarted'] = Date.now();
        }
    }

    /**
     * Callback to be invoked when mapComputation is completed.
     */
    private onMapComputationCompleted(): void {
        if (!this.completedMapRendering) {
            (window as any).computeMapsInsights.performanceMeasures['frame_mapComputationCompleted'] = Date.now();
        }
        this.onMapRenderCompleted();
    }

    /**
     * This method is called whenever user wants to load a specific machine's map from a group Map
     * or load map of a clientGroup or serverGroup member.
     * WorkspaceId will not be changed. Only computerId will be changed.
     * Set computerGroup Id to undefined.
     */
    private mapsComputerIdChanged(newState: IAtScaleComputeMapPageState, id: string): void {
        const selectedComputer: IComputerInfo | undefined = AtScaleComputeMapPage.getComputer(this.state.computers, id);

        newState.selectedComputer = selectedComputer;
        newState.selectedComputerGroup = null;
        newState.resourceId = null;

        if (!!selectedComputer) {
            const computer: BladeParameters.SelectedEntity = {
                name: selectedComputer.displayName,
                id: selectedComputer.id,
                resourceId: selectedComputer.azureResourceId
            };
            this.messagingProvider.sendUpdatedScopeSelections({
                scopes: {
                    hybrid: {
                        workspace: this.state.selectedHybridWorkspace,
                        computer
                    }
                }
            });
        }
    }

    /**
     * This method is invoked if displayed map Id is changed by other component.
     * @private
     * @param {string} id
     * @memberof AtScaleComputeMapPage
     */
    private mapComputerIdChangedExternal(id: string): void {
        const newState: IAtScaleComputeMapPageState = $.extend({}, this.state);
        this.mapsComputerIdChanged(newState, id);
        this.setState(newState);
    }

    /**
     * Refreshes the map. Last 30 minutes, for instance, would be the last 30 minutes from now.
     */
    private onRefresh() {
        this.setState({
            updateComponent: true
        });
    }

    private onComputerListIsLoaded(computers: IComputerInfo[]): void {
        this.setState({
            computers,
            computersLoaded: true
        });
    }

    private onGroupsLoaded(computerGroups: ComputerGroup[]): void {
        this.setState({
            computerGroups,
            computerGroupsLoaded: true
        });
    }

    private onResourceGroupsLoaded(resourceGroups: ResourceInfo[]) {
        this.setState({
            resourceGroups
        });
    }

    private onVmssInstancesLoaded(vmssInstances: ResourceInfo[]) {
        this.setState({
            vmssInstances
        });
    }

    private onSolutionTypeChanged(solutionType: string): void {
        this.telemetry.logEvent(`${this.telemetryEventsPrefix}.SolutionTypeChanged`, {
            solutionType
        }, {});

        const newState = $.extend({}, this.state);
        newState.solutionType = solutionType === 'hybrid' ? SolutionType.Hybrid : SolutionType.Azure;
        newState.selectedComputer = undefined;
        newState.selectedComputerGroup = undefined;

        this.setState(newState);
        // Post solutionType to Blade
        this.messagingProvider.sendVmInsightsSolutionType(solutionType);
    }

    /**
     * This callback is invoked whenever azure resource is changed.
     * If there is only one workspace for the given resource then we make that workspace as selectedWorkspace
     * If there are no workspaces available for the selected resource, then we show onboarding message.
     * @param workspaceList
     */
    private onAzureWorkspacesLoaded(workspaceList: IWorkspaceInfo[]): void {
        // Make first workspace as selectedWorkspace
        const selectedWorkspace: IWorkspaceInfo = workspaceList && workspaceList.length > 0 && workspaceList[0];

        // If the selectedResource has no active workspaces
        // Then, launch Onbaording blade.
        if ((this.state.selectedAzureResource && this.state.selectedAzureResource.id)
            && (!workspaceList || workspaceList.length === 0)) {
            this.messagingProvider.sendOpenOnboardingPane(this.state.selectedAzureResource.id);
        }

        this.setState({
            onboardingState: {
                atscale: {
                    isOnboarded: (workspaceList && workspaceList.length > 0)
                }
            },
            selectedAzureWorkspace: selectedWorkspace,
            azureWorkspaceList: workspaceList
        });
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

    /**
     * handle the selection change from the control bar
     * we except four type of changes: workspace, group, computer, time
     * @param selections
     */
    private onHybridControlPanelSelectionsChanged(selections: IScaleControlPanelSelections): void {
        const newState: IAtScaleComputeMapPageState = $.extend({}, this.state);
        switch (selections.type) {
            case HybridControlPanelDropDownType.workspace:
                // workspace change, clear out computerlist and group list, and make call for them
                newState.selectedHybridWorkspace = selections.selectedWorkspace;
                newState.selectedComputer = null;
                newState.selectedComputerGroup = null;
                newState.computerGroups = [];
                newState.computers = [];
                newState.computerGroupsLoaded = false;
                newState.computersLoaded = false;
                this.messagingProvider.sendUpdatedScopeSelections({
                    scopes: {
                        hybrid: {
                            workspace: selections.selectedWorkspace
                        }
                    }
                });
                break;
            case HybridControlPanelDropDownType.group:
                const selectedComputerGroup: ComputerGroup | undefined
                    = AtScaleComputeMapPage.getComputerGroup(this.state.computerGroups, selections.selectedGroupId);

                //clear out computer drop down selection
                newState.selectedComputer = null;
                newState.selectedComputerGroup = selectedComputerGroup;
                newState.resourceId = null;

                if (!!selectedComputerGroup) {
                    // TODO ak: carry over serialized computer group typings to bladeparameters
                    const computerGroup: SerializedComputerGroup
                        = ComputerGroupSerialization.getComputerGroupSerialization(selectedComputerGroup);
                    this.messagingProvider.sendUpdatedScopeSelections({
                        scopes: {
                            hybrid: {
                                workspace: selections.selectedWorkspace,
                                computerGroup: computerGroup as BladeParameters.SerializedComputerGroup
                            }
                        }
                    });
                }
                break;

            case HybridControlPanelDropDownType.computer:
                // We use same ControlPanel in VMSS IFrame and AtScaleHybrid IFrame.
                // In VMSS Iframe, if the selected resource is of VMSS Id then set the state.resourceId with selected
                // VMSSId. Otherwise set the state.selectedComputer with selected Id.
                if (this.isVmss() && selections.selectedComputerId
                    && this.state.vmssResourceId?.toLowerCase() === selections.selectedComputerId?.toLowerCase()) {
                    const vmssResourceDescriptor = AtScaleUtils.getAzureComputeResourceDescriptor(selections.selectedComputerId);

                    if (vmssResourceDescriptor && vmssResourceDescriptor.resources) {
                        newState.resourceId = selections.selectedComputerId;
                        newState.selectedComputer = {
                            displayName: vmssResourceDescriptor.resources[0],
                            id: selections.selectedComputerId,
                            computerName: ''
                        };
                        newState.selectedComputerGroup = undefined;

                        const computer: BladeParameters.SelectedEntity = {
                            name: vmssResourceDescriptor.resources[0],
                            id: selections.selectedComputerId
                        };
                        this.messagingProvider.sendUpdatedScopeSelections({
                            scopes: {
                                hybrid: {
                                    workspace: selections.selectedWorkspace,
                                    computer
                                }
                            }
                        });
                    }
                } else {
                    this.mapsComputerIdChanged(newState, selections.selectedComputerId);
                }
                break;
            case HybridControlPanelDropDownType.time:
                newState.dateTime = selections.selectedTimeRange;
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
        const newState: IAtScaleComputeMapPageState = $.extend({}, this.state);
        let selectedAzureResource: ResourceInfo;
        switch (selections.type) {
            case AzureControlPanelDropDownType.subscription:
                selectedAzureResource = new ResourceInfo({
                    id: selections.selectedSubscription.subscriptionId,
                    displayName: selections.selectedSubscription.displayName,
                    type: VmInsightsResourceType.Subscription
                });

                newState.selectedSubscription = selections.selectedSubscription;
                newState.selectedAzureResource = selectedAzureResource;
                newState.selectedResourceGroup = defaultResourceGroupInfo;
                newState.selectedAzureWorkspace = undefined;
                newState.selectedVmssInstance = defaultVmssInstance;

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
                newState.selectedAzureWorkspace = undefined;
                newState.selectedVmssInstance = defaultVmssInstance;

                if (selections.selectedResourceGroup && selections.selectedResourceGroup.id) {
                    this.messagingProvider.sendUpdatedScopeSelections({
                        scopes: {
                            azure: {
                                resourceGroup: selections.selectedResourceGroup.toJSON()
                            }
                        }
                    });
                }
                break;

            case AzureControlPanelDropDownType.workspace:
                newState.selectedAzureWorkspace = selections.selectedWorkspace
                // TODO ak: clarify if we need azure workspace concept and add it to blade config
                break;

            case AzureControlPanelDropDownType.resourceType:
                selectedAzureResource = AtScaleUtils.getSelectedAzureResource(this.state.selectedSubscription,
                    this.state.selectedResourceGroup);

                newState.selectedResourceType = selections.selectedResourceType;
                newState.selectedAzureResource = selectedAzureResource;
                newState.selectedAzureWorkspace = undefined;
                newState.selectedVmssInstance = defaultVmssInstance;
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
                newState.selectedAzureWorkspace = undefined;
                newState.selectedVmssInstance = defaultVmssInstance;

                this.messagingProvider.sendUpdatedScopeSelections({
                    scopes: {
                        azure: {
                            subscription: this.state.selectedSubscription,
                            resourceGroup: this.state.selectedResourceGroup && this.state.selectedResourceGroup.toJSON(),
                            resource: selections.selectedResource.toJSON()
                        }
                    }
                });
                break;
            case AzureControlPanelDropDownType.vmssInstance:
                if (!selections.selectedVmssInstance) {
                    return;
                }
                newState.selectedVmssInstance = selections.selectedVmssInstance;
                break;
            case AzureControlPanelDropDownType.time:
                newState.dateTime = selections.selectedTimeRange;
                break;
            default:
                throw 'Unexpected azure control panel dropdown selection type'
        }
        this.setState(newState);
    }

    private onInit(data: IAtScaleMapInitMessage) {
        if (!data) {
            return;
        }

        // Set the cloud in our environment config
        if (!EnvironmentConfig.Instance().isConfigured()) {
            EnvironmentConfig.Instance().initConfig(data.azureCloudType, EnvironmentConfig.Instance().isMPACLegacy());
        }

        this.featureFlags = data.featureFlags;

        this.telemetry.setContext({
            callerBlade: data.callerBlade,
            correlationId: data.correlationId
        }, false);

        const newState: IAtScaleComputeMapPageState = $.extend({}, this.state);
        newState.language = data.language;
        if (!this.state.isAuthorizationInfoReceived) {
            // one time initialization
            if (data.defaultSelectedDateTime) {
                TimeUtils.reconstructAbsoluteDates(data.defaultSelectedDateTime);
                if (!isTimeDataEqual(data.defaultSelectedDateTime, this.state.dateTime)) {
                    if (TimeUtils.canUseTimeData(data.defaultSelectedDateTime,
                        Constants.SupportedMapTimes,
                        TimeUtils.notMoreThanOneHourApart)) {
                        newState.dateTime = data.defaultSelectedDateTime;
                    }
                }
            }
        }

        this.updateAuthorizationHeader(data.authHeaderValue);

        const subscriptionList: ISubscriptionInfo[] = data.subscriptionList;
        const workspaceList: IWorkspaceInfo[] = data.workspaceList;

        if (!!data.atScaleBladeParameters && !!data.atScaleBladeParameters.scopeSelections) {
            // TODO ak: return states to set, set it end of this method
            this.processAtScaleBladeParameters(data.atScaleBladeParameters.scopeSelections,
                subscriptionList,
                workspaceList,
                newState);
        }

        if (!!data.vmssBladeParameters) {
            this.processVmssBladeParameters(data.vmssBladeParameters, newState);
        }
        this.setState(newState);
    }

    private processAtScaleBladeParameters(scopeSelections: BladeParameters.ScopeSelections, subscriptionList: ISubscriptionInfo[],
        workspaceList: IWorkspaceInfo[],
        newState: IAtScaleComputeMapPageState): void {

        const solutionType: SolutionType = (scopeSelections?.solutionType as SolutionType) || SolutionType.Azure;

        const newDateTime: TimeData = (scopeSelections?.timeRange?.performanceTab || this.state.dateTime) as TimeData;

        /* hybrid */
        const hybridScopeSelections: BladeParameters.HybridScopes = scopeSelections?.scopes?.hybrid || {};
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

        const updatedWorkspace: IWorkspaceInfo = AtScaleUtils.syncLocalWorkspaceManager(localWorkspaceManagerParams);
        if (!!updatedWorkspace && !!scopeSelections) {
            this.setMapWorkspaceComputerAndGroup(
                'initMapState',
                updatedWorkspace,
                hybridScopeSelections.computer,
                hybridScopeSelections.computerGroup,
                true,
                newState
            );
        }

        /* azure */
        const azureScopeSelections: BladeParameters.AzureScopes = scopeSelections?.scopes?.azure || {};
        const selectedSubscription: ISubscriptionInfo = azureScopeSelections.subscription;

        let selectedResourceGroup: ResourceInfo = defaultResourceGroupInfo;
        const resourceGroup: BladeParameters.IResourceInfo = azureScopeSelections.resourceGroup;
        if (resourceGroup && resourceGroup.id && resourceGroup.displayName) {
            selectedResourceGroup = new ResourceInfo({
                id: resourceGroup.id,
                displayName: resourceGroup.displayName,
                type: VmInsightsResourceType.ResourceGroup
            });
        }

        const resource: BladeParameters.IResourceInfo = azureScopeSelections.resource;

        let selectedAzureResource = this.getDefaultSelectedAzureResource(selectedSubscription,
            selectedResourceGroup, resource);
        let selectedResourceType: VmInsightsResourceType = VmInsightsResourceType[azureScopeSelections.resourceType]
            || this.supportedResourceTypes[0];
        let selectedVmssInstance: ResourceInfo;

        // Handle VMSSInstance.
        // If the passed resource is VMSSInstance, then make selected resource as VMSS
        // and assign this.state.selectedVMSSInstance with given input resource
        if (selectedAzureResource && selectedAzureResource.type === VmInsightsResourceType.VmScaleSetInstance) {
            const vmssInstanceDescriptor = AtScaleUtils.getAzureComputeResourceDescriptor(selectedAzureResource.id);
            const vmssId = '/subscriptions/' + vmssInstanceDescriptor.subscription + '/resourceGroups/'
                + vmssInstanceDescriptor.resourceGroup
                + '/providers/microsoft.compute/virtualmachinescalesets/' + vmssInstanceDescriptor.resources[0];
            const vmssName = vmssInstanceDescriptor.resources[0];
            const vmssResourceInfo: ResourceInfo = new ResourceInfo({
                id: vmssId,
                displayName: vmssName,
                type: VmInsightsResourceType.VirtualMachineScaleSet
            });
            selectedVmssInstance = selectedAzureResource;
            selectedAzureResource = vmssResourceInfo;
            selectedResourceType = VmInsightsResourceType.VirtualMachineScaleSet;
        }

        /* new state */
        newState.solutionType = solutionType;
        newState.subscriptionList = subscriptionList;
        newState.selectedSubscription = selectedSubscription;
        newState.selectedResourceGroup = selectedResourceGroup;
        newState.selectedAzureResource = selectedAzureResource;
        newState.selectedVmssInstance = selectedVmssInstance;
        newState.selectedResourceType = selectedResourceType;
        newState.solutionType = solutionType;
        newState.dateTime = newDateTime;

        // Clear selectedAzureWorkspace if the new azureResourceId is different than current azureResourceId.
        if (selectedAzureResource?.id?.toLowerCase() !== this.state.selectedAzureResource?.id?.toLowerCase()) {
            newState.selectedAzureWorkspace = undefined;
        }
    }

    /**
     * Force solution type to hybrid mode for VMSS
     *
     * @private
     * @param {BladeParameters.VmScaleSetInsightsBladeParams} data
     * @param {IAtScaleComputeMapPageState} newState
     * @memberof AtScaleComputeMapPage
     */
    private processVmssBladeParameters(data: BladeParameters.VmScaleSetInsightsBladeParams, newState: IAtScaleComputeMapPageState): void {
        if (data.vmScaleSetResourceId) {
            newState.vmssResourceId = data.vmScaleSetResourceId;
            newState.solutionType = SolutionType.Hybrid;
        }
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
            (window as any).computeMapsInsights.performanceMeasures['frame_tokenReceived'] = Date.now();
            this.setState({ isAuthorizationInfoReceived: true })
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

    /**
     * Previously had a lot of business logic, but now simply sets the scopes by calling the same method
     * as `onInit()` method.
     *
     * @private
     * @param {BladeParameters.ScopeSelections} scopeSelections
     * @param {BladeParameters.ISubscriptionInfo[]} subscriptionList
     * @memberof AtScaleComputeMapPage
     */
    private onUpdateContext(scopeSelections: BladeParameters.ScopeSelections,
        subscriptionList: BladeParameters.ISubscriptionInfo[],
        workspaceList: IWorkspaceInfo[]): void {
        const newState: IAtScaleComputeMapPageState = $.extend({}, this.state);

        this.processAtScaleBladeParameters(scopeSelections, subscriptionList, workspaceList, newState);
        this.setState(newState);
    }

    /**
     * Called to set the selections for workspace, computer and group
     * If we workspaceId is already selected set this.state.computerId and this.state.computerGroupId as needed otherwise do:
     *      1) Set this.state.computers and this.state.computerGroups to a one element array based on computer/computerGroup parameters
     *      2) Set this.state.computerId and this.state.computerGropuId as needed to computer.id/computerGroup.id
     *      3) Set this.workspace to the workspace identified by workspaceId
     *      4) Query computers and groups for the workspace
     *      5) When query is done set this.state.computerId and this.state.computerGroupId to computer.id/computerGroup.id parameters or to
     *  null if they are not found in the computers/groups
     * @param  {string} parentStr used in telemetry
     * @param  {IWorkspaceInfo} workspace workspace to select
     * @param  {msg.SelectedEntity} [computer] computer to select
     * @param  {msg.SelectedEntity} [computerGroup] group to select
     * @return void
     */
    // TODO ak: convert to param obj
    private setMapWorkspaceComputerAndGroup(
        parentStr: string,
        workspace: IWorkspaceInfo,
        computer: msg.SelectedEntity,
        computerGroup: SerializedComputerGroup,
        isInitMessage: boolean,
        newState: IAtScaleComputeMapPageState,
        vmScaleSetResourceId?: string
    ): void {
        if (!computer && !computerGroup && !vmScaleSetResourceId) {
            // If we don't have a computer or a group there is no map to render
            this.onMapRenderCompleted();
        }
        // Set computersLoaded to false if new workspace is selected.
        if (workspace?.id !== this.state.selectedHybridWorkspace?.id) {
            newState.computersLoaded = false;
        }

        // This method sets the workspace if current workspace is not equal to incoming workspace.
        // Also sets the selected computer or selected group based on input params and returns the partial state.
        const computerAndGroup: IInitialComputerAndGroupState = this.getDefaultComputerAndGroupState(computerGroup,
            computer, workspace, isInitMessage);
        $.extend(newState, computerAndGroup);
    }

    /**
     * Given the desired group selection return the initial group collection and group id
     *
     * @param  {SerializedComputerGroup} group desired group selection
     * @return {groups: ComputerGroup[], groupId: string} initial groups collection and group id
     *
     * TODO ak: simplify this or remove it altogether
     */
    private getDefaultComputerAndGroupState(group: SerializedComputerGroup, computer: msg.SelectedEntity,
        workspace: IWorkspaceInfo, isInitMessage: boolean): IInitialComputerAndGroupState {

        const workspaceAlreadySet = this.state.selectedHybridWorkspace
            && (workspace.id.toUpperCase() === this.state.selectedHybridWorkspace.id.toUpperCase());

        const returnValue: IInitialComputerAndGroupState = {
            selectedHybridWorkspace: workspaceAlreadySet ? this.state.selectedHybridWorkspace : workspace,
            computerGroups: workspaceAlreadySet ? this.state.computerGroups : [],
            computers: workspaceAlreadySet ? this.state.computers : [],
            selectedComputerGroup: workspaceAlreadySet ? this.state.selectedComputerGroup : undefined,
            selectedComputer: workspaceAlreadySet ? this.state.selectedComputer : undefined,
            resourceId: workspaceAlreadySet ? this.state.resourceId : undefined
        };

        // ak: wipe out selected computer and selected computer group
        // when blade config sends updated context, we want to make sure we wipe out existing
        // selected computer and/or computer group and not carry over from previous state
        // TODO: introduce proper fix by removing this method
        if (!computer) {
            returnValue.selectedComputer = null;
        }
        if (!group) {
            returnValue.selectedComputerGroup = null;
        }

        // computers
        if (computer && computer.id && computer.name) {
            let selectedComputer;
            let computerList;
            if (workspaceAlreadySet && this.state.computersLoaded) {
                selectedComputer = AtScaleComputeMapPage.getComputer(this.state.computers, computer.id);
                computerList = this.state.computers;
            } else {
                selectedComputer = {
                    computerName: computer.name,
                    displayName: computer.name,
                    id: computer.id
                };

                computerList = [selectedComputer];
            }
            returnValue.resourceId = computer.resourceId
            returnValue.computers = computerList;
            returnValue.selectedComputer = selectedComputer;
        }

        // If there is no valid group, or the group is the default group for Perf then use the default group for map
        if (!group || !group.id || !group.displayName || (group.id === ComputerGroupProvider.AllComputersGroup.id)) {
            returnValue.selectedComputerGroup = null;
            return returnValue;
        }

        // if the group is not a service map group, do not change the current state
        if (group.groupType !== ComputerGroupType.ServiceMapMachineGroup && group.groupType !== ComputerGroupType.AzureGroup) {
            return returnValue;
        }

        // If workspace was already set and computerGroups were already loaded then
        // try to get the group with associated groupId
        let selectedGroup;
        let groupList;
        if (workspaceAlreadySet && this.state.computerGroupsLoaded) {
            selectedGroup = AtScaleComputeMapPage.getComputerGroup(this.state.computerGroups, group.id);
            groupList = this.state.computerGroups;
        } else {
            // At this point group has name and id, and the id is a servicemap id
            selectedGroup = ComputerGroupSerialization.getComputerGroupFromSerialization(group, this.telemetry);
            groupList = [selectedGroup];
        }

        // Do not accept group as default selection when Map tab is opened first time due to Perf issues
        if (isInitMessage && !returnValue.selectedComputer && !selectedGroup) {
            return returnValue;
        }

        returnValue.selectedComputerGroup = selectedGroup;
        returnValue.computerGroups = groupList;

        return returnValue;
    }

    private getGroupType(): string {
        if (this.state.selectedComputerGroup) {
            let groupType: ComputerGroupType = this.state.selectedComputerGroup.groupType;
            if (groupType === ComputerGroupType.ServiceMapMachineGroup) {
                let serviceMapGroup = this.state.selectedComputerGroup as ServiceMapComputerGroup;
                switch (serviceMapGroup.ServiceMapGroupType) {
                    case ServiceMapGroupType.AzureCloudService:
                        return DisplayStrings.ServiceMapGroupTypeAzureCloudServiceName;
                    case ServiceMapGroupType.AzureResourceGroup:
                        return DisplayStrings.ServiceMapGroupTypeAzureResourceGroupName;
                    case ServiceMapGroupType.AzureServiceFabric:
                        return DisplayStrings.ServiceMapGroupTypeAzureServiceFabricName;
                    case ServiceMapGroupType.AzureSubscription:
                        return DisplayStrings.ServiceMapGroupTypeAzureSubscrptionName;
                    case ServiceMapGroupType.AzureVMScaleSet:
                        return DisplayStrings.ServiceMapGroupTypeAzureVMScaleSetName;
                    default:
                        return DisplayStrings.Unknown;
                }
            } else {
                return DisplayStrings.OmsComputerGroupTypeName;
            }
        }

        return DisplayStrings.Unknown;
    }

    private getDefaultSelectedAzureResource(selectedSub: ISubscriptionInfo, selectedRg: ResourceInfo,
        selectedResource: IResourceInfo | BladeParameters.IResourceInfo): ResourceInfo {

        if (selectedResource && selectedResource.id && selectedResource.displayName) {
            return new ResourceInfo(selectedResource as IResourceInfo);
        }
        return AtScaleUtils.getSelectedAzureResource(selectedSub, selectedRg);
    }

    private onStyleThemeInit(theme: IVmInsightsThemeMessage) {
        const result: IVmInsightsThemeMessageResult =
            VmInsightsThemeMessageProcessor.processMessage(theme, this.telemetry, this.telemetryEventsPrefix, this.bodyTheme);
        this.setState({ isDarkMode: result.isDark });
        this.bodyTheme = result.bodyTheme;
    }

    private subscriptionListUpdate(subscriptionList: ISubscriptionInfo[]): void {
        this.setState({
            subscriptionList
        });
    }

    /**
     * Use the existance of `vmssResourceId` as a check to see if we're in VMSS mode or not. We should
     * probably implement a neater solution.
     *
     * @private
     * @returns {boolean}
     * @memberof AtScaleComputeMapPage
     */
    private isVmss(): boolean {
        return !!this.state.vmssResourceId;
    }

    /**
     * This method creates telemetry properties object from current scope selection
     * and updates the telemetry context.
     * @private
     * @memberof ComputeMainPage
     */
    private updateTelemetryContext(state?: IAtScaleComputeMapPageState): void {
        state = state || this.state;
        const telemetryContext: IAtScaleTelemetryContext = {
            solutionType: state.solutionType?.toString(),
            hybridScope: state.solutionType === SolutionType.Hybrid ? {
                workspace: state.selectedHybridWorkspace?.id,
                omsgroup: state.selectedComputerGroup?.id,
                servicemapComputer: state.selectedComputer?.id
            } : null,
            azureScope: state.solutionType === SolutionType.Azure ? {
                subscription: state.selectedSubscription?.subscriptionId,
                resourceGroup: state.selectedResourceGroup?.id,
                resourceType: state.selectedResourceType?.toString(),
                resource: state.selectedAzureResource?.id,
                workspace: state.selectedAzureWorkspace?.id,
                vmssInstance: state.selectedVmssInstance?.id
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
