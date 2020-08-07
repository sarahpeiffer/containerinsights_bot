import { Promise } from 'es6-promise';

import { Placeholder, PlaceholderSubstitute } from '../data-provider/QueryTemplates/CommonQueryTemplate';
import { ControlPanelQueryTemplate } from '../data-provider/QueryTemplates/ControlPanelQueryTemplate';

import { IWorkspaceInfo } from '../../shared/IWorkspaceInfo';
import { IKustoDataProvider, IKustoQueryOptions } from '../../shared/data-provider/KustoDataProvider';
import { ITimeInterval } from '../../shared/data-provider/TimeInterval';
import { StringHelpers } from '../../shared/Utilities/StringHelpers';

/**
 * Contract as established by Kusto currently... if you add more types to the kusto query,
 * make sure to add them here as well (treat this like a .d.ts typings like file overtop of kusto)
 */
export interface IFilterRecord {
    Namespace: string;
    Cluster: string;
    Service: string;
    Node: string;
    'Node Pool': string;
    ControllerKind: string;
}

/**
 * List of possible pill dimensions
 * NB
 * This is a copy of the enum from ContainerControlPanel
 * We don't want to import the enum from ContainerControlPanel
 * because that will cause the PillProvider.spec.ts file to need to import Q
 * will lead to the build failing
 */
export enum PillDimension {
    Node = 'Node',
    Service = 'Service',
    Namespace = 'Namespace',
    NodePool = 'Node Pool',
    Workspace = 'Workspace',
    Cluster = 'Cluster',
    TimeRange = 'Time Range',
    ControllerName = 'ControllerName',
    ControllerKind = 'ControllerKind'
}

/**
 * Maps a column name to the appropriate column index in the response table for pill data 
 */
export enum PillDataReponseTableColumnMap {
    Node = 0,
    Service = 1,
    Namespace = 2,
    Cluster = 3,
    NodePool = 4,
    ControllerName = 5,
    ControllerKind = 6
}

/**
 * Pill provider class. Capable of querying kusto and filtering those kusto responses for pill to pill
 * filter interactions.
 */
export class PillProvider {
    private dataProvider: IKustoDataProvider;

    /**
     * .ctor() establish the provider
     * @param dataProvider kusto provider used to retrieve the pill data
     */
    public constructor(dataProvider: IKustoDataProvider) {
        this.dataProvider = dataProvider;
    }

    /**
     * provided with a list of possible combinations of fill values by dimensions, this function
     * will apply filter to filter selections and return a list of possible choices for each
     * of the pill symbols... eg. Node: ['node1', 'node2'], Cluster: ['cluster1'], etc
     * @param pillData complete full outer joined kusto data representing every possible choice
     * @param selections current selections made in the user interface (for pill to pill interactions)
     */
    public applySelectionFilters(pillData: IFilterRecord[], selections: IFilterRecord): StringMap<string[]> {
        if (!pillData) { return null; }

        const result = {};

        const columns = Object.keys(selections) as PillDimension[]; // Each of the Filter Records should correspond to a PillDimension
        columns.forEach((column) => {
            result[column] = this.getFilterForSelectedColumn(pillData, selections, column);
        });

        return result;
    }

    /**
     * given a workspace and time interval retrieve all possible pill value combinations
     * full outer joined... the pill filtering mechanism will handle the rest!
     * @param workspace selected workspace we are operating on
     * @param timeInterval time interval range to query for
     * @param clusterId fully qualified resource id of the cluster
     * @param clusterName name of the cluster
     * @param requestId request id
     */
    public getPillData(
        workspace: IWorkspaceInfo,
        timeInterval: ITimeInterval,
        clusterId: string,
        clusterName: string,
        requestId?: string,
    ): Promise<IFilterRecord[]> {
        let queryOptions: IKustoQueryOptions = {
            timeInterval: timeInterval,
            preferences: 'exclude-functions,exclude-customFields,exclude-customLogs'
        };

        if (requestId) { queryOptions.requestId = requestId; }

        return this.dataProvider.executeDraftQuery({workspace, query: this.buildQuery(timeInterval, clusterId, clusterName), queryOptions})
            .then((data: any) => {
                const groups = new Array<IFilterRecord>();

                if (!data || !data.Tables || (data.Tables.length === 0) ||
                    !data.Tables[0].Rows || (data.Tables[0].Rows.length === 0)) {
                    return groups;
                }

                const resultRows = data.Tables[0].Rows;
                for (let i = 0; i < resultRows.length; i++) {
                    const resultRow = resultRows[i];

                    // project Computer, ServiceName, Namespace, ClusterName, AgentPool, ControllerKind, ControllerName
                    groups.push({
                        Node: resultRow[PillDataReponseTableColumnMap.Node],
                        Service: resultRow[PillDataReponseTableColumnMap.Service],
                        Namespace: resultRow[PillDataReponseTableColumnMap.Namespace],
                        Cluster: resultRow[PillDataReponseTableColumnMap.Cluster],
                        [PillDimension.NodePool]: resultRow[PillDataReponseTableColumnMap.NodePool],
                        ControllerKind: resultRow[PillDataReponseTableColumnMap.ControllerKind],
                    });
                }

                return groups;
            });
    }

