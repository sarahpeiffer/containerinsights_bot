/**
 * Block imports
 */
import * as React from 'react';
import { TooltipService, InfoSvg } from 'appinsights-iframe-shared';
import { Utility } from '../../shared/Utilities/Utility';

export interface InfoTooltipProps {
    description: string
}

export class InfoTooltip extends React.Component<InfoTooltipProps> {
    constructor(props: InfoTooltipProps) {
        super(props);
    }

    public render(): JSX.Element {
        let infoTooltipElementWrapper: JSX.Element = null;
        if (this.props.description) {
            let infoTooltipDOMElement = null;
            let infoTooltipProps = {};
            TooltipService.registerTooltipForElement(
                infoTooltipProps,
                () => infoTooltipDOMElement,
                this.props.description
            );
            const infoTooltipElement: JSX.Element = <div {...infoTooltipProps} className='grid-tooltip'
                ref={(r) => infoTooltipDOMElement = r}><InfoSvg /></div>;

            infoTooltipElementWrapper = <div
                className='grid-tooltip-wrapper'
                onClick={(e) => { e.stopPropagation(); }}
                onKeyDown={(e) => { Utility.AffirmativeKeyDown(e, () => {
                    infoTooltipDOMElement.click();
                    infoTooltipDOMElement.focus();
                }) }}
                tabIndex={0}
                aria-label={this.props.description}
            >
                {TooltipService.getRenderer()}
                {infoTooltipElement}
            </div>;
        }
        return infoTooltipElementWrapper;
    }

}
