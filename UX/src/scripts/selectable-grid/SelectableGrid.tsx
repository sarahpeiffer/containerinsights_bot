import * as React from 'react';
import { SGColumn, SGDataRow, SGCellProps, SGSortOrder } from './SelectableGridData';
import { AutoSizer, List } from 'react-virtualized';

import './SelectableGrid.css';

export interface SelectableGridProps {
    columns: SGColumn[];
    data: SGDataRow[];
    fixedRow?: SGDataRow;
    sortColumn: number;
    rowHeight: number;
    sortIndicators?: { asc?: JSX.Element, desc?: JSX.Element };
    hideHeader?: boolean;
    rowColor?: (rowValue: SGDataRow) => string;
    scrollToRowWithValue?: any;
    onSelect: (rowValue: any) => void;
    onSortColumnChanged?: (sortColumn: number) => void;
    onSortOrderChanged?: (sortColumn: number, sortOrder: SGSortOrder) => void;
}

export interface SelectableGridState {
    scrollbarWidth: number;
    gridBodyHeight: number;
}

class Utilities {
    public static deepEqual(objectA: any, objectB: any, caseInsensitive = false, excludedProps: string[] = []): boolean {
        if (!objectA && !objectB) {
            return true;
        }
        if (!objectA || !objectB) {
            return false;
        }
        if (objectA === objectB) { // Triple equals is always deep equal
            return true;
        } else if (typeof objectA !== typeof objectB) { // Types must match
            return false;
        } else if (objectA instanceof Date && objectB instanceof Date) { // Date objects should compare by date they hold
            return objectA.getTime() === objectB.getTime();
        } else if (objectA instanceof Date || objectB instanceof Date) { // Date has typeof object. Ensure no mismatch
            return false;
        } else if (typeof objectA === 'object') { // Compare by same number and value of properties (with case insensitive overrides)
            let keysA = Object.keys(objectA);
            let keysB = Object.keys(objectB);
            let keysBCaseInsensitiveMap = {};

            if (keysA.length !== keysB.length) {
                return false;
            } else {
                if (caseInsensitive) {
                    for (let key of keysB) {
                        keysBCaseInsensitiveMap[key.toLowerCase()] = key;
                    }
                }

                for (let i = 0; i < keysA.length; i++) {
                    let s1Key = keysA[i];
                    let s2Key = caseInsensitive ? keysBCaseInsensitiveMap[s1Key.toLowerCase()] : s1Key;
                    if (!excludedProps.filter(t => t === s2Key).length &&
                        (!s2Key || !Utilities.deepEqual(objectA[s1Key], objectB[s2Key], caseInsensitive))) {
                        return false;
                    }
                }
                return true;
            }
        } else if (caseInsensitive && typeof objectA === 'string') { // Compare strings case insensitively if necessary
            return objectA.toLowerCase() === objectB.toLowerCase();
        }
        return false;
    }
}

export class SelectableGrid extends React.Component<SelectableGridProps, SelectableGridState> {
    private _maxSort: { [id: number]: number } = {};

    constructor(props?: SelectableGridProps, context?: any) {
        super(props, context);

        this.state = {
            scrollbarWidth: undefined,
            gridBodyHeight: undefined,
        };
    }

    componentDidMount() {
        // Calculate width of scrollbar (to offset header columns)
        let elm = document.createElement('div');
        elm.style.width = elm.style.height = '100px';
        elm.style.overflow = 'scroll';
        elm.style.position = 'absolute';
        elm.style.left = '-100%';
        document.body.appendChild(elm);
        this.setState((prevState) => {
            // DO NOT MODIFY prevState... it is UNSAFE!
            document.body.removeChild(elm);
            return { scrollbarWidth: elm.offsetWidth - elm.clientWidth };
        });
    };

