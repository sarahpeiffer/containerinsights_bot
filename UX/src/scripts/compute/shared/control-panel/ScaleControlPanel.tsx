import * as React from 'react';
import { TimeData, TimeValues, TimeDataAbsolute, RangeValidation } from '@appinsights/pillscontrol-es5';
import { isTimeDataEqual, isRelative } from '@appinsights/pillscontrol-es5/dist/TimeUtils';

/**
 * Local
 */
import { IComputerInfo, IComputerList, IComputerProvider } from './ComputerProvider';
import { ControlPanelUtility } from '../ControlPanelUtility';
import { ComputerGroupProvider } from '../../control-panel/ComputerGroupProvider';
import { OmsComputerProvider } from './OmsComputerProvider';
import { ControlPanelCommandBar } from './ControlPanelCommandBar';

/**
 * Shared
 */
import { DisplayStrings } from '../../../shared/DisplayStrings';
import { ComputerGroup, ComputerGroupType } from '../../../shared/ComputerGroup';
import { IWorkspaceInfo } from '../../../shared/IWorkspaceInfo';
import { MessagingProvider } from '../../../shared/MessagingProvider';
import { ITelemetry } from '../../../shared/Telemetry';
import { DateTimeRange } from '../../../shared/pill-component/DateTimeRange';
import { DropDownOption, TextDropDownPill, IDropDownResult } from '../../../shared/pill-component/TextDropDownPill';
import { WorkspaceListManager } from '../../../shared/WorkspaceListManager';
import { LoadingSvg } from '../../../shared/svg/loading';
import { TimeInterval } from '../../../shared/data-provider/TimeInterval';
import * as GlobalConstants from '../../../shared/GlobalConstants';
import { KustoDataProvider } from '../../../shared/data-provider/KustoDataProvider';
import { ARMDataProvider } from '../../../shared/data-provider/ARMDataProvider';
import { TelemetryUtils } from '../../shared/TelemetryUtils';
import { StringHelpers } from '../../../shared/Utilities/StringHelpers';
import { LimitedCache } from '../LimitedDataCacheUtil';
import { AtScaleUtils } from '../AtScaleUtils';

/**
 * Styles
 */
import '../../../../styles/shared/ControlPanel.less';
import '../../../../styles/compute/ControlPanel.less';

export enum HybridControlPanelDropDownType {
    workspace,
    group,
    computer,
    time
}

export interface ScaleControlPanelDisplaySettings {
    showWorkspaceDropDown: boolean;
    showGroupDropDown: boolean;
    showComputerDropDown: boolean;
    showWorkbookDropDown: boolean;
    showSwitchToggle: boolean;
}

/**
 * callback entity pass out to its parent
 */
export interface IScaleControlPanelSelections {
    type: HybridControlPanelDropDownType;
    selectedWorkspace?: IWorkspaceInfo;
    selectedComputerId?: string;
    selectedGroupId?: string;
    selectedTimeRange?: TimeData;
}

interface IScaleControlPanelProps {
    selectedWorkspace: IWorkspaceInfo;
    workspaceList: IWorkspaceInfo[];

    /**
     * used to show workspace request status
     */
    workspaceManager: WorkspaceListManager;

    /**
     * selectedComputer property is used only in Maps page and hence we made this optional
     */
    selectedComputer?: IComputerInfo;

    selectedComputerGroup: ComputerGroup;

    vmScaleSetResourceId?: string;

    /**
     * This default group is passed by atSCalePerf
     * If this default group is not specified then we will put "Select"
     * as the default group.
     */
    defaultComputerGroup?: ComputerGroup;

    /**
     * Use this value to set member method of this class.
     * Do not use this value directly to query computerList.
     */
    dateTime: TimeData;

    /**
     * This tells what kind of groups to be loaded in the groups drop down.
     * In Map tab, we load only serviceMap specific groups.
     */
    computerGroupType?: ComputerGroupType;

    /**
     * if we don't cache workspace selection, then messagingProvider is not needed
     */
    messagingProvider: MessagingProvider;

    telemetry: ITelemetry;

    logPrefix: string;

    displaySetting: ScaleControlPanelDisplaySettings;

