/**
 * Third party
 */
import {
    ChartTypes,
    Positions,
    AxisType,
    IChartVisualization
} from '@appinsights/aichartcore';

/**
 * Shared
 */
import { AggregationOption } from '../shared/AggregationOption';
import { DisplayStrings } from '../shared/DisplayStrings';
import { ISeriesSelectorOption } from '../shared/ISeriesSelectorOption';
import { ComputeMetricName } from './ComputeMetrics';

/**
 * Local
 */
import { QueryTemplate } from './data-provider/QueryTemplate';

/**
 * Describes container metric chart
 */
export interface IVmMetricChartDescriptor {
    /** chart id for internal use */
    chartId: string;
    /** display chart name */
    chartDisplayName: string;
    /** chart visualization properties */
    visualization?: IChartVisualization;
    /** counters defining this chart */
    counters: ICounter[];
    /** initial (default) set of data series selectors */
    defaultSeriesSelections: any;
    /** user-facing description of this chart */
    description?: string;
}

export interface IAggregateVmMetricChartDescriptor extends IVmMetricChartDescriptor {
    /** compute metric id for list tab */
    metricId: string;
}

/**
 * Describes chart for Top N Metric Charts
 */
export interface IVmMetricTopNChartDescriptor extends IAggregateVmMetricChartDescriptor {
    /** associated kusto query */
    query: string;
}

/**
 * Describes counter
 */
export interface ICounter {
    name: string,
    displayString: string
}

/**
 * string map of chart descriptors organized by chart id
 */
interface IVmMetricTopNChartDescriptorMap {
    [K: string]: IVmMetricTopNChartDescriptor
}

/**
 * All chart ids
 */

export enum VmMetricChartId {
     Cpu = 'cpu',
     Memory = 'memory',
     DiskIOPS = 'disk-iops',
     DiskDataRate = 'disk-data-rate',
     DiskLatency = 'disk-latency',
     Network = 'network',
     BytesSent = 'bytes-sent',
     BytesReceived = 'bytes-received',
     DiskUsed = 'disk-used',
     AggregationDiskUsed = 'aggregate-disk-used',
     TopNCpu = 'top-n-cpu',
     TopNMemory = 'top-n-memory',
     TopNDiskUsed = 'top-n-disk',
     TopNBytesSent = 'top-n-bytes-sent',
     TopNBytesReceived = 'top-n-bytes-received'
}

export class VirtualMachineMetricCharts {
    // Adding 2 maps to fetch exact chart descriptor
    // I have refrained from creating all charts map and choose to create just top N charts
    // Since we have to handle perf vs insights metrics queries
    private static perfTopNChartMap: IVmMetricTopNChartDescriptorMap;
    private static insightsMetricsTopNChartMap: IVmMetricTopNChartDescriptorMap;
    private static singleVmChartList: IVmMetricChartDescriptor[];
    private static aggregateVmChartList: IAggregateVmMetricChartDescriptor[];
    private static topNVmChartList: IVmMetricTopNChartDescriptor[];
    private static topNVmChartListUsingInsightsMetrics: IVmMetricTopNChartDescriptor[];

