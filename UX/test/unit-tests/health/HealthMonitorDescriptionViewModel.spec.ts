// import * as moment from 'moment';
// import { assert } from 'chai';

// import { HealthMonitorDescriptionModel } from '../../../src/scripts/container/health/models/HealthMonitorDescriptionModel';
// import { IHealthMonitorSubject } from '../../../src/scripts/container/health/IHealthMonitorSubject';
// import { HealthState } from '../../../src/scripts/container/health/HealthState';
// import { IHealthMonitorService } from '../../../src/scripts/container/health/services/HealthMonitorService';
// import { IHealthMonitorDisplayStringService } from '../../../src/scripts/container/health/services/HealthMonitorDisplayStringService';
// import { IHealthPaneViewModel } from '../../../src/scripts/container/health/viewmodels/HealthPaneViewModel';
// import { HealthMonitorDescriptionViewModel } from '../../../src/scripts/container/health/viewmodels/HealthMonitorDescriptionViewModel';

// suite('unit | HealthMonitorDescriptionViewModel', () => {
//     let mockMonitorIdentifier: string;
//     let mockMonitorSubject: IHealthMonitorSubject;
//     let mockMonitorState: HealthState;
//     let mockMonitorStateFirstObservedDateTime: Date;
//     let mockMonitorStateLastUpdatedDateTime: Date;
//     let mockMonitorStateLastRecalculatedDateTime: Date;

//     let mockHealthMonitorService: IHealthMonitorService;
//     let mockDisplayStringService: IHealthMonitorDisplayStringService;
//     let mockHealthPaneViewModel: IHealthPaneViewModel;

//     let mockStandaloneDisplayName: string;
//     let mockDescription: string;

//     setup(() => {
//         mockMonitorIdentifier = 'monitorId';
//         mockMonitorState = HealthState.Critical;
//         mockMonitorStateFirstObservedDateTime = new Date(2019, 5, 29, 1, 45, 30, 456); // 5/29/2019 1:45:30.456
//         mockMonitorStateLastUpdatedDateTime = new Date(2019, 6, 29, 1, 45, 30, 456); // 5/29/2019 1:45:30.456
//         mockMonitorStateLastRecalculatedDateTime = new Date(2019, 6, 29, 1, 40, 30, 456); // 5/29/2019 1:45:30.456
//         mockMonitorSubject = {
//             monitorTypeId: 'monitorTypeId',
//             labels: {
//                 label1: 'value1',
//                 label2: 'value2'
//             }
//         };
    
//         mockStandaloneDisplayName = 'standalone display name';
//         mockDescription = 'description';

//         mockHealthMonitorService = {
//             getClusterHealthAspects: () => null,
//             getHealthTreeNode: (monitorIdentifier) => { return null; },
//             getMonitorConfig: (monitorIdentifier) => { return null; },
//             getMonitorPropertyPanelHeader: (monitorIdentifier) => { return null; },
//             getMonitorDescription: (monitorIdentifier) => { 
//                 return (monitorIdentifier === mockMonitorIdentifier) 
//                             ? new HealthMonitorDescriptionModel(
//                                 mockMonitorIdentifier,
//                                 mockMonitorSubject,
//                                 mockMonitorState,
//                                 mockMonitorStateFirstObservedDateTime,
//                                 mockMonitorStateLastUpdatedDateTime,
//                                 mockMonitorStateLastRecalculatedDateTime)
//                             : null; 
//             },
//             getDefaultSelectedAspectIdentifier: () => null,
//             getMonitor: (monitorIdentifier) => null,
//             toggleExpand: (monitorIdentifier) => null
//         };

//         let subjectMatchesMock: (subject: IHealthMonitorSubject) => boolean = (subject) => {
//             return (
//                 (subject.monitorTypeId === mockMonitorSubject.monitorTypeId) &&
//                 (subject.labels.label1 === mockMonitorSubject.labels.label1) &&
//                 (subject.labels.label2 === mockMonitorSubject.labels.label2)
//             );
//         };

//         mockDisplayStringService = {
//             getInTreeDisplayName: (subject) => { return null; },
//             getStandaloneDisplayName: (subject) => { return subjectMatchesMock(subject) ? mockStandaloneDisplayName : null; },
//             getStateDisplayName: (state) => { return null; },
//             getDescription: (subject) => { return subjectMatchesMock(subject) ? mockDescription : null; },
//             getMonitorDetailsViewTypeName: (monitorTypeId) => { return null; }
//         };

