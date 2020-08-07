/** block / third party */
import * as React from 'react';

/**
 * compute imports
 */
import { MapEntityUtility as mapUtility } from '../MapEntityUtility';
/**
 * Shared imports
 */
import * as AzureColors from '../../../../../shared/AzureColors';
import { MachineLogoSVG } from '../../../../../shared/svg/machine-log';
import { WindowsLogoSVG } from '../../../../../shared/svg/windows-logo';
import { LinuxLogoSVG } from '../../../../../shared/svg/linux-logo';
import { VmSvg } from '../../../../../shared/svg/vm';
import { ResourceGroupSvg } from '../../../../../shared/svg/azure-resource-group';
import { SubscriptionGroupSvg } from '../../../../../shared/svg/azure-subscription-group';
import { StringHelpers } from '../../../../../shared/Utilities/StringHelpers';
import { DisplayStrings } from '../../../../../shared/DisplayStrings';
import { ITelemetry } from '../../../../../shared/Telemetry';
import * as msg from '../../../../../shared/MessagingProvider';

/**
 * local
 */
import { ISimplePropertyProps } from '../../../../../shared/property-panel/SimpleProperty';
import { IDonutChartSlice } from '../../component/DonutChart';
import { ErrorSeverity } from '../../../../../shared/data-provider/TelemetryErrorSeverity';
import { InfoTooltipProps } from '../../../InfoTooltip';
import { LinkToNavigateAdaptor, NavigationDestination } from '../LinkToNavigateAdaptor';
import { VmssSvg } from '../../../../../shared/svg/vmss';
import { ArcVmSvg } from '../../../../../shared/svg/arc-vm';

export class MachinePropertyPanelAdaptor {
    machine: DependencyMap.Machine;
    messagingProvider: msg.MessagingProvider;

    private telemetry: ITelemetry;
    constructor(telemetry: ITelemetry, entity: DependencyMap.IEntity, messageProvider?: msg.MessagingProvider) {
        const mapMachine = entity as DependencyMap.Machine;
        this.machine = mapMachine || {} as any;
        this.telemetry = telemetry;
        this.messagingProvider = messageProvider;
    }

    /**
    * Retrieves the MachinePropertyPanelAdaptor corresponding to the entity type
    * or undefined if there is the adaptor is not one of the types containing a machine
    * @static
    * @param  {DependencyMap.IMapEntity} entity 
      * @memberof MachinePropertyPanelAdaptor
    */
    public static getMachineAdaptor(telemetry: ITelemetry, entity: DependencyMap.IMapEntity,
        messagingProvider?: msg.MessagingProvider): MachinePropertyPanelAdaptor {
        switch (entity.type) {
            case DependencyMap.EntityType.Machine:
                return new MachinePropertyPanelAdaptor(telemetry, entity, messagingProvider);
            case DependencyMap.EntityType.ClientGroupMemberMachine:
            case DependencyMap.EntityType.ServerGroupMemberMachine:
                const memberMachine = entity as DependencyMap.ClientOrServerGroupMemberMachine;
                return new MachinePropertyPanelAdaptor(telemetry, memberMachine.machine, messagingProvider);
            default:
                return undefined;
        }
    }

    public getIcon(): JSX.Element {
        let icon = <MachineLogoSVG />;
        if (this.machine.operatingSystem) {
            if (this.machine.operatingSystem.familyType ===
                DependencyMap.OperatingSystemFamilyType.Windows) {
                icon = <WindowsLogoSVG />;
            } else if (this.machine.operatingSystem.familyType ===
                DependencyMap.OperatingSystemFamilyType.Linux) {
                icon = <LinuxLogoSVG />;
            }
        }
        return icon;
    }

    public getTitle(): string {
        return this.machine?.hosting?.name || this.machine?.displayName || DisplayStrings.undefine;
    }

    public getSubTitle(): string {
        return DisplayStrings.MachineSubTitle;
    }

    public getLogEventSubTitle(): string {
        return DisplayStrings.MachineLogEvents;
    }

