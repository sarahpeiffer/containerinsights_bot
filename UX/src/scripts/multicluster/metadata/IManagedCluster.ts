/**
 *  properties of Managed AKS Cluster  *
 */

export interface IManagedCluster {

    /** Azure resource Id of the Managed AKS cluster */
    resourceId: string;

    /** name of the AKS cluster */
    name: string;

    /** Azure Resource Id of the Log Analytics Workspace */
    workspaceResourceId: string;

    /** Name of the Log Analytics Workspace */
    workspaceName: string;

    /** location of the AKS or AKS-engine cluster */
    clusterLocation: string;

    /** type of the cluster (AKS or AKSEngine or Kubernetes) */
    clusterType: ClusterType;


    /** GUID of the Azure log analytics workspace */
    workspaceGuid?: string;

    /** Location of the Azure log analytics workspace */
    workspaceLocation?: string;

    /** true indicates either workspace deleted or user doesn't have acces */
    isWorkspaceDeletedOrHasNoAccess?: boolean;

    /** kubernetes version. For ARO, this will be Openshift version */
    kubernetesVersion?: string;

}

/**
 * type of the cluster
 */
export enum ClusterType {
    /** Azure Kuberenetes Service */
    AKS = 0,
    /** AKS-Engine or ACS-Engine on Azure */
    AKSEngine = 1,
    /** AKS-Engine or ACS-Engine on AzureStack */
    AKSEngineAzStack = 2,
    /** ARO cluster */
    ARO = 3,
    /** ARO cluster */
    AROv4 = 4,
    /** AzureArc - k8s azure connected cluster */
    AzureArc = 5,
    /** k8s cluster hosted outside the Azure */
    Other = 6,
}



