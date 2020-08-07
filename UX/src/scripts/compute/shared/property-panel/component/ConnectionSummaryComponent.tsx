import * as React from 'react';

import {
    SGColumn,
    SGFormattedPlainCell,
    SGIconCell,
    LoadingSquareSvg,
    SGDataRow,
    SelectableGrid,
    InfoSvg
} from 'appinsights-iframe-shared';
import { ExpandableSection2 } from '../../../../shared/property-panel/ExpandableSection2';
import { Button } from '../../../../shared/Button';
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { IConnectionSummaryCount, ConnectionType } from '../entity-properties/ConnectionPropertiesPanel';
import { MessagingProvider } from '../../../../shared/MessagingProvider';

export interface IConnectionSummaryProps {
    connectionSummary: IConnectionSummaryCount;
    onConnectionSummaryRowClicked: (connectionType: ConnectionType) => void;
    onConnectionDetailsButtonClicked: () => void;
    messagingProvider?: MessagingProvider;
}

export class ConnectionSummaryComponent extends React.Component<IConnectionSummaryProps> {
    private readonly DEFAULT_WIDTH: number = 125;
    private readonly SELECTABLE_GRID_ROW_HEIGHT: number = 35;

    constructor(props: IConnectionSummaryProps) {
        super(props);
    }

    public render(): JSX.Element {
        return <div aria-label={DisplayStrings.ConnectionSummaryTableTitle}>
            <ExpandableSection2
                title={DisplayStrings.ConnectionSummaryTableTitle}
                content={this.connectionSummary()}
                isExpanded={true}
                button={this.navigateToConnectionListButton()}
            />
        </div>
    }

    private connectionSummary(): JSX.Element {
        const columnDefinition: SGColumn[] = [{
            name: DisplayStrings.ConnectionType,
            width: this.DEFAULT_WIDTH,
            cell: SGFormattedPlainCell(data => data)
        },
        {
            name: DisplayStrings.ConnectionCount,
            width: this.DEFAULT_WIDTH,
            cell: this.props.connectionSummary ? SGFormattedPlainCell((data: number) => {
                return data && data.toLocaleString();
            }) : SGIconCell(data => data, () => <LoadingSquareSvg />)
        }];

        const gridData: SGDataRow[] = [];
        gridData.push(
            new SGDataRow([
                this.getConnectionSummaryGridRow(DisplayStrings.ConnectionFailed, DisplayStrings.ConnectionFailedInfoText),
                this.props.connectionSummary && (this.props.connectionSummary.linkFailedCount || 0)
            ], ConnectionType.LinkFailed)
        );
        gridData.push(
            new SGDataRow([
                this.getConnectionSummaryGridRow(DisplayStrings.ConnectionLive, DisplayStrings.ConnectionLiveInfoText),
                this.props.connectionSummary && (this.props.connectionSummary.linkLiveCount || 0)
            ], ConnectionType.LinkLive)
        );
        gridData.push(
            new SGDataRow([
                this.getConnectionSummaryGridRow(DisplayStrings.ConnectionMalicious, DisplayStrings.ConnectionMaliciousInfoText),
                this.props.connectionSummary && (this.props.connectionSummary.linkMaliciousCount || 0)
            ], ConnectionType.LinkMalicious)
        );
        gridData.push(
            new SGDataRow([
                this.getConnectionSummaryGridRow(DisplayStrings.ConnectionEstablished, DisplayStrings.ConnectionEstablishedInfoText),
                this.props.connectionSummary && (this.props.connectionSummary.linkEstablishedCount || 0)
            ], ConnectionType.LinkEstablished)
        );
        gridData.push(
            new SGDataRow([
                this.getConnectionSummaryGridRow(DisplayStrings.ConnectionTerminated, DisplayStrings.ConnectionTerminatedInfoText),
                this.props.connectionSummary && (this.props.connectionSummary.linkTerminatedCount || 0)
            ], ConnectionType.LinkTerminated)
        );

        const inlineStyle: React.CSSProperties = {
            height: this.SELECTABLE_GRID_ROW_HEIGHT * (gridData.length + 1)
        };
        return <div style={inlineStyle}>
            <SelectableGrid
                columns={columnDefinition}
                data={gridData}
                onSelect={(connectionType: ConnectionType) => {
                    this.props.onConnectionSummaryRowClicked(connectionType);
                }}
            />
        </div>;
    }

    private navigateToConnectionListButton(): JSX.Element {
        return <Button
            label={DisplayStrings.ConnectionViewAll}
            action={this.props && this.props.onConnectionDetailsButtonClicked}
        />;
    }

    private getConnectionSummaryGridRow(title: string, infoText: string): JSX.Element {
        return <div>
            <span className='alert-sev-label'>{title}</span>
            <span className='connection-info'><label title={infoText}><InfoSvg /></label></span>
        </div>;
    }
}
