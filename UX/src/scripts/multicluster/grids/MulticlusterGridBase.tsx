
/** tpl */
import * as React from 'react';
import { SGSortOrder, SGDataRow } from 'appinsights-iframe-shared';

/** local */
import { MultiClusterDataProvider } from '../data-provider/MultiClusterDataProvider';
import { IMulticlusterMetaDataBase } from '../metadata/IMulticlusterMetaDataBase';
import { UnmonitoredClusterMetaData } from '../metadata/UnmonitoredClusterMetaData';
import { MonitoredClusterMetaData, IMonitoredClusterMetaData } from '../metadata/MonitoredClusterMetaData';
import { IManagedCluster, ClusterType } from '../metadata/IManagedCluster';
import { ISummaryPanelInfo } from '../../shared/summary-panel/ISummaryPanelInfo';

/** shared */
import { IGridLineObject, GridLineObject } from '../../shared/GridLineObject';
import { DisplayStrings } from '../../shared/DisplayStrings';
import * as TelemetryStrings from '../../shared/TelemetryStrings';
import * as GlobalConstants from '../../shared/GlobalConstants';
import { IMessagingProvider, ISingleAksClusterNavigationMessage, MessagingProvider } from '../../shared/MessagingProvider';
import { TelemetryFactory } from '../../shared/TelemetryFactory';
import { TelemetryMainArea } from '../../shared/Telemetry';
import { HealthStatus } from '../metadata/HealthCalculator';
import { KustoDraftDataProvider } from '../../shared/data-provider/v2/KustoDataProvider';
import { EnvironmentConfig } from '../../shared/EnvironmentConfig';
import { InitializationInfo, AuthorizationTokenType } from '../../shared/InitializationInfo';
import { DisplayStrings as MultiClusterDisplayStrings } from '../MulticlusterDisplayStrings';

/** svg */
import { GreenSvg } from '../../shared/svg/green';
import { WarnSvg } from '../../shared/svg/warn';
import { UnknownSvg } from '../../shared/svg/unknown';
import { ClusterSVG } from '../../shared/svg/cluster';
import { ACSEngineClusterSVG } from '../../shared/svg/acs-engine-cluster';
import { AROClusterSVG } from '../../shared/svg/aro-cluster';
import { ARCClusterSVG } from '../../shared/svg/arc-k8s-cluster';
import { SortHelper } from '../../shared/SortHelper';
import { FailedSvg } from '../../shared/svg/failed';
import { IPillSelections } from '../../container/ContainerMainPageTypings';


/**
 * Sort order of the grid
 */
export enum GridSortOrder {
    Asc = 0,
    Desc = 1
}

/**
 * Index of the Container Insights Tab
 */
export enum ContainerInsightsGrid {
    Charts = 0,
    Health = 1,
    Nodes = 2,
    Controllers = 3,
    Containers = 4,
}

/**
 * Display names of the Cluster Type
 * TODO - localize them if needed
 */
export const ClusterTypeDisplayNameMap: { [key: string]: string } = {
    ['AKS']: MultiClusterDisplayStrings.AKS,
    ['AKSEngine']: MultiClusterDisplayStrings.AKSEngine,
    ['AKSEngineAzStack']: MultiClusterDisplayStrings.AKSEngineAzStack,
    ['ARO']: MultiClusterDisplayStrings.ARO,
    ['AROv4']: MultiClusterDisplayStrings.ARO,
    ['AzureArc']: MultiClusterDisplayStrings.AzureArc,
    ['Other']: MultiClusterDisplayStrings.Kubernetes
}

/**
 * type of the cloud environment
 */
export enum CloudEnvironment {
    /** Azure */
    Azure = 0,
    /** Azurestack */
    AzureStack = 1,
    /** k8s cluster hosted outside Azure and Azure stack */
    NonAzure = 2,
    /** k8s cluster hosted outside Azure and Azure stack */
    All = 3,
}

/**
 * Display names of the Cloud Environment
 */
export const CloudEnvironmenDisplayNameMap: { [key: string]: string } = {
    ['Azure']: MultiClusterDisplayStrings.Azure,
    ['AzureStack']: MultiClusterDisplayStrings.AzureStack,
    ['NonAzure']: MultiClusterDisplayStrings.NonAzure,
    ['All']: MultiClusterDisplayStrings.All,
}


/**
 * Wrapper around a small part of the query props on the views... giving us access to the sort details here
 */
export interface IQueryPropsRequiredField {
    sortOrder: GridSortOrder;
    sortColumnIndex: number;
}

/**
 * shared functionalities for monitored and non-monitored grids
 */
