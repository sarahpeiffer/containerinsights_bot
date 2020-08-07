/** Block imports */
import * as $ from 'jquery';
import * as React from 'react';
import { Promise } from 'es6-promise';

/** Compute imports */
import { MapProviderV3, MapTelemetryListener } from '../../data-provider/MapProviderV3';
import { MapApiResponse } from './BasicMapComponent';

/** Shared imports */
import { AdmPropertiesPanelShim } from '../../shared/admmaps-wrapper/AdmPropertiesPanelShim'
import { IWorkspaceInfo } from '../../../shared/IWorkspaceInfo';
import { ITelemetry, TelemetryMainArea } from '../../../shared/Telemetry';
import { VmInsightsTelemetryFactory } from '../../../shared/VmInsightsTelemetryFactory';
import { MessagingProvider } from '../../../shared/MessagingProvider';
import { IComputerInfo } from '../../shared/control-panel/ComputerProvider';
import { GuestHealth, PlatformHealth } from '../../../shared/IHealthInfo';
import { OnboardingState } from '../../shared/OnboardingUtil';
import { IAlertSummary } from '../../shared/AlertsManager';

/** Styles */
import '../../../../styles/compute/ComputeMaps.less';
import { IApiClientRequestInfoParams } from '../../../shared/data-provider/ApiClientRequestInfo';

export enum MapType {
    groupmap = 'groupMap',
    singlevmmap = 'singleVMMap'
}

export interface IComputeMapsElementProps {
    workspace: IWorkspaceInfo;
    computers: IComputerInfo[];

    /**
     * MapId can be azure resourceId or ServiceMap Id which will be used in generateMap API.
     */
    mapId: string;
    mapDisplayName: string;
    mapType: MapType;
    startDateTimeUtc: Date;
    endDateTimeUtc: Date;
    messagingProvider: MessagingProvider;
    logPath: string;
    loadLaAlerts: boolean;
    forceUpdate?: boolean;
    /**
     * Need to pass alertSummary to display AlertBadges in map
     */
    alertSummary?: IAlertSummary;

    /**
     * This property holds ServiceMap API response for the selected computerId/computerGroupId.
     * This value presents only if the parent component makes the API request
     */
    mapApiResponse?: MapApiResponse;
    visibleServerPorts?: string[];
    /** Health of the VM, only relevant in Single VM mode (for now) */
    guestHealth?: GuestHealth;
    platformHealth?: PlatformHealth;
    /** Used when onboarding check is performed asynchronously */
    onboardingState?: OnboardingState;
    language: string;
    apiRequestInfo: IApiClientRequestInfoParams;
    enableSimpleMapLayout?: boolean;
    /** Triggered by the AdmMapsPanelShim and routed to MainPage to construct a property panel */
    onMapsContextChanged: (selectedContext: DependencyMap.SelectionContext, mapData: DependencyMap.IMap) => void;
    onMapComputerIdChanged: (id: string) => void;
    onAlertsLoaded: (alerts: StringMap<DependencyMap.Integrations.IAlert[]>) => void;
    onMapComputationStarted: () => void;
    onMapComputationCompleted: () => void;
}

export interface IComputeMapsElementState {
    sequence: number;
    initialLoad: boolean;
    enabledOnboardingClicked: boolean;
}

const admmapDivId = '#ininadmmap';
const mapImagesRelativePath = './images/map/';

const OPACITY_CLEAR: string = '0';
const OPACITY_OPAQUE: string = '1';

export class ComputeMapsElement extends React.Component<IComputeMapsElementProps, IComputeMapsElementState> {
    public state: IComputeMapsElementState;

    private admWorkspace: DependencyMap.AdmWorkspace;
    private mapProvider: MapProviderV3;
    private mapTelemetryListener: MapTelemetryListener;
    private telemetry: ITelemetry;
    private firstQuery: boolean = true;

