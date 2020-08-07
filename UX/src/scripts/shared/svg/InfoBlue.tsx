import * as React from 'react';
import './svg.css';

interface IInfoBlueSVGProps {
    className?: string,
    color?: string
}
// tslint:disable:max-line-length
export class InfoBlueSVG extends React.Component<IInfoBlueSVGProps> {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <svg className={this.props.className} viewBox='0 0 9 9'>
                <circle fill={this.props.color || '#0072c6'} cx='4.5' cy='4.5' r='4.5'/>
                <circle fill='#fff' cx='4.5' cy='2.315' r='0.815'/>
                <polygon fill='#fff' points='4.378,7.5 4.622,7.5 5.231,7.5 5.231,3.93 4.622,3.93 4.378,3.93 3.776,3.93 3.769,7.5 '/>
            </svg>
        );
    }
}