export class MulticlusterGridBase {

    /**
     * determines whether managed k8s cluster or not
     * @param clusterResourceId - azure resource id of the cluster
     */
    public static isManagedCluster(clusterResourceId: string): boolean {
        return (clusterResourceId && (clusterResourceId.toLocaleLowerCase().indexOf('/microsoft.containerservice/managedclusters') >= 0
            || clusterResourceId.toLocaleLowerCase().indexOf('/microsoft.containerservice/openshiftmanagedclusters') >= 0
            || clusterResourceId.toLocaleLowerCase().indexOf('/microsoft.kubernetes/connectedclusters') >= 0)
            || clusterResourceId.toLocaleLowerCase().indexOf('/microsoft.redhatopenshift/openshiftclusters') >= 0);
    }

    /**
     * First: Ensure '-' based metrics are always on bottom
     * Second: Compare
     * Third (optional): If they are equal use the name of the row to break the tie
     * @param a left hand side of comparison used by sort
     * @param b right hand side of comparison used by sort
     * @param queryProps the current props state of the control that calls us (used for sort direction/column)
     */
    public static gridSortValue(
        a: IGridLineObject<IMulticlusterMetaDataBase>,
        b: IGridLineObject<IMulticlusterMetaDataBase>,
        queryProps: IQueryPropsRequiredField
    ): number {
        const sortOrderFinalPassNullData = (target): number => {
            if (typeof target !== 'number') {
                return queryProps.sortOrder === GridSortOrder.Asc ? Number.MIN_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
            }
            return target;
        }

        // bbax: "-", null, etc... shove that all at the bottom
        const realValueA = sortOrderFinalPassNullData(a.value);
        const realValueB = sortOrderFinalPassNullData(b.value);

        if (realValueA - realValueB === 0) {
            const result = SortHelper.Instance().sortByNameAlphaNumeric(a.metaData.name, b.metaData.name)
            return queryProps.sortOrder === GridSortOrder.Asc ? result : result * -1;
        }

        return realValueA - realValueB;
    }

    /**
     * returns the Health status icon
     *  Error, MisConfigued,Nodata, Unauthorized and Unknown will have same status icon
     * @param healthStatus - cluster health status
     */
    public static getHealthStatusIcon(
        healthStatus: HealthStatus,
    ): JSX.Element {
        let icon: JSX.Element;
        switch (healthStatus) {
            case HealthStatus.Healthy:
                icon = <GreenSvg />;
                break;
            case HealthStatus.Warning:
                icon = <WarnSvg />
                break;
            case HealthStatus.Critical:
                icon = <FailedSvg />
                break;
            case HealthStatus.Unknown:
            case HealthStatus.Error:
            case HealthStatus.MisConfigured:
            case HealthStatus.NoData:
            case HealthStatus.NotFound:
            case HealthStatus.UnAuthorized:
                icon = <UnknownSvg />
                break;
        }

        return icon;
    }

    /**
     * Returns a string telling you how many items there are in the grid
     * @param unfilteredGridData grid data before it's been filtered
     * @param filteredGridData grid data after it's been filtered by search
     */
    public static getGridItemCount(unfilteredGridData: SGDataRow[], filteredGridData: SGDataRow[]): string {
        let itemCountStr: string;
        const isGridDataFiltered: boolean = filteredGridData.length < unfilteredGridData.length;

        if (!filteredGridData || filteredGridData.length === 0) {
            if (isGridDataFiltered) {
                itemCountStr = DisplayStrings.ZeroItemCountRatio.replace('{0}', `${unfilteredGridData.length}`);
            } else {
                itemCountStr = DisplayStrings.ZeroItemCount;
            }
        } else if (filteredGridData.length === 1) {
            if (isGridDataFiltered) {
                itemCountStr = DisplayStrings.OneItemCountRatio.replace('{0}', `${unfilteredGridData.length}`);
            } else {
                itemCountStr = DisplayStrings.OneItemCount;
            }
        } else {
            if (isGridDataFiltered) {
                itemCountStr = DisplayStrings.MultipleItemCountRatio.replace('{0}', `${filteredGridData.length}`)
                itemCountStr = itemCountStr.replace('{1}', `${unfilteredGridData.length}`);
            } else {
                itemCountStr = DisplayStrings.MultipleItemCount.replace('{0}', `${unfilteredGridData.length}`);
            }
        }

        return itemCountStr;
    }

