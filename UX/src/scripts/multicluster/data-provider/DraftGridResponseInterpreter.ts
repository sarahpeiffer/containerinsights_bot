/** local */
import { IMonitoredClustersQueryResponseResultRow, ResponseStatus } from './IMonitoredClustersQueryResponseResultRow'
import { IRequestInfo } from './IRequestInfo';
import { IResourceStatusObj } from '../metadata/IResourceStatusObj';
import { MonitoredClusterMetaData, MonitoredClusterMetricColumn } from '../metadata/MonitoredClusterMetaData';
import { IManagedCluster } from '../metadata/IManagedCluster';
import { DisplayStrings } from '../MulticlusterDisplayStrings';

/** shared */
import { IGridLineObject } from '../../shared/GridLineObject';
import { HttpResponseStatusCode } from '../../shared/GlobalConstants'
import { IKustoResponse } from '../../shared/data-provider/v2/KustoDataProvider';
import { IHttpRequestError } from '../../shared/data-provider/HttpRequestError';
import { StringHelpers } from '../../shared/Utilities/StringHelpers';

/**
 * Implementation of Draft Response Interpreter
 * which interprets response of the Draft Batched request and constructs ResultRows
 */
export class DraftGridResponseInterpreter {

    /**
     *  returns the NoData result Rows
     * @param reqInfo
     * @param actualClusterResIds - actual clusterIds in the response
     */
    private static getNoDataResultRows(reqInfo: IRequestInfo, actualClusterResIds: string[]):
        IMonitoredClustersQueryResponseResultRow[] {

        const expectedClusterResIds: string[] = reqInfo.clusterResourceIds;
        const reportedLogAnalyticsWorkspace: string = reqInfo.workspaceResourceId;

        let noDataResultRows: IMonitoredClustersQueryResponseResultRow[] = [];

        if (actualClusterResIds.length < expectedClusterResIds.length) {
            expectedClusterResIds.forEach((clusterResId) => {
                if (actualClusterResIds.indexOf(clusterResId) === -1) {
                    const resultRow: IMonitoredClustersQueryResponseResultRow = {
                        clusterResourceId: clusterResId,
                        nodes: [],
                        userPods: [],
                        systemPods: [],
                        responseStatusCode: ResponseStatus.NoData,
                        clusterVersion: DisplayStrings.UnknownVersion,
                        errorInfoText:
                            StringHelpers.replaceAll(DisplayStrings.NoDataInfoText,
                                '{0}',
                                DraftGridResponseInterpreter.getWorkspaceNameFromResourceId(reportedLogAnalyticsWorkspace))
                    };

                    noDataResultRows.push(resultRow)
                }

            });

        } else if (actualClusterResIds.length > expectedClusterResIds.length) {
            throw new Error('Draft returned a rows more than expected');
        }

        return noDataResultRows;
    }

    /**
     *  returns the rows  in failed request
     * @param requestInfo - request info
     * @param response - response from Kusto
     */
    private static getFailedRequestResultRows(requestInfo: IRequestInfo, response: IKustoResponse):
        IMonitoredClustersQueryResponseResultRow[] {

        const expectedClusterResIds: string[] = requestInfo.clusterResourceIds;
        const reportedLogAnalyticsWorkspace: string = requestInfo.workspaceResourceId;

        let errorResultRows: IMonitoredClustersQueryResponseResultRow[] = [];

        expectedClusterResIds.forEach(clusterResId => {

            const resultRow: IMonitoredClustersQueryResponseResultRow = {
                clusterResourceId: clusterResId,
                nodes: [],
                userPods: [],
                systemPods: [],
                clusterVersion: DisplayStrings.UnknownVersion,
                responseStatusCode: DraftGridResponseInterpreter.convertHttpStatusCodeToResponseStatusCode(response.error),
                errorInfoText: response ?
                    DraftGridResponseInterpreter.getErrorInfoMessage(reportedLogAnalyticsWorkspace, response.error) :
                    DisplayStrings.UnknownInfoText,
            };

            errorResultRows.push(resultRow)

        });

        return errorResultRows;
    }

