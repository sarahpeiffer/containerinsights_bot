import * as React from 'react';
import { DisplayStrings } from '../../../shared/DisplayStrings';
import { InfoBlueSVG } from '../../../shared/svg/InfoBlue';
import { ILocalStorageWrapper } from '../../../shared/data-provider/LocalStorageProvider';
import { ITelemetry, TelemetryMainArea } from '../../../shared/Telemetry';
import { IInitEventProps } from '../../messaging/IInitEventProps';
import { BannerBar, IBannerBarProps } from './BannerBar';
import { HelperFunctions } from '../HelperFunctions';
import { ContainerGlobals } from '../../ContainerGlobals';
import { StringHelpers } from '../../../shared/Utilities/StringHelpers';
import { MdmCustomMetricAvailabilityLocations } from '../../../shared/MdmCustomMetricAvailabilityLocations';
import * as $ from 'jquery';
import { TelemetryFactory } from '../../../shared/TelemetryFactory';
import { SingleClusterTab } from '../../ContainerMainPage';

export enum BannerType {
    MdmBanner = 'MdmBanner',
}

interface BannerBarManagerProps {
    localStorageManager: ILocalStorageWrapper;
    clusterLocation: string;
    clusterResourceId: string;
    mdmBannerOnClickHandler: () => void;
    banners: BannerType[];
    isVisible: boolean;
    setVisibility: (isVisible: boolean) => void;
    selectedTab: SingleClusterTab;
}

interface BannerBarManagerState {
    banner: BannerType;
}

const sixtyMinsInMilliseconds: number = 3600000;
const twoHoursInMilliseconds: number = 7200000;

export class BannerBarManager extends React.Component<BannerBarManagerProps, BannerBarManagerState> {
    telemetry: ITelemetry;
    constructor(props) {
        super(props);

        this.telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);

        this.state = {
            banner: this.getActiveBanner()
        }