    /**
     * Convert GridSortOrder to SGSortOrder so we can track our own internal
     * Do we really need this second sort enum?
     * @param sortOrder GridSortOrder to conver
     */
    public static convertSortOrderToSgSortOrder(sortOrder: GridSortOrder): SGSortOrder {
        return sortOrder === GridSortOrder.Asc ? SGSortOrder.Ascending : SGSortOrder.Descending;
    }

    /**
     * Creates the data provider for MultiCluster Insights
     * @return MultiClusterDataProvider
     */
    public static createDataProvider(): MultiClusterDataProvider {
        const dataProvider: MultiClusterDataProvider = new MultiClusterDataProvider(
            new KustoDraftDataProvider(
                () => EnvironmentConfig.Instance().getDraftEndpoint(),
                GlobalConstants.MultiAksConatinerInsightsApplicationId,
                () => InitializationInfo.getInstance().getAuthorizationHeaderValue(AuthorizationTokenType.LogAnalytics)
            )
        );
        return dataProvider;
    }

    /**
     * message for navigate to CI Nodes tab
     * @param messagingProvider
     * @param pillSelectionsOnNavigation
     */
    public static navigateToContainerInsightsNodesTab(
        messagingProvider: IMessagingProvider,
        pillSelectionsOnNavigation: IPillSelections,
    ): (data: GridLineObject<MonitoredClusterMetaData>) => void {
        return (data: GridLineObject<MonitoredClusterMetaData>) => {
            const castedData = data as IGridLineObject<IMonitoredClusterMetaData>;
            if (!castedData || !castedData.metaData) {
                throw new Error('unexpected data in sort of grid');
            }

            //for non managed clusters, agent emits both clustername and clusterResourecId  are the same
            // hence for use the clusterId for both name and id
            const clusterName = this.isManagedCluster(castedData.metaData.clusterId) ?
                castedData.metaData.name : castedData.metaData.clusterId;

            const msgData: ISingleAksClusterNavigationMessage = {
                clusterResourceId: castedData.metaData.clusterId,
                clusterName: clusterName,
                workspaceResourceId: castedData.metaData.workspaceId,
                selectedTab: ContainerInsightsGrid.Nodes,
                pillSelections: pillSelectionsOnNavigation,
                clusterLocation: castedData.metaData.clusterLocation,

            };

            const telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
            telemetry.logNavigationEvent(TelemetryStrings.MultiClusterMainPage, TelemetryStrings.NodeGrid);
            (messagingProvider as MessagingProvider).sendNavigateToSingleAksClusterHealth(msgData);
        }
    }

    /**
     * message to navigate CI Controllers tab for User Pods and System Pods
     * @param messagingProvider
     * @param pillSelectionsOnNavigation
     */
    public static navigateToContainerInsightsControllersTab(
        messagingProvider: IMessagingProvider,
        pillSelectionsOnNavigation: IPillSelections,
    ): (data: GridLineObject<MonitoredClusterMetaData>) => void {
        return (data: GridLineObject<MonitoredClusterMetaData>) => {
            const castedData = data as IGridLineObject<IMonitoredClusterMetaData>;
            if (!castedData || !castedData.metaData) {
                throw new Error('unexpected data in sort of grid');
            }

            //for non managed clusters, agent emits both clustername and clusterResourecId  are the same
            // hence for use the clusterId for both name and id
            const clusterName = this.isManagedCluster(castedData.metaData.clusterId) ?
                castedData.metaData.name : castedData.metaData.clusterId;

            const msgData: ISingleAksClusterNavigationMessage = {
                clusterResourceId: castedData.metaData.clusterId,
                clusterName: clusterName,
                workspaceResourceId: castedData.metaData.workspaceId,
                selectedTab: ContainerInsightsGrid.Controllers,
                pillSelections: pillSelectionsOnNavigation,
                clusterLocation: castedData.metaData.clusterLocation,
            };

            const telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
            telemetry.logNavigationEvent(TelemetryStrings.MultiClusterMainPage, TelemetryStrings.ControllerGrid);
            (messagingProvider as MessagingProvider).sendNavigateToSingleAksClusterHealth(msgData);
        }
    }

