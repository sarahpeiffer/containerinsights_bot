// import { assert } from 'chai';

// import { IHealthPaneViewModel } from '../../../src/scripts/container/health/viewmodels/HealthPaneViewModel';
// import { IHealthMonitorService } from '../../../src/scripts/container/health/services/HealthMonitorService';
// import { HealthMonitorPropertiesHeaderModel } from '../../../src/scripts/container/health/models/HealthMonitorPropertiesHeaderModel';
// import { HealthState } from '../../../src/scripts/container/health/HealthState';
// import { IHealthMonitorSubject } from '../../../src/scripts/container/health/IHealthMonitorSubject';
// import { 
//     HealthMonitorPropertiesHeaderViewModel 
// } from '../../../src/scripts/container/health/viewmodels/HealthMonitorPropertiesHeaderViewModel';
// import { IHealthMonitorDisplayStringService } from '../../../src/scripts/container/health/services/HealthMonitorDisplayStringService';

// suite('unit | HealthMonitorPropertiesHeaderViewModel', () => {
//     const mockMonitorIdentifier = 'monitorId';
//     const mockMonitorState: HealthState = HealthState.Warning;
//     const mockMonitorTypeId = 'mockMonitorTypeId';
//     const mockStandaloneDisplayName = 'standalone-display-name';
//     const mockLabels = {
//         label1: 'value1',
//         label2: 'value2'
//     };

//     const mockMonitorSubject: IHealthMonitorSubject = {
//         monitorTypeId: mockMonitorTypeId,
//         labels: mockLabels
//     };

//     let mockHealthMonitorService: IHealthMonitorService;
//     let mockHealthPaneViewModel: IHealthPaneViewModel;
//     let mockDisplayStringService: IHealthMonitorDisplayStringService;

//     setup(() => {
//         mockHealthMonitorService = { 
//             getClusterHealthAspects: () => null,
//             getMonitorConfig: (monitorIdentifier) => null,
//             getHealthTreeNode: (monitorIdentifier) => null, 
//             getMonitorDescription: (monitorIdentifier) => null, 
//             getMonitorPropertyPanelHeader: (monitorIdentifier) => {
//                 return (monitorIdentifier === mockMonitorIdentifier) 
//                     ? new HealthMonitorPropertiesHeaderModel(mockMonitorIdentifier, mockMonitorSubject, mockMonitorState) 
//                     : null; 
//             },
//             getDefaultSelectedAspectIdentifier: () => null,
//             getMonitor: (monitorIdentifier) => null,
//             toggleExpand: (monitorIdentifier) => null
//         };

//         mockDisplayStringService = {
//             getDescription: (subject) => null,
//             getInTreeDisplayName: (subject) => null,
//             getStateDisplayName: (state) => null,
//             getStandaloneDisplayName: (subject) => {
//                 return (subject.monitorTypeId === mockMonitorTypeId) && subject.labels === mockLabels 
//                     ? mockStandaloneDisplayName
//                     : null;
//             },
//             getMonitorDetailsViewTypeName: (monitorTypeId) => { return null; }
//         };

//         mockHealthPaneViewModel = {
//             selectedMonitorIdentifier: mockMonitorIdentifier,
//             healthMonitorService: mockHealthMonitorService,
//             displayStringService: mockDisplayStringService, 
//             selectedAspectIdentifier: null,
//             isMonitorPropertyPaneVisible: false,
//             telemetryService: null
//         };
//     });

//     test('It gets monitor state for selected monitor', () => {
//         /** arrange */

//         /** act */
//         const headerModel = new HealthMonitorPropertiesHeaderViewModel(mockHealthPaneViewModel);
//         headerModel.initialize();

//         /** assert */
//         assert.equal(headerModel.state, mockMonitorState);
//     });

//     test('It gets display name subject for selected monitor', () => {
//         /** arrange */

//         /** act */
//         const headerModel = new HealthMonitorPropertiesHeaderViewModel(mockHealthPaneViewModel);
//         headerModel.initialize();

//         /** assert */
//         assert.deepEqual(headerModel.standaloneDisplayName, mockStandaloneDisplayName);
//     });
// });
