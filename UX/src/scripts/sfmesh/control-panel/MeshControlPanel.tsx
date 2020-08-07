import * as React from 'react';
import * as moment from 'moment';
import * as Strings from '../../shared/DisplayStrings';

import update = require('immutability-helper');
import { Promise } from 'es6-promise';
import { TimeData } from '@appinsights/pillscontrol-es5';
import { isRelative } from '@appinsights/pillscontrol-es5/dist/TimeUtils';

/**
 * shared
 */
import { IWorkspaceInfo } from '../../shared/IWorkspaceInfo';
import { WorkspaceListManager } from '../../shared/WorkspaceListManager';
import { MessagingProvider } from '../../shared/MessagingProvider';
import { ConsoleError } from '../../shared/svg/ConsoleError'
import {
    VariablePillContainer,
    IDimensionOption,
} from '../../shared/pill-component/VariablePillContainer';
import { ITelemetry } from '../../shared/Telemetry';
import { RefreshButton } from '../../shared/RefreshButton';

/**
 * local
 */
import { IFilterRecord } from '../../container/control-panel/PillProvider';
import {
    IContainerControlPanelSelections,
    timeControlSupportedTimeSelections
} from '../../container/control-panel/ContainerControlPanelSelections';

/**
 * stylesheets
 */
import '../../../styles/shared/ControlPanel.less';

/** svg */
import { BlueLoadingDots, BlueLoadingDotsSize } from '../../shared/blue-loading-dots';

/**
 * Control panel properties for in-blade experience
 */
export interface IInBladeContainerControlPanelProps {
    /**
     * Workspace information
     */
    workspace: IWorkspaceInfo;

    messagingProvider: MessagingProvider;

    /**
     * In-blade cluster name
     */
    clusterName: string;
}

// TODO: vitalyf: I think the complexity of understanding concepts
//                of workspace lazy loading, sequence numbers, etc
//                should be moved out of this component and up to
//                the main page. Control panel should only be dealing
//                with drop downs, controlling values and selections
//                Leaving it as is for now and adding in-blade options
export interface IStandAloneContainerControlPanelProps {
    workspaceManager: WorkspaceListManager;
    messagingProvider: MessagingProvider;
    sequenceNumber: Number;
}

/** List of possible pill dimensions */
export enum PillDimension {
    Node = 'Node',
    Service = 'Service',
    Namespace = 'Namespace',
    Workspace = 'Workspace',
    Cluster = 'Cluster',
    TimeRange = 'TimeRange'
}

/**
 * Control panel properties
 */
interface IMeshControlPanelProps {
    /**
     * In blade or stand-alone mode rules/props for populating controls of the panel
     */
    options: IInBladeContainerControlPanelProps | IStandAloneContainerControlPanelProps;

    /**
     * Callback to invoke when control panel selections changes
     */
    onSelectionsChanged: (selections: IContainerControlPanelSelections) => void;
    idealGrain: number;

    /** pill selections provided on navigation to CI from another page */
    pillSelections: IContainerControlPanelSelections

    /** true if the tab content is loading */
    isTabContentLoading: boolean;
    /** telemetry engine */
    telemetry: ITelemetry;
    /** telmetry area info */
    telemetryArea: string;
}

interface IMeshControlPanelState {
    selections: IContainerControlPanelSelections;

    pillData: IFilterRecord[];
    dateTimeRangeTimeData: TimeData;

    pillDataLoading: boolean;
}

export class MeshControlPanel extends React.Component<IMeshControlPanelProps, IMeshControlPanelState> {

    constructor(props: any) {
        super(props);

        this.onTimeRangeChanged = this.onTimeRangeChanged.bind(this);

        this.refreshOnClickHandler = this.refreshOnClickHandler.bind(this);

        const inBladeOptions = this.props.options as IInBladeContainerControlPanelProps;

        const selectedWorkspace: IWorkspaceInfo = inBladeOptions.workspace;

        const selectedClusterName: string = inBladeOptions.clusterName;

        const {
            isTimeRelative,
            startDateTimeUtc,
            endDateTimeUtc,
            timeRangeSeconds,
            nameSpace,
            serviceName,
            hostName,
            nodePool,
            controllerKind,
            controllerName
        } = this.props.pillSelections;

        const dateTimeRangeTimeData = isTimeRelative
            ? { options: {}, relative: { duration: timeRangeSeconds * 1000 } } // TimePill expects duration in ms
            : {
                options: { appliedISOGrain: 'Auto' },
                absolute: { startTime: startDateTimeUtc, endTime: endDateTimeUtc }
            };

        this.state = {
            selections: {
                workspace: selectedWorkspace,
                clusterName: selectedClusterName,
                nameSpace: nameSpace,
                serviceName: serviceName,
                hostName: hostName,
                nodePool: nodePool,
                startDateTimeUtc: startDateTimeUtc,
                endDateTimeUtc: endDateTimeUtc,
                timeRangeSeconds: timeRangeSeconds,
                isTimeRelative: isTimeRelative,
                controllerName: controllerName,
                controllerKind: controllerKind
            },
            pillDataLoading: true,
            pillData: null,
            dateTimeRangeTimeData
        };
    }

