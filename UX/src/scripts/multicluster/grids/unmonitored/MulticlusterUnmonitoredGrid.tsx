/** tpl */
import * as React from 'react';
import * as update from 'immutability-helper';
import { SGSortOrder, SGColumn, SGFormattedPlainCell, SGIconCell, SGDataRow } from 'appinsights-iframe-shared';

/** local */
import { MulticlusterGridBase, GridSortOrder, ClusterTypeDisplayNameMap } from '../MulticlusterGridBase';
import { IMulticlusterGridProps } from '../IMulticlusterGridProps';
import { MulticlusterGrid } from '../MulticlusterGrid';
import { ClusterType } from '../../metadata/IManagedCluster';

/** shared */
import { DisplayStrings } from '../../MulticlusterDisplayStrings';

/** styles */
import '../../../../styles/multicluster/GridPaneMulticluster.less';

/** svg */
import { UnknownSvg } from '../../../shared/svg/unknown';
import { EnableMonitoringLink } from './EnableMonitoringLink';
import { UnmonitoredClusterMetaData } from '../../metadata/UnmonitoredClusterMetaData';
import { IGridLineObject } from '../../../shared/GridLineObject';
import { SGIconLinkCell } from '../../../shared/SGIconLinkCell';
import { IMulticlusterMetaDataBase } from '../../metadata/IMulticlusterMetaDataBase';
import { SortHelper } from '../../../shared/SortHelper';

/** constants */
const DEFAULT_PROP_COL_HEADER_WIDTH: number = 0;

export class MulticlusterUnmonitoredGrid extends React.Component<IMulticlusterGridProps> {
    constructor(props: IMulticlusterGridProps) {
        super(props);

        // Function bindings
        this.onSortColumnChanged = this.onSortColumnChanged.bind(this);
        this.onSortOrderChanged = this.onSortOrderChanged.bind(this);
    }

    /**
     * Renders UnMonitored Grid
     */
    public render(): JSX.Element {
        const filteredGridData: SGDataRow[] =
            MulticlusterGridBase.filterGridData(update(this.toGridData(this.props.gridData), {}), this.props.nameSearchFilterValue);
        const itemCountStr: string = MulticlusterGridBase.getGridItemCount(update(this.props.gridData, {}), filteredGridData);
        // TODO: nib: We don't use Kusto sort order, so we shoudn't have to do any converting here
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
                    isMonitoredGrid={false}
                />
            </div>
        );
    }

    /**
     * columnDefinition for the Non-Monitored grid
     */
    private getColumnDefinition(): SGColumn[] {
        let columnDefinitions = [];

        columnDefinitions.push({
            name: DisplayStrings.MulticlusterUnmonitoredGridColumnClusterName,
            width: DEFAULT_PROP_COL_HEADER_WIDTH,
            cell: SGIconLinkCell(
                ({ value }) => value,
                MulticlusterGridBase.navigateToAKSOverview(this.props.messagingProvider),
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
            name: DisplayStrings.MulticlusterUnmonitoredGridColumnMonitoring,
            width: DEFAULT_PROP_COL_HEADER_WIDTH,
            cell: EnableMonitoringLink(this.props.messagingProvider),
            infoText: DisplayStrings.MulticlusterUnmonitoredGridColumnMonitoringInfoText
        });

        columnDefinitions.push({
            name: DisplayStrings.MulticlusterUnmonitoredGridColumnStatus,
            width: DEFAULT_PROP_COL_HEADER_WIDTH,
            cell: SGIconCell(({ value }) => value, data => <UnknownSvg />),
            infoText: DisplayStrings.MulticlusterUnmonitoredGridColumnStatusInfoText
        });

        columnDefinitions.push({
            name: DisplayStrings.MulticlusterUnmonitoredGridColumnNodes,
            width: DEFAULT_PROP_COL_HEADER_WIDTH,
            cell: SGFormattedPlainCell(({ value }) => (value === '-' ? '--' : value)),
            infoText: DisplayStrings.MulticlusterUnmonitoredGridColumnNodesInfoText
        });

        columnDefinitions.push({
            name: DisplayStrings.MulticlusterUnmonitoredGridColumnUserPods,
            width: DEFAULT_PROP_COL_HEADER_WIDTH,
            cell: SGFormattedPlainCell(({ value }) => (value === '-' ? '--' : value)),
            infoText: DisplayStrings.MulticlusterUnmonitoredGridColumnUserPodsInfoText
        });

        columnDefinitions.push({
            name: DisplayStrings.MulticlusterUnmonitoredGridColumnSystemPods,
            width: DEFAULT_PROP_COL_HEADER_WIDTH,
            cell: SGFormattedPlainCell(({ value }) => (value === '-' ? '--' : value)),
            infoText: DisplayStrings.MulticlusterUnmonitoredGridColumnSystemPodsInfoText
        });

        return columnDefinitions;
    }

    /**
     * handler to handle the sort column changed
     * @param sortColumnIndex
     */
    private onSortColumnChanged(sortColumnIndex: number) {
        this.onSortOrderChanged(sortColumnIndex, SGSortOrder.Ascending);
    }

    /**
     * handler to handle sort order change event
     * @param sortColumnIndex
     * @param sortOrder
     */
    private onSortOrderChanged(sortColumnIndex: number, sortOrder: SGSortOrder) {
        this.props.onSortOrderChanged(
            sortColumnIndex,
            sortOrder === SGSortOrder.Ascending ? GridSortOrder.Asc : GridSortOrder.Desc);
    }


    /**
     * Formats the interpreted Kusto response into something Selectable Grid can understand
     * Gives each row a child row that acts as a loading indicator for the child query that is
     * executed when the row is expanded for the first time.
     * @param clusterGridLineObjectList
     * @return an array of SGDataRows used in rendering selectable grid
     */
    private toGridData(clusterGridLineObjectList: IGridLineObject<UnmonitoredClusterMetaData>[][]): Array<SGDataRow> {
        const rows = new Array<SGDataRow>();

        if (clusterGridLineObjectList && (clusterGridLineObjectList.length > 0)) {
            for (let i = 0; i < clusterGridLineObjectList.length; i++) {
                let clusterGridLineObject = clusterGridLineObjectList[i];
                let clusterKey = `${i}`;
                let row = new SGDataRow(clusterGridLineObject, clusterKey);
                rows.push(row);
            }
        }

        return rows;
    }
}
