import { LocaleStringsHandler, StringType } from './LocaleStringsHandler';

// tslint:disable:max-line-length
const localeHandler = LocaleStringsHandler.Instance().forStringType(StringType.Shared);

export const DisplayStrings: StringMap<string> = localeHandler.getStrings();

localeHandler._appendUnique('AggregateMetricsTab', 'Aggregate Charts');
localeHandler._appendUnique('TopNMetricsTab', 'Top N Charts');
localeHandler._appendUnique('TableTab', 'Top N List');
localeHandler._appendUnique('LegendMin', 'Minimum');
localeHandler._appendUnique('LegendAvg', 'Average');
localeHandler._appendUnique('LegendP05', '5th');
localeHandler._appendUnique('LegendP10', '10th');
localeHandler._appendUnique('LegendP50', '50th');
localeHandler._appendUnique('LegendP90', '90th');
localeHandler._appendUnique('LegendP95', '95th');
localeHandler._appendUnique('LegendMax', 'Maximum');
localeHandler._appendUnique('LegendClient', 'Client');
localeHandler._appendUnique('LegendServer', 'Server');
localeHandler._appendUnique('LegendNetwork', 'Network');

localeHandler._appendUnique('LegendCountTotal', 'All');
localeHandler._appendUnique('LegendCountReady', 'Ready');
localeHandler._appendUnique('LegendCountNotReady', 'Not Ready');

localeHandler._appendUnique('LegendCountPending', 'Pending');
localeHandler._appendUnique('LegendCountRunning', 'Running');
localeHandler._appendUnique('LegendCountUnknown', 'Unknown');
localeHandler._appendUnique('LegendCountSucceeded', 'Succeeded');
localeHandler._appendUnique('LegendCountFailed', 'Failed');

localeHandler._appendUnique('OptionMin', 'Min');
localeHandler._appendUnique('OptionAvg', 'Avg');
localeHandler._appendUnique('OptionP05', '5th');
localeHandler._appendUnique('OptionP10', '10th');
localeHandler._appendUnique('OptionP50', '50th');
localeHandler._appendUnique('OptionP90', '90th');
localeHandler._appendUnique('OptionP95', '95th');
localeHandler._appendUnique('OptionMax', 'Max');

localeHandler._appendUnique('OptionUsage', 'Usage');
localeHandler._appendUnique('OptionLimits', 'Limits');
localeHandler._appendUnique('OptionRequests', 'Requests');

localeHandler._appendUnique('OptionAll', 'Total');
localeHandler._appendUnique('OptionReady', 'Ready');
localeHandler._appendUnique('OptionNotReady', 'Not Ready');

localeHandler._appendUnique('OptionPending', 'Pending');
localeHandler._appendUnique('OptionRunning', 'Running');
localeHandler._appendUnique('OptionUnknown', 'Unknown');
localeHandler._appendUnique('OptionSucceeded', 'Succeeded');
localeHandler._appendUnique('OptionFailed', 'Failed');

localeHandler._appendUnique('OptionNotSpecified', 'Not Specified');
localeHandler._appendUnique('OptionTerminated', 'Terminated');
localeHandler._appendUnique('OptionWaiting', 'Waiting');

localeHandler._appendUnique('OptionStarting', 'Starting');
localeHandler._appendUnique('OptionStarted', 'Started');
localeHandler._appendUnique('OptionStopping', 'Stopping');
localeHandler._appendUnique('OptionStopped', 'Stopped');
localeHandler._appendUnique('OptionInvalid', 'Unknown');

localeHandler._appendUnique('CacheValidationInProgress', 'Cache validation in progress.  List of workspaces may not be valid.');
localeHandler._appendUnique('CacheValidationFailed', 'Cache validation failed.  List of workspaces may not be valid.');
localeHandler._appendUnique('LoadingInProgress', 'Data loading in progress');

localeHandler._appendUnique('EnterNameToSearchFor', 'Search by name...');
localeHandler._appendUnique('EnterPortToSearchFor', 'Search by port...');

localeHandler._appendUnique('LabelSeperator', ':');
localeHandler._appendUnique('EqualsLabelSeperator', ' =');
localeHandler._appendUnique('NoDataMsg', 'No data for selected filters.');
localeHandler._appendUnique('NoDataItemMsg', 'No data for selected time');
localeHandler._appendUnique('NoData', 'No Data');
localeHandler._appendUnique('Select', 'Select');
localeHandler._appendUnique('LoadMore', 'Load More');
localeHandler._appendUnique('DataRetrievalError', 'Error retrieving data');
localeHandler._appendUnique('ZeroItemCount', '0 items');
localeHandler._appendUnique('ZeroItemCountRatio', '0 of {0} items matching');
localeHandler._appendUnique('OneItemCount', '1 item');
localeHandler._appendUnique('OneItemCountRatio', '1 of {0} items matching');
localeHandler._appendUnique('MultipleItemCount', '{0} items');
localeHandler._appendUnique('MultipleItemCountRatio', '{0} of {1} items matching');

localeHandler._appendUnique('TopXItemCount', 'Top {0} item(s)');
localeHandler._appendUnique('AllXItemCount', 'All {0} item(s)');

localeHandler._appendUnique('RefineSelection', 'Refine selection for more entries');
localeHandler._appendUnique('ResourceTypeAll', 'All');
localeHandler._appendUnique('ResourceTypeResourceGroup', 'Resource Group');
localeHandler._appendUnique('ResourceTypeServiceMapGroup', 'Group');
localeHandler._appendUnique('ResourceTypeVirtualMachine', 'Virtual Machine');
localeHandler._appendUnique('ResourceTypeServiceMapComputer', 'Computer');
localeHandler._appendUnique('ResourceTypeVMSS', 'VM Scale Set');
localeHandler._appendUnique('ResourceTypeAzureArc', 'Azure Arc Machine');

// Compute Chart Display Names
localeHandler._appendUnique('CpuUtilizationPercentChartDisplayName', 'CPU Utilization %');
localeHandler._appendUnique('AvailableMemoryChartDisplayName', 'Available Memory');
localeHandler._appendUnique('DiskSpaceUsedChartDisplayName', 'Logical Disk Space Used %');
localeHandler._appendUnique('DiskIOPSTransferChartDisplayName', 'Logical Disk IOPS');
localeHandler._appendUnique('DiskDataRateChartDisplayName', 'Logical Disk MB/s');
localeHandler._appendUnique('DiskLatencyChartDisplayName', 'Logical Disk Latency (ms)');
localeHandler._appendUnique('TopDiskSpaceUsedChartDisplayName', 'Max Logical Disk Used %');
localeHandler._appendUnique('NetworkChartDisplayName', 'Network');
localeHandler._appendUnique('NetworkReceivedChartDisplayName', 'Network Received Byte/s');
localeHandler._appendUnique('NetworkSentChartDisplayName', 'Network Sent Byte/s');

localeHandler._appendUnique('TopNCpuUtilizationPercentChartDescription', 'The top N machines based on the highest average CPU utilization over the graphed timeframe');
localeHandler._appendUnique('TopNAvailableMemoryChartDescription', 'The top N machines based on the lowest average amount of available memory over the graphed timeframe');
localeHandler._appendUnique('TopNNetworkReceivedChartDescription', 'The top N machines based on the highest average bytes received over the graphed timeframe');
localeHandler._appendUnique('TopNNetworkSentChartDescription', 'The top N machines based on the highest average bytes sent over the graphed timeframe');
localeHandler._appendUnique('TopNDiskSpaceUsedChartDescription', 'The top N machines based on the highest average logical disk space used % across all of their disk volumes over the graphed timeframe');

localeHandler._appendUnique('CpuUtilizationPercentChartDescription', '% Processor time over the graphed timeframe');
localeHandler._appendUnique('AvailableMemoryChartDescription', 'Available memory over the graphed timeframe');
localeHandler._appendUnique('DiskIOPSTransferChartDescription', 'Logical disk transfers per second over the graphed timeframe');
localeHandler._appendUnique('DiskDataRateChartDescription', 'Logical disk bytes per second over the graphed timeframe');
localeHandler._appendUnique('DiskLatencyDescription', 'Logical disk latency per millisecond over the graphed timeframe');
localeHandler._appendUnique('TopDiskSpaceUsedChartDescription', 'The maximum disk used % for each logical disk over the graphed timeframe');
localeHandler._appendUnique('ConnectionBytesSentRateDescription', 'The total bytes sent rate over the graphed timeframe');
localeHandler._appendUnique('ConnectionBytesReceivedRateDescription', 'The total bytes received rate over the graphed timeframe');

// Compute Counter Display Names
localeHandler._appendUnique('CpuUtilizationCounterDisplayName', 'Cpu');
localeHandler._appendUnique('AvailableMemoryCounterDisplayName', 'Memory');
localeHandler._appendUnique('DiskIOPSCounterDisplayName', 'DiskIOPS');
localeHandler._appendUnique('DiskDataRateCounterDisplayName', 'DiskDataRate');
localeHandler._appendUnique('DiskLatencyCounterDisplayName', 'DiskLatency');
localeHandler._appendUnique('DiskSpaceUsedCounterDisplayName', 'Logical Disk Used');

localeHandler._appendUnique('TimeRangeSelectorTitle', 'Time range');
localeHandler._appendUnique('WorkspaceSelectorTitle', 'Workspace');
localeHandler._appendUnique('ComputerGroupSelectorTitle', 'Group');
localeHandler._appendUnique('SubscriptionSelectorTitle', 'Subscription');
localeHandler._appendUnique('ResourceGroupSelectorTitle', 'Resource Group');
localeHandler._appendUnique('ResourceSelectorTitle', 'Resource');
localeHandler._appendUnique('ResourceTypeSelectorTitle', 'Type');
localeHandler._appendUnique('VmssInstanceSelectorTitle', 'Instance');
localeHandler._appendUnique('AccountSelectorTitle', 'Account');
localeHandler._appendUnique('FrequencySelectorTitle', 'Frequency');
localeHandler._appendUnique('MetricSelectorTitle', 'Metric:');
localeHandler._appendUnique('AllSelectorTitle', '<All>');
localeHandler._appendUnique('AllButKubeSystemTitle', '<All but kube-system>');
localeHandler._appendUnique('ReplicaSetTitle', 'ReplicaSet');
localeHandler._appendUnique('DaemonSetTitle', 'DaemonSet');
localeHandler._appendUnique('JobTitle', 'Job');
localeHandler._appendUnique('CronJobTitle', 'CronJob');
localeHandler._appendUnique('HybridSolutionType', 'Hybrid');
localeHandler._appendUnique('AzureSolutionType', 'Azure');
localeHandler._appendUnique('ManageAlerts', 'Manage Alerts');
localeHandler._appendUnique('HybridSolutionTypeTooltip', 'View mode that combines Azure resources and non-Azure resources (e.g. on-prem) via Log Analytics workspaces');
localeHandler._appendUnique('AzureSolutionTypeTooltip', 'View mode that only shows Azure resources');
localeHandler._appendUnique('AzureSolutionTypeHelpText', 'Azure scoping uses subscription and resource groups. Hybrid scope is workspace centric and allows you to see your on-premise VMs as well.');

localeHandler._appendUnique('GroupType', 'Group Type');
localeHandler._appendUnique('OmsComputerGroupTypeName', 'Computer Group');

localeHandler._appendUnique('ServiceMapGroupTypeAzureCloudServiceName', 'Cloud Service');
localeHandler._appendUnique('ServiceMapGroupTypeAzureServiceFabricName', 'Service Fabric');
localeHandler._appendUnique('ServiceMapGroupTypeAzureVMScaleSetName', 'VM Scale Set');
localeHandler._appendUnique('ServiceMapGroupTypeAzureResourceGroupName', 'Resource Group');
localeHandler._appendUnique('ServiceMapGroupTypeAzureSubscrptionName', 'Subscription');
localeHandler._appendUnique('ServiceMapGroupTypeName', 'Service Map Computer Group');

localeHandler._appendUnique('ComparisonGridColumnTitleName', 'Name');
localeHandler._appendUnique('ComparisonGridColumnTitleRunning', 'Status');
localeHandler._appendUnique('ComparisonGridColumnTitleAvgPercent', 'Avg %');
localeHandler._appendUnique('ComparisonGridColumnTitleMinPercent', 'Min %');
localeHandler._appendUnique('ComparisonGridColumnTitleMaxPercent', 'Max %');
localeHandler._appendUnique('ComparisonGridColumnTitle50thPercentilePercent', '50th %');
localeHandler._appendUnique('ComparisonGridColumnTitle90thPercentilePercent', '90th %');
localeHandler._appendUnique('ComparisonGridColumnTitle95thPercentilePercent', '95th %');
localeHandler._appendUnique('ComparisonGridColumnTitleType', 'Type');
localeHandler._appendUnique('Unknown', 'Unknown');

localeHandler._appendUnique('HealthGridColumnMonitorInstanceName', 'Monitor Instance Name');
localeHandler._appendUnique('HealthGridColumnMonitorStatus', 'Status');

