import { IGridLineObject, GridLineObject } from '../../shared/GridLineObject';
import { IMulticlusterMetaDataBase } from './IMulticlusterMetaDataBase';
import { IManagedCluster, ClusterType } from './IManagedCluster';
import { HealthStatus } from './HealthCalculator';
import { MulticlusterGridBase } from '../grids/MulticlusterGridBase';

/**
 * Specifies the index of columns in the unmonitored cluster grid
 * Indices should match the indices of respective kusto query projection columns
 */
export enum UnmonitoredGridColumnMap {
    ClusterName = 0,
    Monitoring = 1,
    Status = 2,
    Nodes = 3,
    UserPods = 4,
    SystemPods = 5
}

/**
 * Primary metadata object and parsing logic for the node view parents (VMs)
 * this object also understands how to wrap an actual sgdatarow in this metadata
 */
export class UnmonitoredClusterMetaData implements IMulticlusterMetaDataBase {
    public clusterId: string;
    public workspaceId: string;
    public name: string;
    public clusterType: ClusterType;
    public clusterVersion: string;
    public clusterLocation: string;
    public monitoring: any;
    public clusterStatus: HealthStatus | any;
    public nodeHealthRatioDisplayValue: string;
    public userPodHealthRatioDisplayValue: string;
    public systemPodHealthRatioDisplayValue: string;
    public clusterStatusInfoMessage: string;

    /**
     * .ctor() setup the metadata object with an initial row of data
     * @param resultRow initial kusto record to start the object off with
     * @param timestamp the time interval represented (outside a certain range some data will change)
     */
    public constructor(managedCluster: IManagedCluster) {
        this.setMetaData(managedCluster);
    }

    /**
     * Given a value and a metadata object wrap the value in the metadata object utilizing the GridLineObject class
     * @param record value we want to wrap with metadata
     * @param metaReference the metadata we would like to wrap the value in
     */
    public static metaWrapperHelper(record: any, metaReference: UnmonitoredClusterMetaData): IGridLineObject<UnmonitoredClusterMetaData> {
        return new GridLineObject(record, metaReference);
    }

    /**
     * Turn this metadata object into a fully wrapped array ready for SGDataRow, i.e. an array of metadata wrapped values
     * @returns {IGridLineObject<NodeMetaData>[]} an array of values fully wrapped by metadata ready for selectable grid
     */
    public formatUnmonitoredClusterRow(): IGridLineObject<UnmonitoredClusterMetaData>[] {
        const row: IGridLineObject<UnmonitoredClusterMetaData>[] = [];

        row.push(
            UnmonitoredClusterMetaData.metaWrapperHelper(this.name, this),
            UnmonitoredClusterMetaData.metaWrapperHelper(this.clusterType, this),
            UnmonitoredClusterMetaData.metaWrapperHelper(this.monitoring, this),
            UnmonitoredClusterMetaData.metaWrapperHelper(this.clusterStatus, this),
            UnmonitoredClusterMetaData.metaWrapperHelper(this.nodeHealthRatioDisplayValue, this),
            UnmonitoredClusterMetaData.metaWrapperHelper(this.userPodHealthRatioDisplayValue, this),
            UnmonitoredClusterMetaData.metaWrapperHelper(this.systemPodHealthRatioDisplayValue, this),
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
    private setMetaData(managedCluster: IManagedCluster) {
        this.clusterId = managedCluster.resourceId;
        this.workspaceId = managedCluster.workspaceResourceId;
        this.name = MulticlusterGridBase.getClusterName(managedCluster.name, this.clusterId);
        this.clusterType = managedCluster.clusterType;
        this.clusterLocation = managedCluster.clusterLocation;

        this.monitoring = '';
        this.clusterStatus = HealthStatus[HealthStatus.Unmonitored];
        this.clusterStatusInfoMessage = '';

        this.nodeHealthRatioDisplayValue = '-';
        this.userPodHealthRatioDisplayValue = '-';
        this.systemPodHealthRatioDisplayValue = '-';
    }
}
