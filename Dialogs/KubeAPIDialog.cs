// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Schema;
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

            if(userProfile.APIServer == null)
            {
                await stepContext.Context.SendActivityAsync("Unable to get KubeConfig information to access live data");
                return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
            }

            await stepContext.Context.SendActivityAsync(new Activity { Type = ActivityTypes.Event, Value = "typing" });
            await stepContext.Context.SendActivityAsync(new Activity { Type = ActivityTypes.Typing });

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
                if(responseJson != null)
                {
                    var status = responseJson.status;
                    var message = responseJson.message;
                    deploymentInfo = responseJson.message.reason;
                    await stepContext.Context.SendActivityAsync("status " + status);
                }
                else
                {
                    await stepContext.Context.SendActivityAsync("Could not access the Kube API server");
                }
                return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
            }
            else
            {
                string replicas = responseJson.status.replicas;
                string readyReplicas = responseJson.status.readyReplicas;
                if(readyReplicas == null)
                {
                    readyReplicas = "0";
                }
                deploymentInfo = readyReplicas + "/" + replicas;
                string image = responseJson.spec.template.spec.containers[0].image;
                agentVersion = image.Substring(image.IndexOf(":") + 1);

            }


            var podErrorsString = await agentTroubleshootingHandler.podErrorsAsyc();
            if(podErrorsString == "")
            {
                podErrorsString = ", \"Omsagent Pod Errors\" : \"All omsagent pods are running and healthy\"";
            }
            else
            {
                podErrorsString = ", \"Omsagent Pods Errors\" : \"\", " + podErrorsString;
            }

            var workspaceStatus = await agentTroubleshootingHandler.workspaceStatusAsync();


            string troubleshootingJson = "{\"Name\": \"Agent Troubleshooting\", \"Agent Version: \" : \"" + agentVersion + "\", \"Ready Replicas: \" : \"" + deploymentInfo + "\", \"Daemonset Status: \" : \"" + daemonsetStatus + "\", \"Workspace Status: \" : \"" + workspaceStatus + "\"" + podErrorsString + "}";
            await stepContext.Context.SendActivityAsync(troubleshootingJson);

            return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
        }


    }
}
