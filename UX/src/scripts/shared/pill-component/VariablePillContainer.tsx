/** tpl */
import * as React from 'react';
import * as moment from 'moment';
import * as update from 'immutability-helper';
import findIndex = require('array.prototype.findindex');
import {
    PillContainerProps,
    AddButtonStatus,
    PillContainer,
    FilterPillConfig,
    FilterOption,
    PillParameters,
    getFilterContentProvider,
    FilterSelection,
    SelectionChangeType,
    DropdownPillConfig,
    getDropdownContentProvider,
    PillOption,
    TimePillConfig,
    TimeData,
    TimeValues,
    IPillContentProvider,
    RangeValidation,
    TimeDataAbsolute,
    Validation,
    TimePillProps,
    getTextContentProvider,
    TextPillConfig
} from '@appinsights/pillscontrol-es5';
import { String } from 'typescript-string-operations';

/** local */
import { IWorkspaceInfo } from '../IWorkspaceInfo';
import {
    IStandAloneContainerControlPanelProps,
    IInBladeContainerControlPanelProps,
} from '../../container/control-panel/ContainerControlPanel';
import { DisplayStrings } from '../DisplayStrings';
import { AddFilterIcon } from '../svg/AddFilterIcon';
import { StringHelpers } from '../Utilities/StringHelpers';
import { PillDimension } from '../../container/control-panel/PillProvider';
import { IContainerControlPanelFilterSelections } from '../../container/control-panel/ContainerControlPanelSelections';

/**
 * Wrapper around the pillcontrol version of this, which is itself just
 * a wrapper around Option from react... but this one is *our* wrapper!
 */
export interface IPillLinkedValue {
    value: string;
    label: string;
}

/**
 * Wrapper around details we require for pills... there is probably some
 * internal object inside pillcontrol this is similar too, but we
 * use this for activePills in our state..
 */
export interface IPillWrapper {
    pillId: string;
    pillDimension: string;
}

/**
 * Dimension options are the pill control options... when you add a pill
 * both left and right hand side of the pill are empty, you must then select
 * the left right (ie: Node, Cluster, Namespace, etc), these options include
 * defaultValues (any, any but kube-system, etc) and an option to force
 * the pill to stay on screen always (ie. Workspace and Time pills)
 */
export interface IDimensionOption {
    dimensionName: string;
    defaultValues?: IPillLinkedValue[];
    removable: boolean;
}

/**
 * Properties for this control...
 */
export interface VariablePillContainerProps {
    dimensionOptions: StringMap<IDimensionOption>;
    variablePillData: StringMap<string[]>;
    selectedWorkspace: IWorkspaceInfo;
    selectedTimeRange: TimeData;
    pillDataLoading: boolean;
    hideAddButton?: boolean;  /** may want to hide add button */
    onAddNullPill: () => void;
    onPillValueChanged: (dimension: string, value: string) => Promise<any>;
    onWorkspaceChanged: (newWorkspaceId: string) => Promise<any>;
    onTimeRangeChanged: (timeRange: TimeData) => void;
    onRemovePill: (dimension: string) => void;
    options: IInBladeContainerControlPanelProps | IStandAloneContainerControlPanelProps;
    pillSelections: IContainerControlPanelFilterSelections; /** pill selections provided from navigation to CI from another page */
    timeControlSupportedTimeSelections: TimeValues[]; /** date time control allowed time selections */
}

/**
 * Control state...
 */
export interface VariablePillContainerState {
    activePills: IPillWrapper[];
    controllerNameText: string;
}

/**
 * Sometimes, when the MultiCluster page navigates to CI, to facilitate drilldown, it will want to apply filters
 * like only show user pods or only show system pods. This mapping provides the ME a contract for doing that. ME passes
 * down the terms 'user-pods' or 'system-pods' down through props, and this map will do the work of supplying pills and queries
 * the correct values so that the filters work
 */
export const userAndSystemPodPillOptions = {
    'user-pods': {
        label: '<All but kube-system>',
        value: '~'
    },
    'system-pods': {
        label: 'kube-system',
        value: 'kube-system'
    }
};

const CONTAINER_ID = 'variable-pill-container';

/**
 * Variable pill container... this is a wrapper around the PillContainer class, capable of
 * generating and removing pills supporting wrapping for example.  This class also ensures some
 * special handling around Workspace and Time selection if those two controls are added (special
 * names for those pills must be 'Workspace' and 'TimeRange' respectively)
 */
