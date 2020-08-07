import * as React from 'react';
import * as ReactDOM from 'react-dom'

import * as D3 from 'd3'

import { StringMap } from '../shared/StringMap';
import { DisplayStrings } from '../shared/DisplayStrings';
import { ITimeInterval } from '../shared/data-provider/TimeInterval';
import { DateReferencableSeriesData } from '../shared/DateReferencableSeriesData';
import { AggregationOption } from '../shared/AggregationOption';
import { IMultiSeriesLineChartTooltip } from '../shared/IMultiSeriesLineChartTooltip'
import { ErrorType } from './ErrorType'

import { IAiChartInteractionsSeriesData } from '@appinsights/aichartcore';

export class ErrorDataItem {
    errorType: string;
    errorsCount: number;
}

export class ErrorDataComplete {
    totalCountOfErrors: number;
    errorCategoryCounts: ErrorDataItem[];
}

class IToolTipState {
    title: string;
    errorData: StringMap<ErrorDataComplete>;
}

class IToolTipProps {
    interactionsData: IAiChartInteractionsSeriesData;
    timeInterval: ITimeInterval;
    data: DateReferencableSeriesData;
    visibleErrorTypes: ErrorType[];
}

class StorageChartPaneToolTipBody extends React.Component<IToolTipProps, IToolTipState> {
    constructor(props?: any) {
        super(props);

        this.state = {
            title: DisplayStrings.NoDataMsg,
            errorData: {}
        };
    }

    public componentWillReceiveProps(nextProps: Readonly<IToolTipProps>, nextContext: any): void {
        this.setupBody();
    }

    render(): JSX.Element {
        if (!this.state || !this.state.title) {
            return <div></div>
        }

        let errorList: JSX.Element[] = [];

        this.props.visibleErrorTypes.forEach((option) => {
            errorList.push(this._renderItem(option));
        })

        return <div className='storage-chart-errors-tooltip-body'>
            <div className='storage-chart-errors-tooltip-head'>{this.state.title}</div>
            <div>
                {errorList}
            </div>
        </div>;
    }

    private setTitleState(title: string) {
        this.setState({ title });
    }

    private setErrorsBodyState(errorData: StringMap<ErrorDataComplete>) {
        this.setState({ errorData });
    }

    private setErrorsBodyStateNoData(title: string) {
        this.setTitleState(title);
        this.setErrorsBodyState({});
    }

    private setupBody() {
        if (!this.props.interactionsData || !this.props.interactionsData.stackedDataIndex) {
            // bbax: the body may contain data from previous states... clear it out
            this.setErrorsBodyStateNoData(DisplayStrings.NoDataMsg);
        } else if (!this.props.visibleErrorTypes ||
            !this.props.visibleErrorTypes.length ||
            this.props.visibleErrorTypes.length < 1) {
                this.setErrorsBodyStateNoData(DisplayStrings.NoDataMsg);
        } else {
            const keyCasted = this.props.interactionsData.stackedDataIndex.x as Date;
            if (!keyCasted) {
                throw 'Unexpected data in interaction data from Time Series chart!';
            }

            let xDateRealMousePosition = this.props.interactionsData.x as Date;

            // bbax: if something goes wrong at least we can display the "DOT" position
            if (!xDateRealMousePosition) {
                xDateRealMousePosition = keyCasted;
            }

            // bbax: bug: if the user starts interacting with a loading graph with tooltips enabled
            if (!this.props.timeInterval) {
                console.warn('WARN: Tooltip body loaded without timeInveral');
                return;
            }

            const startTime = this.props.timeInterval.getBestGranularStartDate().getTime();
            const endTime = this.props.timeInterval.getBestGranularEndDate().getTime();

            const chartRangeInDays = Math.round((endTime - startTime) / 1000 * 3600 * 24);

            const formatter = D3.time.format(this.timeFormat(chartRangeInDays));
            const keyTitle = formatter(xDateRealMousePosition);
            const key = keyCasted.toISOString();

            const errorsData: DateReferencableSeriesData = this.props.data;

            if (!errorsData || !errorsData.referencableData) {
                this.setErrorsBodyStateNoData(DisplayStrings.NoDataMsg);
            } else {
                if (key in errorsData.referencableData) {
                    this.setTitleState(keyTitle);
                    this.setErrorsBodyState(errorsData.referencableData[key]);
                } else {
                    this.setErrorsBodyStateNoData(DisplayStrings.NoDataItemMsg);
                }
            }
        }
    }

