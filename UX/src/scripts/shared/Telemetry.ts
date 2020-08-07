import { ErrorSeverity } from './data-provider/TelemetryErrorSeverity';
import { StringMap } from './StringMap';

/**
 * Enum defines the areas of the InfraInsights application... used by the mainArea custom attribute
 * we log in order to differentiate where the events are coming from (usage)
 */
export enum TelemetryMainArea {
    Storage = 'Storage',
    Compute = 'Compute',
    Maps = 'Maps',
    Containers = 'Containers',
    Global = 'Global',
    SFMesh = 'SFMesh'
};

/**
 * Enum defines the sub sections of compute and storage... charts and details for some extra drill down infromation
 * used by subArea attribute
 */
export enum TelemetrySubArea {
    Aggregate = 'Aggregate',
    AggregateTopN = 'AggregateTopN',
    Details = 'Details',
    PodCharts = 'PodLiveTabMetricsCharts',
    ContainerCharts = 'ContainerCharts',
    ContainerHealth = 'ContainerHealth',
    ContainerNodeList = 'ContainerNodeList',
    ContainerList = 'ContainerList',
    ContainerControllerList = 'ContainerControllerList',
    ContainerDeploymentList = 'ContainerDeploymentList',
    SingleComputePerf = 'SingleComputePerf',
    MulticlusterMainPage = 'MulticlusterMainPage',
    MulticlusterGetStartedTab = 'MulticlusterGettingStartedTab',
    MulticlusterMonitoredList = 'MulticlusterMonitoredList',
    MulticlusterUnmonitoredList = 'MulticlusterNonMonitoredList',
    ConnectionMetrics = 'ConnectionMetrics',
    SFMesh = 'SFMeshCharts',
    NewsTab = 'ContainerNewsTab'
}

/**
 * Interface allowing to inject performance.now()
 * functionality at the time of unit testing since
 * window.performance is not known tat that time
 */
export interface IPerformanceMeasureProvider {
    now: () => number
}

/**
 * Interface to be provided to the InfraInsights application. Wrapper will utilize the telemetry provider given to
 * it (currently Application Insights) and maintain information about the global context (customProperties)
 */
export interface ITelemetry {
    /**
     * logEvent to telemetry provider, custom properties will be a combination of the local context (parameter)
     * and the global context (.ctor / setContext).. note that the local context will not carry from
     * call to call
     * @param event name of the event to log
     * @param customProperies local context to be written to telemetry, will only apply to this call
     * @param customMetrics extra string/number pairs we want to provide to the telemetry provider
     * @returns void
     */
    logEvent(event: string, customProperties: StringMap<string>, customMetrics: StringMap<number>): void;

     /**
     * Log a navigation event with application insights.
     * This function exists so that the code is more readable and the navigation event name is specified only in one location
     * @param source The source from where the logging event is being called
     * @param destination The destination where the end user is heading towards
     */
    logNavigationEvent(source: string, destination: string, additionalInformation?: any): void;

    /**
     * log an exception with application insights
     * @param exception exception details (name, message, optional stack)
     * @param handledAt where you handled it
     * @param severity severity of the error
     * @param customProperties [optional] parameters
     * @param customMetrics [optional] metrics (measurements)
     * @returns {void}
     */
    logException(exception: string | Error, handledAt: string, severity: ErrorSeverity
        , customProperties: StringMap<string>, customMetrics: StringMap<number>): void;

    /**
     * log an exception with application insights throttled
     * @param key reference key to use for hashing to throttle grouping based on (optionally just specify '' to throttle all together)
     * @param exception exception details (name, message, optional stack)
     * @param handledAt where you hanlded it
     * @param severity severity of the error
     * @param properties [optional] parameters
     * @param metrics [optional] metrics (measurements)
     * @returns {void}
     */
    logExceptionLimited(key: string, exception: string | Error, handledAt: string, severity: ErrorSeverity,
        properties?: StringMap<string>, metrics?: StringMap<number>): void;

    /**
     * start tracking an event to log, use the return object to complete the metric when finished
     * @param eventName event name to begin tracking
     * @param customProperies local context to be written to telemetry, will only apply to this call
     * @param customMetrics extra string/number pairs we want to provide to the telemetry provider
     * @param performance performance measure provider ofr performance.now() functionality
     * @returns IFinishableTelemetry invoke complete on this when your telemetry is done!!
     */
    startLogEvent(
        eventName: string,
        customProperties: StringMap<string>,
        customMetrics: StringMap<number>,
        performance?: IPerformanceMeasureProvider
    ): IFinishableTelemetry;