export class VariablePillContainer extends React.Component<VariablePillContainerProps, VariablePillContainerState> {
    /**
     * we need pill id's to be unique in the context of the instance of this
     * class... we'll just start at 0 and increment... if someone adds and removes enough pills
     * to run out of numbers, i will buy them a cookie (of my choice)!
     */
    private nextPillId: number = 0;
    private appliedPillSelections: any = {};
    /**
     * sharing this with both the pill translation engine and our own label engine since they
     * effectively work the same. Everything for pills is done in English but the value
     * shown (label) is translated last minute before handing over to the dropdown
     */
    private pillTranslations: StringMap<string> = null;

    /**
     * .ctor()
     * @param props react properties
     */
    constructor(props: VariablePillContainerProps) {
        super(props);

        this.onRemovePill = this.onRemovePill.bind(this);
        this.onAddPill = this.onAddPill.bind(this);

        this.pillTranslations = {
            AddPillTooltip: DisplayStrings.ContainerAddFilter,
            [PillDimension.TimeRange.toString()]: DisplayStrings.TimeRangeSelectorTitle,
            [PillDimension.Workspace.toString()]: DisplayStrings.WorkspaceSelectorTitle,
            [PillDimension.Cluster.toString()]: DisplayStrings.ClusterSelectorTitle,
            [PillDimension.Service.toString()]: DisplayStrings.ServiceNameSelectorTitle,
            [PillDimension.Node.toString()]: DisplayStrings.HostNameSelectorTitle,
            [PillDimension.Namespace.toString()]: DisplayStrings.NameSpaceSelectorTitle,
            [PillDimension.NodePool.toString()]: DisplayStrings.NodePoolNameSelectorTitle,
            [PillDimension.ControllerName.toString()]: DisplayStrings.ControllerNameSelectorTitle,
            [PillDimension.ControllerKind.toString()]: DisplayStrings.ControllerKindSelectorTitle
        };

        this.state = {
            controllerNameText: this.props.pillSelections.controllerName,
            activePills: this.defaultActivePills(this.props)
        };
    }

    /**
     * React component lifecylce that runs once when the component is first rendered on the DOM
     * Is responsible for generating configured pills based on any pill selections passed during navigation to CI
     */
    public componentDidMount() {
        // Apply pill selections passed down from a navigation event
        if (this.props.pillSelections) {
            const dimensions = Object.keys(this.props.dimensionOptions) as PillDimension[];
            dimensions.forEach((dimension: PillDimension) => {
                if (this.isThereAPillSelectionForThisDimension(dimension)) {
                    this.appliedPillSelections[dimension] = false;
                    this.onAddPill(CONTAINER_ID, dimension); // just got to add an unconfigured pill
                }
            });
        }
    }

    /**
     * Return the list of unremovable pills... in certain events like pill load and
     * pill refresh we clear the pill container of all pills... we need to put
     * the unremovable pills back in those situations into the active pill list.
     * @param props source of the dimension options...
     */
    public defaultActivePills(props: VariablePillContainerProps): IPillWrapper[] {
        const activePills: IPillWrapper[] = [];
        const optionKeys = Object.keys(props.dimensionOptions);
        optionKeys.forEach((optionKey) => {
            const dimensionOption = props.dimensionOptions[optionKey];
            if (!dimensionOption.removable) {
                const name = dimensionOption.dimensionName;
                activePills.push({ pillId: name, pillDimension: name });
            }
        });
        return activePills;
    }

    /**
     * react render()
     * @return primary element of control
     */
    public render(): JSX.Element {
        const activePills = this.state.activePills;
        const allDimensions = Object.keys(this.props.dimensionOptions);

        const pills: PillParameters[] = activePills.map(({ pillId, pillDimension }) => {
            return this.generatePillParameters(pillId, pillDimension as PillDimension);
        });

        const containerProps: PillContainerProps = {
            containerId: CONTAINER_ID,
            pills,
            addButtonStatus: this.getAddButtonStatus(activePills, allDimensions),
            onRemove: this.onRemovePill,
            onAdd: this.onAddPill,
            addIcon: <AddFilterIcon />,
            addLabel: DisplayStrings.ContainerAddFilter,
            alwaysShowLabel: true,
            className: 'variable-pill-container',
        };

        return <PillContainer {...containerProps} />
    }

