// import { assert } from 'chai';

// import { IHealthMonitor } from '../../../src/scripts/container/health/IHealthMonitor';
// import { HealthState } from '../../../src/scripts/container/health/HealthState';
// import { 
//     JsonMonitorDetailsViewModel 
// } from '../../../src/scripts/container/health/viewmodels/monitorDetails/JsonMonitorDetailsViewModel';
// import { 
//     IHealthMonitorDetailsViewModelParentContext 
// } from '../../../src/scripts/container/health/viewmodels/monitorDetails/IHealthMonitorDetailsViewModelParentContext';

// suite('unit | JsonMonitorDetailsViewModel', () => {
//     const mockMonitorIdentifier = 'monitorId';
//     const mockDetails: any = { property: 'value' };

//     const mockMonitor: IHealthMonitor = {
//         typeId: mockMonitorIdentifier,
//         subjectId: mockMonitorIdentifier,
//         firstObservedDateTimeUtc: new Date(),
//         lastUpdatedDateTimeUtc: new Date(),
//         state: HealthState.Warning,
//         details: mockDetails,
//         memberSubjectIds: [],
//     };

//     let mockHealthMonitorDetailsViewModelParentContext: IHealthMonitorDetailsViewModelParentContext;

//     setup(() => {
//         mockHealthMonitorDetailsViewModelParentContext = {
//             getSelectedMonitor: () => mockMonitor,
//             displayStringService: null,
//         }
//     });

//     test('It gets details for selected monitor', () => {
//         /** arrange */

//         /** act */
//         const jsonViewModel = new JsonMonitorDetailsViewModel(mockHealthMonitorDetailsViewModelParentContext);
//         jsonViewModel.initialize();

//         /** assert */
//         assert.deepEqual(jsonViewModel.details, mockDetails);
//     });
// });
