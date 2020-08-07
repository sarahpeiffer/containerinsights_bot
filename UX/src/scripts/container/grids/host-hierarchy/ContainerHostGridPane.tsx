/** tpl */
import * as React from 'react';

/** local */
import { ContainerHostHierarchyGrid } from './ContainerHostHierarchyGrid';

/** shared */
import { TelemetrySubArea } from '../../../shared/Telemetry';
import { ContainerGridPaneBase } from '../shared/ContainerGridPaneBase';

/**
 * Container host grid pane component
 */
export class ContainerHostGridPane extends ContainerGridPaneBase {
    /**
     * initializes a new instance of the component
     * @param props component properties
     */
    constructor(props) {
        super(props, TelemetrySubArea.ContainerNodeList);
    }

    /**
     * Renders container host grid
     */
    public renderGrid(): JSX.Element {
        return (
            <ContainerHostHierarchyGrid
                startDateTimeUtc={this.props.startDateTimeUtc}
                endDateTimeUtc={this.props.endDateTimeUtc}
                workspace={this.props.workspace}
                clusterName={this.props.clusterName}
                clusterResourceId={this.props.clusterResourceId}
                nameSpace={this.props.nameSpace}
                serviceName={this.props.serviceName}
                hostName={this.props.hostName}
                nodePool={this.props.nodePool}
                metricName={this.props.metricName}
                controllerName={this.props.controllerName}
                controllerKind={this.props.controllerKind}
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
                loggingInfo={this.props.loggingInfo}
                onConsoleClose={this.props.onConsoleClose}
                isConsoleOpen={this.props.isConsoleOpen}
                aggregationOption={this.props.aggregationOption}
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
