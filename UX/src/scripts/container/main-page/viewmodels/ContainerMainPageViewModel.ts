import { BaseViewModel, reactForceUpdateHandler } from '../../../shared/BaseViewModel';
import { IFailureViewParentContext } from '../../error-state/IFailureViewParentContext';
import { ContainerMainPageModel } from '../model/ContainerMainPageModel';
import { LiveDataProvider } from '../../../shared/data-provider/LiveDataProvider';

export type TabContentLoadingStatusChangeHandler = (isLoading: boolean) => void;

/**
 * VM for the MVVM chain of the main page of containers feature (WIP)
 */
export class ContainerMainPageViewModel extends BaseViewModel implements IFailureViewParentContext {

    private _model: ContainerMainPageModel;

    /**
     * .ctor()
     * @param forceUpdate required by base view model
     * @param parentContext required by base view model
     */

    constructor(
        forceUpdate: reactForceUpdateHandler, 
        private kubeApiProxyService: LiveDataProvider,
        private tabContentLoadingStatusChangeHanlder: TabContentLoadingStatusChangeHandler
    ) {
        super(forceUpdate, null);

        this._model = new ContainerMainPageModel();
    }

    /**
     * triggered by the refresh button of the overall views
     */
    public refresh() {
        this.invokeCommandAction('RefreshButton', null);
    }

    public get loadFailedReason() {
        if (!this._model.errorDetails) { return 'Unknown'; }
        return this._model.errorDetails.loadFailedReason;
    }
    
    public get loadFailedK8sPath() {
        if (!this._model.errorDetails) { return 'Unknown'; }
        return this._model.errorDetails.loadPathForFailure;
    }

    public raiseError(error: any, path: string) {
        this._model.errorDetails = {
            loadFailedReason: error ,
            loadPathForFailure: path
        };
    }

    public clearError() {
        this._model.errorDetails = null;
    }

    public setLoadStatus(loading: boolean): void {
        if (!this.tabContentLoadingStatusChangeHanlder) { return; }
        this.tabContentLoadingStatusChangeHanlder(loading);
    }

    onLoad(): Promise<void> {
        this.invokeCommandAction('RefreshButton', null);
        return Promise.resolve();
    }

    forceLogoutAd(): void {
        this.kubeApiProxyService.forceLogoutAd();
        this.invokeCommandAction('RefreshButton', null);
    }
}
