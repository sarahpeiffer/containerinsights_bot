/** tpl */
import * as React from 'react';

/** local */
import { MulticlusterMonitoredGrid } from './MulticlusterMonitoredGrid';
import { MulticlusterGridPaneBase } from '../MulticlusterGridPaneBase';
import { GridSortOrder } from '../MulticlusterGridBase';

/** shared */
import { TelemetrySubArea } from '../../../shared/Telemetry';

/** Monitored Grid Pane component */
export class MulticlusterMonitoredGridPane extends MulticlusterGridPaneBase {
    /**
     * initializes a new instance of the component
     * @param props component properties
     */
    constructor(props) {
        super(props, TelemetrySubArea.MulticlusterMonitoredList);

        this.state = {
            sortColumnIndex: 3, //default sort on status
            sortDirection: GridSortOrder.Asc,
            nameSearchFilterValue: '',
        };
    }

    /** Renders Multicluster Monitored grid */
    public renderGrid(): JSX.Element {
        return (
            <MulticlusterMonitoredGrid
                sortColumnIndex={this.state.sortColumnIndex}
                sortOrder={this.state.sortDirection}
                nameSearchFilterValue={this.state.nameSearchFilterValue}
                onSortOrderChanged={this.sortOrderChanged}
                messagingProvider={this.props.messagingProvider}
                gridData={this.props.gridData}
                isError={this.props.isError}
                isLoading={this.props.isLoading}
                selectedGlobalSubscriptionCount={this.props.selectedGlobalSubscriptionCount}
            />
        );
    }
}
