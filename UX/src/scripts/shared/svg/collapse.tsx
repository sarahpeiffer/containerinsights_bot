import * as React from 'react';
import './svg.css';

// tslint:disable:max-line-length
export class CollapseSVG extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <svg viewBox='0 0 8 8.4' style={{transform: 'rotate(-90deg)'}}>
            <g>
                <path d='M4 3.7l-4 4 .7.7L4 5l3.3 3.4.7-.7-4-4z'></path>
                <path d='M4 0L0 4l.7.7L4 1.4l3.3 3.3L8 4 4 0z'></path>
            </g>
        </svg>;
    }
}



