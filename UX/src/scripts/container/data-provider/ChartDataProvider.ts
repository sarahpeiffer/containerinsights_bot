/**
 * tpl
 */
import { Promise } from 'es6-promise'

/**
 * local
 */
import { ChartQueryTemplate } from './QueryTemplates/ChartQueryTemplate';

/**
 * shared
 */
import {
    KustoArmDataProvider,
    KustoDraftDataProvider,
    IKustoDataProvider,
    IKustoQueryOptions,
    Prefer
} from '../../shared/data-provider/v2/KustoDataProvider';
import { ArmDataProvider, IArmDataProvider } from '../../shared/data-provider/v2/ArmDataProvider';
import { ITimeInterval } from '../../shared/data-provider/TimeInterval';
import * as Constants from '../../shared/GlobalConstants';
import { InitializationInfo, AuthorizationTokenType } from '../../shared/InitializationInfo';
import { EnvironmentConfig } from '../../shared/EnvironmentConfig';
import { ArmBatchDataProvider } from '../../shared/data-provider/v2/ArmBatchDataProvider';
import { IKubernetesCluster } from '../IBladeContext';
import { BladeLoadManager } from '../messaging/BladeLoadManager';
import { HttpVerb } from '../../shared/data-provider/v2/HttpDataProvider';

/** Query options to run Kusto query via Arm/Draft or Draft direct */
export enum QueryAvenue {
    Arm = 'Arm',
    Draft = 'Draft'
}

/**
 * Chart/cluster page query names appearing in telemtry
 */
export enum ChartQueryTelemetryEventName {
    /** refers to all (three) chart queries combined */
    AllKusto = 'kustoContainerClusterChartsLoad',

    /** cpu and memory metric query */
    CpuAndMemory = 'kustoContainerClusterCharts-CpuAndMemory-Load',

    /** node counts */
    NodeCount = 'kustoContainerClusterCharts-NodeCount-Load',

    /** pod counts */
    PodCount = 'kustoContainerClusterCharts-PodCount-Load'
}

/**
 * Provides functionality to construct Kusto data provider for chart queries
 * NOTE: can be removed once we;re done with A/B experiment on Arm/Draft
 */
export class ChartDataProviderFactory {
    /**
     * Creates Kusto data provider
     * @param queryAvenue Arm or Draft query execution avenue
     * @returns kusto data provider to be used by chart queries
     */
    public static CreateKustoDataProvider(queryAvenue: QueryAvenue) {
        let kustoDataProvider: IKustoDataProvider = null;

        switch (queryAvenue) {
            case QueryAvenue.Arm:
                kustoDataProvider = new KustoArmDataProvider(
                    Constants.ContainerInsightsApplicationId,
                    new ArmDataProvider(
                        EnvironmentConfig.Instance().getARMEndpoint(),
                        () => { return InitializationInfo.getInstance().getAuthorizationHeaderValue(AuthorizationTokenType.Arm); }
                    )
                );
                break;
            case QueryAvenue.Draft:
                kustoDataProvider = new KustoDraftDataProvider(
                    () => EnvironmentConfig.Instance().getDraftEndpoint(),
                    Constants.ContainerInsightsApplicationId,
                    () => InitializationInfo.getInstance().getAuthorizationHeaderValue(AuthorizationTokenType.LogAnalytics)
                );
                break;
        }

        return kustoDataProvider;
    }

    /**
     * creates a generic arm data provider
     */
    public static CreateArmDataProvider(): IArmDataProvider {
        return new ArmDataProvider(
            EnvironmentConfig.Instance().getARMEndpoint(),
            () => { return InitializationInfo.getInstance().getAuthorizationHeaderValue(AuthorizationTokenType.Arm); }
        )
    }
}

/**
 * Provides functionality to query data for container cluster page charts
 */
export class ChartDataProvider {
    /** underlying Kusto data provider */
    private kustoDataProvider: IKustoDataProvider;

    /** arm data provider to utilize for MDM batch requests */
    private armDataProvider: IArmDataProvider;
    

    /**
     * Initializes an instance of the class
     * @param kustoDataProvider underlying Kusto data provider
     * @param queryAvenue specifies method of query to place on query metadata: arm or draft direct
     */
    constructor(kustoDataProvider: IKustoDataProvider, armDataProvider: IArmDataProvider) {
        if (!kustoDataProvider) { throw new Error('Parameter @kustoDataProvider may not be null or undefined'); }

        this.kustoDataProvider = kustoDataProvider;
        this.armDataProvider = armDataProvider;
    }

    /**
     * setup the mdm batch provider for ARM / MDM batch request to populate the ci charts
     * @param subscriptionId subscription to query for chart data
     * @param resourceGroup resource group the cluster exists in
     * @param clusterName cluster name to query
     * @param timeInterval timeinterval to query over
     */
    public getArmChartData(
        subscriptionId: string,
        resourceGroup: string,
        clusterName: string,
        timeInterval: ITimeInterval
    ): Promise<any> {
        return ArmBatchDataProvider.createRequest(this.armDataProvider)
            .addMDMQuery(HttpVerb.Get, 'cpuUsagePercentage', 'insights.container/nodes', 'average',
                timeInterval, subscriptionId, resourceGroup, clusterName)
            .addMDMQuery(HttpVerb.Get, 'cpuUsagePercentage', 'insights.container/nodes', 'maximum',
                timeInterval, subscriptionId, resourceGroup, clusterName)
            .addMDMQuery(HttpVerb.Get, 'memoryRssPercentage', 'insights.container/nodes', 'average',
                timeInterval, subscriptionId, resourceGroup, clusterName)
            .addMDMQuery(HttpVerb.Get, 'memoryRssPercentage', 'insights.container/nodes', 'maximum',
                timeInterval, subscriptionId, resourceGroup, clusterName)
            .addMDMQuery(HttpVerb.Get, 'nodesCount', 'insights.container/nodes', 'total',
                timeInterval, subscriptionId, resourceGroup, clusterName, 'status eq \'*\'')
            .addMDMQuery(HttpVerb.Get, 'PodCount', 'insights.container/pods', 'total',
                timeInterval, subscriptionId, resourceGroup, clusterName, 'phase eq \'*\'')
            .execute(60000);
    }

