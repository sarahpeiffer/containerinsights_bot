import { ResponseStatus } from '../data-provider/IMonitoredClustersQueryResponseResultRow';
import { DisplayStrings } from '../MulticlusterDisplayStrings'

/** possible health statues */
export enum HealthStatus {
    Critical = 0,
    Warning = 100,
    UnAuthorized = 200,
    NotFound = 201,
    MisConfigured = 202,
    Error = 203,
    NoData = 204,
    Unknown = 205,
    Healthy = 300,
    Unmonitored = 400,
}

/**
 * Display names of the Health Status
 */
export const HealthStatusDisplayNameMap: { [key: string]: string } = {
    ['Critical']: DisplayStrings.HealthStatusCritical,
    ['Warning']: DisplayStrings.HealthStatusWarning,
    ['UnAuthorized']: DisplayStrings.HealthStatusUnAuthorized,
    ['NotFound']: DisplayStrings.HealthStatusNotFound,
    ['MisConfigured']: DisplayStrings.HealthStatusMisConfigured,
    ['Error']: DisplayStrings.HealthStatusError,
    ['NoData']: DisplayStrings.HealthStatusNoData,
    ['Unknown']: DisplayStrings.HealthStatusUnknown,
    ['Healthy']: DisplayStrings.HealthStatusHealthy,
    ['Unmonitored']: DisplayStrings.HealthStatusUnmonitored,
}



/** constants */
const NODE_HEALTHY_THRESHOLD = 0.85;
const NODE_CRITICAL_THRESHOLD = 0.6;
const USER_POD_CRITICAL_THRESHOLD = 0.9;
const USER_POD_HEALTHY_THRESHOLD = 1;
const SYSTEM_POD_CRITICAL_THREHSOLD = 1;

export class HealthCalculator {
    /**
     * Calculates overall node health status
     * @param nodeHealthRatio 
     */
    public static getNodeOverallHealth(nodeHealthRatio: number): HealthStatus {
        if (nodeHealthRatio > 1 || nodeHealthRatio < 0) {
            throw new Error('nodeOverallHealthRatio cannot be greater than 1 or less than 0');
        }

        if (nodeHealthRatio > NODE_HEALTHY_THRESHOLD) {
            return HealthStatus.Healthy;
        } else if (nodeHealthRatio <= NODE_HEALTHY_THRESHOLD && nodeHealthRatio > NODE_CRITICAL_THRESHOLD) {
            return HealthStatus.Warning;
        } else {
            return HealthStatus.Critical;
        }
    }

    /**
     * Calculates overall user pod health status
     * @param userPodHealthRatio 
     */
    public static getUserPodOverallHealth(userPodHealthRatio: number): HealthStatus {
        if (userPodHealthRatio > 1 || userPodHealthRatio < 0) {
            throw new Error('userPodHealthRatio cannot be greater than 1 or less than 0');
        }

        if (userPodHealthRatio < USER_POD_CRITICAL_THRESHOLD) {
            return HealthStatus.Critical;
        } else if (userPodHealthRatio >= USER_POD_CRITICAL_THRESHOLD && userPodHealthRatio < USER_POD_HEALTHY_THRESHOLD) {
            return HealthStatus.Warning;
        } else {
            return HealthStatus.Healthy;
        }
    }

    /**
     * Calculates overall system pod health status
     * @param systemPodHealthRatio  
     */
    public static getSystemPodOverallHealth(systemPodHealthRatio: number): HealthStatus {
        if (systemPodHealthRatio > 1 || systemPodHealthRatio < 0) {
            throw new Error('systemPodHealthRatio cannot be greater than 1 or less than 0');
        }

        if (systemPodHealthRatio < SYSTEM_POD_CRITICAL_THREHSOLD) {
            return HealthStatus.Critical;
        } else {
            return HealthStatus.Healthy;
        }
    }

    /**
     * Calculates the health status of a cluster by rolling up node, user pods, and system pods statuses
     * Roll-up is based on the worst status among node, user pods, and system pods
     * @param nodeOverallHealth 
     * @param userPodOverallHealth 
     * @param systemPodOverallHealth 
     * @param responseStatus - optional response status
     */
    public static getClusterHealth(
        nodeOverallHealth: HealthStatus,
        userPodOverallHealth: HealthStatus,
        systemPodOverallHealth: HealthStatus,
        responseStatus?: ResponseStatus,
    ): HealthStatus {

        // if request failed then use the response status 
        if (responseStatus !== undefined && responseStatus !== ResponseStatus.Success) {
            let healthStaus: HealthStatus = HealthStatus.Unknown;

            switch (responseStatus) {
                case ResponseStatus.UnAuthorized:
                    healthStaus = HealthStatus.UnAuthorized;
                    break;
                case ResponseStatus.Error:
                    healthStaus = HealthStatus.Error;
                    break;
                case ResponseStatus.Misconfigured:
                    healthStaus = HealthStatus.MisConfigured;
                    break;
                case ResponseStatus.NoData:
                    healthStaus = HealthStatus.NoData;
                    break;
                case ResponseStatus.NotFound:
                    healthStaus = HealthStatus.NotFound;
                    break;
                case ResponseStatus.Unknown:
                    healthStaus = HealthStatus.Unknown;
                    break;
                default:
                    healthStaus = HealthStatus.Unknown;
                    break;
            }

            return healthStaus;
        }

        // overall cluster status is unknown if any of the entity (node or user pod or system pod) status is unknown 
        if (nodeOverallHealth === HealthStatus.Unknown ||
            userPodOverallHealth === HealthStatus.Unknown ||
            systemPodOverallHealth === HealthStatus.Unknown) {
            return HealthStatus.Unknown;
        }

        const healthValue: number = Math.min(nodeOverallHealth, userPodOverallHealth, systemPodOverallHealth);
        return HealthStatus[HealthStatus[healthValue]]; // The way to access an enum by ordinal
    }
}
