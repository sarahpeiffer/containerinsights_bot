import { ISubscriptionInfo } from './ISubscriptionInfo';
import { StringMap } from './StringMap'

/**
 * Subscription list manager is responsible for maintaining a mapping engine between
 * subscription names / ids used currently only by the storage system.  The menu blade
 * will provide us a list of subscriptions (id/name) the user has access to while enumerating
 * workspaces... we keep this list.  Storage also shows subscription as a drill-down choice
 * but it only includes subscription id.  The subscription provider uses this mapping engine
 * to add friendly names where possible
 * NOTE: Its possible to have access to a workspace but not a subscription so some will have
 * a default name as defined by addUnknownSubscription()
 */
export class SubscriptionListManager {
    /**
     * ID -> NAME mappings
     */
    private subscriptionIdMappigs: StringMap<ISubscriptionInfo>;
    //private unknownIndex: number = 0;

    /**
     * .ctor() create an empty object
     */
    constructor() {
        this.subscriptionIdMappigs = {};
    }

    /**
     * Create a "default"
     * @param subscriptionId Subscription id we don't have a name for
     * @returns subscription that was added to the list (throws if anything goes wrong)
     */
    public addUnknownSubscription(subscriptionId: string): ISubscriptionInfo {
        if (!subscriptionId || !subscriptionId.length || subscriptionId.length < 1) {
            return undefined;
        }

        if (this.getSubscriptionById(subscriptionId)) {
            console.error('attempted to append unknown but object exists!');
            return this.getSubscriptionById(subscriptionId);
        }

        // const newDisplayName: string = 'Unknown Subscription<' + this.unknownIndex++ + '>'
        const newDisplayName: string = subscriptionId;
        const newSubscription: ISubscriptionInfo = {
            subscriptionId: subscriptionId,
            uniqueDisplayName: newDisplayName,
            displayName: newDisplayName,
            authorizationSource: undefined,
            state: undefined,
            subscriptionPolicies: undefined,
        };

        this.subscriptionIdMappigs[subscriptionId] = newSubscription;
        return newSubscription;
    }

    /**
     * Given a list of subscriptions to append unique additions from that list
     * to the existing list of subscriptions.  today effectively this will get loaded
     * and no changes will occur again since the blade loads all subscriptions at once
     * @param subscriptions list of subscriptions to append to this object
     * @returns true if anything changed, false otherwise
     */
    public appendSubscriptionList(subscriptions: ISubscriptionInfo[]): boolean {
        if (!subscriptions || !subscriptions.length || subscriptions.length < 1) {
            return false;
        }

        let refreshRequired: boolean = false;
        subscriptions.forEach((subscription) => {
            if (!(subscription.subscriptionId in this.subscriptionIdMappigs)) {
                refreshRequired = true;
                this.subscriptionIdMappigs[subscription.subscriptionId] = subscription;
            }
        });
        return refreshRequired;
    }

    /**
     * given a subscription id return the subscription object, returns undefined otherwise
     * @param id subscription id to find a subscription for
     * @returns the subscription requested or undefined
     */
    public getSubscriptionById(id: string): ISubscriptionInfo {
        return this.subscriptionIdMappigs[id];
    }
}
