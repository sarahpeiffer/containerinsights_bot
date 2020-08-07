import { DeploymentsPropertyRawTabModel } from '../../models/property-panel/DeploymentsPropertyRawTabModel';
import { IDeploymentsService } from '../../services/DeploymentsService';
import { PropertyPanelRawTabBindables, MainPaneBindables } from '../../DeploymentBindables';

import { BaseViewModel, reactForceUpdateHandler } from '../../../../shared/BaseViewModel';
import { ITelemetry } from '../../../../shared/Telemetry';

/**
 * view model in mvvm chain for property panel (raw tab)
 */
export class DeploymentsPropertyRawTabViewModel extends BaseViewModel {

    private model: DeploymentsPropertyRawTabModel;

    /**
     * .ctor()
     * @param deploymentService used to retreive the deployments
     * @param parentContext required by baseviewmodel
     * @param forceUpdate required by baseviewmodel
     */
    constructor(
        public telemetry: ITelemetry,
        private deploymentService: IDeploymentsService,
        parentContext: BaseViewModel,
        forceUpdate: reactForceUpdateHandler
    ) {
        super(forceUpdate, parentContext);

        this.model = new DeploymentsPropertyRawTabModel(false, false);
        parentContext.handlePropertyChanged(this.onParentPropertyChanged.bind(this));
    }

    /**
     * mvvm kick off point integrated into react lifecycle
     */
    public onLoad(): void {
        const deploymentId = this.parentContext.selectedDeployment;
        this.model.loading = true;
        this.model.data = null;
        this.model.visible = true;
        this.propertyChanged(PropertyPanelRawTabBindables.Loading);

        this.deploymentService.loadDescribe(deploymentId).then((deployment) => {
            this.model.loading = false;
            this.model.data = deployment;
            this.telemetry.logEvent('DeploymentPropertyPanelLoadDescribeTab', null, null);
            this.propertyChanged(PropertyPanelRawTabBindables.Loading);
        });
    }

    /**
     * mvmm read binding point
     */
    public get loading() {
        return this.model.loading;
    }

    /**
     * mvvm read binding point
     */
    public get visible() {
        return this.model.visible;
    }

    /**
     * mvvm read binding point (raw json to json visualizer)
     */
    public get data() {
        return this.model.data;
    }

    /**
     * mvvm read binding point (hack for json control)
     */
    public get textColor() {
        return this.model.theme.textColor;
    }

    /** mvvm read binding (hack for json control) */
    public get backgroundColor() {
        return this.model.theme.backgroundColor;
    }

    /** heck for json control... allow theme changes */
    public switchTheme(isDarkMode: boolean) {
        this.model.theme = {
            textColor: isDarkMode ? '#e0e0e0' : '#000',
            backgroundColor: isDarkMode ? '#111111' : '#fff'
        };
        this.propertyChanged('DeploymentsPropertyPanelMode.theme');
    }

    /**
     * listening for changes to the parent view model properties
     * @param property property that is changing
     */
    private onParentPropertyChanged(property): void {
        if (property === MainPaneBindables.DeploymentId) {
            this.onLoad();
        }
    }
}
