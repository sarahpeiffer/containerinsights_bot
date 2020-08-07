/** Maintain consistency with azure-wlm\src\UI\WorkloadMonitoringUI\Client\ForExport\ChartPartParams.d.ts */

declare namespace BladeParameters {
    export interface ChartPartParams {
        // Tell chart part which query to use, and parameter need.
        queryParams: ChartPartQueryParams;
        // Indicate who create this chart part. Used for log and navigate back
        bladeName: string;
        // Used to navigate back
        extensionName: string;
        // Used to navigate back
        bladeParams: any;
        // default option picks.
        defaultOptionPicks: ISeriesSelectorOption[];
        // indicate if chart show option picker.
        showOptionPicker: boolean;
    }

    export interface ChartPartQueryParams {
        timeRange: TimeData;
        metricQueryId: string;
        chartPartQueryParamsType: ChartPartQueryParamsType;
    }

    export interface VmssPerfQueryParams extends ChartPartQueryParams {
        workspaceInfo: IWorkspaceInfo;
        computerGroup: SerializedComputerGroup;
        resourceId?: string;
    }

    export interface AtScalePerfQueryParams extends VmssPerfQueryParams {
        subscriptionName: string;
        resourceGroupName?: string;
    }

    export interface SingleVmQueryParams extends ChartPartQueryParams {
        computerName: string;
        workspaceId: string;
        resourceId?: string;
    }

    export const enum ChartPartQueryParamsType {
        AtScalePerfQueryParams = 0,
        SingleVmQueryParams = 1,
        VmssPerfQueryParams = 2
    }

    export interface SerializedComputerGroup {
        id: string;
        groupType: any;
        serviceMapGroupType: any;
        displayName: string;
        functionName: string;
    }

    /**
     * Defines properties of single chart series selection option
     */
    export interface ISeriesSelectorOption {
        /** option id */
        id: string;

        /** option display name */
        displayName: string;

        /** true if options is currently selected */
        isSelected: boolean;
    }
}
