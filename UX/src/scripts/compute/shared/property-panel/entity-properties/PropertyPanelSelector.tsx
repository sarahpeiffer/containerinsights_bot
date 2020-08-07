/** block / third party */
import * as React from 'react';

/** local */
import { MachinePropertiesPanel } from './MachinePropertyPanel';
import { ProcessPropertyPanel } from './ProcessPropertyPanel';
import { ProcessGroupPropertyPanel } from './ProcessGroupPropertyPanel';
import { ServerGroupPropertyPanel } from './ServerGroupPropertyPanel';
import { ServerGroupV3PropertyPanel } from './ServerGroupV3PropertyPanel';
import { ClientGroupPropertyPanel } from './ClientGroupPropertyPanel';
import { ClientGroupV3PropertyPanel } from './ClientGroupV3PropertyPanel';
import { ClientMemberMachinePropertyPanel } from './ClientMemberMachinePropertyPanel';
import { UnmonitoredMachinePropertyPanel } from './UnmonitoredMachinePropertyPanel';
import { UnmonitoredServerMemberMachinePropertyPanel } from './UnmonitoredServerMemberMachinePropertyPanel';
import { ServerMemberMachineMachinePropertyPanel } from './ServerMemberMachinePropertyPanel';
import { VirtualGroupPropertyPanel } from './VirtualGroupPropertyPanel';
import { AllServerPortsPropertyPanel } from './AllServerPortGroupNodePropertyPanel';
import { OnboardingState } from '../../OnboardingUtil';
import { IVmResourceDescriptor } from '../../VirtualMachineBase';
import { IResourceInfo } from '../../ResourceInfo';
import { IComputerInfo } from '../../control-panel/ComputerProvider';
import { EntityType } from '../data-models/EntityType';

/** shared */
import { ITelemetry } from '../../../../shared/Telemetry';
import { GuestHealth, PlatformHealth } from '../../../../shared/IHealthInfo';
import { MessagingProvider } from '../../../../shared/MessagingProvider';
import { ComputerGroup } from '../../../../shared/ComputerGroup';
import { IWorkspaceInfo } from '../../../../shared/IWorkspaceInfo';

export class IPropertyPanelCallbackCollection {
    onMemberMachineConnectionSelected?: (selectedConnection: DependencyMap.Connection) => void;
    onOpenOnboarding?: (resourceId: string) => void;
    onServerPortVisibilitySelectionChanged?: (visiblePortIds: string[]) => void;
    getGroupType?: () => string;
}

export interface PropertyPanelSelectedContext {
    selectedEntity: DependencyMap.IMapEntity;
    // TODO rp: If the propertyPanel is opened in SingleVM mode, we should pass vm resource descriptor as selectedScopeFilter
    // If the panel is opened in AtScale view, we should pass selected scope filter.
    selectedScopeFilter?: ComputerGroup | IResourceInfo | IComputerInfo;
}

export class IPropertyPanelSelectionProps {
    selectedContext: PropertyPanelSelectedContext;
    workspace?: IWorkspaceInfo;
    telemetry: ITelemetry;
    /**
     * Assortment of callbacks that can be passed into this component, types
     * defined in `IPropertyPanelCallbackCollection`. May need to revisit
     * this in the future.
     *
     * @type {IPropertyPanelCallbackCollection}
     * @memberof IPropertyPanelSelectionProps
     */
    callbackCollection?: IPropertyPanelCallbackCollection;
    messagingProvider: MessagingProvider;
    logPrefix?: string;
    vm?: IVmResourceDescriptor; // TODO rp: Remove this and pass selectedScopeFilter
    onboardingState?: OnboardingState;
    guestHealth?: GuestHealth;
    platformHealth?: PlatformHealth;
    startDateTimeUtc: Date;
    endDateTimeUtc: Date;
    featureFlags?: StringMap<boolean>;
}

/**
 * Render the appropriate property panel for given selectedContext
 *
 * @export
 * @class PropertyPanelSelector
 * @extends {React.Component<IPropertyPanelSelectionProps>}
 */
export class PropertyPanelSelector extends React.Component<IPropertyPanelSelectionProps> {
    constructor(props: IPropertyPanelSelectionProps) {
        super(props);
    }

    /**
     * DependencyMap.EntityType (const enumeration) to string conversion
     *
     * TODO ak - do we need to localize these?
     *
     * @param  {DependencyMap.EntityType} entityType
     * @return string 
     */
    public static GetEntityTypeName(entityType: DependencyMap.EntityType): string {
        switch (entityType) {
            case DependencyMap.EntityType.Acceptor:
                return 'Acceptor';
            case DependencyMap.EntityType.AggConnection:
                return 'AggConnection';
            case DependencyMap.EntityType.ClientGroup:
                return 'ClientGroup';
            case DependencyMap.EntityType.ClientGroupMember:
                return 'ClientGroupMember';
            case DependencyMap.EntityType.ClientGroupMemberMachine:
                return 'ClientGroupMemberMachine';
            case DependencyMap.EntityType.ClientGroupMemberVirtualConnection:
                return 'ClientGroupMemberVirtualConnection';
            case DependencyMap.EntityType.ClientGroupV3:
                return 'ClientGroupV3';
            case DependencyMap.EntityType.ClientOrServerGroupMember:
                return 'ClientOrServerGroupMember';
            case DependencyMap.EntityType.Connection:
                return 'Connection';
            case DependencyMap.EntityType.Machine:
                return 'Machine';
            case DependencyMap.EntityType.MachineGroup:
                return 'MachineGroup';
            case DependencyMap.EntityType.MachineStub:
                return 'MachineStub';
            case DependencyMap.EntityType.Port:
                return 'Port';
            case DependencyMap.EntityType.Process:
                return 'Process';
            case DependencyMap.EntityType.ProcessGroup:
                return 'ProcessGroup';
            case DependencyMap.EntityType.ServerGroup:
                return 'ServerGroup';
            case DependencyMap.EntityType.ServerGroupMemberMachine:
                return 'ServerGroupMemberMachine';
            case DependencyMap.EntityType.ServerGroupMemberVirtualConnection:
                return 'ServerGroupMemberVirtualConnection';
            case DependencyMap.EntityType.ServerGroupV3:
                return 'ServerGroupV3';
            case DependencyMap.EntityType.UnconnectedProcesses:
                return 'UnconnectedProcesses';
            default:
                return 'unknown type';
        }
    }

