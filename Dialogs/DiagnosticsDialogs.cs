// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading;
using System.Threading.Tasks;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;

namespace Microsoft.BotBuilderSamples
{
    public class DiagnosticsDialog : ComponentDialog
    {
        private readonly UserState UserState;
        private const string UserInfo = "value-userInfo";

        public DiagnosticsDialog(UserState userState)
            : base(nameof(DiagnosticsDialog))
        {
            UserState = userState;
            AddDialog(new TextPrompt(nameof(TextPrompt)));
            AddDialog(new NodeDialog());
            AddDialog(new PodDialog());
            AddDialog(new ConfigErrorDialog());
            AddDialog(new KubeAPIDialog());
            AddDialog(new ClusterDialog());

            AddDialog(new WaterfallDialog(nameof(WaterfallDialog), new WaterfallStep[]
            {
                InitialStepAsync,
                DiagnosticTypeAsync,
                FinalStepAsync
            }));

            InitialDialogId = nameof(WaterfallDialog);
        }

        private async Task<DialogTurnResult> InitialStepAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            var userStateAccessors = UserState.CreateProperty<UserProfile>(nameof(UserProfile));
            var userProfile = await userStateAccessors.GetAsync(stepContext.Context, () => new UserProfile());
            var promptOptions = new PromptOptions { Prompt = MessageFactory.Text("What type of diagnostic information would you like to view? Please enter one of these options: *(Cluster)* / *(Node)* / *(Pod)* / *(Configuration Errors)*") };

            return await stepContext.PromptAsync(nameof(TextPrompt), promptOptions, cancellationToken);

        }
        private async Task<DialogTurnResult> DiagnosticTypeAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            var userStateAccessors = UserState.CreateProperty<UserProfile>(nameof(UserProfile));
            var userProfile = await userStateAccessors.GetAsync(stepContext.Context, () => new UserProfile());
            var diagnosticType = ((string)stepContext.Result).ToLower(); 

            switch (diagnosticType)
            {
                case "cluster":
                    return await stepContext.BeginDialogAsync(nameof(ClusterDialog), userProfile, cancellationToken);
                case "node":
                    return await stepContext.BeginDialogAsync(nameof(NodeDialog), userProfile, cancellationToken);
                case "pod":
                    return await stepContext.BeginDialogAsync(nameof(PodDialog), userProfile, cancellationToken);
                case "configuration errors":
                    return await stepContext.BeginDialogAsync(nameof(ConfigErrorDialog), userProfile, cancellationToken);
            }
            return await stepContext.EndDialogAsync(userProfile, cancellationToken);
        }

        private async Task<DialogTurnResult> FinalStepAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            var userInfo = (UserProfile)stepContext.Result;
            userInfo.ObjectName = "";
            userInfo.ObjectType = "";
            return await stepContext.EndDialogAsync(userInfo, cancellationToken);
        }
    }
}