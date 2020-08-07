import * as React from 'react';
import { TimeData, TimeValues, TimeDataAbsolute, RangeValidation, DropdownOption, PillOption } from '@appinsights/pillscontrol-es5';

/**
 * Shared
 */
import { DisplayStrings } from '../../../shared/DisplayStrings';
import { ISubscriptionInfo } from '../../../shared/ISubscriptionInfo';
import { MessagingProvider } from '../../../shared/MessagingProvider';
import { ITelemetry } from '../../../shared/Telemetry';
import { DateTimeRange } from '../../../shared/pill-component/DateTimeRange';
import { DropDownOption, TextDropDownPill, IDropDownResult } from '../../../shared/pill-component/TextDropDownPill';
import { TelemetryUtils } from '../TelemetryUtils';
import * as GlobalConstants from '../../../shared/GlobalConstants';
import { IWorkspaceInfo } from '../../../shared/IWorkspaceInfo';
import { VmInsightsOnboardingDataProvider } from '../../data-provider/VmInsightsOnboardingDataProvider';
import { RetryPolicyFactory } from '../../../shared/data-provider/RetryPolicyFactory';
import { ARMDataProvider } from '../../../shared/data-provider/ARMDataProvider';
import { RetryARMDataProvider } from '../../../shared/data-provider/RetryARMDataProvider';
import { StringHelpers } from '../../../shared/Utilities/StringHelpers';
import { ComputerGroupProvider } from '../../control-panel/ComputerGroupProvider';
import { IComputerProvider, IComputerList, IComputerInfo } from './ComputerProvider';
import { OmsComputerProvider } from './OmsComputerProvider';
import { KustoDataProvider } from '../../../shared/data-provider/KustoDataProvider';
import { ComputerGroupType, ComputerGroup } from '../../../shared/ComputerGroup';
import { ControlPanelUtility } from '../ControlPanelUtility';
import { LimitedCache } from '../LimitedDataCacheUtil';
import { isRelative } from '@appinsights/pillscontrol-es5/dist/TimeUtils';
import { TimeInterval } from '../../../shared/data-provider/TimeInterval';
import { AzureResourcesProvider, GetAzureResourcesQueryParams } from '../../control-panel/AzureResourcesProvider';
import { ControlPanelCommandBar } from './ControlPanelCommandBar';
import { ResourceInfo, VmInsightsResourceType } from '../ResourceInfo';
import { defaultResourceGroupInfo, defaultVmssInstance } from '../AtScaleUtils';

/**
 * Styles
 */
import '../../../../styles/shared/ControlPanel.less';
import '../../../../styles/compute/ControlPanel.less';

export enum AzureControlPanelDropDownType {
    subscription,
    resourceGroup,
    resourceType,
    workspace,
    resource,
    vmssInstance,
    time
}

export interface AzureScaleControlPanelDisplaySettings {
    enableResourceGroupDropDown: boolean;
    enableSubscriptionDropDown: boolean;
    enableWorkspaceDropDown: boolean;
    enableResourceTypeDropDown: boolean;
    enableResourceDropDown: boolean;
    enableVmssInstanceDropdown: boolean;
    enableWorkbookDropDown: boolean;
    enableSwitchToggle: boolean;
}

/**
 * callback entity pass out to its parent
 */
export interface IAzureScaleControlPanelSelections {
    type: AzureControlPanelDropDownType
    selectedSubscription?: ISubscriptionInfo;
    selectedResourceGroup?: ResourceInfo;
    selectedWorkspace?: IWorkspaceInfo;
    selectedResourceType?: VmInsightsResourceType;
    selectedResource?: ResourceInfo;
    selectedVmssInstance?: ResourceInfo;
    selectedTimeRange?: TimeData;
}

interface IAzureScaleControlPanelProps {
    selectedSubscriptionInfo: ISubscriptionInfo;
    subscriptionsList: ISubscriptionInfo[];
    selectedResourceGroupInfo: ResourceInfo;
    resourceGroups: ResourceInfo[];
    selectedResourceType: VmInsightsResourceType;
    selectedResource?: ResourceInfo;
    resources: ResourceInfo[];
    selectedWorkspace?: IWorkspaceInfo;
    workspaces: IWorkspaceInfo[];
    selectedVmssInstance: ResourceInfo;
    vmssInstances: ResourceInfo[];
    dateTime: TimeData;
    messagingProvider: MessagingProvider;
    telemetry: ITelemetry;
    logPrefix: string;
    supportedTimes: TimeValues[];
    featureFlags: StringMap<boolean>;
    displaySettings: AzureScaleControlPanelDisplaySettings;
    supportedResourceTypes: VmInsightsResourceType[];
    forceUpdate?: boolean;
    endDateTimeUtc?: Date;
    onSelectionsChanged: (selections: IAzureScaleControlPanelSelections) => void;
    onResourceGroupsLoaded: (resourceGroups: ResourceInfo[]) => void;
    onWorkspacesLoaded: (workspaces: IWorkspaceInfo[]) => void;
    onResourcesLoaded: (resources: ResourceInfo[]) => void;
    onVmssInstancesLoaded: (vmssInstances: ResourceInfo[]) => void;
    timeValidation: (value: TimeDataAbsolute) => RangeValidation;
    onSolutionTypeChanged: (solutionType: string) => void;
}

interface IAzureScaleControlPanelState {
    resourceGroupDropDownOptions: DropDownOption[];
    resourceGroups: ResourceInfo[];
    resourceTypeDropDownOptions: DropdownOption[];
    resources: ResourceInfo[];
    resourceDropDownOptions: DropdownOption[];
    workspaceList: IWorkspaceInfo[];
    workspaceDropdownOptions: DropdownOption[];
    isWorkspacesInit: boolean;
    isResourceGroupsInit: boolean;
    isResourcesInit: boolean;
    isVmssInstancesInit: boolean;
    vmssInstances: ResourceInfo[];
    vmssInstanceDropdownOptions: DropdownOption[];
}

// Add placeholder computer option which shows 'Select' any computer.
// NOTE: If this.props.defaultComputerGroup is specified then do not use defaultItem
const defaultItem: DropDownOption = { label: DisplayStrings.Select, value: '' };

