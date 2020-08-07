import * as React from 'react';
import { SelectableGrid, SGColumn, SGDataRow } from 'appinsights-iframe-shared';
import { LoadingSvg } from 'appinsights-iframe-shared';

import { VmInsightsDataProvider } from './data-provider/VmInsightsDataProvider';
import { KustoSingleVMGridResponseInterpreter } from './data-provider/KustoSingleVMGridResponseInterpreter';

import * as Constants from './Constants';
import { DisplayStrings } from '../shared/DisplayStrings';
import * as GlobalConstants from '../shared/GlobalConstants';
import { ITelemetry, TelemetryMainArea } from '../shared/Telemetry';
import { VmInsightsTelemetryFactory } from '../shared/VmInsightsTelemetryFactory';
import { SimpleSpan } from '../shared/SimpleSpan';
import { KustoDataProvider, IKustoQueryOptions } from '../shared/data-provider/KustoDataProvider';
import { RetryPolicyFactory } from '../shared/data-provider/RetryPolicyFactory';
import { RetryARMDataProvider } from '../shared/data-provider/RetryARMDataProvider';
import { ARMDataProvider } from '../shared/data-provider/ARMDataProvider';
import { ComputeKustoQueryOptions } from './shared/ComputeKustoQueryOptions';
import { TelemetryUtils } from './shared/TelemetryUtils';
import { IQueryResult } from '../shared/BladeQuery';
import { ErrorSeverity } from '../shared/data-provider/TelemetryErrorSeverity';
import { IWorkspaceInfo } from '../shared/IWorkspaceInfo';
import { ApiClientRequestInfoBladeName } from '../shared/data-provider/ApiClientRequestInfo';

import '../../styles/compute/SingleComputeDiskGrid.less';

/**
 * Properties for SingleComputeDiskGrid
 * @interface ISingleComputeDiskGridProps
 */
interface ISingleComputeDiskGridProps {

    /**
     * Workspace used in the query
     * @type string
     * @memberof ISingleComputeDiskGridProps
     */
    workspace: IWorkspaceInfo;


    /**
     * Computer we are querying for disk properties
     * @type string
     * @memberof ISingleComputeDiskGridProps
     */
    computerName: string;

    /**
     * The azure resource id of the computer.
     * Can be undefined.
     */
    resourceId: string;

    /**
     * Start time for the query
     * @type Date
     * @memberof ISingleComputeDiskGridProps
     */
    startDateTimeUtc: Date;

    /**
     * End time for the query
     * @type Date
     * @memberof ISingleComputeDiskGridProps
     */
    endDateTimeUtc: Date;

    /** session id to be used in queries */
    sessionId: string;

    /**
     * Append telemetry event name to this prefix before logging them.
     */
    logsPrefix: string;

    /** True if there was query done at the blade */
    queryOnBlade: boolean,

    /** Results of the blade query. This will only be defined once the query is finished. */
    bladeQueryResult: IQueryResult,

    /** list of featureFlags from parent extension */
    featureFlags: StringMap<boolean>,
    isDefaultExperienceOfBlade: boolean;
    /**
     * Callback called when the query is completed to inform
     * about the presence of latency counters
     * @memberof ISingleComputeDiskGridProps
     */
    onQueryCompleted: (hasLatencyCounters: boolean) => void;
}


/**
 * State for SingleComputeDiskGrid
 * @interface ISingleComputeDiskGridState
 */
interface ISingleComputeDiskGridState {

    /**
     * True if the grid is loading
     * @type boolean
     * @memberof ISingleComputeDiskGridState
     */
    isLoading: boolean;


    /**
     * True for a query error
     * @type boolean
     * @memberof ISingleComputeDiskGridState
     */
    isError: boolean;


    /**
     * Grid columns
     * @type SGColumn[]
     * @memberof ISingleComputeDiskGridState
     */
    columns: SGColumn[];

    /**
     * Grid Rows
     * @type SGDataRow[]
     * @memberof ISingleComputeDiskGridState
     */
    rows: SGDataRow[];

    /**
     * The grid expands to the height and width of its parent div. We prefer it to use the space it needs
     * so that charts can be placed at the bottom of the grid.
     * Since both grid rows and columns have fixed heights and widths we use these properties to render
     * the parent div to the height and width it needs
     * @type string
     * @memberof ISingleComputeDiskGridState
     */
    gridDivHeight: string;

