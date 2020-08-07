import * as React from 'react';

import { ExternalLinkSvg } from 'appinsights-iframe-shared';

import { Button } from '../shared/Button';
import { DisplayStrings } from '../shared/DisplayStrings';
import { OnboardingState } from './shared/OnboardingUtil';
import { MessagingProvider } from '../shared/MessagingProvider';
import { IVmResourceDescriptor } from './shared/VirtualMachineBase';

import { VmInsightsOnboardingImage } from '../../scripts/shared/svg/VmInsightsOnboarding';

import '../../styles/compute/ServiceMapOnboarding.less';

export interface ServiceMapOnboardingSectionProps {
    messagingProvider: MessagingProvider;
    onboardingState: OnboardingState;
    vm: IVmResourceDescriptor;
}

export class ServiceMapOnboardingSection extends React.Component<ServiceMapOnboardingSectionProps> {
    constructor(props?: ServiceMapOnboardingSectionProps) {
        super(props);

        this.knowMoreText = this.knowMoreText.bind(this);
        this.enableButton = this.enableButton.bind(this);
        this.isOnboardingSupported = this.isOnboardingSupported.bind(this);
    }

    render(): JSX.Element {
        return <div className='map-onboarding-section'>
            <div className='onboarding-image'>
                <VmInsightsOnboardingImage />
            </div>
            <div className='onboarding-midsection'>{ this.knowMoreText() }</div>
            <div className='onboarding-endsection'>{ this.enableButton() }</div>
        </div>
    }

    private knowMoreText(): JSX.Element {
        if (this.props.onboardingState && this.props.onboardingState.servicemap
            && this.props.onboardingState.servicemap.isOnboardingSupported) {
            return <>
                <div className='know-more-text-title'>{DisplayStrings.KnowMoreTitle}</div>
            </>;
        } else {
        return <>
            <div className='know-more-text'>{this.props.onboardingState.servicemap.knowMoreText}</div>
            <div className='have-more-questions'>{DisplayStrings.HaveMoreQuestions}</div>
            <div className='onboarding-learn-more-link'>
                <a href='https://aka.ms/vminsightsdocs' target='_blank'>
                    {DisplayStrings.FAQ}
                    <div className='external-link-svg'><ExternalLinkSvg /></div>
                </a>
            </div>
            <div className='onboarding-support-matrix-link'>
                <a href='https://aka.ms/azuremonitorvmprice' target='_blank'>
                    {DisplayStrings.SupportMatrix}
                    <div className='external-link-svg'><ExternalLinkSvg /></div>
                </a>
            </div>
        </>;
        }
    }

    private enableButton(): JSX.Element {
        if (this.isOnboardingSupported()) {
            return <Button label={DisplayStrings.TryNow + ' >'} className='onboarding-enable' action={() => {
                this.props.messagingProvider.sendOpenOnboardingPane(this.props.vm && this.props.vm.resourceId);
            }} />;
        } else {
            return null;
        }
    }

    private isOnboardingSupported(): boolean {
        return this.props.onboardingState && this.props.onboardingState.servicemap
            && this.props.onboardingState.servicemap.isOnboardingSupported;
    }
}
