import * as React from 'react';

import * as Constants from '../../Constants';
import * as msg from '../../../shared/MessagingProvider';
import { ConnectionPane } from '../map-connections/ConnectionPane';
import { LogEventPanel } from '../../shared/property-panel/LogEventPanel';
import { DetailsPane } from '../../../shared/property-panel/DetailsPane';
import { PropertyPanelSelector } from '../../shared/property-panel/entity-properties/PropertyPanelSelector';
import { IDetailsPanel } from '../../../shared/property-panel/IDetailsPanel';
import { ITelemetry, TelemetryMainArea } from '../../../shared/Telemetry';
import { DisplayStrings } from '../../../shared/DisplayStrings';
import { PropertiesSVG } from '../../../shared/svg/properties';
import { SearchSVG } from '../../../shared/svg/search';
import { AlertSVG } from '../../../shared/svg/alert';
import { LinkSVG } from '../../../shared/svg/Link';
import { IWorkspaceInfo } from '../../../shared/IWorkspaceInfo';
import { GuestHealth, PlatformHealth } from '../../../shared/IHealthInfo';
import { OnboardingState } from '../../shared/OnboardingUtil';
import { IVmResourceDescriptor } from '../../shared/VirtualMachineBase';
import { AlertPanelV2, IAlertPanelHeaders } from '../../shared/property-panel/AlertPanelV2';
import { ConnectionsSVG } from '../../../shared/svg/connections';
import { ConnectionPropertiesPanel } from '../../shared/property-panel/entity-properties/ConnectionPropertiesPanel';
import { MapParams } from './BasicMapComponent';
import { IPropertiesPanelQueryParams } from '../../shared/property-panel/data-models/PropertiesPanelQueryParams';

import '../../../../styles/shared/MainPage.less';
import '../../../../styles/compute/ComputeMaps.less';
import { TimeData } from '@appinsights/pillscontrol-es5';

export interface IComputeMapPropertyPanelProps {
    workspace: IWorkspaceInfo;
    startDateTimeUtc: Date;
    endDateTimeUtc: Date;
    mapData: DependencyMap.IMap;
    alertsQueryResults: StringMap<DependencyMap.Integrations.IAlert[]>;
    messagingProvider: msg.MessagingProvider;
    telemetry: ITelemetry;
    logPrefix: string;
    propertiesPanelQueryParams: IPropertiesPanelQueryParams;
    panelHeaders: IAlertPanelHeaders;
    showAlertSummaryPanelV2: boolean;
    dateTime: TimeData;

    /**
     * Give its user ablity to collapsed the property panel.
     * for example: click on badge, directly open property panel, 
     * so this should be state of its parent and props of this component
     */
    isPropertyPanelCollapsed: boolean;

    /**
     * same to isPropertyPanelCollapsed, here we don't maintan tab index.
     * Mainly Map has some logic to change propertyPanel index, so here we just listen to it.
     */
    selectedPropertyPanelIndex: number;

    /**
     * selectedContext from map and propertyPanel
     * click on connection grid trigger onSelectContext(), it update its parent state, then update its props
     */
    // TODO: Change the type of selected context.
    // Pass either computer or computerGroup as selected context.
    selectedContext: DependencyMap.SelectionContext;

    mapParams?: MapParams;

    featureFlags?: StringMap<boolean>;
    guestHealth?: GuestHealth;
    platformHealth?: PlatformHealth;

    vm?: IVmResourceDescriptor;
    onboardingState?: OnboardingState;
    togglePanelCollapse(): void;
    onPropertyPaneSelected(index: number): void;
    onSelectedContext(selectContext: DependencyMap.SelectionContext): void;
    onServerPortVisibilitySelectionChanged(visiblePortIds: string[]): void;
    getGroupType(): string;
}

export interface IComputeMapPropertyPanelState { }

// id of each item added to propertyPanels by index used in telemetry
const propertyTypes = ['Properties', 'LogEvents', 'Alerts'];

export class ComputeMapPropertyPanel extends React.Component<IComputeMapPropertyPanelProps, IComputeMapPropertyPanelState> {

    private propertyPanels: IDetailsPanel[];

    constructor(props?: IComputeMapPropertyPanelProps) {
        super(props);

        this.onPropertyPaneSelected = this.onPropertyPaneSelected.bind(this);
        this.onMemberMachineConnectionSelected = this.onMemberMachineConnectionSelected.bind(this);
        this.propertyPanels = [];
    }

