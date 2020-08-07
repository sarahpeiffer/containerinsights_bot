import * as React from 'react';

import {
    AggregationOption,
    SelectableAggregationOptionSet
} from './AggregationOption';

import { ITimeInterval } from './data-provider/TimeInterval'
import { StringHelpers } from './Utilities/StringHelpers'
import { DisplayStrings, KustoGrainDisplay } from './DisplayStrings';

import '../../styles/shared/ChartHeader.less';

interface IChartHeaderWithAggregationOptionsProps {
    title: string;
    timeInterval: ITimeInterval;
    availableOptions: AggregationOption[];
    selectedOptions: AggregationOption[];
    onToggleOption: (option: AggregationOption) => void;
}

interface IChartHeaderWithAggregationOptionsState {
}

export class ChartHeaderWithAggregationOptions
    extends React.Component<IChartHeaderWithAggregationOptionsProps, IChartHeaderWithAggregationOptionsState> {

    private static getDisplayName(option: AggregationOption) {
        switch (option) {
            case AggregationOption.Min:
                return DisplayStrings.OptionMin;
            case AggregationOption.Avg:
                return DisplayStrings.OptionAvg;
            case AggregationOption.Max:
                return DisplayStrings.OptionMax;
            case AggregationOption.P05:
                return DisplayStrings.OptionP05;
            case AggregationOption.P10:
                return DisplayStrings.OptionP10;
            case AggregationOption.P50:
                return DisplayStrings.OptionP50;
            case AggregationOption.P90:
                return DisplayStrings.OptionP90;
            case AggregationOption.P95:
                return DisplayStrings.OptionP95;
            case AggregationOption.BytesReceived:
                return DisplayStrings.ConnectionBytesReceived;
            case AggregationOption.BytesSent:
                return DisplayStrings.ConnectionBytesSent;
            case AggregationOption.LinksLive:
                return DisplayStrings.ConnectionLinksLive;
            case AggregationOption.LinksEstablished:
                return DisplayStrings.ConnectionLinksEstablished;
            case AggregationOption.LinksFailed:
                return DisplayStrings.ConnectionLinksFailed;
            case AggregationOption.LinksTerminated:
                return DisplayStrings.ConnectionLinksTerminated;
            default:
                throw new Error('Unknown aggregation: ' + option);
        }
    }

    public render(): JSX.Element {
        let aggregationOptions: JSX.Element[] = [];

        const optionSet = new SelectableAggregationOptionSet(
            this.props.availableOptions,
            this.props.selectedOptions);

        if (this.props.availableOptions) {
            this.props.availableOptions.forEach((option) => {
                const classStyle = optionSet.isSelected(option) ? 'aggregation-option selected-option' : 'aggregation-option';
                const displayName = ChartHeaderWithAggregationOptions.getDisplayName(option);

                aggregationOptions.push(
                    <div className={classStyle} onClick={() => this.props.onToggleOption(option)}>
                        <span>{displayName}</span>
                    </div>
                );
            });
        }

        let grainDisplay: string = '';
        if (this.props.timeInterval) {
            const translatedTime = KustoGrainDisplay[this.props.timeInterval.getGrainKusto()];
            if (translatedTime) {
                grainDisplay = StringHelpers.replaceAll(DisplayStrings.AggregateGranularitySubtitle, '{0}', translatedTime);
            }
        }

        return (
            <div className='chart-header'>
                <div>
                    <h2>{this.props.title}</h2>
                    <div className='subTitle'>{grainDisplay}</div>
                </div>
                <div className='aggregation-options'>
                    {aggregationOptions}
                </div>
            </div>
        );
    }
}
