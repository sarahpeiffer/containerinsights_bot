import { IWorkspaceInfo } from './IWorkspaceInfo';
import { SettingsManager } from './SettingsManager';
import { StringHelpers } from './Utilities/StringHelpers';
import { IWorkbookParams } from './workbooks/WorkbookHelper';
import { TimeData } from '@appinsights/pillscontrol-es5';
import { SerializedComputerGroup } from '../compute/shared/ComputerGroupSerialization';
import { ISeriesSelectorOption } from './ISeriesSelectorOption';
import { IDefaultAzureScopeSelection } from '../compute/shared/AtScaleUtils';
import { IWorkbookMessage } from '../compute/shared/WorkbookHelper';
import { LocaleStringsHandler } from '../shared/LocaleStringsHandler';
import { IPillSelections } from '../container/ContainerMainPageTypings';
import { VmInsightsCreateAlertRuleParams } from '../compute/shared/blade/AlertParams';

//
// event origins we can trust when receiving messages in this application
//
const TrustedParentOrigin: string = 'https://portal.azure.com';
const TrustedParentOriginInternal: string = 'https://ms.portal.azure.com';

const TrustedParentOriginFairfax: string = 'https://portal.azure.us';

const TrustedParentOriginMooncake: string = 'https://portal.azure.cn';

const TrustedParentDogfoodOrigin: string = 'https://df.onecloud.azure-test.net';
const TrustedParentRcOrigin: string = 'https://rc.portal.azure.com';
const TrustedParentEXOrigin: string = 'https://portal.azure.eaglex.ic.gov';

//
// message signature expected on all messages
//
const MessageSignature: string = 'FxFrameBlade';

//
// the 'kind' field value set on the message
//
const InitMulticlusterMessageKind: string = 'initMulticluster';
const InitMessageKind: string = 'init';
const StyleThemingMessageKind: string = 'theme';
const LoadCompleteKind: string = 'loadComplete';
const CustomMessageKind: string = 'custom';
const RefreshKind: string = 'refresh';
const UpdateAggregatePerfScopeKind: string = 'update-aggregate-perf-scope';
const ArmTokenKind: string = 'armtoken';
const ServiceMapInitKind: string = 'serviceMapInit';
const HealthInitKind: string = 'healthInit';

//
// Message processor types
//
export const InitMessageProcessorType: string = 'init';
export const InitInBladeMessageProcessorType: string = 'initInBlade';
export const MapCustomMessageProcessorType: string = 'map';
export const StyleThemingMessageProcessorType: string = 'theme';
export const LoadCompleteMessageProcessorType: string = 'loadComplete';
export const InitMulticlusterMessageProcessorType: string = 'initMulticluster';
export const RefreshMessageProcessorType: string = 'refresh';
export const ArmTokenMessageProcessorType: string = 'armtoken';
export const ServiceMapInitMessageProcessorType: string = 'serviceMapInit';
export const HealthInitMessageProcessorType: string = 'healthInit';
export const SubscriptionListUpdateMessageProcessorType: string = 'subscriptionListUpdate';
export const ClusterProperties: string = 'clusterProperties';
export const AksProxyAuthorizationToken: string = 'aksProxyAuthorizationToken';

//
// VmInsights init message processor types
//
export const InitAtScaleComputePerfMessageProcessorType: string = 'initAtScaleComputePerf';
export const InitAtScaleComputeMapMessageProcessorType: string = 'initAtScaleComputeMap';
export const InitSingleVmComputePerfMessageProcessorType: string = 'initSingleVmComputePerf';
export const InitSingleVmComputeMapMessageProcessorType: string = 'initSingleVmComputeMap';

//
// IFrame names being used to identify message handlers for each IFrame of VmInsights.
//
export enum VmInsightsIFrameIds {
    SingleVMComputeMap = 'compute-singlevm-dependencymap',
    SingleVMComputePerf = 'compute-singlevm-performance',
    AtScaleComputeMap = 'compute-atscale-dependencymap',
    AtScaleComputePerf = 'compute-atscale-performance'
}

//
// IFrame names being used to identify message handlers for each IFrame of container insights.
//
export enum ContainerInsightsIFrameIds {
    containerInsights = 'container-singlecluster-perf',
    containerInsightsAtScale = 'container-atscale-perf'
}

export const UpdateAggregatePerfScopeProcessorType: string = 'updateAggregatePerfScope';

export enum PortalThemes {
    Light = 'light',
    Dark = 'dark'
}

export enum Solution {
    VmInsights = 'VmInsights',
    ContainerInsights = 'ContainerInsights'
}

/** messaging provider interface */
export interface IMessagingProvider {
    // initializes operations and starts message receive/send operations
    startMessaging(frameId?: string): void;
    stopMessaging(): void;

    // registers inbound event processor for a given event type (kind)
    registerProcessor(eventKind: string, processorCallback: any, frameId?: string): void;

    /**
     * This is required for the appinsights-iframe-shared user interface to communicate upward
     * to the iFrame parent... this logic is all wrapped inside that library (and the Action only
     * option doenst properly suport icons)
     * @returns appinsights-iframe-shared combobox dropdown required representation of iframe messaging
     */
    getAppInsightsProvider(): any;

