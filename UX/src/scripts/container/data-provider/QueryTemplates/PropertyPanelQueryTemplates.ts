import { Placeholder, PlaceholderSubstitute } from './CommonQueryTemplate';
import { StringHelpers } from '../../../shared/Utilities/StringHelpers';
import { ObjectKind } from '../../../shared/property-panel/PropertyPanelSelector';

/**
 * Defines templates for several property panel queries
 */
export class PropertyPanelQueryTemplates {

    // tslint:disable:max-line-length
    public static Container: string =
        `let startDateTime = datetime(\'$[startDateTime]\');\
        let timeGenerated = datetime(\'$[timeGeneratedFilter]\');\
        KubePodInventory\
        | where TimeGenerated == timeGenerated\
        $[computerNameFilter]\
        $[containerNameFilter]\
        | project Computer, Name, ContainerName, ContainerID, Namespace, ContainerStatus,\
        ContainerStatusReason = columnifexists('ContainerStatusReason', ''),\
        PodLabel, ContainerCreationTimeStamp, TimeGenerated\
        | summarize arg_max(TimeGenerated, *) by Computer, Name, ContainerName\
        | join kind = leftouter (\
            ContainerInventory\
            | where TimeGenerated <= timeGenerated and TimeGenerated > startDateTime\
            $[computerNameFilter]\
            | project Computer, ContainerID, Image, ImageTag, EnvironmentVar, StartedTime, FinishedTime, TimeGenerated\
            | summarize arg_max(TimeGenerated, *) by Computer, ContainerID\
        ) on ContainerID\
        | join kind = leftouter (\
            Perf\
            | where ObjectName == \'K8SContainer\'\
            $[computerNameFilter]\
            | where CounterName == \'cpuLimitNanoCores\'\
            | where TimeGenerated <= timeGenerated and TimeGenerated > startDateTime\
            | extend ContainerNameParts = split(InstanceName, \'/\')\
            | extend ContainerNamePartCount = array_length(ContainerNameParts)\
            | extend PodUIDIndex = ContainerNamePartCount - 2, ContainerNameIndex = ContainerNamePartCount - 1\
            | extend ContainerName = strcat(ContainerNameParts[PodUIDIndex], \'/\', ContainerNameParts[ContainerNameIndex])\
            $[containerNameFilter]\
            | project Computer, ContainerName, CounterName, CPULimit = CounterValue, TimeGenerated\
            | summarize arg_max(TimeGenerated, *) by Computer, ContainerName, CounterName\
        ) on Computer, ContainerName\
        | join kind = leftouter (\
            Perf\
            | where ObjectName == \'K8SContainer\'\
            $[computerNameFilter]\
            | where CounterName == \'cpuRequestNanoCores\'\
            | where TimeGenerated <= timeGenerated and TimeGenerated > startDateTime\
            | extend ContainerNameParts = split(InstanceName, \'/\')\
            | extend ContainerNamePartCount = array_length(ContainerNameParts)\
            | extend PodUIDIndex = ContainerNamePartCount - 2, ContainerNameIndex = ContainerNamePartCount - 1\
            | extend ContainerName = strcat(ContainerNameParts[PodUIDIndex], \'/\', ContainerNameParts[ContainerNameIndex])\
            $[containerNameFilter]\
            | project Computer, ContainerName, CounterName, CPURequest = CounterValue, TimeGenerated\
            | summarize arg_max(TimeGenerated, *) by Computer, ContainerName, CounterName\
        ) on Computer, ContainerName\
        | join kind = leftouter (\
            Perf\
            | where ObjectName == \'K8SContainer\'\
            $[computerNameFilter]\
            | where CounterName == \'memoryLimitBytes\'\
            | where TimeGenerated <= timeGenerated and TimeGenerated > startDateTime\
            | extend ContainerNameParts = split(InstanceName, \'/\')\
            | extend ContainerNamePartCount = array_length(ContainerNameParts)\
            | extend PodUIDIndex = ContainerNamePartCount - 2, ContainerNameIndex = ContainerNamePartCount - 1\
            | extend ContainerName = strcat(ContainerNameParts[PodUIDIndex], \'/\', ContainerNameParts[ContainerNameIndex])\
            $[containerNameFilter]\
            | project Computer, ContainerName, CounterName, MemoryLimit = CounterValue, TimeGenerated\
            | summarize arg_max(TimeGenerated, *) by Computer, ContainerName, CounterName\
        ) on Computer, ContainerName\
        | join kind = leftouter (\
            Perf\
            | where ObjectName == \'K8SContainer\'\
            $[computerNameFilter]\
            | where CounterName == \'memoryRequestBytes\'\
            | where TimeGenerated <= timeGenerated and TimeGenerated > startDateTime\
            | extend ContainerNameParts = split(InstanceName, \'/\')\
            | extend ContainerNamePartCount = array_length(ContainerNameParts)\
            | extend PodUIDIndex = ContainerNamePartCount - 2, ContainerNameIndex = ContainerNamePartCount - 1\
            | extend ContainerName = strcat(ContainerNameParts[PodUIDIndex], \'/\', ContainerNameParts[ContainerNameIndex])\
            $[containerNameFilter]\
            | project Computer, ContainerName, CounterName, MemoryRequest = CounterValue, TimeGenerated\
            | summarize arg_max(TimeGenerated, *) by Computer, ContainerName, CounterName\
        ) on Computer, ContainerName\
        | project ContainerName , ContainerID, Namespace, ContainerStatus, ContainerStatusReason, Image, ImageTag, ContainerCreationTimeStamp, \
        StartedTime, FinishedTime, CPULimit, CPURequest, MemoryLimit, MemoryRequest, EnvironmentVar`;

