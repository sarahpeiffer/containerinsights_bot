// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
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

        //private static UserState _userState;

        public PodDialog()
            : base(nameof(PodDialog))
        {

            AddDialog(new TextPrompt(nameof(TextPrompt)));
            AddDialog(new NumberPrompt<int>(nameof(NumberPrompt<int>)));

            AddDialog(new WaterfallDialog(nameof(WaterfallDialog), new WaterfallStep[]
            {
                TokenAsync,
                CluserIdAync,
                PodNameAsync,
                SearchByNodeAsync,
                FindPodsAsync,
                AccessPodData,
                ContainerLogData
            }));

            InitialDialogId = nameof(WaterfallDialog);
        }

        private static async Task<DialogTurnResult> TokenAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            var userProfile = (UserProfile)stepContext.Options;
            var existingToken = userProfile.Token;
            if (existingToken != null)
            {
                stepContext.Values[UserInfo] = userProfile;
            }
            else
            {
                stepContext.Values[UserInfo] = new UserProfile();
            }
           
            // Create an object in which to collect the user's information within the dialog.
            var profile = (UserProfile)stepContext.Values[UserInfo];
            if (profile.Token == null)
            {
                var promptOptions = new PromptOptions { Prompt = MessageFactory.Text("Please enter your auth token.") };

                // Ask the user to enter their token.
                return await stepContext.PromptAsync(nameof(TextPrompt), promptOptions, cancellationToken);
            }
            else
            {
                return await stepContext.NextAsync(profile.Token, cancellationToken);
            }

        }

        private async Task<DialogTurnResult> CluserIdAync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            // Set the user's token to what they entered in response to the name prompt.
            var userProfile = (UserProfile)stepContext.Values[UserInfo];
            userProfile.Token = (string)stepContext.Result;
            if (userProfile.ClusterId == null)
            {
                var promptOptions = new PromptOptions { Prompt = MessageFactory.Text("Please enter your cluster id") };

            // Ask the user to enter their cluster id.
            return await stepContext.PromptAsync(nameof(TextPrompt), promptOptions, cancellationToken);
            }
            else
            {
                return await stepContext.NextAsync(userProfile.ClusterId, cancellationToken);

            }

        }
        private async Task<DialogTurnResult> PodNameAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            // Set the user's id to what they entered in response to the name prompt.
            var userProfile = (UserProfile)stepContext.Values[UserInfo];
            userProfile.ClusterId = (string)stepContext.Result;
            if (userProfile.ObjectType == "pod" && userProfile.ObjectName != "")
            {
                return await stepContext.NextAsync(userProfile.ObjectName, cancellationToken);
            }
            var promptOptions = new PromptOptions { Prompt = MessageFactory.Text("If you know the name of the pod you would like to troubleshoot, enter it now. If not, type \"search\" to search for a pod by node") };

            // Ask the user to enter their node name id.
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

                // Ask the user to enter their node name id.
                return await stepContext.PromptAsync(nameof(TextPrompt), promptOptions, cancellationToken);
            }
        }

        private async Task<DialogTurnResult> FindPodsAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            string result = (string)stepContext.Result;
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
                HttpClient client = new HttpClient();
                client.DefaultRequestHeaders.Add("Authorization", token);
                var id = userProfile.WorkspaceId;
                if (id == null)
                {
                    var responseString = await client.GetStringAsync("https://management.azure.com" + clusterId + "?api-version=2020-03-01");
                    var myJsonObject = JsonConvert.DeserializeObject<MyJsonType>(responseString);
                    id = myJsonObject.Properties.AddonProfiles.Omsagent.Config.LogAnalyticsWorkspaceResourceID;
                }

                //post request
                var postLoc = "https://management.azure.com" + id + "/query?api-version=2017-10-01";
                var podsQuery = "{\"query\":\"set query_take_max_records = 20; set truncationmaxsize = 67108864;let endDateTime = now();let startDateTime = ago(30m);let trendBinSize = 1m; KubePodInventory | where TimeGenerated < endDateTime   | where TimeGenerated >= startDateTime | where Computer == \\\"" + result + "\\\" | distinct Name\",\"workspaceFilters\":{\"regions\":[]}}";
                var podsContent = new StringContent(podsQuery, Encoding.UTF8, "application/json");
                var podsResponse = await client.PostAsync(postLoc, podsContent);
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
                // Ask the user to enter their node name id.
                return await stepContext.PromptAsync(nameof(TextPrompt), promptOptions, cancellationToken);
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

            PodQueryHelper podHandler = new PodQueryHelper(podName, token, clusterId, id, userProfile.KubeAPIToken, userProfile.APIServer, userProfile.KubeCert, timeRange);

            
            dynamic readyObj = await podHandler.readyQueryAsync();
            if(readyObj == null)
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
            if(cpuobj != null)
            {
                var cpuUsage = cpuobj.tables[0].rows[0][0];
                var cpuMax = cpuobj.tables[0].rows[0][1];
                if(cpuMax!= null)
                {
                    cpuMaxPercent = (double)cpuMax;
                    if(Double.IsNaN(cpuMaxPercent))
                    {
                        cpuMaxPercent = 0.0;
                    }
                }
                if(cpuUsage != null)
                {
                    cpuPercent = (double)cpuUsage;
                }
            }

            dynamic memoryObj = await podHandler.memoryQueryAsync();
            double memoryPercent = 0.0;
            if(memoryObj != null)
            {
                var memoryUsage = memoryObj.tables[0].rows[0][0];
                if (memoryUsage != null)
                {
                    memoryPercent = (double)memoryUsage;
                    if(Double.IsNaN(memoryPercent))
                    {
                        memoryPercent = 0.0;
                    }
                }
            }

            var kubeEvents = await podHandler.kubeEventsQueryAsync();
            

            

            HttpClient kubeClient = new HttpClient();
            string tokenValue = "Bearer " + userProfile.KubeAPIToken;
            string apiServerAddr = userProfile.APIServer;
            kubeClient.DefaultRequestHeaders.Add("Authorization", tokenValue);
            var describeResponseString = "";
            if(userProfile.KubeCert == null)
            {
                var proxyuri = apiServerAddr + "/api/v1/namespaces/" + nameSpace + "/pods/" + podName;
                var proxyresponse = await kubeClient.GetAsync(proxyuri);
                describeResponseString = await proxyresponse.Content.ReadAsStringAsync();
            }
            else
            {
                var proxyUri = "https://aks-kubeapi-proxy-prod.trafficmanager.net/api/clusterApiProxy";
                var query = "{\"kubeCertificateEncoded\" : \"" + userProfile.KubeCert + "\"}";
                var queryContent = new StringContent(query, Encoding.UTF8, "application/json");
                var describeUri = proxyUri + "?query=" + System.Web.HttpUtility.UrlEncode(apiServerAddr + "/api/v1/namespaces/" + nameSpace + "/pods/" + podName);
                var describeResponse = await kubeClient.PostAsync(describeUri, queryContent);
                describeResponseString = await describeResponse.Content.ReadAsStringAsync();
            }
           
            dynamic responseJson = JsonConvert.DeserializeObject(describeResponseString);
            var conditionErrors = "";
            if (responseJson != null)
            {
                    if (responseJson.status.ToString().Contains("conditions"))
                    {
                        var conditions = responseJson.status.conditions;
                        for (int j = 0; j < conditions.Count; ++j)
                        {
                            string conditionStatus = conditions[j].status;
                            if (conditionStatus.Contains("False"))
                            {
                                if (conditionErrors != "")
                                {
                                    conditionErrors += ", ";
                                }
                                conditionErrors += "\"" + conditions[j].type + " is " + conditions[j].status + " Message " + conditions[j].message + "\"";

                            }
                        }
                    }
            }

            var containerErrors = "";
            if (responseJson.status.containerStatuses != null)
            {
                
                var containerStatuses = responseJson.status.containerStatuses;
                var restartCount = "";
                var containerName = "";
                var state = "";
                var stateReason = "";
                var stateMessage = "";
                var lastState = "";
                var lastStateMessage = "";
                var lastStateReason = "";
                for (int j = 0; j < containerStatuses.Count; ++j)
                {
                    restartCount = containerStatuses[j].restartCount;
                    containerName = containerStatuses[j].name;
                    var stateElement = containerStatuses[j].state;
                    if (stateElement.waiting != null)
                    {
                        state = "Waiting";
                        stateReason = stateElement.waiting.reason;
                        stateMessage = stateElement.waiting.message;

                    }
                    if(stateElement.running != null)
                    {
                        state = "Running";
                    }
                    var lastStateElement = containerStatuses[j].lastState;
                    if (lastStateElement != null)
                    {
                        if (lastStateElement.terminated != null)
                        {
                            lastState = "Terminated";
                            Newtonsoft.Json.Linq.JObject terminated = lastStateElement.terminated;
                            lastStateReason = lastStateElement.terminated.reason;
                            lastStateMessage = terminated.ToString();
                        }
                    }
                    if (containerErrors != "")
                    {
                        containerErrors += ", ";
                    }
                    var containerErrorTest = "\"" + containerName + "\", \"State:   " + state + "\", \"Reason:   " + stateReason + "\",  \"Last Terminated State:   " + lastState + "\", \"Reason:   " + lastStateReason + "\",  \"RestartCount:   " + restartCount + "\"";
                    containerErrors += containerErrorTest;
                }
            }
                string jsonForUX = "{\"Name\" : \"" + podName + "\", \"Status: \" : \"" + status + "\", \"Container Count: \" : \"" + containerCount + "\", \"Average CPU: \" : \"" + Math.Round(cpuPercent, 2) + "%\", \"Max CPU: \" : \"" + Math.Round(cpuMaxPercent, 2) + "%\", \"Average Memory: \" : \"" + Math.Round(memoryPercent, 2) + "%\",  \"Kube Events\" : [" + kubeEvents + "], \"Live Errors\" : [" + conditionErrors + "], \"Container Errors\" : [" + containerErrors + "]}";

            await stepContext.Context.SendActivityAsync(jsonForUX);
            if(containerCount != "0")
            {
                var promptOptions = new PromptOptions { Prompt = MessageFactory.Text("Would you like to view logs for containers on this pod? *(Yes)* / *(No)*.") };

                // Ask the user to enter their node name id.
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
            for(int i = 0; i < containers.Count; ++i)
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
            if(logsResponseString == "")
            {
                logsResponseString = "No logs found for containers on this pod.";
            }
            await stepContext.Context.SendActivityAsync((string)logsResponseString);




            return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);

        }



    }

    /*            var containerLogsQuery = "{\"query\":\"set query_take_max_records = 1001; set truncationmaxsize = 67108864; let endDateTime = now(); let startDateTime = ago(" + timeRange + "); let trendBinSize = 1m; ContainerLog| where LogEntrySource == \\\"stderr\\\"| where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | join(KubePodInventory| where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime)on ContainerID | where PodUid contains \\\"" + podUid + "\\\" | project PodUid, LogEntry, ContainerID| summarize count() by LogEntry, ContainerID\",\"workspaceFilters\":{ \"regions\":[]}}";
                        var containerLogContent = new StringContent(containerLogsQuery, Encoding.UTF8, "application/json");
                        var containerLogResponse = await client.PostAsync(postLoc, containerLogContent);
                        var containerLogResponseString = await containerLogResponse.Content.ReadAsStringAsync();
                        dynamic containerLogObj = JsonConvert.DeserializeObject(containerLogResponseString);
                        var containerLogData = containerLogObj.tables[0].rows;
                        var containerLogs = "\"There are no recent standard error logs related to this pod\"";
                        if (containerLogData.Count > 0)
                        {
                            containerLogs = "";
                            for (int i = 0; i < containerLogData.Count; ++i)
                            {
                                string count = containerLogData[i][2] > 1 ? "counts" : "count";
                                string verb = containerLogData[i][2] > 1 ? "are" : "is";
                                if (containerLogs != "")
                                {
                                    containerLogs += ", ";
                                }
                                string containerLogsString = "\"There " + verb + " " + containerLogData[i][2] + " " + count + " of " + containerLogData[i][0] + " for container " + containerLogData[i][1] + ".\"";
                                containerLogs += containerLogsString;
                            }
                        }*/
}