import { IWorkspaceInfo } from './IWorkspaceInfo';
import { StringMap } from './StringMap';

/**
 * Workspace List manager is responsible for all activities related to the selection
 * caching syncing and optionally the geographical restrictions of workspace management
 */
export class WorkspaceListManager {

    /**
     * The list of workspaces we are working with... if a geo restriction is present
     * this list will NOT include any workspaces outside the allowed geo restriction
     */
    private sortedList: IWorkspaceInfo[];

    /**
     * hash table containing the workspaces; used by findById() and during
     * workspace list appending operations
     * key = lowerCase workspace Id, Value = workspace object
     */
    private workspaceIdHash: StringMap<IWorkspaceInfo>;

    /**
     * the currently selected workspace... a lot of the time this value will come
     * from the Menu / Blade caching mechanism (driven by localstorage)
     */
    private selectedWorkspace: IWorkspaceInfo;

    /**
     * [optional] indicates that workspace loading is complete.  the original contract with our
     * blade did not include this (it was a single bulk message load)... it will be forced in those cases
     */
    private fullyLoaded: boolean;

    /**
     * [optional] provided by the newest contracts in our blade... tells us about http/503s for example
     * which allows us to tell our users some of the batched ARM loads have failed (and potentially retry)
     */
    private errorState: boolean;

    /**
     * .ctor initialize an empty workspace list management engine.
     */
    constructor() {
        this.workspaceIdHash = {};
        this.sortedList = [];
        this.selectedWorkspace = undefined;
    }

    /**
     * Modifies the state of the workspace list manager to include all of the new workspaces...
     * if isLoaded is true, will replace the entire list, otherwise will append the list
     * @param workspaceList list of new workspaces
     * @param isLoaded are we loading the last batch of data?
     */
    public modifyWorkspaceList(workspaceList: any[], isLoaded: any): boolean {
        // The logic of fetching workspaces is changed from resources call to ARG (VM Insights), so we would have the complete
        // list of workspaces the first time. Now that subscriptions are hooked onto global subscriptions filter, when user changes
        // subscriptions selections, new workspaces are fetched and updated. For that reason we should not be blocking locking the 
        // WorkspaceListManager with stale workspaces, making it mutable

        // TODO: revisit this logic and clean up this class.
        // bbax: previous versions of the contract should enforce a single loading call
        // can be removed in January when there is zero chance of encountering old menu code
        if (isLoaded === undefined) {
            isLoaded = true;
        }

        let listAltered: boolean = false;

        if (workspaceList && workspaceList.length && workspaceList.length > 0) {

            // bbax: on final load; replace the entire list before this object lands at rest
            // spinners are about to disappear so its our last chance to complete cleanup
            if (isLoaded) {
                // bbax: we need the ui to render to stop loading the spiner anyway, no harm in forcing a complete
                // refresh of this part of the system too... all this will cause today is the 'sequenceNumber' to
                // update in the MainPage respective that loaded this component... also required for sorting
                listAltered = true;
                this.workspaceIdHash = {};
                this.sortedList = [];
                workspaceList.forEach((workspace) => {
                    if (workspace && workspace.id) {
                        this.sortedList.push(workspace);
                        this.workspaceIdHash[workspace.id.toLowerCase()] = workspace;
                    }
                });
            } else {
                // bbax; if loading isn't finished batching are arriving and could be merging in with cached entries
                // albeit most of the time on cached load the filteredWorkspaceList will be empty (hopefully!)
                const filteredWorkspaceList = workspaceList.filter((wsp) => { return this.workspaceNotAlreadyInHash(wsp); });
                if (filteredWorkspaceList && filteredWorkspaceList.length && filteredWorkspaceList.length > 0) {
                    listAltered = true;
                    filteredWorkspaceList.forEach((workspace) => {
                        if (workspace && workspace.id) {
                            this.workspaceIdHash[workspace.id.toLowerCase()] = workspace;
                            this.sortedList.push(workspace);
                        }
                    });
                }
            }
        }

        // bbax: if the list is altered, it is no longer likely sorted... lets sort it!
        if (listAltered) {
            this.sortedList = this.sortedList.sort(this.sortFunction);
        }

        // bbax; we're done
        if (isLoaded) {
            this.fullyLoaded = true;
        }

        return listAltered;
    }