localeHandler._appendUnique('ComparisonGridColumnTitleContainerCount', 'Containers');
localeHandler._appendUnique('ComparisonGridColumnTitleController', 'Controller');
localeHandler._appendUnique('ComparisonGridColumnTitlePods', 'Pod');
localeHandler._appendUnique('ComparisonGridColumnTitleNodeName', 'Node');
localeHandler._appendUnique('ComparisonGridColumnTitleAverage', 'Average');
localeHandler._appendUnique('ComparisonGridColumnTitle5thPercentile', '5th');
localeHandler._appendUnique('ComparisonGridColumnTitle10thPercentile', '10th');
localeHandler._appendUnique('ComparisonGridColumnTitle50thPercentile', '50th');
localeHandler._appendUnique('ComparisonGridColumnTitle90thPercentile', '90th');
localeHandler._appendUnique('ComparisonGridColumnTitle95thPercentile', '95th');
localeHandler._appendUnique('ComparisonGridColumnTitleMax', 'Max');
localeHandler._appendUnique('ComparisonGridColumnTitleMin', 'Min');
localeHandler._appendUnique('ComparisonGridColumnTitleTrend', 'Trend {1} ({0})');
localeHandler._appendUnique('ComparisonGridColumnTitleEllipses', '...');
localeHandler._appendUnique('MetricValueNoSuffix', '');
localeHandler._appendUnique('MetricValueKBSuffix', ' KB');
localeHandler._appendUnique('MetricValueMBSuffix', ' MB');
localeHandler._appendUnique('MetricValueGBSuffix', ' GB');
localeHandler._appendUnique('MetricValueTBSuffix', ' TB');
localeHandler._appendUnique('MetricValuePBSuffix', ' PB');
localeHandler._appendUnique('MetricValueEBSuffix', ' EB');
localeHandler._appendUnique('MetricValueZBSuffix', ' ZB');
localeHandler._appendUnique('MetricValueYBSuffix', ' YB');
localeHandler._appendUnique('MetricValueMillicoreSuffix', ' mc');


localeHandler._appendUnique('MetricValueThousandSuffix', ' K');
localeHandler._appendUnique('MetricValueMillionSuffix', ' M');
localeHandler._appendUnique('MetricValueBillionSuffix', ' B');
localeHandler._appendUnique('MetricValueTrillionSuffix', ' T');

localeHandler._appendUnique('MetricValueSecondsSuffix', 's');
localeHandler._appendUnique('MetricValueMillisecondsSuffix', 'ms');
localeHandler._appendUnique('LastHourTimeRange', 'Last 1 hour');
localeHandler._appendUnique('Last6HoursTimeRange', 'Last 6 hours');
localeHandler._appendUnique('Last12HoursTimeRange', 'Last 12 hours');
localeHandler._appendUnique('Last24HoursTimeRange', 'Last 24 hours');
localeHandler._appendUnique('Last3DaysTimeRange', 'Last 3 days');
localeHandler._appendUnique('Last7DaysTimeRange', 'Last 7 days');
localeHandler._appendUnique('Last30DaysTimeRange', 'Last 30 days');
localeHandler._appendUnique('AsOf', 'as of');

//storage
localeHandler._appendUnique('ErrorsChartTitle', 'Errors');
localeHandler._appendUnique('AvailabilityChartTitle', 'Availability');
localeHandler._appendUnique('IngressChartTitle', 'Ingress');
localeHandler._appendUnique('E2ELatencyChartTitle', 'E2ELatency');
localeHandler._appendUnique('ServerLatencyChartTitle', 'ServerLatency');
localeHandler._appendUnique('EgressChartTitle', 'Egress');
localeHandler._appendUnique('TransactionsChartTitle', 'Transactions');

localeHandler._appendUnique('Account', 'Account');
localeHandler._appendUnique('Blob', 'Blob');
localeHandler._appendUnique('Queue', 'Queue');
localeHandler._appendUnique('Table', 'Table');
localeHandler._appendUnique('File', 'File');
localeHandler._appendUnique('ServiceSelectorTitle', 'Service:');
localeHandler._appendUnique('ErrorsCounterName', 'Errors');
localeHandler._appendUnique('AvailabilityCounterName', 'Availability');
localeHandler._appendUnique('IngressCounterName', 'Ingress (Bytes Per Second)');
localeHandler._appendUnique('EgressCounterName', 'Egress (Bytes Per Second)');
localeHandler._appendUnique('SuccessE2ELatencyCounterName', 'Success E2ELatency');
localeHandler._appendUnique('SuccessServerLatencyCounterName', 'Success ServerLatency');
localeHandler._appendUnique('TransactionsCounterName', 'Transactions Per Second');

localeHandler._appendUnique('Total', 'TOTAL');

localeHandler._appendUnique('LastReportedNTimeAgo', 'Last reported {0} ago');
localeHandler._appendUnique('LastReported', 'Last reported');
localeHandler._appendUnique('NTimeAgo', '{0} ago');

localeHandler._appendUnique('ComparisonGridColumnTitleAllErrors', 'All');
localeHandler._appendUnique('ComparisonGridColumnTitleClientErrors', 'Client');
localeHandler._appendUnique('ComparisonGridColumnTitleServerErrors', 'Server');
localeHandler._appendUnique('ComparisonGridColumnTitleNetworkErrors', 'Network');
localeHandler._appendUnique('ErrorToolTipClientError', ' client error');
localeHandler._appendUnique('ErrorToolTipClientErrorPlural', ' client errors');
localeHandler._appendUnique('ErrorToolTipNetworkError', ' network error');
localeHandler._appendUnique('ErrorToolTipNetworkErrorPlural', ' network errors');
localeHandler._appendUnique('ErrorToolTipServerError', ' server error');
localeHandler._appendUnique('ErrorToolTipServerErrorPlural', ' server errors');
localeHandler._appendUnique('ErrorToolTipUnknownErrorType', ' unknown errors');
//Compute.Maps
localeHandler._appendUnique('ComputerSelectorTitle', 'Computer');
localeHandler._appendUnique('TimeRangeSelectorLast30Minutes', 'Last 30 mins');
localeHandler._appendUnique('TimeRangeSelectorLast60Minutes', 'Last 60 mins');
localeHandler._appendUnique('ViewMapAltText', 'View Map');
localeHandler._appendUnique('ViewSinglePerfVMAltText', 'View Virtual machine performance');
localeHandler._appendUnique('ViewVmssAltText', 'View Virtual machine scale set');
localeHandler._appendUnique('ViewVmAltText', 'View Virtual machine');
localeHandler._appendUnique('ViewAzureResourceText', 'View Azure resource');
localeHandler._appendUnique('SelectAnyComputerText', 'Select');
localeHandler._appendUnique('SelectAnyComputerGroupText', 'Select');
localeHandler._appendUnique('NavigateToAzureMonitor', 'map multiple resources in Azure Monitor');

localeHandler._appendUnique('Map', 'Map');
localeHandler._appendUnique('ResourceDetail', 'Resource details');
localeHandler._appendUnique('PerformanceDetail', 'Performance details');
localeHandler._appendUnique('ConnectionDetail', 'Connection details');

localeHandler._appendUnique('ShowClientOtherErrorMsg', 'Show ClientOtherErrors');

localeHandler._appendUnique('FeedbackDropdownDisplayString', 'Feedback');
localeHandler._appendUnique('FeedbackDropdownSendFeedbackOption', 'Suggest an idea');
localeHandler._appendUnique('FeedbackDropdownSendASmile', 'Send a smile');
localeHandler._appendUnique('FeedbackDropdownSendAFrown', 'Send a frown');

localeHandler._appendUnique('AggregateGranularitySubtitle', '{0} granularity');
localeHandler._appendUnique('ComparisonGridGranularitySubtitle', '1 bar = {0}');
localeHandler._appendUnique('NoComputersPrefix', 'Your selected workspace has no virtual machines or is not yet setup for the map feature.');
localeHandler._appendUnique('NoComputersHelp', 'Review the information in the {0} tab to complete the configuration of your workspace and installation of agents on your VMs.');
localeHandler._appendUnique('GetStarted', 'Get Started');
localeHandler._appendUnique('ConfigServerPorts', 'Configure Visible Server Ports');
localeHandler._appendUnique('AllServerPortsPropertyName', 'All Server Ports');
localeHandler._appendUnique('ApplyConfigButton', 'Apply Config');

// Compute Onboarding
localeHandler._appendUnique('ZeroWorkspaceMessage', 'There are no resources in the selected scope with Azure Monitor for VMs enabled.');
localeHandler._appendUnique('OnboardingMessageTitle', 'Get more visibility into the health and performance of your virtual machines');
localeHandler._appendUnique('AzureOnboardingMessageTitle', 'There are no VMs in the selected scope onboarded to Azure Monitor for VMs. Please click here to enable.');
localeHandler._appendUnique('AzureOnboardingNoVMTitle', 'There are no VMs in the current resource group. Please select another resource group.');
localeHandler._appendUnique('AzureOnboardEnableButton', 'Enable')
localeHandler._appendUnique('OnboardingMessage', `With an Azure virtual machine you get host CPU, disk and up/down state of your virtual machine out of the box. Enabling additional monitoring capabilities provides insights into the performance, topology, and health for the single VM and across your entire fleet of virtual machines.
You will be billed based on the amount of data ingested and your data retention settings. It can take between 20-30 minutes to configure the virtual machine and the monitoring data to appear under health, performance and map.`);
localeHandler._appendUnique('MoreQuestions', 'Have more questions?');
localeHandler._appendUnique('LearnMoreTitle', 'Learn more about virtual machine health and performance monitoring');
localeHandler._appendUnique('LearnMoreInstallTitle', 'Onboarding documentation for VM insights');
localeHandler._appendUnique('LearnMorePricingTitle', 'Learn more about pricing');
localeHandler._appendUnique('FAQ', 'FAQ');
localeHandler._appendUnique('SupportMatrix', 'Support Matrix');
localeHandler._appendUnique('HaveMoreQuestions', 'Have More Questions?');
localeHandler._appendUnique('KnowMoreTitle', 'Get more visibility into the performance, network dependencies and health of your virtual machines.');
localeHandler._appendUnique('UnexpectedErrorPrompt', 'An unexpected error has ocurred, try again or refresh the page.');

// Ready (state) *for* {X} minute(s)/day(s)/hour(s)
localeHandler._appendUnique('ReadyFor', 'for');

localeHandler._appendUnique('ComparisonGridTooltipResourceGroup', 'Resource group');
localeHandler._appendUnique('ComparisonGridTooltipSubscriptionId', 'Subscription ID');
localeHandler._appendUnique('ComparisonGridTooltipSubscriptionName', 'Subscription name');

localeHandler._appendUnique('ComputeGridTooltipVolumeTitle', 'Volume');
localeHandler._appendUnique('ComputeGridTooltipCloudServiceDeploymentId', 'Deployment ID');
localeHandler._appendUnique('ComputeGridTooltipCloudServiceInstanceId', 'Instance ID');
localeHandler._appendUnique('ComputeGridTooltipCloudServiceInstanceName', 'Cloud service name');
localeHandler._appendUnique('ComputeGridTooltipScalesetId', 'Instance ID');
localeHandler._appendUnique('ComputeGridTooltipScalesetName', 'Scale set name');
localeHandler._appendUnique('ComputeGridTooltipServiceFabricName', 'Service Fabric Cluster name');

// Connection Metrics
localeHandler._appendUnique('ConnectionResponseTime', 'Response Time');
localeHandler._appendUnique('ConnectionRequests', 'Requests Per Minute');
localeHandler._appendUnique('ConnectionTraffic', 'Traffic');
localeHandler._appendUnique('ConnectionLinks', 'Links');
localeHandler._appendUnique('ConnectionHelpText', 'Help');

localeHandler._appendUnique('ConnectionBytesSent', 'Sent');
localeHandler._appendUnique('ConnectionBytesReceived', 'Received');
localeHandler._appendUnique('ConnectionBytesSentRate', 'Bytes Sent Rate');
localeHandler._appendUnique('ConnectionBytesReceivedRate', 'Bytes Received Rate');
localeHandler._appendUnique('ConnectionLinksEstablished', 'Established');
localeHandler._appendUnique('ConnectionLinksTerminated', 'Terminated');
localeHandler._appendUnique('ConnectionLinksLive', 'Live');
localeHandler._appendUnique('ConnectionLinksFailed', 'Failed');

localeHandler._appendUnique('ConnectionResponseTimeInfo', 'Measurement of time from the request to when last byte is received.');
localeHandler._appendUnique('ConnectionRequestsInfo', 'The request count charted per minute.');
localeHandler._appendUnique('ConnectionTrafficInfo', 'Measurement of the application level bytes sent and received over the connections.');
localeHandler._appendUnique('ConnectionLinksInfo', 'The count of failed, live, established and terminated links. Live links are still open at the end of the time range.');

localeHandler._appendUnique('ConnectionNoData', 'No Connection data');
localeHandler._appendUnique('ConnectionClientGroupNoData', 'The client group has no monitored machines to provide connection data.');
localeHandler._appendUnique('ConnectionClientGroupOnlyMonitored', 'Connection data is from monitored clients in the client group.');

