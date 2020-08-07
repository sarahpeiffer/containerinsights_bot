import { assert } from 'chai';
import { AzureResourceManagerIdParser } from '../../src/scripts/shared/AzureResourceManagerIdParser';

suite('unit | AzureResourceManagerIdParser', () => {
    test('It throws in case provided resource ID string is null', () => {
        /** arrange */
        const parser = new AzureResourceManagerIdParser();

        /** act */
        /** assert */
        assert.throws(() => {
            parser.parse(null);
        })
    });

    test('It throws in case provided resource ID string is undefined', () => {
        /** arrange */
        const parser = new AzureResourceManagerIdParser();

        /** act */
        /** assert */
        assert.throws(() => {
            parser.parse(undefined);
        })
    });

    test('It throws in case provided resource ID string has invalid format', () => {
        /** arrange */
        const parser = new AzureResourceManagerIdParser();

        /** act */
        /** assert */
        assert.throws(() => {
            parser.parse('invalid-rid');
        })
    });

    test('It parses AKS cluster ID string into components', () => {
        /** arrange */
        const parser = new AzureResourceManagerIdParser();
        const subscriptionId = '00000001-0002-0003-0004-6b5875eb600a';
        const resourceGroupName = 'test-resource-group';
        const clusterName = 'test-cluster-name';

        // tslint:disable:max-line-length 
        const resourceId = `/subscriptions/${subscriptionId}/resourcegroups/${resourceGroupName}/providers/Microsoft.ContainerService/managedClusters/${clusterName}`;
        // tslint:enable:max-line-length 

        /** act */
        const parsedRid = parser.parse(resourceId)

        /** assert */
        assert.equal(parsedRid.resourceId, resourceId);
        assert.equal(parsedRid.subscriptionId, subscriptionId);
        assert.equal(parsedRid.resourceGroupName, resourceGroupName);
        assert.equal(parsedRid.resourceName, clusterName);
    });

    test('It parses LA workspace ID string into components', () => {
        /** arrange */
        const parser = new AzureResourceManagerIdParser();
        const subscriptionId = '00000001-0002-0003-0004-6b5875eb600a';
        const resourceGroupName = 'test-resource-group';
        const workspaceName = 'test-workspace';

        // tslint:disable:max-line-length 
        const resourceId = `/subscriptions/${subscriptionId}/resourcegroups/${resourceGroupName}/providers/Microsoft.OperationalInsights/workspaces/${workspaceName}`;
        // tslint:enable:max-line-length 

        /** act */
        const parsedRid = parser.parse(resourceId)

        /** assert */
        assert.equal(parsedRid.resourceId, resourceId);
        assert.equal(parsedRid.subscriptionId, subscriptionId);
        assert.equal(parsedRid.resourceGroupName, resourceGroupName);
        assert.equal(parsedRid.resourceName, workspaceName);
    });
});
