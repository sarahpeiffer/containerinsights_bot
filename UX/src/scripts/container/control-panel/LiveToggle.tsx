import * as React from 'react';
import { DisplayStrings } from '../../shared/DisplayStrings';
export const LiveToggle = ({ seeLiveMetrics, onToggleLiveMetrics }) => {
    return (
        <div className='live-metrics-toggle-switch'>
            <span className='toggle-switch-text'>{DisplayStrings.LiveMetricsToggleSwitchLabel}: </span>
            <label 
                className='switch'
                role='switch'
                aria-checked={seeLiveMetrics}
                aria-label={`Switch live metrics ${seeLiveMetrics ? 'off' : 'on'}`}
                onKeyUp={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        onToggleLiveMetrics(!seeLiveMetrics)
                    }
                }}
                onClick={() => onToggleLiveMetrics(!seeLiveMetrics)}
                tabIndex={0}
            >
                <input 
                    type='checkbox' 
                    checked={seeLiveMetrics} 
                    aria-checked={seeLiveMetrics}
                    onClick={(e) => e.stopPropagation()}
                />
                <span className='slider round'></span>
            </label>
        </div>
    );
}
