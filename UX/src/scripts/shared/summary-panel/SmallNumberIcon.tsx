/** tpl */
import * as React from 'react';

/**
 * props of SmallNumberIcon which is used on the summary panel 
 */
interface ISmallNumberIconProps {
    /**
     * value  or '-'
     */
    number?: number;

    /**
     * optional icon element
     */
    icon?: JSX.Element;

    /**
     * display string
     */
    text: string;

    /**
     * label for screen reader
     */
    label: string;
}

/**
 *  component for SmallNumberIcon
 * @param param0 
 */
export const SmallNumberIcon: React.StatelessComponent<ISmallNumberIconProps> = ({ number, icon, text, label }) => {
    const value = number === undefined || number === null ? '-' : number;
    const screenReaderText: string = value + ' ' + text + ', ' + label;
    return (
        <div className='small-num-icon-container' tabIndex={0} aria-label={screenReaderText} title={screenReaderText}>
            <div className='text'>{text}</div>
            <div className='number-icon-container'>
                <div className='number-container'>{value}</div>
                <div className='icon-container'>
                    {icon}
                </div>
            </div>
        </div>
    );
}
