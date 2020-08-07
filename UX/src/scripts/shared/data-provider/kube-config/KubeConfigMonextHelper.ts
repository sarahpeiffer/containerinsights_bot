import { ITelemetry } from '../../Telemetry';
import { globals } from '../../globals/globals';
import { BaseBuilder } from '../../BaseBuilder';
import { PortalMessagingProvider } from '../../messaging/v2/PortalMessagingProvider';
import { DeferredPromise } from '../../DeferredPromise';
import * as TelemetryStrings from '../../TelemetryStrings'

const RequiredTelemetryString = 'Telemetry';

/**
 * Helper for the Kube config data provider.
 * In order for the 
 */
export class KubeConfigMonextHelper extends BaseBuilder {
    private _telemetry: ITelemetry;
    private _deferredClusterProperties: DeferredPromise<any> = null;
    private _deferredAuthorizationToken: DeferredPromise<any> = null;

    constructor() {
        super([RequiredTelemetryString], 'KubeConfigMonextHelper');

        this.handleClusterPropertiesEvent = this.handleClusterPropertiesEvent.bind(this);
        this.handleAksProxyAuthorizationTokenEvent = this.handleAksProxyAuthorizationTokenEvent.bind(this);
    }

    /** Retrieves the singleton of this class */
    public static Instance(): KubeConfigMonextHelper {
        if (!globals.kubeConfigMonextHelperInstance) { // Init required first
            throw 'KubeConfigMonextHelper INIT not yet invoked';
        }

        globals.kubeConfigMonextHelperInstance.throwObjectValid(); // Check that the instance has been initialized correctly

        return globals.kubeConfigMonextHelperInstance;
    }

    /** Initializes the class singleton */
    public static Init(): KubeConfigMonextHelper {
        if (!!globals.kubeConfigMonextHelperInstance) {
            throw 'KubeConfigMonextHelper is already initialized';
        }
        
        globals.kubeConfigMonextHelperInstance = new KubeConfigMonextHelper();
        return globals.kubeConfigMonextHelperInstance;
    }

    /** Sets the telemetry provider for the class singleton */
    public withTelemetry(telemetry) {
        this._telemetry = telemetry;
        this.resolveParameter(RequiredTelemetryString);
        return this;
    }

    /** Asks the portal to fetch the cluster properties and return them to the iframe */
    public async getClusterProperties(): Promise<any> {
        if (!!this._deferredClusterProperties) { return this._deferredClusterProperties.promise(); }

        this._deferredClusterProperties = new DeferredPromise().withTimeout(10000, '[getClusterProperties] took too long to respond');
        try {
            const result = await this.makePortalMessagingProviderRequest('getClusterProperties', this._deferredClusterProperties,
                TelemetryStrings.GetClusterPropertiesQueryTelemetry);

            this._deferredClusterProperties = null;
            return result;
        } catch (err) {
            this._deferredClusterProperties = null;
            throw (err);
        }
    }

    /** 
     * Asks the portal to get the AADv2 token and return it to the iframe.
     * The token is used to authenticate with the AKS proxy, which routes requests to the Kube API server.
     * Before the token is returned, Bearer is stripped from the token string
     */
    public async getUnwrappedAADV2Token(): Promise<string> {
        const authorizationToken = await this.getAksProxyAuthorizationToken();

        let parsedAuthorizationToken = null;
        if (authorizationToken) {
            try {
                parsedAuthorizationToken = authorizationToken.split(' ')[1]; // Gets rid of Bearer
            } catch {
                throw new Error('[getKubernetesProxyDataProvider] unexpected aksproxy authorization token');
            }
        }

        return parsedAuthorizationToken;
    }

    /** Messaging event listener for the cluster properties event */
    public handleClusterPropertiesEvent(propertiesEvent) {
        this.handleGenericPortalMessage(propertiesEvent, this._deferredClusterProperties, 'handleClusterPropertiesEvent');
    }

    /** Messaging event listener for the aks proxy authorization token event */
    public handleAksProxyAuthorizationTokenEvent(tokenEvent) {
        this.handleGenericPortalMessage(tokenEvent, this._deferredAuthorizationToken, 'handleAksProxyAuthorizationTokenEvent');
    }

    /** Asks the portal to get the AADv2 token and return it to the iframe. Implementation */
    private async getAksProxyAuthorizationToken(): Promise<any> {
        if (!!this._deferredAuthorizationToken) { return this._deferredAuthorizationToken.promise(); }

        this._deferredAuthorizationToken = new DeferredPromise().withTimeout(10000, '[getAksProxyAuthorizationToken] took too long to respond');
        try {
            const result = await this.makePortalMessagingProviderRequest('getAksProxyAuthorizationToken', this._deferredAuthorizationToken,
                TelemetryStrings.GetAksProxyAuthorizationToken);

            this._deferredAuthorizationToken = null;
            return result;
        } catch (err) {
            this._deferredAuthorizationToken = null;
            throw (err);
        }
    }

    /** Makes a asynchronous request from the portal and logs the response time in telemetry */
    private async makePortalMessagingProviderRequest(portalMessage: string, deferredPromise: DeferredPromise<any>, telemetryKey: string, ) {
        const measuredTelemetry = this._telemetry.startLogEvent(telemetryKey, null, null);
        try {
            PortalMessagingProvider.Instance().sendMessage(portalMessage);
            const result = await deferredPromise.promise();
            measuredTelemetry.complete();
            return result;
        } catch (err) {
            measuredTelemetry.fail(err);
            throw (err);
        }
    }

    /** 
     * Generic implementation for handling the response from asnychronous requests made to the portal.
     * Unwraps the portal response.
     */
    private handleGenericPortalMessage(portalEvent: any, deferredPromise: DeferredPromise<any>, handledBy: string) {
        if (!deferredPromise) {
            throw `[${handledBy}] unexpected promise state`;
        }

        try {
            if (portalEvent && portalEvent.detail && portalEvent.detail.rawData) {
                deferredPromise.resolve(JSON.parse(portalEvent.detail.rawData));
            } else {
                deferredPromise.reject(`[${handledBy}] unexpected tokenEvent object: ${JSON.stringify(portalEvent)}`);
            }
        } catch (err) {
            deferredPromise.reject(err);
        }
    }
}