    /**
      * Let the monitoring extension know that we have failed to load the blade in some
      * critical manner, that they should take over for us (today it can show 'accessDenied' and
      * all other reasons will result in an onboarding page)
      * @param reason reason for the blade load failure ('accessDenied' will display ibizia page)
      */
    bladeLoadFailure(reason: string): void;

    /**
     * Opens resource group insights blade
     */
    sendNavigateToResourceGroupInsights(): void;

    /**
     * Sends a message to Monex to open the Workbook blade, using the message data
     * @param messageData
     */
    sendOpenWorkbook(messageData: IWorkbookMessage | IWorkbookParams): void
}

/**
 * value object to be delivered to monitoring extension for log search query
 */
export interface ILogSearchMessageObject {
    id: string;
    query: string;
}

/**
 * Used by navigation requests sent from Compute to trigger a navigate
 * to ComputeMaps request delivered to the parent blade who will use this
 * metadata to select a workspace and resource automatically
 */
export interface IMapsNavigationMessage {
    workspace: IWorkspaceInfo;
    computer: SelectedEntity;
}

/**
 * Used by navigation requests sent from Compute to trigger a navigate
 * to single machine perf view request delivered to the parent blade who will use this
 * metadata to select a workspace and resource automatically
 */
export interface ISinglePerfViewNavigationMessage {
    computerName: string;
    workspaceId: string;
    computerId: string;
}


/**
 * Used by navigation requests sent from Multi Aks Cluster Page to trigger a navigate onboarding and health pages
 * to single aks cluster
 *  workspaceResourceId and selectionTab optional for onboarding page
 */
export interface ISingleAksClusterNavigationMessage {
    clusterName: string;
    clusterResourceId: string;
    clusterLocation?: string;
    workspaceResourceId?: string;
    selectedTab?: number;
    initiatorBlade?: string;
    pillSelections?: IPillSelections,

}

/**
 * Used to transmit client notifications to be displayed in the Ibiza portal. Client
 * notifications require title and message, and also the type (i.e. the level) of the
 * client notification which will determine the notification badge
 */
export interface IClientNotificationMessage {
    title: string;
    message: string;
    level: DependencyMap.NotificationStatus;
}

export interface AtScalePinChartToDashboardMessage {
    metricQueryId: string;
    workspaceInfo: IWorkspaceInfo;
    timeRange: TimeData;
    computerGroup: SerializedComputerGroup;
    defaultOptionPicks: ISeriesSelectorOption[];
    showOptionPicker: boolean;
    selectedTab: number;
    azureScopeSelection: IDefaultAzureScopeSelection;
    solutionType: string;
}

/**
 * Used to send pin the container insights chart to dashboard message
 */
export interface ContainerInsightsPinChartToDashboardMessage {
    metricQueryId: string,
    clusterName: string,
    clusterResourceId: string,
    workspaceResourceId: string,
    timeRange: TimeData,
    defaultOptionPicks: ISeriesSelectorOption[],
    showOptionPicker: boolean
}

/**
 * Used to send pin to dashboard message.
 */
export interface SingleVmPinChartToDashboardMessage {
    metricQueryId: string,
    timeRange: TimeData,
    defaultOptionPicks: ISeriesSelectorOption[],
    showOptionPicker: boolean,
    computerName: string,
    computerId: string,
    workspaceId: string
}

/**
 * Used in the init messages for at scale scenarios
 * @export
 * @interface InitialSelections
 */
export interface InitialSelections {
    // selected computer
    computer?: SelectedEntity;

    // selected group
    group?: SerializedComputerGroup;

    // selected workspace id. We can retrieve the name out of the id.
    workspaceId?: string;

    // selected time range
    timeData?: TimeData;

    // Default azure scope selection if the solution is running in Azure mode.
    azureScopeSelection?: IDefaultAzureScopeSelection;
}


/**
 * Used in InitialSelections
 * @export
 * @interface SelectedEntity
 */
export interface SelectedEntity {
    name: string;
    id: string;
    resourceId?: string;
}

/**
 * define an interface for an appinsights message provider... we need something that can do things
 * like this, but we can't tie this class directly to app insights any longer
 */
export interface IAppInsightsMessageProviderWrapper {
    /**
     * external dependency
     * @param signature external dependency
     * @param src external dependency
     */
    getAppInsightsProvider(signature: string, src: string): any;
    /**
     * external dependency
     * @param signature external dependency
     * @param src external dependency
     */
    getCustomAppInsightsProvider(signature: string, src: string): any;
}

/**
 * provides support for exchanging messages between this iframe application
 * and hosting Azure portal framework
 */
export class MessagingProvider implements IMessagingProvider {
    // source of the messages (passed to iframe apps via url)
    private shellSrc: string;

    // last received sequence number
    private lastReceivedMessageSequenceNumber: number = -1;

    // event processor dictionary
    // todo: more typesafe processors?
    private eventProcessors: any;