    constructor(props: IComputeMapsElementProps) {
        super(props);

        // bbax: hack shim the properties panel... to be replaced with real panel override and npm one day
        // https://msecg.visualstudio.com/OMS/_workitems/edit/155172
        // this replace the AdmPropertiesPanel class, we don't need map propertyPanel.
        (DependencyMap as any).AdmPropertiesPanel = AdmPropertiesPanelShim;

        this.telemetry = VmInsightsTelemetryFactory.get(TelemetryMainArea.Maps);

        this.mapTelemetryListener = new MapTelemetryListener(this.props.logPath, this.telemetry, this.props.messagingProvider);
        this.mapProvider = new MapProviderV3(this.telemetry, this.props.logPath, this.props.apiRequestInfo,
            this.onMapIdChanged.bind(this), this.onMapRenderCompleted.bind(this));

        this.state = {
            sequence: 0,
            initialLoad: true,
            enabledOnboardingClicked: false
        };
    }

    /**
     * if workspace, computerId, computerGroupId, timerange change,
     * we need to render the map. but may not need to update compute list.
     *
     * computeList might come later, and it should not render the map again.
     * In this case, return false.
     * @param nextProps
     * @param nextStates
     */
    public shouldComponentUpdate(nextProps: IComputeMapsElementProps, nextStates: IComputeMapsElementState) {
        const mapContextChanged: boolean = !!(this.state.sequence !== nextStates.sequence
            || this.props.workspace?.id !== nextProps.workspace?.id
            || this.props.mapId !== nextProps.mapId
            || this.props.startDateTimeUtc?.valueOf() !== nextProps.startDateTimeUtc?.valueOf()
            || this.props.endDateTimeUtc?.valueOf() !== nextProps.endDateTimeUtc?.valueOf()
            || (!this.props.mapApiResponse?.data
                && (!!nextProps.mapApiResponse?.data || !!nextProps.mapApiResponse?.errors)));

        if (!mapContextChanged && this.visibleServerPortsChanged(nextProps.visibleServerPorts, this.props.visibleServerPorts)
            && this.admWorkspace) {
            this.admWorkspace.updateServerPortsVisibility(nextProps.visibleServerPorts);
        }

        return mapContextChanged || this.props.forceUpdate;
    }

    public componentDidMount() {
        const mapOptions: DependencyMap.DependencyMapDashBoardOptions = {
            enablePropertiesPanel: true,
            enableEdgeSelection: true,
            mapApiDataProvider: this.mapProvider,
            mapImagesRelativePath,
            telemetryListener: this.mapTelemetryListener,
            language: this.props.language,
            enableSimpleMapLayout: this.props.enableSimpleMapLayout
        };
        this.admWorkspace = new DependencyMap.AdmWorkspace(admmapDivId, mapOptions);

        // Force an initial re-rendering now that we have this.admWorkspace set
        this.setState({ sequence: 1 });
    }

    public render(): JSX.Element {
        AdmPropertiesPanelShim.Bind(this.props.onMapsContextChanged);
        this.updateMapDivOpacity(OPACITY_CLEAR);
        if (this.admWorkspace) {
            if (!this.props.workspace?.id || !this.props.mapId) {
                this.admWorkspace.clearMap();
                this.updateMapDivOpacity(OPACITY_OPAQUE);
            } else {
                this.renderMaps();
            }
        }

        return null;
    }

    private onMapIdChanged(id: string) {
        this.props.onMapComputerIdChanged(id);
    }

    private onMapRenderCompleted() {
        this.updateMapDivOpacity(OPACITY_OPAQUE);

        if (this.props.onMapComputationCompleted) {
            this.props.onMapComputationCompleted();
        }
    }

    private updateMapDivOpacity(opacity: string) {
        $(admmapDivId).css('opacity', opacity);
    }

