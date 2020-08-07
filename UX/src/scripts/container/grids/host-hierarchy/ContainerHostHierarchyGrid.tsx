/**
 * tpl
 */
import * as React from 'react';
import { Promise } from 'es6-promise';
import * as update from 'immutability-helper';
import { SGSortOrder, SGColumn, SGFormattedPlainCell, SGIconCell } from 'appinsights-iframe-shared';
import { GUID } from '@appinsights/aichartcore';

/**
 * local
 */
import { SGDataRowExt } from '../shared/SgDataRowExt';
import { ResourceType, GridDataProvider, SortColumn } from '../../data-provider/GridDataProvider';
import { KustoGridResponseInterpreter } from '../../data-provider/KustoGridResponseInterpreter';
import { ContainerGridBase, GridSortOrder } from '../shared/ContainerGridBase';
import { ContainerHostMetrics } from '../../shared/ContainerHostMetrics';
import { ContainerHostMetricName } from '../../shared/ContainerMetricsStrings';
import * as Constants from '../../shared/Constants';
import { SGTrendChartCell } from '../shared/SGTrendChartCell';
import { BladeLoadManager, PerformanceMeasure, QueryName } from '../../messaging/BladeLoadManager';
import { LoadTrackingTerminationReason } from '../../messaging/IBladeLoadManager';

/**
 * shared
 */
import { DisplayStrings, KustoGrainDisplay } from '../../../shared/DisplayStrings';
import { Grid } from '../../../shared/Grid';
import { TimeInterval } from '../../../shared/data-provider/TimeInterval';
import { IGridLineObject } from '../../../shared/GridLineObject'
import { StringHelpers } from '../../../shared/Utilities/StringHelpers';
import { SGFormattedColoredCellContainers, SGTabChangeLinkCell } from '../../../shared/ColoredChartCell';
import { FixedMaxValueMetricDescriptor } from '../../../shared/MetricDescriptor';
import { MetricValueFormatter } from '../../../shared/MetricValueFormatter';
import { ITelemetry, TelemetryMainArea, IFinishableTelemetry } from '../../../shared/Telemetry';
import { TelemetryFactory } from '../../../shared/TelemetryFactory';
import { ErrorSeverity } from '../../../shared/data-provider/TelemetryErrorSeverity';
import { AggregationOption } from '../../../shared/AggregationOption';
import { SystemRowMetaData } from '../../shared/metadata/SystemRowMetaData';
import { RowType, IMetaDataBase } from '../../shared/metadata/Shared';
import { NodeMetaData, NodeGriKustoQueryColumnIndicesMap } from '../../shared/metadata/NodeMetaData';
import { IContainerGridProps } from '../shared/IContainerGridProps';
import { IContainerGridState } from '../shared/IContainerGridState';
import { HttpRequestError } from '../../../shared/data-provider/HttpRequestError';

/** styles */
import '../../../../styles/container/GridPaneContainer.less';

/** svg */
import { ContainerSVG } from '../../../shared/svg/container';
import { PodSVG } from '../../../shared/svg/pod';
import { VmSvg } from '../../../shared/svg/vm';
import { VmGreySvg } from '../../../shared/svg/vmGrey';
import { VirtualKubeSvg } from '../../../shared/svg/virtualKube';
import { VirtualContainerSvg } from '../../../shared/svg/virtualContainer';
import { VirtualPodSvg } from '../../../shared/svg/virtualPod';
import { SingleClusterTab } from '../../ContainerMainPage';
import { BlueLoadingDots, BlueLoadingDotsSize } from '../../../shared/blue-loading-dots';
import { EnvironmentConfig } from '../../../shared/EnvironmentConfig';
import { OperatingSystem } from '../shared/property-panel/NodePropertyPanel';
import { WindowsVMSVG } from '../../../shared/svg/windows-vm';
import { LinuxVMSVG } from '../../../shared/svg/linux-vm';
import { SortHelper } from '../../../shared/SortHelper';
import { NodeQueryTemplateConstants } from '../../data-provider/QueryTemplates/NodeQueryTemplate';
import FunctionGates from '../../../shared/Utilities/FunctionGates';
import { PodMetaDataLegacy } from '../../shared/metadata/PodMetaDataLegacy';
import { ContainerMetaDataLegacy } from '../../shared/metadata/ContainerMetaDataLegacy';
import { ContainerQueryConstants } from '../../data-provider/QueryTemplates/ContainerQueryTemplate';

/** constants */
// TODO: load N children and root items!
const DEFAULT_MAX_RESULT_COUNT: number = 10000;
const DEFAULT_PROP_COL_HEADER_WIDTH: number = 75;

interface IContainerHostHierarchyGridState extends IContainerGridState {
    gridIndexHash: StringMap<SGDataRowExt>;
}

enum HostHierarchyGridColumnDataMap {
    Name,
    Status,
    AggregationPercent,
    Aggregation,
    Containers,
    Uptime,
    Controller,
    Trend
}

export class ContainerHostHierarchyGrid extends React.Component<IContainerGridProps, IContainerHostHierarchyGridState> {
    private dataProvider: GridDataProvider;
    private telemetry: ITelemetry;
    private responseInterpreter: KustoGridResponseInterpreter;
    private pendingQuerySequenceNumber: number;
    private throttledQuery: (queryProps: IContainerGridProps, initialLoad: boolean, maxResultCount?: number) => void;

    constructor(props: IContainerGridProps) {
        super(props);

        this.pendingQuerySequenceNumber = 0; // Enables the UX to only respond to the user's latest asynchronous activity

        this.dataProvider = ContainerGridBase.createDataProvider();
        this.responseInterpreter = new KustoGridResponseInterpreter(this.telemetry);

        const timeInterval = new TimeInterval(this.props.startDateTimeUtc, this.props.endDateTimeUtc, Constants.IdealGridTrendDataPoints);

        this.state = {
            timeInterval: timeInterval,
            displayedMetricName: props.metricName || ContainerHostMetricName.CpuCoreUtilization,
            displayedAggregationOption: props.aggregationOption || AggregationOption.P95,

            canLoadMore: false,
            isLoading: true,
            isError: false,
            gridData: [],
            gridIndexHash: {},
        };

        // Function bindings
        this.onExpandLoadChildren = this.onExpandLoadChildren.bind(this);
        this.onSortColumnChanged = this.onSortColumnChanged.bind(this);
        this.onSortOrderChanged = this.onSortOrderChanged.bind(this);

        this.throttledQuery = FunctionGates.CreateDebouncedFunction(this.queryGridData, 500);
    }

    /**
     * Translates the grid sort column index into the corresponding column index for the grid query
     * @param gridSortColumnIndex the column index that the grid is being sorted on
     */
    private static getGridQuerySortColumn(gridSortColumnIndex: number): SortColumn {
        let sortColumn: SortColumn;

        switch (gridSortColumnIndex) {
            case 0: //ContainerName
                sortColumn = SortColumn.ContainerName;
                break;
            case 1: // status
                sortColumn = SortColumn.Status;
                break;
            case 2: // Aggregation% or Aggregation
            case 3:
                sortColumn = SortColumn.Aggregation;
                break;
            case 4: // Containers
                sortColumn = SortColumn.Containers;
                break;
            case 5: // UpTime
                sortColumn = SortColumn.UpTime;
                break;
            default:
                throw new Error('Invalid sort column index of ' + gridSortColumnIndex);
        }

        return sortColumn;
    }

