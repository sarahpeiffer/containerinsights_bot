/** shared */
import { BaseViewModel } from '../../../shared/BaseViewModel';

/** local */
import { HealthServicesFactory } from '../factories/HealthServicesFactory';
import { HealthPaneObservableProp } from './HealthPaneObservableProp';
import { HealthPaneModel } from '../models/HealthPaneModel';
import { IFailureViewParentContext } from '../../error-state/IFailureViewParentContext';
import { ErrorCodes } from '../../../shared/ErrorCodes';

/**
 * health pane component view model
 */
export class HealthPaneViewModel extends BaseViewModel implements IFailureViewParentContext {
    /** services factory */
    private _healthServicesFactory: HealthServicesFactory;

    /** health pane model */
    private _model: HealthPaneModel;

    /**
     * initializes an instance of the class
     * @param healthServicesFactory services factory
     * @param parentContext parent context (view model)
     * @param forceUpdate function to refresh component view
     */
    public constructor(
        healthServicesFactory: HealthServicesFactory,
        parentContext: BaseViewModel,
        forceUpdate: reactForceUpdateHandler,
    ) {
        super(forceUpdate, parentContext);

        if (!healthServicesFactory) { throw new Error(`@_healthServicesFactory may not be null at HealthPaneViewModel.ctor()`); }

        this._healthServicesFactory = healthServicesFactory;
        this._model = HealthPaneModel.Loading;

        parentContext.handleEventTrigger('RefreshButton', this.onRefresh.bind(this));
    }

    /**
     * initializes view model
     * @param isPageLoad value indicating whether initialization is being performed
     *                   at time health pane is initially visualized (optional, default - false)
     */
    public initialize(isPageLoad?: boolean): void {
        this._model._loadFailedReason = null;

        this._healthServicesFactory.initialize()
            .then(() => {
                const hasData = this._healthServicesFactory.healthMonitorService.hasData;
                this._model = HealthPaneModel.Succeeded(hasData);

                // report telemetry
                const telemetryService = this._healthServicesFactory.healthPaneTelemetryService;
                if (isPageLoad) { telemetryService.onPaneLoad(); }
                if (!hasData) { telemetryService.onPaneRenderNoData(); }

                this.propertyChanged(HealthPaneObservableProp.DataLoaded);
            })
            .catch((error) => {
                this._model = HealthPaneModel.Failed;
                this._model._loadFailedReason = { error, responseJSON: { code: ErrorCodes.HealthFailed }, isFatal: true };

                // report telemetry
                const telemetryService = this._healthServicesFactory.healthPaneTelemetryService;
                if (isPageLoad) { telemetryService.onPaneLoad(); }
                telemetryService.onDataLoadException(error, 'HealthPane');

                this.propertyChanged(HealthPaneObservableProp.DataLoaded);
            });
    }

    /**
     * gets a value indicating whether data load completed
     */
    public get isLoadCompleted(): boolean {
        return this._model.isLoadCompleted;
    }

    /**
     * gets a value indicating whether data load completed successfully
     */
    public get isLoadSucceeded(): boolean {
        return this._model.isLoadSucceeded;
    }

    /**
     * gets a value indicating whether health data is present in the store
     */
    public get hasData(): boolean {
        return this._model.hasData;
    }

    public get loadFailedReason(): any {
        return this._model._loadFailedReason;
    }

    public get loadFailedK8sPath(): string {
        throw new Error('Method not implemented.');
    }

    /**
     * callback invoked when health pane render fails
     * @param error exception or message describing rendering error
     */
    public onRenderException(error: string | Error) {
        const telemetryService = this._healthServicesFactory.healthPaneTelemetryService;
        telemetryService.onPaneRenderException(error, 'HealthPane');
    }

    /**
     * callback invoked when refresh button is clicked
     */
    public onRefresh(): void {
        this._model = HealthPaneModel.Loading;
        this.propertyChanged(HealthPaneObservableProp.DataLoaded);

        this.initialize();
    }

    public onLoad(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.initialize(false);
            resolve();
        });
    }

    /**
     * TODO: Error system doesn't always interact with AD, shouldn't be a required function for health, please remove
     */
    public forceLogoutAd(): void {
        throw new Error('Method not implemented.');
    }
}