    private renderMaps() {
        this.mapProvider.updateTime(this.props.workspace,
            this.props.startDateTimeUtc, this.props.endDateTimeUtc, this.props.mapId, this.props.mapType);

        let mapPromise: Promise<any>;
        let mapOptions: any = {
            collapseAllMachines: true,
            computerInfo: this.props.computers,
            groupAsSingleNode: true,
            mapId: this.props.mapId,
            mapDisplayName: this.props.mapDisplayName,
            mapType: this.props.mapType
        };

        // If this.props.mapApiResponse exists then validate data and errors.
        // If data exist and error does not exist, then directly pass data.
        // If data does not exist but error exist, then set the Map state to error.
        if (this.props.mapApiResponse && this.firstQuery) {
            if (this.props.mapApiResponse.data) {
                this.firstQuery = false;
                if (this.props.onMapComputationStarted) {
                    this.props.onMapComputationStarted();
                }
                mapPromise = this.admWorkspace.initializeDependencyMapV3(
                    this.props.mapApiResponse.data as DependencyMap.Api.v3.MapResponse,
                    mapOptions);
                this.telemetry.logEvent(`${this.props.logPath}.AdmMap.GetCoarseMap`, this.props.mapApiResponse.telemetryParams, undefined);
            } else if (this.props.mapApiResponse.errors) {
                this.firstQuery = false;
                const errors = this.props.mapApiResponse.errors
                this.updateMapDivOpacity(OPACITY_OPAQUE);
                let errorCode: DependencyMap.ErrorCode = DependencyMap.ErrorCode.UnknownError;
                let errorMessage: string = 'GenerateMap API failed';
                const statusCode: string = errors && errors.jqXHR && errors.jqXHR.status;
                const statusText: string = errors && errors.jqXHR && errors.jqXHR.statusText;
                if (errors && errors.jqXHR && errors.jqXHR.responseJSON && errors.jqXHR.responseJSON.error) {
                    if (errors.jqXHR.responseJSON.error.code === 'EmptyMachineGroup') {
                        errorCode = DependencyMap.ErrorCode.EmptyMachineGroup;
                    } else if (errors.jqXHR.responseJSON.error.code === 'MachineDoesNotExist'
                        || errors.jqXHR.responseJSON.error.code === 'NoDataForRequestedResource') {
                        errorCode = DependencyMap.ErrorCode.MachineDoesNotExist;
                    }
                    errorMessage = errors.jqXHR.responseJSON.error.message;
                }
                this.admWorkspace.handleErrorCode(errorCode);
                this.telemetry.logEvent(`${this.props.logPath}.AdmMap.GetCoarseMap`, {
                    isError: 'true',
                    message: errorMessage,
                    status: statusCode,
                    statusText,
                    error: JSON.stringify(this.props.mapApiResponse.errors)
                }, undefined);
                return;
            } else {
                // If neither data nor error present in the mapApiResponse object,
                // This indicates that the data is yet to be received by the blade.
                // This can happen if IFrame is ready but GetCoarseMap API is not completed.
                // In this case simply return.
                this.admWorkspace.clearMap();
                this.admWorkspace.setMapState(DependencyMap.LoadState.Load);
                this.updateMapDivOpacity(OPACITY_OPAQUE);
                return;
            }
        } else {
            if (this.props.onMapComputationStarted) {
                this.props.onMapComputationStarted();
            }
            this.updateMapDivOpacity(OPACITY_OPAQUE);
            mapPromise = this.admWorkspace.initializeDependencyMapV3(undefined, mapOptions);
        }
        mapPromise.then(() => {
            DependencyMap.AdmWorkspace.selectEntityByResourceId(this.props.mapId);
        });
    }

    private visibleServerPortsChanged(newPortIds: string[], oldPortIds: string[]): boolean {
        if (!newPortIds && !oldPortIds) {
            return false;
        }
        if (newPortIds !== oldPortIds) {
            return true;
        }
        if (newPortIds.length !== oldPortIds.length) {
            return false;
        }
        let sortedNewPortIds = newPortIds.sort();
        let sortedOldPortIds = oldPortIds.sort();

        for (let i = 0; i < sortedNewPortIds.length; i++) {
            if (sortedOldPortIds[i] !== sortedNewPortIds[i]) {
                return true;
            }
        }

        return false;
    }
}
