/** tpl */
import * as React from 'react';
import * as moment from 'moment';
import { GUID } from '@appinsights/aichartcore';
import { Promise } from 'es6-promise';
import update = require('immutability-helper');
import { TimeData, DropdownOption } from '@appinsights/pillscontrol-es5';
import { isRelative } from '@appinsights/pillscontrol-es5/dist/TimeUtils';

/** shared */
import * as TelemetryStrings from '../../shared/TelemetryStrings';
import { DisplayStrings } from '../../shared/DisplayStrings';
import * as GlobalConstants from '../../shared/GlobalConstants';
import { IWorkspaceInfo } from '../../shared/IWorkspaceInfo';
import { WorkspaceListManager } from '../../shared/WorkspaceListManager';
import { MessagingProvider } from '../../shared/MessagingProvider';
import { ConsoleError } from '../../shared/svg/ConsoleError'
import {
    VariablePillContainer,
    IDimensionOption,
    IPillLinkedValue
} from '../../shared/pill-component/VariablePillContainer';
import { KustoDataProvider } from '../../shared/data-provider/KustoDataProvider';
import { RetryARMDataProvider } from '../../shared/data-provider/RetryARMDataProvider';
import { ARMDataProvider } from '../../shared/data-provider/ARMDataProvider';
import { RetryPolicyFactory } from '../../shared/data-provider/RetryPolicyFactory';
import { TimeInterval } from '../../shared/data-provider/TimeInterval';
import { TelemetryMainArea, ITelemetry } from '../../shared/Telemetry';
import { TelemetryFactory } from '../../shared/TelemetryFactory';

/** local */
import { PillProvider, IFilterRecord, PillDimension } from './PillProvider';
import {
    IContainerControlPanelSelections,
    timeControlSupportedTimeSelections,
    IContainerControlPanelFilterSelections
} from './ContainerControlPanelSelections';
import { LiveMetricsGranularity } from '../LiveMetricsPoller';

/** styles */
import '../../../styles/shared/ControlPanel.less';
import '../../shared/toggle-component/ToggleButton.less';

/** svg */
import { BlueLoadingDots, BlueLoadingDotsSize } from '../../shared/blue-loading-dots';
import { HttpRequestError } from '../../shared/data-provider/HttpRequestError';
import { ContainerGridBase } from '../grids/shared/ContainerGridBase';
import { EnvironmentConfig } from '../../shared/EnvironmentConfig';
import { TextDropDownPill } from '../../shared/pill-component/TextDropDownPill';
import { LiveToggle } from './LiveToggle';

/** Control panel properties for in-blade experience */
export interface IInBladeContainerControlPanelProps {
    workspace: IWorkspaceInfo; /** Workspace information */
    messagingProvider: MessagingProvider;
    clusterName: string; /** In-blade cluster name */
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

export interface IWorkbookNotebookParams {
    timeRange: any,
    workspaceId: string,
    clusterId: string,
    subscriptionId: string
}

/**
 * Control panel properties
 */
interface IContainerControlPanelProps {
    /** In blade or stand-alone mode rules/props for populating controls of the panel */
    options: IInBladeContainerControlPanelProps | IStandAloneContainerControlPanelProps;

    /** feature flag for live metrics */
    liveMetricsFeatureFlag: boolean;

    /** check is a Aks cluster or not */
    isAksCluster: boolean;

    /** Callback to invoke when control panel selections changes */
    onSelectionsChanged: (selections: IContainerControlPanelSelections) => void;
    idealGrain: number;

    /** pill selections provided on navigation to CI from another page */
    pillSelections: IContainerControlPanelFilterSelections;

    /** Toggles live metrics */
    onToggleLiveMetrics: (value: boolean) => void;

    /** if live metrics should be running */
    seeLiveMetrics: boolean;

    hidePills: boolean;
    showLiveMetricsDropdown: boolean;

    /** If live metrics button should be shown */
    showLiveMetricsButton: boolean;

    /** When live metrics granularity is updated */
    onChangeLiveMetricsGranularity: (value: LiveMetricsGranularity) => void;

    /** The current set granularity of live metrics */
    liveMetricsGranularity: LiveMetricsGranularity;

    /** fully qualified resource id of the cluster */
    clusterResourceId: string;

