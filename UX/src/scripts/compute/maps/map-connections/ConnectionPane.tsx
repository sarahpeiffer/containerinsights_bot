/**
 * Block Imports
 */
import * as React from 'react';

/*
* AI Chart Imports
*/
import {
    ChartSeriesData
} from '@appinsights/aichartcore';

/*
* Maps Connection Imports
*/
import { ConnectionPanel } from './ConnectionPanel';
import { ConnectionPanelHeader } from './ConnectionPanelHeader';
import { ConnectionMetricName } from './ConnectionMetrics'
import { ConnectionDataProvider, IConnectionWrapper } from '../data-provider/ConnectionDataProvider';
import { ConnectionChartResponseInterpreter } from '../data-provider/ConnectionChartResponseInterpreter';

/**
 * Shared Imports
 */
import { IWorkspaceInfo } from '../../../shared/IWorkspaceInfo';
import { TimeInterval } from '../../../shared/data-provider/TimeInterval';
import { VmInsightsTelemetryFactory } from '../../../shared/VmInsightsTelemetryFactory';
import { ITelemetry, TelemetryMainArea, TelemetrySubArea } from '../../../shared/Telemetry';
import { DisplayStrings } from '../../../shared/DisplayStrings';
import * as msg from '../../../shared/MessagingProvider'

/** 
 * internal: properties for ConnectionPane
*/
export interface IConnectionPaneProps {
    selectedContext: DependencyMap.SelectionContext;
    workspace: IWorkspaceInfo;
    startDateTimeUtc: Date;
    endDateTimeUtc: Date;
    mapData: DependencyMap.IMap;
    logPrefix: string;
    messagingProvider?: msg.MessagingProvider;
};

/*
* internal: ConnectionPane State Members
*/
interface IConnectionPaneState {
    connectionMetrics: any;
    startDateTimeUtc: Date;
    endDateTimeUtc: Date;
    timeInterval: TimeInterval;
    selectedContext: DependencyMap.SelectionContext;
    panelHeader: ConnectionPanelHeader;
    mapData: DependencyMap.IMap;
    isLoading: boolean;
    isError: boolean;
    isClientGroupSource: boolean;
    chartData: StringMap<StringMap<ChartSeriesData>>;
};

/*
* internal: Connection
* based on the type of Edge (Connection, AggConnection), appropriate ArmIds
* are used as source and destination
*/
class Connection {
    source: string[];
    destination: string[];
    sourceName: string;
    destinationName: string;
};

/**
 * Gets metrics and renders charts for a given Entity (Connection, AggConnection) in SelectedContext
 * for a given time range: StartTime <-> EndTime
 * @param props properties 
 */
export class ConnectionPane extends React.Component<IConnectionPaneProps, IConnectionPaneState> {
    private telemetry: ITelemetry;

    constructor(props) {
        super(props)

        this.telemetry = VmInsightsTelemetryFactory.get(TelemetryMainArea.Maps);
        this.telemetry.setContext({ subArea: TelemetrySubArea.ConnectionMetrics }, false);

        this.state = {
            connectionMetrics: undefined,
            startDateTimeUtc: this.props.startDateTimeUtc,
            endDateTimeUtc: this.props.endDateTimeUtc,
            // Overriding TimeInterval to have 1 second buckets
            // This needs to be revisited
            timeInterval: new TimeInterval(
                this.props.startDateTimeUtc,
                this.props.endDateTimeUtc,
                60, 1),
            selectedContext: this.props.selectedContext,
            panelHeader: new ConnectionPanelHeader('', ''),
            mapData: this.props.mapData,
            isLoading: true,
            isError: false,
            isClientGroupSource: undefined,
            chartData: {}
        }

    }

    public render(): JSX.Element {
        const informNoConnectiondata = (this.state.isClientGroupSource === true
            && this.state.isError === true);

        const info = (this.state.isClientGroupSource) ? DisplayStrings.ConnectionClientGroupOnlyMonitored : undefined;

        return (
            <ConnectionPanel
                chartData={this.state.chartData}
                panelHeader={this.state.panelHeader}
                timeInterval={this.state.timeInterval}
                isLoading={this.state.isLoading}
                // Do not show error, but show a blank chart
                // But Pane needs to know what state it is in
                // TODO: Change it there are better options
                isError={false}
                informNoConnectiondata={informNoConnectiondata}
                info={info}
                selectedContext={this.state.selectedContext}
                workspace={this.props.workspace}
                messagingProvider={this.props.messagingProvider}
                logPrefix={this.props.logPrefix}
            />
        );
    }

