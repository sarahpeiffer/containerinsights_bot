import * as React from 'react';
import '../../../styles/shared/Nesting-Indicators.less';

export interface INestingIndicatorExpandedSVGProps {
    className?: string;
}

// tslint:disable:max-line-length
export const NestingIndicatorExpandedSVG: React.StatelessComponent<INestingIndicatorExpandedSVGProps> = (props) => {
    return (
        <svg className={'nesting-indicator-expanded ' + props.className} 
        x='0px' y='0px' 
        viewBox='0 0 8 8'>
            <polygon points='0,8 8,8 8,0 '/>
        </svg>
    );
}
