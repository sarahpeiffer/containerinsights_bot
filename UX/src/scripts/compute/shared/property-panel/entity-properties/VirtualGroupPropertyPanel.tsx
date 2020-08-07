/** block / third party */
import * as React from 'react';
/**
 * shared
 */
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { ClientServerGroupLogoSVG } from '../../../../shared/svg/client-server-group-logo';
import { PropertyPanelHeaderSection } from '../../../../shared/property-panel/PropertyPanelHeaderSection';
import { SimpleProperty } from '../../../../shared/property-panel/SimpleProperty';
import { GroupPropertyPanel, IGroupPropertyPanelProps } from './map-entity-adaptor/GroupPropertyPanel';
import { ComputerGroup, ServiceMapComputerGroup, ServiceMapGroupType } from '../../../../shared/ComputerGroup';
import { IResourceInfo, VmInsightsResourceType, ResourceInfo } from '../../ResourceInfo';

/**
 * compute imports
 */
import { ILinkToNavigate, LinkToNavigateAdaptor, NavigationDestination } from './LinkToNavigateAdaptor';
import { MessagingProvider } from '../../../../shared/MessagingProvider';
import { ITelemetry } from '../../../../shared/Telemetry';

/**
 * Adaptor to translate DependencyMap.VirtulGroupNodeViewModel's properties
 */
export class VirtualGroupPropertyPanelAdaptor {
    group: DependencyMap.VirtualGroupNodeViewModel;
    getGroupType: () => string;
    constructor(virtualGroup: DependencyMap.VirtualGroupNodeViewModel, getGroupType: () => string) {
        this.group = virtualGroup || {} as any;
        this.getGroupType = getGroupType || function (): string { return 'Unknown' };
    }
    getIcon(): JSX.Element {
        return <ClientServerGroupLogoSVG />
    }
    getTitle(): string {
        return this.group.displayName || DisplayStrings.undefine;
    }
    getSubTitle(): string {
        return DisplayStrings.VirtualGroupSubTitle;
    }

    getComputeResourceSummary(): IGroupPropertyPanelProps {
        let groupSummaryCount: IGroupPropertyPanelProps = {
            vmCount: 0,
            vmssCount: 0,
            onPremCount: 0,
            linuxCount: 0,
            windowsCount: 0
        }


        this.group.machines.forEach(machine => {
            if (machine.hosting) {
                if (machine.hosting.vmScaleSet) {
                    groupSummaryCount.vmssCount++;
                } else {
                    groupSummaryCount.vmCount++;
                }
            } else {
                groupSummaryCount.onPremCount++;
            }
            if (machine.operatingSystem) {
                switch (machine.operatingSystem.familyType) {
                    case DependencyMap.OperatingSystemFamilyType.Linux: groupSummaryCount.linuxCount++;
                        break;
                    case DependencyMap.OperatingSystemFamilyType.Windows: groupSummaryCount.windowsCount++;
                        break;
                    default: break;
                }
            }
        });
        return groupSummaryCount;
    }
}

/** 
 * Properties of the component below
*/
interface IVirtualGroupPropertyPanelProps {
    group: DependencyMap.VirtualGroupNodeViewModel;
    getGroupType: () => string;
    messagingProvider?: MessagingProvider;
    logPrefix?: string;
    telemetry: ITelemetry;
    machine?: DependencyMap.Machine;
    //TODO rp: Create a super class that extends and implements ComputerGroup and IVmInsightsResourceInfo.
    selectedResource?: ComputerGroup | IResourceInfo;
}

/**
 * A component to visualize the properties of a a VirtulGroupNodeViewModel
 * @param props Visualization properties
 */
export class VirtualGroupPropertyPanel extends React.Component<IVirtualGroupPropertyPanelProps> {

    constructor(props?: IVirtualGroupPropertyPanelProps) {
        super(props);
    }