    /**
     *  message to navigate to CI Health page and default is charts tab
     * @param messagingProvider
     */
    public static navigateToContainerInsightsChartsTab(
        messagingProvider: IMessagingProvider,
        pillSelectionsOnNavigation: IPillSelections,
    ): (data: GridLineObject<MonitoredClusterMetaData>) => void {
        return (data: GridLineObject<MonitoredClusterMetaData>) => {
            const castedData = data as IGridLineObject<IMonitoredClusterMetaData>;
            if (!castedData || !castedData.metaData) {
                throw new Error('unexpected data in sort of grid');
            }

            //for non managed clusters, agent emits both clustername and clusterResourecId  are the same
            // hence for use the clusterId for both name and id
            const clusterName = this.isManagedCluster(castedData.metaData.clusterId) ?
                castedData.metaData.name : castedData.metaData.clusterId;

            const msgData: ISingleAksClusterNavigationMessage = {
                clusterResourceId: castedData.metaData.clusterId,
                clusterName: clusterName,
                workspaceResourceId: castedData.metaData.workspaceId,
                selectedTab: ContainerInsightsGrid.Charts,
                pillSelections: pillSelectionsOnNavigation,
                clusterLocation: castedData.metaData.clusterLocation,
            };

            const telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
            telemetry.logNavigationEvent(TelemetryStrings.MultiClusterMainPage, TelemetryStrings.ChartsPage);
            (messagingProvider as MessagingProvider).sendNavigateToSingleAksClusterHealth(msgData);
        }
    }

    /**
     *  message to navigate to AKS Overview page for the cluster
     * @param messagingProvider
     */
    public static navigateToAKSOverview(
        messagingProvider: IMessagingProvider
    ): (data: GridLineObject<MonitoredClusterMetaData>) => void {
        return (data: GridLineObject<MonitoredClusterMetaData>) => {
            const castedData = data as IGridLineObject<IMonitoredClusterMetaData>;
            if (!castedData || !castedData.metaData) {
                throw new Error('unexpected data in sort of grid');
            }

            //for acs-engine clusters, agent emits both clustername and clusterResourecId  are the same
            const clusterName = this.isManagedCluster(castedData.metaData.clusterId) ?
                castedData.metaData.name : castedData.metaData.clusterId;

            const msgData: ISingleAksClusterNavigationMessage = {
                clusterResourceId: castedData.metaData.clusterId,
                clusterName: clusterName,
            };

            const telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
            telemetry.logNavigationEvent(TelemetryStrings.MultiClusterMainPage, TelemetryStrings.AksOverview);
            (messagingProvider as MessagingProvider).sendNavigateToSingleAksClusterOverview(msgData);
        }
    }


    /**
     * Sorting method for cluster status
     * @param a left hand side status
     * @param b right hand side status
     * @param sortOrder sort order of the grid so we can force other processes to top for example
     */
    public static sortClusterStatus(
        a: IGridLineObject<IMonitoredClusterMetaData>,
        b: IGridLineObject<IMonitoredClusterMetaData>,
        sortOrder: GridSortOrder
    ): number {
        const statusCodeOfA = a.value;
        const statusCodeOfB = b.value;
        let result = statusCodeOfA - statusCodeOfB;

        // if diff is same, then sort on secondary key
        if (result === 0) {
            const secondarySortA = a.metaData.getSortableKey();
            const secondarySortB = b.metaData.getSortableKey();
            const alphaSort = SortHelper.Instance().sortByNameAlphaNumeric(secondarySortA, secondarySortB);
            if (sortOrder === GridSortOrder.Asc) {
                return alphaSort;
            } else {
                return alphaSort * -1;
            }
        }

        return result;
    }

    /**
     * Sorting method for cluster type
     * @param a left hand side of type
     * @param b right hand side of type
     * @param sortOrder sort order of the grid so we can force other processes to top for example
     */
    public static sortClusterType(
        a: IGridLineObject<IMonitoredClusterMetaData>,
        b: IGridLineObject<IMonitoredClusterMetaData>,
        sortOrder: GridSortOrder
    ): number {
        const statusCodeOfA = a.value;
        const statusCodeOfB = b.value;
        let result = statusCodeOfA - statusCodeOfB;

        // if diff is same, then sort on secondary key
        if (result === 0) {
            const secondarySortA = a.metaData.getSortableKey();
            const secondarySortB = b.metaData.getSortableKey();
            const alphaSort = SortHelper.Instance().sortByNameAlphaNumeric(secondarySortA, secondarySortB);
            if (sortOrder === GridSortOrder.Asc) {
                return alphaSort;
            } else {
                return alphaSort * -1;
            }
        }

        return result;
    }

