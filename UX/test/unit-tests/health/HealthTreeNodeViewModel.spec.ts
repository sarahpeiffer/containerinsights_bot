// import { assert } from 'chai';

// import { IHealthPaneViewModel } from '../../../src/scripts/container/health/viewmodels/HealthPaneViewModel';
// import { IHealthMonitorService } from '../../../src/scripts/container/health/services/HealthMonitorService';
// import { HealthTreeNodeModel } from '../../../src/scripts/container/health/models/HealthTreeNodeModel';
// import { HealthState } from '../../../src/scripts/container/health/HealthState';
// import { IHealthMonitorSubject } from '../../../src/scripts/container/health/IHealthMonitorSubject';
// import { HealthTreeNodeViewModel } from '../../../src/scripts/container/health/viewmodels/HealthTreeNodeViewModel';
// import { IHealthMonitorDisplayStringService } from '../../../src/scripts/container/health/services/HealthMonitorDisplayStringService';

// suite('unit | HealthTreeNodeViewModel', () => {
//     const mockParentMonitorIdentifier = 'parentMonitorId';
//     const mockChildMonitorIdentifier = 'childMonitorId';

//     const mockParentMonitorTypeId = 'parentMonitorTypeId';
//     const mockChildMonitorTypeId = 'childMonitorTypeId';

//     const mockParentMonitorInTreeDisplayName = 'in-tree parent name';
//     const mockChildMonitorInTreeDisplayName = 'in-tree child name';

//     const mockMonitorState = HealthState.Warning;

//     const mockChildMonitorSubject: IHealthMonitorSubject = {
//         monitorTypeId: mockChildMonitorTypeId, 
//         labels: {
//             type: 'child'
//         }
//     };

//     const mockParentMonitorSubject: IHealthMonitorSubject = {
//         monitorTypeId: mockParentMonitorTypeId, 
//         labels: {
//             type: 'parent'
//         }
//     };

//     const mockChildTreeNodeModel = new HealthTreeNodeModel(
//         mockChildMonitorIdentifier, 
//         mockChildMonitorSubject, 
//         mockMonitorState, 
//         null, 
//         false);

//     const mockParentTreeNodeModel = new HealthTreeNodeModel(
//             mockParentMonitorIdentifier, 
//             mockParentMonitorSubject, 
//             mockMonitorState, 
//             [mockChildMonitorIdentifier], 
//             true);

//     let mockHealthMonitorService: IHealthMonitorService;
//     let mockDisplayNameService: IHealthMonitorDisplayStringService;
//     let mockHealthPaneViewModel: IHealthPaneViewModel;

//     setup(() => {
//         mockHealthMonitorService = { 
//             getClusterHealthAspects: () => null,
//             getHealthTreeNode: (monitorIdentifier) => {
//                 switch (monitorIdentifier) {
//                     case mockParentMonitorIdentifier: 
//                         return mockParentTreeNodeModel;
//                     case mockChildMonitorIdentifier:
//                         return mockChildTreeNodeModel;
//                     default:
//                         return null;
//                 }
//             }, 
//             getMonitorConfig: (monitorIdentifier) => null,
//             getMonitorPropertyPanelHeader: (monitorIdentifier) => { return null; },
//             getMonitorDescription: (monitorIdentifier) => null, 
//             getDefaultSelectedAspectIdentifier: () => null,
//             getMonitor: (monitorIdentifier) => null,
//             toggleExpand: (monitorIdentifier) => null
//         };

//         mockDisplayNameService = {
//             getInTreeDisplayName: (subject) => {
//                 switch (subject.monitorTypeId) {
//                     case mockParentMonitorTypeId: 
//                         return mockParentMonitorInTreeDisplayName;
//                     case mockChildMonitorTypeId: 
//                         return mockChildMonitorInTreeDisplayName;
//                     default:
//                         return null;
//                 }
//             },
//             getDescription: (subject) => null,
//             getStandaloneDisplayName: (subject) => null,
//             getStateDisplayName: (subject) => null,
//             getMonitorDetailsViewTypeName: (monitorTypeId) => { return null; }
//         }

//         mockHealthPaneViewModel = {
//             selectedMonitorIdentifier: mockChildMonitorIdentifier,
//             healthMonitorService: mockHealthMonitorService,
//             displayStringService: mockDisplayNameService, 
//             selectedAspectIdentifier: mockParentMonitorIdentifier,
//             isMonitorPropertyPaneVisible: false,
//             telemetryService: null
//         };
//     });

//     test('It changes isExpanded state when onToggleExpand is called', () => {
//         /** arrange */
//         const treeNodeViewModel = new HealthTreeNodeViewModel(mockHealthPaneViewModel);
//         treeNodeViewModel.initialize(mockParentMonitorIdentifier);

//         const beforeToggle = treeNodeViewModel.isExpanded;

//         /** act */
//         treeNodeViewModel.onToggleExpand();

//         /** assert */
//         assert.equal(treeNodeViewModel.isExpanded, !beforeToggle);
//     });

