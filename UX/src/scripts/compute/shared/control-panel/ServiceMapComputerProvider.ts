import * as $ from 'jquery';
import { IWorkspaceInfo } from '../../../shared/IWorkspaceInfo';
import { InitializationInfo, AuthorizationTokenType } from '../../../shared/InitializationInfo';

import { Promise } from 'es6-promise'
import { ITelemetry, IFinishableTelemetry } from '../../../shared/Telemetry';
import * as Constants from '../../../shared/GlobalConstants';

import { EnvironmentConfig } from '../../../shared/EnvironmentConfig';

import {IComputerInfo, IComputerList, IComputerProvider} from './ComputerProvider'

const armApiVersion: string = '2015-11-01-preview';
const queryTimeoutMs: number = Constants.MaxArmRequestTimeoutMs;

export class ServiceMapComputerProvider implements IComputerProvider {
    private telemetry: ITelemetry;
    private computerListSequenceNumber: number = 0;

    constructor(telemetry: ITelemetry) {
        this.telemetry = telemetry;
    }

    public getSortedComputerList(
        workspace: IWorkspaceInfo,
        maxRecords:  number,
        searchFilter: string,
        startDateTimeUtc: Date,
        endDateTimeUtc: Date,
        telemetryEventPrefix: string,
        resourceId?: string): Promise<IComputerList> {
        const eventName = `${telemetryEventPrefix}.GetSortedComputerList`;
        const telemetryContext: IFinishableTelemetry = this.telemetry.startLogEvent(
            eventName,
            { workspace_id: workspace.id, workspace_name: workspace.name },
            undefined);

        if (searchFilter) {
            throw new Error('Search filter is not supported by the ServiceMap computer provider yet');
        }

        // TODO: can use paging: switch the new API version of list machines to use paging
        const localComputerListSequenceNumber: number = ++this.computerListSequenceNumber;
        return $.ajax(this.getRequestDescriptor(workspace, startDateTimeUtc.toISOString(), endDateTimeUtc.toISOString()))
            .then((data: any) => {
                telemetryContext.complete();
                const computers = new Array<IComputerInfo>();

                if (localComputerListSequenceNumber !== this.computerListSequenceNumber
                    || !data || !data.value || data.value.length === 0) {
                    return {
                        searchFilter: undefined,
                        computers: computers,
                        hasMore: false
                    };
                }

                const list = data.value;

                for (let i = 0; i < list.length; i++) {
                    if (this.isComputerMachine(list[i])) {
                        computers.push({
                            computerName: list[i].properties.computerName,
                            displayName: list[i].properties.displayName,
                            id: list[i].id
                        });
                    }
                }

                const sortedComputers = computers.sort((a: IComputerInfo, b: IComputerInfo) => {
                    const aName = a.displayName.toLowerCase();
                    const bName = b.displayName.toLowerCase();

                    if (aName < bName) { return -1; }
                    if (aName > bName) { return 1; }

                    return 0;
                });

                return {
                    searchFilter: undefined,
                    computers: sortedComputers,
                    hasMore: false
                };

            }).catch((error) => {
                telemetryContext.fail(error, { message: `Failed to list service map computers.` });
            });
    }

    private isComputerMachine(item: any): boolean {
        if (!item.properties) { return false; }

        const kind = item.kind;

        if (!kind) { return false; }

        // TODO: kind should be machine confirm & remove if 'machines' api will not return anything other than computer/machine entity

        return kind === 'machine';
    }

    private getRequestDescriptor(workspace: IWorkspaceInfo, startDateTimeUtc: string, endDateTimeUtc: string): any {
        workspace.id = workspace.id.startsWith('/') ? workspace.id : `/${workspace.id}`;
        const queryUrl =
            EnvironmentConfig.Instance().getARMEndpoint() + workspace.id
            + '/features/serviceMap/machines?api-version=' + armApiVersion + '&live=true' + '&startTime=' + startDateTimeUtc
            + '&endTime=' + endDateTimeUtc;

        return {
            contentType: 'application/json',
            headers: {
                Authorization: InitializationInfo.getInstance().getAuthorizationHeaderValue(AuthorizationTokenType.Arm),
            },
            timeout: queryTimeoutMs,
            type: 'GET',
            url: queryUrl,
        };
    }

}
