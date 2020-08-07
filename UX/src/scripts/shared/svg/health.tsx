/** tpl */
import * as React from 'react';

/** styles */
import './svg.less'; 

export const HealthSVG: React.StatelessComponent = () => {
    return (
        <svg xmlns='http://www.w3.org/2000/svg'  width='18' height='18' viewBox='0 0 18 18'>
            <defs><linearGradient x1='8.66' y1='17.12' x2='8.66' y2='1.03' gradientUnits='userSpaceOnUse'>
                <stop offset='0' stop-color='#1988d9'/>
                <stop offset='0.22' stop-color='#218ddc'/>
                <stop offset='0.56' stop-color='#379ce5'/>
                <stop offset='0.9' stop-color='#54aef0'/>
                </linearGradient>
            </defs>
            <title>Icon-general-4</title>
            <path d='M8.66,17.12c8.18-5.86,8.46-9.28,8.49-10.35C17.2,5.27,17,1.36,13,1.05A4.26,4.26,0,0,0,8.66,3.9,4.28,4.28,0,0,0,4.27,1.05C.32,1.36.11,5.27.16,6.77c0,1.07.32,4.49,8.5,10.35' fill='url(#f5e553fa-756a-4028-aba5-719555f5d693)'/>
            <path d='M17.15,6.77C17.2,5.27,17,1.36,13,1.05A4.26,4.26,0,0,0,8.66,3.9,4.28,4.28,0,0,0,4.27,1.05C.32,1.36.11,5.27.16,6.77c0,1.07.24,4.44,8.43,10.3' fill='none'/>
            <path d='M17.15,6.18h-4a.17.17,0,0,0-.13.07L11.81,8.34a.16.16,0,0,1-.27,0L9.81,5.05a.31.31,0,0,0-.56,0L7.59,10a.16.16,0,0,1-.29,0L5.88,6.71a.31.31,0,0,0-.55,0L3.39,10.2a.16.16,0,0,1-.13.08H1.42a13,13,0,0,0,.9,1.22H4a.13.13,0,0,0,.13-.08L5.34,9.19a.16.16,0,0,1,.28,0l1.66,3.86a.31.31,0,0,0,.58,0L9.61,7.85a.15.15,0,0,1,.28,0l1.46,2.77a.3.3,0,0,0,.53,0l1.86-3.13a.16.16,0,0,1,.13-.08H17.1' fill='#fff'/>
        </svg>
    )
};
