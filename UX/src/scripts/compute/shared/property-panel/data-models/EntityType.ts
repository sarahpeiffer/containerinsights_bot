/**
 * We need to use this EntityType and avoid using DependencyMap.EntityType
 * TODO rp: Decouple the usuage of DependencyMap.EntityType
 * @export
 * @enum {number}
 */
export const enum EntityType {
    Machine = 0,
    Process = 1,
    Port = 2,
    Connection = 3,
    Acceptor = 4,
    ClientGroup = 5,
    ClientGroupMember = 6,
    ServerGroup = 7,
    MachineStub = 8,
    MachineGroup = 9,
    ProcessGroup = 10,
    UnconnectedProcesses = 11,
    AggConnection = 12,
    ClientGroupV3 = 13,
    ServerGroupV3 = 14,
    ClientOrServerGroupMember = 15,
    ClientGroupMemberMachine = 16, // Machine node within clientGroup or ServerGroup
    ServerGroupMemberMachine = 17,

    /**
     * This type is used to represent connection between clientGroupMember and the target (machine/processgroup/process).
     * API or graphStore does not have any idea on this connection. This is pure virtual connection created by UX 
     * to get its connection metrics.
     */
    ClientGroupMemberVirtualConnection = 18,

    /**
     * This type is used to represent connection between machine/processgroup/process and serverGroupMember.
     * API or graphStore does not have any idea on this connection. This is pure virtual connection created by UX 
     * to get its connection metrics.
     */
    ServerGroupMemberVirtualConnection = 19,

    /**
     * This is a virtual node represents group as a single node.
     * Members of this node are machines.
     */
    VirtualGroupNode = 20,

    /**
     * This node represents all serverPort groups.
     * This node cannot be expanded but when user opens properties panel,
     * Then we list all serverPorts in the properties panel
     */
    AllPortsNode = 21,

    /**
     * A dummy connection type whose source is a monitored machine/group
     * and target is AllPortsNode
     */
    AllServerPortGroupsVirtualConnection = 22,

    
    /**
     * A type for unmonitored machine
     */
    UnmonitoredMachine = 100
}
