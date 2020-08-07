import * as React from 'react';
import { DisplayStrings } from '../DisplayStrings';

interface IPodSVGProps {
    title?: string;
}

// tslint:disable:max-line-length 
export const PodSVG: React.StatelessComponent<IPodSVGProps> = (props) => {
    return (
    <span title={DisplayStrings.ComparisonGridColumnTitlePods}>
        <svg x='0px' y='0px' width='50px' height='50px' viewBox='0 0 50 50'>
            <title>{props.title || 'Pod'}</title>
            <g>
                <rect x='24.5' y='24.5' fill='#804998' width='1' height='1'/>
                <polygon fill='#804998' points='26,24 24,24 24,26 26,26 26,24 	'/>
            </g>
            <g>
                <path fill='#59B4D9' d='M2,48.5c-0.276,0-0.5-0.225-0.5-0.5V26c0-0.276,0.224-0.5,0.5-0.5h22c0.276,0,0.5,0.224,0.5,0.5v22
                    c0,0.275-0.224,0.5-0.5,0.5H2z'/>
                <g>
                    <path fill='#0072C6' d='M24,26v22H2V26H24 M24,25H2c-0.552,0-1,0.448-1,1v22c0,0.552,0.448,1,1,1h22c0.552,0,1-0.448,1-1V26
                        C25,25.448,24.552,25,24,25L24,25z'/>
                </g>
            </g>
            <rect x='4' y='28' fill='#0072C6' width='2' height='18'/>
            <rect x='8' y='28' fill='#0072C6' width='2' height='18'/>
            <rect x='12' y='28' fill='#0072C6' width='2' height='18'/>
            <rect x='12' y='36' transform='matrix(-1.836970e-16 1 -1 -1.836970e-16 58 32)' fill='#0072C6' width='2' height='18'/>
            <rect x='12' y='20' transform='matrix(-1.836970e-16 1 -1 -1.836970e-16 42 16)' fill='#0072C6' width='2' height='18'/>
            <rect x='16' y='28' fill='#0072C6' width='2' height='18'/>
            <rect x='20' y='28' fill='#0072C6' width='2' height='18'/>
            <g>
                <g>
                    <path fill='#59B4D9' d='M26,24.5c-0.276,0-0.5-0.224-0.5-0.5V2c0-0.276,0.224-0.5,0.5-0.5h22c0.275,0,0.5,0.224,0.5,0.5v22
                        c0,0.276-0.225,0.5-0.5,0.5H26z'/>
                    <g>
                        <path fill='#0072C6' d='M48,2v22H26V2H48 M48,1H26c-0.552,0-1,0.448-1,1v22c0,0.552,0.448,1,1,1h22c0.552,0,1-0.448,1-1V2
                            C49,1.448,48.552,1,48,1L48,1z'/>
                    </g>
                </g>
                <rect x='28' y='4' fill='#0072C6' width='2' height='18'/>
                <rect x='32' y='4' fill='#0072C6' width='2' height='18'/>
                <rect x='36' y='4' fill='#0072C6' width='2' height='18'/>
                <rect x='36' y='12' transform='matrix(-1.836970e-16 1 -1 -1.836970e-16 58 -16)' fill='#0072C6' width='2' height='18'/>
                <rect x='36' y='-4' transform='matrix(-1.836970e-16 1 -1 -1.836970e-16 42 -32)' fill='#0072C6' width='2' height='18'/>
                <rect x='40' y='4' fill='#0072C6' width='2' height='18'/>
                <rect x='44' y='4' fill='#0072C6' width='2' height='18'/>
            </g>
            <g>
                <g>
                    <path fill='#804998' d='M2,24.5c-0.276,0-0.5-0.224-0.5-0.5V2c0-0.276,0.224-0.5,0.5-0.5h22c0.276,0,0.5,0.224,0.5,0.5v22
                        c0,0.276-0.224,0.5-0.5,0.5H2z'/>
                    <g>
                        <path fill='#804998' d='M24,2v22H2V2H24 M24,1H2C1.448,1,1,1.448,1,2v22c0,0.552,0.448,1,1,1h22c0.552,0,1-0.448,1-1V2
                            C25,1.448,24.552,1,24,1L24,1z'/>
                    </g>
                </g>
                <g opacity='0.4'>
                    <rect x='2' y='2' fill='#FFFFFF' width='22' height='22'/>
                </g>
                <rect x='4' y='4' fill='#804998' width='2' height='18'/>
                <rect x='8' y='4' fill='#804998' width='2' height='18'/>
                <rect x='12' y='4' fill='#804998' width='2' height='18'/>
                <rect x='12' y='12' transform='matrix(-1.836970e-16 1 -1 -1.836970e-16 34 8)' fill='#804998' width='2' height='18'/>
                <rect x='12' y='-4' transform='matrix(-1.836970e-16 1 -1 -1.836970e-16 18 -8)' fill='#804998' width='2' height='18'/>
                <rect x='16' y='4' fill='#804998' width='2' height='18'/>
                <rect x='20' y='4' fill='#804998' width='2' height='18'/>
            </g>
            <g>
                <path fill='#804998' d='M26,48.5c-0.276,0-0.5-0.225-0.5-0.5V26c0-0.276,0.224-0.5,0.5-0.5h22c0.275,0,0.5,0.224,0.5,0.5v22
                    c0,0.275-0.225,0.5-0.5,0.5H26z'/>
                <g>
                    <path fill='#804998' d='M48,26v22H26V26H48 M48,25H26c-0.552,0-1,0.448-1,1v22c0,0.552,0.448,1,1,1h22c0.552,0,1-0.448,1-1V26
                        C49,25.448,48.552,25,48,25L48,25z'/>
                </g>
            </g>
            <g opacity='0.4'>
                <rect x='26' y='26' fill='#FFFFFF' width='22' height='22'/>
            </g>
            <rect x='28' y='28' fill='#804998' width='2' height='18'/>
            <rect x='32' y='28' fill='#804998' width='2' height='18'/>
            <rect x='36' y='28' fill='#804998' width='2' height='18'/>
            <rect x='36' y='36' transform='matrix(-1.836970e-16 1 -1 -1.836970e-16 82 8)' fill='#804998' width='2' height='18'/>
            <rect x='36' y='20' transform='matrix(-1.836970e-16 1 -1 -1.836970e-16 66 -8)' fill='#804998' width='2' height='18'/>
            <rect x='40' y='28' fill='#804998' width='2' height='18'/>
            <rect x='44' y='28' fill='#804998' width='2' height='18'/>
        </svg>
    </span>
    );
}
