/*using System;
using System.Threading.Tasks;


namespace Microsoft.BotBuilderSamples
{
    public class AuthenticationClient 
    {

        private readonly AadConfiguration m_aadConfiguration;
        private readonly DstsConfiguration m_dstsConfiguration;
        private Lazy<AuthorizationHelper> LazyAuthorizationHelper => new Lazy<AuthorizationHelper>(() => new AuthorizationHelper(m_aadConfiguration, m_dstsConfiguration));

        public AuthenticationClient(string thirdPartyApplicationKey, AadConfiguration aadConfiguration, DstsConfiguration dstsConfiguration)
        {
            m_aadConfiguration = aadConfiguration;
            m_dstsConfiguration = dstsConfiguration;
            ParsedUri issuerFormat = ExtendedUriParser.Parse(m_aadConfiguration.IssuerFormat);
            AadConfiguration.DefaultAadIdentityProvider = string.Format("{0}://{1}", issuerFormat.Scheme, issuerFormat.Hostname);
        }

        public async Task<AuthorizedPrincipal> ParsePrincipalName(string principalName, string authorizationPrefix)
        {
            // The call to SynchronizationContextRemover is needed in order to avoid blocking the UI thread
            await new SynchronizationContextRemover();

            string fqn = $"{authorizationPrefix}{AccessControlUtils.TypeNameDelimiter}{principalName}";
            string fixedFqn = AccessControlUtils.InferTenantIdFromClaimsIdentity(fqn, null);

            return LazyAuthorizationHelper.Value.PrincipalsHelper.CreateAuthorizedPrincipal($"{authorizationPrefix}{AccessControlUtils.TypeNameDelimiter}{principalName}", verifyPrincipalExistence: true, tenantInferred: fixedFqn != fqn);
        }
    }
}*/