    /**
     * The list of available dimensions will diminish with each selection...
     * we dont want someone to filter "node" twice for example (when we do support
     * this we'll do multi-select within the pill).  this function will return
     * the list of dimensions that are still available.
     * @param pillId pill id we want a dimension for (unique number to reference activePills with)
     */
    private generateDimensionList(pillId: string): FilterOption[] {
        const filterOptions: FilterOption[] = [];

        const dimensionKeys: string[] = Object.keys(this.props.dimensionOptions);
        dimensionKeys.filter((optionKey: string) => {
            const dimensionOption = this.props.dimensionOptions[optionKey];
            let result = findIndex(this.state.activePills, (activePill) => { // Filter the dimension list by the active pills
                if (activePill.pillId === pillId) { return false; } // e.g. a Node pill shoudl not see Node as a dimension
                return activePill.pillDimension === dimensionOption.dimensionName;
            });
            if (optionKey === PillDimension.ControllerName || // For the time being, these pills will not be useable by customers
                optionKey === PillDimension.ControllerKind
            ) { result = 1 }
            return result < 0; // if there isn't an active pill for the pillDimension, add it to the dimension picker list
        }).forEach((pillOption) => {
            filterOptions.push({ label: this.pillTranslations[pillOption], value: pillOption });
        });
        return filterOptions;
    }

    /**
     * Pill parameters are the work horse of the pill engine, this function will
     * generate one for a given pillId (and optional dimension name)... based
     * on the activePills.  There are special cases here for Workspace (standard dropdown)
     * and TimeRange (time pill)
     * @param pillId active (hopefully?) pillId to get pill params for
     * @param pillDimension dimension we are targetting
     */
    private generatePillParameters(pillId: string, pillDimension?: PillDimension): PillParameters {
        let pillContent: IPillContentProvider<any> = null;

        let unRemovable = false;
        let autoExpand = true;

        if (!!pillDimension) {
            const dimensionOption = this.props.dimensionOptions[pillDimension];
            unRemovable = !dimensionOption.removable;
            autoExpand = dimensionOption.removable;
        }

        let pillLabel: string;

        switch (pillDimension) {
            case PillDimension.Workspace:
                pillContent = getDropdownContentProvider(this.generateWorkspacePillConfig(pillId));
                pillLabel = DisplayStrings.WorkspaceSelectorTitle + DisplayStrings.EqualsLabelSeperator;
                break;
            case PillDimension.TimeRange:
                pillContent = this.getTimeContentProvider(this.generateTimeFilterPillConfig(pillId));
                pillLabel = DisplayStrings.TimeRangeSelectorTitle + DisplayStrings.EqualsLabelSeperator;
                break;
            case PillDimension.ControllerName:
                let text: string = this.state.controllerNameText;
                if (!!pillDimension &&
                    this.isThereAPillSelectionForThisDimension(pillDimension) &&
                    this.appliedPillSelections[pillDimension] === false
                ) {
                    text = this.props.pillSelections.controllerName
                    this.appliedPillSelections[pillDimension] = true;
                    autoExpand = false;
                }

                pillContent = getTextContentProvider(this.generateTextPillConfig(pillId, pillDimension, text));
                pillLabel = DisplayStrings.ControllerNameSelectorTitle + DisplayStrings.EqualsLabelSeperator;
                break;
            default:
                // Gets the selection value for the pill dimension that has been passed on navigation
                let selection: FilterSelection;
                if (!!pillDimension &&
                    this.isThereAPillSelectionForThisDimension(pillDimension) &&
                    this.appliedPillSelections[pillDimension] === false
                ) {
                    selection = this.getPillSelectionFromProps(pillDimension);
                    if (selection) { autoExpand = false; }
                }

                pillContent = getFilterContentProvider(this.generateFilterPillConfig(pillId, pillDimension, selection));
                break;
        }

        return {
            pillId,
            pillContent,
            unRemovable,
            autoExpand,
            pillLabel,
        };
    }