    static initialize() {
        VirtualMachineMetricCharts.perfTopNChartMap = {};
        VirtualMachineMetricCharts.insightsMetricsTopNChartMap = {};
        VirtualMachineMetricCharts.singleVmChartList = new Array<IVmMetricChartDescriptor>();
        VirtualMachineMetricCharts.aggregateVmChartList = new Array<IAggregateVmMetricChartDescriptor>();
        VirtualMachineMetricCharts.topNVmChartList = new Array<IVmMetricTopNChartDescriptor>();
        VirtualMachineMetricCharts.topNVmChartListUsingInsightsMetrics = new Array<IVmMetricTopNChartDescriptor>();

        // cpu utilization chart
        const cpuDescriptor: IAggregateVmMetricChartDescriptor = {
            chartId: VmMetricChartId.Cpu,
            chartDisplayName: DisplayStrings.CpuUtilizationPercentChartDisplayName,
            description: DisplayStrings.CpuUtilizationPercentChartDescription,
            metricId: ComputeMetricName.CpuUtilization,
            visualization: VirtualMachineMetricCharts.getVisualization(
                270, true, AxisType.Number, 0, 100),
            counters: VirtualMachineMetricCharts.getCountersForChart(VmMetricChartId.Cpu),
            defaultSeriesSelections: VirtualMachineMetricCharts.getIncreaseMetricSeriesSelections()
        }

        // memory chart
        const memoryDescriptor: IAggregateVmMetricChartDescriptor = {
            chartId: VmMetricChartId.Memory,
            chartDisplayName: DisplayStrings.AvailableMemoryChartDisplayName,
            description: DisplayStrings.AvailableMemoryChartDescription,
            metricId: ComputeMetricName.AvailableMemoryMBytes,
            visualization: VirtualMachineMetricCharts.getVisualization(
                270, true, AxisType.Number),
            counters: VirtualMachineMetricCharts.getCountersForChart(VmMetricChartId.Memory),
            defaultSeriesSelections: VirtualMachineMetricCharts.getDecreaseMetricSeriesSelections()
        }

        // disk iops transfer chart
        const diskIOPSDescriptor: IVmMetricChartDescriptor = {
            chartId: VmMetricChartId.DiskIOPS,
            chartDisplayName: DisplayStrings.DiskIOPSTransferChartDisplayName,
            description: DisplayStrings.DiskIOPSTransferChartDescription,
            visualization: VirtualMachineMetricCharts.getVisualization(
                270, true, AxisType.Number),
            counters: VirtualMachineMetricCharts.getCountersForChart(VmMetricChartId.DiskIOPS),
            defaultSeriesSelections: VirtualMachineMetricCharts.getIncreaseMetricSeriesSelections()
        }

        // disk data rate chart
        const diskDataRateDescriptor: IVmMetricChartDescriptor = {
            chartId: VmMetricChartId.DiskDataRate,
            chartDisplayName: DisplayStrings.DiskDataRateChartDisplayName,
            description: DisplayStrings.DiskDataRateChartDescription,
            visualization: VirtualMachineMetricCharts.getVisualization(
                270, true, AxisType.Number),
            counters: VirtualMachineMetricCharts.getCountersForChart(VmMetricChartId.DiskDataRate),
            defaultSeriesSelections: VirtualMachineMetricCharts.getIncreaseMetricSeriesSelections()
        }

        // disk latency chart
        const diskLatencyDescriptor: IVmMetricChartDescriptor = {
            chartId: VmMetricChartId.DiskLatency,
            chartDisplayName: DisplayStrings.DiskLatencyChartDisplayName,
            description: DisplayStrings.DiskLatencyDescription,
            visualization: VirtualMachineMetricCharts.getVisualization(
                270, true, AxisType.Number),
            counters: VirtualMachineMetricCharts.getCountersForChart(VmMetricChartId.DiskLatency),
            defaultSeriesSelections: VirtualMachineMetricCharts.getIncreaseMetricSeriesSelections()
        }

        // bytes sent chart
        const bytesSentDescriptor: IAggregateVmMetricChartDescriptor = {
            chartId: VmMetricChartId.BytesSent,
            chartDisplayName: DisplayStrings.ConnectionBytesSentRate,
            description: DisplayStrings.ConnectionBytesSentRateDescription,
            metricId: ComputeMetricName.NetworkSentPerSec,
            visualization: VirtualMachineMetricCharts.getVisualization(
                270, true, AxisType.Number),
            counters: VirtualMachineMetricCharts.getCountersForChart(VmMetricChartId.BytesSent),
            defaultSeriesSelections: VirtualMachineMetricCharts.getNetworkMetricSeriesSelections()
        }

        // bytes received chart
        const bytesReceivedDescriptor: IAggregateVmMetricChartDescriptor = {
            chartId: VmMetricChartId.BytesReceived,
            chartDisplayName: DisplayStrings.ConnectionBytesReceivedRate,
            description: DisplayStrings.ConnectionBytesReceivedRateDescription,
            metricId: ComputeMetricName.NetworkReceivedPerSec,
            visualization: VirtualMachineMetricCharts.getVisualization(
                270, true, AxisType.Number),
            counters: VirtualMachineMetricCharts.getCountersForChart(VmMetricChartId.BytesReceived),
            defaultSeriesSelections: VirtualMachineMetricCharts.getNetworkMetricSeriesSelections()
        }

        // disk used chart
        const diskUsedDescriptor: IVmMetricChartDescriptor = {
            chartId: VmMetricChartId.DiskUsed,
            chartDisplayName: DisplayStrings.TopDiskSpaceUsedChartDisplayName,
            description: DisplayStrings.TopDiskSpaceUsedChartDescription,
            visualization: VirtualMachineMetricCharts.getVisualization(
                270, false, AxisType.Number),
            counters: VirtualMachineMetricCharts.getCountersForChart(VmMetricChartId.DiskUsed),
            defaultSeriesSelections: VirtualMachineMetricCharts.getDiskUsageMetricSeriesSelections()
        }

        // aggregate disk used chart
        const aggDiskUsedDescriptor: IAggregateVmMetricChartDescriptor = {
            chartId: VmMetricChartId.AggregationDiskUsed,
            chartDisplayName: DisplayStrings.DiskSpaceUsedChartDisplayName,
            metricId: ComputeMetricName.DiskSpaceUsedPercentage,
            visualization: VirtualMachineMetricCharts.getVisualization(
                270, true, AxisType.Number),
            counters: VirtualMachineMetricCharts.getCountersForChart(VmMetricChartId.AggregationDiskUsed),
            defaultSeriesSelections: VirtualMachineMetricCharts.getIncreaseMetricSeriesSelections()
        }

        // top n cpu chart
        const topNCpuDescriptor: IVmMetricTopNChartDescriptor = {
            chartId: VmMetricChartId.TopNCpu,
            chartDisplayName: DisplayStrings.CpuUtilizationPercentChartDisplayName,
            description: DisplayStrings.TopNCpuUtilizationPercentChartDescription,
            metricId: ComputeMetricName.CpuUtilization,
            visualization: VirtualMachineMetricCharts.getVisualization(
                270, false, AxisType.Number),
            counters: VirtualMachineMetricCharts.getCountersForChart(VmMetricChartId.TopNCpu),
            defaultSeriesSelections: VirtualMachineMetricCharts.getTopNIncreaseMetricSeriesSelections(),
            query: QueryTemplate.TopNCpuChart
        }

        // top n memory chart
        const topNMemoryDescriptor: IVmMetricTopNChartDescriptor = {
            chartId: VmMetricChartId.TopNMemory,
            chartDisplayName: DisplayStrings.AvailableMemoryChartDisplayName,
            description: DisplayStrings.TopNAvailableMemoryChartDescription,
            metricId: ComputeMetricName.AvailableMemoryMBytes,
            visualization: VirtualMachineMetricCharts.getVisualization(
                270, false, AxisType.Number),
            counters: VirtualMachineMetricCharts.getCountersForChart(VmMetricChartId.TopNMemory),
            defaultSeriesSelections: VirtualMachineMetricCharts.getTopNDecreaseMetricSeriesSelections(),
            query: QueryTemplate.TopNMemoryChart
        }

        // top n bytes sent chart
        const topNBytesSentDescriptor: IVmMetricTopNChartDescriptor = {
            chartId: VmMetricChartId.TopNBytesSent,
            chartDisplayName: DisplayStrings.ConnectionBytesSentRate,
            description: DisplayStrings.TopNNetworkSentChartDescription,
            metricId: ComputeMetricName.NetworkSentPerSec,
            visualization: VirtualMachineMetricCharts.getVisualization(
                270, false, AxisType.Number),
            counters: VirtualMachineMetricCharts.getCountersForChart(VmMetricChartId.TopNBytesSent),
            defaultSeriesSelections: VirtualMachineMetricCharts.getTopNIncreaseMetricSeriesSelections(),
            query: QueryTemplate.TopNBytesSentChart
        }

        // top n bytes received chart
        const topNBytesReceivedDescriptor: IVmMetricTopNChartDescriptor = {
            chartId: VmMetricChartId.TopNBytesReceived,
            chartDisplayName: DisplayStrings.ConnectionBytesReceivedRate,
            description: DisplayStrings.TopNNetworkReceivedChartDescription,
            metricId: ComputeMetricName.NetworkReceivedPerSec,
            visualization: VirtualMachineMetricCharts.getVisualization(
                270, false, AxisType.Number),
            counters: VirtualMachineMetricCharts.getCountersForChart(VmMetricChartId.TopNBytesReceived),
            defaultSeriesSelections: VirtualMachineMetricCharts.getTopNIncreaseMetricSeriesSelections(),
            query: QueryTemplate.TopNBytesReceivedChart
        }

        // top n disk free chart
        const topNDiskUsedDescriptor: IVmMetricTopNChartDescriptor = {
            chartId: VmMetricChartId.TopNDiskUsed,
            chartDisplayName: DisplayStrings.DiskSpaceUsedChartDisplayName,
            description: DisplayStrings.TopNDiskSpaceUsedChartDescription,
            metricId: ComputeMetricName.DiskSpaceUsedPercentage,
            visualization: VirtualMachineMetricCharts.getVisualization(
                270, false, AxisType.Number),
            counters: VirtualMachineMetricCharts.getCountersForChart(VmMetricChartId.TopNDiskUsed),
            defaultSeriesSelections: VirtualMachineMetricCharts.getTopNIncreaseMetricSeriesSelections(),
            query: QueryTemplate.TopNDiskUsedChart
        }

        // top n cpu chart using InsightsMetrics
        const topNCpuDescriptorUsingInsightsMetrics: IVmMetricTopNChartDescriptor = {
            chartId: VmMetricChartId.TopNCpu,
            chartDisplayName: DisplayStrings.CpuUtilizationPercentChartDisplayName,
            description: DisplayStrings.TopNCpuUtilizationPercentChartDescription,
            metricId: ComputeMetricName.CpuUtilization,
            visualization: VirtualMachineMetricCharts.getVisualization(
                270, false, AxisType.Number),
            counters: VirtualMachineMetricCharts.getCountersForChart(VmMetricChartId.TopNCpu),
            defaultSeriesSelections: VirtualMachineMetricCharts.getTopNIncreaseMetricSeriesSelections(),
            query: QueryTemplate.TopNCpuChartUsingInsightsMetrics
        }

        // top n memory chart using InsightsMetrics
        const topNMemoryDescriptorUsingInsightsMetrics: IVmMetricTopNChartDescriptor = {
            chartId: VmMetricChartId.TopNMemory,
            chartDisplayName: DisplayStrings.AvailableMemoryChartDisplayName,
            description: DisplayStrings.TopNAvailableMemoryChartDescription,
            metricId: ComputeMetricName.AvailableMemoryMBytes,
            visualization: VirtualMachineMetricCharts.getVisualization(
                270, false, AxisType.Number),
            counters: VirtualMachineMetricCharts.getCountersForChart(VmMetricChartId.TopNMemory),
            defaultSeriesSelections: VirtualMachineMetricCharts.getTopNDecreaseMetricSeriesSelections(),
            query: QueryTemplate.TopNMemoryChartUsingInsightsMetrics
        }

        // top n bytes sent chart using InsightsMetrics
        const topNBytesSentDescriptorUsingInsightsMetrics: IVmMetricTopNChartDescriptor = {
            chartId: VmMetricChartId.TopNBytesSent,
            chartDisplayName: DisplayStrings.ConnectionBytesSentRate,
            description: DisplayStrings.TopNNetworkSentChartDescription,
            metricId: ComputeMetricName.NetworkSentPerSec,
            visualization: VirtualMachineMetricCharts.getVisualization(
                270, false, AxisType.Number),
            counters: VirtualMachineMetricCharts.getCountersForChart(VmMetricChartId.TopNBytesSent),
            defaultSeriesSelections: VirtualMachineMetricCharts.getTopNIncreaseMetricSeriesSelections(),
            query: QueryTemplate.TopNBytesSentChartUsingInsightsMetrics
        }

        // top n bytes received chart using InsightsMetrics
        const topNBytesReceivedDescriptorUsingInsightsMetrics: IVmMetricTopNChartDescriptor = {
            chartId: VmMetricChartId.TopNBytesReceived,
            chartDisplayName: DisplayStrings.ConnectionBytesReceivedRate,
            description: DisplayStrings.TopNNetworkReceivedChartDescription,
            metricId: ComputeMetricName.NetworkReceivedPerSec,
            visualization: VirtualMachineMetricCharts.getVisualization(
                270, false, AxisType.Number),
            counters: VirtualMachineMetricCharts.getCountersForChart(VmMetricChartId.TopNBytesReceived),
            defaultSeriesSelections: VirtualMachineMetricCharts.getTopNIncreaseMetricSeriesSelections(),
            query: QueryTemplate.TopNBytesReceivedChartUsingInsightsMetrics
        }

        // top n disk free chart using InsightsMetrics
        const topNDiskUsedDescriptorUsingInsightsMetrics: IVmMetricTopNChartDescriptor = {
            chartId: VmMetricChartId.TopNDiskUsed,
            chartDisplayName: DisplayStrings.DiskSpaceUsedChartDisplayName,
            description: DisplayStrings.TopNDiskSpaceUsedChartDescription,
            metricId: ComputeMetricName.DiskSpaceUsedPercentage,
            visualization: VirtualMachineMetricCharts.getVisualization(
                270, false, AxisType.Number),
            counters: VirtualMachineMetricCharts.getCountersForChart(VmMetricChartId.TopNDiskUsed),
            defaultSeriesSelections: VirtualMachineMetricCharts.getTopNIncreaseMetricSeriesSelections(),
            query: QueryTemplate.TopNDiskUsedChartUsingInsightsMetrics
        }

        VirtualMachineMetricCharts.singleVmChartList.push(cpuDescriptor);
        VirtualMachineMetricCharts.singleVmChartList.push(memoryDescriptor);
        VirtualMachineMetricCharts.singleVmChartList.push(diskIOPSDescriptor);
        VirtualMachineMetricCharts.singleVmChartList.push(diskDataRateDescriptor);
        VirtualMachineMetricCharts.singleVmChartList.push(diskLatencyDescriptor);
        VirtualMachineMetricCharts.singleVmChartList.push(diskUsedDescriptor);
        VirtualMachineMetricCharts.singleVmChartList.push(bytesSentDescriptor);
        VirtualMachineMetricCharts.singleVmChartList.push(bytesReceivedDescriptor);

        VirtualMachineMetricCharts.aggregateVmChartList.push(cpuDescriptor);
        VirtualMachineMetricCharts.aggregateVmChartList.push(memoryDescriptor);
        VirtualMachineMetricCharts.aggregateVmChartList.push(bytesSentDescriptor);
        VirtualMachineMetricCharts.aggregateVmChartList.push(bytesReceivedDescriptor);
        VirtualMachineMetricCharts.aggregateVmChartList.push(aggDiskUsedDescriptor);

        VirtualMachineMetricCharts.topNVmChartList.push(topNCpuDescriptor);
        VirtualMachineMetricCharts.topNVmChartList.push(topNMemoryDescriptor);
        VirtualMachineMetricCharts.topNVmChartList.push(topNBytesSentDescriptor);
        VirtualMachineMetricCharts.topNVmChartList.push(topNBytesReceivedDescriptor);
        VirtualMachineMetricCharts.topNVmChartList.push(topNDiskUsedDescriptor);

        // Build map for perf Top N chart descriptors
        VirtualMachineMetricCharts.perfTopNChartMap[VmMetricChartId.TopNCpu] = topNCpuDescriptor;
        VirtualMachineMetricCharts.perfTopNChartMap[VmMetricChartId.TopNMemory] = topNMemoryDescriptor;
        VirtualMachineMetricCharts.perfTopNChartMap[VmMetricChartId.TopNBytesSent] = topNBytesSentDescriptor;
        VirtualMachineMetricCharts.perfTopNChartMap[VmMetricChartId.TopNBytesReceived] = topNBytesReceivedDescriptor;
        VirtualMachineMetricCharts.perfTopNChartMap[VmMetricChartId.TopNDiskUsed] = topNDiskUsedDescriptor;

        VirtualMachineMetricCharts.topNVmChartListUsingInsightsMetrics.push(topNCpuDescriptorUsingInsightsMetrics);
        VirtualMachineMetricCharts.topNVmChartListUsingInsightsMetrics.push(topNMemoryDescriptorUsingInsightsMetrics);
        VirtualMachineMetricCharts.topNVmChartListUsingInsightsMetrics.push(topNBytesSentDescriptorUsingInsightsMetrics);
        VirtualMachineMetricCharts.topNVmChartListUsingInsightsMetrics.push(topNBytesReceivedDescriptorUsingInsightsMetrics);
        VirtualMachineMetricCharts.topNVmChartListUsingInsightsMetrics.push(topNDiskUsedDescriptorUsingInsightsMetrics);

        // Build map for insights metrics Top N chart descriptors
        VirtualMachineMetricCharts.insightsMetricsTopNChartMap[VmMetricChartId.TopNCpu] = topNCpuDescriptorUsingInsightsMetrics;
        VirtualMachineMetricCharts.insightsMetricsTopNChartMap[VmMetricChartId.TopNMemory] = topNMemoryDescriptorUsingInsightsMetrics;
        VirtualMachineMetricCharts.insightsMetricsTopNChartMap[VmMetricChartId.TopNBytesSent] = topNBytesSentDescriptorUsingInsightsMetrics;
        VirtualMachineMetricCharts.insightsMetricsTopNChartMap[VmMetricChartId.TopNBytesReceived] 
            = topNBytesReceivedDescriptorUsingInsightsMetrics;
        VirtualMachineMetricCharts.insightsMetricsTopNChartMap[VmMetricChartId.TopNDiskUsed] = topNDiskUsedDescriptorUsingInsightsMetrics;
    }

