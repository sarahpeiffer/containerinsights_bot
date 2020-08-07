import * as React from 'react';
import { MulticlusterGridBase } from './grids/MulticlusterGridBase';
import * as msg from '../shared/MessagingProvider';
import { MessagingProvider, ContainerInsightsIFrameIds } from '../shared/MessagingProvider';
import { AppInsightsProvider } from '../shared/CustomAppInsightMessagingProvider';
import * as $ from 'jquery';
import { ITelemetry, TelemetryMainArea, TelemetrySubArea } from '../shared/Telemetry';
import { LocaleStringsHandler } from '../shared/LocaleStringsHandler';
import { AzureCloudType, EnvironmentConfig } from '../shared/EnvironmentConfig';
import { MulticlusterMainPage } from './MulticlusterMainPage';
import { InitializationInfo, AuthorizationTokenType } from '../shared/InitializationInfo';
import moment = require('moment');
import { TelemetryFactory } from '../shared/TelemetryFactory';
import { IManagedCluster } from './metadata/IManagedCluster';

/** portal themes */
enum PortalThemes {
    Light = 'light',
    Dark = 'dark'
}

/**
 * props of Azure Portal Theme object
 */
interface IAzurePortalThemeObject {
    /** name of the object */
    name: string;
}

export interface IMultiClusterMessageHandlerProps {}
export interface IMultiClusterMessageHandlerState {
    isAuthorizationInfoReceived: boolean;
    sequenceNumber: number;
    processedMulticlusterInitEvent: boolean;
    selectedGlobalSubscriptionCount: number;
    featureFlags: any;
    isError: boolean;
    bodyTheme: string;
    monitoredClustersList: IManagedCluster[],
    unmonitoredClustersList: IManagedCluster[],
    oneOfSelectedGlobalSubscriptionId: string,
    authHeaderValue: string
}


export class MultiClusterMessageHandler extends React.Component<IMultiClusterMessageHandlerProps, IMultiClusterMessageHandlerState>  {
    private telemetry: ITelemetry;
    private messagingProvider: MessagingProvider = new MessagingProvider(new AppInsightsProvider());
    private messageDataRefreshVersion = 0;
    constructor(props) {
        super(props);

        (window as any).containerInsightsAtScale.performanceMeasures['frame_constructor'] = Date.now();

        this.state = {
            processedMulticlusterInitEvent: false,
            isAuthorizationInfoReceived: false,
            sequenceNumber: -1,
            featureFlags: undefined,
            isError: false,
            selectedGlobalSubscriptionCount: 0,
            bodyTheme: undefined,
            oneOfSelectedGlobalSubscriptionId: '',
            authHeaderValue: '',
            monitoredClustersList: [],
            unmonitoredClustersList: [],
        };

        this.messagingProvider.registerProcessor(
            msg.InitMulticlusterMessageProcessorType,
            this.onMulticlusterInit.bind(this),
            ContainerInsightsIFrameIds.containerInsightsAtScale
        );
        this.messagingProvider.registerProcessor(
            msg.StyleThemingMessageProcessorType,
            this.onStyleThemeInit.bind(this),
            ContainerInsightsIFrameIds.containerInsightsAtScale
        );
        this.messagingProvider.registerProcessor(
            msg.LoadCompleteMessageProcessorType,
            this.onLoadComplete.bind(this),
            ContainerInsightsIFrameIds.containerInsightsAtScale
        );
        this.messagingProvider.registerProcessor(
            'localeStrings',
            LocaleStringsHandler.Instance().handleLocaleEvent,
            ContainerInsightsIFrameIds.containerInsightsAtScale
        );

        LocaleStringsHandler.Instance().handleLocaleEvent(() => {
            this.forceUpdate();
        });

        this.telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
        this.telemetry.setContext(
            {
                subArea: TelemetrySubArea.MulticlusterMainPage,
                cloudType: 'uninitialized',
            },
            false
        );

        this.messagingProvider.startMessaging(ContainerInsightsIFrameIds.containerInsightsAtScale);
    }
    public render() {
            return (
                <MulticlusterMainPage 
                    processedMulticlusterInitEvent={this.state.processedMulticlusterInitEvent}
                    isAuthorizationInfoReceived={this.state.isAuthorizationInfoReceived}
                    sequenceNumber={this.state.sequenceNumber}
                    messageDataRefreshVersion={this.messageDataRefreshVersion}
                    featureFlags={this.state.featureFlags}
                    isError={this.state.isError}
                    selectedGlobalSubscriptionCount={this.state.selectedGlobalSubscriptionCount}
                    monitoredClustersList={this.state.monitoredClustersList}
                    unmonitoredClustersList={this.state.unmonitoredClustersList}
                    oneOfSelectedGlobalSubscriptionId={this.state.oneOfSelectedGlobalSubscriptionId}
                    authHeaderValue={this.state.authHeaderValue}
                />
            );
    }

