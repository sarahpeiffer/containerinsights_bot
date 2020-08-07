/** shim */
import findIndex = require('array.prototype.findindex');

/** local */
import { IMulticlusterMetaDataBase } from './IMulticlusterMetaDataBase';
import { IManagedCluster, ClusterType } from './IManagedCluster';
import { DisplayStrings } from '../MulticlusterDisplayStrings';
import { IMonitoredClustersQueryResponseResultRow, ResponseStatus } from '../data-provider/IMonitoredClustersQueryResponseResultRow'

/** shared */
import { IGridLineObject, GridLineObject } from '../../shared/GridLineObject';
import { NodeStatusInterpreter, NodeStatus } from '../../shared/NodeStatusInterpreter';
import { PodStatus, PodStatusInterpreter } from '../../shared/PodStatusInterpreter';
import { IResourceStatusObj } from './IResourceStatusObj';
import { HealthCalculator, HealthStatus } from './HealthCalculator';
import { MulticlusterGridBase } from '../grids/MulticlusterGridBase';
import * as Constants from '../../shared/GlobalConstants';

/**
 * Interface for Monitored Cluster Metadata
 */
export interface IMonitoredClusterMetaData extends IMulticlusterMetaDataBase {
    nodeDraftData: IResourceStatusObj[];
    numHealthyNodes: number;
    numNodes: number;
    nodeHealthRatio: number;
    // nodeHealthRatioDisplayValue: string;
    nodeOverallHealth: HealthStatus;

    userPodDraftData: IResourceStatusObj[];
    numHealthyUserPods: number;
    numUserPods: number;
    userPodHealthRatio: number;
    // userPodHealthRatioDisplayValue: string;
    userPodOverallHealth: HealthStatus;

    systemPodDraftData: IResourceStatusObj[];
    numHealthySystemPods: number;
    numSystemPods: number;
    systemPodHealthRatio: number;
    // systemPodHealthRatioDisplayValue: string;
    systemPodOverallHealth: HealthStatus;
}

/**
 * Specifies the index of columns in the monitored cluster grid
 * Indices should match the indices of respective kusto query projection columns
 */
export enum MonitoredClusterMetricColumn {
    ClusterId = 0,
    Nodes = 1,
    UserPods = 2,
    SystemPods = 3,
    ClusterVersion = 4,
}

/**
 * resource types in managed cluster
 */
export enum ClusterResourceType {
    Node,
    UserPod,
    SystemPod
}

/** List of the values for status that our application considers healthy */
const HealthyNodeStatuses: NodeStatus[] = [NodeStatus.Green];
const HealthyPodStatuses: PodStatus[] = [PodStatus.Green, PodStatus.Stopped];

/**
 * Primary metadata object and parsing logic for the node view parents (VMs)
 * this object also understands how to wrap an actual sgdatarow in this metadata
 */
export class MonitoredClusterMetaData implements IMonitoredClusterMetaData {

    public clusterId: string;
    public workspaceId: string;
    public name: string;
    public clusterType: ClusterType;
    public clusterVersion: string;
    public clusterLocation: string;

    public nodeDraftData: IResourceStatusObj[];
    public numHealthyNodes: number;
    public numNodes: number;
    public nodeHealthRatio: number;
    public nodeHealthRatioDisplayValue: string;
    public nodeOverallHealth: HealthStatus;

    public userPodDraftData: IResourceStatusObj[];
    public numHealthyUserPods: number;
    public numUserPods: number;
    public userPodHealthRatio: number;
    public userPodHealthRatioDisplayValue: string;
    public userPodOverallHealth: HealthStatus;

    public systemPodDraftData: IResourceStatusObj[];
    public numHealthySystemPods: number;
    public numSystemPods: number;
    public systemPodHealthRatio: number;
    public systemPodHealthRatioDisplayValue: string;
    public systemPodOverallHealth: HealthStatus;

    public clusterStatus: HealthStatus;
    public clusterStatusInfoMessage: string;

