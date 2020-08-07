import { GridSortOrder } from './grids/shared/ContainerGridBase';

export interface INavigationProps {
    pillSelections: IPillSelections;
    searchTerm: string;
    sortOrder: GridSortOrder;
    sortColumn: number;
    seeLiveMetrics: boolean;
    selectedTab: number;
}


/**
 * Describes the contract for sending pill selections in navigation.
 *
 * NB:
 * 1. No one pill selection has to be sent so they are all optional parameters
 * 2. When attempting to pass a time range to pills, you must pass startDateTimeUtc, endDateTimeUtc, and isTimeRelative
 */
export interface IPillSelections {
    nameSpace?: string;
    serviceName?: string;
    hostName?: string;
    nodePool?: string;
    startDateTimeISOString?: string;
    endDateTimeISOString?: string;
    isTimeRelative?: boolean;
    controllerName?: string;
    controllerKind?: string;
}
