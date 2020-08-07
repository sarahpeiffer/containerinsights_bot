import * as React from 'react';
import { LinkToNavigateAdaptor, ILinkToNavigate, LinkPosition } 
    from '../../compute/shared/property-panel/entity-properties/LinkToNavigateAdaptor';
import { ITelemetry } from '../Telemetry';

/** 
 * property representation for our stateless react component below
*/
export interface IPropertyPanelHeaderSectionProps {
    title: string;
    subTitle: string;
    icon: JSX.Element;
    linkToNavigate?: ILinkToNavigate;
    telemetry?: ITelemetry;
    logPrefix?: string;
}

/**
 * A basic panel showing  a header with title, subtitle, and provided icon and provided body below that. 
 * The body can use PropertyEnumerationBody
 */
export const PropertyPanelHeaderSection: React.StatelessComponent<IPropertyPanelHeaderSectionProps> = (props) => {
    let headerTitleWithTooltip =
            <div className='property-panel-header-text-title' tabIndex={0}
                onClick={() => !!props.linkToNavigate && (props.linkToNavigate.location === LinkPosition.center) &&
                    LinkToNavigateAdaptor.navigate(props.linkToNavigate, props.telemetry, props.logPrefix)}>{props.title}
            </div>;

    return (
        <div className='property-panel-header'>
            <div className='property-panel-header-icon-container'>
                <div className='property-panel-header-icon center'>
                    {props.icon}
                </div>
            </div>
            <div className='property-panel-header-content'>
                <div className='property-panel-header-text'>
                    {headerTitleWithTooltip}
                    <div className='property-panel-header-text-subtitle' tabIndex={0}>{props.subTitle}</div>
                </div>
            </div>
        </div>
    );
}