    onRowHeaderClicked(column: number) {
        if (!this.props.columns[column].sortable) {
            return;
        }

        if (column === this.props.sortColumn) {
            let currentOrder = this.props.columns[column].sortOrder;
            this.props.onSortOrderChanged(column, currentOrder === SGSortOrder.Descending ? SGSortOrder.Ascending : SGSortOrder.Descending);
        } else {
            this.props.onSortColumnChanged(column);
        }
    }

    /** Generates the HTML for the grid header (row with columns bearing the title of each column in the dataset) */
    getHeader(scrollbarWidth: number) {
        let keyCounter = 0;
        let headerPadding = `${scrollbarWidth}px`;
        let entries = this.props.columns.map((column, index) => {
            let flexWidth = column.width === 0 ? '1 1 0px' : `0 1 ${column.width}px`;
            let isSelected = this.props.sortColumn === index;
            let sortOrder = column.sortOrder === SGSortOrder.Ascending ? 'asc' : 'desc';
            let sortClass = 'sg-sorted-' + sortOrder;
            let sortElm = isSelected && this.props.sortIndicators && this.props.sortIndicators[sortOrder];
            let headerPlugin = column.headerPlugin && column.headerPlugin({ isSelected: isSelected, sortOrder: column.sortOrder });
            return <div className={'sg-col ' + sortClass} key={'sg-head-' + keyCounter++} style={{ flex: flexWidth }}
                data-sgselected={isSelected} onClick={() => this.onRowHeaderClicked(index)}>
                <div className='sg-headerplugin'>{headerPlugin}</div>
                <div className='sg-text'>{column.name}</div>
                <div className='sg-sortindicator'>{sortElm}</div>
            </div>;
        });
        return <div className='sg-head sg-row' style={{ paddingRight: headerPadding }}>{entries}</div>;
    }

    /** Generates the HTML for a given DataRow (column divs with the appropriate cell model for each, populated with data) */
    getRow(row: SGDataRow, rowKeyIndex: number, depth: number) {

        let maxValue: number = 0;
        let IsMaxValuedCell: boolean = false;

        let cols = row.columnData.map((data, columnIndex) => {
            let props: SGCellProps = {
                value: data,
                rowSelected: row.selected
            };

            if (columnIndex === 0) {

                IsMaxValuedCell = false;

                if (data && data.maxValue) {
                    maxValue = data.maxValue;
                    IsMaxValuedCell = true;
                }
            }

            if (IsMaxValuedCell) {
                props.maxValue = maxValue;
            }

            let key = rowKeyIndex + '-sgcol-' + columnIndex;
            let column = this.props.columns[columnIndex];
            let flexWidth = column.width === 0 ? '1 1 0px' : `0 1 ${column.width}px`;
            let className = 'sg-col' + (column.showSortBar ? ' sg-barbacked' : '');

            if (!column.showSortBar) {
                return <div className={className} key={key} style={{ flex: flexWidth }}>
                    {column.cell(props)}
                </div>;
            } else {
                let maxVal = this._maxSort[columnIndex];
                let barWidth = 80 * (row.columnData[columnIndex] / maxVal);
                let style = { width: `calc(${barWidth}% - 1px)`, backgroundColor: column.sortBarColor };
                return <div className={className} key={key} style={{ flex: flexWidth }}>
                    <div className='sg-bb-colvm'>{column.cell(props)}</div>
                    <div className='sg-bb-bar' style={style}></div>
                </div>;
            }
        });

        let className = 'sg-row' + (row === this.props.fixedRow ? ' sg-fixedrow' : '');
        if (this.props.rowColor) {
            let colorCol = <div className='sg-row-colorindicator'
                style={{ backgroundColor: this.props.rowColor(row) }} />
            cols.unshift(colorCol);
        }
        return <div className={className} key={'sgrow-' + rowKeyIndex} data-sgselected={row.selected}
            data-sgdepth={depth} data-sgchildren={!!row.children} data-sgexpanded={row.expanded}
            onClick={() => this.props.onSelect(row.value)}>
            {cols}
        </div>;
    }