/**
 * This component contains four drop downs. which are workspace, group, compuer, time
 * it try to use the passed in selection, but if not found, use first one
 * This component is used by ScaleComputeMapPage
 */
export class AzureScaleControlPanel extends React.Component<IAzureScaleControlPanelProps, IAzureScaleControlPanelState> {
    private _endDateTimeUtc: Date;

    private requestToUpdateResourceList: boolean = true;
    private requestToUpdateResourceGroupList: boolean = true;
    private requestToUpdateWorkspaceList: boolean = true;
    private requestToUpdateVmssInstanceList: boolean = true;

    private azureResourceProvider: AzureResourcesProvider;
    private telemetryPrefix: string;

    private serviceMapGroupProvider: ComputerGroupProvider;
    private serviceMapComputerProvider: IComputerProvider;

    /**
     * Data provider which tells whether a given resource is onboarded to vmInsights or not.
     * If onboarded, it returns list of all subscriptions where the resource/nestedReources
     * Sending data.
     */
    private vmInsightsOnboardingStatusProvider: VmInsightsOnboardingDataProvider;


    /**
     * This is the prefix of search string of serviceMap computers dropdwon where all the data is loaded.
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

    constructor(props: IAzureScaleControlPanelProps) {
        super(props);

        this.serviceMapGroupProvider = new ComputerGroupProvider(this.props.telemetry);
        this.azureResourceProvider = new AzureResourcesProvider(this.props.telemetry);
        this.serviceMapComputerProvider = new OmsComputerProvider(
            this.props.telemetry,
            new KustoDataProvider(new ARMDataProvider(), GlobalConstants.VMInsightsApplicationId));

        this.onSubscriptionChanged = this.onSubscriptionChanged.bind(this);
        this.onResourceGroupChanged = this.onResourceGroupChanged.bind(this);
        this.onWorkspaceChanged = this.onWorkspaceChanged.bind(this);
        this.onResourceChanged = this.onResourceChanged.bind(this);
        this.onResourceTypeChanged = this.onResourceTypeChanged.bind(this);
        this.onTimeRangeChanged = this.onTimeRangeChanged.bind(this);
        this.onResourceDropdownInputChange = this.onResourceDropdownInputChange.bind(this);
        this.onResourceDropdownEditModeChanged = this.onResourceDropdownEditModeChanged.bind(this);
        this.onResourceGroupDropdownEditModeChanged = this.onResourceGroupDropdownEditModeChanged.bind(this);
        this.onWorkspaceDropdownEditModeChanged = this.onWorkspaceDropdownEditModeChanged.bind(this);
        this.updateResourceGroupList = this.updateResourceGroupList.bind(this);
        this.updateResourceList = this.updateResourceList.bind(this);
        this.onVmssIntanceChanged = this.onVmssIntanceChanged.bind(this);
        this.onVmssInstanceDropdownEditModeChanged = this.onVmssInstanceDropdownEditModeChanged.bind(this);

        let retryArmDataProvider = new RetryARMDataProvider(new ARMDataProvider(), new RetryPolicyFactory());
        this.vmInsightsOnboardingStatusProvider = new VmInsightsOnboardingDataProvider(retryArmDataProvider, this.props.telemetry);

        let defaultResourceGroups: ResourceInfo[] = this.props.resourceGroups || [defaultResourceGroupInfo];
        let defaultResourceGroupOptions = this.getResourceGroupDropDownOptions(defaultResourceGroups);

        let supportedResourceTypeOptions: DropDownOption[] = this.getResourceTypesDropdownOptions(this.props.supportedResourceTypes);

        let defaultResourceDropdownOptions: DropdownOption[] = this.getVmInsightsResourceDropdownOptions(this.props.resources);
        let defaultWorkspaceDropdowns: DropDownOption[] = this.getWorkSpaceDropDownOptions(this.props.workspaces);
        let defaultVmssInstancesDropdownOptions: DropdownOption[] = this.getVmInsightsResourceDropdownOptions(this.props.vmssInstances);

        this.state = {
            resourceGroups: defaultResourceGroups,
            resourceGroupDropDownOptions: defaultResourceGroupOptions,
            resources: this.props.resources,
            resourceDropDownOptions: defaultResourceDropdownOptions,
            isResourceGroupsInit: false,
            isResourcesInit: false,
            resourceTypeDropDownOptions: supportedResourceTypeOptions,
            workspaceList: this.props.workspaces,
            workspaceDropdownOptions: defaultWorkspaceDropdowns,
            isWorkspacesInit: false,
            vmssInstances: this.props.vmssInstances,
            vmssInstanceDropdownOptions: defaultVmssInstancesDropdownOptions,
            isVmssInstancesInit: false
        };

        this.telemetryPrefix = this.props.logPrefix + '.AzureScaleControlPanel';

        this.calculateStartAndEndTime(props.dateTime);
    }

    public componentDidMount() {
        if (this.props && this.props.displaySettings && this.props.displaySettings.enableWorkspaceDropDown) {
            this.updateWorkspaceList(this.props);
        }
    }

    // TODO: componentWillReceiveProps is deprecated. Use shouldComponentUpdate
    public componentWillReceiveProps(nextProps: Readonly<IAzureScaleControlPanelProps>) {
        if (!nextProps) {
            return;
        }

        // TODO ak: move all this business logic into the blade config
        // Check if selected subscription is changed
        // If selected subscription is changed then we need to update resourceGroup list.
        // If selectedResourceGroup is not specified then selected default resourceGroup.
        // Clear resourceType and resources filter.
        if (nextProps?.selectedSubscriptionInfo.subscriptionId !== this.props.selectedSubscriptionInfo?.subscriptionId) {
            // Do not load resourceGroup now. Just flag that we need to load resourceGroups.
            // Whenever resourceGroups dropdown is opened first time, we can populate with options.
            this.requestToUpdateResourceGroupList = true;
            this.requestToUpdateResourceList = true;
            this.requestToUpdateWorkspaceList = true;
            this.setState({
                isResourceGroupsInit: false,
                isResourcesInit: false,
                resourceGroups: [defaultResourceGroupInfo],
                resourceGroupDropDownOptions: [{ label: defaultResourceGroupInfo.displayName, value: defaultResourceGroupInfo.id }],
                resources: [],
                resourceDropDownOptions: [],
                workspaceDropdownOptions: [],
                workspaceList: [],
                isWorkspacesInit: false
            });
        }

        // Check if selectedResource group is changed.
        // If resouceGroup is changed then clear resourceType and resourcesFilter.
        if (nextProps?.selectedResourceGroupInfo?.id?.toLowerCase() !== this.props.selectedResourceGroupInfo?.id?.toLowerCase()) {
            this.requestToUpdateResourceList = true;
            this.requestToUpdateWorkspaceList = true;
            this.setState({
                isResourcesInit: false,
                resources: [],
                resourceDropDownOptions: [],
                workspaceDropdownOptions: [],
                workspaceList: [],
                isWorkspacesInit: false
            });
        }

        // If resourceType is changed then clear the resources and workspaces
        let resourceTypeChanged: boolean = nextProps.displaySettings && nextProps.displaySettings.enableResourceTypeDropDown
            && nextProps.selectedResourceType !== this.props.selectedResourceType;

        if (resourceTypeChanged) {
            this.requestToUpdateResourceList = true;
            this.requestToUpdateWorkspaceList = true;
            this.setState({
                isResourcesInit: false,
                resources: [],
                resourceDropDownOptions: [],
                workspaceList: [],
                workspaceDropdownOptions: []
            });
            this.computersCache.clear();
        }

        if (nextProps?.selectedResource?.id !== this.props.selectedResource?.id) {
            this.requestToUpdateWorkspaceList = true;
            this.requestToUpdateVmssInstanceList = nextProps.selectedResource.type === VmInsightsResourceType.VirtualMachineScaleSet;
            this.setState({
                workspaceDropdownOptions: [],
                workspaceList: [],
                isWorkspacesInit: false,
                vmssInstanceDropdownOptions: this.requestToUpdateVmssInstanceList ? [] : this.state.vmssInstanceDropdownOptions,
                vmssInstances: this.requestToUpdateVmssInstanceList ? [] : this.state.vmssInstances
            });
        }

        // If workspaceList need to be updated then update the workspaceList here.
        // Parent component has to be notified when the workspaceList is updated at this point.
        // If the workspaceList is empty then we show AtScaleOnboarding section in the UI
        // Instead of showing Perf content or Map content.
        // Initially resourceType is undefined. User has to select the resourceType at least to load workspaces.
        if (nextProps.selectedResourceType
            && this.requestToUpdateWorkspaceList
            && this.props.displaySettings.enableWorkspaceDropDown) {
            this.updateWorkspaceList(nextProps);
        }

        if (this.props.dateTime !== nextProps.dateTime || this.props.forceUpdate) {
            this.calculateStartAndEndTime(nextProps.dateTime);
        }
        if (nextProps.endDateTimeUtc) {
            this._endDateTimeUtc = nextProps.endDateTimeUtc;
        }
    }

    public render(): false | JSX.Element {
        const dropdownDivs: JSX.Element[] = [];

        if (this.props.displaySettings && this.props.displaySettings.enableSubscriptionDropDown) {
            const subscriptionOptions = this.getSubscriptionDropDownResult();
            dropdownDivs.push(<div className='control-panel-drop-down'>
                <TextDropDownPill
                    key={'subscription'}
                    containerId={'subscription-drop-down'}
                    selectedItem={subscriptionOptions.selectedItem}
                    dropDownOptions={subscriptionOptions.options}
                    onSelectionChanged={this.onSubscriptionChanged}
                    areValuesLoading={false}
                    pillLabel={DisplayStrings.SubscriptionSelectorTitle + DisplayStrings.LabelSeperator} />
            </div>);
        }

        if (this.props.displaySettings && this.props.displaySettings.enableResourceGroupDropDown) {
            dropdownDivs.push(<div className='control-panel-drop-down'>
                <TextDropDownPill
                    key={'resource-group'}
                    containerId={'resource-group-drop-down'}
                    selectedItem={this.getResourceGroupSelectedItem()}
                    dropDownOptions={this.state.resourceGroupDropDownOptions}
                    onSelectionChanged={this.onResourceGroupChanged}
                    areValuesLoading={!this.state.isResourceGroupsInit}
                    pillLabel={DisplayStrings.ResourceGroupSelectorTitle + DisplayStrings.LabelSeperator}
                    onEditModeChange={this.onResourceGroupDropdownEditModeChanged} />
            </div>);
        }

        const selectedResourceTypeOption: DropDownOption = this.getResourceTypeSelectedItem();
        if (this.props.displaySettings && this.props.displaySettings.enableResourceTypeDropDown) {
            dropdownDivs.push(<div className='control-panel-drop-down'>
                <TextDropDownPill
                    key={'resource-type'}
                    containerId={'resourcetype-drop-down'}
                    selectedItem={selectedResourceTypeOption}
                    dropDownOptions={this.state.resourceTypeDropDownOptions}
                    onSelectionChanged={this.onResourceTypeChanged}
                    areValuesLoading={false}
                    pillLabel={DisplayStrings.ResourceTypeSelectorTitle + DisplayStrings.LabelSeperator} />
            </div>);
        }

        // We enable resourceDropdown only if the selected resourceType is not 'all'.
        const enableResourcesDropdown: boolean = !StringHelpers.isNullOrEmpty(selectedResourceTypeOption?.value as string)
            && this.props.selectedResourceType !== VmInsightsResourceType.All;

        if (this.props.displaySettings && this.props.displaySettings.enableResourceDropDown && enableResourcesDropdown) {
            dropdownDivs.push(<div className='control-panel-drop-down'>
                <TextDropDownPill
                    key={'resource'}
                    containerId={'resource-drop-down'}
                    selectedItem={this.getResourceSelectedItem()}
                    disableEdit={!this.props.selectedResourceType}
                    dropDownOptions={this.state.resourceDropDownOptions}
                    onSelectionChanged={this.onResourceChanged}
                    areValuesLoading={!this.state.isResourcesInit}
                    pillLabel={DisplayStrings.ResourceSelectorTitle + DisplayStrings.LabelSeperator}
                    onEditModeChange={this.onResourceDropdownEditModeChanged}
                    onInputTextChange={this.onResourceDropdownInputChange}
                />
            </div>);
        }

        // We enable workspaceDropdown only if the selected resourceType is all.
        const enableWorkspaceDropdown: boolean = this.enabledWorkspaceDropdown();
        if (this.props.displaySettings && this.props.displaySettings.enableWorkspaceDropDown && enableWorkspaceDropdown) {
            dropdownDivs.push(<div className='control-panel-drop-down'>
                <TextDropDownPill
                    key={'workspace'}
                    containerId={'workspace-drop-down'}
                    selectedItem={this.getWorkspaceSelectedItem()}
                    dropDownOptions={this.state.workspaceDropdownOptions}
                    onSelectionChanged={this.onWorkspaceChanged}
                    areValuesLoading={!this.state.isWorkspacesInit}
                    pillLabel={DisplayStrings.WorkspaceSelectorTitle + DisplayStrings.LabelSeperator}
                    onEditModeChange={this.onWorkspaceDropdownEditModeChanged} />
            </div>);
        }

        // We enable vmssInstances if the selectedResourceType is VMSS and if user selects a VMSS.
        // We will not enable VMSSInstances if there are no workspaces for the selected VMSS.
        const enableVmssInstace: boolean = this.props.displaySettings && this.props.displaySettings.enableVmssInstanceDropdown
            && this.props.selectedResource && this.props.selectedResource.id
            && this.props.selectedResource.type === VmInsightsResourceType.VirtualMachineScaleSet;
        const isVmssOnboarded: boolean = this.state.workspaceList && this.state.workspaceList.length > 0;
        if (enableVmssInstace && isVmssOnboarded) {
            dropdownDivs.push(<div className='control-panel-drop-down'>
                <TextDropDownPill
                    key={'vmss-instance'}
                    containerId={'vmss-instance-drop-down'}
                    selectedItem={this.getVmssInstanceSelectedItem()}
                    dropDownOptions={this.state.vmssInstanceDropdownOptions}
                    onSelectionChanged={this.onVmssIntanceChanged}
                    areValuesLoading={!this.state.isVmssInstancesInit}
                    pillLabel={DisplayStrings.VmssInstanceSelectorTitle + DisplayStrings.LabelSeperator}
                    onEditModeChange={this.onVmssInstanceDropdownEditModeChanged} />
            </div>);
        }

        // TODO: Need to show vm scale set instances when selected resource is a VMScaleSet.
        return (
            <div className='control-panel maps-control-panel'>
                <div className='control-panel-scopes'>
                    {dropdownDivs}
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
                    showWorkbookDropDown={this.props.displaySettings && this.props.displaySettings.enableWorkbookDropDown}
                    showSwitchToggle={this.props.displaySettings && this.props.displaySettings.enableSwitchToggle}
                    vmScaleSetResourceId={undefined}
                    messagingProvider={this.props.messagingProvider}
                    telemetry={this.props.telemetry}
                    logPrefix={this.props.logPrefix}
                    resourceId={this.props.selectedResource && this.props.selectedResource.id}
                    solutionType={'azure'}
                    onSolutionTypeChanged={this.props.onSolutionTypeChanged}
                    subscriptionInfo={this.props.selectedSubscriptionInfo}
                    resourceGroupInfo={this.props.selectedResourceGroupInfo}
                />
            </div>
        );
    }

    private enabledWorkspaceDropdown(): boolean {
        const resourceTypeIsAll: boolean
            = this.props.selectedResourceType && this.props.selectedResourceType === VmInsightsResourceType.All;
        return this.props.displaySettings && this.props.displaySettings.enableWorkspaceDropDown
            && resourceTypeIsAll;
    }

    /**
     * This method is invoked whenever the computer dropdown is opened.
     * @param editMode
     */
    private onResourceDropdownEditModeChanged(editMode: boolean) {
        if (editMode && this.requestToUpdateResourceList) {
            this.requestToUpdateResourceList = false;
            this.updateResourceList();
        }
    }

