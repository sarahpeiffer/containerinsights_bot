/**
 * shared
 */
import { ITimeInterval } from '../../../shared/data-provider/TimeInterval';
import { StringHelpers } from '../../../shared/Utilities/StringHelpers';

/**
 * local shared
 */
import { PlaceholderSubstitute } from './CommonQueryTemplate';
import { IKubernetesCluster } from '../../IBladeContext';

/**
 * Declares query template placeholder strings
 */
class Placeholder {
    public static StartDateTime: string = '$[startDateTime]';
    public static EndDateTime: string = '$[endDateTime]';
    public static ClusterFilter: string = '$[clusterFilter]';
    public static ClusterNameReplacement: string = '$[clusterName]';
    public static ClusterIdReplacement: string = '$[clusterId]';
    public static NameSpaceFilter: string = '$[nameSpaceFilter]';
    public static ServiceNameFilter: string = '$[serviceNameFilter]';

    // TODO: In the past we used 'node name filter' which was doing
    //       extend Node == Computer and then filtering on Node (name)
    //       that diallows Kusto to use index on Computer field. So,
    //       we're switching queries to filter on Computer (name)
    //       and while we're in flight we'll have both
    //       and will need to delete NodeNameFilter later
    public static NodeNameFilter: string = '$[nodeNameFilter]';
    public static ComputerNameFilter: string = '$[computerNameFilter]';
    public static NodePoolNameFilter: string = '$[nodePoolNameFilter]';
    public static NodePoolFilter: string = '$[nodePoolFilter]';
    public static NodePoolChartQueryTemplateClusterPodCountFilter: string = '$[nodePoolChartQueryTemplateClusterPodCountFilter]';
    public static ControllerKindFilter: string = '$[controllerKindFilter]';

    public static ControllerNameFilter: string = '$[controllerNameFilter]';

}

/**
 * Provides functinality for replacing global filter (pill) parameter placeholders
 * with values selected by the user
 */
export class GlobalFilterPlaceholder {
    /**
     * Replaces parameter placeholders in the query template
     * @param queryTemplate query template
     * @param timeInterval query time interval
     * @param cluster cluster information
     * @param nodeName node name
     * @param namespaceName namespace name
     * @param serviceName serivce name
     * @returns query ready for execution
     */
    public static replacePlaceholders(
        queryTemplate: string,
        timeInterval: ITimeInterval,
        cluster: IKubernetesCluster,
        nodeName?: string,
        namespaceName?: string,
        serviceName?: string,
        nodePoolName?: string,
        controllerName?: string,
        controllerKind?: string
    ): string {
        if (!queryTemplate) { return null; };

        let query: string = queryTemplate;

        // nibs: Node pool placeholders must be replaced first because they themselves contain placeholders that have to be replaced
        query = StringHelpers.replaceAll(
            query,
            Placeholder.NodePoolFilter,
            nodePoolName ? PlaceholderSubstitute.NodePoolFilter() : ''
        );

        query = StringHelpers.replaceAll(
            query,
            Placeholder.NodePoolChartQueryTemplateClusterPodCountFilter,
            nodePoolName ? PlaceholderSubstitute.NodePoolChartsQueryTemplateClusterPodCountFilter() : ''
        );

        query = StringHelpers.replaceAll(
            query,
            Placeholder.NodePoolNameFilter,
            nodePoolName ? PlaceholderSubstitute.NodePoolNameFilter(nodePoolName) : ''
        );

        // time interval start and end
        query = StringHelpers.replaceAll(query, Placeholder.StartDateTime, timeInterval.getBestGranularStartDate().toISOString());
        query = StringHelpers.replaceAll(query, Placeholder.EndDateTime, timeInterval.getBestGranularEndDate(true).toISOString());

        const clusterFilter = cluster.isManagedCluster
            ? `| where ClusterId =~ '${cluster.resourceId}'`
            : `| where ClusterName =~ '${cluster.givenName}'`;

        query = StringHelpers.replaceAll(query, Placeholder.ClusterFilter, clusterFilter);

        query = StringHelpers.replaceAll(query, Placeholder.ClusterIdReplacement, cluster.resourceId);
        query = StringHelpers.replaceAll(query, Placeholder.ClusterNameReplacement, cluster.givenName);

        // TODO: Remove this once fully switched to 'Computer' filter from 'NodeName'
        const nodeNameFilter = nodeName ? `| where NodeName == '${nodeName}'` : '';
        query = StringHelpers.replaceAll(query, Placeholder.NodeNameFilter, nodeNameFilter);

        const computerNameFilter = nodeName ? `| where Computer == '${nodeName}'` : '';
        query = StringHelpers.replaceAll(query, Placeholder.ComputerNameFilter, computerNameFilter);

        // note: namespace name of '~' means 'all but kube-system'
        const namespaceNameFilter = namespaceName
            ? namespaceName === '~'
                ? `| where Namespace != 'kube-system'`
                : `| where Namespace == '${namespaceName}'`
            : '';
        query = StringHelpers.replaceAll(query, Placeholder.NameSpaceFilter, namespaceNameFilter);

        const serviceNameFilter = serviceName ? `| where ServiceName == '${serviceName}'` : '';
        query = StringHelpers.replaceAll(query, Placeholder.ServiceNameFilter, serviceNameFilter);

        query = StringHelpers.replaceAll(
            query,
            Placeholder.ControllerNameFilter,
            controllerName ? PlaceholderSubstitute.ControllerNameFilter(controllerName) : ''
        );

        query = StringHelpers.replaceAll(
            query,
            Placeholder.ControllerKindFilter,
            controllerKind ? PlaceholderSubstitute.ControllerKindFilter(controllerKind) : ''
        );

        return query;
    }
}
