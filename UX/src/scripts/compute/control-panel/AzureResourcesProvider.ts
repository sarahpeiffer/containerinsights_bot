import { ITelemetry, IFinishableTelemetry } from '../../shared/Telemetry';
import { ResourceInfo, VmInsightsResourceType } from '../shared/ResourceInfo';
import { RetryARMDataProvider } from '../../shared/data-provider/RetryARMDataProvider';
import { ARMDataProvider } from '../../shared/data-provider/ARMDataProvider';
import { RetryPolicyFactory } from '../../shared/data-provider/RetryPolicyFactory';
import { StringHelpers } from '../../shared/Utilities/StringHelpers';

const TelemetryEventsPrefix = 'Compute.DataProvider.AzureResourcesProvider';

export interface GetAzureResourcesQueryParams {
    subscriptionId: string;
    resourceGroupName: string;
    resourceType: VmInsightsResourceType;
    nestedResourceId?: string;
}

export class AzureResourcesProvider {
    private telemetry: ITelemetry;
    private retryArmDataProvider: RetryARMDataProvider;
    constructor(telemetry: ITelemetry) {
        this.telemetry = telemetry;
        this.retryArmDataProvider = new RetryARMDataProvider(new ARMDataProvider(), new RetryPolicyFactory());
    }

    /**
     * This method retrieves ResourceGroups, VMs, VMSSs, VMSSInstances
     * queryParams.subscriptionId: subscriptionId
     * queryParams.resourceGroupName:  ResourceGroup name if known
     * queryParams.resourceType: ResourceType. This is a mandatory field
     * queryParams.nestedResourceId: Nested resourceId.
     * If this Id is passed, this method will retrieve nested resources of specified resourceType
     */
    public getAzureResources(queryParams: GetAzureResourcesQueryParams): Promise<ResourceInfo[]> {
        if (!queryParams || !queryParams.subscriptionId) {
            return undefined;
        }
        const resources: ResourceInfo[] = [];
        const eventName = `${TelemetryEventsPrefix}.${VmInsightsResourceType[queryParams.resourceType]}`;
        const telemetryContext: IFinishableTelemetry = this.telemetry.startLogEvent(
            eventName,
            { queryParams: JSON.stringify(queryParams) },
            undefined);

        const url: string = this.getUrl(queryParams);
        return this.retryArmDataProvider.executeGet(url, 20000).then((response: any) => {
            telemetryContext.complete();
            const data: Array<any> = response && response.value;
            if (!data || !data.length || data.length === 0) {
                return resources;
            }

            for (const item of data) {
                if (!item.id || !item.name) {
                    continue;
                }

                resources.push(new ResourceInfo({
                    id: item.id,
                    displayName: item.name,
                    location: item.location,
                    fqdn: undefined,
                    type: queryParams.resourceType
                }));
            }

            return resources;
        }).catch((error) => {
            telemetryContext.fail(error,
                {
                    message: `Failed to list ${VmInsightsResourceType[queryParams.resourceType]}s.`
                });
            return [];
        });
    }

    private getUrl(queryParams: GetAzureResourcesQueryParams) {
        const apiVersion = this.getApiVersion(queryParams.resourceType);
        let resourceIdPrefix: string = '/subscriptions/' + queryParams.subscriptionId;
        if (!StringHelpers.isNullOrEmpty(queryParams.resourceGroupName)) {
            resourceIdPrefix += '/resourcegroups/' + queryParams.resourceGroupName
        }
        switch (queryParams.resourceType) {
            case VmInsightsResourceType.VirtualMachine:
                return resourceIdPrefix + '/providers/Microsoft.Compute/virtualMachines?api-version=' + apiVersion;
            case VmInsightsResourceType.VirtualMachineScaleSet:
                return resourceIdPrefix + '/providers/Microsoft.Compute/virtualMachineScaleSets?api-version=' + apiVersion;
            case VmInsightsResourceType.AzureArcMachine:
                return resourceIdPrefix + '/providers/Microsoft.HybridCompute/machines?api-version=' + apiVersion;
            case VmInsightsResourceType.VmScaleSetInstance:
                // Received resourceId should be a VMSS Id
                return queryParams.nestedResourceId + '/virtualMachines?api-version=' + apiVersion;
            case VmInsightsResourceType.ResourceGroup:
                return '/subscriptions/' + queryParams.subscriptionId + '/resourcegroups?api-version=' + apiVersion;
            default:
                return queryParams.nestedResourceId;
        }
    }

    private getApiVersion(resourceType: VmInsightsResourceType): string {
        switch (resourceType) {
            case VmInsightsResourceType.VirtualMachine:
            case VmInsightsResourceType.VirtualMachineScaleSet:
                return '2019-03-01';
            case VmInsightsResourceType.AzureArcMachine:
                return '2019-12-12';
            case VmInsightsResourceType.VmScaleSetInstance:
                return '2018-06-01';
            case VmInsightsResourceType.ResourceGroup:
                return '2015-01-01';
            default:
                return '';
        }
    }
}