    /**
     * This function determines which types of entities can display panel
     * @param selectedContext 
     */
    public static shouldDisplayPanelForSelection(selectedContext: DependencyMap.SelectionContext): boolean {
        if (!selectedContext || !selectedContext.entity) {
            return false;
        }

        switch (selectedContext.entity.type) {
            case DependencyMap.EntityType.Machine:
            case DependencyMap.EntityType.Connection:
            case DependencyMap.EntityType.AggConnection:
            case DependencyMap.EntityType.ClientGroupMemberVirtualConnection:
            case DependencyMap.EntityType.ServerGroupMemberVirtualConnection:
            case DependencyMap.EntityType.Process:
            case DependencyMap.EntityType.ProcessGroup:
            case DependencyMap.EntityType.ClientGroup:
            case DependencyMap.EntityType.ClientGroupV3:
            case DependencyMap.EntityType.ServerGroup:
            case DependencyMap.EntityType.ServerGroupV3:
            case DependencyMap.EntityType.ClientGroupMemberMachine:
            case DependencyMap.EntityType.ServerGroupMemberMachine:
            case DependencyMap.EntityType.VirtualGroupNode:
            case DependencyMap.EntityType.AllPortsNode:
                return true;
            default:
                return false;
        }
    }

    public render(): JSX.Element {
        if (!this.props.selectedContext || !this.props.workspace) {
            return null;
        }
        return (
            <DetailsPane
                isCollapsed={this.props.isPropertyPanelCollapsed}
                selectedPanelIndex={this.props.selectedPropertyPanelIndex}
                isVisible={true}
                isLoading={false}
                onTogglePanelCollapse={this.props.togglePanelCollapse}
                contents={this.generateTabContents()}
                useWideCollapsedPane={true}
                onPaneSelected={this.onPropertyPaneSelected}
                mapRefocus={
                    () => {
                        // NOTE ak: recenter map so it doesn't get obfuscated by the property panel when it's in initial expanded state
                        DependencyMap.AdmWorkspace.getMapInstance().zoomFitMap();
                    }
                } />
        );
    }

    /**
     * when select property tab
     * @param index index of tab
     */
    private onPropertyPaneSelected(index: number) {
        this.props.onPropertyPaneSelected(index);
        if (index < this.propertyPanels.length) {
            const contentDetails: IDetailsPanel = this.propertyPanels[index];
            // if nothing to show then toggle to collapse
            if (!contentDetails.body) {
                this.props.togglePanelCollapse();
            }
            // after collapsed, onAfterSelection won't get call so need to manually make the call here
            if (contentDetails.onAfterSelection) {
                contentDetails.onAfterSelection();
            }
        }
        this.logPropertyPaneSelection(index, false);
    }

    /**
     * Called to log a property pane selection
     * @private
     * @param  {number} index index of the selected property pane
     * @param  {boolean} auto true if the selection was automatically as opposed to user initiated
     * @return {void}@memberof ComputeMapsPage
     */
    private logPropertyPaneSelection(index: number, auto: boolean) {
        const entityType: string = this.props.selectedContext && this.props.selectedContext.entity
            ? PropertyPanelSelector.GetEntityTypeName(this.props.selectedContext.entity.type) : '';

        this.props.telemetry.logEvent(
            `${this.props.logPrefix}.${Constants.PropertyPaneSelectedTelemetryEventName}`,
            {
                pageName: this.props.logPrefix,
                propertyType: propertyTypes[index],
                entityType: entityType,
                automaticallyDisplayed: auto ? 'true' : 'false'
            },
            null
        )
    }

    private generateTabContents(): IDetailsPanel[] {
        this.propertyPanels = [];
        // which will decide what kind of Pane to be used.
        // At that point also rename ConnectionsPanel to MapConnectionChartsPane
        if (this.props.selectedContext) {
            const selectedContext = this.props.selectedContext || ({ entity: {} } as any);
            this.generateTabContentForSelectedContext(selectedContext);
        }

        return this.propertyPanels;
    }

