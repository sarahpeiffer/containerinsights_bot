// import { assert } from 'chai';

// import { HealthMonitorService } from '../../../../src/scripts/container/health/services/HealthMonitorService';
// import { IHealthModel } from '../../../../src/scripts/container/health/IHealthModel';
// import { IHealthMonitorDisplayStringService } from '../../../../src/scripts/container/health/services/HealthMonitorDisplayStringService';
// import { HealthState } from '../../../../src/scripts/container/health/HealthState';
// import { IHealthMonitor } from '../../../../src/scripts/container/health/IHealthMonitor';
// import { IHealthAspect } from '../../../../src/scripts/container/health/IHealthAspect';

// suite('unit | HealthMonitorService', () => {

//     const mockDisplayStringService: IHealthMonitorDisplayStringService = {
//         getInTreeDisplayName: (subject) => { return 'tree:' + subject.monitorTypeId; },
//         getStandaloneDisplayName: (subject) => { return 'stand-alone:' + subject.monitorTypeId; },
//         getStateDisplayName: (state) => { return HealthState[state]; },
//         getDescription: (subject) => { return 'desc:' + subject.monitorTypeId; },
//         getMonitorDetailsViewTypeName: (monitorTypeId) => { return null; }
//     };

//     const mockTopLevelMonitorId = 'monitor-id';
//     const mockTopLevelMonitorState = HealthState.Critical;
//     const mockMemberAMonitorState = HealthState.Warning;
//     const mockTransitionDateTimeUtc = new Date(2019, 6, 7);
//     const mockLastUpdatedDateTimeUtc = new Date(2019, 7, 7);

//     const mockParent1 = 'parent1';
//     const mockParent2 = 'parent2';
//     const mockMemberA = 'member-a';
//     const mockMemberB = 'member-b';
//     const mockMemberC = 'member-c';
//     const mockMemberSet1 = [mockMemberA, mockMemberB];
//     const mockMemberSet2 = [mockMemberC];
        
//     const mockConfig: StringMap<number | string> = {
//         property1: 'value1',
//         property2: 'value2',
//     };

//     const mockDetails = {
//         details1: 'value1',
//         details2: 'value2'
//     };

//     const mockLabels = {
//         label1: 'value1',
//         label2: 'value2'
//     };

//     const mockMonitors: StringMap<IHealthMonitor> = {};

//     mockMonitors[mockTopLevelMonitorId] = { 
//         typeId: mockTopLevelMonitorId,
//         subjectId: mockTopLevelMonitorId,
//         state: mockTopLevelMonitorState,
//         firstObservedDateTimeUtc: mockTransitionDateTimeUtc,
//         lastUpdatedDateTimeUtc: mockLastUpdatedDateTimeUtc,
//         memberSubjectIds: [mockParent1, mockParent2],
//         config: mockConfig,
//         labels: mockLabels
//     };

//     mockMonitors[mockParent2] = { 
//         typeId: mockParent2,
//         subjectId: mockParent2,
//         state: mockTopLevelMonitorState,
//         firstObservedDateTimeUtc: mockTransitionDateTimeUtc,
//         lastUpdatedDateTimeUtc: mockLastUpdatedDateTimeUtc,
//         memberSubjectIds: mockMemberSet2,
//     };

//     mockMonitors[mockParent1] = { 
//         typeId: mockParent1,
//         subjectId: mockParent1,
//         state: mockTopLevelMonitorState,
//         firstObservedDateTimeUtc: mockTransitionDateTimeUtc,
//         lastUpdatedDateTimeUtc: mockLastUpdatedDateTimeUtc,
//         memberSubjectIds: mockMemberSet1,
//     };

//     mockMonitors[mockMemberA] = { 
//         typeId: mockMemberA,
//         subjectId: mockMemberA,
//         state: mockMemberAMonitorState,
//         firstObservedDateTimeUtc: mockTransitionDateTimeUtc,
//         lastUpdatedDateTimeUtc: mockLastUpdatedDateTimeUtc,
//         memberSubjectIds: [],
//     };

//     mockMonitors[mockMemberB] = { 
//         typeId: mockMemberB,
//         subjectId: mockMemberB,
//         state: mockTopLevelMonitorState,
//         firstObservedDateTimeUtc: mockTransitionDateTimeUtc,
//         lastUpdatedDateTimeUtc: mockLastUpdatedDateTimeUtc,
//         memberSubjectIds: [],
//     };