    // querystring parameters array that were passed
    private queryStringParams: any;

    // id of the blade we are communicating with
    private bladeId: string;

    // id of the iFrame that the blade is communicating
    // We need both bladeId and frameId to identify messages received by
    // correct blade. Just bladeId will not be sufficient if multiple IFrames
    // are hosted in same blade.
    private frameId: string;

    /** external provider for appinsights message providers required by feedback */
    private appInsightsProvider: IAppInsightsMessageProviderWrapper;

    /**
     * .ctor() setup the message provider
     * @param appInsightsProvider app insights provider used by feedback
     */
    constructor(appInsightsProvider?: IAppInsightsMessageProviderWrapper) {
        this.appInsightsProvider = appInsightsProvider;

        // get shell source for messaging
        const queryString = window.location.search; //this will get the query string part including '?'
        this.queryStringParams = this.parseQueryString(queryString);
        let trustedAuthority: string;

        // apparently if the URI is not decoded messages doesn't reach
        if (this.queryStringParams) {
            trustedAuthority = decodeURIComponent(this.queryStringParams['trustedAuthority'])
        }

        if (trustedAuthority) {
            this.shellSrc = trustedAuthority;
        }

        this.eventProcessors = {};

        this.receiveMessage = this.receiveMessage.bind(this);
    }

    /**
     * Utilize the details of this message provider to create an AppInsights message
     * provider required by the dropdown and message option setup that is tightly
     * coupled...
     * @returns {PortalMessageService} AppInsights Dropdown message service
     */
    public getAppInsightsProvider(): any {
        // bbax: instanceId callback functional is optional to the library today, it will append
        // some extra text definited by the callback if available to the "kind" part of the message
        // we don't need or want this behavior
        //return new PortalMessageService(MessageSignature, this.shellSrc, null);
        return this.appInsightsProvider.getAppInsightsProvider(MessageSignature, this.shellSrc);
    }

    /**
     * Returns a custom messaging provider which extends PortalMessageService.
     * Currently this method is used by AppInsight's DropdownWithLinks react component.
     */
    public getCustomAppInsightsProvider(): any {
        return this.appInsightsProvider.getCustomAppInsightsProvider(MessageSignature, this.shellSrc);
    }

    //
    // sets up messaging from container to this application
    //
    public startMessaging(frameId?: string): void {
        window.addEventListener('message', this.receiveMessage, false);

        this.frameId = frameId;
        // tell the shell that iframe is ready to receive messages
        if (window.parent !== window) {
            window.parent.postMessage({
                kind: 'initializationcomplete',
                signature: MessageSignature,
            }, this.shellSrc);

            window.parent.postMessage({
                kind: 'ready',
                signature: MessageSignature,
                frameId: frameId
            }, this.shellSrc);

            if (frameId) {
                switch (frameId) {
                    case ContainerInsightsIFrameIds.containerInsightsAtScale:
                        (window as any).containerInsightsAtScale.performanceMeasures['frame_startMessaging'] = Date.now();
                        break;
                    case ContainerInsightsIFrameIds.containerInsights:
                        (window as any).containerInsights.performanceMeasures['frame_startMessaging'] = Date.now();
                        break;
                    default:
                        break;
                }
            }
        }
    }

    public stopMessaging(): void {
        window.removeEventListener('message', this.receiveMessage, false);
    }

    //send navigation message to Frame blade to switch nav
    public sendSelectedWorkspaceChangedMessage(messageData: IWorkspaceInfo): void {
        this.sendMessageToParentBlade('selectedWorkspaceChanged', messageData);
    }

    public sendNavigateToMapsMessage(messageData: IMapsNavigationMessage): void {
        this.sendMessageToParentBlade('navigateToMaps', messageData);
    }

    public sendNavigateToResourceGroupInsights(): void {
        this.sendMessageToParentBlade('navigateToResourceGroupInsights', null);
    }

    public sendNavigateToMulticluster(): void {
        this.sendMessageToParentBlade('navigateToMulticluster', null);
    }

    public sendNavigateToViewAlerts(): void {
        this.sendMessageToParentBlade('navigateToViewAlerts', null);
    }

    /**
     * Sends a message to navigate to blade for single vm perf. This will redirect to SingleVMPerf.
     * @param  {ISinglePerfViewNavigationMessage} messageData
     * @return {void}@memberof MessagingProvider
     */
    public sendNavigateToSingleComputePerfMessage(messageData: ISinglePerfViewNavigationMessage): void {
        this.sendMessageToParentBlade('navigateToSingleComputePerf', messageData);
    }

    public sendNavigateToAzureResourceMessage(resourceId: string): void {
        this.sendMessageToParentBlade('navigateToAzureResource', { resourceId: resourceId });
    }

    public sendOpenOnboardingPane(resourceId: string): void {
        this.sendMessageToParentBlade('openOnboardingPane', { resourceId });
    }

    // send navigation message to Frame blade to go to log search
    public sendNavigateToLogSearch(messageData: ILogSearchMessageObject): void {
        this.sendMessageToParentBlade('navigateToLogSearch', messageData);
    }

