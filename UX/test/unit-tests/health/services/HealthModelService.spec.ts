// import { assert } from 'chai';

// import { IHealthDataProvider } from '../../../../src/scripts/container/health/services/data-provider/HealthDataProvider';
// import { HealthModelService } from '../../../../src/scripts/container/health/services/HealthModelService';
// import { 
//     IHealthQueryResponseInterpreter 
// } from '../../../../src/scripts/container/health/services/data-provider/HealthQueryResponseInterpreter';
// import { IHealthModel } from '../../../../src/scripts/container/health/IHealthModel';
// import { 
//     IHealthPaneTelemetryService, 
//     IRequestDescriptor 
// } from '../../../../src/scripts/container/health/services/IHealthPaneTelemetryService';
// import { IKubernetesCluster } from '../../../../src/scripts/container/IBladeContext';
// import { IAzureResource } from '../../../../src/scripts/shared/IAzureResource';

// suite('unit | HealthModelService', () => {
//     const mockCluster: IKubernetesCluster = {
//         isAzureKubernetesServicesCluster: false,
//         givenName: 'cluster-name',
//         resourceId: null,
//         resourceName: null,
//         resourceGroupName: null,
//         subscriptionId: null
//     };

//     const mockWorkspace: IAzureResource = {
//         resourceId: 'workspace-resource-id',
//         resourceName: 'workspace-name',
//         resourceGroupName: 'group-name',
//         subscriptionId: 'sub-id'
//     };

//     suite('HealthDataProvider usage', () => {
//         let mockResponseInterpreter: IHealthQueryResponseInterpreter;
//         let mockHealthDataProvider: IHealthDataProvider;
//         let mockQueryResult: any;
//         let mockHealthModel: IHealthModel;
//         let mockTelemetryService: IHealthPaneTelemetryService;

//         setup(() => {
//             mockQueryResult = {
//                 tables: {
//                     rows: [
//                         { value: 'row1'},
//                         { value: 'row2'},
//                     ]
//                 }
//             };

//             mockHealthDataProvider = {
//                 getLatestMonitorStates: (workspace, cluster, requestId): Promise<any> => {
//                     return new Promise((resolve) => resolve(mockQueryResult));
//                 }
//             };

//             mockResponseInterpreter = {
//                 processLatestHealthMonitorStatesQueryResult: (result: any) => { return mockHealthModel; }
//             };
            
//             mockHealthModel = {
//                 monitors: null,
//                 topLevelMonitorSubjectId: 'cluster'
//             };

//             mockTelemetryService = {
//                 onPaneRender: () => { },
//                 onPaneRenderException: (error) => {},
//                 onStartLatestMonitorStatesRequest: () => { return { requestId: 'abc', requestTelemetryHandle: null }; },
//                 onCompleteLatestMonitorStatesRequest: (request, error) => {}
//             };
//         });

//         test('It uses supplied data provider to obtain health state transitions from store', () => {
//             /** arrange */
//             let callCount = 0;

//             const testHealthDataProvider: IHealthDataProvider = {
//                 getLatestMonitorStates: (workspace, cluster, requestId): Promise<any> => {
//                     callCount++;
//                     return new Promise((resolve) => resolve(mockQueryResult));
//                 }
//             };

//             const service: HealthModelService = new HealthModelService(
//                 mockTelemetryService, 
//                 testHealthDataProvider, 
//                 mockResponseInterpreter, 
//                 mockWorkspace, 
//                 mockCluster);

//             /** act */
//             return service.getHealthModel()
//                 .then((result) => {

//                     /** assert */
//                     assert.equal(callCount, 1);
//                 });
//         });

//         test('It passes workspace supplied to HealthModelService ctor to the healthDataProvider.getLatestMonitorStates()', () => {
//             /** arrange */

//             const testHealthDataProvider: IHealthDataProvider = {
//                 getLatestMonitorStates: (workspace, cluster, requestId): Promise<any> => {
//                     /** assert */
//                     assert.deepEqual(workspace, mockWorkspace)
//                     return new Promise((resolve) => resolve(mockQueryResult));
//                 }
//             };

//             const service: HealthModelService = new HealthModelService(
//                 mockTelemetryService, 
//                 testHealthDataProvider, 
//                 mockResponseInterpreter, 
//                 mockWorkspace, 
//                 mockCluster);

//             /** act */
//             return service.getHealthModel();
//         });

//         test('It passes cluster supplied to HealthModelService ctor to the healthDataProvider.getLatestMonitorStates()', () => {
//             /** arrange */

//             const testHealthDataProvider: IHealthDataProvider = {
//                 getLatestMonitorStates: (workspace, cluster, requestId): Promise<any> => {
//                     /** assert */
//                     assert.equal(cluster, mockCluster)
//                     return new Promise((resolve) => resolve(mockQueryResult));
//                 }
//             };

//             const service: HealthModelService = new HealthModelService(
//                 mockTelemetryService,
//                 testHealthDataProvider, 
//                 mockResponseInterpreter, 
//                 mockWorkspace, 
//                 mockCluster);

//             /** act */
//             return service.getHealthModel();
//         });

//         suite('Response interpreter usage', () => {
//             test('It supplies results returned by data provider to the response interpreter', () => {
//                 /** arrange */

//                 const testResponseInterpreter: IHealthQueryResponseInterpreter = {
//                     processLatestHealthMonitorStatesQueryResult: (result: any) => { 
                        
//                         /** assert */
//                         assert.deepEqual(result, mockQueryResult);
//                         return mockHealthModel; 
//                     }
//                 };

