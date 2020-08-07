import { IWorkspaceInfo } from '../../../shared/IWorkspaceInfo';

import { Promise } from 'es6-promise'
import { ITelemetry, IFinishableTelemetry } from '../../../shared/Telemetry';

import { IKustoDataProvider, IKustoQueryOptions } from '../../../shared/data-provider/KustoDataProvider';
import { QueryTemplate, Placeholder } from '../../data-provider/QueryTemplate';
import { ComputeKustoQueryOptions } from '../../shared/ComputeKustoQueryOptions';

import { IComputerInfo, IComputerList, IComputerProvider } from './ComputerProvider'
import { ApiClientRequestInfoBladeName } from '../../../shared/data-provider/ApiClientRequestInfo';

export class OmsComputerProvider implements IComputerProvider {
    private telemetry: ITelemetry;
    private kustoDataProvider: IKustoDataProvider;

    constructor(telemetry: ITelemetry, kustoDataProvider: IKustoDataProvider) {
        this.telemetry = telemetry;
        this.kustoDataProvider = kustoDataProvider;
    }

    private static fillInParameters(
        queryTemplate: string,
        startDateTimeUtc: Date,
        endDateTimeUtc: Date,
        maxRecords: number,
        displayNameFilter: string,
        resourceIdFilter: string
    ): string {
        return queryTemplate
            .replace(Placeholder.StartDateTime, startDateTimeUtc.toISOString())
            .replace(Placeholder.EndDateTime, endDateTimeUtc.toISOString())
            .replace(Placeholder.DisplayNameFilter, displayNameFilter)
            .replace(Placeholder.MaxRecords, String(maxRecords))
            .replace(Placeholder.AzureResourceIdFilter, resourceIdFilter);
    }

    private static processResponse(result: any, workspace: IWorkspaceInfo, maxRecords: number, searchFilter: string): IComputerList {
        if (!result || !result.Tables || (result.Tables.length === 0 || !result.Tables[0] || !result.Tables[0].Rows)) {
            return null;
        }

        const rows = result.Tables[0].Rows;
        const computerList: IComputerInfo[] = [];

        for (let i = 0; i < Math.min(maxRecords, rows.length); ++i) {
            computerList.push({
                id: workspace.id + '/features/serviceMap/machines/' + rows[i][0],
                computerName: rows[i][1],
                displayName: rows[i][2]
            });
        }

        return {
            searchFilter: searchFilter,
            computers: computerList,
            hasMore: rows.length > maxRecords,
        };
    }

    public getSortedComputerList(
        workspace: IWorkspaceInfo,
        maxRecords: number,
        searchFilter: string,
        startDateTimeUtc: Date,
        endDateTimeUtc: Date,
        telemetryEventPrefix: string,
        resourceId?: string): Promise<IComputerList> {

        const eventName = `${telemetryEventPrefix}.GetSortedComputerList`;
        const telemetryContext: IFinishableTelemetry = this.telemetry.startLogEvent(
            eventName,
            {
                workspace_id: workspace.id,
                workspace_name: workspace.name,
                searchFilter: searchFilter,
                maxRecords: String(maxRecords)
            },
            undefined);

        // At present we update ServiceMapComputer_CL once per hour. If the time window that has been passed
        // here is less than 2h, we deliberately move the start time, to ensure a time window of 2h. This will
        // ensure that we get a record for every VM, as well as allow for some ingestion lag.

        const minTimespan = 2 * 3600 * 1000;
        if (endDateTimeUtc.getTime() - startDateTimeUtc.getTime() < minTimespan) {
            startDateTimeUtc = new Date(endDateTimeUtc.getTime() - minTimespan);
        }

        const queryOptions: IKustoQueryOptions = new ComputeKustoQueryOptions(
            {
                queryName: eventName,
                bladeName: ApiClientRequestInfoBladeName.AtScale,
                isInitialBladeLoad: false
            }, startDateTimeUtc, endDateTimeUtc);

        let displayNameFilter = '';
        if (searchFilter) {
            displayNameFilter = `| where DisplayName contains '${searchFilter}'`;
        }

        let resourceIdFilter = '';
        if (resourceId) {
            resourceIdFilter = `| where AzureResourceId_s startswith '${resourceId + '/'}'`;
        }

        // we always attempt to retrieve one record more than what was requested
        if (maxRecords == null) {
            maxRecords = 1001;
        } else {
            maxRecords += 1;
        }

        const query: string = OmsComputerProvider.fillInParameters(
            QueryTemplate.ServiceMapComputerList,
            startDateTimeUtc,
            endDateTimeUtc,
            maxRecords,
            displayNameFilter,
            resourceIdFilter);

        return this.kustoDataProvider.executeDraftQuery({workspace, query, queryOptions})
            .then((data) => {
                telemetryContext.complete();
                return OmsComputerProvider.processResponse(data, workspace, maxRecords - 1, searchFilter);
            })
            .catch((error) => {
                telemetryContext.fail(error);
                // FIXME: is this the right way to propagate the error?
                throw error;
            });
    }
}