    /**
     * The width of the grid div. See the comment above for the height.
     * @type string
     * @memberof ISingleComputeDiskGridState
     */
    gridDivWidth: string;

    /**
    * Set to true when there is no data to display
    * @type boolean
    * @memberof ISingleComputeDiskGridState
    */
    noData: boolean;

}

/**
 * Grid displaying disk performance details for single VM
 * @export
 * @class SingleComputeDiskGrid
 * @extends React.Component<ISingleComputeDiskGridProps, ISingleComputeDiskGridState>
 */
export class SingleComputeDiskGrid extends React.Component<ISingleComputeDiskGridProps, ISingleComputeDiskGridState> {
    /**
     * Height for each row
     * @private
     * @memberof SingleComputeDiskGrid
     */
    private ROW_HEIGHT = 37;

    /**
     * Object used to perform telemetry
     * @private
     * @type ITelemetry
     * @memberof SingleComputeDiskGrid
     */
    private telemetry: ITelemetry;

    /**
     * Query maker
     * @private
     * @type VmInsightsDataProvider
     * @memberof SingleComputeDiskGrid
     */
    private dataProvider: VmInsightsDataProvider;


    /**
     * Query interpreter 
     * @private
     * @type KustoSingleVMGridResponseInterpreter
     * @memberof SingleComputeDiskGrid
     */
    private responseInterpreter: KustoSingleVMGridResponseInterpreter;

    private isInitialQuery: boolean = true;

    /**
     * Creates an instance of SingleComputeDiskGrid.
     * @param  {ISingleComputeDiskGridProps} [props] 
     * @memberof SingleComputeDiskGrid
     */
    constructor(props?: ISingleComputeDiskGridProps) {
        super(props);

        this.telemetry = VmInsightsTelemetryFactory.get(TelemetryMainArea.Compute);

        this.state = {
            isLoading: true,
            isError: false,
            columns: this.columns,
            rows: [],
            gridDivHeight: '0px',
            gridDivWidth: '100%',
            noData: true
        };

        this.dataProvider =
            new VmInsightsDataProvider(
                new KustoDataProvider(
                    new RetryARMDataProvider(new ARMDataProvider(), new RetryPolicyFactory()),
                    GlobalConstants.VMInsightsApplicationId
                ));
        this.responseInterpreter = new KustoSingleVMGridResponseInterpreter();
    }

    /**
     * Performs the query when the props change
     * @param  {Readonly<ISingleComputeDiskGridProps>} nextProps 
     * @param  {*} nextContext 
     * @return {void}@memberof SingleComputeDiskGrid
     */
    public componentWillReceiveProps(nextProps: Readonly<ISingleComputeDiskGridProps>): void {

        let hasQueriedForNextProps = (nextProps.computerName === this.props.computerName) &&
            (nextProps.resourceId === this.props.resourceId) &&
            ((nextProps.workspace && nextProps.workspace.id) === (this.props.workspace && this.props.workspace.id)) &&
            (nextProps.startDateTimeUtc.getTime() === this.props.startDateTimeUtc.getTime() &&
                (nextProps.endDateTimeUtc.getTime() === this.props.endDateTimeUtc.getTime()));

        if (hasQueriedForNextProps) {
            return;
        }

        this.queryDisk(nextProps);
    }

    /**
     * Renders the UI
     * @return JSX.Element 
     * @memberof SingleComputeDiskGrid
     */
    public render(): JSX.Element {
        if (this.state.isLoading) {
            return <div className='MainPage-root'>
                <div className='center-flex loading-temporary-height'>
                    <span className='loading-icon-main'><LoadingSvg /></span>
                </div>
            </div>;
        }

        const noDataMsg = this.state.noData && !this.state.isError && !this.state.isLoading ?
            <div className='no-data-msg-div'>
                <p className='no-data-msg'>{DisplayStrings.NoData}</p>
            </div> : <div />;

        const errorMsg = this.state.isError ?
            <p className='data-error-msg'>{DisplayStrings.DataRetrievalError}</p>
            : <div />;

        const diskGrid = this.state.isError ? <div /> : <SelectableGrid
            columns={this.state.columns}
            data={this.state.rows}
            sortColumn={0}
            rowHeight={this.ROW_HEIGHT}
            hideHeader={false}
            onSelect={this.onSelect}
            sortIndicators={undefined} />;

        return <div className={this.state.rows.length === 0 ? 'no-data-spacer' : ''}>
            <div className='grid-div single-vm-disk-grid' style={{ 'height': this.state.gridDivHeight, 'width': this.state.gridDivWidth }}>
                {diskGrid}
                {noDataMsg}
                {errorMsg}
            </div >
        </div>
    }

