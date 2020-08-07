import * as React from 'react';
import { DisplayStrings } from '../DisplayStrings';
import { IComputerGroupTypeSvg } from './ComputerGroupType';

import './svg.css';

export const ComputerGroupSvg: React.StatelessComponent<IComputerGroupTypeSvg> = (props) => {
    const title: string = props.hasOwnProperty('title') ? props.title : DisplayStrings.OmsComputerGroupTypeName;

    // tslint:disable:max-line-length
    return (
        <span title={title}>
            <svg version='1.1' x='0px' y='0px' width='50px' height='50px' viewBox='0 0 50 50'>
                <g>
                    <path fill='#A0A1A2' d='M19,11c0-2.319,1.746-4,4-4h8.056V4c0-1.65-1.35-3-3-3H11C9.35,1,8,2.35,8,4v35.58 C8,40.916,9.083,42,10.42,42H19V11z'/>
                    <path fill='#1E1E1E' d='M23,7h5.108c-0.187-1.141-1.029-2-2.5-2H12.592c-1.678,0-2.54,1.12-2.54,2.5c0,1.381,0.861,2.501,2.54,2.5 h6.536C19.553,8.216,21.088,7,23,7z'/>
                    <circle fill='#B8D432' cx='13' cy='7.564' r='1.5'/>
                    <path fill='#1E1E1E' d='M19,12h-6.408c-1.678,0-2.54,1.12-2.54,2.5c0,1.381,0.861,2.501,2.54,2.5H19V12z'/>
                    <circle fill='#B8D432' cx='13' cy='14.564' r='1.5'/>
                    <path fill='#1E1E1E' d='M19,19h-6.408c-1.678,0-2.54,1.12-2.54,2.5c0,1.381,0.861,2.501,2.54,2.5H19V19z'/>
                    <circle fill='#B8D432' cx='13' cy='21.564' r='1.5'/>
                </g>
                <g>
                    <path fill='#A0A1A2' d='M43,46.564C43,47.909,41.919,49,40.586,49H22.414C21.081,49,20,47.909,20,46.564V11 c0-1.346,1.659-3,2.993-3h17.014C41.341,8,43,9.654,43,11V46.564z'/>
                    <path fill='#1E1E1E' d='M22.108,14.5c0-1.38,0.861-2.5,2.54-2.5h12.713c1.678,0,2.54,1.12,2.54,2.5l0,0c0,1.38-0.861,2.5-2.54,2.5 H24.648C22.969,17.001,22.108,15.881,22.108,14.5L22.108,14.5z'/>
                    <circle fill='#B8D432' cx='25.056' cy='14.564' r='1.5'/>
                    <path fill='#1E1E1E' d='M22.108,21.5c0-1.38,0.861-2.5,2.54-2.5h12.713c1.678,0,2.54,1.12,2.54,2.5l0,0c0,1.38-0.861,2.5-2.54,2.5 H24.648C22.969,24.001,22.108,22.881,22.108,21.5L22.108,21.5z'/>
                    <circle fill='#B8D432' cx='25.056' cy='21.564' r='1.5'/>
                    <path fill='#1E1E1E' d='M22.108,28.5c0-1.38,0.861-2.5,2.54-2.5h12.713c1.678,0,2.54,1.12,2.54,2.5l0,0c0,1.38-0.861,2.5-2.54,2.5 H24.648C22.969,31.001,22.108,29.881,22.108,28.5L22.108,28.5z'/>
                    <circle fill='#B8D432' cx='25.056' cy='28.564' r='1.5'/>
                </g>
            </svg>
        </span>
    );
};