// container perf
localeHandler._appendUnique('ClusterTab', 'Cluster');
localeHandler._appendUnique('ContainerResourceTableTab', 'Containers');
localeHandler._appendUnique('ContainerHostTableTab', 'Nodes');
localeHandler._appendUnique('ContainerControllerTab', 'Controllers');
localeHandler._appendUnique('ContainerNewsTableTab', 'Bot');
localeHandler._appendUnique('ContainerCpuCoreUtilizationCounterName', 'CPU Usage (millicores)');
localeHandler._appendUnique('ContainerMemoryUsageRss', 'Memory Rss');
localeHandler._appendUnique('ContainerMemoryUsageWorkingSet', 'Memory working set');
localeHandler._appendUnique('ContainerViewLogs', 'View Logs');
localeHandler._appendUnique('ContainerLiveLogs', 'Live Logs');
localeHandler._appendUnique('MetricFilterDropdown', 'Metric Filter Dropdown');
localeHandler._appendUnique('ControllerStatus', 'Controller Status');
localeHandler._appendUnique('unscheduledPods', 'Unscheduled Pods');
localeHandler._appendUnique('unscheduled', 'unscheduled');
localeHandler._appendUnique('Reason', 'Reason');

// Deployments
localeHandler._appendUnique('containerDeploymentsTabTitle', 'Deployments (Preview)');
localeHandler._appendUnique('containerActionBarHelpText', 'Help');
localeHandler._appendUnique('ContainerDeploymentsGridHeaderAge', 'Age');
localeHandler._appendUnique('ContainerDeploymentsGridHeaderAvailable', 'Available');
localeHandler._appendUnique('ContainerDeploymentsGridHeaderName', 'Name');
localeHandler._appendUnique('ContainerDeploymentsGridHeaderNamespace', 'Namespace');
localeHandler._appendUnique('ContainerDeploymentsGridHeaderReady', 'Ready');
localeHandler._appendUnique('ContainerDeploymentsGridHeaderUpToDate', 'Up-To-Date');
localeHandler._appendUnique('ContainerDeploymentsPropertyPanelTabDescribe', 'Describe');
localeHandler._appendUnique('ContainerDeploymentsPropertyPanelTabRaw', 'Raw');
localeHandler._appendUnique('ContainerFailureAdditionalHelpText', 'Please contact support');
localeHandler._appendUnique('ContainerFailureErrorAdditionalHelp', 'Additional help');
localeHandler._appendUnique('ContainerFailureErrorAdditionalHelpText', 'Additional help can be reached by emailing askcoin@microsoft.com');
localeHandler._appendUnique('ContainerFailureErrorAdvancedText', 'Advanced');
localeHandler._appendUnique('ContainerFailureErrorAdvancedTitleCollapseWord', 'hide');
localeHandler._appendUnique('ContainerFailureErrorAdvancedTitleExpandWord', 'show');
localeHandler._appendUnique('ContainerFailureErrorCode', 'Error Code');
// tslint:disable:max-line-length 
localeHandler._appendUnique('ContainerFailureErrorForbidden', 'An forbidden request is usually the result of missing security permissions in kubernetes.  A kubenetes admininstrator for your cluster must apply a cluster role binding allowing the clusterUser access to the GET endpoint listed above under KubeApi Path.  If this cluster is an Azure Active Directory integrated cluster this permission is required for the user logged in while accessing the deployments feature (which may be different then the user logged into the Azure Portal)');
localeHandler._appendUnique('ContainerFailureErrorForbiddenExtra', 'for help applying cluster role bindings');
localeHandler._appendUnique('ContainerFailureErrorForbiddenKubDoc', 'kubernetes documentation');
localeHandler._appendUnique('ContainerFailureErrorForbiddenLastLine', 'Please see the');
localeHandler._appendUnique('ContainerFailureErrorKubeApiPath', 'Kube Api Path');
// tslint:disable:max-line-length 
localeHandler._appendUnique('ContainerFailureErrorMessage', 'Oops, we have encountered a problem loading this page and are unable to display your results.  Please review this error and ${0}refresh${0} the page.');
// tslint:disable:max-line-length 
localeHandler._appendUnique('ContainerFailureAADErrorMessage', 'If this is an active directory cluster you can also try to ${0}logout${0} and start a new active directory session. If the issue persists please review the ${0}documentation${0} for additional troubleshooting steps.');
// tslint:disable:max-line-length 
localeHandler._appendUnique('ContainerFailureErrorNote', '>Note: The subject should be directed to the user or group being authorized (not clusterUser) if authorizing an Azure Active Directory cluster.');
// tslint:disable:max-line-length 
localeHandler._appendUnique('ContainerFailureErrorPopupClosed', 'The popup dialog was unable to log in.  If you are using a popup blocker please ensure this login is able to popup.  There are known issues with this login mechanism on older versions of Internet Explorer. This login is required to authorize your Active Directory integrated cluster.  The context of the user logged into the portal is not valid for Azure Active Directory integrated clusters.');
// tslint:disable:max-line-length 
localeHandler._appendUnique('ContainerFailureErrorUnauthorized', '>An unauthorized request is usually the result of an issue with the security tokens. If this is an RBAC cluster please contact Azure support.  If this is an Azure Active Directory integrated cluster please speak to your cluster administrator.');
localeHandler._appendUnique('ContainerFailureErrorYAML', 'Example YAML covering all features of this product');
localeHandler._appendUnique('ContainerFailureUnexpectedError', 'Unexpected Error');
localeHandler._appendUnique('ContainerFailureUnauthorizedErrorTitle', 'How to enable and set permissions for Live Data on your AKS cluster');
localeHandler._appendUnique('ContainerLiveCloseConsole', 'Close Console');
localeHandler._appendUnique('ContainerLiveConsoleNext', 'Next');
localeHandler._appendUnique('ContainerLiveConsolePrevious', 'Previous');
localeHandler._appendUnique('ContainerLiveSearch', 'Search...');

localeHandler._appendUnique('ContainerHealthTableTab', 'Health (Preview)');

// container control panel
localeHandler._appendUnique('ContainerAddFilter', 'Add Filter');
localeHandler._appendUnique('ContainerWorkspacePillAriaLabel', 'workspace-pill');
localeHandler._appendUnique('ContainerTimePillAriaLabel', 'time-pill');
localeHandler._appendUnique('ContainerVariablePillAriaLabel', 'variable-pill');

//container live metrics
localeHandler._appendUnique('LiveMetricsGoLiveButtonText', 'Live (preview) Off');
localeHandler._appendUnique('LiveMetricsSeeHistoricalButtonText', 'Live (preview) On');

// container chart titles
localeHandler._appendUnique('ContainerChartPodCpuUtilization', 'Pod CPU utilization (mc)');
localeHandler._appendUnique('ContainerChartPodMemoryUtilization', 'Pod Memory utilization');
localeHandler._appendUnique('ContainerChartNodeCpuUtilization', 'Node CPU utilization %');
localeHandler._appendUnique('ContainerChartNodeMemoryUtilization', 'Node memory utilization %');
localeHandler._appendUnique('ContainerChartNodeCount', 'Node count');
localeHandler._appendUnique('ContainerChartPodCount', 'Active pod count');

//host perf
localeHandler._appendUnique('ContainerHostCpuCoreUtilizationCounterName', 'CPU Usage (millicores)');
localeHandler._appendUnique('ContainerHostMemoryUsageRss', 'Memory Rss');
localeHandler._appendUnique('ContainerHostMemoryUsageWorkingSet', 'Memory working set');
localeHandler._appendUnique('ContainerHostNetworkRxBytesPerSecCounterName', 'Network Receive (Bytes Per Second)');
localeHandler._appendUnique('ContainerHostNetworkTxBytesPerSecCounterName', 'Network Send (Bytes Per Second)');

localeHandler._appendUnique('ClusterSelectorTitle', 'Cluster');
localeHandler._appendUnique('NameSpaceSelectorTitle', 'Namespace');
localeHandler._appendUnique('ServiceNameSelectorTitle', 'Service');
localeHandler._appendUnique('HostNameSelectorTitle', 'Node');
localeHandler._appendUnique('NodePoolNameSelectorTitle', 'Node Pool');
localeHandler._appendUnique('ControllerNameSelectorTitle', 'Controller Name');
localeHandler._appendUnique('ControllerKindSelectorTitle', 'Controller Kind');

/*Below to be removed with chart update*/
localeHandler._appendUnique('ContainerCpuUtilizationCounterName', 'CPU Utilization %');
localeHandler._appendUnique('ContainerDiskReadsMBCounterName', 'Disk Reads MB');
localeHandler._appendUnique('ContainerDiskWritesMBCounterName', 'Disk Writes MB');
localeHandler._appendUnique('ContainerNetworkSendBytesCounterName', 'Network Send Bytes');
localeHandler._appendUnique('ContainerNetworkReceiveBytesCounterName', 'Network Receive Bytes');

// mdm banner
localeHandler._appendUnique('MdmBannerText',
     'Enable fast alerting experience on basic metrics for this Azure Kubernetes Services cluster. Learn more {0}');
localeHandler._appendUnique('MdmBannerLinkText', 'here');
localeHandler._appendUnique('MdmBannerEnableButton', 'Enable');

//container host list grid
localeHandler._appendUnique('ContainerUpTimeDaysTitle', '{0} day');
localeHandler._appendUnique('ContainerUpTimeHoursTitle', '{0} hour');
localeHandler._appendUnique('ContainerUpTimeMinutesTitle', '{0} min');
localeHandler._appendUnique('ContainerUpTimeSecondsTitle', '{0} sec');
localeHandler._appendUnique('ContainerUpTimeMilliSecondsTitle', '{0} msec');
localeHandler._appendUnique('ContainerUpTimeDaysTitlePlural', '{0} days');
localeHandler._appendUnique('ContainerUpTimeHoursTitlePlural', '{0} hours');
localeHandler._appendUnique('ContainerUpTimeMinutesTitlePlural', '{0} mins');
localeHandler._appendUnique('ContainerUpTimeSecondsTitlePlural', '{0} secs');
localeHandler._appendUnique('ContainerUpTimeMilliSecondsTitlePlural', '{0} msecs');

//TODO: get all the container grid specific rather than reusing from other grids

localeHandler._appendUnique('ComparisonGridColumnTitleHostStatus', 'Status');
localeHandler._appendUnique('ComparisonGridColumnTitleContainers', 'Containers');
localeHandler._appendUnique('ComparisonGridColumnTitleCluster', 'Cluster');
localeHandler._appendUnique('ComparisonGridColumnTitleUpTime', 'UpTime');
localeHandler._appendUnique('ComparisonGridColumnTitleComputerName', 'Host');
localeHandler._appendUnique('ComparisonGridColumnTitleRestarts', 'Restarts');
localeHandler._appendUnique('ComparisonGridColumnContainerName', 'ContainerName');
localeHandler._appendUnique('ComparisonGridColumnPodName', 'PodName');
localeHandler._appendUnique('ComparisonGridColumnController', 'Controller');
localeHandler._appendUnique('ComparisonGridColumnControllerKind', 'ControllerKind');


// tooltips
//common
localeHandler._appendUnique('ContainerMetricSelectorTooltip', 'The monitoring data in the table represents the metric selected.');
localeHandler._appendUnique('ContainerColumnHeaderAvgPercentTooltip', 'The average % is a measure of each entity for the selected metric');
localeHandler._appendUnique('ContainerColumnHeaderAverageTooltip', 'The average measure of each entity for the selected metric.');

// for ContainerHostHierarchyGrid
localeHandler._appendUnique('ContainerHostHierarchyGridColumnHeaderUpTimeTooltip', 'The amount of time an entity has been running since the last restart');
localeHandler._appendUnique('ContainerHostHierarchyGridColumnHeaderTrendTooltip', 'Each bar represents the average % measurement for the selected metric for an entity over a specific duration of time');

// for ContainerControllerHierarchyGrid
localeHandler._appendUnique('ContainerControllerHierarchyGridColumnHeaderUpTimeTooltip', 'The amount of time an entity has been running since the last restart');
localeHandler._appendUnique('ContainerControllerHierarchyGridColumnHeaderTrendTooltip', 'Each bar represents the average % measurement for the selected metric for an entity over a specific duration of time');

// for ContainerComparisonGrid
localeHandler._appendUnique('ContainerComparisonGridColumnHeaderUpTimeTooltip', 'The amount of time an entity has been running since the last restart');
localeHandler._appendUnique('ContainerComparisonGridColumnHeaderTrendTooltip', 'Each bar represents the average % measurement for the selected metric for an entity over a specific duration of time');

localeHandler._appendUnique('NoAssociatedController', 'Pods without controllers');
localeHandler._appendUnique('NoUpTimeTitle', 'N/A');
localeHandler._appendUnique('UnknownUpTimeTitle', '?');

//container status
localeHandler._appendUnique('ContainerStatusUnknownTitle', 'unknown');
localeHandler._appendUnique('ContainerStatusRunningTitle', 'running');
localeHandler._appendUnique('ContainerStatusWaitingTitle', 'waiting');
localeHandler._appendUnique('ContainerStatusTerminatedTitle', 'terminated');
localeHandler._appendUnique('ContainerStatusSucceededTitle', 'succeeded');
localeHandler._appendUnique('ContainerStatusGeneralWarning', 'warning');
localeHandler._appendUnique('ContainerStatusGeneralFailed', 'failed');

