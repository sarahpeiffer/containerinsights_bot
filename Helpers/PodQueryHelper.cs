﻿using Microsoft.Bot.Builder.Dialogs.Declarative.Resources;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace Microsoft.BotBuilderSamples
{
    public class PodQueryHelper
    {
        HttpClient client;
        HttpClient kubeClient;
        string podName;
        string token;
        string resourceId;
        string clusterId;
        string postLocation;
        string timeRange;
        string podUid;
        string nameSpace;
        string kubeToken;
        string apiServer;
        string kubeCert;
        string kubePostLocation;

        public PodQueryHelper(string podName, string token, string clusterId, string resourceId, string kubeToken, string apiServer, string kubeCert, string timeRange)
        {
            this.podName = podName;
            this.token = token;
            this.clusterId = clusterId;
            this.client = new HttpClient();
            client.DefaultRequestHeaders.Add("Authorization", token);
            this.resourceId = resourceId;
            this.kubeToken = kubeToken;
            this.apiServer = apiServer;
            this.kubeCert = kubeCert;
            this.kubeClient = new HttpClient();
            kubeClient.DefaultRequestHeaders.Add("Authorization", "Bearer " + this.kubeToken);
            if (this.kubeCert == null)
            {

            }
            this.timeRange = timeRange;
            this.postLocation = "https://management.azure.com" + resourceId + "/query?api-version=2017-10-01";

        }

        public void setIDAndNamespace(string podUid, string nameSpace)
        {
            this.podUid = podUid;
            this.nameSpace = nameSpace;
        }


        public async Task<dynamic> readyQueryAsync()
        {
            var readyQuery = "{\"query\":\"set query_take_max_records = 1; set truncationmaxsize = 67108864;let endDateTime = now();let startDateTime = ago(30m);let trendBinSize = 1m; KubePodInventory | where TimeGenerated < endDateTime   | where TimeGenerated >= startDateTime | where Name == \\\"" + podName + "\\\" | sort by TimeGenerated | project PodStatus, PodUid, Namespace\",\"workspaceFilters\":{\"regions\":[]}}";
            var readyContent = new StringContent(readyQuery, Encoding.UTF8, "application/json");
            var readyResponse = await client.PostAsync(postLocation, readyContent);
            var readyResponseString = await readyResponse.Content.ReadAsStringAsync();
            dynamic readyObj = JsonConvert.DeserializeObject(readyResponseString);
            return readyObj;
        }

        public async Task<string> containerQueryAsync()
        {
            var containerQuery = "{\"query\":\"set query_take_max_records = 1; set truncationmaxsize = 67108864;let endDateTime = now();let startDateTime = ago(" + timeRange + ");let trendBinSize = 1m; ContainerInventory | where TimeGenerated < endDateTime   | where TimeGenerated >= startDateTime | where ContainerHostname contains \\\"" + podName + "\\\" | distinct ContainerID | summarize count()\",\"workspaceFilters\":{\"regions\":[]}}";
            var containerContent = new StringContent(containerQuery, Encoding.UTF8, "application/json");
            var containerResponse = await client.PostAsync(postLocation, containerContent);
            var containerResponseString = await containerResponse.Content.ReadAsStringAsync();
            dynamic containerObj = JsonConvert.DeserializeObject(containerResponseString);
            string containerCount = "no containers found";
            if (containerObj != null)
            {
                containerCount = containerObj.tables[0].rows[0][0];
            }
            return containerCount;
        }


        public async Task<dynamic> cpuQueryAsync()
        {
            var cpuquery = "{\"query\":\"set query_take_max_records = 10001; set truncationmaxsize = 67108864; let endDateTime = now(); let startDateTime = ago(" + timeRange + "); Perf | where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | where InstanceName contains \\\"" + podUid + "\\\" | where CounterName contains \\\"cpuUsageNanoCores\\\"| summarize maxsum = sum(CounterValue) by TimeGenerated| summarize maxusage = max(maxsum) by bin(TimeGenerated, 1h)|join (Perf | where InstanceName contains \\\"" + podUid + "\\\" | where CounterName contains \\\"cpuLimitNanoCores\\\"| summarize maxa=sum(CounterValue) by TimeGenerated| summarize maxallocatable = avg(maxa) by bin(TimeGenerated, 1h)) on TimeGenerated| project maxusage, maxallocatable, percent=((maxusage)/(maxallocatable)) * 100.0| summarize max = max(percent), avg = avg(percent)\",\"workspaceFilters\":{ \"regions\":[]}}";
            var cpucontent = new StringContent(cpuquery, Encoding.UTF8, "application/json");
            var cpuResponse = await client.PostAsync(postLocation, cpucontent);
            var cpuResponseString = await cpuResponse.Content.ReadAsStringAsync();
            dynamic cpuobj = JsonConvert.DeserializeObject(cpuResponseString);
            return cpuobj;
        }

        public async Task<dynamic> memoryQueryAsync()
        {
            var memoryquery = "{\"query\":\"set query_take_max_records = 10001; set truncationmaxsize = 67108864; let endDateTime = now(); let startDateTime = ago(" + timeRange + "); Perf | where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | where InstanceName contains \\\"" + podUid + "\\\" | where CounterName contains \\\"memoryRssBytes\\\"| summarize maxsum = sum(CounterValue) by TimeGenerated| summarize maxusage = avg(maxsum) by bin(TimeGenerated, 1h)|join (Perf | where InstanceName contains \\\"" + podUid + "\\\" | where CounterName contains \\\"memoryLimitBytes\\\"| summarize maxa=sum(CounterValue) by TimeGenerated| summarize maxallocatable = avg(maxa) by bin(TimeGenerated, 1h)) on TimeGenerated| project maxusage, maxallocatable, percent=((maxusage)/(maxallocatable)) * 100.0| summarize avg = avg(percent)\",\"workspaceFilters\":{ \"regions\":[]}}";
            var memoryContent = new StringContent(memoryquery, Encoding.UTF8, "application/json");
            var memoryResponse = await client.PostAsync(postLocation, memoryContent);
            var memoryResponseString = await memoryResponse.Content.ReadAsStringAsync();
            dynamic memoryObj = JsonConvert.DeserializeObject(memoryResponseString);
            return memoryObj;
        }

        public async Task<string> kubeEventsQueryAsync()
        {
            var kubeEventsQuery = "{\"query\":\"set query_take_max_records = 1001; set truncationmaxsize = 67108864; let endDateTime = now(); let startDateTime = ago(" + timeRange + "); let trendBinSize = 1m; KubeEvents | where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | where Name == \\\"" + podName + "\\\" | summarize count() by Reason, ObjectKind\",\"workspaceFilters\":{ \"regions\":[]}}";
            var kubeEventContent = new StringContent(kubeEventsQuery, Encoding.UTF8, "application/json");
            var kubeEventResponse = await client.PostAsync(postLocation, kubeEventContent);
            var kubeEventResponseString = await kubeEventResponse.Content.ReadAsStringAsync();
            dynamic kubeEventObj = JsonConvert.DeserializeObject(kubeEventResponseString);
            var kubeEventData = kubeEventObj.tables[0].rows;
            var kubeEvents = "\"There are no recent warning KubeEvents related to this node\"";
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
                    string kubeEventsString = "\"There " + verb + " " + kubeEventData[i][2] + " " + count + " of " + kubeEventData[i][0] + " for type " + kubeEventData[i][1] + ".\"";
                    kubeEvents += kubeEventsString;
                }
            }
            return kubeEvents;
        }




    }
}