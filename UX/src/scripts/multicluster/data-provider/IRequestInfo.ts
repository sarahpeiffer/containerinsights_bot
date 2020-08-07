/**
 * props of the IRequestInfo
 */
export interface IRequestInfo {
    /** request Id */
    requestId: number;
    /** workspaceId (i.e. WorkspaceGuid or WorkspaceName) in the request */
    workspaceId: string;
    /** workspaceResourceId in the request */
    workspaceResourceId: string;
    /** resource Ids of the cluster associated to the request */
    clusterResourceIds: string[];
}