    /**
     * .ctor() setup the metadata object with an initial row of data
     * @param resultRow initial kusto record to start the object off with
     * @param timestamp the time interval represented (outside a certain range some data will change)
     */
    public constructor(resultRow: IMonitoredClustersQueryResponseResultRow, managedCluster: IManagedCluster) {
        this.setMetaData(resultRow, managedCluster);

        this.setNodeMetaData = this.setNodeMetaData.bind(this);
        this.setUserPodMetaData = this.setUserPodMetaData.bind(this);
        this.setSystemPodMetaData = this.setSystemPodMetaData.bind(this);
    }

    /**
     * Given a value and a metadata object wrap the value in the metadata object utilizing the GridLineObject class
     * @param record value we want to wrap with metadata
     * @param metaReference the metadata we would like to wrap the value in
     */
    public static metaWrapperHelper(record: any, metaReference: MonitoredClusterMetaData): IGridLineObject<MonitoredClusterMetaData> {
        return new GridLineObject(record, metaReference);
    }

    /**
     *
     * @param resourceStatusObjs
     * @param resourceType
     */
    private static tallyResourceStatusObjs(resourceStatusObjs: IResourceStatusObj[], resourceType: ClusterResourceType): any {
        let numResources: number = 0, numHealthyResources: number = 0;
        resourceStatusObjs.forEach((obj: IResourceStatusObj) => {
            if (obj.count != null && !isNaN(obj.count)) {
                numResources += obj.count;
                if (obj.status != null) {
                    let realResourceStatus: NodeStatus | PodStatus;
                    if (resourceType === ClusterResourceType.Node) {
                        realResourceStatus = NodeStatusInterpreter.getNodeStatusFromKustoNodeStatus(obj.status);
                    } else {
                        realResourceStatus = PodStatusInterpreter.getPodStatusFromKustoPodStatus(obj.status);
                    }

                    let isResourceStatusHealthy: boolean;
                    if (resourceType === ClusterResourceType.Node) {
                        isResourceStatusHealthy =
                            findIndex(HealthyNodeStatuses, healthyNodeStatus => healthyNodeStatus === realResourceStatus) !== -1;
                    } else {
                        isResourceStatusHealthy =
                            findIndex(HealthyPodStatuses, healthyPodStatus => healthyPodStatus === realResourceStatus) !== -1;
                    }

                    if (isResourceStatusHealthy) {
                        numHealthyResources += obj.count;
                    }
                }
            } else {
                //gangams: TODO - log exception through telemetry.
                console.error('Resource status object had an invalid value for count key');
            }
        });

        return { numResources, numHealthyResources };
    }

    /**
     * Turn this metadata object into a fully wrapped array ready for SGDataRow, i.e. an array of metadata wrapped values
     * @returns {IGridLineObject<NodeMetaData>[]} an array of values fully wrapped by metadata ready for selectable grid
     */
    public formatMonitoredClusterRow(): IGridLineObject<MonitoredClusterMetaData>[] {
        const row: IGridLineObject<MonitoredClusterMetaData>[] = [];

        row.push(
            MonitoredClusterMetaData.metaWrapperHelper(this.name, this),
            MonitoredClusterMetaData.metaWrapperHelper(this.clusterType, this),
            MonitoredClusterMetaData.metaWrapperHelper(this.clusterVersion, this),
            MonitoredClusterMetaData.metaWrapperHelper(this.clusterStatus, this),
            MonitoredClusterMetaData.metaWrapperHelper(this.nodeHealthRatioDisplayValue, this),
            MonitoredClusterMetaData.metaWrapperHelper(this.userPodHealthRatioDisplayValue, this),
            MonitoredClusterMetaData.metaWrapperHelper(this.systemPodHealthRatioDisplayValue, this),
        );

        return row;
    }

    public getSortableKey(): string {
        return this.name;
    }