    // When new props will be received
    // TODO should compare with this.props install of state. right?
    public componentWillReceiveProps(nextProps: IConnectionPaneProps) {
        if (nextProps.startDateTimeUtc !== this.state.startDateTimeUtc ||
            nextProps.endDateTimeUtc !== this.state.endDateTimeUtc ||
            nextProps.selectedContext !== this.state.selectedContext) {
            this.setState({
                connectionMetrics: undefined,
                startDateTimeUtc: nextProps.startDateTimeUtc,
                endDateTimeUtc: nextProps.endDateTimeUtc,
                // Overriding TimeInterval to have 1 second buckets
                // This needs to be revisited
                timeInterval: new TimeInterval(
                    nextProps.startDateTimeUtc,
                    nextProps.endDateTimeUtc,
                    60, 1),
                selectedContext: nextProps.selectedContext,
                panelHeader: new ConnectionPanelHeader('', ''),
                mapData: nextProps.mapData,
                isLoading: true,
                isError: false,
                isClientGroupSource: undefined
            }, this.getConnectionMetrics);
        }
    }

    /*
     * When the component will be mounted
     * This gets called the first time the panel is created, from next time onwards
     * only props are updated so componentWillReceiveProps() will be called
     * till this panel gets destroyed
     */
    public componentWillMount() {
        this.getConnectionMetrics();
    }

    /*
    * Returns display name from the entity map
    * Since 'ClientGroup' is a set of IPs, keyword 'ClientGroup'
    * is returned
    */
    private getDisplayNameFromEntityMap(ids: string[]) {
        const mapData = this.state.mapData || ({ mapdata: {} } as any);
        let displayName = '';
        if (ids.length > 0) {
            const entity = mapData.entities[ids[0]] as any;
            if (!entity) {
                return null;
            }
            switch (entity.type) {
                case DependencyMap.EntityType.Machine:
                case DependencyMap.EntityType.Process:
                case DependencyMap.EntityType.ProcessGroup:
                case DependencyMap.EntityType.ServerGroupV3:
                    displayName = entity.displayName;
                    break;
                case DependencyMap.EntityType.ClientGroupV3:
                case DependencyMap.EntityType.ClientGroup:
                    displayName = 'ClientGroup';
                    this.setState({ isClientGroupSource: true });
                    break;
                default:
                    this.telemetry.logEvent(
                        `${this.props.logPrefix}.ConnectionMetrics.UnsupportedEntityType`,
                        { entityType: entity.type },
                        undefined);
                    console.log('Unsupported Entity Type:' + entity.type);
                    break;
            }
        }

        return displayName;
    }

    /*
    * For a selectedContext, it retuns an object of type Connection
    * In the existing Independent Maps, AggConnection is generated in UI
    * by making a list of all unique edges, so API does not know it and we cannot directly query
    * using AggConnection ArmId
    * With Large scale Maps, all Edges should be of type 'Connection' and can be queried directly to API 
    */
    private extractConnectionFromSelectedContext(context: DependencyMap.SelectionContext): Connection {
        const selectedContext = context || ({ entity: {} } as any);
        let connection: Connection = new Connection();
        connection.source = new Array<string>();
        connection.destination = new Array<string>();
        switch (selectedContext.entity.type) {
            case DependencyMap.EntityType.Connection:
            case DependencyMap.EntityType.ClientGroupMemberVirtualConnection:
            case DependencyMap.EntityType.ServerGroupMemberVirtualConnection:
                connection.source.push(selectedContext.entity.source);
                connection.destination.push(selectedContext.entity.destination);
                break;
            // This is UI defined Entity, API does not know about this
            case DependencyMap.EntityType.AggConnection:
                selectedContext.entity.clients.forEach((client) => {
                    if (client) {
                        connection.source.push(client);
                    }
                });
                selectedContext.entity.servers.forEach((server) => {
                    if (server) {
                        connection.destination.push(server);
                    }
                });
                break;
            default:
                console.log('SelectedContext is not a Connection type entity.');
                break;
        }

        // Keep a 'Source' to 'Destination' strings separate, which will be used as a title/subtitle
        // This name is taken from Entity Map based on what name is stored
        let sourceName = this.getDisplayNameFromEntityMap(connection.source);
        if (!sourceName) {
            sourceName = selectedContext.entity.sourceName || DisplayStrings.undefine;
        }
        connection.sourceName = sourceName;

        let destinationName = this.getDisplayNameFromEntityMap(connection.destination);
        if (!destinationName) {
            destinationName = selectedContext.entity.destinationName || DisplayStrings.undefine;
        }
        connection.destinationName = destinationName;

        return connection;
    }

    /*
    * If the type is ProcessGroup, flatten ProcessGroup to a list of Processes
    * For everything else keep it same.
    */
    private processEntities(entities: string[]): string[] {
        const mapData = this.state.mapData || ({ mapdata: {} } as any);
        let processedEntities = new Array<string>();

        entities.forEach((id) => {
            const entity = mapData.entities[id] || {} as any;

            switch (entity.type) {
                case DependencyMap.EntityType.ProcessGroup:
                    const processGroup = entity as DependencyMap.ProcessGroup;
                    processGroup.processes.forEach((process) => {
                        processedEntities.push(process.id);
                    })
                    break;
                case DependencyMap.EntityType.ClientGroupV3:
                    const clientGroup = entity as DependencyMap.ClientGroupViewModelV3;
                    // getFilteredMemberIds returns a list of ArmIds
                    // argument when set to true - returns a list of monitered machines
                    // currently API supports only monitored machines, when API starts to return
                    // metrics for unmonitored machines remove argument 'true'
                    // If unmonitored ArmIds are passed, API will throw an exception.
                    processedEntities = clientGroup.getFilteredMemberIds(true);
                    break;
                case DependencyMap.EntityType.ServerGroupV3:
                    const serverGroup = entity as DependencyMap.ServerGroupViewModelV3;
                    const port = serverGroup.armId.split('!')[1];
                    const destinationArmId = this.getServerGroupNormalizedArmId(port, serverGroup.armId);
                    processedEntities.push(destinationArmId);
                    break;
                default:
                    processedEntities.push(id);
                    break;
            }
        });

        return processedEntities;
    }

