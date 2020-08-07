/**
 * Block imports
 */
import * as React from 'react';
import * as update from 'immutability-helper';
import findIndex = require('array.prototype.findindex');

/**
 * Compute imports
 */
import { FeatureMap } from './Constants';
import { ICommonComputeTabProps } from './ICommonComputeTabProps';
import { ComputeMetrics, ComputeMetricName } from './ComputeMetrics';

import { KustoGridResponseInterpreter } from './data-provider/KustoGridResponseInterpreter';
import { VmInsightsDataProvider, SortColumn, SortDirection } from './data-provider/VmInsightsDataProvider';

/**
 * Selectable Grid (EXTERNAL)
 */
import { SGDataRow, SGSortOrder, SGColumn, SGCellProps, SGIconCell, SGFormattedPlainCell } from 'appinsights-iframe-shared';

/**
 * Shared Imports
 */
import * as GlobalConstants from '../shared/GlobalConstants';
import { ComparisonGrid } from '../shared/ComparisonGrid';
import { ARMDataProvider } from '../shared/data-provider/ARMDataProvider';
import { KustoDataProvider, IKustoQueryOptions, DraftQueryResponse } from '../shared/data-provider/KustoDataProvider';
import { TimeInterval, ITimeInterval } from '../shared/data-provider/TimeInterval';
import { DisplayStrings } from '../shared/DisplayStrings';
import { IGridLineObject, GridLineObject } from '../shared/GridLineObject';
import { StringMap } from '../shared/StringMap';
import { ITelemetry, TelemetryMainArea } from '../shared/Telemetry';
import { VmInsightsTelemetryFactory } from '../shared/VmInsightsTelemetryFactory';
import { SubscriptionListManager } from '../shared/SubscriptionListManager';
import { ComputerGroupType, ComputerGroup } from '../shared/ComputerGroup';
import { RetryARMDataProvider } from '../shared/data-provider/RetryARMDataProvider';
import { RetryPolicyFactory } from '../shared/data-provider/RetryPolicyFactory';
import { QueryOnSelectHelper } from './shared/QueryOnSelectHelper';
import { ComputeKustoQueryOptions } from './shared/ComputeKustoQueryOptions';
import { TelemetryUtils } from './shared/TelemetryUtils';
import { KustoGrainDisplay } from '../shared/DisplayStrings';
import { AtScaleUtils } from './shared/AtScaleUtils';
import { SolutionType } from './shared/ControlPanelUtility';

import { StringHelpers } from '../shared/Utilities/StringHelpers';
import { BarChart } from '../shared/BarChart';
import { ApiClientRequestInfoBladeName } from '../shared/data-provider/ApiClientRequestInfo';

/* Required for IE11... this will enable most of the Object.assign functionality on that browser */
import { polyfillObjectAssign } from '../shared/ObjectAssignShim';
polyfillObjectAssign();

import '../../styles/shared/GridPane.less';

const DEFAULT_RESULT_COUNT: number = 500;
const DEFAULT_PROP_COL_HEADER_WIDTH: number = 90;
const ACTION_COL_HEADER_WIDTH: number = 160;
const DEFAULT_NAME_COL_WIDTH: number = 290;
const DEFAULT_TREND_COL_WIDTH: number = 250;
const DEFAULT_TREND_BAR_COLOR: string = '#1E90FF';

/**
 * By default we show last 24hours day bin by 1hours in trend chart.
 */
const DEFAULT_GRID_TREND_DATAPOINT_COUNT: number = 25;

export enum GridSortDirection {
    Asc = 0,
    Desc = 1
}

enum KustoDataColumn {
    NameObject = 0,
    Average = 1,
    P5th = 2,
    P10th = 3,
    P50th = 4,
    P90th = 5,
    P95th = 6,
    MinOrMax = 7,
    Trend = 8,
    /**
     * This column contains type.
     * If DA install, we can get more info like if it's VM scale set, resource id
     */
    EntityProperties = 9,
    /**
     * Resource id we get from the Perf table. will be empty if it's not Azure resource
     */
    ResourceIdFromOMS = 10
}

