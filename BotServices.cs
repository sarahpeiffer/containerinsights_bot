// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.AI.Luis;
using Microsoft.Bot.Builder.AI.QnA;
using Microsoft.Extensions.Configuration;

namespace Microsoft.BotBuilderSamples
{
    public class BotServices : IBotServices
    {
        public BotServices(IConfiguration configuration, IBotTelemetryClient telemetryClient)
        {
            // Read the setting for cognitive services (LUIS, QnA) from the appsettings.json
            // If includeApiResults is set to true, the full response from the LUIS api (LuisResult)
            // will be made available in the properties collection of the RecognizerResult

            var luisApplication = new LuisApplication(
                configuration["LuisAppId"],
                configuration["LuisAPIKey"],
               $"https://{configuration["LuisAPIHostName"]}.api.cognitive.microsoft.com");

            // Set the recognizer options depending on which endpoint version you want to use.
            // More details can be found in https://docs.microsoft.com/en-gb/azure/cognitive-services/luis/luis-migration-api-v3
            var recognizerOptions = new LuisRecognizerOptionsV2(luisApplication)
            {
                IncludeAPIResults = true,
                PredictionOptions = new LuisPredictionOptions()
                {
                    IncludeAllIntents = true,
                    IncludeInstanceData = true
                }
            };

            Dispatch = new LuisRecognizer(recognizerOptions);

            DocumentationQnA = new QnAMaker(new QnAMakerEndpoint
            {
                KnowledgeBaseId = configuration["DocumentationQnAKnowledgebaseId"],
                EndpointKey = configuration["DocumentationQnAEndpointKey"],
                Host = configuration["DocumentationQnAEndpointHostName"]
            }, null, null, telemetryClient);

            KustoQnA = new QnAMaker(new QnAMakerEndpoint
            {
                KnowledgeBaseId = configuration["KustoQnAKnowledgebaseId"],
                EndpointKey = configuration["KustoQnAEndpointKey"],
                Host = configuration["KustoQnAEndpointHostName"]
            }, null, null, telemetryClient);


        }
        public QnAMaker KustoQnA { get; private set; }
        public LuisRecognizer Dispatch { get; private set; }
        public QnAMaker DocumentationQnA { get; private set; }

    }
}
