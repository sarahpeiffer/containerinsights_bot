import * as React from 'react';
import { DisplayStrings } from '../DisplayStrings';
import { IComputerGroupTypeSvg } from './ComputerGroupType';

import './svg.css';

export const VmScalesetSvg: React.StatelessComponent<IComputerGroupTypeSvg> = (props) => {
    const title: string = props.hasOwnProperty('title') ? props.title : DisplayStrings.ServiceMapGroupTypeAzureVMScaleSetName;

    // tslint:disable:max-line-length
    return (
        <span title={title}>
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18'><defs><linearGradient id='b816c8ea-05a2-41fb-ba99-96d84599c9f4' x1='12.74' y1='15.28' x2='12.74' y2='8.52' gradientUnits='userSpaceOnUse'><stop offset='0' stopColor='#0078d4'/><stop offset='0.82' stopColor='#5ea0ef'/></linearGradient><linearGradient id='ab373d88-41af-4fc3-b172-d4489f9107a0' x1='12.74' y1='17.89' x2='12.74' y2='15.28' gradientUnits='userSpaceOnUse'><stop offset='0.15' stopColor='#ccc'/><stop offset='1' stopColor='#707070'/></linearGradient></defs><rect x='0.79' y='0.89' width='10.11' height='6.75' rx='0.34' fill='#005ba1'/><polygon points='7.53 3.28 7.53 5.25 5.85 6.23 5.85 4.27 7.53 3.28' fill='#50e6ff'/><polygon points='7.53 3.28 5.85 4.27 4.16 3.28 5.85 2.29 7.53 3.28' fill='#c3f1ff'/><polygon points='5.85 4.27 5.85 6.23 4.16 5.25 4.16 3.28 5.85 4.27' fill='#9cebff'/><rect x='4.76' y='4.76' width='10.11' height='6.75' rx='0.34' fill='#0078d4'/><polygon points='11.5 7.16 11.5 9.12 9.82 10.11 9.82 8.14 11.5 7.16' fill='#50e6ff'/><polygon points='11.5 7.16 9.82 8.14 8.13 7.16 9.82 6.17 11.5 7.16' fill='#c3f1ff'/><polygon points='9.82 8.14 9.82 10.11 8.13 9.12 8.13 7.16 9.82 8.14' fill='#9cebff'/><rect x='7.68' y='8.52' width='10.11' height='6.75' rx='0.34' fill='url(#b816c8ea-05a2-41fb-ba99-96d84599c9f4)'/><polygon points='14.42 10.92 14.42 12.88 12.74 13.87 12.74 11.9 14.42 10.92' fill='#50e6ff'/><polygon points='14.42 10.92 12.74 11.91 11.05 10.92 12.74 9.93 14.42 10.92' fill='#c3f1ff'/><polygon points='12.74 11.91 12.74 13.87 11.05 12.88 11.05 10.92 12.74 11.91' fill='#9cebff'/><polygon points='11.05 12.88 12.74 11.9 12.74 13.87 11.05 12.88' fill='#c3f1ff'/><polygon points='14.42 12.88 12.74 11.9 12.74 13.87 14.42 12.88' fill='#9cebff'/><path d='M14.76,17.32c-1-.16-1-.88-1-2h-2c0,1.16,0,1.88-1,2a.59.59,0,0,0-.5.57h5A.59.59,0,0,0,14.76,17.32Z' fill='url(#ab373d88-41af-4fc3-b172-d4489f9107a0)'/></svg>
        </span>
    );
};