    /**
     * Note: use only for monitoring extension experiences.. inblade this wont work
     * utilize the workspaceManager to load a list of options for the workspace list
     * @returns pilloption array
     */
    private buildWorkspaceOptions(): PillOption[] {
        const options: PillOption[] = [];

        // bbax: this code will only work Stand-Alone.... please don't try to use inblade
        const standAlongProps = this.props.options as IStandAloneContainerControlPanelProps;
        if (!standAlongProps) { return options; }

        const sortedWorkspaceList = standAlongProps.workspaceManager.getOrderedList();

        if (sortedWorkspaceList) {
            for (let i = 0; i < sortedWorkspaceList.length; i++) {
                const workspace = sortedWorkspaceList[i];
                if (workspace) {
                    const optionElement = { value: workspace.id, label: workspace.name };
                    options.push(optionElement);
                }
            }
        }

        return options;
    }

    /**
     * Workspace Only... do not use for inblade experience
     * Each configured pill will be given these properties.. the pill provider
     * will invoke this function for each pill it creates letting us inject ourselves
     * into a few key areas of pill interactions.
     * @param pillId (unused) required by contract
     */
    private generateWorkspacePillConfig(pillId: string): DropdownPillConfig {
        let values = this.buildWorkspaceOptions();
        let selected = { value: this.props.selectedWorkspace.id, label: this.props.selectedWorkspace.name };

        return {
            onSelectionChange: (selection) => {
                this.handleWorkspaceSelectionChanged(selection);
            },
            areValuesLoading: false,
            selection: [selected],
            valuesList: values,
            autoOpen: false,
            ariaLabel: DisplayStrings.ContainerWorkspacePillAriaLabel,
        };
    }

    /**
     * TimeRange pills only
     * Each configured pill will be given these properties.. the pill provider
     * will invoke this function for each pill it creates letting us inject ourselves
     * into a few key areas of pill interactions.
     * @param pillId (unused) required by contract
     */
    private generateTimeFilterPillConfig(pillId: string): TimePillConfig {
        return {
            onTimeUpdated: this.props.onTimeRangeChanged,
            timeData: this.props.selectedTimeRange,
            timeGrainOptions: {
                disableTimeGrainSelection: true
            },
            disableZoneSelection: true,
            supportedTimes: this.props.timeControlSupportedTimeSelections,
            customTimeValidator: this.validateTime,
            ariaLabel: DisplayStrings.ContainerTimePillAriaLabel
        };
    }

    private generateTextPillConfig(pillId: string, pillDimension: PillDimension, text): TextPillConfig {
        return {
            text,
            onTextUpdated: (newText: string) => this.handleTextPillValueChange(pillId, pillDimension, newText),
            disableEdit: true
        }
    }

    /**
     * Invoked by pill provider this is the GENERIC implemention of our interaction
     * injection... used for thinks like Cluster, Node, Namespace, etc... standard
     * "FILTER" pills are used here.. (left operation right style pills) albeit
     * we force the operation to be = (equals)
     * @param pillId pillId this interaction configuration is for
     * @param pillDimension dimension name this interaction configuration is for
     */
    private generateFilterPillConfig(pillId: string, pillDimension: PillDimension, selection: FilterSelection): FilterPillConfig {
        // Empty value means that we query for all data
        let values: PillOption[] = [];

        const dimensionOption: IDimensionOption = this.props.dimensionOptions[pillDimension] || {} as any;
        const defaultValues = dimensionOption.defaultValues;
        if (!!defaultValues) {
            defaultValues.forEach((defaultValue: IPillLinkedValue) => {
                values.push({ value: defaultValue.value, label: defaultValue.label });
            });
        }

        /**
         * ControllerKind special case: the filter options for ControllerKind are not dynamic,
         * they are hardcoded, but we need ControllerKind as a field in the queried pill data
         * in order to filter the other filters if the ControllerKind filter is set
         */
        if (!!pillDimension &&
            this.props.variablePillData &&
            this.props.variablePillData.hasOwnProperty(pillDimension) &&
            pillDimension !== PillDimension.ControllerKind
        ) {
            const rawValues: string[] = this.props.variablePillData[pillDimension];

            if (!!rawValues && rawValues.length > 0) {
                rawValues.forEach((rawValue: string) => {
                    values.push({ value: rawValue, label: rawValue });
                });
            }
        }

        return {
            selection,
            onSelectionChange: (type, value, configured) => {
                return this.handlePillSelectionChanges(pillId, type, value) as any;
            },
            areDimensionsLoading: false,
            areOperatorsLoading: false,
            areValuesLoading: this.props.pillDataLoading,
            hideOperatorSelection: true,
            pickerLists: {
                dimensionsList: this.generateDimensionList(pillId),
                operatorsList: [{ label: '=', value: '=' }],
                valuesList: values
            },
            autoOpen: true,
            ariaLabel: DisplayStrings.ContainerVariablePillAriaLabel,
            disableEdit: pillDimension === PillDimension.ControllerKind ? true : false
        };
    }

