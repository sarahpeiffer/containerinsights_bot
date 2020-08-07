import * as React from 'react';
import './svg.css';

/**
 * The "upside down" icon we requested... this is not an upside down icon
 */
export class NoneSvg extends React.Component {
    constructor(props) {
        super(props);
    }

    /**
     * render the icon
     */
    render() {
        return <svg className='msportal-fx-svg-placeholder' viewBox='0 0 30 30'>
            <circle fill='#63707e' cx='15' cy='15' r='14' />
        </svg>;
    }
}



