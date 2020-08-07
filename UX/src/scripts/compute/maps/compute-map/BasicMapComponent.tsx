/**
 * Block imports
 */
import * as React from 'react';

/**
 * Third Party
 */
import update = require('immutability-helper');

/**
 * Maps imports
 */
import * as Constants from '../../Constants';
import { ComputeMapPropertyPanel } from './ComputeMapPropertyPanel';
import { ComputeMapsElement, MapType } from './ComputeMapsElement';
import { AzureAtScaleOnboardingSection } from '../../AzureAtScaleOnboardingSection';
import { ServiceMapOnboardingSection } from '../../ServiceMapOnboardingSection';
import { VmInsightsQuicklinks, NodeType, IQuicklinksDisplaySettings } from '../../shared/VmInsightsQuicklinks';
import { TimeData } from '@appinsights/pillscontrol-es5';
import { TimeInterval } from '../../../shared/data-provider/TimeInterval';
import { isRelative } from '@appinsights/pillscontrol-es5/dist/TimeUtils';

/**
 * Shared imports
 */
import * as msg from '../../../shared/MessagingProvider';
import { ITelemetry } from '../../../shared/Telemetry';
import { IComputerInfo } from '../../shared/control-panel/ComputerProvider';
import { DisplayStrings } from '../../../shared/DisplayStrings';
import { IWorkspaceInfo } from '../../../shared/IWorkspaceInfo';
import { GuestHealth, PlatformHealth } from '../../../shared/IHealthInfo';
import { OnboardingState } from '../../shared/OnboardingUtil';
import { IVmResourceDescriptor } from '../../shared/VirtualMachineBase';
import { ErrorSeverity } from '../../../shared/data-provider/TelemetryErrorSeverity';
import { MachinePropertyPanelAdaptor } from '../../shared/property-panel/entity-properties/map-entity-adaptor/MachinePropertyPanelAdaptor';
import { IAlertPanelHeaders } from '../../shared/property-panel/AlertPanelV2';
import { ComputerGroup } from '../../../shared/ComputerGroup';
import { IResourceInfo } from '../../shared/ResourceInfo';
import { IApiClientRequestInfoParams } from '../../../shared/data-provider/ApiClientRequestInfo';
import { IPropertiesPanelQueryParams } from '../../shared/property-panel/data-models/PropertiesPanelQueryParams';

/**
 * Styles
 */
import '../../../../styles/shared/MainPage.less';
import '../../../../styles/compute/ComputeMaps.less';

export enum MapResourceType {
    azureResource = 0,
    serviceMapComputer = 1,
    serviceMapGroup = 2
}

export interface MapParams {
    mapId: string;
    mapDisplayName: string;
    mapType: MapType;
    resourceType: MapResourceType;
    // TODO bb: Consolidate these three types into ResourceInfo
    resource?: ComputerGroup | IComputerInfo | IResourceInfo;
}

/**
 * This object holds ServiceMap API response for the selected computerId/computerGroupId.
 * This value presents only if the parent component makes the API request
 */
export interface MapApiResponse {
    /**
     * GetCoarseMap API response.
     */
    data: any;

    /**
     * Errors returned by GetCoarseMap API if any.
     */
    errors: any;

    /**
     * Telemetry params captured during API.
     */
    telemetryParams: any;
}

export interface IBasicMapComponentProps {
    /**
     * controlBar is passed in react UI component.
     * from AtScale it's 4 drop down, from single VM it's 1 drop down
     */
    controlBar: JSX.Element;

    mapParams: MapParams;

    forceUpdate?: boolean;
    /**
     * default workspace
     */
    workspace: IWorkspaceInfo;

    dateTime: TimeData;

    /**
     * used to match with alert badge.
     * shall be removed after use new Alert API
     */
    computers: IComputerInfo[];
    messagingProvider: msg.MessagingProvider;
    telemetry: ITelemetry;
    logPath: string;
    /**
     * to be used in telemetry
     */
    mapQueryName: string;
    isDarkMode: boolean;
    /**
     * This property holds ServiceMap API response for the selected computerId/computerGroupId.
     * This value presents only if the parent component makes the API request
     */
    mapApiResponse?: MapApiResponse;
    apiRequestInfo: IApiClientRequestInfoParams;
    mapComputerIdChanged: (id: string) => void;
    onMapComputationStarted: () => void;
    onMapComputationCompleted: () => void;
    /** feature flags to turn on/off features */
    featureFlags?: StringMap<boolean>;
    hasNoComputers?: boolean;
    getGroupType?: () => string;
    onboardingState?: OnboardingState;
    // Used only in SingleVM mode
    vm?: IVmResourceDescriptor;
    quicklinksDisplaySettings: IQuicklinksDisplaySettings
    guestHealth?: GuestHealth;
    platformHealth?: PlatformHealth;
    language: string;
    enableSimpleMapLayout?: boolean;
}