    /**
    * Sorting method for cluster version
    * @param a left hand side of type
    * @param b right hand side of type
    */
    public static sortClusterVersion(
        a: IGridLineObject<IMonitoredClusterMetaData>,
        b: IGridLineObject<IMonitoredClusterMetaData>,
        sortOrder: GridSortOrder
    ): number {

        let v1 = a.value;
        let v2 = b.value;
        v1 = v1.split('.');
        v2 = v2.split('.');

        const k = Math.min(v1.length, v2.length);

        for (let i = 0; i < k; ++i) {
            v1[i] = parseInt(v1[i], 10);
            v2[i] = parseInt(v2[i], 10);

            if (v1[i] > v2[i]) {
                return 1;
            }
            if (v1[i] < v2[i]) {
                return -1;
            }
        }
        // if both the versions are same, then sort on secondary key
        const result = v1.length - v2.length;

        if (result === 0) {
            const secondarySortA = a.metaData.getSortableKey();
            const secondarySortB = b.metaData.getSortableKey();
            const alphaSort = SortHelper.Instance().sortByNameAlphaNumeric(secondarySortA, secondarySortB);
            if (sortOrder === GridSortOrder.Asc) {
                return alphaSort;
            } else {
                return alphaSort * -1;
            }
        }

        if (result < 0) {
            return -1;
        }

        return 1;
    }


    /**
     * Provided with a list of SGDataRow[] and a string filter, this function will run a filter across the parents names
     * and filter the list...
     * Note: For children filtering there are comments below on hierarchyIsMatchingFilter
     * @param {SGDataRow[]} gridDataToFilter deep cloned copy of the grid data (note: we will destroy this list in some way likely)
     * @param gridDataFilter the string we would like to filter the grid list doing a contains search
     * @returns {SGDataRow[]} the filtered list
     */
    public static filterGridData(gridDataToFilter: SGDataRow[], gridDataFilter: string): any[] {
        if (!gridDataToFilter) {
            return null;
        }
        return gridDataToFilter.filter((gridRow: SGDataRow) => {
            return MulticlusterGridBase.hierarchyIsMatchingFilter(gridRow, gridDataFilter);
        });
    }

    /**
     *  returns the telemetry context with unique cluster subIds, workspace subIds,
     *  count of monitored clusters, count of non-monitored clusters and global subscriptions
     * @param managedClusters - list of managed (monitored and non-monitored) clusters in selected subscriptions
     * @param selectedGlobalSubscriptionsCount - count of selected global subscriptions in the Subscription filter
     * @param oneOfSelectedGlobalSubscriptionId - one of the subscription id from all selected subscription ids
     */
    public static getTelemetryContext(managedClusters: IManagedCluster[],
        selectedGlobalSubscriptionsCount: number,
        oneOfSelectedGlobalSubscriptionId: string): StringMap<string> {

        const clusterSubscriptionIds: string[] = this.getUniqueClusterSubscriptionIds(managedClusters);
        const workspaceSubscriptionIds: string[] = this.getUniqueWorkspaceSubscriptionIds(managedClusters);
        const uniqueWorkspacesCount: number = this.getUniqueWorkspaces(managedClusters).length;

        const monitoredClustersCount: number = managedClusters && managedClusters.length > 0 ?
            managedClusters.filter(cluster => cluster.workspaceResourceId && cluster.workspaceResourceId !== '').length :
            0;

        const nonMonitoredClustersCount: number = managedClusters && managedClusters.length > 0 ?
            managedClusters.length - monitoredClustersCount : 0;

        //gangams: TODO - add unique workspace regions to undrestand slow queries
        return {
            clusterSubscriptionIds: clusterSubscriptionIds.join(';'),
            workspaceSubscriptionIds: workspaceSubscriptionIds.join(';'),
            clusterSubscriptionsCount: clusterSubscriptionIds.length.toString(),
            workspaceSubscriptionsCount: workspaceSubscriptionIds.length.toString(),
            uniqueWorkspacesCount: uniqueWorkspacesCount.toString(),
            monitoredClustersCount: monitoredClustersCount.toString(),
            nonMonitoredClustersCount: nonMonitoredClustersCount.toString(),
            selectedGlobalSubscriptionsCount: selectedGlobalSubscriptionsCount.toString(),
            oneOfSelectedGlobalSubscriptionId: oneOfSelectedGlobalSubscriptionId,
        };
    }

    /**
     * Converts the array of cluster objects into an array of GridLineObjects
     * @param clusterList
     * @param isMonitoredClusterList
     */
    public static processClusterList(clusterList: IManagedCluster[], isMonitoredClusterList: boolean = false):
        IGridLineObject<any>[][] {
        // hashtable object-name => object-index-in-array
        const clusterDictionary: StringMap<any> = {};
        const clusterMetaDataList: any[] = [];

        for (let i = 0; i < clusterList.length; i++) {
            // each row is an array of values for columns
            const managedCluster = clusterList[i];
            const id = managedCluster.resourceId;

            // see if we've seen this object name
            if (clusterDictionary[id] === undefined) {
                const metaData = isMonitoredClusterList ?
                    new MonitoredClusterMetaData(null, managedCluster) :
                    new UnmonitoredClusterMetaData(managedCluster);
                clusterDictionary[id] = metaData;
                clusterMetaDataList.push(metaData);
            }
        }

        const clusterGridLineObjectList: IGridLineObject<any>[][] = [];

        clusterMetaDataList.forEach((obj) => {
            clusterGridLineObjectList.push(isMonitoredClusterList ?
                obj.formatMonitoredClusterRow() :
                obj.formatUnmonitoredClusterRow());
        });

        return clusterGridLineObjectList;
    }

