/** tpl */
import * as React from 'react';
import { SGCellProps } from 'appinsights-iframe-shared';

/**
 * Implementation of Cell component which supports Icon and hyperlink
 */
export const SGIconLinkCell = (
    formatter: (data: any) => string,
    onClick: (data: any) => void,
    icon: (data: any) => JSX.Element
): React.StatelessComponent<SGCellProps> => {
    return (props: SGCellProps) => {
        const textElem = formatter(props.value);
        let iconElem = null;
        if (textElem !== '--') {
            iconElem = icon(props.value);
        }
        return <div title={textElem} className='sg-text' role='link' onClick={_ => onClick(props.value)}>
            {iconElem && <span className='sg-icon'>{iconElem}</span>}
            {textElem && <span className='sg-link'>{textElem}</span>}
        </div>;
    };
};
