import * as moment from 'moment';
import { KeyboardEvent } from 'react';

import { IDeploymentsService } from '../services/DeploymentsService';
import { DeploymentsItemModel } from '../models/DeploymentsItemModel';
import { BaseViewModel, reactForceUpdateHandler } from '../../../shared/BaseViewModel';
import { DeploymentsPaneViewModel } from './DeploymentsPaneViewModel';
import { KeyCodes } from '../../../shared/KeyCodes';
import * as GridAccessibilityHelper from '../GridAccessibilityHelper';

/**
 * view model in mvvm chain for deployments (each item in a grid)
 */
export class DeploymentsItemViewModel extends BaseViewModel {

    private model: DeploymentsItemModel;

    /**
     * .ctor()
     * @param deploymentService used to retreiteve deployment details for a given deployment
     * @param forceUpdate required by base view model
     * @param parentContext required by base view model
     */
    constructor(private deploymentService: IDeploymentsService, forceUpdate: reactForceUpdateHandler,
        parentContext: DeploymentsPaneViewModel) {
        super(forceUpdate, parentContext);

        this.model = null;

    }

    /**
     * mvvm loading hook in the react lifecycle
     * @param deploymentId deployment id that is loading
     */
    public onLoad(deploymentId: string): void {
        this.model = this.deploymentService.getDeploymentDetails(deploymentId);
    }

    public handleKeyDownEvent(event: KeyboardEvent<HTMLElement>, rowIndex: number): void {
        if (!event) {
            return;
        }

        let key = event.which || event.keyCode;
        switch (key) {
            case KeyCodes.SPACEBAR:
                    this.parentContext.changeSelection(this.model.deploymentId, rowIndex);
                break;
            case KeyCodes.ENTER:
                    this.parentContext.changeSelection(this.model.deploymentId, rowIndex);
                break;
            default:
                GridAccessibilityHelper.handleKeyboardNavigation(event)
                return;
        }
    }

    /**
     * mvvm read binding point
     */
    public get loading() {
        return !this.model;
    }

    /**
     * mvvm read binding point
     */
    public get name() {
        return this.model.name;
    }

    /**
     * mvvm read binding point
     */
    public get available() {
        return this.model.available;
    }

    /**
     * mvvm read binding point
     */
    public get namespace() {
        return this.model.namespace;
    }

    /**
     * mvvm read binding point
     */
    public get readyActual() {
        return this.model.readyActual;
    }

    /**
     * mvvm read binding point
     */
    public get readyDesired() {
        return this.model.readyDesired;
    }

    /**
     * mvvm read binding point
     */
    public get deploymentId() {
        return this.model.deploymentId;
    }

    /**
     * mvvm read binding point
     */
    public get upToDate() {
        return this.model.upToDate;
    }

    /**
     * mvvm read binding point
     */
    public get age() {
        const ageString = this.model.age;
        const ageMoment = moment(ageString);
        return ageMoment.fromNow(true);
    }
}