    public static Pod: string =
        `let startDateTime = datetime(\'$[startDateTime]\');\
        let timeGenerated = datetime(\'$[timeGeneratedFilter]\');\
        KubePodInventory\
        | where TimeGenerated <= timeGenerated and TimeGenerated > startDateTime\
        | project PodName = Name, PodStatus, PodLabel, PodCreationTimeStamp, PodStartTimestamp = PodStartTime, PodUid, PodIp, \
        ControllerName, ControllerKind, ContainerName, NodeName = Computer, TimeGenerated\
        $[podNameFilter]\
        | summarize arg_max(TimeGenerated, *) by PodName, ContainerName\
        | join kind = leftouter (\
            Perf\
            | where ObjectName == \'K8SContainer\'\
            | where CounterName == \'cpuLimitNanoCores\'\
            | where TimeGenerated <= timeGenerated and TimeGenerated > startDateTime\
            | extend ContainerNameParts = split(InstanceName, \'/\')\
            | extend ContainerNamePartCount = array_length(ContainerNameParts)\
            | extend PodUIDIndex = ContainerNamePartCount - 2, ContainerNameIndex = ContainerNamePartCount - 1\
            | extend ContainerName = strcat(ContainerNameParts[PodUIDIndex], \'/\', ContainerNameParts[ContainerNameIndex])\
            | project ContainerName, CounterName, CPULimit = CounterValue, TimeGenerated\
            | summarize arg_max(TimeGenerated, *) by ContainerName, CounterName\
        ) on ContainerName\
        | join kind = leftouter (\
            Perf\
            | where ObjectName == \'K8SContainer\'\
            | where CounterName == \'cpuRequestNanoCores\'\
            | where TimeGenerated <= timeGenerated and TimeGenerated > startDateTime\
            | extend ContainerNameParts = split(InstanceName, \'/\')\
            | extend ContainerNamePartCount = array_length(ContainerNameParts)\
            | extend PodUIDIndex = ContainerNamePartCount - 2, ContainerNameIndex = ContainerNamePartCount - 1\
            | extend ContainerName = strcat(ContainerNameParts[PodUIDIndex], \'/\', ContainerNameParts[ContainerNameIndex])\
            | project ContainerName, CounterName, CPURequest = CounterValue, TimeGenerated\
            | summarize arg_max(TimeGenerated, *) by ContainerName, CounterName\
        ) on ContainerName\
        | join kind = leftouter (\
            Perf\
            | where ObjectName == \'K8SContainer\'\
            | where CounterName == \'memoryLimitBytes\'\
            | where TimeGenerated <= timeGenerated and TimeGenerated > startDateTime\
            | extend ContainerNameParts = split(InstanceName, \'/\')\
            | extend ContainerNamePartCount = array_length(ContainerNameParts)\
            | extend PodUIDIndex = ContainerNamePartCount - 2, ContainerNameIndex = ContainerNamePartCount - 1\
            | extend ContainerName = strcat(ContainerNameParts[PodUIDIndex], \'/\', ContainerNameParts[ContainerNameIndex])\
            | project ContainerName, CounterName, MemoryLimit = CounterValue, TimeGenerated\
            | summarize arg_max(TimeGenerated, *) by ContainerName, CounterName\
        ) on ContainerName\
        | join kind = leftouter (\
            Perf\
            | where ObjectName == \'K8SContainer\'\
            | where CounterName == \'memoryRequestBytes\'\
            | where TimeGenerated <= timeGenerated and TimeGenerated > startDateTime\
            | extend ContainerNameParts = split(InstanceName, \'/\')\
            | extend ContainerNamePartCount = array_length(ContainerNameParts)\
            | extend PodUIDIndex = ContainerNamePartCount - 2, ContainerNameIndex = ContainerNamePartCount - 1\
            | extend ContainerName = strcat(ContainerNameParts[PodUIDIndex], \'/\', ContainerNameParts[ContainerNameIndex])\
            | project ContainerName, CounterName, MemoryRequest = CounterValue, TimeGenerated\
            | summarize arg_max(TimeGenerated, *) by ContainerName, CounterName\
        ) on ContainerName\
        | join kind = leftouter (\
            Heartbeat\
            | where TimeGenerated <= timeGenerated and TimeGenerated > startDateTime\
            | project NodeName = Computer, NodeIP = ComputerIP, TimeGenerated\
            | summarize arg_max(TimeGenerated, *) by NodeName\
        ) on NodeName\
        | project PodName, PodStatus, ControllerName, ControllerKind, PodLabel, PodCreationTimeStamp, PodStartTimestamp, \
        PodUid, NodeIP, ContainerName, CPULimit, CPURequest, MemoryLimit, MemoryRequest`;

