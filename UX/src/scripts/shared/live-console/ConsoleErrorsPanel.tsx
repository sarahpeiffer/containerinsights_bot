/** Library */
import * as React from 'react';

/** Local */
import { IErrorMessageFromProxy } from './ConsoleViewPanel';
import { DisplayStrings } from '../DisplayStrings';
import { TelemetryFactory } from '../TelemetryFactory';
import { TelemetryMainArea } from '../Telemetry';

interface IConsoleErrorsPanelProps {
    lastErrorMessage: IErrorMessageFromProxy;
}

interface IConsoleErrorsPanelState {
}

export class ConsoleErrorsPanel extends React.PureComponent<IConsoleErrorsPanelProps, IConsoleErrorsPanelState> {

    constructor(props) {
        super(props);
    }

    public render(): JSX.Element {
        return (
            // By default this is hidden
            <div className='console-error-details-div-hidden' id='console-error-details-div'>
                <div className='console-header-seperator-line'>&nbsp;</div>
                {this.generateErrorTextElements(this.props.lastErrorMessage)}
                {!(this.props.lastErrorMessage === null)
                    && !(this.props.lastErrorMessage.Troubleshoot === null
                        || this.props.lastErrorMessage.Troubleshoot === undefined)
                    ? this.generateTroubleshootLinkElement(
                        'Troubleshoot',
                        this.props.lastErrorMessage.Troubleshoot,
                        DisplayStrings.LiveLogsTroubleshootRBAC
                    )
                    : ''
                }
            </div>
        );
    }

    /**
    * Generate the Text elements passed in the lastErrorMessage we recived from the proxy
    * @param lastErrorMessage the last error message from the proxy
    */
    private generateErrorTextElements(lastErrorMessage): JSX.Element {
        const data: JSX.Element[] = [];
        if (lastErrorMessage) {
            const keys = Object.keys(lastErrorMessage);
            const errorHeader = {
                KubeApiResponse: DisplayStrings.LiveLogsKubeApiResponseErrorTitle,
                KubeApiStatus: DisplayStrings.LiveLogsKubeApiStatusErrorTitle,
                ProxyResponse: DisplayStrings.LiveLogsProxyResponseErrorTitle,
                ProxyStatus: DisplayStrings.LiveLogsProxyStatusErrorTitle,
                PopupStatus: DisplayStrings.LiveLogsPopupStatusErrorTitle
            }
            keys.forEach((key) => {
                if (!(lastErrorMessage[key] === null || lastErrorMessage[key] === undefined) && !(key === 'Troubleshoot')) {
                    data.push(
                        <div className='errorElement'>
                            <div title={errorHeader[key] ? errorHeader[key] : key}>
                                {errorHeader[key] ? errorHeader[key] : key}
                            </div>
                            <div title={lastErrorMessage[key]}>{lastErrorMessage[key]}</div>
                        </div>
                    );
                }
            });
        }
        return (
            <div>{data}</div>
        );
    }

    /**
    * Generates a troubleshooting link element for the errors div
    * @param ErrorKey Key being passed down from the lastErrorMessage eg. 'Troubleshoot'
    * @param ErrorValue Where the link should point to
    * @param DisplayValue Display string that the end user sees for the specified link
    */
    private generateTroubleshootLinkElement(ErrorKey: string, ErrorValue: string, DisplayValue: string): JSX.Element {
        return (
            <div className='errorElement'>
                <div title={ErrorKey}>{ErrorKey}</div>
                <a title={ErrorValue} href={ErrorValue} target='_blank' onClick={() => {
                    const telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
                    telemetry.logNavigationEvent('live-log-console', ErrorValue);
                }}>
                    {DisplayValue}
                </a>
            </div>
        );
    }

}
