/** tpl */
import * as React from 'react';
import { SGColumn, SGFormattedPlainCell, SGIconCell, LoadingSquareSvg, 
    SGDataRow, SelectableGrid, InfoSvg } from 'appinsights-iframe-shared';

/** shared */
import { DisplayStrings } from '../../../../../shared/DisplayStrings';
import { VmSvg } from '../../../../../shared/svg/vm';
import { ExpandableSection2 } from '../../../../../shared/property-panel/ExpandableSection2';
import { VmssSvg } from '../../../../../shared/svg/vmss';
import { LinuxLogoSVG } from '../../../../../shared/svg/linux-logo';
import { WindowsLogoSVG } from '../../../../../shared/svg/windows-logo';
import { MachineLogoSVG } from '../../../../../shared/svg/machine-log';

/** style */
import '../../../../../../styles/compute/PropertyPanel.less' 

interface IGroupPropertyPanel {
    groupSummaryCount: IGroupPropertyPanelProps;
}

export interface IGroupPropertyPanelProps {
    vmCount: number;
    vmssCount: number;
    onPremCount: number;
    linuxCount: number;
    windowsCount: number;
}

export class GroupPropertyPanel extends React.Component<IGroupPropertyPanel> {
    private readonly DEFAULT_WIDTH: number = 125;
    private readonly SELECTABLE_GRID_ROW_HEIGHT: number = 35;

    constructor(props: IGroupPropertyPanel) {
        super(props);
    }

    render() {
        const panelContent: JSX.Element[] = [];

        panelContent.push(<ExpandableSection2
            key='title'
            title={DisplayStrings.ComputeResourceSummaryGridTitle}
            content={this.getMonitoringSummaryData()}
            isExpanded={true}
        />);

        panelContent.push(<ExpandableSection2
            key='title'
            title={DisplayStrings.OsSummaryGridTitle}
            content={this.getOsSummaryData()}
            isExpanded={true}
        />);
        return panelContent;
    }

    private getMonitoringSummaryData(): JSX.Element {
        const columnDefinitionMonitoring: SGColumn[] = [
            {
                name: DisplayStrings.ComputeResourceSummaryGridType,
                width: this.DEFAULT_WIDTH + this.DEFAULT_WIDTH,
                cell: SGFormattedPlainCell(data => data)
            },
            {
                name: DisplayStrings.ConnectionSummaryGridCount,
                width: this.DEFAULT_WIDTH,
                cell: this.props.groupSummaryCount ? SGFormattedPlainCell((data: number) => {
                    return data && data.toLocaleString();
                }) : SGIconCell(data => data, () => <LoadingSquareSvg />)
            }
        ];

        const gridDataMonitoring: SGDataRow[] = [];
        gridDataMonitoring.push(
            new SGDataRow([<div className='sg-text'>
                <span className='sg-icon'><VmSvg /></span>
                <span>{DisplayStrings.AzureVmMachines}</span></div>,
            this.props.groupSummaryCount && this.props.groupSummaryCount.vmCount
            ], 'Virtual Machines')
        );
        gridDataMonitoring.push(
            new SGDataRow([
                <div className='sg-text'>
                    <span className='sg-icon'><VmssSvg /></span>
                    <span>{DisplayStrings.AzureVmssInstances}</span></div>,
                this.props.groupSummaryCount && this.props.groupSummaryCount.vmssCount
            ], 'VMSS')
        );

        gridDataMonitoring.push(
            new SGDataRow([
                <div className='sg-text'>
                    <span className='sg-icon'><MachineLogoSVG /></span>
                    <span>
                        {DisplayStrings.OtherMachines}
                    </span>
                    <span className='sg-icon info-tooltip'><label title={DisplayStrings.OtherMachinesInfoBubble}><InfoSvg /></label>
                    </span>
                </div>,
                this.props.groupSummaryCount && this.props.groupSummaryCount.onPremCount
            ], 'VMSS')
        );

        gridDataMonitoring.push(
            new SGDataRow([
                DisplayStrings.TotalCount,
                this.props.groupSummaryCount && (this.props.groupSummaryCount.vmCount
                    + this.props.groupSummaryCount.vmssCount + this.props.groupSummaryCount.onPremCount)
            ], 'Total')
        );

        const inlineStyle: React.CSSProperties = {
            height: this.SELECTABLE_GRID_ROW_HEIGHT * (gridDataMonitoring.length + 1)
        };

        return <div style={inlineStyle}>
            <SelectableGrid
                columns={columnDefinitionMonitoring}
                data={gridDataMonitoring}
            />
        </div>
    }

    private getOsSummaryData(): JSX.Element {
        const columnDefinitionOs: SGColumn[] = [
            {
                name: DisplayStrings.OS,
                width: this.DEFAULT_WIDTH + this.DEFAULT_WIDTH,
                cell: SGFormattedPlainCell(data => data)
            },
            {
                name: DisplayStrings.ConnectionSummaryGridCount,
                width: this.DEFAULT_WIDTH,
                cell: this.props.groupSummaryCount ? SGFormattedPlainCell((data: number) => {
                    return data && data.toLocaleString();
                }) : SGIconCell(data => data, () => <LoadingSquareSvg />)
            }
        ]

        const gridDataOs: SGDataRow[] = [];

        gridDataOs.push(
            new SGDataRow([
                <div className='sg-text'>
                    <span className='sg-icon'><LinuxLogoSVG /></span>
                    <span>{DisplayStrings.Linux}</span></div>,
                this.props.groupSummaryCount && this.props.groupSummaryCount.linuxCount], 'Linux')
        );
        gridDataOs.push(
            new SGDataRow([
                <div className='sg-text'>
                    <span className='sg-icon'><WindowsLogoSVG /></span>
                    <span>{DisplayStrings.Windows}</span></div>,
                this.props.groupSummaryCount && this.props.groupSummaryCount.windowsCount], 'Windows')
        );

        gridDataOs.push(
            new SGDataRow([
                DisplayStrings.TotalCount,
                this.props.groupSummaryCount && (this.props.groupSummaryCount.linuxCount
                    + this.props.groupSummaryCount.windowsCount)
            ], 'Total')
        );

        const inlineStyle: React.CSSProperties = {
            height: this.SELECTABLE_GRID_ROW_HEIGHT * (gridDataOs.length + 1)
        };

        return <div style={inlineStyle}>
            <SelectableGrid
                columns={columnDefinitionOs}
                data={gridDataOs}
            />
        </div>
    }
}
