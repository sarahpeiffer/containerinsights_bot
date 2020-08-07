import * as React from 'react';
import { DisplayStrings } from '../DisplayStrings';
import { IComputerGroupTypeSvg } from './ComputerGroupType';

export const ResourceGroupSvg: React.StatelessComponent<IComputerGroupTypeSvg> = (props) => {
    const title: string = props.hasOwnProperty('title') ? props.title : DisplayStrings.ServiceMapGroupTypeAzureResourceGroupName;

    // tslint:disable:max-line-length
    return (
        <span title={title}>
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18'>
                <g>
                    <g>
                        <path d='M.5,15.08a.16.16,0,0,0,.08.14l1.16.65L3.7,17a.17.17,0,0,0,.23-.06l.66-1.12a.16.16,0,0,0-.06-.21l-2.3-1.3a.17.17,0,0,1-.08-.14V3.85a.16.16,0,0,1,.08-.14l2.3-1.3a.16.16,0,0,0,.06-.21L3.93,1.08A.17.17,0,0,0,3.7,1L1.78,2.11l-1.2.67a.16.16,0,0,0-.08.14V15.08Z' fill='#949494' />
                        <path d='M2.14,3.77l.06-.06,2.3-1.3a.14.14,0,0,0,.06-.21L3.9,1.08A.15.15,0,0,0,3.68,1L1.75,2.11.56,2.78s-.05,0-.06.06l.9.51Z' fill='#a3a3a3' />
                        <path d='M4.5,15.59l-2.3-1.3a.22.22,0,0,1-.07-.09l-1.62,1,.05,0,1.15.65,2,1.11a.15.15,0,0,0,.22-.06l.66-1.12A.14.14,0,0,0,4.5,15.59Z' fill='#a3a3a3' />
                    </g>
                    <path d='M17.5,15.08a.16.16,0,0,1-.08.14l-1.16.65L14.3,17a.17.17,0,0,1-.23-.06l-.66-1.12a.16.16,0,0,1,.06-.21l2.3-1.3a.17.17,0,0,0,.08-.14V3.85a.16.16,0,0,0-.08-.14l-2.3-1.3a.16.16,0,0,1-.06-.21l.66-1.12A.17.17,0,0,1,14.3,1l1.92,1.09,1.2.67a.16.16,0,0,1,.08.14V15.08Z' fill='#949494' />
                    <path d='M15.86,3.77l-.06-.06-2.3-1.3a.14.14,0,0,1-.06-.21l.66-1.12A.15.15,0,0,1,14.32,1l1.93,1.09,1.19.67s0,0,.06.06l-.9.51Z' fill='#a3a3a3' />
                    <path d='M13.5,15.59l2.3-1.3a.22.22,0,0,0,.07-.09l1.62,1,0,0-1.15.65-2,1.11a.15.15,0,0,1-.22-.06l-.66-1.12A.14.14,0,0,1,13.5,15.59Z' fill='#a3a3a3' />
                    <polygon points='14.31 5.93 14.31 12.07 8.99 15.16 8.99 9.01 14.31 5.93' fill='#32bedd' />
                    <polygon points='14.31 5.93 9 9.02 3.68 5.93 9 2.84 14.31 5.93' fill='#9cebff' />
                    <polygon points='8.99 9.02 8.99 15.16 3.68 12.07 3.68 5.93 8.99 9.02' fill='#50e6ff' />
                    <polygon points='3.68 12.07 8.99 9.01 8.99 15.16 3.68 12.07' fill='#9cebff' />
                    <polygon points='14.31 12.07 8.99 9.01 8.99 15.16 14.31 12.07' fill='#50e6ff' />
                </g>
            </svg>
        </span>
    );
};
