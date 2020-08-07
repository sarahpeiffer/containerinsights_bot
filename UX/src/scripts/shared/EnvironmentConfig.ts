import { globals } from './globals/globals';

/** clone of enum by the same name in MonEx because MonEx sends this value to our iframe via messagingProvider */
export enum AzureCloudType {
    NonPublic = 1,
    Public = 2,
    Blackforest = 3,
    Fairfax = 4,
    Mooncake = 5,
    USNat = 6
}

export interface IEnvironmentConfig {
    initConfig(azureCloudType: AzureCloudType, isMpac: boolean, authRedirectUrl?: string): void;
    isConfigured(): boolean;
    getAuthRedirectUrl(): string;
    getARMEndpoint(): string;
    getGraphEndpoint(): string;
    getDraftEndpoint(): string;
    getDraftBatchEndpoint(): string;
    getEnvironmentName(): string;
    isPublic(): boolean;
    isMooncake(): boolean;
    isFairfax(): boolean;
    isBlackforest(): boolean;
    isLiveDataEnabledEnvironment(): boolean;
    isMPAC(): boolean;
    isMPACLegacy(): boolean;
    isLocalhost(): boolean;
    getLearnMoreUrl(page: ContainerInsightsPage, isAKS?: boolean): string;
    getForumsUrl(): string;
}

/** Enumerates the different pages/views for Container Insights */
export enum ContainerInsightsPage {
    SingleCluster,
    Multicluster
}

/**
 * Provides functionality to get various environment properties and settings
 */
export class EnvironmentConfig implements IEnvironmentConfig {
    private isInitialized: boolean;
    private azureCloudType: AzureCloudType;
    private authRedirectUrl: string;
    private isMpac: boolean;

    constructor() {
        this.initConfig = this.initConfig.bind(this);
    }

    /**
     * Gets singleton instance
     * @returns instance of the global environment config class
     */
    public static Instance(): IEnvironmentConfig {
        if (!globals.environmentConfigInstance) {
            globals.environmentConfigInstance = new EnvironmentConfig();
        }

        return globals.environmentConfigInstance;
    }

    /** 
     * Performs the initial configuration of the environment config singleton. 
     * Configures for the environment config the Azure cloud type.
    */
    public initConfig(azureCloudType: AzureCloudType, isMpac: boolean, authRedirectUrl?: string): void {
        if (!this.isConfigured()) {
            // nibs: We want to be able to configure our env config even if MonEx isn't passing us what cloud we're in
            this.azureCloudType = azureCloudType ? azureCloudType : AzureCloudType.Public;
            this.isInitialized = true;
            this.authRedirectUrl = authRedirectUrl;
            this.isMpac = isMpac;
        } else {
            throw new Error('EnvironmentConfig cannot be initialized more than once');
        }
    }

    /** Checks if the EnvironmentConfig class has been initialized, i.e. told what cloud the iframe is in */
    public isConfigured() {
        return this.isInitialized;
    }

    /**
     * get the auth redirect url required for aad login token passback
     */
    public getAuthRedirectUrl(): string {
        if (!this.isConfigured() || !this.authRedirectUrl) {
            throw new Error('EnvironmentConfig cannot determine the ARM endpoint without previously being configured');
        }

        return this.authRedirectUrl;
    }

    /** Arm api endpoint */
    public getARMEndpoint(): string {
        if (!this.isConfigured()) {
            throw new Error('EnvironmentConfig cannot determine the ARM endpoint without previously being configured');
        }

        switch (this.getAzureCloudType()) {
            case AzureCloudType.Public:
                return 'https://management.azure.com/';
            case AzureCloudType.Mooncake:
                return 'https://management.chinacloudapi.cn/';
            case AzureCloudType.Fairfax:
                // https://docs.microsoft.com/en-us/azure/azure-government/documentation-government-developer-guide#endpoint-mapping
                return 'https://management.usgovcloudapi.net/';
            case AzureCloudType.Blackforest:
                // https://docs.microsoft.com/en-us/azure/germany/germany-developer-guide
                return 'https://management.microsoftazure.de/';
            case AzureCloudType.USNat:
                return 'https://management.azure.eaglex.ic.gov/';
            default:
                throw new Error('No supported cloud environment was specified');
        }
        //return 'https://api-dogfood.resources.windows-int.net';
    }

