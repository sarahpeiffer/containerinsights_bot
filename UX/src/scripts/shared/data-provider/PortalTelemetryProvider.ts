import { StringMap } from '../StringMap';
import { ErrorSeverity } from './TelemetryErrorSeverity';
import FunctionGates from '../Utilities/FunctionGates';
import { IPortalMessagingProvider, PortalMessagingProvider } from '../messaging/v2/PortalMessagingProvider';

/**
 * Application insights provider; integrates over the javascript/typings for application insights
 * this interface could be later used for other telemetry providers
 */
export interface IPortalTelemetryProvider {
    /**
     * Log a custom named event to the telemetry system
     * ie: event('wonGame', undefined, {score: 10, remainingLives:2})
     * @param nameOfEvent friendly name for the event
     * @param properties list of custom properties to add to this event
     * @param metrics list of custom numeric metrics to append (ie: event('wonGame', undefined, {score: 10, remainingLives:2}))
     * @returns void
     */
    logEvent(nameOfEvent: string, properties: StringMap<string>, metrics: StringMap<number>): void;

    /**
     * log a page loaded event for tracking when pages are being viewed complete with where in the world
     * the person is, how long the page took to load, etc.
     * @param pageName friendly name for the page
     * @param url custom url for this page, if not provided ai will use window.location
     * @param properties list of custom properties to add to this event
     * @param metrics list of custom numeric metrics to append (ie: pageview('home', undefined, undefined, {domObjectCount: 10}))
     * @param loadTime milliseconds the page took to load (ai will automagically populate if empty)
     * @returns void
     */
    logPageView(pageName: string, url: string, properties: StringMap<string>, metrics: StringMap<number>, loadTime: number): void;

    /**
     * log an exception with application insights
     * @param exception exception details (name, message, optional stack)
     * @param handledAt where you hanlded it 
     * @param severity severity of the error
     * @param properties [optional] parameters
     * @param metrics [optional] metrics (measurements)
     * @returns {void}
     */
    logException(exception: string, handledAt: string, severity: ErrorSeverity
        , properties?: StringMap<string>, metrics?: StringMap<number>): void;

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
    logExceptionLimited(key: string, exception: string, handledAt: string, severity: ErrorSeverity,
        properties?: StringMap<string>, metrics?: StringMap<number>): void;

    /**
     * Log a dependency call in application insights
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
     * Immediately send all queued telemetry.
     */
    flush(): void;
}

export class PortalTelemetryProvider implements IPortalTelemetryProvider {
    private portalMessagingProvider: IPortalMessagingProvider;

    /** Interval we want to limit to */
    private _throttleInterval: number = 30000;

    /** mapping of limiting functions hashed by some key */
    private _throttleFunction: StringMap<any>;

    constructor() {
        this._throttleFunction = {};

        this.portalMessagingProvider = PortalMessagingProvider.Instance();
        if (!this.portalMessagingProvider) {
            throw new Error('The portal telemetry provider requires @param messagingProvider');
        }        
    }

    /**
     * Log a custom named event to the telemetry system
     * ie: event('wonGame', undefined, {score: 10, remainingLives:2})
     * @param nameOfEvent friendly name for the event
     * @param properties list of custom properties to add to this event
     * @param metrics list of custom numeric metrics to append (ie: event('wonGame', undefined, {score: 10, remainingLives:2}))
     * @returns void
     */
    public logEvent(nameOfEvent: string, properties: StringMap<string>, metrics: StringMap<number>): void {
        if (this.portalMessagingProvider) {
            const messageData = { nameOfEvent, properties, metrics, cloud: 'mooncake' };
            this.portalMessagingProvider.sendMessage('telemetry::logEvent', messageData);
        } else {
            console.error(
                'There is no messaging provider to send our telemetry to the portal for collection. Failed to log event telemetry.'
            );
        }
    }