    /**
     * Returns cpu and memory utilization data per cluster for charting
     * @param workspaceResourceId Workspace Azure resource id
     * @param timeInterval Time interval
     * @param cluster cluster information
     * @param nodeName Optional node name
     * @param requestId optional request id
     * @param sessionId optional session id
     * @param nodePool optional node pool
     * @returns {Promise<any>} handle (promise) to operation completion
     */
    public getClusterPerformanceChartData(
        workspaceResourceId: string,
        timeInterval: ITimeInterval,
        cluster: IKubernetesCluster,
        nodeName?: string,
        requestId?: string,
        sessionId?: string,
        nodePool?: string,
        controllerName?: string,
        controllerKind?: string
    ): Promise<any> {
        let queryTemplate = ChartQueryTemplate.ClusterCpuAndMemory;

        const query = ChartQueryTemplate.replaceQueryParamPlaceholders(
            queryTemplate,
            timeInterval,
            cluster,
            nodeName,
            undefined,
            undefined,
            nodePool,
            controllerName,
            controllerKind
        );

        const queryOptions =
            this.getQueryOptions(timeInterval, 'cpu-and-memory', requestId, sessionId);

        return this.kustoDataProvider.executeQuery(workspaceResourceId, query,
            Constants.ChartDraftRequestTimeoutMs, queryOptions);
    }

    /**
     * Returns node count per cluster for charting
     * @param workspaceResourceId Workspace Azure resource id
     * @param timeInterval Time interval
     * @param cluster cluster information
     * @param nodeName Optional node name
     * @param requestId optional request id
     * @param sessionId optional session id
     * @param nodePool optional node pool 
     * @returns {Promise<any>} handle (promise) to operation completion
     */
    public getClusterNodeCountChartData(
        workspaceResourceId: string,
        timeInterval: ITimeInterval,
        cluster: IKubernetesCluster,
        nodeName?: string,
        requestId?: string,
        sessionId?: string,
        nodePool?: string
    ): Promise<any> {
        let queryTemplate = ChartQueryTemplate.ClusterNodeCount;

        const query = ChartQueryTemplate.replaceQueryParamPlaceholders(
            queryTemplate,
            timeInterval,
            cluster,
            nodeName,
            undefined,
            undefined,
            nodePool
        );

        const queryOptions =
            this.getQueryOptions(timeInterval, 'node-count', requestId, sessionId);

        return this.kustoDataProvider.executeQuery(workspaceResourceId, query, Constants.ChartDraftRequestTimeoutMs, queryOptions);
    }

    /**
     * Returns pod count for the cluster for charting
     * @param workspaceResourceId Workspace Azure resource id
     * @param queryTemplate query template
     * @param timeInterval query time interval 
     * @param cluster cluster information
     * @param nodeName node name
     * @param namespaceName namespace name
     * @param serviceName serivce name
     * @param requestId optional request id
     * @param sessionId optional session id
     * @param nodePool optional node pool 
     * @returns {Promise<any>} handle (promise) to operation completion
     */
    public getClusterPodCountChartData(
        workspaceResourceId: string,
        timeInterval: ITimeInterval,
        cluster: IKubernetesCluster,
        nodeName?: string,
        namespaceName?: string,
        serviceName?: string,
        requestId?: string,
        sessionId?: string,
        nodePool?: string
    ): Promise<any> {
        let queryTemplate = ChartQueryTemplate.ClusterPodCount;

        const query = ChartQueryTemplate.replaceQueryParamPlaceholders(
            queryTemplate,
            timeInterval,
            cluster,
            nodeName,
            namespaceName,
            serviceName,
            nodePool
        );

        const queryOptions =
            this.getQueryOptions(timeInterval, 'pod-count', requestId, sessionId);

        return this.kustoDataProvider.executeQuery(workspaceResourceId, query, Constants.ChartDraftRequestTimeoutMs, queryOptions);
    }

    /**
     * Constructs Kusto query options set
     * @param timeInterval time interval of the query
     * @param tabName ux tab name
     * @param queryName query name
     * @param queryAvenue whether to query over Arm or Draft direct
     * @param requestId request id
     * @param sessionId session id
     * @returns {IKustoQueryOptions} query options for Kusto query
     */
    private getQueryOptions(
        timeInterval: ITimeInterval,
        queryName?: string,
        requestId?: string,
        sessionId?: string
    ): IKustoQueryOptions {
        let queryOptions: IKustoQueryOptions = {
            timeInterval: timeInterval
        };

        let initialLoad: string = 'false';
        if (!BladeLoadManager.Instance().fetchIsInitialLoadComplete()) {
            initialLoad = 'true';
        }

        queryOptions.requestInfo = 'exp=containerinsights,blade=singlecontainer,tabName=charts,initial=' + initialLoad;

        if (queryName) {
            queryOptions.requestInfo += ',query=' + queryName;
        }

        if (requestId) { queryOptions.requestId = requestId; }
        if (sessionId) { queryOptions.sessionId = sessionId; }

        queryOptions.preferences = [Prefer.ExcludeFunctions, Prefer.ExcludeCustomFields, Prefer.ExcludeCustomLogs].join(',');

        return queryOptions;
    }
}
