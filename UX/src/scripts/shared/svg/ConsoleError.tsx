import * as React from 'react'
import './svg.css';

/**
 * Borrowed SVG component from Ibiza; will render an exclamation point warning style icon
 * @param param0 [unused]
 */
export const ConsoleError: React.StatelessComponent<{}> = ({ }) => {

    /**
     * the exclamation point path itself
     */
    const exclamationPath: string = 'M8.267,8H4.501H0.733c-0.6,0-0.916-0.623-0.62-1.129L2.014,3.53l1.882-3.146 \
    C4.198-0.123,4.799-0.13,5.093,0.376L7.001,3.65l1.882,3.229C9.183,7.383,8.881,8,8.267,8z';

    return <svg viewBox='0 0 9 9' className='fxs-consoleerrorinfo-icon msportalfx-svg-placeholder'
        role='presentation' focusable='false' aria-hidden='true'>
        <g>
            <path d={exclamationPath}
            className='msportalfx-svg-c10'></path>
            <circle cx='4.5' cy='6.178' r='0.615' className='msportalfx-svg-c01'></circle>
            <polygon points='4.623,2.428 4.439,2.428 3.98,2.428 4.144,5.278 4.439,5.278 4.623,5.278 4.918,5.278 5.083,2.428' 
                className='msportalfx-svg-c01'></polygon>
        </g>
    </svg>;
}
