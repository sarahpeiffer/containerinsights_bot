import * as React from 'react';
import { Promise } from 'es6-promise';
import * as moment from 'moment';

import {
    TimePillConfig, TimePillProps,
    TimeData, TimeValues, PillContainer, PillContainerProps, IPillContentProvider, RangeValidation, TimeDataAbsolute, TimeDataRelative
} from '@appinsights/pillscontrol-es5';
import { TimePill } from '@appinsights/pillscontrol-es5/dist/TimePill';

import '../../../styles/shared/DateTimeRange.less'
import { DisplayStrings } from '../DisplayStrings';

export interface DateTimeRangeProps {
    latestDateTime?: Date;
    timeChanged: (newTime: TimeData) => void;
    initialTimeData: TimeData;
    supportedTimes: TimeValues[];
    pillLabel?: string;
    validateTime?(timeData: TimeDataAbsolute): RangeValidation;
}

export interface DateTimeRangeState {
    timeData: TimeData;
}

function getRelativeDateTime(timeData: TimeDataRelative, latestDateTime: Date): JSX.Element {
    if (timeData.relative && latestDateTime) {
        const asDateTime: string = `${DisplayStrings.AsOf} ${moment(latestDateTime).format('D MMM HH:mm')}`;
        return <span><b>&nbsp;{asDateTime}</b></span>;
    } else {
        return null;
    }
}

function getTimeContentProvider(contentProps: TimePillConfig, latestDateTime: Date): IPillContentProvider<TimePillConfig> {
    const pillContent: IPillContentProvider<TimePillConfig> = {
        createContent: (
            editMode: boolean,
            props: TimePillProps,
            updateConfiguredStatus: (configured: boolean) => void,
            updateAriaLabel: (newLabel: string) => void,
            editingComplete: () => void,
            removeSelf?: () => void): Promise<JSX.Element> => {
            const isRelativeTime: boolean = (props.timeData as TimeDataRelative).relative !== undefined;
            
            return new Promise((resolve) => { resolve(); }).then(() => {
                return <> 
                    <TimePill
                        editMode={editMode}
                        timeData={props.timeData}
                        supportedTimes={props.supportedTimes}
                        timeGrainOptions={props.timeGrainOptions}
                        disableZoneSelection={props.disableZoneSelection}
                        onTimeUpdated={props.onTimeUpdated}
                        // localization={props.localization}
                        displayAs={props.displayAs}
                        customTimeValidator={props.customTimeValidator}
                        updateConfiguredStatus={updateConfiguredStatus}
                        updateAriaLabel={updateAriaLabel}
                        editingComplete={editingComplete}
                    />
                    {isRelativeTime && getRelativeDateTime(props.timeData as TimeDataRelative, latestDateTime)}
                </>;
            });
        },
        contentProps: contentProps,
    };
    return pillContent;
}

/**
 * Minimalistic sample usage of PillContainer for a TimePill that does not use flux's store, actions, etc.
 * @export
 * @class DateTimeRange
 * @extends React.Component<DateTimeRangeProps, DateTimeRangeState>
 */
export class DateTimeRange extends React.Component<DateTimeRangeProps, DateTimeRangeState> {
    constructor(props) {
        super(props);

        this.state = {
            timeData: this.props.initialTimeData
        };
    }

    public render() {
        const containerId = 'customTimeContainer';
        const pillId = 'customTimeMap';

        const timeProps: TimePillConfig = {
            onTimeUpdated: (timeData: TimeData) => {
                this.setState({ timeData: timeData }, () => { this.props.timeChanged(timeData); })
            },
            timeData: this.state.timeData,
            supportedTimes: this.props.supportedTimes,
            timeGrainOptions: {
                disableTimeGrainSelection: true
            },
            disableZoneSelection: true,
            customTimeValidator: this.props.validateTime
        }

        const pillContainerProps: PillContainerProps = {
            containerId: containerId,
            pills: [
                {
                    pillId: pillId,
                    pillContent: getTimeContentProvider(timeProps, this.props.latestDateTime),
                    unRemovable: true,
                    icon: null,
                    pillLabel: this.props.pillLabel
                }
            ],
            addButtonStatus: 2,
            addIcon: null,
            addLabel: null,
            alwaysShowLabel: false,
            className: 'date-time-range',
            onRemove: undefined,
            onAdd: undefined
        }

        return (<div className='pills-sample-app-root'><PillContainer  {...pillContainerProps} /></div>);
    }
}