    /** name of the cluster */
    clusterName: string;
}

/**
 * Checks if options indicate in-blade experience
 * @param options Options to check
 * @returns A value indicating whether of not options indicate in-blade experience
 */
const checkIsInBlade = (options: any): options is IInBladeContainerControlPanelProps => options.hasOwnProperty('clusterName');

interface IContainerControlPanelState {
    selections: IContainerControlPanelSelections;
    pillData: IFilterRecord[];
    dateTimeRangeTimeData: TimeData;
    pillDataLoading: boolean;
}

enum ControllerKind {
    ReplicaSet = 'ReplicaSet',
    DaemonSet = 'DaemonSet',
    Job = 'Job',
    CronJob = 'CronJob'
}

export class ContainerControlPanel extends React.Component<IContainerControlPanelProps, IContainerControlPanelState> {
    private pillDataProvider: PillProvider;

    private liveMetricsGrainOptions: DropdownOption[] = [
        { label: '1 Second', value: LiveMetricsGranularity.OneSecond },
        { label: '5 Seconds', value: LiveMetricsGranularity.FiveSeconds },
        { label: '15 Seconds', value: LiveMetricsGranularity.FifteenSeconds },
        { label: '30 Seconds', value: LiveMetricsGranularity.ThirtySeconds }
    ]