/**
 * this grid data match getColumnDefinition 
 */
export enum GridDataColumn {
    NameObject = 0,
    Average = 1,
    P5th = 2,
    P10th = 3,
    P90th = 4,
    P95th = 5,
    Trend = 6,
    EntityProperties = 7
}

interface ComputeComparisonGridProps extends ICommonComputeTabProps {
    metricName: string;
    gridDataContainsFilter: string;
    sortColumnIndex: number;
    sortDirection: GridSortDirection;
    subscriptionListManager: SubscriptionListManager;
    isPaneVisible: boolean;
    logPrefix: string;
    vmScaleSetResourceId?: string;
    featureFlags: StringMap<boolean>;
    onGridRowSelected: (row: any) => void;
    onSortOrderChanged: (sortColumnIndex: number, sortDirection: GridSortDirection) => void;
}

interface ComputeComparisonGridState {
    timeInterval: ITimeInterval,
    displayedMetricName: string,

    displayedSortColumnIndex: number,
    displayedSortDirection: GridSortDirection,

    canLoadMore: boolean,
    isLoading: boolean,
    isError: boolean,
    gridData: SGDataRow[],
    totalGridData: SGDataRow[],
    isAllGridDataAvailable: boolean
}

interface ITrendBarChartDataPoint {
    dateTimeUtc: Date,
    value: number
}


/** 
 * bbax: I made this Pure to ensure it performs a Shallow equals during shouldComponentUpdate automagically for us
 * which means as long as nothing chnages we wont re-query kusto for the sole reason of one of our parents
 * calling setState() to update some component the grid doens't care about (say a minor UI tweak)
 * this cases far less "twitching" in our loading and prevents the property panel open/close from causing
 * a kusto re-query... 
 * TODO: bonus if we can have this code also detect that the only change didn't effect state (say for hoisting state)
 * and NOT re-query kusto (but refresh our UI to include that new hoisted state) this would allow us to fix a minor
 * state issue that's been introduced by this change
*/
export class ComputeComparisonGrid extends React.PureComponent<ComputeComparisonGridProps, ComputeComparisonGridState> {
    private dataProvider: VmInsightsDataProvider;
    private telemetry: ITelemetry;
    private responseInterpreter: KustoGridResponseInterpreter;
    private kustoRequestId: string = '';

    private trendChartCell: React.StatelessComponent<SGCellProps>;
    private isInitialQuery: boolean = true;

    // Helper to evaluate when we need to query based on selection
    private queryOnSelectHelper: QueryOnSelectHelper = new QueryOnSelectHelper();

    constructor(props) {
        super(props);

        this.rowSelected = this.rowSelected.bind(this);

        this.dataProvider = new VmInsightsDataProvider(
            new KustoDataProvider(
                new RetryARMDataProvider(new ARMDataProvider(), new RetryPolicyFactory()),
                GlobalConstants.VMInsightsApplicationId
            ));

        this.responseInterpreter = new KustoGridResponseInterpreter();

        this.telemetry = VmInsightsTelemetryFactory.get(TelemetryMainArea.Compute);

        this.state = {
            timeInterval: new TimeInterval(new Date(), new Date, DEFAULT_GRID_TREND_DATAPOINT_COUNT),
            displayedMetricName: ComputeMetricName.CpuUtilization,

            displayedSortColumnIndex: 3,
            displayedSortDirection: GridSortDirection.Desc,

            canLoadMore: false,
            isLoading: true,
            isError: false,
            gridData: [],
            totalGridData: [],
            isAllGridDataAvailable: false
        };

        this.trendChartCell = ({ value }) => {
            return <BarChart
                data={value}
                getBarWidthFraction={(d) => {
                    return 1.0 / this.state.timeInterval.getBucketCount();
                }}
                getBarHeightFraction={(d) => {
                    return ComputeMetrics.get(this.state.displayedMetricName).descriptor.getTrendBarHeightFraction(d.value);
                }}
                getBarXPositionFraction={this.getBarXPositionFraction}
                getBarColor={(d) => { return DEFAULT_TREND_BAR_COLOR }}
            />;
        };
    }

