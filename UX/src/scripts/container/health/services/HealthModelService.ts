/** tpl */
import { Promise } from 'es6-promise';

/** shared */
import { IAzureResource } from '../../../shared/IAzureResource';

/** local */
import { IHealthDataProvider } from './data-provider/HealthDataProvider';
import { IHealthQueryResponseInterpreter } from './data-provider/HealthQueryResponseInterpreter';
import { IHealthModel } from '../IHealthModel';
import { IKubernetesCluster } from '../../IBladeContext';

/**
 * defines functionality of health model service
 */
export interface IHealthModelService {
    /**
     * constructs health model
     * @param request if for telemetry correlation
     * @returns operation completion promise
     */
    getHealthModel(requestId: string): Promise<IHealthModel>;
}

/**
 * provides functionality to get health model
 */
export class HealthModelService implements IHealthModelService {
    /** health data provider */
    private _healthDataProvider: IHealthDataProvider

    /** health query response interpreter */
    private _healthQueryResponseInterpreter: IHealthQueryResponseInterpreter;

    /** log analytics workspace information */
    private _workspace: IAzureResource;

    /** cluster arm resource id */
    private _cluster: IKubernetesCluster;

    /**
     * initializes a new instance of the class
     * @param healthDataProvider health data provider
     * @param healthQueryResponseInterpreter health query response interpreter
     * @param workspace log analytics workspace information
     * @param cluster cluster information
     */
    public constructor(
        healthDataProvider: IHealthDataProvider,
        healthQueryResponseInterpreter: IHealthQueryResponseInterpreter,
        workspace: IAzureResource,
        cluster: IKubernetesCluster
    ) {
        if (!healthDataProvider) { 
            throw new Error('Param @healthDataProvider may not be null in HealthModelService.ctor()'); 
        }
        if (!healthQueryResponseInterpreter) { 
            throw new Error('Param @healthQueryResponseInterpreter may not be null in HealthModelService.ctor()'); 
        }
        if (!workspace) { 
            throw new Error('Param @workspace may not be null in HealthModelService.ctor()'); 
        }

        if (!cluster) { 
            throw new Error('Param @cluster may not be null in HealthModelService.ctor()'); 
        }

        this._healthDataProvider = healthDataProvider;
        this._healthQueryResponseInterpreter = healthQueryResponseInterpreter;

        this._workspace = workspace;
        this._cluster = cluster;
    }

    /**
     * constructs health model
     * @returns operation completion promise
     */
    public getHealthModel(requestId: string): Promise<IHealthModel> {
        return new Promise<IHealthModel>((resolve, reject) => {
            this._healthDataProvider.getLatestMonitorStates(this._workspace, this._cluster, requestId || '')
                .then((result) => {
                    const healthModel = 
                        this._healthQueryResponseInterpreter.processLatestHealthMonitorStatesQueryResult(result);

                    if (!healthModel) {
                        reject('Error in HealthModelService.getHealthModel : healthModel is empty, likely empty result rows');
                    }

                    resolve(healthModel);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }
}