    private telemetry: ITelemetry;
    /** state preserved after last blade render */
    // private hoistedState: IContainerControlPanelState;
    constructor(props: any) {
        super(props);

        this.pillDataProvider =
            new PillProvider(
                new KustoDataProvider(
                    new RetryARMDataProvider(new ARMDataProvider(), new RetryPolicyFactory()),
                    GlobalConstants.ContainerInsightsApplicationId
                )
            );

        this.onWorkspacePillChanged = this.onWorkspacePillChanged.bind(this);
        this.onClusterNameChanged = this.onClusterNameChanged.bind(this);
        this.onNameSpaceChanged = this.onNameSpaceChanged.bind(this);
        this.onServiceNameChanged = this.onServiceNameChanged.bind(this);
        this.onHostNameChanged = this.onHostNameChanged.bind(this);
        this.onTimeRangeChanged = this.onTimeRangeChanged.bind(this);

        this.buildWorkspaceOptions = this.buildWorkspaceOptions.bind(this);
        this.onPillValueChanged = this.onPillValueChanged.bind(this);
        this.onAddNullPill = this.onAddNullPill.bind(this);
        this.onRemovePill = this.onRemovePill.bind(this);
        this.refreshOnClickHandler = this.refreshOnClickHandler.bind(this);

        const inBladeOptions = this.props.options as IInBladeContainerControlPanelProps;
        const standAloneOptions = this.props.options as IStandAloneContainerControlPanelProps;

        const selectedWorkspace: IWorkspaceInfo = checkIsInBlade(this.props.options)
            ? inBladeOptions.workspace
            : standAloneOptions.workspaceManager.getSelectedWorkspace();

        const selectedClusterName: string = checkIsInBlade(this.props.options)
            ? inBladeOptions.clusterName
            : ''; // all clusters

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

    /** React callback after component was mounted into DOM */
    public componentDidUpdate(
        prevProps: Readonly<IContainerControlPanelProps>,
        prevState: Readonly<IContainerControlPanelState>
    ): void {
        // store/hoist state so that we can use it in "random" callbacks
        // this.hoistedState = this.state;
    }

    public render(): false | JSX.Element {
        if (EnvironmentConfig.Instance().isConfigured()) {
            if (!this.telemetry) {
                this.telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
            }
        }

        // tslint:disable:max-line-length
        return (
            <div className='control-panel'>
                {this.renderCacheValidationChrome()}
                <div className={(this.props.hidePills) ? 'unselectable-pill-container' : 'selectable-pill-container'}>
                    <VariablePillContainer
                        onTimeRangeChanged={this.onTimeRangeChanged}
                        selectedTimeRange={this.state.dateTimeRangeTimeData}
                        pillDataLoading={this.state.pillDataLoading}
                        options={this.props.options}
                        selectedWorkspace={this.state.selections.workspace}
                        onAddNullPill={this.onAddNullPill}
                        onRemovePill={this.onRemovePill}
                        dimensionOptions={this.getFilterOptions()}
                        variablePillData={this.filterPillData()}
                        onWorkspaceChanged={this.onWorkspacePillChanged}
                        onPillValueChanged={this.onPillValueChanged}
                        pillSelections={this.props.pillSelections}
                        timeControlSupportedTimeSelections={timeControlSupportedTimeSelections}
                    />
                </div>
                {this.props.showLiveMetricsButton && this.props.isAksCluster ? <LiveToggle seeLiveMetrics={this.props.seeLiveMetrics} onToggleLiveMetrics={this.props.onToggleLiveMetrics}/> : <></>}
                {this.props.showLiveMetricsDropdown && this.props.seeLiveMetrics && this.props.isAksCluster ? this.renderLiveMetricsDropdown() : ''}
            </div>
        );
        // tslint:enable:max-line-length
    }

    /**
     * On click handler for refresh button
     * If selected time range is relative, updates the time range by setting the end time to now and determining the new start time based
     * on the relative time range duration.
     *
     * In the case where the selected time range is absolute, start and end time and dateTimeRangeTimeData will not change,
     * and thus these values passed down into grids will not kickoff a requery, even though the data for this time range may have changed.
     * e.g. Imagine that the user selected a time range that included 20 minutes into the future. If they hit refresh, 10 minutes from now,
     * their data set will include 10 more minutes of data, even though their selected time range didn't change.
     *
     * Pill data has to be updated because the old data could be invalid in the new time range. onTimeRangeChanged calls updatePillData
     * after setting the state related to time.
     */
    public refreshOnClickHandler(): void {
        // nib: Ensures that state is final when we refresh the time selection
        this.setState({}, () => {
            this.onTimeRangeChanged(this.state.dateTimeRangeTimeData);
        });
    }

    /**
     * Invoke the pill provider again to pill to pill filter the data provided
     * @returns hash map of the pills values
     */
    private filterPillData(): StringMap<string[]> {
        return this.pillDataProvider.applySelectionFilters(this.state.pillData, {
            Node: this.state.selections.hostName,
            Service: this.state.selections.serviceName,
            Namespace: this.state.selections.nameSpace,
            [PillDimension.NodePool]: this.state.selections.nodePool,
            Cluster: this.state.selections.clusterName,
            ControllerKind: this.state.selections.controllerKind
        });
    }

    /**
     * handler given to the pill container, invoked when workspaces are changed
     * @param workspaceId workspace id which is now selected
     */
    private onWorkspacePillChanged(workspaceId: string): Promise<any> {
        const promise = new Promise<any>((resolve, reject) => {
            const standAlongProps = this.props.options as IStandAloneContainerControlPanelProps;
            if (!standAlongProps) { return; }

            this.setState((prevState: IContainerControlPanelState) => {
                // DO NOT MUTATE prevState in this function!!!  it is not safe to do so
                const selections = update(prevState.selections, {
                    hostName: { $set: '' },
                    serviceName: { $set: '' },
                    nameSpace: { $set: '' },
                    clusterName: { $set: '' },
                    workspace: { $set: standAlongProps.workspaceManager.findById(workspaceId) }
                });

                return { selections };
            }, () => {

                this.updatePillData();

                //notify ws selection changes
                this.props.onSelectionsChanged(this.state.selections);

                if (!standAlongProps.messagingProvider) {
                    throw 'messaging provider was invalid in state!';
                }
                let workspace = standAlongProps.workspaceManager.findById(workspaceId);
                if (workspace) {
                    standAlongProps.messagingProvider.sendSelectedWorkspaceChangedMessage(workspace);
                }

                resolve();
            });
        });
        return promise;
    }

    /**
     * present a list of pill dimension options to the pill container... inblade
     * we remove two pills which are not needed (workspace and cluster)
     */
    private getFilterOptions(): StringMap<IDimensionOption> {
        const defaultValues: IPillLinkedValue[] = [{ label: DisplayStrings.AllSelectorTitle, value: '' }];
        const namespaceDefaultValues: IPillLinkedValue[] = [...defaultValues, { label: DisplayStrings.AllButKubeSystemTitle, value: '~' }];
        const controllerKindDefaultValues: IPillLinkedValue[] = [
            ...defaultValues,
            { label: DisplayStrings.ReplicaSetTitle, value: ControllerKind.ReplicaSet },
            { label: DisplayStrings.DaemonSetTitle, value: ControllerKind.DaemonSet },
            { label: DisplayStrings.JobTitle, value: ControllerKind.Job },
            { label: DisplayStrings.CronJobTitle, value: ControllerKind.CronJob }
        ]

        const filterOptions: StringMap<IDimensionOption> = {
            [PillDimension.TimeRange]: { dimensionName: PillDimension.TimeRange, removable: false },
            [PillDimension.Service]: { dimensionName: PillDimension.Service, removable: true, defaultValues },
            [PillDimension.Node]: { dimensionName: PillDimension.Node, removable: true, defaultValues },
            [PillDimension.Namespace]: { dimensionName: PillDimension.Namespace, removable: true, defaultValues: namespaceDefaultValues },
            [PillDimension.NodePool]: { dimensionName: PillDimension.NodePool, removable: true, defaultValues: defaultValues },
            [PillDimension.ControllerName]: { dimensionName: PillDimension.ControllerName, removable: true, defaultValues: defaultValues },
            [PillDimension.ControllerKind]: {
                dimensionName: PillDimension.ControllerKind,
                removable: true,
                defaultValues: controllerKindDefaultValues
            }
        };

        if (!checkIsInBlade(this.props.options)) {
            filterOptions[PillDimension.Workspace] = { dimensionName: PillDimension.Workspace, removable: false };
            filterOptions[PillDimension.Cluster] = { dimensionName: PillDimension.Cluster, removable: true, defaultValues };
        }

        return filterOptions;
    }

    /** Used for the first attempt to add a pill to load the data... */
    private onAddNullPill() {
        let requirePillLoad = false;

        const telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
        telemetry.logEvent(TelemetryStrings.onAddNullPill, undefined, undefined);

        this.setState((prevState) => {
            if (prevState.pillData == null) {
                requirePillLoad = true;
                return { pillData: null };
            }
            return null;
        }, () => {
            if (requirePillLoad) {
                this.updatePillData();
            }
        });
    }

    /**
     * Used to remove a pill and requery the data accordingly
     * @params dimension dimension of the pill being removed
    */
    private onRemovePill(dimension: string): void {
        switch (dimension) {
            // Empty value means that we're resetting the clause to search for all data
            // Please don't delete the then statements since the functions return a promise
            // which is only resolved (re-query happens) because of the then clause.
            case PillDimension.Cluster:
                this.onClusterNameChanged('').then(() => {});
                break;
            case PillDimension.Namespace:
                this.onNameSpaceChanged('').then(() => {});
                break;
            case PillDimension.Node:
                this.onHostNameChanged('').then(() => {});
                break;
            case PillDimension.Service:
                this.onServiceNameChanged('').then(() => {});
                break;
            case PillDimension.NodePool:
                this.onNodePoolChanged('').then(() => {});
                break;
            case PillDimension.ControllerName:
                this.onControllerNameChanged('').then(() => {});
                break;
            case PillDimension.ControllerKind:
                this.onControllerKindChanged('').then(() => {});
                break;
            default:
                break;
        }
    }

    /**
     * fired whenever a pill value changes.
     * @param dimension dimension the value is being changed for
     * @param value the new value for this dimension
     */
    private onPillValueChanged(dimension: string, value: string): Promise<any> {
        switch (dimension) {
            case PillDimension.Cluster:
                return this.onClusterNameChanged(value);
            case PillDimension.Namespace:
                return this.onNameSpaceChanged(value);
            case PillDimension.Node:
                return this.onHostNameChanged(value);
            case PillDimension.Service:
                return this.onServiceNameChanged(value);
            case PillDimension.NodePool:
                return this.onNodePoolChanged(value);
            case PillDimension.ControllerName:
                return this.onControllerNameChanged(value);
            case PillDimension.ControllerKind:
                return this.onControllerKindChanged(value);
            default:
                return new Promise((resolve, reject) => { reject(new Error('invalid dimension name')) });
        }
        // apply UI filters...
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
            classNameOfLoading += ' invisible';
        }

        let classNameOfException = 'cache-validation-loading-svg-size';
        if (!standAlongProps.workspaceManager || !standAlongProps.workspaceManager.isInErrorState()) {
            classNameOfException += ' invisible';
        }
        return <div className='cache-validation-chrome'>
            <div className={classNameOfLoading} title={DisplayStrings.CacheValidationInProgress}>
                <BlueLoadingDots size={BlueLoadingDotsSize.small} />
            </div>
            <div className={classNameOfException} title={DisplayStrings.CacheValidationFailed}>
                <ConsoleError />
            </div>
        </div>
    }

