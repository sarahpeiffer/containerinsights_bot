// import { assert } from 'chai';

// import { IHealthMonitorDisplayStringService } from '../../../src/scripts/container/health/services/HealthMonitorDisplayStringService';
// import { HealthPaneViewModel } from '../../../src/scripts/container/health/viewmodels/HealthPaneViewModel';
// import { IHealthModelService } from '../../../src/scripts/container/health/services/HealthModelService';
// import { IHealthModel } from '../../../src/scripts/container/health/IHealthModel';
// import { HealthState } from '../../../src/scripts/container/health/HealthState';
// import { IHealthPaneTelemetryService } from '../../../src/scripts/container/health/services/IHealthPaneTelemetryService';

// suite('unit | HealthPaneViewModel', () => {
//     const mockTopLevelMonitorSubjectId = 'cluster';
//     const mockNodesMonitorSubjectId = 'nodes';
//     const mockInfraMonitorSubjectId = 'k8s_infrastructure';

//     const mockNode1MonitorSubjectId = 'node1';
//     const mockNode2MonitorSubjectId = 'node2';

//     let mockHealthModel: IHealthModel;
//     let mockHealthModelService: IHealthModelService;
//     let mockDisplayStringService: IHealthMonitorDisplayStringService;
//     let mockTelemetryService: IHealthPaneTelemetryService;

//     setup(() => {
//         mockHealthModel = {
//             topLevelMonitorSubjectId: mockTopLevelMonitorSubjectId,
//             monitors: {
//                 cluster: {
//                     typeId: mockTopLevelMonitorSubjectId,
//                     subjectId: mockTopLevelMonitorSubjectId,
//                     state: HealthState.Critical,
//                     memberSubjectIds: [mockNodesMonitorSubjectId, mockInfraMonitorSubjectId],
//                     firstObservedDateTimeUtc: new Date(2019, 5, 30, 10, 16, 0, 0),
//                     lastUpdatedDateTimeUtc: new Date(2019, 5, 30, 10, 16, 0, 0)
//                 },
//                 nodes: {
//                     typeId: mockNodesMonitorSubjectId,
//                     subjectId: mockNodesMonitorSubjectId,
//                     state: HealthState.Critical,
//                     memberSubjectIds: null,
//                     firstObservedDateTimeUtc: new Date(2019, 5, 30, 10, 16, 0, 0),
//                     lastUpdatedDateTimeUtc: new Date(2019, 5, 30, 10, 16, 0, 0)
//                 },
//                 k8s_infrastructure: {
//                     typeId: mockInfraMonitorSubjectId,
//                     subjectId: mockInfraMonitorSubjectId,
//                     state: HealthState.Warning,
//                     memberSubjectIds: null,
//                     firstObservedDateTimeUtc: new Date(2019, 5, 30, 10, 16, 0, 0),
//                     lastUpdatedDateTimeUtc: new Date(2019, 5, 30, 10, 16, 0, 0)
//                 },
//                 node1: {
//                     typeId: mockNode1MonitorSubjectId,
//                     subjectId: mockNode1MonitorSubjectId,
//                     state: HealthState.Critical,
//                     memberSubjectIds: null,
//                     firstObservedDateTimeUtc: new Date(2019, 5, 30, 10, 16, 0, 0),
//                     lastUpdatedDateTimeUtc: new Date(2019, 5, 30, 10, 16, 0, 0)
//                 },
//                 node2: {
//                     typeId: mockNode2MonitorSubjectId,
//                     subjectId: mockNode2MonitorSubjectId,
//                     state: HealthState.Healthy,
//                     memberSubjectIds: null,
//                     firstObservedDateTimeUtc: new Date(2019, 5, 30, 10, 16, 0, 0),
//                     lastUpdatedDateTimeUtc: new Date(2019, 5, 30, 10, 16, 0, 0)
//                 },
//             }
//         };

//         mockHealthModelService = {
//             getHealthModel: () => { return new Promise((resolve) => { resolve(mockHealthModel)}); },
//         };

//         mockDisplayStringService = {
//             getInTreeDisplayName: (subject) => { return null; },
//             getStandaloneDisplayName: (subject) => { return null; },
//             getStateDisplayName: (state) => { return null; },
//             getDescription: (subject) => { return null; },
//             getMonitorDetailsViewTypeName: (monitorTypeId) => { return null; }
//         };

