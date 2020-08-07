/** styles */
import '../../../../../styles/container/HealthPane.less';

/** tpl */
import * as React from 'react';
import { SGColumn, SGFormattedPlainCell, SelectableGrid, SGSortOrder } from 'appinsights-iframe-shared';

/** local */
import { HealthMonitorDetailsViewBase, IHealthMonitorDetailsViewProps } from './HealthMonitorDetailsViewBase';
import { IHealthMonitorDetailsViewModel } from '../../viewmodels/monitorDetails/IHealthMonitorDetailsViewModel';
import { HealthMonitorDetailsContainerViewModel } from '../../viewmodels/monitorDetails/HealthMonitorDetailsContainerViewModel';
import { HealthServicesFactory } from '../../factories/HealthServicesFactory';
import { SimplePropertyCollection } from '../../../../shared/property-panel/SimplePropertyCollection';
import { KubeApiStatusMonitorDetailsViewModel } from '../../viewmodels/monitorDetails/KubeApiStatusMonitorDetailsViewModel';
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { HealthState } from '../../HealthState';

/** row height and column widths for SG */
const SGDataRowHeight = 35;
const sgResponseHeaderColWidth = 150;

/** Kube API status monitor details view component */
export class KubeApiStatusMonitorDetailsView extends HealthMonitorDetailsViewBase {
    /**
     * initializes an instance of the class
     * @param props component properties
     */
    public constructor(props: IHealthMonitorDetailsViewProps) {
        super(props);

        this.onSortColumnChanged = this.onSortColumnChanged.bind(this);
        this.onSortOrderChanged = this.onSortOrderChanged.bind(this);
    }

    /** React callback that renders the view */
    protected renderMonitorDetails(): JSX.Element {                          
        const context = this.state.context as KubeApiStatusMonitorDetailsViewModel;
        
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
                <div>
                    <div className='response-code'>
                        <SimplePropertyCollection properties={context.getSimpleProperties()} />
                    </div>
                    <div className='sg-container' style={sgBoxSizeCalculator}>
                        <SelectableGrid
                            columns={this.getColumnDefinitions(context.sortColumn, context.sortOrder)}
                            data={context.convertModelIntoSGDataRows()}
                        />
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Creates the view model
     * @param parentContext 
     */
    protected createViewModel(parentContext: HealthMonitorDetailsContainerViewModel): IHealthMonitorDetailsViewModel {         //  2.d.
        return new KubeApiStatusMonitorDetailsViewModel(
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
            name: DisplayStrings.KubeApiStatusGridResponseHeaderColumnTitle,
            width: sgResponseHeaderColWidth,
            cell: SGFormattedPlainCell((data: string) => data),
            sortable: false,
            infoText: DisplayStrings.KubeApiStatusGridResponseHeaderColumnTooltip
        });

        columnDefinitions.push({
            name: DisplayStrings.KubeApiStatusGridValueColumnTitle,
            width: 0,
            cell: SGFormattedPlainCell((data: string) => data),
            infoText: DisplayStrings.KubeApiStatusGridValueColumnTooltip
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
            const context = this.state.context as KubeApiStatusMonitorDetailsViewModel
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
            const context = this.state.context as KubeApiStatusMonitorDetailsViewModel
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
