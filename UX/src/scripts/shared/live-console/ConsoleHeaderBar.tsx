/** tpl */
import * as React from 'react';

/** shared */
import { IErrorMessageFromProxy } from './ConsoleViewPanel';

/** svg */
import { CloseConsoleSVG } from '../svg/close-console';
import { ConsoleErrorsPanel } from './ConsoleErrorsPanel';
import { DisplayStrings } from '../DisplayStrings';

/**
 */
interface IConsoleHeaderBarProps {
    /**Container's podName */
    podName: string;

    /**The name of the container */
    containerName: string;

    clusterName: string;

    consoleHeaderTitle: string;

    hideSubtitle: boolean;

    /**Closes console. Triggered when user presses [X] button on header bar */
    onConsoleClose: () => void;

    /**Contains the last error message from the proxy*/
    lastErrorMessage: IErrorMessageFromProxy;
}

/**
 * Header for the Live Console.
 * @param props IConsoleHeaderBarProps
 */
export const ConsoleHeaderBar: React.StatelessComponent<IConsoleHeaderBarProps> = (props) => {
    let subTitle = `(${props.containerName})`;

    if (props.hideSubtitle) {
        subTitle = null;
    }

    return (
        <div className='ConsoleHeaderBar'>
            <div className='resizer-handle-mirage'>
                <i className='resize-dots'></i>
            </div>
            <div className='console-header-prime-line'>
                <div className='console-header-prime-title'>
                    <div className='console-header-podname'>{props.consoleHeaderTitle}</div>
                    <div className='console-header-containername'>{subTitle}</div>
                </div>
                <div className='console-header-prime-right'>

                    <div className='console-headers-window-controls'>
                        {generateCloseBtn(props.onConsoleClose)}
                    </div>
                </div>
            </div>

            <ConsoleErrorsPanel
                lastErrorMessage={props.lastErrorMessage}
            />
        </div>
    );
};

/**
 * Generates the close live console action
 * @param onConsoleClose 
 */
function generateCloseBtn(onConsoleClose: () => void): JSX.Element {
    return (
        <button 
            className='consoleHeaderBtn' 
            onClick={onConsoleClose} 
            value='Close live console window' 
            aria-label={DisplayStrings.CloseConsole}
        >
            <div className='consoleBtnIcon console-header-close-icon'>
                <CloseConsoleSVG />
            </div>
        </button>
    );
}