    public static Controller: string =
        `let startDateTime = datetime(\'$[startDateTime]\');\
        let timeGenerated = datetime(\'$[timeGeneratedFilter]\');\
        KubePodInventory\
        | where TimeGenerated <= timeGenerated and TimeGenerated > startDateTime\
        $[controllerNameFilter]\
        $[clusterIdFilter]\
        | project ControllerName, ControllerKind, Namespace, ClusterId, ContainerID, ServiceName, TimeGenerated\
        | summarize arg_max(TimeGenerated, *) by ControllerName\
        | join kind = leftouter (\
            KubePodInventory\
            $[controllerNameFilter]\
            $[clusterIdFilter]\
            | where TimeGenerated <= timeGenerated and TimeGenerated > startDateTime\
            | project ControllerName, ContainerName\
            | distinct ControllerName, ContainerName\
            | summarize ContainerCount = count() by ControllerName\
        ) on ControllerName\
        | join kind = leftouter (\
            KubePodInventory\
            $[controllerNameFilter]\
            $[clusterIdFilter]\
            | where TimeGenerated <= timeGenerated and TimeGenerated > startDateTime\
            | project ControllerName, PodName = Name\
            | distinct ControllerName, PodName\
            | summarize PodCount = count() by ControllerName\
        ) on ControllerName\
        | project ControllerName, Namespace, ControllerKind, PodCount, ContainerCount, ServiceName`;

