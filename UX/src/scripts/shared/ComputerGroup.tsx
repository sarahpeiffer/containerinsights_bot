import * as React from 'react';

import { Promise } from 'es6-promise'

import { ComputerGroupSvg } from './svg/azure-computer-group';
import { ServiceMapGroupSvg } from './svg/ServiceMapGroupSvg';
import { VmScalesetSvg } from './svg/azure-vm-scaleset';
import { ServiceFabricSvg } from './svg/azure-service-fabric';
import { ResourceGroupSvg } from './svg/azure-resource-group';

/**
 * Specifies the type of a computer group.
 */
export enum ComputerGroupType {
    OmsComputerGroup,
    ServiceMapMachineGroup,
    AzureGroup // This can be a resourceGroup or a VMSS or a ServiceFabric or any Azure group which can be identified with ARMId.
}

/**
 * Describes the memner of a computer group.
 */
export interface IComputerGroupMember {
    /**
     * Display name.
     */
    displayName?: string
    /**
     * (ServiceMap) resource id
     */
    id?: string;
    /**
     * (ServiceMap) resource name
     */
    name?: string;
    /**
     * (ServiceMap) computerName (fqdn)
     */
    computerName?: string;
}

/**
 * Represents a computer group
 * that is resolved to components that can be used
 * for operations on the group.
 */
export interface IResolvedComputerGroup {
    /**
     * Group type
     */
    groupType: ComputerGroupType;
    /**
     * Oms function name. Defined
     * only for OMS groups.
     */
    omsFunctionName?: string;
    /**
     * Group members.
     * Defined only for ServiceMap groups.
     */
    members?: IComputerGroupMember[];

    /**
     * If the group is azure group like VMSS or CloudService or ServiceFabric
     * then directly return the resourceId.
     */
    resourceId?: string;
}

/**
 * Base class for computer groups.
 */
export abstract class ComputerGroup {
    protected _resolvedComputerGroup: IResolvedComputerGroup;

    private _id: string;
    private _displayName: string;
    private _groupType: ComputerGroupType;

    constructor(id: string, displayName: string, groupType: ComputerGroupType) {
        this._id = id;
        this._displayName = displayName;
        this._groupType = groupType;
    }

    get id(): string {
        return this._id;
    }

    get displayName(): string {
        return this._displayName;
    }

    get groupType(): ComputerGroupType {
        return this._groupType;
    }

    abstract get icon(): JSX.Element;

    public abstract resolve(): Promise<IResolvedComputerGroup>;
}

export class OmsComputerGroup extends ComputerGroup {
    private _functionName: string;

    constructor(id: string, displayName: string, functionName: string) {
        super(id, displayName, ComputerGroupType.OmsComputerGroup);
        this._functionName = functionName;
    }

    get functionName(): string {
        return this._functionName;
    }

    public resolve() {
        this._resolvedComputerGroup = {
            groupType: this.groupType,
            omsFunctionName: this._functionName
        };
        return Promise.resolve(this._resolvedComputerGroup);
    }

    get icon(): JSX.Element {
        return <ComputerGroupSvg />;
    }
}

/**
 * Specifies the type of a ServiceMap group.
 */
export enum ServiceMapGroupType {
    /**
     * Unknown type: used as fallback.
     */
    Unknown,
    /**
     * Manually created group.
     */
    Manual,
    /**
     * Azure cloud service (dynamic)
     */
    AzureCloudService,
    /**
     * Azure service fabric (dynamic)
     */
    AzureServiceFabric,
    /**
     * Azure VM scaleset (dynamic)
     */
    AzureVMScaleSet,
    /**
     * Azure resource group
     */
    AzureResourceGroup,
    /**
     * Subsciption group.
     * Group of all resources belong to a subscription will have this group type.
     */
    AzureSubscription
}

/**
 * Resolver for a ServiceMap group.
 */
export interface IServiceMapGroupResolver {
    /**
     * Resolves the membership of the specified group.
     */
    resolveGroup(group: ServiceMapComputerGroup): Promise<IResolvedComputerGroup>
}

/**
 * Represents a ServiceMap group.
 */
export class ServiceMapComputerGroup extends ComputerGroup {
    private _serviceMapGroupType: ServiceMapGroupType;
    private _provider: IServiceMapGroupResolver;
    private _icon: JSX.Element;

    constructor(id: string, displayName: string,
        serviceMapGroupType: ServiceMapGroupType, provider: IServiceMapGroupResolver) {
        super(id, displayName, ComputerGroupType.ServiceMapMachineGroup);

        this._serviceMapGroupType = serviceMapGroupType;
        this._provider = provider;
        this._icon = <ServiceMapGroupSvg groupType={serviceMapGroupType} />;
    }

    get ServiceMapGroupType(): ServiceMapGroupType {
        return this._serviceMapGroupType;
    }

    public resolve() {
        if (this._resolvedComputerGroup) {
            return Promise.resolve(this._resolvedComputerGroup);
        }
        // TODO: group resolution requires start/end time
        // TODO: we can be smarter here: instead of re-resolving the
        // group membership repeatedly, we can cache the resolution and
        // have logic to drive cache expiration.
        return this._provider.resolveGroup(this).then((resolvedGroup) => {
            this._resolvedComputerGroup = resolvedGroup;
            return resolvedGroup;
        });
    }

    get icon(): JSX.Element {
        return this._icon;
    }
}

export enum AzureGroupType {
    Vmss,
    ResourceGroup,
    ServiceFabric
}

export class AzureGroup extends ComputerGroup {
    private _azureGroupType: AzureGroupType;
    constructor(id: string, displayName: string, azureGroupType: AzureGroupType) {
        super(id, displayName, ComputerGroupType.AzureGroup);
        this._azureGroupType = azureGroupType;
    }

    public resolve() {
        this._resolvedComputerGroup = {
            groupType: this.groupType,
            resourceId: this.id
        };
        return Promise.resolve(this._resolvedComputerGroup);
    }

    get ServiceMapGroupType(): AzureGroupType {
        return this._azureGroupType;
    }

    get icon(): JSX.Element {
        switch (this._azureGroupType) {
            case AzureGroupType.ServiceFabric:
                return <ServiceFabricSvg />;
            case AzureGroupType.Vmss:
                return <VmScalesetSvg />;
            case AzureGroupType.ResourceGroup:
                return <ResourceGroupSvg />;
            default:
                return undefined;
        }
    }
}
