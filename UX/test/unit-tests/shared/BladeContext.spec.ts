import { assert } from 'chai';
import { BladeContext } from '../../../src/scripts/container/BladeContext';
import { ClusterType } from '../../../src/scripts/multicluster/metadata/IManagedCluster';

suite('unit | BladeContext', () => {
    const mockWksSubscriptionId = '00000001-0002-0003-0004-6b5875eb600a';
    const mockWksResourceGroupName = 'test-resource-group';
    const mockWorkspaceName = 'test-workspace';

    const mockClusterSubscriptionId = '11111111-0002-0003-0004-6b5875eb600a';
    const mockClusterResourceGroupName = 'cluster-resource-group';
    const mockClusterName = 'test-cluster';
    const mockClusterGivenName = 'cluster-given-name';

    // tslint:disable:max-line-length
    const mockWorkspaceResourceId = `/subscriptions/${mockWksSubscriptionId}/resourcegroups/${mockWksResourceGroupName}/providers/Microsoft.OperationalInsights/workspaces/${mockWorkspaceName}`;
    const mockAksClusterResourceId = `/subscriptions/${mockClusterSubscriptionId}/resourcegroups/${mockClusterResourceGroupName}/providers/Microsoft.ContainerService/managedClusters/${mockClusterName}`;
    const mockArcClusterResourceId = `/subscriptions/${mockClusterSubscriptionId}/resourcegroups/${mockClusterResourceGroupName}/providers/Microsoft.Kubernetes/connectedClusters/${mockClusterName}`;
    const mockAroClusterResourceId = `/subscriptions/${mockClusterSubscriptionId}/resourcegroups/${mockClusterResourceGroupName}/providers/Microsoft.Containerservice/openshiftManagedClusters/${mockClusterName}`;
    const mockArov4ClusterResourceId = `/subscriptions/${mockClusterSubscriptionId}/resourcegroups/${mockClusterResourceGroupName}/providers/Microsoft.RedHatOpenShift/OpenShiftClusters/${mockClusterName}`;

    // tslint:enable:max-line-length


    test('It stores instance in global context once instance() is accessed', () => {
        /** arrange */
        const globals = (global as any).window;

        /** act */
        const bladeContext = BladeContext.instance();
        const valuePostInitialization = globals.bladeContext;

        /** assert */
        assert.isDefined(valuePostInitialization);
        assert.equal(bladeContext, valuePostInitialization);
    });

    test('It throws if any of the cluster parameters to initialize() is null', () => {
        /** arrange */
        const bladeContext = BladeContext.instance();

        /** act */
        /** assert */
        assert.throws(() => {
            bladeContext.initialize(null, 'clusterName', 'workspaceResourceId');
        });

        assert.throws(() => {
            bladeContext.initialize('clusterResourceId', null, 'workspaceResourceId');
        });
    });

    test('It sets workspace to null if provided as null in ctor()', () => {
        /** arrange */
        const bladeContext = BladeContext.instance();

        /** act */
        bladeContext.initialize('clusterResourceId', 'clusterName', null);

        /** assert */
        assert.isNull(bladeContext.workspace);
    });

    test('It throws if workspace id is not in correct format', () => {
        /** arrange */
        const bladeContext = BladeContext.instance();

        /** act */
        /** assert */
        assert.throws(() => {
            bladeContext.initialize('clusterResourceId', 'clusterName', 'workspaceResourceId');
        });
    });

    test('It throws if workspace id is not in correct format', () => {
        /** arrange */
        const bladeContext = BladeContext.instance();

        /** act */
        /** assert */
        assert.throws(() => {
            bladeContext.initialize('clusterResourceId', 'clusterName', 'workspaceResourceId');
        });
    });

    test('It parses LA workspace ID string into components', () => {
        /** arrange */

        /** act */
        const bladeContext = BladeContext.instance();
        bladeContext.initialize('cluster-name', 'cluster-name', mockWorkspaceResourceId);

        const workspace = bladeContext.workspace;

        /** assert */
        assert.equal(workspace.resourceId, mockWorkspaceResourceId);
        assert.equal(workspace.subscriptionId, mockWksSubscriptionId);
        assert.equal(workspace.resourceGroupName, mockWksResourceGroupName);
        assert.equal(workspace.resourceName, mockWorkspaceName);
    });

    test('It parses AKS cluster ID string into components', () => {
        /** arrange */
        /** act */
        const bladeContext = BladeContext.instance();
        bladeContext.initialize(mockAksClusterResourceId, 'cluster-name', mockWorkspaceResourceId);

        const cluster = bladeContext.cluster;

        /** assert */
        assert.equal(cluster.resourceId, mockAksClusterResourceId);
        assert.equal(cluster.subscriptionId, mockClusterSubscriptionId);
        assert.equal(cluster.resourceGroupName, mockClusterResourceGroupName);
        assert.equal(cluster.resourceName, mockClusterName);
    });

    test('It returns cluster given name as cluster name ignoring provided name', () => {
        /** arrange */
        /** act */
        const bladeContext = BladeContext.instance();
        bladeContext.initialize(mockAksClusterResourceId, mockClusterGivenName, mockWorkspaceResourceId);

        const cluster = bladeContext.cluster;

        /** assert */
        assert.equal(cluster.givenName, mockClusterName);
    });

    test('It returns cluster as AKS cluster when resource type is specified in rid as microsoft.containerservice/managedclusters', () => {
        /** arrange */
        /** act */
        const bladeContext = BladeContext.instance();
        bladeContext.initialize(mockAksClusterResourceId, mockClusterGivenName, mockWorkspaceResourceId);

        const cluster = bladeContext.cluster;

        /** assert */
        assert.isTrue(cluster.clusterType === ClusterType.AKS);
    });

    test('It returns cluster as Azure Arc cluster when resource type is specified in rid as microsoft.kubernetes/connectedclusters',
        () => {
            /** arrange */
            /** act */
            const bladeContext = BladeContext.instance();
            bladeContext.initialize(mockArcClusterResourceId, mockClusterGivenName, mockWorkspaceResourceId);

            const cluster = bladeContext.cluster;

            /** assert */
            assert.isTrue(cluster.clusterType === ClusterType.AzureArc);
        });

    test('It returns cluster as ARO cluster when resource type is specified in rid as microsoft.containerservice/openshiftmanagedclusters',
        () => {
            /** arrange */
            /** act */
            const bladeContext = BladeContext.instance();
            bladeContext.initialize(mockAroClusterResourceId, mockClusterGivenName, mockWorkspaceResourceId);

            const cluster = bladeContext.cluster;

            /** assert */
            assert.isTrue(cluster.clusterType === ClusterType.ARO);
        });

    test('It returns cluster as AROv4 cluster when resource type is specified in rid as microsoft.redhatopenshift/openshiftclusters',
        () => {
            /** arrange */
            /** act */
            const bladeContext = BladeContext.instance();
            bladeContext.initialize(mockArov4ClusterResourceId, mockClusterGivenName, mockWorkspaceResourceId);

            const cluster = bladeContext.cluster;

            /** assert */
            assert.isTrue(cluster.clusterType === ClusterType.AROv4);
        });

    test('It returns Azure resource id as provided for non AKS', () => {
        /** arrange */
        // tslint:disable:max-line-length
        const clusterResourceId = `/subscriptions/${mockClusterSubscriptionId}/resourcegroups/${mockClusterResourceGroupName}/providers/Microsoft.SomeService/managedClusters/${mockClusterName}`;
        // tslint:enable:max-line-length

        /** act */
        const bladeContext = BladeContext.instance();
        bladeContext.initialize(clusterResourceId, 'cluster-name', mockWorkspaceResourceId);

        const cluster = bladeContext.cluster;

        /** assert */
        assert.equal(cluster.resourceId, clusterResourceId);
    });

    test('It returns Azure resource id components as nulls in case cluster resource id provided is not AKS', () => {
        /** arrange */
        // tslint:disable:max-line-length
        const clusterResourceId = `/subscriptions/${mockClusterSubscriptionId}/resourcegroups/${mockClusterResourceGroupName}/providers/Microsoft.SomeService/managedClusters/${mockClusterName}`;
        // tslint:enable:max-line-length

        /** act */
        const bladeContext = BladeContext.instance();
        bladeContext.initialize(clusterResourceId, 'cluster-name', mockWorkspaceResourceId);

        const cluster = bladeContext.cluster;

        /** assert */
        assert.isNull(cluster.subscriptionId);
        assert.isNull(cluster.resourceGroupName);
        assert.isNull(cluster.resourceName);
    });

    test('It returns given name as provided during initialization for non-AKS cluster', () => {
        /** arrange */
        /** act */
        const bladeContext = BladeContext.instance();
        bladeContext.initialize('cluster-resource-id', mockClusterGivenName, mockWorkspaceResourceId);

        const cluster = bladeContext.cluster;

        /** assert */
        assert.equal(cluster.givenName, mockClusterGivenName);
    });
});
