import * as moment from 'moment';
import { Promise } from 'es6-promise';
import { KeyboardEvent } from 'react';

import { IDeploymentsService, LiveConsoleQueryMode } from '../services/DeploymentsService';
import { DeploymentsPaneModel, SortableColumn } from '../models/DeploymentsPaneModel';
import { IDetailsPaneParentViewModel, ITelemetryData } from '../../../shared/property-panel-v2/IDetailsPaneParentViewModel';
import { IDetailsPanelTab } from '../../../shared/property-panel-v2/IDetailsPaneTab';
import { BaseViewModel, reactForceUpdateHandler } from '../../../shared/BaseViewModel';
import { MainPaneBindables } from '../DeploymentBindables';
import { ContainerMainPageViewModel } from '../../main-page/viewmodels/ContainerMainPageViewModel';
import { ILiveConsoleRefreshViewParentContext } from '../../../shared/live-console-v2/views/LiveConsoleView';
import { ILiveDataService } from '../../../shared/live-console-v2/viewmodels/LiveConsoleViewModel';
import { IQueryParameters, BufferTypes } from '../../../shared/live-console-v2/models/LiveConsoleModel';
import { DropDownOption } from '../../../shared/pill-component/TextDropDownPill';
import { OptionValues } from '@appinsights/react-select';
import { StringHelpers } from '../../../shared/Utilities/StringHelpers';
import { BladeContext } from '../../BladeContext';
import { ITelemetry, TelemetrySubArea } from '../../../shared/Telemetry';
import { ErrorSeverity } from '../../../shared/data-provider/TelemetryErrorSeverity';
import { SortHelper } from '../../../shared/SortHelper';
import { KeyCodes } from '../../../shared/KeyCodes';
import * as GridAccessibilityHelper from '../GridAccessibilityHelper';
import { IFailureViewParentContext } from '../../error-state/IFailureViewParentContext';

/**
 * view model in mvvm chain for deployments (main pane)
 */