    /**
     * [optional] Flag the workspace manager into the 'error' state if we encounter any errors.
     * the newest versions of the blade/menu contract provide http error codes if they occur; this
     * gives us a chance to show a visual indication of a problem (and potential retry options)
     * @param errors list of errors encountered
     */
    public updateErrorState(errors: any) {
        if (errors && errors.length && errors.length > 0) {
            this.errorState = true;
        }
    }

    /**
     * TBD: To be used by React/UI to show an error icon
     */
    public isInErrorState() {
        return this.errorState;
    }

    /**
     * TBD: to be used by react/ui to show a spinner icon
     */
    public isLoading() {
        return !this.fullyLoaded;
    }

    /**
     * Used primarily by the caching engine in the latest contract with the menu/parent blade
     * to force the UI to a given selected workspace.  with older contracts, this value would
     * be undefined which will select the first workspace on the list... in batched loading this
     * behavior would be weird since your list could contain partial results so use with caution
     * (ie if someone deletes the cached selection but a cached list still exists... this scenario
     * is tricky and the parent blade may be making some of these decisions for you!)
     * NOTE: If a selection already exists this will NOT override it currently, this is a LOADING
     * ONLY mechanism right now... future behavior could include complete ownership of selection
     * @param selectedWorkspace The workspace we want to be 'selected'
     * @param force [optional] force selection to occur even if selection is already set
     */
    public setSelectedWorkspace(selectedWorkspace: any, force?: boolean): boolean {
        if (this.selectedWorkspace && !force) {
            return false;
        }

        if (selectedWorkspace) {
            let candidateSelection = this.findById(selectedWorkspace.id);
            if (!candidateSelection) {
                candidateSelection = this.getFirstWorkspace();
                console.warn('selected workspace wasnt valid, restoring first');
            }

            this.selectedWorkspace = candidateSelection;
            return true;
        } else {
            this.selectedWorkspace = this.getFirstWorkspace();
            return this.selectedWorkspace != null;
        }
    }

    /**
     * Returns the current list of workspaces.  this list should be sorted, but the action of sorting
     * is handled during creation of the list (not while calling this function)
     */
    public getOrderedList(): IWorkspaceInfo[] {
        return this.sortedList;
    }

    /**
     * Get the current selectedWorkspace (used by the caching mechanism)
     */
    public getSelectedWorkspace(): IWorkspaceInfo {
        return this.selectedWorkspace;
    }

    /**
     * If one exists returns the IWorkspaceInfo object for a given friendly workspace name
     * Note: Uses a hash table, this operation is constant time
     * @param workspaceId workspace id we want a workspace object of
     */
    public findById(workspaceId: string): IWorkspaceInfo {
        return (workspaceId) ? this.workspaceIdHash[workspaceId.toLowerCase()] : undefined;
    }

    /**
     * check if current selected workspace in the workspace list
     * overwrite the selected workspace if not present in workspace list
     */
    public autoCorrectCurrentWorkspace() {
        if (!this.fullyLoaded) {
            return;
        }
        if (this.selectedWorkspace && this.findById(this.selectedWorkspace.id)) {
            return;
        }
        console.warn('Auto correction, selected workspace wasnt valid, restoring first');

        this.selectedWorkspace = this.getFirstWorkspace();
    }

    /**
     * Returns false if workspace is in the hash
     * Otherwise return true...
     * The idea here is we want to add workspaces to our list if they aren't already
     * in the list (ie. if the hash doens't contain it)
     * @param workspace workspace you want to operate on
     */
    private workspaceNotAlreadyInHash(workspace: any): boolean {
        if (workspace && workspace.id && workspace.id.toLowerCase() in this.workspaceIdHash) {
            return false;
        }

        return true;
    }

    /**
     * Simple sort for the workspace names
     * @param a Left hand side workspace
     * @param b Right hand side workspace
     */
    private sortFunction(a: IWorkspaceInfo, b: IWorkspaceInfo) {
        const aName = a?.name?.toLowerCase();
        const bName = b?.name?.toLowerCase();

        if (aName < bName) { return -1; }
        if (aName > bName) { return 1; }

        return 0;
    }

    /**
     * Return the first workspace based on the sorted workspace list.  this is used by
     * initial workspace selection if no better options are available
     */
    private getFirstWorkspace(): IWorkspaceInfo {
        if (this.sortedList && (this.sortedList.length > 0)) {
            return this.sortedList[0];
        }

        return null;
    }
}
