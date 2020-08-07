import * as $ from 'jquery';

import { IWorkspaceInfo } from '../../shared/IWorkspaceInfo';
import { InitializationInfo, AuthorizationTokenType } from '../../shared/InitializationInfo';

import { Promise } from 'es6-promise'
import { ITelemetry, IFinishableTelemetry } from '../../shared/Telemetry';
import * as Constants from '../../shared/GlobalConstants';
import { EnvironmentConfig } from '../../shared/EnvironmentConfig';
import { newGuid } from '@appinsights/aichartcore';

import {
    ServiceMapComputerGroup,
    ServiceMapGroupType,
    IServiceMapGroupResolver,
    IResolvedComputerGroup,
    IComputerGroupMember
} from '../../shared/ComputerGroup';

const queryTimeoutMs: number = Constants.MaxArmRequestTimeoutMs;
const apiVersion: string = Constants.ServiceMapApiVersion;
const TelemetryEventsPrefix = 'Compute.DataProvider.ServiceMapGroupProvider';

/**
 * A group provider based on ServiceMap machine groups.
 */
export class ServiceMapGroupProvider implements IServiceMapGroupResolver {
    private telemetry: ITelemetry;

    private solutionName: string = 'VmInsights';
    constructor(telemetry: ITelemetry) {
        this.telemetry = telemetry;
    }

    public getMachineGroups(workspace: IWorkspaceInfo): Promise<ServiceMapComputerGroup[]> {
        const eventName = `${TelemetryEventsPrefix}.GetComputerGroupList`;
        const apiCorrelationId = newGuid();
        const telemetryContext: IFinishableTelemetry = this.telemetry.startLogEvent(
            eventName,
            { workspace_id: workspace.id, workspace_name: workspace.name, api_correlation_id: apiCorrelationId },
            undefined);

        return $.ajax(this.getListGroupsRequestDescriptor(workspace, apiCorrelationId))
            .then((data: any) => {
                telemetryContext.complete();

                const groups = new Array<ServiceMapComputerGroup>();

                if (!data) {
                    return groups;
                }

                const list = data.value;
                if (!list || !list.length) {
                    return groups;
                }

                for (let i = 0; i < list.length; ++i) {
                    if (!this.isValidGroup(list[i])) {
                        continue;
                    }

                    groups.push(new ServiceMapComputerGroup(
                        list[i].id,
                        list[i].properties.displayName,
                        this.resolveGroupType(list[i]),
                        this
                    ));
                }

                return groups;
            })
            .catch((error) => {
                telemetryContext.fail(error, { message: `Failed to list service map groups in the workspace.`});
                return [];
            });
    }

    public resolveGroup(group: ServiceMapComputerGroup): Promise<IResolvedComputerGroup> {
        const eventName = `${TelemetryEventsPrefix}.GetComputerGroupMembers`;
        const apiCorrelationId = newGuid();
        const telemetryContext: IFinishableTelemetry = this.telemetry.startLogEvent(
            eventName,
            { group_id: group.id, api_correlation_id: apiCorrelationId },
            undefined);

        return $.ajax(this.getListMembersRequestDescriptor(group, apiCorrelationId))
            .then((data: any) => {
                telemetryContext.complete();

                const members = new Array<IComputerGroupMember>();

                if (!data || !data.properties) {
                    return {
                        members: members
                    };
                }

                const list = data.properties.machines;
                if (!list || !list.length) {
                    return {
                        members: members
                    };
                }

                for (let i = 0; i < list.length; ++i) {
                    if (!this.isValidMember(list[i])) {
                        continue;
                    }

                    members.push({
                        displayName: list[i].properties.displayNameHint,
                        id: list[i].id,
                        name: list[i].name,
                        computerName: list[i].properties.fullyQualifiedDomainNameHint
                    });
                }

                return {
                    members: members
                };
            }).catch((error) => {
                telemetryContext.fail(error, { message: `Failed to list computer group members.`});
                return [];
            });
    }

    private isValidGroup(item: any): boolean {
        if (!item || !item.id || !item.properties) {
            return false;
        }

        if (!item.properties.displayName || !item.properties.groupType) {
            return false;
        }

        return true;
    }

    private isValidMember(item: any): boolean {
        if (!item || !item.id || !item.name || !item.properties) {
            return false;
        }

        if (!item.properties.displayNameHint) {
            return false;
        }

        return true;
    }

    private resolveGroupType(item: any): ServiceMapGroupType {
        let groupType = item.properties.groupType;

        switch (groupType) {
            case 'unknown': return ServiceMapGroupType.Manual;
            case 'azure-cs': return ServiceMapGroupType.AzureCloudService;
            case 'azure-vmss': return ServiceMapGroupType.AzureVMScaleSet;
            case 'azure-sf': return ServiceMapGroupType.AzureServiceFabric;
            case 'azure-rg': return ServiceMapGroupType.AzureResourceGroup;
            case 'azure-sub': return ServiceMapGroupType.AzureSubscription;
            default: return ServiceMapGroupType.Unknown;
        }
    }

    private getListGroupsRequestDescriptor(workspace: IWorkspaceInfo, apiCorrelationId: string): any {
        const url = EnvironmentConfig.Instance().getARMEndpoint() + workspace.id
            + '/features/serviceMap/machineGroups?api-version=' + apiVersion;

        return {
            contentType: 'application/json',
            headers: {
                Authorization: InitializationInfo.getInstance().getAuthorizationHeaderValue(AuthorizationTokenType.Arm),
                'x-ms-adm-caller-id': this.solutionName,
                'x-ms-correlation-request-id': apiCorrelationId,
                'x-ms-client-request-id': apiCorrelationId
            },
            timeout: queryTimeoutMs,
            type: 'GET',
            url: url,
        };
    }

    private getListMembersRequestDescriptor(group: ServiceMapComputerGroup, apiCorrelationId: string): any {
        const url = EnvironmentConfig.Instance().getARMEndpoint() + group.id
            + '?api-version=' + apiVersion;

        return {
            contentType: 'application/json',
            headers: {
                Authorization: InitializationInfo.getInstance().getAuthorizationHeaderValue(AuthorizationTokenType.Arm),
                'x-ms-adm-caller-id': this.solutionName,
                'x-ms-correlation-request-id': apiCorrelationId,
                'x-ms-client-request-id': apiCorrelationId
            },
            timeout: queryTimeoutMs,
            type: 'GET',
            url: url,
        };
    }

}