    /**
     * logPageView to telemetry provider, custom properties will be a combination of the local context (parameter)
     * and the global context (.ctor / setContext).. note that the local context will not carry from
     * call to call... load time of page is optional because app insights will try to add something
     * @param pageName friendly name for the page
     * @param url optional currently (app insights will use window.location if undefined)
     * @param customProperies local context to be written to telemetry, will only apply to this call
     * @param customMetrics extra string/number pairs we want to provide to the telemetry provider
     * @param loadTime number of milliseconds the page took to load (optional today appinsights will automagic this)
     * @returns void
     */
    logPageView(pageName: string, url?: string, customProperties?: StringMap<string>,
        customMetrics?: StringMap<number>, loadTime?: number): void;

    /**
     * Log a dependency call in application insights.
     * This is useful to correlate UX perf and backend perf into single view in AppInsight dashbaord
     * @param   id    unique id, this is used by the backend o correlate server requests. Use Util.newId() to generate a unique Id.
     * @param   method    represents request verb (GET, POST, etc.)
     * @param   absoluteUrl   absolute url used to make the dependency request
     * @param   pathName  the path part of the absolute url
     * @param   totalTime total request time
     * @param   success   indicates if the request was sessessful
     * @param   resultCode    response code returned by the dependency request
     */
    logDependency(id: string, method: string, absoluteUrl: string, pathName: string,
        totalTime: number, success: boolean, resultCode: number): any;

    /**
     * used to change the global context used by other logging types for custom properties... can be used
     * to clear global state by replacing the global state with undefined or empty {}
     * can be used to append or replace with a completely new list
     * @param customContext context to either append or replace with (note to clear use undefined/true)
     * @param replace if true replace global context (can be used to clear global context)
     * @returns void
     */
    setContext(customContext: StringMap<string>, replace: boolean): void;

    /**
     * Immediately send all queued telemetry.
     */
    flush(): void;
}

/**
 * returned from the start* series of telemetry; call complete when your telemetry is ready to log out
 */
export interface IFinishableTelemetry {
    /**
     * call me when your telemetry item is finished and ready to log
     * @param customProperties optional properties to add to telemetry item
     * @param customMetrics optional metrics to add to telemetry item
     * @returns void
     */
    complete(customProperties?: StringMap<string>, customMetrics?: StringMap<number>): void;

     /**
     * Invoked when the operation being tracked is failed.
     * @param exception
     * @param errorProperties
     * @param errorMetrics
     */
    fail(exception: string | Error, errorProperties?: StringMap<string>, errorMetrics?: StringMap<number>): void;
}

export class TelemetryUtilities {
    /**
     * Shim the object we are handed with to JSON in case there are no enumerable items
     * we want all own properties to appear in the final json
     * Error has no enumerable properties...
     * @param exception exception we are shimming
     * @returns {void}
     */
    public static shimExceptionObject(exception: Object): void {
        if (typeof exception === 'object' && !exception.hasOwnProperty('toJSON')) {
            Object.defineProperty(exception, 'toJSON', {
                value: () => {
                    const newJsonObject = {};

                    Object.getOwnPropertyNames(exception).forEach((key) => {
                        newJsonObject[key] = exception[key];
                    });

                    return newJsonObject;
                },
                configurable: true,
                writable: true
            });
        }
    }
}

/**
 * implementation of finishable telemetry; just wraps a simple callback
 * which can be invoked whenever the user of the finishable telemetry calls
 * the complete() function... used by Telemetry during time tracked telemetry
 * the definition of the completionAction itself comes from Telemetry start**()
 */
export class FinishableTelemetry implements IFinishableTelemetry {
    private completionAction: (started: number, customProperties?: StringMap<string>, customMetrics?: StringMap<number>) => void;
    private started: number;

    /**
     * .ctor sets up the completion action
     * @param completionAction action to take when complete is called
     */
    constructor(
        completionAction: (started: number, customProperties?: StringMap<string>, customMetrics?: StringMap<number>) => void,
        started: number
    ) {
        this.completionAction = completionAction;
        this.started = started;
    }

    /**
     * invoked this when your script is ready to finally log the telemetry
     * @returns void
     */
    public complete(customProperties?: StringMap<string>, customMetrics?: StringMap<number>): void {
        if (this.completionAction) {
            this.completionAction(this.started, customProperties, customMetrics);
        }
    }

    /**
     * Invoked when the operation being tracked is failed.
     * @param exception
     * @param errorProperties
     * @param errorMetrics
     */
    public fail(exception: string | Error, errorProperties?: StringMap<string>, errorMetrics?: StringMap<number>): void {
        if (this.completionAction) {
            TelemetryUtilities.shimExceptionObject(exception);

            // bbax: ajax errors aren't proper and come through as [object Object], force our objects
            // over to strings for now (which the app insights claims to support)
            const exceptionObjectWrapper = {
                exceptionType: typeof exception,
                exception
            };
            const exceptionToLog: string = JSON.stringify(exceptionObjectWrapper);
            const errorProps = errorProperties || {};
            errorProps['isError'] = 'true';
            errorProps['error'] = exceptionToLog;
            this.completionAction(this.started, errorProps, errorMetrics || {});
        }
    }
}

