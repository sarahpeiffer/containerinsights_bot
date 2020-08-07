/** Shared Imports */
import { ITelemetry } from '../../shared/Telemetry';
import { ErrorSeverity } from '../../shared/data-provider/TelemetryErrorSeverity';
import { IMetricsServerUnitsParser } from '../../container/shared/openapi-parser/UnitParser';
/**
 * Aggregation and parsing functions for interpreting Kubernetes API responses.
 */
export class KubernetesParsingAndAggregation {
    /**if there is no setting for the limits or requests in pod level, setting 0.0 as default value */
    public static readonly LimitsOrRequestsDefaultValue: number = 0.0;

    public static readonly LimitsOrRequests = {
        limits: 'limits',
        requests: 'requests'
    }

    public static readonly CpuOrMemory = {
        cpu: 'cpu',
        memory: 'memory'
    }

    constructor(private unitsParser: IMetricsServerUnitsParser, private telemetry: ITelemetry) {
    }

    /**
     * Returns the total number of ready and not ready nodes, given the response of "top nodes".
     * @param topNodesResponse 
     * @param aggregations 
     */
    public nodeCounts(nodeListResponse: any): StringMap<number> {
        const counts = { ready: 0, notReady: 0 };
        nodeListResponse.items.forEach(item => {
            const filteredConditions = item.status.conditions.filter(condition => condition.type === 'Ready');
            if (filteredConditions.length !== 1 || filteredConditions[0].status !== 'True') {
                counts.notReady++;
            } else {
                counts.ready++;
            }
        });
        return counts;
    }

    public podCounts(getPodsResponse: any, aggregations: Array<string>): StringMap<number> {
        let nodePodCounts: StringMap<number> = {};
        aggregations.forEach(aggregation => nodePodCounts[aggregation] = 0);
        getPodsResponse.items.forEach(item => nodePodCounts[item.status.phase.toLocaleLowerCase()]++);
        nodePodCounts[aggregations[0]] = getPodsResponse.items.length;
        return nodePodCounts;
    }

    public nodeCpu(nodeListResponse: any, nodeMetricsResponse: any): Array<number> {
        const nodeAllocatableMap = this.getNodeListCpuMemoryLimitHash(nodeListResponse);

        const nodeCpu: Array<number> = [];
        const metricCount = nodeMetricsResponse.items.length;

        for (let i = 0; i < metricCount; i++) {
            const metric = nodeMetricsResponse.items[i];

            const metricName = metric.metadata.name;

            if (!nodeAllocatableMap.hasOwnProperty(metricName)) { continue; }

            const currentCpu = this.parseCpuString(metric.usage.cpu);
            const allocatable = nodeAllocatableMap[metricName];

            const cpuPercent = (100.0 * currentCpu) / allocatable.cpu;
            nodeCpu.push(cpuPercent);
        }

        if (nodeCpu.length < 1) { throw `No metrics found for ANY of the nodes`; }
        return nodeCpu;
    }

    public nodeMemory(nodeListResponse: any, nodeMetricsResponse: any): Array<number> {
        const nodeAllocatableMap = this.getNodeListCpuMemoryLimitHash(nodeListResponse);

        const nodeMemory: Array<number> = [];

        const metricCount = nodeMetricsResponse.items.length;

        for (let i = 0; i < metricCount; i++) {
            const metric = nodeMetricsResponse.items[i];
            const metricName = metric.metadata.name;

            if (!nodeAllocatableMap.hasOwnProperty(metricName)) { continue; }

            const currentMemory = this.parseMemoryString(metric.usage.memory);
            const allocatable = nodeAllocatableMap[metricName];

            const memoryPercent = (100.0 * currentMemory) / allocatable.memory;
            nodeMemory.push(memoryPercent);
        }

        if (nodeMemory.length < 1) { throw `No metrics found for ANY of the nodes`; }
        return nodeMemory;
    }
    /**
     * return the parsing limits or requests data
     * @param podResponse pod's response
     * @param limitsOrRequests limts or request options
     * @param cpuOrMemory cpu or memory options
     */
    public parsePodLimitsOrRequests(podResponse: any, limitsOrRequests: string, cpuOrMemory: string): Array<number> {
        if (!KubernetesParsingAndAggregation.LimitsOrRequests.hasOwnProperty(limitsOrRequests) ||
            !KubernetesParsingAndAggregation.CpuOrMemory.hasOwnProperty(cpuOrMemory)) {
            throw new Error('Parameter @limitsOrRequests and @cpuOrMemory should be limits or requests And cpu or memory');
        }
        let podLimitsOrRequests: Array<number> = [];
        if (!podResponse || 
            !podResponse.spec || 
            !podResponse.spec.containers) {
                this.telemetry.logException(
                    '@podResponse, @dpodResponse.spec or @podResponse.spec.containers is null', 
                    'Limit or request chart', 
                    ErrorSeverity.Warn, 
                    null, 
                    null);
            podLimitsOrRequests.push(KubernetesParsingAndAggregation.LimitsOrRequestsDefaultValue);
        } else  {
            const totalContainers = podResponse.spec.containers.length;
            for (let i = 0; i < totalContainers; i++) {
                const container = podResponse.spec.containers[i];
                if (!container.resources || 
                    !container.resources.hasOwnProperty(limitsOrRequests) || 
                    !container.resources[limitsOrRequests].hasOwnProperty(cpuOrMemory)) {
                    podLimitsOrRequests.push(KubernetesParsingAndAggregation.LimitsOrRequestsDefaultValue);
                } else if (KubernetesParsingAndAggregation.CpuOrMemory.cpu === cpuOrMemory) {
                    podLimitsOrRequests.push(this.parseCpuString(container.resources[limitsOrRequests][cpuOrMemory]));
                } else {
                    podLimitsOrRequests.push(this.parseMemoryString(container.resources[limitsOrRequests][cpuOrMemory]));
                } 
            }
        }
        return podLimitsOrRequests;
    }

