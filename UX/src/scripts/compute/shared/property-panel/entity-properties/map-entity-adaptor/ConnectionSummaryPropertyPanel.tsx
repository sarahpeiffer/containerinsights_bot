/** tpl */
import * as React from 'react';
import {
    SGColumn,
    SGFormattedPlainCell,
    SGIconCell,
    LoadingSquareSvg,
    SGDataRow,
    SelectableGrid
} from 'appinsights-iframe-shared';

/** compute */
import { WorkbookHelper } from '../../../WorkbookHelper';
import { ConnectionSummary } from '../../../../data-provider/KustoComputePropertyPanelResponseInterpreter';

/** shared */
import { DisplayStrings } from '../../../../../shared/DisplayStrings';
import { Button } from '../../../../../shared/Button';
import { IWorkspaceInfo } from '../../../../../shared/IWorkspaceInfo';
import { ITelemetry } from '../../../../../shared/Telemetry';
import { MessagingProvider } from '../../../../../shared/MessagingProvider';
import { ExpandableSection2 } from '../../../../../shared/property-panel/ExpandableSection2';
import { ConnectionsSVG } from '../../../../../shared/svg/connections';

interface IConnectionSummaryPropertyPanelProps {
    connectionSummary: ConnectionSummary;
    workspace: IWorkspaceInfo;
    logPrefix: string;
    telemetry: ITelemetry;
    messagingProvider: MessagingProvider;
}

export class ConnectionSummaryPropertyPanel extends React.Component<IConnectionSummaryPropertyPanelProps> {
    private readonly DEFAULT_WIDTH: number = 125;
    private readonly SELECTABLE_GRID_ROW_HEIGHT: number = 35;

    constructor(props: IConnectionSummaryPropertyPanelProps) {
        super(props);
    }

    render() {
        return <ExpandableSection2
            title={DisplayStrings.ConnectionSummaryGridTitle}
            titleIcon={<ConnectionsSVG />}
            content={this.connectionSummary()}
            isExpanded={true}
            button={this.viewConnectionOverviewButton()}
        />
    }

    private connectionSummary(): JSX.Element {
        const columnDefinition: SGColumn[] = [
            {
                name: DisplayStrings.ConnectionSummaryGridType,
                width: this.DEFAULT_WIDTH,
                cell: SGFormattedPlainCell(data => data)
            },
            {
                name: DisplayStrings.ConnectionSummaryGridCount,
                width: this.DEFAULT_WIDTH,
                cell: this.props.connectionSummary ? SGFormattedPlainCell((data: number) => {
                    return data && data.toLocaleString();
                }) : SGIconCell(data => data, () => <LoadingSquareSvg />)
            }
        ];

        const gridData: SGDataRow[] = [];
        gridData.push(
            new SGDataRow([
                DisplayStrings.ConnectionSummaryGridFailed,
                this.props.connectionSummary && this.props.connectionSummary.linksFailed
            ], 'Links Failed')
        );
        gridData.push(
            new SGDataRow([
                DisplayStrings.ConnectionSummaryGridLive,
                this.props.connectionSummary && this.props.connectionSummary.linksLive
            ], 'Links Live')
        );
        gridData.push(
            new SGDataRow([
                DisplayStrings.ConnectionSummaryGridEstablished,
                this.props.connectionSummary && this.props.connectionSummary.linksEstablished
            ], 'Links Established')
        );
        gridData.push(
            new SGDataRow([
                DisplayStrings.ConnectionSummaryGridTerminated,
                this.props.connectionSummary && this.props.connectionSummary.linksTerminated
            ], 'Links Terminated')
        );

        const inlineStyle: React.CSSProperties = {
            height: this.SELECTABLE_GRID_ROW_HEIGHT * (gridData.length + 1)
        };
        return <div style={inlineStyle}>
            <SelectableGrid
                columns={columnDefinition}
                data={gridData}
            />
        </div>;
    }

    // Goes to Connection Details workbook
    private viewConnectionOverviewButton(): JSX.Element {
        return <Button
            label={DisplayStrings.ConnectionSummaryGridButton}
            action={() => {
                WorkbookHelper.NavigateToConnectionDetailWorkbook({
                    workspaceId: this.props.workspace && this.props.workspace.id,
                    sourceName: `${this.props.logPrefix}.ViewConnectionOverviewButton`,
                    telemetry: this.props.telemetry,
                    messagingProvider: this.props.messagingProvider
                });
            }}
        />
    }
}
