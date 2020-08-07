/**
 * Block
 */

/**
 * Local
 */

/**
 * Shared
 */
import { TelemetryMainArea, ITelemetry, TelemetryUtilities } from '../Telemetry';
import { TelemetryFactory } from '../TelemetryFactory';
import { ErrorSeverity } from './TelemetryErrorSeverity';
import { ADProvider } from './AzureADProvider';

import { ArmBatchDataProvider } from './v2/ArmBatchDataProvider';
import { IArmDataProvider } from './v2/ArmDataProvider';
import { HttpVerb } from './v2/HttpDataProvider';
import { HttpStatusCode } from '@appinsights/aichartcore';
import * as Constants from '../GlobalConstants';
import { KubeConfigClusterType } from '../KubeConfigClusterType';
import { KubeConfigInterpreterFactory } from './kube-config/KubeConfigInterpreterFactory';
import { KubeConfig } from './kube-config/BaseKubeConfigInterpreter';

/**
 * Constants
 */
// https://docs.microsoft.com/en-my/rest/api/aks/managedclusters/listclusterusercredentials?view=azurermps-5.2.0
const AKS_API_VERSION = '2019-11-01';
const CLUSTER_USER = 'listClusterUserCredential';
const CLUSTER_MONITORING_USER = 'listClusterMonitoringUserCredential';
const GET_KUBECONFIG_EXCEPTION = '@getKubeConfig';
const GET_KUBECONFIG_HANDLEDAT = '@processResultFromGetKubeConfig';

export interface IKubeConfigDataProvider {
    /**
     * Grabs a parsed kube config from ARM. 
     * For now, the returned object only contains the apiServer and the token, as per the definition of IKubeConfig.
     * @param subscriptionId The user's subscription id.
     * @param resourceGroup The user's resource group
     * @param clusterName The cluster name for the kube config.
     */
    getKubeConfig(subscriptionId: string, resourceGroup: string, clusterName: string, clusterType: KubeConfigClusterType): Promise<KubeConfig>;


    forceLogoutAd(): void;
}

/** Provider for kube config from ARM */
export class KubeConfigDataProvider implements IKubeConfigDataProvider {
    private armDataProvider: IArmDataProvider;
    private telemetry: ITelemetry;

    /**
     * Creates a new kube config data provider, which will use the inputted ARM data provider.
     * @param armDataProvider The ARM Data provider that this provider will use to grab the kube config
     */
    constructor(armDataProvider: IArmDataProvider, private _interpreterFactory: KubeConfigInterpreterFactory) {
        this.armDataProvider = armDataProvider;
        this.telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
    }

    /** Logs the user out of AD */
    public forceLogoutAd(): void {
        ADProvider.Instance().logout();
    }

    /**
     * Grabs a parsed kube config from ARM. 
     * For now, the returned object only contains the apiServer and the token, as per the definition of IKubeConfig.
     * @param subscriptionId The user's subscription id.
     * @param resourceGroup The user's resource group
     * @param clusterName The cluster name for the kube config.
     */
    public async getKubeConfig(subscriptionId: string, resourceGroup: string, clusterName: string, clusterType: KubeConfigClusterType): Promise<KubeConfig> {
        const clusterMonitoringUserUri = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.ContainerService/managedClusters/${clusterName}/${CLUSTER_MONITORING_USER}?api-version=${AKS_API_VERSION}`;
        const clusterUserUri = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.ContainerService/managedClusters/${clusterName}/${CLUSTER_USER}?api-version=${AKS_API_VERSION}`;

        const headers = {
            'x-ms-app': Constants.InfraInsightsApplicationId
        };

        try {
            const result = await ArmBatchDataProvider.createRequest(this.armDataProvider)
                .addQuery(clusterMonitoringUserUri, HttpVerb.Post)
                .addQuery(clusterUserUri, HttpVerb.Post)
                .execute(60000, headers);

            if (!result || !result.responses || !result.responses.length) {
                this.telemetry.logException(
                    GET_KUBECONFIG_EXCEPTION,
                    GET_KUBECONFIG_HANDLEDAT,
                    ErrorSeverity.Error,
                    { reason: 'result cannot be null @getKubeConfig' },
                    undefined
                );
                return null;
            }

            return await this.processResultFromGetKubeConfig(result, clusterType)
        } catch (error) {
            TelemetryUtilities.shimExceptionObject(error);
            this.telemetry.logException(
                GET_KUBECONFIG_EXCEPTION,
                GET_KUBECONFIG_HANDLEDAT,
                ErrorSeverity.Error,
                {
                    details: 'The batch call for kube config failed',
                    reason: JSON.stringify(error)
                },
                undefined
            );
            return null;
        }
    }

    private isKubeConfigResponseValid(kubeConfigResponse) {
        if (kubeConfigResponse.httpStatusCode === HttpStatusCode.Ok &&
            kubeConfigResponse.content &&
            kubeConfigResponse.content.kubeconfigs &&
            kubeConfigResponse.content.kubeconfigs.length) {
            return true;
        }
        return false;
    }

