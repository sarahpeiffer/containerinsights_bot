import * as React from 'react';
import './svg.css';

// tslint:disable:max-line-length
export class SearchSVG extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <svg viewBox='0 0 32 32' >
            <g>
                <rect x='22' y='12' width='2' height='6'/>
                <rect x='14' y='14' width='2' height='4'/>
                <rect x='18' y='8' width='2' height='10'/>
                <path d='M19,2C12.925,2,8,6.925,8,13c0,2.677,0.958,5.13,2.549,7.037L2,28.586C1.609,28.977,1.609,29.609,2,30
                    c0.195,0.195,0.451,0.293,0.707,0.293S3.219,30.195,3.414,30l8.548-8.548C13.87,23.042,16.323,24,19,24c6.075,0,11-4.925,11-11
                    C30,6.925,25.075,2,19,2z M19,22c-4.963,0-9-4.037-9-9s4.037-9,9-9s9,4.037,9,9S23.963,22,19,22z'/>
            </g>
        </svg>;
    }
}



