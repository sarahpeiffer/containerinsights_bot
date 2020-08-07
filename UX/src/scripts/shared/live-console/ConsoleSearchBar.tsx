import * as React from 'react';

//SVG
import { SearchGlassSVG } from '../svg/search-glass';
import { CloseSvg } from '../svg/close';

// shared
import { Utility } from '../Utilities/Utility';
import { StringHelpers } from '../Utilities/StringHelpers';
import { DisplayStrings } from '../DisplayStrings';

interface ISearchBarProps {

    /** onSearchTermChange: onChange handler for changing the search term in state on Search bar */
    onSearchTermChange: (term: string) => void;

    /**Placeholder for when there is no text in search bar */
    searchPlaceholder: string;

    /** Current search term */
    term: string;

    /** Number of matches */
    numMatches: number;

    /** Total */
    totalItems: number;

    /** JSX element defining prev button functionality */
    prevButton: JSX.Element;
    /** JSX element defining next button functionality */
    nextButton: JSX.Element;

    /** Clears the search term in the search bar */
    onSearchTermCleared: () => void;
}

/**
 * Implements a searchbar that can be used to filter items by term.
 */
export const ConsoleSearchBar: React.StatelessComponent<ISearchBarProps> = (props) => {

    let disabledCss = '';
    if (StringHelpers.isNullOrEmpty(props.term)) {
        disabledCss = 'disabledIcon';
    };

    return (
        <div className='console-searchbar'>
            <div className='console-search-glass'>
                <SearchGlassSVG />
            </div>
            <input
                className='console-searchbar-input'
                type='text'
                placeholder={props.searchPlaceholder}
                role='searchbox'
                aria-label={props.searchPlaceholder}
                value={props.term}
                onChange={e => onSearchTermChange(e, props)}
            />
            <div className='console-search-result-number'>
                {props.numMatches}/{props.totalItems}
            </div>
            <div className='consoleSearchBarControls'>
                <div 
                    className={'consoleSearchBarActionBtn ' + disabledCss} 
                    role='button' 
                    tabIndex={0}
                    aria-label={DisplayStrings.ClearSearchInput}
                    onClick={props.onSearchTermCleared}
                    onKeyDown={(e) => { Utility.AffirmativeKeyDown(e, () => { props.onSearchTermCleared() }) }}
                >
                    <CloseSvg />
                </div>
                {props.prevButton}
                {props.nextButton}
            </div>
        </div>
    );
}

/**
 * onclick handler for changing the term in state in SearchBar
 * @param e onChange event from search input
 * @return void
 */
function onSearchTermChange(e: React.ChangeEvent<HTMLInputElement>, props: ISearchBarProps): void {
    if (e) {
        e.persist();
        if (e.target) {
            let term = e.target.value;
            props.onSearchTermChange(term);
        }
    }
}