export interface IBasicMapComponentState {
    isPropertyPanelCollapsed: boolean;
    /**
     * set this state when select item on map, trigger propertyPanel to render.
     */
    selectedContext: DependencyMap.SelectionContext;
    /**
     * connection panel need this from the map component
     */
    mapData: DependencyMap.IMap;
    /**
     * map component will query alert, and pass it propertyPanel component
     */
    alertsQueryResults: StringMap<DependencyMap.Integrations.IAlert[]>;
    /**
     * If this index is specified then the panel at specified index will be displayed.
     * This value will be set if the seclectedContext has any badge context
     * By default the first panel in the properties tab will be displayed.
     */
    selectedPropertyPanelIndex: number;
    /**
     * Set of serverPortIds being rendered in the map.
     * This list can be changed by config-property panel.
     */
    visibleServerPortIds: string[];
}

/**
 * This component mainly contains map component and propertyPanel component.
 * And define interaction between these two components.
 */
export class BasicMapComponent extends React.Component<IBasicMapComponentProps, IBasicMapComponentState> {
    private _startDateTimeUtc: Date;
    private _endDateTimeUtc: Date;

    constructor(props?: IBasicMapComponentProps) {
        super(props);

        this.mapsContextChanged = this.mapsContextChanged.bind(this);
        this.onAlertsLoaded = this.onAlertsLoaded.bind(this);

        this.togglePanelCollapse = this.togglePanelCollapse.bind(this);
        this.onPropertyPaneSelected = this.onPropertyPaneSelected.bind(this);
        this.onGetStarted = this.onGetStarted.bind(this);
        this.isNotOnboarded = this.isNotOnboarded.bind(this);
        this.openOnboardingPane = this.openOnboardingPane.bind(this);
        this.calculateStartAndEndTime(props.dateTime);
        this.state = {
            isPropertyPanelCollapsed: true,
            selectedContext: undefined,
            mapData: null,
            selectedPropertyPanelIndex: 0,
            alertsQueryResults: {},
            visibleServerPortIds: []
        };
        this.onServerPortVisibilitySelectionChanged = this.onServerPortVisibilitySelectionChanged.bind(this);
    }

    public render(): JSX.Element {
        return (
            <>
                {this.renderMapAndControlBar()}
                {this.renderPropertyPanel()}
            </>
        );
    }

    public componentWillReceiveProps(nextProps: IBasicMapComponentProps) {
        // Clear mapContext if the mapId is changed.
        const mapIdChanged: boolean = (this.props.mapParams && nextProps.mapParams)
            && ((this.props.mapParams.mapId && this.props.mapParams.mapId.toLowerCase())
                !== (nextProps.mapParams.mapId && nextProps.mapParams.mapId.toLowerCase()));
        const workspaceHasChanged: boolean = (this.props.workspace && nextProps.workspace)
            && (JSON.stringify(this.props.workspace).toLowerCase() !== JSON.stringify(nextProps.workspace).toLowerCase());
        if (mapIdChanged || workspaceHasChanged || this.props.forceUpdate) {
            this.setState({
                selectedContext: undefined,
                isPropertyPanelCollapsed: true,
                mapData: undefined
            });
        }

        if (this.props.dateTime !== nextProps.dateTime || this.props.forceUpdate) {
            this.calculateStartAndEndTime(nextProps.dateTime);
        }
    }

    private calculateStartAndEndTime(dateTime: TimeData): void {
        const startAndEnd = TimeInterval.getStartAndEndDate(dateTime, isRelative(dateTime));
        if (startAndEnd) {
            this._startDateTimeUtc = startAndEnd.start;
            this._endDateTimeUtc = startAndEnd.end;
        }
    }

    private onGetStarted() {
        this.props.messagingProvider.sendNavigateToGetStarted();
    }