    /**
     * This method is invoked whenever group dropdown is opened.
     * @param editMode 
     */
    private onResourceGroupDropdownEditModeChanged(editMode: boolean) {
        if (editMode && this.requestToUpdateResourceGroupList) {
            this.requestToUpdateResourceGroupList = false;
            this.updateResourceGroupList();
        }
    }

    /**
     * This method is invoked whenever workspace dropdown is opened first time
     * for the given selected subscription/resourcegroup.
     * @param editMode
     */
    private onWorkspaceDropdownEditModeChanged(editMode: boolean) {
        if (editMode && this.requestToUpdateWorkspaceList) {
            this.requestToUpdateWorkspaceList = false;
            this.updateWorkspaceList(this.props);
        }
    }

    private onVmssInstanceDropdownEditModeChanged(editMode: boolean) {
        if (editMode && this.requestToUpdateVmssInstanceList) {
            this.requestToUpdateVmssInstanceList = false;
            this.updateVmssInstanceList();
        }
    }

    /**
     * Make request for resourceslist based on state.selectedResourceType
     */
    private updateResourceList() {
        if (!this.props.selectedResourceType) {
            return;
        }

        switch (this.props.selectedResourceType) {
            case VmInsightsResourceType.ServiceMapComputer:
                this.updateServiceMapComputerResources();
                break;
            case VmInsightsResourceType.ServiceMapGroups:
                this.updateServiceMapGroupResources();
                break;
            case VmInsightsResourceType.VirtualMachineScaleSet:
            case VmInsightsResourceType.VirtualMachine:
            case VmInsightsResourceType.AzureArcMachine:
                this.updateAzureResources(this.props.selectedResourceType);
                break;
        }
    }