    /**
    * Performs the initial query 
    * @return {void}@memberof SingleComputeDiskGrid
    */
    public componentDidMount() {
        if (this.props.queryOnBlade) {
            this.isInitialQuery = false;
            this.processBladeData();
        } else {
            this.queryDisk(this.props);
        }
    }

    /**
     * Queries for disk information
     * @private
     * @param  {queryProps} query properties
     * @return 
     * @memberof SingleComputeDiskGrid
     */
    private queryDisk(queryProps: Readonly<ISingleComputeDiskGridProps>): void {
        if (!queryProps) { throw new Error('Parameter @queryProps may not be null'); }
        if (!queryProps.workspace || !queryProps.workspace.id) { throw new Error('Parameter @queryProps.workspaceId may not be null'); }
        if (!(queryProps.computerName || queryProps.resourceId)) {
            throw new Error('At least one of @queryProps.computerName or @queryProps.resourceId needs to be non-null');
        }
        if (!queryProps.startDateTimeUtc) { throw new Error('Parameter @queryProps.startDateTimeUtc may not be null'); }
        if (!queryProps.endDateTimeUtc) { throw new Error('Parameter @queryProps.endDateTimeUtc may not be null'); }

        if ((window as any).vmInstanceComputePerfInsights && (window as any).vmInstanceComputePerfInsights.performanceMeasures) {
            (window as any).vmInstanceComputePerfInsights.performanceMeasures['frame_diskQueryStart'] = Date.now();
        }

        this.setState({ isLoading: true, isError: false });

        const queryInsightsMetrics: boolean = this.props.featureFlags[Constants.FeatureMap.enableInsightsMetricsQuery];
        const eventName = `${this.props.logsPrefix}.QueryDiskTable`;
        const kustSessionId = this.props.sessionId;
        const bladeName: string = this.props.resourceId?.toLowerCase().indexOf('virtualmachinescalesets') ?
            ApiClientRequestInfoBladeName.VmssInstance : ApiClientRequestInfoBladeName.Vm;
        const queryOption: IKustoQueryOptions = new ComputeKustoQueryOptions(
            {
                queryName: eventName,
                bladeName,
                isInitialBladeLoad: this.props.isDefaultExperienceOfBlade && this.isInitialQuery
            },
            queryProps.startDateTimeUtc,
            queryProps.endDateTimeUtc,
            Constants.IdealGridTrendDataPoints);
        queryOption.sessionId = kustSessionId;

        const properties = {
            workspace_id: queryProps.workspace && queryProps.workspace.id,
            computer_name: queryProps.computerName,
            resourceId: queryProps.resourceId,
            startDateTimeUtc: queryOption.timeInterval.getBestGranularStartDate().toISOString(),
            endDateTimeUtc: queryOption.timeInterval.getBestGranularEndDate().toISOString(),
            sessionId: kustSessionId,
            requestId: queryOption.requestId
        };

        const kustoQueryTelemetry = this.telemetry.startLogEvent(
            eventName,
            properties,
            undefined
        );
        this.isInitialQuery = false;
        this.dataProvider.getSingleVMDiskPerfData(
            queryProps.computerName,
            queryProps.resourceId,
            queryProps.workspace,
            queryOption.timeInterval,
            queryOption,
            queryInsightsMetrics
        )
            .then((data) => {
                const interpretedResult = this.responseInterpreter.processGridQueryResult(data);
                if (TelemetryUtils.completeApiTelemetryEvent(
                    kustoQueryTelemetry,
                    kustSessionId !== this.props.sessionId,
                    !interpretedResult,
                    'Unexpected data structure received', data.TelemetryProps)) {

                    this.processGridData(interpretedResult?.data, interpretedResult?.hasLatencyCounters);
                }
            })
            .catch((error) => {
                if (kustSessionId !== this.props.sessionId) {
                    return;
                }

                kustoQueryTelemetry.fail(error, { message: 'Error retrieving disk data at SingleComputeDiskGrid.tsx' });
                this.setState({ isLoading: false, isError: true }, () => this.props.onQueryCompleted(false));
            });
    }