    private renderMapAndControlBar(): JSX.Element {
        const noComputersHelp: string[] = DisplayStrings.NoComputersHelp.split('{0}');
        let body: JSX.Element;
        if (this.props.hasNoComputers) {
            body = <div className='no-computers-section'>
                <div className='no-computers-prefix'>{DisplayStrings.NoComputersPrefix}</div>
                <span>{noComputersHelp[0]}</span>
                <a className='get-started-link' onClick={this.onGetStarted}>{DisplayStrings.GetStarted}</a>
                <span>{noComputersHelp[1]}</span>
            </div>
        } else if (this.isNotOnboarded()) {
            if (this.props.onboardingState.servicemap) {
                // TODO ak: consolidate onboarding logic with atscale counterpart
                // https://msazure.visualstudio.com/InfrastructureInsights/_workitems/edit/4768082
                body = <ServiceMapOnboardingSection
                    messagingProvider={this.props.messagingProvider}
                    onboardingState={this.props.onboardingState}
                    vm={this.props.vm}
                />;
            } else if (this.props.onboardingState.atscale) {
                body = <AzureAtScaleOnboardingSection 
                    resourceId={this.props.mapParams?.resource?.id}
                    openOnboardingPane={this.openOnboardingPane}
                />;
            } else {
                // Error state
                this.props.telemetry.logException('Unknown onboarding state', 'renderMapAndControlBar', ErrorSeverity.Error,
                    { onboardingState: JSON.stringify(this.props.onboardingState) }, {});
                body = <p>{DisplayStrings.UnexpectedErrorPrompt}</p>;
            }
        } else {
            body = <>
                <ComputeMapsElement
                    mapId={this.props.mapParams && this.props.mapParams.mapId}
                    mapDisplayName={this.props.mapParams && this.props.mapParams.mapDisplayName}
                    mapType={this.props.mapParams && this.props.mapParams.mapType}
                    startDateTimeUtc={this._startDateTimeUtc}
                    endDateTimeUtc={this._endDateTimeUtc}
                    workspace={this.props.workspace}
                    computers={this.props.computers}
                    onMapsContextChanged={this.mapsContextChanged}
                    onMapComputerIdChanged={this.props.mapComputerIdChanged}
                    onAlertsLoaded={this.onAlertsLoaded}
                    messagingProvider={this.props.messagingProvider}
                    logPath={this.props.logPath}
                    mapApiResponse={this.props.mapApiResponse}
                    onMapComputationCompleted={this.props.onMapComputationCompleted}
                    onMapComputationStarted={this.props.onMapComputationStarted}
                    visibleServerPorts={this.state.visibleServerPortIds}
                    guestHealth={this.props.guestHealth}
                    platformHealth={this.props.platformHealth}
                    onboardingState={this.props.onboardingState}
                    loadLaAlerts={!this.isAlertsV2Enabled()}
                    forceUpdate={this.props.forceUpdate}
                    language={this.props.language}
                    apiRequestInfo={this.props.apiRequestInfo}
                    enableSimpleMapLayout = {this.props.enableSimpleMapLayout}
                />
                <div id='ininadmmap' className={this.getAdmMapClass()}></div>
            </>;
        }

        return (<div className='content-root'>
            {this.props.controlBar}
            {body}
        </div>);
    }

    private getAdmMapClass(): string {
        let admMapClass = 'inin-admap';
        if (this.props.isDarkMode) {
            admMapClass += ' ibiza theme-dark';
        }
        return admMapClass;
    }

    private renderPropertyPanel(): JSX.Element {
        const alertPanelV2Props = this.getAlertPanelV2Properties();
        return (
            <div className='vm-panel'>
                <ComputeMapPropertyPanel
                    workspace={this.props.workspace}
                    startDateTimeUtc={this._startDateTimeUtc}
                    endDateTimeUtc={this._endDateTimeUtc}
                    mapData={this.state.mapData}
                    alertsQueryResults={this.state.alertsQueryResults}
                    messagingProvider={this.props.messagingProvider}
                    telemetry={this.props.telemetry}
                    logPrefix={this.props.logPath}
                    isPropertyPanelCollapsed={this.state.isPropertyPanelCollapsed}
                    togglePanelCollapse={this.togglePanelCollapse}
                    selectedPropertyPanelIndex={this.state.selectedPropertyPanelIndex}
                    onPropertyPaneSelected={this.onPropertyPaneSelected}
                    selectedContext={this.state.selectedContext}
                    onSelectedContext={
                        (selectContext: DependencyMap.SelectionContext) => {
                            this.mapsContextChanged(selectContext, this.state.mapData)
                        }}
                    featureFlags={this.props.featureFlags}
                    onServerPortVisibilitySelectionChanged={this.onServerPortVisibilitySelectionChanged}
                    getGroupType={this.props.getGroupType}
                    guestHealth={this.props.guestHealth}
                    platformHealth={this.props.platformHealth}
                    onboardingState={this.props.onboardingState}
                    vm={this.props.vm}
                    propertiesPanelQueryParams={alertPanelV2Props.alertQueryParams}
                    panelHeaders={alertPanelV2Props.alertPanelHeaders}
                    showAlertSummaryPanelV2={this.isAlertsV2Enabled()}
                    mapParams={this.props.mapParams}
                    dateTime={this.props.dateTime}
                />
            </div>);
    }