//container node status
localeHandler._appendUnique('ContainerNodeStatusUnknownTitle', 'unknown');
localeHandler._appendUnique('ContainerNodeStatusNotReadyTitle', 'notready');
localeHandler._appendUnique('ContainerNodeStatusReadyTitle', 'ready');

localeHandler._appendUnique('ContainerNodeStatusGreenAlt', 'Ok');
localeHandler._appendUnique('ContainerNodeStatusWarningAlt', 'Warn');
localeHandler._appendUnique('ContainerNodeStatusErrorAlt', 'Err');
localeHandler._appendUnique('ContainerNodeStatusUnknownAlt', 'Unk');
localeHandler._appendUnique('ContainerStatusTerminalAlt', 'Done');
localeHandler._appendUnique('PodStatusSuccessAlt', 'Done');

//health monitor status
localeHandler._appendUnique('HealthMonitorStatusGreenAlt', 'Pass');
localeHandler._appendUnique('HealthMonitorStatusWarningAlt', 'Warn');
localeHandler._appendUnique('HealthMonitorStatusErrorAlt', 'Fail');

//container metrics
localeHandler._appendUnique('ContainerMissingPerfMetricTitle', '-');
localeHandler._appendUnique('ContainerSystemMetricTitle', 'Other Processes');
localeHandler._appendUnique('ContainerMissingMetaDataTitle', '-');

// container host list
localeHandler._appendUnique('ContainerHostAllocatableCores', 'AllocatableCPU(MilliCores)');
localeHandler._appendUnique('ContainerHostAllocatableBytes', 'AllocatableMemory');

// mesh chart titles
localeHandler._appendUnique('MeshChartCpuUtilization', 'CPU utilization %');
localeHandler._appendUnique('MeshChartMemoryUtilization', 'Memory utilization %');
localeHandler._appendUnique('MeshChartReplicaCount', 'Service Replica count');
localeHandler._appendUnique('MeshChartStatusCount', 'Container count by Status');

localeHandler._appendUnique('DeepLinkSucess', 'Copied to Clipboard!');
localeHandler._appendUnique('DeepLinkFailed', 'Oops!  Copy Failed!');
localeHandler._appendUnique('DeepLinkClickToCopy', 'Click to copy page link!');

localeHandler._appendUnique('Properties', 'Properties');
localeHandler._appendUnique('LogEvent', 'Log Events');
localeHandler._appendUnique('Alerts', 'Alerts');
localeHandler._appendUnique('Metrics', 'Metrics');
localeHandler._appendUnique('EventType', 'EVENT TYPE');
localeHandler._appendUnique('Count', 'COUNT');
localeHandler._appendUnique('LogEventPanelMessage', 'Select an event type to open in Log Analytics');
localeHandler._appendUnique('Error', 'Error');
localeHandler._appendUnique('LogEventPanelError', 'Failed to load the Log Events');
localeHandler._appendUnique('LogEventPanelErrorMessage', 'Please review logs to see what is running.');
localeHandler._appendUnique('FQDN', 'Fully Qualified Domain Name');
localeHandler._appendUnique('DNSNames', 'DNS Names');
localeHandler._appendUnique('OS', 'Operating System');
localeHandler._appendUnique('IPv4', 'IPv4 Addresses');
localeHandler._appendUnique('DefaultIPv4Gateway', 'Default IPv4 Gateway')
localeHandler._appendUnique('IPv6', 'IPv6 Addresses');
localeHandler._appendUnique('MacAddress', 'Mac Addresses');
localeHandler._appendUnique('AlertSeverity', 'Severity');
localeHandler._appendUnique('AlertCount', 'Count');
localeHandler._appendUnique('AlertSummaryTableTitle', 'Fired Alerts By Severity');
localeHandler._appendUnique('LogTargettedAlertCount', 'Total Log targeted alerts');
localeHandler._appendUnique('TotalAlertCount', 'Total alerts');
localeHandler._appendUnique('ResourceTargettedAlertCount', 'Total resource targeted alerts');
localeHandler._appendUnique('InvestigateAlerts', 'Investigate Alerts');
localeHandler._appendUnique('AlertSeverity0', 'Sev 0');
localeHandler._appendUnique('AlertSeverity1', 'Sev 1');
localeHandler._appendUnique('AlertSeverity2', 'Sev 2');
localeHandler._appendUnique('AlertSeverity3', 'Sev 3');
localeHandler._appendUnique('AlertSeverity4', 'Sev 4');
localeHandler._appendUnique('AlertSummaryInfo', 'This list includes all the resource centric alerts as well as workspace alerts that were fired for this resource. Visit {0} to learn more.')
localeHandler._appendUnique('AlertSummaryResourceErrorMessage', 'Only alerts with signal type = Logs are displayed. To see Metric alerts you need the Monitoring Reader role on the VM.')
localeHandler._appendUnique('AlertSummaryLogsErrorMessage', 'Only alerts with signal type = Resource are displayed.')
localeHandler._appendUnique('AlertSummaryErrorMessage', 'Unable to retrieve alerts for this resource')

//Connection Summary Grid
localeHandler._appendUnique('ConnectionSummaryTableTitle', 'Connections')
localeHandler._appendUnique('ConnectionType', 'Type')
localeHandler._appendUnique('ConnectionFailed', 'Failed')
localeHandler._appendUnique('ConnectionLive', 'Max Live')
localeHandler._appendUnique('ConnectionMalicious', 'Malicious')
localeHandler._appendUnique('ConnectionEstablished', 'Established')
localeHandler._appendUnique('ConnectionTerminated', 'Terminated')
localeHandler._appendUnique('ConnectionViewAll', 'View All')
localeHandler._appendUnique('ConnectionCount', 'Count')
localeHandler._appendUnique('ConnectionFailedInfoText', 'Total failed connections for the VM in the given time range.')
localeHandler._appendUnique('ConnectionLiveInfoText', 'Max live connections within a minute in the given time range.')
localeHandler._appendUnique('ConnectionMaliciousInfoText', 'Total connections established with likely malicious IPs.')
localeHandler._appendUnique('ConnectionEstablishedInfoText', 'Total established connections in the given time range')
localeHandler._appendUnique('ConnectionTerminatedInfoText', 'Total terminated connections in the given time range.')

localeHandler._appendUnique('DisplayName', 'Display Name');
localeHandler._appendUnique('MachineNotMonitored', 'Machine details unavailable');
localeHandler._appendUnique('UnmonitoredMachineMessage', 'To see more information about your virtual machine please install the Microsoft Dependency agent');
localeHandler._appendUnique('TryOnboardDependcyAgentMessage', 'Get more visibility into the health, performance and network dependencies of your virtual machines.');
localeHandler._appendUnique('TryNow', 'Try now');
localeHandler._appendUnique('LearnMoreInstall', 'Learn more');
localeHandler._appendUnique('ForumsLinkText', 'Forums');
localeHandler._appendUnique('ExecutableName', 'Executable Name');
localeHandler._appendUnique('Description', 'Description');
localeHandler._appendUnique('Username', 'Username');
localeHandler._appendUnique('CompanyName', 'Company Name');
localeHandler._appendUnique('ProductName', 'Product Name');
localeHandler._appendUnique('ProductVersion', 'Product Version');
localeHandler._appendUnique('StartTime', 'Start Time');
localeHandler._appendUnique('CommandLine', 'Command Line');
localeHandler._appendUnique('WorkingDirectory', 'Working Directory');
localeHandler._appendUnique('UserDomain', 'User Domain');

localeHandler._appendUnique('QueryStartTime', 'Query Execution Start');
localeHandler._appendUnique('QueryEndTime', 'Query Execution End');
localeHandler._appendUnique('AlertQuery', 'Alert Query');
localeHandler._appendUnique('ThresholdOperator', 'Threshold Operator');
localeHandler._appendUnique('ThresholdValue', 'ThresholdValue');
localeHandler._appendUnique('MachineAlerts', 'Machine Alerts');
localeHandler._appendUnique('ShowInLogSearch', 'Show in Log Search');
localeHandler._appendUnique('Critical', 'CRITICAL');
localeHandler._appendUnique('Warning', 'WARNING');
localeHandler._appendUnique('Informational', 'INFORMATIONAL');
localeHandler._appendUnique('Colon', ': ');

localeHandler._appendUnique('GaFaq', 'GA FAQ')

localeHandler._appendUnique('MachineProperties', 'Machine properties');

localeHandler._appendUnique('ProcessWithInboundConnections', 'Process/Port with inbound connections');
localeHandler._appendUnique('Processes', 'Processes');
localeHandler._appendUnique('ServerGroupDescription', 'A server group contains a set of unmonitored machines grouped by a common port number.');
localeHandler._appendUnique('ClientGroupExplanation', 'A client group contains unmonitored IP addresses connecting to a machine or process.');
localeHandler._appendUnique('ServerGroupDescriptionV3', 'A server group contains a set of machines grouped by a common port number.');
localeHandler._appendUnique('ClientGroupExplanationV3', 'A client group contains a set of machines connecting to a machine or process.');
localeHandler._appendUnique('GroupAsSingleNodeExplanation', 'A group contains a set of machines which are monitored by dependency agent.');

localeHandler._appendUnique('IPAddress', 'IP Address (DNS Name)');
localeHandler._appendUnique('IPAddressDNSName', '{0} ({1})');
localeHandler._appendUnique('IPAddressAndPortNumber', 'IP Address (Port Number)');
localeHandler._appendUnique('Totals', 'Totals');
localeHandler._appendUnique('monitoredClient', 'monitored clients');
localeHandler._appendUnique('monitoredServer', 'monitored servers');
localeHandler._appendUnique('monitoredMachines', 'monitored machines');
localeHandler._appendUnique('machinesWithFailedConnections', 'machines with failed connections');
localeHandler._appendUnique('unmonitoredIP', 'unmonitored IP addresses');
localeHandler._appendUnique('machineName', 'Machines');
localeHandler._appendUnique('undefine', 'N/A');

localeHandler._appendUnique('failed', 'Failed');
localeHandler._appendUnique('OK', 'OK');
localeHandler._appendUnique('mixed', 'Mixed');

localeHandler._appendUnique('source', 'Source');
localeHandler._appendUnique('sourceMachineName', 'SOURCE MACHINE');
localeHandler._appendUnique('sourceProcess', 'SOURCE PROCESS');
localeHandler._appendUnique('destination', 'Destination');
localeHandler._appendUnique('destinationProcess', 'Destination Process Name');
localeHandler._appendUnique('destinationPort', 'Destination Port Name');
localeHandler._appendUnique('status', 'STATUS');

localeHandler._appendUnique('PropertyPanel', 'Property Panel');
localeHandler._appendUnique('CollapsePropertyPanel', 'Collapse Property Panel');
localeHandler._appendUnique('ExpandPropertyPanel', 'Expand Property Panel');

localeHandler._appendUnique('MachineSubTitle', 'Machine Summary');
localeHandler._appendUnique('MachineLogEvents', 'Machine Log Events');
localeHandler._appendUnique('ProcessSubTitle', 'Process Summary');
localeHandler._appendUnique('ProcessGroupSubTitle', 'Process Group Summary');
localeHandler._appendUnique('ClientGroupSubTitle', 'Client Group Summary');
localeHandler._appendUnique('ServerGroupSubTitle', 'Server Group Summary');
localeHandler._appendUnique('VirtualGroupSubTitle', 'Group Summary');
localeHandler._appendUnique('WorkspaceSubTitle', 'Workspace Summary');
localeHandler._appendUnique('ComputerGroupSummarySubTitle', 'Computer Group Summary');

localeHandler._appendUnique('ComputeResourceSummaryGridTitle', 'Monitoring Summary');
localeHandler._appendUnique('ComputeResourceSummaryGridType', 'Type');
localeHandler._appendUnique('ComputeResourceSummaryGridMonitored', 'Monitored');
localeHandler._appendUnique('ComputeResourceSummaryGridUnmonitored', 'Unmonitored');
localeHandler._appendUnique('ComputeResourceSummaryGridVirtualMachines', 'Virtual Machines');
localeHandler._appendUnique('ComputeResourceSummaryGridVmss', 'VM Scale Sets');

localeHandler._appendUnique('ConnectionSummaryGridTitle', 'Connection Summary');
localeHandler._appendUnique('ConnectionSummaryGridType', 'Type');
localeHandler._appendUnique('ConnectionSummaryGridCount', 'Count');
localeHandler._appendUnique('ConnectionSummaryGridFailed', 'Failed');
localeHandler._appendUnique('ConnectionSummaryGridLive', 'Live');
localeHandler._appendUnique('ConnectionSummaryGridEstablished', 'Established');
localeHandler._appendUnique('ConnectionSummaryGridTerminated', 'Terminated');
localeHandler._appendUnique('ConnectionSummaryGridButton', 'View Connection Overview');

localeHandler._appendUnique('MonitoringSummaryGridTitle', 'Monitoring summary');
localeHandler._appendUnique('AzureVmMachines', 'Azure virtual machines');
localeHandler._appendUnique('AzureVmssInstances', 'Azure VMSS instances');
localeHandler._appendUnique('OtherMachines', 'Other machines');
localeHandler._appendUnique('OtherMachinesInfoBubble', 'Non-azure machines that are monitored.');
localeHandler._appendUnique('TotalCount', 'Total');

