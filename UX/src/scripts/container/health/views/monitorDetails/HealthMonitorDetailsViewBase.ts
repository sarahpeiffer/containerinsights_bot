/** tpl */
import * as React from 'react';

/** local */
import { HealthMonitorDetailsContainerViewModel } from '../../viewmodels/monitorDetails/HealthMonitorDetailsContainerViewModel';
import { IHealthMonitorDetailsViewModel } from '../../viewmodels/monitorDetails/IHealthMonitorDetailsViewModel';

/**
 * Health monitor details view component props
 */
export interface IHealthMonitorDetailsViewProps {
    /** parent context (view model) */
    parentContext: HealthMonitorDetailsContainerViewModel;

    /** monitor identifier */
    monitorIdentifier: string;
}

/**
 * Health monitor details view component state
 */
export interface IHealthMonitorDetailsViewState {
    /** health monitor details view model */
    context: IHealthMonitorDetailsViewModel;
}

/**
 * Abstract base class for health monitor details view component
 */
export abstract class HealthMonitorDetailsViewBase
    extends React.PureComponent<IHealthMonitorDetailsViewProps, IHealthMonitorDetailsViewState> {
    /**
     * initializes an instance of the class
     * @param props component properties
     */
    public constructor(props: IHealthMonitorDetailsViewProps) {
        super(props);
        this.state = { context: this.createViewModel(props.parentContext) };
    }

    /**
     * react callback invoked just before mounting occurs
     * 
     * TODO: replace with static getDerivedStateFromProps(props, state) when switching react v17+
     */
    public componentWillMount(): void {
        this.state.context.initialize(this.props.monitorIdentifier);
    }

    /**
     * react callback invoked just before rendering when new props or state are being received
     * @param nextProps updated (target) component properties
     * 
     * TODO: replace with static getDerivedStateFromProps(props, state) when switching react v17+
     */
    public componentWillUpdate(nextProps: IHealthMonitorDetailsViewProps): void {
        if (this.props.monitorIdentifier !== nextProps.monitorIdentifier) {
            this.state.context.initialize(nextProps.monitorIdentifier);
        }
    }

    /**
     * react callback invoked to render component
     */
    public render(): JSX.Element {
        const context = this.state.context;
        if (!context || !context.isInitialized) { return null; }

        return this.renderMonitorDetails();
    }

    protected abstract renderMonitorDetails(): JSX.Element;

    protected abstract createViewModel(parentContext: HealthMonitorDetailsContainerViewModel): IHealthMonitorDetailsViewModel;
}