//     mockMonitors[mockMemberC] = { 
//         typeId: mockMemberC,
//         subjectId: mockMemberC,
//         state: mockTopLevelMonitorState,
//         firstObservedDateTimeUtc: mockTransitionDateTimeUtc,
//         lastUpdatedDateTimeUtc: mockLastUpdatedDateTimeUtc,
//         memberSubjectIds: [],
//         details: mockDetails,
//     };

//     const mockHealthModel: IHealthModel = {
//         topLevelMonitorSubjectId: mockTopLevelMonitorId,
//         monitors: mockMonitors
//     };

//     test('It throws if monitor id is null', () => {
//         /** arrange */
//         const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);

//         /** act */
//         /** assert */
//         assert.throws(() => service.getMonitorConfig(null));
//         assert.throws(() => service.getMonitorDescription(null));
//     });

//     test('It throws if monitor is not member of the model', () => {
//         /** arrange */
//         const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);
//         const notInModelMonitorId = 'abracadabra';

//         /** act */
//         /** assert */
//         assert.throws(() => service.getMonitorConfig(notInModelMonitorId));
//         assert.throws(() => service.getMonitorDescription(notInModelMonitorId));
//     });

//     suite('getMonitor()', () => {
//         test('It returns monitor supplied in the health model', () => {
//             /** arrange */
//             const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);

//             /** act */
//             const monitor = service.getMonitor(mockTopLevelMonitorId);

//             /** assert */
//             assert.deepEqual(monitor, mockMonitors[mockTopLevelMonitorId]);
//         });
//     });

//     suite('Config', () => {
//         test('It returns config model providing config supplied in the health model', () => {
//             /** arrange */
//             const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);

//             /** act */
//             const configModel = service.getMonitorConfig(mockTopLevelMonitorId);

//             /** assert */
//             assert.deepEqual(configModel.config, mockConfig);
//         });
//     });

//     suite('Description', () => {
//         test('It returns description model providing state supplied in the health model', () => {
//             /** arrange */
//             const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);

//             /** act */
//             const descriptionModel = service.getMonitorDescription(mockTopLevelMonitorId);

//             /** assert */
//             assert.deepEqual(descriptionModel.state, mockTopLevelMonitorState);
//         });

//         test('It returns description model providing state change time supplied in the health model', () => {
//             /** arrange */
//             const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);

//             /** act */
//             const descriptionModel = service.getMonitorDescription(mockTopLevelMonitorId);

//             /** assert */
//             assert.deepEqual(descriptionModel.firstObservedDateTimeUtc, mockTransitionDateTimeUtc);
//         });

//         // test('It returns description model providing subject supplied in the health model', () => {
//         //     /** arrange */
//         //     const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);

//         //     /** act */
//         //     const descriptionModel = service.getMonitorDescription(mockTopLevelMonitorId);

//         //     /** assert */
//         //     assert.deepEqual(descriptionModel.subject, { monitorTypeId: mockTopLevelMonitorId, labels: mockLabels });
//         // });

//         test('It returns last recalculated time of the monitor equaling root monitor updated/recalculated time', () => {
//             /** arrange */
//             const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);
//             const topLevel = service.getMonitorDescription(mockTopLevelMonitorId);

//             /** act */
//             const descriptionModel = service.getMonitorDescription(mockMemberA);

//             /** assert */
//             assert.equal(descriptionModel.lastRecalculatedDateTimeUtc, topLevel.lastRecalculatedDateTimeUtc);
//         });
//     });

//     suite('Tree node', () => {
//         test('It returns tree node model providing state supplied in the health model', () => {
//             /** arrange */
//             const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);

//             /** act */
//             const treeNodeModel = service.getHealthTreeNode(mockTopLevelMonitorId);

//             /** assert */
//             assert.deepEqual(treeNodeModel.state, mockTopLevelMonitorState);
//         });

//         test('It returns tree node model providing subject supplied in the health model', () => {
//             /** arrange */
//             const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);

//             /** act */
//             const treeNodeModel = service.getHealthTreeNode(mockParent1);

//             /** assert */
//             assert.deepEqual(treeNodeModel.children, mockMemberSet1);
//         });

//         test('It returns tree node model providing empty members if not present in the health model', () => {
//             /** arrange */
//             const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);

//             /** act */
//             const treeNodeModel = service.getHealthTreeNode(mockMemberA);

//             /** assert */
//             assert.equal(treeNodeModel.children.length, 0);
//         });

//         test('It returns tree node model providing member monitors supplied in the health model', () => {
//             /** arrange */
//             const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);

//             /** act */
//             const treeNodeModel = service.getHealthTreeNode(mockTopLevelMonitorId);