    /**
     * get the resultrows for the non-existent workspaces
     * used only for the initial load.
     * @param nonExistentWorkspaceToClustersMapping
     */
    private static getNonExistentWorkspacesResultRows(nonExistentWorkspaceToClustersMapping: StringMap<string[]>):
        IMonitoredClustersQueryResponseResultRow[] {
        let nonExistentWorkspaceResultRows: IMonitoredClustersQueryResponseResultRow[] = [];

        for (const workspaceId in nonExistentWorkspaceToClustersMapping) {
            if (nonExistentWorkspaceToClustersMapping.hasOwnProperty(workspaceId)) {
                const clusterResourceIds = nonExistentWorkspaceToClustersMapping[workspaceId];
                const errorInfoMessage = StringHelpers.replaceAll(
                    DisplayStrings.WorkspaceDeletedOrUnAuthorizedInfoText, '{0}', workspaceId);
                clusterResourceIds.forEach(clusterId => {
                    const resultRow: IMonitoredClustersQueryResponseResultRow = {
                        clusterResourceId: clusterId,
                        nodes: [],
                        userPods: [],
                        systemPods: [],
                        clusterVersion: DisplayStrings.UnknownVersion,
                        responseStatusCode: ResponseStatus.Unknown,
                        errorInfoText: errorInfoMessage
                    };

                    nonExistentWorkspaceResultRows.push(resultRow);
                });
            }
        }

        return nonExistentWorkspaceResultRows;
    }
    /**
     * returns the actionable display error message
     * @param reportedLogAnalyticsWorkspace - workspace Id
     * @param error - IHttpRequestError
     * Ref - https://dev.loganalytics.io/documentation/Using-the-API/Batch-Queries
     */
    private static getErrorInfoMessage(
        reportedLogAnalyticsWorkspace: string,
        error: IHttpRequestError): string {
        let errorInfoMessage = DisplayStrings.UnknownInfoText;

        if (!error) {
            return errorInfoMessage;
        }

        const statusCode: number = error.status;

        switch (statusCode) {
            case HttpResponseStatusCode.Unauthorized:
            case HttpResponseStatusCode.Forbidden:
                errorInfoMessage = StringHelpers.replaceAll(DisplayStrings.UnauthorizedInfoText,
                    '{0}',
                    DraftGridResponseInterpreter.getWorkspaceNameFromResourceId(reportedLogAnalyticsWorkspace));
                break;
            case HttpResponseStatusCode.NotFound:
                errorInfoMessage = StringHelpers.replaceAll(DisplayStrings.WorkspaceNotFoundInfoText,
                    '{0}',
                    DraftGridResponseInterpreter.getWorkspaceNameFromResourceId(reportedLogAnalyticsWorkspace));
                break;
            case HttpResponseStatusCode.BadRequest:
                errorInfoMessage = StringHelpers.replaceAll(DisplayStrings.MisconfiguredInfoText,
                    '{0}',
                    DraftGridResponseInterpreter.getWorkspaceNameFromResourceId(reportedLogAnalyticsWorkspace));
                break;
            default:
                errorInfoMessage = (error.origin && error.origin.body && error.origin.body.message)
                    ? error.origin.body.message : DisplayStrings.UnknownInfoText;
                break;
        }

        return errorInfoMessage;
    }

    /**
     * convert http response status code to response status code
     * @param error - http request error
     */
    private static convertHttpStatusCodeToResponseStatusCode(error: IHttpRequestError): ResponseStatus {
        let respStatus = ResponseStatus.Unknown;

        if (!error || !error.status) {
            return respStatus;
        }

        if (error.status >= 500 && error.status < 600) {
            respStatus = ResponseStatus.Error;
            return respStatus;
        }

        switch (error.status) {
            case HttpResponseStatusCode.Unauthorized:
            case HttpResponseStatusCode.Forbidden:
                respStatus = ResponseStatus.UnAuthorized;
                break;
            case HttpResponseStatusCode.NotFound:
                respStatus = ResponseStatus.NotFound;
                break;
            case HttpResponseStatusCode.BadRequest:
                respStatus = ResponseStatus.Misconfigured;
                break;
            default:
                respStatus = ResponseStatus.Unknown;
                break;
        }

        return respStatus;
    }

