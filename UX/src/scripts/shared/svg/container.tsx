import * as React from 'react';
import { DisplayStrings } from '../DisplayStrings'

// tslint:disable:max-line-length 
export const ContainerSVG: React.StatelessComponent<{}> = ({}) => {
    return (
        <span title={DisplayStrings.ComparisonGridColumnTitleContainers}>
            <svg x='0px' y='0px' width='50px' height='50px' viewBox='0 0 50 50'>
                <title>{DisplayStrings.ComparisonGridColumnTitleContainers}</title>
                <g>
                    <path fill='#59B4D9' d='M47,49H3c-1.105,0-2-0.895-2-2V3c0-1.105,0.895-2,2-2h44c1.105,0,2,0.895,2,2v44C49,48.105,48.105,49,47,49
                        z'/>
                    <g opacity='0.5'>
                        <path fill='#0072C6' d='M47,3v44H3V3H47 M47,1H3C1.895,1,1,1.895,1,3v44c0,1.105,0.895,2,2,2h44c1.105,0,2-0.895,2-2V3
                            C49,1.895,48.105,1,47,1L47,1z'/>
                    </g>
                </g>
                <path opacity='0.8' fill='#0072C6' d='M39,7h-4h-4h-4h-4h-4h-4h-4H7v4v28v4h4h4h4h4h4h4h4h4h4v-4V11V7H39z M11,39V11h4v28H11z
                    M19,39V11h4v28H19z M27,39V11h4v28H27z M39,39h-4V11h4V39z'/>
            </svg>
        </span>
    );
}