    /**
     * function bound to the AdmPropertiesPanelShim... this will get invoked by KO when the selections
     * change inside the map...
     * @param selectedContext the selection that was made
     * @returns {void}
     */
    private mapsContextChanged(selectedContext: DependencyMap.SelectionContext, mapData: DependencyMap.IMap): void {
        if (ComputeMapPropertyPanel.shouldDisplayPanelForSelection(selectedContext)) {
            const entity: any = selectedContext.entity;
            const entityId: string = selectedContext.entity.id;
            const entityType: string = selectedContext.entity.type.toString();
            const telemetryProperties: StringMap<string> = {
                entityId,
                entityType,
                pageName: this.props.logPath
            }
            this.props.telemetry.logEvent(`${this.props.logPath}.MapContextChanged`, telemetryProperties, null);

            // Calculate quicklinksSection here.
            // If the map is opened from SingleVMBlade then we have azure resource details.
            // TODO: We need to get azureResourceId if the Map is opened in AtScaleMap view.
            let quickLinksSection: JSX.Element
            if (entity.type === DependencyMap.EntityType.Machine) {
                quickLinksSection = <VmInsightsQuicklinks
                    workspace={this.props.workspace}
                    computerName={entity.fullyQualifiedDomainName}
                    serviceMapResourceId={entity.id}
                    azureResourceId={this.props.vm && this.props.vm.resourceId}
                    dateTime={this.props.dateTime}
                    type={NodeType.StandAloneNode}
                    displaySettings={this.props.quicklinksDisplaySettings}
                    telemetryEventPrefix={this.props.logPath}
                    telemetryProvider={this.props.telemetry}
                    messagingProvider={this.props.messagingProvider} />;

                // add quickLinkSection for machine
                let contextCopy: any = Object.assign({}, selectedContext);
                contextCopy.entity.linkProperties = quickLinksSection;
            }

            this.setState((prevState) => {
                let changes: any = {
                    selectedContext: { $set: selectedContext },
                    mapData: { $set: mapData },
                    isPropertyPanelCollapsed: { $set: false },
                };

                if (selectedContext.badgeType === DependencyMap.BadgeType.Alert) {
                    changes.selectedPropertyPanelIndex = { $set: 2 };
                }

                if (prevState && prevState.selectedContext && entity.type !== prevState.selectedContext.entity &&
                    entity.type === DependencyMap.EntityType.VirtualGroupNode) {
                    changes.selectedPropertyPanelIndex = { $set: 0 };
                }

                let newState = update(prevState, changes);
                return newState;
            });
            return;
        }
    }

    private onAlertsLoaded(alerts: StringMap<DependencyMap.Integrations.IAlert[]>) {
        this.setState({ alertsQueryResults: alerts });
    }

    /**
     * the panel is allowed to actually collapse itself; the state of collapse needs to be owned by main page
     * since he will also collapse the panel; rather then having two 'collapse' states, this difers the collapse
     * actions to the owner of the control with the side benefit that you can reject a collapse request from teh panel
     * @returns {void}
    */
    private togglePanelCollapse(): void {
        this.setState((prevState: IBasicMapComponentState) => {
            let newState = update(prevState, {
                isPropertyPanelCollapsed: { $set: !prevState.isPropertyPanelCollapsed }
            });
            return newState;
        }, () => {
            this.props.telemetry.logEvent(
                `${this.props.logPath}.${Constants.PropertyPaneToggled}`,
                {
                    pageName: this.props.logPath,
                    isCollapsed: this.state.isPropertyPanelCollapsed ? 'true' : 'false',
                },
                null);
        });
    }

    /**
     * Called when a new property pane is selected
     * @param  {number} index
     * @return {void}
     */
    private onPropertyPaneSelected(index: number) {
        this.setState({ selectedPropertyPanelIndex: index });
    }

    private onServerPortVisibilitySelectionChanged(portIds: string[]): void {
        this.setState({
            visibleServerPortIds: portIds
        });
    }

    private isNotOnboarded(): boolean {
        return this.props.onboardingState
            && ((this.props.onboardingState.servicemap && this.props.onboardingState.servicemap.isOnboarded === false)
                || (this.props.onboardingState.atscale && this.props.onboardingState.atscale.isOnboarded === false));
    }