    public render() {
        const group = new VirtualGroupPropertyPanelAdaptor(this.props.group, this.props.getGroupType);
        //TODO rp: Create a new class for Azure Resource (Task: 5575897)
        const azureResource = new ResourceInfo(this.props.selectedResource as IResourceInfo);

        const linkToNavigate: ILinkToNavigate = this.getLinkToNavigateParams(this.props.machine, this.props.selectedResource);

        return (<>
            <PropertyPanelHeaderSection
                icon={azureResource.icon ? azureResource.icon :
                    this.props.selectedResource ? (this.props.selectedResource as ComputerGroup).icon : group.getIcon()}
                title={group.getTitle()}
                subTitle={group.getSubTitle()}
                linkToNavigate={linkToNavigate}
                telemetry={this.props.telemetry}
                logPrefix={`${this.props.logPrefix}.VirtualGroupPropertyPanel`}
            />
            <SimpleProperty
                propertyName={DisplayStrings.Name}
                propertyValues={[group.getTitle()]}
                propertyIcon={linkToNavigate && (azureResource.icon ? azureResource.icon :
                    this.props.selectedResource ? (this.props.selectedResource as ComputerGroup).icon : null)}
                linkToNavigate={linkToNavigate}
                enableCopyToClipboard={true}
                telemetry={this.props.telemetry}
                logPrefix={`${this.props.logPrefix}.VirtualGroupPropertyPanel`}
            />
            <GroupPropertyPanel groupSummaryCount={group.getComputeResourceSummary()} />
        </>);
    }

    /**
     * To get the navigation context for Group Property Panel
     * @param machine 
     * @param computerGroup 
     */
    private getLinkToNavigateParams(machine: DependencyMap.Machine,
        computerGroup: ComputerGroup | IResourceInfo): ILinkToNavigate {
        if (!machine || !computerGroup) {
            return null;
        }
        let resourceId: string = null;
        if (machine.hosting) {
            if ((machine.hosting as any).resourceId as string) {
                resourceId = (machine.hosting as any).resourceId as string;
            }
            if (machine.hosting.vmScaleSet && machine.hosting.vmScaleSet.resourceId) {
                resourceId = machine.hosting.vmScaleSet.resourceId;
            }
        }
        let linkText: string = null;
        if ((computerGroup as ServiceMapComputerGroup) && (computerGroup as ServiceMapComputerGroup).ServiceMapGroupType) {
            linkText = this.mapServiceMapGroupTypeToDisplayString(computerGroup as ComputerGroup);
        }
        if ((computerGroup as IResourceInfo) && (computerGroup as IResourceInfo).type) {
            linkText = this.mapAzureResourceTypeToDisplayString(computerGroup as IResourceInfo);
        }
        if (!linkText || !resourceId) {
            return null;
        }
        return LinkToNavigateAdaptor.navigationParams(NavigationDestination.resourceOverview,
            { linkUri: resourceId, linkText: linkText }, this.props.messagingProvider);
    }

    /**
     * To get the the Service Map Group type (Used for Hybrid Scope)
     * @param computerGroup 
     */
    private mapServiceMapGroupTypeToDisplayString(computerGroup: ComputerGroup): string {
        switch ((computerGroup as ServiceMapComputerGroup).ServiceMapGroupType) {
            case ServiceMapGroupType.AzureVMScaleSet:
                return DisplayStrings.Name;
            case ServiceMapGroupType.AzureResourceGroup:
                return DisplayStrings.ResourceGroup;
            case ServiceMapGroupType.AzureSubscription:
                return DisplayStrings.SubscriptionId;
            default: return null;
        }
    }

    /**
     * To get group type (Used for Azure Scope)
     * @param computerGroup 
     */
    private mapAzureResourceTypeToDisplayString(computerGroup: IResourceInfo) {
        switch (computerGroup.type) {
            case VmInsightsResourceType.VirtualMachineScaleSet:
                return DisplayStrings.Name;
            case VmInsightsResourceType.ResourceGroup:
                return DisplayStrings.ResourceGroup;
            case VmInsightsResourceType.Subscription:
                return DisplayStrings.SubscriptionId;
            default: return null;
        }
    }
}
