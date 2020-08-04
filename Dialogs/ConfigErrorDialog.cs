// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Bot.Builder.Dialogs;
using Newtonsoft.Json;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Microsoft.BotBuilderSamples
{
    public class ConfigErrorDialog : ComponentDialog
    {

        // Define value names for values tracked inside the dialogs.
        private const string UserInfo = "value-userInfo";

        public ConfigErrorDialog()
            : base(nameof(ConfigErrorDialog))
        {

            AddDialog(new WaterfallDialog(nameof(WaterfallDialog), new WaterfallStep[]
            {
                AccessErrorData
            }));

            InitialDialogId = nameof(WaterfallDialog);
        }


        private async Task<DialogTurnResult> AccessErrorData(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            var userProfile = (UserProfile)stepContext.Options;
            stepContext.Values[UserInfo] = userProfile;

            var token = userProfile.Token;
            var clusterId = userProfile.ClusterId;
            var timeRange = (userProfile.TimeRange != "") ? userProfile.TimeRange : "30m";
            var id = userProfile.WorkspaceId;

            HttpClient client = new HttpClient();
            client.DefaultRequestHeaders.Add("Authorization", token);

            var postLoc = "https://management.azure.com" + id + "/query?api-version=2017-10-01";
            var errorQuery = "{\"query\":\"set query_take_max_records = 1; set truncationmaxsize = 67108864;let endDateTime = now();let startDateTime = ago(" + timeRange + ");let trendBinSize = 1m;KubeMonAgentEvents| where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | where ClusterId == \\\"" + clusterId + "\\\" | where Level != \\\"Info\\\"| summarize count() by Message, Category, Computer\",\"workspaceFilters\":{\"regions\":[]}}";
            var errorContent = new StringContent(errorQuery, Encoding.UTF8, "application/json");
            var errorResponse = await client.PostAsync(postLoc, errorContent);
            var errorResponseString = await errorResponse.Content.ReadAsStringAsync();
            dynamic errorObj = JsonConvert.DeserializeObject(errorResponseString);
            var errorLogData = errorObj.tables[0].rows;
            var errorLogs = "There are no recent configuration errors related to this cluster";
            var configurationErrors = "";
            var prometheusErrors = "";
            if (errorLogData.Count > 0)
            {
                errorLogs = "";
                for (int i = 0; i < errorLogData.Count; ++i)
                {
                    string count = errorLogData[i][3] > 1 ? "counts" : "count";
                    string verb = errorLogData[i][3] > 1 ? "are" : "is";
                    if(((string)errorLogData[i][1]).Contains("configmap")) {
                        if(configurationErrors != "")
                        {
                            configurationErrors += ", ";
                        }
                        configurationErrors += "\"" + errorLogData[i][0] + " found on node " + errorLogData[i][2] + ".\"";
                    }
                    else
                    {
                        await stepContext.Context.SendActivityAsync("non config map found");
                        if (prometheusErrors != "")
                        {
                            prometheusErrors += ", ";
                        }
                        prometheusErrors += "\"" + errorLogData[i][0]  + " found on node " + errorLogData[i][2] + ".\"";
                    }
                }
            }
            if(configurationErrors != "")
            {
                configurationErrors = "\"ConfigMap Errors\" : [" + configurationErrors + "]";
            }
            if(prometheusErrors != "")
            {
                if(configurationErrors != "")
                {
                    prometheusErrors = "\"Prometheus Scraping Errors\" : [" + prometheusErrors + "]";
                }
                else
                {
                    prometheusErrors = ", \"Prometheus Scraping Errors\" : [" + prometheusErrors + "]";
                }
            }
            string jsonForUX = errorLogs;
            if (configurationErrors != "" || prometheusErrors != "")
            {
                jsonForUX = "{\"Name\": \"Configuration Errors\"," + configurationErrors + prometheusErrors + "}";
            }
            await stepContext.Context.SendActivityAsync(jsonForUX);


            return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
        }


    }
}