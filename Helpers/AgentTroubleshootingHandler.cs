using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.BotBuilderSamples
{
    interface AgentTroubleshootingHandler
{
        Task<string> daemonsetAsync();
        Task<string> podErrorsAsyc();
        Task<string> workspaceStatusAsync();
}

}