//         mockTelemetryService = {
//             onPaneRender: () => { },
//             onPaneRenderException: (error) => {},
//             onStartLatestMonitorStatesRequest: () => { return null; },
//             onCompleteLatestMonitorStatesRequest: (request, error) => {}
//         };
//     });

//     test('It returns newly set selected monitor (instance) id', () => {
//         /** arrange */
//         const healthPaneViewModel = new HealthPaneViewModel(
//             mockHealthModelService, 
//             mockDisplayStringService,
//             mockTelemetryService);

//         /** act */
//         return healthPaneViewModel.initialize().then(() => {
//             healthPaneViewModel.selectedMonitorIdentifier = mockNodesMonitorSubjectId;

//             /** assert */
//             assert.equal(healthPaneViewModel.selectedMonitorIdentifier, mockNodesMonitorSubjectId);
//         });
//     });

//     test('It sets view model to "loading" once onReload() is invoked', () => {
//         /** arrange */
//         const healthPaneViewModel = new HealthPaneViewModel(
//             mockHealthModelService, 
//             mockDisplayStringService,
//             mockTelemetryService);

//         /** act */
//         healthPaneViewModel.initialize().then(() => {
//             healthPaneViewModel.onReload();

//             /** assert */
//             assert.isFalse(healthPaneViewModel.isLoaded);
//         });
//     });

//     test('It sets monitor details panel to be not visible initially', () => {
//         /** arrange */
//         const healthPaneViewModel = new HealthPaneViewModel(
//             mockHealthModelService, 
//             mockDisplayStringService,
//             mockTelemetryService);

//         /** act */
//         healthPaneViewModel.initialize().then(() => {

//             /** assert */
//             assert.isFalse(healthPaneViewModel.isMonitorPropertyPaneVisible);
//         });
//     });

//     test('It sets monitor details panel to be visible once monitor is selected', () => {
//         /** arrange */
//         const healthPaneViewModel = new HealthPaneViewModel(
//             mockHealthModelService, 
//             mockDisplayStringService,
//             mockTelemetryService);

//         /** act */
//         healthPaneViewModel.initialize().then(() => {
//             healthPaneViewModel.selectedAspectIdentifier = mockNodesMonitorSubjectId;
//             healthPaneViewModel.selectedMonitorIdentifier = mockNode1MonitorSubjectId;

//             /** assert */
//             assert.isTrue(healthPaneViewModel.isMonitorPropertyPaneVisible);
//         });
//     });

//     test('It returns selected aspect id', () => {
//         /** arrange */
//         const healthPaneViewModel = new HealthPaneViewModel(
//             mockHealthModelService, 
//             mockDisplayStringService,
//             mockTelemetryService);

//         /** act */
//         healthPaneViewModel.initialize().then(() => {
//             healthPaneViewModel.selectedAspectIdentifier = mockNodesMonitorSubjectId;
            
//             /** assert */
//             assert.equal(healthPaneViewModel.selectedAspectIdentifier, mockNodesMonitorSubjectId);
//         });
//     });

//     test('It preserves selected monitor id between aspect switches ', () => {
//         /** arrange */
//         const healthPaneViewModel = new HealthPaneViewModel(
//             mockHealthModelService, 
//             mockDisplayStringService,
//             mockTelemetryService);

//         /** act */
//         healthPaneViewModel.initialize().then(() => {
//             healthPaneViewModel.selectedAspectIdentifier = mockNodesMonitorSubjectId;
//             const initialSelectedMonitorId = healthPaneViewModel.selectedMonitorIdentifier;

//             const selectedMonitorId = mockNode2MonitorSubjectId;
//             healthPaneViewModel.selectedMonitorIdentifier = selectedMonitorId;

//             healthPaneViewModel.selectedAspectIdentifier = mockInfraMonitorSubjectId;
//             const differentAspectSelectedMonitorId = healthPaneViewModel.selectedMonitorIdentifier;

//             healthPaneViewModel.selectedAspectIdentifier = mockNodesMonitorSubjectId;