    /**
     * Get ServiceMap groups
     */
    private updateServiceMapGroupResources() {
        if (!this.props.selectedWorkspace || !this.props.selectedWorkspace.id) {
            return;
        }

        this.serviceMapGroupProvider.getSortedGroups(
            this.props.selectedWorkspace,
            this.props.logPrefix,
            ComputerGroupType.ServiceMapMachineGroup
        ).then((result: ComputerGroup[]) => {
            let resources: ResourceInfo[] = [];
            for (let group of result) {
                resources.push(new ResourceInfo({
                    id: group.id,
                    displayName: group.displayName,
                    fqdn: undefined,
                    location: undefined,
                    type: VmInsightsResourceType.ServiceMapGroups
                }));
            }

            this.setState({
                resources: resources,
                resourceDropDownOptions: this.getComputerGroupDropDownOptions(result),
                isResourcesInit: true
            });

            if (this.props.onResourcesLoaded) {
                this.props.onResourcesLoaded(resources);
            }
        }).catch((error) => {
            this.setState({
                resources: [],
                resourceDropDownOptions: this.getComputerGroupDropDownOptions([]),
                isResourcesInit: true
            });
            this.requestToUpdateResourceList = true;
            if (this.props.onResourcesLoaded) {
                this.props.onResourcesLoaded([]);
            }
        });
    }

