/** local */
import { HealthStatus } from './HealthCalculator';
import { ClusterType } from '../metadata/IManagedCluster';

/**
 * Base interface all metadata objects must implement
 */
export interface IMulticlusterMetaDataBase {
    clusterId: string;
    workspaceId: string;
    name: string;
    clusterType: ClusterType;
    clusterVersion: string;
    clusterLocation: string;
    clusterStatus: HealthStatus;
    clusterStatusInfoMessage: string;
    nodeHealthRatioDisplayValue: string;
    userPodHealthRatioDisplayValue: string;
    systemPodHealthRatioDisplayValue: string;
    getSortableKey(): string;
}
