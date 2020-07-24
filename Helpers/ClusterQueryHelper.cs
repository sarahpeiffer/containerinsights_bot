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
    public class ClusterQueryHandler
    {
        HttpClient client;
        string token;
        string resourceId;
        string clusterId;
        string postLocation;
        string timeRange;

        public ClusterQueryHandler(string token, string clusterId, string resourceId, string timeRange)
        {
            this.token = token;
            this.clusterId = clusterId;
            this.client = new HttpClient();
            client.DefaultRequestHeaders.Add("Authorization", token);
            this.resourceId = resourceId;
            this.timeRange = timeRange;
            this.postLocation = "https://management.azure.com" + resourceId + "/query?api-version=2017-10-01";

        }


        public async Task<string> nodeStatusAsync()
        {
            var nodeStatusQuery = "{\"query\":\"set query_take_max_records = 100; set truncationmaxsize = 67108864;let endDateTime = now();let startDateTime = ago(" + timeRange + ");let trendBinSize = 1m; KubeNodeInventory | where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | where ClusterId == \\\"" + clusterId + "\\\" | distinct Computer, Status | summarize count() by Status\",\"workspaceFilters\":{\"regions\":[]}}";
            var nodeStatusContent = new StringContent(nodeStatusQuery, Encoding.UTF8, "application/json");
            var nodeStatusResponse = await client.PostAsync(postLocation, nodeStatusContent);
            var nodeStatusResponseString = await nodeStatusResponse.Content.ReadAsStringAsync();
            dynamic nodeStatusObj = JsonConvert.DeserializeObject(nodeStatusResponseString);
            string statusString = "";
            if (nodeStatusObj != null)
            {
                var status = nodeStatusObj.tables[0].rows;
                for (var i = 0; i < status.Count; ++i)
                {
                    if (status[i][0] != "")
                    {
                        if (statusString != "")
                        {
                            statusString += ", ";
                        }
                        statusString += "\"" + status[i][0] + ": " + status[i][1] + "\"";

                    }

                }
            }
            return statusString;
        }

        public async Task<string> nodeEventsAsync(string nodesString)
        {
            var eventsPerNode = "{\"query\":\"set query_take_max_records = 100; set truncationmaxsize = 67108864;let endDateTime = now();let startDateTime = ago(" + timeRange + ");let trendBinSize = 1m; KubeEvents | where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | where ClusterId == \\\"" + clusterId + "\\\" | summarize count() by Computer \",\"workspaceFilters\":{\"regions\":[]}}";
            var eventsContent = new StringContent(eventsPerNode, Encoding.UTF8, "application/json");
            var eventsResponse = await client.PostAsync(postLocation, eventsContent);
            if (eventsResponse != null)
            {
                var eventsResponseString = await eventsResponse.Content.ReadAsStringAsync();
                dynamic eventsObj = JsonConvert.DeserializeObject(eventsResponseString);
                var events = eventsObj.tables[0].rows;
                for (var i = 0; i < events.Count; ++i)
                {
                    if (nodesString != "")
                    {
                        nodesString += ", ";
                    }
                    nodesString += "\"*(node_" + events[i][0] + ")* has " + events[i][1] + " warning events\"";
                }
            }
            return nodesString;
        }

        public async Task<string> highNodeCPUAsync(string nodesString)
        {
            var highCPUQuery = "{\"query\":\"set query_take_max_records = 10001; set truncationmaxsize = 67108864; let endDateTime = now(); let startDateTime = ago(30m); let trendBinSize = 1m; let capacityCounterName = \'cpuCapacityNanoCores\'; let usageCounterName = \'cpuUsageNanoCores\'; KubeNodeInventory | where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | where ClusterId contains \\\"" + clusterId + "\\\" | distinct ClusterName, Computer| join hint.strategy=shuffle (  Perf  | where TimeGenerated < endDateTime  | where TimeGenerated >= startDateTime  | where ObjectName == \'K8SNode\'  | where CounterName == capacityCounterName  | summarize LimitValue = max(CounterValue) by Computer, CounterName, bin(TimeGenerated, trendBinSize)  | project Computer, CapacityStartTime = TimeGenerated, CapacityEndTime = TimeGenerated + trendBinSize, LimitValue) on Computer| join kind=inner hint.strategy=shuffle ( Perf | where TimeGenerated < endDateTime + trendBinSize  | where TimeGenerated >= startDateTime - trendBinSize  | where ObjectName == \'K8SNode\'  | where CounterName == usageCounterName | project Computer, UsageValue = CounterValue, TimeGenerated) on Computer| where TimeGenerated >= CapacityStartTime and TimeGenerated < CapacityEndTime| project ClusterName, Computer, TimeGenerated, UsagePercent = UsageValue * 100.0 / LimitValue| where UsagePercent > 90 | distinct Computer \",\"workspaceFilters\":{ \"regions\":[]}}";
            var highCPUContent = new StringContent(highCPUQuery, Encoding.UTF8, "application/json");
            var highCPUResponse = await client.PostAsync(postLocation, highCPUContent);
            var highCPUResponseString = await highCPUResponse.Content.ReadAsStringAsync();
            dynamic highCPUObj = JsonConvert.DeserializeObject(highCPUResponseString);
            var highCPUNodes = highCPUObj.tables[0].rows;
            for (var i = 0; i < highCPUNodes.Count; ++i)
            {
                if (nodesString != "")
                {
                    nodesString += ", ";
                }
                nodesString += "\"*(node_" + highCPUNodes[i][0] + ")* has had CPU Percent over 90%\"";
            }
            return nodesString;
        }

        public async Task<string> highNodeMemoryAsync(string nodesString)
        {
            var highMemoryQuery = "{\"query\":\"set query_take_max_records = 10001; set truncationmaxsize = 67108864; let endDateTime = now(); let startDateTime = ago(30m); let trendBinSize = 1m; let capacityCounterName = \'cpuCapacityNanoCores\'; let usageCounterName = \'cpuUsageNanoCores\'; KubeNodeInventory | where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | where ClusterId contains \\\"" + clusterId + "\\\" | distinct ClusterName, Computer| join hint.strategy=shuffle (  Perf  | where TimeGenerated < endDateTime  | where TimeGenerated >= startDateTime  | where ObjectName == \'K8SNode\'  | where CounterName == capacityCounterName  | summarize LimitValue = max(CounterValue) by Computer, CounterName, bin(TimeGenerated, trendBinSize)  | project Computer, CapacityStartTime = TimeGenerated, CapacityEndTime = TimeGenerated + trendBinSize, LimitValue) on Computer| join kind=inner hint.strategy=shuffle ( Perf | where TimeGenerated < endDateTime + trendBinSize  | where TimeGenerated >= startDateTime - trendBinSize  | where ObjectName == \'K8SNode\'  | where CounterName == usageCounterName | project Computer, UsageValue = CounterValue, TimeGenerated) on Computer| where TimeGenerated >= CapacityStartTime and TimeGenerated < CapacityEndTime| project ClusterName, Computer, TimeGenerated, UsagePercent = UsageValue * 100.0 / LimitValue| where UsagePercent > 90 | distinct Computer \",\"workspaceFilters\":{ \"regions\":[]}}";
            var highMemoryContent = new StringContent(highMemoryQuery, Encoding.UTF8, "application/json");
            var highMemoryResponse = await client.PostAsync(postLocation, highMemoryContent);
            var highMemoryResponseString = await highMemoryResponse.Content.ReadAsStringAsync();
            dynamic highMemoryObj = JsonConvert.DeserializeObject(highMemoryResponseString);
            var highMemoryNodes = highMemoryObj.tables[0].rows;
            for (var i = 0; i < highMemoryNodes.Count; ++i)
            {
                if (nodesString != "")
                {
                    nodesString += ", ";
                }
                nodesString += "\"*(node_" + highMemoryNodes[i][0] + ")* has had Memory Percent over 90%\"";
            }
            return nodesString;
        }
        public async Task<dynamic> clusterCPU()
        {
            var cpuQuery = "{\"query\":\"set query_take_max_records = 10001; set truncationmaxsize = 67108864; let endDateTime = now(); let startDateTime = ago(30m); let trendBinSize = 1m; let capacityCounterName = \'cpuCapacityNanoCores\'; let usageCounterName = \'cpuUsageNanoCores\'; KubeNodeInventory | where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | where ClusterId contains \\\"" + clusterId + "\\\" | distinct ClusterName, Computer| join hint.strategy=shuffle (  Perf  | where TimeGenerated < endDateTime  | where TimeGenerated >= startDateTime  | where ObjectName == \'K8SNode\'  | where CounterName == capacityCounterName  | summarize LimitValue = max(CounterValue) by Computer, CounterName, bin(TimeGenerated, trendBinSize)  | project Computer, CapacityStartTime = TimeGenerated, CapacityEndTime = TimeGenerated + trendBinSize, LimitValue) on Computer| join kind=inner hint.strategy=shuffle ( Perf | where TimeGenerated < endDateTime + trendBinSize  | where TimeGenerated >= startDateTime - trendBinSize  | where ObjectName == \'K8SNode\'  | where CounterName == usageCounterName | project Computer, UsageValue = CounterValue, TimeGenerated) on Computer| where TimeGenerated >= CapacityStartTime and TimeGenerated < CapacityEndTime| project ClusterName, Computer, TimeGenerated, UsagePercent = UsageValue * 100.0 / LimitValue| summarize AggregatedValue = avg(UsagePercent), Max = max(UsagePercent) by ClusterName \",\"workspaceFilters\":{ \"regions\":[]}}";
            var cpucontent = new StringContent(cpuQuery, Encoding.UTF8, "application/json");
            var cpuResponse = await client.PostAsync(postLocation, cpucontent);
            var cpuResponseString = await cpuResponse.Content.ReadAsStringAsync();
            dynamic cpuobj = JsonConvert.DeserializeObject(cpuResponseString);
            return cpuobj;
        }

        public async Task<dynamic> clusterMemory()
        {
            var memoryQuery = "{\"query\":\"set query_take_max_records = 10001; set truncationmaxsize = 67108864; let endDateTime = now(); let startDateTime = ago(30m); let trendBinSize = 1m; let capacityCounterName = \'memoryCapacityBytes\'; let usageCounterName = \'memoryRssBytes\'; KubeNodeInventory | where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | where ClusterId contains \\\"" + clusterId + "\\\" | distinct ClusterName, Computer| join hint.strategy=shuffle (  Perf  | where TimeGenerated < endDateTime  | where TimeGenerated >= startDateTime  | where ObjectName == \'K8SNode\'  | where CounterName == capacityCounterName  | summarize LimitValue = max(CounterValue) by Computer, CounterName, bin(TimeGenerated, trendBinSize)  | project Computer, CapacityStartTime = TimeGenerated, CapacityEndTime = TimeGenerated + trendBinSize, LimitValue) on Computer| join kind=inner hint.strategy=shuffle ( Perf | where TimeGenerated < endDateTime + trendBinSize  | where TimeGenerated >= startDateTime - trendBinSize  | where ObjectName == \'K8SNode\'  | where CounterName == usageCounterName | project Computer, UsageValue = CounterValue, TimeGenerated) on Computer| where TimeGenerated >= CapacityStartTime and TimeGenerated < CapacityEndTime| project ClusterName, Computer, TimeGenerated, UsagePercent = UsageValue * 100.0 / LimitValue| summarize AggregatedValue = avg(UsagePercent), Max = max(UsagePercent) by ClusterName \",\"workspaceFilters\":{ \"regions\":[]}}";
            var memoryContent = new StringContent(memoryQuery, Encoding.UTF8, "application/json");
            var memoryResponse = await client.PostAsync(postLocation, memoryContent);
            var memoryResponseString = await memoryResponse.Content.ReadAsStringAsync();
            dynamic memoryObj = JsonConvert.DeserializeObject(memoryResponseString);
            return memoryObj;
        }

    }
}
