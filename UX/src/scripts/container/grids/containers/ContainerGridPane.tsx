/** 3rd party */
import * as React from 'react';

/** local */
import { ContainerComparisonGrid } from './ContainerComparisonGrid';

/** shared */
import { ContainerGridPaneBase } from '../shared/ContainerGridPaneBase';
import { TelemetrySubArea } from '../../../shared/Telemetry';


/**
 * Container host grid pane component
 */
export class ContainerComparisonGridPane extends ContainerGridPaneBase {
    /**
     * initializes a new instance of the component
     * @param props component properties
     */
    constructor(props) {
        super(props, TelemetrySubArea.ContainerList);
    }

    /**
     * Renders container host grid
     */
    public renderGrid(): JSX.Element {
        return (
            <ContainerComparisonGrid
                startDateTimeUtc={this.props.startDateTimeUtc}
                endDateTimeUtc={this.props.endDateTimeUtc}
                workspace={this.props.workspace}
                clusterName={this.props.clusterName}
                clusterResourceId={this.props.clusterResourceId}
                nameSpace={this.props.nameSpace}
                serviceName={this.props.serviceName}
                controllerName={this.props.controllerName}
                controllerKind={this.props.controllerKind}
                hostName={this.props.hostName}
                nodePool={this.props.nodePool}
                metricName={this.props.metricName}
                sortColumnIndex={this.props.sortColumn}
                sortOrder={this.props.sortOrder}
                maxRowsCurrent={this.state.maxRowsCurrent}
                maxRowsOnLoad={this.state.maxRowsOnLoad}
                onMaxRowsChanged={this.onMaxRowsChanged}
                nameSearchFilterValue={this.props.nameSearchFilterValue}
                onSortOrderChanged={this.sortOrderChanged}
                messagingProvider={this.props.messagingProvider}
                onConsoleOpen={this.props.onConsoleOpen}
                showLiveLogs={this.props.showLiveLogs}
                aggregationOption={this.props.aggregationOption}
                loggingInfo={this.props.loggingInfo}
                onConsoleClose={this.props.onConsoleClose}
                isConsoleOpen={this.props.isConsoleOpen}
                onGridRowSelected={this.props.onGridRowSelected}
                isTimeRelative={this.props.isTimeRelative}
                onTabSelectionChanged={this.props.onTabSelectionChanged}
                shouldApplyExactNameSearchFilterMatch={this.props.shouldApplyExactNameSearchFilterMatch}
                onTabContentLoadingStatusChange={this.props.onTabContentLoadingStatusChange}
                onTabContentDataLoadError={this.props.onTabContentDataLoadError}
                liveDataProvider={this.props.liveDataProvider}
            />
        );
    }
}
