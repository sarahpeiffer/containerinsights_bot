import * as React from 'react';

import '../../../../styles/container/LiveConsoleV2/LiveConsoleActionBarView.less';

import { SearchGlassSVG } from '../../svg/search-glass';
import { CloseSvg } from '../../svg/close';
import { ChevronUpSvg } from '../../svg/chevron-up';
import { ChevronDownSvg } from '../../svg/chevron-down';
import { PlaySVG } from '../../svg/play';
import { PauseSVG } from '../../svg/pause';
import { TextDropDownPill } from '../../pill-component/TextDropDownPill';
import { DisplayStrings } from '../../DisplayStrings';
import { LiveConsoleViewModel } from '../viewmodels/LiveConsoleViewModel';

interface ILiveConsoleActionBarViewProps {
    parentContext: LiveConsoleViewModel;
}

interface ILiveConsoleActionBarViewState {
    /** context (view model) */
    context: LiveConsoleViewModel;
}

export class LiveConsoleActionBarView extends React.Component<ILiveConsoleActionBarViewProps, ILiveConsoleActionBarViewState> {

    constructor(props: ILiveConsoleActionBarViewProps) {
        super(props);

        this.state = {
            context: props.parentContext
        };

    }

    public render(): JSX.Element {
        // let disabledCss = ''; // Will be set to .disabled if action is unavailable
        return (
            <div className='liveconsole-header-control-line'>
                {this.renderSearch()}
                <div className='liveconsole-header-pill'>
                    <TextDropDownPill
                        containerId={'console-controls-drop-down-view'}
                        selectedItem={this.state.context.selectedPillOption}
                        dropDownOptions={this.state.context.pillOptionList}
                        onSelectionChanged={(value) => this.state.context.onLiveQueryTypeChanged(value)}
                        areValuesLoading={false}
                        pillLabel={'Filter' + DisplayStrings.LabelSeperator} />
                </div>
                <div className='liveconsole-header-main-action-controls'>
                    {/* Will add scroll lock in PR - 2 */}
                    {/* {this.generateButton(<LockedConsoleSVG />, 'Scroll Lock/Unlock', () => { return; })} */}
                    {this.props.parentContext.isLiveConsolePaused()
                        ? this.generateButton(
                            <PlaySVG />,
                            DisplayStrings.Play,
                            DisplayStrings.Play,
                            this.state.context.toggleLivePanelPauseState
                        )
                        : this.generateButton(
                            <PauseSVG />,
                            DisplayStrings.Pause,
                            DisplayStrings.Pause,
                            this.state.context.toggleLivePanelPauseState
                        )
                    }
                </div>
            </div>
        )
    }

    private renderSearch() {
        return <div className='liveconsole-header-search'>
            <div className='liveconsole-header-searchbar'>
                <div className='liveconsole-header-search-glass'>
                    <SearchGlassSVG />
                </div>
                <input
                    className='liveconsole-searchbar-input'
                    type='text'
                    placeholder={DisplayStrings.containerLiveSearch}
                    role='searchbox'
                    aria-label={this.state.context.searchTerm ? this.state.context.searchTerm : DisplayStrings.EnterNameToSearchFor}
                    value={this.state.context.searchTerm}
                    onChange={e => this.state.context.onSearchTermChanged(e)}
                />
                <div className='liveconsole-search-result-number'
                    aria-label={this.props.parentContext.selectedMatchIndex + '/' + this.props.parentContext.totalSearchResults}
                >
                    {this.props.parentContext.selectedMatchIndex + '/' + this.props.parentContext.totalSearchResults}
                </div>
                <div className='liveconsole-search-bar-controls'>
                    {this.generateButton(<CloseSvg />, '', DisplayStrings.Close, this.state.context.clearSearchTerm)}
                    {this.generateButton(
                        <ChevronUpSvg />, '', DisplayStrings.PreviousSearchMatch, this.state.context.moveToPreviousSearchResult
                    )}
                    {this.generateButton(<ChevronDownSvg />, '', DisplayStrings.NextSearchMatch, this.state.context.moveToNextSearchResult)}
                </div>
            </div>
        </div>;
    }

    private generateButton(icon: JSX.Element, innerStr: string, ariaLabel: string, onClick: () => void): JSX.Element {
        return (
            <button
                className='live-console-header-action-button'
                onClick={onClick.bind(this.state.context)}
                aria-label={ariaLabel}
                role='button'
            >
                <div className='live-console-header-action-button-icon'>
                    {icon}
                </div>
                <div className='live-console-header-action-button-text'>
                    {innerStr}
                </div>
            </button>
        );
    }

}