localeHandler._appendUnique('OsSummaryGridTitle', 'OS summary');
localeHandler._appendUnique('Linux', 'Linux');
localeHandler._appendUnique('Windows', 'Windows');

localeHandler._appendUnique('Dependency', 'Machine dependencies');
localeHandler._appendUnique('ConnectedServer', 'Connected Server');
localeHandler._appendUnique('ConnectedServers', 'Connected Servers');
localeHandler._appendUnique('ConnectedClient', 'Connected Client');
localeHandler._appendUnique('ConnectedClients', 'Connected Clients');
localeHandler._appendUnique('QuickLinks', 'Quick links');

localeHandler._appendUnique('TCPConnections', 'TCP Connections');
localeHandler._appendUnique('TCPInbound', 'Inbound Connection');
localeHandler._appendUnique('TCPInbounds', 'Inbound Connections');
localeHandler._appendUnique('TCPOutbound', 'Outbound Connection');
localeHandler._appendUnique('TCPOutbounds', 'Outbound Connections');
localeHandler._appendUnique('TCPFailed', 'Failed Connection');
localeHandler._appendUnique('TCPFaileds', 'Failed Connections');

localeHandler._appendUnique('Name', 'Name');
localeHandler._appendUnique('SubscriptionId', 'Subscription ID');
localeHandler._appendUnique('ResourceGroup', 'Resource Group');
localeHandler._appendUnique('Location', 'Location');
localeHandler._appendUnique('Size', 'Size');
localeHandler._appendUnique('ResourceId', 'Resource ID');
localeHandler._appendUnique('VMId', 'VM ID');
localeHandler._appendUnique('ImagePublisher', 'Image Pulisher');
localeHandler._appendUnique('ImageSku', 'Image Sku');
localeHandler._appendUnique('ImageVersion', 'Image Version');
localeHandler._appendUnique('UpdateDomain', 'Update Domain');
localeHandler._appendUnique('FaultDomain', 'Fault Domain');

localeHandler._appendUnique('InstanceId', 'Instance ID');
localeHandler._appendUnique('DeploymentId', 'Deployment ID');

localeHandler._appendUnique('Role', 'Role');
localeHandler._appendUnique('RoleType', 'Role Type');
localeHandler._appendUnique('Worker', 'Worker');
localeHandler._appendUnique('Web', 'Web');

localeHandler._appendUnique('AzureVmProperty', 'Azure VM properties');
localeHandler._appendUnique('AzureScaleSetProperties', 'Azure Scale Set properties');
localeHandler._appendUnique('CloudServiceProperties', 'Cloud Service properties');
localeHandler._appendUnique('ArcVmProperties', 'Azure Arc properties');

localeHandler._appendUnique('CPUs', 'CPUs');
localeHandler._appendUnique('CPUBody', '{0} @ {1} MHz');

localeHandler._appendUnique('PhysicalMemory', 'Physcial Memory');
localeHandler._appendUnique('MemoryBody', '{0} MB');

localeHandler._appendUnique('Virtualization', 'Virtualization State');
localeHandler._appendUnique('VMType', 'VM Type');

localeHandler._appendUnique('OMSAgent', 'Log Analytics Agent ID');
localeHandler._appendUnique('AgentId', 'Dependency Agent Id');
localeHandler._appendUnique('AgentVersion', 'Dependency Agent Version');

localeHandler._appendUnique('UpdateDaMessage', 'Version 9.9.1 of the agent is available. Click the Update link to learn more about on how to download and install the new agent version.');
localeHandler._appendUnique('UpdateDaUri', 'https://docs.microsoft.com/azure/azure-monitor/insights/vminsights-enable-hybrid-cloud');
localeHandler._appendUnique('Update', 'Update');
localeHandler._appendUnique('LatestDaVersion', '9.9.1');

localeHandler._appendUnique('LastBootTime', 'Last Boot Time')

localeHandler._appendUnique('ContainerOnboardingLearnMoreAboutMonitoringLinkText', 'Learn more');
localeHandler._appendUnique('ContainerGoToResourceGroupInsights', 'Monitor resource group');

localeHandler._appendUnique('ContainerTroubleshootingLinkText', 'Troubleshoot...');
localeHandler._appendUnique('TroubleshootingLinkText', 'Troubleshoot...');

localeHandler._appendUnique('DateTimeRangeApply', 'Apply');
localeHandler._appendUnique('DateTimeRangeCancel', 'Cancel');
localeHandler._appendUnique('DateTimeRangeTimeRange', DisplayStrings.TimeRangeSelectorTitle);
localeHandler._appendUnique('DateTimeRangeLastMinutes', 'Last {0} minutes');
localeHandler._appendUnique('DateTimeRangeLastHour', 'Last hour');
localeHandler._appendUnique('DateTimeRangeLastHours', 'Last {0} hours');
localeHandler._appendUnique('DateTimeRangeLastDays', 'Last {0} days');
localeHandler._appendUnique('DateTimeRangeCustom', 'Custom');
localeHandler._appendUnique('DateTimeRangeTimeGranularity', 'Time granularity');
localeHandler._appendUnique('DateTimeRangeAutomatic', 'Automatic');
localeHandler._appendUnique('DateTimeRangeOneMinute', '1 minute');
localeHandler._appendUnique('DateTimeRangeFiveMinutes', '5 minutes');
localeHandler._appendUnique('DateTimeRangeFifteenMinutes', '15 minutes');
localeHandler._appendUnique('DateTimeRangeThirtyMinutes', '30 minutes');
localeHandler._appendUnique('DateTimeRangeMinutes', '{0} minutes');
localeHandler._appendUnique('DateTimeRangeOneHour', '1 hour');
localeHandler._appendUnique('DateTimeRangeTwoHours', '2 hours');
localeHandler._appendUnique('DateTimeRangeFourHours', '4 hours');
localeHandler._appendUnique('DateTimeRangeEightHours', '8 hours');
localeHandler._appendUnique('DateTimeRangeTwelveHours', '12 hours');
localeHandler._appendUnique('DateTimeRangeHours', DisplayStrings.ContainerUpTimeHoursTitlePlural);
localeHandler._appendUnique('DateTimeRangeOneDay', '1 day');
localeHandler._appendUnique('DateTimeRangeOneWeek', '1 week');
localeHandler._appendUnique('DateTimeRangeOneMonth', '1 month');
localeHandler._appendUnique('DateTimeRangeShowTimeAs', 'Show time as');
localeHandler._appendUnique('DateTimeRangeUTCGMT', 'UTC/GMT');
localeHandler._appendUnique('DateTimeRangeLocal', 'Local');
localeHandler._appendUnique('DateTimeRangeStartTime', DisplayStrings.StartTime);
localeHandler._appendUnique('DateTimeRangeEndTime', 'End Time');
localeHandler._appendUnique('DateTimeRangeValidateStartTimeBeforeEndTime', 'Start time must be before end time');
localeHandler._appendUnique('DateTimeRangeValidateStartTimeBeforeNow', 'Start time must be in the past');
localeHandler._appendUnique('DateTimeRangeValidateWithinOneHour', 'The end time must be within one hour of the start time');
localeHandler._appendUnique('DateTimeRangeValidateWithinOneMonth', 'The duration must be within 30 days');
localeHandler._appendUnique('DateTimeRangeValidateWithinThreeMonths', 'The duration must be within 90 days');

localeHandler._appendUnique('DateTimeRangeShortOneMinute', '1m');
localeHandler._appendUnique('DateTimeRangeShortFiveMinutes', '5m');
localeHandler._appendUnique('DateTimeRangeShortFifteenMinutes', '15m');
localeHandler._appendUnique('DateTimeRangeShortThirtyMinutes', '30m');
localeHandler._appendUnique('DateTimeRangeShortOneHour', '1h');
localeHandler._appendUnique('DateTimeRangeShortTwoHours', '2h');
localeHandler._appendUnique('DateTimeRangeShortFourHours', '4h');
localeHandler._appendUnique('DateTimeRangeShortEightHours', '8h');
localeHandler._appendUnique('DateTimeRangeShortTwelveHours', '12h');
localeHandler._appendUnique('DateTimeRangeShortOneDay', '1d');

// Property Panel
localeHandler._appendUnique('PropertyPanelEmptyPropertyString', '-');
localeHandler._appendUnique('PropertyPanelUnknownValueString', 'unknown');

// Container Property Panel
localeHandler._appendUnique('ContainerPropertyPanelContainerName', 'Container Name');
localeHandler._appendUnique('ContainerPropertyPanelContainerID', 'Container ID');
localeHandler._appendUnique('ContainerPropertyPanelContainerStatus', 'Container Status');
localeHandler._appendUnique('ContainerPropertyPanelContainerStatusReason', 'Container Status Reason');
localeHandler._appendUnique('ContainerPropertyPanelImage', 'Image');
localeHandler._appendUnique('ContainerPropertyPanelImageTag', 'Image Tag');
localeHandler._appendUnique('ContainerPropertyPanelContainerCreationTimeStamp', 'Container Creation Time Stamp');
localeHandler._appendUnique('ContainerPropertyPanelStartedTime', 'Start Time');
localeHandler._appendUnique('ContainerPropertyPanelFinishedTime', 'Finish Time');
localeHandler._appendUnique('ContainerPropertyPanelCPURequest', 'CPU Request');
localeHandler._appendUnique('ContainerPropertyPanelCPULimit', 'CPU Limit');
localeHandler._appendUnique('ContainerPropertyPanelMemoryRequest', 'Memory Request');
localeHandler._appendUnique('ContainerPropertyPanelMemoryLimit', 'Memory Limit');
localeHandler._appendUnique('ContainerPropertyPanelEnvironmentVar', 'Environment Variables');
localeHandler._appendUnique('ContainerPropertyPanelEnviromentVarExpandableSectionTitle', 'Environment Variables');
localeHandler._appendUnique('ContainerPropertyPanelHeaderSubtitle', 'Container');
localeHandler._appendUnique('ContainerPropertyPanelEnvVarTableEnvVarColHeader', 'Enviroment Variables');
localeHandler._appendUnique('ContainerPropertyPanelEnvVarTableValueColHeader', 'Value');

// Pod Property Panel
localeHandler._appendUnique('PodPropertyPanelContainerCPUTableTitle', 'CPU');
localeHandler._appendUnique('PodPropertyPanelContainerCPUTableNameColHeader', 'Name');
localeHandler._appendUnique('PodPropertyPanelContainerCPUTableLimitColHeader', 'Limit');
localeHandler._appendUnique('PodPropertyPanelContainerCPUTableRequestColHeader', 'Request');
localeHandler._appendUnique('PodPropertyPanelContainerMemoryTableTitle', 'Memory');
localeHandler._appendUnique('PodPropertyPanelContainerMemoryTableNameColHeader', 'Name');
localeHandler._appendUnique('PodPropertyPanelContainerMemoryTableLimitColHeader', 'Limit');
localeHandler._appendUnique('PodPropertyPanelContainerMemoryTableRequestColHeader', 'Request');
localeHandler._appendUnique('PodPropertyPanelHeaderSubtitle', 'Pod');
localeHandler._appendUnique('PodPropertyPanelLabelsExpandableSectionTitle', 'Labels');
localeHandler._appendUnique('PodPropertyPanelConatinerPerfExpandableSectionTitle', 'Container Limits and Requests');
localeHandler._appendUnique('PodPropertyPanelPodName', 'Pod Name');
localeHandler._appendUnique('PodPropertyPanelPodStatus', 'Pod Status');
localeHandler._appendUnique('PodPropertyPanelControllerName', 'Controller Name');
localeHandler._appendUnique('PodPropertyPanelControllerKind', 'Controller Kind');
localeHandler._appendUnique('PodPropertyPanelPodLabel', 'Pod Label');
localeHandler._appendUnique('PodPropertyPanelPodCreationTimeStamp', 'Pod Creation Time Stamp');
localeHandler._appendUnique('PodPropertyPanelPodStartTimestamp', 'Pod Start Timestamp');
localeHandler._appendUnique('PodPropertyPanelPodUid', 'Pod Uid');
localeHandler._appendUnique('PodPropertyPanelNodeIP', 'Node IP');
localeHandler._appendUnique('PodPropertyPanelContainerName', 'Container Name');
localeHandler._appendUnique('PodPropertyPanelCPULimit', 'CPU Limit');
localeHandler._appendUnique('PodPropertyPanelCPURequest', 'CPU Request');
localeHandler._appendUnique('PodPropertyPanelMemoryLimit', 'Memory Limit');
localeHandler._appendUnique('PodPropertyPanelMemoryRequest', 'Memory Request');

// Controller Property Panel
localeHandler._appendUnique('ControllerPropertyPanelHeaderSubtitle', 'Controller');
localeHandler._appendUnique('ControllerPropertyPanelControllerName', 'Controller Name');
localeHandler._appendUnique('ControllerPropertyPanelNamespace', 'Namespace');
localeHandler._appendUnique('ControllerPropertyPanelControllerKind', 'Controller Kind');
localeHandler._appendUnique('ControllerPropertyPanelPodCount', 'Pod Count');
localeHandler._appendUnique('ControllerPropertyPanelContainerCount', 'Container Count');
localeHandler._appendUnique('ControllerPropertyPanelServiceName', 'Service Name');

