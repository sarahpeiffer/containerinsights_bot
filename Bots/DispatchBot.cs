// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Schema;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace Microsoft.BotBuilderSamples
{

    public class DispatchBot<T> : ActivityHandler where T : Dialog
    {
        private readonly ILogger<DispatchBot<T>> Logger;
        private readonly IBotServices BotServices;
        protected readonly Dialog Dialog;
        protected readonly BotState ConversationState;
        protected readonly BotState UserState;
        private readonly IBotTelemetryClient TelemetryClient;

        const string defaultTimeRange = "30m";

        public DispatchBot(ConversationState conversationState, UserState userState, T dialog, IBotServices botServices, ILogger<DispatchBot<T>> logger, IBotTelemetryClient telemetryClient)
        {

            Logger = logger;
            BotServices = botServices;
            Dialog = dialog;
            ConversationState = conversationState;
            UserState = userState;
            TelemetryClient = telemetryClient;
        }


        //method is invoked every time the bot receives a message
        protected override async Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, CancellationToken cancellationToken)
        {
            var conversationStateAccessors = ConversationState.CreateProperty<DialogState>(nameof(DialogState));
            var conversationData = await conversationStateAccessors.GetAsync(turnContext, () => new DialogState());
            var userStateAccessors = UserState.CreateProperty<UserProfile>(nameof(UserProfile));
            var dialogStateAccessors = UserState.CreateProperty<DialogProfile>(nameof(DialogProfile));
            var userProfile = await userStateAccessors.GetAsync(turnContext, () => new UserProfile());

            //if a dialog is currently in progress we want to continue to run that dialog until it is over
            if (conversationData.DialogStack.Count > 0)
            {
                await Dialog.RunAsync(turnContext, ConversationState.CreateProperty<DialogState>(nameof(DialogState)), cancellationToken);

            }
            else
            {
                //cases here are based off of shortcut messages and will start related dialog
                DialogProfile dialogProfile = new DialogProfile();
                if (turnContext.Activity.Text.ToLower() == "kusto")
                {
                    await turnContext.SendActivityAsync("What KQL query are you looking for?");
                    userProfile.isKusto = true;
                    await userStateAccessors.SetAsync(turnContext, userProfile, cancellationToken);
                }
                else if (userProfile.isKusto == true)
                {
                    userProfile.isKusto = false;
                    await userStateAccessors.SetAsync(turnContext, userProfile, cancellationToken);
                    await ProcessKustoQnAAsync(turnContext, cancellationToken);
                }
                else if (turnContext.Activity.Text.ToLower().Trim() == "diagnostics")
                {
                    dialogProfile.DialogType = "diagnostics";
                    var accessor = UserState.CreateProperty<DialogProfile>(nameof(DialogProfile));
                    await accessor.SetAsync(turnContext, dialogProfile, cancellationToken);
                    await Dialog.RunAsync(turnContext, ConversationState.CreateProperty<DialogState>(nameof(DialogState)), cancellationToken);
                }
                else if (turnContext.Activity.Text.ToLower().Trim() == "agent troubleshooting")
                {
                    dialogProfile.DialogType = "kube_api";
                    var accessor2 = UserState.CreateProperty<DialogProfile>(nameof(DialogProfile));
                    await accessor2.SetAsync(turnContext, dialogProfile, cancellationToken);
                    await Dialog.RunAsync(turnContext, ConversationState.CreateProperty<DialogState>(nameof(DialogState)), cancellationToken);
                }
                else if (turnContext.Activity.Text.Contains("node_"))
                {
                    var nodeName = turnContext.Activity.Text.Substring(5);
                    dialogProfile.DialogType = "node_info";
                    dialogProfile.ObjectType = "node";
                    dialogProfile.ObjectName = nodeName;
                    var accessor2 = UserState.CreateProperty<DialogProfile>(nameof(DialogProfile));
                    await accessor2.SetAsync(turnContext, dialogProfile, cancellationToken);
                    await Dialog.RunAsync(turnContext, ConversationState.CreateProperty<DialogState>(nameof(DialogState)), cancellationToken);
                }
                else if (turnContext.Activity.Text.Contains("pod_") || turnContext.Activity.Text.Contains("Pod_"))
                {
                    var podName = turnContext.Activity.Text.Substring(4);
                    dialogProfile.DialogType = "pod_info";
                    dialogProfile.ObjectType = "pod";
                    dialogProfile.ObjectName = podName;
                    var accessor2 = UserState.CreateProperty<DialogProfile>(nameof(DialogProfile));
                    await accessor2.SetAsync(turnContext, dialogProfile, cancellationToken);
                    await Dialog.RunAsync(turnContext, ConversationState.CreateProperty<DialogState>(nameof(DialogState)), cancellationToken);
                }
                else if (turnContext.Activity.Text.ToLower() == "time")
                {
                    dialogProfile.DialogType = "time";
                    var accessor2 = UserState.CreateProperty<DialogProfile>(nameof(DialogProfile));
                    await accessor2.SetAsync(turnContext, dialogProfile, cancellationToken);
                    await Dialog.RunAsync(turnContext, ConversationState.CreateProperty<DialogState>(nameof(DialogState)), cancellationToken);
                }

                else
                {
                    await ProcessDocumentationQnAAsync(turnContext, cancellationToken);
                }
            }
        }

        //invoked when bot receives a message.  currently being used to handle intial user data from event
        protected override async Task OnEventActivityAsync(ITurnContext<IEventActivity> turnContext, CancellationToken cancellationToken)
        {
            var userStateAccessors = UserState.CreateProperty<UserProfile>(nameof(UserProfile));
            var userProfile = await userStateAccessors.GetAsync(turnContext, () => new UserProfile());
            var activity = turnContext.Activity;
            //take user info from event and set relevant values in user profile
            if (activity.Name == "sendUserInfo")
            {
                dynamic userJson = JsonConvert.DeserializeObject(activity.Value.ToString());
                userProfile.Token = userJson.token;
                userProfile.ClusterId = userJson.clusterID;
                if (userProfile.Token != null && userProfile.ClusterId != null)
                {
                    HttpClient client = new HttpClient();
                    client.DefaultRequestHeaders.Add("Authorization", userProfile.Token);
                    var responseString = await client.GetStringAsync("https://management.azure.com" + userProfile.ClusterId + "?api-version=2020-03-01");
                    dynamic userInfoObject = JsonConvert.DeserializeObject<MyJsonType>(responseString);
                    userProfile.WorkspaceId = userInfoObject.Properties.AddonProfiles.Omsagent.Config.LogAnalyticsWorkspaceResourceID;
                }
                userProfile.KubeAPIToken = userJson.kubeAPIToken;
                userProfile.APIServer = userJson.apiServer;
                userProfile.KubeCert = userJson.cert;
                await userStateAccessors.SetAsync(turnContext, userProfile, cancellationToken);

            }


        }
        //method is called when new member is added.  sends welcome message and sets default time range
        protected override async Task OnMembersAddedAsync(IList<ChannelAccount> membersAdded, ITurnContext<IConversationUpdateActivity> turnContext, CancellationToken cancellationToken)
        {
            const string WelcomeText = "Welcome to Container Insights Troubleshooting Bot! Type a question to query the Azure Monitor for Containers documentation or select a shortcut option to get started.";

            foreach (var member in membersAdded)
            {
                if (member.Id != turnContext.Activity.Recipient.Id)
                {
                    var userStateAccessors = UserState.CreateProperty<UserProfile>(nameof(UserProfile));
                    var userProfile = await userStateAccessors.GetAsync(turnContext, () => new UserProfile());
                    userProfile.TimeRange = defaultTimeRange;
                    await turnContext.SendActivityAsync(MessageFactory.Text($"{WelcomeText}"), cancellationToken);
                }
            }

        }

        //gets response from documentation QnA Maker
        private async Task ProcessDocumentationQnAAsync(ITurnContext<IMessageActivity> turnContext, CancellationToken cancellationToken)
        {
            Logger.LogInformation("ProcessSampleQnAAsync");

            var results = await BotServices.DocumentationQnA.GetAnswersAsync(turnContext);
            if (results.Any())
            {
                await turnContext.SendActivityAsync(MessageFactory.Text(results.First().Answer), cancellationToken);
            }
            else
            {
                var answerNotFoundProperties = new Dictionary<string, string>();
                answerNotFoundProperties.Add(
                                    "question",
                                    turnContext.Activity.Text);
                TelemetryClient.TrackEvent("QnANotFound", answerNotFoundProperties);
                await turnContext.SendActivityAsync(MessageFactory.Text("Sorry, could not find an answer in the Q and A system."), cancellationToken);
            }
        }

        //gets response from Kusto Query QnA Maker
        private async Task ProcessKustoQnAAsync(ITurnContext<IMessageActivity> turnContext, CancellationToken cancellationToken)
        {
            Logger.LogInformation("ProcessSampleQnAAsync");

            var results = await BotServices.KustoQnA.GetAnswersAsync(turnContext);
            if (results.Any())
            {
                await turnContext.SendActivityAsync(MessageFactory.Text(results.First().Answer), cancellationToken);
            }
            else
            {
                var answerNotFoundProperties = new Dictionary<string, string>();
                answerNotFoundProperties.Add(
                                    "question",
                                    turnContext.Activity.Text);
                TelemetryClient.TrackEvent("QnANotFound", answerNotFoundProperties);
                await turnContext.SendActivityAsync(MessageFactory.Text("Sorry, could not find an answer in the Q and A system."), cancellationToken);
            }
        }

        //saves changes to conversation and user state at each turn
        public override async Task OnTurnAsync(ITurnContext turnContext, CancellationToken cancellationToken = default(CancellationToken))
        {
            await base.OnTurnAsync(turnContext, cancellationToken);

            // Save any state changes that might have occurred during the turn.
            await ConversationState.SaveChangesAsync(turnContext, false, cancellationToken);
            await UserState.SaveChangesAsync(turnContext, false, cancellationToken);
        }
    }
}
class MyJsonType { public PropertyType Properties { get; set; } }
class PropertyType { public AddOnType AddonProfiles { get; set; } }
class AddOnType { public OmsType Omsagent { get; set; } }
class OmsType { public ConfigType Config { get; set; } }
class ConfigType { public String LogAnalyticsWorkspaceResourceID { get; set; } }




