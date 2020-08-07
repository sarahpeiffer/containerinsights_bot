export interface ISubscriptionInfo {
    authorizationSource: string;
    displayName: string;
    state: string;
    subscriptionId: string;
    uniqueDisplayName: string;
    subscriptionPolicies: SubscriptionPolicies;
}

/**
 * Data contract for Azure subscription policies.
 */
export interface SubscriptionPolicies {
    /**
     * The subscription location placement id.
     */
    locationPlacementId: string;
    /**
     * The subscription quota id.
     */
    quotaId: string;
    /**
     * The subscription spending limit Values "On", "Off", "CurrentPeriodOff"
     */
    spendingLimit?: string;
}
