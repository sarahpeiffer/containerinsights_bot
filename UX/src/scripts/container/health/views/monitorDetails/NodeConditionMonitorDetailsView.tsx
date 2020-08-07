/** styles */
import '../../../../../styles/container/HealthPane.less';

/** tpl */
import * as React from 'react';

/** local */
import { SGColumn, SGFormattedPlainCell, SelectableGrid, SGSortOrder } from 'appinsights-iframe-shared';
import { HealthMonitorDetailsViewBase, IHealthMonitorDetailsViewProps } from './HealthMonitorDetailsViewBase';
import { IHealthMonitorDetailsViewModel } from '../../viewmodels/monitorDetails/IHealthMonitorDetailsViewModel';
import { HealthMonitorDetailsContainerViewModel } from '../../viewmodels/monitorDetails/HealthMonitorDetailsContainerViewModel';
import { HealthServicesFactory } from '../../factories/HealthServicesFactory';
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { NodeConditionMonitorDetailsViewModel } from '../../viewmodels/monitorDetails/NodeConditionMonitorDetailsViewModel';
import { HealthState } from '../../HealthState';

/** row height and column widths in one place */
const SGDataRowHeight = 35;
const sgConditionColWidth = 150;
const sgStatusColWidth = 100;

/** Node conditions monitor details view component */
export class NodeConditionMonitorDetailsView extends HealthMonitorDetailsViewBase {
    /**
     * initializes an instance of the class
     * @param props component properties
     */
    public constructor(props: IHealthMonitorDetailsViewProps) {
        super(props);

        this.onSortColumnChanged = this.onSortColumnChanged.bind(this);
        this.onSortOrderChanged = this.onSortOrderChanged.bind(this);
    }

    protected renderMonitorDetails(): JSX.Element {                             //  2.c.
        const context = this.state.context as NodeConditionMonitorDetailsViewModel;
        if (!context || !context.isInitialized) { return null; }
        
        // Adjusts the height of the sg-container div to fit the sg as desired
        const sgBoxSizeCalculator = {
            height: ((context.convertModelIntoSGDataRows().length + 1) * SGDataRowHeight) + 5 + 'px',
        }

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
     * Creates this view's view model
     * @param parentContext 
     */
    protected createViewModel(parentContext: HealthMonitorDetailsContainerViewModel): IHealthMonitorDetailsViewModel {         //  2.d.
        return new NodeConditionMonitorDetailsViewModel(
            HealthServicesFactory.instance,
            parentContext, 
            this.forceUpdate.bind(this)
        );
    }

    /**
     * Gets the column definitions needed by SG
     * @param sortColumn 
     * @param sortOrder 
     */
    private getColumnDefinitions(sortColumn: number, sortOrder: number): SGColumn[] {
        let columnDefinitions = [];

        columnDefinitions.push({
            name: DisplayStrings.NodeConditionGridConditionColumnTitle,
            width: sgConditionColWidth,
            cell: SGFormattedPlainCell((data: string) => data),
            sortable: false,
            infoText: DisplayStrings.NodeConditionGridConditionColumnTooltip
        });

        columnDefinitions.push({
            name: DisplayStrings.NodeConditionGridStatusColumnTitle,
            width: sgStatusColWidth,
            cell: SGFormattedPlainCell((data: string) => data),  
            sortable: false,
            infoText: DisplayStrings.NodeConditionGridStatusColumnTooltip
        });

        columnDefinitions.push({
            name: DisplayStrings.NodeConditionGridMessageColumnTitle,
            width: 0,
            cell: SGFormattedPlainCell((data: string) => data),
            infoText: DisplayStrings.NodeConditionGridMessageColumnTooltip
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
            const context = this.state.context as NodeConditionMonitorDetailsViewModel
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
            const context = this.state.context as NodeConditionMonitorDetailsViewModel
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
