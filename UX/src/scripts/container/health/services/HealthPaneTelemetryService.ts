/** tpl */
import * as uuid from 'uuid';

/** shared */
import { ITelemetry, TelemetrySubArea, IFinishableTelemetry } from '../../../shared/Telemetry';
import { ErrorSeverity } from '../../../shared/data-provider/TelemetryErrorSeverity';

/** local */
import { BladeContext } from '../../BladeContext';
import { ITelemetryProviderFactory } from '../../../shared/factories/TelemetryProviderFactory';

/**
 * defines request descriptor properties to provide information
 * around dependency request for tracking purposes
 */
export interface IRequestDescriptor {
    /** request id */
    readonly requestId: string;

    /**
     * handle providing 'access' to telemetry of the request
     * 
     * note: type is set to any intentionally
     * to hide specifics of the implementation
     */
    readonly requestTelemetryHandle: any;
}

/**
 * defines functionality of the health pane telemetry service
 */
export interface IHealthPaneTelemetryService {
    /**
     * callback invoked to log telemetry when health page is loaded
     */
    onPaneLoad(): void;

    /**
     * callback invoked to log telemetry when health page is rendered with no data
     */
    onPaneRenderNoData(): void;

    /**
     * callback invoked to log telemetry when health page fails query
     * @param error exception thrown during rendering
     * @param handledAt where the exception was handled 
     */
    onDataLoadException(error: string | Error, handledAt: string): void;

    /**
     * callback invoked to log telemetry when health page fails render
     * @param error exception thrown during rendering
     * @param handledAt where the exception was handled 
     */
    onPaneRenderException(error: string | Error, handledAt: string): void;

    /**
     * callback invoked to indicate health model query for monitor latest states is about to execute
     * @returns request descriptor
     */
    onStartLatestMonitorStatesRequest(): IRequestDescriptor;

    /**
     * callback invoked to indicate health model query for monitor latest states is completed
     * @param request request descriptor
     * @param error exception occurring during request execution, if any
     */
    onCompleteLatestMonitorStatesRequest(request: IRequestDescriptor, error?: string | Error): void;

    /**
     * logs telemetry for health model inconsistency errors
     * @param errors list of errors found while building health model
     */
    logHealthModelInconsistencyErrors(errors: string[]): void;

    /** logs navigation events occuring inside Health */
    logNavigationEvent(source: string, destination: string, additionalInformation?: any): void;

    /** logs an event */
    logEvent(event: string, customProperties: StringMap<string>, customMetrics: StringMap<number>): void
}

/**
 * Kusto query telemetry names (event names)
 */
enum HealthPaneQueryName {
    /** health monitor latest states query event name */
    LatestStates = 'kustoContainerClusterHealth-LatestStates-Load',
}

/**
 * provides functionality to get telemetry provider for cluster health pane
 */
export class HealthPaneTelemetryService implements IHealthPaneTelemetryService {
    /** telemetry logging provider */
    private _telemetry: ITelemetry;

    /** telemetry provider factory */
    private _telemetryProviderFactory: ITelemetryProviderFactory

    /**
     * initializes a new instance of the class
     * @param telemetryProviderFactory telemetry provider factory
     */
    public constructor(telemetryProviderFactory: ITelemetryProviderFactory) {
        if (!telemetryProviderFactory) { 
            throw new Error(`@telemetryProviderFactory may not be null at HealthPaneTelemetryService.ctor()`); 
        }
        this._telemetryProviderFactory = telemetryProviderFactory;
    }

    /**
     * callback invoked to log telemetry when health page is loaded
     */
    public onPaneLoad(): void {
        this.telemetry.logPageView(TelemetrySubArea.ContainerHealth.toString());
    }

    /**
     * callback invoked to log telemetry when health page is rendered with no data
     */
    public onPaneRenderNoData(): void {
        this.telemetry.logEvent('containerClusterHealth-NoData', undefined, undefined);
    }

    /**
     * callback invoked to log telemetry when health page fails query
     * @param error exception thrown during rendering
     */
    public onDataLoadException(error: string | Error, handledAt: string): void {
        this.telemetry.logException(error, handledAt, ErrorSeverity.Error, null, null);
    }

