// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Azure.CognitiveServices.Language.LUIS.Runtime.Models;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Schema;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Microsoft.BotBuilderSamples
{

    public class DispatchBot<T> : ActivityHandler where T : Dialog
    {
        private readonly ILogger<DispatchBot<T>> Logger;
        private readonly IBotServices BotServices;
        protected readonly Dialog Dialog;
        protected readonly BotState ConversationState;
        protected readonly BotState UserState;


        public DispatchBot(ConversationState conversationState, UserState userState, T dialog, IBotServices botServices, ILogger<DispatchBot<T>> logger)
        {
           
            Logger = logger;
            BotServices = botServices;
            Dialog = dialog;
            ConversationState = conversationState;
            UserState = userState;
        }



        protected override async Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, CancellationToken cancellationToken)
        {
            var conversationStateAccessors = ConversationState.CreateProperty<DialogState>(nameof(DialogState));
            var conversationData = await conversationStateAccessors.GetAsync(turnContext, () => new DialogState());
            var userStateAccessors = UserState.CreateProperty<UserProfile>(nameof(UserProfile));
            var userProfile = await userStateAccessors.GetAsync(turnContext, () => new UserProfile());
            if (string.IsNullOrEmpty(turnContext.Activity.Text))
            {
                dynamic value = turnContext.Activity.Value;
                if (value != null)
                {
                    string text = value["text"];  
                    text = string.IsNullOrEmpty(text) ? "." : text; 
                    turnContext.Activity.Text = text;
                    await DetermineCardDialog(turnContext, cancellationToken, text);
                }
            }
            else {

                if (conversationData.DialogStack.Count > 0)
                {
                    await Dialog.RunAsync(turnContext, ConversationState.CreateProperty<DialogState>(nameof(DialogState)), cancellationToken);

                }
                else
                {
                    List<Attachment> cards = GenerateWelcomeCards();
                    await turnContext.SendActivityAsync(MessageFactory.Carousel(cards), cancellationToken);

                    var recognizerResult = await BotServices.Dispatch.RecognizeAsync(turnContext, cancellationToken);

                    // Top intent tell us which cognitive service to use.
                    var topIntent = recognizerResult.GetTopScoringIntent();

                    // Next, we call the dispatcher with the top intent.
                    await DispatchToTopIntentAsync(turnContext, topIntent.intent, recognizerResult, cancellationToken);
                }

            }

               // var adapter = (IUserTokenProvider)turnContext.Adapter;
                //var token = await adapter.GetUserTokenAsync(turnContext, "auth-dispatch-connection", "", cancellationToken);
               

            if (turnContext.Activity.Text == "token")
                {
                    var tempToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlNzWnNCTmhaY0YzUTlTNHRycFFCVEJ5TlJSSSIsImtpZCI6IlNzWnNCTmhaY0YzUTlTNHRycFFCVEJ5TlJSSSJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldC8iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaWF0IjoxNTkxMzg2NzEyLCJuYmYiOjE1OTEzODY3MTIsImV4cCI6MTU5MTM5MDYxMiwiX2NsYWltX25hbWVzIjp7Imdyb3VwcyI6InNyYzEifSwiX2NsYWltX3NvdXJjZXMiOnsic3JjMSI6eyJlbmRwb2ludCI6Imh0dHBzOi8vZ3JhcGgud2luZG93cy5uZXQvNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3L3VzZXJzL2EwZWExZmI1LWJiZTAtNDgxMC05ZWFlLWIyZTNhNGY3MDIzMy9nZXRNZW1iZXJPYmplY3RzIn19LCJhY3IiOiIxIiwiYWlvIjoiQVZRQXEvOFBBQUFBYytvRkhmaFBMblB1TC80NkhtcEZSMmhUcEExUTRuNGhpellqRzVPanFBZitoS3pYY2VNMEs1cFJvSnExMUEwcmxNTytjdTVuMWlLNExzUWcrTmF2SHJLcUloL00rUU91UXl2a1d3NnZyTG89IiwiYW1yIjpbInJzYSIsIm1mYSJdLCJhcHBpZCI6ImM0NGI0MDgzLTNiYjAtNDljMS1iNDdkLTk3NGU1M2NiZGYzYyIsImFwcGlkYWNyIjoiMiIsImRldmljZWlkIjoiNjNmN2M0MjMtMjc1Ny00MjQ1LWI1MmEtNjZmYTFkYTVkNjJkIiwiZmFtaWx5X25hbWUiOiJQZWlmZmVyIiwiZ2l2ZW5fbmFtZSI6IlNhcmFoIiwiaXBhZGRyIjoiNDcuMzQuMTA3LjIxNiIsIm5hbWUiOiJTYXJhaCBQZWlmZmVyIiwib2lkIjoiYTBlYTFmYjUtYmJlMC00ODEwLTllYWUtYjJlM2E0ZjcwMjMzIiwib25wcmVtX3NpZCI6IlMtMS01LTIxLTIxMjc1MjExODQtMTYwNDAxMjkyMC0xODg3OTI3NTI3LTQyNzQyNjcxIiwicHVpZCI6IjEwMDMyMDAwQkQzRTczRjQiLCJyaCI6IjAuQVJvQXY0ajVjdkdHcjBHUnF5MTgwQkhiUjROQVM4U3dPOEZKdEgyWFRsUEwzendhQU5ZLiIsInNjcCI6InVzZXJfaW1wZXJzb25hdGlvbiIsInN1YiI6ImdnU2dNa0JfSk9tR2hUbUx3bVpRTEpRYU0yQm9RRzloMDZMbnBNRS1RUjQiLCJ0aWQiOiI3MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDciLCJ1bmlxdWVfbmFtZSI6InQtc2FwZWlmQG1pY3Jvc29mdC5jb20iLCJ1cG4iOiJ0LXNhcGVpZkBtaWNyb3NvZnQuY29tIiwidXRpIjoiczgycnA1blpSMGVoa2dQaXpvY2lBQSIsInZlciI6IjEuMCJ9.HxOjdACi81ZzHPUHGC8Z02i4ZIFcXNvafdgLsLkeIh9wh3wCs9pnMYF6sXN5CSBVUR6MKf86tQH3CwEzThWXi6fDNbYIf5G-b6N3W9ijFoMpuxR-4fuPj7pqg_IXnVUCHy7av8FSxdT5t2A4An-JP-wVXIdRg2jcwnzfh_h2ed7IaxWpRupDDCrWMgeRcMDifYL_BCmjqndGjDg2A_h_1f4jTw_T3gVgVP1hbZAnP27dBHE50b5po8bGV698av1SZgtL1bmyxDefkZ7RPvom4ozyRpoK8aPyUx2obG4aVbBqcg2czT3S7t_dBXE2835t3OPbvnTE_L1YMPsI2MFklw";
                    
                    //get request
                    HttpClient client = new HttpClient();
                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tempToken);
                    var responseString = await client.GetStringAsync("https://management.azure.com/subscriptions/72c8e8ca-dc16-47dc-b65c-6b5875eb600a/resourceGroups/sarah-test/providers/Microsoft.ContainerService/managedClusters/sarah-cluster-1?api-version=2020-03-01");
                    var myJsonObject = JsonConvert.DeserializeObject<MyJsonType>(responseString);
                    var id = myJsonObject.Properties.AddonProfiles.Omsagent.Config.LogAnalyticsWorkspaceResourceID;
                    await turnContext.SendActivityAsync(MessageFactory.Text($"Get Response Id {id}"), cancellationToken);

                    //post request
                    var postLoc = "https://management.azure.com" + id + "/query?api-version=2017-10-01";
                    var jsonvalues = "{\"query\":\"set query_take_max_records = 10001; set truncationmaxsize = 67108864;search * | summarize count() by Type\"}";
                    var content = new StringContent(jsonvalues, Encoding.UTF8, "application/json");
                    var response = await client.PostAsync(postLoc, content);
                    var postResponseString = await response.Content.ReadAsStringAsync();
                    await turnContext.SendActivityAsync(MessageFactory.Text($"Post Response {postResponseString}"), cancellationToken);
                }



        }

        protected override async Task OnMembersAddedAsync(IList<ChannelAccount> membersAdded, ITurnContext<IConversationUpdateActivity> turnContext, CancellationToken cancellationToken)
        {
            const string WelcomeText = "Welcome to Container Insights Troubleshooting Bot! Type a question or select an option to get started";

            List<Attachment> cards = GenerateWelcomeCards();
            foreach (var member in membersAdded)
            {
                if (member.Id != turnContext.Activity.Recipient.Id)
                {

                    await turnContext.SendActivityAsync(MessageFactory.Carousel(cards), cancellationToken);
                        await turnContext.SendActivityAsync(MessageFactory.Text($"{WelcomeText}"), cancellationToken);
                }
            }

        }
        protected List<Attachment> GenerateWelcomeCards()
        {
            var adaptiveCardJson = File.ReadAllText(Path.Combine(".", "Resources", "json.json"));
            var adaptiveCardAttachment = new Attachment()
            {
                ContentType = "application/vnd.microsoft.card.adaptive",
                Content = JsonConvert.DeserializeObject(adaptiveCardJson),
            };
            var adaptiveCardJson2 = File.ReadAllText(Path.Combine(".", "Resources", "json1.json"));
            var adaptiveCardAttachment2 = new Attachment()
            {
                ContentType = "application/vnd.microsoft.card.adaptive",
                Content = JsonConvert.DeserializeObject(adaptiveCardJson2),
            };
            List<Attachment> cards = new List<Attachment> { adaptiveCardAttachment, adaptiveCardAttachment2 };
            cards.Append(adaptiveCardAttachment);
            return cards;
        }

        private async Task DispatchToTopIntentAsync(ITurnContext<IMessageActivity> turnContext, string intent, RecognizerResult recognizerResult, CancellationToken cancellationToken)
        {
            switch (intent)
            {
                case "l_HomeAutomation":
                    await ProcessHomeAutomationAsync(turnContext, recognizerResult.Properties["luisResult"] as LuisResult, cancellationToken);
                    break;
                case "l_Weather":
                    await ProcessWeatherAsync(turnContext, recognizerResult.Properties["luisResult"] as LuisResult, cancellationToken);
                    break;
                case "q_sample-qna":
                    await ProcessSampleQnAAsync(turnContext, cancellationToken);
                    break;
                default:
                    Logger.LogInformation($"Dispatch unrecognized intent: {intent}.");
                    await turnContext.SendActivityAsync(MessageFactory.Text($"Dispatch unrecognized intent: {intent}."), cancellationToken);
                    break;
            }
        }

        private async Task ProcessHomeAutomationAsync(ITurnContext<IMessageActivity> turnContext, LuisResult luisResult, CancellationToken cancellationToken)
        {
            Logger.LogInformation("ProcessHomeAutomationAsync");
            /*WebRequest request = WebRequest.Create("https://management.azure.com/subscriptions/72c8e8ca-dc16-47dc-b65c-6b5875eb600a/resourceGroups/rashmi-mdm-alert-new/providers/Microsoft.ContainerService/managedClusters/rashmi-mdm-alert-new?api-version=2020-03-01");
            request.Method = "GET";*/
         
            // Retrieve LUIS result for Process Automation.
            var result = luisResult.ConnectedServiceResult;
            var topIntent = result.TopScoringIntent.Intent; 
            
            await turnContext.SendActivityAsync(MessageFactory.Text($"HomeAutomation top intent {topIntent}."), cancellationToken);
            await turnContext.SendActivityAsync(MessageFactory.Text($"HomeAutomation intents detected:\n\n{string.Join("\n\n", result.Intents.Select(i => i.Intent))}"), cancellationToken);
            if (luisResult.Entities.Count > 0)
            {
                await turnContext.SendActivityAsync(MessageFactory.Text($"HomeAutomation entities were found in the message:\n\n{string.Join("\n\n", result.Entities.Select(i => i.Entity))}"), cancellationToken);
            }
        }

        private async Task ProcessWeatherAsync(ITurnContext<IMessageActivity> turnContext, LuisResult luisResult, CancellationToken cancellationToken)
        {
            Logger.LogInformation("ProcessWeatherAsync");

            // Retrieve LUIS results for Weather.
            var result = luisResult.ConnectedServiceResult;
            var topIntent = result.TopScoringIntent.Intent;
            await turnContext.SendActivityAsync(MessageFactory.Text($"ProcessWeather top intent {topIntent}."), cancellationToken);
            await turnContext.SendActivityAsync(MessageFactory.Text($"ProcessWeather Intents detected::\n\n{string.Join("\n\n", result.Intents.Select(i => i.Intent))}"), cancellationToken);
            if (luisResult.Entities.Count > 0)
            {
                await turnContext.SendActivityAsync(MessageFactory.Text($"ProcessWeather entities were found in the message:\n\n{string.Join("\n\n", result.Entities.Select(i => i.Entity))}"), cancellationToken);
            }
        }

        private async Task ProcessSampleQnAAsync(ITurnContext<IMessageActivity> turnContext, CancellationToken cancellationToken)
        {
            Logger.LogInformation("ProcessSampleQnAAsync");

            var results = await BotServices.SampleQnA.GetAnswersAsync(turnContext);
            if (results.Any())
            {
                await turnContext.SendActivityAsync(MessageFactory.Text(results.First().Answer), cancellationToken);
            }
            else
            {
                await turnContext.SendActivityAsync(MessageFactory.Text("Sorry, could not find an answer in the Q and A system."), cancellationToken);
            }
        }
        private async Task DetermineCardDialog(ITurnContext<IMessageActivity> turnContext, CancellationToken cancellationToken, String card_id)
        {
            switch (card_id)
            {
                case "node_info":
                    await Dialog.RunAsync(turnContext, ConversationState.CreateProperty<DialogState>(nameof(DialogState)), cancellationToken);
                    break;
                case "help":
                    await turnContext.SendActivityAsync(MessageFactory.Text("you have asked for help"), cancellationToken);
                    break;
            }


        }
        public override async Task OnTurnAsync(ITurnContext turnContext, CancellationToken cancellationToken = default(CancellationToken))
        {
            await base.OnTurnAsync(turnContext, cancellationToken);

            // Save any state changes that might have occurred during the turn.
            await ConversationState.SaveChangesAsync(turnContext, false, cancellationToken);
            await UserState.SaveChangesAsync(turnContext, false, cancellationToken);
        }
        protected override async Task OnTokenResponseEventAsync(ITurnContext<IEventActivity> turnContext, CancellationToken cancellationToken)
        {
            Logger.LogInformation("Running dialog with Token Response Event Activity.");

            // Run the Dialog with the new Token Response Event Activity.
            await Dialog.RunAsync(turnContext, ConversationState.CreateProperty<DialogState>(nameof(DialogState)), cancellationToken);
        }
    }
}
class MyJsonType { public  PropertyType Properties { get; set; } }
class PropertyType { public AddOnType AddonProfiles { get; set; } }
class AddOnType { public OmsType Omsagent { get; set; } }
class OmsType { public ConfigType Config { get; set; } }
class ConfigType { public String LogAnalyticsWorkspaceResourceID { get; set; } }




