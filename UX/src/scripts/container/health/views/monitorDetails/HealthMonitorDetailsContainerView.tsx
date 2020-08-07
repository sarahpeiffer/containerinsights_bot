/** tpl */
import * as React from 'react';

/** local */
import { HealthMonitorDetailsContainerViewModel } from '../../viewmodels/monitorDetails/HealthMonitorDetailsContainerViewModel';
import { JsonMonitorDetailsView } from './JsonMonitorDetailsView';
import { IHealthMonitorDetailsViewProps } from './HealthMonitorDetailsViewBase';
import { HealthTreeViewModel } from '../../viewmodels/HealthTreeViewModel';
import { HealthServicesFactory } from '../../factories/HealthServicesFactory';
import { NodeConditionMonitorDetailsView } from './NodeConditionMonitorDetailsView';
import { NodeMemoryUtilizationMonitorDetailsView } from './NodeMemoryUtilizationMonitorDetailsView';
import { WorkloadCapacityMemoryMonitorDetailsView } from './WorkloadCapacityMemoryMonitorDetailsView';
import { WorkloadCapacityCpuMonitorDetailsView } from './WorkloadCapacityCpuMonitorDetailsView';
import { WorkloadsPodsReadyMonitorDetailsView } from './WorkloadsPodsReadyMonitorDetailsView';
import { KubeApiStatusMonitorDetailsView } from './KubeApiStatusMonitorDetailsView';
import { AggregateMonitorDetailsView } from './AggregateMonitorDetailsView';
import { ContainerCpuUtilizationMonitorDetailsView } from './ContainerCpuUtilizationMonitorDetailsView';
import { ContainerMemoryUtilizationMonitorDetailsView } from './ContainerMemoryUtilizationMonitorDetailsView';
import { NodeCpuUtilizationMonitorDetailsView } from './NodeCpuUtilizationMonitorDetailsView';

/**
 * monitor details container react component props
 */
export interface IHealthMonitorDetailsContainerViewProps {
    /** parent view model */
    parentContext: HealthTreeViewModel
}

/**
 * monitor details container react component state
 */
export interface IHealthMonitorDetailsContainerViewState {
    /** component view model */
    context: HealthMonitorDetailsContainerViewModel
}

/**
 * monitor details container react component
 */
export class HealthMonitorDetailsContainerView 
                extends React.PureComponent<IHealthMonitorDetailsContainerViewProps, IHealthMonitorDetailsContainerViewState> {
    /**
     * initializes an instance of the class
     * @param props component properties
     */
    public constructor(props: IHealthMonitorDetailsContainerViewProps) {
        super(props);

        const viewModel = new HealthMonitorDetailsContainerViewModel(
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

        const props: IHealthMonitorDetailsViewProps = {
            parentContext: context,
            monitorIdentifier: context.selectedMonitorIdentifier
        };

        const viewRegistry: StringMap<JSX.Element> = {
            'NodeStatusMonitorDetailsView': <NodeConditionMonitorDetailsView {...props} />,
            'NodeMemoryMonitorDetailsView': <NodeMemoryUtilizationMonitorDetailsView {...props} />,
            'NodeCPUMonitorDetailsView': <NodeCpuUtilizationMonitorDetailsView {...props} />,
            'SubscribedCapacityMemoryMonitorDetailsView': <WorkloadCapacityMemoryMonitorDetailsView {...props}/>,
            'SubscribedCapacityCpuMonitorDetailsView': <WorkloadCapacityCpuMonitorDetailsView {...props}/>,
            'PodsReadyMonitorDetailsView': <WorkloadsPodsReadyMonitorDetailsView {...props} />,
            'KubeApiStatusMonitorDetailsView': <KubeApiStatusMonitorDetailsView {...props} />,
            'AggregateMonitorDetailsView': <AggregateMonitorDetailsView {...props}/>,
            'ContainerCpuUtilizationMonitorDetailsView': <ContainerCpuUtilizationMonitorDetailsView {...props}/>,
            'ContainerMemoryUtilizationMonitorDetailsView': <ContainerMemoryUtilizationMonitorDetailsView {...props} />
        };
        
        const viewComponent = viewRegistry[context.detailsViewTypeName];

        return viewComponent || <JsonMonitorDetailsView {...props} />;
    }
}
