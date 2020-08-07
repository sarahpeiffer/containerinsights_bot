/**
 * health area Kusto query tempaltes
 */
export class HealthQueryTemplate {
    /** 
     * latest states of all monitors for health model visualization
     * 
     * TODO-TASK-4648697: see if we can do better cluster filtering prior to extending
     */
    public static LatestMonitorStateQuery: string = `
        let startDateTime = datetime('$[startDateTime]');\
        KubeHealth \
        | extend ClusterName = ClusterId\
        $[clusterFilter]\
        | where TimeGenerated > startDateTime\            
        | summarize arg_max(TimeGenerated, *) by MonitorInstanceId\
        | project TimeGenerated, MonitorTypeId, MonitorInstanceId, TimeFirstObserved, OldState, NewState,\
        MonitorLabels, MonitorConfig, Details
        `
}
