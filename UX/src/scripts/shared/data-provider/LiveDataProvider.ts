/**
 * Block
 */
// import { Promise } from 'es6-promise';

/**
 * Local
 */
import { TimeFrameSelector } from './IKubernetesDataProvider';
import { ILogItem } from '../Utilities/LogBufferManager';
import { IEventItem, IDeploymentItem, ILiveDataPoint, IInterprettedDeployments } from './KubernetesResponseInterpreter';
import { KubernetesProxyDataProviderFactory } from './KubernetesProxyDataProviderFactory';

/**
 * Data provider for live data for the live console.
 */
export class LiveDataProvider {
    //data provider to get information from kube API server
    private kubernetesDataProviderFactory: KubernetesProxyDataProviderFactory;

    constructor() {
        this.kubernetesDataProviderFactory = KubernetesProxyDataProviderFactory.Instance();
    }

    /**
     * TODO: hackfix clear the limits and request cache
     */
    public async hackClearCacheLimitsAndReqeuestInPod(): Promise<void> {
        const provider = await this.kubernetesDataProviderFactory.getKubernetesProxyDataProvider();
        provider.hackClearCacheForLimitsAndRequest();
        return;
    }

    /**
     * Clears the cache of the kube config
     */
    public clearCache() {
        this.kubernetesDataProviderFactory.clearCache();
    }

    public forceLogoutAd(): void {
        this.kubernetesDataProviderFactory.forceLogoutAAD();
    }

    /**
     * Returns log items of the container instance defined by the inputted information
     * @param namespace namespace of the container
     * @param podName name of the pod that the container resides in
     * @param containerInstance name of the container
     * @param resourceGroup user's resource group
     * @param subscriptionId user's subscription id
     * @param clusterName name of the cluster that the container resides in
     * @param timeFrame an RFC3339 timestamp, or a string representation of a number (depending on the timeframe selector).
     * @param timeFrameSelector an RFC3339 timestamp, or a string representation of a number (depending on the timeframe selector).
     */
    public async getLiveLogs(namespace: string, podName: string, containerInstance: string,
        timeFrame: string, timeFrameSelector: TimeFrameSelector): Promise<ILogItem[]> {

        const provider = await this.kubernetesDataProviderFactory.getKubernetesProxyDataProvider();
        return provider.getLogs(namespace, podName, containerInstance, timeFrame, timeFrameSelector);
    }

    /**
     * utilize the proxy to invoke the events EP
     * @param namespace optional namespace for this object
     * @param fieldSelectors field selectors to narrow down the scope of the request
     * @param encodedContinueToken optionally a continue token
     */
    public async getLiveEvents(namespace: string, fieldSelectors: string, encodedContinueToken?: string): Promise<IEventItem> {
        const provider = await this.kubernetesDataProviderFactory.getKubernetesProxyDataProvider();
        return provider.getEvents(namespace, fieldSelectors, encodedContinueToken);
    }


    /**
     * retrieve a list of all deployments from a given cluster
     * kubectl get deployments --all-namespaces
     * @param subscriptionId subscription that contains cluster we are interested in
     * @param resourceGroup resource group the cluster is in
     * @param clusterName name of the cluster we are interested in
     */
    public async getDeployments(): Promise<IInterprettedDeployments> {
        const provider = await this.kubernetesDataProviderFactory.getKubernetesProxyDataProvider();
        return provider.getDeployments();
    }

    /**
     * get the details for a specific deployment in a cluster, one half of the calls kubectl makes
     * kubectl describe deployment {deploymentName} -n {nameSpace}
     * pairs to getDeploymentApp
     * @param subscriptionId subscription of the cluster
     * @param resourceGroup resource group the cluster is in
     * @param clusterName name of the cluster
     * @param nameSpace namespace the deployment is in
     * @param deploymentName name of the deployment
     */
    public async getDeployment(nameSpace, deploymentName): Promise<IDeploymentItem[]> {
        const provider = await this.kubernetesDataProviderFactory.getKubernetesProxyDataProvider();
        return provider.getDeployment(nameSpace, deploymentName);
    }

    /**
     * utilize the proxy to invoke the metrics EP
     * @param subscriptionId subscription of the cluster
     * @param resourceGroup rg of the cluster
     * @param clusterName cluster name
     * @param nameSpace namne space
     * @param podName pod name
     */
    public async getLiveMetrics(nameSpace, podName): Promise<ILiveDataPoint> {
        const provider = await this.kubernetesDataProviderFactory.getKubernetesProxyDataProvider();
        return provider.getMetrics(nameSpace, podName);
    }
}
