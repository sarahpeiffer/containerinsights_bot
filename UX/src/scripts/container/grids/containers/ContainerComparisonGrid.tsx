/**
 * tpl
 */
import * as React from 'react';
import * as update from 'immutability-helper';
import { SGSortOrder, SGColumn, SGFormattedPlainCell, SGIconCell, SGDataRow } from 'appinsights-iframe-shared';
import { GUID } from '@appinsights/aichartcore';

/**
 * local
 */
import { ResourceType, GridDataProvider, SortColumn } from '../../data-provider/GridDataProvider';
import { KustoGridResponseInterpreter } from '../../data-provider/KustoGridResponseInterpreter';
import { ContainerHostMetricName } from '../../shared/ContainerMetricsStrings';
import { ContainerGridBase, GridSortOrder } from '../shared/ContainerGridBase';
import { ContainerMetrics } from '../../shared/ContainerMetrics';
import * as Constants from '../../shared/Constants';
import { SingleClusterTab } from '../../ContainerMainPage';
import { BladeLoadManager, PerformanceMeasure, QueryName } from '../../messaging/BladeLoadManager';
import { LoadTrackingTerminationReason } from '../../messaging/IBladeLoadManager';

/**
 * shared
 */
import { DisplayStrings, KustoGrainDisplay } from '../../../shared/DisplayStrings';
import { TimeInterval } from '../../../shared/data-provider/TimeInterval';
import { Grid } from '../../../shared/Grid'
import { GridLineObject, IGridLineObject } from '../../../shared/GridLineObject';
import { StringHelpers } from '../../../shared/Utilities/StringHelpers';
import { SGFormattedColoredCell, SGTabChangeLinkCell } from '../../../shared/ColoredChartCell';
import { FixedMaxValueMetricDescriptor } from '../../../shared/MetricDescriptor';
import { MetricValueFormatter } from '../../../shared/MetricValueFormatter';
import { ITelemetry, TelemetryMainArea, IFinishableTelemetry } from '../../../shared/Telemetry';
import { TelemetryFactory } from '../../../shared/TelemetryFactory';
import { ErrorSeverity } from '../../../shared/data-provider/TelemetryErrorSeverity';
import { AggregationOption } from '../../../shared/AggregationOption';

import { SGTrendChartCell } from '../shared/SGTrendChartCell';
import { IMetaDataBase, RowType } from '../../shared/metadata/Shared';
import { SGDataRowExt } from '../shared/SgDataRowExt';
import { IContainerGridProps } from '../shared/IContainerGridProps';
import { IContainerGridState } from '../shared/IContainerGridState';
import { HttpRequestError } from '../../../shared/data-provider/HttpRequestError';

/**
 * Stylesheets
 */
import '../../../../styles/container/GridPaneContainer.less';

/**
 * SVGs
 */
import { ContainerSVG } from '../../../shared/svg/container';
import { VirtualContainerSvg } from '../../../shared/svg/virtualContainer';
import { EnvironmentConfig } from '../../../shared/EnvironmentConfig';
import { SortHelper } from '../../../shared/SortHelper';
import { ContainerMetaDataLegacy } from '../../shared/metadata/ContainerMetaDataLegacy';
import { ContainerQueryConstants } from '../../data-provider/QueryTemplates/ContainerQueryTemplate';
import { SystemRowMetaData } from '../../shared/metadata/SystemRowMetaData';

/**
 * Constants
 */
const DEFAULT_PROP_COL_HEADER_WIDTH: number = 75;
const DEFAULT_START_MAX_RESULT: number = 10000;
const DEFAULT_MAX_RESULT_COUNT: number = 10000;

export class ContainerComparisonGrid extends React.Component<IContainerGridProps, IContainerGridState> {
    private dataProvider: GridDataProvider;
    private telemetry: ITelemetry;
    private responseInterpreter: KustoGridResponseInterpreter;
    private pendingQuerySequenceNumber: number;