    private generateTabContentForSelectedContext(selectedContext: any): void {
        switch (selectedContext.entity.type) {
            case DependencyMap.EntityType.Connection:
            case DependencyMap.EntityType.AggConnection:
            case DependencyMap.EntityType.ClientGroupMemberVirtualConnection:
            case DependencyMap.EntityType.ServerGroupMemberVirtualConnection:
                this.propertyPanels.push({
                    tabName: '',
                    tabIcon: <LinkSVG />,
                    body: <ConnectionPane
                        selectedContext={this.props.selectedContext}
                        workspace={this.props.workspace}
                        startDateTimeUtc={this.props.startDateTimeUtc}
                        endDateTimeUtc={this.props.endDateTimeUtc}
                        mapData={this.props.mapData}
                        logPrefix={this.props.logPrefix}
                        messagingProvider={this.props.messagingProvider}
                    />,
                });
                break;
            default:
                // Machine Properties
                this.propertyPanels.push({
                    tabName: DisplayStrings.Properties,
                    tabIcon: <PropertiesSVG />,
                    body: <PropertyPanelSelector
                        selectedContext={
                            {
                                selectedEntity: this.props.selectedContext.entity,
                                selectedScopeFilter: this.props.mapParams &&
                                    this.props.mapParams.resource
                            }
                        }
                        telemetry={this.props.telemetry}
                        callbackCollection={
                            {
                                onMemberMachineConnectionSelected: this.onMemberMachineConnectionSelected,
                                onServerPortVisibilitySelectionChanged: this.props.onServerPortVisibilitySelectionChanged,
                                getGroupType: this.props.getGroupType
                            }
                        }
                        guestHealth={this.props.guestHealth}
                        platformHealth={this.props.platformHealth}
                        messagingProvider={this.props.messagingProvider}
                        logPrefix={this.props.logPrefix}
                        vm={this.props.vm}
                        onboardingState={this.props.onboardingState}
                        startDateTimeUtc={this.props.startDateTimeUtc}
                        endDateTimeUtc={this.props.endDateTimeUtc}
                        workspace={this.props.workspace}
                        featureFlags={this.props.featureFlags}
                    />
                });

                //currently only monitored machine and member machine have LogEventPanel
                const logEventPanelDisabled: boolean = !((selectedContext.entity.type === DependencyMap.EntityType.Machine ||
                    selectedContext.entity.type === DependencyMap.EntityType.ClientGroupMemberMachine ||
                    selectedContext.entity.type === DependencyMap.EntityType.ServerGroupMemberMachine) &&
                    selectedContext.entity.isMonitored);
                this.propertyPanels.push({
                    tabName: DisplayStrings.LogEvent,
                    tabIcon: <SearchSVG />,
                    forceRender: true,
                    body: !logEventPanelDisabled && <LogEventPanel
                        selectedContext={this.props.selectedContext}
                        workspace={this.props.workspace}
                        startDateTimeUtc={this.props.startDateTimeUtc}
                        endDateTimeUtc={this.props.endDateTimeUtc}
                        messagingProvider={this.props.messagingProvider}
                        telemetryPreFix={this.props.logPrefix}
                        telemetryMainArea={TelemetryMainArea.Maps}
                        dateTime={this.props.dateTime}
                    />,
                    disabled: logEventPanelDisabled
                });

                const alertPanelDisabled: boolean = !((selectedContext.entity.type === DependencyMap.EntityType.Machine ||
                    selectedContext.entity.type === DependencyMap.EntityType.ClientGroupMemberMachine ||
                    selectedContext.entity.type === DependencyMap.EntityType.ServerGroupMemberMachine)
                    && selectedContext.entity.displayName
                    && selectedContext.entity.isMonitored);

                // Alert Properties panel
                // TODO: We are showing alert summary panel for only singleVM for GA release
                const alertPanelV2Disabled: boolean = alertPanelDisabled || !this.props.propertiesPanelQueryParams;
                this.propertyPanels.push({
                    tabName: DisplayStrings.Alerts,
                    tabIcon: <AlertSVG />,
                    body: !alertPanelV2Disabled && <AlertPanelV2
                        panelHeaders={this.props.panelHeaders}
                        alertSummaryQueryProps={this.props.propertiesPanelQueryParams}
                        telemetry={this.props.telemetry}
                        telemetryPrefix={this.props.logPrefix}
                        messagingProvider={this.props.messagingProvider}
                    />,
                    disabled: alertPanelV2Disabled
                });

                const entity: any = this.props.selectedContext && this.props.selectedContext.entity;
                const connectionPropertiesPanelDisabled: boolean = !(entity.type === DependencyMap.EntityType.Machine
                    && selectedContext.entity.displayName
                    && selectedContext.entity.isMonitored);
                this.propertyPanels.push({
                    tabName: DisplayStrings.ConnectionsOverview,
                    tabIcon: <ConnectionsSVG />,
                    body: !connectionPropertiesPanelDisabled && <ConnectionPropertiesPanel
                        machine={entity}
                        linkProperties={entity.linkProperties}
                        telemetry={this.props.telemetry}
                        messagingProvider={this.props.messagingProvider}
                        logPrefix={this.props.logPrefix}
                        connectionQuery={this.props.propertiesPanelQueryParams}
                        dateTime={this.props.dateTime}
                    />,
                    disabled: connectionPropertiesPanelDisabled
                });
                break;
        }
    }

    /**
     * callBack of connection grid selection
     * @param selectedConnection 
     */
    private onMemberMachineConnectionSelected(selectedConnection: DependencyMap.Connection) {
        let selectContext: DependencyMap.SelectionContext = { entity: selectedConnection, edge: selectedConnection, nodes: [] };
        this.props.onSelectedContext(selectContext);
    }
}