    /**
     * log a page loaded event for tracking when pages are being viewed complete with where in the world
     * the person is, how long the page took to load, etc.
     * @param pageName friendly name for the page
     * @param url custom url for this page, if not provided ai will use window.location
     * @param properties list of custom properties to add to this event
     * @param metrics list of custom numeric metrics to append (ie: pageview('home', undefined, undefined, {domObjectCount: 10}))
     * @param loadTime milliseconds the page took to load (ai will automagically populate if empty)
     * @returns void
     */
    public logPageView(
        pageName: string, 
        url?: string, 
        properties?: StringMap<string>,
        metrics?: StringMap<number>, 
        loadTime?: number
    ): void {
        if (this.portalMessagingProvider) {
            const messageData = { pageName, url, properties, metrics, loadTime, cloud: 'mooncake' };
            this.portalMessagingProvider.sendMessage('telemetry::logPageView', messageData);
        } else {
            console.error(
                'There is no messaging provider to send our telemetry to the portal for collection. Failed to log page view telemetry.'
            );
        }
    }

    /**
     * log an exception with application insights
     * @param exception exception details (name, message, optional stack)
     * @param handledAt where you hanlded it 
     * @param severity severity of the error
     * @param properties [optional] parameters
     * @param metrics [optional] metrics (measurements)
     * @returns {void}
     */
    public logException(
        exception: string, 
        handledAt: string, 
        severity: ErrorSeverity, 
        properties?: StringMap<string>, 
        metrics?: StringMap<number>
    ): void {
        if (this.portalMessagingProvider) {
            // bbax: as per the comments, trackException can handle both string and Error... our ajax errors are not proper Error
            // objects and get cast into [object Object] so addressing this by feeding strings.  the typings doesn't support string
            // so we are forcing it through as any here...
            const messageData = { exception: exception as any, handledAt, severity, properties, metrics, cloud: 'mooncake' };
            this.portalMessagingProvider.sendMessage('telemetry::logException', messageData);
        } else {
            console.error(
                'There is no messaging provider to send our telemetry to the portal for collection. Failed to log exception telemetry.'
            )
        }
    }

    /**
     * log an exception with application insights
     * @param key reference key to use for hashing to throttle grouping based on (optionally just specify '' to throttle all together)
     * @param exception exception details (name, message, optional stack)
     * @param handledAt where you hanlded it 
     * @param severity severity of the error
     * @param properties [optional] parameters
     * @param metrics [optional] metrics (measurements)
     * @returns {void}
     */
    public logExceptionLimited(
        key: string, 
        exception: string, 
        handledAt: string, 
        severity: ErrorSeverity,
        properties?: StringMap<string>, 
        metrics?: StringMap<number>
    ): void {
        if (this.portalMessagingProvider) {
            if (!this._throttleFunction.hasOwnProperty(key)) {
                this._throttleFunction[key] =
                    FunctionGates.CreateLimitedFunction(this.logException, this._throttleInterval).bind(this);
            }
            this._throttleFunction[key](exception, handledAt, severity, properties, metrics);
        } else {
            console.error(
                'There is no messaging provider to send our telemetry to the portal for collection. \
                Failed to log exception limited telemetry.'
            );
        }
    }

    /**
     * Log a dependency call in application insights
     * @param   id    unique id, this is used by the backend o correlate server requests. Use Util.newId() to generate a unique Id.
     * @param   method    represents request verb (GET, POST, etc.)
     * @param   absoluteUrl   absolute url used to make the dependency request
     * @param   pathName  the path part of the absolute url
     * @param   totalTime total request time
     * @param   success   indicates if the request was sessessful
     * @param   resultCode    response code returned by the dependency request
     */
    public logDependency(
        id: string, 
        method: string, 
        absoluteUrl: string, 
        pathName: string,
        totalTime: number, 
        success: boolean, 
        resultCode: number
    ): void {
        if (this.portalMessagingProvider) {
            const messageData = { id, method, absoluteUrl, pathName, totalTime, success, resultCode, cloud: 'mooncake' };
            this.portalMessagingProvider.sendMessage('telemetry::logDependency', messageData);
        } else {
            console.error(
                'There is no messaging provider to send our telemetry to the portal for collection. Failed to log dependency telemetry.'
            );
        }
    }

    /** Immediately send all queued telemetry */
    public flush(): void {
        if (this.portalMessagingProvider) {
            const messageData = { cloud: 'mooncake' };
            this.portalMessagingProvider.sendMessage('telemetry::flush', messageData);
        } else {
            console.error(
                'There is no messaging provider to send our telemetry to the portal for collection. Failed to log telemetry.'
            );
        }
    }
};
