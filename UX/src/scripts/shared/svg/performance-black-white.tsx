import * as React from 'react';

import './svg.css';
import { DisplayStrings } from '../DisplayStrings';

export const PerformanceBlackAndWhiteSvg: React.StatelessComponent<{}> = ({ }) => {
    let setProps = (t: SVGElement) => {
        if (t) {
            t.setAttribute('focusable', 'false');
        }
    };

    // tslint:disable:max-line-length 
    return <svg ref={t => setProps(t)} viewBox='0 0 24 24' width='30px' height='30px'>
        <title> {DisplayStrings.ViewSinglePerfVMAltText} </title>
        <g>
        <path d='M18,1.9h5.9v5.9h-1.5V4.5l-6.7,6.7l-4.4-4.4L0.2,17.8v-2.1L11.3,4.6L15.8,9l5.6-5.6H18V1.9z M0.2,22.7v-2.2L1.7,19v3.7H0.2
		z M3.2,22.7v-5.2L4.7,16v6.7H3.2z M6.2,22.7v-8.2l1.5-1.5v9.6H6.2z M9.1,22.7V11.6l1.5-1.5v12.6H9.1z M12.1,22.7V10.1l1.5,1.5v11.1
		H12.1z M15,13.1l0.7,0.7l0.7-0.7v9.6H15V13.1z M18,22.7V11.6l1.5-1.5v12.6H18z M21,22.7V9.4h1.5v13.3H21z'/>
    </g>
    </svg>
};


