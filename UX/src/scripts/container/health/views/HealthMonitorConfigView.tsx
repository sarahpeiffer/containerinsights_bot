/** styles */
import '../../../../styles/container/HealthPane.less';

/** tpl */
import * as React from 'react';

/** shared */
import { BaseViewModel } from '../../../shared/BaseViewModel';

/** local */
import { HealthMonitorConfigViewModel } from '../viewmodels/HealthMonitorConfigViewModel';
import { HealthServicesFactory } from '../factories/HealthServicesFactory';
import { SelectableGrid, SGFormattedPlainCell, SGColumn, SGSortOrder } from 'appinsights-iframe-shared';
import { SortHelper } from '../../../shared/SortHelper';
import { DisplayStrings } from '../../../shared/DisplayStrings';

/**
 * Health monitor config view component props
 */
export interface IHealthMonitorConfigViewProps {
    /** parent context (view model) */
    parentContext: BaseViewModel;
}

/**
 * Health monitor config view component state
 */
export interface IHealthMonitorConfigViewState {
    /** health monitor config view model */
    context: HealthMonitorConfigViewModel;
}

const SGDataRowHeight = 35;

/**
 * Health monitor config view component
 */
export class HealthMonitorConfigView
    extends React.PureComponent<IHealthMonitorConfigViewProps, IHealthMonitorConfigViewState> {

    /**
     * initializes an instance of the class
     * @param props component properties
     */
    public constructor(props: IHealthMonitorConfigViewProps) {
        super(props);

        const viewModel = new HealthMonitorConfigViewModel(
            HealthServicesFactory.instance,
            props.parentContext, 
            this.forceUpdate.bind(this)
        );

        this.state = { context: viewModel };

        this.onSortColumnChanged = this.onSortColumnChanged.bind(this);
        this.onSortOrderChanged = this.onSortOrderChanged.bind(this);
    }

    /**
     * react callback invoked just before mounting occurs
     * 
     * TODO: replace with static getDerivedStateFromProps(props, state) when switching react v17+
     */
    public componentWillMount(): void {
        this.state.context.initialize();
    }

    /**
     * react callback invoked to render component
     */
    public render(): JSX.Element {
        const context = this.state.context;
        if (!context || !context.isInitialized) { return null; }

        // Adjust the height of the sg-container div to fit the sg as desired
        const sgBoxSizeCalculator = {
            height: ((context.convertModelIntoSGDataRows().length + 1) * SGDataRowHeight) + 5 + 'px',
        }

        const sg =
            <div className='sg-container' style={sgBoxSizeCalculator}>
                <SelectableGrid
                    columns={this.getColumnDefinitions(context.sortColumn, context.sortOrder)}
                    data={context.convertModelIntoSGDataRows()}
                    onSortColumnChanged={this.onSortColumnChanged}
                    onSortOrderChanged={this.onSortOrderChanged}
                    sortColumn={context.sortColumn}
                />
            </div>;

        const displayString = context.detailsViewTypeName === 'AggregateMonitorDetailsView' ? 
            DisplayStrings.NoConfigEver : 
            DisplayStrings.NoConfigCurrently;

        // TODO-LOC
        const configPanelContents = this.state.context.hasConfig 
            ? sg : <div>{displayString}</div>;

        return (
            <div className='details-subpanel monitor-config-panel'>
                <div className='details-panel-contents'>{configPanelContents}</div>
            </div>
        );
    }

    private getColumnDefinitions(sortColumn: number, sortOrder: number): SGColumn[] {
        let columnDefinitions = [];

        let sortFunction = (a, b) => {
            const safeA = a || '';
            const safeB = b || '';
            return SortHelper.Instance().sortByNameAlphaNumeric(safeA, safeB);
        };

        columnDefinitions.push({
            name: DisplayStrings.HealthMonitorConfigGridPropertyColumnHeader, 
            width: 0,
            cell: SGFormattedPlainCell((data: string) => data),
            sortable: true,
            sortOrder: sortColumn === 0 ? sortOrder : undefined,
            sortFunc: sortFunction,
            infoText: DisplayStrings.HealthMonitorConfigGridPropertyColumnTooltip
        });

        columnDefinitions.push({
            name: DisplayStrings.HealthMonitorConfigGridValueColumnHeader, 
            width: 0,
            cell: SGFormattedPlainCell((data: string) => data),          
            infoText: DisplayStrings.HealthMonitorConfigGridValueColumnTooltip
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
            const context = this.state.context as HealthMonitorConfigViewModel
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
            const context = this.state.context as HealthMonitorConfigViewModel
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