    supportedTimes: TimeValues[];

    featureFlags: StringMap<boolean>;

    // This flag indicates if we have to update the dropdownOptions or not.
    forceUpdate?: boolean;

    endDateTimeUtc?: Date;

    onSelectionsChanged: (selections: IScaleControlPanelSelections) => void;

    timeValidation: (value: TimeDataAbsolute) => RangeValidation;

    onComputersLoaded?: (computers: IComputerInfo[]) => void;

    onComputerGroupsLoaded: (computerGroups: ComputerGroup[]) => void;

    onSolutionTypeChanged: (solutionType: string) => void;
}

interface IScaleControlPanelState {

    computerGroupDropDownOptions: DropDownOption[];

    computerGroups: ComputerGroup[];

    // flag to quick reset group dropdown
    isComputerGroupsInit: boolean;

    computerListDropDownOptions: DropDownOption[];

    computers: IComputerInfo[];

    // flag to quick reset computerList dropdown.
    isComputerListInit: boolean;

    selectedComputerDropDownOption: DropDownOption;
}

// Add placeholder computer option which shows 'Select' any computer.
// NOTE: If this.props.defaultComputerGroup is specified then do not use defaultItem
const defaultItem: DropDownOption = { label: DisplayStrings.Select, value: '' };

/**
 * This component contains four drop downs. which are workspace, group, compuer, time
 * it try to use the passed in selection, but if not found, use first one
 * This component is used by ScaleComputeMapPage
 */
export class ScaleControlPanel extends React.Component<IScaleControlPanelProps, IScaleControlPanelState> {
    private _endDateTimeUtc: Date;

    /**
     * Used to query serviceMap computerList 
     */
    private dateTime: TimeData;
    private requestToUpdateComputerList: boolean = true;
    private requestToUpdateComputerGroupList: boolean = true;
    private computerGroupProvider: ComputerGroupProvider;
    private computerProvider: IComputerProvider;

    /**
     * This is the prefix of search string of computers dropdwon where all the data is loaded.
     * All further search strings which are staring with this prefix will not trigger any
     * data load queries.
     */
    private computersSearchPrefixWithFullDataLoaded: string;

    /**
     * This value is used to rate limit the handling of input changes in drop down pill.
     */
    private readonly dropdownInputChangeEventHandlingRateLimitInMs: number = 800;

    /**
     * This timer is used to trigger dropdown input change event handling.
     * We wait for atleast 1sec to determine that user stopped changing the drop down input
     * and then trigger the event handling.
     */
    private dropdownInputChangeRateLimitTimer;

    private computerDropdownInputText: string = '';

    private readonly maxNumberOfComputerRecordsToLoad: number = 2000;

    private computerListSequenceNumber = 0;

    /**
     * We cache computerList for a given searchFilter for given workspace.
     * Whenever workspace is changed we clear this cache.
     */
    private computersCache: LimitedCache<IComputerList> = new LimitedCache<IComputerList>();

    constructor(props: IScaleControlPanelProps) {
        super(props);

        this.onWorkspaceChanged = this.onWorkspaceChanged.bind(this);
        this.onComputerChanged = this.onComputerChanged.bind(this);
        this.onComputerGroupChanged = this.onComputerGroupChanged.bind(this);
        this.onTimeRangeChanged = this.onTimeRangeChanged.bind(this);
        this.onComputerDropdownEditModeChanged = this.onComputerDropdownEditModeChanged.bind(this);
        this.onGroupDropdownEditModeChanged = this.onGroupDropdownEditModeChanged.bind(this);
        this.onComputerDropdownInputChange = this.onComputerDropdownInputChange.bind(this);
        this.computerGroupProvider = new ComputerGroupProvider(this.props.telemetry);

        this.computerProvider = new OmsComputerProvider(
            this.props.telemetry,
            new KustoDataProvider(new ARMDataProvider(), GlobalConstants.VMInsightsApplicationId));

        this.dateTime = this.props.dateTime;
        let defaultComputerGroupOptions = this.props.selectedComputerGroup ?
            this.getComputerGroupDropDownOptions([this.props.selectedComputerGroup], false) : [defaultItem];

        let defaultComputerListOptions = this.props.selectedComputer && this.props.displaySetting.showComputerDropDown ?
            this.getComputerDropDownOptions([this.props.selectedComputer], false) : [defaultItem];

        this.calculateStartAndEndTime(props.dateTime);

        this.state = {
            computerListDropDownOptions: defaultComputerListOptions,
            computerGroupDropDownOptions: defaultComputerGroupOptions,
            computerGroups: this.props.selectedComputerGroup ? [this.props.selectedComputerGroup] : [],
            computers: this.props.selectedComputer ? [this.props.selectedComputer] : [],
            isComputerGroupsInit: false,
            isComputerListInit: false,
            selectedComputerDropDownOption: defaultItem
        };
    }

