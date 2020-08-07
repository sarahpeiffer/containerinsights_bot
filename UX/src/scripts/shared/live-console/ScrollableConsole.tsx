/**
 * Block
 */
import * as React from 'react';
import { AutoSizer, CellMeasurerCache, CellMeasurer } from 'react-virtualized';
import { List } from 'react-virtualized';

/**
 * Local
 */
import { LogBufferManager } from '../Utilities/LogBufferManager';
import { StringHelpers } from '../Utilities/StringHelpers';

/**
 * Props for the scrollable console
 */
interface IScrollableConsoleProps {
    /** Contains all of the log items */
    logBuffer: LogBufferManager;
    /** Used to refresh rendering of scrollable console. Should be incremented whenever the logBuffer is updated. */
    versionNum: number;
    /** Whether user should scroll or not. */
    shouldScroll: boolean;
    /** The string that is used to determine whether to highlight a logItem */
    searchTerm: string;
    /** current selected index to highlight orange in the scrollable console */
    selectedIndex: number;
    /** Cache for row measurements */
    cache: CellMeasurerCache;
}

/**
 * State for the scrollable console
 */
interface IScrollableConsoleState {
}


/**
 * The class that displays the log portion of the live console
 */
export class ScrollableConsole extends React.PureComponent<IScrollableConsoleProps, IScrollableConsoleState> {
    /** Stores the reference to the list of log items, so that we can force-update when highlighting changes */
    private _list: List;

    /**
     * Binds the row renderer to this
     * @param props The IScrollableConsoleProps for the scrollable console
     */
    constructor(props) {
        super(props);
        this.rowRenderer = this.rowRenderer.bind(this);
    }

    /**
     * Render the scrollable console
     */
    public render(): JSX.Element {
        return (
            <div className='scrollableConsole' id='scrollableConsole' tabIndex={0}>
                {this.generateLogList()}
            </div>
        );
    }

    /**
     * Force updates the list view when the search term changes
     * @param prevProps The previous props 
     * @param prevState The previous state
     */
    public componentDidUpdate(prevProps: IScrollableConsoleProps, prevState: IScrollableConsoleState): void {
        if (this.props.searchTerm !== prevProps.searchTerm) {
            this._list.forceUpdateGrid();
        }
    }

    /**
     * Renders a log row. Used for log list generation in react-virtualized.
     */
    private rowRenderer({ index, isScrolling, key, parent, style }): JSX.Element {
        return (
            <CellMeasurer
                cache={this.props.cache}
                columnIndex={0}
                key={key}
                parent={parent}
                rowIndex={index}
            >
                {({ measure }) => this.generateLogItem(measure, index, key, style)}
            </CellMeasurer>
        )
    }

    /**
     * Returns log item div.
     * @param measure Function that measures the div once loaded
     * @param index Index of the log item displayed in this div
     * @param key key of div
     * @param style style of div
     */
    private generateLogItem(measure, index, key, style): JSX.Element {
        const logClass = 'logItem';
        const logId = `logItem-${index}`;
        const logItem = this.props.logBuffer.get(index);
        if (!logItem || !logItem.isVisible) {
            //return empty div since log item is not valid / not visible
            return <div
                key={key}
                style={style}
                className={logClass}
                id={logId}
                onLoad={measure}
            >
            </div>
        } else {
            return <div
                key={key}
                style={style}
                className={logClass}
                id={logId}
                onLoad={measure}
                role='row'
            >
                <span className='timeStamp'>
                    {StringHelpers.isNullOrEmpty(logItem.elapsedTime) ? logItem.timeStamp : logItem.elapsedTime}
                </span>
                {this.generateHighlightedText(logItem.logData, index)}
            </div>
        }
    }

    /**
     * Returns span that either contains highlighted or non-highlighted logData,
     * depending on what the searchTerm is.
     */
    private generateHighlightedText(logData: string, index: number): JSX.Element {
        const shouldHighlight: boolean = this.props.searchTerm !== ''
            && logData.toLowerCase().indexOf(this.props.searchTerm.toLowerCase()) > -1;

        const className: string = shouldHighlight ?
            index === this.props.selectedIndex ?
                'logData orangeHighlight'
                : 'logData highlighted'
            : 'logData ';

        return (
            <span className={className}>
                {logData}
            </span>
        );
    }
    /**
     * Uses react-virtualized to generate a virtual list of logs.
     */
    private generateLogList(): JSX.Element {
        let listGenerator;
        if (this.props.shouldScroll || this.props.logBuffer.isEmpty()) {
            listGenerator = ({ width, height }): React.ReactNode => {
                return (<List
                    height={height}
                    deferredMeasurementCache={this.props.cache}
                    rowHeight={this.props.cache.rowHeight}
                    rowRenderer={this.rowRenderer}
                    width={width}
                    rowCount={this.props.logBuffer.size()}
                    scrollToIndex={this.props.logBuffer.size() - 1}
                    ref={(list) => this._list = list}
                />)
            };
        } else {
            listGenerator = ({ width, height }): React.ReactNode => {
                return (<List
                    height={height}
                    deferredMeasurementCache={this.props.cache}
                    rowHeight={this.props.cache.rowHeight}
                    rowRenderer={this.rowRenderer}
                    width={width}
                    rowCount={this.props.logBuffer.size()}
                    scrollToIndex={this.props.selectedIndex !== undefined ? this.props.selectedIndex : undefined}
                    ref={(list) => this._list = list}
                />)
            };
        }
        return (
            <AutoSizer
                onResize={({ width, height }) => {
                    //must clear the cache due to responsive design
                    this.props.cache.clearAll();
                }}
            >
                {listGenerator}
            </AutoSizer>
        );
    }
}
