/** tpl */
import * as React from 'react';
import * as $ from 'jquery';
import { SelectableGrid, SGColumn, SGSortOrder, SGDataRow } from 'appinsights-iframe-shared';

/** shared */
import { DisplayStrings } from '../MulticlusterDisplayStrings';
import { ErrorStatusProps, ErrorStatus } from '../../shared/ErrorStatus';

/** styles */
import '../../../styles/shared/Grid.less';
import '../../../styles/multicluster/MulticlusterGrid.less';

/** svg */
import { ArrowUpSVG } from '../../shared/svg/arrow-up';
import { ArrowDownSVG } from '../../shared/svg/arrow-down';
import { NestingIndicatorCollapsedSVG } from '../../shared/svg/nesting-indicator-collapsed';
import { NestingIndicatorExpandedSVG } from '../../shared/svg/nesting-indicator-expanded';
import { BlueLoadingDots, BlueLoadingDotsSize } from '../../shared/blue-loading-dots';
import { PageStartup } from '../../shared/PageStartup';

/**
 *  props for Multicluster grid
 */
interface IMulticlusterGridProps {
    /** columns */
    columns: SGColumn[],

    /** to track loading state */
    isLoading: boolean,

    /** to track error state */
    isError: boolean

    /** grid data */
    gridData: SGDataRow[],

    /** sort column index */
    sortColumnIndex: number,

    /** sort order */
    sortOrder: SGSortOrder,

    /** handler to handle sort column changes */
    onSortColumnChanged: (sortColumnIndex: number) => void,

    /** handler to handle sort order changes */
    onSortOrderChanged: (sortColumnIndex: number, sortOrder: SGSortOrder) => void,

    /** the number of subscriptions selected */
    selectedGlobalSubscriptionCount: number,

    /** true indicates the monitored grid and false indicates non-monitored grid */
    isMonitoredGrid: boolean,
}

/**
 *  immplementation of MultiCluster grid component
 */
export class MulticlusterGrid extends React.Component<IMulticlusterGridProps> {
    // ROW_HEIGHT, COMPARISON_GRID_SG_WIDTH, LOAD_MORE_DIV_HEIGHT, LOADING_SVG_DIV_HEIGHT are all constants in ../../styles/index.less
    // If you change them here, you must also change them in index.less
    private ROW_HEIGHT = 37;
    private gridError = new ErrorStatusProps();

    constructor(props: any) {
        super(props);
    }

    public componentWillUpdate(nextProps, nextState) {
        // Set the error for rendering
        if (nextProps.isError) {
            this.gridError.isVisible = true;
            this.gridError.isTroubleShootingMsgVisible = true;
            this.gridError.message = DisplayStrings.DataRetrievalError;
        } else {
            this.gridError.isVisible = false;
            this.gridError.isTroubleShootingMsgVisible = false;
            this.gridError.message = '';
        }

        // Hack
        // Setting #sg height to 100% works perfectly. The grid expands to fill the rest of the space on the page and renders correctly.
        // However, during loading, gridData, while present in state, seems to go missing in the DOM.
        // Twitching of grid headers is also observed.
        // GridData remains in the DOM, however, if the height of its parent div is fixed and set in pixels.
        let gridTotalHeight: number;
        if (nextProps.isLoading) {
            gridTotalHeight = $('#sg').css('height');
            $('#sg').height(gridTotalHeight);
        } else if (!(nextProps.isLoading) && !(nextProps.canLoadMore)) {
            $('#sg').css('height', '100%');
        } else if (!(nextProps.isLoading) && nextProps.canLoadMore) { // load more btn is fixed at the btm of the screen if ht is 100%
            gridTotalHeight = (20 + 1) * this.ROW_HEIGHT;
            $('#sg').css('height', gridTotalHeight);
        }
    }

    public componentDidMount() {
        PageStartup.hackForAutoResizerScrollbarIssue();
    }

    public componentDidUpdate() {
        PageStartup.hackForAutoResizerScrollbarIssue();
    }
    public render(): JSX.Element {
        // make each of these consts also include all the encompassing divs that help apply the right styling
        // this solution could be more efficient because the extra divs wouldn't be being added to the dom at all
        const loadingIcon = <BlueLoadingDots size={BlueLoadingDotsSize.medium}/>;

        const errorMsg = <ErrorStatus
            isVisible={this.gridError.isVisible}
            isTroubleShootingMsgVisible={this.gridError.isTroubleShootingMsgVisible}
            message={this.gridError.message}
        />;

        const isNoDataMsgVisible = this.props.gridData && this.props.gridData.length === 0 &&
            !this.props.isError &&
            !this.props.isLoading;
        return (
            <div className='outer-sg' style={{width: '100%'}}>

                <div id='sg'>
                    <SelectableGrid
                        showEmptyRows={false}
                        columns={this.props.columns}
                        data={this.props.gridData}
                        sortColumn={this.props.sortColumnIndex}
                        rowHeight={this.ROW_HEIGHT}
                        hideHeader={false}
                        sortIndicators={{ asc: <ArrowUpSVG />, desc: <ArrowDownSVG /> }}
                        nestingIndicators={{
                            expand: <NestingIndicatorCollapsedSVG className='size-nesting-indicators' />,
                            collapse: <NestingIndicatorExpandedSVG className='size-nesting-indicators' />
                        }}
                        onSortColumnChanged={this.props.onSortColumnChanged}
                        onSortOrderChanged={this.props.onSortOrderChanged}

                    />
                </div>

                <div className={'loading-state' + (this.props.isLoading ? '' : ' invisible') +
                    ' position-absolute click-through'}>
                    <div className={'sg-data-plus-loadmore-overlay' +
                        ' transparent-grid-overlay click-through'}>
                        <div className='loading-icon-container center-flex-content'>
                            {loadingIcon}
                        </div>
                    </div>
                </div>

                <div className={'no-data-msg grid-overlay' + (isNoDataMsgVisible ? '' : ' invisible') + ' not-click-through'}>
                    <div className='no-data-msg-positioner center-flex-content'>
                        <div id='no-data-msg'>
                            {this.props.selectedGlobalSubscriptionCount === 0 ?
                                DisplayStrings.NoSelectedSubscriptionsMessage : (this.props.isMonitoredGrid ?
                                    DisplayStrings.NoDataMsgForMonitoredGrid.replace(
                                        '{0}', this.props.selectedGlobalSubscriptionCount.toString()) :
                                    DisplayStrings.NoDataMsgForNonMonitoredGrid.replace(
                                        '{0}', this.props.selectedGlobalSubscriptionCount.toString()))
                            }
                        </div>
                    </div>
                </div>

                <div className={'error-msg grid-overlay' + (!(this.props.isLoading) && this.props.isError ? '' : ' invisible') +
                    ' not-click-through'}>
                    <div className='error-msg-positioner center-flex-content'>
                        {errorMsg}
                    </div>
                </div>

            </div>
        );
    }
}
