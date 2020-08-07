/** block / third party */
import * as React from 'react';

/** local */
import { ComputeResourceSummaryPropertyPanel } from './map-entity-adaptor/ComputeResourceSummaryPropertyPanel';
import { ConnectionSummaryPropertyPanel } from './map-entity-adaptor/ConnectionSummaryPropertyPanel';

/** compute */
import { VmInsightsDataProvider } from '../../../data-provider/VmInsightsDataProvider';
import { ComputeResourceSummary, ConnectionSummary } from '../../../data-provider/KustoComputePropertyPanelResponseInterpreter';
import { KustoComputePropertyPanelResponseInterpreter } from '../../../data-provider/KustoComputePropertyPanelResponseInterpreter';
import { ComputeKustoQueryOptions } from '../../ComputeKustoQueryOptions';

/** shared */
import * as GlobalConstants from '../../../../shared/GlobalConstants';
import { IWorkspaceInfo } from '../../../../shared/IWorkspaceInfo';
import { PropertyPanelHeaderSection } from '../../../../shared/property-panel/PropertyPanelHeaderSection';
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { LogAnalyticsSVG } from '../../../../shared/svg/log-analytics';
import { KustoDataProvider, IKustoQueryOptions } from '../../../../shared/data-provider/KustoDataProvider';
import { RetryARMDataProvider } from '../../../../shared/data-provider/RetryARMDataProvider';
import { ARMDataProvider } from '../../../../shared/data-provider/ARMDataProvider';
import { RetryPolicyFactory } from '../../../../shared/data-provider/RetryPolicyFactory';
import { ExpandableSection2 } from '../../../../shared/property-panel/ExpandableSection2';
import { MessagingProvider } from '../../../../shared/MessagingProvider';
import { ITelemetry } from '../../../../shared/Telemetry';
import { MonitoringSvg } from '../../../../shared/svg/monitoring';
import { ApiClientRequestInfoBladeName } from '../../../../shared/data-provider/ApiClientRequestInfo';

export interface IWorkspacePropertyPanelProps {
    workspace: IWorkspaceInfo;
    startDateTimeUtc: Date;
    endDateTimeUtc: Date;
    logPrefix: string;
    messagingProvider: MessagingProvider;
    telemetry: ITelemetry;
}

export interface IWorkspacePropertyPanelState {
    computeResourceSummary: ComputeResourceSummary;
    connectionSummary: ConnectionSummary;
}

/**
 * Property panel for workspace, this will be the "default" property panel properties shown in the AtScale
 * view.
 *
 * @export
 * @class WorkspacePropertyPanel
 * @extends {React.Component<IWorkspacePropertyPanelProps, IWorkspacePropertyPanelState>}
 */
export class WorkspacePropertyPanel extends React.Component<IWorkspacePropertyPanelProps, IWorkspacePropertyPanelState> {
    private dataProvider: VmInsightsDataProvider;

    constructor(props: IWorkspacePropertyPanelProps) {
        super(props);

        this.dataProvider = new VmInsightsDataProvider(
            new KustoDataProvider(
                new RetryARMDataProvider(new ARMDataProvider(), new RetryPolicyFactory()),
                GlobalConstants.VMInsightsApplicationId
            )
        );

        this.state = {
            computeResourceSummary: undefined,
            connectionSummary: undefined
        };

        this.queryWorkspaceData = this.queryWorkspaceData.bind(this);
    }

    componentDidMount() {
        this.queryWorkspaceData();
    }

    // Ensure workspace has changed and reset the states so it will show as "loading"
    componentDidUpdate(prevProps: IWorkspacePropertyPanelProps) {
        const prevWorkspaceId: string = prevProps.workspace && prevProps.workspace.id;
        const currentWorkspaceId: string = this.props.workspace && this.props.workspace.id;
        if (prevWorkspaceId !== currentWorkspaceId
            || prevProps.startDateTimeUtc !== this.props.startDateTimeUtc
            || prevProps.endDateTimeUtc !== this.props.endDateTimeUtc) {
            this.setState({
                computeResourceSummary: undefined,
                connectionSummary: undefined
            }, () => {
                this.queryWorkspaceData();
            });
        }
        return prevWorkspaceId !== currentWorkspaceId;
    }

    public render() {
        const panelContent: JSX.Element[] = [];

        panelContent.push(<ExpandableSection2
            key='title'
            title={DisplayStrings.ComputeResourceSummaryGridTitle}
            titleIcon={<MonitoringSvg />}
            content={<ComputeResourceSummaryPropertyPanel computeResourceSummary={this.state.computeResourceSummary} />}
            isExpanded={true}
        />);

        panelContent.push(<ConnectionSummaryPropertyPanel
            key='connection-summary'
            workspace={this.props.workspace}
            connectionSummary={this.state.connectionSummary}
            logPrefix={this.props.logPrefix}
            telemetry={this.props.telemetry}
            messagingProvider={this.props.messagingProvider}
        />);

        return <div className='workspace'>
            <PropertyPanelHeaderSection
                icon={<LogAnalyticsSVG />}
                title={this.props.workspace && this.props.workspace.name}
                subTitle={DisplayStrings.WorkspaceSubTitle}
            />
            {panelContent}
        </div>
    }

    private queryWorkspaceData(): void {
        const eventName: string = `${this.props.logPrefix}.WorkspacePropertyPanel`;
        const kustoQueryOptions: IKustoQueryOptions = new ComputeKustoQueryOptions(
            { queryName: eventName, bladeName: ApiClientRequestInfoBladeName.AtScale, isInitialBladeLoad: false },
            this.props.startDateTimeUtc, this.props.endDateTimeUtc);
        this.dataProvider.GetComputeResourcesSummary({
            workspaces: [this.props.workspace],
            kustoQueryOptions
        }).then((rawQueryResult: any) => {
            const computeResourceSummary: ComputeResourceSummary =
                KustoComputePropertyPanelResponseInterpreter.ProcessComputeResourcesSummaryResult(rawQueryResult);
            this.setState({ computeResourceSummary });
        });
        this.dataProvider.GetConnectionSummary({
            workspaces: [this.props.workspace],
            kustoQueryOptions
        }).then((rawQueryResult: any) => {
            const connectionSummary: ConnectionSummary =
                KustoComputePropertyPanelResponseInterpreter.ProcessConnectionSummaryResult(rawQueryResult);
            this.setState({ connectionSummary });
        })
    }
}