    private static getGridQuerySortColumn(gridSortColumnIndex: number, metricName: string): SortColumn {
        let sortColumn: SortColumn;

        switch (gridSortColumnIndex) {
            case 1: // Average
                sortColumn = SortColumn.Average;
                break;
            case 2: // 5th
                sortColumn = SortColumn.P5th;
                break;
            case 3: // 10th
                sortColumn = SortColumn.P10th;
                break;
            case 4: // 90th
                sortColumn = SortColumn.P90th;
                break;
            case 5: // 95th
                sortColumn = SortColumn.P95th;
                break;
            default:
                throw new Error('Invalid sort column index of ' + gridSortColumnIndex);
        }

        return sortColumn;
    }

    private static getGridQuerySortDirection(gridSortDirection: GridSortDirection): SortDirection {
        let sortDirection: SortDirection;

        switch (gridSortDirection) {
            case 0: // Ascending => Asc to play nice w/ data provider and Kusto
                sortDirection = SortDirection.Asc;
                break;
            case 1: // Descending => Desc
                sortDirection = SortDirection.Desc;
                break;
            default:
                throw new Error('Invalid sort direction: ' + gridSortDirection);
        }

        return sortDirection;
    }

    private static toGridData(queryResult: any[], queryProps: ComputeComparisonGridProps): SGDataRow[] {
        const rows = new Array<SGDataRow>();

        if (queryResult && (queryResult.length > 0)) {
            // sort data according to sorting settings stored in the component state
            queryResult.sort((a, b) => {
                const valueA: number = a[queryProps.sortColumnIndex];
                const valueB: number = b[queryProps.sortColumnIndex];

                const difference = queryProps.sortDirection === GridSortDirection.Asc
                    ? valueA - valueB
                    : -valueA + valueB;

                if (difference !== 0) {
                    return difference;
                }

                // if values being compared are the same - sort alphabetically
                // first see if A and B are complex objects
                const objectA = a[0] as IGridLineObject<StringMap<string>>;
                const objectB = b[0] as IGridLineObject<StringMap<string>>;

                let nameA = undefined;
                let nameB = undefined;

                if (objectA && objectA.value && objectB && objectB.value) {
                    nameA = objectA.value.toLowerCase()
                    nameB = objectB.value.toLowerCase()
                } else {
                    nameA = a[0].toString().toLowerCase();
                    nameB = b[0].toString().toLowerCase();
                }

                return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
            });

            // each entity of query result has values of
            // [ nameObject, averageValue, p5thValue, p10thValue p50thValue, p90thValue, p95thValue,
            // minOrMaxValue, trendValues, EntityProperties, ResourceId ]
            // map the queryResult to displayed grid data.
            // For VM grid, we show only name, 95th/5thValue, minOrMaxValue,
            // trendValues and EntityProperties.
            for (let i = 0; i < queryResult.length; i++) {
                if (!queryResult[i] || queryResult[i].length < 8) {
                    continue;
                }

                const combinedEntityProperties: any = Object.assign(
                    { AzureResourceIdFromOMS: queryResult[i][KustoDataColumn.ResourceIdFromOMS] },
                    queryResult[i][KustoDataColumn.EntityProperties]);

                let gridRowData = [];
                gridRowData[GridDataColumn.NameObject] = queryResult[i][KustoDataColumn.NameObject];
                gridRowData[GridDataColumn.Average] = queryResult[i][KustoDataColumn.Average];
                gridRowData[GridDataColumn.P5th] = queryResult[i][KustoDataColumn.P5th];
                gridRowData[GridDataColumn.P10th] = queryResult[i][KustoDataColumn.P10th]
                gridRowData[GridDataColumn.P90th] = queryResult[i][KustoDataColumn.P90th];
                gridRowData[GridDataColumn.P95th] = queryResult[i][KustoDataColumn.P95th];
                gridRowData[GridDataColumn.Trend] = queryResult[i][KustoDataColumn.Trend];
                gridRowData[GridDataColumn.EntityProperties] = combinedEntityProperties;

                rows.push(new SGDataRow(gridRowData, queryResult[i][KustoDataColumn.NameObject]));
            }
        }

        return rows;
    }

