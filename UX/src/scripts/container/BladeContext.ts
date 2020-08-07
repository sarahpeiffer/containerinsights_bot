/** shared */
import { globals } from '../shared/globals/globals';
import { IAzureResource } from '../shared/IAzureResource';
import { AzureResourceManagerIdParser } from '../shared/AzureResourceManagerIdParser';

/** local */
import { IBladeContext, IKubernetesCluster } from './IBladeContext';
import { ClusterType } from '../multicluster/metadata/IManagedCluster';

/**
 * implements functionality of the UX blade context
 */
export class BladeContext implements IBladeContext {
    /** cluster being visualized */
    private _cluster: IKubernetesCluster;

    /** log analytics workspace where data is stored */
    private _workspace: IAzureResource;

    /** feature flag for visibility control */
    private _featureFlags: StringMap<boolean>;

    /**
     * gets blade context singleton
     */
    public static instance(): IBladeContext {
        if (!globals.bladeContext) {
            globals.bladeContext = new BladeContext();
        }

        return globals.bladeContext;
    }

    /**
     * initializes blade context
     * @param clusterArmResourceId arm resource id of the cluster
     * @param clusterName cluster name
     * @param workspaceArmResourceId log analytics workspace ARM resource id
     * @param featureFlags feature flag for test
     */
    public initialize(
        clusterArmResourceId: string,
        clusterName: string,
        workspaceArmResourceId: string,
        featureFlags?: StringMap<boolean>
    ): void {
        if (!clusterArmResourceId) { throw new Error(`@clusterArmResourceId may not be null at BladeContext.initialize()`); }
        if (!clusterName) { throw new Error(`@clusterName may not be null at BladeContext.initialize()`); }

        const resourceIdParser = new AzureResourceManagerIdParser();

        if (clusterArmResourceId &&
            (clusterArmResourceId.toLocaleLowerCase().indexOf('microsoft.containerservice/managedclusters') > -1)) {
            // this is AKS cluster
            const azureResource = resourceIdParser.parse(clusterArmResourceId);

            this._cluster = {
                ...azureResource,
                givenName: azureResource.resourceName,
                clusterType: ClusterType.AKS,
                isManagedCluster: true,
            };
        } else if (clusterArmResourceId &&
            (clusterArmResourceId.toLocaleLowerCase().indexOf('microsoft.containerservice/openshiftmanagedclusters') > -1)) {
            // this is ARO cluster
            const azureResource = resourceIdParser.parse(clusterArmResourceId);
            this._cluster = {
                ...azureResource,
                givenName: azureResource.resourceName,
                clusterType: ClusterType.ARO,
                isManagedCluster: true,
            };
        } else if (clusterArmResourceId &&
            (clusterArmResourceId.toLocaleLowerCase().indexOf('microsoft.redhatopenshift/openshiftclusters') > -1)) {
            // this is AROv4 cluster
            const azureResource = resourceIdParser.parse(clusterArmResourceId);
            this._cluster = {
                ...azureResource,
                givenName: azureResource.resourceName,
                clusterType: ClusterType.AROv4,
                isManagedCluster: true,
            };
        } else if (clusterArmResourceId &&
            (clusterArmResourceId.toLocaleLowerCase().indexOf('microsoft.kubernetes/connectedclusters') > -1)) {
            // this is Azure Arc cluster
            const azureResource = resourceIdParser.parse(clusterArmResourceId);
            this._cluster = {
                ...azureResource,
                givenName: azureResource.resourceName,
                clusterType: ClusterType.AzureArc,
                isManagedCluster: true,
            };
        } else if (clusterArmResourceId && (
            clusterArmResourceId.toLocaleLowerCase().indexOf('microsoft.compute/virtualmachinescalesets') > -1
            || clusterArmResourceId.toLocaleLowerCase().indexOf('microsoft.compute/virtualmachines') > -1
            || clusterArmResourceId.toLocaleLowerCase().indexOf('/resourcegroups/')
        )) {
            this._cluster = {
                resourceId: clusterArmResourceId,
                resourceName: null,
                resourceGroupName: null,
                subscriptionId: null,
                givenName: clusterName,
                clusterType: ClusterType.AKSEngine,
                isManagedCluster: false
            };
        } else {
            // non-Azure K8s cluster
            this._cluster = {
                resourceId: clusterArmResourceId,
                resourceName: null,
                resourceGroupName: null,
                subscriptionId: null,
                givenName: clusterName,
                clusterType: ClusterType.Other,
                isManagedCluster: false,
            };
        }

        this._workspace = workspaceArmResourceId
            ? resourceIdParser.parse(workspaceArmResourceId)
            : null;
        this._featureFlags = featureFlags;
    }

    /**
     * gets information of the cluster being visualized
     */
    public get cluster(): IKubernetesCluster {
        return this._cluster;
    }

    /**
     * gets log analytics workspace where cluster data is stored
     */
    public get workspace(): IAzureResource {
        return this._workspace;
    };

    /**
     * gets featureFlags of the feature being visualized
     */
    public get featureFlags(): StringMap<boolean> {
        return this._featureFlags;
    }
}