        this.mdmCloseOnClickHandler = this.mdmCloseOnClickHandler.bind(this);
    }

    /** React callback after component was mounted into DOM */
    public componentDidMount(): void {
        if (this.state.banner && this.props.isVisible) {
            this.telemetry.logEvent(
                `${this.state.banner}Displayed`, // Change telemetry dashboard
                { clusterLocation: this.props.clusterLocation },
                undefined
            );
        }
    }

    render(): JSX.Element {
        let banner: JSX.Element = null;
        if (this.state.banner && this.props.isVisible) {
            const bannerProps: IBannerBarProps = this.getBannerProps(this.state.banner);
            banner = 
                <BannerBar
                    text={bannerProps.text}
                    linkText={bannerProps.linkText}
                    buttonText={bannerProps.buttonText}
                    svg={bannerProps.svg}
                    documentationUrl={bannerProps.documentationUrl}
                    onClickHandler={bannerProps.onClickHandler}
                    closeOnClickHandler={bannerProps.closeOnClickHandler}
                /> 

            $('content-details-pane').addClass('content-details-pane-height-with-banner');
        } else {
            $('content-details-pane').removeClass('content-details-pane-height-with-banner');
        }

        return banner;
    }

    private showBanner(bannerType: BannerType): boolean {
        let showBanner: boolean = false;
        if (bannerType === BannerType.MdmBanner) {
           showBanner = this.showMdmBanner();
        } 
        this.props.setVisibility(showBanner);
        return showBanner;
    }

    /**
     * True or false, should the MDM onboarding banner after preload is complete...
     * @param initializationEvent the init event from preload script
     */
    private showMdmBanner(): boolean {
        // mdm metrics is only available for AKS clusters
        if (!HelperFunctions.isAKSCluster(this.props.clusterResourceId)) { return false; }

        // banner is hidden if it had been closed by the user in the last 60 mins on ANY cluster
        const bannerClosedByUser: string = this.props.localStorageManager.getItem('mdmOnboardingBannerClosedByUserDateTime');
        if (!StringHelpers.isNullOrEmpty(bannerClosedByUser)) {
            const timeDiff = Date.now() - parseInt(bannerClosedByUser, 10);
            if (timeDiff < sixtyMinsInMilliseconds) { return false; }
        }

        // banner is hidden if the user successfully enabled MDM metrics in the last 2 hours,
        // since the agent can take upto 2 hours to actually start posting data to the cluster  
        const bannerEnableSuccess: string = 
            this.props.localStorageManager.getItem(`mdmEnableSuccess${this.props.clusterResourceId}DateTime`);
        if (!StringHelpers.isNullOrEmpty(bannerEnableSuccess)) {
            const timeDiff = Date.now() - parseInt(bannerEnableSuccess, 10);
            if (timeDiff < twoHoursInMilliseconds) { return false; }
        }

        // banner is hidden if the user has ever queried MDM successfully before
        const { initializationEvent } = ContainerGlobals.preloadState;
        const data: IInitEventProps = JSON.parse(initializationEvent.detail.rawData) as IInitEventProps;
        const clusterResourceId: string = data.containerClusterResourceId || '';

        const queriedMdmBefore: string = this.props.localStorageManager.getItem(`mdmQuery${clusterResourceId}DateTime`);
        if (!StringHelpers.isNullOrEmpty(queriedMdmBefore)) { return false; }

        const bladeLocation = data.containerClusterLocation || '';
        const isAvailableLocation: boolean = MdmCustomMetricAvailabilityLocations.indexOf(bladeLocation.toLocaleLowerCase()) > -1;
        const isLoadedFromMdm: boolean = ContainerGlobals.preloadState.isLoadedFromMdm;
        
        /**
         * Why does tab matter?
         * We cannot differentiate between MDM onboarded clusters vs non-onboarded clusters from the UX
         * The cluster tab is the only place we make a call to both MDM and Kusto. 
         * If Kusto returns faster and its an MDM supported region we show the banner.
         */
        const isClusterTab: boolean = this.props.selectedTab === SingleClusterTab.ContainerCluster ? true : false; 

        if (isAvailableLocation 
            && isClusterTab 
            && !StringHelpers.isNullOrEmpty(clusterResourceId)
            && isLoadedFromMdm
        ) {
            this.props.localStorageManager.setItem(`mdmQuery${clusterResourceId}DateTime`, Date.now().toString());
            return false;
        }
            
        return (isAvailableLocation && !isLoadedFromMdm && isClusterTab);
    }

    private getBannerProps(bannerType: BannerType) {
        const bannerProps: IBannerBarProps = {
            text: undefined, 
            buttonText: undefined,
            svg: undefined,
            linkText: undefined,
            onClickHandler: undefined,
            documentationUrl: undefined,
            closeOnClickHandler: undefined
        };

        if (bannerType === BannerType.MdmBanner) {
            bannerProps.text = DisplayStrings.MdmBannerText;
            bannerProps.linkText = DisplayStrings.MdmBannerLinkText;
            bannerProps.buttonText = DisplayStrings.MdmBannerEnableButton;
            bannerProps.svg = <InfoBlueSVG />;
            bannerProps.documentationUrl = 'http://aka.ms/ci-enable-mdm';
            bannerProps.onClickHandler = this.props.mdmBannerOnClickHandler;
            bannerProps.closeOnClickHandler = this.mdmCloseOnClickHandler;
        }

        return bannerProps;
    }

    private mdmCloseOnClickHandler(): void {
        this.props.localStorageManager.setItem('mdmOnboardingBannerClosedByUserDateTime', Date.now().toString());
        this.props.setVisibility(false);
    }

    /** The active banner is the first banner in this.props.banners that this.showBanner returns true for */
    private getActiveBanner(): BannerType {
        for (let banner of this.props.banners) {
            if (this.showBanner(banner)) {
                return banner;
            }
        }

        return null;
    }
}
