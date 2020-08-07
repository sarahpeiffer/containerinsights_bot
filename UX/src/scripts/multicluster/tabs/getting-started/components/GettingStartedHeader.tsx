import * as React from 'react';
import './GettingStartedHeader.less';
import { DisplayStrings } from '../../../MulticlusterDisplayStrings';
import { ITelemetry } from '../../../../shared/Telemetry';
import * as TelemetryStrings from '../../../../shared/TelemetryStrings';

export interface IGettingStartedHeaderProps {
    telemetry: ITelemetry;
}

export const GettingStartedHeader = (props): JSX.Element => {
    const onClickHandler = () => {
        props.telemetry.logEvent('GettingStartedButtonClick', { button: TelemetryStrings.GettingStartedHeaderLearnMoreDocLink }, null)
    };

    return (
        <div className='getting-started-header'>
            <div className='title'>{DisplayStrings.GettingStartedHeaderTitle}</div>
            <div className='description'>
                {DisplayStrings.GettingStartedHeaderDescription + ' '} 
                <a 
                href='https://aka.ms/azuremonitorcontainer' 
                target='_blank' 
                onClick={onClickHandler}>
                    Learn more
                </a>
            </div>
        </div>
    );
}