    public getProperties(): ISimplePropertyProps[] {
        const bodyList: ISimplePropertyProps[] = [];
        let machine = this.machine;

        const networking = mapUtility.get(machine.networking);
        const operatingSystem = mapUtility.get(machine.operatingSystem);
        const resources = mapUtility.get(machine.resources);
        const virtualMachine = mapUtility.get(machine.virtualMachine);
        const agent = mapUtility.get(machine.agent);

        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.FQDN, [machine.fullyQualifiedDomainName]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.OS, [operatingSystem.fullName]));

        if (mapUtility.hasMap(networking.ipv4Interfaces)) {
            mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.IPv4,
                networking.ipv4Interfaces.map((obj) => { return obj.cidrNotation; })));
        }

        if (mapUtility.hasMap(networking.defaultIpv4Gateways)) {
            mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.DefaultIPv4Gateway,
                networking.defaultIpv4Gateways.map((obj) => { return obj; })));
        }

        if (mapUtility.hasMap(networking.ipv6Interfaces)) {
            mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.IPv6,
                networking.ipv6Interfaces.map((obj) => { return obj.ipAddress; })));
        }

        if (mapUtility.hasMap(networking.macAddresses)) {
            // tslint:disable-next-line:max-line-length
            mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.MacAddress, networking.macAddresses.map((obj) => { return obj; })));
        }

        if (mapUtility.hasMap(networking.dnsNames)) {
            mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.DNSNames, networking.dnsNames.map((obj) => { return obj; })));
        }

        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.LastBootTime, [machine.bootTime]));

        if (machine.resources) {
            if (machine.resources.cpus && machine.resources.cpuSpeed) {
                const cpuBody = StringHelpers.replaceAll(
                    StringHelpers.replaceAll(DisplayStrings.CPUBody, '{0}', '' + resources.cpus),
                    '{1}', '' + resources.cpuSpeed);
                mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.CPUs, [cpuBody]));
            }

            if (resources.physicalMemory) {
                const memoryBody = StringHelpers.replaceAll(DisplayStrings.MemoryBody, '{0}', '' + resources.physicalMemory);
                mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.PhysicalMemory, [memoryBody]));
            }
        }

        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.Virtualization, [machine.virtualizationState]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.VMType, [virtualMachine.virtualMachineType]));

        
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.AgentVersion, [agent.dependencyAgentVersion], null, null, 
            LinkToNavigateAdaptor.navigationParams(NavigationDestination.updateDa, 
                {linkUri: DisplayStrings.UpdateDaUri, linkText: DisplayStrings.Update}), this.evalDaVersion(agent.dependencyAgentVersion)));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.OMSAgent, [agent.agentId]));

        return bodyList;
    }

    /**
     * turn machine dependency count into donutChartSlice, if all zero, return null.
     */
    public getMachineDependency(): IDonutChartSlice[] {
        const machine = this.machine;

        if (!machine.getConnectedClientCount || !machine.getConnectedServerCount
            || (machine.getConnectedClientCount() <= 0 && machine.getConnectedServerCount() <= 0)) {
            return null;
        }

        const machineDependencies: IDonutChartSlice[] = [];
        machineDependencies.push({
            label: mapUtility.getCorrectPluralForm(machine.getConnectedServerCount(),
                DisplayStrings.ConnectedServer, DisplayStrings.ConnectedServers),
            value: machine.getConnectedServerCount(),
            color: AzureColors.BLUE
        });
        machineDependencies.push({
            label: mapUtility.getCorrectPluralForm(machine.getConnectedClientCount(),
                DisplayStrings.ConnectedClient, DisplayStrings.ConnectedClients),
            value: machine.getConnectedClientCount(),
            color: AzureColors.LIGHT_BLUE
        });
        return machineDependencies;
    }

    public getAzureVMProperties(): ISimplePropertyProps[] {
        let machine = this.machine;
        let bodyList: ISimplePropertyProps[] = [];

        let hosting = mapUtility.get(machine.hosting) as any;

        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.Name, [hosting.name], null, <VmSvg />,
            LinkToNavigateAdaptor.navigationParams(NavigationDestination.resourceOverview, 
                {linkUri: hosting.resourceId, linkText: DisplayStrings.Name}, this.messagingProvider)));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.ResourceGroup, [hosting.resourceGroup],
            null, <ResourceGroupSvg />,
            LinkToNavigateAdaptor.navigationParams(NavigationDestination.resourceOverview, 
                {linkUri: hosting.resourceId, linkText: DisplayStrings.ResourceGroup}, this.messagingProvider)));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.SubscriptionId, [hosting.subscriptionId],
            null, <SubscriptionGroupSvg />,
            LinkToNavigateAdaptor.navigationParams(NavigationDestination.resourceOverview, 
                {linkUri: hosting.resourceId, linkText: DisplayStrings.SubscriptionId}, this.messagingProvider)));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.Location, [hosting.location]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.Size, [hosting.size]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.ResourceId, [hosting.resourceId]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.VMId, [hosting.vmId]));

        let image = mapUtility.get(hosting.image);
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.ImagePublisher, [image.publisher]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.ImageSku, [image.sku]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.ImageVersion, [image.version]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.UpdateDomain, [hosting.updateDomain]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.FaultDomain, [hosting.faultDomain]));

        if (bodyList.length <= 0) {
            return null;
        } else {
            return bodyList;
        }
    }

    public getVMScaleSetProperties(): ISimplePropertyProps[] {
        let machine = this.machine;
        let bodyList: ISimplePropertyProps[] = [];
        let hosting = mapUtility.get(machine.hosting);
        let vmScaleSet = mapUtility.get(hosting.vmScaleSet);
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.Name, [vmScaleSet.name], null, <VmssSvg />, 
            LinkToNavigateAdaptor.navigationParams(NavigationDestination.resourceOverview, 
                {linkUri: vmScaleSet.resourceId, linkText: DisplayStrings.Name}, this.messagingProvider)));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.InstanceId, [vmScaleSet.instanceId]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.DeploymentId, [vmScaleSet.deployment]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.ResourceId, [vmScaleSet.resourceId]));

        if (bodyList.length <= 0) {
            return null;
        } else {
            return bodyList;
        }
    }

    public getCloudServiceProperties(): ISimplePropertyProps[] {
        const machine = this.machine;
        const bodyList: ISimplePropertyProps[] = [];
        const hosting = mapUtility.get(machine.hosting);
        const cloudService = mapUtility.get(hosting.cloudService);
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.Name, [cloudService.name]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.DeploymentId, [cloudService.deployment]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.Role, [cloudService.roleName]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.RoleType, [this.getCloudServiceRoleType(cloudService.roleType)]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.InstanceId, [cloudService.instanceId]));

        if (bodyList.length <= 0) {
            return null;
        } else {
            return bodyList;
        }
    }

    public getArcVmProperties(): ISimplePropertyProps[] {
        const machine = this.machine;
        const bodyList: ISimplePropertyProps[] = [];
        const hosting = mapUtility.get(machine.hosting) as any;

        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.Name, [hosting.name], null, <ArcVmSvg />,
            LinkToNavigateAdaptor.navigationParams(NavigationDestination.resourceOverview, 
                {linkUri: hosting.resourceId, linkText: DisplayStrings.Name}, this.messagingProvider)));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.ResourceGroup, [hosting.resourceGroup],
            null, <ResourceGroupSvg />,
            LinkToNavigateAdaptor.navigationParams(NavigationDestination.resourceOverview, 
                {linkUri: hosting.resourceId, linkText: DisplayStrings.ResourceGroup}, this.messagingProvider)));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.SubscriptionId, [hosting.subscriptionId],
            null, <SubscriptionGroupSvg />,
            LinkToNavigateAdaptor.navigationParams(NavigationDestination.resourceOverview, 
                {linkUri: hosting.resourceId, linkText: DisplayStrings.SubscriptionId}, this.messagingProvider)));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.Location, [hosting.location]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.ResourceId, [hosting.resourceId]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.VMId, [hosting.vmId]));

        if (bodyList.length <= 0) {
            return null;
        } else {
            return bodyList;
        }
    }

    /**
     * use fullyQualifiedDomainName most case.
     * for fqdn undefined, or end of .(none) or end of . , use computerName
     * TODO: better to have .(none) or . machine to test the logic. 
     */
    public getMachineNameForQuery(): string {
        let machineName = this.machine.fullyQualifiedDomainName;

        if (!machineName || machineName.length === 0 || machineName.substr(-7) === '.(none)'
            || machineName.indexOf('.') === machineName.length - 1) {
            machineName = this.machine.computerName;
        }

        if (!machineName) {
            this.telemetry.logException('FQDN and computerName are empty for machine.', 'getMachineNameForQuery', ErrorSeverity.Error, {
                displayName: this.machine.displayName,
                itemId: this.machine.id,
                computerName: this.machine.computerName,
                fqdn: this.machine.fullyQualifiedDomainName
            }, null);
        }

        return machineName;
    }

    public evalDaVersion(currentVersion: string): InfoTooltipProps {
        if (!currentVersion) {
            return null;
        }
        let infoTooltipParams: InfoTooltipProps = null;

        const latestVersion: string = DisplayStrings.LatestDaVersion;
        const latestVersionArray: number[] = latestVersion.split('.').map(Number);
        const currentVersionArray: number[] = currentVersion.split('.').map(Number);

        const length = Math.max(latestVersionArray.length, currentVersionArray.length);
        let result = 0;

        for (let i = 0; i < length && !result; i++) {
            result = (latestVersionArray[i] || 0) - (currentVersionArray[i] || 0);
        }

        if (result > 0) {
            infoTooltipParams = {
                description: DisplayStrings.UpdateDaMessage
            }
        } 
        return infoTooltipParams;
    }
    
    public getResourceId(): string {
        if (!this.machine || !this.machine.hosting) {
            return null;
        }
        const resourceId: any = mapUtility.get((this.machine.hosting as any)?.resourceId);

        if (typeof resourceId !== 'string') {
            return null;
        }

        return resourceId as string;
    }

    public getAgetnId(): string {
        const machine = this.machine;
        const agent = mapUtility.get(machine.agent);

        return agent?.agentId;
    }    

    private getCloudServiceRoleType(roleType: DependencyMap.AzureCloudServiceRoleType): string {
        switch (roleType) {
            case DependencyMap.AzureCloudServiceRoleType.Unknown:
                return DisplayStrings.Unknown;
            case DependencyMap.AzureCloudServiceRoleType.Worker:
                return DisplayStrings.Worker;
            case DependencyMap.AzureCloudServiceRoleType.Web:
                return DisplayStrings.Web;
            default: 
                return null;
        }
    }
}