    // Navigate to Health Diagonstics blade
    public sendNavigateToHealthDiagnosticsBlade(): void {
        this.sendMessageToParentBlade('navigateToHealthDiagnostics', {});
    }

    public sendNavigateToHealthComponentBlade(messageData: object): void {
        this.sendMessageToParentBlade('navigateToHealthComponent', messageData);
    }

    public sendNavigateToHealthServiceBlade(messageData: object): void {
        this.sendMessageToParentBlade('navigateToHealthService', messageData);
    }

    public sendNavigateToGetStarted(): void {
        this.sendMessageToParentBlade('navigateToGetStarted', {});
    }

    /** Sends a navigation message to frame blade to go to onboarding page for the given cluster and workspace resource Ids */
    public sendNavigateToSingleAksClusterOnboarding(messageData: ISingleAksClusterNavigationMessage): void {
        this.sendMessageToParentBlade('navigateToOnboarding', messageData);
    }

    /** Sends a navigation message to frame blade to go to re-onboarding page for the given cluster and workspace resource Ids */
    public sendNavigateToSingleAksClusterReOnboarding(): void {
        this.sendMessageToParentBlade('navigateToReOnboarding', {});
    }

    /** Sends a navigation message to frame blade to close onboarding page */
    public sendCloseSingleAksClusterOnboarding(messageData?: any): void {
        this.sendMessageToParentBlade('closeOnboarding', messageData);
    }

    /** Sends a navigation message to frame blade to go to health page and specific tab for the given cluster and workspace resource Ids */
    public sendNavigateToSingleAksClusterHealth(messageData: ISingleAksClusterNavigationMessage): void {
        this.sendMessageToParentBlade('navigateToHealth', messageData);
    }

    /** Sends a navigation message to frame blade to go to the AKS Overview page for the given cluster */
    public sendNavigateToSingleAksClusterOverview(messageData: ISingleAksClusterNavigationMessage): void {
        this.sendMessageToParentBlade('navigateToAKSOverview', messageData);
    }

    /** Sends a navigation message to multi aks cluster frame blade to refresh the data from backend */
    public sendRefreshRequestForMultiClusterPage(messageData: string): void {
        this.sendMessageToParentBlade('refreshRequested', messageData);
    }

    /**sends environment (aka cloud) type change request to Multi Aks cluster page */
    public sendEnvironmentChangeRequestToMultiAksClusterPage(messageData: any): void {
        this.sendMessageToParentBlade('cloudTypeChangeRequested', {
            cloudType: messageData
        });
    }

    /** Sends a message to Monitoring extension to show alert that deployment has started or update it based on the message data */
    public sendUpdateNotification(messageData: any): void {
        this.sendMessageToParentBlade('updateNotification', messageData);
    }

    public sendRequestForToken(messageData: string): void {
        this.sendMessageToParentBlade('requestForToken', messageData);
    }

    // send notification to Frame blade that page has finished loading
    public sendFinishedLoading(data: any): void {
        this.sendMessageToParentBlade('finishedLoadingIFrame', data);
    }

    /** Sends updated time range of Single VM Map Iframe to its blade */
    public sendTimeRangeToSingleVMMapBlade(messageData: any): void {
        this.sendMessageToParentBlade('timeRangeUpdated', messageData);
    }

    // send open workbook to frame blade to open workbook with given parameters
    public sendOpenWorkbook(messageData: IWorkbookMessage): void {
        this.sendMessageToParentBlade('navigateToWorkbook', messageData);
    }

    // Sends create alert rule signal to blade along with metricId
    public sendCreateAlertRule(messageData: VmInsightsCreateAlertRuleParams): void {
        this.sendMessageToParentBlade('createAlertRule', messageData);
    }

    // send message to parent blade to pin the selected container insights chart to dashboard message
    public sendPinContainerInsightsChartToDashboardMessage(messageData: ContainerInsightsPinChartToDashboardMessage): void {
        this.sendMessageToParentBlade('pinInsightsChartToDashboard', messageData);
    }

    public sendAtScalePinChartToDashboardMessage(messageData: AtScalePinChartToDashboardMessage): void {
        this.sendMessageToParentBlade('atScalePinChartToDashboardMessage', messageData);
    }

    public sendSingleVmPinChartToDashboardMessage(messageData: SingleVmPinChartToDashboardMessage): void {
        this.sendMessageToParentBlade('singleVmPinChartToDashboard', messageData);
    }

    public sendNavigateToAlertsManagementBladeCommand(messageData: any): void {
        this.sendMessageToParentBlade('navigateToAlertsManagement', messageData);
    }

    public sendNavigateToHealthCriteriaListOfInstance(): void {
        this.sendMessageToParentBlade('navigateToHealthCriteriaListOfInstance', {});
    }

    public sendNavigateToHealthServiceListOfInstance(): void {
        this.sendMessageToParentBlade('navigateToHealthServiceListOfInstance', {});
    }

    public sendNavigateToResourceHealth(): void {
        this.sendMessageToParentBlade('navigateToResourceHealth', {});
    }

