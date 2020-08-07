/**
 * monitor subject
 * 
 * Defines what a given monitor is 'checking/tracking' and on what target
 * Examples: 
 *      - check node CPU on node aks-123gs.
 *      - check Kube API is up on cluster with name 'clusterXYZ'
 * 
 * Given subject, UX can provide monitor names, descriptions, etc
 */
export interface IHealthMonitorSubject {
    /** monitor type id defining what monitor is checking (i.e. check node cpu on a node) */
    monitorTypeId: string;

    /** set of labels defining target of the monitor (i.e. nodeName: 'aks-123gs', clusterName: 'clusterXYZ') */
    labels?: StringMap<string>;
}
