using Microsoft.Bot.Builder.Dialogs.Declarative.Resources;
using Microsoft.Bot.Schema;
using Newtonsoft.Json;
using System.Linq.Expressions;
using System.Net.Http;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;

namespace Microsoft.BotBuilderSamples
{
    public class AgentTroubleshootingCI : AgentTroubleshootingHandler
    {
        HttpClient kubeClient;
        string podName;
        string kubeToken;
        string apiServer;
        string kubeCert;
        StringContent queryContent;
        string proxyUri = "https://aks-kubeapi-proxy-prod.trafficmanager.net/api/clusterApiProxy";



        public AgentTroubleshootingCI(string kubeToken, string apiServer, string kubeCert)
        {
            this.kubeToken = kubeToken;
            this.apiServer = apiServer;
            this.kubeCert = kubeCert;
            this.kubeClient = new HttpClient();
            kubeClient.DefaultRequestHeaders.Add("Authorization", "Bearer " + this.kubeToken);
            var query = "{\"kubeCertificateEncoded\" : \"" + kubeCert + "\"}";
            queryContent = new StringContent(query, Encoding.UTF8, "application/json");

        }



        public async Task<string> daemonsetAsync()
        {
            var daemonsetStatus = "Unable to get daemonset information";
            var daemonseturi = proxyUri + "?query=" + HttpUtility.UrlEncode(apiServer + "/apis/apps/v1/namespaces/kube-system/daemonsets?limit=500");
            var daemonsetResponse = await kubeClient.PostAsync(daemonseturi, queryContent);
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
            return daemonsetStatus;
        }