// Node Property Panel
localeHandler._appendUnique('NodePropertyPanelDiskTableTitle', '');
localeHandler._appendUnique('NodePropertyPanelDiskMetricsExpandableSectionTitle', 'Local Disk Capacity');
localeHandler._appendUnique('NodePropertyPanelDiskTableDeviceColHeader', 'Device');
localeHandler._appendUnique('NodePropertyPanelDiskTablePathColHeader', 'Path');
localeHandler._appendUnique('NodePropertyPanelDiskTableUsedPercentColHeader', 'Used %');
localeHandler._appendUnique('NodePropertyPanelDiskTableUsedColHeader', 'Used');
localeHandler._appendUnique('NodePropertyPanelDiskTableFreeColHeader', 'Free');
localeHandler._appendUnique('NodePropertyPanelNodeName', 'Node Name');
localeHandler._appendUnique('NodePropertyPanelStatus', 'Status');
localeHandler._appendUnique('NodePropertyPanelClusterName', 'Cluster Name');
localeHandler._appendUnique('NodePropertyPanelKubeletVersion', 'Kubelet Version');
localeHandler._appendUnique('NodePropertyPanelKubeProxyVersion', 'Kube Proxy Version');
localeHandler._appendUnique('NodePropertyPanelDockerVersion', 'Docker Version');
localeHandler._appendUnique('NodePropertyPanelOperatingSystem', 'Operating System');
localeHandler._appendUnique('NodePropertyPanelNodeIP', 'Node IP');
localeHandler._appendUnique('NodePropertyPanelLabels', 'Labels');
localeHandler._appendUnique('NodePropertyPanelComputerEnvironment', 'Computer Environment');
localeHandler._appendUnique('NodePropertyPanelAgentImage', 'Agent Image');
localeHandler._appendUnique('NodePropertyPanelAgentImageTag', 'Agent Image Tag');
localeHandler._appendUnique('NodePropertyPanelLabelsExpandableSectionTitle', 'Labels');
localeHandler._appendUnique('NodePropertyPanelHeaderSubtitle', 'Node');

// Alternative Property Panel Content
localeHandler._appendUnique('PropertyPanelErrorMessage', '');
localeHandler._appendUnique('PropertyPanelRowUnsupportedMessage', 'Property panel is not supported for the selected row');

// Property Panel Link Text
localeHandler._appendUnique('PropertyPanelContainerLogsLinkText', 'View container logs');
localeHandler._appendUnique('PropertyPanelContainerLiveLogsLinkText', 'View container live logs (preview)');
localeHandler._appendUnique('PropertyPanelLiveLinkText', 'View live data (preview)');
localeHandler._appendUnique('PropertyPanelKubEventLogsLinkText', 'View Kubernetes event logs');
localeHandler._appendUnique('PropertyPanelAnalyticsLinkText', 'View in analytics');

// Single VM Performance
localeHandler._appendUnique('DiskPerf', 'Logical Disk Performance');
localeHandler._appendUnique('Disk', 'DISK');
localeHandler._appendUnique('SizeGb', 'CURRENT SIZE (GB)');
localeHandler._appendUnique('UsedPercent', 'CURRENT USED (%)');
localeHandler._appendUnique('IOPSRead', 'P95 IOPs READ');
localeHandler._appendUnique('IOPSWrite', 'P95 IOPs WRITE');
localeHandler._appendUnique('IOPSTotal', 'P95 IOPs TOTAL');
localeHandler._appendUnique('MBSRead', 'P95 MB/s READ');
localeHandler._appendUnique('MBSWrite', 'P95 MB/s WRITE');
localeHandler._appendUnique('MBSTotal', 'P95 MB/s TOTAL');
localeHandler._appendUnique('LatencyRead', 'P95 LATENCY READ (ms)');
localeHandler._appendUnique('LatencyWrite', 'P95 LATENCY WRITE (ms)');
localeHandler._appendUnique('LatencyTotal', 'P95 LATENCY TOTAL (ms)');

// Live Console
localeHandler._appendUnique('PodName', 'Pod name: ');
localeHandler._appendUnique('ContainerName', 'Container name: ');
localeHandler._appendUnique('Scroll', 'Scroll');
localeHandler._appendUnique('Play', 'Play');
localeHandler._appendUnique('Pause', 'Pause');
localeHandler._appendUnique('Clear', 'Clear');

//Live data fetch status
localeHandler._appendUnique('LastFetchStatus', 'Fetch status: ');
localeHandler._appendUnique('ReasonJustUnPaused', 'Console was just un-paused.');
localeHandler._appendUnique('LiveConsoleHeaderLiveMetricText', 'Live Metrics');
localeHandler._appendUnique('ReasonPaused', 'Console is paused.');
localeHandler._appendUnique('ReasonCleared', 'Console was cleared');
localeHandler._appendUnique('ReasonClosed', 'Console was closed.');
localeHandler._appendUnique('ReasonNoNewLogs', 'No new logs.');
localeHandler._appendUnique('ReasonUnsuccessfulMerge', 'There was an unsuccessful merge when receiving new log items.');
localeHandler._appendUnique('ReasonNewLines', ' new lines.');
localeHandler._appendUnique('ReasonNewConsole', 'New console view panel.');

localeHandler._appendUnique('LiveConsoleHeaderLogsText', 'Logs');
localeHandler._appendUnique('LiveConsoleHeaderEventsText', 'Events');
localeHandler._appendUnique('LiveLogsShowErrors', 'Show errors');
localeHandler._appendUnique('LiveLogsHideErrors', 'Hide errors');
localeHandler._appendUnique('LiveLogsReasonNoNewLogs', 'No New Data');
localeHandler._appendUnique('LiveLogsReasonPasued', 'Paused');
localeHandler._appendUnique('LiveLogsRunning', 'Running');
localeHandler._appendUnique('LiveLogsNAdditionalLogs', '{0} New Logs');
localeHandler._appendUnique('LiveLogsNEventsFound', '{0} Event(s) found');
localeHandler._appendUnique('LiveLogsQueryFailed', 'Error');
localeHandler._appendUnique('LiveLogsStarting', 'Loading');
localeHandler._appendUnique('LiveLogsMissedMessages', '===========PLEASE NOTE THAT THERE MAY BE MISSING DATA HERE.===========');
localeHandler._appendUnique('LiveLogsTroubleshootRBAC', 'Setup RBAC on AKS');

// SVG tooltips
localeHandler._appendUnique('VirtualMachine', 'Virtual machine');
localeHandler._appendUnique('VirtualMachineScaleSet', 'Virtual machine scale set');
localeHandler._appendUnique('AzureCloudService', 'Cloud service (classic)');
localeHandler._appendUnique('VirtualNodeSVGTooltip', 'Virtual Node');
localeHandler._appendUnique('VirtualPodSVGTooltip', 'Pod');
localeHandler._appendUnique('VirtualContainerSVGTooltip', 'Container');
localeHandler._appendUnique('ColumnsSvg', 'List View');
localeHandler._appendUnique('AlertSvg', 'Create Alert Rule');
localeHandler._appendUnique('PinSvg', 'Pin to dashboard');

/** Refresh Button */
localeHandler._appendUnique('Refresh', 'Refresh');

/** Navigate to Multicluster button */
localeHandler._appendUnique('MulticlusterButton', 'View All Clusters');

localeHandler._appendUnique('Close', 'Close');

// Workbooks
localeHandler._appendUnique('WorkbooksName', 'Workbooks');
localeHandler._appendUnique('WorkbooksChartButtonTooltip', 'See more metrics in Workbooks');
localeHandler._appendUnique('ViewWorkbooks', 'View Workbooks');
localeHandler._appendUnique('ViewWorkbooksTooltip', 'Workbooks are customizable reports for your VM');
localeHandler._appendUnique('NetworkWorkbookCategory', 'Network')

localeHandler._appendUnique('PerformanceAnalysis', 'Performance');
localeHandler._appendUnique('ConnectionsOverview', 'Connections');
localeHandler._appendUnique('MetricAnalysisForSingleVm', 'Metrics for a Single VM');
localeHandler._appendUnique('SecurityAndAudit', 'Security and Audit');
localeHandler._appendUnique('TcpTraffic', 'TCP Traffic');
localeHandler._appendUnique('FailedConnections', 'Failed Connections');
localeHandler._appendUnique('PerformanceCounters', 'Performance Counters');
localeHandler._appendUnique('TrafficComparison', 'Traffic Comparison');
localeHandler._appendUnique('ActivePorts', 'Active Ports');
localeHandler._appendUnique('OpenPorts', 'Open Ports');

// Container Insights Workbooks 
// Workbook Names
localeHandler._appendUnique('WorkbooksAKSNodeDiskCapacity', 'Disk Capacity');
localeHandler._appendUnique('WorkbooksAKSNodeDiskIO', 'Disk IO');
localeHandler._appendUnique('WorkbooksAKSNodeKubelet', 'Kubelet');
localeHandler._appendUnique('WorkbooksAKSNodeNetwork', 'Network');
localeHandler._appendUnique('WorkbooksAKSNodeGPU', 'GPU');
localeHandler._appendUnique('WorkbooksAKSDataUsage', 'Data Usage');
localeHandler._appendUnique('WorkbooksAKSWorkloadDetails', 'Workload Details');

// Category Names
localeHandler._appendUnique('WorkbookCategoryNode', 'Node');
localeHandler._appendUnique('WorkbookCategoryBilling', 'Billing');
localeHandler._appendUnique('WorkbookCategoryWorkload', 'Workload');

// Gallery Names
localeHandler._appendUnique('AKSWorkbookGallery', 'Go To AKS Gallery');
localeHandler._appendUnique('AKSEngineWorkbookGallery', 'Go To AKS Engine Gallery');

localeHandler._appendUnique('WorkbookGallery', 'Go To Gallery');
localeHandler._appendUnique('WorkbookGallerySectionName', 'Workbooks Gallery');
localeHandler._appendUnique('WorkbookPerformanceSectionName', 'Performance Analysis');
localeHandler._appendUnique('WorkbookNetworkDependenciesSectionName', 'Network Dependencies');

// Health
localeHandler._appendUnique('Available', 'Available');
localeHandler._appendUnique('CriticalSentenceCase', 'Critical');
localeHandler._appendUnique('WarningSentenceCase', 'Warning');
localeHandler._appendUnique('Loading', 'Loading');
localeHandler._appendUnique('ViewHealthDiagnostics', 'View Health Diagnostics');
localeHandler._appendUnique('VmHealth', 'Health');
localeHandler._appendUnique('ComponentHealth', 'Component Health');

localeHandler._appendUnique('Overall', 'Overall');
localeHandler._appendUnique('Guest', 'Guest');
localeHandler._appendUnique('Resource', 'Resource');
localeHandler._appendUnique('OnboardHealth', 'Onboard Health');

localeHandler._appendUnique('CPU', 'CPU');
localeHandler._appendUnique('DiskSentenceCaps', 'Disk');
localeHandler._appendUnique('Memory', 'Memory');
localeHandler._appendUnique('Network', 'Network');
localeHandler._appendUnique('Services', 'Services');

localeHandler._appendUnique('PopupIsBlockedMsg', 'Please check that pop-ups are not being blocked. Enable and try again');
localeHandler._appendUnique('PopupIsClosedMsg', 'Please login using the popup to view live logs.');
localeHandler._appendUnique('LiveLogsTroubleshootErrorTitle', 'Troubleshoot');
localeHandler._appendUnique('LiveLogsKubeApiResponseErrorTitle', 'Kube API Response');
localeHandler._appendUnique('LiveLogsKubeApiStatusErrorTitle', 'Kube API Status');
localeHandler._appendUnique('LiveLogsProxyResponseErrorTitle', 'Proxy Response');
localeHandler._appendUnique('LiveLogsProxyStatusErrorTitle', 'Proxy Status');
localeHandler._appendUnique('LiveLogsPopupStatusErrorTitle', 'Pop-up Status');

// trend bar chart accessibility
localeHandler._appendUnique('TrendBarChartChartAriaTitle', 'Trend bar chart');
localeHandler._appendUnique('TrendBarChartChartAriaDescription', 'Use alt plus page up and alt plus page down keys to navigate the chart');
localeHandler._appendUnique('TrendBarChartEmptyChartAriaDescription', 'No data is available for the selected time range');
localeHandler._appendUnique(
     'TrendBarChartDataPointAriaDescription',
     '${val}${pval} out of ${limitval} used at ${dt}, bar ${idx} of ${cnt}'
);

localeHandler._appendUnique('TrendBarChartKeyboardTip', 'Alt-PgUp/PgDn to navigate');
localeHandler._appendUnique('TrendBarChartDataPointDescription', 'Used ${val}${pval}. Limit ${lim}');
localeHandler._appendUnique('TrendBarChartTooltipLimit', 'Limit');
localeHandler._appendUnique('TrendBarChartTooltipUsage', 'Usage');

// SVG accessibility
localeHandler._appendUnique('WindowsVMSVGTitle', 'Windows VM');
localeHandler._appendUnique('LinuxVMSVGTitle', 'Linux VM');

