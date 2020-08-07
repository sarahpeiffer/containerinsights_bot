import * as React from 'react';

import { IErrorMessageFromProxy } from './ConsoleViewPanel';

interface IConsoleErrorsLinkProps {
    onErrorLinkClick: () => void;
    lastErrorMessage: IErrorMessageFromProxy;
    isErrorPanelVisible: boolean;
    errorLinkMessage: string;
}

interface IConsoleErrorsLinkState {
}

export class ConsoleErrorsLink extends React.PureComponent<IConsoleErrorsLinkProps, IConsoleErrorsLinkState> {
    constructor(props) {
        super(props);
    }

    public render(): JSX.Element {
        return (
            <div className='console-header-errors-link'
                onClick={() => {
                    this.props.onErrorLinkClick();
                    if (this.props.isErrorPanelVisible) {
                        document.getElementById('console-error-details-div').className = 'console-error-details-div-visible';
                    } else {
                        document.getElementById('console-error-details-div').className = 'console-error-details-div-hidden';
                    }
                }}
                onKeyPress={(e) => {
                    let keycode = (e.keyCode ? e.keyCode : e.which);
                    if (keycode === 13) {
                        this.props.onErrorLinkClick();
                        if (this.props.isErrorPanelVisible) {
                            document.getElementById('console-error-details-div').className = 'console-error-details-div-visible';
                        } else {
                            document.getElementById('console-error-details-div').className = 'console-error-details-div-hidden';
                        }
                    }
                }}
                tabIndex={0}
                aria-label={this.props.errorLinkMessage}
            >
                {this.generateErrorToggleLink(this.props.lastErrorMessage, this.props.errorLinkMessage)}
            </div>
        );
    }

    /**
    * Generates an error link for the toggleable div if livelogs fetch failed.
    * @param lastErrorMessage the last error message from the proxy
    * @param errorLinkMessage Message to be displayed to the end user eg. 'Show errors', 'Hide Errors'
    */
    private generateErrorToggleLink(lastErrorMessage: any, errorLinkMessage: string): JSX.Element {
        // Only generate the link if the last error message is present
        if (lastErrorMessage) {
            return (
                <div title={errorLinkMessage}>
                    {errorLinkMessage}
                </div>
            );
        }
        return <div></div>;
    }
}
