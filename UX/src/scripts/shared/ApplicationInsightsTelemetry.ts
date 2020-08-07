import { ITelemetry, IPerformanceMeasureProvider, IFinishableTelemetry, FinishableTelemetry, TelemetryUtilities } from './Telemetry';
import { IApplicationInsightsProvider } from './data-provider/TelemetryProvider';
import { ErrorSeverity } from './data-provider/TelemetryErrorSeverity';

/**
 * Implementaiton to be provided to the InfraInisghts application.  Wrapper will utilize the telemetry provider given to
 * it (currently Application Insights) and maintain information about the global context (customProperties)
 */
export class Telemetry implements ITelemetry {
    private customContext: StringMap<string>;
    private provider: IApplicationInsightsProvider;

    /**
     * .ctor
     * @param provider telemetry provider (currently only application insights)
     * @param context initial global context for custom properties
     */
    constructor(provider: IApplicationInsightsProvider, context: StringMap<string>) {
        this.provider = provider;
        this.customContext = {};
        if (context) {
            this.setContext(context, true);
        }
    }

    /**
     * Merges object properties for set of objects. If property repeats,
     * objects appearing later in the set override earlier objects
     * @param dictionaries set of objects to merge
     * @returns new object with all properties of the input objects
     */
    private static MergeDictionaries(...dictionaries: any[]): StringMap<any> {
        let result: StringMap<any> = null;

        for (const dictionary of dictionaries) {
            if (dictionary) {
                const keys = Object.keys(dictionary);
                for (const key of keys) {
                    if (!result) { result = {}; }
                    result[key] = dictionary[key];
                }
            }
        }

        return result;
    }

    /**
     * used to log an event of some kind.  local context can be provided to attach some extra custom properties.
     * will automatically apply global context
     * EG: logEvent('gameWon', undefined, {score: 10, remainingLives: 2})
     * WARNING: Will modify the customProperties parameter... do not reuse the object after
     * @param eventName friendly name for the event that is occuring (can include spaces)
     * @param customProperties local context (extra custom properties which wont persist between telemetry calls)
     * @param customMetrics extra custom metrics to log (eg. logEvent('gameWon', undefined, {score: 10, remainingLives: 2}))
     * @returns void
     */
    public logEvent(eventName: string, customProperties: StringMap<string>, customMetrics: StringMap<number>): void {
        if (this.provider) {
            customProperties = this.applyGlobalContext(customProperties);
            this.provider.logEvent(eventName, customProperties, customMetrics);
        }
    }

    /**
     * Log a navigation event with application insights.
     * This function exists so that the code is more readable and the navigation event name is specified only in one location
     * @param source The source from where the logging event is being called
     * @param destination The destination where the end user is heading towards
     */
    public logNavigationEvent(source: string, destination: string, additionalInformation?: any): void {
        if (source && destination) {
            const customProperies = {
                source: source,
                destination: destination,
                additionalInformation: additionalInformation ? JSON.stringify(additionalInformation) : ''
            };
            this.logEvent('navigate', customProperies, undefined);
        }
    }