export const KustoGrainDisplay = {
     '1m': DisplayStrings.DateTimeRangeShortOneMinute,
     '5m': DisplayStrings.DateTimeRangeShortFiveMinutes,
     '15m': DisplayStrings.DateTimeRangeShortFifteenMinutes,
     '30m': DisplayStrings.DateTimeRangeShortThirtyMinutes,
     '1h': DisplayStrings.DateTimeRangeShortOneHour,
     '2h': DisplayStrings.DateTimeRangeShortTwoHours,
     '4h': DisplayStrings.DateTimeRangeShortFourHours,
     '8h': DisplayStrings.DateTimeRangeShortEightHours,
     '12h': DisplayStrings.DateTimeRangeShortTwelveHours,
     '1d': DisplayStrings.DateTimeRangeShortOneDay
};

export const KustoGrainDetailDisplay = {
     '1m': DisplayStrings.DateTimeRangeOneMinute,
     '5m': DisplayStrings.DateTimeRangeFiveMinutes,
     '15m': DisplayStrings.DateTimeRangeFifteenMinutes,
     '30m': DisplayStrings.DateTimeRangeThirtyMinutes,
     '1h': DisplayStrings.DateTimeRangeOneHour,
     '2h': DisplayStrings.DateTimeRangeTwoHours,
     '4h': DisplayStrings.DateTimeRangeFourHours,
     '8h': DisplayStrings.DateTimeRangeEightHours,
     '12h': DisplayStrings.DateTimeRangeTwelveHours,
     '1d': DisplayStrings.DateTimeRangeOneDay
};

// Health
// Node Condition Monitor
localeHandler._appendUnique('NodeConditionGridConditionColumnTitle', 'Condition');
localeHandler._appendUnique('NodeConditionGridConditionColumnTooltip', 'Node condition');
localeHandler._appendUnique('NodeConditionGridStatusColumnTitle', 'Status');
localeHandler._appendUnique('NodeConditionGridStatusColumnTooltip', 'Node condition status');
localeHandler._appendUnique('NodeConditionGridMessageColumnTitle', 'Message');
localeHandler._appendUnique('NodeConditionGridMessageColumnTooltip', 'Node condition status message');

// Workload Capacity Memory
localeHandler._appendUnique('WorkloadMemoryCapacityGridStatusColumnTitle', 'Status');
localeHandler._appendUnique('WorkloadMemoryCapacityGridStatusColumnTooltip', 'The status of combined workload memory requests');
localeHandler._appendUnique('WorkloadMemoryCapacityGridRequestLimitRatioColumnTooltip', 'The ratio of the workload\'s aggregrate memory requests over its aggregate memory limits');

// Workload Capacity CPU
localeHandler._appendUnique('WorkloadCpuCapacityGridStatusColumnTitle', 'Status');
localeHandler._appendUnique('WorkloadCpuCapacityGridStatusColumnTooltip', 'The status of combined workload CPU requests');
localeHandler._appendUnique('WorkloadCpuCapacityGridRequestLimitRatioColumnTooltip', 'The ratio of the workload\'s aggregrate CPU requests over its aggregate CPU limits');

// Workload Pods Ready
localeHandler._appendUnique('WorkloadPodsReadyGridTimestampColumnTitle', 'Timestamp');
localeHandler._appendUnique('WorkloadPodsReadyGridStatusColumnTitle', 'Status');
localeHandler._appendUnique('WorkloadPodsReadyGridStatusColumnTooltip', 'Workload status based on pods ready');
localeHandler._appendUnique('WorkloadPodsReadyGridPodsReadyColumnTitle', 'Pods Ready');
localeHandler._appendUnique('WorkloadPodsReadyGridPodsReadyColumnTooltip', 'The number of pods ready over the total number of pods');

// Node CPU Utilization
localeHandler._appendUnique('NodeCpuUtilGridTimestampColumnTitle', 'Timestamp');
localeHandler._appendUnique('NodeCpuUtilGridStatusColumnTitle', 'Status');
localeHandler._appendUnique('NodeCpuUtilGridStatusColumnTooltip', 'Status of node CPU utilization');
localeHandler._appendUnique('NodeCpuUtilGridCpuUsageColumnTitle', 'CPU Usage');
localeHandler._appendUnique('NodeCpuUtilGridCpuUsageColumnTooltip', 'Node CPU usage');
localeHandler._appendUnique('NodeCpuUtilGridCpuUtilColumnTitle', 'CPU Utilization %');
localeHandler._appendUnique('NodeCpuUtilGridCpuUtilColumnTooltip', 'Node CPU utilization percentage');

// Node Memory Utilization
localeHandler._appendUnique('NodeMemoryUtilGridTimestampColumnTitle', 'Timestamp');
localeHandler._appendUnique('NodeMemoryUtilGridStatusColumnTitle', 'Status');
localeHandler._appendUnique('NodeMemoryUtilGridStatusColumnTooltip', 'Status of node memory utilization');
localeHandler._appendUnique('NodeMemoryUtilGridMemoryUsageColumnTitle', 'Memory Usage');
localeHandler._appendUnique('NodeMemoryUtilGridMemoryUsageColumnTooltip', 'Node Memory Usage');
localeHandler._appendUnique('NodeMemoryUtilGridMemoryUtilColumnTitle', 'Memory Utilization %');
localeHandler._appendUnique('NodeMemoryUtilGridMemoryUtilColumnTooltip', 'Node memory utilization percentage');

// Kube API Status
localeHandler._appendUnique('KubeApiStatusGridResponseHeaderColumnTitle', 'Response Header');
localeHandler._appendUnique('KubeApiStatusGridResponseHeaderColumnTooltip', 'Response headers from the Kube API server');
localeHandler._appendUnique('KubeApiStatusGridValueColumnTitle', 'Value');
localeHandler._appendUnique('KubeApiStatusGridValueColumnTooltip', 'Values for the response header');

// Aggregate
localeHandler._appendUnique('AggregateGridMonitorColumnTitle', 'Monitor');
localeHandler._appendUnique('AggregateGridMonitorColumnTooltip', 'Child monitors composing the aggregate monitor');
localeHandler._appendUnique('AggregateGridStatusColumnTitle', 'Status');
localeHandler._appendUnique('AggregateGridStatusColumnTooltip', 'Monitor status');

// Summary Tiles
localeHandler._appendUnique('SummaryTileTotalTitle', 'Total');
localeHandler._appendUnique('SummaryTileHealthyTitle', 'Healthy');
localeHandler._appendUnique('SummaryTileCriticalTitle', 'Critical');
localeHandler._appendUnique('SummaryTileWarningTitle', 'Warning');
localeHandler._appendUnique('SummaryTileUnknownTitle', 'Unknown');

// Health Tree Expand Collapse Icons
localeHandler._appendUnique('CollapseHealthTreeNode', 'Collapse Health Tree Node');
localeHandler._appendUnique('ExpandHealthTreeNode', 'Expand Health Tree Node');

// Health Details Pane
localeHandler._appendUnique('HealthDetailsPaneOverviewTabTitle', 'Overview');
// localeHandler._appendUnique('HealthDetailsPaneDetailsTabTitle', 'Details');
localeHandler._appendUnique('HealthDetailsPaneConfigTabTitle', 'Config');
localeHandler._appendUnique('HealthDetailsPaneKnowledgeTabTitle', 'Knowledge');


// Health ARIA Labels
localeHandler._appendUnique('HealthAspectsPanelAriaLabel', 'Aspects Panel');
localeHandler._appendUnique('HealthPanelAriaLabel', 'Health Pane');
localeHandler._appendUnique('HealthAspectsPaneAspectsGridRowAriaLabelComponent', 'Open health tree pane for');
localeHandler._appendUnique('HealthTreePaneTreeNodeAriaLabel', 'Open details pane for');

// Health Aspects Panel 
localeHandler._appendUnique('CurrentState', 'Current state');
localeHandler._appendUnique('LastRecalculated', 'Last recalculated');
localeHandler._appendUnique('On', 'on');
localeHandler._appendUnique('LastStateChange', 'Last state change');
localeHandler._appendUnique('HealthAspectPaneGridHealthAspectColumnHeader', 'Health aspect');
localeHandler._appendUnique('HealthAspectPaneGridStateColumnHeader', 'State');

// Health Monitor Overview
localeHandler._appendUnique('HowItWorks', 'How it works');

// Health Monitor Config
localeHandler._appendUnique('NoConfigCurrently', 'No configuration properties are available for this monitor.');
localeHandler._appendUnique('NoConfigEver', 'This is an aggregate monitor and does not have any configurable properties.');
localeHandler._appendUnique('HealthMonitorConfigGridPropertyColumnHeader', 'Property');
localeHandler._appendUnique('HealthMonitorConfigGridPropertyColumnTooltip', 'Configurable Property');
localeHandler._appendUnique('HealthMonitorConfigGridValueColumnHeader', 'Value');
localeHandler._appendUnique('HealthMonitorConfigGridValueColumnTooltip', 'Value configured for the property');

// Health Model Visualization Definitions
localeHandler._appendUnique('ClusterMonitorStandAloneDisplayName', 'Cluster');
localeHandler._appendUnique('ClusterMonitorInContextDisplayName', 'Cluster');
localeHandler._appendUnique('ClusterMonitorDescriptionOverride', 'This monitor reports overall health status of the cluster.This monitor is an aggregate monitor and its status is calculated as the \'worst of\' its child monitor states i.e. Kubernetes infrastructure and Nodes');

localeHandler._appendUnique('NodesMonitorStandAloneDisplayName', 'Node Pools');
localeHandler._appendUnique('NodesMonitorInContextDisplayName', 'Nodes');
localeHandler._appendUnique('NodesMonitorDescriptionOverride', 'This monitor reports combined health status of all node pools in the cluster. This monitor is an aggregate monitor and its status is calculated as the \'worst of\' its child monitor states i.e nodepools');

localeHandler._appendUnique('NodePoolMonitorStandAloneDisplayName', 'Node pool ${label[agentpool]}');
localeHandler._appendUnique('NodePoolMonitorInContextDisplayName', '${label[agentpool]}');
localeHandler._appendUnique('NodePoolMonitorDescriptionOverride', 'This monitor reports combined health status of all nodes in the node pool ${label[agentpool]}. ' + `This is an aggregate monitor, whose state is the worst state of 80% of the nodes in the node pool, sorted in descending order of severity of node states i.e Fail > Warning > Pass. 

Example:  
     If your node pool has 10 nodes, with 7 of them in Pass State, 2 in Warning and 1 in Fail state, then the status of the node pool will be Warning, since that is the worst state of 80% of the nodes, when sorted in descending order of severity. 
(F, W, W, P, P, P, P, P, P, P)`);


localeHandler._appendUnique('MasterNodesMonitorStandAloneDisplayName', 'Master nodes');
localeHandler._appendUnique('MasterNodesMonitorInContextDisplayName', 'Master nodes');
localeHandler._appendUnique('MasterNodesMonitorDescriptionOverride', 'This monitor reports combined health status of all master nodes in the cluster. ' + `This is an aggregate monitor, whose state is the worst state of 80% of the nodes in the node pool, sorted in descending order of severity of node states i.e Fail > Warning > Pass. 

Example:  
     If your master node pool has 10 nodes, with 7 of them in Pass State, 2 in Warning and 1 in Fail state, then the status of the node pool will be Warning, since that is the worst state of 80% of the nodes, when sorted in descending order of severity. 
(F, W, W, P, P, P, P, P, P, P)`);

localeHandler._appendUnique('NodeMonitorStandAloneDisplayName', 'Node ${label[kubernetes.io/hostname]}');
localeHandler._appendUnique('NodeMonitorInContextDisplayName', '${label[kubernetes.io/hostname]}');
localeHandler._appendUnique('NodeMonitorDescriptionOverride', 'This monitor reports overall health status of node ${label[kubernetes.io/hostname]}. This monitor is an aggregate monitor and its status is calculated as the \'worst of\' its child monitor states i.e. Node CPU Utilization, Node Memory Utilization and Node Status as reported by Kubernetes');

localeHandler._appendUnique('NodeStatusMonitorStandAloneDisplayName', 'Node status-${label[kubernetes.io/hostname]}');
localeHandler._appendUnique('NodeStatusMonitorInContextDisplayName', 'Status');
localeHandler._appendUnique('NodeStatusMonitorDescriptionOverride', `This monitor checks node conditions reported by Kubernetes.  
Currently the following node conditions are checked: Disk Pressure, Memory Pressure, PID Pressure, Out of Disk, Network unavailable, Ready status for the node.  
Out of the above conditions, if either \'Out of Disk\' or \'Network Unavailable\' is true, the monitor flips to  \'Fail\' State.  
If anything else is true, other than the \'Ready\' condition, then the monitor flips to a \'Warning\' state  

Monitor states:  

| State | Description |
| : ----------- | : ----------- |
| * Healthy * | Node is ready and all other conditions are false |
| * Warning * | Node is ready and at least one other condition(DiskPressure/MemoryPressure/PIDPressure) is true while all critical conditions listed in monitor configuration (OutOfDisk, NetworkUnavailable)  are false |
| * Critical * | Node is not ready or at least one of the critical conditions listed in monitor configuration is true. The default critical conditions are \'OutOfDisk\' and \'NetworkUnavailable\' |
`);