export class DeploymentsPaneViewModel extends BaseViewModel
    implements IDetailsPaneParentViewModel, ILiveConsoleRefreshViewParentContext, IFailureViewParentContext {
    public propertyPanes: IDetailsPanelTab[] = [];
    public propertyPanelHeader: any;

    private model: DeploymentsPaneModel;

    /**
     * .ctor()
     * @param telemetry used to send telemetry from a common singleton instance
     * @param deploymentService used to retrieve a list of deployments
     * @param parentContext required by base view model
     * @param forceUpdate required by base view model
     */

    constructor(
        public telemetry: ITelemetry,
        public deploymentService: IDeploymentsService,
        parentContext: ContainerMainPageViewModel,
        forceUpdate: reactForceUpdateHandler
    ) {
        super(forceUpdate, parentContext);

        this.model = new DeploymentsPaneModel(true, []);

        parentContext.handleEventTrigger('RefreshButton', this.onRefreshButton.bind(this));
    }

    public onRefreshButton(): void {
        const preRefreshSelection = this.model.selectedDeployment;
        const preIsLiveConsoleVisible = this.model.isLiveConsoleVisible;

        this.onLoad().then(() => {
            if (StringHelpers.contains(this.model.data, preRefreshSelection)) {
                this.changeSelection(preRefreshSelection, null);

                if (preIsLiveConsoleVisible) {
                    this.setLiveConsoleVisibility(true);
                }
            }
        });
    }

    /**
     * mvvm hook into react lifecycle
     */
    public onLoad(): Promise<void> {

        this.castedParent().setLoadStatus(true);

        this.model.data = [];
        this.model.loading = true;
        this.model.loadFailed = false;
        this.model.loadingError = null;
        this.model.selectedDeployment = null;
        this.model.availablePills = null;
        this.model.loadFailureOnK8sPath = null;

        if (this.model.isLiveConsoleVisible) {
            this.setLiveConsoleVisibility(false);
        }

        this.propertyChanged(MainPaneBindables.Loading);

        return this.deploymentService.loadDeploymentsList().then((timeTakeToFetchDeployments) => {
            this.castedParent().setLoadStatus(false);
            
            this.model.loading = false;
            this.model.data = this.deploymentService.getDeployments();

            this.telemetry.logPageView(
                TelemetrySubArea.ContainerDeploymentList.toString(),
                null,
                null,
                {
                    totalRowsFromQuery: this.model.data.length,
                    duration: timeTakeToFetchDeployments,
                }
            );

            this.propertyChanged(MainPaneBindables.Loading);
        }).catch((err) => {
            this.castedParent().setLoadStatus(false);
            
            this.model.loading = false;
            this.model.loadFailed = true;
            this.model.loadingError = err;
            this.model.loadFailureOnK8sPath = '/apis/apps/v1/deployments';
            this.telemetry.logException(err, 'DeploymentsPaneViewModel.onLoad', ErrorSeverity.Error, null, null);
            this.propertyChanged(MainPaneBindables.Loading);
        });
    }

    public forceLogoutAd() {
        this.deploymentService.forceLogoutAd();
        this.onLoad();
    }

    /**
     * register a property tab / pane to be given to property panel
     * @param pane pane to register (will be given to the property panel system)
     */
    public registerPropertyPane(pane: IDetailsPanelTab) {
        this.propertyPanes.push(pane);
    }

    /**
     * register a JSX element to be given to the property panel for its header
     * @param header jsx element to be utilized on property panel header area
     */
    public registerPropertyPanelHeader(header: any) {
        this.propertyPanelHeader = header;
    }

    /**
     * trigger a deployment selection change
     * @param deploymentId deployment being selected
     * @param selectedRowIndex changing selection to 'selectedRowIndex' index value
     */
    public changeSelection(deploymentId: string, selectedRowIndex: number): void {
        this.setPillForDeployment(deploymentId);

        this.model.selectedDeployment = deploymentId;
        this.model.selectedRowIndex = selectedRowIndex;
        this.propertyChanged(MainPaneBindables.DeploymentId);
    }

    /**
     * live console visibility setting
     * @param value visiable setting
     */
    public setLiveConsoleVisibility(value: boolean): void {
        this.model.isLiveConsoleVisible = value;
        this.propertyChanged(MainPaneBindables.IsLiveConsoleVisible);
    }

    /**
     * live console visible checking
     */
    public isLiveConsoleVisible(): boolean {
        return this.model.isLiveConsoleVisible;
    }

    /**
     * check if a given deployment id is selected or not
     * @param deploymentId deployment to check selection on
     */
    public isSelected(deploymentId: string): boolean {
        return this.model.selectedDeployment === deploymentId;
    }

    public get loadFailedK8sPath() {
        if (!this.model.loadFailed) { throw 'K8s Path requested but load hasnt failed!'; }
        return this.model.loadFailureOnK8sPath;
    }

    /**
     * mvvm read binding point
     */
    public get isLoading(): boolean {
        return this.model.loading;
    }

    public get loadingFailed(): boolean {
        return this.model.loadFailed;
    }

    public get loadFailedReason(): any {
        return this.model.loadingError;
    }

    /**
     * mvvm read binding point
     */
    public get propertyPanelVisible(): boolean {
        return this.model.selectedDeployment !== null;
    }

    /**
     * mvvm read binding point
     */
    public get deployments(): string[] {
        return this.model.data.sort(this._sortInternal.bind(this)).filter((item) => {
            if (StringHelpers.isNullOrEmpty(this.model.filterValue)) { return true; }

            const metaItem = this.deploymentService.getDeploymentDetails(item);
            return metaItem.name.includes(this.model.filterValue);
        });
    }

    /**
     * get the filter value
     */
    public get filterValue(): string {
        return this.model.filterValue;
    }

    /**
     * mvvm read binding point
     */
    public get selectedDeployment(): string {
        return this.model.selectedDeployment;
    }

    /**
     * mvvm read binding point
     */
    public get selectedRowIndex(): number {
        return this.model.selectedRowIndex;
    }

    /**
     * filter the change based on the input name
     * @param filterValue filter condition
     */
    public onNameFilterChanged(filterValue: string): void {
        this.model.filterValue = filterValue;
        this.propertyChanged(MainPaneBindables.FilterValueChanged);
    }

    /**
     * checks if the current column is selected
     * @param column to check selection against
     */
    public isSelectedColumn(column: SortableColumn): boolean {
        return column === this.model.sortColumn;
    }

    public gridHeaderAcceesibilityHelperForKeyDown(event: KeyboardEvent<HTMLElement>, column: SortableColumn): void {
        if (!event) {
            return;
        }

        let key = event.which || event.keyCode;
        switch (key) {
            case KeyCodes.SPACEBAR:
                this.sort(column);
                break;
            case KeyCodes.ENTER:
                this.sort(column);
                break;
            default:
                GridAccessibilityHelper.handleKeyboardNavigation(event)
                return;
        }
    }

    /**
     * Gets the sort direction for the current selected column
     */
    public sortDirection(): string {
        return this.model.sortDirection ? 'ascending' : 'descending';
    }

    /**
     * sort based on the colum
     * @param column 
     */
    public sort(column: SortableColumn): void {
        if (column !== this.model.sortColumn) {
            this.model.sortDirection = false;
            this.model.sortColumn = column;
        } else {
            this.model.sortDirection = !this.model.sortDirection;
        }

        this.telemetry.logEvent(
            'DeploymentGridColumnSort',
            {
                column: column,
                sortDirection: this.model.sortDirection
                    ? 'ascending'
                    : 'descending'
            },
            null
        );
        this.propertyChanged(MainPaneBindables.SortDirection);
    }

    /**
     * drop down options
     */
    public getPillOptions(): DropDownOption[] {
        return this.model.availablePills;
    }

    /**
     * drop down selection
     */
    public getSelectedPill(): DropDownOption {
        return this.model.selectedPill;
    }

    /**
     * change the selection
     * @param value option values
     */
    public changePillSelection(value: OptionValues): void {
        const getPillOptions = this.getPillOptions();
        const target = getPillOptions.filter((option) => { return StringHelpers.equal(value as string, option.value as string); });
        if (target.length !== 1) {
            throw 'Invalid number of values found for pill option';
        }

        this.model.selectedPill = target[0];

        this.propertyChanged(MainPaneBindables.PillSelection);
    }

    /**
     * get the LiveData
     */
    public getDataService(): ILiveDataService {
        return this.deploymentService;
    }
    /**
     * query condition
     */
    public getSelectedData(): IQueryParameters {
        return {
            data: {
                deploymentId: this.model.selectedDeployment,
                queryModel: this.model.selectedPill.value
            },
            consoleKind: BufferTypes.Events,

        }
    }

    /** Returns data to be added to the telemetry for tab changes in the property panel */
    public getTelemetryDataForTabChange(): ITelemetryData {
        return { name: `${TelemetrySubArea.ContainerDeploymentList}::TabSelectionChanged`, data: null };
    }

    /** Returns the telemetry sub area for deployments */
    public getTelemetrySubArea(): TelemetrySubArea {
        return TelemetrySubArea.ContainerDeploymentList;
    }

    /**
     * setting pill for deployment
     * @param deploymentId deployment id
     */
    private setPillForDeployment(deploymentId: string) {
        const deploymentDetails = this.deploymentService.getDeploymentDetails(deploymentId);
        const bladeContext = BladeContext.instance();

        this.model.availablePills = [
            {
                label: deploymentDetails.name + ' ( ' + 'Deployment' + ' )',
                value: LiveConsoleQueryMode.Deployment
            },
            {
                label: deploymentDetails.namespace + ' ( ' + 'Namespace' + ' )',
                value: LiveConsoleQueryMode.Namespace
            },
            {
                label: bladeContext.cluster.resourceName + ' ( ' + 'Cluster' + ' )',
                value: LiveConsoleQueryMode.Cluster
            }
        ];

        this.model.selectedPill = this.model.availablePills[0];
    }

    private castedParent(): ContainerMainPageViewModel {
        return this.parentContext;
    }

    /**
     * sort based left and right direction
     * @param left left meta 
     * @param right right meta
     */
    private _sortInternal(left: string, right: string): number {
        const metaLeft = this.deploymentService.getDeploymentDetails(this.model.sortDirection ? left : right);
        const metaRight = this.deploymentService.getDeploymentDetails(this.model.sortDirection ? right : left);

        switch (this.model.sortColumn) {
            case SortableColumn.Name:
                return SortHelper.Instance().sortByNameAlphaNumeric(metaRight.name, metaLeft.name);
            case SortableColumn.Namespace:
                return SortHelper.Instance().sortByNameAlphaNumeric(metaRight.namespace, metaLeft.namespace);
            case SortableColumn.Ready:
                const deltaLeft = parseInt(metaLeft.readyDesired, 10) - parseInt(metaLeft.readyActual, 10);
                const deltaRight = parseInt(metaRight.readyDesired, 10) - parseInt(metaRight.readyActual, 10);
                return deltaLeft - deltaRight;
            case SortableColumn.UpToDate:
                const upToDateLeft = parseInt(metaLeft.upToDate, 10);
                const upToDateRight = parseInt(metaRight.upToDate, 10);
                return upToDateLeft - upToDateRight;
            case SortableColumn.Available:
                const availableLeft = parseInt(metaLeft.available, 10);
                const availableRight = parseInt(metaRight.available, 10);
                return availableLeft - availableRight;
            case SortableColumn.Age:
                const ageStringLeft = metaLeft.age;
                const ageMomentLeft = moment(ageStringLeft);
                const ageStringRight = metaRight.age;
                const ageMomentRight = moment(ageStringRight);
                return ageMomentRight.diff(ageMomentLeft);
        }

        return 0;
    }

}
