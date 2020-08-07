import * as React from 'react';

import { DisplayStrings, KustoGrainDisplay } from './DisplayStrings';
import { ITimeInterval } from './data-provider/TimeInterval'
import { StringHelpers } from './Utilities/StringHelpers'

import '../../styles/shared/ChartHeader.less';

interface IChartHeaderWithToggleOptionProps {
    title: string;
    timeInterval: ITimeInterval;

    onOptionToggle: (event: any) => void;
    toggleEnabled: boolean;
}

export class ChartHeaderWithToggleOption
    extends React.Component<IChartHeaderWithToggleOptionProps, any> {

    public render(): JSX.Element {
        let aggregationOptionsClass: string = 'toggle-options';

        const showClientOtherErrorsBox: JSX.Element = <span>
            <input type='checkbox' id='ignoreClientOtherErrors' checked={this.props.toggleEnabled}
                onChange={this.props.onOptionToggle.bind(this)} />
            <label htmlFor='ignoreClientOtherErrors'>{DisplayStrings.ShowClientOtherErrorMsg}</label>
        </span>;

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

                <div className={aggregationOptionsClass}>
                    {showClientOtherErrorsBox}
                </div>
            </div>
        );
    }
}
