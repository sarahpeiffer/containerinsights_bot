import * as React from 'react';

import { DeploymentsItemViewModel } from '../viewmodels/DeploymentsItemViewModel';
import { DeploymentsPaneViewModel } from '../viewmodels/DeploymentsPaneViewModel';

import { BlueLoadingDots, BlueLoadingDotsSize } from '../../../shared/blue-loading-dots';

/** props type */
export interface IDeploymentsItemViewProps {
    service: IServiceFactory;
    deploymentId: string;
    rowIndex: number;
    parentContext: DeploymentsPaneViewModel;
}

/** state type */
interface IDeploymentsItemViewState {
    /** context (view model) */
    context: DeploymentsItemViewModel;
}

/**
 * Deployment item, an entry on the grid
 */
export class DeploymentsItemView extends React.Component<IDeploymentsItemViewProps, IDeploymentsItemViewState> {
    /**
     * initializes a new instance of the class
     * @param props component properties
     */
    constructor(props: IDeploymentsItemViewProps) {
        super(props);

        this.state = {
            context: this.createViewModel(props),
        };
    }

    /**
     * React lifecycle hook to intertwine the REACT and MVVM patterns
     */
    public componentWillMount() {
        this.state.context.onLoad(this.props.deploymentId);
    }

    /**
     * react callback invoked just before rendering when new props or state are being received
     * @param nextProps updated (target) component properties
     * 
     * TODO: replace with static getDerivedStateFromProps(props, state) when switching react v17+
     */
    public componentWillUpdate(nextProps: IDeploymentsItemViewProps): void {
        this.state.context.onLoad(nextProps.deploymentId);
    }

    /**
     * react callback invoked to render component
     */
    public render(): JSX.Element {

        if (this.state.context.loading) {
            return this.renderLoading();
        }

        let rowClassName = 'deploymentsItemRow';
        if (this.props.parentContext.isSelected(this.state.context.deploymentId)) {
            rowClassName = rowClassName + ' deploymentsItemRowSelected';
        }

        return (
            <tr className={rowClassName}
                role='row'
                onClick={this.onRowClick.bind(this, this.props.rowIndex)}
            >
                <td className='deploymentsItemCell'
                    role='gridcell'
                    tabIndex={-1}
                    aria-colindex={0}
                    aria-rowindex={this.props.rowIndex}
                    aria-selected={this.props.parentContext.selectedRowIndex === this.props.rowIndex
                        ? 'true'
                        : 'false'}
                    onKeyDown={(event) => this.state.context.handleKeyDownEvent(event, this.props.rowIndex)}
                    aria-label={this.state.context.name}
                >
                    {this.state.context.name}
                </td>
                <td className='deploymentsItemCell'
                    role='gridcell'
                    tabIndex={-1}
                    aria-colindex={1}
                    aria-rowindex={this.props.rowIndex}
                    aria-selected={this.props.parentContext.selectedRowIndex === this.props.rowIndex
                        ? 'true'
                        : 'false'}
                    onKeyDown={(event) => this.state.context.handleKeyDownEvent(event, this.props.rowIndex)}
                    aria-label={this.state.context.namespace}
                >
                    {this.state.context.namespace}
                </td>
                <td className='deploymentsItemCell'
                    role='gridcell'
                    tabIndex={-1}
                    aria-colindex={2}
                    aria-rowindex={this.props.rowIndex}
                    aria-selected={this.props.parentContext.selectedRowIndex === this.props.rowIndex
                        ? 'true'
                        : 'false'}
                    onKeyDown={(event) => this.state.context.handleKeyDownEvent(event, this.props.rowIndex)}
                    aria-label={this.state.context.readyActual + '/' + this.state.context.readyDesired}
                >
                    {this.state.context.readyActual}/{this.state.context.readyDesired}
                </td>
                <td className='deploymentsItemCell'
                    role='gridcell'
                    tabIndex={-1}
                    aria-colindex={3}
                    aria-rowindex={this.props.rowIndex}
                    aria-selected={this.props.parentContext.selectedRowIndex === this.props.rowIndex
                        ? 'true'
                        : 'false'}
                    onKeyDown={(event) => this.state.context.handleKeyDownEvent(event, this.props.rowIndex)}
                    aria-label={this.state.context.upToDate}
                >
                    {this.state.context.upToDate}
                </td>
                <td className='deploymentsItemCell'
                    role='gridcell'
                    tabIndex={-1}
                    aria-colindex={4}
                    aria-rowindex={this.props.rowIndex}
                    aria-selected={this.props.parentContext.selectedRowIndex === this.props.rowIndex
                        ? 'true'
                        : 'false'}
                    onKeyDown={(event) => this.state.context.handleKeyDownEvent(event, this.props.rowIndex)}
                    aria-label={this.state.context.available}
                >
                    {this.state.context.available}
                </td>
                <td className='deploymentsItemCell'
                    role='gridcell'
                    tabIndex={-1}
                    aria-colindex={5}
                    aria-rowindex={this.props.rowIndex}
                    aria-selected={this.props.parentContext.selectedRowIndex === this.props.rowIndex
                        ? 'true'
                        : 'false'}
                    onKeyDown={(event) => this.state.context.handleKeyDownEvent(event, this.props.rowIndex)}
                    aria-label={this.state.context.age}
                >
                    {this.state.context.age}
                </td>
            </tr>
        );
    }

    /**
     * triggered when a user clicks on a row
     */
    private onRowClick(selectedIndex: number) {
        this.setState({}, () => {
            this.props.parentContext.changeSelection(this.state.context.deploymentId, selectedIndex);
        });
    }

    /**
      * renders 'loading dots' view
      * @returns {JSX.Element} visual element to render
    */
    private renderLoading(): JSX.Element {
        return (
            <div className='deployments-load-msg-container'>
                <BlueLoadingDots size={BlueLoadingDotsSize.medium} />
            </div>
        );
    }

    /**
     * creates view model for component based on properties received
     * @param props component properties
     */
    private createViewModel(props: IDeploymentsItemViewProps): DeploymentsItemViewModel {
        if (!props) { throw new Error(`@props may not be null at DeploymentsPaneView.createViewModel()`); }

        return new DeploymentsItemViewModel(this.props.service.generateDeploymentsService(), this.forceUpdate.bind(this),
            this.props.parentContext);
    }
}
