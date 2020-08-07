import * as React from 'react';
import { VmScalesetSvg } from '../../shared/svg/azure-vm-scaleset';
import { ResourceGroupSvg } from '../../shared/svg/azure-resource-group';
import { SubscriptionGroupSvg } from '../../shared/svg/azure-subscription-group';
export enum VmInsightsResourceType {
    /**
     * All VMInsights queries can be run on a subscription resource or on a resourceGroup resource
     * or on a VM or on a VMSS
     */
    All = 'All',
    Subscription = 'Subscription',
    ResourceGroup = 'ResourceGroup',
    VirtualMachine = 'VirtualMachine',
    VirtualMachineScaleSet = 'VirtualMachineScaleSet',
    ServiceMapGroups = 'ServiceMapGroups',
    ServiceMapComputer = 'ServiceMapComputer',
    VmScaleSetInstance = 'VmScaleSetInstance',
    AzureArcMachine = 'AzureArcMachine'
}

export interface IResourceInfo {
    id: string;
    displayName: string;
    fqdn?: string;
    location?: string;
    type: VmInsightsResourceType;
}

export interface IAzureResourceDescriptor {
    subscription: string;
    resourceGroup?: string;
    type?: string;
    resources?: string[];
    resourceId: string;
}

/**
 * Mainly created to ensure consistency of the resource ID. Some IDs are GUIDs while
 * others are ARM IDs. For example, Subscriptions are raw PortalFx objects and `id`
 * is only the subscription GUID whereas Resource Groups are represented by their
 * full ARM ID within the blade.
 *
 * @export
 * @class ResourceInfo
 * @implements {IResourceInfo}
 */
export class ResourceInfo implements IResourceInfo {
    private _id: string;
    private _displayName: string;
    private _fqdn: string;
    private _location: string;
    private _type: VmInsightsResourceType;

    constructor(params: IResourceInfo) {
        if (!params) {
            return;
        }

        this._id = params.id;
        this._displayName = params.displayName;
        this._fqdn = params.fqdn;
        this._location = params.location;
        // If type is not present, infer from resourceId.
        let type: VmInsightsResourceType;
        if (params.id && !params.type) {
            if (params.id.toLowerCase().indexOf('microsoft.compute/virtualmachinescalesets/') !== -1
                && params.id.toLowerCase().indexOf('/virtualmachines/') !== -1) {
                type = VmInsightsResourceType.VmScaleSetInstance;
            } else if (params.id.toLowerCase().indexOf('microsoft.compute/virtualmachinescalesets') !== -1) {
                type = VmInsightsResourceType.VirtualMachineScaleSet;
            } else if (params.id.toLowerCase().indexOf('microsoft.compute/virtualmachines') !== -1) {
                type = VmInsightsResourceType.VirtualMachine;
            } else if (params.id.toLowerCase().indexOf('microsoft.hybridcompute/machines/') !== -1) {
                type = VmInsightsResourceType.AzureArcMachine;
            }
        }
        this._type = params.type || type;
    }

    public get id(): string {
        switch (this._type) {
            case VmInsightsResourceType.Subscription:
                if (this._id.indexOf('/subscriptions/') < 0) {
                    return '/subscriptions/' + this._id;
                }
                break;
            default:
                break;
        }
        return this._id;
    }

    public get displayName(): string {
        return this._displayName || this._id;
    }

    public get fqdn(): string {
        return this._fqdn;
    }

    public get location(): string {
        return this._location;
    }

    public get type(): VmInsightsResourceType {
        return this._type;
    }

    get icon(): JSX.Element {
        switch (this.type) {
            case VmInsightsResourceType.VirtualMachineScaleSet:
                return <VmScalesetSvg />;
            case VmInsightsResourceType.ResourceGroup:
                return <ResourceGroupSvg />;
            case VmInsightsResourceType.Subscription:
                return <SubscriptionGroupSvg />
            default: return null;
        }
    }

    public IsDefault(): boolean {
        return this._id === 'all';
    }

    public toJSON(): IResourceInfo {
        return {
            id: this._id,
            displayName: this._displayName,
            location: this._location,
            fqdn: this._fqdn,
            type: this._type
        };
    }
}