    /**
     * get computerGroup drop down list and selected group from the props.
     * default is placehold 'select'.
     */
    private getComputerGroupDropDownOptions(computerGroupList: ComputerGroup[]): DropDownOption[] {
        if (!computerGroupList || computerGroupList.length === 0) {
            return [defaultItem];
        }

        const generatedOptions: Array<DropDownOption> = ControlPanelUtility.generateComputerGroupDropDownOptions(computerGroupList);
        return [defaultItem].concat(generatedOptions);
    }

    /**
     * Get serviceMap computerList
     */
    private updateServiceMapComputerResources(searchFilter?: string) {
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

            this.setState({
                isResourcesInit: false
            });

            getComputerListPromise = this.serviceMapComputerProvider.getSortedComputerList(
                this.props.selectedWorkspace,
                this.maxNumberOfComputerRecordsToLoad,
                searchFilter,
                startAndEnd.start,
                startAndEnd.end,
                this.props.logPrefix,
                undefined
            )
        }
        // getSortedComputerList method is logging the telemetry. No need to log again.
        getComputerListPromise.then((computerList: IComputerList) => {
            if (localSequenceNumber !== this.computerListSequenceNumber) {
                return;
            }

            // Save the result in cache.
            this.computersCache.insert(searchFilter, computerList);

            // If computerList is null/empty for the given non empty searchFilter string
            // then do not set the state.
            if (!StringHelpers.isNullOrEmpty(searchFilter) && computerList.computers.length === 0) {
                this.setState({
                    isResourcesInit: true
                });
                this.computersSearchPrefixWithFullDataLoaded = searchFilter || '';
                return;
            }

            let resources: ResourceInfo[] = [];
            for (let computer of computerList.computers) {
                resources.push(new ResourceInfo({
                    id: computer.id,
                    location: undefined,
                    displayName: computer.displayName,
                    fqdn: computer.computerName,
                    type: VmInsightsResourceType.ServiceMapComputer
                }));
            }

            // If searchFilter value is not empty then do not set computerList.hasMore to this.state.hasMoreComputersToLoad
            this.setState({
                resourceDropDownOptions: this.getComputerDropDownOptions(computerList.computers, computerList.hasMore),
                isResourcesInit: true,
                resources: resources
            });

            if (!computerList.hasMore) {
                this.computersSearchPrefixWithFullDataLoaded = searchFilter || '';
            } else {
                this.computersSearchPrefixWithFullDataLoaded = undefined;
            }

            if (this.props.onResourcesLoaded) {
                this.props.onResourcesLoaded(resources);
            }
        }).catch((error) => {
            if (localSequenceNumber !== this.computerListSequenceNumber) {
                // TODO: should we log the error?
                return;
            }
            this.setState({
                resourceDropDownOptions: [defaultItem],
                resources: [],
                isResourcesInit: true
            });
            this.requestToUpdateResourceList = true;
            if (this.props.onResourcesLoaded) {
                this.props.onResourcesLoaded([]);
            }
        });
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

        options.push(defaultItem);
        const computers = computerList || [];
        for (const computer of computers) {
            if (computer && computer.displayName && computer.id) {
                const option = { label: computer.displayName, value: computer.id };
                options.push(option);
            }
        }

