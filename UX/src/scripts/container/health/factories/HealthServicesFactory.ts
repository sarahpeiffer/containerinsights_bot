/** tpl */
import { Promise } from 'es6-promise'

/** local */
import { IHealthMonitorService, HealthMonitorService } from '../services/HealthMonitorService';
import { HealthModelService } from '../services/HealthModelService';
import { HealthPaneTelemetryService } from '../services/HealthPaneTelemetryService';
import { ParentHealthMonitorIdProvider } from '../services/healthModel/ParentHealthMonitorIdProvider';
import { HealthModelBuilder } from '../services/healthModel/HealthModelBuilder';
import { HealthModelDefinition } from '../services/healthModel/HealthModelDefinition';
import { HealthQueryResponseInterpreter } from '../services/data-provider/HealthQueryResponseInterpreter';
import { BladeContext } from '../../BladeContext';
import { HealthDataProviderFactory } from './HealthDataProviderFactory';
import { HealthDisplayStringService, IHealthDisplayStringService } from '../services/HealthDisplayStringService';
import { IHealthMonitorTreeService, HealthMonitorTreeService } from '../services/HealthMonitorTreeService';
import { IHealthAspectService, HealthAspectService } from '../services/HealthAspectService';
import { IHealthPaneTelemetryService } from '../services/HealthPaneTelemetryService';
import { HealthModelVisualizationDefinition } from '../services/healthModel/HealthModelVisualizationDefinition';
import { TelemetryProviderFactory } from '../../../shared/factories/TelemetryProviderFactory';

/**
 * defines a factory of services supporting health views
 */
export interface IHealthServicesFactory {
    /**
     * gets health aspects service
     */
    readonly healthAspectService: IHealthAspectService;

    /**
     * gets health monitor service
     */
    readonly healthMonitorService: IHealthMonitorService;

    /** 
     * gets monitor tree service
     */
    readonly healthMonitorTreeService: IHealthMonitorTreeService;

    /**
     * gets telemetry service
     */
    readonly healthPaneTelemetryService: IHealthPaneTelemetryService;

    /**
     * gets display strings service
     */
    readonly displayStringService: IHealthDisplayStringService;
}

/**
 * implements a factory of services supporting health views
 */
export class HealthServicesFactory implements IHealthServicesFactory {
    /** factory singleton instance */
    private static factory: HealthServicesFactory;

    /** true if instance is initialized via initialize() call */
    private _isInitialized: boolean;

    /** health aspects service */
    private _healthAspectService: IHealthAspectService;

    /** health monitor service */
    private _healthMonitorService: IHealthMonitorService;

    /** monitor tree service */
    private _healthMonitorTreeService: IHealthMonitorTreeService;

    /** telemetry service */
    private _healthPaneTelemetryService: IHealthPaneTelemetryService

    /** display string service */
    private _displayStringService: IHealthDisplayStringService;

    /**
     * creates a new instance of the class
     */
    private constructor() {
        this._isInitialized = false;
    }

    /**
     * gets instance (singleton) of the factory
     */
    public static get instance(): HealthServicesFactory {
        if (!HealthServicesFactory.factory) {
            HealthServicesFactory.factory = new HealthServicesFactory();
        }

        return HealthServicesFactory.factory;
    }

    /**
     * initializes the instance by loading data from the store
     */
    public initialize(): Promise<void> {
        this._isInitialized = false;

        this._healthPaneTelemetryService = new HealthPaneTelemetryService(TelemetryProviderFactory.instance());
        this._displayStringService = new HealthDisplayStringService(this, HealthModelVisualizationDefinition);
            
        return new Promise((resolve, reject) => {
            const bladeContext = BladeContext.instance();
            const healthDataProvider = HealthDataProviderFactory.instance().createDefaultDataProvider();

            const healthQueryResultInterpreter = new HealthQueryResponseInterpreter(
                new HealthModelBuilder(
                    new ParentHealthMonitorIdProvider(HealthModelDefinition)
                )
            );

            const requestDescriptor = this._healthPaneTelemetryService.onStartLatestMonitorStatesRequest();

            const healthModelService = new HealthModelService(
                healthDataProvider, 
                healthQueryResultInterpreter, 
                bladeContext.workspace, 
                bladeContext.cluster);

            healthModelService.getHealthModel(requestDescriptor.requestId)
                .then((healthModel) => {
                    this._healthPaneTelemetryService.onCompleteLatestMonitorStatesRequest(requestDescriptor);

                    // TODO:
                    // bbax: this will crash if healthModel is null... code below in HealthMonitorService would normally
                    // pick this up and turn it into "NoData" but this code can't run anymore as a result
                    // of the attempt here to log telemetry
                    this._healthPaneTelemetryService.logHealthModelInconsistencyErrors(healthModel.errors);

                    this._healthAspectService = new HealthAspectService(this);
                    this._healthMonitorService = new HealthMonitorService(healthModel);
                    this._healthMonitorTreeService = new HealthMonitorTreeService(healthModel, this._healthMonitorService);

                    this._isInitialized = true;

                    resolve();
                })
                .catch((error) => {
                    this._healthPaneTelemetryService.onCompleteLatestMonitorStatesRequest(requestDescriptor, error);

                    this._isInitialized = false;

                    reject(error);
                });
        });
    }

    /**
     * gets health aspect service
     */
    public get healthAspectService(): IHealthAspectService {
        if (!this._isInitialized) {
            throw new Error(`HealthServicesFactory must be initialized first via Initialize() method`);
        }

        return this._healthAspectService;
    }

    /**
     * gets health monitor service
     */
    public get healthMonitorService(): IHealthMonitorService {
        if (!this._isInitialized) {
            throw new Error(`HealthServicesFactory must be initialized first via Initialize() method`);
        }

        return this._healthMonitorService;
    }

    /**
     * gets monitor tree service
     */
    public get healthMonitorTreeService(): IHealthMonitorTreeService {
        if (!this._isInitialized) {
            throw new Error(`HealthServicesFactory must be initialized first via Initialize() method`);
        }

        return this._healthMonitorTreeService;
    }

    /**
     * gets telemetry service
     */
    public get healthPaneTelemetryService(): IHealthPaneTelemetryService {
        return this._healthPaneTelemetryService;
    }

    /**
     * gets display string service
     */
    public get displayStringService(): IHealthDisplayStringService {
        if (!this._isInitialized) {
            throw new Error(`HealthServicesFactory must be initialized first via Initialize() method`);
        }

        return this._displayStringService;
    }
}
