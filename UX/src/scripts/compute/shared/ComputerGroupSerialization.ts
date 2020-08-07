import {
    ComputerGroup, ComputerGroupType, OmsComputerGroup,
    ServiceMapGroupType, ServiceMapComputerGroup, AzureGroup, AzureGroupType
} from '../../shared/ComputerGroup';
import { ServiceMapGroupProvider } from '../control-panel/ServiceMapGroupProvider';
import { ITelemetry } from '../../shared/Telemetry';

export interface SerializedComputerGroup {
    id: string;
    groupType: ComputerGroupType;
    serviceMapGroupType?: ServiceMapGroupType;
    azureGroupType?: AzureGroupType;
    displayName: string;
    functionName?: string;
}

/**
 * The ComputerGroup cannot been pass through Iframe Message.
 * Serialize computer group, and DeSerialize on Ibiza side.
 */
export class ComputerGroupSerialization {
    public static getComputerGroupSerialization(computerGroup: ComputerGroup): SerializedComputerGroup {
        if (!computerGroup) {
            throw 'computerGroup is empty';
        }

        if (computerGroup.groupType === ComputerGroupType.OmsComputerGroup) {
            const omsComputerGroup = computerGroup as OmsComputerGroup;
            return {
                id: computerGroup.id,
                groupType: computerGroup.groupType,
                displayName: computerGroup.displayName,
                functionName: omsComputerGroup.functionName
            }
        } else if (computerGroup.groupType === ComputerGroupType.ServiceMapMachineGroup) {
            const serviceMapComputerGroup = computerGroup as ServiceMapComputerGroup;
            return {
                id: computerGroup.id,
                groupType: computerGroup.groupType,
                displayName: computerGroup.displayName,
                serviceMapGroupType: serviceMapComputerGroup.ServiceMapGroupType
            }
        } else {
            throw 'unknown group type';
        }
    }

    public static getComputerGroupFromSerialization(computerGroup: SerializedComputerGroup, telemetry: ITelemetry): ComputerGroup {
        if (!computerGroup || computerGroup.groupType === undefined) {
            return undefined;
        }
        switch (computerGroup.groupType) {
            case ComputerGroupType.OmsComputerGroup:
                return new OmsComputerGroup(computerGroup.id, computerGroup.displayName, computerGroup.functionName);
            case ComputerGroupType.ServiceMapMachineGroup:
                return new ServiceMapComputerGroup(computerGroup.id, computerGroup.displayName,
                    computerGroup.serviceMapGroupType, new ServiceMapGroupProvider(telemetry));
            case ComputerGroupType.AzureGroup:
                return new AzureGroup(computerGroup.id, computerGroup.displayName, computerGroup.azureGroupType);
            default:
                return undefined;
        }
    }
}
