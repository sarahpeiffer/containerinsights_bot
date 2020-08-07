
import * as React from 'react';

import '../../../../styles/container/LiveConsoleV2/LiveConsoleTabWrapper.less'

import { LiveConsoleViewModel } from '../viewmodels/LiveConsoleViewModel';
import { LiveConsoleActionBarView } from './LiveConsoleActionBarView';
import { LiveConsoleScrollableTextView } from './LiveConsoleScrollableText';
import { DisplayStrings } from '../../DisplayStrings';

// svg
import { GreenSvg } from '../../svg/green';
import { UnknownSvg } from '../../svg/unknown';
import { FailedSvg } from '../../svg/failed';

interface ILiveConsoletabWrapperViewProps {
    parentContext: LiveConsoleViewModel;
}

/**
 * The state of the console view panel
 */
interface ILiveConsoletabWrapperViewState {
    /** context (view model) */
    context: LiveConsoleViewModel;
}

/**
 * The container class for the live console
 */
export class LiveConsoletabWrapperView extends React.Component<ILiveConsoletabWrapperViewProps, ILiveConsoletabWrapperViewState> {
    /**
     * initializes a new instance of the class
     * @param props component properties
     */
    constructor(props: ILiveConsoletabWrapperViewProps) {
        super(props);

        this.state = {
            context: props.parentContext,
        }
    }

    /**
   * react callback invoked to render component
   */
    public render(): JSX.Element {
        return this.renderHeaderTabsAndRunningStatus();
    }

    private renderHeaderTabsAndRunningStatus(): JSX.Element {
        return (
            <div className='liveconsole-tab-root'>
                <div className='liveconsole-header-tabandstatus-root'>
                    {this.renderAvailableTabs()}
                    {this.renderRunningStatus()}
                </div>
                {this.renderSeparatorLine()}
                {this.renderBodyOfTab()}
            </div>
        );
    }

    private renderBodyOfTab(): JSX.Element {
        return (
            <div id='liveconsole-tab-body-root' className='liveconsole-tab-body-root'>
                <LiveConsoleActionBarView parentContext={this.state.context} />
                <LiveConsoleScrollableTextView parentContext={this.state.context} />
            </div>
        );
    }

    private renderSeparatorLine(): JSX.Element {
        return (
            <div className='liveconsole-header-separator-line'>
                &nbsp;
            </div>
        )
    }

    private renderAvailableTabs(): JSX.Element {

        const eventTab =
            <div
                className='liveconsole-header-tab liveconsole-header-selected-tab'
                role='tab'
                aria-label={DisplayStrings.liveConsoleHeaderEventsText}
                tabIndex={0}
                aria-controls={'liveconsole-tab-body-root'}
            >
                {DisplayStrings.liveConsoleHeaderEventsText}
            </div>;

        return (
            <div className='liveconsole-header-tab-root' role='tablist'>
                {eventTab}
            </div>
        );
    }

    private renderRunningStatus(): JSX.Element {
        let icon = <GreenSvg />;
        let runningStatusText: string =
            DisplayStrings.liveLogsRunning + ', '
            + this.props.parentContext.getLiveConsoleQueryResultCount() + ' '
            + DisplayStrings.liveConsoleHeaderEventsText;
        if (this.props.parentContext.isLiveConsolePaused()) {
            icon = <UnknownSvg />;
            runningStatusText = DisplayStrings.liveLogsReasonPasued
        } else if (!this.props.parentContext.getLiveConsoleQueryResultStatus()) {
            icon = <FailedSvg />;
            runningStatusText = DisplayStrings.failed;
        }

        return (
            <div className='liveconsole-header-status-root'>
                <div className='liveconsole-header-status-text' aria-label={runningStatusText}>
                    {runningStatusText}
                </div>
                <div className='liveconsole-header-status-svg' title={runningStatusText}>
                    <title>{runningStatusText}</title>
                    {icon}
                </div>
            </div>
        )
    }

}
