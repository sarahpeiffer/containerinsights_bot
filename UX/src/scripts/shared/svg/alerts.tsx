
/** tpl */
import * as React from 'react';
import { DisplayStrings } from '../../multicluster/MulticlusterDisplayStrings';

/**
 * react component defining icon to represent 'warning' state
 */
export const AlertsSvg: React.StatelessComponent<{}> = () => {
    return (
        // tslint:disable-next-line:max-line-length
        <svg viewBox='0 0 300 180'>
            <title>{DisplayStrings.CreateAlertsCardSvgTitle}</title>
            <defs>
                <linearGradient x1='156.327' y1='37.925' x2='119.903' y2='126.914' gradientUnits='userSpaceOnUse'>
                    <stop offset='0' stop-color='#50e6ff'/>
                    <stop offset='1' stop-color='#32bedd'/>
                </linearGradient>
            </defs>
            <rect x='-0.001' width='300' height='180' fill='#f2f2f2'/>
            <path d='M223.191,117c3.329,1.908,3.348,5.037,0,6.954l-10.2,5.924-93.842-54.18,10.2-5.924a13.236,13.236,0,0,1,12,0Z' fill='#d2d2d2'/>
            <path d='M223.231,123.922h0l-10.208,5.92v4.326l10.208-5.94h0c1.643-.955,2.464-2.215,2.464-3.456v-4.326A4.313,4.313,0,0,1,223.231,123.922Z' fill='#b4b4b4'/>
            <g>
                <path d='M213,129.861l-42.81,24.886a13.257,13.257,0,0,1-12.009,0L76.384,107.521c-3.32-1.908-3.339-5.037,0-6.963l42.81-24.877Z' fill='#fafafa'/>
                <path d='M76.383,107.521a4.238,4.238,0,0,1-2.5-3.681l-.13,4.495c0,1.259.831,2.528,2.512,3.5l1.5.868,80.385,46.358h0a13.286,13.286,0,0,0,12.023,0h0l42.847-24.877v-4.321l-42.847,24.887h0a13.3,13.3,0,0,1-12.032,0h0l-.525-.305h0Z' fill='#d2d2d2'/>
            </g>
            <path d='M154.409,127.831a.5.5,0,0,0-.208.454l-.028,10.166a.985.985,0,0,1-.41.911l7.212-4.191a.985.985,0,0,0,.41-.912l.029-10.165a.5.5,0,0,1,.207-.455Z' fill='#50e6ff'/>
            <path d='M177.981,71.335a6.477,6.477,0,0,1,2.95,5.088l-.178,62.988c-.006,1.862-1.336,2.613-2.97,1.67l-22.861-13.2c-.4-.23-.719-.047-.721.4l-.028,10.166c0,.971-.7,1.24-1.444.812a2.75,2.75,0,0,1-.866-.845l-13.726-20.054a1.365,1.365,0,0,0-.437-.425l-40-23.094a6.49,6.49,0,0,1-2.95-5.087L94.93,26.77c0-1.87,1.336-2.613,2.969-1.67Z' fill='#42d4ef'/>
            <path d='M185.193,67.144,105.111,20.909A2.1,2.1,0,0,0,103,20.7l-7.212,4.192A2.1,2.1,0,0,1,97.9,25.1l80.082,46.235a6.477,6.477,0,0,1,2.95,5.088l-.178,62.988a2.048,2.048,0,0,1-.858,1.877l7.213-4.191a2.051,2.051,0,0,0,.857-1.877l.179-62.989A6.477,6.477,0,0,0,185.193,67.144Z' fill='#50e6ff'/>
            <g>
                <path d='M138.537,96.6a5.715,5.715,0,0,1,2.593,4.485l-.006,2.325c0,1.653-1.177,2.315-2.611,1.487l-2.023-1.168a5.717,5.717,0,0,1-2.593-4.492l.007-2.324c0-1.647,1.177-2.309,2.61-1.481Z' fill='#fff'/>
                <path d='M141.348,61.134a3.228,3.228,0,0,1,1.473,2.646l-1.405,27.96c-.047.88-.7,1.214-1.487.759l-4.95-2.858a3.269,3.269,0,0,1-1.473-2.487l-.91-29.3c-.031-.982.644-1.4,1.482-.914Z' fill='#fff'/>
            </g>
            <g>
                <path d='M86.064,109.958,85.9,145.341v11.85l-41.225-23.7.167-47.234L55.02,92.1Z' fill='#5ea0ef'/>
                <path d='M44.837,86.257,55.019,92.1,85.9,109.958l3.672-2L58.524,89.929,48.342,84.088Z' fill='#83b9f9'/>
                <path d='M85.9,157.191l3.5-2.169.167-47.067-3.672,2Z' fill='#0078d4'/>
                <polygon points='67.37 120.499 67.37 108.138 63.363 105.85 63.363 118.191 52.682 112.017 52.682 116.614 63.363 122.79 63.363 135.144 67.37 137.432 67.37 125.09 78.052 131.266 78.052 126.841 67.37 120.499' fill='#fff'/>
            </g>
            <g>
            <polygon points='226.063 96.477 223.499 103.893 223.116 104.842 234.02 98.506 234.403 97.556 236.967 90.14 226.063 96.477' fill='#003067'/>
            <polygon points='187.735 43.999 198.639 37.663 207.524 39.143 196.62 45.48 187.735 43.999' fill='#005ba1'/>
            <path d='M230.275,75.874c-7.69-4.44-13.888-15.174-13.863-24.011.013-4.393,1.559-7.481,4.055-8.931l-10.9,6.336c-2.5,1.451-4.043,4.539-4.055,8.932-.025,8.836,6.172,19.571,13.862,24.011,3.873,2.236,7.376,2.446,9.905.976l10.9-6.336C237.651,78.32,234.147,78.11,230.275,75.874Z' fill='#005ba1'/>
            <polygon points='194.51 29.084 205.414 22.748 210.498 19.851 199.594 26.187 194.51 29.084' fill='#fafafa'/>
            <polygon points='254.854 95.653 251.203 85.229 253.244 80.711 242.34 87.048 240.299 91.565 243.95 101.989 244.456 103.446 255.359 97.11 254.854 95.653' fill='#003067'/>
            <polygon points='218.728 29.121 210.498 19.851 199.594 26.187 207.824 35.458 212.774 35.985 223.678 29.649 218.728 29.121' fill='#005ba1'/>
            <polygon points='251.121 80.157 262.025 73.821 262.001 82.123 251.097 88.46 251.121 80.157' fill='#003067'/>
            <polygon points='261.013 72.799 253.288 65.417 251.279 58.567 240.375 64.904 242.384 71.754 250.11 79.136 251.121 80.157 262.025 73.821 261.013 72.799' fill='#005ba1'/>
            <polygon points='244.329 57.557 255.232 51.221 251.279 58.567 240.375 64.904 244.329 57.557' fill='#003067'/>
            <path d='M251.1,88.46l-8.757-1.412L240.3,91.565l3.651,10.424.506,1.457-5.089,2.9L231.014,97l-4.951-.522-2.564,7.416-.383.949-7.226-4.171-3.137-11.879L207.811,83.6l-7.237.05h-1.015L194.5,74.9l3.958-7.344L196.449,60.7l-7.721-7.374L187.712,52.3l.023-8.3,8.885,1.481,2.046-4.509-3.655-10.427-.5-1.46,5.084-2.9,8.23,9.271,4.95.527,2.559-7.424.384-.944,7.225,4.172,3.142,11.881,4.937,5.181,7.238-.051,1.019,0,5.051,8.754L240.375,64.9l2.009,6.85,7.726,7.382,1.011,1.021Zm-31.726-6.249c7.695,4.442,13.933.887,13.958-7.949s-6.173-19.576-13.867-24.019-13.928-.885-13.953,7.957,6.172,19.571,13.862,24.011' fill='#0078d4'/>
            <polygon points='250.182 42.467 249.163 42.464 241.925 42.514 236.988 37.333 233.846 25.452 226.62 21.281 215.717 27.617 222.942 31.789 226.084 43.67 231.021 48.851 238.259 48.8 239.278 48.803 244.329 57.557 255.232 51.22 250.182 42.467' fill='#005ba1'/>
            </g>
        </svg>
    );
};