    /**
      * log an exception with application insights
      * @param exception exception details (name, message, optional stack)
      * @param handledAt where you hanlded it
      * @param severity severity of the error
      * @param customProperties [optional] parameters
      * @param customMetrics [optional] metrics (measurements)
      * @returns {void}
      */
    public logException(exception: string | Error, handledAt: string, severity: ErrorSeverity
        , customProperties: StringMap<string>, customMetrics: StringMap<number>, exceptionThrottleKey: string = null): void {
        if (this.provider) {

            customProperties = this.applyGlobalContext(customProperties);

            // Put handledAt in customProperties since this parameter is ignored by AppInsights SDK.
            // https://github.com/Microsoft/ApplicationInsights-JS/issues/569
            customProperties['handledAt'] = handledAt;

            TelemetryUtilities.shimExceptionObject(exception);

            // bbax: ajax errors aren't proper and come through as [object Object], force our objects
            // over to strings for now (which the app insights claims to support)
            const exceptionObjectWrapper = {
                exceptionType: typeof exception,
                exception
            };
            const exceptionToLog: string = JSON.stringify(exceptionObjectWrapper);

            if (exceptionThrottleKey) {
                this.provider.logExceptionLimited(exceptionThrottleKey, exceptionToLog, handledAt, severity,
                    customProperties, customMetrics);
            } else {
                this.provider.logException(exceptionToLog, handledAt, severity, customProperties, customMetrics);
            }
        }
    }

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
        properties?: StringMap<string>, metrics?: StringMap<number>): void {
            this.logException(exception, handledAt, severity, properties, metrics, key);
    }

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
        if (this.provider) {
            if (!performance) { performance = window.performance; }

            return new FinishableTelemetry(
                (started: number, completionCustomProperties: StringMap<string>, completionCustomMetrics: StringMap<number>) => {
                    const duration: number = performance.now() - started;

                    let mergedProperties = Telemetry.MergeDictionaries(customProperties, completionCustomProperties);
                    mergedProperties = this.applyGlobalContext(mergedProperties);

                    let mergedMetrics = Telemetry.MergeDictionaries(customMetrics, completionCustomMetrics, { duration });

                    this.provider.logEvent(eventName, mergedProperties, mergedMetrics);
                }, performance.now());
        }

        // if telemetry isn't functional, the code can be blissfully unaware this way!
        return { complete: () => { }, fail: () => { } };
    }

    /**
     * logPageView to telemetry provider, custom properties will be a combination of the local context (parameter)
     * and the global context (.ctor / setContext).. note that the local context will note carry from
     * call to call... load time of page is optional because app insights will try to add something
     * WARNING: Will modify the customProperties parameter... do not reuse the object after
     * @param pageName friendly name for the page (note: appinsights will also include the html page name)
     * @param url optional friendly url details (note: appinsights will automtically use window.location if not provided)
     * @param customProperties local context (extra custom properties which wont persist between telemetry calls)
     * @param customMetrics extra custom metrics to log (eg. logPageView('main', undefined, undefined, {domFailures: 2}))
     * @param loadTime milliseconds the page took to load (app insights will automagic this field if empty)
     */
    public logPageView(pageName: string, url?: string, customProperties?: StringMap<string>,
        customMetrics?: StringMap<number>, loadTime?: number): void {
        if (this.provider) {
            customProperties = this.applyGlobalContext(customProperties);

            this.provider.logPageView(pageName, url, customProperties, customMetrics, loadTime);
        }
    }

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
        totalTime: number, success: boolean, resultCode: number): any {
        if (this.provider) {
            return this.provider.logDependency(id, method, absoluteUrl, pathName, totalTime, success, resultCode);
        }
    }

    /**
     * used to change the global context used by other logging types for custom properties... can be used
     * to clear global state by replacing the global state with undefined or empty {}
     * can be used to append or replace with a completely new list
     * @param customContext context we will either replace glocal context with or append to it
     * @param replace if true replace the global context
     */
    public setContext(customContext: StringMap<string>, replace: boolean): void {
        if (replace) {
            this.customContext = customContext;
        } else {
            if (customContext) {
                const keys = Object.keys(customContext);
                keys.forEach((key) => {
                    if (!this.customContext) {
                        this.customContext = {};
                    }

                    this.customContext[key] = customContext[key];
                });
            }
        }
    }

    /**
     * Immediately send all queued telemetry.
     */
    public flush(): void {
        if (this.provider) {
            this.provider.flush();
        }
    }

    /**
     * Append the global and local contexts together
     * @param customProperties local context we want to attach to the global context
     * @returns glocal and local context combined into the local context object
     */
    private applyGlobalContext(customProperties: StringMap<string>): StringMap<string> {
        if (!this.customContext) {
            return undefined;
        }

        if (!customProperties) {
            customProperties = {};
        }

        const keys = Object.keys(this.customContext);
        keys.forEach((key) => {
            customProperties[key] = this.customContext[key];
        });
        return customProperties;
    }
}
