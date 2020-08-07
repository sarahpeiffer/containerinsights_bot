import { ContainerMetricName } from './ContainerMetricsStrings';

/**
 * shared
 */
import { IMetric, IMetricMap, FixedMaxValueMetricDescriptor, VariableMaxValueMetricDescriptor } from '../../shared/MetricDescriptor';
import { MetricValueFormatter } from '../../shared/MetricValueFormatter';
import { DisplayStrings } from '../../shared/DisplayStrings';

export class ContainerMetrics {
    private static metricMap: IMetricMap;
    private static metricList: IMetric[];

    static initialize() {
        ContainerMetrics.metricMap = {};

        ContainerMetrics.metricMap[ContainerMetricName.CpuCoreUtilization] = {
            name: ContainerMetricName.CpuCoreUtilization,
            displayName: DisplayStrings.ContainerCpuCoreUtilizationCounterName,
            descriptor: new VariableMaxValueMetricDescriptor(
                ContainerMetricName.CpuCoreUtilization, false, MetricValueFormatter.formatMillicoreValue)
        };


        ContainerMetrics.metricMap[ContainerMetricName.MemoryWorkingSetBytes] = {
            name: ContainerMetricName.MemoryWorkingSetBytes,
            displayName: DisplayStrings.ContainerMemoryUsageWorkingSet,
            descriptor: new VariableMaxValueMetricDescriptor(
                ContainerMetricName.MemoryWorkingSetBytes, false, MetricValueFormatter.formatBytesValue)
        };

        ContainerMetrics.metricMap[ContainerMetricName.MemoryRssBytes] = {
            name: ContainerMetricName.MemoryRssBytes,
            displayName: DisplayStrings.ContainerMemoryUsageRss,
            descriptor: new VariableMaxValueMetricDescriptor(
                ContainerMetricName.MemoryRssBytes, false, MetricValueFormatter.formatBytesValue)
        };


        ContainerMetrics.metricMap[ContainerMetricName.CpuUtilization] = {
            name: ContainerMetricName.CpuUtilization,
            displayName: DisplayStrings.ContainerCpuUtilizationCounterName,
            descriptor: new FixedMaxValueMetricDescriptor(
                ContainerMetricName.CpuUtilization, false, 100, MetricValueFormatter.formatPercentageValue)
            // TODO : maxValueToNormalize in FixedMaxValueMetricDescriptor is going to be updated 
            //        to dynamic values based on the container data for all metrics.
        };
        
        ContainerMetrics.metricMap[ContainerMetricName.DiskReadsMBytes] = {
            name: ContainerMetricName.DiskReadsMBytes,
            displayName: DisplayStrings.ContainerDiskReadsMBCounterName,
            descriptor: new FixedMaxValueMetricDescriptor(
                ContainerMetricName.DiskReadsMBytes, false, 1024, MetricValueFormatter.formatMBytesValue)
                // TODO : maxValueToNormalize in FixedMaxValueMetricDescriptor is going to be updated 
                //        to dynamic values based on the container data for all metrics.
        };
        ContainerMetrics.metricMap[ContainerMetricName.DiskWritesMBytes] = {
            name: ContainerMetricName.DiskWritesMBytes,
            displayName: DisplayStrings.ContainerDiskWritesMBCounterName,
            descriptor: new FixedMaxValueMetricDescriptor(
                ContainerMetricName.DiskWritesMBytes, false, 1024, MetricValueFormatter.formatMBytesValue)
                // TODO : maxValueToNormalize in FixedMaxValueMetricDescriptor is going to be updated 
                //        to dynamic values based on the container data for all metrics.
        };
        ContainerMetrics.metricMap[ContainerMetricName.NetworkSendBytes] = {
            name: ContainerMetricName.NetworkSendBytes,
            displayName: DisplayStrings.ContainerNetworkSendBytesCounterName,
            descriptor: new FixedMaxValueMetricDescriptor(
                ContainerMetricName.NetworkSendBytes, false, 1024, MetricValueFormatter.formatBytesValue)
                // TODO : maxValueToNormalize in FixedMaxValueMetricDescriptor is going to be updated 
                //        to dynamic values based on the container data for all metrics.
        };
        ContainerMetrics.metricMap[ContainerMetricName.NetworkReceiveBytes] = {
            name: ContainerMetricName.NetworkReceiveBytes,
            displayName: DisplayStrings.ContainerNetworkReceiveBytesCounterName,
            descriptor: new FixedMaxValueMetricDescriptor(
                ContainerMetricName.NetworkReceiveBytes, false, 1024, MetricValueFormatter.formatBytesValue)
                // TODO : maxValueToNormalize in FixedMaxValueMetricDescriptor is going to be updated 
                //        to dynamic values based on the container data for all metrics.
        };

        ContainerMetrics.metricList = new Array<IMetric>();

        for (const metricName in ContainerMetrics.metricMap) { 
            if (ContainerMetrics.metricMap.hasOwnProperty(metricName)) {
                ContainerMetrics.metricList.push(ContainerMetrics.metricMap[metricName]);
            }
        }
    }

    public static list(): IMetric[] {
        return ContainerMetrics.metricList.slice(0, 3); 
    }

    public static get(metricName: string): IMetric {
        return ContainerMetrics.metricMap[metricName];
    }
}

// initialize static Container metrics classlass
ContainerMetrics.initialize();
