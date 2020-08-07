import * as React from 'react';

import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { ChevronDownSvg } from '../../../../shared/svg/chevron-down';
import { ChevronRightSvg } from '../../../../shared/svg/chevron-right';
import { ExpandableSection2 } from '../../../../shared/property-panel/ExpandableSection2';
import { PropertyPanelHeaderSection } from '../../../../shared/property-panel/PropertyPanelHeaderSection';
import { ITelemetry } from '../../../../shared/Telemetry';
import { MessagingProvider } from '../../../../shared/MessagingProvider';
import { PropertyPanelDonutChartWithLegend } from '../component/PropertyPanelDonutChartWithLegend';
import { MachinePropertyPanelAdaptor } from './map-entity-adaptor/MachinePropertyPanelAdaptor'
import { MapEntityUtility as mapUtility } from './MapEntityUtility';
import { LinkToNavigateAdaptor, ILinkToNavigate, NavigationDestination } from './LinkToNavigateAdaptor';
import { GUID } from '@appinsights/aichartcore';
import { IKustoQueryOptions, KustoDataProvider } from '../../../../shared/data-provider/KustoDataProvider';
import { ComputerGroupType } from '../../../../shared/ComputerGroup';
import { VmInsightsDataProvider } from '../../../data-provider/VmInsightsDataProvider';
import { RetryARMDataProvider } from '../../../../shared/data-provider/RetryARMDataProvider';
import { ARMDataProvider } from '../../../../shared/data-provider/ARMDataProvider';
import { RetryPolicyFactory } from '../../../../shared/data-provider/RetryPolicyFactory';
import * as GlobalConstants from '../../../../shared/GlobalConstants';
import { TelemetryUtils } from '../../TelemetryUtils';
import { ConnectionSummaryComponent } from '../component/ConnectionSummaryComponent';
import { IPropertiesPanelQueryParams } from '../data-models/PropertiesPanelQueryParams';
import { TimeData } from '@appinsights/pillscontrol-es5';
import { TimeUtils } from '../../TimeUtils';

export interface IConnectionPropertiesPanelProps {
    machine: DependencyMap.Machine;
    telemetry: ITelemetry;
    linkProperties?: JSX.Element;
    messagingProvider?: MessagingProvider;
    logPrefix?: string;
    connectionQuery?: IPropertiesPanelQueryParams;
    dateTime: TimeData;
}

export interface IConnectionSummaryCount {
    linkFailedCount: number;
    linkLiveCount: number;
    linkMaliciousCount: number;
    linkEstablishedCount: number;
    linkTerminatedCount: number;
}

interface IConnectionPropertiesPanelState {
    connectionQueryResults: IConnectionSummaryCount;
};

export enum ConnectionType {
    LinkFailed,
    LinkLive,
    LinkMalicious,
    LinkEstablished,
    LinkTerminated
}

/**
 * This class is reponsible for rendering the Connections Property Panel of the Dependency Map Machine 
 * which is linked through Connections Tab in Property Panel 
 */
export class ConnectionPropertiesPanel extends React.Component<IConnectionPropertiesPanelProps, IConnectionPropertiesPanelState> {
    private telemetry: ITelemetry;
    private dataProvider: VmInsightsDataProvider;
    private armDataProvider: RetryARMDataProvider;

    constructor(props: IConnectionPropertiesPanelProps) {
        super(props);
        this.telemetry = this.props.telemetry;
        this.armDataProvider = new RetryARMDataProvider(new ARMDataProvider(), new RetryPolicyFactory());
        this.dataProvider = new VmInsightsDataProvider(
            new KustoDataProvider(
                this.armDataProvider,
                GlobalConstants.VMInsightsApplicationId
            ));

        this.state = {
            connectionQueryResults: undefined
        }
    }

    public componentDidMount() {
        this.getConnectionSummary(this.props.connectionQuery);
    }

    public componentDidUpdate(prevProps: IConnectionPropertiesPanelProps) {
        if (!this.props || !this.props.connectionQuery) {
            this.setState({
                connectionQueryResults: undefined
            });
            return;
        }

        if (!prevProps && this.props || (this.props !== prevProps)) {
            this.getConnectionSummary(this.props.connectionQuery);
        }
    }

    public render() {
        const machine = new MachinePropertyPanelAdaptor(this.props.telemetry, this.props.machine, this.props.messagingProvider);
        const panelContent: JSX.Element[] = [];

        // linkProperties is from grid entity.
        if (this.props.linkProperties) {
            panelContent.push(<ExpandableSection2
                title={DisplayStrings.QuickLinks}
                content={this.props.linkProperties}
                expandIcon={<ChevronRightSvg />}
                collapseIcon={<ChevronDownSvg />}
                isExpanded={true}
                key={'quick-links'}
            />)
        }

        let machineDependencyProperties = machine.getMachineDependency();
        if (machineDependencyProperties) {
            panelContent.push(<ExpandableSection2
                title={DisplayStrings.Dependency}
                content={<PropertyPanelDonutChartWithLegend
                    donutChartSlices={machineDependencyProperties}
                    innerRadius={mapUtility.donutChartInnerRadius}
                    outerRadius={mapUtility.donutChartOuterRadius} />}
                expandIcon={<ChevronRightSvg />}
                collapseIcon={<ChevronDownSvg />}
                isExpanded={true}
                key={'dependency'}
            />);
        }


        if (this.state.connectionQueryResults) {
            panelContent.push(<ConnectionSummaryComponent
                connectionSummary={this.state.connectionQueryResults}
                onConnectionDetailsButtonClicked={() => this.navigateToLogsBlade()}
                messagingProvider={this.props.messagingProvider}
                onConnectionSummaryRowClicked={(connectionType: ConnectionType) => this.navigateToLogsBlade(connectionType)}
            />);
        }

        const linkToNavigate: ILinkToNavigate =
            LinkToNavigateAdaptor.navigationParams(NavigationDestination.resourceOverview,
                { linkUri: machine.getResourceId(), linkText: DisplayStrings.Name }, this.props.messagingProvider);
        return (<>
            <PropertyPanelHeaderSection
                icon={machine.getIcon()}
                title={machine.getTitle()}
                subTitle={machine.getSubTitle()}
                linkToNavigate={linkToNavigate}
                telemetry={this.props.telemetry}
                logPrefix={this.props.logPrefix}
            />
            {panelContent}
        </>);
    }

