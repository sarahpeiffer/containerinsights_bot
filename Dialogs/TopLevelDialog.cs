// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Newtonsoft.Json;

namespace Microsoft.BotBuilderSamples
{
    public class TopLevelDialog : ComponentDialog
    {
        // Define a "done" response for the company selection prompt.
        private const string DoneOption = "done";

        // Define value names for values tracked inside the dialogs.
        private const string UserInfo = "value-userInfo";

        //private static UserState _userState;

        public TopLevelDialog()
            : base(nameof(TopLevelDialog))
        {
            //_userState = userState;

            AddDialog(new TextPrompt(nameof(TextPrompt)));
            AddDialog(new NumberPrompt<int>(nameof(NumberPrompt<int>)));

            AddDialog(new ReviewSelectionDialog());

            AddDialog(new WaterfallDialog(nameof(WaterfallDialog), new WaterfallStep[]
            {
                TokenAsync,
                CluserIdAync,
                NodeNameAsync,
                AccessNodeData
            }));

            InitialDialogId = nameof(WaterfallDialog);
        }

        private static async Task<DialogTurnResult> TokenAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            var userProfile = (UserProfile)stepContext.Options;
            var existingToken = userProfile.Token;
            if(existingToken != null)
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
            if(userProfile.ClusterId == null)
            {
                var promptOptions = new PromptOptions { Prompt = MessageFactory.Text("Please enter your cluster id.") };

                // Ask the user to enter their cluster id.
                return await stepContext.PromptAsync(nameof(TextPrompt), promptOptions, cancellationToken);
            }
            else
            {
                return await stepContext.NextAsync(userProfile.ClusterId, cancellationToken);

            }
            
        }
        private async Task<DialogTurnResult> NodeNameAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            // Set the user's id to what they entered in response to the name prompt.
            var userProfile = (UserProfile)stepContext.Values[UserInfo];
            userProfile.ClusterId = (string)stepContext.Result;

            var promptOptions = new PromptOptions { Prompt = MessageFactory.Text("Please enter your node name.") };

            // Ask the user to enter their node name id.
            return await stepContext.PromptAsync(nameof(TextPrompt), promptOptions, cancellationToken);
        }

        private async Task<DialogTurnResult> AccessNodeData(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            var userProfile = (UserProfile)stepContext.Values[UserInfo];
            var token = userProfile.Token;
            var clusterId = userProfile.ClusterId;
            var nodeName = (string)stepContext.Result;

            //get request
            HttpClient client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var responseString = await client.GetStringAsync("https://management.azure.com/" + clusterId + "?api-version=2020-03-01");
            var myJsonObject = JsonConvert.DeserializeObject<MyJsonType>(responseString);
            var id = myJsonObject.Properties.AddonProfiles.Omsagent.Config.LogAnalyticsWorkspaceResourceID;

            //post request
            var postLoc = "https://management.azure.com" + id + "/query?api-version=2017-10-01";
            var jsonquery = "{\"query\":\"set query_take_max_records = 1; set truncationmaxsize = 67108864;let endDateTime = now();let startDateTime = ago(30m);let trendBinSize = 1m; KubeNodeInventory | where Computer == \\\"" + nodeName + "\\\" | where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | summarize TotalCount = count(), ReadyCount = sumif(1, Status contains ('Ready')) by ClusterName, Computer,  bin(TimeGenerated, trendBinSize) | extend NotReadyCount = TotalCount - ReadyCount | limit 1 \",\"workspaceFilters\":{\"regions\":[]}}";
            var content = new StringContent(jsonquery, Encoding.UTF8, "application/json");
            var response = await client.PostAsync(postLoc, content);
            var postResponseString = await response.Content.ReadAsStringAsync();
            //var readyStatus = JsonConvert.DeserializeObject<ReadyJson>(postResponseString);
            dynamic obj = Newtonsoft.Json.JsonConvert.DeserializeObject(postResponseString);
            var node_info = obj.tables[0].rows[0];
            if(node_info[4] == 1)
            {
                await stepContext.Context.SendActivityAsync(MessageFactory.Text($"The node {node_info[1]} indicates a ready status"), cancellationToken);
            }
            else
            {
                await stepContext.Context.SendActivityAsync(MessageFactory.Text($"The node {node_info[1]} does not indicate a ready status"), cancellationToken);
            }


            // Ask the user to enter their node name id.
            return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
        }

       /* private async Task<DialogTurnResult> StartSelectionStepAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            // Set the user's age to what they entered in response to the age prompt.
            var userProfile = (UserProfile)stepContext.Values[UserInfo];
            userProfile.Age = (int)stepContext.Result;

            if (userProfile.Age < 25)
            {
                // If they are too young, skip the review selection dialog, and pass an empty list to the next step.
                await stepContext.Context.SendActivityAsync(
                    MessageFactory.Text("You must be 25 or older to participate."),
                    cancellationToken);
                return await stepContext.NextAsync(new List<string>(), cancellationToken);
            }
            else
            {
                // Otherwise, start the review selection dialog.
                return await stepContext.BeginDialogAsync(nameof(ReviewSelectionDialog), null, cancellationToken);
            }
        }

        private async Task<DialogTurnResult> AcknowledgementStepAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            // Set the user's company selection to what they entered in the review-selection dialog.
            var userProfile = (UserProfile)stepContext.Values[UserInfo];
            userProfile.CompaniesToReview = stepContext.Result as List<string> ?? new List<string>();

            // Thank them for participating.
            await stepContext.Context.SendActivityAsync(
                MessageFactory.Text($"Thanks for participating, {((UserProfile)stepContext.Values[UserInfo]).Name}."),
                cancellationToken);

            // Exit the dialog, returning the collected user information.
            return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
        }*/
    }
}