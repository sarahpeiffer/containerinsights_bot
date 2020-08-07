/** describe */
import { DeploymentsPropertyDescribeTabModel } from '../../models/property-panel/DeploymentsPropertyDescribeTabModel';
import { IDeploymentsService } from '../../services/DeploymentsService';
import { DescribeResponseInterpretor } from '../../response-interpretors/DescribeResponseInterpretor';
import { PropertyPanelDescribeTabBindables, MainPaneBindables } from '../../DeploymentBindables';

/** shared */
import { BaseViewModel, reactForceUpdateHandler } from '../../../../shared/BaseViewModel';
import { ITelemetry } from '../../../../shared/Telemetry';

/**
 * view model in mvvm chain for property panel (describe tab)
 */
export class DeploymentsPropertyDescribeTabViewModel extends BaseViewModel {

    private model: DeploymentsPropertyDescribeTabModel;

    /**
     * .ctor()
     * @param deploymentService service used to retreive the describe info
     * @param describeInterpretor response interpretor for converting raw describe into useful objects 
     * @param parentContext required by base view model
     * @param forceUpdate required by base view model
     */
    constructor(
        public telemetry: ITelemetry,
        private _deploymentService: IDeploymentsService,
        private _describeInterpretor: DescribeResponseInterpretor,
        parentContext: BaseViewModel, forceUpdate: reactForceUpdateHandler
    ) {

        super(forceUpdate, parentContext);
        this.model = new DeploymentsPropertyDescribeTabModel(false, false);
        parentContext.handlePropertyChanged(this.onParentPropertyChanged.bind(this));
    }

    /**
     * invokved by the react lifecycle to kick off our mvvm chain
     */
    public onLoad(): void {
        const deploymentId = this.parentContext.selectedDeployment;
        this.model.loading = true;
        this.model.visible = true;
        this.model.data = null;
        this.propertyChanged(PropertyPanelDescribeTabBindables.Loading);

        this._deploymentService.loadDescribe(deploymentId).then((deployment: any) => {
            this.model.loading = false;
            this.model.data = this._describeInterpretor.processDescribe(deployment);
            this.telemetry.logEvent('DeploymentPropertyPanelLoadRawTab', null, null);
            this.propertyChanged(PropertyPanelDescribeTabBindables.Loading);
        });
    }

    /** mvvm read binding point */
    public get loading() {
        return this.model.loading;
    }

    /** mvvm read binding point */
    public get visible() {
        return this.model.visible;
    }

    /** mvvm read binding point (list of properties the panel will show) */
    public get rootKeys(): string[] {
        if (!this.model || !this.model.data) {
            return [];
        }
        return Object.keys(this.model.data);
    }

    /**
     * mvvm read binding point (list of values under this property key)
     * @param key property key to retreive values for
     */
    public getDataAtKey(key: string) {
        return this.model.data[key];
    }

    /**
     * property changes sent by parent
     * @param property property changing
     */
    private onParentPropertyChanged(property: string): void {
        if (property === MainPaneBindables.DeploymentId) {
            this.onLoad();
        }
    }
}