        if (hasMoreComputers) {
            options.push({
                label: DisplayStrings.RefineSelection,
                value: 'Refine selection for more entries',
                disabled: true
            });
        }
        return options;
    }

    private updateAzureResources(type: VmInsightsResourceType) {
        this.azureResourceProvider.getAzureResources(this.getAzureResourcesQueryParams(type))
            .then(
                (result: ResourceInfo[]) => {
                    this.props.telemetry.logEvent(this.telemetryPrefix + '.' + type + 'ListLoaded', {
                        resourceCount: '' + (result && result.length),
                        selectedResource: this.props.selectedResource && this.props.selectedResource.id
                    }, {});
                    this.setState({
                        resources: result,
                        resourceDropDownOptions: this.getVmInsightsResourceDropdownOptions(result),
                        isResourcesInit: true
                    });

                    if (this.props.onResourcesLoaded) {
                        this.props.onResourcesLoaded(result);
                    }
                }).catch((error) => {
                    this.setState({
                        resourceDropDownOptions: [defaultItem],
                        resources: [],
                        isResourcesInit: true
                    });
                    this.requestToUpdateResourceList = true;
                    if (this.props.onResourcesLoaded) {
                        this.props.onResourcesLoaded([]);
                    }
                });
    }

    private getVmInsightsResourceDropdownOptions(resources: ResourceInfo[]): DropDownOption[] {
        if (!resources || resources.length === 0) {
            return [];
        }

        const options: DropDownOption[] = [];
        for (const resource of resources) {
            if (resource && resource.displayName && resource.id) {
                const option = { label: resource.displayName, value: resource.id };
                options.push(option);
            }
        }
        return options;
    }

    private computerDropdownInputChangeEventHandler(): void {
        // Check if the data available is fully loaded for the given searchString.
        if ((this.props.selectedResourceType !== VmInsightsResourceType.VirtualMachine
            && this.props.selectedResourceType !== VmInsightsResourceType.AzureArcMachine)
            || (this.computersSearchPrefixWithFullDataLoaded !== undefined
                && this.computerDropdownInputText.startsWith(this.computersSearchPrefixWithFullDataLoaded))) {
            return;
        }
        this.updateServiceMapComputerResources(this.computerDropdownInputText);
        this.dropdownInputChangeRateLimitTimer = null;
    }

    private onResourceDropdownInputChange(newValue: string): void {
        // If the selected resourceType is VirtualMachine/Azure Arc Machine then only process the event.
        if (this.props.selectedResourceType !== VmInsightsResourceType.VirtualMachine
            && this.props.selectedResourceType !== VmInsightsResourceType.AzureArcMachine) {
            return;
        }

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

    /**
     * make request for resourceGroup list based on state.selectedSubscription
     */
    private updateResourceGroupList() {
        let groups: ResourceInfo[] = [defaultResourceGroupInfo];
        this.requestToUpdateResourceGroupList = false;
        this.azureResourceProvider.getAzureResources(this.getAzureResourcesQueryParams(VmInsightsResourceType.ResourceGroup))
            .then((result: ResourceInfo[]) => {
                this.props.telemetry.logEvent(this.telemetryPrefix + '.ResourceGroupListLoaded', {
                    resourceGroupsCount: '' + (result && result.length),
                    subscriptionId: this.props.selectedSubscriptionInfo.subscriptionId
                }, {});
                groups = groups.concat(result);
                this.setState({
                    resourceGroups: groups,
                    resourceGroupDropDownOptions: this.getResourceGroupDropDownOptions(groups),
                    isResourceGroupsInit: true
                });
                if (this.props.onResourceGroupsLoaded) {
                    this.props.onResourceGroupsLoaded(groups);
                }
            }).catch((error) => {
                this.setState({
                    resourceGroupDropDownOptions: this.getResourceGroupDropDownOptions(groups),
                    resourceGroups: groups,
                    isResourceGroupsInit: true
                });
                this.requestToUpdateResourceGroupList = true;
                if (this.props.onResourceGroupsLoaded) {
                    this.props.onResourceGroupsLoaded(groups);
                }
            });
    }

    /**
     * Gets the workspaces for the given selected subscription/ResourceGroup
     */
    private updateWorkspaceList(props: IAzureScaleControlPanelProps): void {
        // We define selected resourceId based on below conditions.
        // 1. If there is a selected resource 'Computer' or 'VMSS' then we use selectedResource to get workspaceList.
        // 2. If the selectedResource is 'All' but resourceGroup is selected then we use resourceGroup to query workspaceList
        // 3. Else we use selected subscription to query workspacelist.

        const selectedResource: ResourceInfo = new ResourceInfo(props.selectedResource);
        if (selectedResource.IsDefault() || !this.vmInsightsOnboardingStatusProvider || !selectedResource.id) {
            return;
        }

        this.requestToUpdateWorkspaceList = false;
        this.vmInsightsOnboardingStatusProvider.GetVmInsightsOnboardingStatus(
            {
                resourceId: selectedResource.id, headers: {}, telemetryPrefix: this.telemetryPrefix
            })
            .then((workspaceList: IWorkspaceInfo[]) => {
                this.props.telemetry.logEvent(this.telemetryPrefix + '.WorkspaceListLoaded', {
                    workspacesCount: '' + (workspaceList && workspaceList.length),
                    resourceId: selectedResource.id
                }, {});
                this.setState({
                    workspaceList: workspaceList,
                    workspaceDropdownOptions: this.getWorkSpaceDropDownOptions(workspaceList),
                    isWorkspacesInit: true
                });
                if (props.onWorkspacesLoaded) {
                    props.onWorkspacesLoaded(workspaceList);
                }
            }).catch((error) => {
                this.setState({
                    workspaceList: undefined,
                    workspaceDropdownOptions: undefined,
                    isWorkspacesInit: false
                });
                this.requestToUpdateWorkspaceList = true;
                // TODO: Show warning or error icon at workspace dropdown.
            });
    }

    private updateVmssInstanceList(): void {
        let vmssInstances: ResourceInfo[] = [defaultVmssInstance];
        const queryParams: GetAzureResourcesQueryParams = this.getAzureResourcesQueryParams(VmInsightsResourceType.VmScaleSetInstance);
        queryParams.nestedResourceId = this.props?.selectedResource?.id;
        this.azureResourceProvider.getAzureResources(queryParams).then(
            (result: ResourceInfo[]) => {
                vmssInstances = vmssInstances.concat(result);
                this.setState({
                    vmssInstances: vmssInstances,
                    vmssInstanceDropdownOptions: this.getVmInsightsResourceDropdownOptions(vmssInstances),
                    isVmssInstancesInit: true
                });
                if (this.props.onVmssInstancesLoaded) {
                    this.props.onVmssInstancesLoaded(result);
                }
            }).catch((error) => {
                this.setState({
                    vmssInstanceDropdownOptions: this.getVmInsightsResourceDropdownOptions(vmssInstances),
                    vmssInstances: vmssInstances,
                    isVmssInstancesInit: true
                });
            });
    }

    /**
     * Get all subscription list dropdown options
     */
    private getSubscriptionDropDownResult(): IDropDownResult {
        const options: DropDownOption[] = [];
        let selectedItem: DropDownOption = defaultItem;

        const sortedSubscriptionList: ISubscriptionInfo[] = this.props.subscriptionsList || [];
        const selectedSubscriptionId: string | undefined
            = this.props.selectedSubscriptionInfo && this.props.selectedSubscriptionInfo.subscriptionId;

        sortedSubscriptionList.map((subscription: ISubscriptionInfo) => {
            // construct dropdown list
            const option: DropDownOption = { label: subscription.displayName, value: subscription.subscriptionId };
            options.push(option);

            // set selected item if it's in the subscription list
            if (!!selectedSubscriptionId) {
                const subscriptionId: string = subscription && subscription.subscriptionId && subscription.subscriptionId.toLowerCase()
                if (selectedSubscriptionId.toLowerCase() === subscriptionId) {
                    selectedItem = option;
                }
            }
        });

        return { options, selectedItem };
    }

    /**
     * Creates dropdown options for resource groups 
     * @param resourceGroupList List of resourceGroup objects
     */
    private getResourceGroupDropDownOptions(resourceGroupList: ResourceInfo[]): DropDownOption[] {
        if (!resourceGroupList || resourceGroupList.length === 0) {
            return [];
        }

        const generatedOptions: Array<DropDownOption> = [];
        for (let group of resourceGroupList) {
            if (!group.displayName || !group.id) {
                continue;
            }
            generatedOptions.push({ label: group.displayName, value: group.id });
        }

        return generatedOptions;
    }

    /**
     * Creates dropdown options for given resource types.
     * @param resourceTypes 
     */
    private getResourceTypesDropdownOptions(resourceTypes: VmInsightsResourceType[]): DropdownOption[] {
        if (!resourceTypes || resourceTypes.length === 0) {
            return [];
        }

        const resourceTypeOptions: Array<DropDownOption> = [];
        for (let resourceType of resourceTypes) {
            if (!StringHelpers.isNullOrEmpty(resourceType)) {
                resourceTypeOptions.push({
                    label: this.getResourceTypeLabel(resourceType),
                    value: resourceType
                });
            }
        }

        return resourceTypeOptions;
    }

    private getResourceTypeLabel(resourceType: VmInsightsResourceType): string {
        switch (resourceType) {
            case VmInsightsResourceType.All:
                return DisplayStrings.ResourceTypeAll;
            case VmInsightsResourceType.ResourceGroup:
                return DisplayStrings.ResourceTypeResourceGroup;
            case VmInsightsResourceType.ServiceMapGroups:
                return DisplayStrings.ResourceTypeServiceMapGroup;
            case VmInsightsResourceType.VirtualMachine:
                return DisplayStrings.ResourceTypeVirtualMachine;
            case VmInsightsResourceType.ServiceMapComputer:
                return DisplayStrings.ResourceTypeServiceMapComputer;
            case VmInsightsResourceType.VirtualMachineScaleSet:
                return DisplayStrings.ResourceTypeVMSS;
            case VmInsightsResourceType.AzureArcMachine:
                return DisplayStrings.ResourceTypeAzureArc;
            default:
                return '';
        }
    }

    /**
     * Get all workspace list and selected workspace from the workspaceManager
     */
    private getWorkSpaceDropDownOptions(workspaceList: IWorkspaceInfo[]): DropdownOption[] {
        const options: DropdownOption[] = [];
        const sortedWorkspaceList = workspaceList || [];
        for (let i = 0; i < sortedWorkspaceList.length; i++) {
            const workspace = sortedWorkspaceList[i];
            if (workspace && workspace.name && workspace.id) {
                const option = { label: workspace.name, value: workspace.id };
                options.push(option);
            }
        }

        return options;
    }

    private getResourceGroupSelectedItem(): DropDownOption {
        const selectedResourceGroup: ResourceInfo = this.props.selectedResourceGroupInfo;
        const resourceGroups: ResourceInfo[] = this.state.resourceGroups;
        if (selectedResourceGroup && selectedResourceGroup.id && resourceGroups && resourceGroups.length === 1
            && resourceGroups[0] && resourceGroups[0].id === 'all') {

            const value: string = selectedResourceGroup.id;
            const label: string = selectedResourceGroup.displayName || value;

            return { label, value };
        }

        if (!selectedResourceGroup || !selectedResourceGroup.id
            || !this.state.resourceGroupDropDownOptions || this.state.resourceGroupDropDownOptions.length === 0) {
            return { label: defaultResourceGroupInfo.displayName, value: defaultResourceGroupInfo.id };
        }

        for (const groupOption of this.state.resourceGroupDropDownOptions) {
            if (groupOption.value && ((groupOption.value as string).toLowerCase()
                === this.props.selectedResourceGroupInfo.id.toLowerCase())) {
                return groupOption;
            }
        }

        return { label: defaultResourceGroupInfo.displayName, value: defaultResourceGroupInfo.id };
    }

    /**
     * Get selected workspace option
     */
    private getWorkspaceSelectedItem(): DropdownOption {
        const defaultWorkspaceOption: DropdownOption = { label: DisplayStrings.Select, value: '' };
        if (!this.props.selectedWorkspace || !this.props.selectedWorkspace.id
            || !this.state.workspaceDropdownOptions || this.state.workspaceDropdownOptions.length === 0) {
            return defaultWorkspaceOption;
        }

        for (let workspaceOption of this.state.workspaceDropdownOptions) {
            if (workspaceOption.value && ((workspaceOption.value as string).toLowerCase()
                === this.props.selectedWorkspace.id.toLowerCase())) {
                return workspaceOption;
            }
        }

        return defaultWorkspaceOption;
    }

    private getResourceTypeSelectedItem(): DropDownOption {
        const defaultResourceTypeOption: DropdownOption = { label: DisplayStrings.Select, value: '' };
        const resourceTypeDropDownOptions: PillOption[] = this.state.resourceTypeDropDownOptions;

        if (!resourceTypeDropDownOptions || resourceTypeDropDownOptions.length === 0) {
            return defaultResourceTypeOption;
        }

        if (!this.props.selectedResourceType) {
            return resourceTypeDropDownOptions[0];
        }

        for (const resourceTypeOption of resourceTypeDropDownOptions) {
            if (resourceTypeOption.value === this.props.selectedResourceType) {
                return resourceTypeOption;
            }
        }

        return defaultResourceTypeOption;
    }

    private getResourceSelectedItem(): DropdownOption {
        const defaultResourceOption: DropdownOption = { label: DisplayStrings.Select, value: '' };
        if (!this.props.selectedResource || !this.props.selectedResource.id) {
            return defaultResourceOption;
        }

        const validDefaultResourceType: boolean = this.props.selectedResource.type === VmInsightsResourceType.VirtualMachine
            || this.props.selectedResource.type === VmInsightsResourceType.VirtualMachineScaleSet
            || this.props.selectedResource.type === VmInsightsResourceType.VmScaleSetInstance
            || this.props.selectedResource.type === VmInsightsResourceType.AzureArcMachine;
        if (validDefaultResourceType && !(this.state.resourceDropDownOptions?.length > 0)) {
            return { label: this.props.selectedResource.displayName, value: this.props.selectedResource.id };
        }

        for (let resourceOption of this.state.resourceDropDownOptions) {
            if (resourceOption.value === this.props.selectedResource.id) {
                return resourceOption;
            }
        }

        return defaultResourceOption;
    }

    private getVmssInstanceSelectedItem(): DropDownOption {
        const defaultOption: DropdownOption = { label: DisplayStrings.Select, value: '' };
        if (!this.props.selectedVmssInstance || !this.props.selectedVmssInstance.id) {
            return defaultOption;
        }

        for (let option of this.state.vmssInstanceDropdownOptions) {
            if (option.value === this.props.selectedVmssInstance.id) {
                return option;
            }
        }

        return { label: this.props.selectedVmssInstance.displayName, value: this.props.selectedVmssInstance.id };
    }

    /**
     * user select subscription in dropdown list
     * won't return null
     * @param selectedSubscriptionId
     */
    private onSubscriptionChanged(selectedSubscriptionId: string): void {
        this.props.telemetry.logEvent(this.telemetryPrefix + '.SubscriptionChanged', { selectedSubscriptionId },
            undefined);

        let selectedSubscription: ISubscriptionInfo = null;
        for (let i = 0; i < this.props.subscriptionsList.length; i++) {
            if (this.props.subscriptionsList[i].subscriptionId.toLowerCase() === selectedSubscriptionId.toLowerCase()) {
                selectedSubscription = this.props.subscriptionsList[i];
                break;
            }
        }

        if (!selectedSubscription) {
            throw 'cound not find subscription from subscription dropdown list, which is impossible';
        }

        // TODO: Send subscription change notification to the blade.
        this.props.onSelectionsChanged({
            type: AzureControlPanelDropDownType.subscription,
            selectedSubscription: selectedSubscription
        });
    }

    /**
     * user select resource group from drop down list
     * @param selectedResourceGroupId
     */
    private onResourceGroupChanged(selectedResourceGroupId: string): void {
        this.props.telemetry.logEvent(this.props.logPrefix + '.ResourceGroupChanged',
            { selectedResourceGroupId }, undefined);

        let selectedResourceGroup: ResourceInfo = null;
        for (let i = 0; i < this.state.resourceGroups.length; i++) {
            if (this.state.resourceGroups[i].id.toLowerCase() === selectedResourceGroupId.toLowerCase()) {
                selectedResourceGroup = this.state.resourceGroups[i];
                break;
            }
        }

        if (!selectedResourceGroup) {
            throw 'cound not find resourceGroup from resourceGroup dropdown list, which is impossible';
        }

        this.props.onSelectionsChanged({
            type: AzureControlPanelDropDownType.resourceGroup,
            selectedResourceGroup: selectedResourceGroup
        });
    }

    /**
     * user select computer from drop down list
     * @param selectedComputerId
     */
    private onResourceTypeChanged(selectedResourceType: string): void {
        this.props.telemetry.logEvent(this.telemetryPrefix + '.ResourceTypeChanged', { selectedResourceType }, undefined);
        this.props.onSelectionsChanged({
            type: AzureControlPanelDropDownType.resourceType,
            selectedResourceType: VmInsightsResourceType[selectedResourceType]
        })
    }

    /**
     * user select computer from drop down list
     * @param selectedComputerId
     */
    private onResourceChanged(selectedResourceId: string): void {
        if (StringHelpers.isNullOrEmpty(selectedResourceId)) {
            return
        }
        this.props.telemetry.logEvent(this.telemetryPrefix + '.ResourceChanged', { selectedResourceId }, undefined);
        let selectedResource: ResourceInfo = null;
        for (const resource of this.state.resources) {
            if (resource.id.toLowerCase() === selectedResourceId?.toLowerCase()) {
                selectedResource = resource;
                break;
            }
        }

        if (!selectedResource) {
            throw 'cound not find resource from resources dropdown list, which is impossible';
        }

        this.props.onSelectionsChanged({
            type: AzureControlPanelDropDownType.resource,
            selectedResource: selectedResource
        })
    }

    private onVmssIntanceChanged(selectedInstanceId: string): void {
        if (StringHelpers.isNullOrEmpty(selectedInstanceId)) {
            return
        }
        this.props.telemetry.logEvent(this.telemetryPrefix + '.VmssInstanceChanged', { selectedInstanceId }, undefined);
        let selectedResource: ResourceInfo = null;
        for (const instance of this.state.vmssInstances) {
            if (instance.id.toLowerCase() === selectedInstanceId.toLowerCase()) {
                selectedResource = instance;
                break;
            }
        }

        if (!selectedResource) {
            throw 'cound not find vmss instance from vmssInstances dropdown list, which is impossible';
        }

        this.props.onSelectionsChanged({
            type: AzureControlPanelDropDownType.vmssInstance,
            selectedVmssInstance: selectedResource
        })
    }

    /**
     * user select workspace in dropdown list
     * won't return null
     * @param selectedWorkspaceId
     */
    private onWorkspaceChanged(selectedWorkspaceId: string): void {
        this.props.telemetry.logEvent(this.telemetryPrefix + '.WorkspaceChanged', { selectedWorkspaceId }, undefined);

        let selectedWorkspace: IWorkspaceInfo = null;
        for (let i = 0; i < this.state.workspaceList.length; i++) {
            if (this.state.workspaceList[i].id.toLowerCase() === selectedWorkspaceId.toLowerCase()) {
                selectedWorkspace = this.state.workspaceList[i];
                break;
            }
        }

        if (!selectedWorkspace) {
            throw 'cound not find workspace from workspace dropdown list, which is impossible';
        }

        this.props.onSelectionsChanged({
            type: AzureControlPanelDropDownType.workspace,
            selectedWorkspace: selectedWorkspace
        });
    }

    /**
     * user select time
     * @param time
     */
    private onTimeRangeChanged(time: TimeData): void {
        const telemetryStartAndEndTime = TelemetryUtils.getDateTimeRangeForTelemetry(time);
        this.props.telemetry.logEvent(
            this.telemetryPrefix + '.TimeRangeChanged', telemetryStartAndEndTime, undefined);
        this.props.onSelectionsChanged({
            type: AzureControlPanelDropDownType.time,
            selectedTimeRange: time
        });
    }

    private getAzureResourcesQueryParams(resourceType: VmInsightsResourceType): GetAzureResourcesQueryParams {
        const subscriptionId: string = this.props.selectedSubscriptionInfo.subscriptionId;
        const resourceGroupName: string = this.props.selectedResourceGroupInfo
            && this.props.selectedResourceGroupInfo.id !== defaultResourceGroupInfo.id ? this.props.selectedResourceGroupInfo.displayName
            : undefined;
        return {
            subscriptionId,
            resourceGroupName,
            resourceType: resourceType
        }
    }

    private calculateStartAndEndTime(dateTime: TimeData): void {
        const startAndEnd = TimeInterval.getStartAndEndDate(dateTime, isRelative(dateTime));
        if (startAndEnd) {
            this._endDateTimeUtc = startAndEnd.end;
        }
    }
}