    /**
     * Interaction handler... when workspace dropdown is changed (single select setup right now)
     * @param newSelection array of selections (we operate single select, array will be 0 or 1)
     */
    private handleWorkspaceSelectionChanged(newSelection: PillOption[]): Promise<any> {
        return new Promise<any>((resolve, reject) => {

            if (!newSelection || newSelection.length < 1) {
                reject(new Error('Selection on workspace pill is required!'));
            }

            const selection = newSelection[0];

            this.setState(() => {
                return { activePills: this.defaultActivePills(this.props) };
            }, () => {
                if (!selection || !selection.value) {
                    resolve(null);
                } else {
                    this.props.onWorkspaceChanged(selection.value.toString()).then(() => {
                        resolve(null);
                    }).catch((err) => {
                        reject(err);
                    });
                }
            });

        });
    }

    /**
     * helper to retrieve an activePill array index for a given unique pill id
     * @param state state object to query (ensure you are hooked into react lifecycle correctly)
     * @param pillId pill id we want the index for
     */
    private getPillIndex(state: VariablePillContainerState, pillId: string): number {
        return findIndex(state.activePills, (pill: IPillWrapper) => {
            return pill.pillId === pillId;
        });
    }

    /**
     * helper to calculate the proper add button status
     * @param currentPillData currently active pills
     * @param allDimensions all possible pills
     * @returns enum representation of add button status
     */
    private getAddButtonStatus(currentPillData: IPillWrapper[], allDimensions: string[]): number {
        if (this.props.hideAddButton) {
            return AddButtonStatus.Hidden;
        }

        currentPillData = currentPillData.filter((item) => {
            switch (item.pillDimension) {
                // Clicking on the Add filter buttons adds a null pill similar to { pillId: number, pipillDimension: undefined}
                case undefined:
                // Filter in the expected pill dimensions
                case PillDimension.TimeRange:
                case PillDimension.Namespace:
                case PillDimension.Node:
                case PillDimension.NodePool:
                case PillDimension.Service:
                    return true;
                // Filter out the hidden pills
                case PillDimension.ControllerKind:
                case PillDimension.ControllerName:
                    return false;
                default:
                    throw new Error('unexpected pill type encountered in VariablePillContainer.getAddButtonStatus for currentPillData for item = ' + item);
            }
        });

        allDimensions = allDimensions.filter((item) => {
            switch (item) {
                // Filter in the expected pill dimensions
                case PillDimension.TimeRange:
                case PillDimension.Namespace:
                case PillDimension.Node:
                case PillDimension.NodePool:
                case PillDimension.Service:
                    return true;
                // Filter out the hidden pills
                case PillDimension.ControllerKind:
                case PillDimension.ControllerName:
                    return false;
                default:
                    throw new Error('unexpected pill type encountered in VariablePillContainer.getAddButtonStatus for allDimensions for item = ' + item);
            }
        });

        return (currentPillData.length === allDimensions.length ? AddButtonStatus.Disabled : AddButtonStatus.Enabled);
    }