    public componentWillMount(): void {
        if (this.needsRequery(this.props)) {
            this.queryGridData(
                this.props,
                DEFAULT_RESULT_COUNT);
        }
    }

    public componentWillReceiveProps(nextProps: Readonly<ComputeComparisonGridProps>,
        nextContext: Readonly<ComputeComparisonGridState>): void {
        if (!nextProps) {
            return;
        }

        if (this.needsRequery(nextProps)) {
            this.queryGridData(
                nextProps,
                DEFAULT_RESULT_COUNT);
        }
    }

    public render(): JSX.Element {
        if (!this.props.isPaneVisible) {
            return <div />;
        }

        const filteredGridData = this.getFilteredData();
        const itemCountStr = this.getCorrectRowCount(filteredGridData);
        const hoistedState = this.state;

        return (
            <div className='comparison-grid-container'>
                <div id='grid-item-count' className={(this.state.isLoading ? ' transparent' : '')}>
                    <label>{itemCountStr}</label>
                </div>
                <ComparisonGrid
                    columns={this.getColumnDefinition()}
                    canLoadMore={this.state.canLoadMore}
                    isLoading={this.state.isLoading}
                    isError={this.state.isError}
                    gridData={filteredGridData}
                    sortColumnIndex={this.state.displayedSortColumnIndex}
                    sortDirection={this.state.displayedSortDirection === GridSortDirection.Asc ? 0 : 1}
                    onRowSelected={(nameObject: any) => {
                        this.rowSelected(nameObject, hoistedState);
                    }}
                    onSortColumnChanged={this.onSortColumnChanged}
                    onSortOrderChanged={this.onSortChanged}
                    onLoadMoreClicked={this.onLoadMoreClicked}
                />
            </div>
        );
    }

    private getFilteredData(): SGDataRow[] {
        if (!this.props.gridDataContainsFilter || this.props.gridDataContainsFilter === '') {
            return this.state.totalGridData;
        }

        const filteredGridData = this.state.totalGridData.filter((gridRow) => {
            let objectName = gridRow.columnData && gridRow.columnData[GridDataColumn.NameObject] &&
                gridRow.columnData[GridDataColumn.NameObject].value;
            return (objectName && typeof objectName === 'string'
                && objectName.toLowerCase().indexOf(this.props.gridDataContainsFilter.toLowerCase()) !== -1);
        });
        return filteredGridData;
    }

    private needsRequery(nextProps: Readonly<ComputeComparisonGridProps>): boolean {
        return this.queryOnSelectHelper.needsRequeryNow(
            nextProps.isPaneVisible,
            () => {
                return (nextProps.metricName !== this.props.metricName ||
                    (this.props.computerGroup?.id !== nextProps?.computerGroup?.id)
                    || !AtScaleUtils.areWorkspacesEqual(nextProps.workspace, this.props.workspace)
                    || nextProps.sortColumnIndex !== this.props.sortColumnIndex
                    || nextProps.sortDirection !== this.props.sortDirection
                    || nextProps.startDateTimeUtc !== this.props.startDateTimeUtc
                    || nextProps.endDateTimeUtc !== this.props.endDateTimeUtc
                    || !AtScaleUtils.areAzureResourcesEqual(this.props.azureResourceInfo, nextProps.azureResourceInfo)
                    || nextProps.azureResourceType !== this.props.azureResourceType
                    || this.props.solutionType !== nextProps.solutionType
                    || ((nextProps.gridDataContainsFilter !== this.props.gridDataContainsFilter)
                        && !this.state.isAllGridDataAvailable));
            });
    }

