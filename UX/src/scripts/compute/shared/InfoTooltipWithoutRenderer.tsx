/**
 * Block imports
 */
import * as React from 'react';
import { TooltipService, InfoSvg } from 'appinsights-iframe-shared';
import { Utility } from '../../shared/Utilities/Utility';

export interface InfoTooltipWithoutRendererProps {
    description: string
}

export class InfoTooltipWithoutRenderer extends React.Component<InfoTooltipWithoutRendererProps> {
    constructor(props: InfoTooltipWithoutRendererProps) {
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
                {infoTooltipElement}
            </div>;
        }
        return infoTooltipElementWrapper;
    }

}
