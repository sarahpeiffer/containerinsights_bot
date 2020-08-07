/**
 * block
 */
import * as $ from 'jquery';
import { Promise } from 'es6-promise';

/**
 * Local
 */
import { IKubernetesDataProvider, TimeFrameSelector } from './IKubernetesDataProvider';
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
import { EnvironmentConfig } from '../EnvironmentConfig';
import { BaseBuilder } from '../BaseBuilder';

/**
 * Constants
 */
const queryTimeoutMs: number = 10000;
const supportedKubeProxyRegions = ['cca', 'cid', 'jpe', 'eau', 'sea', 'eus', 'weu'];

enum RequiredParameters {
    Certificate = 'Certificate',
    ApiAddress = 'ApiAddress',
    Bearer = 'Bearer'
}

/**
 * Implementation of IKubernetesDataProvider that hits the Proxy Service as opposed to the actual Kubernetes API server endpoint.
 * Passes the actual Kubernetes API endpoint via a query parameter to the proxy.
 */
export class CIKubernetesProxyDataProvider extends BaseBuilder implements IKubernetesDataProvider {
    private _responseInterpreter: KubernetesResponseInterpreter;

    private _authToken: string;
    private _apiServer: string;
    private _regionCode: string;
    private _certificate: string;

    constructor(regionCode?: string) {
        super([RequiredParameters.ApiAddress, RequiredParameters.Bearer, RequiredParameters.Certificate],
            'CIKubernetesProxyDataProvider');

        this._responseInterpreter = new KubernetesResponseInterpreter(TelemetryMainArea.Containers);
        this._regionCode = regionCode ? regionCode.toLowerCase() : undefined;
    }

