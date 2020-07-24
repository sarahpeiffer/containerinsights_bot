// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Newtonsoft.Json;
using System;
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
            //_userState = userState;

            AddDialog(new TextPrompt(nameof(TextPrompt)));
            AddDialog(new NumberPrompt<int>(nameof(NumberPrompt<int>)));

            AddDialog(new ReviewSelectionDialog());

            AddDialog(new WaterfallDialog(nameof(WaterfallDialog), new WaterfallStep[]
            {
                TokenAsync,
                CluserIdAync,
                AccessErrorData
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
        private async Task<DialogTurnResult> AccessErrorData(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            var userProfile = (UserProfile)stepContext.Values[UserInfo];
            userProfile.ClusterId = (string)stepContext.Result;
            var token = userProfile.Token;
            var clusterId = userProfile.ClusterId;
            var timeRange = (userProfile.TimeRange != "") ? userProfile.TimeRange : "30m";
            //get request
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