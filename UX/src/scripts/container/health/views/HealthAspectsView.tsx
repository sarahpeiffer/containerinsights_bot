/** styles */
import '../../../../styles/container/HealthPane.less';

/** tpl */
import * as React from 'react';

/** shared */
import { BaseViewModel } from '../../../shared/BaseViewModel';

/** local */
import { HealthServicesFactory } from '../factories/HealthServicesFactory';
import { HealthAspectsViewModel } from '../viewmodels/HealthAspectsViewModel';
import { HealthState } from '../HealthState';
import { HealthMonitorIconProvider } from './HealthMonitorIconProvider';
import { HealthTreeView } from './HealthTreeView';
import { DisplayStrings } from '../../../shared/DisplayStrings';
import { IHealthPaneTelemetryService } from '../services/HealthPaneTelemetryService';
import { IHealthAspect } from '../IHealthAspect';
import * as TelemetryStrings from '../../../shared/TelemetryStrings';

/**
 * Health aspects view component props
 */
export interface IHealthAspectsViewProps {
    /** parent context (view model) */
    parentContext: BaseViewModel;
}

/**
 * Health aspects view component state
 */
export interface IHealthAspectsViewState {
    /** health aspects view model */
    context: HealthAspectsViewModel;
}

/**
 * Health aspects view component
 */
export class HealthAspectsView
    extends React.PureComponent<IHealthAspectsViewProps, IHealthAspectsViewState> {
    /** services factory */
    private _healthServicesFactory: HealthServicesFactory;

    /**
     * initializes an instance of the class
     * @param props component properties
     */
    public constructor(props: IHealthAspectsViewProps) {
        super(props);

        this._healthServicesFactory = HealthServicesFactory.instance;
        if (!this._healthServicesFactory) { throw new Error(`@_healthServicesFactory may not be null at HealthAspectsView.ctor()`); }

        const viewModel = new HealthAspectsViewModel(
            this._healthServicesFactory,
            props.parentContext, 
            this.forceUpdate.bind(this));

        this.state = { context: viewModel };

        this.onSelect = this.onSelect.bind(this);
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

        return (
            <>
                {this.renderAspectsPanel()}
                <div className='health-tree-panel'>
                    <HealthTreeView parentContext={context} />
                </div>
            </>
        );
    }

    /**
     * renders aspects panel
     */
    public renderAspectsPanel(): JSX.Element {
        const context = this.state.context;

        const monitorStateTextClass = 'monitor-state-text ' + HealthState[context.state].toLocaleLowerCase();

        // TODO-LOC
        return (
            <div 
            role='region'
            aria-labelledby='aspects-panel'
            id='aspects-panel'
            className='aspects-panel'
            tabIndex={0}
            aria-label={DisplayStrings.HealthAspectsPanelAriaLabel}
            onKeyUp={event => {
                if (event.key === 'ArrowRight') {
                    document.getElementById('health-tree').focus()
                }
            }}>
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
                {this.renderAspectGrid()}
            </div>
        );
    }

    /**
     * renders grid of cluster health aspects
     */
    private renderAspectGrid(): JSX.Element {
        // TODO-TASK-5154686: use another variation of grid (Brad's?)
        // TODO-LOC
        return (
            <div className='aspect-grid' role='grid'>
                <div className='grid-row title-row' role='row'>
                    <div className='title-cell aspect-name-cell' role='columnheader'>
                        {DisplayStrings.HealthAspectPaneGridHealthAspectColumnHeader}
                    </div>
                    <div className='title-cell aspect-state-cell' role='columnheader'>
                        {DisplayStrings.HealthAspectPaneGridStateColumnHeader}
                    </div>
                </div>
                {this.renderAspectGridRows()}
            </div>
        );
    }

    /**
     * renders data rows for cluster aspect health states
     */
    private renderAspectGridRows(): JSX.Element[] {
        const rows: JSX.Element[] = [];
        const context = this.state.context;

        for (const aspect of context.aspects) {
            const rowDivClassName = 'grid-row data-row' + 
                (context.selectedAspectIdentifier === aspect.aspectIdentifier ? ' selected' : '');

            const row: JSX.Element = 
                <div 
                    className={rowDivClassName} 
                    onClick={(evt) => this.onSelect(aspect.aspectIdentifier, evt)}
                    tabIndex={0} 
                    onKeyUp={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            this.onSelect(aspect.aspectIdentifier, event);
                            document.getElementById('health-tree').focus();
                            event.stopPropagation();
                        }
                    }}
                    role='row'
                    aria-label={`${DisplayStrings.HealthAspectsPaneAspectsGridRowAriaLabelComponent} ${aspect.displayName}`}
                    aria-selected={context.selectedAspectIdentifier === aspect.aspectIdentifier ? true : false}
                >
                    <div className='data-cell aspect-name-cell' role='gridcell'>
                        <span title={aspect.displayName}>{aspect.displayName}</span>
                    </div>
                    <div className='data-cell aspect-state-cell' role='gridcell'>
                        {HealthMonitorIconProvider.getIcon(aspect.state)}
                        <span className='health-state-text'>{aspect.stateDisplayName}</span>
                    </div>
                </div>;

            rows.push(row);
        }

        return rows;
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

    /**
     * callback invoked when aspect is selected
     * @param aspectIdentifier selected aspect id
     * @param evt click event
     */
    // TODO: This should be in the view model
    private onSelect(aspectIdentifier: string, evt: any): void {
        evt.stopPropagation();

        this.getSafeComponentState().then(() => {
            const telemetryService: IHealthPaneTelemetryService = this._healthServicesFactory.healthPaneTelemetryService;
            const sourceAspect: IHealthAspect = this.state.context.aspects.filter(
                (aspect: IHealthAspect) => aspect.aspectIdentifier === this.state.context.selectedAspectIdentifier)[0];
            const destinationAspect: IHealthAspect = this.state.context.aspects.filter(
                (aspect: IHealthAspect) => aspect.aspectIdentifier === aspectIdentifier)[0];

            const additionalInformation: any = {
                sourceAspectDisplayName: sourceAspect.displayName,
                sourceAspectIdentifier: sourceAspect.aspectIdentifier,
                sourceAspectHealthState: sourceAspect.stateDisplayName,
                destinationAspectDisplayName: destinationAspect.displayName,
                destinationAspectIdentifier: destinationAspect.aspectIdentifier,
                destinationAspectHealthState: destinationAspect.stateDisplayName
            }
            telemetryService.logNavigationEvent(
                `${TelemetryStrings.HealthAspectSelected}: ${sourceAspect.aspectIdentifier}`, 
                `${TelemetryStrings.HealthAspectSelected}: ${destinationAspect.aspectIdentifier}`, 
                additionalInformation
            );

            this.state.context.selectedAspectIdentifier = aspectIdentifier;
        });
    }
}
