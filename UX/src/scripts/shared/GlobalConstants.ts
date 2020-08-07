// ai instrumention key and cloud map for container insights
// gangams: decision to use public cloud ikey for all the clouds telemetry
export const ContainerInsightsApplicationInsighstKeyMap = {
    PublicCloud: '68244996-2561-46bb-b599-95bf32874a1c',
};

export const MaxArmRequestTimeoutMs: number = 120000;
export const ServiceMapApiVersion: string = '2015-11-01-preview';
export const MicrosoftContainerServiceApiVersion: string = '2019-11-01';
export const MicrosoftGrapApiVersion: string = '1.6';
export const MicrosoftAuthorizationApiVersion = '2018-01-01-preview';
export const monitoringMetricsPublisherRoleGUID = '3913510d-42f4-4e42-8a64-420c390055eb';

// tslint:disable-next-line:max-line-length
export const BasePortalUri: string = 'https://portal.azure.com/?feature.infrainsights=true#blade/Microsoft_Azure_Monitoring/InfraInsightsBrowseBlade/${ACTION}/navigationContext/${CONTENT_FILL}';
export const BaseDebugPortalUri: string = 'https://portal.azure.com/?feature.baseline=true&feature.infrainsights=true&feature.customportal=false&feature.canmodifyextensions=true#blade/Microsoft_Azure_Monitoring/InfraInsightsBrowseBlade/${ACTION}/navigationContext/${CONTENT_FILL}?testExtensions={"Microsoft_Azure_Monitoring":"https://localhost:${MON_EXT_PORT}/"}';
export const MonitoringExtensionLocalPort: string = '48300';

// VmInsight's telemetry logs will go to App Insights resource with below instrumentation key.
export const VmInsightsTelemetryInstrumentationKey: string = '6d0f5a98-ab2c-4a88-a3d1-5dc3770350fa';

//https://dev.loganalytics.io/documentation/Using-the-API/Timeouts
export const DefaultDraftRequestTimeoutMs: number = 180000; // 3min
export const MaxDraftRequestTimeoutMs: number = 600000;  //10 min

export const ChartDraftRequestTimeoutMs: number = 30000;

/**
 *  Max number of allowed requests for optimal perf in Draft Batch Request
 *  Note: 9/16/19, Per discussion with Draft team, going with batch size 1
 */
export const MaxAllowedRequestsInBatch = 1;

/**
 *  Default Relative Timespan 30mins for Multicluster queries
 *  Note: This format only used for initial blade load queries
 *  and subsequent loads are used variable timespan format
 */
export const DefaultRelativeTimeSpan: string = 'PT30M';

/**
 * HTTP Response Status codes
 */
export enum HttpResponseStatusCode {
    ServerUnavailable = 503,
    BadRequest = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    Teapot = 418,
    TooManyRequests = 429,
    OK = 200,
}

// application ids used for Kusto calls
export const InfraInsightsApplicationId = 'infraInsights';
export const VMInsightsApplicationId = InfraInsightsApplicationId + '/vm';
export const StorageInsightsApplicationId = InfraInsightsApplicationId + '/storage';
export const ContainerInsightsApplicationId = InfraInsightsApplicationId + '/container';
export const MultiAksConatinerInsightsApplicationId = InfraInsightsApplicationId + '/multiakscontainer';


// define Number.MAX_SAFE_INTEGER and MIN_SAFE_INTEGER here since its not supported in ie11
// Support matrix: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MIN_SAFE_INTEGER
export const MAX_SAFE_INTEGER: number = 9007199254740991;
export const MIN_SAFE_INTEGER: number = -9007199254740991;

//onboarding short links for container insights
export const aroV4OnboardingLink: string = 'https://aka.ms/arov4-ci-onboarding';
export const azureArcOnboardingLink: string = 'https://aka.ms/arc-k8s-ci-onboarding';
//this onboarding link used for on-prem, openshiftv4 and aks-engine
export const aksEngineOnboardingLink: string = 'https://aka.ms/acs-engine-ci-onboarding';