    // For displaying the number of items in the current state of the grid
    private getCorrectRowCount(gridData: SGDataRow[]): string {
        let itemCountStr: string;
        if (!gridData || gridData.length === 0) {
            itemCountStr = DisplayStrings.ZeroItemCount;
        } else if (this.state.canLoadMore) {
            itemCountStr = DisplayStrings.TopXItemCount.replace('{0}', `${gridData.length}`);
        } else {
            itemCountStr = DisplayStrings.AllXItemCount.replace('{0}', `${gridData.length}`);
        }
        return itemCountStr;
    }

    private rowSelected(nameObject: any, state: ComputeComparisonGridState) {
        if (!state.gridData || state.gridData.length === 0) {
            return;
        }

        const index = findIndex(state.gridData, (row) => {
            if (row && row.columnData && row.columnData.length > 0
                && row.columnData[GridDataColumn.NameObject] && row.columnData[GridDataColumn.NameObject] === nameObject) {
                return true;
            }
            return false;
        });

        const deepCopy = update(state.gridData, { [index]: { selected: { $set: true } } });

        deepCopy.forEach((row: SGDataRow) => {
            if (row == null) {
                return;
            }
            row.selected = false;
        });
        deepCopy[index].selected = true;

        this.props.onGridRowSelected(state.gridData[index]);
        this.setState({ gridData: deepCopy })
    }

    private getvalueColumnNames(): string[] {

        const secondColumnName = DisplayStrings.ComparisonGridColumnTitle5thPercentile;
        const thirdColumnName = DisplayStrings.ComparisonGridColumnTitle10thPercentile;
        const fourthColumnName = DisplayStrings.ComparisonGridColumnTitle90thPercentile;
        const fifthColumnName = DisplayStrings.ComparisonGridColumnTitle95thPercentile;

        return [
            DisplayStrings.ComparisonGridColumnTitleAverage,
            secondColumnName,
            thirdColumnName,
            fourthColumnName,
            fifthColumnName
        ];

    }

    private getColumnDefinition(): SGColumn[] {
        let columnDefinitions = [];
        let valueColumnNames = this.getvalueColumnNames();

        columnDefinitions.push({
            name: DisplayStrings.ComparisonGridColumnTitleName,
            width: DEFAULT_NAME_COL_WIDTH,
            cell: SGIconCell((data) => {
                if (data instanceof GridLineObject) {
                    const castedData = data as IGridLineObject<JSX.Element>;
                    return castedData.value;
                } else {
                    return data;
                }
            }, (data) => {
                if (data instanceof GridLineObject) {
                    const castedData = data as IGridLineObject<JSX.Element>;
                    return castedData.metaData;
                } else {
                    return data;
                }
            })
        });

        let sortedColumnName: string = undefined;

        for (let index = 1; index <= valueColumnNames.length; index++) {

            let currentValueColName = valueColumnNames[index - 1];

            if (this.props.sortColumnIndex === index) {
                sortedColumnName = currentValueColName;
            }

            columnDefinitions.push({
                name: currentValueColName,
                width: DEFAULT_PROP_COL_HEADER_WIDTH,
                cell: SGFormattedPlainCell((data) => {
                    return ComputeMetrics.get(this.state.displayedMetricName).descriptor.formatValue(data);
                }),
                sortable: true,
                sortOrder: this.props.sortColumnIndex === index ? this.props.sortDirection : undefined,
                sortFunc: null
            });

        }

        let grainDisplay = '';
        if (this.state.timeInterval) {
            const grainTime = KustoGrainDisplay[this.state.timeInterval.getGrainKusto()];
            if (grainTime) {
                grainDisplay = StringHelpers.replaceAll(DisplayStrings.ComparisonGridGranularitySubtitle, '{0}', grainTime);
            }
        }

        const trendTitleFormatted = StringHelpers.replaceAll(
            StringHelpers.replaceAll(DisplayStrings.ComparisonGridColumnTitleTrend, '{0}', grainDisplay),
            '{1}', sortedColumnName);

        columnDefinitions.push({
            name: trendTitleFormatted,
            width: DEFAULT_TREND_COL_WIDTH,
            cell: this.trendChartCell
        });

        columnDefinitions.push({
            name: DisplayStrings.ComparisonGridColumnTitleType,
            width: ACTION_COL_HEADER_WIDTH,
            cell: SGFormattedPlainCell((data) => {
                return data.vmType;
            }),
        });

        return columnDefinitions;
    }

