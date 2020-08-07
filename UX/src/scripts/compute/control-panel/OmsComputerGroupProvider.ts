import * as $ from 'jquery';

import { IWorkspaceInfo } from '../../shared/IWorkspaceInfo';
import { InitializationInfo, AuthorizationTokenType } from '../../shared/InitializationInfo';

import { Promise } from 'es6-promise'
import { ITelemetry, IFinishableTelemetry } from '../../shared/Telemetry';
import * as Constants from '../../shared/GlobalConstants';
import { EnvironmentConfig } from '../../shared/EnvironmentConfig';

import { OmsComputerGroup } from '../../shared/ComputerGroup';

const armApiVersion: string = '2015-03-20';
const queryTimeoutMs: number = Constants.MaxArmRequestTimeoutMs;

const TelemetryEventsPrefix = 'Compute.DataProvider.OmsComputerGroupProvider';
/**
 * A provider for groups based on OMS computer groups.
 */
export class OmsComputerGroupProvider {
    private telemetry: ITelemetry;
    constructor(telemetry: ITelemetry) {
        this.telemetry = telemetry;
    }

    public getComputerGroupList(workspace: IWorkspaceInfo): Promise<OmsComputerGroup[]> {
        const eventName = `${TelemetryEventsPrefix}.GetComputerGroups`;
        const telemetryContext: IFinishableTelemetry = this.telemetry.startLogEvent(
            eventName,
            { workspace_id: workspace.id, workspace_name: workspace.name },
            undefined);

        return $.ajax(this.getRequestDescriptor(workspace))
                .then((data: any) => {
                    telemetryContext.complete();
                    const groups = new Array<OmsComputerGroup>();

                    if (!data) { return groups; }

                    const list = data.value;
                    if (!list || !list.length) { return groups; }

                    for (let i = 0; i < list.length; i++) {
                        if (this.isComputerGroup(list[i])) {
                            groups.push(new OmsComputerGroup(
                                list[i].id,
                                list[i].properties.DisplayName,
                                list[i].properties.FunctionAlias
                            ));
                        }
                    }

                    return groups;
                }).catch((error) => {
                    telemetryContext.fail(error);
                });
    }

    private isComputerGroup(item: any): boolean {
        if (!item || !item.properties) { return false; }

        const tags = item.properties.Tags;

        if (!tags || !tags.length) {  return false; }
        
        // find tag with name 'Group' and value 'Computer'
        for (let j = 0; j < tags.length; j++) {
            const name = tags[j].Name;
            const value = tags[j].Value;

            if ((name === 'Group') && (value === 'Computer')) {
                return true;
            }
        }

         return false;
    }

    private getRequestDescriptor(workspace: IWorkspaceInfo): any {
        const queryUrl =
              EnvironmentConfig.Instance().getARMEndpoint() + workspace.id
            + '/savedSearches?api-version=' + armApiVersion;

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
