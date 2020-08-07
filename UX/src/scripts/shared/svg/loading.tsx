import * as React from 'react';

import './svg.less';

export const LoadingSvg: React.StatelessComponent<{}> = ({}) => {
    let setProps = (t: SVGElement) => {
        if (t) {
            t.setAttribute('focusable', 'false');
        }
    };
    return <svg viewBox='0 0 16 16' className='msportalfx-svg-placeholder'
        role='presentation' ref={t => setProps(t)} aria-hidden='true'>
        <g aria-hidden='true' role='presentation'>
            <g className='msportalfx-svg-loading-ellipsis-square' aria-hidden='true' role='presentation'>
                <rect y='6px' width='4px' height='4px'
                className='msportalfx-svg-loading-square' aria-hidden='true' role='presentation'></rect>
                <rect x='6px' y='6px' width='4px' height='4px'
                className='msportalfx-svg-loading-square' aria-hidden='true' role='presentation'>
                </rect>
                <rect x='12px' y='6px' width='4px' height='4px' 
                className='msportalfx-svg-loading-square' aria-hidden='true' role='presentation'>
                </rect>
            </g>
        </g>
    </svg>;
};
