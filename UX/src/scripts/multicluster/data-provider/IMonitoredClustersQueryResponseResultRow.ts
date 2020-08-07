import { IResourceStatusObj } from '../metadata/IResourceStatusObj';

/**
 * Possible response status of the cluster result row*
*/
export enum ResponseStatus {
    Success,
    UnAuthorized,
    NotFound,
    Misconfigured,
    Error,
    NoData,
    Unknown,
}

/**
 *  props of MonitoredClustersQueryResponseResult Row
 */
export class IMonitoredClustersQueryResponseResultRow {
    /** Azure resource Id of Managed Cluster  */
    clusterResourceId: string;
    /** Array of ResourceStatusObjects of Node entities  */
    nodes: IResourceStatusObj[];
    /** Array of ResourecStatusObjects of User Pod entities  */
    userPods: IResourceStatusObj[];
    /** Array of ResourecStatusObjects of System Pod entities  */
    systemPods: IResourceStatusObj[];
    /** status code  of the individual request in Batch */
    responseStatusCode: ResponseStatus;
    /** optional error info (if request not successful) */
    errorInfoText?: string;
    /** kubernetes version of the cluster */
    clusterVersion: string;
}
