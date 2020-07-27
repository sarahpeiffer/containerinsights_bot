// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Bot.Builder.Dialogs;
using Newtonsoft.Json;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web;


namespace Microsoft.BotBuilderSamples
{
    public class KubeAPIDialog : ComponentDialog
    {

        // Define value names for values tracked inside the dialogs.
        private const string UserInfo = "value-userInfo";

        public KubeAPIDialog()
            : base(nameof(KubeAPIDialog))
        {

            AddDialog(new TextPrompt(nameof(TextPrompt)));


            AddDialog(new WaterfallDialog(nameof(WaterfallDialog), new WaterfallStep[]
            {
                AccessKubeAPIData
            }));

            InitialDialogId = nameof(WaterfallDialog);
        }

 

        private async Task<DialogTurnResult> AccessKubeAPIData(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            var userProfile = (UserProfile)stepContext.Options;
            stepContext.Values[UserInfo] = userProfile;

            string apiServerAddr = userProfile.APIServer;

            HttpClient client = new HttpClient();
            string tokenValue = "Bearer " + userProfile.KubeAPIToken;
            client.DefaultRequestHeaders.Add("Authorization", tokenValue);
            

            var proxyUri = "https://aks-kubeapi-proxy-prod.trafficmanager.net/api/clusterApiProxy";
            AgentTroubleshootingHandler agentTroubleshootingHandler = null;

            if (userProfile.KubeCert == null)
            {
                agentTroubleshootingHandler = new AgentTroubleshootingAKS(userProfile.KubeAPIToken, userProfile.APIServer, userProfile.KubeCert);
            }
            else
            {
                agentTroubleshootingHandler = new AgentTroubleshootingCI(userProfile.KubeAPIToken, userProfile.APIServer, userProfile.KubeCert);
            }


            var query = "{\"kubeCertificateEncoded\" : \"" + userProfile.KubeCert + "\"}";
            var queryContent = new StringContent(query, Encoding.UTF8, "application/json");
            var daemonsetStatus = await agentTroubleshootingHandler.daemonsetAsync();

            var responseString = "";
            HttpResponseMessage deploymentResponse = null;
            if(userProfile.KubeCert == null)
            {
                var deploymenturi = apiServerAddr + "/apis/apps/v1/namespaces/kube-system/deployments/omsagent-rs";
                deploymentResponse = await client.GetAsync(deploymenturi);
            }
            else
            {
                var deploymenturi = proxyUri + "?query=" + HttpUtility.UrlEncode(apiServerAddr + "/apis/apps/v1/namespaces/kube-system/deployments/omsagent-rs");
                deploymentResponse = await client.PostAsync(deploymenturi, queryContent);
            }
            responseString = await deploymentResponse.Content.ReadAsStringAsync();
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


            var podErrorsString = await agentTroubleshootingHandler.podErrorsAsyc();

            var workspaceStatus = await agentTroubleshootingHandler.workspaceStatusAsync();



            string troubleshootingJson = "{\"Name\": \"Agent Troubleshooting\", \"Agent Version: \" : \"" + agentVersion + "\", \"Ready Replicas: \" : \"" + deploymentInfo + "\", \"Daemonset Status: \" : \"" + daemonsetStatus + "\", \"Workspace Status: \" : \"" + workspaceStatus + "\", \"Omsagent Pods Errors\" : ["  + podErrorsString + "]}";
            await stepContext.Context.SendActivityAsync(troubleshootingJson);

            return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
        }


    }
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
