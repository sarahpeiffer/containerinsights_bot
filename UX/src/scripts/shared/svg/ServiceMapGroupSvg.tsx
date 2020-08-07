import * as React from 'react';

import { ServiceMapGroupType } from '../ComputerGroup';

import { CloudServiceSvg } from './azure-cloud-service';
import { ResourceGroupSvg } from './azure-resource-group';
import { ServiceFabricSvg } from './azure-service-fabric';
import { ServiceMapMachineGroupSvg } from './azure-service-map-machine-group';
import { SubscriptionGroupSvg } from './azure-subscription-group';
import { VmScalesetSvg } from './azure-vm-scaleset';

import './svg.css';

interface IServiceMapGroupSvg {
    groupType: ServiceMapGroupType;
}

export const ServiceMapGroupSvg: React.StatelessComponent<IServiceMapGroupSvg> = (props) => {
    let groupTypeSvg: JSX.Element = <div/>;
    switch (props.groupType) {
        case ServiceMapGroupType.AzureCloudService:
            groupTypeSvg = <CloudServiceSvg />;
            break;
        case ServiceMapGroupType.AzureServiceFabric:
            groupTypeSvg = <ServiceFabricSvg />;
            break;
        case ServiceMapGroupType.AzureVMScaleSet:
            groupTypeSvg = <VmScalesetSvg />;
            break;
        case ServiceMapGroupType.AzureResourceGroup:
            groupTypeSvg = <ResourceGroupSvg />;
            break;
        case ServiceMapGroupType.AzureSubscription:
            groupTypeSvg = <SubscriptionGroupSvg />;
            break;
        default:
            groupTypeSvg = <ServiceMapMachineGroupSvg />;
            break;
    }
    return groupTypeSvg;
};
