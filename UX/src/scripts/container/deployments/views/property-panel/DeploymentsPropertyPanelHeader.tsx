import * as React from 'react';

import { DeploymentsPaneViewModel } from '../../viewmodels/DeploymentsPaneViewModel';
import { DeploymentsPropertyPanelHeaderViewModel } from '../../viewmodels/property-panel/DeploymentsPropertyPanelHeaderViewModel';
import { DisplayStrings } from '../../../../shared/DisplayStrings';

/**
 * props type
 */
export interface IDeploymentsPropertyPanelHeaderProps {
    parentContext: DeploymentsPaneViewModel;
    servicesFactory: IServiceFactory;
}

/**
 * state type
 */
interface IDeploymentsPropertyPanelHeaderState {
    /** context (view model) */
    context: DeploymentsPropertyPanelHeaderViewModel;
}

/**
 * header for the property panel
 */
export class DeploymentsPropertyPanelHeader extends React.Component<IDeploymentsPropertyPanelHeaderProps,
    IDeploymentsPropertyPanelHeaderState> {
    /**
     * initializes a new instance of the class
     * @param props component properties
     */
    constructor(props: IDeploymentsPropertyPanelHeaderProps) {
        super(props);

        this.state = {
            context: this.createViewModel(props),
        };
    }

    /**
     * react callback invoked to render component
     */
    public render(): JSX.Element {
        return <div className='deployments-panel-header'>
            <div className='deployments-panel-primary-header'>{this.state.context.deploymentName}</div>
            <div className='deployments-panel-secondary-header'>Deployment</div>
            <div className='deploymentActionControl'
                onClick={() => {
                    this.props.parentContext.setLiveConsoleVisibility(true);
                }}
                onKeyPress={(e) => {
                    let keycode = (e.keyCode ? e.keyCode : e.which);
                    if (keycode === 13) {
                        this.props.parentContext.setLiveConsoleVisibility(true);
                    }
                }}
                tabIndex={0}
                aria-label={DisplayStrings.PropertyPanelLiveLinkText}>
                {DisplayStrings.PropertyPanelLiveLinkText}
            </div>
        </div>;
    }

    /**
     * creates view model for component based on properties received
     * @param props component properties
     */
    private createViewModel(props: IDeploymentsPropertyPanelHeaderProps): DeploymentsPropertyPanelHeaderViewModel {
        if (!props) { throw new Error(`@props may not be null at DeploymentsPropertyPanelHeader.createViewModel()`); }

        const deploymentsService = this.props.servicesFactory.generateDeploymentsService();
        return new DeploymentsPropertyPanelHeaderViewModel(deploymentsService, this.forceUpdate.bind(this), this.props.parentContext);
    }
}
