import * as React from 'react';

import '../../../../styles/container/LiveConsoleV2/LiveConsoleHeaderView.less';

import { CloseConsoleSVG } from '../../svg/close-console';
import { LiveConsoleViewModel } from '../viewmodels/LiveConsoleViewModel';
import { Utility } from '../../Utilities/Utility';
import { DisplayStrings } from '../../../shared/DisplayStrings';

interface ILiveConsoleHeaderViewProps {
    parentContext: LiveConsoleViewModel;
}

interface ILiveConsoleHeaderViewState {
    /** context (view model) */
    context: LiveConsoleViewModel;
}

export class LiveConsoleHeaderView extends React.Component<ILiveConsoleHeaderViewProps, ILiveConsoleHeaderViewState> {

    constructor(props: ILiveConsoleHeaderViewProps) {
        super(props);

        this.state = {
            context: props.parentContext,
        };

    }

    public render(): JSX.Element {
        return (
            <div className='liveconsole-header-bar'>
                {this.renderHeaderTitleSection()}
            </div>
        );
    }

    private renderHeaderTitleSection(): JSX.Element {
        return (
            <div className='liveconsole-header-title-section'>
                <div className='liveconsole-header-title-text-area-encompasser'>
                    <div className='liveconsole-header-title'
                        aria-label={this.state.context.title}
                    >
                        {this.state.context.title}
                    </div>
                    <div className='liveconsole-header-subtitle'
                        aria-label={this.state.context.subtitle}
                    >
                        {this.state.context.subtitle}
                    </div>
                </div>
                <div className='liveconsole-header-title-section-right-area'>
                    <div
                        className='liveconsole-header-close-button'
                        onKeyDown={(event) => {
                            Utility.AffirmativeKeyDown(event, this.props.parentContext.hideLiveConsole)
                        }}
                        tabIndex={0}
                        aria-label={DisplayStrings.CloseConsole}
                        role='button'
                        onClick={this.props.parentContext.hideLiveConsole}
                    >
                        <CloseConsoleSVG />
                    </div>
                </div>
            </div>
        );
    }
}