    /**
     * Formats the interpreted Kusto response into something Selectable Grid can understand
     * Gives each row a child row that acts as a loading indicator for the child query that is 
     * executed when the row is expanded for the first time.
     * N.B. When the grid is first loaded, in order for all of the nodes to be collapsed, the traverse method had
     * to be overloaded. This was done by extending the SGDataRow Class with SGDataRowExt.
     * @param queryResult 
     * @return an array of SGDataRows used in rendering selectable grid
     */
    private static toGridData(queryResult: IGridLineObject<NodeMetaData>[][], rawResult: any): Array<SGDataRowExt> {
        const rows = new Array<SGDataRowExt>();

        let maxRows = NodeQueryTemplateConstants.MaxNodeRows;
        if (ContainerHostHierarchyGrid.resultHasUnscheduled(rawResult)) {
            maxRows += 1;
        }

        if (queryResult && queryResult.length >= (maxRows)) {
            rows.push(this.dataOverflowRow(`.dataOverflowRow`, maxRows));
        }

        if (queryResult && (queryResult.length > 0)) {
            for (let i = 0; i < queryResult.length; i++) {
                const nodeKey = `${i}`;
                const row = new SGDataRowExt(queryResult[i], nodeKey);
                ContainerHostHierarchyGrid.insertChildLoadingRow(row, nodeKey);
                rows.push(row);
            }
        }

        return rows;
    }

    private static resultHasUnscheduled(result: any): boolean {
        const resultRows = KustoGridResponseInterpreter.getValidBaseResponse(result);
        if (!resultRows) {
            return false;
        }

        for (let i = 0; i < resultRows.length; i++) {
            // each row is an array of values for columns
            const resultRow = resultRows[i];

            if (resultRow[NodeGriKustoQueryColumnIndicesMap.NodeName] === 'unscheduled') {
                return true;
            }
        }
        return false;
    }

    private static dataOverflowRow(overflowKey: string, maxRows: number): SGDataRowExt {
        const systemRowMeta = new SystemRowMetaData();

        const blankLoadFailureRow = [
            SystemRowMetaData.metaWrapperHelper(
                // tslint:disable:max-line-length
                <div className='sg-row-data-overflow' onClick={(evt) => {
                    evt.stopPropagation();
                }}>
                    The query returned {maxRows} or more rows of data.  Please filter the data above to see all rows.
                </div>, systemRowMeta
                // tslint:enable:max-line-length
            ),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
        ];

        const rowLoading = new SGDataRowExt(blankLoadFailureRow, overflowKey);
        rowLoading.children = null;

        return rowLoading;
    }

    /**
     * TODO: this does NOT comply with the new gridlineobject always format
     * @param row 
     * @param nodeKey 
     */
    private static insertChildLoadingRow(row: SGDataRowExt, nodeKey: string): void {
        const loadingKeyForNode = `${nodeKey}.loading`;

        const systemRowMeta = new SystemRowMetaData();

        const blankLoadFailureRow = [
            SystemRowMetaData.metaWrapperHelper(
                <div className='sg-row-loading-icon-container center-flex-content'>
                    <BlueLoadingDots size={BlueLoadingDotsSize.small} />
                </div>, systemRowMeta
            ),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
        ];

        const rowLoading = new SGDataRowExt(blankLoadFailureRow, loadingKeyForNode);
        row.children = [];
        row.children.push(rowLoading);
        row.expanded = false;
    }

    /**
     * Creates a hash map, mapping a row's index to the row itself 
     * @param gridData an array of SGDataRows used in rendering selectable grid
     */
    private static hashGridDataIndices(gridData: Array<SGDataRowExt>): StringMap<SGDataRowExt> {
        let hash: StringMap<SGDataRowExt> = {};
        if (gridData && (gridData.length > 0)) {
            for (let i = 0; i < gridData.length; i++) {
                hash[gridData[i].value] = gridData[i];
            }
        }
        return hash;
    }

    /**
     * Checks for valid nextProps. If valid, query for grid data
     * @param nextProps 
     * @param nextContext 
     */
    public componentWillReceiveProps(nextProps: Readonly<IContainerGridProps>, nextContext: any): void {
        if (ContainerGridBase.shouldRequeryGridData(nextProps, this.props)) {

            // console.log(`Search Filter for query data ${nextProps.nameSearchFilterValue}`);
            // this.queryGridData(
            //     nextProps,
            //     false,
            //     DEFAULT_MAX_RESULT_COUNT
            // );
            this.throttledQuery(nextProps, false, DEFAULT_MAX_RESULT_COUNT);
        }
    }

    /**
     * Renders Host Hierarchy Grid
     */
    public render(): JSX.Element {
        if (EnvironmentConfig.Instance().isConfigured()) {
            if (!this.telemetry) {
                this.telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
            }
        }

        // For displaying the number of items in the current state of the grid
        let filterGridData = ContainerGridBase.filterGridData(update(this.state.gridData, {}),
            this.props.nameSearchFilterValue,
            this.props.shouldApplyExactNameSearchFilterMatch,
            this.props.maxRowsOnLoad);
        let itemCountStr: string = ContainerGridBase.getGridItemCountString(filterGridData, this.state.gridData);
        const hoistedState = this.state;

        return (
            <div className='comparison-grid-container'>
                <div id='grid-item-count' className={(this.state.isLoading ? ' transparent' : '')} role='status' aria-live='polite'>
                    <span>{itemCountStr}</span>
                </div>
                <Grid
                    timeInterval={this.state.timeInterval}
                    columns={this.getColumnDefinition(this.state.displayedAggregationOption)}
                    metric={ContainerHostMetrics.get(this.state.displayedMetricName).descriptor}
                    canLoadMore={this.state.canLoadMore}
                    isLoading={this.state.isLoading}
                    isError={this.state.isError}
                    gridData={filterGridData}
                    maxRowsCurrent={this.props.maxRowsCurrent}
                    sortColumnIndex={this.props.sortColumnIndex}
                    sortDirection={ContainerGridBase.convertSortOrderToSgSortOrder(this.props.sortOrder)}
                    onSortColumnChanged={this.onSortColumnChanged}
                    onSortOrderChanged={this.onSortOrderChanged}
                    onCollapse={this.onExpandLoadChildren}
                    onLoadMoreClicked={this.onLoadMoreClicked}
                    loggingInfo={this.props.loggingInfo}
                    onConsoleClose={this.props.onConsoleClose}
                    isConsoleOpen={this.props.isConsoleOpen}
                    onGridRowSelected={(index: any) => {
                        this.onGridRowSelected(index, hoistedState);
                    }}
                    liveDataProvider={this.props.liveDataProvider}
                />
            </div>
        );
    }

    /**
     * React lifecycle method, a hook that activates right after the component has been injected into the DOM 
     * nibs: Have to hope our UX has received the cloud env from Monex msg and configured our env config, else we cannot query for data
     */
    public componentDidMount(): void {
        if (!EnvironmentConfig.Instance().isConfigured()) {
            throw new Error('The component mounted, but grid data could not be queried \
            because the environment config had not been configured yet')
        }
        this.queryGridData(
            this.props,
            true,
            DEFAULT_MAX_RESULT_COUNT
        );
    }