    /**
     * In the case where the query is done in the blade, process the data
     * @return void 
     */
    private processBladeData(): void {
        let bladeData = this.props.bladeQueryResult;
        if (!bladeData) { throw new Error('Parameter @bladeData may not be null'); }
        if (!bladeData.error && !bladeData.result) {
            this.telemetry.logException(
                'Either @bladeData.error or @bladeData.result may not be null',
                'SingleComputeDiskGrid.processBladeData',
                ErrorSeverity.Error,
                {},
                undefined);

            return;
        }

        if (bladeData.error) {
            this.setState({ isLoading: false, isError: true }, () => this.props.onQueryCompleted(false));
            return;
        }

        let data = bladeData.result;
        const interpretedResult = this.responseInterpreter.processGridQueryResult(data);
        if (!interpretedResult) {
            this.telemetry.logException(
                'The data from the blade has an unexpected format',
                'SingleComputeDiskGrid.processBladeData',
                ErrorSeverity.Error,
                {},
                undefined);
            this.setState({ isLoading: false, isError: true });
            return;
        }

        this.processGridData(interpretedResult?.data, interpretedResult?.hasLatencyCounters);
    }

    private processGridData(gridData: any[], hasLatencyCounters: boolean): void {
        gridData = gridData || [];
        const columns: SGColumn[] = this.columns;
        if (hasLatencyCounters && columns.length !== this.totalColumnsLength) {
            for (const latencyColumn of this.latencyColumns) {
                columns.push(latencyColumn);
            }
        }

        const width: number = columns.reduce(
            (previousValue: number, currentColumn: SGColumn) => previousValue + currentColumn.width, 0);

        this.setState({
            rows: gridData.map((row: any, i: number) => new SGDataRow(row, i)),
            columns,
            isLoading: false,
            isError: false,
            gridDivHeight: this.ROW_HEIGHT * (gridData.length + 1) + 'px', // + 1 is for the header
            gridDivWidth: width + 'px',
            noData: gridData.length === 0
        }, () => this.props.onQueryCompleted(hasLatencyCounters));
    }

    /**
    * This is not used for now. Selection is just a reader helper at the moment
    * @private
    * @param  {*} selectedItem 
    * @return {void}@memberof SingleComputeDiskGrid
    */
    private onSelect(selectedItem: any): void {}

    private get columns(): SGColumn[] {
        return [
            { name: DisplayStrings.Disk, width: 120, cell: SimpleSpan, sortable: false },
            { name: DisplayStrings.SizeGb, width: 105, cell: SimpleSpan, sortable: false },
            { name: DisplayStrings.UsedPercent, width: 105, cell: SimpleSpan, sortable: false },
            { name: DisplayStrings.IOPSRead, width: 85, cell: SimpleSpan, sortable: false },
            { name: DisplayStrings.IOPSWrite, width: 90, cell: SimpleSpan, sortable: false },
            { name: DisplayStrings.IOPSTotal, width: 90, cell: SimpleSpan, sortable: false },
            { name: DisplayStrings.MBSRead, width: 90, cell: SimpleSpan, sortable: false },
            { name: DisplayStrings.MBSWrite, width: 90, cell: SimpleSpan, sortable: false },
            { name: DisplayStrings.MBSTotal, width: 92, cell: SimpleSpan, sortable: false },
        ];
    }

    private get latencyColumns(): SGColumn[] {
        return [
            { name: DisplayStrings.LatencyRead, width: 130, cell: SimpleSpan, sortable: false },
            { name: DisplayStrings.LatencyWrite, width: 133, cell: SimpleSpan, sortable: false },
            { name: DisplayStrings.LatencyTotal, width: 133, cell: SimpleSpan, sortable: false },
        ];
    }

    private get totalColumnsLength(): number {
        return this.state.columns.length + this.latencyColumns.length;
    }
}
