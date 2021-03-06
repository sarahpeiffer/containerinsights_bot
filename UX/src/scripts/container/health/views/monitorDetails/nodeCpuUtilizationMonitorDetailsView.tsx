/** styles */
import '../../../../../styles/container/HealthPane.less';

/** tpl */
import * as React from 'react';
import moment = require('moment');

/** local */
import { MetricValueFormatter } from '../../../../shared/MetricValueFormatter';
import { NodeCpuUtilizationMonitorDetailsViewModel } from '../../viewmodels/monitorDetails/NodeCpuUtilizationMonitorDetailsViewModel';
import { HealthMonitorDetailsContainerViewModel } from '../../viewmodels/monitorDetails/HealthMonitorDetailsContainerViewModel';
import { HealthServicesFactory } from '../../factories/HealthServicesFactory';
import { HealthState } from '../../HealthState';
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { IHealthMonitorDetailsViewModel } from '../../viewmodels/monitorDetails/IHealthMonitorDetailsViewModel';
import { IUsageDataObj } from '../../viewmodels/monitorDetails/MonitorDetailsTypings';
import { HealthMonitorDetailsViewBase, IHealthMonitorDetailsViewProps } from './HealthMonitorDetailsViewBase';
import { HealthMonitorIconProvider } from '../HealthMonitorIconProvider';
import { SGColumn, SGFormattedPlainCell, SGIconCell, SGSortOrder, SelectableGrid } from 'appinsights-iframe-shared';

/** row height and column widths for SG */
const SGDataRowHeight = 35;
const sgTimestampColWidth = 225;

/** Node cpu monitor details view component */
export class NodeCpuUtilizationMonitorDetailsView extends HealthMonitorDetailsViewBase {
    /**
     * initializes an instance of the class
     * @param props component properties
     */
    public constructor(props: IHealthMonitorDetailsViewProps) {
        super(props);

        this.onSortColumnChanged = this.onSortColumnChanged.bind(this);
        this.onSortOrderChanged = this.onSortOrderChanged.bind(this);
    }

    /** react callback invoked to render component */
    protected renderMonitorDetails(): JSX.Element { 
        const context = this.state.context as NodeCpuUtilizationMonitorDetailsViewModel;

        // Adjust the height of the sg-container div to fit the sg as desired
        const sgBoxSizeCalculator = {
            height: ((context.convertModelIntoSGDataRows().length + 1) * SGDataRowHeight) + 5 + 'px',
        };

        const monitorStateTextClass = 'monitor-state-text ' + HealthState[context.state].toLocaleLowerCase();

        return (
            <div className='property-panel-content'>
                <div className='describe-property-panel'>
                    <div className='monitor-property-title' role='heading' aria-level={2}>{DisplayStrings.CurrentState}</div>
                    <div className='monitor-property-value'>
                        <span className={monitorStateTextClass}>{context.stateDisplayName}</span>
                    </div>
                    <div className='monitor-property-title' role='heading' aria-level={2}>{DisplayStrings.LastRecalculated}</div>
                    <div className='monitor-property-value'>
                        {context.getRelativeStateLastRecalculatedDateTime()}
                        &nbsp;{DisplayStrings.On}&nbsp;
                        {context.absoluteStateLastRecalculatedDateTime}
                    </div>
                    <div className='monitor-property-title' role='heading' aria-level={2}>{DisplayStrings.LastStateChange}</div>
                    <div className='monitor-property-value'>
                        {context.getRelativeLastStateChangeDateTime()}
                        &nbsp;{DisplayStrings.On}&nbsp;
                        {context.absoluteLastStateChangeDateTime}
                    </div>
                </div>
                <div className='sg-container' style={sgBoxSizeCalculator}>
                    <SelectableGrid
                        columns={this.getColumnDefinitions(context.sortColumn, context.sortOrder)}
                        data={context.convertModelIntoSGDataRows()}
                    />
                </div>
            </div>
        );
    }

    /**
     * Creates the view model
     * @param parentContext parent view model
     */
    protected createViewModel(parentContext: HealthMonitorDetailsContainerViewModel): IHealthMonitorDetailsViewModel { 
        return new NodeCpuUtilizationMonitorDetailsViewModel(
            HealthServicesFactory.instance,
            parentContext, 
            this.forceUpdate.bind(this)
        );
    }

    /**
     * Gets the column definitions for SG
     * @param sortColumn 
     * @param sortOrder 
     */
    private getColumnDefinitions(sortColumn: number, sortOrder: number): SGColumn[] {  
        let columnDefinitions = [];

        columnDefinitions.push({
            name: DisplayStrings.NodeCpuUtilGridTimestampColumnTitle,
            width: sgTimestampColWidth,
            cell: SGFormattedPlainCell((data: string) => moment(data).format('MM/DD/YY, h:mm:ss a') + ' (' + moment(data).fromNow() + ')'),
            sortable: false
        });

        columnDefinitions.push({
            name: DisplayStrings.NodeCpuUtilGridStatusColumnTitle,
            width: 0,
            cell: SGIconCell(
                (data: string) => data, 
                (data: HealthState) => HealthMonitorIconProvider.getIcon(data)
            ),  
            sortable: false,
            infoText: DisplayStrings.NodeCpuUtilGridStatusColumnTooltip
        });

        columnDefinitions.push({
            name: DisplayStrings.Usage,
            width: 0,
            cell: SGFormattedPlainCell((data: IUsageDataObj) => 
                MetricValueFormatter.formatMillicoreValue(data.usage) + 
                ' (' + MetricValueFormatter.formatPercentageValue(data.usagePercentage) + ')'
            ),
            sortable: false,
            infoText: DisplayStrings.NodeCpuUtilGridCpuUsageColumnTooltip
        });

        return columnDefinitions;
    }

    /**
     * event handler for when the sort column in SG changes
     * onChange we refresh the view to recalculate the 
     * column definitions which will update the SG with the new sort column
     * @param column 
     */
    private onSortColumnChanged(column: number) {
        this.getSafeComponentState().then(() => {
            const context = this.state.context as NodeCpuUtilizationMonitorDetailsViewModel
            context.onSortColumnChanged(column);
        });
    }

    /**
     * event handler for when the sort order in SG changes
     * onChange we refresh the view to recalculate the 
     * column definitions which will update the SG with the new sort column and sort order
     * @param column 
     * @param sortOrder 
     */    
    private onSortOrderChanged(column: number, sortOrder: SGSortOrder) {
        this.getSafeComponentState().then(() => {
            const context = this.state.context as NodeCpuUtilizationMonitorDetailsViewModel
            context.onSortOrderChanged(column, sortOrder);
        });
    }

    /**
     * makes access to this.state property of the component possible in 'random' callback
     * @returns promise of operation completion - use of state is safe in .then() of returned value
     */
    private getSafeComponentState(): Promise<void> {
        return new Promise((resolve) => {
            this.setState({}, () => {
                resolve();
            });
        });
    }
}
