import * as React from 'react';

import './svg.css';

export const ChevronUpSvg: React.StatelessComponent<{}> = ({}) => {
    let setProps = (t: SVGElement) => {
        if (t) {
            t.setAttribute('focusable', 'false');
        }
    };
    return <svg ref={t => setProps(t)}  className='theme' viewBox='0 0 12 12' role='presentation' aria-hidden='true'>
        <g>
            <path d='M 1 8.1 l 0.7 0.8 L 6 4.6 l 4.3 4.3 l 0.7 -0.8 l -5 -5 Z' />
        </g>
    </svg>;
};

