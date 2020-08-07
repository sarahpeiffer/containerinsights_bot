/** local */
import { IAzureResource } from './IAzureResource';

/**
 * provides functionality to parse Azure Resource Manager (arm) resource id string
 */
export class AzureResourceManagerIdParser {
    /**
     * parses Azure resource manager id sring
     * @param armResourceId resource id
     * @returns {IAzureResource} parsed resource descriptor
     */
    public parse(armResourceId: string): IAzureResource {
        if (!armResourceId) { throw new Error(`@armResourceId may not be null at AzureResourceManagerIdParser.parse()`); }

        const splitResourceId = armResourceId.split('/');
        if (!splitResourceId || !splitResourceId.length || splitResourceId.length < 9) {
            throw new Error(`@armResourceId is invalid at AzureResourceManagerIdParser:parse. Value: "${armResourceId}"`);
        }

        return {
            resourceId: armResourceId,
            subscriptionId: splitResourceId[2],
            resourceGroupName: splitResourceId[4],
            resourceName: splitResourceId[8]
        }
    }
}