    public componentWillReceiveProps(nextProps: Readonly<IScaleControlPanelProps>) {
        if (!nextProps) {
            return;
        }
        
        const isTimeRangeChanged: boolean = nextProps.dateTime && !isTimeDataEqual(this.dateTime, nextProps.dateTime);
        const isWorkspaceChanged: boolean = (nextProps.selectedWorkspace && nextProps.selectedWorkspace.id)
            && (!this.props.selectedWorkspace || (this.props.selectedWorkspace.id
                && this.props.selectedWorkspace.id.toLowerCase() !== nextProps.selectedWorkspace.id.toLowerCase()));
        
        this.dateTime = nextProps.dateTime;
        // If time range is changed or workspace is changed or its a forceUpdate then clear all dropdown options
        if (isTimeRangeChanged || isWorkspaceChanged || this.props.forceUpdate) {
            // Update computerList and computerGroups
            this.requestToUpdateComputerList = true;
            this.requestToUpdateComputerGroupList = true;
            this.setState({
                isComputerGroupsInit: false,
                isComputerListInit: false,
                computerGroupDropDownOptions: [],
                computerListDropDownOptions: [],
                computers: [],
                computerGroups: []
            });
        }

        // If the input parameters have selectedComputer and there is a pending updateComputerList operation
        // Then create DropDownList with this selectedComputer and make the selectedComputer as the default
        if (nextProps.selectedComputer && nextProps.selectedComputer.id && this.requestToUpdateComputerList) {
            this.setState({
                computerListDropDownOptions: this.getComputerDropDownOptions([nextProps.selectedComputer], false),
                computers: [nextProps.selectedComputer]
            });
        }

        // If the input parameters have selectedComputer and there is a pending updateComputerList operation
        // Then create DropDownList with this selectedComputer and make the selectedComputer the the default
        if (nextProps.selectedComputerGroup && nextProps.selectedComputerGroup.id && this.requestToUpdateComputerGroupList) {
            this.setState({
                computerGroupDropDownOptions: this.getComputerGroupDropDownOptions([nextProps.selectedComputerGroup], false),
                computerGroups: [nextProps.selectedComputerGroup]
            });
        }

        // Update selectedComputerDropdown
        let nextSelectedOption: DropDownOption = nextProps.selectedComputer && nextProps.selectedComputer.id ?
            { label: nextProps.selectedComputer.displayName, value: nextProps.selectedComputer.id } : defaultItem;

        if (!this.state.selectedComputerDropDownOption ||
            nextSelectedOption.value !== this.state.selectedComputerDropDownOption.value) {
            this.setState({
                selectedComputerDropDownOption: nextSelectedOption
            });
        }

        if (this.props.dateTime !== nextProps.dateTime || this.props.forceUpdate) {
            this.calculateStartAndEndTime(nextProps.dateTime);
        }
        
        if (nextProps.endDateTimeUtc) {
            this._endDateTimeUtc = nextProps.endDateTimeUtc;
        }
    }

