import * as React from 'react';

import './svg.css';
import {DisplayStrings} from '../DisplayStrings';

export const VMBlackAndWhiteSvg: React.StatelessComponent<{}> = ({ }) => {
    let setProps = (t: SVGElement) => {
        if (t) {
            t.setAttribute('focusable', 'false');
        }
    };

    // tslint:disable:max-line-length 
    return <svg ref={t => setProps(t)} viewBox='-1 -2 24 24' width='30px' height='30px'>
        <title> {DisplayStrings.ViewAzureResourceText} </title>
        <path d='M22.5,16.5H12V18h3v1.5H7.5V18h3v-1.5H0V3h22.5V16.5 M1.5,4.5V15H21V4.5H1.5z'/>
        <g>
            <path d='M14.7,7.7v4.4l-3.5,1.8l-3.5-1.8V7.7l3.5-1.8L14.7,7.7z M8.2,11.8l2.7,1.4V9.7L8.2,8.3V11.8z M11.1,6.5L8.5,7.8l2.6,1.3
                l2.6-1.3L11.1,6.5z M14.1,11.8V8.3l-2.8,1.4v3.5L14.1,11.8z'/>
        </g>
    </svg>
};


