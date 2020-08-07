import * as React from 'react';
import { DisplayStrings } from '../DisplayStrings';
import { IComputerGroupTypeSvg } from './ComputerGroupType';

import './svg.css';

export const ServiceMapMachineGroupSvg: React.StatelessComponent<IComputerGroupTypeSvg> = (props) => {
    const title: string = props.hasOwnProperty('title') ? props.title : DisplayStrings.ServiceMapGroupTypeName;

    // tslint:disable:max-line-length
    return (
        <span title={title}>
            <svg version='1.1' x='0px' y='0px' width='60px' height='60px' viewBox='0 0 60 60'>
                <path fill='#7A7A7A' d='M40,47.223C40,48.205,39.226,49,38.271,49H20.729C19.774,49,19,48.205,19,47.223V13.777 C19,12.795,19.774,12,20.729,12h17.543C39.226,12,40,12.795,40,13.777V47.223z'/>
                <path fill='#1E1E1E' d='M24,16h11c1.259,0,1.9,1,1.9,2s-0.641,2-1.9,2H24c-1.259,0.001-1.9-1-1.9-2S22.741,16,24,16z'/>
                <ellipse fill='#B8D432' cx='25' cy='18.095' rx='1.4' ry='1.333'/>
                <path fill='#1E1E1E' d='M24,22h11c1.259,0,1.9,1,1.9,2s-0.641,2-1.9,2H24c-1.259,0.001-1.9-1-1.9-2S22.741,22,24,22z'/>
                <ellipse fill='#B8D432' cx='25' cy='24.095' rx='1.4' ry='1.333'/>
                <path fill='#1E1E1E' d='M24,28h11c1.259,0,1.9,1,1.9,2s-0.641,2-1.9,2H24c-1.259,0.001-1.9-1-1.9-2S22.741,28,24,28z'/>
                <ellipse fill='#B8D432' cx='25' cy='30.095' rx='1.4' ry='1.333'/>
                <rect x='10' y='22' fill='#0072C6' width='3' height='17'/>
                <polygon fill='#0072C6' points='13.316,14.658 10,21.291 10,23 12,24 16,16 '/>
                <polygon fill='#0072C6' points='13.316,46.342 10,39.709 10,38 12,37 16,45 '/>
                <rect x='46' y='22' transform='matrix(-1 -4.547486e-11 4.547486e-11 -1 95 61.0004)' fill='#0072C6' width='3' height='17'/>
                <polygon fill='#0072C6' points='45.684,14.658 49,21.291 49,23 47,24 43,16 '/>
                <polygon fill='#0072C6' points='45.684,46.342 49,39.709 49,38 47,37 43,45 '/>
            </svg>
        </span>
    );
};