    /**
     * computes the cluster status stats for summary panel
     * @param monitoredClusterList
     * @param nonMonitoredClustersList
     */
    public static tallyClusterStatuses(monitoredClusterList: IGridLineObject<MonitoredClusterMetaData>[][],
        nonMonitoredClustersList: IGridLineObject<UnmonitoredClusterMetaData>[][]): ISummaryPanelInfo {
        let newControlPanelInfo: ISummaryPanelInfo = {
            numTotal: monitoredClusterList.length + nonMonitoredClustersList.length,
            numCritical: 0,
            numWarning: 0,
            numHealthy: 0,
            numUnknown: 0,
            numNonMonitored: 0,
        }

        for (let i = 0; i < monitoredClusterList.length; i++) {
            // each row is an array of values for columns
            const cluster: IGridLineObject<MonitoredClusterMetaData>[] = monitoredClusterList[i];
            const clusterMetadata = cluster[0].metaData;
            const clusterStatus = clusterMetadata.clusterStatus;

            switch (clusterStatus) {
                case HealthStatus.Healthy:
                    // this indicates the cluster is AKS
                    newControlPanelInfo.numHealthy += 1;
                    break;
                case HealthStatus.Warning:
                    newControlPanelInfo.numWarning += 1;
                    break;
                case HealthStatus.Critical:
                    newControlPanelInfo.numCritical += 1;
                    break;
                case HealthStatus.Unknown:
                case HealthStatus.Error:
                case HealthStatus.MisConfigured:
                case HealthStatus.NoData:
                case HealthStatus.NotFound:
                case HealthStatus.UnAuthorized:
                    newControlPanelInfo.numUnknown += 1;
                    break;
                default:
                    throw new Error('Cluster status is invalid');
            }
        }

        newControlPanelInfo.numNonMonitored = nonMonitoredClustersList.length;

        return newControlPanelInfo;
    }


    /**
     * returns the unique workspace to monitored clusters mapping
     *
     * @param monitoredClustersList
     */
    public static getWorkspaceToMonitoredClustersMapping(monitoredClustersList: IManagedCluster[]) {
        let workspaceToClustersMapping: StringMap<string[]> = {};
        let nonExistentWorkspaceToClustersMapping: StringMap<string[]> = {};
        monitoredClustersList.forEach(cluster => {
            const clusterId = this.isManagedCluster(cluster.resourceId) ?
                cluster.resourceId : cluster.name;
            const workspaceId = cluster.workspaceGuid ? cluster.workspaceGuid : cluster.workspaceName;
            if (!cluster.isWorkspaceDeletedOrHasNoAccess) {
                if (workspaceToClustersMapping[workspaceId]) {
                    if (workspaceToClustersMapping[workspaceId].indexOf(clusterId) === -1) {
                        workspaceToClustersMapping[workspaceId].push(clusterId);
                    }
                } else {
                    workspaceToClustersMapping[workspaceId] = [];
                    workspaceToClustersMapping[workspaceId].push(clusterId);
                }
            } else {
                if (nonExistentWorkspaceToClustersMapping[workspaceId]) {
                    if (nonExistentWorkspaceToClustersMapping[workspaceId].indexOf(clusterId) === -1) {
                        nonExistentWorkspaceToClustersMapping[workspaceId].push(clusterId);
                    }
                } else {
                    nonExistentWorkspaceToClustersMapping[workspaceId] = [];
                    nonExistentWorkspaceToClustersMapping[workspaceId].push(clusterId);
                }
            }
        });

        return {
            existentWorkspacesMapping: workspaceToClustersMapping,
            NonExistentWorkspacesMapping: nonExistentWorkspaceToClustersMapping
        };
    }