    public static GetTopNVirtualMachineMetricChart(chartId: string, queryInsightsMetrics: boolean = false): IVmMetricTopNChartDescriptor {
        if (queryInsightsMetrics) {
            return this.GetTopNInsighstMetricsVirtualMachineMetricChart(chartId);
        }
        return this.GetTopNPerfVirtualMachineMetricChart(chartId);
    }

    public static GetTopNPerfVirtualMachineMetricChart(chartId: string): IVmMetricTopNChartDescriptor {
        return VirtualMachineMetricCharts.perfTopNChartMap[chartId];
    }

    public static GetTopNInsighstMetricsVirtualMachineMetricChart(chartId: string): IVmMetricTopNChartDescriptor {
        return VirtualMachineMetricCharts.insightsMetricsTopNChartMap[chartId];
    }

    public static get SingleVmChartList(): IVmMetricChartDescriptor[] {
        return VirtualMachineMetricCharts.singleVmChartList;
    }

    public static get AggregateVmChartList(): IAggregateVmMetricChartDescriptor[] {
        return VirtualMachineMetricCharts.aggregateVmChartList;
    }

    public static get TopNViewChartList(): IVmMetricTopNChartDescriptor[] {
        return VirtualMachineMetricCharts.topNVmChartList;
    }

    public static get TopNViewChartListUsingInsightsMetrics(): IVmMetricTopNChartDescriptor[] {
        return VirtualMachineMetricCharts.topNVmChartListUsingInsightsMetrics;
    }

