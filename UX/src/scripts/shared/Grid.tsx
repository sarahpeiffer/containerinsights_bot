/** tpl */
import * as React from 'react';
import SplitPane from 'react-split-pane';
import * as ReactDOM from 'react-dom';
import { SelectableGrid, SGColumn, SGSortOrder, SGDataRow } from 'appinsights-iframe-shared';

/** local */
import { IMetricDescriptor } from './MetricDescriptor';
import { ErrorStatusProps, ErrorStatus } from './ErrorStatus';
import { DisplayStrings } from './DisplayStrings';
import { ITimeInterval } from './data-provider/TimeInterval';
import { RequiredLoggingInfo } from './RequiredLoggingInfo';
import { ConsoleViewPanel } from './live-console/ConsoleViewPanel';
import { BlueLoadingDots, BlueLoadingDotsSize } from './blue-loading-dots';

/** styles */
import '../../styles/shared/Grid.less';

/** svg */
import { ArrowDownSVG } from './svg/arrow-down';
import { ArrowUpSVG } from './svg/arrow-up';
import { NestingIndicatorCollapsedSVG } from './svg/nesting-indicator-collapsed';
import { NestingIndicatorExpandedSVG } from './svg/nesting-indicator-expanded';
import { LiveDataProvider } from './data-provider/LiveDataProvider';

interface IGridProps {
    metric: IMetricDescriptor,
    timeInterval: ITimeInterval,
    columns: SGColumn[],
    canLoadMore: boolean,
    isLoading: boolean,
    isError: boolean;
    maxRowsCurrent: boolean;
    gridData: SGDataRow[],

    sortColumnIndex: number,
    sortDirection: SGSortOrder,
    onSortColumnChanged: (sortColumnIndex: number) => void,
    onSortOrderChanged: (sortColumnIndex: number, sortOrder: SGSortOrder) => void,

    onLoadMoreClicked: () => void,
    /** Logging info required for the console view */
    loggingInfo: RequiredLoggingInfo,
    /** callback called when the console is closed */
    onConsoleClose: () => void,
    /** boolean representing whether the console is currently open */
    isConsoleOpen: boolean
    onCollapse?: (item, state) => void

    onGridRowSelected: (selectedRow: any) => void;
    /** region override for Kube API Proxy */
    liveDataProvider: LiveDataProvider;
    expandRows?: any[] // rows that need to be expanded
}

interface IGridState {
    haveExpandedRows: boolean;
 }

/**
 * value object to be delivered to external listeners for onGenerateActionItems events
 */
export interface IWrappedValueObject {
    value: any;
}

export class Grid extends React.Component<IGridProps, IGridState> {
    // ROW_HEIGHT, COMPARISON_GRID_SG_WIDTH, LOAD_MORE_DIV_HEIGHT, LOADING_SVG_DIV_HEIGHT are all constants in ../../styles/index.less
    // If you change them here, you must also change them in index.less
    private ROW_HEIGHT = 37;
    private gridError = new ErrorStatusProps();

    constructor(props: any) {
        super(props);

        this.state = {
            haveExpandedRows: false
        }

        this.rowCollapse = this.rowCollapse.bind(this);
        this.selectedRowGridRefreshNoKusto = this.selectedRowGridRefreshNoKusto.bind(this);
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
    }

    /**
     * React component lifecycle method. Used to load the property panel for the first row in the grid, but only on the initial grid load
     * If the grid is receiving new data, then we should reset propertyPanelForFirstRowLoaded to false 
     * and load the property panel for the first row
     * @param prevProps 
     * @param prevState 
     * @param snapshot 
     */
    public componentDidUpdate(prevProps: IGridProps, prevState, snapshot) {
        // Grid should select first row by default
        // nib: We can determine that the first row hasn't been selected by checking if none of the rows in the grid have been selected yet
        if (this.props.gridData && this.props.gridData.length !== 0) {
            const areAllGridRowsUnselected: boolean = this.areAllGridRowsUnselected(this.props.gridData);
            if (areAllGridRowsUnselected === true) {
                const firstRow = this.props.gridData[0];
                const firstRowValue = firstRow.value;
                this.selectedRowGridRefreshNoKusto(firstRowValue);
            }
        }
        if (this.props.gridData.length > 0 && this.props.expandRows && this.props.expandRows.length > 0 && !this.state.haveExpandedRows) {
            this.setState({ haveExpandedRows: true })
            this.props.expandRows.forEach(row => {
                this.rowCollapse(row, false);
            });
        }
    }

    public render(): JSX.Element {
        if (this.props.isConsoleOpen) {
            return (
                <div className='outer-sg-container'>
                    <SplitPane
                        split='horizontal'
                        defaultSize='30%'
                        minSize={120}
                        primary='first'
                    >
                        {this.renderOuterSG()}
                        {this.renderConsole()}
                    </SplitPane>
                </div>
            );
        } else {
            return (
                <div className='outer-sg-container'>
                    {this.renderOuterSG()}
                </div>
            );
        }
    }

