/**
 * tpl
 */
import * as React from 'react';

/**
 * local
 */
import { ContainerGridControlPanel } from './ContainerGridControlPanel'
import { GridSortOrder } from './ContainerGridBase';

/**
 * shared
 */
import { ContainerHostMetrics } from '../../shared/ContainerHostMetrics';
import { TelemetrySubArea, TelemetryMainArea, ITelemetry } from '../../../shared/Telemetry';
import { TelemetryFactory } from '../../../shared/TelemetryFactory';
import { ICommonContainerTabProps } from '../../shared/ICommonContainerTabProps';
import { MessagingProvider } from '../../../shared/MessagingProvider';
import { RequiredLoggingInfo } from '../../../shared/RequiredLoggingInfo';
import { AggregationOption } from '../../../shared/AggregationOption';
import { SGDataRow } from 'appinsights-iframe-shared';
import { ErrorSeverity } from '../../../shared/data-provider/TelemetryErrorSeverity';
import { SingleClusterTab, IPropertyPanelNavigationProps } from '../../ContainerMainPage';
import { DetailsPane } from '../../../shared/property-panel/DetailsPane';
import { IDetailsPanel } from '../../../shared/property-panel/IDetailsPanel';
import { PropertyPanelSelector } from '../../../shared/property-panel/PropertyPanelSelector';
import { SGDataRowExt } from './SgDataRowExt';
import { IPropertyPanelInterpretedResponse } from '../../data-provider/KustoPropertyPanelResponseInterpreter';
import { LiveDataProvider } from '../../../shared/data-provider/LiveDataProvider';
// import FunctionGates from '../../../shared/Utilities/FunctionGates';

/**
 * Container grid component properties
 */
export interface IContainerGridPaneProps extends ICommonContainerTabProps {
    /** invoked when the search term is changed */
    onNameSearchFilterChanged: (nameSearchFilterValue: string) => void
    /** invoked when command to open live logging console is executed */
    onConsoleOpen: (information: RequiredLoggingInfo) => void;

    /** invoked when aggregation option is changed */
    onToggleAggregationOption: (selectorId: string, option: AggregationOption) => void;

    /** invoked when grid metric selection is changed */
    onMetricSelectionChanged: (metricName: string) => void;

    /** selected metric name */
    metricName: string;

    /** selected metric aggregation option */
    aggregationOption: AggregationOption;

    /** host blade messaging provider */
    messagingProvider: MessagingProvider;

    /** true if live logs feature is enabled */
    showLiveLogs: boolean;

    /** the information needed for the live console */
    loggingInfo: RequiredLoggingInfo;

    /** callback that is executed when console is closed */
    onConsoleClose: () => void;

    /** boolean representing whether the console is currently open */
    isConsoleOpen: boolean;

    /** invoked when a grid row is selected */
    onGridRowSelected: (row: SGDataRow) => void;

    /** invoked when tab selection is being changed */
    onTabSelectionChanged?: (index: SingleClusterTab, tabInitializationInfo?: any) => boolean | void;

    /** value of the name search filter */
    nameSearchFilterValue?: string;

    featureFlags: StringMap<any>;

    /** boolean deciding to apply exact match when filtering from the search box */
    shouldApplyExactNameSearchFilterMatch?: boolean;
    /** callback to invoke when the tab content loading status changes */
    onTabContentLoadingStatusChange: (isLoading: boolean) => void;

    /** callback to invoke when the tab content data load results in an error */
    onTabContentDataLoadError: (error: any) => void;

    /** region override for Kube API Proxy */
    liveDataProvider: LiveDataProvider;

    selectedTab: SingleClusterTab;

    selectedRow: SGDataRowExt;

    propertyPanelInterpretedResponse: IPropertyPanelInterpretedResponse;

    isShowLiveLog: () => boolean;

    propertyPanelCollapsed: boolean;
    propertyPanelLoading: boolean;

    onTogglePanelCollapse: (isUserAction: boolean) => void;
    sortColumn: number;
    sortOrder: GridSortOrder;
    onSortOrderChanged: (sortClumn: number, sortOrder: GridSortOrder) => void
}

/**
 * Container grid pane state properties
 */
export interface IContainerGridPaneState {
    maxRowsCurrent: boolean;
    maxRowsOnLoad: boolean;

    /** boolean which decides if the name search filter needs animation */
    animateSearchFilter?: boolean;
}

/**
 * Base class for container grids
 */
export abstract class ContainerGridPaneBase extends React.PureComponent<IContainerGridPaneProps, IContainerGridPaneState> {
    /** Telemetry engine */
    private telemetry: ITelemetry;

    /** Type of container grid this is */
    private telemetrySubArea: string;

    /**
     * Instantiates an instance of the class
     * @param props component properties
     * @param telemetrySubArea telemetry subarea for telemetry logging
     */
    constructor(props: IContainerGridPaneProps, telemetrySubArea: TelemetrySubArea) {
        super(props);

        this.telemetrySubArea = telemetrySubArea.toString();

        this.state = {
            maxRowsCurrent: false,
            maxRowsOnLoad: false,
            animateSearchFilter: this.props.shouldApplyExactNameSearchFilterMatch,
        };

        this.onMetricSelectionChanged = this.onMetricSelectionChanged.bind(this);
        this.onMaxRowsChanged = this.onMaxRowsChanged.bind(this);
        this.sortOrderChanged = this.sortOrderChanged.bind(this);

        this.telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
        this.telemetry.setContext({ subArea: this.telemetrySubArea }, false);
        this.telemetry.logPageView(this.telemetrySubArea.toString());
    }