    public static getCountersForChart(chartId: VmMetricChartId): ICounter[] {
        let counters: ICounter[] = [];

        switch (chartId) {
            case VmMetricChartId.Cpu:
            case VmMetricChartId.TopNCpu:
                counters.push({ name: '% Processor Time', displayString: DisplayStrings.CpuUtilizationCounterDisplayName });
                break;
            case VmMetricChartId.Memory:
            case VmMetricChartId.TopNMemory:
                counters.push({ name: 'Available MBytes', displayString: DisplayStrings.AvailableMemoryCounterDisplayName });
                break;
            case VmMetricChartId.DiskIOPS:
                counters.push({ name: 'Disk Transfers/sec', displayString: DisplayStrings.DiskIOPSCounterDisplayName });
                break;
            case VmMetricChartId.DiskDataRate:
                counters.push({ name: 'Disk Bytes/sec', displayString: DisplayStrings.DiskDataRateCounterDisplayName });
                break;
            case VmMetricChartId.DiskLatency:
                counters.push({ name: 'Avg. Disk sec/Transfer', displayString: DisplayStrings.DiskLatencyCounterDisplayName });
                break;
            case VmMetricChartId.BytesSent:
            case VmMetricChartId.TopNBytesSent:
                counters.push({ name: 'Bytes Sent/sec', displayString: DisplayStrings.ConnectionBytesSentRate });
                break;
            case VmMetricChartId.BytesReceived:
            case VmMetricChartId.TopNBytesReceived:
                counters.push({ name: 'Bytes Received/sec', displayString: DisplayStrings.ConnectionBytesReceivedRate });
                break;
            case VmMetricChartId.DiskUsed:
            case VmMetricChartId.AggregationDiskUsed:
            case VmMetricChartId.TopNDiskUsed:
                counters.push({ name: '% Used Space', displayString: DisplayStrings.DiskSpaceUsedCounterDisplayName });
                break;
        }

        return counters;
    }

