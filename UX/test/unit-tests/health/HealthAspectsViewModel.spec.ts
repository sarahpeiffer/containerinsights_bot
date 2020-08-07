// import * as moment from 'moment';
// import { assert } from 'chai';

// import { IHealthMonitorService } from '../../../src/scripts/container/health/services/HealthMonitorService';
// import { IHealthMonitorDisplayStringService } from '../../../src/scripts/container/health/services/HealthMonitorDisplayStringService';
// import { IHealthPaneViewModel } from '../../../src/scripts/container/health/viewmodels/HealthPaneViewModel';
// import { HealthAspectsViewModel } from '../../../src/scripts/container/health/viewmodels/HealthAspectsViewModel';
// import { HealthAspectsModel } from '../../../src/scripts/container/health/models/HealthAspectsModel';
// import { HealthState } from '../../../src/scripts/container/health/HealthState';
// import { IHealthAspect } from '../../../src/scripts/container/health/IHealthAspect';

// suite('unit | HealthAspectsViewModel', () => {
//     let mockClusterState: HealthState;
//     let mockClusterStateFirstObservedDateTime: Date;
//     let mockClusterStateLastUpdatedDateTime: Date;

//     let mockAspect1Identifier: string;
//     let mockAspect1State: HealthState;
//     let mockAspect1DisplayName: string;
//     let mockAspect2Identifier: string;
//     let mockAspect2State: HealthState;
//     let mockAspect2DisplayName: string;

//     let mockAspects: IHealthAspect[];

//     let mockHealthMonitorService: IHealthMonitorService;
//     let mockDisplayStringService: IHealthMonitorDisplayStringService;
//     let mockHealthPaneViewModel: IHealthPaneViewModel;

//     setup(() => {
//         mockClusterState = HealthState.Critical;
//         mockClusterStateFirstObservedDateTime = new Date(2019, 5, 29, 1, 45, 30, 456); // 5/29/2019 1:45:30.456
//         mockClusterStateLastUpdatedDateTime = new Date(2019, 6, 29, 1, 45, 30, 456); // 6/29/2019 1:45:30.456
    
//         mockAspect1Identifier = 'mockAspect1Identifier';
//         mockAspect1State = HealthState.Warning;
//         mockAspect1DisplayName = 'mockAspect1DisplayName';
//         mockAspect2Identifier = 'mockAspect2Identifier';
//         mockAspect2State = HealthState.Critical;
//         mockAspect2DisplayName = 'mockAspect2DisplayName';

//         mockAspects = [
//             { 
//                 aspectIdentifier: mockAspect1Identifier,
//                 state: mockAspect1State, 
//                 displayName: mockAspect1DisplayName,
//             },
//             { 
//                 aspectIdentifier: mockAspect2Identifier,
//                 state: mockAspect2State, 
//                 displayName: mockAspect2DisplayName,
//             },
//         ];
    
//         // mockMonitorIdentifier = 'monitorId';
//         // mockMonitorState = HealthState.Critical;
//         // mockMonitorStateFirstObservedDateTime = new Date(2019, 5, 29, 1, 45, 30, 456); // 5/29/2019 1:45:30.456
//         // mockMonitorSubject = {
//         //     monitorTypeId: 'monitorTypeId',
//         //     labels: {
//         //         label1: 'value1',
//         //         label2: 'value2'
//         //     }
//         // };
    
//         // mockStandaloneDisplayName = 'standalone display name';
//         // mockDescription = 'description';

//         mockHealthMonitorService = {
//             getClusterHealthAspects: () => {
//                 return new HealthAspectsModel(
//                     mockClusterState,
//                     mockClusterStateFirstObservedDateTime,
//                     mockClusterStateLastUpdatedDateTime,
//                     mockAspects
//                 );
//             },
//             getHealthTreeNode: (monitorIdentifier) => { return null; },
//             getMonitorConfig: (monitorIdentifier) => { return null; },
//             getMonitorPropertyPanelHeader: (monitorIdentifier) => { return null; },
//             getMonitorDescription: (monitorIdentifier) => { return null; },
//             getDefaultSelectedAspectIdentifier: () => mockAspect1Identifier,
//             getMonitor: (monitorIdentifier) => { return null; },
//             toggleExpand: (monitorIdentifier) => null
//         };

