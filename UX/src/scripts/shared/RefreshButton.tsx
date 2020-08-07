/** tpl */
import * as React from 'react';

/** svg */
import { RefreshSVG } from './svg/refresh';

/** shared */
import { DisplayStrings } from './DisplayStrings';
import { ITelemetry } from './Telemetry';

/** styles */
import '../../styles/shared/RefreshButton';

export interface IRefreshButtonTelemetryCustomProperties {
    telemetryMainArea
}

/** props for RefreshButton */
interface IRefreshButtonProps {
    /** true if the refresh action hasn't finished yet and is still in progress */
    isRefreshInProgress: boolean,
    /** refresh action */
    refreshAction: () => void
    /** telemetry engine */
    telemetry: ITelemetry;
    /** telmetry area info */
    telemetryArea: string;
    /** mechanism for overwriting the wrapper div's class name */
    wrapperClassName?: string;
    /** mechanism for overwriting the svg wrapper div's class name */
    svgClassName?: string;
    /** mechanism for overwriting the text wrapper div's class name */
    textClassName?: string;
}

/** state for RefreshButton */
interface IRefreshButtonState {}

/**
 * Generates the html for a refresh bar that performs the refresh action specified in the refreshAction callback parameter
 * @param refreshAction callback that executes the logic necessary to perform a refresh
 */
export class RefreshButton extends React.Component<IRefreshButtonProps, IRefreshButtonState> {
    constructor(props) {
        super(props);
        this.refreshOnClickWithTelemetry = this.refreshOnClickWithTelemetry.bind(this);
    }
    
    render() {
        let wrapperClassName = this.props.wrapperClassName ? this.props.wrapperClassName : 'default-refresh-button';
        wrapperClassName += this.props.isRefreshInProgress ? ' disabled' : '';
        let svgClassName = this.props.svgClassName ? this.props.svgClassName : 'svg';
        let textClassName = this.props.textClassName ? this.props.textClassName : 'text';
        
        return (
            <button 
                className={wrapperClassName} 
                onClick={this.refreshOnClickWithTelemetry} 
                disabled={this.props.isRefreshInProgress} 
                aria-disabled={this.props.isRefreshInProgress}
                aria-label={DisplayStrings.Refresh}
                role='button'
            >
                <div className={svgClassName}><RefreshSVG /></div>
                <div className={textClassName}>{DisplayStrings.Refresh}</div>
            </button>
        );
    }

    private refreshOnClickWithTelemetry() {
        const telemetryCustomProperties: any = { area: this.props.telemetryArea }
        this.props.refreshAction();
        this.props.telemetry.logEvent('refresh', telemetryCustomProperties, null);
    }
};
