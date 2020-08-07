import { assert } from 'chai';
import { HealthModelBuilder } from '../../../../../src/scripts/container/health/services/healthModel/HealthModelBuilder';
import { IHealthMonitorDefinition } from '../../../../../src/scripts/container/health/services/healthModel/IHealthMonitorDefinition';
import { 
    ParentHealthMonitorIdProvider, 
    IParentHealthMonitorIdProvider 
} from '../../../../../src/scripts/container/health/services/healthModel/ParentHealthMonitorIdProvider';
import { IMonitorStateTransition } from '../../../../../src/scripts/container/health/services/IMonitorStateTransition';
import { HealthState } from '../../../../../src/scripts/container/health/HealthState';

suite('unit | HealthModelBuilder', () => {
    const mockParentMonitorTypeId = 'parent';
    const mockChildMonitorTypeId = 'child';

    let testHealthModelDefinition: StringMap<IHealthMonitorDefinition>;
    let mockParentHealthMonitorIdProvider: IParentHealthMonitorIdProvider;

    setup(() => {
        testHealthModelDefinition = {};
        testHealthModelDefinition[mockChildMonitorTypeId] = { parentMonitorTypeId: mockParentMonitorTypeId };
        testHealthModelDefinition[mockParentMonitorTypeId] = { parentMonitorTypeId: null };

        mockParentHealthMonitorIdProvider = new ParentHealthMonitorIdProvider(testHealthModelDefinition);
    });

    test('It throws if parent id provider param is null', () => {
        assert.throws(() => { 
            const modelBuilder = new HealthModelBuilder(null);
            assert.fail(modelBuilder);
        });
    });

    test('It throws if state transition param is null', () => {
        /** arrange */
        const modelBuilder = new HealthModelBuilder(mockParentHealthMonitorIdProvider);

        /** act */
        /** assert */
        assert.throws(() => { modelBuilder.processStateTransition(null); });
    });

    test('It throws in attempt to process same monitor twice', () => {
        /** arrange */
        const modelBuilder = new HealthModelBuilder(mockParentHealthMonitorIdProvider);

        const childStateTransition: IMonitorStateTransition = {
            agentDateTimeUtc: new Date(),
            monitorTypeId: mockChildMonitorTypeId,
            monitorSubjectId: mockChildMonitorTypeId,
            labels: {},
            oldState: HealthState.Critical,
            newState: HealthState.Critical,
            transitionDateTimeUtc: new Date()
        };

        /** act */
        modelBuilder.processStateTransition(childStateTransition);

        /** assert */
        assert.throws(() => { modelBuilder.processStateTransition(childStateTransition); });
    });

    test('It throws in case two top level monitors defined', () => {
        /** arrange */
        const parent2MonitorTypeId = 'parent2';

        testHealthModelDefinition = {};
        testHealthModelDefinition[mockChildMonitorTypeId] = { parentMonitorTypeId: mockParentMonitorTypeId };
        testHealthModelDefinition[mockParentMonitorTypeId] = { parentMonitorTypeId: null };
        testHealthModelDefinition[parent2MonitorTypeId] = { parentMonitorTypeId: null };

        const modelBuilder = new HealthModelBuilder(mockParentHealthMonitorIdProvider);

        const childStateTransition: IMonitorStateTransition = {
            agentDateTimeUtc: new Date(),
            monitorTypeId: mockChildMonitorTypeId,
            monitorSubjectId: mockChildMonitorTypeId,
            labels: {},
            oldState: HealthState.Critical,
            newState: HealthState.Critical,
            transitionDateTimeUtc: new Date()
        };

        const parentStateTransition: IMonitorStateTransition = {
            agentDateTimeUtc: new Date(),
            monitorTypeId: mockParentMonitorTypeId,
            monitorSubjectId: mockParentMonitorTypeId,
            labels: {},
            oldState: HealthState.Critical,
            newState: HealthState.Critical,
            transitionDateTimeUtc: new Date()
        };

        const parent2StateTransition: IMonitorStateTransition = {
            agentDateTimeUtc: new Date(),
            monitorTypeId: parent2MonitorTypeId,
            monitorSubjectId: parent2MonitorTypeId,
            labels: {},
            oldState: HealthState.Critical,
            newState: HealthState.Critical,
            transitionDateTimeUtc: new Date()
        };

        /** act */
        modelBuilder.processStateTransition(childStateTransition);
        modelBuilder.processStateTransition(parentStateTransition);
        
        /** assert */
        assert.throws(() => { modelBuilder.processStateTransition(parent2StateTransition); });
    });

    test('It throws in case no top level monitor defined', () => {
        /** arrange */
        testHealthModelDefinition = {};
        testHealthModelDefinition[mockChildMonitorTypeId] = { parentMonitorTypeId: mockParentMonitorTypeId };

        const modelBuilder = new HealthModelBuilder(mockParentHealthMonitorIdProvider);

        const childStateTransition: IMonitorStateTransition = {
            agentDateTimeUtc: new Date(),
            monitorTypeId: mockChildMonitorTypeId,
            monitorSubjectId: mockChildMonitorTypeId,
            labels: {},
            oldState: HealthState.Critical,
            newState: HealthState.Critical,
            transitionDateTimeUtc: new Date()
        };

        /** act */
        modelBuilder.processStateTransition(childStateTransition);
        
        /** assert */
        assert.throws(() => { modelBuilder.finalize(); });
    });

    test('It builds monitor matching state transition parameter', () => {
        /** arrange */
        const modelBuilder = new HealthModelBuilder(mockParentHealthMonitorIdProvider);

        const childStateTransition: IMonitorStateTransition = {
            agentDateTimeUtc: new Date(),
            monitorTypeId: mockChildMonitorTypeId,
            monitorSubjectId: mockChildMonitorTypeId,
            labels: {},
            oldState: HealthState.Critical,
            newState: HealthState.Critical,
            transitionDateTimeUtc: new Date()
        };

        const parentMonitorLabels = {
            label1: 'value1',
            label2: 'value2'
        };

        const parentMonitorConfig = {
            setting1: 'value1',
            setting2: 'value2'
        };

        const parentMonitorDetails = {
            property1: 'value1',
            property2: 'value2'
        };

        const parentMonitorTransitionDateTime = new Date();

        const parentStateTransition: IMonitorStateTransition = {
            agentDateTimeUtc: parentMonitorTransitionDateTime,
            monitorTypeId: mockParentMonitorTypeId,
            monitorSubjectId: mockParentMonitorTypeId,
            labels: parentMonitorLabels,
            config: parentMonitorConfig,
            details: parentMonitorDetails,
            oldState: HealthState.Critical,
            newState: HealthState.Critical,
            transitionDateTimeUtc: parentMonitorTransitionDateTime
        };

        /** act */
        modelBuilder.processStateTransition(childStateTransition);
        modelBuilder.processStateTransition(parentStateTransition);

        const healthModel = modelBuilder.finalize();

        /** assert */
        let monitorCount = 0;
        Object.keys(healthModel.monitors).forEach(key => monitorCount++);

        assert.equal(monitorCount, 2);
        assert.isDefined(healthModel.monitors[mockParentMonitorTypeId]);

        const parentMonitor = healthModel.monitors[mockParentMonitorTypeId];

        assert.equal(parentMonitor.typeId, mockParentMonitorTypeId);
        assert.equal(parentMonitor.subjectId, mockParentMonitorTypeId);
        assert.equal(parentMonitor.state, HealthState.Critical);
        assert.equal(parentMonitor.firstObservedDateTimeUtc, parentMonitorTransitionDateTime);
        assert.deepEqual(parentMonitor.labels, parentMonitorLabels);
        assert.deepEqual(parentMonitor.config, parentMonitorConfig);
        assert.deepEqual(parentMonitor.details, parentMonitorDetails);
        assert.deepEqual(parentMonitor.memberSubjectIds, [mockChildMonitorTypeId]);
    });

    suite('"None" state monitor elimination', () => {
        const mockTopLevelMonitorTypeId = 'top-level';
        let suiteHealthModelDefinition: StringMap<IHealthMonitorDefinition>;
        let suiteParentHealthMonitorIdProvider: IParentHealthMonitorIdProvider;

        setup(() => {
            suiteHealthModelDefinition = {};
            suiteHealthModelDefinition[mockChildMonitorTypeId] = { parentMonitorTypeId: mockParentMonitorTypeId };
            suiteHealthModelDefinition[mockParentMonitorTypeId] = { parentMonitorTypeId: mockTopLevelMonitorTypeId };
            suiteHealthModelDefinition[mockTopLevelMonitorTypeId] = { parentMonitorTypeId: null };
    
            suiteParentHealthMonitorIdProvider = new ParentHealthMonitorIdProvider(suiteHealthModelDefinition);
        });

        test('It does not eliminate "none" state unit monitor given non-none state agg', () => {
            /** arrange */
            const modelBuilder = new HealthModelBuilder(suiteParentHealthMonitorIdProvider);

            const childStateTransition: IMonitorStateTransition = {
                agentDateTimeUtc: new Date(),
                monitorTypeId: mockChildMonitorTypeId,
                monitorSubjectId: mockChildMonitorTypeId,
                labels: {},
                oldState: HealthState.Critical,
                newState: HealthState.None,
                transitionDateTimeUtc: new Date()
            };

            const parentStateTransition: IMonitorStateTransition = {
                agentDateTimeUtc: new Date(),
                monitorTypeId: mockParentMonitorTypeId,
                monitorSubjectId: mockParentMonitorTypeId,
                labels: {},
                oldState: HealthState.Critical,
                newState: HealthState.Warning,
                transitionDateTimeUtc: new Date()
            };

            const topLevelStateTransition: IMonitorStateTransition = {
                agentDateTimeUtc: new Date(),
                monitorTypeId: mockTopLevelMonitorTypeId,
                monitorSubjectId: mockTopLevelMonitorTypeId,
                labels: {},
                oldState: HealthState.Critical,
                newState: HealthState.Critical,
                transitionDateTimeUtc: new Date()
            };

            /** act */
            modelBuilder.processStateTransition(childStateTransition);
            modelBuilder.processStateTransition(parentStateTransition);
            modelBuilder.processStateTransition(topLevelStateTransition);

            const healthModel = modelBuilder.finalize();

            /** assert */
            let monitorCount = 0;
            Object.keys(healthModel.monitors).forEach(key => monitorCount++);

            assert.equal(monitorCount, 3);
        });

        test('It does not eliminate "none" state agg monitor given non-none state member', () => {
            /** arrange */
            const modelBuilder = new HealthModelBuilder(suiteParentHealthMonitorIdProvider);

            const childStateTransition: IMonitorStateTransition = {
                agentDateTimeUtc: new Date(),
                monitorTypeId: mockChildMonitorTypeId,
                monitorSubjectId: mockChildMonitorTypeId,
                labels: {},
                oldState: HealthState.Critical,
                newState: HealthState.Warning,
                transitionDateTimeUtc: new Date()
            };

            const parentStateTransition: IMonitorStateTransition = {
                agentDateTimeUtc: new Date(),
                monitorTypeId: mockParentMonitorTypeId,
                monitorSubjectId: mockParentMonitorTypeId,
                labels: {},
                oldState: HealthState.Critical,
                newState: HealthState.None,
                transitionDateTimeUtc: new Date()
            };

            const topLevelStateTransition: IMonitorStateTransition = {
                agentDateTimeUtc: new Date(),
                monitorTypeId: mockTopLevelMonitorTypeId,
                monitorSubjectId: mockTopLevelMonitorTypeId,
                labels: {},
                oldState: HealthState.Critical,
                newState: HealthState.Critical,
                transitionDateTimeUtc: new Date()
            };

            /** act */
            modelBuilder.processStateTransition(childStateTransition);
            modelBuilder.processStateTransition(parentStateTransition);
            modelBuilder.processStateTransition(topLevelStateTransition);

            const healthModel = modelBuilder.finalize();

            /** assert */
            let monitorCount = 0;
            Object.keys(healthModel.monitors).forEach(key => monitorCount++);

            assert.equal(monitorCount, 3);
        });

        test('It eliminates "none" state agg monitor given none state member', () => {
            /** arrange */
            const modelBuilder = new HealthModelBuilder(suiteParentHealthMonitorIdProvider);

            const childStateTransition: IMonitorStateTransition = {
                agentDateTimeUtc: new Date(),
                monitorTypeId: mockChildMonitorTypeId,
                monitorSubjectId: mockChildMonitorTypeId,
                labels: {},
                oldState: HealthState.Critical,
                newState: HealthState.None,
                transitionDateTimeUtc: new Date()
            };

            const parentStateTransition: IMonitorStateTransition = {
                agentDateTimeUtc: new Date(),
                monitorTypeId: mockParentMonitorTypeId,
                monitorSubjectId: mockParentMonitorTypeId,
                labels: {},
                oldState: HealthState.Critical,
                newState: HealthState.None,
                transitionDateTimeUtc: new Date()
            };

            const topLevelStateTransition: IMonitorStateTransition = {
                agentDateTimeUtc: new Date(),
                monitorTypeId: mockTopLevelMonitorTypeId,
                monitorSubjectId: mockTopLevelMonitorTypeId,
                labels: {},
                oldState: HealthState.Critical,
                newState: HealthState.Critical,
                transitionDateTimeUtc: new Date()
            };

            /** act */
            modelBuilder.processStateTransition(childStateTransition);
            modelBuilder.processStateTransition(parentStateTransition);
            modelBuilder.processStateTransition(topLevelStateTransition);

            const healthModel = modelBuilder.finalize();

            /** assert */
            let monitorCount = 0;
            Object.keys(healthModel.monitors).forEach(key => monitorCount++);

            assert.equal(monitorCount, 1);
            assert.isDefined(healthModel.monitors[mockTopLevelMonitorTypeId]);
        });

        test('It eliminates "none" state subtree', () => {
            /** arrange */
            const modelBuilder = new HealthModelBuilder(suiteParentHealthMonitorIdProvider);

            const childStateTransition: IMonitorStateTransition = {
                agentDateTimeUtc: new Date(),
                monitorTypeId: mockChildMonitorTypeId,
                monitorSubjectId: mockChildMonitorTypeId,
                labels: {},
                oldState: HealthState.Critical,
                newState: HealthState.None,
                transitionDateTimeUtc: new Date()
            };

            const parentStateTransition: IMonitorStateTransition = {
                agentDateTimeUtc: new Date(),
                monitorTypeId: mockParentMonitorTypeId,
                monitorSubjectId: mockParentMonitorTypeId,
                labels: {},
                oldState: HealthState.Critical,
                newState: HealthState.None,
                transitionDateTimeUtc: new Date()
            };

            const topLevelStateTransition: IMonitorStateTransition = {
                agentDateTimeUtc: new Date(),
                monitorTypeId: mockTopLevelMonitorTypeId,
                monitorSubjectId: mockTopLevelMonitorTypeId,
                labels: {},
                oldState: HealthState.Critical,
                newState: HealthState.None,
                transitionDateTimeUtc: new Date()
            };

            /** act */
            modelBuilder.processStateTransition(childStateTransition);
            modelBuilder.processStateTransition(parentStateTransition);
            modelBuilder.processStateTransition(topLevelStateTransition);

            const healthModel = modelBuilder.finalize();

            /** assert */
            let monitorCount = 0;
            Object.keys(healthModel.monitors).forEach(key => monitorCount++);

            assert.equal(monitorCount, 0);
        });
    });

    suite('Consistency checking', () => {
        test('It flags orphan member monitor as inconsistency', () => {
            /** arrange */
            const mockChildMonitorTypeId = 'mockChildMonitorTypeId';
            const mockMissingParentMonitorTypeId = 'mockMissingParentMonitorTypeId';
            const mockParentMonitorTypeId = 'mockParentMonitorTypeId';

            testHealthModelDefinition = {};
            testHealthModelDefinition[mockChildMonitorTypeId] = { parentMonitorTypeId: mockMissingParentMonitorTypeId };
            testHealthModelDefinition[mockMissingParentMonitorTypeId] = { parentMonitorTypeId: mockParentMonitorTypeId };
            testHealthModelDefinition[mockParentMonitorTypeId] = { parentMonitorTypeId: null };
    
            const testParentHealthMonitorIdProvider = new ParentHealthMonitorIdProvider(testHealthModelDefinition);

            const testStateTransitions: IMonitorStateTransition[] = [
                {
                    monitorTypeId: mockParentMonitorTypeId,
                    monitorSubjectId: mockParentMonitorTypeId, 
                    newState: HealthState.Healthy,
                    oldState: HealthState.Critical,
                    agentDateTimeUtc: new Date(),
                    transitionDateTimeUtc: new Date(),
                    labels: {}
                },
                {
                    monitorTypeId: mockChildMonitorTypeId,
                    monitorSubjectId: mockChildMonitorTypeId, 
                    newState: HealthState.Healthy,
                    oldState: HealthState.Critical,
                    agentDateTimeUtc: new Date(),
                    transitionDateTimeUtc: new Date(),
                    labels: {}
                }
            ];

            /** act */
            const testHealthModelBuilder = new HealthModelBuilder(testParentHealthMonitorIdProvider);

            for (const stateTransition of testStateTransitions) {
                testHealthModelBuilder.processStateTransition(stateTransition);
            }

            const healthModel = testHealthModelBuilder.finalize();

            /** assert */
            assert.isNotNull(healthModel.errors);
            assert.equal(healthModel.errors.length, 1);
            assert.isTrue(healthModel.errors[0].indexOf(mockChildMonitorTypeId) > 0);
        });

        test('It flags missing parent details as inconsistency', () => {
            /** arrange */
            const mockChildMonitorTypeId = 'mockChildMonitorTypeId';
            const mockParentMonitorTypeId = 'mockParentMonitorTypeId';

            testHealthModelDefinition = {};
            testHealthModelDefinition[mockChildMonitorTypeId] = { parentMonitorTypeId: mockParentMonitorTypeId };
            testHealthModelDefinition[mockParentMonitorTypeId] = { parentMonitorTypeId: null };
    
            const testParentHealthMonitorIdProvider = new ParentHealthMonitorIdProvider(testHealthModelDefinition);

            const testStateTransitions: IMonitorStateTransition[] = [
                {
                    monitorTypeId: mockParentMonitorTypeId,
                    monitorSubjectId: mockParentMonitorTypeId, 
                    newState: HealthState.Healthy,
                    oldState: HealthState.Critical,
                    agentDateTimeUtc: new Date(),
                    transitionDateTimeUtc: new Date(),
                    labels: {},
                    details: {}
                },
                {
                    monitorTypeId: mockChildMonitorTypeId,
                    monitorSubjectId: mockChildMonitorTypeId, 
                    newState: HealthState.Healthy,
                    oldState: HealthState.Critical,
                    agentDateTimeUtc: new Date(),
                    transitionDateTimeUtc: new Date(),
                    labels: {}
                }
            ];

            /** act */
            const testHealthModelBuilder = new HealthModelBuilder(testParentHealthMonitorIdProvider);

            for (const stateTransition of testStateTransitions) {
                testHealthModelBuilder.processStateTransition(stateTransition);
            }

            const healthModel = testHealthModelBuilder.finalize();

            /** assert */
            assert.isNotNull(healthModel.errors);
            assert.equal(healthModel.errors.length, 1);
            assert.isTrue(healthModel.errors[0].indexOf(mockParentMonitorTypeId) > 0);
        });

        test('It flags unknown member monitor present in parent`s details as inconsistency', () => {
            /** arrange */
            const mockChildMonitorTypeId = 'mockChildMonitorTypeId';
            const mockParentMonitorTypeId = 'mockParentMonitorTypeId';
            const mockMissingMemberMonitorTypeId = 'mockMissingMemberMonitorTypeId';

            testHealthModelDefinition = {};
            testHealthModelDefinition[mockChildMonitorTypeId] = { parentMonitorTypeId: mockParentMonitorTypeId };
            testHealthModelDefinition[mockParentMonitorTypeId] = { parentMonitorTypeId: null };
    
            const testParentHealthMonitorIdProvider = new ParentHealthMonitorIdProvider(testHealthModelDefinition);

            const testStateTransitions: IMonitorStateTransition[] = [
                {
                    monitorTypeId: mockParentMonitorTypeId,
                    monitorSubjectId: mockParentMonitorTypeId, 
                    newState: HealthState.Healthy,
                    oldState: HealthState.Critical,
                    agentDateTimeUtc: new Date(),
                    transitionDateTimeUtc: new Date(),
                    labels: {},
                    details: {
                        details: {
                            pass: [mockMissingMemberMonitorTypeId, mockChildMonitorTypeId]
                        }
                    }
                },
                {
                    monitorTypeId: mockChildMonitorTypeId,
                    monitorSubjectId: mockChildMonitorTypeId, 
                    newState: HealthState.Healthy,
                    oldState: HealthState.Critical,
                    agentDateTimeUtc: new Date(),
                    transitionDateTimeUtc: new Date(),
                    labels: {}
                }
            ];

            /** act */
            const testHealthModelBuilder = new HealthModelBuilder(testParentHealthMonitorIdProvider);

            for (const stateTransition of testStateTransitions) {
                testHealthModelBuilder.processStateTransition(stateTransition);
            }

            const healthModel = testHealthModelBuilder.finalize();

            /** assert */
            assert.isNotNull(healthModel.errors);
            assert.equal(healthModel.errors.length, 1);
            assert.isTrue(healthModel.errors[0].indexOf(mockParentMonitorTypeId) > 0);
            assert.isTrue(healthModel.errors[0].indexOf(mockMissingMemberMonitorTypeId) > 0);
        });

        test('It flags mismatch in parent and member states as inconsistency', () => {
            /** arrange */
            const mockChildMonitorTypeId = 'mockChildMonitorTypeId';
            const mockParentMonitorTypeId = 'mockParentMonitorTypeId';

            testHealthModelDefinition = {};
            testHealthModelDefinition[mockChildMonitorTypeId] = { parentMonitorTypeId: mockParentMonitorTypeId };
            testHealthModelDefinition[mockParentMonitorTypeId] = { parentMonitorTypeId: null };
    
            const testParentHealthMonitorIdProvider = new ParentHealthMonitorIdProvider(testHealthModelDefinition);

            const testStateTransitions: IMonitorStateTransition[] = [
                {
                    monitorTypeId: mockParentMonitorTypeId,
                    monitorSubjectId: mockParentMonitorTypeId, 
                    newState: HealthState.Healthy,
                    oldState: HealthState.Critical,
                    agentDateTimeUtc: new Date(),
                    transitionDateTimeUtc: new Date(),
                    labels: {},
                    details: {
                        details: {
                            pass: [mockChildMonitorTypeId]
                        }
                    }
                },
                {
                    monitorTypeId: mockChildMonitorTypeId,
                    monitorSubjectId: mockChildMonitorTypeId, 
                    newState: HealthState.Critical,
                    oldState: HealthState.Healthy,
                    agentDateTimeUtc: new Date(),
                    transitionDateTimeUtc: new Date(),
                    labels: {}
                }
            ];

            /** act */
            const testHealthModelBuilder = new HealthModelBuilder(testParentHealthMonitorIdProvider);

            for (const stateTransition of testStateTransitions) {
                testHealthModelBuilder.processStateTransition(stateTransition);
            }

            const healthModel = testHealthModelBuilder.finalize();

            /** assert */
            assert.isNotNull(healthModel.errors);
            assert.equal(healthModel.errors.length, 1);
            assert.isTrue(healthModel.errors[0].indexOf(mockParentMonitorTypeId) > 0);
            assert.isTrue(healthModel.errors[0].indexOf(mockChildMonitorTypeId) > 0);
        });

        test('It flags missing member monitor in details of the parent as inconsistency', () => {
            /** arrange */
            const mockChildMonitorTypeId = 'mockChildMonitorTypeId';
            const mockParentMonitorTypeId = 'mockParentMonitorTypeId';

            testHealthModelDefinition = {};
            testHealthModelDefinition[mockChildMonitorTypeId] = { parentMonitorTypeId: mockParentMonitorTypeId };
            testHealthModelDefinition[mockParentMonitorTypeId] = { parentMonitorTypeId: null };
    
            const testParentHealthMonitorIdProvider = new ParentHealthMonitorIdProvider(testHealthModelDefinition);

            const testStateTransitions: IMonitorStateTransition[] = [
                {
                    monitorTypeId: mockParentMonitorTypeId,
                    monitorSubjectId: mockParentMonitorTypeId, 
                    newState: HealthState.Healthy,
                    oldState: HealthState.Critical,
                    agentDateTimeUtc: new Date(),
                    transitionDateTimeUtc: new Date(),
                    labels: {},
                    details: {
                        details: {}
                    }
                },
                {
                    monitorTypeId: mockChildMonitorTypeId,
                    monitorSubjectId: mockChildMonitorTypeId, 
                    newState: HealthState.Healthy,
                    oldState: HealthState.Critical,
                    agentDateTimeUtc: new Date(),
                    transitionDateTimeUtc: new Date(),
                    labels: {}
                }
            ];

            /** act */
            const testHealthModelBuilder = new HealthModelBuilder(testParentHealthMonitorIdProvider);

            for (const stateTransition of testStateTransitions) {
                testHealthModelBuilder.processStateTransition(stateTransition);
            }

            const healthModel = testHealthModelBuilder.finalize();

            /** assert */
            assert.isNotNull(healthModel.errors);
            assert.equal(healthModel.errors.length, 1);
            assert.isTrue(healthModel.errors[0].indexOf(mockParentMonitorTypeId) > 0);
            assert.isTrue(healthModel.errors[0].indexOf(mockChildMonitorTypeId) > 0);
        });
    });
});