    public render(): false | JSX.Element {
        const workspaceComputerAndGroupSelectionDivs: JSX.Element[] = [];

        if (this.props.displaySetting.showWorkspaceDropDown) {
            const workspaceOptions = this.getWorkSpaceDropDownResult();
            workspaceComputerAndGroupSelectionDivs.push(<div key='workspace' className='control-panel-drop-down'>
                <TextDropDownPill
                    containerId={'workspace-drop-down'}
                    selectedItem={workspaceOptions.selectedItem}
                    dropDownOptions={workspaceOptions.options}
                    onSelectionChanged={this.onWorkspaceChanged}
                    areValuesLoading={this.props.workspaceManager.isLoading()}
                    pillLabel={DisplayStrings.WorkspaceSelectorTitle + DisplayStrings.LabelSeperator} />
            </div>);
        }

        if (this.props.displaySetting.showGroupDropDown) {
            workspaceComputerAndGroupSelectionDivs.push(<div key='computer-group' className='control-panel-drop-down'>
                <TextDropDownPill
                    containerId={'computer-group-drop-down'}
                    selectedItem={this.getGroupDropdownDefaultSelection()}
                    dropDownOptions={this.state.computerGroupDropDownOptions}
                    onSelectionChanged={this.onComputerGroupChanged}
                    areValuesLoading={!this.state.isComputerGroupsInit}
                    pillLabel={DisplayStrings.ComputerGroupSelectorTitle + DisplayStrings.LabelSeperator}
                    onEditModeChange={this.onGroupDropdownEditModeChanged} />
            </div>);
        }

        if (this.props.displaySetting.showComputerDropDown) {
            const selectedComputer: DropDownOption = this.props.selectedComputer &&
                { label: this.props.selectedComputer.displayName, value: this.props.selectedComputer.id } || defaultItem;
            workspaceComputerAndGroupSelectionDivs.push(<div key='computer' className='control-panel-drop-down'>
                <TextDropDownPill
                    containerId={'computer-drop-down'}
                    selectedItem={selectedComputer}
                    dropDownOptions={this.state.computerListDropDownOptions}
                    onSelectionChanged={this.onComputerChanged}
                    areValuesLoading={!this.state.isComputerListInit}
                    pillLabel={DisplayStrings.ComputerSelectorTitle + DisplayStrings.LabelSeperator}
                    onEditModeChange={this.onComputerDropdownEditModeChanged}
                    onInputTextChange={this.onComputerDropdownInputChange} />
            </div>);
        }

        return (
            <div className='control-panel maps-control-panel'>
                <div className='control-panel-scopes'>
                    {this.renderWorkspaceLoading()}
                    {workspaceComputerAndGroupSelectionDivs}
                    <div className='control-panel-drop-down'>
                        <DateTimeRange
                            initialTimeData={this.props.dateTime}
                            supportedTimes={this.props.supportedTimes}
                            timeChanged={this.onTimeRangeChanged}
                            validateTime={this.props.timeValidation}
                            pillLabel={DisplayStrings.TimeRangeSelectorTitle + DisplayStrings.LabelSeperator}
                            latestDateTime={this._endDateTimeUtc} />
                    </div>
                </div>
                <ControlPanelCommandBar
                    selectedWorkspace={this.props.selectedWorkspace}
                    featureFlags={this.props.featureFlags}
                    showWorkbookDropDown={this.props.displaySetting && this.props.displaySetting.showWorkbookDropDown}
                    showSwitchToggle={this.props.displaySetting && this.props.displaySetting.showSwitchToggle}
                    vmScaleSetResourceId={this.props.vmScaleSetResourceId}
                    messagingProvider={this.props.messagingProvider}
                    telemetry={this.props.telemetry}
                    logPrefix={this.props.logPrefix}
                    resourceId={this.props.selectedWorkspace?.id}
                    workspaceId={this.props.selectedWorkspace?.id}
                    solutionType={'hybrid'}
                    onSolutionTypeChanged={this.props.onSolutionTypeChanged} />
            </div>
        );
    }

    /**
     * This method is invoked whenever the computer dropdown is opened.
     * @param editMode
     */
    private onComputerDropdownEditModeChanged(editMode: boolean) {
        if (editMode && this.requestToUpdateComputerList) {
            this.computersCache.clear();
            this.updateComputerList();
            this.requestToUpdateComputerList = false;
        }
    }

    /**
     * This method is invoked whenever group dropdown is opened.
     * @param editMode 
     */
    private onGroupDropdownEditModeChanged(editMode: boolean) {
        if (editMode && this.requestToUpdateComputerGroupList) {
            this.updateComputerGroupList();
            this.requestToUpdateComputerGroupList = false;
        }
    }

