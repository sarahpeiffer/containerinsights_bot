// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.


using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Recognizers.Text.DataTypes.TimexExpression;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Microsoft.BotBuilderSamples
{
    public class ClusterDialog : ComponentDialog
    {
        // Define a "done" response for the company selection prompt.
        private const string DoneOption = "done";

        // Define value names for values tracked inside the dialogs.
        private const string UserInfo = "value-userInfo";

        public ClusterDialog()
            : base(nameof(ClusterDialog))
        {

            AddDialog(new TextPrompt(nameof(TextPrompt)));

            AddDialog(new WaterfallDialog(nameof(WaterfallDialog), new WaterfallStep[]
            {
                TokenAsync,
                CluserIdAync,
                AccessClusterData
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
        

        private async Task<DialogTurnResult> AccessClusterData(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {

            var userProfile = (UserProfile)stepContext.Values[UserInfo];
            var token = userProfile.Token;
            var clusterId = (string)stepContext.Result;
            var id = userProfile.WorkspaceId;
            userProfile.ClusterId = clusterId;
            var timeRange = (userProfile.TimeRange != "") ? userProfile.TimeRange : "30m";

            await stepContext.Context.SendActivityAsync("Gathering cluster diagnostic information from the past " + timeRange + " now.  This may take a few seconds. To change the time range select the Time Range for Diagnostics shortcut");

            ClusterQueryHandler clusterHandler = new ClusterQueryHandler(token, clusterId, id, timeRange);

            string statusString = await clusterHandler.nodeStatusAsync();
            if(statusString == "")
            {
                await stepContext.Context.SendActivityAsync("Something went wrong");
                return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
            }

            string nodesString = "";
            nodesString = await clusterHandler.nodeEventsAsync(nodesString);
            nodesString = await clusterHandler.highNodeCPUAsync(nodesString);
            nodesString = await clusterHandler.highNodeMemoryAsync(nodesString);


            dynamic cpuObj = await clusterHandler.clusterCPU();
            var cpu = cpuObj.tables[0].rows;
            double cpuU = (double)cpu[0][1];
            double cpuM = (double)cpu[0][2];
            var cpuUsage = Math.Round(cpuU, 2);
            var cpuMax = Math.Round(cpuM, 2);

            dynamic memoryObj = await clusterHandler.clusterMemory();
            var memory = memoryObj.tables[0].rows;
            double memoryU = (double)memory[0][1];
            double memoryM = (double)memory[0][2];
            var memoryUsage = Math.Round(memoryU, 2);
            var memoryMax = Math.Round(memoryM, 2);

            if (nodesString == "")
            {
                nodesString = "\"No issues were detected for nodes on this cluster\"";
            }

                string jsonForUX = "{\"Name\" : \"Cluster Overview\", \"Node Count\" : [" + statusString + "], \"Avg Node CPU Usage:\" : \"" + cpuUsage + "%\", \"Max Node CPU Usage:\" : \"" + cpuMax + "%\", \"Avg Node Memory Usage:\" : \"" + memoryUsage + "%\", \"Max Node Memory Usage:\" : \"" + memoryMax + "%\", \"Issues detected on Nodes\" : [" + nodesString + "]}";


            await stepContext.Context.SendActivityAsync(jsonForUX);


            return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
        }

    }
}