    public withCertificate(certificate: string): IKubernetesDataProvider {
        this.resolveParameter(RequiredParameters.Certificate);
        this._certificate = certificate;
        return this;
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
            this.execute(this._apiServer, namespace, podName, containerName, timeFrame,
                timeFrameSelector, this._authToken, this._certificate)
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
     * @param apiServerAddress kubeapi to access
     * @param namespace optionally namespace the object is in
     * @param apiServerToken auth token for the server
     * @param fieldSelectors field selectors to narrow down the scope of the request
     * @param encodedContinueToken optionally the continue token
     */
    public getEvents(namespace: string, fieldSelectors: string,
        encodedContinueToken: string): Promise<IEventItem> {

        this.throwObjectValid();

        return new Promise<any>((resolve, reject) => {
            return this.executeEvents(this._apiServer, namespace, this._authToken, fieldSelectors,
                this._certificate, encodedContinueToken)
                .then((value: any) => {
                    let interprettedResponse = this._responseInterpreter.interpretEvents(value);
                    resolve(interprettedResponse);
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
            return this.executeDeployment(this._apiServer, this._authToken, nameSpace,
                deploymentName, this._certificate)
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
     * @param apiServerAddress location of the kube api
     * @param apiServerToken bearer token to use for the kube api
     */
    public getDeployments()
        : Promise<IInterprettedDeployments> {

        this.throwObjectValid();

        return new Promise<any>((resolve, reject) => {
            return this.executeDeployments(this._apiServer, this._authToken, this._certificate)
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
            Promise.all(this.executeMetrics(this._apiServer, this._authToken,
                this._certificate, nameSpace, podName))
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
     * Returns the address of the proxy server depending on the current environment (prod, mpac, or localhost).
     * Returns null if the environment config is none of the three.
     * generateFQDN returns the appropriate portal FQDN given a control plane's apiserver FQDN.
     * Portal FQDNs follow the pattern "{apiserver hostname}.portal.{apiserver domain}".
     */
    private getProxyServerAddress(): string {
        if (EnvironmentConfig.Instance().isMooncake()) {
            return 'https://kubeapi-proxy-mooncake.trafficmanager.cn/api';
        } else if (EnvironmentConfig.Instance().isFairfax()) {
            return 'https://kubeapitrafficmanagerfairfax.usgovtrafficmanager.net/api';
        } else if (EnvironmentConfig.Instance().isMPAC()) {
            return 'https://aks-kubeapi-proxy-dogfood-deploy-funcs-v1.azurewebsites.net/api';
        } else if (EnvironmentConfig.Instance().isLocalhost()) {
            return 'https://aks-kubeapi-proxy-dogfood-deploy-funcs-v1.azurewebsites.net/api';
            // return 'http://localhost:7071/api'; // If running Azure Fn locally
        } else if (EnvironmentConfig.Instance().isPublic()) {
            let address: string = 'https://aks-kubeapi-proxy-prod.trafficmanager.net/api';
            if (this._regionCode && supportedKubeProxyRegions.indexOf(this._regionCode) !== -1) {
                address = `https://aks-kubeapi-proxy-prod-${this._regionCode}m-funcs.azurewebsites.net/api`;
            }
            return address;
        } else {
            console.error('Unable to find a valid proxy server address');
            return null;
        }
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
        apiServerAddress: string,
        namespace: string,
        podName: string,
        containerInstance: string,
        timeFrame: string,
        timeFrameSelector: TimeFrameSelector,
        apiServerToken: string,
        encodedCertificate: string
    ): any {
        const proxyServerAddress = this.getProxyServerAddress();
        const uri = proxyServerAddress
            + '/nameSpace/' + namespace
            + '/pod/' + podName
            + '?containerInstanceName=' + containerInstance
            + '&' + timeFrameSelector + '=' + timeFrame
            + '&apiServerAddress=' + encodeURI(apiServerAddress);
        return {
            contentType: 'application/json',
            headers: {
                Authorization: 'Bearer ' + apiServerToken,
            },
            data: JSON.stringify({ kubeCertificateEncoded: encodedCertificate }),
            timeout: queryTimeoutMs,
            type: RestVerb.Post,
            url: uri,
        };
    }

    private getEventsRequestDescriptor(
        apiServerAddress: string,
        namespace: string,
        apiServerToken: string,
        fieldSelectors: string,
        encodedCertificate: string,
        encodedContinueToken?: string
    ): any {
        const proxyServerAddress = this.getProxyServerAddress() + '/clusterApiProxy';
        // query example:
        // https://kaveeshzorokubernetes-dns-9ed55331.hcp.eastus.azmk8s.io:443/api/v1/namespaces/kube-system/events
        let uri = '';

        let namespaceURIPart: string = '';
        let fieldSelectorURIPart: string = '?';
        if (!StringHelpers.isNullOrEmpty(namespace)) {
            namespaceURIPart = '/namespaces/' + namespace;
        }

        if (!StringHelpers.isNullOrEmpty(fieldSelectors)) {
            fieldSelectorURIPart = fieldSelectorURIPart + 'fieldSelector=' + fieldSelectors;
        }

        if (!StringHelpers.isNullOrEmpty(encodedContinueToken)) {

            let ampersand: string = '';
            if (!StringHelpers.isNullOrEmpty(fieldSelectors)) {
                ampersand = '&';
            }

            uri = proxyServerAddress
                + '?query=' + encodeURIComponent(apiServerAddress + '/api/v1' + namespaceURIPart + '/events'
                    + fieldSelectorURIPart
                    + ampersand
                    + 'continue=' + encodedContinueToken);
        } else {
            uri = proxyServerAddress
                + '?query=' + encodeURIComponent(apiServerAddress + '/api/v1' + namespaceURIPart + '/events'
                    + fieldSelectorURIPart);
        }
        return {
            contentType: 'application/json',
            headers: {
                Authorization: 'Bearer ' + apiServerToken,
            },
            data: JSON.stringify({ kubeCertificateEncoded: encodedCertificate }),
            timeout: queryTimeoutMs,
            type: RestVerb.Post,
            url: uri,
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
        apiServerAddress: string,
        apiServerToken: string,
        nameSpace: string,
        deploymentName: string,
        encodedCertificate: string
    ): any {
        const proxyServerAddress = this.getProxyServerAddress() + '/clusterApiProxy';

        let uri = proxyServerAddress + '?query=' + encodeURIComponent(apiServerAddress + `/apis/apps/v1/namespaces/${nameSpace}/deployments/${deploymentName}`);

        return {
            contentType: 'application/json',
            headers: {
                Authorization: 'Bearer ' + apiServerToken,
            },
            data: JSON.stringify({ kubeCertificateEncoded: encodedCertificate }),
            timeout: queryTimeoutMs,
            type: RestVerb.Post,
            url: uri,
        };
    }

    /**
     * 
     * @param apiServerAddress location of kubeapi proxy
     * @param apiServerToken token to access kubeapi with
     */
    private getDeploymentsRequestDescriptor(
        apiServerAddress: string,
        apiServerToken: string,
        encodedCertificate: string
    ): any {
        const proxyServerAddress = this.getProxyServerAddress() + '/clusterApiProxy';

        let uri = proxyServerAddress
            + '?query=' + encodeURIComponent(apiServerAddress + '/apis/apps/v1/deployments?limit=500');

        return {
            contentType: 'application/json',
            headers: {
                Authorization: 'Bearer ' + apiServerToken,
            },
            data: JSON.stringify({ kubeCertificateEncoded: encodedCertificate }),
            timeout: queryTimeoutMs,
            type: RestVerb.Post,
            url: uri,
        };
    }

    /**
     * Creates an AJAX descriptor for live metrics
     * @param apiServerAddress The kubeAPI address to hit
     * @param apiServerToken The auth token for the api server.
     * @param nameSpace name space
     * @param podName pod's name
     */
    private getMetricsRequestDescriptors(
        apiServerAddress: string,
        apiServerToken: string,
        encodedCertificate: string,
        nameSpace?: string,
        podName?: string
    ): any {
        const proxyServerAddress = this.getProxyServerAddress() + '/clusterApiProxy';
        const isCached: boolean = this._responseInterpreter.isLimitAndRequestCached();
        let endpoints = [];
        if (nameSpace !== undefined && podName !== undefined) {
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
                headers: {
                    Authorization: 'Bearer ' + apiServerToken,
                },
                timeout: queryTimeoutMs,
                type: RestVerb.Post,
                data: JSON.stringify({ kubeCertificateEncoded: encodedCertificate }),
                url: proxyServerAddress + '?query=' + encodeURIComponent(apiServerAddress + endpoint),
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
        apiServerAddress: string,
        namespace: string,
        podName: string,
        containerInstance: string,
        timeFrame: string,
        timeFrameSelector: TimeFrameSelector,
        apiServerToken: string,
        encodedCertificate: string
    ): Promise<any> {
        const ajaxRequestDescriptor = this.getLogsRequestDescriptor(
            apiServerAddress,
            namespace,
            podName,
            containerInstance,
            timeFrame,
            timeFrameSelector,
            apiServerToken,
            encodedCertificate
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
        apiServerAddress: string,
        namespace: string,
        apiServerToken: string,
        fieldSelectors: string,
        encodedCertificate: string,
        encodedContinueToken?: string
    ): Promise<any> {
        const ajaxRequestDescriptor =
            this.getEventsRequestDescriptor(
                apiServerAddress,
                namespace,
                apiServerToken,
                fieldSelectors,
                encodedCertificate,
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
        apiServerAddress: string,
        apiServerToken: string,
        nameSpace: string,
        deploymentName: string,
        encodedCertificate: string
    ): Promise<any> {
        const ajaxRequestDescriptor =
            this.getDeploymentRequestDescriptor(
                apiServerAddress,
                apiServerToken,
                nameSpace,
                deploymentName,
                encodedCertificate
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
     * equivilant of kubectl get deployments --all-namespaces
     * @param apiServerAddress kubeapi location
     * @param apiServerToken bearer token to use on kubeapi
     */
    private executeDeployments(
        apiServerAddress: string,
        apiServerToken: string,
        encodedCertificate: string
    ): Promise<any> {
        const ajaxRequestDescriptor = this.getDeploymentsRequestDescriptor(
            apiServerAddress,
            apiServerToken,
            encodedCertificate
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
     * Executes a GET request to the proxy request to get the live logs of the customer.
     * @param apiServerAddress The kubeAPI address to hit.
     * @param apiServerToken The auth token for the api server.
     * @param nameSpace name space
     * @param podName pod's name
     */
    private executeMetrics(
        apiServerAddress: string,
        apiServerToken: string,
        encodedCertificate: string,
        nameSpace?: string,
        podName?: string
    ): Promise<any>[] {
        const ajaxRequestDescriptors = this.getMetricsRequestDescriptors(
            apiServerAddress,
            apiServerToken,
            encodedCertificate,
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