    /**
     * Calls onGridRowSelected, which will execute the custom behavior that CI wants from SG,
     * i.e., query for PP data and open the PP. 
     * This function performs the extra step of making sure no other row is selected, besides the one 
     * that was most recently selected by the user.
     * This function is here and not incorporated with the onGridRowSelected in ContainerMainPage because
     * ContainerMainPage doesn't have access to gridData
     * @param rowValue the index value of the row in grid 
     * @param state state of ContainerHostHierarchyGrid when onGridRowSelected is called
     */
    private onGridRowSelected(rowValue: any, state: IContainerHostHierarchyGridState): void {
        let gridDataCopy = Object.assign([], state.gridData);

        ContainerGridBase.unselectGridDataRows(gridDataCopy);

        let selectedRow = ContainerGridBase.accessGridRowByRowValue(rowValue, gridDataCopy);
        selectedRow.selected = true;

        this.props.onGridRowSelected(selectedRow);
        this.setState({ gridData: gridDataCopy })
        if (this.props.shouldApplyExactNameSearchFilterMatch &&
            selectedRow.columnData[rowValue] !== undefined &&
            selectedRow.columnData[rowValue].metaData !== undefined && 
            selectedRow.columnData[rowValue].metaData.rowType !== undefined && 
            selectedRow.columnData[rowValue].metaData.rowType.toLowerCase() !== 'system') {
            selectedRow.expanded = true;
            this.onExpandLoadChildren([selectedRow.value], false);
        }
    }

    /**
     * Handles first time expansion of a node and the subsequent query and loading of its children.
     * Finds the target's root. Performs checks. If the target root's row contains the loading indicator, it loads the row's children
     * @param row [row, sub-row, sub-sub-row]
     * @param isExpanded boolean that is true if the row is already expanded, and false otherwise
     */
    private onExpandLoadChildren(row: [any], isExpanded: boolean): void {
        // bbax: if the row is pointing at a child it is none of our business
        if (!row || !row.length || row.length !== 1) {
            return;
        }

        // bbax: technically we aren't supposed to access state here... but 
        // the implications to rendering to force a setState in here causes more
        // issues then potential merge issues... we'll address the setState fix seperate
        const targetRoot = this.state.gridIndexHash[row[0]];
        if (!targetRoot) {
            return; // bbax: most likely its a child expansion...
        }

        const targetsChildren: SGDataRowExt[] = targetRoot.children as any;
        // bbax: this is expected to happen, once we are loaded the children length will
        // exceed one... better would be letting this fall through to the type check below
        // so it all happens in one place, but to guard against accidents this check is done too
        // Note: Loaded nodes with only 1 child are handled in the type check below...
        if (!targetsChildren || !targetsChildren.length || targetsChildren.length !== 1) {
            return;
        }

        // bbax: hack hack... if the element of item 0 is the loading icon
        // we load children...
        const baseTargetChildNameElement = targetsChildren[0].columnData[0];
        if ((typeof baseTargetChildNameElement) !== 'string' &&
            (baseTargetChildNameElement.metaData instanceof SystemRowMetaData)) {
            this.loadChildren(targetRoot, row[0]);
        }
    }

    /**
     * Queries a host row's children data and injects it into the grid under the host row
     * @param targetRow the host row that is being expanded/collapsed
     * @param index the index of the host row that is being expanded/collapsed
     */
    private loadChildren(targetRow: SGDataRowExt, index: string): void {
        const containerMetric: string = ContainerGridBase.getMetricFromHostMetric(this.props.metricName);
        let totalRowsFromQuery: number = undefined;

        if (!containerMetric) {
            console.error('metric type doesn\'t exist for metric ' + this.props.metricName);
            return;
        }

        const fullNameColumn: IGridLineObject<NodeMetaData> = targetRow.columnData[HostHierarchyGridColumnDataMap.Name] || {};
        const nameColumnMetaData: NodeMetaData = fullNameColumn.metaData || ({} as any);

        const hostName: string = nameColumnMetaData.nodeName;
        if (!hostName) {
            console.error('no host meta name was found!');
            return;
        }

        const averagePercent: number | string = targetRow.columnData[HostHierarchyGridColumnDataMap.AggregationPercent].value || '-';
        const averageActual: number | string = targetRow.columnData[HostHierarchyGridColumnDataMap.Aggregation].value || '-';
        const hostMax: number = nameColumnMetaData.maxValue || 1;

        // Start telemetry
        const customProperties = ContainerGridBase.getGridQueryDropdownSelections(this.props);
        const requestId = GUID().toLowerCase();

        customProperties.requestId = requestId;
        customProperties.host_name = hostName;

        const kustoQueryTelemetry = this.telemetry.startLogEvent('kustoContainerHostHierarchyChildrenLoad',
            customProperties,
            undefined);
        const gridQueryTelemetry = this.telemetry.startLogEvent('containerHostHierarchyChildrenLoad',
            customProperties,
            undefined);

        // Query for root row's children's data
        this.dataProvider.getResourceList(
            this.props.workspace,
            this.props.clusterName,
            this.props.clusterResourceId,
            this.props.nameSpace,
            this.props.serviceName,
            hostName,
            null,
            this.props.controllerName,
            this.props.controllerKind,
            this.props.nodePool,
            this.state.timeInterval,
            containerMetric,
            ContainerHostHierarchyGrid.getGridQuerySortColumn(this.props.sortColumnIndex),
            ContainerGridBase.getGridQuerySortOrder(this.props.sortOrder),
            ResourceType.ContainersChildren,
            this.props.aggregationOption,
            null,
            DEFAULT_MAX_RESULT_COUNT,
            requestId,
            'nodeList',
            'expandChildren'
        ).then((childrenData) => {

            if (childrenData && childrenData.Tables && childrenData.Tables.length > 1 && childrenData.Tables[0].Rows) {
                totalRowsFromQuery = childrenData.Tables[0].Rows.length;
            }

            kustoQueryTelemetry.complete(null, { totalRowsFromQuery: totalRowsFromQuery });

            this.onloadChildrenSuccess(targetRow, hostMax, childrenData, averagePercent, averageActual, index,
                hostName)
                .then(() => { gridQueryTelemetry.complete(); })
                .catch((err) => {
                    gridQueryTelemetry.complete();
                    this.onLoadChildrenFailure(err, customProperties, targetRow, index);
                });

        }).catch((error) => {
            this.onLoadChildrenFailure(error,
                customProperties,
                targetRow,
                index
            );
        });
    }

    private onLoadChildrenFailure(
        error,
        customProperties,
        targetRow,
        index
    ) {
        this.telemetry.logException(error, 'ContainerHostHierarchyGrid.tsx', ErrorSeverity.Error, customProperties, undefined);

        // bbax: clear the loading... entry
        targetRow.children = [];

        // bbax: since this was a failure... add the data load failure indication
        this.loadBlankRowForNoChildData(targetRow, index, DisplayStrings.DataRetrievalError, true);

        // bbax: TODO right now destroy the entire table if one of the children fails to load..
        // in the future better to just show an error for just that row and retry
        this.setState({ gridData: null, gridIndexHash: null, isLoading: false, isError: true },
            () => this.props.onTabContentLoadingStatusChange(false));
    }

