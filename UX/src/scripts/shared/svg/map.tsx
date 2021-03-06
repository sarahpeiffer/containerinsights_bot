import * as React from 'react';

import './svg.css';
import { DisplayStrings } from '../DisplayStrings';

export const MapSvg: React.StatelessComponent<{}> = ({ }) => {
    let setProps = (t: SVGElement) => {
        if (t) {
            t.setAttribute('focusable', 'false');
        }
    };

    // tslint:disable:max-line-length 
    return <svg ref={t => setProps(t)} viewBox='10 -15 30 70' width='30px' height='30px'>
        <title> {DisplayStrings.ViewMapAltText} </title>
        <g>
            <title> {DisplayStrings.ViewMapAltText} </title>
            <path fill-rule='evenodd' clip-rule='evenodd' fill='#59B4D9' d='M37.676,26.891c-0.299-0.299-0.769-1.218-2.176-1.218h-7.67H15.5c-1.408,0-1.877,0.919-2.176,1.218L7.096,35.54l4.724,1.29l4.481-6.353h11.53h6.87l4.481,6.353l4.724-1.29L37.676,26.891z' />
            <rect x='23.111' y='14.465' fill-rule='evenodd' clip-rule='evenodd' fill='#59B4D9' width='4.778' height='24.488' />
            <path fill-rule='evenodd' clip-rule='evenodd' fill='#59B4D9' d='M29.169,0.5h-7.338c-2.112,0-3.84,1.728-3.84,3.84v6.655c0,2.112,1.728,3.84,3.84,3.84h7.338c2.112,0,3.84-1.728,3.84-3.84V4.34C33.009,2.228,31.281,0.5,29.169,0.5z M29.596,10.739c0,0.375-0.307,0.683-0.683,0.683h-6.826c-0.375,0-0.683-0.307-0.683-0.683V4.596c0-0.375,0.307-0.683,0.683-0.683h6.826c0.375,0,0.683,0.307,0.683,0.683V10.739z' />
            <path fill-rule='evenodd' clip-rule='evenodd' fill='#0072C6' d='M29.169,0.5h-7.338c-2.112,0-3.84,1.728-3.84,3.84v6.655c0,2.112,1.728,3.84,3.84,3.84h7.338c2.112,0,3.84-1.728,3.84-3.84V4.34C33.009,2.228,31.281,0.5,29.169,0.5z M29.596,10.739c0,0.375-0.307,0.683-0.683,0.683h-6.826c-0.375,0-0.683-0.307-0.683-0.683V4.596c0-0.375,0.307-0.683,0.683-0.683h6.826c0.375,0,0.683,0.307,0.683,0.683V10.739z' />
            <path fill-rule='evenodd' clip-rule='evenodd' fill='#0072C6' d='M27.804,38.213h-4.608c-2.112,0-3.84,1.728-3.84,3.84v4.608c0,2.112,1.728,3.84,3.84,3.84h4.608c2.112,0,3.84-1.728,3.84-3.84v-4.608C31.643,39.941,29.916,38.213,27.804,38.213zM28.23,46.404c0,0.375-0.307,0.683-0.683,0.683h-4.096c-0.375,0-0.683-0.307-0.683-0.683v-4.096c0-0.375,0.307-0.683,0.683-0.683h4.096c0.375,0,0.683,0.307,0.683,0.683V46.404z' />
            <path fill-rule='evenodd' clip-rule='evenodd' fill='#0072C6' d='M0.5,37.053v4.608c0,2.112,1.728,3.84,3.84,3.84h4.608c2.112,0,3.84-1.728,3.84-3.84v-4.608c0-2.112-1.728-3.84-3.84-3.84H4.34C2.228,33.213,0.5,34.941,0.5,37.053z M3.913,37.309c0-0.375,0.307-0.683,0.683-0.683h4.096c0.375,0,0.683,0.307,0.683,0.683v4.096c0,0.375-0.307,0.683-0.683,0.683H4.596c-0.375,0-0.683-0.307-0.683-0.683V37.309z' />
            <path fill-rule='evenodd' clip-rule='evenodd' fill='#0072C6' d='M46.66,33.213h-4.608c-2.112,0-3.84,1.728-3.84,3.84v4.608c0,2.112,1.728,3.84,3.84,3.84h4.608c2.112,0,3.84-1.728,3.84-3.84v-4.608C50.5,34.941,48.772,33.213,46.66,33.213z M47.087,41.404c0,0.375-0.307,0.683-0.683,0.683h-4.096c-0.375,0-0.683-0.307-0.683-0.683v-4.096c0-0.375,0.307-0.683,0.683-0.683h4.096c0.375,0,0.683,0.307,0.683,0.683V41.404z' />
        </g>
    </svg>
};
