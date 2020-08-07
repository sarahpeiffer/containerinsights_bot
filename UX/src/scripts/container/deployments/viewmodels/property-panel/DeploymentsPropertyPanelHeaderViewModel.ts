import { DeploymentsPaneViewModel } from '../DeploymentsPaneViewModel';

import { BaseViewModel, reactForceUpdateHandler } from '../../../../shared/BaseViewModel';
import { IDeploymentsService } from '../../services/DeploymentsService';
import { DeploymentsPropertyPanelHeaderModel } from '../../models/property-panel/DeploymentsPropertyPanelHeaderModel';
import { MainPaneBindables, PropertyPanelHeaderBindables } from '../../DeploymentBindables';

import { StringHelpers } from '../../../../shared/Utilities/StringHelpers';

/**
 * view model in mvvm chain for property panel (panel header)
 */
export class DeploymentsPropertyPanelHeaderViewModel extends BaseViewModel {
    private model: DeploymentsPropertyPanelHeaderModel;

    /**
     * .ctor()
     * @param deploymentsService deployments service for retreiving deployment details (name in this case from id)
     * @param forceUpdate required by baseviewmodel
     * @param parentContext required by baseviewmodel
     */

    constructor(private deploymentsService: IDeploymentsService,
        forceUpdate: reactForceUpdateHandler, parentContext: DeploymentsPaneViewModel) {
        super(forceUpdate, parentContext);

        this.model = new DeploymentsPropertyPanelHeaderModel('');

        parentContext.handlePropertyChanged(this.onParentPropertyChanged.bind(this));
    }

    /**
     * invokved by the react lifecycle to kick off our mvvm chain
     */
    public onLoad(): void {

        const castedContext = this.parentContext as DeploymentsPaneViewModel;

        if (StringHelpers.isNullOrEmpty(castedContext.selectedDeployment)) {
            this.model.deploymentName = '';
            this.propertyChanged(PropertyPanelHeaderBindables.Name);
            return;
        }

        const details = this.deploymentsService.getDeploymentDetails(castedContext.selectedDeployment);
        this.model.deploymentName = details.name;
        this.propertyChanged(PropertyPanelHeaderBindables.Name);
    }

    /**
     * mvvm read binding point
     */
    public get deploymentName() {
        return this.model.deploymentName;
    }

    /**
     * parent context property change handler
     * @param property property that is changing
     */
    private onParentPropertyChanged(property: string): void {
        if (property === MainPaneBindables.DeploymentId) {
            this.onLoad();
        }
    }

}