    public sendVmInsightsSolutionType(messageData: string): void {
        this.sendMessageToParentBlade('solutionType', {
            solutionType: messageData
        });
    }

    public sendUpdatedScopeSelections(messageData: BladeParameters.ScopeSelections): void {
        this.sendMessageToParentBlade('scopeSelectionsChanged', messageData);
    }

    public sendRetrieveGuestHealth(): void {
        this.sendMessageToParentBlade('retrieveGuestHealth', {});
    }

    public sendRetrievePlatformHealth(): void {
        this.sendMessageToParentBlade('retrievePlatformHealth', {});
    }

    public sendRetrieveHealth(): void {
        this.sendMessageToParentBlade('retrieveHealth', {});
    }

    /**
     * Let the monitoring extension know that we have failed to load the blade in some
     * critical manner, that they should take over for us (today it can show 'accessDenied' and
     * all other reasons will result in an onboarding page)
     * @param reason reason for the blade load failure ('accessDenied' will display ibiza page)
     */
    public bladeLoadFailure(reason: string): void {
        // If we are checking bladeId, make space for the bladeId in the
        // message data by making it an object
        let data = this.bladeId ? { reason } : reason;
        this.sendMessageToParentBlade('bladeLoadFailure', data);
    }

    /**
     * Sends a generic client notification, will be displayed in the Ibiza notification sidebar
     * @param title Title of the notification
     * @param message Message of the notification
     * @param level Level of the notification (e.g. Information, Warning, Error, etc.)
     */
    public sendClientNotification(title: string, message: string, level: DependencyMap.NotificationStatus): void {
        let notificationMessage: IClientNotificationMessage = {
            title: title,
            message: message,
            level: level
        };
        this.sendMessageToParentBlade('clientNotification', notificationMessage);
    }

    //get any query string param from the querystring array
    public getQueryStringParam(paramName: string): string {
        const param = this.queryStringParams[paramName];
        if (!param) { return undefined; }
        return decodeURIComponent(param);
    }

    //
    // registers inbound event processor for a given event type (kind)
    //
    public registerProcessor(eventKind: string, processorCallback: any, frameId?: string): void {
        this.eventProcessors[eventKind] = processorCallback;
        if (frameId) {
            switch (frameId) {
                case ContainerInsightsIFrameIds.containerInsightsAtScale:
                    (window as any).containerInsightsAtScale.performanceMeasures['frame_registerProcessor_' + eventKind] = Date.now();
                    break;
                case ContainerInsightsIFrameIds.containerInsights:
                    (window as any).containerInsights.performanceMeasures['frame_registerProcessor_' + eventKind] = Date.now();
                    break;
                default:
                    break;
            }
        }
    }

    private sendMessageToParentBlade(message: string, messageData: any): void {
        if (messageData) {
            if (this.bladeId) {
                if (typeof (messageData) !== 'object') {
                    throw 'messageData should be an object when communicating with a blade that \
uses bladeId because we want to pass the bladeId as well';
                }

                messageData.bladeId = this.bladeId;
            }
        }

        if (window.parent !== window) { // this cant be static, the constructor must run for this to succeed
            window.parent.postMessage({
                kind: message,
                data: messageData,
                signature: MessageSignature,
                frameId: this.frameId
            }, this.shellSrc);
        }
    }