    /**
     * returns the unique workspace subscription Ids of all managed clusters
     * @param managedClusters - list of managed clusters (monitored and non-monitored clusters)
     */
    public static getUniqueWorkspaceSubscriptionIds(managedClusters: IManagedCluster[]): string[] {

        let uniqueWorkspaceSubscriptionIds: string[] = [];
        if (managedClusters && managedClusters.length > 0) {
            managedClusters.forEach(cluster => {
                const workspaceResourceId: string = cluster.workspaceResourceId;

                const workspaceSubscriptionId: string = workspaceResourceId ? workspaceResourceId.split('/')[2] : '';

                if (workspaceSubscriptionId !== '' && uniqueWorkspaceSubscriptionIds.indexOf(workspaceSubscriptionId) === -1) {
                    uniqueWorkspaceSubscriptionIds.push(workspaceSubscriptionId);
                }

            });
        }

        return uniqueWorkspaceSubscriptionIds;
    }

    /**
     * returns the workspaceId to WorkspaceResourceId mapping
     * @param managedClusters - list of managed clusters (monitored and non-monitored clusters)
     */
    public static getWorkspaceIdToResIdMap(managedClusters: IManagedCluster[]): StringMap<string> {
        let workspaceIdToResIdMap: StringMap<string> = {};

        if (managedClusters && managedClusters.length > 0) {
            managedClusters.forEach(cluster => {
                const workspaceResourceId: string = cluster.workspaceResourceId;
                const workspaceId: string = cluster.workspaceGuid ? cluster.workspaceGuid : cluster.workspaceName;
                workspaceIdToResIdMap[workspaceId] = workspaceResourceId;
            });
        }
        return workspaceIdToResIdMap;
    }


    /**
     * returns the unique workspaces
     * @param managedClusters - list of managed clusters (monitored and non-monitored clusters)
     */
    public static getUniqueWorkspaces(managedClusters: IManagedCluster[]): string[] {

        let uniqueWorkspaces: string[] = [];
        if (managedClusters && managedClusters.length > 0) {
            managedClusters.forEach(cluster => {
                const workspaceResourceId: string = cluster.workspaceResourceId ? cluster.workspaceResourceId.toLocaleLowerCase() : '';
                if (workspaceResourceId !== '' && uniqueWorkspaces.indexOf(workspaceResourceId) === -1) {
                    uniqueWorkspaces.push(workspaceResourceId);
                }

            });
        }

        return uniqueWorkspaces;
    }

    /**
     *  returns the unique subscription Ids of all managed clusters
     * @param managedClusters - list of managed (monitored and non-monitored) clusters
     */
    public static getUniqueClusterSubscriptionIds(managedClusters: IManagedCluster[]): string[] {

        let uniqueClusterSubscriptionIds: string[] = [];
        if (managedClusters && managedClusters.length > 0) {
            managedClusters.forEach(cluster => {
                const clusterResourceId: string = cluster.resourceId;
                const clusterSubscriptionId: string = clusterResourceId ? clusterResourceId.split('/')[2] : '';

                if (clusterSubscriptionId !== '' && uniqueClusterSubscriptionIds.indexOf(clusterSubscriptionId) === -1) {
                    uniqueClusterSubscriptionIds.push(clusterSubscriptionId);
                }

            });
        }

        return uniqueClusterSubscriptionIds;
    }

    /** Returns appropriate icon based on whether the resource is AKS or ACS Engine */
    public static getClusterIcon(value: IGridLineObject<IMulticlusterMetaDataBase>): JSX.Element {

        if (!value.metaData || !value.metaData.clusterId) {
            return <ClusterSVG />;
        }
        const metaData = value.metaData;

        if (metaData &&
            (metaData.clusterId.toLocaleLowerCase().indexOf('microsoft.containerservice/managedclusters') >= 0)
        ) { // AKS
            return <ClusterSVG />;
        }
        if (metaData &&
            ((metaData.clusterId.toLocaleLowerCase().indexOf('microsoft.containerservice/openshiftmanagedclusters') >= 0) ||
                (metaData.clusterId.toLocaleLowerCase().indexOf('microsoft.redhatopenshift/openshiftclusters') >= 0))
        ) {
            // ARO v3 and v4
            return <AROClusterSVG />;
        }

        if (metaData &&
            (metaData.clusterId.toLocaleLowerCase().indexOf('microsoft.kubernetes/connectedclusters') >= 0)) {
              return <ARCClusterSVG />;
        }

        // ACS Engine
        return <ACSEngineClusterSVG />;
    }

