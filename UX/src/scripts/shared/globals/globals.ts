/** local */
import { IPortalMessagingProvider } from '../messaging/v2/PortalMessagingProvider';
import { LocaleStringsHandler } from '../LocaleStringsHandler';
import { IEnvironmentConfig } from '../EnvironmentConfig';
import { AuthTokenHandler } from '../AuthTokenHandler';
import { BannerUtilityHelper } from '../../container/shared/banner-bar/BannerUtilityHelper';
import { InitializationInfo } from '../InitializationInfo';
import { IBladeContext } from '../../container/IBladeContext';
import { KubernetesProxyDataProviderFactory } from '../data-provider/KubernetesProxyDataProviderFactory';
import { KubeConfigMonextHelper } from '../data-provider/kube-config/KubeConfigMonextHelper';
import { ADProvider } from '../data-provider/AzureADProvider';

/**
 * Defines structure of the global settings object
 */
export interface IGlobals extends Window {
    /** messaging provider to communicate to Ibiza framework */
    messagingProvider: IPortalMessagingProvider;

    /**  theme class name applied to body html element (light/dark) */
    themeMessageProcessor: EventListenerObject;

    /** handles locale specific display string being passed down to it from monitoring extension */
    localeStringsHandlerInstance: LocaleStringsHandler;

    /** handler for receiving authorization tokens from monitoring extension
     * after the page has loaded and someone requests for it.
     */
    authTokenHandlerInstance: AuthTokenHandler;

    /** Banner Utility helper with functions to get cluster information and set the role assignment */
    BannerUtilityHelper: BannerUtilityHelper;

    /** environment config for getting various environment properties and settings */
    environmentConfigInstance: IEnvironmentConfig;

    /** iframe initialization information */
    initializationInfo: InitializationInfo;

    kubernetesProxyProviderFactory: KubernetesProxyDataProviderFactory;
    kubeConfigMonextHelperInstance: KubeConfigMonextHelper;
    adProvider: ADProvider; 

    /** blade context */
    bladeContext: IBladeContext;
}

/**
 * Performance telemetry measuring points.... this list is enumerated once loadComplete
 * and loaded into appinsights on each page load
 */
export interface ITelemetryBucket {
    [key: string]: number;
}

/**
 * Global settings object 
 */
export const globals = (window as unknown as IGlobals);