    private onloadChildrenSuccess(targetRow: SGDataRowExt, hostMax: number, childrenData: any, averagePercent: number | string,
        averageActual: number | string, index: string, hostName: string): Promise<any> {
        // bbax: clear the loading... entry
        targetRow.children = [];

        // Interprets Kusto query
        const childrenResults: IGridLineObject<ContainerMetaDataLegacy>[][] =
            this.responseInterpreter.processContainerGridQueryResultForHost(hostMax, childrenData);

        // Returns childHash, an object that nests container data under host and pod properties
        // Under host, a property for its system is also added
        const childHash: StringMap<StringMap<IGridLineObject<ContainerMetaDataLegacy>[][]>> =
            this.hashInterpretedChildResponse(childrenResults, { averagePercent, averageActual, hostMax });

        if (!childHash) {
            console.error('failed to generate a hash for the child data!');
            this.loadBlankRowForNoChildData(targetRow, index, DisplayStrings.DataRetrievalError, true);
            this.setState({ gridData: null, gridIndexHash: null, isLoading: false, isError: true },
                () => this.props.onTabContentLoadingStatusChange(false));
            return new Promise((resolve, reject) => { reject(new Error('failed to generate a hash for the child data!')); });
        }

        // Converts childHash into SGRows that selectible grid can understand and 
        // inserts those rows under the proper parent row that was expanded/collapsed
        this.hashMergeChildToParentGrid(targetRow, hostName, childHash, index, childrenResults.length); // counterpart is toGridData...

        return new Promise((resolve, reject) => {
            this.setState({
                displayedMetricName: this.props.metricName,

                isLoading: false,
                isError: false,
                gridData: this.state.gridData,

                // TODO: load more process is broken here... load N children needs to be fixed
                // before //build!
                canLoadMore: false,
            }, () => {
                this.props.onTabContentLoadingStatusChange(false);
                resolve();
            });
        });
    }

    /**
     * Converts childHash into SGRows that selectible grid can understand and 
     * inserts those rows under the proper parent row that was expanded/collapsed
     * @param targetRow the parent row that is being expanded/collapsed
     * @param hostName name of the host
     * @param childHash object with container data nested under host and pod properties
     * @param index index of the parent row
     */
    private hashMergeChildToParentGrid(targetRow: SGDataRowExt, hostName: string,
        childHash: StringMap<StringMap<IGridLineObject<ContainerMetaDataLegacy>[][]>>, index: string, totalRows: number): void {

        if (!targetRow) {
            this.telemetry.logException(
                new Error('ContainerHostHierarchy.null.targetrow'),
                'ContainerHostHierarchy.tsx',
                ErrorSeverity.Fatal,
                undefined,
                undefined
            );
            return;
        }
        targetRow.children = [];

        if (!childHash || !childHash[hostName]) { // bbax: if there is nothing to add insert a blank so the loading row disappears
            this.loadBlankRowForNoChildData(targetRow, index, DisplayStrings.NoData, false);
            return;
        }

        const childDataForHost: StringMap<IGridLineObject<ContainerMetaDataLegacy>[][]> = childHash[hostName];
        this.addContainersAndPodsToRowChildren(childDataForHost, targetRow, index, totalRows);
    }

    /**
     * Creates rows for the pods and containers and adds them to a target row's children
     * @param childDataForHost an object with pods and the pods have containers and the containers have their data
     * @param targetRow the row that the rows created from the pods and containers will be added to
     * @param index the index of the row that the rows from the pods and containers will be added to
     */
    private addContainersAndPodsToRowChildren(childDataForHost: StringMap<IGridLineObject<ContainerMetaDataLegacy>[][]>,
        targetRow: SGDataRowExt, index: string, totalRows: number): void {

        const podRows = Object.keys(childDataForHost); // Gets the pod for the host that was expanded/collapsed

        if (!podRows) { // If the node has no pods/childHash, then there is nothing to merge
            this.loadBlankRowForNoChildData(targetRow, index, DisplayStrings.NoData, false);
            return;
        }

        const maxRows = totalRows >= ContainerQueryConstants.MaxContainerRows;
        if (maxRows) {
            const dataOverflowRow = ContainerHostHierarchyGrid.dataOverflowRow(`${index};.dataOverflow`,
                ContainerQueryConstants.MaxContainerRows);
            targetRow.children.push(dataOverflowRow);
        }

        for (let j = 0; j < podRows.length; j++) { // Create rows from the pods and containers and add them to row's children
            const podName = podRows[j];

            // Check if the childhash seems valid
            if (!childDataForHost.hasOwnProperty(podName) ||
                !childDataForHost[podName] ||
                childDataForHost[podName].length < 1) {
                console.warn('child hash for pod/host seems invalid');
                continue;
            }

            const baseMeta = targetRow.columnData[0] as IGridLineObject<NodeMetaData>;
            const isVirtual = baseMeta.metaData.isVirtual;

            const containerList: IGridLineObject<ContainerMetaDataLegacy>[][] = childDataForHost[podName]; // Get the containers

            const systemRowCheck: IGridLineObject<SystemRowMetaData>[] = (containerList[0] as any);
            const systemRowCellCheck: IGridLineObject<SystemRowMetaData> = systemRowCheck[0];

            if (systemRowCellCheck.metaData.rowType === RowType.System) {
                if (!isVirtual && !maxRows) {
                    this.createChildRowAndAddToParentRowChildren(containerList[0], `${index};${j};${0}`, targetRow);
                }
                continue;
            }

            // bbax: there must be at least one container, otherwise why are we making a pod right now?
            const podStatus = containerList[0][0].metaData.podStatus;
            const hostName = containerList[0][0].metaData.host;
            const nameSpace = containerList[0][0].metaData.nameSpace;
            const clusterId = containerList[0][0].metaData.clusterId;
            const podTimeGenerated = ContainerGridBase.getMaxTimeGeneratedInContainerList(containerList);

            // As implemented, selectable grid expects data in the first column to be of type GridLineObject.
            // Based on the metaData attached to the GridLineObject Type the grid determines what type of icon should be 
            // rendered in the cell with name. The metaData specified here instructs the pod icon to be shown in the cell
            const podMetaData = new PodMetaDataLegacy(podName, podStatus, -1, undefined, podTimeGenerated, hostName, nameSpace, clusterId);
            const podRowData = [
                PodMetaDataLegacy.metaWrapperHelper(podName, podMetaData),
                PodMetaDataLegacy.metaWrapperHelper(null, podMetaData),
                PodMetaDataLegacy.metaWrapperHelper(undefined, podMetaData),
                PodMetaDataLegacy.metaWrapperHelper(undefined, podMetaData),
                PodMetaDataLegacy.metaWrapperHelper(undefined, podMetaData),
                PodMetaDataLegacy.metaWrapperHelper(null, podMetaData),
                PodMetaDataLegacy.metaWrapperHelper(null, podMetaData),
                PodMetaDataLegacy.metaWrapperHelper(null, podMetaData),
            ];

            const podRow = this.createChildRowAndAddToParentRowChildren(podRowData, `${index};${j}`, targetRow);

            let maxLastReported = -1;
            let controllerName = null;
            let controllerKind = null;
            let hasValidContainerChildren = false;
            for (let k = 0; k < containerList.length; k++) {
                const lastReportedContainer = containerList[k][0].metaData.lastReported;
                controllerName = containerList[k][0].metaData.controllerName;
                controllerKind = containerList[k][0].metaData.controllerKind;
                if (lastReportedContainer > maxLastReported) {
                    maxLastReported = lastReportedContainer;
                }
                if (containerList[k][0].metaData.isValid()) {
                    this.createChildRowAndAddToParentRowChildren(containerList[k], `${index};${j};${k}`, podRow);
                    hasValidContainerChildren = true;
                }
            }

            if (!hasValidContainerChildren) {
                podRow.children = null;
            }


            let average: string | number = '-';
            let averagePercent: string | number = '-';
            let containerCount: string | number = '-';
            let uptime: string | number = '-';
            if (hasValidContainerChildren) {
                const rollupRows = [
                    HostHierarchyGridColumnDataMap.AggregationPercent,
                    HostHierarchyGridColumnDataMap.Aggregation,
                    HostHierarchyGridColumnDataMap.Containers,
                    HostHierarchyGridColumnDataMap.Uptime
                ];
                const rollupValues = ContainerGridBase.getSgRowFullDepthValues((podRow.children as any), rollupRows);
                average = rollupValues[HostHierarchyGridColumnDataMap.Aggregation].sum;
                averagePercent = rollupValues[HostHierarchyGridColumnDataMap.AggregationPercent].sum;
                containerCount = rollupValues[HostHierarchyGridColumnDataMap.Containers].sum;
                uptime = rollupValues[HostHierarchyGridColumnDataMap.Uptime].min;
            }

            const statusWrapper = {
                status: podStatus,
                lastReported: maxLastReported,
                rowType: 'pod',
            };

            (podRowData[HostHierarchyGridColumnDataMap.Status] as any)._value = statusWrapper;
            (podRowData[HostHierarchyGridColumnDataMap.AggregationPercent] as any)._value = averagePercent;
            (podRowData[HostHierarchyGridColumnDataMap.Aggregation] as any)._value = average;
            (podRowData[HostHierarchyGridColumnDataMap.Containers] as any)._value = containerCount;
            (podRowData[HostHierarchyGridColumnDataMap.Uptime] as any)._value = uptime;
            (podRowData[HostHierarchyGridColumnDataMap.Trend] as any)._value =
                ContainerMetaDataLegacy.addTrends(containerList, HostHierarchyGridColumnDataMap.Trend);
            (podRowData[HostHierarchyGridColumnDataMap.Controller] as any)._value = controllerName;

            podRowData[HostHierarchyGridColumnDataMap.Name].metaData.controllerName = controllerName;
            podRowData[HostHierarchyGridColumnDataMap.Name].metaData.controllerKind = controllerKind;
            podRowData[HostHierarchyGridColumnDataMap.Name].metaData.lastReported = maxLastReported;
        }

        // bbax: if we are finally done and there are STILL no children, insert a blank
        // bbax: Note: children is hard coded memory creation, checks here are for clarity
        if (targetRow && targetRow.children && targetRow.children.length < 1) {
            this.loadBlankRowForNoChildData(targetRow, index, DisplayStrings.NoData, false);
            return;
        }
    }

