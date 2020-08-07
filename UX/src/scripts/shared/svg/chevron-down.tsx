import * as React from 'react';

import './svg.css';

export const ChevronDownSvg: React.StatelessComponent<{}> = ({}) => {
    let setProps = (t: SVGElement) => {
        if (t) {
            t.setAttribute('focusable', 'false');
        }
    };
    return <svg ref={t => setProps(t)} className='theme' viewBox='0 0 12 12' role='presentation' aria-hidden='true'>
        <g>
            <path d='M 11 3.9 l -0.7 -0.8 L 6 7.4 L 1.7 3.1 l -0.7 0.8 l 5 5 Z' />
        </g>
    </svg>;
};