    /**
     * Renders component
     */
    public render(): JSX.Element {
        try {
            const isHealthTabVisible: boolean =
                this.props.featureFlags &&
                this.props.featureFlags.healthModel &&
                this.props.featureFlags.healthModel.toLocaleLowerCase() === 'true';

            let isPropertyPanelVisible = true;

            // property panel is not on cluster tab and not on health tab
            if ((this.props.selectedTab === SingleClusterTab.ContainerCluster) ||
                (isHealthTabVisible && (this.props.selectedTab === SingleClusterTab.Health))) {
                isPropertyPanelVisible = false;
            }

            if (this.props.selectedTab === SingleClusterTab.Deployments) {
                isPropertyPanelVisible = false;
            }

            return (
                <div className='grid-pane'>
                    <div className='grid-sub-pane-cew'>
                        <ContainerGridControlPanel
                            onMetricSelectionChanged={this.onMetricSelectionChanged}
                            selectedMetricName={this.props.metricName}
                            nameSearchFilterValue={this.props.nameSearchFilterValue}
                            onNameSearchFilterChanged={this.props.onNameSearchFilterChanged}
                            animateSearchFilter={this.state.animateSearchFilter}
                            selectedAggregationOption={this.props.aggregationOption}
                            onToggleAggregationOption={this.props.onToggleAggregationOption}
                        />
                        {this.renderGrid()}
                    </div>
                    <DetailsPane
                        isVisible={isPropertyPanelVisible}
                        isCollapsed={this.props.propertyPanelCollapsed}
                        isLoading={this.props.propertyPanelLoading}
                        contents={this.propertyPanelContent()}
                        onTogglePanelCollapse={this.props.onTogglePanelCollapse}
                    />
                </div>
            );
        } catch (exc) {
            this.telemetry.logException(exc, `ContainerGridPaneBase.${this.telemetrySubArea}`, ErrorSeverity.Error, null, null);
            return <div className='grid-pane'></div>;
        }
    }

    /**
     * When overridden in derived class renders grid visual component
     */
    abstract renderGrid(): JSX.Element;

    /**
     * Invoked when grid sort order changed
     * @param sortColumnIndex sort column index
     * @param sortDirection sort direction
     */
    protected sortOrderChanged(sortColumnIndex: number, sortDirection: GridSortOrder) {
        this.props.onSortOrderChanged(sortColumnIndex, sortDirection);
    }

    protected onMaxRowsChanged(maxRowsCurrent: boolean, initialLoad: boolean) {
        this.setState({maxRowsCurrent});

        if (initialLoad) {
            this.setState({maxRowsOnLoad: maxRowsCurrent});
        }
    }

    /**
      * Render the overview panel if the selection context allows us to; if nothing is selected or
      * no maps data is available, we show No Data message (and if nothing is selected we also
      * display a helpful hint at how to make data appear)
      * @returns {IDetailsPanel[]}
      */
    private propertyPanelContent(): IDetailsPanel[] {
        const propertyPanelContent: IDetailsPanel[] = [];
        // Used to pass along important state information when navigating away from CI
        const navigationProps: IPropertyPanelNavigationProps = { 
            startDateTimeUtc: this.props.startDateTimeUtc,
            endDateTimeUtc: this.props.endDateTimeUtc,
            workspaceId: this.props.workspace ? this.props.workspace.id : undefined,
            clusterResourceId: this.props.clusterResourceId ? this.props.clusterResourceId : '',
            clusterName: this.props.clusterName,
            hostName: this.props.hostName,
            messagingProvider: this.props.messagingProvider
        }
        const showLiveLogs = this.props.isShowLiveLog();

        let selectedRow = null;
        if (this.props.selectedRow && this.props.selectedRow.columnData) {
            selectedRow = this.props.selectedRow.columnData[0];
        }

        let body: JSX.Element = PropertyPanelSelector.getPropertyPanelforSelection(
            this.props.propertyPanelInterpretedResponse,
            navigationProps,
            this.props.messagingProvider,
            showLiveLogs,
            selectedRow,
            this.props.selectedTab,
            this.telemetry,
            this.props.onConsoleOpen
        );

        propertyPanelContent.push({ tabName: '', body });

        return propertyPanelContent;
    }

    /**
     * Invoked when grid metric selection changed
     * @param metricName metric name
     */
    private onMetricSelectionChanged(metricName: string) {
        // report metric change to parent
        this.props.onMetricSelectionChanged(metricName);

        // change to default sorting on grid
        const defaultSortColumn =  2;
        const defaultSortOrder = ContainerHostMetrics.get(metricName).descriptor.isHigherValueBetter
            ? GridSortOrder.Asc
            : GridSortOrder.Desc;
        this.props.onSortOrderChanged(defaultSortColumn, defaultSortOrder);
    }
}
