import * as React from 'react';

import { CopySvg } from 'appinsights-iframe-shared';
import { ClipboardProvider } from '../Utilities/ClipboardProvider';
import { ITelemetry } from '../Telemetry';

import '../../../styles/shared/PropertyPanel.less';
import { InfoTooltip, InfoTooltipProps } from '../../compute/shared/InfoTooltip';
import { LinkToNavigateAdaptor, ILinkToNavigate, LinkPosition }
    from '../../compute/shared/property-panel/entity-properties/LinkToNavigateAdaptor';
/** 
 * Visualization information for simple property panel property (name + 1 or more values)
 */
export interface ISimplePropertyProps {
    propertyName: string;
    propertyValues: string[];
    customClassName?: string;
    propertyIcon?: JSX.Element;
    enableCopyToClipboard?: boolean;
    telemetry?: ITelemetry;
    logPrefix?: string;
    linkToNavigate?: ILinkToNavigate;
    infoTooltipProps?: InfoTooltipProps;
}

/**
 * Visualization component to display simple property (name + 1 or more values) on the property panel
 * @param props property's props
 */
export const SimpleProperty: React.StatelessComponent<ISimplePropertyProps> = (props) => {
    /**
     * Generates visualization for property values
     */

    function generatePropertyValues(): JSX.Element[] {
        if (!props.propertyValues) {
            return null;
        }

        let values: JSX.Element[] = [];

        props.propertyValues.forEach((value: string, index: number) => {
            if (value) {
                const iconClassname: string = !props.propertyIcon ? 'simple-property-value' : 'simple-property-value-icon';
                values.push(
                    <div key={index} className={iconClassname + (props.customClassName || '')} tabIndex={0}
                        onClick={() => !!props.linkToNavigate && props.linkToNavigate.location 
                            && props.linkToNavigate.location === LinkPosition.center &&
                            LinkToNavigateAdaptor.navigate(props.linkToNavigate, props.telemetry, props.logPrefix)}>
                        {!!props.propertyIcon && <span className='simple-property-icon'>{props.propertyIcon}</span>}
                        {value}
                        {!!props.infoTooltipProps && <InfoTooltip description={props.infoTooltipProps.description} ></InfoTooltip>}
                        {!!props.infoTooltipProps && !!props.linkToNavigate && props.linkToNavigate.location 
                            && props.linkToNavigate.location === LinkPosition.right &&
                            <a href={props.linkToNavigate.navigationContext.linkUri} target='_blank'>
                            {props.linkToNavigate.navigationContext.linkText}</a>}
                        {!!props.enableCopyToClipboard &&
                            <div className='copy-icon' onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                                e.stopPropagation();
                                copyToClipboard.bind(this)(value)
                            }}><CopySvg /> </div>}
                    </div>
                );
            }
        });

        return values;
    }

    function copyToClipboard(value: any): void {

        let clipboard: ClipboardProvider = new ClipboardProvider();
        clipboard.enact(value);
        props.telemetry.logEvent(`${props.logPrefix}.SimpleProperty.CopyToClipboard.Clicked`,
            { value: value }, {})
    }

    return (
        <div className='simple-property-container' key={props.propertyName}>
            <div className='simple-property' tabIndex={0}>
                {props.propertyName}</div>
            {generatePropertyValues()}
        </div>
    );
}