//         mockHealthPaneViewModel = {
//             healthMonitorService: mockHealthMonitorService,
//             displayStringService: mockDisplayStringService,
//             selectedMonitorIdentifier: mockMonitorIdentifier,
//             selectedAspectIdentifier: mockMonitorIdentifier,
//             isMonitorPropertyPaneVisible: false,
//             telemetryService: null
//         };
//     });

//     test('It gets state for selected monitor', () => {
//         /** arrange */

//         /** act */
//         const descriptionViewModel = new HealthMonitorDescriptionViewModel(mockHealthPaneViewModel);
//         descriptionViewModel.initialize();

//         /** assert */
//         assert.equal(descriptionViewModel.state, mockMonitorState);
//     });

//     test('It gets standalone display name for selected monitor', () => {
//         /** arrange */

//         /** act */
//         const descriptionViewModel = new HealthMonitorDescriptionViewModel(mockHealthPaneViewModel);
//         descriptionViewModel.initialize();

//         /** assert */
//         assert.equal(descriptionViewModel.standaloneDisplayName, mockStandaloneDisplayName);
//     });

//     test('It gets description display name for selected monitor', () => {
//         /** arrange */

//         /** act */
//         const descriptionViewModel = new HealthMonitorDescriptionViewModel(mockHealthPaneViewModel);
//         descriptionViewModel.initialize();

//         /** assert */
//         assert.equal(descriptionViewModel.description, mockDescription);
//     });

//     test('It gets absolute state observed date time for selected monitor', () => {
//         /** arrange */
//         const expectedStringValue = moment(mockMonitorStateFirstObservedDateTime).format('LLL');

//         /** act */
//         const descriptionViewModel = new HealthMonitorDescriptionViewModel(mockHealthPaneViewModel);
//         descriptionViewModel.initialize();

//         /** assert */
//         assert.equal(descriptionViewModel.absoluteLastStateChangeDateTime, expectedStringValue);
//     });

//     test('It gets relative state observed date time for selected monitor', () => {
//         /** arrange */
//         const mockTimeNow = moment(mockMonitorStateFirstObservedDateTime).add(3, 'm');
//         const expectedStringValue = '3 minutes ago';

//         /** act */
//         const descriptionViewModel = new HealthMonitorDescriptionViewModel(mockHealthPaneViewModel);
//         descriptionViewModel.initialize();

//         /** assert */
//         assert.equal(descriptionViewModel.getRelativeLastStateChangeDateTime(mockTimeNow.toDate()), expectedStringValue);
//     });

//     test('It gets absolute state recalculated date time for selected monitor', () => {
//         /** arrange */
//         const expectedStringValue = moment(mockMonitorStateLastRecalculatedDateTime).format('LLL');

//         /** act */
//         const descriptionViewModel = new HealthMonitorDescriptionViewModel(mockHealthPaneViewModel);
//         descriptionViewModel.initialize();

//         /** assert */
//         assert.equal(descriptionViewModel.absoluteStateLastRecalculatedDateTime, expectedStringValue);
//     });

//     test('It gets relative state recalculated date time for selected monitor', () => {
//         /** arrange */
//         const mockTimeNow = moment(mockMonitorStateLastRecalculatedDateTime).add(3, 'm');
//         const expectedStringValue = '3 minutes ago';

//         /** act */
//         const descriptionViewModel = new HealthMonitorDescriptionViewModel(mockHealthPaneViewModel);
//         descriptionViewModel.initialize();

//         /** assert */
//         assert.equal(descriptionViewModel.getRelativeStateLastRecalculatedDateTime(mockTimeNow.toDate()), expectedStringValue);
//     });

//     test('It gets absolute state updated in db date time for selected monitor', () => {
//         /** arrange */
//         const expectedStringValue = moment(mockMonitorStateLastUpdatedDateTime).format('LLL');

//         /** act */
//         const descriptionViewModel = new HealthMonitorDescriptionViewModel(mockHealthPaneViewModel);
//         descriptionViewModel.initialize();

//         /** assert */
//         assert.equal(descriptionViewModel.absoluteStateLastUpdatedDateTime, expectedStringValue);
//     });

//     test('It gets relative state updated in db date time for selected monitor', () => {
//         /** arrange */
//         const mockTimeNow = moment(mockMonitorStateLastUpdatedDateTime).add(3, 'm');
//         const expectedStringValue = '3 minutes ago';

//         /** act */
//         const descriptionViewModel = new HealthMonitorDescriptionViewModel(mockHealthPaneViewModel);
//         descriptionViewModel.initialize();

//         /** assert */
//         assert.equal(descriptionViewModel.getRelativeStateLastUpdatedDateTime(mockTimeNow.toDate()), expectedStringValue);
//     });
// });
