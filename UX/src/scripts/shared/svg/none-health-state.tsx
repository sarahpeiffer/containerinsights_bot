/** tpl */
import * as React from 'react';

/**
 * react component defining icon to represent 'object does not exist' aka 'none' state
 */
export const NoneHealthStateSvg: React.StatelessComponent<{}> = () => {
    return (
        <svg viewBox='0 0 9 9'>
            <circle stroke='#7A7A7A' fill='#fff' fill-opacity='0' cx='4.5' cy='4.5' r='4.0' />
        </svg>
    );
};