    private getBarXPositionFraction = (dataPoint: ITrendBarChartDataPoint): number => {
        const timeFromStart = dataPoint.dateTimeUtc.valueOf() - this.state.timeInterval.getBestGranularStartDate().valueOf();
        const timeInterval = this.state.timeInterval.getBestGranularEndDate().valueOf() -
            this.state.timeInterval.getBestGranularStartDate().valueOf();

        return timeFromStart / timeInterval;
    }

    private onSortColumnChanged = (sortColumnIndex: number) => {
        // calculate default sort order for the column
        const sortOrder = ComputeMetrics.get(this.props.metricName).descriptor.isHigherValueBetter
            ? SGSortOrder.Ascending
            : SGSortOrder.Descending;

        this.onSortChanged(sortColumnIndex, sortOrder);
    }

    private onSortChanged = (sortColumnIndex: number, sortOrder: SGSortOrder) => {
        const columnNameList = this.getvalueColumnNames();
        if (columnNameList && columnNameList[sortColumnIndex - 1]) {
            const columnName = columnNameList[sortColumnIndex - 1];

            let props = {
                column_name: columnName,
                metric_name: this.props.metricName,
                sort_direction: sortOrder === SGSortOrder.Ascending ? 'Asc' : 'Desc',
                workspace_id: this.props.workspace && this.props.workspace.id,
                resourceId: this.props.azureResourceInfo && this.props.azureResourceInfo.id
            };

            if (this.props.computerGroup) {
                props['group_type'] = ComputerGroupType[this.props.computerGroup.groupType];
                props['group_id'] = this.props.computerGroup.id
            }

            this.telemetry.logEvent(`${this.props.logPrefix}.ListSortOrderChanged`, props, undefined);
        }

        this.props.onSortOrderChanged(
            sortColumnIndex,
            sortOrder === SGSortOrder.Ascending ? GridSortDirection.Asc : GridSortDirection.Desc
        );
    }

    private onLoadMoreClicked = () => {
        const telemetryPayload: StringMap<number> = { beforeLoad: this.state.gridData.length }
        this.telemetry.logEvent(`${this.props.logPrefix}.OnLoadMoreClicked`, undefined, telemetryPayload);
        this.queryGridData(this.props, this.state.gridData.length + DEFAULT_RESULT_COUNT);
    }

    private getLogProperties(queryProps: ComputeComparisonGridProps, eventName: string, requestId: string): StringMap<string> {
        const properties: StringMap<string> = {};
        properties['metricName'] = queryProps.metricName;
        properties['workspaceId'] = queryProps.workspace && queryProps.workspace.id;
        properties['startDateTimeUtc'] = queryProps.startDateTimeUtc.toISOString();
        properties['endDateTimeUtc'] = queryProps.endDateTimeUtc.toISOString();
        properties['requestId'] = requestId;
        properties['resourceId'] = queryProps.azureResourceInfo && queryProps.azureResourceInfo.id;
        properties['resourceType'] = queryProps.azureResourceType;

        if (queryProps.computerGroup) {
            properties['group_type'] = ComputerGroupType[queryProps.computerGroup.groupType];
            properties['group_id'] = queryProps.computerGroup.id;
        }

        return properties;
    }

