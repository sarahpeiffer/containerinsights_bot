import * as React from 'react';
import { DisplayStrings } from '../DisplayStrings';

import './svg.css';

interface IVirutalPodProps {
    title?: string
}

export const VirtualPodSvg: React.StatelessComponent<IVirutalPodProps> = (props) => {
    let setProps = (t: SVGElement) => {
        if (t) {
            t.setAttribute('focusable', 'false');
        }
    };
   
    // tslint:disable:max-line-length 
    return (
        <span title={DisplayStrings.VirtualPodSVGTooltip}>
<svg ref={t => setProps(t)} version='1.1' x='0px' y='0px' width='50px' height='50px' viewBox='0 0 50 50'>
<path fill='#59B4D9' d='M41.897,13.318C41.535,7.036,36.347,2.05,29.98,2.05c-3.985,0-7.505,1.96-9.676,4.961
	c-1.597-1.23-3.591-1.97-5.762-1.97c-5.226,0-9.462,4.24-9.462,9.47c0,0.794,0.108,1.561,0.292,2.298
	C2.265,18.218,0.1,21.342,0.1,24.978c0,4.955,4.013,8.972,8.964,8.972h30.378c5.776,0,10.458-4.686,10.458-10.467
	C49.9,18.55,46.486,14.425,41.897,13.318z'/>
<path opacity='0.2' fill='#FFFFFF' d='M41.897,13.318C41.535,7.036,36.347,2.05,29.98,2.05c-3.985,0-7.505,1.96-9.676,4.961
	c-1.597-1.23-3.591-1.97-5.762-1.97c-5.226,0-9.462,4.24-9.462,9.47c0,0.794,0.108,1.561,0.292,2.298
	C2.265,18.218,0.1,21.342,0.1,24.978c0,4.955,4.013,8.972,8.964,8.972h30.378c5.776,0,10.458-4.686,10.458-10.467
	C49.9,18.55,46.486,14.425,41.897,13.318z'/>
<path fill='#804998' d='M23.228,47H4.772C3.793,47,3,46.207,3,45.228V24.772C3,23.793,3.793,23,4.772,23h18.456
	C24.207,23,25,23.793,25,24.772v20.456C25,46.207,24.207,47,23.228,47z'/>
<rect x='5' y='25' fill='#FFFFFF' width='18' height='20'/>
<path fill='#804998' d='M7,27v16h14V27H7z M9,41V29h2v12H9z M13,41V29h2v12H13z M19,41h-2V29h2V41z'/>
<path fill='#804998' d='M45.228,47H26.772C25.793,47,25,46.207,25,45.228V24.772C25,23.793,25.793,23,26.772,23h18.456
	C46.207,23,47,23.793,47,24.772v20.456C47,46.207,46.207,47,45.228,47z'/>
<rect x='27' y='25' fill='#FFFFFF' width='18' height='20'/>
<path fill='#804998' d='M29,27v16h14V27H29z M31,41V29h2v12H31z M35,41V29h2v12H35z M41,41h-2V29h2V41z'/>
</svg>
</span>
    );
};