    // TODO: NodeIP field below brings up "random" ip address. Will be replaced with private node ip
    //       when agent is changed accordingly
    public static Node: string =
        `let startDateTime = datetime(\'$[startDateTime]\');\
        let timeGenerated = datetime(\'$[timeGeneratedFilter]\');\
        let EmptyContainerNodeInventory_CLTable = datatable(TimeGenerated: datetime, Computer: string, \
            DockerVersion_s: string, OperatingSystem_s: string)[];\
        let ContainerNodeInventory_CLTable = union isfuzzy = true EmptyContainerNodeInventory_CLTable, ContainerNodeInventory_CL\
        | where TimeGenerated <= timeGenerated and TimeGenerated > startDateTime\
        | project Computer = tolower(Computer), DockerVersion = DockerVersion_s, OperatingSystem = OperatingSystem_s, TimeGenerated;\
        let EmptyContainerNodeInventoryTable = datatable(TimeGenerated: datetime, Computer: string, \
            DockerVersion_s: string, OperatingSystem_s: string)[];\
        let KubeNodeInventoryTable = KubeNodeInventory \
        | where TimeGenerated <= timeGenerated and TimeGenerated > startDateTime\
        | where DockerVersion != "" and OperatingSystem != ""\
        $[computerNameFilter]\
        | summarize arg_max(TimeGenerated, *) by Computer;
        let ContainerNodeInventoryTable = union isfuzzy = true ContainerNodeInventory_CLTable, EmptyContainerNodeInventoryTable, KubeNodeInventoryTable, ContainerNodeInventory\
        | where TimeGenerated <= timeGenerated and TimeGenerated > startDateTime\
        $[computerNameFilter]\
        | summarize arg_max(TimeGenerated, *) by Computer;\
        KubeNodeInventory\
        | where TimeGenerated <= timeGenerated\
        | project  Computer = tolower(Computer), Status, ClusterName = iff(ClusterId contains '/Microsoft.ContainerService/' or ClusterId contains '/microsoft.kubernetes/' or ClusterId contains '/Microsoft.RedHatOpenShift/', ClusterName,\
        iff(ClusterId contains '/resourceGroups/', split(ClusterName, '/')[4], ClusterName)),\
         Labels, KubeletVersion, KubeProxyVersion, \
         KubernetesEnvironment = iff(isempty(KubernetesProviderID), KubernetesProviderID, split(KubernetesProviderID, ':')[0]), TimeGenerated\
        $[computerNameFilter]\
        | summarize arg_max(TimeGenerated, *) by Computer\
        | join kind = leftouter ContainerNodeInventoryTable on Computer\
        | join kind = leftouter (\
            Heartbeat\
            | where TimeGenerated <= timeGenerated and TimeGenerated > startDateTime\
            | project Computer = tolower(Computer), NodeIP = ComputerIP, ComputerEnvironment, TimeGenerated\
            $[computerNameFilter]\
            | summarize arg_max(TimeGenerated, *) by Computer\
        ) on Computer\
        | join kind = leftouter (\
            ContainerInventory\
            | where TimeGenerated <= timeGenerated and TimeGenerated > startDateTime\
            | project Computer = tolower(Computer), Image, ImageTag, Repository, TimeGenerated\
            $[computerNameFilter]\
            | where Image == 'microsoft/oms' or (Repository == 'microsoft' and Image == 'oms') or (Repository == 'mcr.microsoft.com' and Image contains 'azuremonitor/containerinsights/')\
            | summarize arg_max(TimeGenerated, *) by Computer\
        ) on Computer\
        | join kind = leftouter (\
            InsightsMetrics\
            | where TimeGenerated <= timeGenerated and TimeGenerated > startDateTime\
            | where Origin =~ 'container.azm.ms/telegraf'\
            | where Namespace =~ 'disk' or Namespace =~ 'container.azm.ms/disk'\
            | extend Tags = todynamic(Tags)\
            | project TimeGenerated, Computer = tolower(tostring(Tags.hostName)), Device = tostring(Tags.device), Path = tostring(Tags.path), DiskMetricName = Name, DiskMetricValue = Val\
            $[computerNameFilter]\
            | where (DiskMetricName =~ 'used') or (DiskMetricName =~ 'free') or (DiskMetricName =~ 'used_percent')\
            | summarize arg_max(TimeGenerated, *) by Computer, Device, Path, DiskMetricName\
        ) on Computer\
        | project Computer, Status, ClusterName, KubeletVersion, KubeProxyVersion, DockerVersion, OperatingSystem, \
        NodeIP, Labels, ComputerEnvironment = iff(isempty(KubernetesEnvironment), ComputerEnvironment, KubernetesEnvironment), Image, ImageTag, Device, Path, DiskMetricName, DiskMetricValue`;

