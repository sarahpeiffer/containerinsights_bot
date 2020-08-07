import * as React from 'react';

import { SelectableGrid, SGDataRow, SGColumn } from 'appinsights-iframe-shared';

import { DisplayStrings } from '../../../shared/DisplayStrings';
import { LoadingSvg } from '../../../shared/svg/loading';
import { ITelemetry, TelemetryMainArea } from '../../../shared/Telemetry';
import { VmInsightsTelemetryFactory } from '../../../shared/VmInsightsTelemetryFactory';
import { ErrorSeverity } from '../../../shared/data-provider/TelemetryErrorSeverity';
import { ErrorSvg } from '../../../shared/svg/error';
import * as msg from '../../../shared/MessagingProvider';
import { PropertyPanelHeaderSection } from '../../../shared/property-panel/PropertyPanelHeaderSection';

import { SGFormattedPlainCell } from '../../../selectable-grid';

import { MachinePropertyPanelAdaptor } from './entity-properties/map-entity-adaptor/MachinePropertyPanelAdaptor'
import { IEventLogQueryResults, LogEventPanelQueryHelper } from './LogEventPanelQueryHelper';

/* required for ie11... this will enable most of the Object.assign functionality on that browser */
import { polyfillObjectAssign } from '../../../shared/ObjectAssignShim';
import { IWorkspaceInfo } from '../../../shared/IWorkspaceInfo';
import { TimeData } from '@appinsights/pillscontrol-es5';
import { TimeUtils } from '../TimeUtils';
polyfillObjectAssign();

export interface ILogEventPanelProps {
    /**
     * selected entity from the map
     */
    selectedContext: DependencyMap.SelectionContext;
    /**
     * workspace used to generate the query
     */
    workspace: IWorkspaceInfo;
    resourceId?: string;
    startDateTimeUtc: Date;
    endDateTimeUtc: Date;
    dateTime: TimeData;

    /**
     * messageProvider
     */
    messagingProvider: msg.MessagingProvider;

    telemetryMainArea: TelemetryMainArea;

    telemetryPreFix: string;
}

interface ILogEventPanelState {
    machineName: string,
    title: string,
    icon: JSX.Element,
    subTitle: string,
    logEventQueryResults: IEventLogQueryResults
};

/**
 * Log Event panel will make kusto query and show log event. 
 * panel has three status, loading ..., err panel, and normal log event panel
 */
export class LogEventPanel extends React.Component<ILogEventPanelProps, ILogEventPanelState> {
    private telemetry: ITelemetry;
    private readonly EVENT_TYPE_WIDTH: number = 215;
    private readonly AGGREGATED_COUNT_WIDTH: number = 110;

    /**
    * Helper to perform the events query
    * @private
    * @type LogEventPanelQueryHelper
    */
    private logEventQueryHelper: LogEventPanelQueryHelper;

    constructor(props?: ILogEventPanelProps) {
        super(props);

        this.telemetry = VmInsightsTelemetryFactory.get(this.props.telemetryMainArea);
        this.logEventQueryHelper = new LogEventPanelQueryHelper(this.telemetry, this.props.telemetryPreFix);

        this.navigateToSearchBlade = this.navigateToSearchBlade.bind(this);
        this.state = {
            machineName: null,
            title: null,
            icon: null,
            subTitle: null,
            logEventQueryResults: null
        }
    }

    public componentWillMount() {
        this.queryLogEvent(this.props);
    }

    public componentWillReceiveProps(nextProps: Readonly<ILogEventPanelProps>) {
        if ((this.props.workspace && this.props.workspace.id) !== (nextProps.workspace && nextProps.workspace.id)
            || this.props.startDateTimeUtc !== nextProps.startDateTimeUtc ||
            this.props.endDateTimeUtc !== nextProps.endDateTimeUtc
            || this.getNewLogEventPanelState(this.props).machineName
            !== this.getNewLogEventPanelState(nextProps).machineName) {

            this.queryLogEvent(nextProps);
        }
    }

    public render() {
        let content;
        if (!this.state.logEventQueryResults || !this.state.logEventQueryResults.logEvents) {
            content = <div className='log-event-panel-loading-icon'>
                <LoadingSvg />
            </div>;
        } else if (this.state.logEventQueryResults.isError) {
            content = <div>
                <div className='log-event-panel-error-icon'>
                    <ErrorSvg />
                </div>
                <div className='log-event-error'>
                    {DisplayStrings.LogEventPanelError}
                </div>
                <div className='log-event-error-message'>
                    {DisplayStrings.LogEventPanelErrorMessage}
                </div>
            </div>;
        } else {
            const gridData = this.getGridData();
            const columnDefinition = this.getColumnDefinition();
            content = <div className='log-event-tabular'>
                <div className='log-event-message' tabIndex={0}>{DisplayStrings.LogEventPanelMessage}</div>
                <SelectableGrid
                    columns={columnDefinition}
                    data={gridData}
                    onSelect={(logEvent: DependencyMap.Integrations.ILogEvents) => {
                        this.navigateToSearchBlade(logEvent);
                    }}
                />
            </div>
        }

        return (
            <div>
                <PropertyPanelHeaderSection
                    title={this.state.title}
                    icon={this.state.icon}
                    subTitle={this.state.subTitle}
                />
                {content}
            </div>
        );
    }