    public render(): JSX.Element {
        let propertyPanel: JSX.Element = null;
        const callbacks: IPropertyPanelCallbackCollection = this.props.callbackCollection || {};

        if (this.props.selectedContext)  {
            const entity: any = this.props.selectedContext && (this.props.selectedContext.selectedEntity || { type: {} });
            switch (entity.type) {
                case DependencyMap.EntityType.Machine:
                    propertyPanel = <MachinePropertiesPanel
                        machine={entity}
                        linkProperties={entity.linkProperties}
                        guestHealth={this.props.guestHealth}
                        platformHealth={this.props.platformHealth}
                        messagingProvider={this.props.messagingProvider}
                        logPrefix={this.props.logPrefix}
                        telemetry={this.props.telemetry}
                        vm={this.props.vm}
                        onboardingState={this.props.onboardingState}
                        featureFlags={this.props.featureFlags}
                    />;
                    break;
                case DependencyMap.EntityType.Process:
                    propertyPanel = <ProcessPropertyPanel process={entity} />;
                    break;
                case DependencyMap.EntityType.ProcessGroup:
                    propertyPanel = <ProcessGroupPropertyPanel processGroup={entity} />;
                    break;
                case DependencyMap.EntityType.ServerGroup:
                    propertyPanel = <ServerGroupPropertyPanel serverGroup={entity} />;
                    break;
                case DependencyMap.EntityType.ServerGroupV3:
                    propertyPanel = <ServerGroupV3PropertyPanel serverGroupV3={entity} />;
                    break;
                case DependencyMap.EntityType.ClientGroup:
                    propertyPanel = <ClientGroupPropertyPanel clientGroup={entity} />;
                    break;
                case DependencyMap.EntityType.ClientGroupV3:
                    propertyPanel = <ClientGroupV3PropertyPanel clientGroupV3={entity} />;
                    break;
                case DependencyMap.EntityType.ClientGroupMemberMachine:
                    if (entity.isMonitored) {
                        propertyPanel = <ClientMemberMachinePropertyPanel
                            memberMachine={entity}
                            onMemberMachineConnectionSelected={callbacks.onMemberMachineConnectionSelected} 
                            logPrefix={this.props.logPrefix}
                            telemetry={this.props.telemetry}
                            messagingProvider={this.props.messagingProvider} />;
                    } else {
                        propertyPanel = <UnmonitoredMachinePropertyPanel
                            machineName={entity.displayName}
                            linkProperties={entity.linkProperties} />;
                    }
                    break;
                case DependencyMap.EntityType.ServerGroupMemberMachine:
                    if (entity.isMonitored) {
                        propertyPanel = <ServerMemberMachineMachinePropertyPanel
                            memberMachine={entity}
                            onMemberMachineConnectionSelected={callbacks.onMemberMachineConnectionSelected} 
                            logPrefix={this.props.logPrefix} 
                            telemetry={this.props.telemetry}
                            messagingProvider={this.props.messagingProvider} />;
                    } else {
                        propertyPanel = <UnmonitoredServerMemberMachinePropertyPanel
                            memberMachine={entity}
                            onMemberMachineConnectionSelected={callbacks.onMemberMachineConnectionSelected} />;
                    }
                    break;
                case EntityType.UnmonitoredMachine:
                    propertyPanel = <UnmonitoredMachinePropertyPanel
                        machineName={entity.displayName}
                        linkProperties={entity.linkProperties}
                        vmResourceId={entity.id}
                        openOnboarding={callbacks.onOpenOnboarding}
                        telemetry={this.props.telemetry}
                    />;
                    break;
                case DependencyMap.EntityType.VirtualGroupNode:
                    propertyPanel = <VirtualGroupPropertyPanel group={entity} getGroupType={callbacks.getGroupType}
                        machine={entity.machines[0]}
                        messagingProvider={this.props.messagingProvider}
                        logPrefix={this.props.logPrefix}
                        telemetry={this.props.telemetry} 
                        selectedResource={this.props.selectedContext.selectedScopeFilter as ComputerGroup | IResourceInfo}
                        />;
                    break;
                case DependencyMap.EntityType.AllPortsNode:
                    propertyPanel = <AllServerPortsPropertyPanel
                        allPortsNode={entity}
                        onPortVisibilitySelectionChanged={callbacks.onServerPortVisibilitySelectionChanged} />;
                    break;
                default:
                    console.error('Unable to display property panel. Type of panel to display is not defined for entity type: '
                        + entity.type);
                    break;
            }
        }

        return propertyPanel;
    }
}
