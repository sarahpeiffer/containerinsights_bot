import * as msg from '../../../../shared/MessagingProvider';
import { ITelemetry } from '../../../../shared/Telemetry';
import { DisplayStrings } from '../../../../shared/DisplayStrings';

export interface ILinkToNavigate {
    messageProvider: msg.MessagingProvider;
    navigationDestination: NavigationDestination;
    navigationContext: INavigationContext;
    location: LinkPosition;
}

export interface INavigationContext {
    linkText ?: string;
    linkUri: string;
}

export enum LinkPosition {
    center = 1,
    right = 2
}

export enum NavigationDestination {
    resourceOverview = 1,
    updateDa = 2
}

/**
 * TODO: Might need to refractor this class
 * @class LinkToNavigateAdaptor
 */
export class LinkToNavigateAdaptor {

    public static navigate(linkToNavigate: ILinkToNavigate, telemetry: ITelemetry, logPrefix: string, message?: string): void {
        if (!linkToNavigate || !linkToNavigate.navigationDestination) {
            return;
        }
        telemetry.logEvent(`${logPrefix}.LinkToNavigateAdaptor.Navigate`, { linkToNavigate: JSON.stringify(linkToNavigate) }, {});
        switch (linkToNavigate.navigationDestination) {
            case NavigationDestination.resourceOverview: this.resourceOverview(linkToNavigate, telemetry, logPrefix);
                break;

            default: return;
        }

    }

    public static navigationParams(navigationDestination: NavigationDestination,
        navigationContext: INavigationContext,
        messagingProvider?: msg.MessagingProvider ): ILinkToNavigate {
            let location: LinkPosition;
            if (!navigationDestination || !navigationContext) {
                return null;
            }
            if (navigationDestination === NavigationDestination.resourceOverview) {
                navigationContext.linkUri = this.resourceIdParser(navigationContext);
                location = LinkPosition.center;
            }
            if (navigationDestination === NavigationDestination.updateDa) {
                location = LinkPosition.right;
            }
            const navigationParams: ILinkToNavigate = {
                navigationDestination: navigationDestination,
                messageProvider: messagingProvider,
                navigationContext: navigationContext,
                location: location
        };
        return navigationParams;
    }

    private static resourceOverview(linkToNavigate: ILinkToNavigate, telemetry: ITelemetry, logPrefix: string) {
        if (!linkToNavigate || !linkToNavigate.navigationContext || !linkToNavigate.navigationContext.linkUri) {
            return;
        }

        if (linkToNavigate.messageProvider) {
            linkToNavigate.messageProvider.sendNavigateToAzureResourceMessage(linkToNavigate.navigationContext.linkUri);
        }
    }

    private static resourceIdParser (navigationContext: INavigationContext): string {
        if (!navigationContext.linkText || !navigationContext.linkUri) {
            return null;
        }
        let targetResourceId: string = navigationContext.linkUri;
            switch (navigationContext.linkText) {
                case DisplayStrings.ResourceGroup: targetResourceId = targetResourceId.split('/providers')[0];
                    break;
                case DisplayStrings.SubscriptionId: targetResourceId = targetResourceId.split('/resourceGroups')[0];
                    break;
                default: break;
            }
        return targetResourceId;
    }
}
