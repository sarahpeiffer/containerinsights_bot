/** tpl */
import * as React from 'react';
/** styles */
import '../../styles/shared/BlueLoadingDots';

interface BlueLoadingDotsProps {
    size: BlueLoadingDotsSize;
}

export enum BlueLoadingDotsSize {
    large = 'large',
    medium = 'medium',
    small = 'small' 
}
export const BlueLoadingDots: React.StatelessComponent<BlueLoadingDotsProps> = ({ size }) => {


    return (
        <div className='blue-loading-dots'>
            <div className={`fxs-progress-dots-dot ${size}`}></div>
            <div className={`fxs-progress-dots-dot ${size}`}></div>
            <div className={`fxs-progress-dots-dot ${size}`}></div>
        </div>
    );
};

