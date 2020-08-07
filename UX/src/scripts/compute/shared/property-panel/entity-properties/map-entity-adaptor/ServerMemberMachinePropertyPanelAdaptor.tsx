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

export class ServerMemberMachinePropertyPanelAdaptor {
    machine: DependencyMap.ClientOrServerGroupMemberMachine;

    private tableData: ConnnectionTableData;
    private destinationName: string;

    constructor(entity: DependencyMap.IEntity) {
        this.machine = entity || {} as any;
        this.destinationName = DisplayStrings.undefine;
        this.processConnectionInfos();
    }

    /**
     * get the table data used for connection table
     */
    public getConnectionInfos(): ConnnectionTableData {
        return this.tableData;
    }

    /**
     * for same server Member machine, all connections target to same process. 
     * this method is used get the process name.
     */
    public getDestinationName(): string {
        return this.destinationName;
    }

    /**
     * collect all the ipv4 address for this server Member Machine
     */
    public getIpv4Address(): string[] {
        const networking = mapUtility.get(this.machine.machine.networking);
        const result: string[] = [];
        if (networking.ipv4Interfaces && networking.ipv4Interfaces.length > 0) {
            for (let ipv4Interfaces of networking.ipv4Interfaces) {
                result.push(ipv4Interfaces.cidrNotation);
            }
        }
        return result;
    }

    /**
     * process the ConnectionInfo into JSX elements/Connection.
     * and cache the Connections result.
     */
    private processConnectionInfos() {
        if (!this.machine || !this.machine.connectionInfos || !this.machine.connectionInfos.forEach || !this.machine.displayName) {
            return;
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
            let destMachineProcess = destination.processName || DisplayStrings.undefine;

            if (!this.destinationName || this.destinationName === DisplayStrings.undefine) {
                this.destinationName = destination.processName;
            }

            let sourceName = StringHelpers.replaceAll(
                StringHelpers.replaceAll(DisplayStrings.IPAddressDNSName, '{0}', sourceMachineName),
                '{1}', sourceMachineProcess);
            let destName = StringHelpers.replaceAll(
                StringHelpers.replaceAll(DisplayStrings.IPAddressDNSName, '{0}', this.machine.displayName),
                '{1}', destMachineProcess);

            //basic element for Connection. 
            connections.push({
                type: DependencyMap.EntityType.Connection,
                source: source.process.id,
                destination: destination.process.id,
                sourceName: sourceName,
                destinationName: destName
            });

            row.push(mapUtility.getTextGridCell(sourceMachineName));
            row.push(mapUtility.getTextGridCell(sourceMachineProcess));
            row.push(mapUtility.getConnectionStateGridCell(info.failureState));
            tableValue[index] = row;
        });

        this.tableData = { connections: connections, tableValue: tableValue };
    }
}