//                 const service: HealthModelService = new HealthModelService(
//                     mockTelemetryService, 
//                     mockHealthDataProvider, 
//                     testResponseInterpreter, 
//                     mockWorkspace, 
//                     mockCluster);

//                 /** act */
//                 return service.getHealthModel();
//             });

//             test('It returns health model supplied by the response interpreter', () => {
//                 /** arrange */

//                 const service: HealthModelService = new HealthModelService(
//                     mockTelemetryService,
//                     mockHealthDataProvider, 
//                     mockResponseInterpreter, 
//                     mockWorkspace, 
//                     mockCluster);

//                 /** act */
//                 return service.getHealthModel()
//                     .then((result) => {

//                         /** assert */
//                         assert.deepEqual(result, mockHealthModel);
//                     });
//             });
//         });

//         suite('reject()\'s', () => {
//             test('It rejects in case data provider fails', () => {
//                 /** arrange */
//                 const expectedError = new Error('Error');

//                 const testHealthDataProvider: IHealthDataProvider = {
//                     getLatestMonitorStates: (workspace, cluster, requestId): Promise<any> => {
//                         return new Promise((resolve, reject) => reject(expectedError));
//                     }
//                 };
    
//                 const service: HealthModelService = new HealthModelService(
//                     mockTelemetryService,
//                     testHealthDataProvider, 
//                     mockResponseInterpreter, 
//                     mockWorkspace, 
//                     mockCluster);

//                 /** act */
//                 return service.getHealthModel()

//                     /** assert */
//                     .then(() => { 
//                         assert.fail('must not reach then');
//                     })
//                     .catch((error) => {
//                         assert.deepEqual(error, expectedError);
//                     });
//             });

//             test('It rejects in case response interpreter throws', () => {
//                 /** arrange */
//                 const expectedError = new Error('Error');

//                 const testResponseInterpreter: IHealthQueryResponseInterpreter = {
//                     processLatestHealthMonitorStatesQueryResult: (result: any) => { throw expectedError; }
//                 };

//                 const service: HealthModelService = new HealthModelService(
//                     mockTelemetryService,
//                     mockHealthDataProvider, 
//                     testResponseInterpreter, 
//                     mockWorkspace, 
//                     mockCluster);

//                 /** act */
//                 return service.getHealthModel()

//                     /** assert */
//                     .then(() => { 
//                         assert.fail('must not reach then');
//                     })
//                     .catch((error) => {
//                         assert.deepEqual(error, expectedError);
//                     });
//             });
//         });

//         suite('telemetry', () => {
//             const mockRequestId: string = 'abc';
//             const mockRequestTelemetryHandle = {
//                 property1: 'value1',
//                 property2: 'value2'
//             };

//             const mockRequestDescriptor: IRequestDescriptor = {
//                 requestId: mockRequestId,
//                 requestTelemetryHandle: mockRequestTelemetryHandle
//             };

//             test('It reports query completion upon success', () => {
//                 /** arrange */
//                 let completionRequestDescriptor: IRequestDescriptor = null;
//                 let completionError: string | Error;

//                 const testTelemetryService: IHealthPaneTelemetryService = { ...mockTelemetryService };
//                 testTelemetryService.onStartLatestMonitorStatesRequest = () => { return mockRequestDescriptor; };

//                 testTelemetryService.onCompleteLatestMonitorStatesRequest = (requestDescriptor, error) => {
//                     completionRequestDescriptor = requestDescriptor;
//                     completionError = error;
//                 };

//                 const service: HealthModelService = new HealthModelService(
//                     testTelemetryService,
//                     mockHealthDataProvider, 
//                     mockResponseInterpreter, 
//                     mockWorkspace, 
//                     mockCluster);

//                 /** act */
//                 return service.getHealthModel()

//                     /** assert */
//                     .then(() => { 
//                         assert.deepEqual(completionRequestDescriptor, mockRequestDescriptor);
//                         assert.isUndefined(completionError);
//                     });
//             });

//             test('It reports query failure upon error', () => {
//                 /** arrange */
//                 let completionRequestDescriptor: IRequestDescriptor = null;
//                 let completionError: string | Error;

//                 const testTelemetryService: IHealthPaneTelemetryService = { ...mockTelemetryService };
//                 testTelemetryService.onStartLatestMonitorStatesRequest = () => { return mockRequestDescriptor; };

//                 testTelemetryService.onCompleteLatestMonitorStatesRequest = (requestDescriptor, error) => {
//                     completionRequestDescriptor = requestDescriptor;
//                     completionError = error;
//                 };

//                 const expectedError = new Error('Error');

//                 const testHealthDataProvider: IHealthDataProvider = {
//                     getLatestMonitorStates: (workspace, cluster, requestId): Promise<any> => {
//                         return new Promise((resolve, reject) => reject(expectedError));
//                     }
//                 };

//                 const service: HealthModelService = new HealthModelService(
//                     testTelemetryService,
//                     testHealthDataProvider, 
//                     mockResponseInterpreter, 
//                     mockWorkspace, 
//                     mockCluster);

//                 /** act */
//                 return service.getHealthModel()

//                     /** assert */
//                     .then(() => { 
//                         assert.fail('must not reach then');
//                     })
//                     .catch((error) => {
//                         assert.deepEqual(completionRequestDescriptor, mockRequestDescriptor);
//                         assert.deepEqual(completionError, expectedError);
//                     });
//             });
//         });
//     });
// });
