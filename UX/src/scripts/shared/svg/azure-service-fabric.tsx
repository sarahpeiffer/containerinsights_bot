import * as React from 'react';
import { DisplayStrings } from '../DisplayStrings';
import { IComputerGroupTypeSvg } from './ComputerGroupType';

import './svg.css';

export const ServiceFabricSvg: React.StatelessComponent<IComputerGroupTypeSvg> = (props) => {
    const title: string = props.hasOwnProperty('title') ? props.title : DisplayStrings.ServiceMapGroupTypeAzureServiceFabricName;

    // tslint:disable:max-line-length
    return (
        <span title={title}>
            <svg version='1.1' x='0px' y='0px' width='50px' height='50px' viewBox='0 0 50 50'>
                <path fill='#DB5B26' d='M24.958,8.25l15.45,14.101L36.036,40H13.964L9.59,22.344L24.958,8.25 M24.951,3L5,21l6,23h28l6-23L24.951,3 L24.951,3z'/>
                <circle fill='#DB5B26' cx='25' cy='8' r='6.9'/>
                <circle fill='#DB5B26' cx='42' cy='22' r='6.9'/>
                <circle fill='#DB5B26' cx='8' cy='22' r='6.9'/>
                <circle fill='#DB5B26' cx='14' cy='42' r='6.9'/>
                <circle fill='#DB5B26' cx='37' cy='42' r='6.9'/>
            </svg>
        </span>
    );
};
