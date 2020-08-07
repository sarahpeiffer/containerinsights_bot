/**
 * defines functionality of Azure Resource Manager (ARM) resource identifier
 */
export interface IAzureResource {
    /**
     * gets resource id (/subscriptions/123/resourcegroup/xyz...)
     */
    readonly resourceId: string;

    /**
     * gets resource name (part of resource id)
     */
    readonly resourceName: string;

    /**
     * gets subscription id
     */
    readonly subscriptionId: string;

    /**
     * gets resource group name
     */
    readonly resourceGroupName: string;
}
