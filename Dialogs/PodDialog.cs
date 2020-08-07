// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Schema;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Microsoft.BotBuilderSamples
{
    public class PodDialog : ComponentDialog
    {
        // Define value names for values tracked inside the dialogs.
        private const string UserInfo = "value-userInfo";

        private string PodName = "";
        private string Namespace = "";

        public PodDialog()
            : base(nameof(PodDialog))
        {

            AddDialog(new TextPrompt(nameof(TextPrompt)));

            AddDialog(new WaterfallDialog(nameof(WaterfallDialog), new WaterfallStep[]
            {
                PodNameAsync,
                SearchByNodeAsync,
                FindPodsAsync,
                AccessPodData,
                ContainerLogData
            }));

            InitialDialogId = nameof(WaterfallDialog);
        }


        private async Task<DialogTurnResult> PodNameAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            stepContext.Values[UserInfo] = (UserProfile)stepContext.Options;
            var userProfile = (UserProfile)stepContext.Values[UserInfo];

            if (userProfile.ObjectType == "pod" && userProfile.ObjectName != "")
            {
                return await stepContext.NextAsync(userProfile.ObjectName, cancellationToken);
            }
            var promptOptions = new PromptOptions { Prompt = MessageFactory.Text("If you know the name of the pod you would like to troubleshoot, enter it now. If not, type \"search\" to search for a pod by node") };

            return await stepContext.PromptAsync(nameof(TextPrompt), promptOptions, cancellationToken);
        }

        private async Task<DialogTurnResult> SearchByNodeAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            string result = (string)stepContext.Result;
            if (result.ToLower() != "search")
            {
                this.PodName = result;
                return await stepContext.NextAsync(this.PodName, cancellationToken);
            }
            else
            {
                var promptOptions = new PromptOptions { Prompt = MessageFactory.Text("Please enter the name of the node this pod is on") };

                return await stepContext.PromptAsync(nameof(TextPrompt), promptOptions, cancellationToken);
            }
        }

        private async Task<DialogTurnResult> FindPodsAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            string result = (string)stepContext.Result;
            //skip this step if the user has already specified a pod
            if (this.PodName != "")
            {
                return await stepContext.NextAsync(this.PodName, cancellationToken);
            }
            else
            {
                var nodeName = (string)stepContext.Result;
                var userProfile = (UserProfile)stepContext.Values[UserInfo];
                var token = userProfile.Token;
                var clusterId = userProfile.ClusterId;

                //make request to see all pods on a node
                HttpClient client = new HttpClient();
                client.DefaultRequestHeaders.Add("Authorization", token);
                var id = userProfile.WorkspaceId;

                var postLoc = "https://management.azure.com" + id + "/query?api-version=2017-10-01";
                var podsQuery = "{\"query\":\"set query_take_max_records = 20; set truncationmaxsize = 67108864;let endDateTime = now();let startDateTime = ago(30m);let trendBinSize = 1m; KubePodInventory | where TimeGenerated < endDateTime   | where TimeGenerated >= startDateTime | where Computer == \\\"" + result + "\\\" | distinct Name\",\"workspaceFilters\":{\"regions\":[]}}";
                var podsContent = new StringContent(podsQuery, Encoding.UTF8, "application/json");
                var podsResponse = await client.PostAsync(postLoc, podsContent);
                if(podsResponse != null)
                {
                    var podsResponseString = await podsResponse.Content.ReadAsStringAsync();
                    dynamic podsObj = JsonConvert.DeserializeObject(podsResponseString);

                    var podsString = "";
                    var nodePods = podsObj.tables[0].rows;
                    for (var i = 0; i < nodePods.Count; ++i)
                    {
                        if (podsString != "")
                        {
                            podsString += ", ";
                        }
                        podsString += "\"*(" + nodePods[i][0] + ")*\"";

                    }
                    string podsJson = "{\"Name\" : \"Pods on Node " + result + "\", \"Pods \" : [" + podsString + "]}";
                    var promptOptions = new PromptOptions { Prompt = MessageFactory.Text("Please enter or select a pod") };
                    await stepContext.Context.SendActivityAsync(podsJson);
                    return await stepContext.PromptAsync(nameof(TextPrompt), promptOptions, cancellationToken);
                }
                return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);

            }
        }


        private async Task<DialogTurnResult> AccessPodData(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            var userProfile = (UserProfile)stepContext.Values[UserInfo];
            var token = userProfile.Token;
            var clusterId = userProfile.ClusterId;
            var podName = (string)stepContext.Result;
            var id = userProfile.WorkspaceId;
            var timeRange = (userProfile.TimeRange != "") ? userProfile.TimeRange : "30m";

            await stepContext.Context.SendActivityAsync("Gathering pod diagnostic information from the past " + timeRange + " now.  This may take a few seconds. To change the time range select the Time Range for Diagnostics shortcut");
            await stepContext.Context.SendActivityAsync(new Activity { Type = ActivityTypes.Event, Value = "typing" });
            await stepContext.Context.SendActivityAsync(new Activity { Type = ActivityTypes.Typing });

            PodQueryHelper podHandler = new PodQueryHelper(podName, token, clusterId, id, userProfile.KubeAPIToken, userProfile.APIServer, userProfile.KubeCert, timeRange);


            dynamic readyObj = await podHandler.readyQueryAsync();
            if (readyObj == null)
            {
                await stepContext.Context.SendActivityAsync("something went wrong");
                return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
            }
            if (readyObj.tables[0].rows == null || readyObj.tables[0].rows.Count == 0)
            {
                await stepContext.Context.SendActivityAsync("This pod does not exist on this cluster.  Please enter another pod name");
                return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
            }
            string status = readyObj.tables[0].rows[0][0];
            string podUid = readyObj.tables[0].rows[0][1];
            string nameSpace = readyObj.tables[0].rows[0][2];
            podHandler.setIDAndNamespace(podUid, nameSpace);
            this.Namespace = nameSpace;

            string containerCount = await podHandler.containerQueryAsync();

            dynamic cpuobj = await podHandler.cpuQueryAsync();
            double cpuPercent = 0.0;
            double cpuMaxPercent = 0.0;
            if (cpuobj != null)
            {
                var cpuUsage = cpuobj.tables[0].rows[0][0];
                var cpuMax = cpuobj.tables[0].rows[0][1];
                if (cpuMax != null)
                {
                    cpuMaxPercent = (double)cpuMax;
                    if (Double.IsNaN(cpuMaxPercent))
                    {
                        cpuMaxPercent = 0.0;
                    }
                }
                if (cpuUsage != null)
                {
                    cpuPercent = (double)cpuUsage;
                }
            }

            dynamic memoryObj = await podHandler.memoryQueryAsync();
            double memoryPercent = 0.0;
            if (memoryObj != null)
            {
                var memoryUsage = memoryObj.tables[0].rows[0][0];
                if (memoryUsage != null)
                {
                    memoryPercent = (double)memoryUsage;
                    if (Double.IsNaN(memoryPercent))
                    {
                        memoryPercent = 0.0;
                    }
                }
            }
            var kubeEvents = await podHandler.kubeEventsQueryAsync();

            var liveErrors = "";
            if (userProfile.APIServer != null)
            {
                dynamic responseJson = await podHandler.describePodAsync();

                var conditionErrors = podHandler.conditionErrors(responseJson);

                var containerErrors = podHandler.containerErrors(responseJson);
                if (containerErrors != "")
                {
                    containerErrors = " , \"Container Errors\" : \"\", " + containerErrors;
                }
                liveErrors = ", \"Live Errors\" : [" + conditionErrors + "]" + containerErrors;
            }


            string jsonForUX = "{\"Name\" : \"" + podName + "\", \"Status: \" : \"" + status + "\", \"Container Count: \" : \"" + containerCount + "\", \"Average CPU: \" : \"" + Math.Round(cpuPercent, 2) + "%\", \"Max CPU: \" : \"" + Math.Round(cpuMaxPercent, 2) + "%\", \"Average Memory: \" : \"" + Math.Round(memoryPercent, 2) + "%\",  \"Kube Events\" : [" + kubeEvents + "]" + liveErrors + "}";

            await stepContext.Context.SendActivityAsync(jsonForUX);
            if (containerCount != "0" && status == "Running")
            {
                var promptOptions = new PromptOptions { Prompt = MessageFactory.Text("Would you like to view logs for containers on this pod? *(Yes)* / *(No)*.") };

                return await stepContext.PromptAsync(nameof(TextPrompt), promptOptions, cancellationToken);
            }
            return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);


        }

        private async Task<DialogTurnResult> ContainerLogData(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            var userProfile = (UserProfile)stepContext.Values[UserInfo];
            string result = (string)stepContext.Result;
            if (result.ToLower() != "yes")
            {
                this.PodName = "";
                return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
            }
            var podName = this.PodName;
            var nameSpace = this.Namespace;
            this.PodName = "";
            this.Namespace = "";




            HttpClient kubeClient = new HttpClient();
            string tokenValue = "Bearer " + userProfile.KubeAPIToken;
            string apiServerAddr = userProfile.APIServer;
            kubeClient.DefaultRequestHeaders.Add("Authorization", tokenValue);
            var containerResponseString = "";
            var query = "{\"kubeCertificateEncoded\" : \"" + userProfile.KubeCert + "\"}";
            var queryContent = new StringContent(query, Encoding.UTF8, "application/json");
            var proxyUri = "https://aks-kubeapi-proxy-prod.trafficmanager.net/api/clusterApiProxy";
            if (userProfile.KubeCert == null)
            {
                var proxyuri = apiServerAddr + "/api/v1/namespaces/" + nameSpace + "/pods/" + podName;
                var proxyresponse = await kubeClient.GetAsync(proxyuri);
                if (!proxyresponse.IsSuccessStatusCode)
                {
                    await stepContext.Context.SendActivityAsync("kube api call failed");
                    return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
                }
                containerResponseString = await proxyresponse.Content.ReadAsStringAsync();

            }
            else
            {

                var containersuri = proxyUri + "?query=" + System.Web.HttpUtility.UrlEncode(apiServerAddr + "/api/v1/namespaces/" + nameSpace + "/pods/" + podName);
                var containerResponse = await kubeClient.PostAsync(containersuri, queryContent);
                if (!containerResponse.IsSuccessStatusCode)
                {
                    await stepContext.Context.SendActivityAsync("kube api call failed");
                    return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
                }
                containerResponseString = await containerResponse.Content.ReadAsStringAsync();

            }

            dynamic containersJson = JsonConvert.DeserializeObject(containerResponseString);
            var containers = containersJson.spec.containers;
            var innitContainers = containersJson.spec.initContainers;
            List<String> containerList = new List<String>();
            for (int i = 0; i < containers.Count; ++i)
            {
                string containerName = (string)containers[i].name;
                containerList.Add(containerName);
            }
            if (innitContainers != null)
            {
                for (int i = 0; i < innitContainers.Count; ++i)
                {
                    string containerName = (string)innitContainers[i].name;
                    containerList.Add(containerName);
                }
            }
            var logsResponseString = "";
            foreach (String container in containerList)
            {
                if (userProfile.KubeCert == null)
                {
                    var logsUriProxy = apiServerAddr + "/api/v1/namespaces/" + nameSpace + "/pods/" + podName + "/log?container=" + container + "&limit=50";
                    var logsProxyResponse = await kubeClient.GetAsync(logsUriProxy);
                    logsResponseString += await logsProxyResponse.Content.ReadAsStringAsync();
                    if (!logsProxyResponse.IsSuccessStatusCode)
                    {
                        if (logsResponseString.Contains("timeout"))
                        {
                            await stepContext.Context.SendActivityAsync("The kube api server timed out.");
                            return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
                        }
                        dynamic responseJson = JsonConvert.DeserializeObject(logsResponseString);
                        var status = responseJson.status;
                        var message = responseJson.message;
                        await stepContext.Context.SendActivityAsync("The call to the kube api returned a status " + status + "because " + message);
                        return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);

                    }
                }
                else
                {
                    var logsUri = proxyUri + "?query=" + System.Web.HttpUtility.UrlEncode(apiServerAddr + "/api/v1/namespaces/" + nameSpace + "/pods/" + podName + "/log?container=" + container + "&limit=50");
                    var logsResponse = await kubeClient.PostAsync(logsUri, queryContent);
                    logsResponseString += await logsResponse.Content.ReadAsStringAsync();
                    if (!logsResponse.IsSuccessStatusCode)
                    {
                        if (logsResponseString.Contains("timeout"))
                        {
                            await stepContext.Context.SendActivityAsync("The kube api server timed out");
                        }
                        dynamic responseJson = JsonConvert.DeserializeObject(logsResponseString);
                        var status = responseJson.status;
                        var message = responseJson.message;
                        await stepContext.Context.SendActivityAsync("The call to the kube api returned a status " + status + "because " + message);
                        return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);

                    }
                }


            }
            if (logsResponseString == "")
            {
                logsResponseString = "No logs found for containers on this pod.";
            }
            await stepContext.Context.SendActivityAsync((string)logsResponseString);
            return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);

        }


    }
}