    /**
     *  returns the rows in successful request
     * @param reqInfo - request information
     * @param response - kusto response
     */
    private static getSuccessfulRequestResultRows(reqInfo: IRequestInfo, response: IKustoResponse):
        IMonitoredClustersQueryResponseResultRow[] {

        const expectedClusterResIds = reqInfo.clusterResourceIds;
        let actualClusterResIds: string[] = [];
        let resultRows: IMonitoredClustersQueryResponseResultRow[] = [];

        if (response.result && response.result.tables && response.result.tables.length > 0) {
            response.result.tables.forEach(table => {

                if (table && table.rows && table.rows.length > 0) {

                    table.rows.forEach(row => {
                        if (row) {

                            const clusterResId: string = row[MonitoredClusterMetricColumn.ClusterId];

                            if (actualClusterResIds.indexOf(clusterResId) === -1) {
                                actualClusterResIds.push(clusterResId);
                            }

                            const resultRow: IMonitoredClustersQueryResponseResultRow =
                                DraftGridResponseInterpreter.getSuccesfulResultRow(row, clusterResId);

                            resultRows.push(resultRow);
                        }
                    });
                }
            });
        }

        if (actualClusterResIds.length < expectedClusterResIds.length) {
            const noDataReportedResultRows = this.getNoDataResultRows(reqInfo, actualClusterResIds);

            if (noDataReportedResultRows && noDataReportedResultRows.length > 0) {
                noDataReportedResultRows.forEach(resultRow => {
                    resultRows.push(resultRow);
                });
            }
        }

        return resultRows;
    }

    /**
     *  returns the successful result Row
     * @param row - result row in Kusto response entry
     * @param clusterResId - resource Id of the cluster
     */
    private static getSuccesfulResultRow(row: any, clusterResId: string): IMonitoredClustersQueryResponseResultRow {

        const nodesStatusJsonString: string = row[MonitoredClusterMetricColumn.Nodes];
        let nodeStatusObjs: IResourceStatusObj[] = [];
        if (nodesStatusJsonString) {
            nodeStatusObjs = JSON.parse(nodesStatusJsonString);
        }

        const userPodsStatusJsonString: string = row[MonitoredClusterMetricColumn.UserPods];
        let userPodsStatusObjs: IResourceStatusObj[] = [];
        if (userPodsStatusJsonString) {
            userPodsStatusObjs = JSON.parse(userPodsStatusJsonString);
        }

        const systemPodsStatusJsonString: string = row[MonitoredClusterMetricColumn.SystemPods];
        let systemPodsStatusObjs: IResourceStatusObj[] = [];
        if (systemPodsStatusJsonString) {
            systemPodsStatusObjs = JSON.parse(systemPodsStatusJsonString);
        }

        const clusterVersion: string = row[MonitoredClusterMetricColumn.ClusterVersion];


        const resultRow: IMonitoredClustersQueryResponseResultRow = {
            clusterResourceId: clusterResId,
            nodes: nodeStatusObjs,
            userPods: userPodsStatusObjs,
            systemPods: systemPodsStatusObjs,
            responseStatusCode: ResponseStatus.Success,
            clusterVersion: clusterVersion,
        };

        return resultRow;
    }

    /**
     *  returns the all result rows (successful, nodata and failed requests)
     * @param result - result of the Kusto query
     * @param requestsInfo - informations about the requests in Batch API
     */
    private static getAllResultRows(result: any,
        requestsInfo: IRequestInfo[],
        nonExistentWorkspaceToClustersMapping?: StringMap<string[]>):
        IMonitoredClustersQueryResponseResultRow[] {

        let resultRows: IMonitoredClustersQueryResponseResultRow[] = [];

        if (result) {
            requestsInfo.forEach(reqInfo => {
                const requestId = reqInfo.requestId;
                const response = result[requestId];
                if (response) {
                    if (response.status === HttpResponseStatusCode.OK) {
                        const successfulRows: IMonitoredClustersQueryResponseResultRow[] =
                            this.getSuccessfulRequestResultRows(reqInfo, response);
                        if (successfulRows && successfulRows.length > 0) {
                            successfulRows.forEach(resultRow => {
                                resultRows.push(resultRow);
                            });
                        }

                    } else {
                        const errorRows: IMonitoredClustersQueryResponseResultRow[] =
                            this.getFailedRequestResultRows(reqInfo, response);
                        if (errorRows && errorRows.length > 0) {
                            errorRows.forEach(resultRow => {
                                resultRows.push(resultRow);
                            });
                        }
                    }
                } else {
                    throw new Error(`Draft doesn't have the response associated to the request id: ${requestId}`);
                }

            });
        }

        if (nonExistentWorkspaceToClustersMapping) {
            const notFoundErrorRows: IMonitoredClustersQueryResponseResultRow[] =
                this.getNonExistentWorkspacesResultRows(nonExistentWorkspaceToClustersMapping);
            if (notFoundErrorRows && notFoundErrorRows.length > 0) {
                notFoundErrorRows.forEach(resultRow => {
                    resultRows.push(resultRow);
                });
            }
        }

        if (resultRows.length === 0) {
            return null;
        }

        return resultRows;
    }