    /**Graph api endpoint */
    public getGraphEndpoint(): string {
        if (!this.isConfigured()) {
            throw new Error('EnvironmentConfig cannot determine the Graph endpoint without previously being configured');
        }

        switch (this.getAzureCloudType()) {
            case AzureCloudType.Public:
                return 'https://graph.windows.net';
            case AzureCloudType.Mooncake:
                return 'https://graph.chinacloudapi.cn';
            case AzureCloudType.Fairfax:
                // https://docs.microsoft.com/en-us/azure/azure-government/documentation-government-developer-guide#endpoint-mapping
                return 'https://graph.microsoft.us';
            case AzureCloudType.Blackforest:
                // https://docs.microsoft.com/en-us/azure/germany/germany-developer-guide
                return 'https://graph.cloudapi.de';
            case AzureCloudType.USNat:
                return 'https://graph.eaglex.ic.gov';
            default:
                throw new Error('No supported cloud environment was specified');
        }
    }

    /** Draft api endpoint */
    public getDraftEndpoint(): string {
        if (!this.isConfigured()) {
            throw new Error('EnvironmentConfig cannot determine the Draft endpoint without previously being configured');
        }

        switch (this.getAzureCloudType()) {
            case AzureCloudType.Public:
                return 'https://api.loganalytics.io';
            case AzureCloudType.Mooncake:
                return 'https://api.loganalytics.azure.cn';
            case AzureCloudType.Fairfax:
                return 'https://api.loganalytics.us';
            case AzureCloudType.Blackforest:
                return 'waiting for LA to onboard to Blackforest...';
            case AzureCloudType.USNat:
                return 'https://api.loganalytics.azure.eaglex.ic.gov';
            default:
                throw new Error('No supported cloud environment was specified');
        }
    }

    /** Draft api batch query endpoint */
    public getDraftBatchEndpoint(): string {
        if (!this.isConfigured()) {
            throw new Error('EnvironmentConfig cannot determine the Draft batch endpoint without previously being configured');
        }

        switch (this.getAzureCloudType()) {
            case AzureCloudType.Public:
                return 'https://api.loganalytics.io/v1/$batch';
            case AzureCloudType.Mooncake:
                return 'https://api.loganalytics.azure.cn/v1/$batch';
            case AzureCloudType.Fairfax:
                return 'https://api.loganalytics.us/v1/$batch';
            case AzureCloudType.Blackforest:
                return 'waiting for LA to onboard to Blackforest...';
            case AzureCloudType.USNat:
                return 'https://api.loganalytics.azure.eaglex.ic.gov/v1/$batch';
            default:
                throw new Error('No supported cloud environment was specified');
        }
    }

    /** Environment name prod/dogfood/localhost to telemetry, etc */
    public getEnvironmentName(): string {
        if (!this.isConfigured()) {
            throw new Error('EnvironmentConfig cannot determine the environment name without previously being configured');
        }

        let envName = null;

        if (this.isPublic()) {
            envName = 'prod';
        } else if (this.isMooncake()) {
            envName = 'mooncake';
        } else if (this.isFairfax()) {
            envName = 'fairfax';
        } else if (this.isBlackforest()) {
            envName = 'blackforest';
        } else if (this.isUSNat()) {
            envName = 'usnat';
        } else if (this.isLocalhost()) {
            envName = 'localhost';
        }

        // provide hostname in env name in case we failed to 
        // understand which well-known origin we load from
        if (!envName) {
            envName = 'unknown-' + this.getHostname();
        }

        return envName;
    }

    public isMPACLegacy(): boolean {
        return this.hostnameContainsString('inindogfooduxbase.blob.core.windows.net');
    }