    /**
     * Constructs selection options for scenario where lower values are better
     * @returns {string[]} array of possible selection options
     */
    private static getDecreaseMetricSeriesSelections(): ISeriesSelectorOption[] {
        return [
            { id: AggregationOption.Avg, displayName: DisplayStrings.OptionAvg, isSelected: true },
            { id: AggregationOption.Max, displayName: DisplayStrings.OptionMax, isSelected: false },
            { id: AggregationOption.P50, displayName: DisplayStrings.OptionP50, isSelected: false },
            { id: AggregationOption.P10, displayName: DisplayStrings.OptionP10, isSelected: true },
            { id: AggregationOption.P05, displayName: DisplayStrings.OptionP05, isSelected: true },
            { id: AggregationOption.Min, displayName: DisplayStrings.OptionMin, isSelected: false }
        ];
    }

    /**
     * Constructs selection options for scenario where lower values are better for Top N chart
     * @returns {string[]} array of possible selection options
     */
    private static getTopNDecreaseMetricSeriesSelections(): ISeriesSelectorOption[] {
        return [
            { id: AggregationOption.Avg, displayName: DisplayStrings.OptionAvg, isSelected: false },
            { id: AggregationOption.Max, displayName: DisplayStrings.OptionMax, isSelected: false },
            { id: AggregationOption.P50, displayName: DisplayStrings.OptionP50, isSelected: false },
            { id: AggregationOption.P10, displayName: DisplayStrings.OptionP10, isSelected: false },
            { id: AggregationOption.P05, displayName: DisplayStrings.OptionP05, isSelected: true },
            { id: AggregationOption.Min, displayName: DisplayStrings.OptionMin, isSelected: false }
        ];
    }

