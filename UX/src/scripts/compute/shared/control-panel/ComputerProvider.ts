import { IWorkspaceInfo } from '../../../shared/IWorkspaceInfo';

import { Promise } from 'es6-promise'

/**
 * A computer record
 *
 * TODO ak: change to class
 *
 * @export
 * @interface IComputerInfo
 */
export interface IComputerInfo {
    /**
     * Computer FQDN (matches Computer field in LA)
     */
    computerName: string,
    /**
     * Computer display name
     */
    displayName: string,
    /**
     * ServiceMap computer resource id
     */
    id: string,

    /**
     * ARM Id of the computer
     */
    azureResourceId?: string;
}

/**
 * A list of computers.
 */
export interface IComputerList {
    /**
     * The search filter for this list (can be empty)
     */
    searchFilter: string
    /**
     * The list of computers
     */
    computers: IComputerInfo[]
    /**
     * Indicates if there are more records on the server side.
     */
    hasMore: boolean
}

/**
 * Provider for computer records
 */
export interface IComputerProvider {
    /**
     * Retrieves a list of computers sorted by display name. If a search filter
     * is specified the returned computers' display name will match the filter.
     * The list will have up to macRecords entries.
     * @param workspace Workspace for which to retrieve the list
     * @param maxRecords Max number of records to retrieve
     * @param searchFilter Search filter to apply (can be undefined) 
     * @param startDateTimeUtc Time interval start time
     * @param endDateTimeUtc Time interval end time
     * @param telemetryEventPrefix Prefix for telemetry events
     */
    getSortedComputerList(
        workspace: IWorkspaceInfo,
        maxRecords: number,
        searchFilter: string,
        startDateTimeUtc: Date,
        endDateTimeUtc: Date,
        telemetryEventPrefix: string,
        resourceId?: string): Promise<IComputerList>;
}