    private isAlertsV2Enabled(): boolean {
        return this.props.featureFlags && !!this.props.featureFlags[Constants.FeatureMap.vmInsightsAlerts];
    }

    /**
     * This method computers alertQuery parameters and alert panel headers
     * based on selected entity.
     */
    private getAlertPanelV2Properties() {
        if (!this.props || !this.props.workspace) {
            return {};
        }

        const timeInterval = new TimeInterval(this._startDateTimeUtc,
            this._endDateTimeUtc,
            Constants.IdealAggregateChartDataPoints);
        let alertQueryParams: IPropertiesPanelQueryParams = {
            workspace: this.props.workspace,
            timeInterval
        };

        let alertPanelHeaders: IAlertPanelHeaders;

        if (this.state.selectedContext && this.state.selectedContext.entity) {
            // If selectedEntity is virtualGroup node then use 'this.props.MapParams.ComputerGroup' in the alertsQuery.
            switch (this.state.selectedContext.entity.type) {
                case DependencyMap.EntityType.VirtualGroupNode:
                    if (this.props.mapParams && this.props.mapParams.resource) {
                        // If mapParams has azureResource then use resourceId to query fired alerts.
                        switch (this.props.mapParams.resourceType) {
                            case MapResourceType.azureResource:
                                const azureResource: IResourceInfo = this.props.mapParams.resource as IResourceInfo;
                                alertQueryParams.resourceId = azureResource && azureResource.id;
                                alertPanelHeaders = {
                                    panelId: azureResource.id,
                                    displayName: azureResource.displayName,
                                    displayIcon: undefined // TODO: Get displayIcon.
                                };
                                break;
                            case MapResourceType.serviceMapGroup:
                                const serviceMapComputerGroup: ComputerGroup = this.props.mapParams.resource as ComputerGroup;
                                alertQueryParams.computerGroup = serviceMapComputerGroup;
                                alertPanelHeaders = {
                                    panelId: serviceMapComputerGroup.id,
                                    displayIcon: serviceMapComputerGroup.icon,
                                    displayName: serviceMapComputerGroup.displayName
                                }
                        }
                    }
                    break;
                case DependencyMap.EntityType.Machine:
                case DependencyMap.EntityType.ClientGroupMemberMachine:
                case DependencyMap.EntityType.ServerGroupMemberMachine:
                    if (!(this.state.selectedContext.entity as any).isMonitored) {
                        // If the member is not monitored member then return empty object.
                        return {};
                    }

                    const machineDetails = MachinePropertyPanelAdaptor.getMachineAdaptor(this.props.telemetry,
                        this.state.selectedContext.entity, this.props.messagingProvider);
                    if (machineDetails) {
                        const azureResourceProps = machineDetails.getAzureVMProperties();
                        let azureResourceId: string = undefined;
                        if (azureResourceProps) {
                            azureResourceProps.forEach((prop) => {
                                if (prop.propertyName === DisplayStrings.ResourceId
                                    && prop.propertyValues && prop.propertyValues.length > 0) {
                                    azureResourceId = prop.propertyValues[0];
                                }
                            });
                        }
                        const computerName: string = machineDetails.getMachineNameForQuery();

                        alertQueryParams.computerName = computerName;
                        alertQueryParams.resourceId = azureResourceId;
                        alertQueryParams.agentId = machineDetails.getAgetnId();
                        alertPanelHeaders = {
                            panelId: this.state.selectedContext.entity.id,
                            displayIcon: machineDetails.getIcon(),
                            displayName: machineDetails.getTitle()
                        };
                    }
                    break;
                default:
                    // If selectedContext is there but the selectedItem is not a monitored machine
                    // Then do not show Alerts panel. In this case just return empty object as alertPanelProps
                    return {};
            }
        }

        return {
            alertQueryParams,
            alertPanelHeaders
        };
    }

    private openOnboardingPane(resourceId: string): void {
        let telemetryPayload = { resourceId: resourceId };
        if (resourceId) {
            this.props.telemetry.logEvent(`${this.props.logPath}.OpenVmOnboarding`, telemetryPayload, undefined);
            this.props.messagingProvider.sendOpenOnboardingPane(resourceId);
        } else {
            this.props.telemetry.logException(`Failed to open onboading, VmResource Id is null or empty`,
                `${this.props.logPath}.OpenVmOnboarding`, ErrorSeverity.Error, telemetryPayload, undefined);
        }
    }
}