    /**
     * acs-engine is identified by resource group
     * extract resource group Name from Resource Group Resource Id
     * @param nameOrRgResourceId
     * @param clusterResId
     */
    public static getClusterName(nameOrRgResourceId: string, clusterResId: string): string {
        // resourceId format - /subscriptions/<subId>/resourcegroups/<rg>

        if (nameOrRgResourceId) {
            let resourceParts: string[] = nameOrRgResourceId.split('/');

            if ((resourceParts.length === 0) || (resourceParts.length < 4)) {
                return nameOrRgResourceId;
            }

            return resourceParts[4];
        }

        return MulticlusterGridBase.getClusterNameFromResourceId(clusterResId);
    }


    /**
     * extract clusterName from Managed cluster Azure Resource Id
     * @param clusterResId
     */
    public static getClusterNameFromResourceId(clusterResId: string): string {
        // resourceId format - /subscriptions/<subId>/resourcegroups/<rg>/providers/Microsoft.ContainerService/managedClusters/<clusterName>
        let resourceParts: string[] = clusterResId.split('/');

        if ((resourceParts.length === 0) || (resourceParts.length < 8)) {
            return clusterResId;
        }

        return resourceParts[8];
    }

    /**
    *  returns the type of cluster
    * @param clusterResourceId - resource id of the cluster
    */
    public static getClusterType(clusterResourceId: string): ClusterType {

        if (!clusterResourceId) {
            return ClusterType.Other;
        }

        if (clusterResourceId.toLocaleLowerCase().indexOf('microsoft.containerservice/managedclusters') > -1) {
            return ClusterType.AKS;
        }

        if (clusterResourceId.toLocaleLowerCase().indexOf('microsoft.containerservice/openshiftmanagedclusters') > -1) {
            return ClusterType.ARO;
        }

        if (clusterResourceId.toLocaleLowerCase().indexOf('microsoft.redhatopenshift/openshiftclusters') > -1) {
            return ClusterType.AROv4;
        }

        if (clusterResourceId.toLocaleLowerCase().indexOf('microsoft.kubernetes/connectedclusters') > -1) {
            return ClusterType.AzureArc;
        }

        if (clusterResourceId.toLocaleLowerCase().indexOf('microsoft.compute/virtualmachinescalesets') > -1
            || clusterResourceId.toLocaleLowerCase().indexOf('microsoft.compute/virtualmachines') > -1
            || clusterResourceId.toLocaleLowerCase().indexOf('/resourcegroups/') > -1) {

            return ClusterType.AKSEngine;
        }

        return ClusterType.Other;
    }

    /**
     *  gets the  monitoring onboarding link corresponding  the cluster type
     * @param clusterResourceId  - fully qualified resource id of the cluster
     */
    public static getMonitoringOnboardingLink(clusterResourceId: string): string {
         if (clusterResourceId) {
            if (clusterResourceId.toLocaleLowerCase().indexOf('microsoft.redhatopenshift/openshiftclusters') >= 0) {
                 return GlobalConstants.aroV4OnboardingLink;
            } else if (clusterResourceId.toLocaleLowerCase().indexOf('microsoft.kubernetes/connectedclusters') >= 0) {
                return GlobalConstants.azureArcOnboardingLink;
            }
         }

         return GlobalConstants.aksEngineOnboardingLink;
    }

    /**
     * Decide if an item should be included in the final grid list (and its children)
     * Note: Child filtering isn't enabled, but i added some thoughts below on how to start to do it but
     * the problem is really hard (imagine a collapsed hierarchy searching for myapp-123) on the node view
     * where only 2 nodes of 3 have been loaded... should we query kusto?? this could get crazy
     * @param rootGridEntry deep cloned copy to the root of a potentially hierarchy of grid items
     * @param gridDataFilter the string filter we would like to do a contains search on
 * @returns {boolean} true if this parent's name should be considered included (note that child filtering isn't enabled yet)
            */
    private static hierarchyIsMatchingFilter(rootGridEntry: any, gridDataFilter: string): boolean {
        const nameColumn = rootGridEntry.columnData[0].value;

        if (!nameColumn) { return false; }

        if (typeof nameColumn === 'string') {
            const nameLower: string = ((nameColumn) as string).toLocaleLowerCase();
            if (nameLower.indexOf(gridDataFilter.toLocaleLowerCase()) > -1) {
                return true;
            }
        } else {
            const nameGridLineRow = nameColumn;

            let targetName = nameGridLineRow.name || '';
            targetName = targetName.toLocaleLowerCase();
            if (targetName.indexOf(gridDataFilter.toLocaleLowerCase()) > -1) {
                return true;
            }
        }

        // bbax: if you need to filter the children inside the hierarch you can do that here
        // simple implementation would be to recurse back in on yourself here... the root
        // was deep copied using immutability-helper, so you are safe to destroy the children
        // as you see fit!

        return false;
    }
}
