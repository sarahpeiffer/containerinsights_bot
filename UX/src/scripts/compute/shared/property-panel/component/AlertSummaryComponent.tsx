import * as React from 'react';

import { IAlertSummary } from '../../AlertsManager';
import {
    SGColumn,
    SGFormattedPlainCell,
    SGIconCell,
    LoadingSquareSvg,
    SGDataRow,
    SelectableGrid
} from 'appinsights-iframe-shared';
import { ExpandableSection2 } from '../../../../shared/property-panel/ExpandableSection2';
import { Button } from '../../../../shared/Button';
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { AlertsManagementSvg } from '../../../../shared/svg/alerts-management';

export interface IAlertSummaryProps {
    alertSummary: IAlertSummary;
    title: string;
    onAlertDetailsButtonClicked: () => void;
}

export class AlertSummaryComponent extends React.Component<IAlertSummaryProps> {
    private readonly DEFAULT_WIDTH: number = 125;
    private readonly SELECTABLE_GRID_ROW_HEIGHT: number = 35;

    constructor(props: IAlertSummaryProps) {
        super(props);
    }

    public render(): JSX.Element {
        // TODO: Need to show error banner if the data is erroneous
        return <div aria-label={this.props.title}>
            <span className='alert-summary-table-title'>{this.props.title}</span>
            <div className='alert-summary-count'>{this.props.alertSummary && this.props.alertSummary.totalCount}</div>
            <ExpandableSection2
                title={DisplayStrings.AlertSummaryTableTitle}
                titleIcon={<AlertsManagementSvg />}
                content={this.alertsSummary()}
                isExpanded={true}
                button={this.navigateToAlertListButton()}
            />
        </div>
    }

    private alertsSummary(): JSX.Element {
        const columnDefinition: SGColumn[] = [{
            name: DisplayStrings.AlertSeverity,
            width: this.DEFAULT_WIDTH,
            cell: SGFormattedPlainCell(data => data)
        },
        {
            name: DisplayStrings.AlertCount,
            width: this.DEFAULT_WIDTH,
            cell: this.props.alertSummary ? SGFormattedPlainCell((data: number) => {
                return data && data.toLocaleString();
            }) : SGIconCell(data => data, () => <LoadingSquareSvg />)
        }];

        const gridData: SGDataRow[] = [];
        gridData.push(
            new SGDataRow([
                this.getAlertSeverityGridRow(0),
                this.props.alertSummary && (this.props.alertSummary.sev0Count || 0)
            ], 'Severity 0')
        );
        gridData.push(
            new SGDataRow([
                this.getAlertSeverityGridRow(1),
                this.props.alertSummary && (this.props.alertSummary.sev1Count || 0)
            ], 'Severity 1')
        );
        gridData.push(
            new SGDataRow([
                this.getAlertSeverityGridRow(2),
                this.props.alertSummary && (this.props.alertSummary.sev2Count || 0)
            ], 'Severity 2')
        );
        gridData.push(
            new SGDataRow([
                this.getAlertSeverityGridRow(3),
                this.props.alertSummary && (this.props.alertSummary.sev3Count || 0)
            ], 'Severity 3')
        );
        gridData.push(
            new SGDataRow([
                this.getAlertSeverityGridRow(4),
                this.props.alertSummary && (this.props.alertSummary.sev4Count || 0)
            ], 'Severity 4')
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

    private navigateToAlertListButton(): JSX.Element {
        return <Button
            label={DisplayStrings.InvestigateAlerts}
            action={this.props && this.props.onAlertDetailsButtonClicked}
        />;
    }

    private getAlertSeverityGridRow(severity: number): JSX.Element {
        switch (severity) {
            case 0:
                return <div>
                    <span className='alert-sev0-legend'>&nbsp;</span>
                    <span className='alert-sev-label'>{DisplayStrings.AlertSeverity0}</span>
                </div>;
            case 1:
                return <div>
                    <span className='alert-sev1-legend'>&nbsp;</span>
                    <span className='alert-sev-label'>{DisplayStrings.AlertSeverity1}</span>
                </div>;
            case 2:
                return <div>
                    <span className='alert-sev2-legend'>&nbsp;</span>
                    <span className='alert-sev-label'>{DisplayStrings.AlertSeverity2}</span>
                </div>;
            case 3:
                return <div>
                    <span className='alert-sev3-legend'>&nbsp;</span>
                    <span className='alert-sev-label'>{DisplayStrings.AlertSeverity3}</span>
                </div>;
            case 4:
                return <div>
                    <span className='alert-sev4-legend'>&nbsp;</span>
                    <span className='alert-sev-label'>{DisplayStrings.AlertSeverity4}</span>
                </div>;
            default:
                return undefined;
        }
    }
}
