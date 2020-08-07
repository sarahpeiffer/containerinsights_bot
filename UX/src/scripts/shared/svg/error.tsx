/** tpl */
import * as React from 'react';

/**
 * react component defining icon to represent 'critical' (aka 'error') state
 */
export const ErrorSvg: React.StatelessComponent<{}> = () => {
    return (
        <svg viewBox='0 0 9 9'>
            <circle fill='#e00b1c' cx='4.5' cy='4.5' r='4.5' />
            <circle fill='#fff' cx='4.5' cy='6.438' r='0.697' />
            <polygon 
                fill='#fff' 
                points='4.604,2.186 4.396,2.186 3.875,2.186 4.061,5.418 4.396,5.418 4.604,5.418 4.939,5.418 5.125,2.186 ' />
        </svg>
    );
};