    /** Returns whether the current environment is MPAC */
    public isMPAC(): boolean {
        if (!this.isConfigured()) {
            throw new Error('EnvironmentConfig cannot check if the environment is MPAC without previously being configured');
        }

        return this.isMpac;
    }

    public isLiveDataEnabledEnvironment(): boolean {
        return this.isFairfax() || this.isMooncake() || this.isPublic() || this.isMPAC() || this.isLocalhost();
    }

    /** Returns whether the current environment is Localhost */
    public isLocalhost(): boolean {
        if (!this.isConfigured()) {
            throw new Error('EnvironmentConfig cannot determine if the environment is localhost without previously being configured');
        }

        return this.hostnameContainsString('localhost');
    }

    /** Returns whether the current environment is PROD */
    public isPublic(): boolean {
        if (!this.isConfigured()) {
            throw new Error('EnvironmentConfig cannot determine if the environment is Prod without previously being configured');
        }

        return (this.azureCloudType && this.azureCloudType === AzureCloudType.Public) ||
            this.hostnameContainsString('monitoring.hosting.portal.azure.net');
    }

    /** Returns whether the current environment is Mooncake */
    public isMooncake(): boolean {
        if (!this.isConfigured()) {
            throw new Error('EnvironmentConfig cannot determine if the environment is Mooncake without previously being configured');
        }

        // Mooncake hostname will change once China CDN is up
        return (this.azureCloudType && this.azureCloudType === AzureCloudType.Mooncake) ||
            this.hostnameContainsString('monitoring.hosting.azureportal.chinacloudapi.cn');
    }

    /** Returns whether the current environment is Fairfax */
    public isFairfax(): boolean {
        if (!this.isConfigured()) {
            throw new Error('EnvironmentConfig cannot determine if the environment is Fairfax without previously being configured');
        }

        return (this.azureCloudType && this.azureCloudType === AzureCloudType.Fairfax) ||
            this.hostnameContainsString('monitoring.hosting.azureportal.usgovcloudapi.net');
    }

    /** Returns whether the current environment is Blackforest */
    public isBlackforest(): boolean {
        if (!this.isConfigured()) {
            throw new Error('EnvironmentConfig cannot determine if the environment is Blackforest without previously being configured');
        }

        return (this.azureCloudType && this.azureCloudType === AzureCloudType.Blackforest) ||
            this.hostnameContainsString('monitoring.hosting.azure-api.de');
    }

    /** Returns whether the current environment is USNat */
    public isUSNat(): boolean {
        if (!this.isConfigured()) {
            throw new Error('EnvironmentConfig cannot determine if the environment is USNat without previously being configured');
        }

        return (this.azureCloudType && this.azureCloudType === AzureCloudType.USNat) ||
            this.hostnameContainsString('monitoring.hosting.portal.cloudapi.eaglex.ic.gov');
    }

    /**
     * Returns the URL to be used for the learn more link on the single and multicluster page
     * @param page learn more URL changes depending on the Container Insights page the link is on
     * @param isAKS true if the cluster being represented on the singlue cluster page is an AKS cluster
     */
    public getLearnMoreUrl(page: ContainerInsightsPage, isAKS?: boolean): string {
        let learnMoreUrl: string;
        if (page === ContainerInsightsPage.SingleCluster) {
            if (isAKS) {
                learnMoreUrl = 'https://aka.ms/ci-perf';
                if (EnvironmentConfig.Instance().isConfigured() && EnvironmentConfig.Instance().isMooncake()) {
                    learnMoreUrl = 'https://aka.ms/mc-ci-perf';
                } else if (EnvironmentConfig.Instance().isConfigured() && EnvironmentConfig.Instance().isFairfax()) {
                    learnMoreUrl = 'https://aka.ms/ci-perf';
                }
            } else {
                learnMoreUrl = 'https://aka.ms/ci-perf-acs-engine';
                if (EnvironmentConfig.Instance().isConfigured() && EnvironmentConfig.Instance().isMooncake()) {
                    learnMoreUrl = 'https://aka.ms/mc-ci-perf-acs-engine';
                } else if (EnvironmentConfig.Instance().isConfigured() && EnvironmentConfig.Instance().isFairfax()) {
                    learnMoreUrl = 'https://aka.ms/ci-perf-acs-engine';
                }
            }
        } else {
            learnMoreUrl = 'https://aka.ms/ci-multicluster';
            if (EnvironmentConfig.Instance().isConfigured() && EnvironmentConfig.Instance().isMooncake()) {
                learnMoreUrl = 'https://aka.ms/mc-ci-multicluster';
            } else if (EnvironmentConfig.Instance().isConfigured() && EnvironmentConfig.Instance().isFairfax()) {
                learnMoreUrl = 'https://aka.ms/ci-multicluster';
            }
        }

        return learnMoreUrl;
    }

