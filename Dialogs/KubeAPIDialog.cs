// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Schema;
using Microsoft.Recognizers.Text.NumberWithUnit.Dutch;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web;

/*using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Azure.WebJobs.Host;
using System.Collections.Generic;
using Microsoft.InfrastructureInsights.Deployment.EV2Functions.Request;
using Microsoft.InfrastructureInsights.Deployment.EV2Functions;*/

namespace Microsoft.BotBuilderSamples
{
    public class KubeAPIDialog : ComponentDialog
    {
        // Define a "done" response for the company selection prompt.
        private const string DoneOption = "done";

        // Define value names for values tracked inside the dialogs.
        private const string UserInfo = "value-userInfo";

        private const string PodName = "";
        const string Origin = "Origin";
        const string AccessControlRequestMethod = "Access-Control-Request-Method";
        const string AccessControlRequestHeaders = "Access-Control-Request-Headers";
        const string AccessControlAllowOrigin = "Access-Control-Allow-Origin";
        const string AccessControlAllowMethods = "Access-Control-Allow-Methods";
        const string AccessControlAllowHeaders = "Access-Control-Allow-Headers";

        //private static UserState _userState;

        public KubeAPIDialog()
            : base(nameof(KubeAPIDialog))
        {
            //_userState = userState;

            AddDialog(new TextPrompt(nameof(TextPrompt)));
            AddDialog(new NumberPrompt<int>(nameof(NumberPrompt<int>)));

            AddDialog(new ReviewSelectionDialog());

            AddDialog(new WaterfallDialog(nameof(WaterfallDialog), new WaterfallStep[]
            {
                TokenAsync,
                APIServerAysnc,
                AccessKubeAPIData
            }));

            InitialDialogId = nameof(WaterfallDialog);
        }

        private static async Task<DialogTurnResult> TokenAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            var userProfile = (UserProfile)stepContext.Options;
            var existingToken = userProfile.KubeAPIToken;
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
            if (profile.KubeAPIToken == null)
            {
                var promptOptions = new PromptOptions { Prompt = MessageFactory.Text("Please enter your kube api token.") };

                // Ask the user to enter their token.
                return await stepContext.PromptAsync(nameof(TextPrompt), promptOptions, cancellationToken);
            }
            else
            {
                return await stepContext.NextAsync(profile.KubeAPIToken, cancellationToken);
            }

        }

        private async Task<DialogTurnResult> APIServerAysnc(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            // Set the user's token to what they entered in response to the name prompt.
            var userProfile = (UserProfile)stepContext.Values[UserInfo];
            userProfile.KubeAPIToken = (string)stepContext.Result;
            if(userProfile.APIServer == null)
            {
                var promptOptions = new PromptOptions { Prompt = MessageFactory.Text("Please enter your api server url") };

                // Ask the user to enter their cluster id.
                return await stepContext.PromptAsync(nameof(TextPrompt), promptOptions, cancellationToken);
            }
            else
            {
                return await stepContext.NextAsync(userProfile.APIServer, cancellationToken);

            }



        }


