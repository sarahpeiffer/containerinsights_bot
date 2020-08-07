/** tpl */
import * as React from 'react';

/**
 * props of BigNumber Icon
 */
interface IBigNumberIconProps {
    /** value or - */
    number?: number;
    /** icon element */
    icon?: JSX.Element;
    /** associated disaply */
    text: string;
    /** associated label */
    label: string;
    /** onClick handler */
    onClickHandler?: (any) => any;
}

/**
 *  BigNumberIcon component
 * @param param0 
 */
export const BigNumberIcon: React.StatelessComponent<IBigNumberIconProps> = ({ onClickHandler, number, icon, text, label }) => {
    const value = number === undefined || number === null ? '-' : number;
    const screenReaderText: string = value + ' ' + text + ', ' + label;
    let iconContainerClassName: string = icon ? 'icon-container' : '';
    let numberContainerClassName: string = icon ? 'number-container' : 'number-container remove-margin-right';

    return (
        <div className='big-num-icon-container'
            onClick={onClickHandler}
            aria-label={screenReaderText}
            title={screenReaderText}>
            <div className='number-icon-container'>
                <div className={numberContainerClassName}>
                    {value}
                </div>
                <div className={iconContainerClassName}>
                    {icon}
                </div>
            </div>
            <div className='text'>{text}</div>
        </div>
    );
}
