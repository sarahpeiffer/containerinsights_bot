/** shared */
import { ITimeInterval } from '../../../shared/data-provider/TimeInterval';
import { AggregationOption } from '../../../shared/AggregationOption';

/**
 * Container grid state properties
 */
export interface IContainerGridState {
    /** visualized time interval */
    timeInterval: ITimeInterval;

    /** metric displayed in the grid */
    displayedMetricName: string;

    /** aggregation option displayed in the grid */
    displayedAggregationOption: AggregationOption;

    /** true if grid can load more data */
    canLoadMore: boolean;

    /** true if grid is in loading state */
    isLoading: boolean;

    /** true if last load operaiton failed */
    isError: boolean;

    /** grid data rows */
    gridData: any[];
}