    private getConnectionSummary(connectionQuery: IPropertiesPanelQueryParams) {
        const sessionId: string = GUID().toLowerCase();
        const eventName: string = `${this.props.logPrefix}.GetConnectionSummary`;
        const properties = this.getTelemetryLogProperties(connectionQuery, sessionId);
        const telemetryContext = this.props.telemetry.startLogEvent(eventName, properties, undefined);

        const queryOptions: IKustoQueryOptions = { requestInfo: eventName, sessionId, timeInterval: connectionQuery.timeInterval };
        connectionQuery.kustoQueryOptions = queryOptions;
        this.dataProvider.getConnectionSummary(connectionQuery).then((connectionSummary) => {
            telemetryContext.complete(properties);
            this.setState({
                connectionQueryResults: this.convertKustoResponseToConnectionSummary(connectionSummary, connectionQuery)
            });
        }).catch((err) => {
            TelemetryUtils.completeApiTelemetryEvent(telemetryContext, false, true, JSON.stringify(err));
            throw err;
        });

    }

    private getTelemetryLogProperties(queryProps: IPropertiesPanelQueryParams,
        sessionId: string): StringMap<string> {
        const properties: StringMap<string> = {};
        properties['workspaceId'] = queryProps.workspace && queryProps.workspace.id;
        properties['sessionId'] = sessionId;
        properties['resourceId'] = queryProps.resourceId;
        properties['computerName'] = queryProps.computerName

        if (queryProps.computerGroup) {
            properties['group_type'] = ComputerGroupType[queryProps.computerGroup.groupType];
            properties['group_id'] = queryProps.computerGroup.id;
        }

        return properties;
    }

    private convertKustoResponseToConnectionSummary(kustoResponse: any,
        connectionQueryParams: IPropertiesPanelQueryParams): IConnectionSummaryCount {
        if (!this.isValidKustoResponse(kustoResponse)
            || kustoResponse.Tables[0].Columns.length !== 5) {
            return null;
        }
        const kustoTable: any = kustoResponse.Tables[0];
        let connectionSummaryCount: IConnectionSummaryCount = {
            linkFailedCount: 0,
            linkLiveCount: 0,
            linkMaliciousCount: 0,
            linkEstablishedCount: 0,
            linkTerminatedCount: 0
        }

        const rowIndex: number = 0;
        for (let columnIndex: number = 0; columnIndex < kustoTable.Rows[0].length; columnIndex++) {
            switch (columnIndex) {
                case ConnectionType.LinkFailed:
                    connectionSummaryCount.linkFailedCount = kustoTable.Rows[rowIndex][columnIndex];
                    break;
                case ConnectionType.LinkLive:
                    connectionSummaryCount.linkLiveCount = kustoTable.Rows[rowIndex][columnIndex];
                    break;
                case ConnectionType.LinkMalicious:
                    connectionSummaryCount.linkMaliciousCount = kustoTable.Rows[rowIndex][columnIndex];
                    break;
                case ConnectionType.LinkEstablished:
                    connectionSummaryCount.linkEstablishedCount = kustoTable.Rows[rowIndex][columnIndex];
                    break;
                case ConnectionType.LinkTerminated:
                    connectionSummaryCount.linkTerminatedCount = kustoTable.Rows[rowIndex][columnIndex];
                    break;
                default:
                    this.telemetry.logEvent(`${this.props.logPrefix}.convertKustoResponseToConnectionSummary`,
                        {
                            errorMessage: `Reeceived connection summary ${kustoTable.Rows[rowIndex][columnIndex]}`,
                            queryParams: JSON.stringify(connectionQueryParams)
                        }, undefined);
                    break;
            }
        }
        return connectionSummaryCount;
    }

    private isValidKustoResponse(kustoResponse: any): boolean {
        if (!kustoResponse || !kustoResponse.Tables || kustoResponse.Tables.length <= 0) {
            return false;
        }

        let kustoTable = kustoResponse.Tables[0];
        if (!kustoTable || !kustoTable.Rows || !kustoTable.Columns) {
            return false;
        }
        return true;
    }

    private navigateToLogsBlade(connectionType?: ConnectionType) {
        const message = {
            id: this.props.connectionQuery?.workspace?.id,
            query: this.dataProvider.getConnectionSummaryRowQueryTemplate(this.props.connectionQuery, connectionType),
            timespanInIsoFormat: TimeUtils.convertTimeDateToTimespanInIsoFormat(this.props.dateTime)
        }

        if (!message || !message.id || !message.query) {
            return null;
        }
        let contextCopy = Object.assign(this.props.connectionQuery, {
            query: message.query
        })
        this.telemetry.logEvent('PropertyPanel.ConnectionPropertiesPanel.NavigateToLogSearch', contextCopy, null);
        this.props.messagingProvider.sendNavigateToLogSearch(message);
    }
}
