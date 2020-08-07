import * as React from 'react';
import { DisplayStrings } from '../shared/DisplayStrings';
import { VmInsightsOnboardingImage } from '../shared/svg/VmInsightsOnboarding';
import { AtScaleUtils } from './shared/AtScaleUtils';
import { IAzureResourceDescriptor } from './shared/ResourceInfo';

/**
 * css imports
 */
import '../../styles/compute/AtScaleOnboarding.less';

export interface AzureAtScaleOnboardingSectionProps {
    resourceId: string;
    openOnboardingPane: (resourceId: string) => void;
}


/**
 * This class is responsible to display the onboarding message in AtScale Map (Azure Mode)
 * when the selected scope has no workspace connected. 
 *
 * @export
 * @class AzureAtScaleOnboardingSection
 * @extends {React.Component<AzureAtScaleOnboardingSectionProps>}
 */
export class AzureAtScaleOnboardingSection extends React.Component<AzureAtScaleOnboardingSectionProps> {
    constructor(props?: any) {
        super(props);
    }

    render(): JSX.Element {
        const resourceDescriptor: IAzureResourceDescriptor = AtScaleUtils.getAzureComputeResourceDescriptor(this.props.resourceId);
        const azureOnboardingMessage: string = resourceDescriptor?.resources ? DisplayStrings.AzureOnboardingMessageTitle :
            DisplayStrings.AzureOnboardingNoVMTitle;

        return <div className='azure-onboarding-section'>
            <div className='onboarding-image'>
                <VmInsightsOnboardingImage />
            </div>
            <div className='onboarding-body'>
                <div className='zero-workspace-message'>{azureOnboardingMessage}</div>
            </div>
            {resourceDescriptor?.resources && <div>
                <button className='onboarding-button' title={DisplayStrings.AzureOnboardEnableButton}
                    onClick={() => { this.props.openOnboardingPane(this.props.resourceId) }} >
                    {DisplayStrings.AzureOnboardEnableButton}
                </button>
            </div>}
        </div>;
    }
}
