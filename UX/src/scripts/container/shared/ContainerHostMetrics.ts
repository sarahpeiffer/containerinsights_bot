import { ContainerHostMetricName } from './ContainerMetricsStrings';

/**
 * shared
 */
import { IMetric, IMetricMap, VariableMaxValueMetricDescriptor } from '../../shared/MetricDescriptor';
import { MetricValueFormatter } from '../../shared/MetricValueFormatter';
import { DisplayStrings } from '../../shared/DisplayStrings';

export class ContainerHostMetrics {
    private static metricMap: IMetricMap;
    private static metricList: IMetric[];

    static initialize() {
        ContainerHostMetrics.metricMap = {};

        ContainerHostMetrics.metricMap[ContainerHostMetricName.CpuCoreUtilization] = {
            name: ContainerHostMetricName.CpuCoreUtilization,
            displayName: DisplayStrings.ContainerHostCpuCoreUtilizationCounterName,
            descriptor: new VariableMaxValueMetricDescriptor(
                ContainerHostMetricName.CpuCoreUtilization, false, MetricValueFormatter.formatMillicoreValue)
        };

        ContainerHostMetrics.metricMap[ContainerHostMetricName.MemoryWorkingSetBytes] = {
            name: ContainerHostMetricName.MemoryWorkingSetBytes,
            displayName: DisplayStrings.ContainerHostMemoryUsageWorkingSet,
            descriptor: new VariableMaxValueMetricDescriptor(
                ContainerHostMetricName.MemoryWorkingSetBytes, false,
                MetricValueFormatter.formatBytesValue)
        };

        ContainerHostMetrics.metricMap[ContainerHostMetricName.MemoryRssBytes] = {
            name: ContainerHostMetricName.MemoryRssBytes,
            displayName: DisplayStrings.ContainerHostMemoryUsageRss,
            descriptor: new VariableMaxValueMetricDescriptor(
                ContainerHostMetricName.MemoryRssBytes, false,
                MetricValueFormatter.formatBytesValue)
        };

        ContainerHostMetrics.metricList = new Array<IMetric>();

        for (const metricName in ContainerHostMetrics.metricMap) { 
            if (ContainerHostMetrics.metricMap.hasOwnProperty(metricName)) {
                ContainerHostMetrics.metricList.push(ContainerHostMetrics.metricMap[metricName]);
            }
        }
    }

    public static list(): IMetric[] {
        return ContainerHostMetrics.metricList;
    }

    public static get(metricName: string): IMetric {
        return ContainerHostMetrics.metricMap[metricName];
    }
}

// initialize static Container metrics classlass
ContainerHostMetrics.initialize();
