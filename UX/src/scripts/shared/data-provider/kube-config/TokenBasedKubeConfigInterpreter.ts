import {
    BaseKubeConfigInterpreter,
    KubeConfig,
    ServerKey,
    CertificateKey
} from './BaseKubeConfigInterpreter';

export const TokenKey = 'token:'

export class TokenBasedKubeConfigInterpretor extends BaseKubeConfigInterpreter {

    constructor(rawKubeConfig: string) {
        super(rawKubeConfig);
    }

    protected async __internalParseKubeConfig(): Promise<KubeConfig> {
        this.parseKey(TokenKey);

        if (!this.hasRequiredKeys([CertificateKey, ServerKey, TokenKey])) {
            throw `TokenBasedKubeConfigInterpretor was missing a required key`;
        }

        return Promise.resolve({
            certificate: this.getKey(CertificateKey),
            token: this.getKey(TokenKey),
            serverApiAddress: this.getKey(ServerKey)
        });
    }

}