    private queryGridData(queryProps: ComputeComparisonGridProps, maxResultCount?: number): void {
        // If solutionType is azure but there is no selected resource then return.
        // If solutionType is hybrid but there is no selected workspace then return.
        if (!AtScaleUtils.validatePropsToQueryData(queryProps)) {
            return;
        }

        const eventName = `${this.props.logPrefix}.QueryVirtualMachineList`;
        const queryOption: IKustoQueryOptions = new ComputeKustoQueryOptions(
            {
                queryName: eventName,
                bladeName: queryProps.vmScaleSetResourceId ? ApiClientRequestInfoBladeName.Vmss : ApiClientRequestInfoBladeName.AtScale,
                isInitialBladeLoad: queryProps.isDefaultExperienceOfBlade && this.isInitialQuery
            },
            queryProps.startDateTimeUtc, queryProps.endDateTimeUtc, DEFAULT_GRID_TREND_DATAPOINT_COUNT);

        this.kustoRequestId = queryOption.requestId;

        const properties = this.getLogProperties(queryProps, eventName, queryOption.requestId);
        const telemetryContext = this.telemetry.startLogEvent(eventName, properties, undefined);

        this.setState({ isLoading: true, isError: false });

        (window as any).atScaleComputePerfInsights.performanceMeasures['frame_getVmListQueryStart'] = Date.now();

        const azureResourceId: string = AtScaleUtils.getAzureResourceId(queryProps);
        const azureResourceType: string = AtScaleUtils.getAzureResourceType(queryProps.azureResourceType);
        const computerGroup: ComputerGroup = queryProps.solutionType === SolutionType.Hybrid ? queryProps.computerGroup : undefined;
        const queryInsightsMetrics: boolean = this.props.featureFlags[FeatureMap.enableInsightsMetricsQuery];
        this.isInitialQuery = false;
        this.dataProvider.getVirtualMachineList(
            queryProps.workspace,
            computerGroup,
            queryOption.timeInterval,
            queryProps.metricName,
            ComputeComparisonGrid.getGridQuerySortColumn(queryProps.sortColumnIndex, queryProps.metricName),
            ComputeComparisonGrid.getGridQuerySortDirection(queryProps.sortDirection),
            queryOption,
            maxResultCount,
            azureResourceId || queryProps.vmScaleSetResourceId,
            azureResourceType,
            queryProps.gridDataContainsFilter,
            queryInsightsMetrics
        ).then((data) => {
            (window as any).atScaleComputePerfInsights.performanceMeasures['frame_getVmListQueryEnd'] = Date.now();

            if (TelemetryUtils.completeApiTelemetryEvent(telemetryContext,
                queryOption.requestId !== this.kustoRequestId, false, undefined, data.TelemetryProps)) {
                const sortOrder = ComputeComparisonGrid.getGridQuerySortColumn(queryProps.sortColumnIndex, queryProps.metricName);
                const result = this.responseInterpreter.processGridQueryResult(data, sortOrder);
                const gridData = ComputeComparisonGrid.toGridData(result, queryProps);

                this.setState({
                    timeInterval: queryOption.timeInterval,
                    displayedMetricName: queryProps.metricName,
                    displayedSortColumnIndex: queryProps.sortColumnIndex,
                    displayedSortDirection: queryProps.sortDirection,
                    isLoading: false,
                    isError: false,
                    gridData,
                    canLoadMore: gridData.length >= maxResultCount,
                    totalGridData: gridData,
                    isAllGridDataAvailable: !(gridData.length >= maxResultCount) && !queryProps.gridDataContainsFilter
                });
            }
        })
            .catch((error) => {
                (window as any).atScaleComputePerfInsights.performanceMeasures['frame_getVmListQueryEnd'] = Date.now();
                // check to see if component expects result of this query
                // and don't do anything in case subsequent query was issued
                // before receiving this query results
                if (queryOption.requestId === this.kustoRequestId) {
                    telemetryContext.fail(error, { message: 'Error in fetching topN list data' });
                    const response: DraftQueryResponse = new DraftQueryResponse(undefined, error);
                    this.setState({ isLoading: false, isError: !!response.Error });
                }
            });
    }
}
