/**
 * props of SummaryPanelInfo for the Multi AKS Cluster View
 */
export interface ISummaryPanelInfo {
    /** total number of clusters */
    numTotal: number
    /** number of clusters in critical state */
    numCritical: number;
    /** number of clusters in warning state */
    numWarning: number;
    /** number of clusters in Healthy state */
    numHealthy: number;
    /** number of clusters in Unknown state */
    numUnknown: number;
    /** number of clusters in non monitored state */
    numNonMonitored: number;
}

