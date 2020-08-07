import * as React from 'react';
import './svg.css';

/**
 * stopped background color options..
 */
export enum StoppedSvgColor {
    Black,
    Green
}

/**
 * properties for the stopped icon
 */
export interface IStoppedSvgProps {
    color: StoppedSvgColor;
}

/**
 * stopped icon, can be made both green and black at this time
 */
export class StoppedSvg extends React.Component<IStoppedSvgProps> {
    constructor(props) {
        super(props);
    }

    /**
     * render the icon
     */
    render() {
        const color = this.props.color === StoppedSvgColor.Black ? '#464f59' : '#7FBA00';
        return <svg version='1.1' x='0px' y='0px'
            width='9px' height='9px' viewBox='0 0 9 9'>
            <circle fill={color} cx='4.5' cy='4.5' r='4.5' />
            <rect x='3' y='3' fill='#FFFFFF' width='3' height='3' />
        </svg>;
    }
}