    /**
     * make request for computer list based on state.workspace
     */
    private updateComputerList(searchFilter?: string) {
        if (!this.props.selectedWorkspace || !this.props.selectedWorkspace.id) {
            return;
        }

        searchFilter = searchFilter || '';
        let getComputerListPromise: Promise<IComputerList>;
        const localSequenceNumber: number = ++this.computerListSequenceNumber;

        if (this.computersCache.get(searchFilter)) {
            getComputerListPromise = new Promise((resolve, reject) => { resolve(this.computersCache.get(searchFilter)); });
        } else {
            const startAndEnd = TimeInterval.getStartAndEndDate(this.props.dateTime, isRelative(this.props.dateTime));
            const startDateTimeUtc = startAndEnd.start;
            const endDateTimeUtc = startAndEnd.end;

            this.setState({
                isComputerListInit: false
            });

            getComputerListPromise = this.computerProvider.getSortedComputerList(
                this.props.selectedWorkspace,
                this.maxNumberOfComputerRecordsToLoad,
                searchFilter,
                startDateTimeUtc,
                endDateTimeUtc,
                this.props.logPrefix,
                this.props.vmScaleSetResourceId
            )
        }
        // getSortedComputerList method is logging the telemetry. No need to log again.
        getComputerListPromise.then((computerList: IComputerList) => {
            if (localSequenceNumber !== this.computerListSequenceNumber) {
                return;
            }

            //We add vmss into the computer list.
            if (this.props.vmScaleSetResourceId) {
                const vmssResourceDecriptor = AtScaleUtils.getAzureComputeResourceDescriptor(this.props.vmScaleSetResourceId);
                const vmss: IComputerInfo = {
                    computerName: '',
                    displayName: vmssResourceDecriptor && vmssResourceDecriptor.resources && vmssResourceDecriptor.resources[0],
                    id: this.props.vmScaleSetResourceId
                };
                computerList.computers.unshift(vmss);
            }

            // Save the result in cache.
            this.computersCache.insert(searchFilter, computerList);
            // If computerList is null/empty for the given non empty searchFilter string
            // then do not set the state.
            if (!StringHelpers.isNullOrEmpty(searchFilter) && computerList.computers.length === 0) {
                this.setState({
                    isComputerListInit: true
                });
                this.computersSearchPrefixWithFullDataLoaded = searchFilter || '';
                return;
            }

            // If searchFilter value is not empty then do not set computerList.hasMore to this.state.hasMoreComputersToLoad
            this.setState({
                computerListDropDownOptions: this.getComputerDropDownOptions(computerList.computers, computerList.hasMore),
                isComputerListInit: true,
                computers: computerList.computers
            });

            if (!computerList.hasMore) {
                this.computersSearchPrefixWithFullDataLoaded = searchFilter || '';
            } else {
                this.computersSearchPrefixWithFullDataLoaded = undefined;
            }

            if (this.props.onComputersLoaded) {
                this.props.onComputersLoaded(computerList.computers);
            }
        }).catch((error) => {
            if (localSequenceNumber !== this.computerListSequenceNumber) {
                // TODO: should we log the error?
                return;
            }
            this.setState({
                computerListDropDownOptions: [defaultItem],
                computers: [],
                isComputerListInit: true
            });
            this.requestToUpdateComputerList = true;
            if (this.props.onComputersLoaded) {
                this.props.onComputersLoaded([]);
            }
        });
    }

