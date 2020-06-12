// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Builder.Dialogs.Debugging;
using Microsoft.Bot.Schema;
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
            DateTime now = DateTime.Now;
            DateTime old = now.AddHours(-24);
            // Create an object in which to collect the user's information within the dialog.
            var profile = (UserProfile)stepContext.Values[UserInfo];
            /*if (profile.Token == null)
            {*/
                var promptOptions = new PromptOptions { Prompt = MessageFactory.Text("Please enter your auth token.") };

                // Ask the user to enter their token.
                return await stepContext.PromptAsync(nameof(TextPrompt), promptOptions, cancellationToken);
            /*}
            else
            {
                return await stepContext.NextAsync(profile.Token, cancellationToken);
            }*/

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
            var readyQuery = "{\"query\":\"set query_take_max_records = 1; set truncationmaxsize = 67108864;let endDateTime = now();let startDateTime = ago(1h);let trendBinSize = 1m; KubeNodeInventory | where Computer == \\\"" + nodeName + "\\\" | where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | summarize TotalCount = count(), ReadyCount = sumif(1, Status contains ('Ready')) by ClusterName, Computer,  bin(TimeGenerated, trendBinSize) | extend NotReadyCount = TotalCount - ReadyCount | limit 1 \",\"workspaceFilters\":{\"regions\":[]}}";
            var readyContent = new StringContent(readyQuery, Encoding.UTF8, "application/json");
            var readyResponse = await client.PostAsync(postLoc, readyContent);
            var readyResponseString = await readyResponse.Content.ReadAsStringAsync();
            dynamic readyObj = JsonConvert.DeserializeObject(readyResponseString);
            var node_info = readyObj.tables[0].rows[0];

            var diskquery = "{\"query\":\"set query_take_max_records = 1; set truncationmaxsize = 67108864;let endDateTime = now();let startDateTime = ago(1h);let trendBinSize = 1m; InsightsMetrics | where TimeGenerated >= startDateTime and TimeGenerated < endDateTime | where Computer == \\\"" + nodeName + "\\\" | where Name == \\\"used_percent\\\" and Namespace == \\\"container.azm.ms/disk\\\" | summarize avg(Val) \",\"workspaceFilters\":{\"regions\":[]}}";
            var diskcontent = new StringContent(diskquery, Encoding.UTF8, "application/json");
            var diskResponse = await client.PostAsync(postLoc, diskcontent);
            var diskResponseString = await diskResponse.Content.ReadAsStringAsync();
            dynamic diskobj = JsonConvert.DeserializeObject(diskResponseString);
            var diskUsage = diskobj.tables[0].rows[0][0];
            double diskPercent = (double)diskUsage;

            var cpuquery = "{\"query\":\"set query_take_max_records = 10001; set truncationmaxsize = 67108864; let endDateTime = now(); let startDateTime = ago(1h); let trendBinSize = 1m; let capacityCounterName = \'cpuCapacityNanoCores\';let usageCounterName = \'cpuUsageNanoCores\'; Perf | where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | where ObjectName == \'K8SNode\' | where Computer == \\\"" + nodeName + "\\\" | where CounterName == capacityCounterName | summarize LimitValue = max(CounterValue) by Computer, CounterName, bin(TimeGenerated, trendBinSize) | project Computer, CapacityStartTime = TimeGenerated, CapacityEndTime = TimeGenerated + trendBinSize, LimitValue | join kind=inner hint.strategy=shuffle (Perf | where TimeGenerated < endDateTime + trendBinSize | where TimeGenerated >= startDateTime - trendBinSize | where ObjectName == \'K8SNode\' | where CounterName == usageCounterName | project Computer, UsageValue = CounterValue, TimeGenerated) on Computer | where TimeGenerated >= CapacityStartTime and TimeGenerated < CapacityEndTime | project Computer, TimeGenerated, UsagePercent = UsageValue * 100.0 / LimitValue | summarize AggregatedValue = avg(UsagePercent)\",\"workspaceFilters\":{ \"regions\":[]}}";
            var cpucontent = new StringContent(cpuquery, Encoding.UTF8, "application/json");
            var cpuResponse = await client.PostAsync(postLoc, cpucontent);
            var cpuResponseString = await cpuResponse.Content.ReadAsStringAsync();
            dynamic cpuobj = JsonConvert.DeserializeObject(cpuResponseString);
            var cpuUsage = cpuobj.tables[0].rows[0][0];
            double cpuPercent = (double)cpuUsage;

            var memoryquery = "{\"query\":\"set query_take_max_records = 10001; set truncationmaxsize = 67108864; let endDateTime = now(); let startDateTime = ago(1h); let trendBinSize = 1m; let capacityCounterName = \'memoryCapacityBytes\';let usageCounterName = \'memoryRssBytes\'; Perf | where TimeGenerated < endDateTime | where TimeGenerated >= startDateTime | where ObjectName == \'K8SNode\' | where Computer == \\\"" + nodeName + "\\\" | where CounterName == capacityCounterName | summarize LimitValue = max(CounterValue) by Computer, CounterName, bin(TimeGenerated, trendBinSize) | project Computer, CapacityStartTime = TimeGenerated, CapacityEndTime = TimeGenerated + trendBinSize, LimitValue | join kind=inner hint.strategy=shuffle (Perf | where TimeGenerated < endDateTime + trendBinSize | where TimeGenerated >= startDateTime - trendBinSize | where ObjectName == \'K8SNode\' | where CounterName == usageCounterName | project Computer, UsageValue = CounterValue, TimeGenerated) on Computer | where TimeGenerated >= CapacityStartTime and TimeGenerated < CapacityEndTime | project Computer, TimeGenerated, UsagePercent = UsageValue * 100.0 / LimitValue | summarize AggregatedValue = avg(UsagePercent)\",\"workspaceFilters\":{ \"regions\":[]}}";
            var memoryContent = new StringContent(memoryquery, Encoding.UTF8, "application/json");
            var memoryResponse = await client.PostAsync(postLoc, memoryContent);
            var memoryResponseString = await memoryResponse.Content.ReadAsStringAsync();
            dynamic memoryObj = JsonConvert.DeserializeObject(memoryResponseString);
            var memoryUsage = memoryObj.tables[0].rows[0][0];
            double memoryPercent = (double)memoryUsage;

            string ready = node_info[4] == 1 ? "Ready" : "Not Ready";
            string jsonStringForCard = "{\"type\": \"AdaptiveCard\",\"body\": [{\"type\": \"TextBlock\",\"text\": \"" + nodeName + "\",\"size\": \"medium\",\"weight\": \"Bolder\"}, {\"type\": \"FactSet\", \"facts\": [{\"title\":\"Status:\", \"value\" : \"" + ready + "\"}, {\"title\":\"CPU usage per minute:\", \"value\" : \"" + Math.Round(cpuPercent, 2) + "\"}, {\"title\":\"Memory usage per minute:\", \"value\" : \"" + Math.Round(memoryPercent, 2) + "\"}, {\"title\":\"Disk Usage per minute: \", \"value\" : \"" + Math.Round(diskPercent, 2) + "\"}]}],\"$schema\": \"http://adaptivecards.io/schemas/adaptive-card.json\",\"version\": \"1.0\"}";
            var adaptiveCardAttachment = new Attachment()
            {
                ContentType = "application/vnd.microsoft.card.adaptive",
                Content = JsonConvert.DeserializeObject(jsonStringForCard),
            };

            //await stepContext.BeginDialogAsync(nameof(TopLevelDialog), null, cancellationToken);
            await stepContext.Context.SendActivityAsync(MessageFactory.Attachment(adaptiveCardAttachment), cancellationToken);
            
            


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