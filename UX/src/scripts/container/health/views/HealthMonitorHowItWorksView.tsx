/** styles */
import '../../../../styles/container/HealthPane.less';

/** tpl */
import * as React from 'react';
import * as ReactMarkdown from 'react-markdown';

/** shared */
import { BaseViewModel } from '../../../shared/BaseViewModel';

/** local */
import { HealthMonitorHowItWorksViewModel } from '../viewmodels/HealthMonitorHowItWorksViewModel';
import { HealthServicesFactory } from '../factories/HealthServicesFactory';
import { DisplayStrings } from '../../../shared/DisplayStrings';

/**
 * Health monitor overview view component props
 */
export interface IHealthMonitorHowItWorksViewProps {
    /** parent context (view model) */
    parentContext: BaseViewModel;
}

/**
 * Health monitor overview view component state
 */
export interface IHealthMonitorHowItWorksViewState {
    /** health monitor overview view model */
    context: HealthMonitorHowItWorksViewModel;
}

/**
 * Health monitor overview view component
 */
export class HealthMonitorHowItWorksView
    extends React.PureComponent<IHealthMonitorHowItWorksViewProps, IHealthMonitorHowItWorksViewState> {

    /**
     * initializes an instance of the class
     * @param props component properties
     */
    public constructor(props: IHealthMonitorHowItWorksViewProps) {
        super(props);

        const viewModel = new HealthMonitorHowItWorksViewModel(
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
    public componentWillMount(): void {
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
            <div className='describe-property-panel'>
                <div className='monitor-property-title' role='heading' aria-level={2}>{DisplayStrings.HowItWorks}</div>
                <ReactMarkdown source={context.description} className='description-markdown'/>
            </div>
        );
    }
}