    /**
     * Query to display container logs in log analytics blade
     * when "view logs" is clicked on the container
     */
    public static ContainerLogQueryTemplate: string =
        `let startDateTime = datetime('$[startDateTime]');\
            let endDateTime = datetime('$[endDateTime]');\
            let ContainerIdList = KubePodInventory\
              | where TimeGenerated >= startDateTime and TimeGenerated < endDateTime\
              | where ContainerName =~ '$[containerInstance]'\
              $[clusterFilter]\
              $[nodeNameClause]\
              | distinct ContainerID;\
            ContainerLog\
            | where TimeGenerated >= startDateTime and TimeGenerated < endDateTime\
            | where ContainerID in (ContainerIdList)\
            | project LogEntrySource, LogEntry, TimeGenerated, Computer, Image, Name, ContainerID\
            | order by TimeGenerated desc\
            | render table`;

    public static KubEventsLog: string =
        `let startDateTime = datetime('$[startDateTime]');\
            let endDateTime = datetime('$[endDateTime]');\
            let EmptyKubeEvents_CLTable = datatable(TimeGenerated: datetime, Name_s: string, ObjectKind_s: string, \
                Type_s: string, Reason_s: string, Message: string, Namespace_s: string, ClusterId_s: string)[];\
            let KubeEvents_CLTable = union isfuzzy = true EmptyKubeEvents_CLTable, \
                KubeEvents_CL | where TimeGenerated >= startDateTime and TimeGenerated < endDateTime | project ObjectKind = ObjectKind_s,\
                ClusterId = ClusterId_s, Name = Name_s, KubeEventType = Type_s, Reason = Reason_s, Namespace = Namespace_s, Message, TimeGenerated;\
            let EmptyKubeEventsTable = datatable(TimeGenerated: datetime, Name: string, ObjectKind: string,\
                KubeEventType: string, Reason: string, Message: string, Namespace: string, ClusterId: string)[];\
            let KubeEventsTable = union isfuzzy = true KubeEvents_CLTable, EmptyKubeEventsTable, KubeEvents\
            | where TimeGenerated >= startDateTime and TimeGenerated < endDateTime
            $[clusterFilter]\
            $[objectKindFilter]\
            $[nameFilter]\
            | project TimeGenerated, Name, ObjectKind, KubeEventType, Reason, Message, Namespace\
            | order by TimeGenerated desc;\
            KubeEventsTable`;
    // tslint:enable:max-line-length

    public static getContainerLogQuery(
        containerInstance: string,
        clusterResourceId: string,
        clusterName: string,
        startDateTime: string,
        endDateTime: string,
        nodeName: string
    ): string {

        let nodeNameClause = '';

        const clusterFilter = PlaceholderSubstitute.ClusterFilter(clusterResourceId, clusterName);

        if (nodeName) {
            nodeNameClause = ' | where Computer =~ \"' + nodeName + '\"';
        }

        return PropertyPanelQueryTemplates.ContainerLogQueryTemplate
            .replace('$[containerInstance]', containerInstance)
            .replace(/\$\[startDateTime\]/gi, startDateTime)
            .replace(/\$\[endDateTime\]/gi, endDateTime)
            .replace('$[clusterFilter]', clusterFilter)
            .replace(/\$\[nodeNameClause\]/gi, nodeNameClause);
    }

    public static getKubeEventsLogQuery(
        clusterResourceId: string,
        clusterName: string,
        resourceName: string,
        objectKind: ObjectKind,
        startDateTime: string,
        endDateTime: string
    ): string {
        let query = PropertyPanelQueryTemplates.KubEventsLog;

        const clusterFilter = PlaceholderSubstitute.ClusterFilter(clusterResourceId, clusterName);

        query = StringHelpers.replaceAll(
            query,
            Placeholder.ClusterFilter,
            clusterFilter
        );

        query = StringHelpers.replaceAll(
            query,
            Placeholder.ObjectKindFilter,
            `| where ObjectKind =~ '${objectKind}'`
        );
        query = StringHelpers.replaceAll(
            query,
            Placeholder.NameFilter,
            `| where Name =~ '${resourceName}'`
        );
        query = StringHelpers.replaceAll(
            query,
            Placeholder.StartDateTime,
            startDateTime
        );
        query = StringHelpers.replaceAll(
            query,
            Placeholder.EndDateTime,
            endDateTime
        );

        return query;
    }
}
