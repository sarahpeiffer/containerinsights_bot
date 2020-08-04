using Microsoft.Bot.Builder.Dialogs.Declarative.Resources;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace Microsoft.BotBuilderSamples
{
    public class NodeQueryHandler
    {
        HttpClient client;
        string nodeName;
        string token;
        string resourceId;
        string clusterId;
        string postLocation;
        string timeRange;

        public NodeQueryHandler(string nodeName, string token, string clusterId, string resourceId, string timeRange)
        {
            this.nodeName = nodeName;
            this.token = token;
            this.clusterId = clusterId;
            this.client = new HttpClient();
            client.DefaultRequestHeaders.Add("Authorization", token);
            this.resourceId = resourceId;
            this.timeRange = timeRange;
            this.postLocation = "https://management.azure.com" + resourceId + "/query?api-version=2017-10-01";

        }


        public async Task<dynamic> readyQueryAsync()
        {
            var readyQuery = "{\"query\":\"set query_take_max_records = 1; set truncationmaxsize = 67108864;let endDateTime = now();let startDateTime = ago(1h);let trendBinSize = 1m; KubeNodeInventory | where Computer == \\\"" + nodeName + "\\\" | summarize arg_max(TimeGenerated, 1h, Status)\",\"workspaceFilters\":{\"regions\":[]}}";
            var readyContent = new StringContent(readyQuery, Encoding.UTF8, "application/json");
            var readyResponse = await client.PostAsync(postLocation, readyContent);
            var readyResponseString = await readyResponse.Content.ReadAsStringAsync();
            dynamic readyObj = JsonConvert.DeserializeObject(readyResponseString);
            return readyObj;
        }

        public async Task<dynamic> diskQueryAsync()
        {
            var diskquery = "{\"query\":\"set query_take_max_records = 1; set truncationmaxsize = 67108864;let endDateTime = now();let startDateTime = ago(" + timeRange + ");let trendBinSize = 1m; InsightsMetrics | where TimeGenerated >= startDateTime and TimeGenerated < endDateTime | where Computer == \\\"" + nodeName + "\\\" | where Name == \\\"used_percent\\\" and Namespace == \\\"container.azm.ms/disk\\\" | summarize avg(Val) \",\"workspaceFilters\":{\"regions\":[]}}";
            var diskcontent = new StringContent(diskquery, Encoding.UTF8, "application/json");
            var diskResponse = await client.PostAsync(postLocation, diskcontent);
            var diskResponseString = await diskResponse.Content.ReadAsStringAsync();
            dynamic diskobj = JsonConvert.DeserializeObject(diskResponseString);
            return diskobj;
        }

        public async Task<dynamic> cpuQueryAsync()
        {
            var cpuquery = "{\"query\":\"set query_take_max_records = 10001; set truncationmaxsize = 67108864; let endDateTime = now(); let startDateTime = ago(" + timeRange + "); let trendBinSize = 1m; let capacityCounterName = \'cpuAllocatableNanoCores\';let usageCounterName = \'cpuUsageNanoCores\'; Perf | where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | where ObjectName == \'K8SNode\' | where Computer == \\\"" + nodeName + "\\\" | where CounterName == capacityCounterName | summarize LimitValue = max(CounterValue) by Computer, CounterName, bin(TimeGenerated, trendBinSize) | project Computer, CapacityStartTime = TimeGenerated, CapacityEndTime = TimeGenerated + trendBinSize, LimitValue | join kind=inner hint.strategy=shuffle (Perf | where TimeGenerated < endDateTime + trendBinSize | where TimeGenerated >= startDateTime - trendBinSize | where ObjectName == \'K8SNode\' | where CounterName == usageCounterName | project Computer, UsageValue = CounterValue, TimeGenerated) on Computer | where TimeGenerated >= CapacityStartTime and TimeGenerated < CapacityEndTime | project Computer, TimeGenerated, UsagePercent = UsageValue * 100.0 / LimitValue | summarize AggregatedValue = avg(UsagePercent), max(UsagePercent)\",\"workspaceFilters\":{ \"regions\":[]}}";
            var cpucontent = new StringContent(cpuquery, Encoding.UTF8, "application/json");
            var cpuResponse = await client.PostAsync(postLocation, cpucontent);
            var cpuResponseString = await cpuResponse.Content.ReadAsStringAsync();
            dynamic cpuobj = JsonConvert.DeserializeObject(cpuResponseString);
            return cpuobj;
        }

        public async Task<dynamic> memoryQueryAsync()
        {
            var memoryquery = "{\"query\":\"set query_take_max_records = 10001; set truncationmaxsize = 67108864; let endDateTime = now(); let startDateTime = ago(" + timeRange + "); let trendBinSize = 1m; let capacityCounterName = \'memoryCapacityBytes\';let usageCounterName = \'memoryRssBytes\'; Perf | where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | where ObjectName == \'K8SNode\' | where Computer == \\\"" + nodeName + "\\\" | where CounterName == capacityCounterName | summarize LimitValue = max(CounterValue) by Computer, CounterName, bin(TimeGenerated, trendBinSize) | project Computer, CapacityStartTime = TimeGenerated, CapacityEndTime = TimeGenerated + trendBinSize, LimitValue | join kind=inner hint.strategy=shuffle (Perf | where TimeGenerated < endDateTime + trendBinSize | where TimeGenerated >= startDateTime - trendBinSize | where ObjectName == \'K8SNode\' | where CounterName == usageCounterName | project Computer, UsageValue = CounterValue, TimeGenerated) on Computer | where TimeGenerated >= CapacityStartTime and TimeGenerated < CapacityEndTime | project Computer, TimeGenerated, UsagePercent = UsageValue * 100.0 / LimitValue | summarize AggregatedValue = avg(UsagePercent)\",\"workspaceFilters\":{ \"regions\":[]}}";
            var memoryContent = new StringContent(memoryquery, Encoding.UTF8, "application/json");
            var memoryResponse = await client.PostAsync(postLocation, memoryContent);
            var memoryResponseString = await memoryResponse.Content.ReadAsStringAsync();
            dynamic memoryObj = JsonConvert.DeserializeObject(memoryResponseString);
            return memoryObj;
        }

        public async Task<string> kubeEventsQuery()
        {
            var kubeEventsQuery = "{\"query\":\"set query_take_max_records = 40; set truncationmaxsize = 67108864; let endDateTime = now(); let startDateTime = ago(" + timeRange + "); let trendBinSize = 1m; KubeEvents | where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | where Computer == \\\"" + nodeName + "\\\" | summarize count() by Reason, ObjectKind, Name | sort by count_\",\"workspaceFilters\":{ \"regions\":[]}}";
            var kubeEventContent = new StringContent(kubeEventsQuery, Encoding.UTF8, "application/json");
            var kubeEventResponse = await client.PostAsync(postLocation, kubeEventContent);
            var kubeEventResponseString = await kubeEventResponse.Content.ReadAsStringAsync();
            dynamic kubeEventObj = JsonConvert.DeserializeObject(kubeEventResponseString);
            var kubeEvents = "\"There are no recent KubeEvents related to this node\"";
            if (kubeEventObj != null)
            {
                var kubeEventData = kubeEventObj.tables[0].rows;
                if (kubeEventData.Count > 0)
                {
                    kubeEvents = "";
                    for (int i = 0; i < kubeEventData.Count; ++i)
                    {
                        string count = kubeEventData[i][2] > 1 ? "counts" : "count";
                        string verb = kubeEventData[i][2] > 1 ? "are" : "is";
                        if (kubeEvents != "")
                        {
                            kubeEvents += ", ";
                        }
                        string kubeEventString = "\"There " + verb + " " + kubeEventData[i][3] + " " + count + " of " + kubeEventData[i][0] + " for " + kubeEventData[i][1] + " " + kubeEventData[i][2] + ".\"";
                        if (kubeEventData[i][1] == "Pod")
                        {
                            kubeEventString = "\"There " + verb + " " + kubeEventData[i][3] + " " + count + " of " + kubeEventData[i][0] + " for *(" + kubeEventData[i][1] + "_" + kubeEventData[i][2] + ")*.\"";
                        }
                        kubeEvents += kubeEventString;
                    }
                }
            }
            return kubeEvents;
        }

        public async Task<string> nonReadyPods()
        {

            string nonReadyPods = "";

            var failedPodsQuery = "{\"query\":\"set query_take_max_records = 10; set truncationmaxsize = 67108864;let endDateTime = now();let startDateTime = ago(" + timeRange + ");let trendBinSize = 1m; KubePodInventory | where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | where Computer == \\\"" + nodeName + "\\\" | where PodStatus != \\\"Running\\\" | distinct Name, PodStatus | summarize count() by Computer | sort by count_ \",\"workspaceFilters\":{\"regions\":[]}}";
            var failedPodsContent = new StringContent(failedPodsQuery, Encoding.UTF8, "application/json");
            var failedPodsResponse = await client.PostAsync(postLocation, failedPodsContent);
            if (failedPodsResponse != null)
            {
                var failedPodsResponseString = await failedPodsResponse.Content.ReadAsStringAsync();
                dynamic failedPodsObj = JsonConvert.DeserializeObject(failedPodsResponseString);
                var failedPods = failedPodsObj.tables[0].rows;
                for (var i = 0; i < failedPods.Count; ++i)
                {
                    if (nonReadyPods != "")
                    {
                        nonReadyPods += ", ";
                    }
                    nonReadyPods += "\"*(pod_" + failedPods[i][0] + ")* has a " + failedPods[i][1] + " state\"";
                }
            }
            if (nonReadyPods != "")
            {
                string nonReadyJson = ", \"Not Ready Pods\" : [" + nonReadyPods + "]";
                return nonReadyJson;
            }
            else
            {
                return "";
            }

        }
            
        
    
        public async Task<dynamic> podQueryAsync()
        {
            var podQuery = "{\"query\":\"set query_take_max_records = 10001; set truncationmaxsize = 67108864; let endDateTime = now(); let startDateTime = ago(" + timeRange + "); let trendBinSize = 1m; KubePodInventory | where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | where Computer == \\\"" + nodeName + "\\\" | distinct ClusterName, Computer, PodUid, TimeGenerated, PodStatus | summarize TotalCount = count(), PendingCount = sumif(1, PodStatus =~ \'Pending\'), RunningCount = sumif(1, PodStatus =~ \'Running\'),  SucceededCount = sumif(1, PodStatus =~ \'Succeeded\'),   FailedCount = sumif(1, PodStatus =~ \'Failed\')  by Computer, bin(TimeGenerated, trendBinSize)   | extend UnknownCount = TotalCount - PendingCount - RunningCount - SucceededCount - FailedCount   | project TimeGenerated, TotalCount, PendingCount, RunningCount, SucceededCount, FailedCount, UnknownCount  | limit 1\",\"workspaceFilters\":{ \"regions\":[]}}";
            var podContent = new StringContent(podQuery, Encoding.UTF8, "application/json");
            var podResponse = await client.PostAsync(postLocation, podContent);
            var podResponseString = await podResponse.Content.ReadAsStringAsync();
            dynamic podObj = JsonConvert.DeserializeObject(podResponseString);
            var podDataRows = podObj.tables[0].rows[0];
            var podDataColumns = podObj.tables[0].columns;

            string statusString = "";
            for (var i = 1; i < podDataColumns.Count; ++i)
            {
                if (podDataRows[i] != "0")
                {
                    if (statusString != "")
                    {
                        statusString += ", ";
                    }
                    statusString += "\"" + podDataColumns[i].name + ": " + podDataRows[i] + "\"";
                }

            }
            return statusString;
        }

        public async Task<string> clusterNodesAsync()
        {
            var clusterNodesQuery = "{\"query\":\"set query_take_max_records = 1000; set truncationmaxsize = 67108864;let endDateTime = now();let startDateTime = ago(1h);let trendBinSize = 1m; KubeNodeInventory | where ClusterId == \\\"" + clusterId + "\\\" | distinct Computer\",\"workspaceFilters\":{\"regions\":[]}}";
            var clusterNodesContent = new StringContent(clusterNodesQuery, Encoding.UTF8, "application/json");
            var clusterNodesResponse = await client.PostAsync(postLocation, clusterNodesContent);
            var clusterNodesResponseString = await clusterNodesResponse.Content.ReadAsStringAsync();
            dynamic clusterNodesJson = JsonConvert.DeserializeObject(clusterNodesResponseString);
            var clusterNodes = clusterNodesJson.tables[0].rows;
            var nodesString = "";
            for (var i = 0; i < clusterNodes.Count; ++i)
            {
                if (nodesString != "")
                {
                    nodesString += ", ";
                }
                nodesString += "\"*(node_" + clusterNodes[i][0] + ")*\"";

            }
            return nodesString;
        }

    }
}
