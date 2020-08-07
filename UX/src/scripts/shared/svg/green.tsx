/** tpl */
import * as React from 'react';

/**
 * react component defining icon to represent 'healthy' state
 */
export const GreenSvg: React.StatelessComponent<{}> = () => {
    // tslint:disable-next-line:max-line-length
    return (
        <svg version='1.1' x='0px' y='0px' width='288px' height='288px' viewBox='0 0 288 288'>
            <path 
            fill='#57a300' 
            d='M144,0C61.728,0,0,61.728,0,144s61.728,144,144,144s144-61.728,144-144S226.272,
            0,144,0z M123.424,205.728L61.728,144 l20.544-20.576l41.152,41.152l82.304-82.304l20.544,20.576L123.424,205.728z' />
        </svg>
    );
};
