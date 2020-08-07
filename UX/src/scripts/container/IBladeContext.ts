/** shared */
import { IAzureResource } from '../shared/IAzureResource';
import { ClusterType } from '../multicluster/metadata/IManagedCluster';

/**
 * defines functionality of K8s (Azure and not) cluster
 */
export interface IKubernetesCluster extends IAzureResource {
    /**
     * gets given name of the cluster (resource name in Azure, name, given by customer in HELM chart outside Azure)
     */
    readonly givenName: string;

    /**
     * gets a value indicating what the cluster type
     */
    readonly clusterType: ClusterType;

    /**
     * gets a value indicating whether the cluster is managed or not
     * managed cluster means which is servered by RP which has fully qualified azure resource id
     */
    readonly isManagedCluster: boolean;
}

/**
 * defines functionality of the UX blade context
 */
export interface IBladeContext {
    /**
     * gets information of the cluster being visualized
     */
    readonly cluster: IKubernetesCluster;

    /**
     * gets log analytics workspace where cluster data is stored
     */
    readonly workspace: IAzureResource;

    /** feature flag for visibility control */
    readonly featureFlags: StringMap<boolean>;

    /**
     * initializes blade context
     * @param clusterArmResourceId arm resource id of the cluster
     * @param clusterName cluster name
     * @param workspaceArmResourceId log analytics workspace ARM resource id
     * @param featureFlags feature flag for visibility control
     */
    initialize(clusterArmResourceId: string, clusterName: string, workspaceArmResourceId: string, featureFlags?: StringMap<boolean>): void;
}
