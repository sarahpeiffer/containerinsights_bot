import * as React from 'react';
import { DisplayStrings } from '../DisplayStrings';

interface IControllerResourceSVGProps {
    title?: string;
}

// tslint:disable:max-line-length 
export const ControllerResourceSVG: React.StatelessComponent<IControllerResourceSVGProps> = (props) => {
    return (
        <span title={DisplayStrings.ComparisonGridColumnController}>
        <svg x='0px' y='0px' width='50px' height='50px' viewBox='0 0 50 50' >
            <title>{props.title || 'Controller'}</title>
            <polygon fill='#804998' points='4,36.133 4,12.867 25.5,1 47,12.867 47,36.133 25.5,48 '/>
            <polygon opacity='0.6' fill='#FFFFFF' points='4,36.133 4,12.867 25.5,1 47,12.867 47,36.133 25.5,48 '/>
            <g>
                <polygon fill='#804998' points='4,36.133 4,12.867 25.5,1 47,12.867 47,36.133 25.5,48 	'/>
            </g>
            <polygon opacity='0.2' fill='#FFFFFF' points='4,36.133 4,12.867 25.5,1 47,12.867 47,36.133 25.5,48 '/>
            <polygon opacity='0.4' fill='#FFFFFF' points='6,34.953 6,14.047 25.5,3.284 45,14.047 45,34.953 25.5,45.716 '/>
            <path opacity='0.4' fill='#FFFFFF' d='M37,36H15c-0.552,0-1-0.448-1-1V13c0-0.552,0.448-1,1-1h22c0.552,0,1,0.448,1,1v22
            C38,35.552,37.552,36,37,36z'/>
            <g>
                <rect x='25.5' y='23.5' fill='#804998' width='1' height='1'/>
                <polygon fill='#804998' points='27,23 25,23 25,25 27,25 27,23 	'/>
            </g>
            <g>
                <path fill='#59B4D9' d='M27,23.5c-0.275,0-0.5-0.224-0.5-0.5v-9c0-0.276,0.225-0.5,0.5-0.5h9c0.275,0,0.5,0.224,0.5,0.5v9
                c0,0.276-0.225,0.5-0.5,0.5H27z'/>
                <g>
                    <path fill='#0072C6' d='M36,14v9h-9v-9H36 M36,13h-9c-0.552,0-1,0.448-1,1v9c0,0.552,0.448,1,1,1h9c0.552,0,1-0.448,1-1v-9
                    C37,13.448,36.552,13,36,13L36,13z'/>
                </g>
            </g>
            <rect x='28' y='15' fill='#0072C6' width='1' height='7'/>
            <rect x='30' y='15' fill='#0072C6' width='1' height='7'/>
            <rect x='32' y='15' fill='#0072C6' width='1' height='7'/>
            <rect x='31' y='18' transform='matrix(-1.836970e-16 1 -1 -1.836970e-16 53 -10)' fill='#0072C6' width='1' height='7'/>
            <rect x='31' y='12' transform='matrix(-1.836970e-16 1 -1 -1.836970e-16 47 -16)' fill='#0072C6' width='1' height='7'/>
            <rect x='34' y='15' fill='#0072C6' width='1' height='7'/>
            <g>
                <path fill='#59B4D9' d='M16,34.5c-0.276,0-0.5-0.225-0.5-0.5v-9c0-0.276,0.224-0.5,0.5-0.5h9c0.276,0,0.5,0.224,0.5,0.5v9
                c0,0.275-0.224,0.5-0.5,0.5H16z'/>
                <g>
                    <path fill='#0072C6' d='M25,25v9h-9v-9H25 M25,24h-9c-0.552,0-1,0.448-1,1v9c0,0.552,0.448,1,1,1h9c0.552,0,1-0.448,1-1v-9
                    C26,24.448,25.552,24,25,24L25,24z'/>
                </g>
            </g>
            <rect x='17' y='26' fill='#0072C6' width='1' height='7'/>
            <rect x='19' y='26' fill='#0072C6' width='1' height='7'/>
            <rect x='21' y='26' fill='#0072C6' width='1' height='7'/>
            <rect x='20' y='29' transform='matrix(-1.836970e-16 1 -1 -1.836970e-16 53 12)' fill='#0072C6' width='1' height='7'/>
            <rect x='20' y='23' transform='matrix(-1.836970e-16 1 -1 -1.836970e-16 47 6)' fill='#0072C6' width='1' height='7'/>
            <rect x='23' y='26' fill='#0072C6' width='1' height='7'/>
            <path fill='#804998' d='M16,24h9c0.552,0,1-0.448,1-1v-9c0-0.552-0.448-1-1-1h-9c-0.552,0-1,0.448-1,1v9C15,23.552,15.448,24,16,24z
            '/>
            <g opacity='0.4'>
                <rect x='16' y='14' fill='#FFFFFF' width='9' height='9'/>
            </g>
            <rect x='23' y='15' transform='matrix(-1 -4.547486e-11 4.547486e-11 -1 47 37)' fill='#804998' width='1' height='7'/>
            <rect x='21' y='15' transform='matrix(-1 -4.547486e-11 4.547486e-11 -1 43 37)' fill='#804998' width='1' height='7'/>
            <rect x='19' y='15' transform='matrix(-1 -4.456536e-11 4.456536e-11 -1 39 37)' fill='#804998' width='1' height='7'/>
            <rect x='20' y='18' transform='matrix(-4.547492e-11 1 -1 -4.547492e-11 42 1)' fill='#804998' width='1' height='7'/>
            <rect x='20' y='12' transform='matrix(-4.547492e-11 1 -1 -4.547492e-11 36 -5)' fill='#804998' width='1' height='7'/>
            <rect x='17' y='15' transform='matrix(-1 -4.365587e-11 4.365587e-11 -1 35 37)' fill='#804998' width='1' height='7'/>
            <path fill='#804998' d='M27,35h9c0.552,0,1-0.448,1-1v-9c0-0.552-0.448-1-1-1h-9c-0.552,0-1,0.448-1,1v9C26,34.552,26.448,35,27,35z
            '/>
            <g opacity='0.4'>
                <rect x='27' y='25' fill='#FFFFFF' width='9' height='9'/>
            </g>
            <rect x='34' y='26' transform='matrix(-1 -4.365587e-11 4.365587e-11 -1 69 59)' fill='#804998' width='1' height='7'/>
            <rect x='32' y='26' transform='matrix(-1 -4.547486e-11 4.547486e-11 -1 65 59)' fill='#804998' width='1' height='7'/>
            <rect x='30' y='26' transform='matrix(-1 -4.547486e-11 4.547486e-11 -1 61 59)' fill='#804998' width='1' height='7'/>
            <rect x='31' y='29' transform='matrix(-4.547492e-11 1 -1 -4.547492e-11 64 1)' fill='#804998' width='1' height='7'/>
            <rect x='31' y='23' transform='matrix(-4.729391e-11 1 -1 -4.729391e-11 58 -5)' fill='#804998' width='1' height='7'/>
            <rect x='28' y='26' transform='matrix(-1 -4.365587e-11 4.365587e-11 -1 57 59)' fill='#804998' width='1' height='7'/>
        </svg>
        </span>
    );
}