    /**
    * Initializes main page 'in-blade'
    * @param authHeaderValue auth header value
    * @param sequenceNumber message sequence number
    * @param monitoredClustersList list of monitoredClusters managed clusters
    * @param unmonitoredClustersList list of non monitoredClusters managed clusters
    * @param messageDataRefreshVersion message refresh version
    * @param selectedGlobalSubscriptionCount count of selected global subscriptions
    * @param oneOfSelectedGlobalSubscriptionId one of the subscriptionId from selected global subscriptions
    * @param azureCloudType type of the cloud (optional)
    * @param featureFlags map of feature flags (optional)
    */
   private onMulticlusterInit(
        authHeaderValue: string,
        sequenceNumber: number,
        monitoredClustersList: any[],
        unmonitoredClustersList: any[],
        messageDataRefreshVersion: number,
        selectedGlobalSubscriptionCount: number,
        oneOfSelectedGlobalSubscriptionId: string,
        azureCloudType?: AzureCloudType,
        featureFlags?: StringMap<boolean>
    ): void {
        if (this.isInitialLoad()) {
            (window as any).containerInsightsAtScale.performanceMeasures['frame_firstInitMessageReceived'] = Date.now();
        }

        this.updateAuthorizationHeader(authHeaderValue);

        if (featureFlags && !this.state.featureFlags) {
            this.setState({ featureFlags: featureFlags });
        }

        if (!EnvironmentConfig.Instance().isConfigured()) {
            EnvironmentConfig.Instance().initConfig(azureCloudType, false);
            const safeAzureCloudType: string = azureCloudType ? AzureCloudType[azureCloudType] : '<null>';
            this.telemetry.setContext(
                {
                    subArea: TelemetrySubArea.MulticlusterMainPage,
                    cloudType: safeAzureCloudType,
                    selectedGlobalSubscriptionCount: selectedGlobalSubscriptionCount.toString(),
                    oneOfSelectedGlobalSubscriptionId: oneOfSelectedGlobalSubscriptionId,
                },
                false
            );
            this.telemetry.logPageView(TelemetrySubArea.MulticlusterMainPage.toString());
        }

        /**
         * This prevents our React app from constantly updating with each new message from Monex
         * We cannot rely on setState to update messageDataRefreshVersion before this init
         * function is called again because setState is asynchronous and batched. Otherwise, we 
         * could end up in the situation in which setState never executes because it keeps batching 
         * setState calls
         */
        if (messageDataRefreshVersion <= this.messageDataRefreshVersion) {
            return;
        } 

        // Handle errors
        let isError: boolean = false;
        if (!monitoredClustersList || !unmonitoredClustersList) {
            isError = true;
            monitoredClustersList = monitoredClustersList ? monitoredClustersList : [];
            unmonitoredClustersList = unmonitoredClustersList ? unmonitoredClustersList : [];
        }

        if (monitoredClustersList.length > 0 || unmonitoredClustersList.length > 0) {
            const allManagedClusters = monitoredClustersList.concat(unmonitoredClustersList);
            this.telemetry.setContext(
                MulticlusterGridBase.getTelemetryContext(
                    allManagedClusters,
                    selectedGlobalSubscriptionCount, 
                    oneOfSelectedGlobalSubscriptionId
                ), false
            );
        }

        //gangams: update messageDataRefreshVersion immediately to avoid multiple requeries for the same refresh or init action
        this.messageDataRefreshVersion = messageDataRefreshVersion;
        this.setState({
            sequenceNumber,
            processedMulticlusterInitEvent: true,
            oneOfSelectedGlobalSubscriptionId, 
            featureFlags,
            selectedGlobalSubscriptionCount,
            authHeaderValue,
            monitoredClustersList,
            unmonitoredClustersList,
            isError
        });
    }

