/** local */
import { globals } from '../../globals/globals';

/** Message signature requred on all outgoing messages */
const MessageSignature: string = 'FxFrameBlade';

/** error message to return when function parameter is null or undefined */
const ParameterNullMessage: string = 'Parameter @[$param] may not be null or undefined';

/** parameter name placeholder */
const ParamNamePlaceholder = '[$param]';

/**
 * Event origins we trust
 */
const TrustedParentOriginPublicCloud: string = 'https://portal.azure.com';
const TrustedParentOriginMooncakeCloud: string = 'https://portal.azure.cn';
const TrustedParentOriginFairfaxCloud: string = 'https://portal.azure.us';
const TrustedParentOriginInternal: string = 'https://ms.portal.azure.com';

const TrustedParentDogfoodOrigin: string = 'https://df.onecloud.azure-test.net';
const TrustedParentRcOrigin: string = 'https://rc.portal.azure.com';
const TrustedParentEXOrigin: string = 'https://portal.azure.eaglex.ic.gov';

//
// IFrame names being used to identify message handlers for each IFrame of container insights.
//
export enum ContainerInsightsIFrameIds {
    containerInsights = 'container-singlecluster-perf',
    containerInsightsAtScale = 'container-atscale-perf'
}

/**
 * Defines functionality of the generic portal message processor
 */
export interface IMessageProcessor {
    processMessage(event: any): void;
}

/**
 * Defines functionality to exchange messages
 */
export interface IPortalMessagingProvider {
    /**
     * Starts process of exchanging messages with hosting Ibiza Portal blade
     */
    startMessaging(frameId?: string): void;

    /**
     * Stops process of exchanging messages with hosting Ibiza Portal blade
     */
    stopMessaging(): void;

    /**
     * Registers message processor to be invoked for a specified message type
     * @param messageType type/name of the message to listen to
     * @param processorCallback processor to invoke when event arrives
     */
    registerProcessor(messageType: string, processor: EventListenerOrEventListenerObject, frameId?: string): void;

    /**
     * Removes message processor to be invoked for a specified message type
     * @param messageType type/name of the message to listen to
     * @param processorCallback processor to invoke when event arrives
     */
    unregisterProcessor(messageType: string, processor: EventListenerOrEventListenerObject): void;

    /**
     * Sends message to hosting Ibiza Portal blade
     * @param messageType type/name of the message
     * @param messageData optional payload
     */
    sendMessage(messageType: string, messageData?: any);
}

/**
 * Provides functionality for message exchange with hosting Ibiza portal blade
 */
export class PortalMessagingProvider implements IPortalMessagingProvider {
    /** origin for messages sent to hosting blade */
    private outgoingMessageOrigin: string;

    /** last received message sequence number */
    private lastReceivedMessageSequenceNumber: number;

    /** true if message processing is started */
    private started: boolean;

    /**
     * Initializes an instance of the class. Note: private. Class is a global singleton
     */
    private constructor() {
        // get message origin for outgoing messages
        const queryString = window.location.search; // this will get the query string part including '?'
        const queryStringParams = PortalMessagingProvider.parseQueryString(queryString);

        let trustedAuthority: string = null;

        if (queryStringParams) {
            trustedAuthority = decodeURIComponent(queryStringParams['trustedAuthority']);
        }

        // set message origin for messages sent to framework
        if (trustedAuthority) {
            this.outgoingMessageOrigin = trustedAuthority;
        }

        this.receiveMessage = this.receiveMessage.bind(this);

        this.started = false;
    }

    /**
     * Gets singleton instance
     * @returns instance of the global messaging provider
     */
    public static Instance(): IPortalMessagingProvider {
        if (!globals.messagingProvider) {
            globals.messagingProvider = new PortalMessagingProvider();
        }

        return globals.messagingProvider;
    }

    /**
     * Parses window query string
     * @param queryString window query string
     * @returns dictionary organized by parameter name
     */
    public static parseQueryString(queryString: string): StringMap<string> {
        let queryStringParams: StringMap<string> = {};

        // remove the '?' prefix from query string
        if (queryString && (queryString.length > 1) && (queryString.substring(0, 1) === '?')) {
            queryString = queryString.substr(1, queryString.length - 1);
        }

        const parameters: string[] = queryString.split('&');

        if (parameters && (parameters.length > 0)) {
            for (let i = 0; i < parameters.length; i++) {
                const nameValuePair = parameters[i].split('=');

                if (nameValuePair && (nameValuePair.length === 2)) {
                    queryStringParams[nameValuePair[0]] = nameValuePair[1];
                }
            }
        }

        return queryStringParams;
    }

    /**
     * Starts process of exchanging messages with hosting Ibiza Portal blade
     */
    public startMessaging(frameId?: string): void {
        if (this.started) { return; }

        // add message listener
        window.addEventListener('message', this.receiveMessage, false);

        if (window.parent !== window) {
            // blade load completed - send message ensuring that we can later on
            // resolve telemetry tracking promise and report blade load times
            window.parent.postMessage(
                { kind: 'initializationcomplete', signature: MessageSignature },
                this.outgoingMessageOrigin);

            // tell the shell that iframe is ready to receive messages
            window.parent.postMessage(
                { kind: 'ready', signature: MessageSignature },
                this.outgoingMessageOrigin);

            if (frameId) {
                switch (frameId) {
                    case ContainerInsightsIFrameIds.containerInsightsAtScale:
                        (window as any).containerInsightsAtScale.performanceMeasures['frame_startMessaging'] = Date.now();
                        break;
                    case ContainerInsightsIFrameIds.containerInsights:
                        (window as any).containerInsights.performanceMeasures['frame_startMessaging'] = Date.now();
                        break;
                    default:
                        break;
                }
            }
        }

        this.started = true;
    }

