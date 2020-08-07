import { DropDownOption } from '../../../shared/pill-component/TextDropDownPill';

export enum SortableColumn {
    Name = 'Name',
    Namespace = 'Namespace',
    Ready = 'Ready',
    UpToDate = 'UpToDate',
    Available = 'Available',
    Age = 'Age'
}

/**
 * model in the mvvm chain for the central UI of the deployments feature
 */
export class DeploymentsPaneModel {

    public selectedDeployment: string = null;
    public filterValue: string = '';
    public selectedPill: DropDownOption = null;
    public availablePills: DropDownOption[] = null;

    public sortColumn: SortableColumn = SortableColumn.Name;
    public sortDirection: boolean = false;
    public loadFailed: boolean = false;
    public loadFailureOnK8sPath: string = null;
    public loadingError: any = null;
    public isLiveConsoleVisible: boolean;
    public selectedRowIndex: number;

    /**
     * .ctor()
     * @param loading true if loading
     * @param data the list of deployments (ids)
     */
    constructor(public loading: boolean, public data: string[]) {
        this.isLiveConsoleVisible = false;
    }
}
