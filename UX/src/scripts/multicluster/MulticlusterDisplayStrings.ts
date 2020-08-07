// tslint:disable:max-line-length
import { LocaleStringsHandler, StringType } from '../shared/LocaleStringsHandler';

const localeHandler = LocaleStringsHandler.Instance().forStringType(StringType.MultiCluster);

export const DisplayStrings: StringMap<string> = localeHandler.getStrings();

localeHandler._appendUnique('DataRetrievalError', 'Error retrieving data');
localeHandler._appendUnique('ContainerTroubleshootingLinkText', 'Troubleshoot...');
localeHandler._appendUnique('NoSelectedSubscriptionsMessage', 'No selected subscription(s)');
localeHandler._appendUnique('NoDataMsgForMonitoredGrid', '0 monitored clusters in {0} selected subscription(s)');
localeHandler._appendUnique('NoDataMsgForNonMonitoredGrid', '0 unmonitored clusters in {0} selected subscription(s)');

localeHandler._appendUnique('MonitoredClustersTab', 'Monitored clusters {0}');
localeHandler._appendUnique('UnmonitoredClustersTab', 'Unmonitored clusters {0}');
localeHandler._appendUnique('MissingData', '- / -');
localeHandler._appendUnique('MulticlusterUnmonitoredGridEnableMonitoringLink', 'Enable');
localeHandler._appendUnique('ClusterOnboardingLearnMoreAboutMonitoringLinkText', 'Learn more');
localeHandler._appendUnique('ForumsLinkText', 'Forums');
/** Refresh Button */
localeHandler._appendUnique('Refresh', 'Refresh');
/** Monitored Grid */
localeHandler._appendUnique('MulticlusterMonitoredGridColumnClusterName', 'CLUSTER NAME');
localeHandler._appendUnique('MulticlusterMonitoredGridColumnClusterType', 'CLUSTER TYPE');
localeHandler._appendUnique('MulticlusterMonitoredGridColumnClusterVersion', 'VERSION');
localeHandler._appendUnique('MulticlusterMonitoredGridColumnStatus', 'STATUS');
localeHandler._appendUnique('MulticlusterMonitoredGridColumnStatusInfoText', 'The health status of an AKS cluster');
localeHandler._appendUnique('MulticlusterMonitoredGridColumnNodes', 'NODES');
localeHandler._appendUnique('MulticlusterMonitoredGridColumnNodesInfoText', 'The ratio of healthy nodes to total nodes in an AKS cluster');
localeHandler._appendUnique('MulticlusterMonitoredGridColumnUserPods', 'USER PODS');
localeHandler._appendUnique('MulticlusterMonitoredGridColumnUserPodsInfoText', 'The ratio of healthy user pods to total user pods in an AKS cluster');
localeHandler._appendUnique('MulticlusterMonitoredGridColumnSystemPods', 'SYSTEM PODS');
localeHandler._appendUnique('MulticlusterMonitoredGridColumnSystemPodsInfoText', 'The ratio of healthy system pods to total system pods in an AKS cluster');
localeHandler._appendUnique('MulticlusterMonitoredGridColumnVersionInfoText', 'Kubernetes or OpenShift (For ARO) version of the cluster');
//status info messages
localeHandler._appendUnique('Label', 'Label');
localeHandler._appendUnique('ClusterStatusSummaryTitle', 'Cluster Status Summary');
localeHandler._appendUnique('NoDataInfoText', 'No data reported to configured Log Analytics Workspace: {0} in last 30 mins');
localeHandler._appendUnique('UnknownInfoText', 'Unknown');
localeHandler._appendUnique('UnknownVersion', 'Unknown');
localeHandler._appendUnique('UnauthorizedInfoText', 'You do not have required permissions to acess the data in the reported Log Analytics workspace: {0}');
localeHandler._appendUnique('WorkspaceNotFoundInfoText', 'Reported Log Analytics Workspace: {0} doesn\'t exist');
localeHandler._appendUnique('WorkspaceDeletedOrUnAuthorizedInfoText', 'Reported Log Analytics Workspace: {0} deleted or you do not have read permission');
localeHandler._appendUnique('MisconfiguredInfoText', 'ContainerInsights solution not configured correctly on reported Log Analytics workspace: {0}');

/** Unmonitored Grid */
localeHandler._appendUnique('MulticlusterUnmonitoredGridColumnClusterName', 'CLUSTER NAME');
localeHandler._appendUnique('MulticlusterUnmonitoredGridColumnMonitoring', 'MONITORING');
localeHandler._appendUnique('MulticlusterUnmonitoredGridColumnMonitoringInfoText', 'Follow the links to enable Azure\'s monitoring solution for these AKS clusters');
localeHandler._appendUnique('MulticlusterUnmonitoredGridColumnStatus', 'STATUS');
localeHandler._appendUnique('MulticlusterUnmonitoredGridColumnStatusInfoText', 'The health status of an AKS cluster');
localeHandler._appendUnique('MulticlusterUnmonitoredGridColumnNodes', 'NODES');
localeHandler._appendUnique('MulticlusterUnmonitoredGridColumnNodesInfoText', 'The ratio of healthy nodes to total nodes in an AKS cluster');
localeHandler._appendUnique('MulticlusterUnmonitoredGridColumnUserPods', 'USER PODS');
localeHandler._appendUnique('MulticlusterUnmonitoredGridColumnUserPodsInfoText', 'The ratio of healthy user pods to total user pods in an AKS cluster');
localeHandler._appendUnique('MulticlusterUnmonitoredGridColumnSystemPods', 'SYSTEM PODS');
localeHandler._appendUnique('MulticlusterUnmonitoredGridColumnSystemPodsInfoText', 'The ratio of healthy system pods to total system pods in an AKS cluster');
localeHandler._appendUnique('ClusterTypeUnknown', 'Unknown');

