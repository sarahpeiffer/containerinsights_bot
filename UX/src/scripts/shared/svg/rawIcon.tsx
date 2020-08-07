import * as React from 'react';

import './svg.less';

export const RawSvg: React.StatelessComponent<{}> = ({ }) => {
    return (
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 12'>
            <title></title>
            <path d='M9.5,0h1l-4,12h-1Z' />
            <polygon points='12.1 9.9 11.4 9.1 14.6 6 11.4 2.9 12.1 2.1 16 6 12.1 9.9' />
            <polygon points='3.9 9.9 4.6 9.1 1.4 6 4.6 2.9 3.9 2.1 0 6 3.9 9.9' />
        </svg>
    );
};
