export interface KubeConfig {
    serverApiAddress: string;
    token: string;
    certificate: string;
}

export const ServerKey = 'server:';
export const CertificateKey = 'certificate-authority-data:';

/** 
 * Provides some basic functionality for parsing the structure of a Kube config 
 * Leaves the implementation of parsing the Kube config for application use up to dedicated interpreters for particular cluster types
 */
export abstract class BaseKubeConfigInterpreter {
    private _propertiesBag: StringMap<string> = {};
    private _splitKubeConfig: string[];

    constructor(rawKubeConfig: string) {
        this._splitKubeConfig = rawKubeConfig.split('\n'); // spits the Kube config by line
    }

    /** 
     * Parses the server address and certificate data from the Kube config 
     * Then passes of the final interpretation of the Kube config to dedicated interpreters for particular cluster types
     */
    public async parseKubeConfig(): Promise<KubeConfig> {
        this.parseKey(ServerKey);
        this.parseKey(CertificateKey);
        return await this.__internalParseKubeConfig();
    }

    /**
     * Parses the server property on the Kube config
     * @param key 
     */
    protected parseKey(key: string): void {
        const matches: string[] = this._splitKubeConfig.filter((str) => {
            return str.indexOf(key) > -1;
        });
        if (matches.length < 1) { throw `BaseKubeConfigInterpreter expected key ${key} not found`; }

        const matchedRow = matches[0];
        const keyValueSplit = matchedRow.split(': ');
        if (keyValueSplit.length !== 2) { throw `BaseKubeConfigInterpreter found row but unexpected layout ${matches[0]}`; }

        this._propertiesBag[key] = keyValueSplit[1];
    }

    /**
     * Parses the certificate-authority-data property on the Kube config
     * @param key 
     */
    protected getKey(key: string): string {
        if (!this._propertiesBag.hasOwnProperty(key)) {
            throw `BaseKubeConfigInterpreter getKey not found ${key}`;
        }
        return this._propertiesBag[key];
    }

    /**
     * Checks if all the keys have been parsed and cached 
     * @param keys 
     */
    protected hasRequiredKeys(keys: string[]): boolean {
        return keys.filter((key) => {
            return !this._propertiesBag.hasOwnProperty(key);
        }).length === 0;
    }

    protected abstract async __internalParseKubeConfig(): Promise<KubeConfig>;
}