    /**
     * Returns the URL to be used for the forums link on the single and multicluster page
     */
    public getForumsUrl(): string {
        let forumsUrl: string = 'https://aka.ms/ci-forums';
        if (EnvironmentConfig.Instance().isConfigured() && EnvironmentConfig.Instance().isMooncake()) {
            forumsUrl = 'https://aka.ms/mc-ci-forums';
        } else if (EnvironmentConfig.Instance().isConfigured() && EnvironmentConfig.Instance().isFairfax()) {
            forumsUrl = 'https://aka.ms/ci-forums';
        }
        return forumsUrl;
    }

    /**
     * Returns whether window.location.hostname contains the inputted string
     * @param str The string to check against the window location
     */
    private hostnameContainsString(str: string) {
        const hostname = this.getHostname();

        if (hostname && (hostname.toLocaleLowerCase().indexOf(str) > -1)) {
            return true;
        }

        return false;
    }

    /** Provides hostname of the host from which the script was loaded */
    private getHostname(): string {
        // see if window hostname is defined
        if (window && window.location && window.location.hostname) {
            return window.location.hostname;
        }

        // see if we're in web worker that does not have window.location
        // but rather has a special property providing main thread's location
        const untypedWindow = window as any;

        if (untypedWindow && untypedWindow.mainThreadLocation && untypedWindow.mainThreadLocation.hostname) {
            return untypedWindow.mainThreadLocation.hostname;
        }

        // in case hostname property does not exist in window.location
        // or the 'special' property - return the whole location
        if (window.location) {
            return 'window.location::' + JSON.stringify(window.location);
        }

        if (untypedWindow.mainThreadLocation) {
            return 'mainThread.location::' + JSON.stringify(untypedWindow.mainThreadLocation);
        }

        return undefined;
    }

    /** Returns what Azure cloud are service is being used in */
    private getAzureCloudType() {
        if (
            (this.azureCloudType && this.azureCloudType === AzureCloudType.Public)
            || this.hostnameContainsString('portal.azure.com')) {
            return AzureCloudType.Public;
        } else if (
            (this.azureCloudType && this.azureCloudType === AzureCloudType.Mooncake)
            || this.hostnameContainsString('portal.azure.cn')
        ) {
            return AzureCloudType.Mooncake;
        } else if (
            (this.azureCloudType && this.azureCloudType === AzureCloudType.Fairfax)
            || this.hostnameContainsString('portal.azure.us')
        ) {
            return AzureCloudType.Fairfax;
        } else if (
            (this.azureCloudType && this.azureCloudType === AzureCloudType.Blackforest)
            || this.hostnameContainsString('portal.microsoftazure.de')
        ) {
            return AzureCloudType.Blackforest;
        } else if (
            (this.azureCloudType && this.azureCloudType === AzureCloudType.USNat)
            || this.hostnameContainsString('portal.azure.eaglex.ic.gov')
        ) {
            return AzureCloudType.USNat;
        } else if (this.isLocalhost()) {
            return AzureCloudType.Public;
        }
        throw new Error('getAzureCloudType could not determine a valid cloud environment from the URL');
    }
}