    /**
     * generic pill change interaction hook... all pill interactions other then TimeRange
     * and Workspace will enter this function
     * @param pillId pill id being interacted with
     * @param changeType the type of change (dimension vs value)... left vs right
     * @param newValue the values after selection
     */
    private handlePillSelectionChanges(
        pillId: string,
        changeType: SelectionChangeType,
        newValue: FilterSelection
    ): Promise<FilterSelection> {
        return new Promise<FilterSelection>((resolve, reject) => {
            this.setState((prevState) => {
                // wrap in if for condition SelectionChangeType.Dimension
                const activePills: IPillWrapper[] = update(prevState.activePills, {});

                if (!newValue || !newValue.selectedDimension || !newValue.selectedDimension.value) {
                    return { activePills };
                }

                // Special case handling for backspace press when nothing is selected
                if (newValue.selectedValues && (newValue.selectedValues.length > 0) && !newValue.selectedValues[0]) {
                    newValue.selectedValues[0] = { value: '', label: '<All>' }
                }

                const pillIndex = this.getPillIndex(prevState, pillId);
                if (pillIndex < 0) { throw new Error('Invalid pill index found!'); }

                // Call the control panel removePill function so that we clear out the previous pillDimension selection
                if (changeType === SelectionChangeType.Dimension && !StringHelpers.isNullOrEmpty(activePills[pillIndex].pillDimension)) {
                    this.props.onRemovePill(activePills[pillIndex].pillDimension);
                }
                activePills[pillIndex].pillDimension = newValue.selectedDimension.value.toString();

                return { activePills };
            }, () => {
                // Nothing is selected in the pill with the new dimension
                if (changeType === SelectionChangeType.Dimension) {
                    newValue.selectedValues = [];
                    resolve(newValue);
                } else if (changeType === SelectionChangeType.Values) {
                    this.props.onPillValueChanged(
                        newValue.selectedDimension.value.toString(),
                        newValue.selectedValues[0].value.toString()
                    ).then(() => {
                        resolve(newValue);
                    }).catch((err) => {
                        reject(err);
                    });
                } else {
                    resolve(newValue);
                }
            });
        });
    }

    private handleTextPillValueChange(pillId: string, pillDimension: PillDimension, newText: string): void {
        if (!pillId || !pillDimension || !newText) { return; }

        if (this.state.controllerNameText !== newText) {
            this.setState({ controllerNameText: newText });
            this.props.onPillValueChanged(pillDimension, newText)
        }
    }

    /**
     * interaction hook with container... one of the pills is being removed
     * @param containerId (unused) required by contract
     * @param pillId pill id being removed
     */
    private onRemovePill(containerId, pillId) {
        let pillDimension: string = undefined;
        this.setState((prevState) => {
            const activePills: IPillWrapper[] = update(prevState.activePills, {});
            const filteredPills = activePills.filter((item) => {
                if (item.pillId === pillId) {
                    pillDimension = item.pillDimension;
                }
                return item.pillId !== pillId;
            });

            return {
                activePills: filteredPills,
                // Because text pills don't hold onto their own text state, we have to manage that here,
                //instead of managing it at the control panel plane
                controllerNameText: pillDimension === PillDimension.ControllerName ? '' : prevState.controllerNameText
            };
        }, () => {
            this.props.onRemovePill(pillDimension);
        });
    }

    /**
     * interaction hook with container, a new pill is being added that is
     * not yet configured (no value or dimension chosen yet)
     */
    private onAddPill(containerId: string, pillDimension?: string) {
        this.setState((prevState) => {
            const activePills: IPillWrapper[] = update(prevState.activePills, {
                $push: [
                    {
                        pillId: this.nextPillId.toString(),
                        pillDimension: pillDimension || undefined
                    }
                ]
            });
            this.nextPillId++;
            this.props.onAddNullPill();
            return { activePills };
        });
    }

    /**
     * check if user selected start time/ end time difference is greater than 90 days.
     * @param timeData contains start time/ end time
     */
    private validateTime(timeData: TimeDataAbsolute): RangeValidation {
        let endTimeValidation: Validation = { isValid: true };

        if (moment(timeData.absolute.endTime).diff(timeData.absolute.startTime) > TimeValues.Last90Days) {
            endTimeValidation = { isValid: false, reason: DisplayStrings.DateTimeRangeValidateWithinThreeMonths };
        }

        return { startValidation: endTimeValidation, endValidation: endTimeValidation };
    }

    /**
     *  Reimplement getTimeContentProvider here instead of using the appInsights one since
     *  customTimeValidator is not passed as a property in the shared code
     *  TODO : Update appinsights code to use the customTimeValidator
    */
    private getTimeContentProvider(contentProps: TimePillConfig): IPillContentProvider<TimePillConfig> {
        const pillContent: IPillContentProvider<TimePillConfig> = {
            createContent: (
                editMode: boolean,
                props: TimePillProps,
                updateConfiguredStatus: (configured: boolean) => void,
                updateAriaLabel: (newLabel: string) => void,
                editingComplete: () => void,
            ): Promise<JSX.Element> => {
                return import('@appinsights/pillscontrol-es5/dist/TimePill').then((TimePill) => {
                    return <TimePill.TimePill
                        editMode={editMode}
                        editingComplete={editingComplete}
                        timeData={props.timeData}
                        supportedTimes={props.supportedTimes}
                        timeGrainOptions={props.timeGrainOptions}
                        disableZoneSelection={props.disableZoneSelection}
                        onTimeUpdated={props.onTimeUpdated}
                        updateAriaLabel={updateAriaLabel}
                        displayAs={props.displayAs}
                        customTimeValidator={props.customTimeValidator}
                        updateConfiguredStatus={updateConfiguredStatus}
                    />;
                });
            },
            contentProps: contentProps
        };
        return pillContent;
    }

