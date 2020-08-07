/**
 * block
 */
import * as $ from 'jquery';
import { Promise } from 'es6-promise';

/**
 * Local
 */
import { TimeFrameSelector, IKubernetesDataProvider } from './IKubernetesDataProvider';
import {
    KubernetesResponseInterpreter,
    IEventItem,
    IDeploymentItem,
    ILiveDataPoint,
    IInterprettedDeployments
} from './KubernetesResponseInterpreter';
import { ILogItem } from '../Utilities/LogBufferManager';
import { RestVerb } from './RestVerb';
import { TelemetryMainArea } from '../Telemetry';
import { StringHelpers } from '../Utilities/StringHelpers';

/**
 * Shared
 */
import { TelemetryFactory } from '../TelemetryFactory';
import { BaseBuilder } from '../BaseBuilder';

/**
 * Constants
 */
const queryTimeoutMs: number = 10000;

enum RequiredParameters {
    ApiAddress = 'ApiServer',
    Bearer = 'Bearer'
}

/**
 * Implementation of IKubernetesDataProvider that hits the Proxy Service as opposed to the actual Kubernetes API server endpoint.
 * Passes the actual Kubernetes API endpoint via a query parameter to the proxy.
 */
export class AKSKubernetesProxyDataProvider extends BaseBuilder implements IKubernetesDataProvider {
    private _responseInterpreter: KubernetesResponseInterpreter;
    private _authToken: string;
    private _apiServer: string;

    constructor() {
        super([RequiredParameters.ApiAddress, RequiredParameters.Bearer], 'AKSKubernetesProxyDataProvider');

        this._responseInterpreter = new KubernetesResponseInterpreter(TelemetryMainArea.Containers);
    }

    public withCertificate(certificate: string): IKubernetesDataProvider {
        throw new Error('Method not implemented.');
    }

    public withApiAddress(apiServerAddress: string): IKubernetesDataProvider {
        this.resolveParameter(RequiredParameters.ApiAddress);

        this._apiServer = apiServerAddress;
        return this;
    }

    public withBearer(token: string): IKubernetesDataProvider {
        this.resolveParameter(RequiredParameters.Bearer);

        this._authToken = token;
        return this;
    }

    /**
     * TODO: hackfix clear the limits and request cache
     */
    public hackClearCacheForLimitsAndRequest(): void {
        this.throwObjectValid();

        if (this._responseInterpreter) {
            this._responseInterpreter.clearCache();
        }
    }

    /**
     * Fetches the live logs for a given container instance, via a proxy. Returns a promise which will resolve to an array of log items.
     * @param apiServerAddress The kubeAPI address to hit.
     * @param namespace The namespace that the container is in
     * @param podName The name of the pod that the container is in
     * @param containerName The name of the container (not the containerID)
     * @param timeFrame an RFC3339 timestamp, or a string representation of a number (depending on the timeframe selector).
     * @param timeFrameSelector If using a timestamp, make this 'sinceTime'. If a string rep. of a number, make this 'sinceSeconds'.
     * @param apiServerToken The auth token for the api server.
     */
    public getLogs(namespace: string, podName: string, containerName: string, timeFrame: string,
        timeFrameSelector: TimeFrameSelector): Promise<ILogItem[]> {

        this.throwObjectValid();

        return new Promise<ILogItem[]>((resolve, reject) => {
            this.execute(namespace, podName, containerName,
                timeFrame, timeFrameSelector, this._authToken)
                .then((value: any) => {
                    const logItems = this._responseInterpreter.interpretLogs(value);
                    resolve(logItems);
                })
                .catch((reason) => {
                    reject(reason);
                });
        });

    }

    /**
     * Get the live events for a given container,pod,controller,node...
     * @param namespace optionally namespace the object is in
     * @param fieldSelectors field selectors to narrow down the scope of the request
     * @param encodedContinueToken optionally the continue token
     */
    public getEvents(namespace: string, fieldSelectors: string, encodedContinueToken: string): Promise<IEventItem> {

        this.throwObjectValid();

        return new Promise<any>((resolve, reject) => {
            return this.executeEvents(namespace, fieldSelectors, encodedContinueToken)
                .then((value: any) => {
                    let interpretedResponse = this._responseInterpreter.interpretEvents(value);
                    resolve(interpretedResponse);
                })
                .catch((reason) => {
                    return reject(reason);
                })
        });

    }

    /**
     * one of two calls used by kubectl describe deployment {deploymentName} -n {nameSpace}
     * Pairs with getDeploymentApp
     * @param apiServerAddress 
     * @param apiServerToken 
     * @param nameSpace 
     * @param deploymentName 
     */
    public getDeployment(nameSpace: string, deploymentName: string): Promise<IDeploymentItem[]> {

        this.throwObjectValid();

        return new Promise<any>((resolve, reject) => {
            return this.executeDeployment(nameSpace, deploymentName)
                .then((value: any) => {
                    resolve(value);
                })
                .catch((reason) => {
                    return reject(reason);
                })
        });

    }