    /*
    * Returns a normalized serverGroup ArmId
    * referenceArmId is split to get armId containing subscription, workspace etc
    * servergroup part is replaced with machines/t-00000000/ports/b-00000000_PORT
    */
    private getServerGroupNormalizedArmId(port: string, referenceArmId: string): string {
        const workspaceArmId = referenceArmId.split('/features/serviceMap/')[0];
        const destinationArmId = workspaceArmId
            + '/features/serviceMap/machines/t-00000000/ports/b-00000000_'
            + port;
        return destinationArmId;
    }

    /*
    * Returns a curated connection with a source[], a destination[] and a displayName
    * The Ids present in these arrays should be recognizable by API
    */
    private getConnectionDetails(currentState: IConnectionPaneState): Connection {
        const selectedContext = currentState.selectedContext || ({ entity: {} } as any);
        let connection = this.extractConnectionFromSelectedContext(selectedContext);
        let curatedConnection: Connection = new Connection();

        if (connection && connection.source && connection.destination) {
            curatedConnection.source = new Array<string>();
            curatedConnection.destination = new Array<string>();
            curatedConnection.sourceName = connection.sourceName;
            curatedConnection.destinationName = connection.destinationName;
            curatedConnection.source = this.processEntities(connection.source);

            /* Find out if the connection destination is a ServerGroup
            * If so, get the port number and send as id ="" instead of all the
            * individual IP:PORT destination Ids
            * When it is a servergroup it is represented like below:
            * /subscription/52.../machines/m-8732../processes/p-98712...-sg!443
            */
            let isServerGroup;
            if (selectedContext.entity.armId) {
                isServerGroup = selectedContext.entity.armId.match(/-sg!\d+$/);
            }

            if (isServerGroup) {
                const port = isServerGroup[0].split('!')[1];
                const destinationArmId = this.getServerGroupNormalizedArmId(port, selectedContext.entity.armId);
                curatedConnection.destination.push(destinationArmId);
            } else {
                curatedConnection.destination = this.processEntities(connection.destination);
            }
        }

        return curatedConnection;
    }

    /*
    * This is the Async funtion which initiates a request and waits for response
    */
    private getConnectionMetrics() {
        this.telemetry.logPageView(`${this.props.logPrefix}.${TelemetrySubArea.ConnectionMetrics.toString()}`);
        let connection = this.getConnectionDetails(this.state);

        if (!connection || !connection.source || !connection.destination) {
            console.log('Unable to determine a valid connection:' + connection);
            this.setState({
                connectionMetrics: undefined,
                chartData: {},
                isLoading: false,
                isError: true
            });

            return;
        }

        this.setState({
            panelHeader: new ConnectionPanelHeader(
                connection.sourceName,
                'Connections to ' + connection.destinationName
            )
        });

        const provider = new ConnectionDataProvider();
        const metricNames = [
            ConnectionMetricName.ResponseTime,
            ConnectionMetricName.BytesSent,
            ConnectionMetricName.BytesReceived,
            ConnectionMetricName.LinksLive,
            ConnectionMetricName.LinksFailed,
            ConnectionMetricName.LinksEstablished,
            ConnectionMetricName.LinksTerminated
        ];

        const evaluateConnectionMetricsTelemetry = this.telemetry.startLogEvent(
            `${this.props.logPrefix}.ConnectionMetrics.evaluateConnectionMetrics`,
            {
                workspaceId: this.props.workspace.id,
                startDateTimeUtc: this.state.timeInterval.getBestGranularStartDate().toISOString(),
                endDateTimeUtc: this.state.timeInterval.getBestGranularEndDate().toISOString()
            },
            undefined
        );

        provider.evaluateConnectionMetrics(
            this.props.workspace,
            this.state.timeInterval,
            metricNames,
            connection.source,
            connection.destination).then((data: IConnectionWrapper) => {
                evaluateConnectionMetricsTelemetry.complete();
                let connectionChartResponseInterpreter = new ConnectionChartResponseInterpreter();
                let chartData = connectionChartResponseInterpreter.getChartData(
                    data.connection, undefined, this.state.timeInterval);

                this.setState({
                    connectionMetrics: data,
                    chartData: chartData,
                    isLoading: false,
                    isError: false
                });
            }).catch((err) => {
                evaluateConnectionMetricsTelemetry.fail(err);
                this.setState({
                    connectionMetrics: undefined,
                    chartData: {},
                    isLoading: false,
                    isError: true
                });
            });
    }
}
