/**
 * tpl
 */
import * as React from 'react';
import * as update from 'immutability-helper';
import * as Constants from '../../shared/Constants';
import { GUID } from '@appinsights/aichartcore';
import { SGSortOrder, SGColumn, SGFormattedPlainCell, SGIconCell } from 'appinsights-iframe-shared';

/**
 * local
 */
import { ResourceType, GridDataProvider, SortColumn } from '../../data-provider/GridDataProvider';
import { KustoGridResponseInterpreter } from '../../data-provider/KustoGridResponseInterpreter';
import { BladeLoadManager, PerformanceMeasure, QueryName } from '../../messaging/BladeLoadManager';
import { LoadTrackingTerminationReason } from '../../messaging/IBladeLoadManager';

/**
 * shared
 */
import { SGTrendChartCell } from '../shared/SGTrendChartCell';
import { GridSortOrder, ContainerGridBase } from '../shared/ContainerGridBase';
import { SGDataRowExt } from '../shared/SgDataRowExt';
import { ContainerHostMetrics } from '../../shared/ContainerHostMetrics';
import { ContainerHostMetricName } from '../../shared/ContainerMetricsStrings';
import { DisplayStrings, KustoGrainDisplay } from '../../../shared/DisplayStrings';
import { Grid } from '../../../shared/Grid';
import { TimeInterval } from '../../../shared/data-provider/TimeInterval';
import { StringHelpers } from '../../../shared/Utilities/StringHelpers';
import { SGFormattedColoredCellContainers, SGTabChangeLinkCell } from '../../../shared/ColoredChartCell';
import { FixedMaxValueMetricDescriptor } from '../../../shared/MetricDescriptor';
import { MetricValueFormatter } from '../../../shared/MetricValueFormatter';
import { TelemetryMainArea, ITelemetry, IFinishableTelemetry } from '../../../shared/Telemetry';
import { TelemetryFactory } from '../../../shared/TelemetryFactory';
import { ErrorSeverity } from '../../../shared/data-provider/TelemetryErrorSeverity';
import { RowType, IMetaDataBase } from '../../shared/metadata/Shared';
import { AggregationOption } from '../../../shared/AggregationOption';
import { ContainerMetaData } from '../../shared/metadata/ContainerMetaData';
import { ControllerMetaData } from '../../shared/metadata/ControllerMetaData';
import { IGridLineObject } from '../../../shared/GridLineObject';
import { IContainerGridProps } from '../shared/IContainerGridProps';
import { IContainerGridState } from '../shared/IContainerGridState';
import { HttpRequestError } from '../../../shared/data-provider/HttpRequestError';

/**
 * styles
 */
import '../../../../styles/container/GridPaneContainer.less';

/**
 * svg
 */
import { ContainerSVG } from '../../../shared/svg/container';
import { PodSVG } from '../../../shared/svg/pod';
import { ControllerResourceSVG } from '../../../shared/svg/controller-resource';
import { VirtualContainerSvg } from '../../../shared/svg/virtualContainer';
import { VirtualPodSvg } from '../../../shared/svg/virtualPod';
import { SingleClusterTab } from '../../ContainerMainPage';
import { EnvironmentConfig } from '../../../shared/EnvironmentConfig';
import { SortHelper } from '../../../shared/SortHelper';
import { SystemRowMetaData } from '../../shared/metadata/SystemRowMetaData';
import { BlueLoadingDotsSize, BlueLoadingDots } from '../../../shared/blue-loading-dots';
// import FunctionGates from '../../../shared/Utilities/FunctionGates';
import { ControllerQueryConstants } from '../../data-provider/QueryTemplates/ControllerQueryTemplate';
import { PodMetaData } from '../../shared/metadata/PodMetaData';

/**
 * constants
 */
const DEFAULT_MAX_RESULT_COUNT: number = 10000;
const DEFAULT_PROP_COL_HEADER_WIDTH: number = 75;
const TREND_CHART_GRID_COLUMN_WIDTH: number = 200;

enum ControllerHierarchyGridColumns {
    Name,
    Status,
    AggregationPercent,
    Aggregation,
    Containers,
    Restarts,
    Uptime,
    Node
}

