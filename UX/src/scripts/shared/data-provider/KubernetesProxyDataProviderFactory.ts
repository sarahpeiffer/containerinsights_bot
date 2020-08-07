import * as $ from 'jquery';
import { AKSKubernetesProxyDataProvider } from './AKSKubernetesProxyDataProvider';
import { CIKubernetesProxyDataProvider } from './CIKubernetesProxyDataProvider';
import { IKubernetesDataProvider } from './IKubernetesDataProvider';
import { IKubeConfigDataProvider, KubeConfigDataProvider } from './KubeConfigDataProvider';
import { ArmDataProvider } from './v2/ArmDataProvider';
import { EnvironmentConfig } from '../EnvironmentConfig';
import { InitializationInfo, AuthorizationTokenType } from '../InitializationInfo';
import { RetryHttpDataProvider } from './v2/RetryHttpDataProvider';
import { RetryPolicyFactory } from './RetryPolicyFactory';
import { BladeContext } from '../../container/BladeContext';
import { RestVerb } from './RestVerb';
import { TelemetryFactory } from '../TelemetryFactory';
import { ITelemetry, TelemetryMainArea } from '../Telemetry';
import * as TelemetryStrings from '../TelemetryStrings';
import { DeferredPromise } from '../DeferredPromise';
import { ErrorSeverity } from './TelemetryErrorSeverity';
import { globals } from '../globals/globals';
import { BaseBuilder } from '../BaseBuilder';
import { KubeConfigClusterType } from '../KubeConfigClusterType';
import { KubeConfigInterpreterFactory } from './kube-config/KubeConfigInterpreterFactory';
import { KubeConfigMonextHelper } from './kube-config/KubeConfigMonextHelper';
import { KubeConfig } from './kube-config/BaseKubeConfigInterpreter';

interface IAjaxWrappedResponse {
    textStatus: any;
    jqXHR: any;
    successful: boolean;
    data?: any;
    errorThrown?: any;
}

enum RequiredParemeters {
    ProxyRegionCode = 'ProxyRegionCode'
}

//token, clusterType, generatedUri, kubeConfig, successful: true, error: null
interface KubeConfigClusterPropertiesResponse {
    clusterType: KubeConfigClusterType;
    generatedUri: string;
    kubeConfig: KubeConfig;
    successful: boolean;
    error: any;
}


/**
 * This class is a singleton because different instances should never be configured to use different kubernetes proxy data providers
 */
export class KubernetesProxyDataProviderFactory extends BaseBuilder {
    private _kubeConfigDataProvider: IKubeConfigDataProvider = null;
    private _kubernetesProxyDataProvider: IKubernetesDataProvider = null;
    private _kubernetesProxyRegionCode: string;
    private _telemetry: ITelemetry;
    private _deferredGetProvider: DeferredPromise<IKubernetesDataProvider> = null;

    constructor(private _kubeConfigMonextHelper: KubeConfigMonextHelper) {
        super([RequiredParemeters.ProxyRegionCode], 'KubernetesProxyDataProviderFactory');

        this._telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);

