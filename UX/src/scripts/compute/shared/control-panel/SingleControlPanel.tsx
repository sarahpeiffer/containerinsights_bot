import * as React from 'react';
import { TimeData, RangeValidation, TimeValues, TimeDataAbsolute } from '@appinsights/pillscontrol-es5';
import { isRelative } from '@appinsights/pillscontrol-es5/dist/TimeUtils';

/** Local */
import { TimeUtils } from '../TimeUtils';
import * as Constants from '../../Constants';
import { WorkbooksDropdown } from './WorkbooksDropdown';
import { WorkbookTemplates } from '../WorkbookTemplates';
import { OnboardingState } from '../OnboardingUtil';

/** Shared */
import { ITelemetry } from '../../../shared/Telemetry';
import { DisplayStrings } from '../../../shared/DisplayStrings';
import { MessagingProvider } from '../../../shared/MessagingProvider';
import { TimeInterval } from '../../../shared/data-provider/TimeInterval';
import { DateTimeRange } from '../../../shared/pill-component/DateTimeRange';
import { IWorkbookCategory } from '../../../shared/workbooks/WorkbookTemplates';
import { IWorkspaceInfo } from '../../../shared/IWorkspaceInfo';

/** Styles */
import '../../../../styles/shared/ControlPanel.less';
import '../../../../styles/compute/ControlPanel.less';

interface ISingleControlPanelProps {
    selectedTime: TimeData;
    telemetry: ITelemetry;
    logPrefix: string;
    onSelectionsChanged: (selectedTime?: TimeData) => void;
    featureFlags?: StringMap<boolean>;
    workspace: IWorkspaceInfo;
    computerName: string;
    resourceId: string;
    messagingProvider: MessagingProvider;
    validateTime?: (timeData: TimeDataAbsolute) => RangeValidation;
    supportedTimes?: TimeValues[];
    disableWorkbook: boolean;
    onboardingState?: OnboardingState;
    endDateTimeUtc?: Date;
}

export class SingleControlPanel extends React.Component<ISingleControlPanelProps> {
    private _endDateTimeUtc: Date;

    constructor(props: ISingleControlPanelProps) {
        super(props);

        this.onTimeRangeChanged = this.onTimeRangeChanged.bind(this);
        
        this.calculateStartAndEndTime(props.selectedTime);
    }

    public componentWillReceiveProps(nextProps: Readonly<ISingleControlPanelProps>) {
        if (this.props.selectedTime !== nextProps.selectedTime) {
            this.calculateStartAndEndTime(nextProps.selectedTime);
        }
        if (nextProps.endDateTimeUtc) {
            this._endDateTimeUtc = nextProps.endDateTimeUtc;
        }
    }

    public render(): JSX.Element {
        if (this.props.onboardingState && this.props.onboardingState.servicemap
                && !this.props.onboardingState.servicemap.isOnboarded) {
            return null;
        }
        return <div className='control-panel maps-control-panel'>
                <div className='control-panel-scopes'>
                    <DateTimeRange initialTimeData={this.props.selectedTime}
                        supportedTimes={this.props.supportedTimes || Constants.SupportedPerfTimes}
                        timeChanged={this.onTimeRangeChanged}
                        validateTime={this.props.validateTime || TimeUtils.notMoreThanThirtyDaysApart}
                        pillLabel={DisplayStrings.TimeRangeSelectorTitle + DisplayStrings.LabelSeperator}
                        latestDateTime={this._endDateTimeUtc}
                    />
                </div>
                <div className='control-panel-commands'>
                    {!this.props.disableWorkbook && this.props.resourceId && this.renderWorkboook()}
                </div>
            </div>;
    }

    /**
     * Called when the time changes to change the state tied to a prop in
     * the underlying SingleComputeDiskGrid/SingleComputeChartPane which will re-render the query
     * for that time
     *
     * @private
     * @param  {TimeData} time
     * @return {void}
     */
    private onTimeRangeChanged(time: TimeData): void {
        this.props.onSelectionsChanged(time)

        // Log the length of time range users have selected
        const startAndEnd = TimeInterval.getStartAndEndDate(time, isRelative(time));
        this.props.telemetry.logEvent(
            `${this.props.logPrefix}.ScopeSelector.TimeRangeChanged`,
            {
                startTime: startAndEnd.start.toISOString(),
                endTime: startAndEnd.end.toISOString()
            },
            undefined
        )
    }

    private renderWorkboook(): JSX.Element {
        let workbookCategories: IWorkbookCategory[] = WorkbookTemplates.SingleVmCategoryList;
        if (this.props.featureFlags[Constants.FeatureMap.enableInsightsMetricsQuery]) {
            workbookCategories = WorkbookTemplates.SingleVmInsightsMetricsCategoryList;
        }

        return <div className='control-panel-commands'>
            <WorkbooksDropdown
                messagingProvider={this.props.messagingProvider}
                logPrefix={this.props.logPrefix}
                workspaceId={this.props.workspace && this.props.workspace.id}
                telemetry={this.props.telemetry}
                workbookCategories={workbookCategories}
                resourceId={this.props.resourceId}
            />
        </div>
    }

    private calculateStartAndEndTime(dateTime: TimeData): void {
        const startAndEnd = TimeInterval.getStartAndEndDate(dateTime, isRelative(dateTime));
        if (startAndEnd) {
            this._endDateTimeUtc = startAndEnd.end;
        }
    }
}