//         // let subjectMatchesMock: (subject: IHealthMonitorSubject) => boolean = (subject) => {
//         //     return (
//         //         (subject.monitorTypeId === mockMonitorSubject.monitorTypeId) &&
//         //         (subject.labels.label1 === mockMonitorSubject.labels.label1) &&
//         //         (subject.labels.label2 === mockMonitorSubject.labels.label2)
//         //     );
//         // };

//         mockDisplayStringService = {
//             getInTreeDisplayName: (subject) => { return null; },
//             getStandaloneDisplayName: (subject) => { return null; },
//             getStateDisplayName: (state) => { return null; },
//             getDescription: (subject) => { return null; },
//             getMonitorDetailsViewTypeName: (monitorTypeId) => { return null; }

//         };

//         mockHealthPaneViewModel = {
//             healthMonitorService: mockHealthMonitorService,
//             displayStringService: mockDisplayStringService,
//             selectedMonitorIdentifier: null,
//             selectedAspectIdentifier: mockAspect1Identifier,
//             isMonitorPropertyPaneVisible: false,
//             telemetryService: null
//         };
//     });

//     test('It returns state of the cluster monitor provided by model', () => {
//         /** arrange */

//         /** act */
//         const aspectsViewModel = new HealthAspectsViewModel(mockHealthPaneViewModel);
//         aspectsViewModel.initialize();

//         /** assert */
//         assert.equal(aspectsViewModel.state, mockClusterState);
//     });

//     test('It returns aspects provided by model', () => {
//         /** arrange */

//         /** act */
//         const aspectsViewModel = new HealthAspectsViewModel(mockHealthPaneViewModel);
//         aspectsViewModel.initialize();

//         /** assert */
//         assert.deepEqual(aspectsViewModel.aspects, mockAspects);
//     });

//     test('It returns selected aspect id provided by parent view model', () => {
//         /** arrange */

//         /** act */
//         const aspectsViewModel = new HealthAspectsViewModel(mockHealthPaneViewModel);
//         aspectsViewModel.initialize();

//         /** assert */
//         assert.equal(aspectsViewModel.selectedAspectIdentifier, mockHealthPaneViewModel.selectedAspectIdentifier);
//     });

//     test('It gets absolute state observed date time for cluster monitor', () => {
//         /** arrange */
//         const expectedStringValue = moment(mockClusterStateFirstObservedDateTime).format('LLL');

//         /** act */
//         const aspectsViewModel = new HealthAspectsViewModel(mockHealthPaneViewModel);
//         aspectsViewModel.initialize();

//         /** assert */
//         assert.equal(aspectsViewModel.absoluteLastStateChangeDateTime, expectedStringValue);
//     });

//     test('It gets relative state observed date time for cluster monitor', () => {
//         /** arrange */
//         const mockTimeNow = moment(mockClusterStateFirstObservedDateTime).add(3, 'm');
//         const expectedStringValue = '3 minutes ago';

//         /** act */
//         const aspectsViewModel = new HealthAspectsViewModel(mockHealthPaneViewModel);
//         aspectsViewModel.initialize();

//         /** assert */
//         assert.equal(aspectsViewModel.getRelativeLastStateChangeDateTime(mockTimeNow.toDate()), expectedStringValue);
//     });

//     test('It gets absolute state last updated date time for cluster monitor', () => {
//         /** arrange */
//         const expectedStringValue = moment(mockClusterStateLastUpdatedDateTime).format('LLL');

//         /** act */
//         const aspectsViewModel = new HealthAspectsViewModel(mockHealthPaneViewModel);
//         aspectsViewModel.initialize();

//         /** assert */
//         assert.equal(aspectsViewModel.absoluteStateLastRecalculatedDateTime, expectedStringValue);
//     });

//     test('It gets relative state last updated date time for cluster monitor', () => {
//         /** arrange */
//         const mockTimeNow = moment(mockClusterStateLastUpdatedDateTime).add(3, 'm');
//         const expectedStringValue = '3 minutes ago';

//         /** act */
//         const aspectsViewModel = new HealthAspectsViewModel(mockHealthPaneViewModel);
//         aspectsViewModel.initialize();

//         /** assert */
//         assert.equal(aspectsViewModel.getRelativeStateLastRecalculatedDateTime(mockTimeNow.toDate()), expectedStringValue);
//     });
// });
