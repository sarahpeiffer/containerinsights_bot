export class HelperFunctions {
     /**
     *  Determines whether a cluster is AKS or not
     */
    public static isAKSCluster(containerClusterResourceId: string): boolean {
        if (!!containerClusterResourceId && containerClusterResourceId.indexOf('Microsoft.ContainerService/managedClusters') >= 0) {
            return true;
        }

        return false
    }
}
