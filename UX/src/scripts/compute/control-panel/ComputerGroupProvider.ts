import { ITelemetry, IFinishableTelemetry } from '../../shared/Telemetry';
import { ComputerGroup, OmsComputerGroup, ComputerGroupType, ServiceMapComputerGroup } from '../../shared/ComputerGroup';
import { OmsComputerGroupProvider } from './OmsComputerGroupProvider';
import { ServiceMapGroupProvider } from './ServiceMapGroupProvider';
import { IWorkspaceInfo } from '../../shared/IWorkspaceInfo';
import { DisplayStrings } from '../../shared/DisplayStrings';

import { Promise } from 'es6-promise';
import { TelemetryUtils } from '../shared/TelemetryUtils';

/**
 * A provider for groups of computers.
 * Provides a single uniform source of data that is currently
 * soruced from OMS as well as ServiceMap.
 * In the future it may bring other data sources.
 * Eventually, there will be one Azure-wide source for groups of resources
 * and we will update to using it.
 */
export class ComputerGroupProvider {
    public static ALL_COMPUTERS_GROUP: string = 'all-computers-group';
    public static AllComputersGroup: OmsComputerGroup =
        new OmsComputerGroup(ComputerGroupProvider.ALL_COMPUTERS_GROUP, DisplayStrings.AllSelectorTitle, '');

    private omsProvider: OmsComputerGroupProvider;
    private serviceMapProvider: ServiceMapGroupProvider;
    private telemetry: ITelemetry;
    private groupListSequenceNumber: number;

    constructor(telemetry: ITelemetry) {
        this.omsProvider = new OmsComputerGroupProvider(telemetry);
        this.serviceMapProvider = new ServiceMapGroupProvider(telemetry);
        this.telemetry = telemetry;
        this.groupListSequenceNumber = 0;
    }

    /**
     * Retrieves all groups associated with the specified workspace sorted by displayName.
     * @param  {IWorkspaceInfo} workspace
     * @param  {string} parentTelemetry caller identifier for telmetry
     * @param  {ComputerGroupType} [groupType] type of groups those need to be fetched. If this value is undefined then
     * groups of all types will be fetched.
     * @return Promise<ComputerGroup[]>
     */
    public getSortedGroups(workspace: IWorkspaceInfo, parentTelemetry: string, groupType?: ComputerGroupType): Promise<ComputerGroup[]> {

        const telemetryPayload: StringMap<string> = { workspace_id: workspace.id, workspace_name: workspace.name };
        const eventName = `${parentTelemetry}.updateComputerGroupList`;
        const telemetryContext: IFinishableTelemetry = this.telemetry.startLogEvent(eventName,
            telemetryPayload, undefined);

        const localSequencyNumber: number = ++this.groupListSequenceNumber;

        return this.getGroups(workspace, groupType)
        .then((groups: ComputerGroup[]) => {
            if (TelemetryUtils.completeApiTelemetryEvent(telemetryContext,
                localSequencyNumber !== this.groupListSequenceNumber,
                !groups, 'Empty group list')) {
                // sort the groups in alphabetical order of display name
                const sortedGroups = groups.sort((a: ComputerGroup, b: ComputerGroup) => {
                    const aName = a.displayName.toLowerCase();
                    const bName = b.displayName.toLowerCase();

                    if (aName < bName) { return -1; }
                    if (aName > bName) { return 1; }

                    return 0;
                });

                return sortedGroups;
            }

            return [];
        })
        .catch((error) => {
            telemetryContext.fail(error, { message: 'Failed to list computer groups in the workspace.' });
            return Promise.reject<ComputerGroup[]>(error);
        });
    }

    /**
     * Retrieves all groups associated with the specified workspace.
     * @param workspace
     * @param groupType type of groups those need to be fetched. If this value is undefined then
     * groups of all types will be fetched.
     */
    private getGroups(workspace: IWorkspaceInfo, groupType?: ComputerGroupType) {
        let oms = (groupType === undefined || groupType === ComputerGroupType.OmsComputerGroup) ?
            this.omsProvider.getComputerGroupList(workspace) :
            new Promise<OmsComputerGroup[]>((resolve) => { resolve([]); });

        let serviceMap = (groupType === undefined || groupType === ComputerGroupType.ServiceMapMachineGroup)
            ? this.serviceMapProvider.getMachineGroups(workspace)
            : new Promise<ServiceMapComputerGroup[]>((resolve) => { resolve([]); });

        return Promise.all([oms, serviceMap])
            .then((values) => {
                let result = new Array<ComputerGroup>();
                for (let i = 0; i < values.length; ++i) {
                    result = result.concat(values[i]);
                }
                return result;
            });
            // TODO: is there a way to indicate failure in the telemetryContext?
    }


}


