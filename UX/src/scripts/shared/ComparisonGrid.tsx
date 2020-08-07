import * as React from 'react';
import { SelectableGrid, SGColumn, SGSortOrder } from 'appinsights-iframe-shared';

import { ErrorStatusProps, ErrorStatus } from './ErrorStatus';

import { LoadingSvg } from './svg/loading';
import { ChevronDownSvg } from './svg/chevron-down';
import { ChevronUpSvg } from './svg/chevron-up';

import { DisplayStrings } from './DisplayStrings';
import { Utility } from './Utilities/Utility';

interface IComparisonGridProperties {
    columns: SGColumn[],
    canLoadMore: boolean,
    isLoading: boolean,
    isError: boolean
    gridData: any[],

    sortColumnIndex: number,
    sortDirection: SGSortOrder,

    /**
     * triggered when a row on the selectable grid is clicked...
     */
    onRowSelected?: (selectedItem: any) => void;

    onSortColumnChanged?: (sortColumnIndex: number) => void,
    onSortOrderChanged?: (sortColumnIndex: number, sortOrder: SGSortOrder) => void,

    onLoadMoreClicked?: () => void
}

/**
 * value object to be delivered to external listeners for onGenerateActionItems events
 */
export interface IWrappedValueObject {
    value: any;
}

export class ComparisonGrid extends React.Component<IComparisonGridProperties, any> {
    // ROW_HEIGHT, COMPARISON_GRID_SG_WIDTH, LOAD_MORE_DIV_HEIGHT, LOADING_SVG_DIV_HEIGHT are all constants in ../../styles/index.less
    // If you change them here, you must also change them in index.less 
    private ROW_HEIGHT = 37;


    private gridError = new ErrorStatusProps();

    constructor(props: any) {
        super(props);
        this.selectedRowGridRefreshNoKusto = this.selectedRowGridRefreshNoKusto.bind(this);
    }

    public componentWillUpdate(nextProps, nextState) {
        // Set the error for rendering
        if (nextProps.isError) {
            this.gridError.isVisible = true;
            this.gridError.message = DisplayStrings.DataRetrievalError;
        } else {
            this.gridError.isVisible = false;
            this.gridError.message = '';
        }
    }

    public render(): JSX.Element {
        // make each of these consts also include all the encompassing divs that help apply the right styling
        // this solution could be more efficient because the extra divs wouldn't be being added to the dom at all
        const loadMoreButton = this.props.canLoadMore
            ? <div id='load-more-button'
                onClick={this.props.onLoadMoreClicked}
                onKeyDown={e => Utility.AffirmativeKeyDown(e, this.props.onLoadMoreClicked)}
                role='button'
                tabIndex={0}
            >{DisplayStrings.LoadMore}</div>
            : null;

        const loadingSVG = <div id='loading-svg'><LoadingSvg /></div>;

        const errorMsg = <ErrorStatus
            isVisible={this.gridError.isVisible}
            message={this.gridError.message}
        />;

        const errorMessageVisible = !(this.props.isLoading) && this.props.isError;

        const isNoDataMsgVisible = !this.props.gridData || this.props.gridData.length === 0 &&
            !(this.props.isError) &&
            !(this.props.isLoading);

        let loadMoreClass = 'grid-plus-load-more';
        if (!this.props.isLoading) {
            loadMoreClass += ' grid-plus-load-more-loaded';
        }

        const loadMoreShouldHide = this.props.isLoading || isNoDataMsgVisible || errorMessageVisible;

        if (loadMoreShouldHide) {
            loadMoreClass += ' unset-height';
        }

        let sortIndicators = this.props.onSortOrderChanged ? { asc: <ChevronUpSvg />, desc: <ChevronDownSvg /> } : undefined;

        return (
            <div className='outer-sg'>
                <div className={loadMoreClass}>
                    <div id='sg'
                        onClick={(e) => {
                            e.stopPropagation();
                        }}>
                        <SelectableGrid
                            showEmptyRows={false}
                            columns={this.props.columns}
                            data={this.props.gridData}
                            sortColumn={this.props.sortColumnIndex}
                            rowHeight={this.ROW_HEIGHT}
                            hideHeader={false}
                            onSelect={this.selectedRowGridRefreshNoKusto}
                            sortIndicators={sortIndicators}
                            onSortColumnChanged={this.props.onSortColumnChanged}
                            onSortOrderChanged={this.props.onSortOrderChanged}
                        />
                    </div>
                    <div className={'load-more-button' + (this.props.canLoadMore ? '' : ' invisible') + ' center-flex-content'}>
                        {loadMoreButton}
                    </div>
                </div>

                <div className={'loading-state' + (this.props.isLoading ? '' : ' invisible') +
                    ' position-absolute click-through'}>
                    <div className={'sg-data-plus-loadmore-overlay'
                        + ' transparent-white-overlay not-click-through'}>
                        <div className='loading-state-svg center-flex-content loading-svg-positioner'>
                            {loadingSVG}
                        </div>
                    </div>
                </div>

                <div className={'no-data-msg grid-overlay' + (isNoDataMsgVisible ? '' : ' invisible') + ' not-click-through'}>
                    <div className='no-data-msg-positioner center-flex-content'>
                        <div id='no-data-msg'>
                            {DisplayStrings.NoDataMsg}
                        </div>
                    </div>
                </div>

                <div className={'error-msg grid-overlay' + (errorMessageVisible ? '' : ' invisible') +
                    ' not-click-through'}>
                    <div className='error-msg-positioner center-flex-content'>
                        {errorMsg}
                    </div>
                </div>
            </div>
        );
    }

    /**
     * function we are passing to SelectableGrid to be invoked when selections change
     * Note: this was added as a hack.  in computecomparisongrid if we change and own selection
     * and rendering at that level (to allow change of selection) it will cause kusto to re-query
     * this hacked state item here will allow us to refresh just this level (and keep the props/state)
     * in computecomparisongrid static... we can solve this with a better hoisting strategy (make kusto
     * aware only functions are changing and not re-query)... if we do that, this entire selection ownership
     * can be lifted up into higher level components (main page i think owns property panel state) and this 
     * hack wont be necissary (the whole point here is to tell selectablegrid to redraw when property panel does)
     * TODO: fix hoisted state:
     * https://msecg.visualstudio.com/OMS/_workitems/edit/158562
     * @param selectedItem item which is being selected
     * @returns {void}
     */
    private selectedRowGridRefreshNoKusto(selectedItem: any): void {
        this.props.onRowSelected(selectedItem);
    }

}