    /**
     * Constructs selection options for scenario where higher values are better
     * @returns {string[]} array of possible selection options
     */
    private static getIncreaseMetricSeriesSelections(): ISeriesSelectorOption[] {
        return [
            { id: AggregationOption.Avg, displayName: DisplayStrings.OptionAvg, isSelected: true },
            { id: AggregationOption.Min, displayName: DisplayStrings.OptionMin, isSelected: false },
            { id: AggregationOption.P50, displayName: DisplayStrings.OptionP50, isSelected: false },
            { id: AggregationOption.P90, displayName: DisplayStrings.OptionP90, isSelected: false },
            { id: AggregationOption.P95, displayName: DisplayStrings.OptionP95, isSelected: true },
            { id: AggregationOption.Max, displayName: DisplayStrings.OptionMax, isSelected: false }
        ];
    }

    /**
     * Constructs selection options for scenario where higher values are better for Top N chart
     * @returns {string[]} array of possible selection options
     */
    private static getTopNIncreaseMetricSeriesSelections(): ISeriesSelectorOption[] {
        return [
            { id: AggregationOption.Avg, displayName: DisplayStrings.OptionAvg, isSelected: false },
            { id: AggregationOption.Min, displayName: DisplayStrings.OptionMin, isSelected: false },
            { id: AggregationOption.P50, displayName: DisplayStrings.OptionP50, isSelected: false },
            { id: AggregationOption.P90, displayName: DisplayStrings.OptionP90, isSelected: false },
            { id: AggregationOption.P95, displayName: DisplayStrings.OptionP95, isSelected: true },
            { id: AggregationOption.Max, displayName: DisplayStrings.OptionMax, isSelected: false }
        ];
    }