    /** Converts the DataRow tree structure to a flat array by applying a supplied function to each row and traversing depth-first */
    flattenRows<T>(rows: SGDataRow[], fn: (row: SGDataRow, depth: number) => T): T[] {
        if (!this.props.columns || this.props.columns.length === 0) {
            return [];
        }

        let sortCol = this.props.sortColumn;
        let ret: T[] = [];
        let sortFunc = this.getSortFuncForColumn(sortCol, true);

        rows.sort((a, b) => sortFunc(a.columnData[sortCol], b.columnData[sortCol]));
        rows.forEach((row) => {
            row.traverse(
                (innerRow, depth) => {
                    ret.push(fn(innerRow, depth));
                },
                true,
                this.props.sortColumn,
                sortFunc);
        });

        return ret;
    }

    getSortFuncForColumn(column: number, followSortOrder: boolean) {
        let sortDir = this.props.columns[column].sortOrder;
        let sortFunc = this.props.columns[column].sortFunc || ((a, b) => (a === b) ? 0 : a < b ? -1 : 1);
        if (followSortOrder && sortDir === SGSortOrder.Descending) {
            let origSortFunc = sortFunc;
            sortFunc = (a, b) => origSortFunc(a, b) * -1;
        }
        return sortFunc;
    }

    /** Gets row data for use in rendering */
    getRows() {
        let rows = this.flattenRows(this.props.data, (row, depth) => { return { row: row, depth: depth }; });
        if (this.props.fixedRow) {
            rows = [{ row: this.props.fixedRow, depth: 0 }].concat(rows);
        }

        // Get sort fns
        let sortFns: { [id: number]: (v1: any, v2: any) => number } = {};
        for (let i = 0; i < this.props.columns.length; i++) {
            sortFns[i] = this.getSortFuncForColumn(i, false);
        }

        // Calculate the max value of root nodes in all columns 
        this._maxSort = {};
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            if (row.depth === 0) {
                for (let col = 0; col < row.row.columnData.length; col++) {
                    let data = row.row.columnData[col];
                    let maxData = this._maxSort[col];
                    if (maxData === undefined || sortFns[col](data, maxData) > 0) {
                        this._maxSort[col] = data;
                    }
                }
            }
        }

        return rows;
    }

    onGridResize(height: number) {
        this.setState({ gridBodyHeight: height });
    }

    render() {
        let rows = this.getRows();
        let scrollIndex = undefined;

        if (typeof this.props.scrollToRowWithValue !== 'undefined') {
            for (let i = 0; i < rows.length; i++) {
                if (Utilities.deepEqual(rows[i].row.value, this.props.scrollToRowWithValue)) {
                    // Padding is to place the selected row in the middle of the grid.
                    // Without it, the grid is scrolled to make the selected row the last visible row
                    let padding = this.state ? (Math.round(this.state.gridBodyHeight / this.props.rowHeight / 2) + 1) : 0;
                    scrollIndex = Math.min(rows.length - 1, i + padding);
                    break;
                }
            }
        }

        let showingScrollbar = this.state ? (this.state.gridBodyHeight < this.props.rowHeight * rows.length) : false;
        return <div className='selectable-grid'>
            {!this.props.hideHeader ? this.getHeader(showingScrollbar ? this.state.scrollbarWidth : 0) : null}
            <div className={'sg-body' + (this.props.hideHeader ? ' sg-noheader' : '')}>
                <AutoSizer onResize={({ height }) => this.onGridResize(height)}>
                    {({ width, height }) => (
                        <List
                            style={{ outline: 'none' }}
                            height={height}
                            overscanRowCount={Math.ceil(height / this.props.rowHeight)}
                            noRowsRenderer={() => <div />}
                            rowCount={rows.length}
                            rowHeight={this.props.rowHeight}
                            rowRenderer={({ index, style, key }) => {
                                return <div style={style} key={key}>
                                    {this.getRow(rows[index].row, index, rows[index].depth)}
                                </div>;
                            }}
                            scrollToIndex={scrollIndex}
                            width={width} />
                    )}
                </AutoSizer>
            </div>
        </div>;
    }
};