    /**
     * Creates a SGDataRow from childData and key. Inserts the newly created SGDataRow into the parentRow's children.
     * Makes a few decisions about what the properties on the newly created SGDataRow should be
     * @param childData the data that will be used to create the SGDataRow
     * @param key the key that will be used to create the SGDataRow
     * @param parentRow the parent row whose children property the newly created SGDataRow will be added to 
     * @return the newly created SGDataRow
     */
    private createChildRowAndAddToParentRowChildren(childData: any[], key: string, parentRow: SGDataRowExt): SGDataRowExt {
        if (!childData) {
            console.error('missing container item details!');
        }
        let childRow = new SGDataRowExt(childData, key);
        childRow.children = [];
        childRow.expanded = true; // default?
        parentRow.children.push(childRow);
        return childRow;
    }

    /**
     * this should never get invoked in production ever... something went horribly wrong and we
     * expanded a node but now there are no containers at all that were returned!  prevent
     * the ui from completely collapsing and log out the exception
     * @param targetRow node row we are trying to add children to
     * @param index index of the node row we are editing
     * @returns {void}
     */
    private loadBlankRowForNoChildData(targetRow: SGDataRowExt, index: string, message: string, error: boolean) {

        if (error) {
            this.telemetry.logException(new Error('ContainerHostHierarchyGrid.load.blank'), 'ContainerHostHierarchyGrid',
                ErrorSeverity.Fatal, undefined, undefined);
        }

        const blankEntryKey = `${index}.blankentry`;

        const systemRowMeta = new SystemRowMetaData();

        const blankLoadFailureRow = [
            SystemRowMetaData.metaWrapperHelper(message, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(undefined, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(undefined, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(undefined, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
        ];

        const blankPodRow = new SGDataRowExt(blankLoadFailureRow, `${blankEntryKey}`);
        if (!targetRow.children) { targetRow.children = []; }
        targetRow.children.push(blankPodRow);
    }

    /**
     * Converts the array of grid column data interpreted from Kusto into
     * an object (childHash) that nests the column/container data under unique host hashes that
     * have a system property and one or more pod properties that store their associated container data
     * @param childrenResults data on host children processes received from Kusto
     * @param hostMetrics host data that will be used to get correct stats for children
     * @param queryProps the arguments used to power the query for the childrenResults
     * @return childHash 
     */
    private hashInterpretedChildResponse(childrenResults: IGridLineObject<ContainerMetaDataLegacy>[][], hostMetrics: any):
        StringMap<StringMap<IGridLineObject<ContainerMetaDataLegacy>[][]>> {
        //add checks
        const childHash: StringMap<StringMap<IGridLineObject<ContainerMetaDataLegacy>[][]>> = {};

        childrenResults.forEach((childResult) => {
            const hostName: string = childResult[0].metaData.host;
            const podName: string = childResult[0].metaData.podName;

            if (!childHash.hasOwnProperty(hostName)) {
                childHash[hostName] = {};
            }

            if (!(childResult[0].metaData.isUnscheduledPod)) {
                this.addPropertyForSystemToHostObject(childHash[hostName], hostMetrics, childResult);
            }

            if (!childHash[hostName].hasOwnProperty(podName)) {
                childHash[hostName][podName] = [];
            }

            childHash[hostName][podName].push(childResult);
        });

        return childHash; // Container data nested within host and pod
    }

    private addPropertyForSystemToHostObject(hostObject: StringMap<IGridLineObject<IMetaDataBase>[][]>,
        hostMetrics: any, childResult): void {
        const systemName: string = DisplayStrings.ContainerSystemMetricTitle;

        const childAveragePercentValue = childResult[2].value === DisplayStrings.ContainerMissingPerfMetricTitle ? 0 : childResult[2].value;
        const childAverageValue = childResult[3].value === DisplayStrings.ContainerMissingPerfMetricTitle ? 0 : childResult[3].value;


        // bbax: only add a new "system" record to this host object once.  the children are all
        // being subtracted from it one-by-one
        if (!hostObject.hasOwnProperty(systemName)) {

            const trueHostAveragePercent = hostMetrics.averagePercent;
            const trueHostAverage = hostMetrics.averageActual;

            let calculatedAveragePercent: string | number = '-';
            let calculatedAverage: string | number = '-';
            if (trueHostAveragePercent !== '-') {
                calculatedAveragePercent = trueHostAveragePercent - childAveragePercentValue;
            }
            if (trueHostAverage !== '-') {
                calculatedAverage = trueHostAverage - childAverageValue;
            }

            const systemRowMetaData = new SystemRowMetaData();
            hostObject[systemName] = [[
                SystemRowMetaData.metaWrapperHelper(systemName, systemRowMetaData),
                SystemRowMetaData.metaWrapperHelper('-', systemRowMetaData),
                SystemRowMetaData.metaWrapperHelper(calculatedAveragePercent, systemRowMetaData),
                SystemRowMetaData.metaWrapperHelper(calculatedAverage, systemRowMetaData),
                SystemRowMetaData.metaWrapperHelper('-', systemRowMetaData),
                SystemRowMetaData.metaWrapperHelper('-', systemRowMetaData),
                SystemRowMetaData.metaWrapperHelper('-', systemRowMetaData),
                SystemRowMetaData.metaWrapperHelper(null, systemRowMetaData),
            ]];
        } else {
            const percentRow = (hostObject[systemName][0][2] as any);
            if (typeof percentRow._value === 'number' && typeof childAveragePercentValue === 'number') {
                percentRow._value -= childAveragePercentValue;
            }

            const averageRow = (hostObject[systemName][0][3] as any);
            if (typeof averageRow._value === 'number' && typeof childAverageValue === 'number') {
                averageRow._value -= childAverageValue;
            }
        }
    }

    private getColumnDefinition(selectedAggregationOption: AggregationOption): SGColumn[] {
        let columnDefinitions = [];

        columnDefinitions.push({
            name: DisplayStrings.ComparisonGridColumnTitleName,
            width: 200,
            cell:
                SGIconCell((data) => {
                    const castedData = data as IGridLineObject<IMetaDataBase>;
                    if (castedData.value) {
                        if (data.metaData.isUnscheduledPod) {
                            return DisplayStrings.unscheduled;
                        } else {
                            return castedData.value;
                        }
                    }
                    return '';
                }, (data) => {
                    const castedData = data as IGridLineObject<ContainerMetaDataLegacy>;
                    if (!castedData || !castedData.metaData) {
                        return undefined;
                    }

                    switch (castedData.metaData.rowType) {
                        case RowType.Container:
                            if (castedData.metaData.isVirtual) {
                                return <VirtualContainerSvg />;
                            } else {
                                return <ContainerSVG />;
                            }
                        case RowType.Pod:
                            if (castedData.metaData.isVirtual) {
                                return <VirtualPodSvg />;
                            } else {
                                return <PodSVG />;
                            }
                        case RowType.Node:
                            const hostRecast = data as IGridLineObject<NodeMetaData>;
                            let labels: StringMap<string> = hostRecast.metaData.labels;
                            if (!labels || (typeof (labels) !== 'object')) { labels = {}; }
                            const os: string = labels.hasOwnProperty('beta.kubernetes.io/os') ? labels['beta.kubernetes.io/os'] : '';
                            const lowerOS: string = os.toLocaleLowerCase();
                            if (hostRecast.metaData.isVirtual) {
                                return <VirtualKubeSvg />;
                            } else if (hostRecast.metaData.isUnscheduledPod) {
                                return <VmGreySvg
                                    title={DisplayStrings.unscheduled} />;
                            } else if (lowerOS === OperatingSystem.Windows) {
                                return <WindowsVMSVG />;
                            } else if (lowerOS === OperatingSystem.Linux) {
                                return <LinuxVMSVG />
                            } else {
                                return <VmSvg />;
                            }
                        default:
                            return null;
                    }
                }),
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 0 ? this.props.sortOrder : undefined,
            sortFunc: (a, b) => {
                const safeA = a || '';
                const safeB = b || '';
                const aString = safeA.value || safeA;
                const bString = safeB.value || safeB;

                if (safeA.metaData && safeA.metaData.rowType === RowType.System) {
                    return this.props.sortOrder === GridSortOrder.Asc ? Number.MIN_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
                }

                if (safeB.metaData && safeB.metaData.rowType === RowType.System) {
                    return this.props.sortOrder === GridSortOrder.Asc ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;
                }

                return SortHelper.Instance().sortByNameAlphaNumeric(aString, bString);
            }
        });

        columnDefinitions.push({
            name: DisplayStrings.ComparisonGridColumnTitleHostStatus,
            width: 70,
            cell: ({ value }) => {
                const castedValue = value as IGridLineObject<IMetaDataBase>;

                if (!value || !castedValue.metaData || castedValue.value == null) {
                    return <div className='sg-text'></div>;
                }

                let displayStatus: string | JSX.Element[];
                let tooltipStatus: string;
                let tooltipStatusReason: string = '';
                const lastReported: any = castedValue.value.lastReported;
                switch (castedValue.metaData.rowType) {
                    case RowType.Node:
                        const nodeStatus = ContainerGridBase.getStatusOfNode(lastReported, castedValue.value.status);
                        displayStatus = nodeStatus.displayStatus;
                        tooltipStatus = nodeStatus.tooltipStatus;
                        break;
                    case RowType.Pod:
                        const podStatus = ContainerGridBase.getStatusOfPod(lastReported, castedValue.value.status);
                        displayStatus = podStatus.displayStatus;
                        tooltipStatus = podStatus.tooltipStatus;
                        break;
                    case RowType.Container:
                        const castedMetaData = castedValue.metaData as ContainerMetaDataLegacy;
                        const containerStatus = ContainerGridBase.getStatusOfContainer(
                            lastReported,
                            castedMetaData.statusFixed,
                            castedMetaData.status,
                            castedValue.metaData.statusReason
                        );
                        tooltipStatusReason = !StringHelpers.isNullOrEmpty(containerStatus.tooltipStatusReason)
                            ? containerStatus.tooltipStatusReason
                            : '';
                        displayStatus = containerStatus.displayStatus;
                        tooltipStatus = containerStatus.tooltipStatus;
                        break;
                    case RowType.System:
                        return <div className='sg-text' title='-'>-</div>;
                }

                const formattedLastReported = MetricValueFormatter.formatUpTimeValue(lastReported);
                const finalReport = StringHelpers.replaceAll(DisplayStrings.LastReportedNTimeAgo, '{0}', formattedLastReported);
                let tooltip = `${DisplayStrings.ComparisonGridColumnTitleHostStatus} ${tooltipStatus}`;
                if (!StringHelpers.isNullOrEmpty(tooltipStatusReason)) {
                    tooltip = tooltip + `\n${tooltipStatusReason}`;
                }
                tooltip = tooltip + `\n${finalReport}`;

                return <div className='sg-text' title={tooltip} aria-label={tooltip}>{displayStatus}</div>;
            },
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 1 ? this.props.sortOrder : undefined,
            sortFunc: (a, b) => { return ContainerGridBase.sortStatus(a, b, this.props.sortOrder); },
        });

        let aggregationTitle: string = DisplayStrings.ComparisonGridColumnTitleAverage;
        let aggregationPercentTitle: string = DisplayStrings.ComparisonGridColumnTitleAvgPercent;

        switch (selectedAggregationOption) {
            case AggregationOption.Avg:
                aggregationTitle = DisplayStrings.ComparisonGridColumnTitleAverage;
                aggregationPercentTitle = DisplayStrings.ComparisonGridColumnTitleAvgPercent;
                break;
            case AggregationOption.Min:
                aggregationTitle = DisplayStrings.ComparisonGridColumnTitleMin;
                aggregationPercentTitle = DisplayStrings.ComparisonGridColumnTitleMinPercent;
                break;
            case AggregationOption.Max:
                aggregationTitle = DisplayStrings.ComparisonGridColumnTitleMax;
                aggregationPercentTitle = DisplayStrings.ComparisonGridColumnTitleMaxPercent;
                break;
            case AggregationOption.P50:
                aggregationTitle = DisplayStrings.ComparisonGridColumnTitle50thPercentile;
                aggregationPercentTitle = DisplayStrings.ComparisonGridColumnTitle50thPercentilePercent;
                break;
            case AggregationOption.P90:
                aggregationTitle = DisplayStrings.ComparisonGridColumnTitle90thPercentile;
                aggregationPercentTitle = DisplayStrings.ComparisonGridColumnTitle90thPercentilePercent;
                break;
            case AggregationOption.P95:
                aggregationTitle = DisplayStrings.ComparisonGridColumnTitle95thPercentile;
                aggregationPercentTitle = DisplayStrings.ComparisonGridColumnTitle95thPercentilePercent;
                break;
            default:
                throw new Error('Unknown aggregation: ' + selectedAggregationOption);
        }

        columnDefinitions.push({
            name: aggregationPercentTitle,
            width: DEFAULT_PROP_COL_HEADER_WIDTH,
            cell:
                SGFormattedColoredCellContainers((data) => {
                    const castedData = data as IGridLineObject<IMetaDataBase>;
                    if (!castedData) {
                        return '-';
                    }
                    if (typeof castedData.value !== 'number') {
                        return castedData.value;
                    }
                    return MetricValueFormatter.formatPercentageValue(castedData.value);
                }, (data) => {
                    const castedData = data as IGridLineObject<IMetaDataBase>;
                    if (!castedData || typeof castedData.value !== 'number') {
                        return '';
                    }

                    const formatter = new FixedMaxValueMetricDescriptor('', false, 100, undefined);
                    return formatter.getTrendBarColor(castedData.value);
                }, (data) => {
                    const castedData = data as IGridLineObject<IMetaDataBase>;
                    if (!castedData || typeof castedData.value !== 'number') {
                        return '';
                    }
                    return ContainerHostMetrics.get(this.state.displayedMetricName).descriptor.getTrendBarHeightFraction(castedData.value)
                }, () => {
                    return ContainerHostMetrics.get(this.state.displayedMetricName).descriptor.isHigherValueBetter
                }),

            sortable: true,
            sortOrder: this.props.sortColumnIndex === 2 ?
                ContainerGridBase.convertSortOrderToSgSortOrder(this.props.sortOrder) : undefined,
            sortFunc: (a, b) => {
                const castedDataA = a as IGridLineObject<IMetaDataBase>;
                if (!castedDataA || !castedDataA.metaData) {
                    throw new Error('unexpected data in sort of grid');
                }
                const castedDataB = b as IGridLineObject<IMetaDataBase>;
                if (!castedDataB || !castedDataB.metaData) {
                    throw new Error('unexpected data in sort of grid');
                }

                return ContainerGridBase.gridSortValue(castedDataA, castedDataB, this.props);
            },
            infoText: DisplayStrings.ContainerColumnHeaderAvgPercentTooltip
        });

        columnDefinitions.push({
            name: aggregationTitle,
            width: 85,
            cell: SGFormattedPlainCell((data) => {
                const castedData = data as IGridLineObject<IMetaDataBase>;
                if (!castedData || !castedData.metaData || castedData.value === null || castedData.value === undefined) {
                    return '';
                }

                if (castedData.value === DisplayStrings.ContainerMissingPerfMetricTitle) { return castedData.value; }

                const float = parseFloat((castedData.value as any));
                return ContainerHostMetrics.get(this.state.displayedMetricName).descriptor.formatValue(float);
            }),
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 3 ?
                ContainerGridBase.convertSortOrderToSgSortOrder(this.props.sortOrder) : undefined,
            sortFunc: (a, b) => {
                const castedDataA = a as IGridLineObject<IMetaDataBase>;
                if (!castedDataA || !castedDataA.metaData) {
                    throw new Error('unexpected data in sort of grid');
                }
                const castedDataB = b as IGridLineObject<IMetaDataBase>;
                if (!castedDataB || !castedDataB.metaData) {
                    throw new Error('unexpected data in sort of grid');
                }

                return ContainerGridBase.gridSortValue(castedDataA, castedDataB, this.props);
            },
            infoText: DisplayStrings.ContainerColumnHeaderAverageTooltip
        });

        columnDefinitions.push({
            name: DisplayStrings.ComparisonGridColumnTitleContainerCount,
            width: 95,
            cell: SGFormattedPlainCell((data) => {
                const castedData = data as IGridLineObject<IMetaDataBase>;
                if (!castedData) {
                    return '-';
                }
                if (typeof castedData.value !== 'number') {
                    return castedData.value;
                }
                return castedData.value;
            }),
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 4 ?
                ContainerGridBase.convertSortOrderToSgSortOrder(this.props.sortOrder) : undefined,
            sortFunc: (a, b) => {
                const castedDataA = a as IGridLineObject<IMetaDataBase>;
                if (!castedDataA || !castedDataA.metaData) {
                    throw new Error('unexpected data in sort of grid');
                }
                const castedDataB = b as IGridLineObject<IMetaDataBase>;
                if (!castedDataB || !castedDataB.metaData) {
                    throw new Error('unexpected data in sort of grid');
                }

                return ContainerGridBase.gridSortValue(castedDataA, castedDataB, this.props);
            },
        });

        columnDefinitions.push({
            name: DisplayStrings.ComparisonGridColumnTitleUpTime,
            width: 80,
            cell: SGFormattedPlainCell((data) => {
                const castedData = data as IGridLineObject<IMetaDataBase>;
                if (!castedData) {
                    return '-';
                }
                if (typeof castedData.value !== 'number') {
                    return castedData.value;
                }
                return MetricValueFormatter.formatUpTimeValue(castedData.value);
            }),
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 5 ?
                ContainerGridBase.convertSortOrderToSgSortOrder(this.props.sortOrder) : undefined,
            sortFunc: (a, b) => {
                const castedDataA = a as IGridLineObject<IMetaDataBase>;
                if (!castedDataA || !castedDataA.metaData) {
                    throw new Error('unexpected data in sort of grid');
                }
                const castedDataB = b as IGridLineObject<IMetaDataBase>;
                if (!castedDataB || !castedDataB.metaData) {
                    throw new Error('unexpected data in sort of grid');
                }

                return ContainerGridBase.gridSortValue(castedDataA, castedDataB, this.props);
            },
            infoText: DisplayStrings.ContainerHostHierarchyGridColumnHeaderUpTimeTooltip
        });

        columnDefinitions.push({
            name: DisplayStrings.ComparisonGridColumnTitleController,
            width: 125,
            cell: SGTabChangeLinkCell(
                ({ value }) => value,
                (event, value) => {
                    if (value &&
                        value.value &&
                        value.metaData &&
                        value.metaData.controllerKind &&
                        !StringHelpers.equal(value.value, '-')) {
                        this.props.onTabSelectionChanged(SingleClusterTab.Controller, value.value
                            + ' (' + value.metaData.controllerKind + ')');
                    }
                    return;
                }
            )
        });

        let grainDisplay = '';
        if (this.state.timeInterval) {
            const grainTime = KustoGrainDisplay[this.state.timeInterval.getGrainKusto()];
            if (grainTime) {
                grainDisplay = StringHelpers.replaceAll(DisplayStrings.ComparisonGridGranularitySubtitle, '{0}', grainTime);
            }
        }

        const trendTitleFormatted = StringHelpers.replaceAll(
            StringHelpers.replaceAll(DisplayStrings.ComparisonGridColumnTitleTrend, '{0}', grainDisplay),
            '{1}', aggregationPercentTitle);

        columnDefinitions.push({
            name: trendTitleFormatted,
            width: Constants.SGColumnWidthPxForTrendChartsInContainerInsights,
            cell: SGTrendChartCell(this.state, Constants.SGColumnWidthPxForTrendChartsInContainerInsights),
            infoText: DisplayStrings.ContainerHostHierarchyGridColumnHeaderTrendTooltip,
            className: 'sg-barchart'
        });

        return columnDefinitions;
    }

    private onSortColumnChanged(sortColumnIndex: number) {
        // calculate default sort order for the column
        let sortOrder = ContainerHostMetrics.get(this.props.metricName).descriptor.isHigherValueBetter
            ? SGSortOrder.Ascending
            : SGSortOrder.Descending;

        // bbax: name sorting should always start Ascending
        if (sortColumnIndex === 0) {
            sortOrder = SGSortOrder.Ascending;
        }

        this.onSortOrderChanged(sortColumnIndex, sortOrder);
    }

    private onSortOrderChanged(sortColumnIndex: number, sortOrder: SGSortOrder) {
        this.props.onSortOrderChanged(
            sortColumnIndex,
            sortOrder === SGSortOrder.Ascending ? GridSortOrder.Asc : GridSortOrder.Desc);
    }

    private onLoadMoreClicked = () => {
        this.queryGridData(this.props, false);
    }

    private queryGridData(queryProps: IContainerGridProps, initialLoad: boolean, maxResultCount?: number): void {
        const thisQuerySequenceNumber: number = ++this.pendingQuerySequenceNumber;
        let totalRowsFromQuery: number = undefined;

        this.setState({ isLoading: true }, () => this.props.onTabContentLoadingStatusChange(true));

        // Start telemetry
        const requestId = GUID().toLowerCase();
        let eventProps = ContainerGridBase.getGridQueryDropdownSelections(queryProps);
        eventProps.requestId = requestId;

        const kustoQueryTelemetry = this.telemetry.startLogEvent('kustoContainerHostHierarchyLoad',
            eventProps,
            undefined);
        const gridQueryTelemetry = this.telemetry.startLogEvent('containerHostHierarchyLoad',
            ContainerGridBase.getGridQueryDropdownSelections(queryProps),
            undefined);

        const timeInterval = new TimeInterval(queryProps.startDateTimeUtc, queryProps.endDateTimeUtc, Constants.IdealGridTrendDataPoints);

        BladeLoadManager.Instance().setPerformanceMeasure(PerformanceMeasure.FrameQueryStart);

        this.dataProvider.getResourceList(
            queryProps.workspace,
            queryProps.clusterName,
            queryProps.clusterResourceId,
            queryProps.nameSpace,
            queryProps.serviceName,
            queryProps.hostName,
            null,
            queryProps.controllerName,
            queryProps.controllerKind,
            queryProps.nodePool,
            timeInterval,
            queryProps.metricName,
            ContainerHostHierarchyGrid.getGridQuerySortColumn(queryProps.sortColumnIndex),
            ContainerGridBase.getGridQuerySortOrder(queryProps.sortOrder),
            ResourceType.Node,
            queryProps.aggregationOption,
            queryProps.nameSearchFilterValue,
            maxResultCount,
            requestId,
            'nodeList',
            'grid'
        ).then((data) => {
            BladeLoadManager.Instance().queryCompleted(QueryName.Grid);

            // Finish and collect telemetry
            if (data && data.Tables && data.Tables.length > 1 && data.Tables[0].Rows) {
                totalRowsFromQuery = data.Tables[0].Rows.length;
            }

            kustoQueryTelemetry.complete(null, { totalRowsFromQuery: totalRowsFromQuery });

            this.handleQueryGridDataSuccess(data,
                thisQuerySequenceNumber,
                queryProps,
                timeInterval,
                gridQueryTelemetry,
                initialLoad
            );

        }).catch((error) => {
            BladeLoadManager.Instance().terminateLoadTracking(LoadTrackingTerminationReason.QueryFailure);
            kustoQueryTelemetry.complete({ isError: 'true' });

            this.handleQueryGridDataFailure(
                error,
                thisQuerySequenceNumber,
                queryProps
            );
        });
    }

    private handleQueryGridDataSuccess(
        data: any,
        thisQuerySequenceNumber: number,
        queryProps: IContainerGridProps,
        timeInterval: TimeInterval,
        gridQueryTelemetry: IFinishableTelemetry,
        initialLoad: boolean
    ): void {
        // Check to see if component expects the result of this query
        // and don't do anything in case a subsequent query was issued
        // before receiving this query's results
        if (thisQuerySequenceNumber === this.pendingQuerySequenceNumber) {
            // Interprets Kusto query response
            // get back the data as an array of arrays, each inner array representing row data
            const result: IGridLineObject<NodeMetaData>[][] = this.responseInterpreter.processNodeGridQueryResult(
                queryProps.metricName,
                data,
                timeInterval
            );

            // bbax: retrieve the list of hosts... 
            const gridData = ContainerHostHierarchyGrid.toGridData(result, data);
            const gridIndexHash = ContainerHostHierarchyGrid.hashGridDataIndices(gridData);

            if (gridData.length === 0) {
                // report props panel loading completed if no grid rows are there to display
                BladeLoadManager.Instance().queryCompleted(QueryName.PropertyPanel);
            }


            let maxRows = NodeQueryTemplateConstants.MaxNodeRows;
            if (ContainerHostHierarchyGrid.resultHasUnscheduled(data)) {
                maxRows += 1;
            }
            this.props.onMaxRowsChanged(result.length >= (maxRows), initialLoad);


            this.setState({
                timeInterval,
                displayedMetricName: queryProps.metricName,
                displayedAggregationOption: queryProps.aggregationOption,

                isLoading: false,
                isError: false,
                gridData: gridData,
                //maxRows: result.length >= (NodeQueryTemplateConstants.MaxNodeRows - 1),
                gridIndexHash: gridIndexHash,
                // do not display 'load more' link if tried to load all records
                // without specifying the default maximum count
                canLoadMore: false,
            }, () => {
                this.props.onTabContentLoadingStatusChange(false);
                gridQueryTelemetry.complete();
                ContainerGridBase.hackFixOSSVendorResizeBug();
            });

        }
    }

    private handleQueryGridDataFailure(
        error: any,
        thisQuerySequenceNumber: number,
        queryProps: IContainerGridProps
    ) {
        // check to see if component expects result of this query
        // and don't do anything in case subsequent query was issued
        // before receiving this query results
        if (thisQuerySequenceNumber === this.pendingQuerySequenceNumber) {
            console.error('Error retrieving and procesing grid data', error);

            if (HttpRequestError.isAccessDenied(error)) {
                ContainerGridBase.handleRequestAccessDenied(
                    this.props.messagingProvider, queryProps.workspace.id, 'ContainerNodeListQuery');
            }

            this.telemetry.logException(
                error,
                'ContainerHostHierarchyGrid.tsx',
                ErrorSeverity.Error,
                ContainerGridBase.getGridQueryDropdownSelections(queryProps),
                undefined
            );

            this.props.onMaxRowsChanged(false, true);
            this.setState({ isLoading: false, isError: true }, () => this.props.onTabContentDataLoadError(error));
        }
    }
}