    //
    // processes messages from container to this application
    //
    private receiveMessage(event: any): void {
        let processor: any = null;

        try {
            // it is critical that we only allow trusted messages through.
            // Any domain can send a message event and manipulate the html.
            // it is recommended that you enable the commented out check below
            // to get the portal URL that is loading the extension.
            let eventOrigin: string = event.origin;

            // inbound event must have origin
            if (!eventOrigin) {
                throw new Error('Event received missing origin field');
            }

            // origin of the event must be one of the pre-defined trusted ones
            eventOrigin = eventOrigin.toLowerCase();

            if ((eventOrigin !== TrustedParentOrigin) &&
                (eventOrigin !== TrustedParentOriginInternal) &&
                (eventOrigin !== TrustedParentDogfoodOrigin) &&
                (eventOrigin !== TrustedParentRcOrigin) &&
                (eventOrigin !== TrustedParentOriginFairfax) &&
                (eventOrigin !== TrustedParentOriginMooncake) &&
                (eventOrigin !== TrustedParentEXOrigin) &&
                (eventOrigin.indexOf('localhost') === -1)
            ) {
                throw new Error('Received event origin of [' + eventOrigin + '] does not match any trusted origin');
            }

            // ignore events with no payload
            if (!event.data) {
                throw new Error('Received event is missing "data" field');
            }

            // ignore events with incorrect signatures
            if (event.data.signature !== MessageSignature) {
                throw new Error('Received event with unexpected signature of [' + event.data.signature + ']');
            }

            // If the messages are coming from VmInsights blades then check for below conditions before processing them.
            // Exclude theme message, we want it at beginning.
            if (event.data.data.solution && event.data.data.solution === Solution.VmInsights
                && event.data.kind !== StyleThemingMessageKind) {
                if (!event.data.data.receivedReady) {
                    console.warn('Received message with receivedReady false');
                    return;
                }

                const frameId: string = event.data.data && event.data.data.iframeId;
                if (this.frameId !== frameId) {
                    return;
                }
            }

            let data: any = null;
            if (event.data.data && event.data.data.rawData) {
                try {
                    data = JSON.parse(event.data.data.rawData);
                } catch (e) {
                    console.warn('data present, json parse failure: ' + e);
                    return;
                }
            }

            const kind: string = event.data.kind;
            const receivedBladeId = event.data.data && event.data.data.bladeId;
            if (receivedBladeId) { // The blade sent a bladeId, which means we should use it
                if (this.bladeId) {
                    // If the messageProvider bladeId is already set, ignore the
                    // message if the id doesn't match
                    if (this.bladeId !== receivedBladeId) {
                        return;
                    }
                } else if (kind === InitMessageKind) {
                    this.bladeId = receivedBladeId;
                }
            }


            // Since Refresh does not need data.data, check for it
            // before checking data.data
            if (kind === RefreshKind) {
                this.processRefreshMessage();
                return;
            }

            if (!data) {
                console.warn('data completely missing for this packet!');
                return;
            }

            // bbax: hack for multi-cluster until they can move to the
            // new message provider (or Vitaly can show me how to make the two play
            // nice... currently this one throws up all over the place)
            if (kind === 'localeStrings') {
                if ((this.eventProcessors['localeStrings'])) {
                    this.eventProcessors.localeStrings({ detail: event.data.data });
                }
                return;
            }

            // ak: for vm insights, locale will be typically included as part of init
            // messages to iframe
            if (data.localeStrings) {
                LocaleStringsHandler.Instance().translateRawLocale(data.localeStrings);
            }

            // record last sequence number
            const sequenceNumber: number = data.sequenceNumber;

            if (sequenceNumber <= this.lastReceivedMessageSequenceNumber) {
                throw new Error(
                    'Received event with out of order sequence number of '
                    + '[' + sequenceNumber + ']. '
                    + 'Last recorded sequence number is '
                    + '[' + this.lastReceivedMessageSequenceNumber + ']');
            }

            switch (kind) {
                case InitMulticlusterMessageKind:
                    processor = () => { this.processMulticlusterInitMessage(data); };
                    break;
                case InitMessageKind:
                    processor = () => { this.processInitMessage(data); };
                    break;
                case StyleThemingMessageKind:
                    processor = () => { this.processStyleThemingMessage(data); };
                    break;
                case LoadCompleteKind:
                    processor = () => { this.processLoadCompleteMessage(data); }
                    break;
                case CustomMessageKind:
                    processor = () => { this.processCustomMessage(data); }
                    break;
                case UpdateAggregatePerfScopeKind:
                    processor = () => { this.processUpdateAggregatePerfScope(data); };
                    break;
                case ArmTokenKind:
                    processor = () => { this.processArmTokenMessage(data); }
                    break;
                case ServiceMapInitKind:
                    processor = () => { this.processServiceMapInitMessage(data); }
                    break;
                case HealthInitKind:
                    processor = () => { this.processHealthInitMessage(data); }
                    break;
                case ClusterProperties:
                    processor = () => {} // This uses the PortalMessagingProvider, but this messaging provider still receives all messages
                    break;
                case AksProxyAuthorizationToken:
                    processor = () => {} // This uses the PortalMessagingProvider, but this messaging provider still receives all messages
                    break;
                default:
                    throw new Error('Received event with unexpected messge kind of [ ' + kind + ' ]');
            }

            this.lastReceivedMessageSequenceNumber = sequenceNumber;
        } catch (e) {
            // todo: Use more sophisticated error reporting
            console.error('[vminsights.app][receive-message] Error: ' + e.message + '. Event: ' + JSON.stringify(event));
            return;
        }

        // invoke event processor
        if (processor) {
            processor();
        }
    }

    /**
     * processes refresh message from hosting framework
     */
    private processRefreshMessage() {
        if (this.eventProcessors[RefreshMessageProcessorType]) {
            this.eventProcessors.refresh();
        }
    }

    /**
     * processes style theming message from hosting framework
     */
    private processStyleThemingMessage(data: any): void {
        if (!data) {
            console.warn('Invalid blade message');
        }

        if (data.sequenceNumber === null || data.sequenceNumber === undefined) {
            throw 'missing sequence number!';
        }

        if ((this.eventProcessors[StyleThemingMessageProcessorType])) {
            this.eventProcessors.theme(data.theme);
        }
    }

