// import { assert } from 'chai';

// import { 
//     IHealthMonitorDisplayStringService, 
//     HealthMonitorDisplayStringService, 
//     MonitorTypeId,
//     NodeMonitorLabel,
//     WorkloadMonitorLabel
// } from '../../../../src/scripts/container/health/services/HealthMonitorDisplayStringService';
// import { HealthState } from '../../../../src/scripts/container/health/HealthState';
// import { IHealthMonitorSubject } from '../../../../src/scripts/container/health/IHealthMonitorSubject';

// suite('unit | HealthMonitorDisplayStringService', () => {
//     const healthMonitorDisplayStringService: IHealthMonitorDisplayStringService = new HealthMonitorDisplayStringService();

//     suite('getStateDisplayName', () => {
//         test('It returns display name for every possible health state', () => {
//             /** arrange */
//             const allEnumMembers = Object.keys(HealthState).filter(key => !!isNaN(Number(HealthState[key])));

//             for (const healthState in allEnumMembers) {
//                 if (!allEnumMembers.hasOwnProperty(healthState)) { continue; }

//                 /** act */
//                 const displayName = healthMonitorDisplayStringService.getStateDisplayName(Number(healthState));

//                 /** assert */
//                 assert.isDefined(displayName, `Display name is not defined for state ${HealthState[healthState]}`);
//                 assert.isNotNull(displayName);
//             }
//         });
//     });

//     suite('getInTreeDisplayName', () => {
//         test('It throws if subject supplied is null', () => {
//             /** arrange */
//             const subject: IHealthMonitorSubject = null;

//             /** assert */
//             assert.throws(() => healthMonitorDisplayStringService.getInTreeDisplayName(subject));
//         });

//         test('It sets in-tree display name of a node monitor to host name', () => {
//             /** arrange */
//             const labels: any = {};
//             const labelName = NodeMonitorLabel.HostName;
//             const mockHostName = 'mock-host';
//             labels[labelName] = mockHostName;

//             const subject: IHealthMonitorSubject = { monitorTypeId: MonitorTypeId.Node, labels };

//             /** act */
//             const displayName = healthMonitorDisplayStringService.getInTreeDisplayName(subject);

//             /** assert */
//             assert.equal(displayName, mockHostName);
//         });

//         test('It sets in-tree display name of agent node pool monitor to pool name', () => {
//             /** arrange */
//             const labels: any = {};
//             const mockPoolName = 'mock-node-pool';
//             labels[NodeMonitorLabel.NodePoolName] = mockPoolName;

//             const subject: IHealthMonitorSubject = { monitorTypeId: MonitorTypeId.AgentNodePool, labels };

//             /** act */
//             const displayName = healthMonitorDisplayStringService.getInTreeDisplayName(subject);

//             /** assert */
//             assert.equal(displayName, mockPoolName);
//         });

//         test('It sets in-tree display name of system workload monitor to workload name with type', () => {
//             /** arrange */
//             const labels: any = {};
//             const mockWorkloadName = 'workload-name';
//             const mockWorkloadKind = 'workload-kind';
//             labels[WorkloadMonitorLabel.WorkloadName] = mockWorkloadName;
//             labels[WorkloadMonitorLabel.WorkloadKind] = mockWorkloadKind;
            
//             const expectedDisplayName = `${mockWorkloadName} (${mockWorkloadKind})`;

//             const subject: IHealthMonitorSubject = { monitorTypeId: MonitorTypeId.SystemWorkload, labels };

//             /** act */
//             const displayName = healthMonitorDisplayStringService.getInTreeDisplayName(subject);

//             /** assert */
//             assert.equal(displayName, expectedDisplayName);
//         });

//         test('It sets in-tree name of monitor it does not know to monitor type', () => {
//             /** arrange */
//             const unknownMonitorTypeId = 'abracadabra';
//             const labels: any = null;
//             const subject: IHealthMonitorSubject = { monitorTypeId: unknownMonitorTypeId, labels };

//             const expectedDisplayName = `<${unknownMonitorTypeId}>`;

//             /** act */
//             const displayName = healthMonitorDisplayStringService.getInTreeDisplayName(subject);

//             /** assert */
//             assert.equal(displayName, expectedDisplayName);
//         });
//     });

//     suite('getStandaloneDisplayName', () => {
//         test('It throws if subject supplied is null', () => {
//             /** arrange */
//             const subject: IHealthMonitorSubject = null;

//             /** assert */
//             assert.throws(() => healthMonitorDisplayStringService.getStandaloneDisplayName(subject));
//         });

//         test('It sets name of monitor it does not know to monitor type', () => {
//             /** arrange */
//             const unknownMonitorTypeId = 'abracadabra';
//             const labels: any = null;
//             const subject: IHealthMonitorSubject = { monitorTypeId: unknownMonitorTypeId, labels };

//             const expectedDisplayName = `<${unknownMonitorTypeId}>`;

//             /** act */
//             const displayName = healthMonitorDisplayStringService.getStandaloneDisplayName(subject);

//             /** assert */
//             assert.equal(displayName, expectedDisplayName);
//         });

//     });

//     suite('getDescription', () => {
//         test('It throws if subject supplied is null', () => {
//             /** arrange */
//             const subject: IHealthMonitorSubject = null;

//             /** assert */
//             assert.throws(() => healthMonitorDisplayStringService.getDescription(subject));
//         });

//         test('It includes name of monitor it does not know to monitor type', () => {
//             /** arrange */
//             const unknownMonitorTypeId = 'abracadabra';
//             const labels: any = null;
//             const subject: IHealthMonitorSubject = { monitorTypeId: unknownMonitorTypeId, labels };

//             const expectedDisplayNamePart = `<${unknownMonitorTypeId}>`;

//             /** act */
//             const displayName = healthMonitorDisplayStringService.getDescription(subject);

//             /** assert */
//             assert.isTrue(displayName.indexOf(expectedDisplayNamePart) >= 0);
//         });
//     });

//     suite('getMonitorDetailsViewTypeName', () => {
//         test('It throws if monitor id supplied is null', () => {
//             /** arrange */

//             /** assert */
//             assert.throws(() => healthMonitorDisplayStringService.getMonitorDetailsViewTypeName(null));
//         });

//         test('It returns "default" as default view type name', () => {
//             /** arrange */
//             const viewTypeName = healthMonitorDisplayStringService.getMonitorDetailsViewTypeName('abracadabra');
//             const expectedViewTypeName = 'default';

//             /** assert */
//             assert.equal(viewTypeName, expectedViewTypeName);
//         });

//         test('It returns custom view type name if specified for a given monitor type id', () => {
//             /** arrange */
//             const viewTypeName = healthMonitorDisplayStringService.getMonitorDetailsViewTypeName(MonitorTypeId.NodeCondition);
//             const expectedViewTypeName = 'NodeConditionMonitorDetailsView';

//             /** assert */
//             assert.equal(viewTypeName, expectedViewTypeName);
//         });
//     });
// });
