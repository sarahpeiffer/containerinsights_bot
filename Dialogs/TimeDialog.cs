// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Microsoft.BotBuilderSamples
{
    public class TimeDialog : ComponentDialog
    {

        // Define value names for values tracked inside the dialogs.
        private const string UserInfo = "value-userInfo";

        public TimeDialog()
            : base(nameof(TimeDialog))
        {

            AddDialog(new WaterfallDialog(nameof(WaterfallDialog), new WaterfallStep[]
            {
                TimeRangeAsync,
                SetTimeAsync
            }));

            InitialDialogId = nameof(WaterfallDialog);
        }

        private async Task<DialogTurnResult> TimeRangeAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {

            var userProfile = (UserProfile)stepContext.Options;
            stepContext.Values[UserInfo] = userProfile;


            var promptOptions = new PromptOptions { Prompt = MessageFactory.Text("Please enter the time range for the troubleshooting data.  Please use 1d / 1h / 1m formatting.") };

            // Ask the user to enter their time frame
            return await stepContext.PromptAsync(nameof(TextPrompt), promptOptions, cancellationToken);
        }

        private async Task<DialogTurnResult> SetTimeAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            var userProfile = (UserProfile)stepContext.Values[UserInfo];
            string timeRange = (string)stepContext.Result;

            //check to see if the time entered is in valid [digits][m/h/d] format
            bool validTime = true;
            string timeDigits = timeRange.Substring(0, timeRange.Length - 1);
            foreach (char c in timeDigits) {
                if(!Char.IsDigit(c))
                {
                    validTime = false;
                }
            }
            string timeScale = timeRange.Substring(timeRange.Length - 1, 1);
            if(timeScale != "m" && timeScale != "h" && timeScale != "d")
            {
                validTime = false;
            }

            if(!validTime)
            {
                await stepContext.Context.SendActivityAsync("The time you entered is not a valid time range.  Reverting to the default time range of 30m");
                return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);

            }

            //if the given time is valid, set the user profile time to the given range
            userProfile.TimeRange = timeRange;
            await stepContext.Context.SendActivityAsync("The time range for diagnostic information has been set to " + userProfile.TimeRange + " ago.");

            return await stepContext.EndDialogAsync(stepContext.Values[UserInfo], cancellationToken);
        }

       
    }
}