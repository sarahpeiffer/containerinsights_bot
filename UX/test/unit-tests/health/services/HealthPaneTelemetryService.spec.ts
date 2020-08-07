// import { assert } from 'chai';
// import { ITelemetry, TelemetrySubArea } from '../../../../src/scripts/shared/Telemetry';
// import { TelemetryProviderFactory } from '../../../../src/scripts/container/health/factories/TelemetryProviderFactory';
// import { HealthPaneTelemetryService } from '../../../../src/scripts/container/health/services/HealthPaneTelemetryService';
// import { ErrorSeverity } from '../../../../src/scripts/shared/data-provider/TelemetryErrorSeverity';
// import { BladeContext } from '../../../../src/scripts/container/BladeContext';

// suite('unit | HealthPaneTelemetryService', () => {
//     let telemetryLogged;
//     let mockTelemetry: ITelemetry;
//     let mockTelemetryProviderFactory: TelemetryProviderFactory;
//     let mockClusterResourceId;
//     let mockClusterName;
//     let mockWorkspaceName: string;
//     let mockWorkspaceArmResourceId: string;

//     setup(() => {
//         mockClusterName = 'mock-cluster';
//         mockClusterResourceId = '/subscriptions/11111111-1111-1111-1111-111111111111'
//                 + '/resourceGroups/mock-rg/providers/Microsoft.ContainerService/managedClusters/' + mockClusterName;
    
//         mockWorkspaceName = 'mock-workspace-name';
//         mockWorkspaceArmResourceId = '/subscriptions/11111111-1111-1111-1111-111111111111'
//         + '/resourceGroups/mock-rg/providers/Microsoft.OperationalInsights/workspaces/' + mockWorkspaceName;

//         telemetryLogged = {
//             exceptions: [],
//             pageViews: [],
//             completions: [],
//             context: []
//         };
    
//         mockTelemetry = {
//             logEvent: (event, customProperties, customMetrics) => {},
//             logNavigationEvent: (source, destination) => {},
//             logException: (exception, handledAt, severity, customProperties, customMetrics) => { 
//                 telemetryLogged.exceptions.push({exception, severity}); 
//             },
//             logExceptionLimited: (key, exception, handledAt, severity) => {},
//             startLogEvent: (eventName, customProperties) => { 
//                 return { 
//                     complete: (props, metrics) => { 
//                         telemetryLogged.completions.push({ props, metrics }); 
//                     },
//                     fail: (error, props, metrics) => { 
//                         telemetryLogged.completions.push({ props, metrics, error }); 
//                     }
//                 }; 
//             },
//             logPageView: (pageName) => { 
//                 telemetryLogged.pageViews.push({pageName}); 
//             },
//             logDependency: (id, method, absoluteUrl, pathName, totalTime, success, resultCode) => {},
//             setContext: (customContext, replace) => {
//                 telemetryLogged.context.push({ context: customContext, replace });
//             },
//             flush: () => { return null; }
//         };

//         mockTelemetryProviderFactory = {
//             isConfigured: true,
//             getTelemetryProvider: () => { return mockTelemetry; }
//         };

//         BladeContext.instance().initialize(mockClusterResourceId, mockClusterName, mockWorkspaceArmResourceId);
//     });

//     test('It logs page view in onRender()', () => {
//         /** arrange */
//         const telemetryService = new HealthPaneTelemetryService(mockTelemetryProviderFactory);

//         /** act */
//         telemetryService.onPaneRender();

//         /** assert */
//         assert.equal(telemetryLogged.pageViews.length, 1);
//         assert.equal(telemetryLogged.pageViews[0].pageName, TelemetrySubArea.ContainerHealth.toString());
//     });

//     test('It sets correct telemetry context', () => {
//         /** arrange */
//         const telemetryService = new HealthPaneTelemetryService(mockTelemetryProviderFactory);

//         const expectedContext = {
//             cluster_id: mockClusterResourceId,
//             cluster_name: mockClusterName,
//             subArea: TelemetrySubArea.ContainerHealth,
//             workspace_id: mockWorkspaceArmResourceId,
//             workspace_name: mockWorkspaceName
//         };

//         /** act */
//         telemetryService.onPaneRender();

//         /** assert */
//         assert.equal(telemetryLogged.context.length, 1);
//         assert.isFalse(telemetryLogged.context[0].replace);
//         assert.deepEqual(telemetryLogged.context[0].context, expectedContext);
//     });

//     test('It logs exception in onRenderException()', () => {
//         /** arrange */
//         const telemetryService = new HealthPaneTelemetryService(mockTelemetryProviderFactory);
//         const expectedException: Error = new Error('Error');

//         /** act */
//         telemetryService.onPaneRenderException(expectedException);

//         /** assert */
//         assert.equal(telemetryLogged.exceptions.length, 1);
//         assert.equal(telemetryLogged.exceptions[0].severity, ErrorSeverity.Error);
//         assert.deepEqual(telemetryLogged.exceptions[0].exception, expectedException);
//     });

//     test('It completes finishable telemetry in onComplete...() upon success', () => {
//         /** arrange */
//         const telemetryService = new HealthPaneTelemetryService(mockTelemetryProviderFactory);

//         /** act */
//         const requestDescriptor = telemetryService.onStartLatestMonitorStatesRequest();
//         telemetryService.onCompleteLatestMonitorStatesRequest(requestDescriptor);

//         /** assert */
//         assert.equal(telemetryLogged.completions.length, 1);
//     });

//     test('It fails finishable telemetry in onComplete...() upon failure', () => {
//         /** arrange */
//         const telemetryService = new HealthPaneTelemetryService(mockTelemetryProviderFactory);
//         const expectedError = new Error('Error');
//         const expectedErrorProps = { handledAt: 'container/health/HealthPaneView.tsx' };

//         /** act */
//         const requestDescriptor = telemetryService.onStartLatestMonitorStatesRequest();
//         telemetryService.onCompleteLatestMonitorStatesRequest(requestDescriptor, expectedError);

//         /** assert */
//         assert.equal(telemetryLogged.completions.length, 1);
//         assert.deepEqual(telemetryLogged.completions[0].props, expectedErrorProps);
//         assert.deepEqual(telemetryLogged.completions[0].error, expectedError);
//     });

//     test('It logs error in onComplete...() upon failure', () => {
//         /** arrange */
//         const telemetryService = new HealthPaneTelemetryService(mockTelemetryProviderFactory);
//         const expectedError = new Error('Error');

//         /** act */
//         const requestDescriptor = telemetryService.onStartLatestMonitorStatesRequest();
//         telemetryService.onCompleteLatestMonitorStatesRequest(requestDescriptor, expectedError);

//         /** assert */
//         assert.equal(telemetryLogged.exceptions.length, 1);
//         assert.deepEqual(telemetryLogged.exceptions[0].exception, expectedError);
//     });
// });
