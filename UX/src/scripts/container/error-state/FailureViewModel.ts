
import { BaseViewModel, reactForceUpdateHandler } from '../../shared/BaseViewModel';
import { FailureModel } from './FailureModel';
// import { DeploymentsPaneViewModel } from './DeploymentsPaneViewModel';
import { FailurePaneBindables } from './ErrorStateBindables';
import { ErrorCodes } from '../../shared/ErrorCodes';
import { IFailureViewParentContext } from './IFailureViewParentContext';

/**
 * view model in mvvm chain for deployments (main pane)
 */
export class FailureViewModel extends BaseViewModel {

    private model: FailureModel;

    /**
     * .ctor()
     * @param deploymentService used to retrieve a list of deployments
     * @param parentContext required by base view model
     * @param forceUpdate required by base view model
     */
    constructor(parentContext: IFailureViewParentContext,
        forceUpdate: reactForceUpdateHandler) {
        super(forceUpdate, parentContext);

        this.model = new FailureModel();
    }

    public get loadFailedReason(): any {
        try {
            console.log(this.model);
            return JSON.stringify(this.castedParent().loadFailedReason);
        } catch {
            return String(this.castedParent().loadFailedReason);
        }
    }

    public get errorCodeRaw(): number {
        const loadFailedReson = this.castedParent().loadFailedReason;

        if (!loadFailedReson || !loadFailedReson.responseJSON
            || !loadFailedReson.responseJSON.code) { return -1; }

        return loadFailedReson.responseJSON.code;
    }

    public get errorCode(): string {
        const loadFailedReson = this.castedParent().loadFailedReason;

        if (!loadFailedReson || !loadFailedReson.responseJSON
            || !loadFailedReson.responseJSON.code) { return 'Unknown'; }

        return 'HTTP Status ' + loadFailedReson.responseJSON.code + ` (${loadFailedReson.responseJSON.reason || 'unknown'})`;
    }

    public get k8sErrorPath(): string {
        return this.castedParent().loadFailedK8sPath;
    }

    public get canOfferHelp(): boolean {
        const loadFailedReson = this.castedParent().loadFailedReason;

        if (!loadFailedReson || !loadFailedReson.responseJSON || !loadFailedReson.responseJSON.code) { return false; }

        switch (loadFailedReson.responseJSON.code) {
            case ErrorCodes.PopupFailedLogin:
            case ErrorCodes.HealthFailed:
            case 401:
            case 403:
                return true;
            default:
                return false;
        }
    }

    public get advancedBodyHidden(): boolean {
        return this.model.isAdvancedCollapsed;
    }

    public refreshPage() {
        this.castedParent().onLoad();
    }

    public forceLogoutAd() {
        this.castedParent().forceLogoutAd();
    }

    public toggleAdvancedBodyCollapse(): void {
        this.model.isAdvancedCollapsed = !this.model.isAdvancedCollapsed;
        this.propertyChanged(FailurePaneBindables.AdvancedBodyCollapse);
    }

    private castedParent(): IFailureViewParentContext {
        return this.parentContext as IFailureViewParentContext;
    }
}
