import * as React from 'react';
import './svg.css';

// tslint:disable:max-line-length 
export const LockedConsoleSVG: React.StatelessComponent<{}> = ({ }) => {
    return <svg 
        x='0px' y='0px'
        viewBox='0 10 60 60'
        className='consoleBtnSvg'
    >
        <path d='M51,54H29v-6h22V54z M31,52h18v-2H31V52z'/>
        <rect x='30' y='38' width='2' height='11'/>
        <rect x='31' y='38' width='19' height='2'/>
        <rect x='48' y='39' width='2' height='10'/>
        <path d='M48,39h-2v-5c0-3.3-2.7-6-6-6c-3.3,0-6,2.7-6,6v5h-2v-5c0-4.4,3.6-8,8-8c4.4,0,8,3.6,8,8V39z'/>
    </svg>;
};
