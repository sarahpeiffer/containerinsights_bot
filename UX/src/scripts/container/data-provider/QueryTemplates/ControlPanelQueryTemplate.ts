// tslint:disable:max-line-length 
export class ControlPanelQueryTemplate {
/** Query for pill filter contents */
public static PillFilters = 
    `let startDateTime = datetime('$[startDateTime]');\
    let endDateTime = datetime('$[endDateTime]');\
    KubePodInventory\
    | where TimeGenerated >= startDateTime\
    | where TimeGenerated < endDateTime\
    $[clusterFilter]\
    | distinct Computer, ServiceName, Namespace, ClusterName, ClusterId, ControllerKind\
    | join kind=fullouter (\
        KubeNodeInventory\
        | where TimeGenerated >= startDateTime\
        | where TimeGenerated < endDateTime\
        $[clusterFilter]\
        | project Computer, ClusterName, ClusterId, LabelsJSON = todynamic(Labels)[0]\
        | extend AgentPool = tostring(LabelsJSON.agentpool), KubernetesRole = tostring(LabelsJSON['kubernetes.io/role'])\
        | extend NodePool = iff(isempty(AgentPool), KubernetesRole, AgentPool)\
        | distinct Computer, ClusterName, ClusterId, NodePool\
    ) on Computer, ClusterId\
    | project Computer, ServiceName, Namespace, ClusterName, NodePool, ControllerKind`;
}