interface IContainerControllerHierarchyGridState extends IContainerGridState {
    gridIndexHash: StringMap<SGDataRowExt>;
    haveExpandedAllRows: boolean;
}

export class ContainerControllerHierarchyGrid extends React.Component<IContainerGridProps, IContainerControllerHierarchyGridState> {
    private dataProvider: GridDataProvider;
    private telemetry: ITelemetry;
    private responseInterpreter: KustoGridResponseInterpreter;
    private pendingQuerySequenceNumber: number;

    // private throttledGridQuery: (nextProps: Readonly<IContainerGridProps>, maxResultCount?: number) => void;

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
            haveExpandedAllRows: false
        };

        this.onExpandLoadChildren = this.onExpandLoadChildren.bind(this);
        this.onSortColumnChanged = this.onSortColumnChanged.bind(this);
        this.onSortOrderChanged = this.onSortOrderChanged.bind(this);

        // this.throttledGridQuery = FunctionGates.CreateDebouncedFunction(this.queryGridData.bind(this), 500);
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
            case 5: // Restarts
                sortColumn = SortColumn.Restarts;
                break;
            case 6: // UpTime
                sortColumn = SortColumn.UpTime;
                break;
            default:
                throw new Error('Invalid sort column index of ' + gridSortColumnIndex);
        }

        return sortColumn;
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
     * Finally turns the data from Kusto, interpreted and hashed, into SGDataRows which Selectable Grid can understand
     * @param hashResult data from Kusto, after having been interpreted and nested in an object, i.e. { controllers: pods: [containers]}
     */
        private static toGridData(queryResult: IGridLineObject<ControllerMetaData>[][]): SGDataRowExt[] {
        const gridRows = new Array<SGDataRowExt>();

        let maxRows = ControllerQueryConstants.MaxControllerRows;
        if (queryResult && queryResult.length >= (maxRows)) {
            gridRows.push(ContainerControllerHierarchyGrid.dataOverflowRow(maxRows));
        }

        if (queryResult && (queryResult.length > 0)) {
            for (let i = 0; i < queryResult.length; i++) {
                const nodeKey = `${i}`;
                const row = new SGDataRowExt(queryResult[i], nodeKey);
                ContainerControllerHierarchyGrid.insertChildLoadingRow(row, nodeKey);
                row.expanded = false;
                gridRows.push(row);
            }
        }

        return gridRows;
    }

    private static toGridDataChild(queryResult: IGridLineObject<PodMetaData>[][], index: number, targetRow: SGDataRowExt): void {
        const gridRows = [];

        let maxRows = ControllerQueryConstants.MaxPodRows;

        let startingIndex = 0;
        if (queryResult && queryResult.length >= (maxRows)) {
            gridRows.push(ContainerControllerHierarchyGrid.dataOverflowRow(maxRows));
            startingIndex++;
        }

        if (queryResult && (queryResult.length > 0)) {
            for (let i = 0; i < queryResult.length; i++) {
                const nodeKey = `${index};${i + startingIndex}`;
                const parentPod = queryResult[i];
                const row = new SGDataRowExt(queryResult[i], nodeKey);
                row.children = ContainerControllerHierarchyGrid.loadGridDataContainerChildren(parentPod[0].metaData, index,
                    i + startingIndex);

                if (row.children.length > 0) {
                    row.expanded = true;
                } else {
                    row.expanded = false;
                }
                gridRows.push(row);
            }
        }

        targetRow.children = gridRows;
    }

    private static loadGridDataContainerChildren(parentPod: PodMetaData, indexController, indexPod): SGDataRowExt[] {
        if (!parentPod.containers || parentPod.containers.length < 1) {
            return [];
        }

        const gridRows = [];

        let maxRows = ControllerQueryConstants.MaxContainerRows;

        let startingIndex = 0;
        if (parentPod.containers && parentPod.containers.length >= (maxRows)) {
            gridRows.push(ContainerControllerHierarchyGrid.dataOverflowRow(maxRows));
            startingIndex++;
        }

        if (parentPod.containers && (parentPod.containers.length > 0)) {
            for (let i = 0; i < parentPod.containers.length; i++) {
                const nodeKey = `${indexController};${indexPod};${i + startingIndex}`;
                const row = new SGDataRowExt(parentPod.containers[i].formatControllerRow(), nodeKey);
                row.children = null;
                row.expanded = false;
                gridRows.push(row);
            }
        }
        return gridRows;
    }

    private static dataOverflowRow(maxRowsOfData: number): SGDataRowExt {
        const loadingKeyForNode = `.dataOverflowRow`;

        const systemRowMeta = new SystemRowMetaData();

        const blankLoadFailureRow = [
            SystemRowMetaData.metaWrapperHelper(
                // tslint:disable:max-line-length
                <div className='sg-row-data-overflow' onClick={(evt) => {
                    evt.stopPropagation();
                }}>
                    The query returned {maxRowsOfData} or more rows of data.  Please filter the data above to see all rows.
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

        const rowLoading = new SGDataRowExt(blankLoadFailureRow, loadingKeyForNode);
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
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
        ];

        const rowLoading = new SGDataRowExt(blankLoadFailureRow, loadingKeyForNode);
        row.children = [];
        row.children.push(rowLoading);
        row.expanded = false;
    }

    /**
     * Checks for valid nextProps. If valid, query for grid data
     * @param nextProps 
     * @param nextContext 
     **/
    public componentWillReceiveProps(nextProps: Readonly<IContainerGridProps>, nextContext: any): void {
        if (ContainerGridBase.shouldRequeryGridData(nextProps, this.props)) {
            this.queryGridData(nextProps, DEFAULT_MAX_RESULT_COUNT);
            // this.throttledGridQuery(nextProps, DEFAULT_MAX_RESULT_COUNT);
        }
    }

    public render(): JSX.Element {
        // Set telemetry
        if (EnvironmentConfig.Instance().isConfigured()) {
            if (!this.telemetry) {
                this.telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
            }
        }

        // For displaying the number of items in the current state of the grid
        let filterGridData = ContainerGridBase.filterGridData(update(this.state.gridData, {}), this.props.nameSearchFilterValue,
            false, false);

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
                    maxRowsCurrent={this.props.maxRowsCurrent}
                    gridData={filterGridData}
                    sortColumnIndex={this.props.sortColumnIndex}
                    sortDirection={this.props.sortOrder === GridSortOrder.Asc ? 0 : 1}
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
                    expandRows={this.state.haveExpandedAllRows ? this.state.gridData.map(row => row.value) : []}
                />
            </div>
        );
    }

    /**
     * React lifecycle method, a hook that activates right after the component has been injected into the DOM 
     * nibs: Have to hope our UX has received the cloud env from Monex msg and configured our env config, else we cannot query for data
     */
    public componentDidMount() {
        if (!EnvironmentConfig.Instance().isConfigured()) {
            throw new Error('The component mounted, but grid data could not be queried \
            because the environment config had not been configured yet')
        }
        this.queryGridData(this.props, DEFAULT_MAX_RESULT_COUNT);
    }

    public componentDidUpdate(
        prevProps: IContainerGridProps, 
        prevState: IContainerControllerHierarchyGridState, 
        snapshot
    ) {
        // we just want this to run once
        // we know we have a controllerName prop from nav because controllerName !== '' and controllerName is only set on nav for now
        // users cannot add a controllerName pill for themselves
        // after onExpandLoadChildren (network call) completes we set expandRows to gridData.map(row => row.value)
        // This update tells grid which rows it can and should expand
        if (this.state.gridData.length > 0 && this.props.controllerName !== '' && !this.state.haveExpandedAllRows) {
            this.state.gridData.forEach(row => {
                this.onExpandLoadChildren([row.value], false);
            });
        }
    }
    /**
     * Calls onGridRowSelected, which will execute the custom behavior that CI wants from SG,
     * i.e., query for PP data and open the PP. 
     * This function performs the extra step of making sure no other row is selected, besides the one 
     * that was most recently selected by the user.
     * This function is here and not incorporated with the onGridRowSelected in ContainerMainPage because
     * ContainerMainPage doesn't have access to gridData
     * @param rowValue the index value of the row in grid 
     * @param state state of ContainerControllerHierarchyGrid when onGridRowSelected is called
     */
    private onGridRowSelected(rowValue: any, state: IContainerGridState): void {
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
            this.onExpandLoadChildren([rowValue], false);
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

    private loadBlankRowForNoChildData(targetRow: SGDataRowExt, index: string, message: string, error: boolean) {

        if (error) {
            this.telemetry.logException(new Error('ContainerControllerHierarchyGrid.load.blank'), 'ContainerControllerHierarchyGrid',
                ErrorSeverity.Fatal, undefined, undefined);
        }

        const blankEntryKey = `${index}.blankentry`;

        const systemRowMeta = new SystemRowMetaData();

        const blankLoadFailureRow = [
            SystemRowMetaData.metaWrapperHelper(message, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
        ];

        const blankPodRow = new SGDataRowExt(blankLoadFailureRow, `${blankEntryKey}`);
        if (!targetRow.children) { targetRow.children = []; }
        targetRow.children.push(blankPodRow);
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

        const fullNameColumn: IGridLineObject<ControllerMetaData> = targetRow.columnData[ControllerHierarchyGridColumns.Name] || {};
        const nameColumnMetaData: ControllerMetaData = fullNameColumn.metaData || ({} as any);

        let controllerName: string = nameColumnMetaData.controllerName;
        if (!controllerName) {
            controllerName = 'Pods without controllers';
        }

        const controllerId: string = nameColumnMetaData.controllerId;

        // Start telemetry
        const customProperties = ContainerGridBase.getGridQueryDropdownSelections(this.props);
        const requestId = GUID().toLowerCase();

        customProperties.requestId = requestId;
        customProperties.host_name = controllerName.toString();

        const kustoQueryTelemetry = this.telemetry.startLogEvent('kustoContainerControllerHierarchyChildrenLoad',
            customProperties,
            undefined);

        const gridQueryTelemetry = this.telemetry.startLogEvent('containerControllerHierarchyChildrenLoad',
            customProperties,
            undefined);

        // Query for root row's children's data
        this.dataProvider.getResourceList(
            this.props.workspace,
            this.props.clusterName,
            this.props.clusterResourceId,
            this.props.nameSpace,
            this.props.serviceName,
            this.props.hostName,
            controllerId,
            this.props.controllerName,
            this.props.controllerKind,
            this.props.nodePool,
            this.state.timeInterval,
            containerMetric,
            ContainerControllerHierarchyGrid.getGridQuerySortColumn(this.props.sortColumnIndex),
            ContainerGridBase.getGridQuerySortOrder(this.props.sortOrder),
            ResourceType.ControllerChildren,
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

            this.onloadChildrenSuccess(targetRow, childrenData, index, this.state.timeInterval, this.props)
                .then(() => { 
                    gridQueryTelemetry.complete(); 
                    if (this.props.controllerName !== '' && !this.state.haveExpandedAllRows) {
                        this.setState({ haveExpandedAllRows: true }); 
                    }
                })
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

    /**
     * get the column definition based on the selected aggregationOption
     * @param selectedAggregationOption 
     **/
    private getColumnDefinition(selectedAggregationOption: AggregationOption): SGColumn[] {
        let columnDefinitions = [];

        columnDefinitions.push({
            name: DisplayStrings.ComparisonGridColumnTitleName,
            width: 280,
            cell: SGIconCell((data) => {
                const castedData = data as IGridLineObject<ContainerMetaData>;
                return castedData.value;
            }, (data) => {
                const castedData = data as IGridLineObject<ContainerMetaData>;

                if (castedData.metaData.rowType === RowType.System) {
                    return null;
                }

                if (castedData && castedData.metaData) {
                    if (castedData.metaData.containerName) {
                        if (castedData.metaData.isVirtual) {
                            return <VirtualContainerSvg />
                        } else {
                            return <ContainerSVG />;
                        }
                    } else if (castedData.metaData.podName) {
                        if (castedData.metaData.isVirtual) {
                            return <VirtualPodSvg />
                        } else {
                            return <PodSVG />;
                        }
                    } else {
                        return <ControllerResourceSVG />;
                    }
                } else {
                    return undefined;
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
            width: 150,
            cell: ({ value }) => {
                const castedValue = value as IGridLineObject<IMetaDataBase>;

                if (!value || !castedValue.metaData || castedValue.value == null) {
                    return <div className='sg-text'></div>;
                }

                let displayStatus: string | JSX.Element[];
                let tooltipStatus: string;
                let tooltipStatusReason: string = '';
                const lastReported: any = castedValue.metaData.lastReported;
                switch (castedValue.metaData.rowType) {
                    case RowType.Controller:
                        const { result, tooltip } = ContainerGridBase.getStatusOfController(castedValue.value) as any;
                        displayStatus = result;
                        return <div className='sg-text' title={tooltip}>{displayStatus}</div>;
                    case RowType.Pod:
                        const podStatus = ContainerGridBase.getStatusOfPod(lastReported, castedValue.value.status);
                        displayStatus = podStatus.displayStatus;
                        tooltipStatus = podStatus.tooltipStatus;
                        break;
                    case RowType.Container:
                        const castedMetaData = castedValue.metaData as ContainerMetaData;
                        const containerStatus = ContainerGridBase.getStatusOfContainer(
                            lastReported,
                            castedMetaData.statusFixed,
                            castedMetaData.status,
                            castedValue.value.statusReason
                        );
                        tooltipStatusReason = !StringHelpers.isNullOrEmpty(containerStatus.tooltipStatusReason)
                            ? containerStatus.tooltipStatusReason
                            : '';
                        displayStatus = containerStatus.displayStatus;
                        tooltipStatus = containerStatus.tooltipStatus;
                        break;

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
                    const castedData = data as IGridLineObject<ContainerMetaData>;
                    if (!castedData || castedData.value === null || castedData.value === undefined) {
                        return '';
                    }
                    return MetricValueFormatter.formatPercentageValue(castedData.value);
                }, (data) => {
                    const castedData = data as IGridLineObject<ContainerMetaData>;
                    if (!castedData || castedData.value === null || castedData.value === undefined) {
                        return '';
                    }
                    const x = new FixedMaxValueMetricDescriptor('', false, 100, undefined);
                    return x.getTrendBarColor(castedData.value)
                }, (data) => {
                    const castedData = data as IGridLineObject<ContainerMetaData>;
                    if (!castedData || castedData.value === null || castedData.value === undefined) {
                        return -1;
                    }
                    return ContainerHostMetrics.get(this.state.displayedMetricName).descriptor.getTrendBarHeightFraction(castedData.value)
                }, () => {
                    return ContainerHostMetrics.get(this.state.displayedMetricName).descriptor.isHigherValueBetter
                }),

            sortable: true,
            sortOrder: this.props.sortColumnIndex === 2 ?
                ContainerGridBase.convertSortOrderToSgSortOrder(this.props.sortOrder) : undefined,
            sortFunc: (a, b) => { return ContainerGridBase.gridSortValue(a, b, this.props); },
            infoText: DisplayStrings.ContainerColumnHeaderAvgPercentTooltip
        });

        columnDefinitions.push({
            name: aggregationTitle,
            width: 85,
            cell: SGFormattedPlainCell((data) => {
                const castedData = data as IGridLineObject<ContainerMetaData>;
                if (!castedData || castedData.value === null || castedData.value === undefined) {
                    return '';
                }
                if (castedData.value === DisplayStrings.ContainerMissingPerfMetricTitle) { return data.value; }
                const float = parseFloat(castedData.value);
                return ContainerHostMetrics.get(this.state.displayedMetricName).descriptor.formatValue(float);
            }),
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 3 ?
                ContainerGridBase.convertSortOrderToSgSortOrder(this.props.sortOrder) : undefined,
            sortFunc: (a, b) => { return ContainerGridBase.gridSortValue(a, b, this.props); },
            infoText: DisplayStrings.ContainerColumnHeaderAverageTooltip
        });

        columnDefinitions.push({
            name: DisplayStrings.ComparisonGridColumnTitleContainerCount,
            width: 95,
            cell: SGFormattedPlainCell((data) => {
                const castedData = data as IGridLineObject<ContainerMetaData>;
                if (!castedData || castedData.value === null || castedData.value === undefined) {
                    return '';
                }
                return castedData.value;
            }),
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 4 ?
                ContainerGridBase.convertSortOrderToSgSortOrder(this.props.sortOrder) : undefined,
            sortFunc: (a, b) => { return ContainerGridBase.gridSortValue(a, b, this.props); },
        });

        columnDefinitions.push({
            name: DisplayStrings.ComparisonGridColumnTitleRestarts,
            width: 75,
            cell: SGFormattedPlainCell((data) => {
                const castedData = data as IGridLineObject<ContainerMetaData>;
                if (!castedData || castedData.value === null || castedData.value === undefined) {
                    return '';
                }
                return castedData.value;
            }),
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 5 ?
                ContainerGridBase.convertSortOrderToSgSortOrder(this.props.sortOrder) : undefined,
            sortFunc: (a, b) => { return ContainerGridBase.gridSortValue(a, b, this.props); },
        });

        columnDefinitions.push({
            name: DisplayStrings.ComparisonGridColumnTitleUpTime,
            width: 80,
            cell: SGFormattedPlainCell((data) => {
                const castedData = data as IGridLineObject<ContainerMetaData>;
                if (!castedData || castedData.value === null || castedData.value === undefined) {
                    return '';
                }
                return (typeof castedData.value === 'number') ? MetricValueFormatter.formatUpTimeValue(castedData.value) : castedData.value;
            }),
            infoText: DisplayStrings.ContainerControllerHierarchyGridColumnHeaderUpTimeTooltip,
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 6 ?
                ContainerGridBase.convertSortOrderToSgSortOrder(this.props.sortOrder) : undefined,
            sortFunc: (a, b) => { return ContainerGridBase.gridSortValue(a, b, this.props); },
        });

        columnDefinitions.push({
            name: DisplayStrings.ComparisonGridColumnTitleNodeName,
            width: 125,
            cell: SGTabChangeLinkCell(
                ({ value }) => {
                    if (value && value.value && StringHelpers.equal(value.value, 'unscheduled')) {
                        value.value = DisplayStrings.unscheduled;
                    }
                    return value;
                },
                (event, value) => {
                    if (value && value.value && !StringHelpers.equal(value.value, '-')) {
                        this.props.onTabSelectionChanged(SingleClusterTab.Node, value.value);
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
            width: TREND_CHART_GRID_COLUMN_WIDTH,
            cell: SGTrendChartCell(this.state, Constants.SGColumnWidthPxForTrendChartsInContainerInsights),
            infoText: DisplayStrings.ContainerControllerHierarchyGridColumnHeaderTrendTooltip,
            className: 'sg-barchart'
        });

        return columnDefinitions;
    }

    private onSortColumnChanged(sortColumnIndex: number) {
        // calculate default sort order for the column
        let sortOrder = ContainerHostMetrics.get(this.props.metricName).descriptor.isHigherValueBetter
            ? SGSortOrder.Ascending
            : SGSortOrder.Descending;

        // bbax: sort by text should always start ascending
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
        this.queryGridData(this.props, DEFAULT_MAX_RESULT_COUNT);
    }

    private queryGridData(queryProps: IContainerGridProps, maxResultCount?: number): void {
        const thisQuerySequenceNumber: number = ++this.pendingQuerySequenceNumber;
        let totalRowsFromQuery: number = undefined;

        this.setState({ isLoading: true }, () => this.props.onTabContentLoadingStatusChange(true));

        const requestId = GUID().toLowerCase();
        let eventProps = ContainerGridBase.getGridQueryDropdownSelections(queryProps);
        eventProps.requestId = requestId;

        const kustoQueryTelemetry = this.telemetry.startLogEvent(
            'kustoContainerControllerHierarchyLoad',
            eventProps,
            undefined
        );
        const gridQueryTelemetry = this.telemetry.startLogEvent(
            'containerControllerHierarchyLoad',
            ContainerGridBase.getGridQueryDropdownSelections(queryProps),
            undefined
        );

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
            ContainerControllerHierarchyGrid.getGridQuerySortColumn(queryProps.sortColumnIndex),
            ContainerGridBase.getGridQuerySortOrder(queryProps.sortOrder),
            ResourceType.Controller,
            queryProps.aggregationOption,
            null,
            maxResultCount,
            requestId,
            'controllerList',
            'grid'
        ).then((data) => {
            BladeLoadManager.Instance().queryCompleted(QueryName.Grid);

            if (data && data.Tables && data.Tables.length > 1 && data.Tables[0].Rows) {
                totalRowsFromQuery = data.Tables[0].Rows.length;
            }

            kustoQueryTelemetry.complete(null, { totalRowsFromQuery: totalRowsFromQuery });

            this.handleQueryGridDataSuccess(
                data,
                thisQuerySequenceNumber,
                queryProps,
                timeInterval,
                maxResultCount,
                gridQueryTelemetry
            );
        }).catch((error) => {
            console.error(error);
            BladeLoadManager.Instance().terminateLoadTracking(LoadTrackingTerminationReason.QueryFailure);
            kustoQueryTelemetry.complete({ isError: 'true' });

            this.handleQueryGridDataFailure(
                error,
                thisQuerySequenceNumber,
                queryProps
            );
        });
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
                    this.props.messagingProvider, queryProps.workspace.id, 'ContainerControllerListQuery');
            }

            this.telemetry.logException(
                error,
                'ContainerControllerHierarchyGrid.tsx',
                ErrorSeverity.Error,
                ContainerGridBase.getGridQueryDropdownSelections(queryProps),
                undefined
            );
            this.setState({ isLoading: false, isError: true }, () => this.props.onTabContentDataLoadError(error));
        }
    }

    private handleQueryGridDataSuccess(
        data: any,
        thisQuerySequencyNumber: number,
        queryProps: IContainerGridProps,
        timeInterval: TimeInterval,
        maxResultCount: number,
        gridQueryTelemetry: IFinishableTelemetry
    ) {
        // check to see if component expects result of this query
        // and don't do anything in case subsequent query was issued
        // before receiving this query results
        if (thisQuerySequencyNumber === this.pendingQuerySequenceNumber) {
            const result: IGridLineObject<ControllerMetaData>[][] =
                this.responseInterpreter.processControllerGridQueryResult(data, timeInterval, queryProps.clusterResourceId);

            // ensure gridData is always an array since it is considered that way 
            // just below to figure out 'canLoadMore' state property
            const gridData = ContainerControllerHierarchyGrid.toGridData(result) || [];

            const gridIndexHash = ContainerControllerHierarchyGrid.hashGridDataIndices(gridData);

            if (gridData.length === 0) {
                // report props panel loading completed if no grid rows are there to display
                BladeLoadManager.Instance().queryCompleted(QueryName.PropertyPanel);
            }

            this.setState({
                timeInterval,
                displayedMetricName: queryProps.metricName,
                displayedAggregationOption: queryProps.aggregationOption,
                haveExpandedAllRows: false,
                isLoading: false,
                isError: false,
                gridData: gridData,
                gridIndexHash,
                // do not display 'load more' link if tried to load all records
                // without specifying the default maximum count
                canLoadMore: (maxResultCount === DEFAULT_MAX_RESULT_COUNT) &&
                    (gridData.length >= maxResultCount),
            }, () => {                                
                this.props.onTabContentLoadingStatusChange(false);
                gridQueryTelemetry.complete();
                ContainerGridBase.hackFixOSSVendorResizeBug();
            });
        }
    }

    private onloadChildrenSuccess(targetRow, childrenData, index, timeInterval, queryProps): Promise<any> {

        return new Promise((resolve, reject) => {
            const result: IGridLineObject<PodMetaData>[][] =
                this.responseInterpreter.processControllerChildrenGridQueryResult(childrenData, timeInterval, queryProps.clusterResourceId);

            // ensure gridData is always an array since it is considered that way 
            // just below to figure out 'canLoadMore' state property
            ContainerControllerHierarchyGrid.toGridDataChild(result, index, targetRow);

            this.setState({
                timeInterval,
                displayedMetricName: queryProps.metricName,
                displayedAggregationOption: queryProps.aggregationOption,

                isLoading: false,
                isError: false,
                // do not display 'load more' link if tried to load all records
                // without specifying the default maximum count
                canLoadMore: false,
            }, () => {
                this.props.onTabContentLoadingStatusChange(false);
                resolve();
            });
        });

    }

    private onLoadChildrenFailure(error, customProperties, targetRow, index) {

        console.error('Failed to load the children!', error);
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
}