    /**
     * make request for computerGroup list based on state.workspace
     */
    private updateComputerGroupList() {
        if (!this.props.selectedWorkspace || !this.props.selectedWorkspace.id) {
            return;
        }

        // If the parent of this component passes the defaultComputerGroup
        // then do not use childer's default group option which is "select"
        const prependDefaultSelectOption: boolean = this.props.defaultComputerGroup ? false : true;
        let groups = this.props.defaultComputerGroup ? [this.props.defaultComputerGroup] : [];
        this.computerGroupProvider.getSortedGroups(
            this.props.selectedWorkspace,
            this.props.logPrefix,
            this.props.computerGroupType
        ).then((result: ComputerGroup[]) => {
            groups = groups.concat(result);
            this.setState({
                computerGroupDropDownOptions: this.getComputerGroupDropDownOptions(groups, prependDefaultSelectOption),
                isComputerGroupsInit: true,
                computerGroups: groups
            });

            if (this.props.onComputerGroupsLoaded) {
                this.props.onComputerGroupsLoaded(groups);
            }
        }).catch((error) => {
            this.setState({
                computerGroupDropDownOptions: this.getComputerGroupDropDownOptions(groups, prependDefaultSelectOption),
                computerGroups: groups,
                isComputerGroupsInit: true
            });
            this.requestToUpdateComputerGroupList = true;
            if (this.props.onComputerGroupsLoaded) {
                this.props.onComputerGroupsLoaded(groups);
            }
        });
    }

    /**
     * Get all workspace list and selected workspace from the workspaceManager
     */
    private getWorkSpaceDropDownResult(): IDropDownResult {
        const options = [];
        let selected: DropDownOption = defaultItem;

        const sortedWorkspaceList = this.props.workspaceList || [];
        const selectedWorkspaceId = this.props.selectedWorkspace && this.props.selectedWorkspace.id;

        for (let i = 0; i < sortedWorkspaceList.length; i++) {
            const workspace = sortedWorkspaceList[i];
            if (workspace && workspace.name && workspace.id) {
                const option = { label: workspace.name, value: workspace.id };
                if (selectedWorkspaceId.toLowerCase() === workspace.id.toLowerCase()) {
                    selected = option;
                }
                options.push(option);
            }
        }

        return { options: options, selectedItem: selected };
    }

    /**
     * get computerGroup drop down list and selected group from the props.
     * default is placehold 'select'.
     */
    private getComputerGroupDropDownOptions(computerGroupList: ComputerGroup[], prependDefaultOption: boolean): DropDownOption[] {
        if (!computerGroupList || computerGroupList.length === 0) {
            return prependDefaultOption ? [defaultItem] : [];
        }

        const generatedOptions: Array<DropDownOption> = ControlPanelUtility.generateComputerGroupDropDownOptions(computerGroupList);
        const options: Array<DropDownOption> = prependDefaultOption ? [defaultItem].concat(generatedOptions) : generatedOptions;

        return options;
    }

    /**
     * get computer drop down list and selected computer from the props.
     * default is placehold 'select'.
     */
    private getComputerDropDownOptions(computerList: IComputerInfo[], hasMoreComputers: boolean): DropDownOption[] {
        if (!computerList || computerList.length === 0) {
            return [defaultItem];
        }

        const options: DropDownOption[] = [];

        for (let i = 0; i < computerList.length; i++) {
            const computer = computerList[i];
            if (computer && computer.displayName && computer.id) {
                const option = { label: computer.displayName, value: computer.id };
                options.push(option);
            }
        }

        if (hasMoreComputers) {
            // TODO ak: needs to be i18n
            options.push({
                label: 'Refine selection for more entries',
                value: 'Refine selection for more entries',
                disabled: true
            });
        }
        return options;
    }

    /**
     * Return a <div> containing all html required for displaying when cache validation is occuring
     * and when/if errors occurred during that cache validation.
     * @returns JSX.Element <div> containing the chrome required when caching validation and errors occur(ing)
     */
    private renderWorkspaceLoading(): JSX.Element {
        let classNameOfLoading = 'wsp-loading-svg';
        if (!this.props.displaySetting.showWorkspaceDropDown
            || !this.props.workspaceManager
            || !this.props.workspaceManager.isLoading()) {
            classNameOfLoading += ' wsp-loading-hidden';
        }

        return <div className='control-panel-element'>
            <div className={classNameOfLoading} title={DisplayStrings.LoadingInProgress}>
                <LoadingSvg />
            </div>
        </div>
    }

