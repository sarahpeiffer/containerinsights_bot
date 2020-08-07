import * as React from 'react';
import { DisplayStrings } from '../../shared/DisplayStrings';
import { VmSvg } from '../../shared/svg/vm';
import { VmssSvg } from '../../shared/svg/vmss';
import { CloudServiceSvg } from '../../shared/svg/azure-cloud-service';
import { ArcVmSvg } from '../../shared/svg/arc-vm';
import { IAzureResourceDescriptor } from '../shared/ResourceInfo';
import { AtScaleUtils } from '../shared/AtScaleUtils';

export enum ComputeObjectType {
    StandAloneNode = 'StandAloneNode',
    AzureCloudServiceNode = 'AzureCloudServiceNode',
    AzureScaleSetNode = 'AzureScaleSetNode',
    NodeVolume = 'NodeVolume'
}

const UNKNOWN_OBJECT_NAME = '<<' + DisplayStrings.OptionUnknown + '>>';

export class KustoNodeIdentityResponseInterpreter {
    public static GetName(data: any): string {
        if (!data || !data.type) {
            return UNKNOWN_OBJECT_NAME;
        }

        switch (data.type) {
            case ComputeObjectType.NodeVolume:
                if (!data.volumeName || !data.node) {
                    return UNKNOWN_OBJECT_NAME;
                }
                return data.volumeName
                    + ' | ' + KustoNodeIdentityResponseInterpreter.getComputeNodeName(data.node);
            default:
                return KustoNodeIdentityResponseInterpreter.getComputeNodeName(data);
        }

    }

    //Get data type, for disk, we use it's node type
    public static GetIcon(data: any, isArcVm?: boolean): JSX.Element {
        if (!data || !data.type) {
            return null;
        }
        if (isArcVm) {
            return <ArcVmSvg />
        }
        switch (data.type) {
            case ComputeObjectType.StandAloneNode:
                return <VmSvg />
            case ComputeObjectType.AzureScaleSetNode:
                return <VmssSvg />
            case ComputeObjectType.AzureCloudServiceNode:
                return <CloudServiceSvg title={DisplayStrings.AzureCloudService} />
            default:
                return null;
        }
    }

    public static GetComputerType(data: any, isArcVm?: boolean): string {
        if (!data || !data.type) {
            return UNKNOWN_OBJECT_NAME;
        }
        if (isArcVm) {
            return DisplayStrings.ResourceTypeAzureArc;
        }
        switch (data.type) {
            case ComputeObjectType.StandAloneNode:
                return DisplayStrings.VirtualMachine;
            case ComputeObjectType.AzureScaleSetNode:
                return DisplayStrings.VirtualMachineScaleSet;
            case ComputeObjectType.AzureCloudServiceNode:
                return DisplayStrings.AzureCloudService;
            default:
                return UNKNOWN_OBJECT_NAME;
        }
    }

    private static getComputeNodeName(data: any): string {
        if (!data) {
            return UNKNOWN_OBJECT_NAME;
        }

        switch (data.type) {
            case ComputeObjectType.StandAloneNode:
                const name: string = KustoNodeIdentityResponseInterpreter.getAzureResourceNodeName(data);
                return name || data.name;
            case ComputeObjectType.AzureCloudServiceNode:
                return data.fullDisplayName || data.cloudServiceInstanceId
                    + ' | ' + data.cloudServiceName;
            case ComputeObjectType.AzureScaleSetNode:
                return (data.fullDisplayName || data.scaleSetInstanceId)
                    + (data.serviceFabricClusterName ? ' | ' + data.serviceFabricClusterName : '');
            default:
                return UNKNOWN_OBJECT_NAME;
        }
    }

    /**
     * If this node is an Azure node, try to extract name from its resource ID else it
     * returns `undefined`
     *
     * @private
     * @static
     * @param {*} data
     * @returns {string}
     * @memberof KustoNodeIdentityResponseInterpreter
     */
    private static getAzureResourceNodeName(data: any): string {
        let name: string;

        const azureResourceId: string = data.azureResourceId;
        const resourceDescriptor: IAzureResourceDescriptor = AtScaleUtils.getAzureComputeResourceDescriptor(azureResourceId);
        const resourcesLength: number = resourceDescriptor?.resources?.length;

        if (!!resourcesLength) {
            name = resourceDescriptor.resources?.[resourcesLength - 1];
        }

        return name;
    }
}
