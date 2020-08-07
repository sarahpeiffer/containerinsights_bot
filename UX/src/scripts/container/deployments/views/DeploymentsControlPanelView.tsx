import * as React from 'react';
import { DeploymentsPaneViewModel } from '../viewmodels/DeploymentsPaneViewModel';

interface IDeploymentsControlPanelViewProps {
    parentContext: DeploymentsPaneViewModel;
}

/** state type */
interface IDeploymentsControlPanelViewState {
    context: DeploymentsPaneViewModel;
}

/**
 * control panel space for pills
 */
export class DeploymentsControlPanelView extends React.PureComponent<IDeploymentsControlPanelViewProps, IDeploymentsControlPanelViewState> {
    /**
     * initializes a new instance of the class
     * @param props component properties
     */
    constructor(props: IDeploymentsControlPanelViewProps) {
        super(props);

        this.state = {
            context: props.parentContext
        };
    }


    /**
     * react callback invoked to render component
     */
    public render(): JSX.Element {
        return (
            <div className='deployments-pane'>
                &nbsp;
            </div >
        );
    }
}
