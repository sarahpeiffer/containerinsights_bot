/** tpl */
import * as React from 'react';
import { String } from 'typescript-string-operations';
import { SGCellProps, TooltipService } from 'appinsights-iframe-shared';

/** svg */
import { InfoBlueSVG } from './svg/InfoBlue';

export const SGIconInfoCell = (
    formatter: (data: any) => string, 
    icon: (data: any) => JSX.Element,
    infoText: (data: any) => string
): React.StatelessComponent<SGCellProps> => {
    return (props: SGCellProps) => {
        let textElem = typeof (formatter) === 'function' ? formatter(props.value) : null;
        let iconElem = typeof (icon) === 'function' ? icon(props.value) : null;
        
        let tooltipDOMElement: any = null;
        let tooltipProps: any = {};
        if (!String.IsNullOrWhiteSpace(infoText(props.value))) {
            TooltipService.registerTooltipForElement(tooltipProps, () => tooltipDOMElement, infoText(props.value));
        }

        let screenReaderText: string = textElem;
        if ( tooltipProps['aria-label'] ) {
            screenReaderText += ' ' + tooltipProps['aria-label'];
        }
        tooltipProps['aria-label'] = screenReaderText;
    
        return (
            <div title={textElem} {...tooltipProps} className='sg-text'>
                {iconElem && <span className='sg-icon' ref={(r) => tooltipDOMElement = r}>{iconElem}</span>}
                {textElem && <span className='sg-text' ref={(r) => tooltipDOMElement = r}>{textElem}</span>}
                {!String.IsNullOrWhiteSpace(infoText(props.value)) && 
                     <span tabIndex={0} className='sg-info' ref={(r) => tooltipDOMElement = r}
                           onKeyDown={(event) => {
                                                    if (
                                                        (event.shiftKey || event.altKey)
                                                        && event.keyCode 
                                                        && event.keyCode === 112
                                                        ) {
                                                        tooltipProps.onClick(null);
                                                        event.stopPropagation();
                                                        event.preventDefault();
                                                    }
                                                 }
                                     }>
                        <InfoBlueSVG className='sg-info-svg' color='grey'/>
                    </span>}
            </div>
        );
    };
};
