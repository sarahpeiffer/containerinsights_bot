// values should match with the actual metric name in container perf logs
export const ContainerMetricName = {
    CpuCoreUtilization: 'CPU Usage (millicores)',
    MemoryRssBytes: 'Memory Rss', 
    MemoryWorkingSetBytes: 'Memory working set',
    // TODO : Below metrics need to get removed with update from the chart page
    CpuUtilization: '% Processor Time',
    DiskReadsMBytes: 'Disk Reads MB',
    DiskWritesMBytes: 'Disk Writes MB',
    NetworkSendBytes: 'Network Send Bytes',
    NetworkReceiveBytes: 'Network Receive Bytes',
};

// values should match with the actual metric name in container perf logs
export const ContainerHostMetricName = {
    CpuCoreUtilization: 'CPU Usage (millicores)',
    MemoryRssBytes: 'Memory Rss', 
    MemoryWorkingSetBytes: 'Memory working set',
    HostNetworkRxBytesPerSec: 'Network Receive (Bytes Per Second)',
    HostNetworkTxBytesPerSec: 'Network Send (Bytes Per Second)',
};