    /**
     * 1. valid selected context and got valid machine name, otherwise show error panel
     * 2. query log Event base on machine name
     */
    private queryLogEvent(props: ILogEventPanelProps) {
        const newState = this.getNewLogEventPanelState(props);
        this.setState(newState);

        if (newState.machineName) {
            const workspace: IWorkspaceInfo = props.workspace || this.props.workspace;
            const resourceId: string = props.resourceId || this.props.resourceId;
            const startDateTimeUtc: Date = props.startDateTimeUtc || this.props.startDateTimeUtc;
            const endDateTimeUtc: Date = props.endDateTimeUtc || this.props.endDateTimeUtc;

            this.logEventQueryHelper.query(
                newState.machineName,
                workspace,
                resourceId,
                startDateTimeUtc,
                endDateTimeUtc).then((result: IEventLogQueryResults) =>
                    this.setState({ logEventQueryResults: result }));
        }
    }

    private getColumnDefinition(): SGColumn[] {
        const columnDefinitions: SGColumn[] = [];
        columnDefinitions.push({
            name: DisplayStrings.EventType,
            width: this.EVENT_TYPE_WIDTH,
            cell: SGFormattedPlainCell(data => data, data => data)
        });
        columnDefinitions.push({
            name: DisplayStrings.Count,
            width: this.AGGREGATED_COUNT_WIDTH,
            cell: SGFormattedPlainCell(data => data, data => data)
        });
        return columnDefinitions;
    }

    private getGridData(): SGDataRow[] {
        const rows: SGDataRow[] = [];
        for (const logEvent of this.state.logEventQueryResults.logEvents) {
            const row: SGDataRow = new SGDataRow([logEvent.Type, logEvent.AggregatedValue], logEvent);
            rows.push(row);
        }
        return rows;
    }

    private navigateToSearchBlade(logEvent: DependencyMap.Integrations.ILogEvents) {
        let logProperties = this.getLogProperties(this.props);
        if (!this.props.messagingProvider || !this.props.messagingProvider.sendNavigateToLogSearch) {
            this.telemetry.logException(
                'messagingProvider or sendNavigateToLogSearch is null, should not happen',
                'LogEventPanel.tsx',
                ErrorSeverity.Error,
                logProperties,
                null);
            return;
        }

        const msg = {
            id: this.props.workspace && this.props.workspace.id, // TODO bb: Pass workspaceObject directly
            query: DependencyMap.AdmLogEventsManager.generateQueryInSearchBlade(logEvent, this.state.machineName),
            timespanInIsoFormat: TimeUtils.convertTimeDateToTimespanInIsoFormat(this.props.dateTime)
        }

        let contextCopy = Object.assign(logProperties, {
            eventType: logEvent.Type,
            aggregatedValue: logEvent.AggregatedValue.toString(),
            query: msg.query
        })
        this.telemetry.logEvent('PropertyPanel.LogEvent.NavigateToLogSearch', contextCopy, null);

        this.props.messagingProvider.sendNavigateToLogSearch(msg);
    }

    /**
     * valid selected context, log and return error state is invalid
     * get new state before send out query
     */
    private getNewLogEventPanelState(props: ILogEventPanelProps): ILogEventPanelState {
        if (!props.selectedContext || !props.selectedContext.entity) {
            return this.logAndGetErrorState('Got Empty SelectedContext or entity', props);
        }

        let adaptor = MachinePropertyPanelAdaptor.getMachineAdaptor(this.telemetry, props.selectedContext.entity);
        if (!adaptor || !adaptor.getMachineNameForQuery()) {
            return this.logAndGetErrorState('Unsupported entity or fail to get valid Machine name for Query', props);
        }

        return {
            machineName: adaptor.getMachineNameForQuery(),
            title: adaptor.getTitle(),
            icon: adaptor.getIcon(),
            subTitle: adaptor.getLogEventSubTitle(),
            logEventQueryResults: null
        };
    }

    private getLogProperties(props: ILogEventPanelProps): StringMap<string> {
        return {
            workspace_id: props.workspace && this.props.workspace.id,
            startDateTimeUtc: props.startDateTimeUtc.toISOString(),
            endDateTimeUtc: props.endDateTimeUtc.toISOString(),
            telemetryPreFix: props.telemetryPreFix
        };
    }

    /**
     * set logEventQueryResults.isError = false, so that UI will show error Log Event panel
     * And Log this Error message
     * @param errorMessage 
     */
    private logAndGetErrorState(errorMessage: string, props: ILogEventPanelProps): ILogEventPanelState {
        const logProperties: StringMap<string> = this.getLogProperties(props);
        this.telemetry.logException(errorMessage,
            'LogEventPanel', ErrorSeverity.Error, logProperties, null);

        return {
            machineName: null,
            title: null,
            icon: null,
            subTitle: null,
            logEventQueryResults: { logEvents: null, isError: true }
        }
    }
}
