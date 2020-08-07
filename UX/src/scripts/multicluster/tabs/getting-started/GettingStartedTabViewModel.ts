import { GettingStartedTabModel } from './GettingStartedTabModel';
import { ITelemetry } from '../../../shared/Telemetry';
import { BaseViewModel } from '../../../shared/BaseViewModel';

export interface IGettingStartedtabViewModel {}


/**
 * view model in mvvm chain for deployments (main pane)
 */
export class GettingStartedTabViewModel extends BaseViewModel implements IGettingStartedtabViewModel {
    // public propertyPanes: IDetailsPanelTab[] = [];
    // public propertyPanelHeader: any;

    private model: GettingStartedTabModel;

    /**
     * .ctor()
     * NB: Multicluster isn't MVVM architected, therefore the parentContext for this component will be itself 
     * @param telemetry used to send telemetry from a common singleton instance
     * @param deploymentService used to retrieve a list of deployments
     * @param parentContext required by base view model
     * @param forceUpdate required by base view model
     */

    constructor(
        public telemetry: ITelemetry,
        parentContext: GettingStartedTabViewModel, 
        forceUpdate: reactForceUpdateHandler
    ) {
        super(forceUpdate, parentContext);

        this.model = new GettingStartedTabModel();
        console.log(this.model)
        // parentContext.handleEventTrigger('RefreshButton', this.onRefreshButton.bind(this));
    }
}