        this.clearCache();
    }

    /** Retrives the factory singleton */
    public static Instance(): KubernetesProxyDataProviderFactory {
        if (!globals.kubernetesProxyProviderFactory) { // Init required first
            throw 'KubernetesProxyDataProviderWrapper INIT not yet invoked';
        }

        globals.kubernetesProxyProviderFactory.throwObjectValid(); // Check that the instance has been initialized correctly

        return globals.kubernetesProxyProviderFactory;
    }

    public static Init(): KubernetesProxyDataProviderFactory {
        if (!!globals.kubernetesProxyProviderFactory) {
            throw 'KubernetesProxyDataProviderWrapper is already initialized';
        }
        globals.kubernetesProxyProviderFactory = new KubernetesProxyDataProviderFactory(KubeConfigMonextHelper.Instance());
        return globals.kubernetesProxyProviderFactory;
    }

    public withProxyRegionCode(regionCode: string): KubernetesProxyDataProviderFactory {
        this.resolveParameter(RequiredParemeters.ProxyRegionCode);
        this._kubernetesProxyRegionCode = regionCode;
        return this;
    }

    /** Invalidates the cached Kube config */
    public clearCache() {
        this._kubeConfigDataProvider = this.kubeConfigProvider();
        this._kubernetesProxyDataProvider = null;
    }

    public forceLogoutAAD() {
        this._kubeConfigDataProvider.forceLogoutAd();
        this.clearCache();
    }

    public getKubernetesProxyDataProvider(): Promise<IKubernetesDataProvider> {

        // bbax: STAGE STATE DONE... loading is complete
        if (!!this._kubernetesProxyDataProvider) {
            return Promise.resolve(this._kubernetesProxyDataProvider);
        }

        // bbax: STAGE STATE LOADING... loading is in progress
        if (!!this._deferredGetProvider) { return this._deferredGetProvider.promise(); }

        // bbax: STAGE STATE INITIALIZATION... we need to initialize and do some network requests
        this._deferredGetProvider = new DeferredPromise();

        // bbax: this is technically a promise you can subscribe too and it resolves when the _deferredGetProvider promise
        // resolves... theres really no reason to listen to that promise, but async / await means we get that promise regardless
        this.__internalGetKubernetesProxyDataProvider();

        return this._deferredGetProvider.promise();
    }

    private async __internalGetKubernetesProxyDataProvider(): Promise<void> {
        const { kubeConfig, generatedUri, clusterType, successful, error } = await this.getKubeConfigAndClusterProperties();
        if (!successful) {
            console.error('basic live feature data not available', error);
            this._telemetry.logException(error, 'KubernetesProxyDataProviderWrapper.getKubernetesProxyDataProvider',
                ErrorSeverity.Fatal, null, null);

            this._deferredGetProvider.reject('basic live feature data not available');
            this._deferredGetProvider = null;
            return;
        }

        try {
            let aksProxyInstalled = await this.aksProxyCheck(generatedUri, kubeConfig.token);

            // bbax: TODO: this is an exception for now for backwards compat... remove unmanaged at some point before
            // we decomission our proxy
            if (!aksProxyInstalled || clusterType === KubeConfigClusterType.AksAADUnmanaged) {
                console.log(`proxy instance established Kind [CI] AAD [V1 or Non-AAD]`);
                this._telemetry.logEvent(TelemetryStrings.KubeApiProxyKind, { kind: TelemetryStrings.CiKubeApiProxy }, null);

                this._kubernetesProxyDataProvider = new CIKubernetesProxyDataProvider(this._kubernetesProxyRegionCode)
                    .withBearer(kubeConfig.token)
                    .withApiAddress(kubeConfig.serverApiAddress)
                    .withCertificate(kubeConfig.certificate);
            } else {
                console.log(`proxy instance established Kind [AKS] AAD [${clusterType}]`);
                this._telemetry.logEvent(TelemetryStrings.KubeApiProxyKind, { kind: TelemetryStrings.AksKubeApiProxy }, null);
                this._kubernetesProxyDataProvider = new AKSKubernetesProxyDataProvider()
                    .withBearer(kubeConfig.token)
                    .withApiAddress(generatedUri);

            }

            this._deferredGetProvider.resolve(this._kubernetesProxyDataProvider);
            this._deferredGetProvider = null;
            return;
        } catch (error) {
            console.error('setting CI proxy catchall', error);
            this._telemetry.logException(error, 'KubernetesProxyDataProviderWrapper.getKubernetesProxyDataProvider',
                ErrorSeverity.Fatal, null, null);

            this._kubernetesProxyDataProvider = new CIKubernetesProxyDataProvider(this._kubernetesProxyRegionCode)
                .withBearer(kubeConfig.token)
                .withApiAddress(kubeConfig.serverApiAddress)
                .withCertificate(kubeConfig.certificate);

            this._deferredGetProvider.resolve(this._kubernetesProxyDataProvider);
            this._deferredGetProvider = null;
            return;
        }
    }

    private async getKubeConfigAndClusterProperties(): Promise<KubeConfigClusterPropertiesResponse> {
        try {
            const cluster = BladeContext.instance().cluster;

            const clusterProperties = await this._kubeConfigMonextHelper.getClusterProperties();
            if (!clusterProperties) { throw 'getKubeConfigAndClusterProperties missing clusterProperties'; }

            let clusterType = KubeConfigClusterType.AksNonAAD;
            if (!!clusterProperties.aadProfile) {
                if (!clusterProperties.aadProfile.managed) {
                    clusterType = KubeConfigClusterType.AksAADUnmanaged;
                } else {
                    clusterType = KubeConfigClusterType.AksAADManaged;
                }
            }

            const kubeConfig = await this._kubeConfigDataProvider.getKubeConfig(
                cluster.subscriptionId,
                cluster.resourceGroupName,
                cluster.resourceName,
                clusterType);

            if (!kubeConfig) { throw 'getKubeConfigAndClusterProperties missing kubeConfig'; }

            const generatedUri = this.getAKSProxyServerAddress(kubeConfig.serverApiAddress);

            return { clusterType, generatedUri, kubeConfig, successful: true, error: null }
        } catch (error) {
            console.error('KubernetesProxyDataProviderWrapper.getKubeConfigAndClusterProperties', error);
            this._telemetry.logException(error, 'KubernetesProxyDataProviderWrapper.getKubeConfigAndClusterProperties',
                ErrorSeverity.Fatal, null, null);

            return {
                kubeConfig: null, clusterType: KubeConfigClusterType.Unknown,
                generatedUri: null, successful: false, error
            }
        }
    }

    private kubeConfigProvider(): IKubeConfigDataProvider {
        const armDataProvider = new ArmDataProvider(
            EnvironmentConfig.Instance().getARMEndpoint(),
            () => { return InitializationInfo.getInstance().getAuthorizationHeaderValue(AuthorizationTokenType.Arm); },
            new RetryHttpDataProvider(new RetryPolicyFactory()));

        return new KubeConfigDataProvider(armDataProvider, new KubeConfigInterpreterFactory());
    }

    

    private async aksProxyCheck(predicatedProxyUrl: string, token: string): Promise<boolean> {
        const aksProxyCheckQueryTelemetry = this._telemetry.startLogEvent(TelemetryStrings.AksProxyCheckQueryTelemetry, null, null);

        if (predicatedProxyUrl === null) {
            return false;
        }

        // bbax: TODO: will this even work if cluster monitoring user doesn't exist in AAD scenarios?? assuming kubeconfig doesn't contain
        // a token will this crash?? right now AKS team embeds the Cluster Monitoring Users everywhere
        const ajaxRequestDescriptor = {
            contentType: 'application/json',
            headers: { Authorization: 'Bearer ' + token },
            timeout: 10000, // bbax: i couldn't get this field to work in other parts of the code, we should test this...
            type: RestVerb.Get,
            url: `${predicatedProxyUrl}/api`,
        }

        try {
            const ajaxResult = await this.ajaxWrapper(ajaxRequestDescriptor);
            if (!ajaxResult.successful) {
                console.error(`status [${ajaxResult.textStatus}] error [${ajaxResult.errorThrown}]`);
                aksProxyCheckQueryTelemetry.fail(`status [${ajaxResult.textStatus}] error [${ajaxResult.errorThrown}]`);
                return false;
            }
            aksProxyCheckQueryTelemetry.complete();
            return true;
        } catch (err) {
            aksProxyCheckQueryTelemetry.fail(err);
            return false;
        }
    }

    private async ajaxWrapper(ajaxRequestDescriptor): Promise<IAjaxWrappedResponse> {
        return new Promise<any>((resolve) => {
            $.ajax(ajaxRequestDescriptor)
                .done((data, textStatus, jqXHR) => {
                    resolve({ data, textStatus, jqXHR, successful: true });
                })
                .fail((jqXHR, textStatus, errorThrown) => {
                    resolve({ jqXHR, textStatus, errorThrown, successful: false });
                });
        });
    }

    

    /**
     * Returns the address of the AKS proxy server
     * generates the appropriate portal FQDN given a control plane's apiserver FQDN.
     * Portal FQDNs follow the pattern "{apiserver hostname}.portal.{apiserver domain}".
     */
    private getAKSProxyServerAddress(apiServerAddress): string {
        try {
            const chunks = apiServerAddress.split(':', 2).join(':').split('.');
            return `${chunks[0]}.portal.${chunks.slice(1).join('.')}`;
        } catch (err) {
            this._telemetry.logException(err, 'KubernetesProxyDataProviderWrapper.getAKSProxyServerAddress',
                ErrorSeverity.Error, null, null);
            return null;
        }
    }
}