    /**
    * extract workspaceName from Log Analytics workspace Id
    * /subscriptions/<subId>/resourceGroups/<rgName>/providers/Microsoft.OperationalInsights/workspaces/<workspaceName>
    * @param workspaceResourceId
    */
    private static getWorkspaceNameFromResourceId(workspaceResourceId: string): string {

        let resourceParts: string[] = workspaceResourceId.split('/');

        if ((resourceParts.length === 0) || (resourceParts.length < 8)) {
            return workspaceResourceId;
        }

        return resourceParts[8];
    }

    /**
     *
     * @param clusterResourceId - azure resource id of the cluster
     */
    private static isManagedCluster(clusterResourceId: string): boolean {
        return (clusterResourceId && (clusterResourceId.toLocaleLowerCase().indexOf('/microsoft.containerservice/managedclusters') >= 0
            || clusterResourceId.toLocaleLowerCase().indexOf('/microsoft.containerservice/openshiftmanagedclusters') >= 0
            || clusterResourceId.toLocaleLowerCase().indexOf('/microsoft.kubernetes/connectedclusters') >= 0
            || clusterResourceId.toLocaleLowerCase().indexOf('/microsoft.redhatopenshift/openshiftclusters') >= 0)
        );
    }

    /**
     * returns list of GridLineObjects with MonitoredClusterMetadata
     * @param result - result for the Kusto query
     * @param managedClusterList - list of managed clusters
     * @param requestsInfo - information about the requests in Batch API call
     */
    public processMonitoredClustersGridQueryResult(
        result: any,
        managedClusterList: IManagedCluster[],
        requestsInfo: IRequestInfo[],
        nonExistentWorkspaceToClustersMapping?: StringMap<string[]>
    ): IGridLineObject<MonitoredClusterMetaData>[][] {

        const resultRows = DraftGridResponseInterpreter.getAllResultRows(result,
            requestsInfo,
            nonExistentWorkspaceToClustersMapping);
        if (!resultRows) {
            return null;
        }

        // hashtable object-name => object-index-in-array
        const clusterDictionary: StringMap<MonitoredClusterMetaData> = {};
        const clusterMetaDataList: MonitoredClusterMetaData[] = [];

        for (let i = 0; i < resultRows.length; i++) {
            // each row is an array of values for columns
            const resultRow: IMonitoredClustersQueryResponseResultRow = resultRows[i];

            const clusterId: string = resultRow.clusterResourceId;

            const managedCluster: IManagedCluster =
                managedClusterList.filter(managedCluster => (
                    DraftGridResponseInterpreter.isManagedCluster(managedCluster.resourceId)
                    && managedCluster.resourceId.toLowerCase() === clusterId.toLowerCase())
                    || (managedCluster.name.toLowerCase() === clusterId.toLowerCase()))[0];
            if (!managedCluster) {
                throw new Error(`Draft returned a row that doesn\'t correspond to a cluster in the monitored cluster list
                    \n clusterId: ${clusterId}`);
            }

            // see if we've seen this object name
            if (clusterDictionary[clusterId] === undefined) {
                const metaData = new MonitoredClusterMetaData(resultRow, managedCluster);
                clusterDictionary[clusterId] = metaData;
                clusterMetaDataList.push(metaData);
            }
        }

        const clusterGridLineObjectList: IGridLineObject<MonitoredClusterMetaData>[][] = [];

        clusterMetaDataList.forEach((obj) => {
            clusterGridLineObjectList.push(obj.formatMonitoredClusterRow());
        });

        return clusterGridLineObjectList;
    }
}
