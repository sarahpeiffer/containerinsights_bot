/**
 * Block
 */
import { Promise } from 'es6-promise'
/**
 * Local
 */
import { ILogItem } from '../Utilities/LogBufferManager';
import { IEventItem, ILiveDataPoint, IDeploymentItem, IInterprettedDeployments } from './KubernetesResponseInterpreter';

export enum TimeFrameSelector {
    sinceSeconds = 'sinceSeconds',
    sinceTime = 'sinceTime'
}

/**
 * Export interface to speak to kubernetes API server 
 */
export interface IKubernetesDataProvider {
    /**
     * TODO: hackfix  Clear limits and request cache
     */ 
    hackClearCacheForLimitsAndRequest(): void;

    withBearer(token: string): IKubernetesDataProvider;
    withApiAddress(apiServerAddress: string): IKubernetesDataProvider;
    withCertificate(certificate: string): IKubernetesDataProvider;

    getLogs(namespace: string, podName: string, containerName: string, timeFrame: string, 
        timeFrameSelector: TimeFrameSelector): Promise<ILogItem[]>;

    getEvents(namespace: string, fieldSelectors: string, encodedContinueToken: string): Promise<IEventItem>;
    getDeployments(): Promise<IInterprettedDeployments>;
    getDeployment(nameSpace: string, deploymentName: string): Promise<IDeploymentItem[]>;
    getMetrics(nameSpace: string, podName: string): Promise<ILiveDataPoint>;
}
