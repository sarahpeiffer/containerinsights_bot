/** local */
import { JsonMonitorDetailsModel } from '../../models/monitorDetails/JsonMonitorDetailsModel';
import { HealthMonitorDetailsViewModelBase } from './HealthMonitorDetailsViewModelBase';
import { HealthMonitorDetailsContainerViewModel } from './HealthMonitorDetailsContainerViewModel';
import { IHealthServicesFactory } from '../../factories/HealthServicesFactory';

/**
 * MVVM view model for generic (json) health monitor details component
 */
export class JsonMonitorDetailsViewModel extends HealthMonitorDetailsViewModelBase {
    private _model: JsonMonitorDetailsModel;

    public constructor(
        healthServicesFactory: IHealthServicesFactory,
        parentContext: HealthMonitorDetailsContainerViewModel, 
        forceUpdate: reactForceUpdateHandler,
    ) {
        super(healthServicesFactory, parentContext, forceUpdate);
    }

    protected createDetailsModel(monitorIdentifier: string): void {
        if (!monitorIdentifier) { 
            throw new Error(`@monitorIdentifier may not be null at JsonMonitorDetailsViewModel.createDetailsModel()`); 
        }

        const healthMonitorService = this.healthServicesFactory.healthMonitorService;
        const monitor = healthMonitorService.getMonitor(monitorIdentifier);

        this._model = new JsonMonitorDetailsModel(monitor.details);
    }

    /**
     * gets monitor state details
     * @returns {any} monitor state details
     */
    public get details(): any {
        return this._model.details;
    }
}
