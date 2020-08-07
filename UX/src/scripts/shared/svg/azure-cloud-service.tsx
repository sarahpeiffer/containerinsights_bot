import * as React from 'react';
import { DisplayStrings } from '../DisplayStrings';
import { IComputerGroupTypeSvg } from './ComputerGroupType';

import './svg.css';

export const CloudServiceSvg: React.StatelessComponent<IComputerGroupTypeSvg> = (props) => {
    const title: string = props.hasOwnProperty('title') ? props.title : DisplayStrings.ServiceMapGroupTypeAzureCloudServiceName;
    let setProps = (t: SVGElement) => {
        if (t) {
            t.setAttribute('focusable', 'false');
        }
    };

    // tslint:disable:max-line-length 
    return (
        <span title={title}>
            <svg ref={t => setProps(t)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18'><defs><linearGradient x1='8.99' y1='16.61' x2='8.99' y2='-1.27' gradientUnits='userSpaceOnUse'><stop offset='0' stopColor='#0078d4'/><stop offset='0.16' stopColor='#1380da'/><stop offset='0.53' stopColor='#3c91e5'/><stop offset='0.82' stopColor='#559cec'/><stop offset='1' stopColor='#5ea0ef'/></linearGradient></defs><path d='M18,10.55a4.11,4.11,0,0,0-3.51-4,5.14,5.14,0,0,0-5.25-5,5.26,5.26,0,0,0-5,3.47A4.87,4.87,0,0,0,0,9.82a4.94,4.94,0,0,0,5.07,4.8l.44,0h8.21a1.46,1.46,0,0,0,.22,0A4.13,4.13,0,0,0,18,10.55Z' fill='url(#b82da118-993d-4c39-803c-c36675d35ebf)'/><circle cx='5.24' cy='9.65' r='0.71' fill='#e3e3e3'/><path d='M7.74,9.92V9.35l-.08,0-.61-.2-.16-.39.31-.66-.4-.4-.08,0L6.15,8l-.39-.16-.25-.69H4.94l0,.08-.2.61L4.32,8l-.65-.31-.4.4,0,.08.29.57-.16.39-.7.25V10l.08,0,.61.2.16.39-.31.66.4.4.08,0,.57-.29.39.16.25.69h.57l0-.08.2-.61.39-.16.66.31.4-.4,0-.08-.29-.57.16-.39Zm-2.5.83a1.1,1.1,0,1,1,1.1-1.1A1.09,1.09,0,0,1,5.24,10.75Z' fill='#fff'/><circle cx='10' cy='6.59' r='0.84' fill='#e3e3e3'/><path d='M13,6.91V6.23l-.09,0L12.17,6,12,5.49l.37-.8-.48-.48-.09,0-.69.35-.46-.19-.3-.83H9.64l0,.1-.24.73-.47.19-.78-.37-.48.48.05.09L8,5.5,7.84,6,7,6.27V7l.1,0,.73.24L8,7.69l-.37.8L8.13,9l.1-.05.68-.35.47.19.3.83h.68l0-.1.24-.73.47-.19.79.37.48-.48-.05-.09L12,7.68l.19-.47Zm-3,1a1.32,1.32,0,1,1,1.32-1.32A1.31,1.31,0,0,1,10,7.91Z' fill='#fff'/></svg>
        </span>
    );
};
