import * as React from 'react';
import '../../../styles/shared/Nesting-Indicators.less';

export interface INestingIndicatorCollapsedSVGProps {
    className?: string;
}

// tslint:disable:max-line-length
export const NestingIndicatorCollapsedSVG: React.StatelessComponent<INestingIndicatorCollapsedSVGProps> = (props) => {
    return (
        <svg className={'nesting-indicator-collapsed ' + props.className}
        x='0px' y='0px' 
        viewBox='0 0 7 11'>
           <path className='default-state' d='M0,11V0l6.8,5.5L0,11z M1,2.1v6.8l4.2-3.4L1,2.1z'/>
           <polygon className='hover-state' points='6.8,5.5 0,0 0,11 '/>
        </svg>
    );
}
