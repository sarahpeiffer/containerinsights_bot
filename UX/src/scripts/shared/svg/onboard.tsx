
/** tpl */
import * as React from 'react';
import { DisplayStrings } from '../../multicluster/MulticlusterDisplayStrings';

/**
 * react component defining icon to represent 'warning' state
 */
export const OnboardSvg: React.StatelessComponent<{}> = () => {
    return (
        // tslint:disable-next-line:max-line-length
        <svg viewBox='0 0 300 180'>
            <title>{DisplayStrings.OnboardUnmonitoredClustersCardSvgTitle}</title>
            <defs>
                <linearGradient x1='176.304' y1='34.52' x2='228.683' y2='134.115' gradientTransform='matrix(1, 0.002, 0.002, -1, -0.042, 178.529)' gradientUnits='userSpaceOnUse'>
                    <stop offset='0' stop-color='#0078d4'/>
                    <stop offset='0.073' stop-color='#0c7dd8'/>
                    <stop offset='0.313' stop-color='#308ce2'/>
                    <stop offset='0.539' stop-color='#4997e9'/>
                    <stop offset='0.743' stop-color='#599eed'/>
                    <stop offset='0.906' stop-color='#5ea0ef'/>
                </linearGradient>
            </defs>
            <rect width='300' height='180' fill='#f2f2f2'/>
            <g>
                <path d='M202.7,122.57l-57.726,33.989a16.209,16.209,0,0,1-16.192.016l-16.953-9.786,13.1-7.775a3.544,3.544,0,0,0,1.962-2.676,2.456,2.456,0,0,0-.007-.641,4.873,4.873,0,0,0-2.767-3.419L83.513,110.3c-3.155-1.78-7.943-1.915-10.678-.3L44.22,126.98c-1.6.945-2.284,2.385-1.841,3.852a5.292,5.292,0,0,0,2.655,2.884L85.64,155.692a12.241,12.241,0,0,0,5.867,1.429,9.658,9.658,0,0,0,4.81-1.129l14.524-8.618L128.28,157.44a17.212,17.212,0,0,0,17.2-.017l57.731-33.991ZM95.807,155.132c-2.458,1.453-6.8,1.312-9.684-.315L45.518,132.841a4.4,4.4,0,0,1-2.182-2.3c-.31-1.027.185-1.987,1.4-2.7L73.35,110.863c2.458-1.452,6.8-1.314,9.684.314l40.6,21.976a3.991,3.991,0,0,1,2.26,2.671,1.526,1.526,0,0,1,0,.405,2.653,2.653,0,0,1-1.476,1.925Z' fill='#83b9f9'/>
                <path d='M52.393,99.614a3.886,3.886,0,0,0,1.939,2.081l32.631,17.66c2.435,1.374,6.1,1.474,8.176.245l22.991-13.641a2.513,2.513,0,0,0,1.381-1.85,1.664,1.664,0,0,0,0-.423,3.54,3.54,0,0,0-2.016-2.44L84.86,83.586c-2.435-1.374-6.1-1.474-8.177-.245L53.692,96.982A2.258,2.258,0,0,0,52.393,99.614Z' fill='#d8d8d8'/>
                <path d='M97.548,149.252l-.071.108-1.884,1.119-.089.055c-2.081,1.23-5.741,1.129-8.176-.244L54.7,132.63c-1.6-.9-2.273-2.123-1.953-3.2L52.4,99.611a3.883,3.883,0,0,0,1.939,2.081l32.631,17.66c2.435,1.374,6.1,1.475,8.176.245l.089-.055,22.911-13.595a2.513,2.513,0,0,0,1.381-1.85l.36,30.511a1.663,1.663,0,0,1,0,.423,2.528,2.528,0,0,1-1.381,1.85l-.848.5Z' fill='#fff'/>
                <path d='M84.536,139.47v2.406L58.818,127.029v-2.406Z' fill='#9cebff'/>
                <path d='M84.536,135.713,58.818,120.866V118.46l25.718,14.847Z' fill='#9cebff'/>
                <path d='M58.818,114.71v-2.4l25.718,14.847v2.4Z' fill='#9cebff'/>
                <path d='M111.327,120.933c-.8-.468-.792-1.969.018-3.353s2.113-2.127,2.912-1.659.793,1.968-.016,3.352S112.127,121.4,111.327,120.933Z' fill='#4dc2eb'/>
                <path d='M51.994,56.941a3.892,3.892,0,0,0,1.94,2.081l32.631,17.66c2.434,1.373,6.095,1.474,8.175.245l22.992-13.641a2.509,2.509,0,0,0,1.38-1.85,1.577,1.577,0,0,0,0-.423,3.54,3.54,0,0,0-2.016-2.44l-32.63-17.66c-2.435-1.374-6.095-1.475-8.176-.245l-23,13.641A2.257,2.257,0,0,0,51.994,56.941Z' fill='#d8d8d8'/>
                <path d='M97.149,106.579l-.07.108-1.885,1.119-.088.055c-2.081,1.23-5.742,1.129-8.176-.245L54.3,89.956c-1.6-.9-2.273-2.122-1.953-3.2L52,56.937a3.892,3.892,0,0,0,1.94,2.081l32.631,17.66c2.434,1.374,6.095,1.474,8.175.245l.089-.055,22.912-13.595a2.515,2.515,0,0,0,1.38-1.851l.36,30.512a1.612,1.612,0,0,1,0,.422,2.53,2.53,0,0,1-1.38,1.851l-.849.5Z' fill='#fff'/>
                <path d='M84.138,96.8v2.4L58.419,84.356V81.95Z' fill='#9cebff'/>
                <path d='M84.138,93.039,58.419,78.193V75.787L84.138,90.634Z' fill='#9cebff'/>
                <path d='M58.419,72.037V69.631L84.138,84.478v2.406Z' fill='#9cebff'/>
                <path d='M110.535,77.888c-.864-.505-.856-2.128.019-3.624s2.285-2.3,3.149-1.794.857,2.128-.018,3.624S111.4,78.394,110.535,77.888Z' fill='#4dc2eb'/>
                <g>
                    <path d='M57.891,148.164V125.425h-7.9v22.739a1.984,1.984,0,0,0,1.167,1.62,6.169,6.169,0,0,0,5.588,0A1.954,1.954,0,0,0,57.891,148.164Z' fill='#0078d4'/>
                    <path d='M56.727,123.808c1.548.893,1.554,2.344.018,3.236a6.163,6.163,0,0,1-5.588,0c-1.548-.892-1.558-2.343-.019-3.239A6.162,6.162,0,0,1,56.727,123.808Z' fill='#005ba1'/>
                    <path d='M55.666,117.3a3.817,3.817,0,0,0-3.458,0,1.222,1.222,0,0,0-.711,1v6.653a1.231,1.231,0,0,0,.721,1,3.809,3.809,0,0,0,3.457,0,1.208,1.208,0,0,0,.709-1V118.3A1.226,1.226,0,0,0,55.666,117.3Z' fill='#0078d4'/>
                    <path d='M57.232,111.492c-7.72-4.457-13.955-15.257-13.93-24.125.016-4.407,1.57-7.505,4.079-8.963l-6.563,3.814c-2.509,1.457-4.063,4.556-4.075,8.962-.025,8.869,6.21,19.669,13.93,24.125,3.882,2.24,7.4,2.449,9.942.973l6.562-3.813C64.634,113.941,61.117,113.732,57.232,111.492Z' fill='#005ba1'/>
                    <path d='M52.58,114.125c7.717,4.456,13.992.88,14.017-7.988S60.387,86.468,52.67,82.012s-14-.88-14.021,7.988S44.859,109.666,52.58,114.125Z' fill='#fff' opacity='0.4' style={{ isolation: 'isolate' }}/>
                    <path d='M50.8,79.4c9.539,5.508,17.25,18.864,17.219,29.826S60.225,124.61,50.685,119.1s-17.25-18.863-17.219-29.829S41.255,73.886,50.8,79.4Zm-.128,35.892c7.717,4.457,13.992.88,14.017-7.988S58.477,87.632,50.76,83.176s-13.995-.88-14.02,7.988,6.213,19.669,13.93,24.125Z' fill='#5ea0ef'/>
                    <path d='M57.279,75.677c-4.8-2.771-9.149-3.027-12.292-1.2L38.425,78.29c3.142-1.825,7.492-1.57,12.3,1.2C60.259,85,67.97,98.357,67.939,109.32,67.923,114.768,66,118.6,62.9,120.4l6.563-3.814c3.1-1.8,5.024-5.635,5.039-11.081C74.529,94.541,66.819,81.185,57.279,75.677Z' fill='#005ba1'/>
                </g>
                <g>
                    <path d='M155.077,37.712l9.843-5.691c4.756-2.75,11.11-2.9,18.275-.033l-9.843,5.691C166.187,34.81,159.833,34.962,155.077,37.712Z' fill='#0078d4'/>
                    <g>
                        <path d='M249.06,81.162l-.067.031.017-.01c-.076-20.323-14.952-45.336-33.416-56.051-9.66-5.606-18.467-6.211-24.683-2.618l-9.843,5.691c6.216-3.594,15.022-2.988,24.683,2.618,18.079,10.492,32.709,34.688,33.382,54.771l-2.867,1.28c12.742,9.857,25.2,27.841,25.129,42.433-.039,7.826-3.065,13.182-7.652,15.834l10.162-5.807c4.587-2.652,7.416-8.155,7.455-15.982C271.434,108.761,261.8,91.019,249.06,81.162Z' fill='#0078d4'/>
                        <path d='M239.152,86.827C239.077,66.5,224.2,41.491,205.737,30.776,190.8,22.105,177.9,25.4,173.465,37.685c-15.4-6.166-27.053,1.624-27.142,19.162-.1,19.5,14.336,43.726,32.248,54.121.961.557,1.9,1.063,2.847,1.508l52.526,30.483a5.33,5.33,0,0,0,1.371.57c14.465,7.7,26.057,1.389,26.137-14.512C261.526,114.425,251.893,96.684,239.152,86.827Z' fill='#4d99ea'/>
                    </g>
                </g>
            </g>
        </svg>
    );
};