//     test('It returns "isExpandable" as true for monitors with children', () => {
//         /** arrange */

//         /** act */
//         const treeNodeViewModel = new HealthTreeNodeViewModel(mockHealthPaneViewModel);
//         treeNodeViewModel.initialize(mockParentMonitorIdentifier);

//         /** assert */
//         assert.isTrue(treeNodeViewModel.isExpandable);
//     });

//     test('It returns "isExpandable" as false for monitors with children', () => {
//         /** arrange */

//         /** act */
//         const treeNodeViewModel = new HealthTreeNodeViewModel(mockHealthPaneViewModel);
//         treeNodeViewModel.initialize(mockChildMonitorIdentifier);

//         /** assert */
//         assert.isFalse(treeNodeViewModel.isExpandable);
//     });

//     test('It returns "isSelected" as true for selected monitor', () => {
//         /** arrange */

//         /** act */
//         const treeNodeViewModel = new HealthTreeNodeViewModel(mockHealthPaneViewModel);
//         treeNodeViewModel.initialize(mockChildMonitorIdentifier);

//         /** assert */
//         assert.isTrue(treeNodeViewModel.isSelected);
//     });

//     test('It returns "isSelected" as false for not selected monitor', () => {
//         /** arrange */

//         /** act */
//         const treeNodeViewModel = new HealthTreeNodeViewModel(mockHealthPaneViewModel);
//         treeNodeViewModel.initialize(mockParentMonitorIdentifier);

//         /** assert */
//         assert.isFalse(treeNodeViewModel.isSelected);
//     });

//     test('It returns "hasChildren" as true for monitors with children', () => {
//         /** arrange */

//         /** act */
//         const treeNodeViewModel = new HealthTreeNodeViewModel(mockHealthPaneViewModel);
//         treeNodeViewModel.initialize(mockParentMonitorIdentifier);

//         /** assert */
//         assert.isTrue(treeNodeViewModel.hasChildren);
//     });

//     test('It returns "hasChildren" as false for monitors with children', () => {
//         /** arrange */

//         /** act */
//         const treeNodeViewModel = new HealthTreeNodeViewModel(mockHealthPaneViewModel);
//         treeNodeViewModel.initialize(mockChildMonitorIdentifier);

//         /** assert */
//         assert.isFalse(treeNodeViewModel.hasChildren);
//     });

//     test('It returns no children for monitor without them', () => {
//         /** arrange */

//         /** act */
//         const treeNodeViewModel = new HealthTreeNodeViewModel(mockHealthPaneViewModel);
//         treeNodeViewModel.initialize(mockChildMonitorIdentifier);

//         /** assert */
//         assert.deepEqual(treeNodeViewModel.children, null);
//     });

//     test('It returns children for monitor with children', () => {
//         /** arrange */

//         /** act */
//         const treeNodeViewModel = new HealthTreeNodeViewModel(mockHealthPaneViewModel);
//         treeNodeViewModel.initialize(mockParentMonitorIdentifier);

//         /** assert */
//         assert.deepEqual(treeNodeViewModel.children, [mockChildMonitorIdentifier]);
//     });

//     test('It returns state for the monitor', () => {
//         /** arrange */

//         /** act */
//         const treeNodeViewModel = new HealthTreeNodeViewModel(mockHealthPaneViewModel);
//         treeNodeViewModel.initialize(mockParentMonitorIdentifier);

//         /** assert */
//         assert.equal(treeNodeViewModel.state, mockMonitorState);
//     });

//     test('It returns in-tree display name for the monitor', () => {
//         /** arrange */

//         /** act */
//         const treeNodeViewModel = new HealthTreeNodeViewModel(mockHealthPaneViewModel);
//         treeNodeViewModel.initialize(mockParentMonitorIdentifier);

//         /** assert */
//         assert.equal(treeNodeViewModel.displayName, mockParentMonitorInTreeDisplayName);
//     });

//     test('It calls monitor service to report toggle expand', () => {
//         /** arrange */
//         let toggleCalled: boolean = false;
//         const testHealthMonitorService = { ...mockHealthMonitorService };

//         testHealthMonitorService.toggleExpand = (monitorIdentifier) => {
//             if (mockParentMonitorIdentifier === monitorIdentifier) {
//                 toggleCalled = true;
//             }
//         };

//         const testHealthPaneViewModel: IHealthPaneViewModel = {
//             selectedMonitorIdentifier: mockChildMonitorIdentifier,
//             healthMonitorService: testHealthMonitorService,
//             displayStringService: mockDisplayNameService, 
//             selectedAspectIdentifier: mockParentMonitorIdentifier,
//             isMonitorPropertyPaneVisible: false,
//             telemetryService: null
//         };

//         const treeNodeViewModel = new HealthTreeNodeViewModel(testHealthPaneViewModel);
//         treeNodeViewModel.initialize(mockParentMonitorIdentifier);

//         /** act */
//         treeNodeViewModel.onToggleExpand();

//         /** assert */
//         assert.isTrue(toggleCalled);
//     });
// });
