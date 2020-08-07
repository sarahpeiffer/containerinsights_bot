/** local */
import { GridSortOrder } from './MulticlusterGridBase';

/** shared */
import { MessagingProvider } from '../../shared/MessagingProvider';

/**
 * Multicluster grid properties
 */
export interface IMulticlusterGridProps {
    /** sort column index */
    sortColumnIndex: number;

    /** sort order (asc/desc) */
    sortOrder: GridSortOrder;

    /** name search filter */
    nameSearchFilterValue: string;

    /** callback invoked when grid sort order changed */
    onSortOrderChanged: (sortColumnIndex: number, sortDirection: GridSortOrder) => void;

    /** host blade messaging provider */
    messagingProvider: MessagingProvider;

    /** list of managed clusters */
    gridData: any[];

    /** to track loading state */
    isLoading: boolean;

    /** to track error state */
    isError: boolean;

    /** the number of subscriptions selected */
    selectedGlobalSubscriptionCount: number;
}