    constructor(props: IContainerGridProps) {
        super(props);

        this.pendingQuerySequenceNumber = 0;

        this.dataProvider = ContainerGridBase.createDataProvider();
        this.responseInterpreter = new KustoGridResponseInterpreter(this.telemetry);

        this.state = {
            timeInterval: new TimeInterval(this.props.startDateTimeUtc, this.props.endDateTimeUtc, Constants.IdealGridTrendDataPoints),
            displayedMetricName: props.metricName || ContainerHostMetricName.CpuCoreUtilization,
            displayedAggregationOption: props.aggregationOption || AggregationOption.P95,
            canLoadMore: false,
            isLoading: true,
            isError: false,
            gridData: [],
        };

        this.onSortColumnChanged = this.onSortColumnChanged.bind(this);
        this.onSortOrderChanged = this.onSortOrderChanged.bind(this);
    }

    public static getGridQuerySortColumn(gridSortColumnIndex: number, metricName: string): SortColumn {
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
            case 4: // Pod
                sortColumn = SortColumn.Pod;
                break;
            case 5: // NodeName
                sortColumn = SortColumn.Node;
                break;
            case 6: // Restarts
                sortColumn = SortColumn.Restarts;
                break;
            case 7: // UpTime column
                sortColumn = SortColumn.UpTime;
                break;
            default:
                throw new Error('Invalid sort column index of ' + gridSortColumnIndex);
        }