        public async Task<string> podErrorsAsyc()
        {
            var podsuri = proxyUri + "?query=" + HttpUtility.UrlEncode(apiServer + "/api/v1/namespaces/kube-system/pods?limit=500");
            var podsResponse = await kubeClient.PostAsync(podsuri, queryContent);
            var podsString = await podsResponse.Content.ReadAsStringAsync();
            dynamic podInfo = JsonConvert.DeserializeObject(podsString);
            dynamic podArray = podInfo.items;
            var podErrorsString = "";
          
            if (podArray.Count > 0)
            {
                for (int i = 0; i < podArray.Count; ++i)
                {
                    string podName = podArray[i].metadata.name;
                    if (podName.Contains("omsagent"))
                    {
                        this.podName = podName;
                        bool errorFound = false;

                        //get warning events
                            var eventsuri = proxyUri + "?query=" + HttpUtility.UrlEncode(apiServer + "/api/v1/namespaces/kube-system/events?fieldSelector=type=Warning&name=" + podName);
                            var eventsReponse = await kubeClient.PostAsync(eventsuri, queryContent);
                            var eventsString = await eventsReponse.Content.ReadAsStringAsync();
                            dynamic events = JsonConvert.DeserializeObject(eventsString);
                            var podEvents = "";
                        if (events != null)
                        {
                            var eventItems = events.items;
                            if (eventItems != null)
                            {
                                for (int k = 0; k < eventItems.Count; ++k)
                                {
                                    if (eventItems[k].message != null)
                                    {
                                        errorFound = true;
                                        var message = eventItems[k].message;
                                        if (podEvents != "")
                                        {
                                            podEvents += ", ";
                                        }
                                        podEvents += "\"" + message + "\"";
                                    }

                                }
                            }

                        }
                        var conditionErrors = "";
                        if (podArray[i].status.ToString().Contains("conditions"))
                        {
                            if (podArray[i].status.conditions != null)
                            {
                                var conditions = podArray[i].status.conditions;
                                for (int j = 0; j < conditions.Count; ++j)
                                {
                                    string conditionStatus = conditions[j].status;
                                    if (conditionStatus.Contains("False"))
                                    {
                                        if (conditionErrors != "")
                                        {
                                            conditionErrors += ", ";
                                        }
                                        conditionErrors += "\"" + conditions[j].type + ":  " + conditions[j].status + "\"";
                                        conditionErrors += ", \"     " + conditions[j].message + "\"";
                                        errorFound = true;
                                    }
                                }
                            }
                        }
                        var containerErrors = "";
                        if (podArray[i].status.containerStatuses != null)
                        {

                            var containerStatuses = podArray[i].status.containerStatuses;
                            var restartCount = "";
                            var containerName = "";
                            var state = "";
                            var stateReason = "";
                            var lastState = "";
                            var lastStateReason = "";
                            var lastStateExitCode = "";
                            var lastStateMessage = "";
                            for (int j = 0; j < containerStatuses.Count; ++j)
                            {
                                restartCount = containerStatuses[j].restartCount;
                                containerName = containerStatuses[j].name;
                                var stateElement = containerStatuses[j].state;
                                if (stateElement.waiting != null)
                                {
                                    state = "Waiting";
                                    stateReason = "\"Reason:   " + stateElement.waiting.reason + "\", ";
                                    errorFound = true;
                                }
                                if (stateElement.running != null)
                                {
                                    state = "Running";
                                    errorFound = false;
                                }
                                var lastStateElement = containerStatuses[j].lastState;
                                if (lastStateElement != null)
                                {
                                    if (lastStateElement.terminated != null)
                                    {
                                        lastState = "\"Last State:   Terminated\", ";
                                        Newtonsoft.Json.Linq.JObject terminated = lastStateElement.terminated;
                                        lastStateReason = "\"-Reason:   " + lastStateElement.terminated.reason + "\", ";
                                        if (lastStateElement.terminated.message != null)
                                        {
                                            string terminatedMessage = Regex.Replace((string)lastStateElement.terminated.message, @"\t|\n|\r", "");
                                            terminatedMessage = Regex.Replace(terminatedMessage, "\"", "");
                                            terminatedMessage = Regex.Replace(terminatedMessage, "\\\\", "");
                                            lastStateMessage = "\"-Message:   " + terminatedMessage + "\", ";
                                        }
                                        lastStateExitCode = "\"-Exit Code:   " + lastStateElement.terminated.exitCode + "\", ";
                                        errorFound = true;
                                    }
                                }
                                
                                }


                                if (containerErrors != "")
                                {
                                    containerErrors += ", ";
                                }
                                var containerErrorTest = "\"Container Name:   " + containerName + "\", \"State:   " + state + "\", " + stateReason + lastState + lastStateReason + lastStateMessage + lastStateExitCode + "\"RestartCount:   " + restartCount + "\"";
                                containerErrors += containerErrorTest;
                            
                        }
                        
                        if (errorFound)
                        {
                            if (podErrorsString != "")
                            {
                                podErrorsString += ", ";
                            }
                            podErrorsString += "\"" + podName + "\" : [" + conditionErrors + containerErrors + "]";
                            if (podEvents != "")
                            {
                                podErrorsString += ", \"Kube Events on " + podName + "\" : [" + podEvents + "]";
                            }
                        }

                    }

                }
            }
            else
            {
                podErrorsString = "There are no omsagent pods detected.";
            }
            return podErrorsString;
        }

        public async Task<string> workspaceStatusAsync()
        {
            string workspaceStatus = "Unable to access workspace information";
            var logsuri = proxyUri + "?query=" + HttpUtility.UrlEncode(apiServer + "/api/v1/namespaces/kube-system/pods/" + podName + "/log");
            var logsResponse = await kubeClient.PostAsync(logsuri, queryContent);
            var logsResponseString = await logsResponse.Content.ReadAsStringAsync();
            if (logsResponseString.Contains("Onboarding success") && !logsResponseString.Contains("conf/omsadmin.conf: No such file or directory"))
            {
                workspaceStatus = "Onboarded";
            }
            else if (logsResponseString.Contains("getaddrinfo: Name or service not known"))
            {
                workspaceStatus = "oms-agent is failing to talk to oms-agent-rs service";
            }
            else if (logsResponseString.Contains("Workspace might be deleted.") || logsResponseString.Contains("No Workspace"))
            {
                workspaceStatus = "oms-agent appears to have no workspace";
            }
            else if (logsResponseString.Contains("Error resolving host during the onboarding request."))
            {
                workspaceStatus = "oms-agent failed to resolve host during onboarding request";
            }
            else if (logsResponseString.Contains("InvalidWorkspaceKey"))
            {
                workspaceStatus = "oms-agent has an invalid workspace key";
            }
            else if (logsResponseString.Contains("Reason: ClockSkew"))
            {
                workspaceStatus = "oms-agent had errors onboarding due to ClockSkew";
            }
            return workspaceStatus;
        }





    }
}
