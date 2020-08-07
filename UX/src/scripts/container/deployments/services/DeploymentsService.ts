import { Promise } from 'es6-promise';

import { DeploymentsItemModel } from '../models/DeploymentsItemModel';
import { LiveDataProvider } from '../../../shared/data-provider/LiveDataProvider';
// import { BladeContext } from '../../BladeContext';
import { EventsDataProvider } from '../../../shared/data-provider/EventsDataProvider';
import { ILogItem } from '../../../shared/Utilities/LogBufferManager';
import { DeferredPromise } from '../../../shared/DeferredPromise';
import { ILiveDataService, ILiveMetaData } from '../../../shared/live-console-v2/viewmodels/LiveConsoleViewModel';
import { StringMap } from '../../../shared/StringMap';

export enum LiveConsoleQueryMode {
    Cluster = 'Cluster',
    Namespace = 'Namespace',
    Deployment = 'Deployment'
}

/**
 * deployment service interface
 */
export interface IDeploymentsService extends ILiveDataService {
    getDeployments(): string[];
    getDeploymentDetails(id: string): DeploymentsItemModel;
    loadDeploymentsList(): Promise<number>;
    loadDescribe(deploymentId: string): Promise<void>;

    forceLogoutAd(): void;
}

/**
 * networking wrapper to retrieve deployments, describe deployments, cache
 * deployment responses and parse all of the above
 */
export class DeploymentsService implements IDeploymentsService {

    private developmentCache: StringMap<any> = {};
    private eventsDataProvider: EventsDataProvider;

    private describeRequestQueue: StringMap<DeferredPromise<any>[]> = {};

    /**
     * .ctor()
     * @param kubeApiProxyService data provider to utilize for network requests
     */
    constructor(private kubeApiProxyService: LiveDataProvider) {
        this.eventsDataProvider = new EventsDataProvider(kubeApiProxyService);
    }

    public queryData(data?: any): Promise<ILogItem[]> {
        return this.loadDeploymentEvents(data.deploymentId, data.queryModel);

    }

    /**
     * get a list of deployments (ids)
     */
    public getDeployments(): string[] {
        return Object.getOwnPropertyNames(this.developmentCache);
    }

    public forceLogoutAd(): void {
        this.kubeApiProxyService.forceLogoutAd();
    }

    /**
     * get the details for a specific deployment
     * @param id id of deployment we are interested in
     */
    public getDeploymentDetails(id: string): DeploymentsItemModel {
        return this.developmentCache[id];
    }

    public getMetaData(data?: any): ILiveMetaData {
        const metaData = this.getDeploymentDetails(data.deploymentId);

        return {
            getTitle: () => { return metaData.name; },
            getSubTitle: () => { return metaData.namespace; }
        }
    }

    /**
     * load the describe info for a given deployment
     * @param deploymentId id of the deployment
     */
    public loadDescribe(deploymentId: string): Promise<any> {
        const deploymentDetails = this.getDeploymentDetails(deploymentId);
        if (!deploymentDetails) {
            return Promise.reject('Deployment doesnt exist!');
        }

        const newDeferredPromise = new DeferredPromise<any>();

        if (!this.describeRequestQueue.hasOwnProperty(deploymentId)) {
            this.describeRequestQueue[deploymentId] = [];

            this.kubeApiProxyService.getDeployment(
                deploymentDetails.namespace,
                deploymentDetails.name
            )
                .then(deployment => {
                    const deferredPromises = this.describeRequestQueue[deploymentId];
                    deferredPromises.forEach((deferredPromise) => {
                        deferredPromise.resolve(deployment);
                    });

                    delete this.describeRequestQueue[deploymentId];
                });
        }

        this.describeRequestQueue[deploymentId].push(newDeferredPromise);
        return newDeferredPromise.promise();
    }

    /**
     * retrieve via the network the list of deployments
     */
    public loadDeploymentsList(): Promise<number> {
        return new Promise((resolve, reject) => {
            const deploymentsQueryStartTime = Date.now();
            this.kubeApiProxyService.getDeployments()
                .then((deployments) => {
                    this.developmentCache = {};
                    deployments.data.forEach((deployment) => {
                        this.developmentCache[deployment.uid] = {
                            name: deployment.name,
                            namespace: deployment.namespace,
                            readyActual: deployment.ready,
                            readyDesired: deployment.replicasRequested,
                            upToDate: deployment.updated,
                            available: deployment.available,
                            age: deployment.creationTimestamp,
                            deploymentId: deployment.uid
                        };
                    });
                    resolve(Date.now() - deploymentsQueryStartTime);
                }).catch((err) => {
                    reject(err);
                });
        });
    }

    /**
     * retrieve events for the deployments liveconsole
     * @param deploymentId deploymentID from kubernetes
     * @param queryMode Liveconsole query mode dictaing the filters that need to be set in the https call
     */
    private loadDeploymentEvents(deploymentId: string, queryMode: LiveConsoleQueryMode): Promise<ILogItem[]> {
        const deploymentDetails = this.getDeploymentDetails(deploymentId);
        if (!deploymentDetails) {
            return Promise.reject('Deployment does not exist!');
        }

        return new Promise((resolve, reject) => {
            let fieldSelector: string = null;
            let namespace: string = null;
            if (queryMode === LiveConsoleQueryMode.Deployment) {
                fieldSelector = 'involvedObject.name=' + deploymentDetails.name
                    + '&involvedObject.namespace=' + deploymentDetails.namespace
                    + '&involvedObject.kind=Deployment';
            } else if (queryMode === LiveConsoleQueryMode.Namespace) {
                namespace = deploymentDetails.namespace;
            }
            
            this.eventsDataProvider.start(
                namespace,
                fieldSelector,
            ).then((events: ILogItem[]) => {
                resolve(events);
            });
        });

    }
}
