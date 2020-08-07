import { IMetric, IMetricMap, FixedMaxValueMetricDescriptor } from '../shared/MetricDescriptor'; 
import { MetricValueFormatter } from '../shared/MetricValueFormatter';
import { DisplayStrings } from '../shared/DisplayStrings';

export const ComputeMetricName = {
    CpuUtilization: 'cpuUtilization',
    AvailableMemoryMBytes: 'availableMemoryMBytes',
    DiskSpaceUsedPercentage: 'diskSpaceUsedPercentage',
    NetworkReceivedPerSec: 'networkReceivedPerSec',
    NetworkSentPerSec: 'networkSendPerSec',
};

export class ComputeMetrics {
    private static metricMap: IMetricMap;
    private static metricList: IMetric[];

    static initialize() {
        ComputeMetrics.metricMap = {};

        ComputeMetrics.metricMap[ComputeMetricName.CpuUtilization] = {
            name: ComputeMetricName.CpuUtilization,
            displayName: DisplayStrings.CpuUtilizationPercentChartDisplayName,
            descriptor: new FixedMaxValueMetricDescriptor(
                ComputeMetricName.CpuUtilization, false, 100, MetricValueFormatter.formatPercentageValue)
        };
        ComputeMetrics.metricMap[ComputeMetricName.AvailableMemoryMBytes] = {
            name: ComputeMetricName.AvailableMemoryMBytes,
            displayName: DisplayStrings.AvailableMemoryChartDisplayName,
            descriptor: new FixedMaxValueMetricDescriptor(
                ComputeMetricName.AvailableMemoryMBytes, true, 1024, MetricValueFormatter.formatMBytesValue)
        };
        ComputeMetrics.metricMap[ComputeMetricName.DiskSpaceUsedPercentage] = {
            name: ComputeMetricName.DiskSpaceUsedPercentage,
            displayName: DisplayStrings.DiskSpaceUsedChartDisplayName,
            descriptor: new FixedMaxValueMetricDescriptor(
                ComputeMetricName.DiskSpaceUsedPercentage, false, 100, MetricValueFormatter.formatPercentageValue)
        };
        ComputeMetrics.metricMap[ComputeMetricName.NetworkReceivedPerSec] = {
            name: ComputeMetricName.NetworkReceivedPerSec,
            displayName: DisplayStrings.NetworkReceivedChartDisplayName,
            descriptor: new FixedMaxValueMetricDescriptor(
                ComputeMetricName.NetworkReceivedPerSec, false, 100, MetricValueFormatter.formatBytesValue)
        };
        ComputeMetrics.metricMap[ComputeMetricName.NetworkSentPerSec] = {
            name: ComputeMetricName.NetworkSentPerSec,
            displayName: DisplayStrings.NetworkSentChartDisplayName,
            descriptor: new FixedMaxValueMetricDescriptor(
                ComputeMetricName.NetworkSentPerSec, false, 100, MetricValueFormatter.formatBytesValue)
        };

        ComputeMetrics.metricList = new Array<IMetric>();

        for (const metricName in ComputeMetrics.metricMap) {
            if (ComputeMetrics.metricMap.hasOwnProperty(metricName)) {
                ComputeMetrics.metricList.push(ComputeMetrics.metricMap[metricName]);
            }
        }
    }

    public static list(): IMetric[] {
        return ComputeMetrics.metricList;
    }

    public static get(metricName: string): IMetric {
        return ComputeMetrics.metricMap[metricName];
    }
}

// initialize static compute metrics classlass
ComputeMetrics.initialize();