    /**
     * Used by the constructor, the bulk of our initial metadata originally came from the first record associated
     * with a given node.  we maintain that behavior here for now, but future looking it might be a good idea to
     * validate some of this isn't changing from row to row in the trend data points
     * @param resultRow first kusto row being used to create the initial state of the metadata object
     */
    private setMetaData(resultRow: IMonitoredClustersQueryResponseResultRow, managedCluster: IManagedCluster) {
        if (managedCluster === null) {
            throw new Error('setMetaData is missing required parameters');
        }

        //gangams: we use resourceId from the data for the navigations hence clusterResourceId should checked first
        // TODO: get rid of clusterResourceId completely for aks-engine since agent emits both Id and name same
        this.clusterId = resultRow && resultRow.clusterResourceId ?
            resultRow.clusterResourceId :
            (managedCluster.clusterType === 1 ? managedCluster.name : managedCluster.resourceId);
        this.clusterType = managedCluster.clusterType || MulticlusterGridBase.getClusterType(this.clusterId);

        this.clusterVersion = managedCluster.kubernetesVersion &&
            (managedCluster.kubernetesVersion !== 'Unknown') ?
            managedCluster.kubernetesVersion : (
                (resultRow !== null) && (resultRow.clusterVersion !== null) ?
                    resultRow.clusterVersion :
                    'Unknown');

        this.workspaceId = managedCluster.workspaceResourceId;
        this.clusterLocation = managedCluster.clusterLocation !== null ? managedCluster.clusterLocation : '';

        this.name = MulticlusterGridBase.getClusterName(managedCluster.name, resultRow !== null ? resultRow.clusterResourceId : null);
        this.clusterStatusInfoMessage = resultRow !== null ?
            (resultRow.responseStatusCode !== ResponseStatus.Success && resultRow.errorInfoText !== undefined) ?
                resultRow.errorInfoText : ''
            : null;
        const nodeStatusObjs: IResourceStatusObj[] = resultRow !== null ? resultRow.nodes : null;
        const userPodStatusObjs: IResourceStatusObj[] = resultRow !== null ? resultRow.userPods : null;
        const systemPodStatusObjs: IResourceStatusObj[] = resultRow !== null ? resultRow.systemPods : null;

        this.setNodeMetaData(nodeStatusObjs);
        this.setUserPodMetaData(userPodStatusObjs, systemPodStatusObjs);
        this.setSystemPodMetaData(systemPodStatusObjs);

        this.clusterStatus = resultRow !== null ?
            HealthCalculator.getClusterHealth(
                this.nodeOverallHealth,
                this.userPodOverallHealth,
                this.systemPodOverallHealth,
                resultRow.responseStatusCode,
            ) : null;
    }

    /**
     *  sets node metadata
     * @param nodeStatusObjs
     */
    private setNodeMetaData(nodeStatusObjs: IResourceStatusObj[]): void {
        // No data was received in the last 30 minutes
        // or user doesn't have access to WS or query request failed
        // in all of these cases status considered as Unknown
        if (!nodeStatusObjs || nodeStatusObjs.length === 0) {
            this.nodeDraftData = undefined;
            this.numHealthyNodes = undefined;
            this.numNodes = undefined;
            //unknown is worst thing so setting lowest health ratio
            //highest health ratio indicates that everything is good
            this.nodeHealthRatio = Number.MIN_SAFE_INTEGER ? Number.MIN_SAFE_INTEGER : Constants.MIN_SAFE_INTEGER;
            this.nodeHealthRatioDisplayValue = DisplayStrings.MissingData;
            this.nodeOverallHealth = HealthStatus.Unknown;
        } else {

            this.nodeDraftData = nodeStatusObjs;

            const tallies: any = MonitoredClusterMetaData.tallyResourceStatusObjs(nodeStatusObjs, ClusterResourceType.Node);
            this.numHealthyNodes = tallies.numHealthyResources;
            this.numNodes = tallies.numResources;
            this.nodeHealthRatioDisplayValue = `${this.numHealthyNodes} / ${this.numNodes}`;
            this.nodeHealthRatio = this.numHealthyNodes / this.numNodes;
            this.nodeOverallHealth = HealthCalculator.getNodeOverallHealth(this.nodeHealthRatio);
        }
    }

