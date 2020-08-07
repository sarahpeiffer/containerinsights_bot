/** tpl */
import * as React from 'react';
import { SGColumn, SGFormattedPlainCell, SGIconCell, LoadingSquareSvg, SGDataRow, SelectableGrid } from 'appinsights-iframe-shared';

/** compute */
import { ComputeResourceSummary } from '../../../../data-provider/KustoComputePropertyPanelResponseInterpreter';

/** shared */
import { DisplayStrings } from '../../../../../shared/DisplayStrings';

interface IComputeResourceSummaryPropertyPanel {
    computeResourceSummary: ComputeResourceSummary;
}

export class ComputeResourceSummaryPropertyPanel extends React.Component<IComputeResourceSummaryPropertyPanel> {
    private readonly DEFAULT_WIDTH: number = 125;
    private readonly SELECTABLE_GRID_ROW_HEIGHT: number = 35;

    constructor(props: IComputeResourceSummaryPropertyPanel) {
        super(props);
    }

    render() {
        const columnDefinition: SGColumn[] = [
            {
                name: DisplayStrings.ComputeResourceSummaryGridType,
                width: this.DEFAULT_WIDTH,
                cell: SGFormattedPlainCell(data => data)
            },
            {
                name: DisplayStrings.ComputeResourceSummaryGridMonitored,
                width: this.DEFAULT_WIDTH,
                cell: this.props.computeResourceSummary ? SGFormattedPlainCell((data: number) => {
                    return data && data.toLocaleString();
                }) : SGIconCell(data => data, () => <LoadingSquareSvg />)
            },
            {
                name: DisplayStrings.ComputeResourceSummaryGridUnmonitored,
                width: (this.DEFAULT_WIDTH + 25),
                cell: this.props.computeResourceSummary ? SGFormattedPlainCell((data: number) => {
                    return data && data.toLocaleString();
                }) : SGIconCell(data => data, () => <LoadingSquareSvg />)
            }
        ];

        const gridData: SGDataRow[] = [];
        gridData.push(
            new SGDataRow([
                DisplayStrings.ComputeResourceSummaryGridVirtualMachines,
                this.props.computeResourceSummary && this.props.computeResourceSummary.vm.monitored,
                this.props.computeResourceSummary && this.props.computeResourceSummary.vm.unmonitored
            ], 'Virtual Machines')
        );
        gridData.push(
            new SGDataRow([
                DisplayStrings.ComputeResourceSummaryGridVmss,
                this.props.computeResourceSummary && this.props.computeResourceSummary.vmss.monitored,
                this.props.computeResourceSummary && this.props.computeResourceSummary.vmss.unmonitored
            ], 'VMSS')
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

}