    /**
     * user select workspace in dropdown list
     * won't return null
     * @param selectedWorkspaceId
     */
    private onWorkspaceChanged(selectedWorkspaceId: string): void {
        this.props.telemetry.logEvent(this.props.logPrefix + '.ScaleControlPanelWorkspaceChanged', { selectedWorkspaceId }, undefined);

        let selectedWorkspace: IWorkspaceInfo = null;
        for (let i = 0; i < this.props.workspaceList.length; i++) {
            if (this.props.workspaceList[i].id.toLowerCase() === selectedWorkspaceId.toLowerCase()) {
                selectedWorkspace = this.props.workspaceList[i];
                break;
            }
        }

        if (!selectedWorkspace) {
            throw 'cound not find workspace from workspace dropdown list, which is impossible';
        }

        this.props.onSelectionsChanged({
            type: HybridControlPanelDropDownType.workspace,
            selectedWorkspace: selectedWorkspace
        });
    }

    /**
     * user select computer group from drop down list
     * @param selectedComputerGroupId
     */
    private onComputerGroupChanged(selectedComputerGroupId: string): void {
        this.props.telemetry.logEvent(this.props.logPrefix + '.ComputeMapControlPanelComputerGroupChanged',
            { selectedComputerGroupId }, undefined);

        this.props.onSelectionsChanged({
            type: HybridControlPanelDropDownType.group,
            selectedGroupId: selectedComputerGroupId
        });
    }

    /**
     * user select computer from drop down list
     * @param selectedComputerId
     */
    private onComputerChanged(selectedComputerId: string): void {
        this.props.telemetry.logEvent(this.props.logPrefix + '.ComputeMapControlPanelComputerChanged', { selectedComputerId }, undefined);

        this.props.onSelectionsChanged({
            type: HybridControlPanelDropDownType.computer,
            selectedComputerId: selectedComputerId
        })
    }

    /**
     * user select time
     * @param time
     */
    private onTimeRangeChanged(time: TimeData): void {
        const telemetryStartAndEndTime = TelemetryUtils.getDateTimeRangeForTelemetry(time);
        this.props.telemetry.logEvent(
            this.props.logPrefix + '.ComputeMapControlPanelTimeRangeChanged', telemetryStartAndEndTime, undefined);
        this.dateTime = time;
        this.requestToUpdateComputerList = this.props.displaySetting.showComputerDropDown && true;
        this.requestToUpdateComputerGroupList = this.props.displaySetting.showGroupDropDown && true;
        this.props.onSelectionsChanged({
            type: HybridControlPanelDropDownType.time,
            selectedTimeRange: time
        });
    }

    private getGroupDropdownDefaultSelection(): DropDownOption {
        if (!this.props.selectedComputerGroup || !this.props.selectedComputerGroup.id
            || !this.state.computerGroupDropDownOptions || this.state.computerGroupDropDownOptions.length === 0) {
            return defaultItem;
        }

        return ControlPanelUtility.retrieveDropDownOptionById(this.props.selectedComputerGroup.id,
            this.state.computerGroupDropDownOptions) || this.props.defaultComputerGroup || defaultItem;
    }

    private computerDropdownInputChangeEventHandler(): void {
        // Check if the data available is fully loaded for the given searchString.
        if (this.computersSearchPrefixWithFullDataLoaded !== undefined
            && this.computerDropdownInputText.startsWith(this.computersSearchPrefixWithFullDataLoaded)) {
            return;
        }
        this.updateComputerList(this.computerDropdownInputText);
        this.dropdownInputChangeRateLimitTimer = null;
    }

    private onComputerDropdownInputChange(newValue: string): void {
        // This method is called even though the dropDown list is closed.
        // To avoid duplicate calls, always check the newValue with previously received value
        if (newValue === this.computerDropdownInputText) {
            return;
        }

        this.computerDropdownInputText = newValue;
        clearTimeout(this.dropdownInputChangeRateLimitTimer);
        this.dropdownInputChangeRateLimitTimer = setTimeout(this.computerDropdownInputChangeEventHandler.bind(this),
            this.dropdownInputChangeEventHandlingRateLimitInMs);
    }

    private calculateStartAndEndTime(dateTime: TimeData): void {
        const startAndEnd = TimeInterval.getStartAndEndDate(dateTime, isRelative(dateTime));
        if (startAndEnd) {
            this._endDateTimeUtc = startAndEnd.end;
        }
    }
}