    /**
     * callback invoked to log telemetry when health page fails render
     * @param error exception thrown during rendering
     */
    public onPaneRenderException(error: string | Error, handledAt: string): void {
        this.telemetry.logException(error, handledAt, ErrorSeverity.Error, null, null);
    }

    /**
     * callback invoked to indicate health model query for monitor latest states is about to execute
     * @returns request descriptor
     */
    public onStartLatestMonitorStatesRequest(): IRequestDescriptor {
        const requestId = uuid().toLocaleLowerCase();
        const requestTelemetryHandle = this.telemetry.startLogEvent(HealthPaneQueryName.LatestStates, { requestId }, null);

        return { requestId, requestTelemetryHandle: requestTelemetryHandle };
    }

    /**
     * callback invoked to indicate health model query for monitor latest states is completed
     * @param request request descriptor
     * @param error exception occurring during request execution, if any
     */
    public onCompleteLatestMonitorStatesRequest(request: IRequestDescriptor, error?: string | Error): void {
        if (!request) { 
            throw new Error(`@request may not be null at HealthPaneTelemetryService.onComplete...Request()`);
        }
        if (!request.requestTelemetryHandle) { 
            throw new Error(`@request.requestTelemetryHandle may not be null at HealthPaneTelemetryService.onComplete...Request()`);
        }

        const finishable = request.requestTelemetryHandle as IFinishableTelemetry;
        if (!finishable) { 
            throw new Error(`@request.requestTelemetryHandle must be of type IFinishableTelemetry`);
        }

        if (error) {
            finishable.fail(error, { handledAt: 'container/health/HealthPaneView.tsx' });
            this.logQueryException('latest monitor states', error);
        } else {
            finishable.complete();
        }
    }

    /**
     * logs telemetry for health model inconsistency errors
     * @param errors list of errors found while building health model
     */
    public logHealthModelInconsistencyErrors(errors: string[]): void {
        if (!errors || (errors.length <= 0)) { return; }

        const correlationId = uuid().toLocaleLowerCase();

        // log one exception per health tab load
        this._telemetry.logException(
            'Health model has inconsistencies', 
            'Health', 
            ErrorSeverity.Error,
            {
                correlationId: correlationId
            },
            {
                errorCount: errors.length
            });

        // log every error as event
        for (const error of errors) {
            this._telemetry.logEvent(
                'healthModel-InconsistencyError',
                { 
                    correlationId: correlationId,
                    error: error
                },
            {});
        }
    }

    /** logs navigation events occuring inside Health */
    public logNavigationEvent(source: string, destination: string, additionalInformation?: any): void {
        this.telemetry.logNavigationEvent(source, destination, additionalInformation);
    }

    /** logs event */
    public logEvent(event: string, customProperties: StringMap<string>, customMetrics: StringMap<number>): void {
        this.telemetry.logEvent(event, customProperties, customMetrics);
    }

    /**
     * logs telemetry for Kusto query exception
     * @param queryTitle query title for the failed request
     * @param error exception occurring during request
     */
    private logQueryException(queryTitle: string, error: string | Error): void {
        console.error(`Failed to get '${(queryTitle || '???')}' data from the store`, error);

        this.telemetry.logException(
            error,
            'container/health/HealthPaneView.tsx',
            ErrorSeverity.Error,
            undefined,
            undefined
        );
    }

    /**
     * gets telemetry logging provider
     */
    private get telemetry(): ITelemetry {
        if (this._telemetry) { return this._telemetry; }

        const isTelemetryConfigured = this._telemetryProviderFactory.isConfigured;
        const telemetry = this._telemetryProviderFactory.getTelemetryProvider();
        const bladeContext = BladeContext.instance();

        const context = {
            subArea: TelemetrySubArea.ContainerHealth,
            cluster_id: bladeContext.cluster.resourceId || '<n/a>',
            cluster_name: bladeContext.cluster.givenName || '<n/a>',
            workspace_id: bladeContext.workspace.resourceId || '<n/a>',
            workspace_name: bladeContext.workspace.resourceName || '<n/a>'
        };

        telemetry.setContext(context, false);

        // do not cache telemetry provider in case it wasn't yet fully configured
        if (!isTelemetryConfigured) {
            return telemetry;
        }

        this._telemetry = telemetry;

        return this._telemetry;
    }
}