//             /** assert */
//             assert.isNull(initialSelectedMonitorId);
//             assert.isNull(differentAspectSelectedMonitorId);
//             assert.equal(healthPaneViewModel.selectedMonitorIdentifier, selectedMonitorId);
//         });
//     });

//     test('It set selected aspect id during initialization', () => {
//         /** arrange */
//         const healthPaneViewModel = new HealthPaneViewModel(
//             mockHealthModelService, 
//             mockDisplayStringService,
//             mockTelemetryService);

//         /** act */
//         healthPaneViewModel.initialize().then(() => {
//             const aspectId = healthPaneViewModel.selectedAspectIdentifier;
//             const topLevelMonitor = mockHealthModel.monitors[mockHealthModel.topLevelMonitorSubjectId];
            
//             const aspectMonitorIndexInTopLevelMembers = 
//                 topLevelMonitor.memberSubjectIds.findIndex((value) => { return value === aspectId; });

//             /** assert */
//             assert.isNotNull(aspectId);
//             assert.isTrue(aspectMonitorIndexInTopLevelMembers > 0);
//         });
//     });

//     suite('construction/initialization', () => {
//         test('It returns display strings service provided to ctor()', () => {
//             /** arrange */
//             const healthPaneViewModel = new HealthPaneViewModel(
//                 mockHealthModelService, 
//                 mockDisplayStringService,
//                 mockTelemetryService);

//             /** act */
//             return healthPaneViewModel.initialize().then(() => {

//                 /** assert */
//                 assert.deepEqual(healthPaneViewModel.displayStringService, mockDisplayStringService);
//             });
//         });

//         test('It returns error if health model loading failed', () => {
//             /** arrange */
//             const errorObject = {
//                 message: 'error',
//                 code: 123
//             };

//             const testHealthModelService: IHealthModelService = {
//                 getHealthModel: () => { 
//                     return new Promise((resolve, reject) => { reject(errorObject); });
//                 } 
//             };

//             const healthPaneViewModel = new HealthPaneViewModel(
//                 testHealthModelService, 
//                 mockDisplayStringService,
//                 mockTelemetryService);

//             /** act */
//             return healthPaneViewModel.initialize().catch((error) => {

//                 /** assert */
//                 assert.isTrue(healthPaneViewModel.isLoaded);
//                 assert.deepEqual(error, errorObject);
//             });
//         });

//         test('It returns "no data" if health model has none', () => {
//             /** arrange */
//             const testHealthModelService: IHealthModelService = {
//                 getHealthModel: () => { 
//                     return new Promise((resolve) => { resolve(null); });
//                 } 
//             };

//             const healthPaneViewModel = new HealthPaneViewModel(
//                 testHealthModelService, 
//                 mockDisplayStringService,
//                 mockTelemetryService);

//             /** act */
//             return healthPaneViewModel.initialize().then(() => {

//                 /** assert */
//                 assert.isTrue(healthPaneViewModel.isLoaded);
//                 assert.isFalse(healthPaneViewModel.hasData);
//             });
//         });

//         test('It returns "loaded successfully" if health model loaded Ok', () => {
//             /** arrange */
//             const healthPaneViewModel = new HealthPaneViewModel(
//                 mockHealthModelService, 
//                 mockDisplayStringService,
//                 mockTelemetryService);

//             /** act */
//             return healthPaneViewModel.initialize().then(() => {

//                 /** assert */
//                 assert.isTrue(healthPaneViewModel.isLoaded);
//                 assert.isTrue(healthPaneViewModel.loadSucceeded);
//             });
//         });
//     });

//     suite('Default expanded/collapsed health tree nodes', () => {
//         test('Top level monitor is expanded by default', () => {
//             /** arrange */
//             const healthPaneViewModel = new HealthPaneViewModel(
//                 mockHealthModelService,
//                 mockDisplayStringService,
//                 mockTelemetryService);

//             /** act */
//             return healthPaneViewModel.initialize().then(() => {
//                 const treeNode = healthPaneViewModel.healthMonitorService.getHealthTreeNode(mockTopLevelMonitorSubjectId);

//                 /** assert */
//                 assert.isTrue(treeNode.isExpanded);
//             });
//         });

