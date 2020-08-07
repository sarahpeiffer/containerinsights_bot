import {
    BaseKubeConfigInterpreter,
    KubeConfig,
    ServerKey,
    CertificateKey
} from './BaseKubeConfigInterpreter';
import { IADProvider } from '../AzureADProvider';

export const TenantId: string = 'tenant-id:';
export const ClientId: string = 'client-id:';

/**
 * Kube config interpretor for AADv1
 */
export class AADv1KubeConfigInterpretor extends BaseKubeConfigInterpreter {
    constructor(rawKubeConfig: string, private _adProvider: IADProvider) {
        super(rawKubeConfig);
    }

    protected async __internalParseKubeConfig(): Promise<KubeConfig> {

        this.parseKey(TenantId);
        this.parseKey(ClientId);

        if (!this.hasRequiredKeys([CertificateKey, ServerKey, TenantId, ClientId])) {
            throw `TokenBasedKubeConfigInterpretor was missing a required key`;
        }

        const token = await this.aquireADToken(this.getKey(ClientId), this.getKey(TenantId));
        return {
            certificate: this.getKey(CertificateKey),
            token,
            serverApiAddress: this.getKey(ServerKey)
        };
    }

    private async aquireADToken(clientId: string, tenantId: string): Promise<string> {

        if (this._adProvider.isLoggedIn()) {
            return await this._adProvider.getToken();
        } else {
            this._adProvider.asTenant(tenantId).forClient(clientId).configure();
            return await this._adProvider.login();
        }
    }

}
