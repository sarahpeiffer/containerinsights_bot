export interface ISkuData {
    offer: string;
    publisher: string;
    sku: string;
    version: string;
}

export interface IVmResourceDescriptor {
    subscription: string;
    resourceGroup: string;
    name: string;
    resourceId: string;
    vmuuid: string;
    location: string;
    osType: string;
    osSku: ISkuData;
    agentVersion: string;
}