    private renderLiveMetricsDropdown(): JSX.Element {
        if (this.props.liveMetricsFeatureFlag && EnvironmentConfig.Instance().isLiveDataEnabledEnvironment()) {
            const selectedOption = this.liveMetricsGrainOptions.filter((item) => {
                return item.value === this.props.liveMetricsGranularity;
            });

            if (selectedOption.length !== 1) { throw 'renderLiveMetricsDropdown(): invalid selection state'; }

            return <TextDropDownPill
                containerId={'live-metrics-dropdown'}
                selectedItem={selectedOption[0]}
                dropDownOptions={this.liveMetricsGrainOptions}
                onSelectionChanged={(ev: number) => {
                    this.props.onChangeLiveMetricsGranularity(ev);
                }}
                areValuesLoading={false}
                pillLabel={'Live Interval: '}
            />
        }
        return null;
    }

    private buildWorkspaceOptions(): any {
        const options = [];

        // bbax: this code will only work Stand-Alone.... please don't try to use inblade
        const standAlongProps = this.props.options as IStandAloneContainerControlPanelProps;
        if (!standAlongProps) { return options; }

        const sortedWorkspaceList = standAlongProps.workspaceManager.getOrderedList();
        const selectedWorkspace = standAlongProps.workspaceManager.getSelectedWorkspace();

        if (sortedWorkspaceList) {
            for (let i = 0; i < sortedWorkspaceList.length; i++) {
                const workspace = sortedWorkspaceList[i];
                if (workspace) {
                    const optionElement = <option value={workspace.id}
                        selected={(selectedWorkspace && (selectedWorkspace.id === workspace.id)) ? true : false} >{workspace.name}</option>
                    options.push(optionElement);
                }
            }
        }

        return options;
    }

