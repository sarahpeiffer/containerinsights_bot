/** styles */
import '../../../../styles/container/HealthPane.less';

/** tpl */
import * as React from 'react';

/** shared */
import { BaseViewModel } from '../../../shared/BaseViewModel';

/** local */
import { HealthMonitorPropertyPanelHeaderViewModel } from '../viewmodels/HealthMonitorPropertyPanelHeaderViewModel';
import { HealthMonitorIconProvider } from './HealthMonitorIconProvider';
import { HealthServicesFactory } from '../factories/HealthServicesFactory';

/**
 * Health monitor properties header component props
 */
export interface IHealthMonitorPropertyPanelHeaderViewProps {
    /** parent context (view model) */
    parentContext: BaseViewModel;
}

/**
 * Health monitor properties header view component state
 */
export interface IHealthMonitorPropertyPanelHeaderViewState {
    /** health monitor config view model */
    context: HealthMonitorPropertyPanelHeaderViewModel;
}

/**
 * Health monitor properties header view component
 */
export class HealthMonitorPropertyPanelHeaderView
    extends React.PureComponent<IHealthMonitorPropertyPanelHeaderViewProps, IHealthMonitorPropertyPanelHeaderViewState> {

    /**
     * initializes an instance of the class
     * @param props component properties
     */
    public constructor(props: IHealthMonitorPropertyPanelHeaderViewProps) {
        super(props);

        const viewModel = new HealthMonitorPropertyPanelHeaderViewModel(
            HealthServicesFactory.instance,
            props.parentContext,
            this.forceUpdate.bind(this));

        this.state = { context: viewModel };
    }

    /**
     * react callback invoked just before mounting occurs
     * 
     * TODO: replace with static getDerivedStateFromProps(props, state) when switching react v17+
     */
    public componentWillMount() {
        this.state.context.initialize();
    }

    /**
     * react callback invoked to render component
     */
    public render(): JSX.Element {
        const context = this.state.context;
        if (!context || !context.isInitialized) { return null; }

        // TODO-LOC
        return (
            <div className='health-monitor-props-panel-header'>
                <div className='monitor-state-icon-container'>{HealthMonitorIconProvider.getIcon(context.state)}</div>
                <div className='title' role='heading' aria-level={1}>
                    <div className='display-name' title={context.standaloneDisplayName}>{context.standaloneDisplayName}</div>
                    <div className='object-type'>Health monitor</div>
                </div>
            </div>
        );
    }
}