//             /** assert */
//             assert.deepEqual(treeNodeModel.subject, { monitorTypeId: mockTopLevelMonitorId, labels: mockLabels });
//         });

//         test('It returns tree node as expanded if provided in ctor', () => {
//             /** arrange */
//             const expandedMonitors: StringMap<boolean> = {};
//             expandedMonitors[mockParent1] = true;

//             const service = new HealthMonitorService(mockHealthModel, expandedMonitors, mockDisplayStringService);

//             /** act */
//             const isExpanded = service.getHealthTreeNode(mockParent1).isExpanded;

//             /** assert */
//             assert.isTrue(isExpanded);
//         });

//         test('It returns tree node as not expanded by default', () => {
//             /** arrange */
//             const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);

//             /** act */
//             const isExpanded = service.getHealthTreeNode(mockParent1).isExpanded;

//             /** assert */
//             assert.isFalse(isExpanded);
//         });

//         test('It switches expanded/collapsed state when toggling', () => {
//             /** arrange */
//             const testMonitorId = mockParent1;
//             const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);
//             const currentState = service.getHealthTreeNode(testMonitorId).isExpanded;

//             /** act */
//             service.toggleExpand(testMonitorId);
//             const toggledState = service.getHealthTreeNode(testMonitorId).isExpanded;

//             /** assert */
//             assert.equal(currentState, !toggledState);
//         });
//     });

//     suite('Aspects', () => {
//         test('It returns top level monitor state provided by the model', () => {
//             /** arrange */
//             const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);

//             /** act */
//             const aspects = service.getClusterHealthAspects();

//             /** assert */
//             assert.equal(aspects.state, mockTopLevelMonitorState);
//         });

//         test('It returns observed date time provided by the model', () => {
//             /** arrange */
//             const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);

//             /** act */
//             const aspects = service.getClusterHealthAspects();

//             /** assert */
//             assert.equal(aspects.firstObservedDateTimeUtc, mockTransitionDateTimeUtc);
//         });

//         test('It returns last updated date time provided by the model', () => {
//             /** arrange */
//             const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);

//             /** act */
//             const aspects = service.getClusterHealthAspects();

//             /** assert */
//             assert.equal(aspects.lastRecalculatedDateTimeUtc, mockLastUpdatedDateTimeUtc);
//         });

//         test('It returns list of aspects provided by the model', () => {
//             /** arrange */
//             const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);

//             const expectedAspects: IHealthAspect[] = [
//                 {
//                     aspectIdentifier: mockParent1,
//                     state: mockTopLevelMonitorState,
//                     displayName: 'tree:' + mockParent1
//                 },
//                 {
//                     aspectIdentifier: mockParent2,
//                     state: mockTopLevelMonitorState,
//                     displayName: 'tree:' + mockParent2
//                 }
//             ];

//             /** act */
//             const aspects = service.getClusterHealthAspects();

//             /** assert */
//             assert.deepEqual(aspects.aspects, expectedAspects);
//         });

//         test('Default selected aspect is first alphabetically by display name', () => {
//             /** arrange */
//             const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);

//             /** act */
//             const selectedAspectId = service.getDefaultSelectedAspectIdentifier();

//             /** assert */
//             assert.equal(selectedAspectId, mockParent1);
//         });
//     });

//     // suite('Property Panel Header', () => {
//     //     test('It returns property panel header for the monitor requested', () => {
//     //         /** arrange */
//     //         const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);

//     //         /** act */
//     //         const headerModel = service.getMonitorPropertyPanelHeader(mockMemberA);

//     //         /** assert */
//     //         assert.equal(headerModel.monitorIdentifier, mockMemberA);
//     //     });

//     //     test('It returns property panel header with state of the monitor provided in the model', () => {
//     //         /** arrange */
//     //         const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);

//     //         /** act */
//     //         const headerModel = service.getMonitorPropertyPanelHeader(mockMemberA);

//     //         /** assert */
//     //         assert.equal(headerModel.state, mockMemberAMonitorState);
//     //     });

//     //     test('It returns property panel header with state of the monitor provided in the model', () => {
//     //         /** arrange */
//     //         const service = new HealthMonitorService(mockHealthModel, {}, mockDisplayStringService);

//     //         const expectedSubject = { 
//     //             monitorTypeId: mockMemberA,
//     //             labels: undefined
//     //         };

//     //         /** act */
//     //         const headerModel = service.getMonitorPropertyPanelHeader(mockMemberA);

//     //         /** assert */
//     //         assert.deepEqual(headerModel.subject, expectedSubject);
//     //     });
//     // });
// });