/**
 * dummy/null implementation of ITelemetry interface to help
 * in situations where environment configuration is not yet
 * received and we cannot construct right telemetry provider
 */
export class NullTelemetry implements ITelemetry {
    /**
     * logEvent to telemetry provider, custom properties will be a combination of the local context (parameter)
     * and the global context (.ctor / setContext).. note that the local context will not carry from
     * call to call
     * @param event name of the event to log
     * @param customProperies local context to be written to telemetry, will only apply to this call
     * @param customMetrics extra string/number pairs we want to provide to the telemetry provider
     * @returns void
     */
    public logEvent(event: string, customProperties: StringMap<string>, customMetrics: StringMap<number>): void {}

        /**
     * Log a navigation event with application insights.
     * This function exists so that the code is more readable and the navigation event name is specified only in one location
     * @param source The source from where the logging event is being called
     * @param destination The destination where the end user is heading towards
     */
    public logNavigationEvent(source: string, destination: string, additionalInformation?: any): void {}

    /**
     * log an exception with application insights
     * @param exception exception details (name, message, optional stack)
     * @param handledAt where you handled it
     * @param severity severity of the error
     * @param customProperties [optional] parameters
     * @param customMetrics [optional] metrics (measurements)
     * @returns {void}
     */
    public logException(exception: string | Error, handledAt: string, severity: ErrorSeverity
        , customProperties: StringMap<string>, customMetrics: StringMap<number>): void {}

    /**
     * log an exception with application insights throttled
     * @param key reference key to use for hashing to throttle grouping based on (optionally just specify '' to throttle all together)
     * @param exception exception details (name, message, optional stack)
     * @param handledAt where you hanlded it
     * @param severity severity of the error
     * @param properties [optional] parameters
     * @param metrics [optional] metrics (measurements)
     * @returns {void}
     */
    public logExceptionLimited(key: string, exception: string | Error, handledAt: string, severity: ErrorSeverity,
        properties?: StringMap<string>, metrics?: StringMap<number>): void {}

    /**
     * start tracking an event to log, use the return object to complete the metric when finished
     * @param eventName event name to begin tracking
     * @param customProperies local context to be written to telemetry, will only apply to this call
     * @param customMetrics extra string/number pairs we want to provide to the telemetry provider
     * @param performance performance measure provider ofr performance.now() functionality
     * @returns IFinishableTelemetry invoke complete on this when your telemetry is done!!
     */
    public startLogEvent(
        eventName: string,
        customProperties: StringMap<string>,
        customMetrics: StringMap<number>,
        performance?: IPerformanceMeasureProvider
    ): IFinishableTelemetry { 
        return {
            complete: () => {},
            fail: (exception) => {}
        };
    }

    /**
     * logPageView to telemetry provider, custom properties will be a combination of the local context (parameter)
     * and the global context (.ctor / setContext).. note that the local context will not carry from
     * call to call... load time of page is optional because app insights will try to add something
     * @param pageName friendly name for the page
     * @param url optional currently (app insights will use window.location if undefined)
     * @param customProperies local context to be written to telemetry, will only apply to this call
     * @param customMetrics extra string/number pairs we want to provide to the telemetry provider
     * @param loadTime number of milliseconds the page took to load (optional today appinsights will automagic this)
     * @returns void
     */
    public logPageView(pageName: string, url?: string, customProperties?: StringMap<string>,
        customMetrics?: StringMap<number>, loadTime?: number): void {}

    /**
     * Log a dependency call in application insights.
     * This is useful to correlate UX perf and backend perf into single view in AppInsight dashbaord
     * @param   id    unique id, this is used by the backend o correlate server requests. Use Util.newId() to generate a unique Id.
     * @param   method    represents request verb (GET, POST, etc.)
     * @param   absoluteUrl   absolute url used to make the dependency request
     * @param   pathName  the path part of the absolute url
     * @param   totalTime total request time
     * @param   success   indicates if the request was sessessful
     * @param   resultCode    response code returned by the dependency request
     */
    public logDependency(id: string, method: string, absoluteUrl: string, pathName: string,
        totalTime: number, success: boolean, resultCode: number): any {}

    /**
     * used to change the global context used by other logging types for custom properties... can be used
     * to clear global state by replacing the global state with undefined or empty {}
     * can be used to append or replace with a completely new list
     * @param customContext context to either append or replace with (note to clear use undefined/true)
     * @param replace if true replace global context (can be used to clear global context)
     * @returns void
     */
    public setContext(customContext: StringMap<string>, replace: boolean): void {}

    /**
     * Immediately send all queued telemetry.
     */
    public flush(): void {}
}
