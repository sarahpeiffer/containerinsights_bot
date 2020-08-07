import * as React from 'react';
import { DisplayStrings } from './DisplayStrings';
import {
    DropdownWithLinks,
    ComboBoxHeader,
    DropdownMessage,
    DropdownOption,
} from 'appinsights-iframe-shared';

import { IMessagingProvider } from './MessagingProvider';


// svg
import { FeedbackSvg } from './svg/feedback';
import { HappySvg } from './svg/happy';
import { SadSvg } from './svg/sad';

// style
import '../../styles/shared/FeedbackDropdown';


const openFeedbackBladeParentMessageId = 'openFeedbackBladeAction';

/**
 * React properties for the FeedbackDropdown
 * This component is a wrapper around the appinsights-iframe-shared ComboBox+DropdownWithLinks
 */
export interface IFeedbackDropdownProperties {
    messageProvider: IMessagingProvider;
    /** additional className */
    className?: string;
}

/**
 * Main react component for the FeedbackDropdown
 * This component is a wrapper around the appinsights-iframe-shared ComboBox+DropdownWithLinks
 */
export class FeedbackDropdown extends React.Component<IFeedbackDropdownProperties> {
    /**
     * Component.render() primary react render implementation
     * @returns {JSX.Element}
     */
    public render(): JSX.Element {
        const displayName = DisplayStrings.FeedbackDropdownDisplayString;
        const comboBoxHeader = <ComboBoxHeader displayName={displayName} icon={<FeedbackSvg />} />;
        let wrapperClassName = 'combobox-dropdown-wrapper';
        wrapperClassName += this.props.className ? ` ${this.props.className}` : '';
        
        return (
            <DropdownWithLinks
                flyoutClassName={'dropdown-flyout right-flyout-direction'}
                wrapperClassName={wrapperClassName}
                onChange={() => {}}
                label={displayName}
                header={comboBoxHeader}
                role={'combobox'}
                messageService={this.props.messageProvider.getAppInsightsProvider()} // bbax: not used by the DropdownAction...
                options={this.generateFeedbackDropdownOptions()} 
            />
        );
    }

    /**
     * Menu options for the feedback dropdown
     * @returns {DropdownOption[]} array of dropdown options
     */
    private generateFeedbackDropdownOptions(): DropdownOption[] {
        return [
            new DropdownMessage('SendSmile', DisplayStrings.FeedbackDropdownSendASmile, openFeedbackBladeParentMessageId,
                { rating: '5' }, <HappySvg />),
            new DropdownMessage('SendFrown', DisplayStrings.FeedbackDropdownSendAFrown, openFeedbackBladeParentMessageId,
                { rating: '1' }, <SadSvg />),
        ];
    }
}