    /**
     * equivilant roughly of kubectl get deployments --all-namespaces
     */
    public getDeployments(): Promise<IInterprettedDeployments> {
        this.throwObjectValid();

        return new Promise<any>((resolve, reject) => {
            return this.executeDeployments()
                .then((value: any) => {
                    // continue token check here.
                    let interprettedResponse = this._responseInterpreter.interpretDeployments(value);

                    if (!StringHelpers.isNullOrEmpty(interprettedResponse.metadata.continue)) {
                        let telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
                        telemetry.logEvent('ContinueToken', { location: 'KubernetesProxyDataProvider.getDeployments' }, null);
                    }
                    resolve(interprettedResponse);
                })
                .catch((reason) => {
                    reject(reason);
                });
        });
    }

    /**
      * Get the live metrics for the current cluster.
      * @param apiServerAddress kubeapi to access
      * @param apiServerToken auth token for the server
      */
    public getMetrics(nameSpace: string, podName: string): Promise<ILiveDataPoint> {
        this.throwObjectValid();
        
        const timestamp = new Date();
        return new Promise<ILiveDataPoint>((resolve, reject) => {
            Promise.all(this.executeMetrics(nameSpace, podName))
                .then((value: any[]) => {
                    try {
                        const dataPoint = this._responseInterpreter.interpretLiveMetrics(value,
                            timestamp,
                            nameSpace,
                            podName);
                        resolve(dataPoint);
                    } catch (e) {
                        reject(e);
                    }
                })
                .catch((reason) => {
                    console.log('rejection on getMetrics', reason);
                    reject(reason);
                });
        });

    }

    /**
     * Creates the ajax descriptor for live logs.
     * @param apiServerAddress The kubeAPI address to hit.
     * @param namespace The namespace that the container is in
     * @param podName The name of the pod that the container is in
     * @param containerName The name of the container (not the containerID)
     * @param timeFrame an RFC3339 timestamp, or a string representation of a number (depending on the timeframe selector).
     * @param timeFrameSelector If using a timestamp, make this 'sinceTime'. If a string rep. of a number, make this 'sinceSeconds'.
     * @param apiServerToken The auth token for the api server.
     */
    private getLogsRequestDescriptor(
        namespace: string,
        podName: string,
        containerInstance: string,
        timeFrame: string,
        timeFrameSelector: TimeFrameSelector
    ): any {
        const uri = this._apiServer
            + '/api/v1'
            + '/namespaces/' + namespace
            + '/pods/' + podName
            + '/log'
            + '?container=' + containerInstance
            + '&' + timeFrameSelector + '=' + timeFrame
            + '&timestamps=true';

        return {
            contentType: 'application/json',
            headers: { Authorization: 'Bearer ' + this._authToken },
            timeout: queryTimeoutMs,
            type: RestVerb.Get,
            url: uri,
        };
    }

    private getEventsRequestDescriptor(
        namespace: string,
        fieldSelectors: string,
        encodedContinueToken?: string
    ): any {
        const proxyServerAddress = `${this._apiServer}/api/v1`;

        let namespaceURIPart: string = '';
        if (!StringHelpers.isNullOrEmpty(namespace)) {
            namespaceURIPart = '/namespaces/' + namespace;
        }

        let queryParams = [];

        if (!StringHelpers.isNullOrEmpty(fieldSelectors)) {
            let fieldSelectorURIPart: string = 'fieldSelector=' + fieldSelectors;
            queryParams.push(fieldSelectorURIPart);
        }

        if (!StringHelpers.isNullOrEmpty(encodedContinueToken)) {
            let continueURIPart: string = 'continue=' + encodedContinueToken;
            queryParams.push(continueURIPart);
        }

        let uri: string = proxyServerAddress + namespaceURIPart + '/events';

        if (queryParams.length > 0) {
            let queryParamURIPart = queryParams.join('&');
            uri += `?${queryParamURIPart}`;
        }

        return {
            contentType: 'application/json',
            headers: { Authorization: 'Bearer ' + this._authToken },
            timeout: queryTimeoutMs,
            type: RestVerb.Get,
            url: uri
        };
    }

    /**
     * 
     * @param apiServerAddress location of kubeapi proxy
     * @param apiServerToken token to access kubeapi with
     * @param nameSpace kube namespace the deployment is in
     * @param deploymentName name of deployment to get details for
     */
    private getDeploymentRequestDescriptor(
        nameSpace: string,
        deploymentName: string
    ): any {
        let uri = this._apiServer + `/apis/apps/v1/namespaces/${nameSpace}/deployments/${deploymentName}`;

        return {
            contentType: 'application/json',
            headers: { Authorization: 'Bearer ' + this._authToken },
            timeout: queryTimeoutMs,
            type: RestVerb.Get,
            url: uri
        };
    }

    /**
     * 
     * @param apiServerAddress location of kubeapi proxy
     * @param apiServerToken token to access kubeapi with
     */
    private getDeploymentsRequestDescriptor(): any {
        let uri = this._apiServer + '/apis/apps/v1/deployments?limit=500';

        return {
            contentType: 'application/json',
            headers: { Authorization: 'Bearer ' + this._authToken },
            timeout: queryTimeoutMs,
            type: RestVerb.Get,
            url: uri
        };
    }

