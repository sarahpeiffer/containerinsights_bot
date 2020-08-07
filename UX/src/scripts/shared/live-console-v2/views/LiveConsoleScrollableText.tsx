
import * as React from 'react';

import '../../../../styles/container/LiveConsoleV2/LiveConsoleScrollableTextView.less'

import { AutoSizer, List, CellMeasurer } from 'react-virtualized';
import { StringHelpers } from '../../Utilities/StringHelpers';
import { LiveConsoleViewModel } from '../viewmodels/LiveConsoleViewModel';

interface ILiveConsoleScrollableTextViewProps {
    parentContext: LiveConsoleViewModel;
}

/**
 * The state of the console view panel
 */
interface ILiveConsoleScrollableTextViewState {
    /** context (view model) */
    context: LiveConsoleViewModel;
}

/**
 * The container class for the live console
 */
export class LiveConsoleScrollableTextView extends React.Component<ILiveConsoleScrollableTextViewProps,
    ILiveConsoleScrollableTextViewState> {

    

    /**
     * initializes a new instance of the class
     * @param props component properties
     */
    constructor(props: ILiveConsoleScrollableTextViewProps) {
        super(props);
        this.rowRenderer = this.rowRenderer.bind(this);

        this.state = {
            context: props.parentContext
        };
    }

    /**
     * react callback invoked to render component
     */
    public render(): JSX.Element {
        return (
            <div className='scrollable-console-root'>
                {this.renderLogList()}
            </div>
        );
    }

    private generateHighlightedText(logData: string, index: number): JSX.Element {
        const searchTerm: string = this.state.context.searchTerm;
        const shouldHighlight: boolean = searchTerm !== undefined
            && searchTerm !== ''
            && logData.toLowerCase().indexOf(searchTerm) > -1;

        let targetHighlight = -1;
        if (this.state.context.selectedIndex !== -1) {
            targetHighlight = this.state.context.matchingIndicies[this.state.context.selectedIndex];
        }

        const className: string = shouldHighlight ?
            index === targetHighlight ?
                'logData orangeHighlight'
                : 'logData highlighted'
            : 'logData ';

        return (
            <span className={className} aria-label={logData}>
                {logData}
            </span>
        );
    }

    private generateLogItem(measure, index, key, style): JSX.Element {
        const logClass = 'logItem';
        const logId = `logItem-${index}`;
        const logItem = this.state.context.getEventsBuffer().get(index);
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

    private rowRenderer({ index, isScrolling, key, parent, style }): JSX.Element {
        return (
            <CellMeasurer
                // cache={this.state.context.getEventsCache()}
                cache={this.state.context.eventsCache}
                columnIndex={0}
                key={key}
                parent={parent}
                rowIndex={index}
            >
                {({ measure }) => this.generateLogItem(measure, index, key, style)}
            </CellMeasurer>
        )
    }

    private renderLogList(): JSX.Element {
        const matchingIndex = this.state.context.matchingIndicies;

        const listGenerator = ({ width, height }): React.ReactNode => {
            // height = 500;
            return (<List
                height={height}
                rowHeight={this.state.context.eventsCache.rowHeight}
                rowRenderer={this.rowRenderer}
                width={width}
                rowCount={this.state.context.getEventsBuffer().size()}
                scrollToIndex={
                    this.state.context.selectedIndex === -1
                        ? this.state.context.getEventsBuffer().size() - 1
                        : matchingIndex[this.state.context.selectedIndex]
                }
                ref={(list) => { if (list) { list.forceUpdateGrid(); } }}
            />)
        };
        
        return (
            <AutoSizer
                onResize={({ width, height }) => {
                    console.log('resize');
                }}
            >
                {listGenerator}
            </AutoSizer>
        );
    }
}
