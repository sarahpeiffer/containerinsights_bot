import * as React from 'react';
import { DisplayStrings } from '../shared/DisplayStrings';
import { FilterPicker } from '../shared/FilterPicker'
import { ComputeMetrics } from './ComputeMetrics';
import { ComputeComparisonGrid, GridSortDirection } from './ComputeComparisonGrid';
import { ICommonComputeTabProps } from './ICommonComputeTabProps';

import { ITelemetry, TelemetryMainArea } from '../shared/Telemetry';
import { IMetric } from '../shared/MetricDescriptor';
import { VmInsightsTelemetryFactory } from '../shared/VmInsightsTelemetryFactory';
import { SubscriptionListManager } from '../shared/SubscriptionListManager';

import '../../styles/compute/ComputeMain.less';

interface IComputeGridPaneProps extends ICommonComputeTabProps {
    metricName: string;
    subscriptionListManager: SubscriptionListManager;
    isPaneVisible: boolean;
    logPrefix: string;
    vmScaleSetResourceId?: string;
    featureFlags: StringMap<boolean>;
    onRowSelected: (row: any) => void;
    metricChanged: (metric: string) => void;
    hidePropertyPanel: () => void;
}

interface IComputeGridPaneState {
    sortColumnIndex: number;
    sortDirection: GridSortDirection;
    gridDataContainsFilter: string;
}

/**
 * value object to be delivered to external listeners for onGenerateActionItems events
 */
export interface IWrappedValueObject {
    value: any;
}

const SORT_COLUMN_INDEX_HIGH_VALUE_BETTER = 2;
const SORT_COLUMN_INDEX_LOW_VALUE_BETTER = 5;
const SEARCH_BAR_DOM_ID = 'computegrid-searchbar';

/** 
 * bbax: I made this Pure to ensure it performs a Shallow equals during shouldComponentUpdate automagically for us
 * which means as long as nothing chnages we wont re-query kusto for the sole reason of one of our parents
 * calling setState() to update some component the grid doens't care about (say a minor UI tweak)
 * this cases far less "twitching" in our loading and prevents the property panel open/close from causing
 * a kusto re-query... 
 * TODO: bonus if we can have this code also detect that the only change didn't effect state (say for hoisting state)
 * and NOT re-query kusto (but refresh our UI to include that new hoisted state) this would allow us to fix a minor
 * state issue that's been introduced by this change
*/
export class ComputeGridPane extends React.PureComponent<IComputeGridPaneProps, IComputeGridPaneState> {
    private telemetry: ITelemetry;
    private searchBarTypingTimer;
    private readonly searchBarDoneTypingInterval = 1000;
    constructor(props: Readonly<IComputeGridPaneProps>) {
        super(props);

        this.state = {
            sortColumnIndex: ComputeMetrics.get(this.props.metricName).descriptor.isHigherValueBetter 
            ? SORT_COLUMN_INDEX_HIGH_VALUE_BETTER
            : SORT_COLUMN_INDEX_LOW_VALUE_BETTER,
            sortDirection: ComputeMetrics.get(this.props.metricName).descriptor.isHigherValueBetter
                ? GridSortDirection.Asc
                : GridSortDirection.Desc,
            gridDataContainsFilter: ''
        };

        this.telemetry = VmInsightsTelemetryFactory.get(TelemetryMainArea.Compute);
        this.onKeyUpInSearchbar = this.onKeyUpInSearchbar.bind(this);
        this.onKeyDownInSearchbar = this.onKeyDownInSearchbar.bind(this);
    }

    public render(): JSX.Element {
        return (
            <div className='grid-pane compute-grid-pane'>
                <div className='perf-list-tool-pane'>
                    <div className='control-vm-perf-list'>
                        <input id={SEARCH_BAR_DOM_ID} type='text'
                            aria-label={DisplayStrings.EnterNameToSearchFor}
                            className='searchbox-filter-by-name'
                            placeholder={DisplayStrings.EnterNameToSearchFor}
                            onKeyUp={this.onKeyUpInSearchbar}
                            onKeyDown={this.onKeyDownInSearchbar}
                        />
                    </div>
                    <div className='label-vm-perf'>
                        <label>{DisplayStrings.MetricSelectorTitle}</label>
                    </div>
                    <div className='control-vm-perf-list metric-dropdown-vm-perf'
                         onClick={(e) => {
                             e.stopPropagation();
                         }}>
                        <FilterPicker
                            filters={ComputeMetrics.list()}
                            onSelectionChanged={this.onMetricSelectionChanged}
                            selectedFilterName={this.props.metricName}
                        />
                    </div>
                </div>
                <ComputeComparisonGrid
                    subscriptionListManager={this.props.subscriptionListManager}
                    startDateTimeUtc={this.props.startDateTimeUtc}
                    endDateTimeUtc={this.props.endDateTimeUtc}
                    workspace={this.props.workspace}
                    computerGroup={this.props.computerGroup}
                    gridDataContainsFilter={this.state.gridDataContainsFilter}
                    metricName={this.props.metricName}
                    sortColumnIndex={this.state.sortColumnIndex}
                    sortDirection={this.state.sortDirection}
                    onSortOrderChanged={this.sortOrderChanged}
                    onGridRowSelected={this.props.onRowSelected}
                    isPaneVisible={this.props.isPaneVisible}
                    logPrefix={this.props.logPrefix}
                    azureResourceInfo={this.props.azureResourceInfo}
                    vmScaleSetResourceId={this.props.vmScaleSetResourceId}
                    solutionType={this.props.solutionType}
                    azureResourceType={this.props.azureResourceType}
                    featureFlags={this.props.featureFlags}
                    isDefaultExperienceOfBlade={this.props.isDefaultExperienceOfBlade}
                />
            </div>
        );
    }

    private onMetricSelectionChanged = (metricName: string) => {
        this.props.metricChanged(metricName);

        const metric: IMetric = ComputeMetrics.get(metricName);
        const sortDirection: GridSortDirection = metric.descriptor.isHigherValueBetter ? GridSortDirection.Asc : GridSortDirection.Desc;
        const sortColumnIndex: number = metric.descriptor.isHigherValueBetter 
        ? SORT_COLUMN_INDEX_HIGH_VALUE_BETTER : SORT_COLUMN_INDEX_LOW_VALUE_BETTER;

        const newState: any = {
            sortColumnIndex: sortColumnIndex,
            sortDirection: sortDirection
        };
        this.setState(newState);

        this.props.hidePropertyPanel();

        const telemetryPayload: any = Object.assign({ metricName: metricName }, newState);
        this.telemetry.logEvent(`${this.props.logPrefix}.MetricSelectionChanged`, telemetryPayload, undefined);
    }

    private sortOrderChanged = (sortColumnIndex: number, sortDirection: GridSortDirection) => {
        const newState: any = {
            sortColumnIndex,
            sortDirection
        };
        this.setState(newState);
    }

    private doneTypingInSearchbar() {
        const value = (document.getElementById(SEARCH_BAR_DOM_ID) as any).value;
        this.setState({ gridDataContainsFilter: value });
    }

    private onKeyUpInSearchbar(evt) {
        clearTimeout(this.searchBarTypingTimer);
        this.searchBarTypingTimer = setTimeout(this.doneTypingInSearchbar.bind(this),
            this.searchBarDoneTypingInterval);
    }

    private onKeyDownInSearchbar(evt) {
        clearTimeout(this.searchBarTypingTimer);
    }
}
