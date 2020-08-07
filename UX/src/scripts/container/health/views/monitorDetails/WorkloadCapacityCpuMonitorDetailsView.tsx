/** styles */
import '../../../../../styles/container/HealthPane.less';

/** tpl */
import * as React from 'react';
import { SGColumn, SGFormattedPlainCell, SGIconCell, SelectableGrid, SGSortOrder } from 'appinsights-iframe-shared';

/** local */
import { MetricValueFormatter } from '../../../../shared/MetricValueFormatter';
import { WorkloadCapacityCpuMonitorDetailsViewModel } from '../../viewmodels/monitorDetails/WorkloadCapacityCpuMonitorDetailsViewModel';
import { IHealthMonitorDetailsViewProps, HealthMonitorDetailsViewBase } from './HealthMonitorDetailsViewBase';
import { HealthServicesFactory } from '../../factories/HealthServicesFactory';
import { IHealthMonitorDetailsViewModel } from '../../viewmodels/monitorDetails/IHealthMonitorDetailsViewModel';
import { HealthMonitorDetailsContainerViewModel } from '../../viewmodels/monitorDetails/HealthMonitorDetailsContainerViewModel';
import { HealthState } from '../../HealthState';
import { HealthMonitorIconProvider } from '../HealthMonitorIconProvider';
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { IUsageDataObj } from '../../viewmodels/monitorDetails/MonitorDetailsTypings';

/** row height and column widths for SG */
const SGDataRowHeight = 35;
// const sgStatusColWidth = 100;

/** Workload CPU capacity monitor details view component */
export class WorkloadCapacityCpuMonitorDetailsView extends HealthMonitorDetailsViewBase {
    /**
     * initializes an instance of the class
     * @param props component properties
     */
    public constructor(props: IHealthMonitorDetailsViewProps) {
        super(props);

        this.onSortColumnChanged = this.onSortColumnChanged.bind(this);
        this.onSortOrderChanged = this.onSortOrderChanged.bind(this);
    }

    /** Renders the view */
    public renderMonitorDetails(): JSX.Element {
        const context = this.state.context as WorkloadCapacityCpuMonitorDetailsViewModel;

        // Adjusts the height of the sg-container div to fit the sg as desired
        const sgBoxSizeCalculator = {
            height: ((context.convertModelIntoSGDataRows().length + 1) * SGDataRowHeight) + 5 + 'px',
        }
        const monitorStateTextClass = 'monitor-state-text ' + HealthState[context.state].toLocaleLowerCase();

        return (
            <div className='property-panel-content'>
                <div className='describe-property-panel'>
                    <div className='monitor-property-title' role='heading'>{DisplayStrings.CurrentState}</div>
                    <div className='monitor-property-value'>
                        <span className={monitorStateTextClass}>{context.stateDisplayName}</span>
                    </div>
                    <div className='monitor-property-title' role='heading'>{DisplayStrings.LastRecalculated}</div>
                    <div className='monitor-property-value'>
                        {context.getRelativeStateLastRecalculatedDateTime()}
                        &nbsp;{DisplayStrings.On}&nbsp;
                        {context.absoluteStateLastRecalculatedDateTime}
                    </div>
                    <div className='monitor-property-title' role='heading'>{DisplayStrings.LastStateChange}</div>
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
     * @param parentContext 
     */
    protected createViewModel(parentContext: HealthMonitorDetailsContainerViewModel): IHealthMonitorDetailsViewModel {
        return new WorkloadCapacityCpuMonitorDetailsViewModel(
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
    private getColumnDefinitions(sortColumn: number, sortOrder: SGSortOrder): SGColumn[] {
        let columnDefinitions = [];

        columnDefinitions.push({
            name: DisplayStrings.WorkloadCpuCapacityGridStatusColumnTitle, 
            width: 0,
            cell: SGIconCell(
                (data: string) => data, 
                (data: HealthState) => HealthMonitorIconProvider.getIcon(data)
            ),  
            sortable: false,
            infoText: DisplayStrings.WorkloadCpuCapacityGridStatusColumnTooltip
        });

        columnDefinitions.push({
            name: DisplayStrings.Usage,
            width: 0,
            cell: SGFormattedPlainCell((data: IUsageDataObj) => 
                MetricValueFormatter.formatMillicoreValue(data.usage) + ' / ' + 
                MetricValueFormatter.formatMillicoreValue(data.usageLimit) + 
                ' (' + MetricValueFormatter.formatPercentageValue(data.usagePercentage) + ')'
            ),
            sortable: false,
            infoText: DisplayStrings.WorkloadCpuCapacityGridRequestLimitRatioColumnTooltip
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
            const context = this.state.context as WorkloadCapacityCpuMonitorDetailsViewModel
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
            const context = this.state.context as WorkloadCapacityCpuMonitorDetailsViewModel
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
