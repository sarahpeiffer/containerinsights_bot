// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.BotBuilderSamples
{
    using System.Collections.Generic;

    /// <summary>Contains information about a user.</summary>
    public class UserProfile
    {
        public string Token { get; set; }
        public string ClusterId { get; set; }

        // The list of companies the user wants to review.
        public List<string> CompaniesToReview { get; set; } = new List<string>();
    }
}