    /**
     * process the multi cluster init message received from hosting frame work
     * @param data
     */
    private processMulticlusterInitMessage(data: any): void {
        if (!data || !data.version) {
            console.warn('Invalid multi-cluster blade message');
            return;
        }

        if (data.sequenceNumber === null || data.sequenceNumber === undefined) {
            throw 'missing sequence number!';
        }

        if (data.initialNavigationContext) {
            const navigationContext: any = JSON.parse(data.initialNavigationContext);

            SettingsManager.LoadSettings(navigationContext);

            SettingsManager.$app.isLocalHost = this.localHost();
        }

        let authorizationHeaderValue = null;


        switch (data.version) {
            case 3:
                // version 3 of the iframe message has token in authHeaderValue property
                authorizationHeaderValue = data.authHeaderValue;
                break;
            case 4:
                // version 4 of the iframe message has token in logAnalyticsAuthorizationHeaderValue property
                authorizationHeaderValue = data.logAnalyticsAuthorizationHeaderValue;
                break;
        }

        //gangams: since we are not making log analytics queries for the initial load
        // hence logAnalyticsAuthorizationHeaderValue will be null for the initial message
        if (data.messageDataRefreshVersion > 0) {
            if (!authorizationHeaderValue) {
                console.warn('Invalid multi-cluster blade message - missing authorization token');
                return;
            }
        }

        if ((this.eventProcessors[InitMulticlusterMessageProcessorType])) {
            this.eventProcessors[InitMulticlusterMessageProcessorType](
                authorizationHeaderValue,
                data.sequenceNumber,
                data.monitoredClusters,
                data.nonMonitoredClusters,
                data.messageDataRefreshVersion,
                data.selectedGlobalSubscriptionCount,
                data.oneOfSelectedGlobalSubscriptionId,
                data.azureCloudType,
                data.featureFlags
            );
        }
    }

    /**
    * Invoked when we recieve a loadComplete message from Monitoring Extension (which itself is just when
    * the iFrame told them we were done... but due to the dereferencing count we don't know which event finally
    * triggers ibiza resolve).  This allows that mechanism to tell us when the final resolution occurs (ibizaResolve event)
    * @param data the measures given to us from the Monitoring Extension telemetry measuring points plus sequence number
    */
    private processLoadCompleteMessage(data: any): void {
        if (!data) {
            console.warn('Invalid blade message');
        }

        if (data.sequenceNumber === null || data.sequenceNumber === undefined) {
            throw 'missing sequence number!';
        }

        if ((this.eventProcessors[LoadCompleteMessageProcessorType])) {
            this.eventProcessors.loadComplete(data);
        }
    }

    private processArmTokenMessage(data: any): void {
        if (!data) {
            console.warn('Invalid blade message');
        }

        if (data.sequenceNumber === null || data.sequenceNumber === undefined) {
            throw 'missing sequence number!';
        }

        if (this.eventProcessors[ArmTokenMessageProcessorType]) {
            this.eventProcessors[ArmTokenMessageProcessorType](data);
        }
    }

    //
    // processes initialization message from hosting framework
    //
    private processInitMessage(data: any): void {
        if (!data) {
            console.warn('Invalid blade message');
            return;
        }

        // Processing the VmInsights init messages.
        if (data.hasOwnProperty('iframeId')) {
            this.processVmInsightsInitMessage(data);
        }

        let armAuthorizationHeaderValue = null;
        let logAnalyticsAuthorizationHeaderValue = null;

        if (!data.version || data.version === 3) {
            // version 3 of the iframe message has token in authHeaderValue property and not LA token
            armAuthorizationHeaderValue = data.authHeaderValue;
        } else if (data.version >= 4) {
            // version 4 of the iframe message has token in logAnalyticsAuthorizationHeaderValue property
            armAuthorizationHeaderValue = data.armAuthorizationHeaderValue;
            logAnalyticsAuthorizationHeaderValue = data.logAnalyticsAuthorizationHeaderValue;
        }

        if (data.sequenceNumber === null || data.sequenceNumber === undefined) {
            throw 'missing sequence number!';
        }

        if (data.initialNavigationContext) {
            const navigationContext: any = JSON.parse(data.initialNavigationContext);

            SettingsManager.LoadSettings(navigationContext);

            SettingsManager.$app.isLocalHost = this.localHost();
        }

        // Processing the Mesh Insights init message
        if (data.hasOwnProperty('applicationResourceId')) {
            this.eventProcessors[InitInBladeMessageProcessorType](
                armAuthorizationHeaderValue,
                logAnalyticsAuthorizationHeaderValue,
                data.sequenceNumber,
                data.applicationResourceId,
                data.selectedTab,
                data.pillSelectionsOnNavigation,
                data.initiatorBlade
            );
            return;
        }
        // check to see if we're getting initialization message indicating
        // we're running in-blade experience
        if ((this.eventProcessors[InitInBladeMessageProcessorType]) &&
            (data.version >= 3) &&
            (data.isInBlade)) {
            this.eventProcessors[InitInBladeMessageProcessorType](
                armAuthorizationHeaderValue,
                logAnalyticsAuthorizationHeaderValue,
                data.sequenceNumber,
                data.workspaceResourceId,
                data.containerClusterName,
                data.containerClusterResourceId,
                data.featureFlags,
                data.selectedTab,
                data.pillSelectionsOnNavigation,
                data.initiatorBlade,
                data.azureCloudType
            );
        } else if (this.eventProcessors[InitMessageProcessorType]) {
            // vitalyf: message version 3 and above supports single cluster
            //          blade for Container Insights
            // bbax: V1 of the protocol used workspaces,V2 uses workspacesCacheList
            const workspaceList: any[] = data.workspaces ? data.workspaces : data.workspacesCacheList;

            if (workspaceList) {
                let selectedWorkspaceLoad: any = data.selectedWorkspace;

                const selectedWorkspaceOverride: IWorkspaceInfo = SettingsManager.GetObject<IWorkspaceInfo>('workspace', {});
                if (selectedWorkspaceOverride) {
                    selectedWorkspaceLoad = selectedWorkspaceOverride;
                }

                this.eventProcessors.init(
                    armAuthorizationHeaderValue,
                    logAnalyticsAuthorizationHeaderValue,
                    data.sequenceNumber,
                    workspaceList,
                    data.subscriptionsCacheList, // V2 only, will be undefined in V1 beware
                    selectedWorkspaceLoad,
                    data.isLoaded,
                    data.errorsOnLoadList,
                    data.initiatorBlade,
                    data.selectedComputerGroup,
                    data.featureFlags, // displayScopeSelector is in V2 only, will be undefined in V1 beware
                    // Naga TODO: Add a settings manager to handle mutiple feature flags
                    // Task189621 (https://msecg.visualstudio.com/DefaultCollection/OMS/_workitems/edit/189621)
                    data.correlationId,
                    data.timeData
                );
            } else {
                throw 'workspace list is empty';
            }
        }
    }