    private onClusterNameChanged(selection: string): Promise<any> {
        if (this.state.selections.clusterName === selection) {
            return Promise.resolve(null);
        }
        return new Promise((resolve, reject) => {
            this.setState((prevState: IContainerControlPanelState) => {
                // DO NOT MUTATE prevState in this function!!!  it is not safe to do so
                const selections = update(prevState.selections, {
                    clusterName: { $set: selection }
                });

                return { selections };
            }, () => {
                this.props.onSelectionsChanged(this.state.selections);
                resolve(null);
            });
        });
    }

    private onNameSpaceChanged(selection: string): Promise<any> {
        if (this.state.selections.nameSpace === selection) {
            return Promise.resolve(null);
        }
        return new Promise((resolve, reject) => {
            this.setState((prevState: IContainerControlPanelState) => {
                // DO NOT MUTATE prevState in this function!!!  it is not safe to do so
                const selections = update(prevState.selections, {
                    nameSpace: { $set: selection }
                });

                return { selections };
            }, () => {
                this.props.onSelectionsChanged(this.state.selections);
                resolve(null);
            });
        });
    }

    private onServiceNameChanged(selection: string): Promise<any> {
        if (this.state.selections.serviceName === selection) {
            return Promise.resolve(null);
        }
        return new Promise((resolve, reject) => {
            this.setState(
                (prevState: IContainerControlPanelState) => {
                    const selections = update(prevState.selections, {
                        serviceName: { $set: selection },
                    });
                    return { selections };
                },
                () => {
                    this.props.onSelectionsChanged(this.state.selections);
                    resolve(null);
                }
            );
        });
    }

    private onHostNameChanged(selection: string): Promise<any> {
        if (this.state.selections.hostName === selection) {
            return Promise.resolve(null);
        }
        return new Promise((resolve, reject) => {
            this.setState((prevState: IContainerControlPanelState) => {
                // DO NOT MUTATE prevState in this function!!!  it is not safe to do so
                const selections = update(prevState.selections, {
                    hostName: { $set: selection }
                });

                return { selections };
            }, () => {
                this.props.onSelectionsChanged(this.state.selections);
                resolve(null);
            });
        });
    }