    private renderOuterSG(): JSX.Element {
        // make each of these consts also include all the encompassing divs that help apply the right styling
        // this solution could be more efficient because the extra divs wouldn't be being added to the dom at all
        const loadMoreButton = <div id='load-more-button' onClick={this.props.onLoadMoreClicked}>{DisplayStrings.LoadMore}</div>;

        const loadingIcon = <BlueLoadingDots size={BlueLoadingDotsSize.medium} />;

        const errorMsg = <ErrorStatus
            isVisible={this.gridError.isVisible}
            isTroubleShootingMsgVisible={this.gridError.isTroubleShootingMsgVisible}
            message={this.gridError.message}
        />;

        const isNoDataMsgVisible = !this.props.gridData || this.props.gridData.length === 0 &&
            !(this.props.isError) &&
            !(this.props.isLoading);

        const errorMessageVisible = !(this.props.isLoading) && this.props.isError;

        let loadMoreClass = 'grid-plus-load-more';
        const loadMoreShouldHide = this.props.isLoading || isNoDataMsgVisible || errorMessageVisible;

        if (!this.props.isLoading) {
            loadMoreClass += ' grid-plus-load-more-loaded';
        }

        if (loadMoreShouldHide) {
            loadMoreClass += ' unset-height';
        }

        const className = (this.props.isConsoleOpen) ? 'outer-sg with-console' : 'outer-sg';
        return (
            <div className={className}>

                <div className={loadMoreClass}>
                    <div id='sg' onScroll={() => {
                        if (document.getElementById('chartToolTipContainer')) {
                            ReactDOM.unmountComponentAtNode(document.getElementById('chartToolTipContainer'));
                            const tooltip = document.getElementById('chartToolTipContainer');
                            tooltip.style.visibility = 'hidden';
                        }
                    }}>
                        <SelectableGrid
                            showEmptyRows={false}
                            columns={this.props.columns}
                            data={this.props.gridData}
                            sortColumn={this.props.sortColumnIndex}
                            rowHeight={this.ROW_HEIGHT}
                            hideHeader={false}
                            onSelect={this.selectedRowGridRefreshNoKusto}
                            onRowCollapseChanged={this.rowCollapse}
                            sortIndicators={{ asc: <ArrowUpSVG />, desc: <ArrowDownSVG /> }}
                            nestingIndicators={{
                                expand: <NestingIndicatorCollapsedSVG className='size-nesting-indicators' />,
                                collapse: <NestingIndicatorExpandedSVG className='size-nesting-indicators' />
                            }}
                            onSortColumnChanged={this.props.onSortColumnChanged}
                            onSortOrderChanged={this.props.onSortOrderChanged}

                        />
                    </div>
                    <div className={'load-more-button' + (this.props.canLoadMore ? '' : ' invisible') + ' center-flex-content'}>
                        {loadMoreButton}
                    </div>
                </div>

                <div className={'loading-state' + (this.props.isLoading ? '' : ' invisible') +
                    ' position-absolute grid-overlay click-through'}>
                    <div className={'sg-data-plus-loadmore-overlay' +
                        ' transparent-grid-overlay not-click-through'}>
                        <div className='loading-icon-container center-flex-content'>
                            {loadingIcon}
                        </div>
                    </div>
                </div>

                <div className={'no-data-msg grid-overlay' + (isNoDataMsgVisible ? '' : ' invisible') + ' not-click-through'}>
                    <div className='no-data-msg-positioner center-flex-content'>
                        <div id='no-data-msg'>
                            {DisplayStrings.NoDataMsg}
                            <a className='troubleshooting-link'
                                href='https://aka.ms/containerhealthtroubleshoot' target='_blank'>
                                {DisplayStrings.ContainerTroubleshootingLinkText}
                            </a>
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
     * Returns ConsoleViewPanel component.
     */
    private renderConsole(): JSX.Element {
        return (
            <ConsoleViewPanel
                loggingInfo={this.props.loggingInfo}
                onClose={this.props.onConsoleClose}
                liveDataProvider={this.props.liveDataProvider}
                // kubernetesProxyRegionCode={this.props.kubernetesProxyRegionCode}
            />
        );
    }

    /**
     *
     * @param row Denotes the row being collapsed/expanded in the grid.
     *  Rows can have sub-rows. Rows and their sub-rows are expressed as "r;sr;ssr"...
     * @param state Denotes whether the row is collapsed/false or expanded/true
     */
    private rowCollapse(row: string, state: boolean) {
        const splitRow = row.split(';');

        if (this.props.onCollapse) {
            this.props.onCollapse(splitRow, state);
        }

        const _that = this;
        let accessor: SGDataRow = undefined;
        let targetRowValue = '';
        splitRow.forEach((rowValue) => {
            if (!accessor) {
                targetRowValue = rowValue;
                _that.props.gridData.forEach((rowActual) => {
                    if (rowActual.value === rowValue) {
                        accessor = rowActual;
                    }
                })
            } else {
                targetRowValue = targetRowValue + `;${rowValue}`;
                if (accessor.children && accessor.children.length) {
                    accessor.children.forEach((rowActual) => {
                        if (rowActual.value === targetRowValue) {
                            accessor = rowActual;
                        }
                    });
                }
            }
        });
        accessor.expanded = !state;
        _that.setState({});
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
     * @param selectedRowIndex item which is being selected
     * @returns {void}
     */


    // this is getting selectedRowIndex in the form of a Brad string, e.g. "1.0"
    private selectedRowGridRefreshNoKusto(selectedRowIndex: any): void {
        this.props.onGridRowSelected(selectedRowIndex);
    }

    private areAllGridRowsUnselected(gridData: SGDataRow[]): boolean {
        let areAllGridRowsUnselected: boolean = true;
        for (let i = 0; i < gridData.length; i++) {
            let row = gridData[i];
            if (row.selected === true) {
                areAllGridRowsUnselected = false;
                break;
            }
            if (row.children && row.children.length) {
                areAllGridRowsUnselected = this.areAllGridRowsUnselected(row.children);
                if (areAllGridRowsUnselected === false) {
                    break;
                }
            }
        }
        return areAllGridRowsUnselected;
    }
}
