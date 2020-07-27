using Microsoft.Bot.Builder.Dialogs.Declarative.Resources;
using Newtonsoft.Json;
using System.Net.Http;
using System.Text;
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
                        string podError = "";

                        podError += "\"" + podName + "\", \"Status:   " + podArray[i].status.phase + "\"";
                        bool errorFound = false;

                        var conditions = podArray[i].status.conditions;

                        for (int j = 0; j < conditions.Count; ++j)
                        {
                            string status = conditions[j].status;
                            if (status.Contains("False"))
                            {
                                podError = podName + ": " + conditions[j].type + ": " + conditions[j].status + " Message: " + conditions[j].message + " ";
                                if (podErrorsString != "")
                                {
                                    podErrorsString += ", ";
                                }
                                podErrorsString += "\"Container " + podName + "\", \"Status:   " + podArray[i].status.phase + "\"";

                                errorFound = true;
                                podError += "\n\n";

                            }
                        }
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

                if (podErrorsString == "")
                {
                    podErrorsString = "\"All omsagent pods are running and healthy\"";
                }


            }
            return podErrorsString;
        }

        public async Task<string> workspaceStatusAsync()
        {
            string workspaceStatus = "";
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