    private _renderItem(type: ErrorType): JSX.Element {
        if (this.state.errorData === undefined ||
            !this.state.errorData[type]) {
            return null;
        }

        let children = null;
        if (this.state.errorData[type].errorCategoryCounts ||
            this.state.errorData[type].errorCategoryCounts.length > 0) {
            children = this.state.errorData[type].errorCategoryCounts.sort((a, b) => {
                return b.errorsCount - a.errorsCount;
            }).map((child) =>
                <div className='storage-chart-errors-tooltip-item-body'>{child.errorsCount} {child.errorType}</div>
                );
        }
        return <div className='storage-chart-errors-tooltip-item-root'>
            <span className='storage-chart-errors-tooltip-item-head'>
                {this.state.errorData[type].totalCountOfErrors}
                {this.getProperHeader(type, this.state.errorData[type].totalCountOfErrors)}
            </span>
            {children}
        </div>
    };

    private getProperHeader(type: ErrorType, count: number): string {
        switch (type) {
            case ErrorType.Client:
            case ErrorType.ClientNoOther:
                if (count > 1) {
                    return DisplayStrings.ErrorToolTipClientErrorPlural;
                } else {
                    return DisplayStrings.ErrorToolTipClientError;
                }
            case ErrorType.Server:
                if (count > 1) {
                    return DisplayStrings.ErrorToolTipServerErrorPlural;
                } else {
                    return DisplayStrings.ErrorToolTipServerError;
                }
            case ErrorType.Network:
                if (count > 1) {
                    return DisplayStrings.ErrorToolTipNetworkErrorPlural;
                } else {
                    return DisplayStrings.ErrorToolTipNetworkError;
                }

        }
        return DisplayStrings.ErrorToolTipUnknownErrorType;
    }

    // bbax: EXTERNAL: this is the formatting used in the corresponding MELite
    // package for determining the format of the date on the legend hover
    private timeFormat(days: number): string {
        return days > 3 ? '%b %d %I:%M %p' : '%a %d %I:%M %p';
    }
}

export class StorageErrorToolTipWrapper implements IMultiSeriesLineChartTooltip {
    private timeInterval: ITimeInterval;
    private interactionsData: IAiChartInteractionsSeriesData;
    private visibleErrors: ErrorType[];
    private data: DateReferencableSeriesData;
    constructor(data: DateReferencableSeriesData, timeInterval: ITimeInterval) {
        this.interactionsData = undefined;
        this.visibleErrors = undefined;
        this.timeInterval = timeInterval;
        this.data = data;
    }

    public static BodyDivId(): string {
        return 'tooltip-root-errors';
    }

    public dispose() {
        ReactDOM.unmountComponentAtNode(document.getElementById(StorageErrorToolTipWrapper.BodyDivId()));
    }

    public setInteractionsData(interactionsData: IAiChartInteractionsSeriesData) {
        this.interactionsData = interactionsData;
        this.render();
    }

    public setPrimaryState(data: DateReferencableSeriesData, timeInterval: ITimeInterval, visibleAggregations: AggregationOption[]) {
        this.data = data;
        this.timeInterval = timeInterval;
        this.visibleErrors = this.getErrorTypesFromSeriesOptions(visibleAggregations);
        this.render();
    }

    /**
     * Define a div that needs to exist somewhere in the DOM for us to successfully render the tooltip
     * @returns string the definition of a div we require to exist to render this tooltip to
     */
    public getBodyDivDefinition(): string {
        return '<div id=\"' + StorageErrorToolTipWrapper.BodyDivId() + '\"></div>';
    }

    /**
     * map a list of aggregrations (likely 'visible') to a list of error types so we can
     * reference the error hash table
     * @param seriesOptions aggregrations we want to map to error types (if available)
     * @returns ErrorType[] list of errors corresponding to the aggregrations
     */
    private getErrorTypesFromSeriesOptions(seriesOptions: AggregationOption[]): ErrorType[] {
        let errors: ErrorType[] = [];

        seriesOptions.forEach((option) => {
            switch (option) {
                case AggregationOption.Client:
                    errors.push(ErrorType.Client);
                    break;
                case AggregationOption.ClientNoOther:
                    errors.push(ErrorType.ClientNoOther);
                    break;
                case AggregationOption.Network:
                    errors.push(ErrorType.Network);
                    break;
                case AggregationOption.Server:
                    errors.push(ErrorType.Server);
                    break;
                default:
                    console.error('invalid type for the error mapping!');
                    break;
            }
        });
        return errors;
    }

    private render() {
        ReactDOM.render(<StorageChartPaneToolTipBody data={this.data}
            timeInterval={this.timeInterval} interactionsData={this.interactionsData} visibleErrorTypes={this.visibleErrors} />,
            document.getElementById(StorageErrorToolTipWrapper.BodyDivId()));
    }
}
