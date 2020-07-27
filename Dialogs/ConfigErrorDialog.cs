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

            AddDialog(new TextPrompt(nameof(TextPrompt)));

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

            //post request
            var postLoc = "https://management.azure.com" + id + "/query?api-version=2017-10-01";
            var errorQuery = "{\"query\":\"set query_take_max_records = 1; set truncationmaxsize = 67108864;let endDateTime = now();let startDateTime = ago(" + timeRange + ");let trendBinSize = 1m;KubeMonAgentEvents| where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | where ClusterId == \\\"" + clusterId + "\\\" | where Message != \\\"No errors\\\"| summarize count() by Message, Category\",\"workspaceFilters\":{\"regions\":[]}}";
            var errorContent = new StringContent(errorQuery, Encoding.UTF8, "application/json");
            var errorResponse = await client.PostAsync(postLoc, errorContent);
            var errorResponseString = await errorResponse.Content.ReadAsStringAsync();
            dynamic errorObj = JsonConvert.DeserializeObject(errorResponseString);
            var errorLogData = errorObj.tables[0].rows;
            var errorLogs = "There are no recent configuration errors related to this cluster";
            if (errorLogData.Count > 0)
            {
                errorLogs = "";
                for (int i = 0; i < errorLogData.Count; ++i)
                {
                    string count = errorLogData[i][2] > 1 ? "counts" : "count";
                    string verb = errorLogData[i][2] > 1 ? "are" : "is";
                    errorLogs += "There " + verb + " " + errorLogData[i][2] + " " + count + " of " + errorLogData[i][0] + " for category " + errorLogData[i][1] + ".";
                }
            }

            string jsonForUX = "{\"Name\": \"Configuration Errors\", \"Errors\" : \"" + errorLogs + "\"}";
            await stepContext.Context.SendActivityAsync(jsonForUX);


            return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
        }


    }
}