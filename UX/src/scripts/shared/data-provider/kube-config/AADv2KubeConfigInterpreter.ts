import {
    BaseKubeConfigInterpreter,
    KubeConfig,
    ServerKey,
    CertificateKey
} from './BaseKubeConfigInterpreter';
import { KubeConfigMonextHelper } from './KubeConfigMonextHelper';

export class AADv2KubeConfigInterpreter extends BaseKubeConfigInterpreter {
    constructor(rawKubeConfig: string) {
        super(rawKubeConfig);
    }

    /** 
     * AADv2 specific parser for the Kube config
     * AADv2 token required for talking to the AKS proxy to talk to the Kube API Server
     */
    protected async __internalParseKubeConfig(): Promise<KubeConfig> {
        if (!this.hasRequiredKeys([CertificateKey, ServerKey])) {
            throw `TokenBasedKubeConfigInterpreter was missing a required key`;
        }

        const token = await KubeConfigMonextHelper.Instance().getUnwrappedAADV2Token();
        return {
            certificate: this.getKey(CertificateKey),
            token,
            serverApiAddress: this.getKey(ServerKey)
        };
    }

}
