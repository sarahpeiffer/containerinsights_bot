/**
 * compute imports
 */
import { MapEntityUtility as mapUtility } from '../MapEntityUtility';
/**
 * Shared imports
 */
import { DisplayStrings } from '../../../../../shared/DisplayStrings';
import { StringHelpers } from '../../../../../shared/Utilities/StringHelpers';

/**
 * local
 */
import { ConnnectionTableData } from '../../component/ConnectionTable';

export class ClientMemberMachinePropertyPanelAdaptor {
    machine: DependencyMap.ClientOrServerGroupMemberMachine;
    constructor(entity: DependencyMap.IEntity) {
        this.machine = entity || {} as any;
    }

    /**
     * get the table data used for connection table
     */
    public getConnectionInfos(): ConnnectionTableData {
        if (!this.machine || !this.machine.connectionInfos || !this.machine.connectionInfos.forEach) {
            return null;
        }
        let infos = this.machine.connectionInfos;
        let connections = [];
        let tableValue = [];
        infos.forEach((info, index) => {
            let source = mapUtility.get(info.source) as DependencyMap.GroupMemberConnectionEndpoint;
            let destination = mapUtility.get(info.destination) as DependencyMap.GroupMemberConnectionEndpoint;

            if (!source.process || !source.process.id
                || !destination.process || !destination.process.id) {
                return;
            }

            let row: JSX.Element[] = [];
            let sourceMachineName = source.machineName || DisplayStrings.undefine;
            let sourceMachineProcess = source.processName || DisplayStrings.undefine;
            let destMachineName = destination.machineName || DisplayStrings.undefine;
            let destMachineProcess = destination.processName || DisplayStrings.undefine;

            let sourceName = StringHelpers.replaceAll(
                StringHelpers.replaceAll(DisplayStrings.IPAddressDNSName, '{0}', sourceMachineName),
                '{1}', sourceMachineProcess);
            let destName = StringHelpers.replaceAll(
                StringHelpers.replaceAll(DisplayStrings.IPAddressDNSName, '{0}', destMachineName),
                '{1}', destMachineProcess);

            //basic element for Connection. 
            connections.push({
                type: DependencyMap.EntityType.Connection,
                source: source.process.id,
                destination: destination.process.id,
                sourceName: sourceName,
                destinationName: destName
            });

            row.push(mapUtility.getTextGridCell(sourceName));
            row.push(mapUtility.getTextGridCell(destName));
            row.push(mapUtility.getConnectionStateGridCell(info.failureState));
            tableValue[index] = row;
        });

        return { connections: connections, tableValue: tableValue };
    }
}
