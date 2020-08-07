import * as React from 'react';

import './svg.less';

export const FailedSvg: React.StatelessComponent<{}> = ({ }) => {
    return (
        <svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlnsXlink='http://www.w3.org/1999/xlink' x='0px' y='0px'
        width='16px' height='16px' viewBox='0 0 16 16' enable-background='new 0 0 16 16' xmlSpace='preserve'>
            <circle fill='#E00B1C' cx='8' cy='8' r='8'/>
            <path fill='#FFFFFF' d='M12.694,4.728l-1.422-1.422L8,6.578L4.728,3.306L3.306,4.728L6.578,8l-3.272,3.272l1.422,1.422L8,9.422
            l3.272,3.272l1.422-1.422L9.422,8L12.694,4.728z'/>
        </svg>
    );
};
