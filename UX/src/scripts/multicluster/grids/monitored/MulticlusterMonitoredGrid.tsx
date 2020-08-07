/** tpl */
import * as moment from 'moment';
import * as React from 'react';
import * as update from 'immutability-helper';
import { SGSortOrder, SGColumn, SGDataRow, SGFormattedPlainCell } from 'appinsights-iframe-shared';

/** local */
import { MulticlusterGridBase, GridSortOrder, ClusterTypeDisplayNameMap } from '../MulticlusterGridBase';
import { IMulticlusterGridProps } from '../IMulticlusterGridProps';
import { MulticlusterGrid } from '../MulticlusterGrid';
import {
    IMonitoredClusterMetaData,
    MonitoredClusterMetaData
} from '../../metadata/MonitoredClusterMetaData';
import { HealthStatus, HealthStatusDisplayNameMap } from '../../metadata/HealthCalculator';
import { ClusterType } from '../../metadata/IManagedCluster';

/** shared */
import { DisplayStrings } from '../../MulticlusterDisplayStrings';
import { IGridLineObject, GridLineObject } from '../../../shared/GridLineObject';
import { SGIconLinkCell } from '../../../shared/SGIconLinkCell';

/** styles */
import '../../../../styles/multicluster/GridPaneMulticluster.less';
import { SGIconInfoCell } from '../../../shared/SGIconInfoCell';
import { IMulticlusterMetaDataBase } from '../../metadata/IMulticlusterMetaDataBase';
import { SortHelper } from '../../../shared/SortHelper';




/** constants */
const DEFAULT_PROP_COL_HEADER_WIDTH: number = 0;

export class MulticlusterMonitoredGrid extends React.Component<IMulticlusterGridProps> {
    constructor(props: IMulticlusterGridProps) {
        super(props);

        // Function bindings
        this.onSortColumnChanged = this.onSortColumnChanged.bind(this);
        this.onSortOrderChanged = this.onSortOrderChanged.bind(this);
    }

    /**
     *  convert query results to grid data rows
     * @param queryResult
     * @param queryProps
     */
    private static toGridData(queryResult: any[], queryProps: IMulticlusterGridProps): SGDataRow[] {
        const rows = new Array<SGDataRow>();

        if (queryResult && (queryResult.length > 0)) {
            // sort data according to sorting settings stored in the component state
            queryResult.sort((a, b) => {
                const valueA: number = a[queryProps.sortColumnIndex];
                const valueB: number = b[queryProps.sortColumnIndex];

                const difference = queryProps.sortOrder === GridSortOrder.Asc
                    ? valueA - valueB
                    : -valueA + valueB;

                if (difference !== 0) {
                    return difference;
                }

                // if values being compared are the same - sort alphabetically
                const nameA = a[0].toString().toLowerCase();
                const nameB = b[0].toString().toLowerCase();

                return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
            });

            for (let i = 0; i < queryResult.length; i++) {
                rows.push(new SGDataRow(queryResult[i], i));
            }
        }

        return rows;
    }

    /**
     * Renders the monitored grid
     */
    public render(): JSX.Element {
        const filteredGridData: SGDataRow[] = MulticlusterGridBase.filterGridData(
            update(MulticlusterMonitoredGrid.toGridData(this.props.gridData, this.props), {}),
            this.props.nameSearchFilterValue
        );
        const itemCountStr: string = MulticlusterGridBase.getGridItemCount(update(this.props.gridData, {}), filteredGridData);

        return (
            <div className='comparison-grid-container' style= {{width: '100%'}}>
                <div id='grid-item-count' className={(this.props.isLoading ? ' transparent' : '')} role='status' aria-live='polite'>
                    <span>{itemCountStr}</span>
                </div>
                <MulticlusterGrid
                    columns={this.getColumnDefinition()}
                    isLoading={this.props.isLoading}
                    isError={this.props.isError}
                    gridData={filteredGridData}
                    sortColumnIndex={this.props.sortColumnIndex}
                    sortOrder={MulticlusterGridBase.convertSortOrderToSgSortOrder(this.props.sortOrder)}
                    onSortColumnChanged={this.onSortColumnChanged}
                    onSortOrderChanged={this.onSortOrderChanged}
                    selectedGlobalSubscriptionCount={this.props.selectedGlobalSubscriptionCount}
                    isMonitoredGrid={true}
                />
            </div>
        );
    }