    /**
     * Constructs selection options for network chart
     * @returns {string[]} array of possible selection options
     */
    private static getNetworkMetricSeriesSelections(): ISeriesSelectorOption[] {
        return [
            { id: AggregationOption.Avg, displayName: DisplayStrings.OptionAvg, isSelected: true },
            { id: AggregationOption.Min, displayName: DisplayStrings.OptionMin, isSelected: false },
            { id: AggregationOption.P50, displayName: DisplayStrings.OptionP50, isSelected: false },
            { id: AggregationOption.P90, displayName: DisplayStrings.OptionP90, isSelected: false },
            { id: AggregationOption.P95, displayName: DisplayStrings.OptionP95, isSelected: false },
            { id: AggregationOption.Max, displayName: DisplayStrings.OptionMax, isSelected: false }
        ];
    }

    /**
     * Constructs selection options for Top N Disk Usage
     * @returns {string[]} array of possible selection options
     */
    private static getDiskUsageMetricSeriesSelections(): ISeriesSelectorOption[] {
        return [
            { id: AggregationOption.Max, displayName: DisplayStrings.OptionMax, isSelected: true },
        ];
    }

    private static getVisualization(
        height: number,
        hideSubtitle: boolean,
        axisType: AxisType,
        minValue?: number,
        maxValue?: number): IChartVisualization {

        // Default Visualization
        const visualization: IChartVisualization = {
            chartType: ChartTypes.Line,
            legend: {
                isVisible: true,
                position: Positions.Bottom,
                hideSubtitle: hideSubtitle
            },
            axis: {
                x: {
                    isVisible: true,
                    axisType: AxisType.DateLocal
                },
                y: {
                    isVisible: true,
                    axisType: axisType,
                }
            },
            size: {
                height: height
            },
            toolTip: {
                enabled: true,
                dynamicBody: true
            }
        };

        if (minValue) {
            visualization.axis.y.min = minValue;
        }

        if (maxValue) {
            visualization.axis.y.max = maxValue;
        }

        return visualization;
    }
}

// initialize static compute metric chart class
VirtualMachineMetricCharts.initialize();
