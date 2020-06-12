/*using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace Microsoft.BotBuilderSamples
{
    public class NodeQueries
{
        HttpClient client = new HttpClient();
        String nodeName;
        String token;
        String resourceId;
        String clusterId;

        public NodeQueries(String nodeName, String token, String clusterId)
        {
            this.nodeName = nodeName;
            this.token = token;
            this.clusterId = clusterId;
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", this.token);
            this.resourceId = getFullyQualifiedId();
            
        }

        public async String getFullyQualifiedId()
        {
            var responseString = await client.GetStringAsync("https://management.azure.com/" + clusterId + "?api-version=2020-03-01");
            var myJsonObject = JsonConvert.DeserializeObject<MyJsonType>(responseString);
            var id = myJsonObject.Properties.AddonProfiles.Omsagent.Config.LogAnalyticsWorkspaceResourceID;
            return id;
        }
        public async void QueryStarter()
        {
            

        }

        public String readyQuery(String nodeName, String token, )
}
}
*/