localeHandler._appendUnique('NodeCpuMonitorStandAloneDisplayName', 'Node CPU utilization-${label[kubernetes.io/hostname]}');
localeHandler._appendUnique('NodeCpuMonitorInContextDisplayName', 'CPU utilization');
localeHandler._appendUnique('NodeCpuMonitorDescriptionOverride', `This monitor checks CPU utilization percentage on the node with one minute intervals.

Several consecutive samples are considered, the number of samples considered is driven by configuration parameter \'ConsecutiveSamplesForStateTransition\'  

Monitor states:

| State | Description |
| : ----------- | : ----------- |
| * Healthy * | At least one sample considered is below warning threshold (80%) provided in configuration |
| * Warning * | At least one sample considered is above warning threshold (80%) but below critical threshold(90%) while all others are above warning threshold |
| * Critical * | All samples considered are above critical threshold (90%) |
| * Unknown * | At least one sample required for calculation was not delivered by source node | `);

localeHandler._appendUnique('NodeMemoryMonitorStandAloneDisplayName', 'Node memory utilization-${label[kubernetes.io/hostname]}');
localeHandler._appendUnique('NodeMemoryMonitorInContextDisplayName', 'Memory utilization');
localeHandler._appendUnique('NodeMemoryMonitorDescriptionOverride', `This monitor checks memory utilization(RSS) percentage on the node with one minute intervals.

Several consecutive samples are considered, the number of samples considered is driven by configuration parameter \'ConsecutiveSamplesForStateTransition\'  

Monitor states:  

| State | Description |
| : ----------- | : ----------- |
| * Healthy * | At least one sample considered is below warning threshold (80%)  provided in configuration |
| * Warning * | At least one sample considered is above warning threshold (80%) but below critical threshold (90%) while all others are above warning threshold |
| * Critical * | All samples considered are above critical threshold (90%) |
| * Unknown * | At least one sample required for calculation was not delivered by source node | `);

localeHandler._appendUnique('K8sInfraMonitorStandAloneDisplayName', 'Kubernetes infrastructure');
localeHandler._appendUnique('K8sInfraMonitorInContextDisplayName', 'Kubernetes infrastructure');
localeHandler._appendUnique('K8sInfraMonitorDescriptionOverride', 'This monitor reports combined health status of the managed infrastructure components of the cluster. This monitor is an aggregate monitor and its status is calculated as the \'worst of\' its child monitor states i.e. kube-system workloads and API Server status.');

localeHandler._appendUnique('K8sApiServerMonitorStandAloneDisplayName', 'Kubernetes API server');
localeHandler._appendUnique('K8sApiServerMonitorInContextDisplayName', 'Kubernetes API server');
localeHandler._appendUnique('K8sApiServerMonitorDescriptionOverride', 'This monitor reports status of Kube Api service. Monitor is in Critical state in case Kube Api endpoint is unavailable. For this particular monitor, the state is determined by making a query to the \'nodes\' endpoint for the kube-api server. Anything other than a OK response code flips the monitor to a \'Fail\' state.');

localeHandler._appendUnique('SystemWorkloadMonitorStandAloneDisplayName', '${label[container.azm.ms/workload-name]} (${label[container.azm.ms/workload-kind]})');
localeHandler._appendUnique('SystemWorkloadMonitorInContextDisplayName', '${label[container.azm.ms/workload-name]} (${label[container.azm.ms/workload-kind]})');
localeHandler._appendUnique('SystemWorkloadMonitorDescriptionOverride', 'This monitor reports health status of ${label[container.azm.ms/workload-name]} (${label[container.azm.ms/workload-kind]}). This monitor is an aggregate monitor and its status is calculated as the \'worst of\' its child monitor states i.e. the \'Pods in ready state\' monitor and the containers in the workload.');

localeHandler._appendUnique('PodsReadyMonitorStandAloneDisplayName', 'Pods in ready state-${label[container.azm.ms/workload-name]} (${label[container.azm.ms/workload-kind]})');
localeHandler._appendUnique('PodsReadyMonitorInContextDisplayName', 'Pods in ready state');
localeHandler._appendUnique('PodsReadyMonitorDescriptionOverride', 'This monitor reports status based on percentage of pods in ready state in workload ${label[container.azm.ms/workload-name]}. This is a unit monitor, and its state will be \'Fail\' if less than 100% of the pods are in \'Ready\' state');

localeHandler._appendUnique('ClusterWorkloadsMonitorStandAloneDisplayName', 'Workload');
localeHandler._appendUnique('ClusterWorkloadsMonitorInContextDisplayName', 'Workload');
localeHandler._appendUnique('ClusterWorkloadsMonitorDescriptionOverride', 'This monitor reports combined health status of cluster workloads.');

localeHandler._appendUnique('ClusterCapacityMonitorStandAloneDisplayName', 'Capacity');
localeHandler._appendUnique('ClusterCapacityMonitorInContextDisplayName', 'Capacity');
localeHandler._appendUnique('ClusterCapacityMonitorDescriptionOverride', 'This monitor reports combined status of cluster capacity utilization.');

localeHandler._appendUnique('ClusterCpuCapacityMonitorStandAloneDisplayName', 'Combined amount of CPU requests on the cluster');
localeHandler._appendUnique('ClusterCpuCapacityMonitorInContextDisplayName', 'CPU requests');
localeHandler._appendUnique('ClusterCpuCapacityMonitorDescriptionOverride', 'This monitor reports status of workload CPU requests. Monitor is in *Critical* state in case combined amount of CPU requests across all workloads exceeds total available cluster CPU capacity.');

localeHandler._appendUnique('ClusterMemoryCapacityMonitorStandAloneDisplayName', 'Combined amount of memory requests on the cluster');
localeHandler._appendUnique('ClusterMemoryCapacityMonitorInContextDisplayName', 'Memory requests');
localeHandler._appendUnique('ClusterMemoryCapacityMonitorDescriptionOverride', 'This monitor reports status of workload memory requests. Monitor is in *Critical* state in case combined amount of memory requests across all workloads exceeds total available cluster memory capacity.');

localeHandler._appendUnique('NamespacesMonitorStandAloneDisplayName', 'Namespaces');
localeHandler._appendUnique('NamespacesMonitorInContextDisplayName', 'Namespaces');
localeHandler._appendUnique('NamespacesMonitorDescriptionOverride', 'This monitor reports combined status all workloads across all namespaces.');

localeHandler._appendUnique('NamespaceMonitorStandAloneDisplayName', 'Namespace ${label[container.azm.ms/namespace]}');
localeHandler._appendUnique('NamespaceMonitorInContextDisplayName', '${label[container.azm.ms/namespace]}');
localeHandler._appendUnique('NamespaceMonitorDescriptionOverride', 'This monitor reports combined status all workloads in ${label[container.azm.ms/namespace]} namespace.');

localeHandler._appendUnique('UserWorkloadMonitorStandAloneDisplayName', '${label[container.azm.ms/workload-name]} (${label[container.azm.ms/workload-kind]}) in ${label[container.azm.ms/namespace]} namespace');
localeHandler._appendUnique('UserWorkloadMonitorInContextDisplayName', '${label[container.azm.ms/workload-name]} (${label[container.azm.ms/workload-kind]})');
localeHandler._appendUnique('UserWorkloadMonitorDescriptionOverride', 'This monitor reports health status of ${label[container.azm.ms/workload-name]} (${label[container.azm.ms/workload-kind]}) in ${label[container.azm.ms/namespace]} namespace.');

localeHandler._appendUnique('WorkloadsPodsReadyMonitorStandAloneDisplayName', 'Pods in ready state-${label[container.azm.ms/workload-name]} (${label[container.azm.ms/workload-kind]}) in ${label[container.azm.ms/namespace]} namespace');
localeHandler._appendUnique('WorkloadsPodsReadyMonitorInContextDisplayName', 'Pods in ready state');
localeHandler._appendUnique('WorkloadsPodsReadyMonitorDescriptionOverride', 'This monitor reports status based on percentage of pods in ready state in workload ${label[container.azm.ms/workload-name]} (${label[container.azm.ms/workload-kind]}) in ${label[container.azm.ms/namespace]} namespace.');

localeHandler._appendUnique('ContainerCpuCapacityMonitorStandAloneDisplayName', 'CPU Utilization-${label[container.azm.ms/container]}');
localeHandler._appendUnique('ContainerCpuCapacityMonitorInContextDisplayName', 'CPU utilization');
localeHandler._appendUnique('ContainerCpuCapacityMonitorDescriptionOverride', `This monitor reports combined health status of the CPU utilization of the instances of the container.  

Several consecutive samples are considered, the number of samples considered is driven by configuration parameter \'ConsecutiveSamplesForStateTransition\'  

This is an aggregate monitor, and its state is calculated as the worst state of 90% of the container instances, sorted in descending order of severity of container states i.e. Fail > Warning > Pass. 
If no record is received from a container instance, then the container instance itself will be in an \'Unknown\' state, and will gain precedence in the sorting order over \'Fail\'.

Each individual container instance\'s state is calculated using the thresholds provided in the configuration. If the usage is over critical threshold (90%), then the instance is in a \'Fail\' state, if it is less than critical threshold (90%) but greater than warning threshold (80%), then \'Warning\', otherwise, it is in \'Pass\' state

Example:  
Suppose there are 5 containers, and their individual states are Fail, Warn, Pass, Pass, Pass, then the status of the container CPU monitor will be \'Fail\', since the worst state of 90% of the containers is \'Fail\' when sorted in descending order of severity. 
`);

localeHandler._appendUnique('ContainerMemoryMonitorStandAloneDisplayName', 'Memory Utilization-${label[container.azm.ms/container]}');
localeHandler._appendUnique('ContainerMemoryMonitorInContextDisplayName', 'Memory Utilization');
localeHandler._appendUnique('ContainerMemoryMonitorDescriptionOverride', `This monitor reports combined health status of the Memory utilization(RSS) of the instances of the container.

Several consecutive samples are considered, the number of samples considered is driven by configuration parameter \'ConsecutiveSamplesForStateTransition\'  

This is an aggregate monitor, and its state is calculated as the worst state of 90% of the container instances, sorted in descending order of severity of container states i.e. Fail > Warning > Pass.  
If no record is received from a container instance, then the container instance itself will be in an \'Unknown\' state, and will gain precedence in the sorting order over \'Fail\'.

Each individual container instance\'s state is calculated using the thresholds provided in the configuration. If the usage is over critical threshold (90%), then the instance is in a \'Fail\' state, if it is less than critical threshold (90%) but greater than warning threshold (80%), then \'Warning\', otherwise, it is in \'Pass\' state

Example:  
Suppose there are 5 containers, and their individual states are Fail, Warn, Pass, Pass, Pass, then the status of the container Memory monitor will be \'Fail\', since the worst state of 90% of the containers is \'Fail\' when sorted in descending order of severity. 
`);

localeHandler._appendUnique('ContainerMonitorStandAloneDisplayName', 'Container ${label[container.azm.ms/workload-name]}-${label[container.azm.ms/workload-name]} (${label[container.azm.ms/workload-kind]}) in ${label[container.azm.ms/namespace]} namespace');
localeHandler._appendUnique('ContainerMonitorInContextDisplayName', '${label[container.azm.ms/container]}');
localeHandler._appendUnique('ContainerMonitorDescriptionOverride', 'This monitor reports overall health status of container ${label[container.azm.ms/container]}. This monitor is an aggregate monitor and its status is calculated as the \'worst of\' its child monitor states i.e. Container CPU Utilization and Container Memory Utilization.');

localeHandler._appendUnique('HealthMonitorAccordionLabel', 'Health state for monitor at');

// Live Metrics Toggle Switch
localeHandler._appendUnique('LiveMetricsToggleSwitchLabel', 'Live');

// General words
localeHandler._appendUnique('Instance', 'Instance');
localeHandler._appendUnique('State', 'State');
localeHandler._appendUnique('Usage', 'Usage');

// Health Failure View
localeHandler._appendUnique('HealthErrorTitle', 'Missing health data');
localeHandler._appendUnique('HealthErrorSubtitle', 'The health feature encountered a problem due to missing or corrupt data. This can be caused by several issues related to the agent and other internal systems.  We have included some basic troubleshooting steps below.');
localeHandler._appendUnique('CheckAgentTroubleShootingStep', 'Check that the omsagent on your cluster is up to date. If you are running a non-managed Kubernetes cluster, the issue is most likely an outdated agent, given that the omsagent is not managed on non-managed Kubernetes clusters. Health is only supported by agent versions ${0}microsoft/oms:ciprod11012019${0} and later. Review the ${0}documentation${0} here for instructions on how you can upgrade the agent on your cluster.');
localeHandler._appendUnique('SeeCITroubleshootingGuide', 'For more help with troubleshooting this issue, please see our official troubleshooting guide ${0}here');

localeHandler._appendUnique('HelpDropdownLearnMore', 'Learn More');
localeHandler._appendUnique('HelpDropdownForums', 'Forums');
localeHandler._appendUnique('ViewAlerts', 'Recommended alerts');

// src\scripts\shared\live-console\ConsoleViewPanel.tsx
localeHandler._appendUnique('NextSearchMatch', 'Next search match');
localeHandler._appendUnique('PreviousSearchMatch', 'Previous search match');
localeHandler._appendUnique('ClearSearchInput', 'Clear search input');
localeHandler._appendUnique('CloseConsole', 'Close console');