        return sortColumn;
    }

    public static toGridData(
        result: IGridLineObject<ContainerMetaDataLegacy>[][],
        queryProps: IContainerGridProps,
        valuePrefix?: string
    ): SGDataRowExt[] {
        const rows = new Array<SGDataRowExt>();
        let currentRow: SGDataRowExt;

        if (result && (result.length > 0)) {

            if (result.length >= ContainerQueryConstants.MaxContainerRows) {
                rows.push(ContainerComparisonGrid.dataOverflowRow('.dataOverflow', ContainerQueryConstants.MaxContainerRows));
            }

            for (let i = 0; i < result.length; i++) {
                if (valuePrefix) {
                    currentRow = new SGDataRowExt(result[i], `${valuePrefix};${i}`);
                    currentRow.children = [];
                    rows.push(currentRow);
                } else {
                    currentRow = new SGDataRowExt(result[i], i);
                    currentRow.children = [];
                    rows.push(currentRow);
                }
            }
        }

        return rows;
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
            SystemRowMetaData.metaWrapperHelper(null, systemRowMeta),
        ];

        const rowLoading = new SGDataRowExt(blankLoadFailureRow, overflowKey);
        rowLoading.children = null;

        return rowLoading;
    }

    public componentWillReceiveProps(nextProps: Readonly<IContainerGridProps>, nextContext: any): void {
        if (ContainerGridBase.shouldRequeryGridData(nextProps, this.props)) {
            this.queryGridData(nextProps, DEFAULT_START_MAX_RESULT);
        }
    }

    public render(): JSX.Element {
        if (EnvironmentConfig.Instance().isConfigured()) {
            if (!this.telemetry) {
                this.telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
            }
        }

        // For displaying the number of items in the current state of the grid
        const filterGridData = ContainerGridBase.filterGridData(update(this.state.gridData, {}), this.props.nameSearchFilterValue,
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
                    metric={ContainerMetrics.get(this.state.displayedMetricName).descriptor}
                    canLoadMore={this.state.canLoadMore}
                    isLoading={this.state.isLoading}
                    isError={this.state.isError}
                    gridData={filterGridData}
                    maxRowsCurrent={this.props.maxRowsCurrent}
                    sortColumnIndex={this.props.sortColumnIndex}
                    sortDirection={this.props.sortOrder === GridSortOrder.Asc ? 0 : 1}
                    onSortColumnChanged={this.onSortColumnChanged}
                    onSortOrderChanged={this.onSortOrderChanged}
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
    public componentDidMount() {
        if (!EnvironmentConfig.Instance().isConfigured()) {
            throw new Error('The component mounted, but grid data could not be queried \
            because the environment config had not been configured yet')
        }
        this.queryGridData(this.props, DEFAULT_START_MAX_RESULT);
    }

    /**
     * Calls onGridRowSelected, which will execute the custom behavior that CI wants from SG,
     * i.e., query for PP data and open the PP.
     * This function performs the extra step of making sure no other row is selected, besides the one
     * that was most recently selected by the user.
     * This function is here and not incorporated with the onGridRowSelected in ContainerMainPage because
     * ContainerMainPage doesn't have access to gridData
     * @param rowValue the index value of the row in grid
     * @param state state of ContainerComparisonGrid when onGridRowSelected is called
     */
    private onGridRowSelected(rowValue: any, state: IContainerGridState): void {
        let gridDataCopy = Object.assign([], state.gridData);

        ContainerGridBase.unselectGridDataRows(gridDataCopy);

        let selectedRow: SGDataRow;
        gridDataCopy.forEach((row) => {
            if (row.value === rowValue) {
                selectedRow = row;
            }
        });
        selectedRow.selected = true;

        this.props.onGridRowSelected(selectedRow);
        this.setState({ gridData: gridDataCopy })
    }

    /**
    * get the column definition based on the selected aggregationOption
    * @param selectedAggregationOption
    */
    private getColumnDefinition(selectedAggregationOption: AggregationOption): SGColumn[] {
        let columnDefinitions = [];

        columnDefinitions.push({
            name: DisplayStrings.ComparisonGridColumnTitleName,
            width: 250,
            cell: SGIconCell((data) => {
                if (data instanceof GridLineObject) {
                    const castedData = data as IGridLineObject<ContainerMetaDataLegacy>;
                    return castedData.value;
                } else {
                    return data;
                }
            }, (data) => {
                const castedData = data as IGridLineObject<ContainerMetaDataLegacy>;

                if (castedData.metaData.rowType === RowType.System) {
                    return null;
                }

                if (castedData.metaData.isVirtual) {
                    return <VirtualContainerSvg />;
                } else {
                    return <ContainerSVG />;
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

                const castedMetaData = castedValue.metaData as ContainerMetaDataLegacy;

                const lastReported: any = castedValue.value.lastReported;

                const containerStatus = ContainerGridBase.getStatusOfContainer(lastReported,
                    castedMetaData.statusFixed,
                    castedMetaData.status,
                    castedValue.value.statusReason
                );
                const displayStatus: string | JSX.Element[] = containerStatus.displayStatus;
                const tooltipStatus: string = containerStatus.tooltipStatus;
                const tooltipStatusReason: string = !StringHelpers.isNullOrEmpty(containerStatus.tooltipStatusReason)
                    ? containerStatus.tooltipStatusReason
                    : '';

                const formattedLastReported = MetricValueFormatter.formatUpTimeValue(lastReported);
                const finalReport = StringHelpers.replaceAll(DisplayStrings.LastReportedNTimeAgo, '{0}', formattedLastReported);
                let tooltip = `${DisplayStrings.ComparisonGridColumnTitleHostStatus} ${tooltipStatus}`;
                if (!StringHelpers.isNullOrEmpty(containerStatus.tooltipStatusReason)) {
                    tooltip = tooltip + `\n${tooltipStatusReason}`;
                }
                tooltip = tooltip + `\n${finalReport}`;

                return <div className='sg-text' title={tooltip} aria-label={tooltip}>{displayStatus}</div>;
            },
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 1 ?
                ContainerGridBase.convertSortOrderToSgSortOrder(this.props.sortOrder) : undefined,
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
                SGFormattedColoredCell((data) => {
                    const castedData = data as IGridLineObject<ContainerMetaDataLegacy>;
                    if (!castedData || castedData.value === null || castedData.value === undefined) {
                        return '';
                    }
                    return MetricValueFormatter.formatPercentageValue(castedData.value);
                }, (data) => {
                    const castedData = data as IGridLineObject<ContainerMetaDataLegacy>;
                    if (!castedData || castedData.value === null || castedData.value === undefined) {
                        return '';
                    }
                    const x = new FixedMaxValueMetricDescriptor('', false, 100, undefined);
                    return x.getTrendBarColor(castedData.value)
                }, (data) => {
                    const castedData = data as IGridLineObject<ContainerMetaDataLegacy>;
                    if (!castedData || castedData.value === null || castedData.value === undefined) {
                        return -1;
                    }
                    return ContainerMetrics.get(this.state.displayedMetricName).descriptor.getTrendBarHeightFraction(castedData.value)
                }, () => {
                    return ContainerMetrics.get(this.state.displayedMetricName).descriptor.isHigherValueBetter
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
                const castedData = data as IGridLineObject<ContainerMetaDataLegacy>;
                if (!castedData || castedData.value === null || castedData.value === undefined) {
                    return '';
                }
                if (castedData.value === DisplayStrings.ContainerMissingPerfMetricTitle) { return data.value; }
                const float = parseFloat(castedData.value);
                return ContainerMetrics.get(this.state.displayedMetricName).descriptor.formatValue(float);
            }),
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 3 ?
                ContainerGridBase.convertSortOrderToSgSortOrder(this.props.sortOrder) : undefined,
            sortFunc: (a, b) => { return ContainerGridBase.gridSortValue(a, b, this.props); },
            infoText: DisplayStrings.ContainerColumnHeaderAverageTooltip
        });

        columnDefinitions.push({
            name: DisplayStrings.ComparisonGridColumnTitlePods,
            width: 125,
            cell: SGTabChangeLinkCell(
                ({ value }) => value,
                (event, value) => {
                    if (value &&
                        value.value &&
                        value.metaData &&
                        !StringHelpers.equal(value.value, '-')) {
                        if (value.metaData.controllerName && value.metaData.controllerKind) {
                            this.props.onTabSelectionChanged(SingleClusterTab.Controller, value.metaData.controllerName
                                + ' (' + value.metaData.controllerKind + ')');
                        } else {
                            this.props.onTabSelectionChanged(SingleClusterTab.Controller,
                                DisplayStrings.NoAssociatedController);
                        }
                    }
                    return;
                }),
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 4 ?
                ContainerGridBase.convertSortOrderToSgSortOrder(this.props.sortOrder) : undefined,
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
            },
        });

        columnDefinitions.push({
            name: DisplayStrings.ComparisonGridColumnTitleNodeName,
            width: 125,
            cell: SGTabChangeLinkCell(
                ({ value }) => value,
                (event, value) => {
                    if (value && value.value && !StringHelpers.equal(value.value, '-')) {
                        this.props.onTabSelectionChanged(SingleClusterTab.Node, value.value);
                    }
                    return;
                }),
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 5 ?
                ContainerGridBase.convertSortOrderToSgSortOrder(this.props.sortOrder) : undefined,
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
            },
        });


        columnDefinitions.push({
            name: DisplayStrings.ComparisonGridColumnTitleRestarts,
            width: 75,
            cell: SGFormattedPlainCell((data) => {
                const castedData = data as IGridLineObject<ContainerMetaDataLegacy>;
                if (!castedData || castedData.value === null || castedData.value === undefined) {
                    return '';
                }
                return castedData.value;
            }),
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 6 ?
                ContainerGridBase.convertSortOrderToSgSortOrder(this.props.sortOrder) : undefined,
            sortFunc: (a, b) => { return ContainerGridBase.gridSortValue(a, b, this.props); },
        });

        columnDefinitions.push({
            name: DisplayStrings.ComparisonGridColumnTitleUpTime,
            width: 80,
            cell: SGFormattedPlainCell((data) => {
                const castedData = data as IGridLineObject<ContainerMetaDataLegacy>;
                if (!castedData || castedData.value === null || castedData.value === undefined) {
                    return '';
                }
                return MetricValueFormatter.formatUpTimeValue(castedData.value);
            }),
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 7 ?
                ContainerGridBase.convertSortOrderToSgSortOrder(this.props.sortOrder) : undefined,
            sortFunc: (a, b) => { return ContainerGridBase.gridSortValue(a, b, this.props); },
            infoText: DisplayStrings.ContainerComparisonGridColumnHeaderUpTimeTooltip
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
            width: 200,
            cell: SGTrendChartCell(this.state, Constants.SGColumnWidthPxForTrendChartsInContainerInsights),
            infoText: DisplayStrings.ContainerComparisonGridColumnHeaderTrendTooltip,
            className: 'sg-barchart'
        });

        return columnDefinitions;
    }

    private onSortColumnChanged(sortColumnIndex: number) {
        // calculate default sort order for the column
        let sortOrder = ContainerMetrics.get(this.props.metricName).descriptor.isHigherValueBetter
            ? SGSortOrder.Ascending
            : SGSortOrder.Descending;

        // bbax: sort by text should always start ascending
        if (sortColumnIndex === SortColumn.ContainerName ||
            sortColumnIndex === SortColumn.Pod ||
            sortColumnIndex === SortColumn.Node) {
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
            'kustoContainerListLoad',
            eventProps,
            undefined
        );
        const gridQueryTelemetry = this.telemetry.startLogEvent(
            'containerListLoad',
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
            ContainerComparisonGrid.getGridQuerySortColumn(queryProps.sortColumnIndex, queryProps.metricName),
            ContainerGridBase.getGridQuerySortOrder(queryProps.sortOrder),
            ResourceType.Container,
            queryProps.aggregationOption,
            null,
            maxResultCount,
            requestId,
            'containerList',
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
            BladeLoadManager.Instance().terminateLoadTracking(LoadTrackingTerminationReason.QueryFailure);
            kustoQueryTelemetry.complete({ isError: 'true' });

            this.handleQueryGridDataFailure(
                error,
                thisQuerySequenceNumber,
                queryProps
            )
        });
    }

    private handleQueryGridDataSuccess(
        data: any,
        thisQuerySequenceNumber: number,
        queryProps: IContainerGridProps,
        timeInterval: TimeInterval,
        maxResultCount: number,
        gridQueryTelemetry: IFinishableTelemetry
    ): void {
        // check to see if component expects result of this query
        // and don't do anything in case subsequent query was issued
        // before receiving this query results
        if (thisQuerySequenceNumber === this.pendingQuerySequenceNumber) {
            const result = this.responseInterpreter.processContainerGridQueryResult(data);

            const gridData = ContainerComparisonGrid.toGridData(result, queryProps) || [];

            if (gridData.length === 0) {
                // report props panel loading completed if no grid rows are there to display
                BladeLoadManager.Instance().queryCompleted(QueryName.PropertyPanel);
            }

            this.setState({
                timeInterval,
                displayedMetricName: queryProps.metricName,
                displayedAggregationOption: queryProps.aggregationOption,

                isLoading: false,
                isError: false,
                gridData: gridData,

                // do not display 'load more' link if tried to load all records
                // without specifying the default maximum count
                canLoadMore: (maxResultCount === DEFAULT_START_MAX_RESULT) &&
                    (gridData.length >= maxResultCount),
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
                    this.props.messagingProvider, queryProps.workspace.id, 'ContainerListQuery');
            }

            this.telemetry.logException(
                error,
                'ContainerComparisonGrid.tsx',
                ErrorSeverity.Error,
                ContainerGridBase.getGridQueryDropdownSelections(queryProps),
                undefined
            );
            this.setState({ isLoading: false, isError: true }, () => this.props.onTabContentDataLoadError(error));
        }
    }
}

