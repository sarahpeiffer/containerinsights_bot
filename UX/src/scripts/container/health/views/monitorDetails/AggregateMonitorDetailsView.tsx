/** styles */
import '../../../../../styles/container/HealthPane.less';

/** tpl */
import * as React from 'react';
import { SGColumn, SGFormattedPlainCell, SGIconCell, SelectableGrid } from 'appinsights-iframe-shared';

/** local */
import { GreenSvg } from '../../../../shared/svg/green';
import { ErrorSvg } from '../../../../shared/svg/error';
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { WarnSvg } from '../../../../shared/svg/warn';
import { UnknownSvg } from '../../../../shared/svg/unknown';
import { HealthMonitorDetailsViewBase, IHealthMonitorDetailsViewProps } from './HealthMonitorDetailsViewBase';
import { HealthServicesFactory } from '../../factories/HealthServicesFactory';
import { HealthMonitorDetailsContainerViewModel } from '../../viewmodels/monitorDetails/HealthMonitorDetailsContainerViewModel';
import { HealthMonitorIconProvider } from '../HealthMonitorIconProvider';
import { AggregateMonitorDetailsViewModel } from '../../viewmodels/monitorDetails/AggregateMonitorDetailsViewModel';
import { IHealthMonitorDetailsViewModel } from '../../viewmodels/monitorDetails/IHealthMonitorDetailsViewModel';
import { HealthState } from '../../HealthState';
import { SummaryTile } from '../../viewmodels/monitorDetails/MonitorDetailsTypings';
import { BigNumberIcon } from '../../../../shared/summary-panel/BigNumberIcon';

/** row height and column widths for SG */
const SGDataRowHeight = 35;
const sgStatusColWidth = 100;

/** Aggregate monitor details view component */
export class AggregateMonitorDetailsView extends HealthMonitorDetailsViewBase {
    /**
     * initializes an instance of the class
     * @param props component properties
     */
    public constructor(props: IHealthMonitorDetailsViewProps) {
        super(props);
    }

    /**
     * react callback invoked to render component
     */
    public renderMonitorDetails(): JSX.Element {
        const context = this.state.context as AggregateMonitorDetailsViewModel;

        // Adjust the height of the sg-container div to fit the sg as desired
        const sgBoxSizeCalculator = {
            height: ((context.convertModelIntoSGDataRows().length + 1) * SGDataRowHeight) + 5 + 'px',
        }

        const monitorStateTextClass = 'monitor-state-text ' + HealthState[context.state].toLocaleLowerCase();

        return (
            <div className='property-panel-content'>
                
                <div className='aggregate-monitor'>
                    { this.generateSummary() }
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
            </div>
        );
    }

    /**
     * Creates the view model
     * @param parentContext 
     */
    protected createViewModel(parentContext: HealthMonitorDetailsContainerViewModel): IHealthMonitorDetailsViewModel {        
        return new AggregateMonitorDetailsViewModel(
            HealthServicesFactory.instance,
            parentContext, 
            this.forceUpdate.bind(this)
        );
    }

    /** Generates the JSX for the summary component */
    private generateSummary(): JSX.Element {
        const context = this.state.context as AggregateMonitorDetailsViewModel;

        return (
            <div className='health-icon-filters'>
                <BigNumberIcon
                    onClickHandler={this.onSummaryTileClickHandler.bind(this, undefined)}
                    number={context.getNumberOfMonitorsInSummaryTile(SummaryTile.Total)}
                    text={DisplayStrings.SummaryTileTotalTitle}
                    label={'Aggregate Monitors'}
                />
                <BigNumberIcon
                    onClickHandler={this.onSummaryTileClickHandler.bind(this, SummaryTile.Critical)}
                    number={context.getNumberOfMonitorsInSummaryTile(SummaryTile.Critical)}
                    icon={<ErrorSvg />}
                    text={DisplayStrings.SummaryTileCriticalTitle}
                    label={'Aggregate Monitors'}
                />
                <BigNumberIcon
                    onClickHandler={this.onSummaryTileClickHandler.bind(this, SummaryTile.Warning)}
                    number={context.getNumberOfMonitorsInSummaryTile(SummaryTile.Warning)}
                    icon={<WarnSvg />}
                    text={DisplayStrings.SummaryTileWarningTitle}
                    label={'Aggregate Monitors'}
                />
                <BigNumberIcon
                    onClickHandler={this.onSummaryTileClickHandler.bind(this, SummaryTile.Healthy)}
                    number={context.getNumberOfMonitorsInSummaryTile(SummaryTile.Healthy)}
                    icon={<GreenSvg />}
                    text={DisplayStrings.SummaryTileHealthyTitle}
                    label={'Aggregate Monitors'}
                />
                <BigNumberIcon
                    onClickHandler={this.onSummaryTileClickHandler.bind(this, SummaryTile.Unknown)}
                    number={context.getNumberOfMonitorsInSummaryTile(SummaryTile.Unknown)}
                    icon={<UnknownSvg />}
                    text={DisplayStrings.SummaryTileUnknownTitle}
                    label={'Aggregate Monitors'}
                />
            </div>
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
            name: DisplayStrings.AggregateGridMonitorColumnTitle,
            width: 0,
            cell: SGFormattedPlainCell((data: string) => data),
            sortable: false,
            infoText: DisplayStrings.AggregateGridMonitorColumnTooltip
        });

        columnDefinitions.push({
            name: DisplayStrings.AggregateGridStatusColumnTitle,
            width: sgStatusColWidth,
            cell: SGIconCell(
                (data: string) => data, 
                (data: HealthState) => HealthMonitorIconProvider.getIcon(data)
            ),  
            sortable: false,
            infoText: DisplayStrings.AggregateGridStatusColumnTooltip
        });

        return columnDefinitions;
    }

    /**
     * onChange handler for when a summary item in the summary bar is clicked
     * Filters the health statuses shown in the SG grid y the halth status corresponding the 
     * summary item clicked
     * @param healthState health status corresponding to the summary item clicked
     */
    private onSummaryTileClickHandler(healthState: HealthState | string) {
        this.getSafeComponentState().then(() => {
            const context = this.state.context as AggregateMonitorDetailsViewModel
            context.onSummaryTileClickHandler(healthState);
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
