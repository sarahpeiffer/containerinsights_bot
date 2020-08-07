// import { assert } from 'chai';

// import { IHealthPaneViewModel } from '../../../src/scripts/container/health/viewmodels/HealthPaneViewModel';
// import { IHealthMonitorService } from '../../../src/scripts/container/health/services/HealthMonitorService';
// import { HealthMonitorConfigViewModel } from '../../../src/scripts/container/health/viewmodels/HealthMonitorConfigViewModel';
// import { HealthMonitorConfigModel } from '../../../src/scripts/container/health/models/HealthMonitorConfigModel';

// suite('unit | HealthMonitorConfigViewModel', () => {
//     const mockMonitorIdentifier = 'monitorId';
//     const mockConfig: any = { property: 'value' };

//     let mockHealthMonitorService: IHealthMonitorService;
//     let mockHealthPaneViewModel: IHealthPaneViewModel;

//     setup(() => {
//         mockHealthMonitorService = { 
//             getClusterHealthAspects: () => null,
//             getMonitorConfig: (monitorIdentifier) => { 
//                 return (monitorIdentifier === mockMonitorIdentifier) ? new HealthMonitorConfigModel(mockConfig) : null; 
//             },
//             getHealthTreeNode: (monitorIdentifier) => null, 
//             getMonitorDescription: (monitorIdentifier) => null, 
//             getMonitorPropertyPanelHeader: (monitorIdentifier) => { return null; },
//             getDefaultSelectedAspectIdentifier: () => null,
//             getMonitor: (monitorIdentifier) => null,
//             toggleExpand: (monitorIdentifier) => null
//         };

//         mockHealthPaneViewModel = {
//             selectedMonitorIdentifier: mockMonitorIdentifier,
//             healthMonitorService: mockHealthMonitorService,
//             displayStringService: null, 
//             selectedAspectIdentifier: null,
//             isMonitorPropertyPaneVisible: false,
//             telemetryService: null
//         };
//     });

//     test('It gets config for selected monitor', () => {
//         /** arrange */

//         /** act */
//         const configViewModel = new HealthMonitorConfigViewModel(mockHealthPaneViewModel);
//         configViewModel.initialize();

//         /** assert */
//         assert.deepEqual(configViewModel.config, mockConfig);
//     });

//     test('It indicates config is present if it has one property', () => {
//         /** arrange */

//         /** act */
//         const configViewModel = new HealthMonitorConfigViewModel(mockHealthPaneViewModel);
//         configViewModel.initialize();

//         /** assert */
//         assert.isTrue(configViewModel.hasConfig);
//     });

//     test('It indicates config is NOT present for null object', () => {
//         /** arrange */
//         const testConfig: any = null;

//         const testHealthMonitorService = { ... mockHealthMonitorService };
//         testHealthMonitorService.getMonitorConfig = (monitorIdentifier) => { return new HealthMonitorConfigModel(testConfig); };

//         const testHealthPaneViewModel = { ... mockHealthPaneViewModel };
//         testHealthPaneViewModel.healthMonitorService = testHealthMonitorService;

//         /** act */
//         const configViewModel = new HealthMonitorConfigViewModel(testHealthPaneViewModel);
//         configViewModel.initialize();

//         /** assert */
//         assert.isFalse(configViewModel.hasConfig);
//     });

//     test('It indicates config is NOT present for object without properties', () => {
//         /** arrange */
//         const testConfig: any = {};

//         const testHealthMonitorService = { ... mockHealthMonitorService };
//         testHealthMonitorService.getMonitorConfig = (monitorIdentifier) => { return new HealthMonitorConfigModel(testConfig); };

//         const testHealthPaneViewModel = { ... mockHealthPaneViewModel };
//         testHealthPaneViewModel.healthMonitorService = testHealthMonitorService;

//         /** act */
//         const configViewModel = new HealthMonitorConfigViewModel(testHealthPaneViewModel);
//         configViewModel.initialize();

//         /** assert */
//         assert.isFalse(configViewModel.hasConfig);
//     });
// });
