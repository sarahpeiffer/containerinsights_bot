// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading;
using System.Threading.Tasks;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;

namespace Microsoft.BotBuilderSamples
{
    public class MainDialog : ComponentDialog
    {
        private readonly UserState UserState;

        public MainDialog(UserState userState, IBotTelemetryClient telemetryClient)
            : base(nameof(MainDialog))
        {

            UserState = userState;
            this.TelemetryClient = telemetryClient;


            AddDialog(new NodeDialog());
            AddDialog(new PodDialog());
            AddDialog(new ConfigErrorDialog());
            AddDialog(new KubeAPIDialog());
            AddDialog(new DiagnosticsDialog(UserState));
            AddDialog(new TimeDialog());

            AddDialog(new WaterfallDialog(nameof(WaterfallDialog), new WaterfallStep[]
            {
                InitialStepAsync,
                FinalStepAsync,
            }));

            InitialDialogId = nameof(WaterfallDialog);
        }

        private async Task<DialogTurnResult> InitialStepAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            var userStateAccessors = UserState.CreateProperty<UserProfile>(nameof(UserProfile));
            var userProfile = await userStateAccessors.GetAsync(stepContext.Context, () => new UserProfile());
            var dialogStateAccessors = UserState.CreateProperty<DialogProfile>(nameof(DialogProfile));
            var dialogProfile = await dialogStateAccessors.GetAsync(stepContext.Context, () => new DialogProfile());
            //if we know the name of node or pod already we pass that to the dialog profile so the user isn't prompted for it
            if(dialogProfile.ObjectType != null)
            {
                userProfile.ObjectType = dialogProfile.ObjectType;
                userProfile.ObjectName = dialogProfile.ObjectName;
            }

            switch (dialogProfile.DialogType) {
                case "diagnostics":
                    return await stepContext.BeginDialogAsync(nameof(DiagnosticsDialog), userProfile, cancellationToken);
                case "node_info":
                    return await stepContext.BeginDialogAsync(nameof(NodeDialog), userProfile, cancellationToken);
                case "pod_info":
                    return await stepContext.BeginDialogAsync(nameof(PodDialog), userProfile, cancellationToken);
                case "config_error":
                    return await stepContext.BeginDialogAsync(nameof(ConfigErrorDialog), userProfile, cancellationToken);
                case "kube_api":
                     return await stepContext.BeginDialogAsync(nameof(KubeAPIDialog), userProfile, cancellationToken);
                case "time":
                    return await stepContext.BeginDialogAsync(nameof(TimeDialog), userProfile, cancellationToken);
            }

            return await stepContext.BeginDialogAsync(nameof(NodeDialog), userProfile, cancellationToken);
        }

        private async Task<DialogTurnResult> FinalStepAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            if(stepContext.Result != null)
            {
                var userInfo = (UserProfile)stepContext.Result;
                userInfo.ObjectType = "";
                userInfo.ObjectName = "";
                string status = "Type out another question or select another option for more diagnostic information";

                await stepContext.Context.SendActivityAsync(status);


                var accessor = UserState.CreateProperty<UserProfile>(nameof(UserProfile));
                await accessor.SetAsync(stepContext.Context, userInfo, cancellationToken);
            }


            return await stepContext.EndDialogAsync(null, cancellationToken);
        }
    }
}