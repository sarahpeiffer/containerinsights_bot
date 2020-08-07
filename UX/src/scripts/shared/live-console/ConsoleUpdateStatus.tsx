/**
 * Block
 */
import * as React from 'react';
import { DisplayStrings } from '../DisplayStrings';
import { ConsoleHeaderStatus, IConsoleRefreshDetails } from './ConsoleHeaderStatus';

/**
 * Props for the ConsoleUpdateStatus
 */
interface IConsoleUpdateStatusProps {
}

/**
 * State for the ConsoleUpdateStatus
 */
interface IConsoleUpdateStatusState {
    lastUpdate: string
}

/**
 * Class that re-renders itself every second in order to accurately depict the amount of time since the last fetch
 */
export class ConsoleUpdateStatus extends React.PureComponent<IConsoleUpdateStatusProps, IConsoleUpdateStatusState> {
    /** Variable that stores the interval that triggers re-render */
    // private interval;
    private static instanceId = 0;
    private instance: string = '';

    constructor(props) {
        super(props);
        this.instance = `consoleUpdateStatus${ConsoleUpdateStatus.instanceId++}`;
        this.state = {
            lastUpdate: DisplayStrings.LiveLogsStarting
        };
    }

    /**
     * Returns the Updated X <time frame> ago span.
     */
    public render(): JSX.Element {
        return (
            <span className='consoleInfoText'>
                ({this.state.lastUpdate})
            </span>
        );
    }

    /**
     * Sets the interval to update the 'last updated' status
     */
    componentDidMount() {
        ConsoleHeaderStatus.Instance().register(this.instance, this.onConsoleHeaderStatusUpdate.bind(this));
    }

    /**
     * Clears the interval set during componentDidMount
     */
    componentWillUnmount() {
        ConsoleHeaderStatus.Instance().unregister(this.instance);
    }

    /**
     * called back by the human readable wrapper over the live logging engine giving us
     * some details about the status of the live logging system
     * @param refreshDetails current details about the live logging system
     */
    private onConsoleHeaderStatusUpdate(refreshDetails: IConsoleRefreshDetails): void {
        if (refreshDetails.isError) {
            this.setState({ lastUpdate: DisplayStrings.LiveLogsQueryFailed });
        } else if (refreshDetails.isPaused) {
            this.setState({ lastUpdate: DisplayStrings.LiveLogsReasonPasued });
        } else {
            if (refreshDetails.isLogsTabPresent) {
                if (refreshDetails.count > 0 || refreshDetails.eventCount > 0) {
                    this.setState({
                        lastUpdate: DisplayStrings.LiveLogsNAdditionalLogs.replace('{0}', refreshDetails.count.toString())
                            + ', ' + DisplayStrings.LiveLogsNEventsFound.replace('{0}', refreshDetails.eventCount.toString())
                    });
                } else {
                    this.setState({ lastUpdate: DisplayStrings.LiveLogsReasonNoNewLogs });
                }
            } else {
                if (refreshDetails.eventCount > 0) {
                    this.setState({
                        lastUpdate: DisplayStrings.LiveLogsNEventsFound.replace('{0}', refreshDetails.eventCount.toString())
                    });
                } else {
                    this.setState({ lastUpdate: DisplayStrings.LiveLogsReasonNoNewLogs });
                }
            }
        }
    }
} 