 /**
     * initialize the azure portal theme
     * @param theme
     */
    private onStyleThemeInit(theme: IAzurePortalThemeObject) {
        if (!theme) {
            console.warn('No theme object was passed from Azure portal');
            return;
        }
        const themeName: string = theme.name;
        let bodyTheme: string;
        if (themeName) {
            switch (themeName) {
                case PortalThemes.Light:
                    bodyTheme = 'light'
                    break;
                case PortalThemes.Dark:
                    bodyTheme = 'dark';
                    break;
                default:
                    bodyTheme = 'light';
                    break;
            }
            $('body').removeClass(`${this.state.bodyTheme}`);
            $('body').addClass(`${bodyTheme}`);
            this.setState({ bodyTheme });
        }
    }

        /**
     * Strip off sequence number, calculate the time series as differences in milliseconds since auxme (AzureUX_Monitoring) constructor
     * was fired... this is our day zero... we only control the code from AUXM up to the the resolution of ibiza's promise... after that
     * we have zero control... any items registered to window.containerInsightsAtScale.performanceMeasures
     * object are ALL automatically appended
     * to the event and registered to telemetry... feel free to add timing points as desired but note this event only fires once on load.
     * @param measures measuring points given to us by Monitoring Extension
     */
    private onLoadComplete(measures: StringMap<number>): void {
        const constructorMoment = moment((measures.auxme_constructor as any));

        const finalTelemetryMeasures = Object.assign({},
            measures,
            (window as any).containerInsightsAtScale.performanceMeasures);

        // bbax: sequenceNumber not really needed here... strip it..
        delete finalTelemetryMeasures.sequenceNumber;

        // bbax: should be a few ms tops different then ibizaResolution, but lets put it here for peace of mind..
        finalTelemetryMeasures['onLoadComplete'] = Date.now();

        // bbax: order the keys so the console.logs are pretty... vanity!
        const keys = Object.keys(finalTelemetryMeasures);
        keys.sort((left, right) => {
            return finalTelemetryMeasures[left] - finalTelemetryMeasures[right];
        });

        // bbax: enumerate the keys, calculate their difference from now()
        console.log('-- Start of Page Load Telemetry Measures --');
        keys.forEach((key) => {
            const measureMoment = moment(finalTelemetryMeasures[key]);
            finalTelemetryMeasures[key] = measureMoment.diff(constructorMoment, 'milliseconds');
            console.log(`${key} : ${finalTelemetryMeasures[key]}`);
        });
        console.log('-- End of Page Load Telemetry Measures --');

        this.telemetry.logEvent('iFrameLoadMeasures', {}, finalTelemetryMeasures);
    }

    /**
     * update the auth header
     * @param authorizationHeaderValue
     */
    private updateAuthorizationHeader(authorizationHeaderValue: string) {
        const initInfo = InitializationInfo.getInstance();

        const tokenType = AuthorizationTokenType.LogAnalytics;

        if (initInfo.getAuthorizationHeaderValue(tokenType) !== authorizationHeaderValue) {
            initInfo.setAuthorizationHeaderValue(tokenType, authorizationHeaderValue);
        }

        if (!this.state.isAuthorizationInfoReceived) {
            (window as any).containerInsightsAtScale.performanceMeasures['frame_tokenReceived'] = Date.now();
            this.setState({ isAuthorizationInfoReceived: true });
        }
    }

    /**
     *  detect whether its initial Blade Load or not based on msg data version
     */
    private isInitialLoad(): boolean {
        return (this.messageDataRefreshVersion === -1);
    }
}
