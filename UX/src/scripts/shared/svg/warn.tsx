/** tpl */
import * as React from 'react';

/**
 * react component defining icon to represent 'warning' state
 */
export const WarnSvg: React.StatelessComponent<{}> = () => {
    return (
        // tslint:disable-next-line:max-line-length
        <svg viewBox='0 0 9 9'>
            <path 
            fill='#e07800'
            d='M8.267,8H4.501H0.733c-0.6,0-0.916-0.623-0.62-1.129L2.014,3.53l1.882-3.146 C4.198-0.123,
            4.799-0.13,5.093,0.376L7.001,3.65l1.882,3.229C9.183,7.383,8.881,8,8.267,8z' />
            <circle fill='#fff' cx='4.5' cy='6.178' r='0.615' />
            <polygon fill='#fff' points='4.623,2.428 4.439,2.428 3.98,2.428 4.144,5.278 4.439,5.278 4.623,5.278 4.918,5.278 5.083,2.428 ' />
        </svg>
    );
};