    public render(): false | JSX.Element {
        return (
            <div className='control-panel'>
                {this.renderCacheValidationChrome()}
                <VariablePillContainer
                    onTimeRangeChanged={this.onTimeRangeChanged}
                    selectedTimeRange={this.state.dateTimeRangeTimeData}
                    pillDataLoading={this.state.pillDataLoading}
                    hideAddButton={true}
                    options={this.props.options}
                    selectedWorkspace={this.state.selections.workspace}
                    onAddNullPill={() => undefined}
                    onRemovePill={undefined}
                    dimensionOptions={this.getFilterOptions()}
                    variablePillData={undefined}
                    onWorkspaceChanged={() => Promise.resolve(null)}
                    onPillValueChanged={() => Promise.resolve(null)}
                    pillSelections={this.props.pillSelections}
                    timeControlSupportedTimeSelections={timeControlSupportedTimeSelections}
                />
                <RefreshButton
                    isRefreshInProgress={this.props.isTabContentLoading}
                    refreshAction={this.refreshOnClickHandler}
                    telemetry={this.props.telemetry}
                    telemetryArea={this.props.telemetryArea}
                />
            </div>
        );
    }

    /**
     * present a list of pill dimension options to the pill container... inblade
     * only need to worry about timerange for now
     */
    private getFilterOptions(): StringMap<IDimensionOption> {
        return { [PillDimension.TimeRange]: { dimensionName: PillDimension.TimeRange, removable: false } };
    }

    /**
     * Return a <div> containing all html required for displaying when cache validation is occuring
     * and when/if errors occurred during that cache validation.
     * @returns JSX.Element <div> containing the chrome required when caching validation and errors occur(ing)
     */
    private renderCacheValidationChrome(): JSX.Element {
        const standAlongProps = this.props.options as IStandAloneContainerControlPanelProps;
        if (!standAlongProps) { return null; }

        let classNameOfLoading = 'cache-validation-loading-icon-container center-flex';
        if (!standAlongProps.workspaceManager || !standAlongProps.workspaceManager.isLoading()) {
            classNameOfLoading += ' display-none';
        }

        let classNameOfException = 'cache-validation-loading-svg-size';
        if (!standAlongProps.workspaceManager || !standAlongProps.workspaceManager.isInErrorState()) {
            classNameOfException += ' display-none';
        }
        return <div>
            <div className={classNameOfLoading} title={Strings.DisplayStrings.CacheValidationInProgress}>
                <BlueLoadingDots size={BlueLoadingDotsSize.small} />
            </div>
            <div className={classNameOfException} title={Strings.DisplayStrings.CacheValidationFailed}>
                <ConsoleError />
            </div>
        </div>
    }

    /**
     * Handler for when time range is changed via control panel
     * @param time Time data to change to
     */
    private onTimeRangeChanged(time: TimeData): void {
        let startTime: moment.Moment;
        let endTime: moment.Moment;

        if (isRelative(time)) {
            endTime = moment.utc();
            startTime = moment(endTime).subtract(time.relative.duration, 'ms').utc();
        } else {
            startTime = moment(time.absolute.startTime).utc();
            endTime = moment(time.absolute.endTime).utc();
        }

        this.setState((prevState: IMeshControlPanelState) => {
            // DO NOT MUTATE prevState in this function!!!  it is not safe to do so
            const selections = update(prevState.selections, {
                startDateTimeUtc: { $set: startTime.toDate() },
                endDateTimeUtc: { $set: endTime.toDate() },
                timeRangeSeconds: { $set: Number(moment.duration(endTime.diff(startTime)).asSeconds()) },
                isTimeRelative: { $set: isRelative(time) }
            });

            return { selections, dateTimeRangeTimeData: time };
        }, () => {

            this.props.onSelectionsChanged(this.state.selections);
        });
    }

    /**
     * On click handler for refresh button
     * If selected time range is relative, updates the time range by setting the end time to now and determining the new start time based
     * on the relative time range duration.
     *
     * In the case where the selected time range is absolute, start and end time and dateTimeRangeTimeData will not change,
     * and thus these values passed down into grids will not kcikoff a requery, even though the data for this time range may have changed
     * e.g. Imagine that the user selected a time range that included 20 minutes into the future. If they hit refresh, 10 minutes from now,
     * thier data set will include 10 more minutes of data, even though their selected time range didn't change.
     *
     * Pill data has to be updated because the old data could be invalid in the new time range. onTimeRangeChanged calls updatePillData
     * after setting the state related to time.
     */
    private refreshOnClickHandler(): void {
        this.onTimeRangeChanged(this.state.dateTimeRangeTimeData);
    }
}