    /**
     * sets user pod metadata
     * @param userPodStatusObjs
     * @param systemPodStatusObjs
     */
    private setUserPodMetaData(userPodStatusObjs: IResourceStatusObj[], systemPodStatusObjs: IResourceStatusObj[]): void {
        if ((!userPodStatusObjs || userPodStatusObjs.length === 0) &&
            (!systemPodStatusObjs || systemPodStatusObjs.length === 0)) {
            // The lack of data for both user pods and system pods indicates that we are failing to retrieve their data and
            // we are in an unknown state
            this.userPodDraftData = undefined;
            this.numHealthyUserPods = undefined;
            this.numUserPods = undefined;
            //unknown is worst thing so setting lowest health ratio
            //highest health ratio indicates that everything is good
            this.userPodHealthRatio = Number.MIN_SAFE_INTEGER ? Number.MIN_SAFE_INTEGER : Constants.MIN_SAFE_INTEGER;
            this.userPodHealthRatioDisplayValue = DisplayStrings.MissingData;
            this.userPodOverallHealth = HealthStatus.Unknown;
        } else if ((!userPodStatusObjs || userPodStatusObjs.length === 0) &&
            systemPodStatusObjs && systemPodStatusObjs.length > 0) {
            // System pod data indicates that the cluster is running.
            // The lack of userPod data in this case indicates that the cluster has no user pods running
            // and not that we are missing data from them.
            this.userPodDraftData = undefined;
            this.numHealthyUserPods = 0;
            this.numUserPods = 0;
            this.userPodHealthRatio = 1;
            this.userPodHealthRatioDisplayValue = '0';
            this.userPodOverallHealth = HealthStatus.Healthy;
        } else {

            this.userPodDraftData = userPodStatusObjs;
            let tallies: any = MonitoredClusterMetaData.tallyResourceStatusObjs(userPodStatusObjs, ClusterResourceType.UserPod);
            this.numHealthyUserPods = tallies.numHealthyResources;
            this.numUserPods = tallies.numResources;
            this.userPodHealthRatioDisplayValue = `${this.numHealthyUserPods} / ${this.numUserPods}`;
            this.userPodHealthRatio = this.numHealthyUserPods / this.numUserPods;
            this.userPodOverallHealth = HealthCalculator.getUserPodOverallHealth(this.userPodHealthRatio);
        }
    }

    /**
     * sets system PodMetadata
     * @param systemPodStatusObjs
     */
    private setSystemPodMetaData(systemPodStatusObjs: IResourceStatusObj[]): void {
        if (!systemPodStatusObjs || systemPodStatusObjs.length === 0) { // No data was received in the last 30 minutes => Unknown state
            this.systemPodDraftData = undefined;
            this.numHealthySystemPods = undefined;
            this.numSystemPods = undefined;
            //unknown is worst thing so setting lowest health ratio
            //highest health ratio indicates that everything is good
            this.systemPodHealthRatio = Number.MIN_SAFE_INTEGER ? Number.MIN_SAFE_INTEGER : Constants.MIN_SAFE_INTEGER;
            this.systemPodHealthRatioDisplayValue = DisplayStrings.MissingData;
            this.systemPodOverallHealth = HealthStatus.Unknown;
        } else {

            this.systemPodDraftData = systemPodStatusObjs;

            let tallies: any = MonitoredClusterMetaData.tallyResourceStatusObjs(systemPodStatusObjs, ClusterResourceType.SystemPod);
            this.numHealthySystemPods = tallies.numHealthyResources;
            this.numSystemPods = tallies.numResources;
            this.systemPodHealthRatioDisplayValue = `${this.numHealthySystemPods} / ${this.numSystemPods}`;
            this.systemPodHealthRatio = this.numHealthySystemPods / this.numSystemPods;
            this.systemPodOverallHealth = HealthCalculator.getSystemPodOverallHealth(this.systemPodHealthRatio);
        }
    }

}