    /**
     * Updates state from events related to node pool changing
     * @param selection selection made for node pool
     */
    private onNodePoolChanged(selection: string): Promise<any> {
        if (this.state.selections.nodePool === selection) {
            return Promise.resolve(null);
        }
        return new Promise((resolve, reject) => {
            this.setState((prevState: IContainerControlPanelState) => {
                const selections = update(prevState.selections, {
                    nodePool: { $set: selection }
                });

                return { selections };
            }, () => {
                this.props.onSelectionsChanged(this.state.selections);
                resolve(null);
            })
        })
    }

    /**
     * Updates state from events related to controller name changing
     * @param selection selection made for ControllerName
     */
    private onControllerNameChanged(selection: string): Promise<any> {
        // we use contains in the query and converting to lowercase reduces the possiblity of breakage from capitalization discrepancies
        selection = selection.toLocaleLowerCase();
        if (this.state.selections.controllerName === selection) {
            return Promise.resolve(null);
        }

        return new Promise((resolve, reject) => {
            this.setState((prevState: IContainerControlPanelState) => {
                const selections = update(this.state.selections, {
                    controllerName: { $set: selection }
                });

                return { selections }; // set selections in control panel...
            }, () => {
                // set selections in main page, which DON'T flow down into this component...
                this.props.onSelectionsChanged(this.state.selections);
                resolve(null);
            });
        });
    }

    /**
     * Updates state from events related to controller kind changing
     * @param selection selection made for ControllerKind
     */
    private onControllerKindChanged(selection: string): Promise<any> {
        // we use contains in the query and converting to lowercase reduces the possiblity of breakage from capitalization discrepancies
        selection = selection.toLocaleLowerCase();
        if (this.state.selections.controllerKind === selection) {
            return Promise.resolve(null);
        }
        return new Promise((resolve, reject) => {
            this.setState((prevState: IContainerControlPanelState) => {
                const selections = update(prevState.selections, {
                    controllerKind: { $set: selection }
                });

                return { selections };
            }, () => {
                this.props.onSelectionsChanged(this.state.selections);
                resolve(null);
            })
        });
    }

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

        this.setState((prevState: IContainerControlPanelState) => {
            // DO NOT MUTATE prevState in this function!!!  it is not safe to do so
            const selections = update(prevState.selections, {
                startDateTimeUtc: { $set: startTime.toDate() },
                endDateTimeUtc: { $set: endTime.toDate() },
                timeRangeSeconds: { $set: Number(moment.duration(endTime.diff(startTime)).asSeconds()) },
                isTimeRelative: { $set: isRelative(time) }
            });

            return { selections, dateTimeRangeTimeData: time };
        }, () => {
            this.updatePillData();
            this.props.onSelectionsChanged(this.state.selections);
        });
    }

    /**
     * Refresh the current pill data based on workspace and time.
     */
    private updatePillData(): void {
        this.setState({ pillDataLoading: true });

        const startTime = this.state.selections.startDateTimeUtc;
        const endTime = this.state.selections.endDateTimeUtc;
        const timeInterval = new TimeInterval(startTime, endTime, this.props.idealGrain);

        const pillDataRequestId = GUID().toLowerCase();

        const pillDataQueryTelemetry = this.telemetry.startLogEvent(
            'kustoContainerPills-Load',
            {
                workspace_id: this.state.selections.workspace.id,
                workspace_name: this.state.selections.workspace.name,
                requestId: pillDataRequestId,
            },
            undefined
        );

        this.pillDataProvider.getPillData(
            this.state.selections.workspace,
            timeInterval,
            this.props.clusterResourceId,
            this.props.clusterName,
            pillDataRequestId
        ).then((pillData: IFilterRecord[]) => {
            pillDataQueryTelemetry.complete();
            this.setState({ pillData, pillDataLoading: false });
        }).catch((err) => {
            console.error(err);
            const errorProperties = {
                timeInterval: timeInterval.getISOInterval(),
                workspaceId: this.state.selections.workspace.id,
                workspaceName: this.state.selections.workspace.name,
                workspaceLocation: this.state.selections.workspace.location
            }
            pillDataQueryTelemetry.fail(err, errorProperties);
            if (HttpRequestError.isAccessDenied(err)) {
                ContainerGridBase.handleRequestAccessDenied(
                    this.props.options.messagingProvider,
                    this.state.selections.workspace.id,
                    'pills'
                );
            }
            this.setState({ pillDataLoading: false });
        });
    }
}
