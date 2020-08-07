import * as React from 'react';
import { DisplayStrings } from '../shared/DisplayStrings';
import { VmInsightsOnboardingImage } from '../../scripts/shared/svg/VmInsightsOnboarding';

/**
 * css imports
 */
import '../../styles/compute/AtScaleOnboarding.less';

export interface AtScaleOnboardingSectionProps {
}

export class AtScaleOnboardingSection extends React.Component<AtScaleOnboardingSectionProps> {
    constructor(props?: any) {
        super(props);
    }

    render(): JSX.Element {
        const zeroWorkspaceMessage: string = DisplayStrings.ZeroWorkspaceMessage;

        const OnboardingMessageTitle: string = DisplayStrings.OnboardingMessageTitle;
        const onboardingMessage: string = DisplayStrings.OnboardingMessage;

        const haveMoreQuestions: string = DisplayStrings.MoreQuestions;

        const learnMoreTitle: string = DisplayStrings.LearnMoreTitle;
        const learnMoreInstallTitle: string = DisplayStrings.LearnMoreInstallTitle;
        const learnMorePricingTitle: string = DisplayStrings.LearnMorePricingTitle;

        const learnMoreLink: string = 'https://aka.ms/vminsightsdocs';
        const learnMoreInstallLink: string = 'https://aka.ms/vminsightsinstall';
        const learnMorePricingLink: string = 'https://aka.ms/azuremonitorvmprice';

        return <div className='onboarding-section'>
            <div className='zero-workspace-message'>{zeroWorkspaceMessage}</div>
            <div className='onboarding-message-title'>{OnboardingMessageTitle}</div>
            <div className='onboarding-message'>{onboardingMessage}</div>
            <div className='onboarding-image'>
                <VmInsightsOnboardingImage />
            </div>
            <div>
                <div className='more-questions'>{haveMoreQuestions}</div>
                <div>
                    <div className='help-link'><a href={learnMoreLink} target='_blank'><span>{learnMoreTitle}</span></a></div>
                    <div className='help-link'><a href={learnMoreInstallLink} target='_blank'><span>{learnMoreInstallTitle}</span></a></div>
                    <div className='help-link'><a href={learnMorePricingLink} target='_blank'><span>{learnMorePricingTitle}</span></a></div>
                </div>
            </div>
        </div>;
    }
}
