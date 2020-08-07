/** tpl */
import * as React from 'react';

/** local */
import { MulticlusterUnmonitoredGrid } from './MulticlusterUnmonitoredGrid';
import { MulticlusterGridPaneBase } from '../MulticlusterGridPaneBase';
import { GridSortOrder } from '../MulticlusterGridBase';

/** shared */
import { TelemetrySubArea } from '../../../shared/Telemetry';


/**
 * Non-monitored grid pane component
 */
export class MulticlusterUnmonitoredGridPane extends MulticlusterGridPaneBase {
    /**
     * initializes a new instance of the component
     * @param props component properties
     */
    constructor(props) {
        super(props, TelemetrySubArea.MulticlusterUnmonitoredList);

        this.state = {
            sortColumnIndex: 0, //default sort on cluster since this is only column supported sorting
            sortDirection: GridSortOrder.Asc,
            nameSearchFilterValue: '',
        };
    }


    /**
     * Renders non-monitored grid
     */
    public renderGrid(): JSX.Element {
        return (
            <MulticlusterUnmonitoredGrid
                sortColumnIndex={this.state.sortColumnIndex}
                sortOrder={this.state.sortDirection}
                nameSearchFilterValue={this.state.nameSearchFilterValue}
                onSortOrderChanged={this.sortOrderChanged}
                messagingProvider={this.props.messagingProvider}
                gridData={this.props.gridData}
                isLoading={this.props.isLoading}
                isError={this.props.isError}
                selectedGlobalSubscriptionCount={this.props.selectedGlobalSubscriptionCount}
            />
        );
    }
}
