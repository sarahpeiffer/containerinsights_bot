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
        public string WorkspaceId { get; set; }
        public string KubeAPIToken { get; set; }
        public string APIServer { get; set; }
        public string KubeCert { get; set; }
        public string ObjectType { get; set; }
        public string ObjectName { get; set; }
        public string TimeRange { get; set; }
        public bool isKusto { get; set; }


    }
}