    /**
     * column definition for monitored grid
     */
    private getColumnDefinition(): SGColumn[] {
        let columnDefinitions = [];

        columnDefinitions.push({
            name: DisplayStrings.MulticlusterMonitoredGridColumnClusterName,
            width: DEFAULT_PROP_COL_HEADER_WIDTH,
            cell: SGIconLinkCell(
                ({ value }) => value,
                MulticlusterGridBase.navigateToContainerInsightsChartsTab(this.props.messagingProvider,
                    {
                        startDateTimeISOString: moment(moment.utc()).add(-30, 'm').toDate().toISOString(),
                        endDateTimeISOString: moment.utc().toDate().toISOString(),
                        isTimeRelative: true,
                    }
                ),
                (data: IGridLineObject<IMulticlusterMetaDataBase>) => {
                    return MulticlusterGridBase.getClusterIcon(data);
                }
            ),
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 0 ? this.props.sortOrder : undefined,
            sortFunc: (a, b) => {
                const safeA = a || '';
                const safeB = b || '';
                const aString = safeA.value || safeA;
                const bString = safeB.value || safeB;

                return SortHelper.Instance().sortByNameAlphaNumeric(aString, bString);
            }
        });

        columnDefinitions.push({
            name: DisplayStrings.MulticlusterMonitoredGridColumnClusterType,
            width: DEFAULT_PROP_COL_HEADER_WIDTH,
            cell: SGFormattedPlainCell(({ value }) => ClusterTypeDisplayNameMap[ClusterType[value]]),
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 1 ? this.props.sortOrder : undefined,
            sortFunc: (a, b) => MulticlusterGridBase.sortClusterType(a, b, this.props.sortOrder)
        });

        columnDefinitions.push({
            name: DisplayStrings.MulticlusterMonitoredGridColumnClusterVersion,
            width: DEFAULT_PROP_COL_HEADER_WIDTH,
            cell: SGFormattedPlainCell(({ value }) => (value === 'Unknown' ? '--' : value)),
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 2 ? this.props.sortOrder : undefined,
            sortFunc: (a, b) => {

                const versionAString = (a === DisplayStrings.UnknownClusterVersion) ? (
                    this.props.sortOrder === GridSortOrder.Asc ? String(Number.MIN_SAFE_INTEGER) : String(Number.MAX_SAFE_INTEGER)
                ) : a;

                const versionBString = (b === DisplayStrings.UnknownClusterVersion) ? (
                    this.props.sortOrder === GridSortOrder.Asc ? String(Number.MIN_SAFE_INTEGER) : String(Number.MAX_SAFE_INTEGER)
                ) : b;

                return MulticlusterGridBase.sortClusterVersion(versionAString, versionBString, this.props.sortOrder);
            },
            infoText: DisplayStrings.MulticlusterMonitoredGridColumnVersionInfoText
        });

        columnDefinitions.push({
            name: DisplayStrings.MulticlusterMonitoredGridColumnStatus,
            width: DEFAULT_PROP_COL_HEADER_WIDTH,
            cell: SGIconInfoCell(
                ({ value }) => (value === null ? '--' : HealthStatusDisplayNameMap[HealthStatus[value]]),
                (data: IGridLineObject<MonitoredClusterMetaData>) => {
                    const healthStatus: HealthStatus = data.metaData.clusterStatus;
                    return MulticlusterGridBase.getHealthStatusIcon(healthStatus);
                },
                (data: IGridLineObject<MonitoredClusterMetaData>) => data.metaData.clusterStatusInfoMessage),
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 3 ? this.props.sortOrder : undefined,
            sortFunc: (a, b) => MulticlusterGridBase.sortClusterStatus(a, b, this.props.sortOrder),
            infoText: DisplayStrings.MulticlusterMonitoredGridColumnStatusInfoText
        });

        columnDefinitions.push({
            name: DisplayStrings.MulticlusterMonitoredGridColumnNodes,
            width: DEFAULT_PROP_COL_HEADER_WIDTH,
            cell: SGIconLinkCell(
                ({ value }) => (value === '- / -' ? '--' : value),
                MulticlusterGridBase.navigateToContainerInsightsNodesTab(this.props.messagingProvider,
                    {
                        startDateTimeISOString: moment(moment.utc()).add(-30, 'm').toDate().toISOString(),
                        endDateTimeISOString: moment.utc().toDate().toISOString(),
                        isTimeRelative: true,
                    }),
                (data: IGridLineObject<MonitoredClusterMetaData>) => {
                    const healthStatus: HealthStatus = data.metaData.nodeOverallHealth;
                    return MulticlusterGridBase.getHealthStatusIcon(healthStatus);
                }),
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 4 ?
                MulticlusterGridBase.convertSortOrderToSgSortOrder(this.props.sortOrder) : undefined,
            sortFunc: (a, b) => {
                const castedDataA = a as IGridLineObject<IMonitoredClusterMetaData>;
                if (!castedDataA || !castedDataA.metaData) {
                    throw new Error('unexpected data in sort of grid');
                }
                const castedDataB = b as IGridLineObject<IMonitoredClusterMetaData>;
                if (!castedDataB || !castedDataB.metaData) {
                    throw new Error('unexpected data in sort of grid');
                }

                // nib: Understand that the value in this column is a string representing a ratio. We don't want to sort the string, or
                // do any special parsing for it, or create a new sorting function. Therefore, we create a new GridLineObject for a and b
                // whose value is the numerical evaultion of the string, which is stored in a variable in a and b's metadata, and use
                // them to find the grid sort value
                const healthRatioA: number = castedDataA.metaData.nodeHealthRatio;
                const healthRatioB: number = castedDataB.metaData.nodeHealthRatio;

                if (healthRatioA === undefined || healthRatioB === undefined) {
                    console.log('healthRatioA:', healthRatioA);
                    console.log('healthRatioB:', healthRatioB);
                }

                const comparableA = new GridLineObject(healthRatioA, castedDataA.metaData);
                const comparableB = new GridLineObject(healthRatioB, castedDataB.metaData);

                return MulticlusterGridBase.gridSortValue(comparableA, comparableB, update(this.props, {}));
            },
            infoText: DisplayStrings.MulticlusterMonitoredGridColumnNodesInfoText
        });

        columnDefinitions.push({
            name: DisplayStrings.MulticlusterMonitoredGridColumnUserPods,
            width: DEFAULT_PROP_COL_HEADER_WIDTH,
            cell: SGIconLinkCell(
                ({ value }) => (value === '- / -' ? '--' : value),
                MulticlusterGridBase.navigateToContainerInsightsControllersTab(this.props.messagingProvider,
                    {
                        nameSpace: 'user-pods',
                        startDateTimeISOString: moment(moment.utc()).add(-30, 'm').toDate().toISOString(),
                        endDateTimeISOString: moment.utc().toDate().toISOString(),
                        isTimeRelative: true,
                    }),
                (data: IGridLineObject<MonitoredClusterMetaData>) => {
                    const healthStatus: HealthStatus = data.metaData.userPodOverallHealth;
                    return MulticlusterGridBase.getHealthStatusIcon(healthStatus);
                }),
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 5 ?
                MulticlusterGridBase.convertSortOrderToSgSortOrder(this.props.sortOrder) : undefined,
            sortFunc: (a, b) => {
                const castedDataA = a as IGridLineObject<IMonitoredClusterMetaData>;
                if (!castedDataA || !castedDataA.metaData) {
                    throw new Error('unexpected data in sort of grid');
                }
                const castedDataB = b as IGridLineObject<IMonitoredClusterMetaData>;
                if (!castedDataB || !castedDataB.metaData) {
                    throw new Error('unexpected data in sort of grid');
                }

                // nib: Understand that the value in this column is a string representing a ratio. We don't want to sort the string, or
                // do any special parsing for it, or create a new sorting function. Therefore, we create a new GridLineObject for a and b
                // whose value is the numerical evaultion of the string, which is stored in a variable in a and b's metadata, and use
                // them to find the grid sort value
                const healthRatioA: number = castedDataA.metaData.userPodHealthRatio;
                const healthRatioB: number = castedDataB.metaData.userPodHealthRatio;

                if (healthRatioA === undefined || healthRatioB === undefined) {
                    console.log('healthRatioA:', healthRatioA);
                    console.log('healthRatioB:', healthRatioB);
                }

                const comparableA = new GridLineObject(healthRatioA, castedDataA.metaData);
                const comparableB = new GridLineObject(healthRatioB, castedDataB.metaData);

                return MulticlusterGridBase.gridSortValue(comparableA, comparableB, update(this.props, {}));
            },
            infoText: DisplayStrings.MulticlusterMonitoredGridColumnUserPodsInfoText
        });

        columnDefinitions.push({
            name: DisplayStrings.MulticlusterMonitoredGridColumnSystemPods,
            width: DEFAULT_PROP_COL_HEADER_WIDTH,
            cell: SGIconLinkCell(
                ({ value }) => (value === '- / -' ? '--' : value),
                MulticlusterGridBase.navigateToContainerInsightsControllersTab(this.props.messagingProvider,
                    {
                        nameSpace: 'system-pods',
                        startDateTimeISOString: moment(moment.utc()).add(-30, 'm').toDate().toISOString(),
                        endDateTimeISOString: moment.utc().toDate().toISOString(),
                        isTimeRelative: true,
                    }),
                (data: IGridLineObject<MonitoredClusterMetaData>) => {
                    const healthStatus: HealthStatus = data.metaData.systemPodOverallHealth;
                    return MulticlusterGridBase.getHealthStatusIcon(healthStatus);
                }),
            sortable: true,
            sortOrder: this.props.sortColumnIndex === 6 ?
                MulticlusterGridBase.convertSortOrderToSgSortOrder(this.props.sortOrder) : undefined,
            sortFunc: (a, b) => {
                const castedDataA = a as IGridLineObject<IMonitoredClusterMetaData>;
                if (!castedDataA || !castedDataA.metaData) {
                    throw new Error('unexpected data in sort of grid');
                }
                const castedDataB = b as IGridLineObject<IMonitoredClusterMetaData>;
                if (!castedDataB || !castedDataB.metaData) {
                    throw new Error('unexpected data in sort of grid');
                }

                // nib: Understand that the value in this column is a string representing a ratio. We don't want to sort the string, or
                // do any special parsing for it, or create a new sorting function. Therefore, we create a new GridLineObject for a and b
                // whose value is the numerical evaultion of the string, which is stored in a variable in a and b's metadata, and use
                // them to find the grid sort value
                const healthRatioA: number = castedDataA.metaData.systemPodHealthRatio;
                const healthRatioB: number = castedDataB.metaData.systemPodHealthRatio;

                if (healthRatioA === undefined || healthRatioB === undefined) {
                    console.log('healthRatioA:', healthRatioA);
                    console.log('healthRatioB:', healthRatioB);
                }

                const comparableA = new GridLineObject(healthRatioA, castedDataA.metaData);
                const comparableB = new GridLineObject(healthRatioB, castedDataB.metaData);

                return MulticlusterGridBase.gridSortValue(comparableA, comparableB, update(this.props, {}));
            },
            infoText: DisplayStrings.MulticlusterMonitoredGridColumnSystemPodsInfoText
        });

        return columnDefinitions;
    }


    /**
     *  handler to handle sort column changed
     * @param sortColumnIndex
     */
    private onSortColumnChanged(sortColumnIndex: number) {
        this.onSortOrderChanged(sortColumnIndex, SGSortOrder.Ascending);
    }

    /**
     * handler to handle the sort order change
     * @param sortColumnIndex
     * @param sortOrder
     */
    private onSortOrderChanged(sortColumnIndex: number, sortOrder: SGSortOrder) {
        this.props.onSortOrderChanged(
            sortColumnIndex,
            sortOrder === SGSortOrder.Ascending ? GridSortOrder.Asc : GridSortOrder.Desc);
    }
}
