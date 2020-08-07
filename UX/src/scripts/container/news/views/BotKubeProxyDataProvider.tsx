import * as $ from 'jquery';
import { IKubeConfigDataProvider, KubeConfigDataProvider } from '../../../shared/data-provider/KubeConfigDataProvider';
import { ArmDataProvider } from '../../../shared/data-provider/v2/ArmDataProvider';
import { EnvironmentConfig } from '../../../shared/EnvironmentConfig';
import { InitializationInfo, AuthorizationTokenType } from '../../../shared/InitializationInfo';
import { RetryHttpDataProvider } from '../../../shared/data-provider/v2/RetryHttpDataProvider';
import { RetryPolicyFactory } from '../../../shared/data-provider/RetryPolicyFactory';
import { BladeContext } from '../../BladeContext';
import { RestVerb } from '../../../shared/data-provider/RestVerb';
import { KubeConfigClusterType } from '../../../shared/KubeConfigClusterType';
import { KubeConfigInterpreterFactory } from '../../../shared/data-provider/kube-config/KubeConfigInterpreterFactory';
import { KubeConfigMonextHelper } from '../../../shared/data-provider/kube-config/KubeConfigMonextHelper';

interface IAjaxWrappedResponse {
    textStatus: any;
    jqXHR: any;
    successful: boolean;
    data?: any;
    errorThrown?: any;
}


interface KubeConfigClusterPropertiesResponse {
    apiServer: string;
    token: string;
    certificate: string;
}

export class BotKubeProxyDataProvider  {
    private _kubeConfigDataProvider: IKubeConfigDataProvider = null;

    constructor(private _kubeConfigMonextHelper: KubeConfigMonextHelper) {
        this.clearCache();
    }

    /** Invalidates the cached Kube config */
    public clearCache() {
        this._kubeConfigDataProvider = this.kubeConfigProvider();
    }

    public forceLogoutAAD() {
        this._kubeConfigDataProvider.forceLogoutAd();
        this.clearCache();
    }

    //makes request with directline secret to get token for conversation
    public async getDirectLinetoken(token): Promise<string> {
        const ajaxRequestDescriptor = {
            contentType: 'application/json',
            headers: { Authorization: 'Bearer TdRGYcKcEzc.C61yM7m1raVaE-_QILPJUGi25xEzqM9-BVJ-1kmV1OY' },
            timeout: 10000, 
            type: RestVerb.Post,
            url: 'https://directline.botframework.com/v3/directline/tokens/generate',
            data: {
                User: { Id: token }
            }
        }

        try {
            const ajaxResult = await this.ajaxWrapper(ajaxRequestDescriptor);
            if (!ajaxResult.successful) {
                console.error(`status [${ajaxResult.textStatus}] error [${ajaxResult.errorThrown}]`);
            }
            return ajaxResult.data.token;
        } catch (err) {
            return null;
        }
    }

    //gets kube config data to send to bot for kube api server calls
    //this code is based off of the current state of proxy changes as of the week of 07/27. Goal here is to get apiserver, kube token, and kube certificate if CI proxy is still being used
    public async getKubeConfigAndClusterProperties(): Promise<KubeConfigClusterPropertiesResponse> {
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
            let aksProxyInstalled = await this.aksProxyCheck(generatedUri, kubeConfig.token);
            let apiServer = generatedUri;
            let token = kubeConfig.token;
            let certificate = null;
            if (!aksProxyInstalled) {
                apiServer = kubeConfig.serverApiAddress;
                certificate = kubeConfig.certificate;
            }

            return { apiServer, token, certificate }
        } catch (error) {
            console.error('KubernetesProxyDataProviderWrapper.getKubeConfigAndClusterProperties', error);
            return null;
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
        if (predicatedProxyUrl === null) {
            return false;
        }

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
                return false;
            }
            return true;
        } catch (err) {
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
            return null;
        }
    }

    
}
