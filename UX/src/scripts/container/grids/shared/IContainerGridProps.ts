/** local */
import { GridSortOrder } from './ContainerGridBase';
import { ICommonContainerTabProps } from '../../shared/ICommonContainerTabProps';

/** shared */
import { AggregationOption } from '../../../shared/AggregationOption';
import { MessagingProvider } from '../../../shared/MessagingProvider';
import { SGDataRow } from 'appinsights-iframe-shared';
import { RequiredLoggingInfo } from '../../../shared/RequiredLoggingInfo';
import { SingleClusterTab } from '../../ContainerMainPage';
import { LiveDataProvider } from '../../../shared/data-provider/LiveDataProvider';

/**
 * Container grid properties
 */
export interface IContainerGridProps extends ICommonContainerTabProps {
    /** grid metric name */
    metricName: string;

    /** sort column index */
    sortColumnIndex: number;

    // maxRows: boolean;

    /** sort order (asc/desc) */
    sortOrder: GridSortOrder;

    /** host blade messaging provider */
    messagingProvider: MessagingProvider;

    /** name search filter */
    nameSearchFilterValue: string;

    /** true if live log feature is available */
    showLiveLogs: boolean;

    /** grid metric aggregation option */
    aggregationOption: AggregationOption;

    /** callback invoked when grid sort order changed */
    onSortOrderChanged: (sortColumnIndex: number, sortDirection: GridSortOrder) => void;

    /** callback invoked when live console is opened */
    onConsoleOpen: (information: RequiredLoggingInfo) => void;

    maxRowsCurrent: boolean;
    maxRowsOnLoad: boolean;

    onMaxRowsChanged: (maxRows: boolean, initial: boolean) => void;

    /** Setup details for the live logging console */
    loggingInfo: RequiredLoggingInfo;

    /** Invoked by live logging console when it closes */
    onConsoleClose: () => void;

    /** Current open state of the live logging console */
    isConsoleOpen: boolean;

    /** callback invoked when a grid row is selected */
    onGridRowSelected: (row: SGDataRow) => void;

    /** callback invoked when a tab selection is changed */
    onTabSelectionChanged: (index: SingleClusterTab, tabInitializationInfo?: any) => boolean | void;

    /** boolean deciding to apply exact match when filtering from the search box */
    shouldApplyExactNameSearchFilterMatch?: boolean;
    /** callback to invoke when tab content loading status changes */
    onTabContentLoadingStatusChange: (isLoading: boolean) => void;

    /** callback to invoke when the tab content data load results in an error */
    onTabContentDataLoadError: (error: any) => void;

    /** region override for Kube API Proxy */
    liveDataProvider: LiveDataProvider;
}