    /**
     * Process a request to set the aggregate perf scope
     * @param  {*} data question data
     */
    private processUpdateAggregatePerfScope(data: any): void {
        const handler = this.eventProcessors[UpdateAggregatePerfScopeProcessorType];
        if (handler) {
            handler(
                data.scopeSelections,
                data.subscriptionList,
                data.workspaceList
            );
        }
    }

    /**
     * @param data Method to process init messages of VmInsights
     */
    private processVmInsightsInitMessage(data: any): void {
        if (!data.hasOwnProperty('iframeId') || StringHelpers.isNullOrEmpty(data.iframeId)) {
            return;
        }

        let handler: any;
        switch (data.iframeId) {
            case VmInsightsIFrameIds.AtScaleComputePerf:
                handler = this.eventProcessors[InitAtScaleComputePerfMessageProcessorType];
                break;
            case VmInsightsIFrameIds.AtScaleComputeMap:
                handler = this.eventProcessors[InitAtScaleComputeMapMessageProcessorType];
                break;
            case VmInsightsIFrameIds.SingleVMComputeMap:
                handler = this.eventProcessors[InitSingleVmComputeMapMessageProcessorType];
                break;
            case VmInsightsIFrameIds.SingleVMComputePerf:
                handler = this.eventProcessors[InitSingleVmComputePerfMessageProcessorType];
                break;
        }

        if (handler) {
            handler(data);
        }
    }

    /**
     * Processes custom messages recieved from Ibiza blade.
     * This is useful if we have to update the IFrame component based on user actions in Ibiza blade.
     *
     * TODO ak: this needs to be redesigned for better scalability
     *
     * @private
     * @param {*} data
     * @memberof MessagingProvider
     */
    private processCustomMessage(data: any): void {
        if (!data) {
            console.warn('Invalid blade message');
        }

        if (data.sequenceNumber === null || data.sequenceNumber === undefined) {
            throw 'missing sequence number!';
        }

        if (this.eventProcessors[MapCustomMessageProcessorType] && data.mapCustomMessage) {
            this.eventProcessors[MapCustomMessageProcessorType](
                data.scopeSelections,
                data.subscriptionList,
                data.workspaceList
            );
        } else if (this.eventProcessors[SubscriptionListUpdateMessageProcessorType] && data.subscriptionList) {
            this.eventProcessors[SubscriptionListUpdateMessageProcessorType](data.subscriptionList);
        }
    }

    private processServiceMapInitMessage(data: any): void {
        if (!data) {
            console.log('Invalid blade message');
        }

        if (this.eventProcessors[ServiceMapInitMessageProcessorType]) {
            this.eventProcessors[ServiceMapInitMessageProcessorType](data);
        }
    }

    private processHealthInitMessage(data: any): void {
        if (!data) {
            console.log('Invalid blade message');
        }

        if (this.eventProcessors[HealthInitMessageProcessorType]) {
            this.eventProcessors[HealthInitMessageProcessorType](data);
        }
    }

    private localHost(): boolean {
        return window.location.host.indexOf('localhost') >= 0;
    }

    private parseQueryString = function (queryString: string) {
        let queryStringParams = {}, queries, temp;

        //remove the '?' prefix from query string
        if (queryString && queryString.length > 1 && queryString.substring(0, 1) === '?') {
            queryString = queryString.substr(1, queryString.length - 1);
        }
        queries = queryString.split('&');

        for (let i = 0; i < queries.length; i++) {
            temp = queries[i].split('=');
            if (temp) {
                queryStringParams[temp[0]] = temp[1];
            }
        }
        return queryStringParams;

    }
}