        private async Task<DialogTurnResult> AccessKubeAPIData(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {

            var userProfile = (UserProfile)stepContext.Values[UserInfo];
            userProfile.APIServer = (string)stepContext.Result;
            string apiServerAddr = userProfile.APIServer;

            HttpClient client = new HttpClient();
            string tokenValue = "Bearer " + userProfile.KubeAPIToken;
            client.DefaultRequestHeaders.Add("Authorization", tokenValue);
            

            var proxyUri = "https://aks-kubeapi-proxy-prod.trafficmanager.net/api/clusterApiProxy";


            var query = "{\"kubeCertificateEncoded\" : \"" + userProfile.KubeCert + "\"}";
            var queryContent = new StringContent(query, Encoding.UTF8, "application/json");
            var daemonsetStatus = "Unable to get daemonset information";
            if (userProfile.KubeCert == null)
            {
                var proxyuri = apiServerAddr + apiServerAddr + "/apis/apps/v1/namespaces/kube-system/daemonsets?limit=500";
                var daemonsetResponseProxy = await client.GetAsync(proxyuri);
                if (daemonsetResponseProxy.IsSuccessStatusCode)
                {
                    var daemonsetResponseString = await daemonsetResponseProxy.Content.ReadAsStringAsync();
                    dynamic daemonsetResponseJson = JsonConvert.DeserializeObject(daemonsetResponseString);
                    var items = daemonsetResponseJson.items;
                    for (var i = 0; i < items.Count; ++i)
                    {
                        if (items[i].metadata.name == "omsagent")
                        {
                            var desired = items[i].status.desiredNumberScheduled;
                            var current = items[i].status.currentNumberScheduled;
                            var ready = items[i].status.numberReady;
                            if (desired == current && desired == ready)
                            {
                                daemonsetStatus = "All desired daemonsets are ready and scheduled";
                            }
                            else
                            {
                                daemonsetStatus = "Only " + current + " are scheduled but " + desired + " were desired";
                            }
                        }
                    }
                }
                else
                {
                    var daemonseturi = proxyUri + "?query=" + HttpUtility.UrlEncode(apiServerAddr + "/apis/apps/v1/namespaces/kube-system/daemonsets?limit=500");
                    var daemonsetResponse = await client.PostAsync(daemonseturi, queryContent);
                    if (daemonsetResponse.IsSuccessStatusCode)
                    {
                        var daemonsetResponseString = await daemonsetResponse.Content.ReadAsStringAsync();
                        dynamic daemonsetResponseJson = JsonConvert.DeserializeObject(daemonsetResponseString);
                        var items = daemonsetResponseJson.items;
                        for (var i = 0; i < items.Count; ++i)
                        {
                            if (items[i].metadata.name == "omsagent")
                            {
                                var desired = items[i].status.desiredNumberScheduled;
                                var current = items[i].status.currentNumberScheduled;
                                var ready = items[i].status.numberReady;
                                if (desired == current && desired == ready)
                                {
                                    daemonsetStatus = "All desired daemonsets are ready and scheduled";
                                }
                                else
                                {
                                    daemonsetStatus = "Only " + current + " are scheduled but " + desired + " were desired";
                                }
                            }
                        }
                    }
                }
            }

           

            
            var deploymenturi = proxyUri + "?query=" + HttpUtility.UrlEncode(apiServerAddr + "/apis/apps/v1/namespaces/kube-system/deployments/omsagent-rs");
            var deploymentResponse = await client.PostAsync(deploymenturi, queryContent);
            var responseString = await deploymentResponse.Content.ReadAsStringAsync();
            dynamic responseJson = JsonConvert.DeserializeObject(responseString);
            string deploymentInfo = "";

            string agentVersion = "not found";
            if (!deploymentResponse.IsSuccessStatusCode)
            {
                if(responseString.Contains("timeout"))
                {
                    await stepContext.Context.SendActivityAsync("kube api server timed out");

                    return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
                }
                var status = responseJson.status;
                var message = responseJson.message;
                deploymentInfo = responseJson.message.reason;
                await stepContext.Context.SendActivityAsync("uri " + deploymenturi);
                await stepContext.Context.SendActivityAsync("status " + status);
            }
            else
            {
                string replicas = responseJson.status.replicas;
                string readyReplicas = responseJson.status.readyReplicas;
                deploymentInfo = readyReplicas + "/" + replicas;
                string image = responseJson.spec.template.spec.containers[0].image;
                agentVersion = image.Substring(image.IndexOf(":") + 1);
            }

            

            var podsuri = proxyUri + "?query=" + HttpUtility.UrlEncode(apiServerAddr + "/api/v1/namespaces/kube-system/pods?limit=500");
            var podsResponse = await client.PostAsync(podsuri, queryContent);
            var podsString = await podsResponse.Content.ReadAsStringAsync();
            dynamic podInfo = JsonConvert.DeserializeObject(podsString);
            dynamic podArray = podInfo.items;
            List<string> pods = new List<string>();
            List<string> podErrors = new List<string>();
            var workspaceStatus = "";
            var podErrorsString = "";
            if (podArray.Count > 0)
            {
                for (int i = 0; i < podArray.Count; ++i)
                {
                    string podName = podArray[i].metadata.name;
                    if(podName.Contains("omsagent"))
                    {
                       pods.Add(podName);
                        string podError = "";

                        podError += "\"" + podName + "\", \"Status:   " + podArray[i].status.phase + "\"";
                        bool errorFound = false;
                    
                    var conditions = podArray[i].status.conditions;

/*                    for(int j = 0; j < conditions.Count; ++j)
                    {
                        string status = conditions[j].status;
                        if (status.Contains("False"))
                        {
                            podError = podName + ": " + conditions[j].type + ": " + conditions[j].status + " Message: " + conditions[j].message + " ";
                                if(podErrorsString != "")
                                {
                                    podErrorsString += ", ";
                                }
                                podErrorsString += "\"Container " + podName + "\", \"Status:   " + podArray[i].status.phase + "\"";

                                errorFound = true;
                            podError += "\n\n";

                            }
                     }*/
                    var containerStatuses = podArray[i].status.containerStatuses;
                        for (int j = 0; j < containerStatuses.Count; ++j)
                        {
                            var restartCount = containerStatuses[j].restartCount;
   
                            var state = containerStatuses[j].state;
                            if (podError != "")
                            {
                                podError += ", ";
                            }
                            podError += "\"Container " + containerStatuses[j].name + "\"";

                            if (state.waiting != null)
                            {
                                errorFound = true;
                                if (podError != "")
                                {
                                    podError += ", ";
                                }
                                podError += "\"State:   Waiting\", \"Reason:   " + state.waiting.reason + "\"";

                            }
                            var lastState = containerStatuses[j].lastState;
                            if (lastState != null)
                            {
                                if (lastState.running == null)
                                {
                                    if (lastState.terminated != null)
                                    {
                                        var reason = lastState.terminated.reason;
                                        if (podError != "")
                                        {
                                            podError += ", ";
                                        }
                                        podError += "\"Last State:   Terminated\", \"Reason:   " + reason + "\"";
                                        errorFound = true;
                                    }
                                }
                            }
                            if (podError != "")
                            {
                                podError += ", ";
                            }
                            podError += "\"Restart Count:   " + restartCount + "\"";

                        }
                        var logsuri = proxyUri + "?query=" + HttpUtility.UrlEncode(apiServerAddr + "/api/v1/namespaces/kube-system/pods/" + podName + "/log");
                        var logsResponse = await client.PostAsync(logsuri, queryContent);
                        var logsResponseString = await logsResponse.Content.ReadAsStringAsync();
                        if(logsResponseString.Contains("Onboarding success") && !logsResponseString.Contains("conf/omsadmin.conf: No such file or directory")) {
                            workspaceStatus = "Onboarded";
                        }
                         else if(logsResponseString.Contains("getaddrinfo: Name or service not known"))
                        {
                            workspaceStatus = "oms-agent is failing to talk to oms-agent-rs service";
                        }
                         else if(logsResponseString.Contains("Workspace might be deleted.") || logsResponseString.Contains("No Workspace"))
                        {
                            workspaceStatus = "oms-agent appears to have no workspace";
                        }
                         else if(logsResponseString.Contains("Error resolving host during the onboarding request."))
                        {
                            workspaceStatus = "oms-agent failed to resolve host during onboarding request";
                        }
                         else if(logsResponseString.Contains("InvalidWorkspaceKey"))
                        {
                            workspaceStatus = "oms-agent has an invalid workspace key";
                        }
                         else if(logsResponseString.Contains("Reason: ClockSkew"))
                        {
                            workspaceStatus = "oms-agent had errors onboarding due to ClockSkew";
                        }
                        /*HttpClient kubeEventsClient = new HttpClient();
                        kubeEventsClient.DefaultRequestHeaders.Add("Authorization", userProfile.Token);
                        var id = userProfile.WorkspaceId;
                        if (id == null)
                        {
                            var idResponse = await client.GetStringAsync("https://management.azure.com" + userProfile.ClusterId + "?api-version=2020-03-01");
                            var myJsonObject = JsonConvert.DeserializeObject<MyJsonType>(idResponse);
                            id = myJsonObject.Properties.AddonProfiles.Omsagent.Config.LogAnalyticsWorkspaceResourceID;
                        }

                        //post request
                        var postLoc = "https://management.azure.com" + id + "/query?api-version=2017-10-01";
                        var kubeEventsQuery = "{\"query\":\"set query_take_max_records = 1001; set truncationmaxsize = 67108864; let endDateTime = now(); let startDateTime = ago(30m); let trendBinSize = 1m; KubeEvents | where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | where Name == \\\"" + podName + "\\\" | summarize count() by Reason, ObjectKind\",\"workspaceFilters\":{ \"regions\":[]}}";
                        var kubeEventContent = new StringContent(kubeEventsQuery, Encoding.UTF8, "application/json");
                        var kubeEventResponse = await kubeEventsClient.PostAsync(postLoc, kubeEventContent);
                        var kubeEventResponseString = await kubeEventResponse.Content.ReadAsStringAsync();
                        dynamic kubeEventObj = JsonConvert.DeserializeObject(kubeEventResponseString);
                        var kubeEvents = "There are no recent KubeEvents related to this pod";

                        if (kubeEventObj != null)
                        {
                            //await stepContext.Context.SendActivityAsync(kubeEventObj.ToString());

                            //var kubeEventData = kubeEventObj.tables[0].rows;
                            

                            *//*if (kubeEventData.Count > 0)
                            {
                                kubeEvents = "KubeEvents: ";
                                kubeEvents += "\n\n";

                                for (int k = 0; k < kubeEventData.Count; ++k)
                                {
                                    String count = kubeEventData[k][2] > 1 ? "counts" : "count";
                                    String verb = kubeEventData[k][2] > 1 ? "are" : "is";
                                    kubeEvents += "There " + verb + " " + kubeEventData[k][2] + " " + count + " of " + kubeEventData[k][0] + " for type " + kubeEventData[k][1] + ".";
                                    kubeEvents += "\n\n";
                                    errorFound = true;
                                }
                            }*//*
                        }
                        podError += kubeEvents;*/
                        if (errorFound)
                        {
                            if (podErrorsString != "")
                            {
                                podErrorsString += ", ";
                            }
                            podErrorsString += podError;
                        }
                        
                        
                    }
                                       
                }
                
                if(podErrorsString == "")
                {
                    podErrorsString = "\"All omsagent pods are running and healthy\"";
                }
               
                
            }
            string troubleshootingJson = "{\"Name\": \"Agent Troubleshooting\", \"Agent Version: \" : \"" + agentVersion + "\", \"Ready Replicas: \" : \"" + deploymentInfo + "\", \"Daemonset Status: \" : \"" + daemonsetStatus + "\", \"Workspace Status: \" : \"" + workspaceStatus + "\", \"Omsagent Pods Errors\" : ["  + podErrorsString + "]}";
            await stepContext.Context.SendActivityAsync(troubleshootingJson);

            return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
        }


    }
}