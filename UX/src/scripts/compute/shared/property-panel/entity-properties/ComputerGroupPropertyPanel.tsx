/** block / third party */
import * as React from 'react';

/** local */
import { ComputeResourceSummaryPropertyPanel } from './map-entity-adaptor/ComputeResourceSummaryPropertyPanel';
import { ConnectionSummaryPropertyPanel } from './map-entity-adaptor/ConnectionSummaryPropertyPanel';

/** compute */
import {
    KustoComputePropertyPanelResponseInterpreter,
    ComputeResourceSummary,
    ConnectionSummary
} from '../../../data-provider/KustoComputePropertyPanelResponseInterpreter';
import { VmInsightsDataProvider } from '../../../data-provider/VmInsightsDataProvider';
import { ComputeKustoQueryOptions } from '../../ComputeKustoQueryOptions';

/** shared */
import * as GlobalConstants from '../../../../shared/GlobalConstants';
import { PropertyPanelHeaderSection } from '../../../../shared/property-panel/PropertyPanelHeaderSection';
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { MessagingProvider } from '../../../../shared/MessagingProvider';
import { ITelemetry } from '../../../../shared/Telemetry';
import { IResolvedComputerGroup, ComputerGroup, ComputerGroupType, ServiceMapComputerGroup } from '../../../../shared/ComputerGroup';
import { ServiceMapGroupSvg } from '../../../../shared/svg/ServiceMapGroupSvg';
import { IKustoQueryOptions, KustoDataProvider } from '../../../../shared/data-provider/KustoDataProvider';
import { IWorkspaceInfo } from '../../../../shared/IWorkspaceInfo';
import { RetryARMDataProvider } from '../../../../shared/data-provider/RetryARMDataProvider';
import { ARMDataProvider } from '../../../../shared/data-provider/ARMDataProvider';
import { RetryPolicyFactory } from '../../../../shared/data-provider/RetryPolicyFactory';
import { ExpandableSection2 } from '../../../../shared/property-panel/ExpandableSection2';
import { ComputerGroupSvg } from '../../../../shared/svg/azure-computer-group';
import { MonitoringSvg } from '../../../../shared/svg/monitoring';
import { ApiClientRequestInfoBladeName } from '../../../../shared/data-provider/ApiClientRequestInfo';

export interface IComputerGroupPropertyPanelProps {
    workspace: IWorkspaceInfo;
    computerGroup: ComputerGroup;
    startDateTimeUtc: Date;
    endDateTimeUtc: Date;
    logPrefix: string;
    messagingProvider: MessagingProvider;
    telemetry: ITelemetry;
}

export interface IComputerGroupPropertyPanelState {
    computeResourceSummary: ComputeResourceSummary;
    connectionSummary: ConnectionSummary;
}

export class ComputerGroupPropertyPanel extends
    React.Component<IComputerGroupPropertyPanelProps, IComputerGroupPropertyPanelState> {
    private dataProvider: VmInsightsDataProvider;

    constructor(props: IComputerGroupPropertyPanelProps) {
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

        this.resolveComputerGroup = this.resolveComputerGroup.bind(this);
    }

    componentDidMount() {
        this.resolveComputerGroup();
    }

    // Ensure workspace has changed and reset the states so it will show as "loading"
    componentDidUpdate(prevProps: IComputerGroupPropertyPanelProps) {
        const groupUnequal: boolean = (!prevProps.computerGroup && !!this.props.computerGroup)
            || (!!prevProps.computerGroup && !this.props.computerGroup)
            || (!!prevProps.computerGroup && !!this.props.computerGroup
                && prevProps.computerGroup.id !== this.props.computerGroup.id);
        const componentDidUpdate: boolean = groupUnequal
            || prevProps.startDateTimeUtc !== this.props.startDateTimeUtc
            || prevProps.endDateTimeUtc !== this.props.endDateTimeUtc;
        if (componentDidUpdate) {
            this.setState({
                computeResourceSummary: undefined,
                connectionSummary: undefined
            }, () => {
                this.resolveComputerGroup();
            });
        }
        return componentDidUpdate;
    }

    public render() {
        const panelContent: JSX.Element[] = [];

        panelContent.push(<ExpandableSection2
            title={DisplayStrings.ComputeResourceSummaryGridTitle}
            titleIcon={<MonitoringSvg />}
            content={<ComputeResourceSummaryPropertyPanel computeResourceSummary={this.state.computeResourceSummary} />}
            isExpanded={true}
        />);

        panelContent.push(<ConnectionSummaryPropertyPanel
            workspace={this.props.workspace}
            connectionSummary={this.state.connectionSummary}
            logPrefix={this.props.logPrefix}
            telemetry={this.props.telemetry}
            messagingProvider={this.props.messagingProvider}
        />);

        let icon: JSX.Element = <ComputerGroupSvg />;
        if (this.props.computerGroup.groupType === ComputerGroupType.ServiceMapMachineGroup) {
            icon = <ServiceMapGroupSvg
                groupType={(this.props.computerGroup as ServiceMapComputerGroup).ServiceMapGroupType}
            />;
        }

        return <div className='computer-group'>
            <PropertyPanelHeaderSection
                icon={icon}
                title={this.props.computerGroup && this.props.computerGroup.displayName}
                subTitle={DisplayStrings.ComputerGroupSummarySubTitle}
            />
            {panelContent}
        </div>
    }

    private resolveComputerGroup(): void {
        const eventName: string = `${this.props.logPrefix}.ComputerGroupPropertyPanel`;
        const kustoQueryOptions: IKustoQueryOptions = new ComputeKustoQueryOptions(
            { queryName: eventName, bladeName: ApiClientRequestInfoBladeName.AtScale, isInitialBladeLoad: false },
            this.props.startDateTimeUtc, this.props.endDateTimeUtc);
        this.props.computerGroup.resolve().then((computerGroup: IResolvedComputerGroup) => {
            this.dataProvider.GetComputeResourcesSummary({
                workspaces: [this.props.workspace],
                computerGroup,
                kustoQueryOptions
            }).then((rawQueryResult: any) => {
                const computeResourceSummary: ComputeResourceSummary =
                    KustoComputePropertyPanelResponseInterpreter.ProcessComputeResourcesSummaryResult(rawQueryResult);
                this.setState({ computeResourceSummary });
            });
            this.dataProvider.GetConnectionSummary({
                workspaces: [this.props.workspace],
                computerGroup,
                kustoQueryOptions
            }).then((rawQueryResult: any) => {
                const connectionSummary: ConnectionSummary =
                    KustoComputePropertyPanelResponseInterpreter.ProcessConnectionSummaryResult(rawQueryResult);
                this.setState({ connectionSummary });
            })
        });
    }
}