    /**
     * Stops process of exchanging messages with hosting Ibiza Portal blade
     */
    public stopMessaging(): void {
        if (!this.started) { return; }

        window.removeEventListener('message', this.receiveMessage, false);

        this.started = false;
    }

    /**
     * Registers message processor to be invoked for a specified message type
     * @param messageType type/name of the message to listen to
     * @param processorCallback processor to invoke when event arrives
     */
    public registerProcessor(messageType: string, processor: EventListenerOrEventListenerObject, frameId?: string): void {
        if (!messageType) { throw new Error(ParameterNullMessage.replace(ParamNamePlaceholder, 'messageType')); }
        if (!processor) { throw new Error(ParameterNullMessage.replace(ParamNamePlaceholder, 'processor')); }

        window.addEventListener(messageType, processor, false);
        if (frameId) {
            switch (frameId) {
                case ContainerInsightsIFrameIds.containerInsightsAtScale:
                    (window as any).containerInsightsAtScale.performanceMeasures['frame_registerProcessor_' + messageType] = Date.now();
                    break;
                case ContainerInsightsIFrameIds.containerInsights:
                    (window as any).containerInsights.performanceMeasures['frame_registerProcessor_' + messageType] = Date.now();
                    break;
                default:
                    break;
            }
        }
    }

    /**
     * Removes message processor to be invoked for a specified message type
     * @param messageType type/name of the message to listen to
     * @param processorCallback processor to invoke when event arrives
     */
    public unregisterProcessor(messageType: string, processor: EventListenerOrEventListenerObject): void {
        if (!messageType) { throw new Error(ParameterNullMessage.replace(ParamNamePlaceholder, 'messageType')); }
        if (!processor) { throw new Error(ParameterNullMessage.replace(ParamNamePlaceholder, 'processor')); }

        window.removeEventListener(messageType, processor, false);
    }

    /**
     * Sends message to hosting Ibiza Portal blade
     * @param messageType type/name of the message
     * @param messageData optional payload
     */
    public sendMessage(messageType: string, messageData?: any) {
        if (!messageType) { throw new Error(ParameterNullMessage.replace(ParamNamePlaceholder, 'messageType')); }

        if (window.parent !== window) {
            window.parent.postMessage({
                kind: messageType,
                data: messageData,
                signature: MessageSignature,
            }, this.outgoingMessageOrigin);
        }
    }

    /**
     * Callback for receiving messages sent by hosting Ibiza portal blade
     * @param event event sent by `portal`
     */
    private receiveMessage(event: any): void {
        try {
            // it is critical that we only allow trusted messages through.
            // Any domain can send a message event and manipulate the html.
            // it is recommended that you enable the commented out check below
            // to get the portal URL that is loading the extension.
            let eventOrigin: string = event.origin;

            // inbound event must have origin
            if (!eventOrigin) {
                console.error('[messaging-provider] Event received missing origin field. Event ignored');
                return;
            }

            // origin of the event must be one of the pre-defined trusted set
            eventOrigin = eventOrigin.toLowerCase();

            if ((eventOrigin !== TrustedParentOriginPublicCloud) &&
                (eventOrigin !== TrustedParentOriginMooncakeCloud) &&
                (eventOrigin !== TrustedParentOriginFairfaxCloud) &&
                (eventOrigin !== TrustedParentOriginInternal) &&
                (eventOrigin !== TrustedParentDogfoodOrigin) &&
                (eventOrigin !== TrustedParentRcOrigin) &&
                (eventOrigin !== TrustedParentEXOrigin)) {
                console.error('[messaging-provider] Received event origin of [' +
                    eventOrigin + '] does not match any trusted origin. Event ignored. Event: ', event);
                return;
            }

            // ignore events with no payload
            if (!event.data) {
                console.error('[messaging-provider] Received event missing "data" field. Event ignored. Event: ', event);
                return;
            }

            // ignore events with incorrect signatures
            if (event.data.signature !== MessageSignature) {
                console.error('[messaging-provider] Received event with unexpected signature of [' +
                    event.data.signature + ']. Event ignored. Event: ', event);
                return;
            }

            const kind: string = event.data.kind;

            // record last sequence number
            const sequenceNumber: number = event.data.sequenceNumber;

            if (sequenceNumber <= this.lastReceivedMessageSequenceNumber) {
                console.error(
                    'Received event with out of order sequence number of '
                    + '[' + sequenceNumber + ']. '
                    + 'Last recorded sequence number is '
                    + '[' + this.lastReceivedMessageSequenceNumber + ']. Event ignored. Event: ', event);
                return;
            }

            this.lastReceivedMessageSequenceNumber = sequenceNumber;

            // invoke event processors
            let eventToDispatch: any = null;

            if (typeof (Event) === 'function') {
                // for modern browsers
                eventToDispatch = new CustomEvent(kind, { detail: event.data.data });
            } else {
                // old school way for Internet Explorer 11
                eventToDispatch = document.createEvent('CustomEvent');

                const payload = event.data.data ? event.data.data.rawData : null;
                eventToDispatch.initCustomEvent(kind, true, true, { rawData: payload });
            }

            window.dispatchEvent(eventToDispatch);
        } catch (e) {
            console.error('[messaging-provider] receiveMessage() failed to process event. Error: ', e, '. Event: ', event);
            return;
        }
    }
}
