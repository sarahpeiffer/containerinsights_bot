import { PortalMessageService, IPortalMessageSubscriber } from 'appinsights-iframe-shared';
import { IAppInsightsMessageProviderWrapper } from './MessagingProvider';

/**
 * Used by AppInsight's shared drop down control.
 * Only DropdownMessage type MenuItem is displaying icons and this menu item 
 * is expecting a message provider.
 * This is a dummy message provider which override's PortalMessageService's PostMessage methods.
 * PostMessage method of this class is called whenever a new dropdown menu item is clicked
 * to pass the selected item context to the parent blade of the controller.
 */
export class CustomAppInsightMessagingProvider extends PortalMessageService {

    constructor(signature: string, trustedAuthority: string) {
        super(signature, trustedAuthority, null);
    }

    public SubscribeMessage(kind: string, subscriber: Function): IPortalMessageSubscriber {
        return { Unsubscribe: () => { } };
    }

    public PostMessage(kind: string, data?: any, lclWindow?: Window): void {

    }

    public PostMessageWithNoInstanceId(kind: string, data?: any): void {

    }
}

/**
 * custom provider for the above custom provider (and general message service)... this
 * is more of a "factory" which seperates out knowledge of appinsights library so
 * messageprovider can be included in places where this functionality isn't required
 */
export class AppInsightsProvider implements IAppInsightsMessageProviderWrapper {
    public getAppInsightsProvider(signature: string, src: string) {
        return new PortalMessageService(signature, src, null);
    } 
    
    public getCustomAppInsightsProvider(signature: string, src: string) {
        return new CustomAppInsightMessagingProvider(signature, src);
    }


}