    /**
     * We support passing selections for node, service, namespace, controller name, and controller kind
     * The selection for time range happens elsewhere
     * @param dimension a pill dimension, e.g. Node, Namespace, etc.
     */
    private getPillSelectionFromProps(dimension: PillDimension): FilterSelection {
        if (!this.props.pillSelections) { return undefined; }

        let selectionValue: PillOption;
        switch (dimension) {
            case PillDimension.NodePool:
                selectionValue = {
                    label: this.props.pillSelections.nodePool,
                    value: this.props.pillSelections.nodePool
                }
                this.appliedPillSelections[dimension] = true;
                break;
            case PillDimension.Node:
                selectionValue = {
                    label: this.props.pillSelections.hostName,
                    value: this.props.pillSelections.hostName
                }
                this.appliedPillSelections[dimension] = true;
                break;
            case PillDimension.Service:
                selectionValue = {
                    label: this.props.pillSelections.serviceName,
                    value: this.props.pillSelections.serviceName
                }
                this.appliedPillSelections[dimension] = true;
                break;
            case PillDimension.Namespace:
                selectionValue = {
                    label: this.props.pillSelections.nameSpace,
                    value: this.props.pillSelections.nameSpace
                }

                const namespaceObj = this.findNamespaceObjByValue(this.props.pillSelections.nameSpace);
                if (namespaceObj) {
                    selectionValue.label = namespaceObj.label;
                    selectionValue.value = namespaceObj.value;
                }
                this.appliedPillSelections[dimension] = true;
                break;
            case PillDimension.ControllerKind:
                selectionValue = {
                    label: this.props.pillSelections.controllerKind,
                    value: this.props.pillSelections.controllerKind
                }
                this.appliedPillSelections[dimension] = true;
                break;
            default:
                selectionValue = undefined;
        }


        const selection: FilterSelection = {
            selectedDimension: { label: dimension, value: dimension },
            selectedValues: [selectionValue],
            selectedOperator: { label: DisplayStrings.EqualsLabelSeperator, value: DisplayStrings.EqualsLabelSeperator }
        };
        return selection;
    }

    /**
     *
     * @param dimension
     */
    private isThereAPillSelectionForThisDimension(dimension: string): boolean {
        if (!this.props.pillSelections) { return false; }

        if (dimension === PillDimension.Node && !String.IsNullOrWhiteSpace(this.props.pillSelections.hostName)) {
            return true;
        } else if (dimension === PillDimension.Service && !String.IsNullOrWhiteSpace(this.props.pillSelections.serviceName)) {
            return true;
        } else if (dimension === PillDimension.Namespace && !String.IsNullOrWhiteSpace(this.props.pillSelections.nameSpace)) {
            return true;
        } else if (dimension === PillDimension.ControllerName && !String.IsNullOrWhiteSpace(this.props.pillSelections.controllerName)) {
            return true;
        } else if (dimension === PillDimension.ControllerKind && !String.IsNullOrWhiteSpace(this.props.pillSelections.controllerKind)) {
            return true;
        } else if (dimension === PillDimension.NodePool && !String.IsNullOrWhiteSpace(this.props.pillSelections.nodePool)) {
            return true;
        }

        return false;
    }

    /**
     * Returns namespace value/label pair for the given namespace value
     * @param namespaceValue namespace value
     */
    private findNamespaceObjByValue(namespaceValue: string): { value: string, label: string } {
        for (let key in userAndSystemPodPillOptions) {
            if (userAndSystemPodPillOptions[key] && userAndSystemPodPillOptions[key].value === namespaceValue) {
                return userAndSystemPodPillOptions[key];
            }
        }

        return null;
    }
}