/** display strings for  Health statuses */
localeHandler._appendUnique('HealthStatusCritical', 'Critical');
localeHandler._appendUnique('HealthStatusWarning', 'Warning');
localeHandler._appendUnique('HealthStatusUnAuthorized', 'Unauthorized');
localeHandler._appendUnique('HealthStatusNotFound', 'Not found');
localeHandler._appendUnique('HealthStatusMisConfigured', 'Misconfigured');
localeHandler._appendUnique('HealthStatusError', 'Error');
localeHandler._appendUnique('HealthStatusNoData', 'No data');
localeHandler._appendUnique('HealthStatusUnknown', 'Unknown');
localeHandler._appendUnique('HealthStatusHealthy', 'Healthy');
localeHandler._appendUnique('HealthStatusUnmonitored', 'Unmonitored');

/** display strings for  drop down pills */
localeHandler._appendUnique('LabelSeperator', ':');
localeHandler._appendUnique('CloudType', 'Environment');

/** display strings for  cluster type */
localeHandler._appendUnique('AKS', 'AKS');
localeHandler._appendUnique('AKSEngine', 'AKS-Engine');
localeHandler._appendUnique('AKSEngineAzStack', 'AKS-Engine, AzureStack');
localeHandler._appendUnique('ARO', 'ARO');
localeHandler._appendUnique('AROv4', 'ARO');
localeHandler._appendUnique('AzureArc', 'Azure Arc');
localeHandler._appendUnique('Kubernetes', 'Kubernetes, non-Azure');

/** display strings for  cloud  environment drop down */
localeHandler._appendUnique('Azure', 'Azure');
localeHandler._appendUnique('AzureStack', 'Azure Stack (Preview)');
localeHandler._appendUnique('NonAzure', 'Non-Azure (Preview)');
localeHandler._appendUnique('All', 'All');

/** Help Dropdown */
localeHandler._appendUnique('HelpDropdownLearnMore', 'Learn More');
localeHandler._appendUnique('HelpDropdownForums', 'Forums');

/** Getting Started Tab */
localeHandler._appendUnique('ViewMonitoredClustersCardTitle', 'View insights on monitored clusters');
localeHandler._appendUnique('ViewMonitoredClustersCardText', 'The insights experience surfaces telemetry on your monitored containers to help you identify performance anomalies and diagnose the root cause');
localeHandler._appendUnique('ViewMonitoredClustersCardSvgTitle', 'View insights about your monitored clusters');
localeHandler._appendUnique('ViewMonitoredClustersCardButtonText', 'View monitored clusters');
localeHandler._appendUnique('OnboardUnmonitoredClustersCardTitle', 'Onboard unmonitored clusters');
localeHandler._appendUnique('OnboardUnmonitoredClustersCardText', 'Leverage the power of Container Insights by easily connecting your currently unmonitored clusters');
localeHandler._appendUnique('OnboardUnmonitoredClustersCardButtonText', 'Onboard unmonitored clusters');
localeHandler._appendUnique('OnboardUnmonitoredClustersCardSvgTitle', 'Onboard your unmonitored clusters for insights');
localeHandler._appendUnique('CreateAlertsCardTitle', 'Create alert rules for monitored clusters');
localeHandler._appendUnique('CreateAlertsCardText', 'Alerts notify you of critical conditions and potentially take corrective automated actions based on triggers from metrics or logs');
localeHandler._appendUnique('CreateAlertsCardButtonText', 'Create alert rules');
localeHandler._appendUnique('CreateAlertsCardSvgTitle', 'Create alerts');
localeHandler._appendUnique('GettingStartedTabName', 'Get started');
localeHandler._appendUnique('GettingStartedHeaderTitle', 'Monitor your Kubernetes Infrastructure');
localeHandler._appendUnique('GettingStartedHeaderDescription', 'Get full stack visibility, find and fix problems, optimize your performance, and understand customer behavior all in one place.');

/** Multicluster Summary Panel */
localeHandler._appendUnique('SummaryPanelTileTotal', 'Total');
localeHandler._appendUnique('SummaryPanelTileCritical', 'Critical');
localeHandler._appendUnique('SummaryPanelTileWarning', 'Warning');
localeHandler._appendUnique('SummaryPanelTileUnknown', 'Unknown');
localeHandler._appendUnique('SummaryPanelTileHealthy', 'Healthy');
localeHandler._appendUnique('SummaryPanelTileUnmonitored', 'Unmonitored');