    /**
     * Creates an AJAX descriptor for live metrics
     * @param apiServerAddress The kubeAPI address to hit
     * @param nameSpace name space
     * @param podName pod's name
     */
    private getMetricsRequestDescriptors(nameSpace?: string,
        podName?: string): any {
        const isCached: boolean = this._responseInterpreter.isLimitAndRequestCached();
        let endpoints = [];
        if (nameSpace != null && podName != null) {
            endpoints.push('/apis/metrics.k8s.io/v1beta1/namespaces/' + nameSpace + '/pods/' + podName);
            if (!isCached) {
                endpoints.push('/api/v1/namespaces/' + nameSpace + '/pods/' + podName);
            }
        } else {
            endpoints.push('/api/v1/nodes');
            endpoints.push('/apis/metrics.k8s.io/v1beta1/nodes');
            endpoints.push('/api/v1/pods');
        }
        const requestDescriptors = endpoints.map(endpoint => {
            return {
                contentType: 'application/json',
                headers: { Authorization: 'Bearer ' + this._authToken },
                timeout: queryTimeoutMs,
                type: RestVerb.Get,
                url: this._apiServer + endpoint,
            };
        });

        return requestDescriptors;
    }

    /**
     * Executes a GET request to the proxy request to get the live logs of the containers. 
     * @param apiServerAddress The kubeAPI address to hit.
     * @param namespace The namespace that the container is in
     * @param podName The name of the pod that the container is in
     * @param containerName The name of the container (not the containerID)
     * @param timeFrame an RFC3339 timestamp, or a string representation of a number (depending on the timeframe selector).
     * @param timeFrameSelector If using a timestamp, make this 'sinceTime'. If a string rep. of a number, make this 'sinceSeconds'.
     * @param apiServerToken The auth token for the api server.
     */
    private execute(
        namespace: string,
        podName: string,
        containerInstance: string,
        timeFrame: string,
        timeFrameSelector: TimeFrameSelector,
        apiServerToken: string
    ): Promise<any> {
        const ajaxRequestDescriptor = this.getLogsRequestDescriptor(
            namespace,
            podName,
            containerInstance,
            timeFrame,
            timeFrameSelector
        );

        return new Promise((resolve, reject) => {
            $.ajax(ajaxRequestDescriptor)
                .then((result: any) => {
                    resolve(result);
                })
                .catch((error: any) => {
                    reject(error);
                });
        });
    }

    // Make execute a generic function where you pass in the request descirptor? or decide based on some value?
    private executeEvents(
        namespace: string,
        fieldSelectors: string,
        encodedContinueToken?: string
    ): Promise<any> {
        const ajaxRequestDescriptor = this.getEventsRequestDescriptor(
            namespace,
            fieldSelectors,
            encodedContinueToken
        );

        return new Promise((resolve, reject) => {
            $.ajax(ajaxRequestDescriptor)
                .then((result: any) => {
                    resolve(result);
                })
                .catch((error: any) => {
                    reject(error);
                })
        });
    }

    /**
     * one half of kubectl describe deployment {deploymentName} -n {nameSpace}
     * pairs with executeDeploymentApp
     * @param apiServerAddress location of kube api
     * @param apiServerToken bearer token to use on kubeapi
     * @param nameSpace namesapce of the deployment
     * @param deploymentName deployment we are looking for details on
     */
    private executeDeployment(
        nameSpace: string,
        deploymentName: string,
    ): Promise<any> {
        const ajaxRequestDescriptor = this.getDeploymentRequestDescriptor(nameSpace, deploymentName);

        return new Promise((resolve, reject) => {
            $.ajax(ajaxRequestDescriptor)
                .then((result: any) => {
                    resolve(result);
                })
                .catch((error: any) => {
                    reject(error);
                })
        });
    }

    /**
     * equivilant of kubectl get deployments --all-namespaces
     * @param apiServerAddress kubeapi location
     * @param apiServerToken bearer token to use on kubeapi
     */
    private executeDeployments(): Promise<any> {
        const ajaxRequestDescriptor =
            this.getDeploymentsRequestDescriptor();

        return new Promise((resolve, reject) => {
            $.ajax(ajaxRequestDescriptor)
                .then((result: any) => {
                    resolve(result);
                })
                .catch((error: any) => {
                    reject(error);
                })
        });
    }

    /**
     * Executes a GET request to the proxy request to get the live logs of the customer.
     * @param apiServerAddress The kubeAPI address to hit.
     * @param apiServerToken The auth token for the api server.
     * @param nameSpace name space
     * @param podName pod's name
     */
    private executeMetrics(
        nameSpace?: string,
        podName?: string
    ): Promise<any>[] {
        const ajaxRequestDescriptors = this.getMetricsRequestDescriptors(
            nameSpace,
            podName
        );

        return ajaxRequestDescriptors.map(ajaxRequestDescriptor => {
            return new Promise((resolve, reject) => {
                $.ajax(ajaxRequestDescriptor)
                    .then((result: any) => {
                        resolve(result);
                    })
                    .catch((error: any) => {
                        reject(error);
                    });
            });
        });
    }

}