//         test('Aspect monitor is expanded by default', () => {
//             /** arrange */
//             const healthPaneViewModel = new HealthPaneViewModel(
//                 mockHealthModelService,
//                 mockDisplayStringService,
//                 mockTelemetryService);

//             /** act */
//             return healthPaneViewModel.initialize().then(() => {
//                 /** assert */
//                 let treeNode = healthPaneViewModel.healthMonitorService.getHealthTreeNode(mockNodesMonitorSubjectId);
//                 assert.isTrue(treeNode.isExpanded);

//                 treeNode = healthPaneViewModel.healthMonitorService.getHealthTreeNode(mockInfraMonitorSubjectId);
//                 assert.isTrue(treeNode.isExpanded);
//             });
//         });

//         test('Aspect member monitor is expanded if in bad state', () => {
//             /** arrange */
//             const healthPaneViewModel = new HealthPaneViewModel(
//                 mockHealthModelService,
//                 mockDisplayStringService,
//                 mockTelemetryService);

//             /** act */
//             return healthPaneViewModel.initialize().then(() => {
//                 const treeNode = healthPaneViewModel.healthMonitorService.getHealthTreeNode(mockNode1MonitorSubjectId);

//                 /** assert */
//                 assert.isTrue(treeNode.isExpanded);
//             });
//         });

//         test('Aspect member monitor is collapsed if healthy', () => {
//             /** arrange */
//             const healthPaneViewModel = new HealthPaneViewModel(
//                 mockHealthModelService,
//                 mockDisplayStringService,
//                 mockTelemetryService);

//             /** act */
//             return healthPaneViewModel.initialize().then(() => {
//                 const treeNode = healthPaneViewModel.healthMonitorService.getHealthTreeNode(mockNode2MonitorSubjectId);

//                 /** assert */
//                 assert.isFalse(treeNode.isExpanded);
//             });
//         });
//     });

//     suite('telemetry', () => {
//         setup(() => {
//             mockTelemetryService = {
//                 onPaneRender: () => { },
//                 onPaneRenderException: (error) => {},
//                 onStartLatestMonitorStatesRequest: () => { return null; },
//                 onCompleteLatestMonitorStatesRequest: (request, error) => {}
//             };
//         });

//         test('It returns telemetry provider supplied by telemetry service provided in ctor()', () => {
//             /** arrange */
//             const healthPaneViewModel = new HealthPaneViewModel(
//                 mockHealthModelService, 
//                 mockDisplayStringService,
//                 mockTelemetryService);

//             /** act */
//             return healthPaneViewModel.initialize().then(() => {

//                 /** assert */
//                 assert.deepEqual(healthPaneViewModel.telemetryService, mockTelemetryService);
//             });
//         });

//         test('It calls telemetry service in onRender()', () => {
//             /** arrange */
//             let isTelemetryServiceCalled: boolean = false;

//             const testTelemetryService: IHealthPaneTelemetryService = { ...mockTelemetryService };
//             testTelemetryService.onPaneRender = () => { isTelemetryServiceCalled = true; }

//             const healthPaneViewModel = new HealthPaneViewModel(
//                 mockHealthModelService, 
//                 mockDisplayStringService,
//                 testTelemetryService);

//             /** act */
//             return healthPaneViewModel.initialize().then(() => {
//                 healthPaneViewModel.onRender(),

//                 /** assert */
//                 assert.isTrue(isTelemetryServiceCalled);
//             });
//         });

//         test('It calls telemetry service in onRenderException()', () => {
//             /** arrange */
//             let loggedException: string | Error = null;

//             const testTelemetryService: IHealthPaneTelemetryService = { ...mockTelemetryService };
//             testTelemetryService.onPaneRenderException = (error) => { loggedException = error; }

//             const healthPaneViewModel = new HealthPaneViewModel(
//                 mockHealthModelService, 
//                 mockDisplayStringService,
//                 testTelemetryService);

//             const expectedException: Error = new Error('Error');

//             /** act */
//             return healthPaneViewModel.initialize().then(() => {
//                 healthPaneViewModel.onRenderException(expectedException),

//                 /** assert */
//                 assert.deepEqual(loggedException, expectedException);
//             });
//         });
//     });
// });