    /**
     * return the parsing cpu or memory usage
     * @param podResponse pod's response
     * @param cpuOrMemory cpu or memory options 
     */
    public parsePodUsage(podResponse: any, cpuOrMemory: string) {
        if (!podResponse) { throw new Error('Parameter @podResponse should not be null'); }

        if (!KubernetesParsingAndAggregation.CpuOrMemory.hasOwnProperty(cpuOrMemory)) {
            throw new Error('Parameter @cpuOrMemory should be cpu or memory');
        }

        const totalContainers = podResponse.containers.length;
        let podCpuOrMemory: Array<number> = [];
        for (let i = 0; i < totalContainers; i++) {
            let currentCpuOrMemory: number = 0;
            if (KubernetesParsingAndAggregation.CpuOrMemory.cpu === cpuOrMemory) {
                currentCpuOrMemory = this.parseCpuString(podResponse.containers[i].usage.cpu);
            } else {
                currentCpuOrMemory = this.parseMemoryString(podResponse.containers[i].usage.memory);
            }
            podCpuOrMemory.push(currentCpuOrMemory);
        }
        return podCpuOrMemory;
    }

    /**
     * Returns the total of an Array of numbers.
     * @param values Array of numbers to be aggregated
     */
    public aggregate(values: Array<number>): number {
        if (!values) { throw new Error('Parameter @values should not be null'); }
        return values.reduce((a, b) => a + b, 0);
    }

    /**
     * Returns the minimum of an Array of numbers.
     * @param values Array of numbers to be aggregated
     */
    public aggregateMin(values: Array<number>): number {
        return Math.min.apply(null, values);
    }

    /**
     * Returns the maximum of an Array of numbers.
     * @param values Array of numbers to be aggregated
     */
    public aggregateMax(values: Array<number>): number {
        return Math.max.apply(null, values);
    }

    /**
     * Returns the average of an Array of numbers.
     * @param values Array of numbers to be aggregated
     */
    public aggregateAvg(values: Array<number>): number {
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    /**
     * Returns the percentile of an Array of numbers.
     * @param values Array of numbers to be aggregated
     * @param percentile A number from 0 to 100
     */
    public aggregatePercentile(values: Array<number>, percentile: number): number {
        values.sort();
        const p = (values.length - 1) * percentile / 100;
        const a = Math.floor(p);
        const b = Math.ceil(p);
        if (a === b) {
            return values[a];
        }
        return values[a] * (b - p) + values[b] * (p - a);
    }

    /**
     * Parses a string representing a cpu usage value into an integer.
     * Given string must be formatted defined by aks API.
     * 1 = 1c= 1000m = 1000,000,000n
     * Robbie Zhang (AKS) <junjiez@microsoft.com> is from the AKS team provided this data format information
     * @param cpu A string representing the cpu usage of a cluster
     */
    public parseCpuString(cpu: string): number {
        try {
            return this.unitsParser.parseOpenApiQuantity(cpu);
        } catch {
            console.error(`Unparsable string encountered by parseCpuString ${cpu}`);
            this.telemetry.logException(`Unparsable string encountered by parseCpuString ${cpu}`, 'KubernetesParsingAndAggregation.parseCpuString', ErrorSeverity.Error, null, null);
            return 0;
        }
    }

    /**
     * Parses a string representing a memory usage value into an integer.
     * Given string must be formatted as a number, optionally followed by one of the following:
     *      "Ki", "Mi", or "Gi".
     * For example, "10Ki", "1Gi", or "1001".
     * @param memoryString A string representing the amount of memory consumed by a cluster.
     */
    public parseMemoryString(memoryString: string): number {
        try {
            return this.unitsParser.parseOpenApiQuantity(memoryString);
        } catch {
            console.error(`Unparsable string encountered by parseMemoryString ${memoryString}`);
            this.telemetry.logException(`Unparsable string encountered by parseMemoryString ${memoryString}`, 'KubernetesParsingAndAggregation.parseMemoryString', ErrorSeverity.Error, null, null);
            return 0;
        }
    }

    private getNodeListCpuMemoryLimitHash(responseItems): any {
        const responseItemLimitHash: StringMap<any> = {};

        const responseCount = responseItems.items.length;
        for (let i = 0; i < responseCount; i++) {
            const responseItem = responseItems.items[i];

            if (!responseItem.metadata || !responseItem.metadata.name) { continue; }
            const nodeName = responseItem.metadata.name;

            if (responseItemLimitHash.hasOwnProperty(nodeName)) { throw `Multiple nodes with the same name ${nodeName}`; }

            if (!responseItem.status || !responseItem.status.allocatable) { continue; }

            const cpu = this.parseCpuString(responseItem.status.allocatable.cpu);
            const memory = this.parseMemoryString(responseItem.status.allocatable.memory);

            responseItemLimitHash[nodeName] = { cpu, memory }
        }

        return responseItemLimitHash;
    }
}