    /**
     * populate the raw kusto query with some where clause goodness
     * @param timeInterval time interval for the where clauses...
     * @param clusterResourceId fully qualified resource id of the cluster
     * @param clusterName name of the cluster
     */
    private buildQuery(timeInterval: ITimeInterval, clusterResourceId: string, clusterName: string): string {
        let query = ControlPanelQueryTemplate.PillFilters;
        if (!query) {
            return null;
        }

        // bbax: dont ask Kusto for the future... Vitaly said this is a bad idea
        // since some things can happen in the future
        let targetEndDate = timeInterval.getBestGranularEndDate(true);

        const clusterFilter = PlaceholderSubstitute.ClusterFilter(clusterResourceId, clusterName);
        query = StringHelpers.replaceAll(query, Placeholder.ClusterFilter, clusterFilter);

        return query
            .replace(Placeholder.StartDateTime, timeInterval.getBestGranularStartDate().toISOString())
            .replace(Placeholder.EndDateTime, targetEndDate.toISOString());
    }

    /**
     * given a potential candidate pill row to be considered, the current selections and the target we are considering
     * this row for, should this row be allowed or not? eg:
     *
     * pillCandidate [{Node: 'node1', Cluster: 'cluster1', Namespace: 'fun', Service: 'service'}]
     * selections [Node: null, Cluster: null, Namepsace: 'nofun', Service: null]
     *
     * If selectedTarget is Namespace then yes this should be considered still (even though it wasn't selected) because
     * the Namespace pill still needs to show "fun" as an option
     *
     * If Selected target is anything else though it is no longer a candidate row because this row is not relevant
     *
     * @param pillCandidate candidate row from the full outer join
     * @param selections current selections in the user interface
     * @param selectedTarget the target we are considering right now (Node, Cluster, etc)
     */
    private isRowAllowedForFilter(pillCandidate: IFilterRecord, selections: IFilterRecord, selectedTarget: PillDimension): boolean {
        // All the pill dimensions except the one that we are considering to change
        const selectionKeys = Object.keys(selections).filter((selection) => { return selection !== selectedTarget }); 
        let shouldExistOnSelectedTarget = true;

        selectionKeys.forEach((selectionKey) => {
            // bbax: empty selections should be ignored for filtering purposes
            if (selections[selectionKey] === '') { return; }

            // Regardless of the value of the selectionKey, if we are changing this selectionKey, 
            // then we want to show all values for the selectionKey
            if (selectionKey === selectedTarget) { return; } 

            // Special case for kube-system
            if (selections[selectionKey] === '~') {
                const overrideTarget = 'kube-system';
                if (pillCandidate[selectionKey] === overrideTarget) {
                    shouldExistOnSelectedTarget = false;
                }
            } else {
                // Example: 
                // selectedTarget: PillDimension.Namespace
                // pillCandidate: { Node: 'node1', Namespace: 'Nick'sDominion',...}
                // selections: { Node: 'node2', Namespace: '', ... }
                if (pillCandidate[selectionKey] !== selections[selectionKey]) {
                    shouldExistOnSelectedTarget = false;
                }
            }
        });

        return shouldExistOnSelectedTarget;
    }

    /**
     * Presented with a pill (ie: Node, Cluster, Namespace, etc) enumerate through the raw fully outer joined possibilities
     * and determine based on UI selections and the data what options should be available for that given pill
     * @param pillData raw fully outer joined kusto data
     * @param selections current UI selections
     * @param selectedTarget the pill we are looking at right now (Cluster, Node, etc)
     */
    private getFilterForSelectedColumn(pillData: IFilterRecord[], selections: IFilterRecord, selectedTarget: PillDimension): string[] {
        const result: string[] = [];
        const duplicateHash: StringMap<boolean> = {};

        pillData.forEach((pillCandidate) => {
            if (!pillCandidate[selectedTarget]) { return; } // The entry in the row for the selected target is missing

            // bbax: the "other" selections may or may not have eliminated options...
            if (!this.isRowAllowedForFilter(pillCandidate, selections, selectedTarget)) { return; }

            // bbax: deduplicate options already in the list.
            if (duplicateHash.hasOwnProperty(pillCandidate[selectedTarget])) { return; }

            duplicateHash[pillCandidate[selectedTarget]] = true;
            result.push(pillCandidate[selectedTarget]);
        });

        return result;
    }
}
