import * as React from 'react';
import './svg.less';

// tslint:disable:max-line-length
export const ArrowDownSVG: React.StatelessComponent<{}> = ({}) => {
    return (
        <svg className='svg-selectable-grid-width-override' viewBox='0 0 34.761 26.892'>
            <g>
                <path className='msportalfx-svg-c07 msportalfx-ascend inactive' d='M15.359 9.478l-6.226-6.21v17.557H7.426V3.268L1.2 9.478 0 8.281 8.279 0l8.279 8.281z'></path>
                <path className='msportalfx-svg-c07 msportalfx-descend active' d='M34.761 18.612l-8.279 8.281-8.282-8.281 1.2-1.2 6.226 6.21V6.068h1.707v17.557l6.226-6.21z'></path>
            </g>
        </svg>
    );
}