    /**
     * Processes the Kube config request response from ARM
     * Multiple Kube configs are fetched, and they processed and used by the application in priority order
     * @param kubeConfigQueryResult 
     * @param clusterType 
     */
    private async processResultFromGetKubeConfig(kubeConfigQueryResult: any, clusterType: KubeConfigClusterType): Promise<KubeConfig> {

        const kubeconfigs = kubeConfigQueryResult.responses;
        const clusterMonitoringUserKubeConfig = kubeconfigs[0];
        const clusterUserKubeConfig = kubeconfigs[1];

        // no AD logic, nothing fancy, parse and return... if this fails we can fall back to CU still
        const errors: string[] = [];

        try {
            const cmuResult = await this.tryToUseClusterMonitoringUser(clusterMonitoringUserKubeConfig);
            if (cmuResult) {
                return cmuResult;
            } else {
                errors.push('Failed to operate on CMU, falling back to CU')
                this.telemetry.logException(
                    GET_KUBECONFIG_EXCEPTION, 
                    GET_KUBECONFIG_HANDLEDAT,
                    ErrorSeverity.Warn, 
                    {
                        httpStatusCodeClusterUser: clusterUserKubeConfig.httpStatusCode,
                        httpStatusCodeClusterMonitoringUser: clusterMonitoringUserKubeConfig.httpStatusCode,
                        details: `Fetch for both ${CLUSTER_MONITORING_USER} (${clusterMonitoringUserKubeConfig.httpStatusCode}) and ${CLUSTER_USER} (${clusterUserKubeConfig.httpStatusCode}) failed`,
                        reason: errors.join('; ')
                    },
                    null
                );
            }
        } catch (error) {
            errors.push('Failed to operate on CMU, falling back to CU')
            this.telemetry.logException(
                GET_KUBECONFIG_EXCEPTION, 
                GET_KUBECONFIG_HANDLEDAT,
                ErrorSeverity.Warn, 
                {
                    httpStatusCodeClusterUser: clusterUserKubeConfig.httpStatusCode,
                    httpStatusCodeClusterMonitoringUser: clusterMonitoringUserKubeConfig.httpStatusCode,
                    details: `Fetch for both ${CLUSTER_MONITORING_USER} (${clusterMonitoringUserKubeConfig.httpStatusCode}) and ${CLUSTER_USER} (${clusterUserKubeConfig.httpStatusCode}) failed`,
                    reason: errors.join('; ')
                },
                null
            );
        }

        // bbax: two possibilities here... either we crashed processing CMU AND we failed to fetch CU... OR we failed to fetch BOTH
        if (clusterUserKubeConfig.httpStatusCode !== HttpStatusCode.Ok) {
            errors.push(`Fetch for both ${CLUSTER_MONITORING_USER} (${clusterMonitoringUserKubeConfig.httpStatusCode}) and ${CLUSTER_USER} (${clusterUserKubeConfig.httpStatusCode}) failed`);
            this.telemetry.logException(
                GET_KUBECONFIG_EXCEPTION,
                GET_KUBECONFIG_HANDLEDAT,
                ErrorSeverity.Error,
                {
                    httpStatusCodeClusterUser: clusterUserKubeConfig.httpStatusCode,
                    httpStatusCodeClusterMonitoringUser: clusterMonitoringUserKubeConfig.httpStatusCode,
                    details: `Fetch for both ${CLUSTER_MONITORING_USER} (${clusterMonitoringUserKubeConfig.httpStatusCode}) and ${CLUSTER_USER} (${clusterUserKubeConfig.httpStatusCode}) failed`,
                    reason: errors.join('; ')
                },
                undefined
            );
            return Promise.resolve(null);
        }

        return await this.fallbackToClusterUser(clusterUserKubeConfig, clusterMonitoringUserKubeConfig, clusterType, errors);
    }

    /** Attempts to process and use the cluster monitoring user Kube config */
    private async tryToUseClusterMonitoringUser(clusterMonitoringUserKubeConfig: any) {
        if (clusterMonitoringUserKubeConfig.httpStatusCode === HttpStatusCode.Ok) {
            if (!this.isKubeConfigResponseValid(clusterMonitoringUserKubeConfig)) {
                return Promise.resolve(null);
            }

            const rawConvertedKubeConfig = atob(clusterMonitoringUserKubeConfig.content.kubeconfigs[0].value);
            const interpreter = this._interpreterFactory.getKubeConfigInterpreter(rawConvertedKubeConfig,
                KubeConfigClusterType.AksNonAAD);
            return await interpreter.parseKubeConfig();
        } else {
            return Promise.resolve(null);
        }
    }

    private async fallbackToClusterUser(clusterUserKubeConfig, clusterMonitoringUserKubeConfig, clusterType: KubeConfigClusterType, errors: string[]) {
        try {
            const rawConvertedKubeConfig = atob(clusterUserKubeConfig.content.kubeconfigs[0].value);
            const interpretor = this._interpreterFactory.getKubeConfigInterpreter(rawConvertedKubeConfig, clusterType);
            return await interpretor.parseKubeConfig();
        } catch (error) {
            errors.push(`Usage of both ${CLUSTER_MONITORING_USER} (${clusterMonitoringUserKubeConfig.httpStatusCode}) and ${CLUSTER_USER} (${clusterUserKubeConfig.httpStatusCode}) failed`);
            this.telemetry.logException(
                GET_KUBECONFIG_EXCEPTION,
                GET_KUBECONFIG_HANDLEDAT,
                ErrorSeverity.Error,
                {
                    httpStatusCodeClusterUser: clusterUserKubeConfig.httpStatusCode,
                    httpStatusCodeClusterMonitoringUser: clusterMonitoringUserKubeConfig.httpStatusCode,
                    details: `Usage of both ${CLUSTER_MONITORING_USER} (${clusterMonitoringUserKubeConfig.httpStatusCode}) and ${CLUSTER_USER} (${clusterUserKubeConfig.httpStatusCode}) failed`,
                    reason: errors.join('; ')
                },
                undefined
            );
            return Promise.resolve(null);
        }
    }
}
