// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Schema;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Microsoft.BotBuilderSamples
{
    public class NodeDialog : ComponentDialog
    {

        // Define value names for values tracked inside the dialogs.
        private const string UserInfo = "value-userInfo";

        private const string NodeName = "";


        public NodeDialog()
            : base(nameof(NodeDialog))
        {

            AddDialog(new TextPrompt(nameof(TextPrompt)));

            AddDialog(new WaterfallDialog(nameof(WaterfallDialog), new WaterfallStep[]
            {
                NodeNameAsync,
                AccessNodeData
            }));

            InitialDialogId = nameof(WaterfallDialog);
        }


        private async Task<DialogTurnResult> NodeNameAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {

            stepContext.Values[UserInfo] = (UserProfile)stepContext.Options;
            var userProfile = (UserProfile)stepContext.Values[UserInfo];
            if(userProfile.ObjectType == "node" && userProfile.ObjectName != "")
            {
                return await stepContext.NextAsync(userProfile.ObjectName, cancellationToken);
            }

            var promptOptions = new PromptOptions { Prompt = MessageFactory.Text("Please enter the name of the node you would like to troubleshoot") };
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
            await stepContext.Context.SendActivityAsync(new Activity { Type = ActivityTypes.Event, Value = "typing" });
            await stepContext.Context.SendActivityAsync(new Activity { Type = ActivityTypes.Typing });
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
                if (Double.IsNaN((double)diskUsage))
                {
                    diskPercent = 0.0;
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
                if (Double.IsNaN((double)memoryUsage))
                {
                    memoryPercent = 0.0;
                }
            }

            string kubeEvents = await nodeHandler.kubeEventsQuery();

            string statusString = await nodeHandler.podQueryAsync();


            string jsonForUX = "{\"Name\" : \"" + nodeName + "\", \"Status: \" : \"" + status + "\", \"Average CPU: \" : \"" + Math.Round(cpuPercent, 2) + "%\", \"Max CPU: \" : \"" + Math.Round(cpuMaxPercent, 2) + "%\", \"Average Memory: \" : \"" + Math.Round(memoryPercent, 2) + "%\", \"Average Disk Usage: \" : \"" + Math.Round(diskPercent, 2) + "%\", \"Pod Count\" : [" + statusString + "], \"Kube Events\" : [" + kubeEvents + "]}";

            await stepContext.Context.SendActivityAsync(jsonForUX);

            return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
        }
    }
}