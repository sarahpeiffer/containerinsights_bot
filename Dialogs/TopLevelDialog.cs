// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Microsoft.BotBuilderSamples
{
    public class TopLevelDialog : ComponentDialog
    {

        // Define value names for values tracked inside the dialogs.
        private const string UserInfo = "value-userInfo";

        private const string NodeName = "";


        public TopLevelDialog()
            : base(nameof(TopLevelDialog))
        {

            AddDialog(new TextPrompt(nameof(TextPrompt)));

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
        private async Task<DialogTurnResult> NodeNameAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {



            // Set the user's id to what they entered in response to the name prompt.
            var userProfile = (UserProfile)stepContext.Values[UserInfo];
            userProfile.ClusterId = (string)stepContext.Result;
            if(userProfile.ObjectType == "node" && userProfile.ObjectName != "")
            {
                return await stepContext.NextAsync(userProfile.ObjectName, cancellationToken);
            }
            var promptOptions = new PromptOptions { Prompt = MessageFactory.Text("Please enter the name of the node you would like to troubleshoot") };
            // Ask the user to enter their node name id.
            return await stepContext.PromptAsync(nameof(TextPrompt), promptOptions, cancellationToken);
        }
        private async Task<DialogTurnResult> AccessNodeData(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {


            var userProfile = (UserProfile)stepContext.Values[UserInfo];
            var token = userProfile.Token;
            var clusterId = userProfile.ClusterId;
            var nodeName = (string)stepContext.Result;
            var timeRange = (userProfile.TimeRange != "") ? userProfile.TimeRange : "30m";
            var id = userProfile.WorkspaceId;
           
            NodeQueryHandler nodeHandler = new NodeQueryHandler(nodeName, token, clusterId, id, timeRange);
            dynamic readyObj = await nodeHandler.readyQueryAsync();

           
            if (readyObj == null)
            {
                await stepContext.Context.SendActivityAsync("something went wrong");
                return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
            }
            if(readyObj.tables[0].rows[0][0] == null)
            {
                await stepContext.Context.SendActivityAsync("This node does not exist on this cluster. Please enter or select another node name");
                string nodesString = await nodeHandler.clusterNodesAsync();
                string nodesJson = "{\"Name\" : \"Cluster Nodes\", \"Nodes \" : [" + nodesString + "]}";
                await stepContext.Context.SendActivityAsync(nodesJson);
                return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
            }

            await stepContext.Context.SendActivityAsync("Gathering node diagnostic information from the past " + timeRange + " now.  This may take a few seconds. To change the time range select the Time Range for Diagnostics shortcut");

            string status = readyObj.tables[0].rows[0][2];

            dynamic diskobj = await nodeHandler.diskQueryAsync();
            double diskPercent = 0.0;
            if(diskobj != null)
            {
                var diskUsage = diskobj.tables[0].rows[0][0];
                if(diskUsage != null)
                {
                    diskPercent = (double)diskUsage;
                }
            }

            dynamic cpuobj = await nodeHandler.cpuQueryAsync();
            double cpuPercent = 0.0;
            double cpuMaxPercent = 0.0;
            if (cpuobj != null)
            {
                var cpuUsage = cpuobj.tables[0].rows[0][0];
                var cpuMax = cpuobj.tables[0].rows[0][1];
                if(cpuUsage != null)
                {
                    cpuPercent = (double)cpuUsage;
                }
                if(cpuMax != null)
                {
                    cpuMaxPercent = (double)cpuMax;
                }
            }


            dynamic memoryObj = await nodeHandler.memoryQueryAsync();
            double memoryPercent = 0.0;
            if(memoryObj != null)
            {
                var memoryUsage = memoryObj.tables[0].rows[0][0];
                if(memoryUsage != null)
                {
                    memoryPercent = (double)memoryUsage;
                }
            }

            string kubeEvents = await nodeHandler.kubeEventsQuery();

            string statusString = await nodeHandler.podQueryAsync();

            string jsonForUX = "{\"Name\" : \"" + nodeName + "\", \"Status: \" : \"" + status + "\", \"Average CPU: \" : \"" + Math.Round(cpuPercent, 2) + "%\", \"Max CPU: \" : \"" + Math.Round(cpuMaxPercent, 2) + "%\", \"Average Memory: \" : \"" + Math.Round(memoryPercent, 2) + "%\", \"Average Disk Usage: \" : \"" + Math.Round(diskPercent, 2) + "%\", \"Pod Count\" : [" + statusString + "], \"Kube Events\" : [" + kubeEvents + "]}";


            await stepContext.Context.SendActivityAsync(jsonForUX);

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