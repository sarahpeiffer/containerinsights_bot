/** deployments */
import { DeploymentsService, IDeploymentsService } from '../services/DeploymentsService';

/** shared */
import { LiveDataProvider } from '../../../shared/data-provider/LiveDataProvider';

/**
 * service factory interface.
 */
export interface IServiceFactory {
    generateDeploymentsService(): IDeploymentsService;
}

/**
 * engine to create services of any kind the deployments feature will require
 */
export class ServiceFactory implements IServiceFactory {

    /** singleton instance of factory */
    private static factoryInstance: IServiceFactory;

    /** deployments service can be shared, so single instance of that */
    private serviceInstance: IDeploymentsService;

    /**
     * get single instance of the factory
     */
    public static Instance() {
        if (!ServiceFactory.factoryInstance) {
            ServiceFactory.factoryInstance = new ServiceFactory();
        }
        return ServiceFactory.factoryInstance;
    }

    /**
     * get single instance of the deployments service itself
     */
    public generateDeploymentsService(): IDeploymentsService {
        if (!this.serviceInstance) {
            this.serviceInstance = new DeploymentsService(new LiveDataProvider());
        }
        return this.serviceInstance;
    }
}
