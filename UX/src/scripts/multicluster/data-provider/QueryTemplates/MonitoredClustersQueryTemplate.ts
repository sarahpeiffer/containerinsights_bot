/**
 * Kusto Query to get stats of specified of Monitored clusters
 * Note: timespan filter being set in the Draft Query Params
 */
export class MonitoredClustersQueryTemplate {
    public static MonitoredClustersStats: string =
        `let StatusKey = 'status'; let CountKey = 'count'; \
        let NodeInventoryTable = materialize(KubeNodeInventory \
        $[monitoredClustersFilter] \
        | project TimeGenerated, ClusterId, ClusterVersion = trim_start('v', KubeletVersion), Node = Computer, NodeStatus = Status); \
        let ClusterVersionTable = materialize(NodeInventoryTable | summarize arg_max(TimeGenerated, *) by ClusterId, ClusterVersion\
        | project ClusterId, ClusterVersion); \
        let NodeTable = materialize(NodeInventoryTable | summarize arg_max(TimeGenerated, NodeStatus) by ClusterId, Node \
        | project ClusterId, Node, NodeStatus \
        | summarize NodeCountByStatus = count(Node) by ClusterId, NodeStatus \
        | extend NodePack = pack(StatusKey, NodeStatus, CountKey, NodeCountByStatus) \
        | summarize Nodes = makelist(NodePack) by ClusterId); \
        let PodTable = materialize(KubePodInventory \
        $[monitoredClustersFilter] \
        | project TimeGenerated, ClusterId, Namespace, Node = Computer, PodUid, PodStatus\
        ); \
        NodeTable \
        | join kind = leftouter hint.strategy = shuffle ( \
        PodTable\
        | extend IsKubeSystem = Namespace =~ 'kube-system'
        | summarize arg_max(TimeGenerated, PodStatus, Namespace) by ClusterId, Node, PodUid, IsKubeSystem\
        | project ClusterId, PodUid, PodStatus, Namespace, IsKubeSystem \
        | summarize PodCountByStatus = count(PodUid) by ClusterId, PodStatus, IsKubeSystem \
        | extend PodPack = pack(StatusKey, PodStatus, CountKey, PodCountByStatus) \
        | summarize Pods = makelist(PodPack) by ClusterId, IsKubeSystem \
        | summarize SystemPods = anyif(Pods, IsKubeSystem), UserPods = anyif(Pods, IsKubeSystem == false) by ClusterId \
    ) on ClusterId \
    | join kind = leftouter hint.strategy=shuffle ClusterVersionTable on ClusterId
    | project ClusterId, Nodes, UserPods, SystemPods, ClusterVersion`;
}


