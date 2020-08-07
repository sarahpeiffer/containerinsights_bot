import { assert } from 'chai';
import {
    ParentHealthMonitorIdProvider
} from '../../../../../src/scripts/container/health/services/healthModel/ParentHealthMonitorIdProvider';
import {
    IHealthMonitorDefinition
} from '../../../../../src/scripts/container/health/services/healthModel/IHealthMonitorDefinition';
import { IHealthMonitorSubject } from '../../../../../src/scripts/container/health/IHealthMonitorSubject';

suite('unit | ParentHealthMonitorIdProvider', () => {

    suite('ctor()', () => {
        test('It throws if health model provided is null', () => {
            assert.throws(() => {
                const parentMonitorIdProvider = new ParentHealthMonitorIdProvider(null);
                assert.fail(parentMonitorIdProvider);
            });
        });
    });

    suite('getParentTypeId()', () => {
        let mockHealthModel: StringMap<IHealthMonitorDefinition>;
        let unknownMonitorSubject: IHealthMonitorSubject;
        let mockChildMonitorTypeId: string;
        let mockParentMonitorTypeId: string;
        let mockDefaultParentMonitorTypeId: string;

        let mockSelectorBasedChildMonitorTypeId: string;
        let mockLabelName: string;
        let mockLabelValue: string;

        setup(() => {
            mockChildMonitorTypeId = 'child';
            mockParentMonitorTypeId = 'parent';
            mockSelectorBasedChildMonitorTypeId = 'child-with-selectors';
            mockDefaultParentMonitorTypeId = 'default-parent';

            mockHealthModel = {};
            mockHealthModel[mockChildMonitorTypeId] = { parentMonitorTypeId: mockParentMonitorTypeId, };
            mockHealthModel[mockSelectorBasedChildMonitorTypeId] = {
                parentMonitorTypeId: [
                    {
                        labelName: mockLabelName,
                        operator: '==',
                        operand: mockLabelValue,
                        parentMonitorTypeId: mockParentMonitorTypeId
                    },
                ],
                defaultParentMonitorTypeId: mockDefaultParentMonitorTypeId
            };

            unknownMonitorSubject = {
                monitorTypeId: 'abracadabra',
                labels: {}
            };
        });

        test('It throws if monitorId provided is null', () => {
            /** arrange */
            const parentMonitorIdProvider = new ParentHealthMonitorIdProvider(mockHealthModel);

            /** act */
            /** assert */
            assert.throws(() => { parentMonitorIdProvider.getParentTypeId(null); });
        });

        test('It throws if monitorId provided is not present in the model', () => {
            /** arrange */
            const parentMonitorIdProvider = new ParentHealthMonitorIdProvider(mockHealthModel);

            /** act */
            /** assert */
            assert.throws(() => { parentMonitorIdProvider.getParentTypeId(unknownMonitorSubject); });
        });

        test('It returns parent type id if specified as string', () => {
            /** arrange */
            const parentMonitorIdProvider = new ParentHealthMonitorIdProvider(mockHealthModel);

            /** act */
            const parentMonitorTypeId = parentMonitorIdProvider.getParentTypeId({ monitorTypeId: mockChildMonitorTypeId, labels: {} });

            /** assert */
            assert.equal(parentMonitorTypeId, mockParentMonitorTypeId);
        });

        test('It returns parent type id if specified as set of rules', () => {
            /** arrange */
            const parentMonitorIdProvider = new ParentHealthMonitorIdProvider(mockHealthModel);

            /** act */
            const monitorLabels = {};
            monitorLabels[mockLabelName] = mockLabelValue;

            const parentMonitorTypeId = parentMonitorIdProvider.getParentTypeId({
                monitorTypeId: mockSelectorBasedChildMonitorTypeId,
                labels: monitorLabels
            });

            /** assert */
            assert.equal(parentMonitorTypeId, mockParentMonitorTypeId);
        });

        test('It returns default parent monitor type id if none of the selection rules match to find parent', () => {
            /** arrange */
            const parentMonitorIdProvider = new ParentHealthMonitorIdProvider(mockHealthModel);

            /** act */
            const monitorLabels = {};
            monitorLabels[mockLabelName] = 'abracadabra';

            const parentMonitorTypeId = parentMonitorIdProvider.getParentTypeId({
                monitorTypeId: mockSelectorBasedChildMonitorTypeId,
                labels: monitorLabels
            });

            /** assert */
            assert.equal(parentMonitorTypeId, mockDefaultParentMonitorTypeId);
        });
    });

    suite('getParentSubjectId()', () => {
        let mockHealthModel: StringMap<IHealthMonitorDefinition>;
        let unknownMonitorSubject: IHealthMonitorSubject;
        let mockChildMonitorTypeId: string;
        let mockParentMonitorTypeId: string;

        let mockParentWithLabelsMonitorTypeId: string;
        let mockChildWithLabelsMonitorTypeId: string;
        let mockKeyLabelName1: string;
        let mockKeyLabelName2: string;
        let mockKeyLabelValue1: string;
        let mockKeyLabelValue2: string;

        let mockChildMonitorSubject: IHealthMonitorSubject;
        let mockChildWithLabelsSubject: IHealthMonitorSubject;

        let mockChildWithLabelsMonitorLabels: StringMap<string>;

        setup(() => {
            mockChildMonitorTypeId = 'child';
            mockParentMonitorTypeId = 'parent';

            mockParentWithLabelsMonitorTypeId = 'parent-with-labels';
            mockChildWithLabelsMonitorTypeId = 'child-with-labels';
            mockKeyLabelName1 = 'key1';
            mockKeyLabelName2 = 'key2';
            mockKeyLabelValue1 = 'value1';
            mockKeyLabelValue2 = 'value2';

            mockChildWithLabelsMonitorLabels = {};
            mockChildWithLabelsMonitorLabels[mockKeyLabelName1] = mockKeyLabelValue1;
            mockChildWithLabelsMonitorLabels[mockKeyLabelName2] = mockKeyLabelValue2;

            mockChildWithLabelsSubject = {
                monitorTypeId: mockChildWithLabelsMonitorTypeId,
                labels: mockChildWithLabelsMonitorLabels
            };

            mockChildMonitorSubject = {
                monitorTypeId: mockChildMonitorTypeId
            };

            mockHealthModel = {};
            mockHealthModel[mockParentMonitorTypeId] = { parentMonitorTypeId: null };
            mockHealthModel[mockChildMonitorTypeId] = { parentMonitorTypeId: mockParentMonitorTypeId };

            mockHealthModel[mockParentWithLabelsMonitorTypeId] = {
                parentMonitorTypeId: null,
                keyLabels: [mockKeyLabelName1, mockKeyLabelName2]
            };
            mockHealthModel[mockChildWithLabelsMonitorTypeId] = {
                parentMonitorTypeId: mockParentWithLabelsMonitorTypeId
            };

            unknownMonitorSubject = {
                monitorTypeId: 'abracadabra',
                labels: {}
            };
        });


        test('It throws if monitor subject provided is null', () => {
            /** arrange */
            const parentMonitorIdProvider = new ParentHealthMonitorIdProvider(mockHealthModel);

            /** act */
            /** assert */
            assert.throws(() => { parentMonitorIdProvider.getParentSubjectId(null); });
        });

        test('It throws if monitorId provided is not present in the model', () => {
            /** arrange */
            const parentMonitorIdProvider = new ParentHealthMonitorIdProvider(mockHealthModel);

            /** act */
            /** assert */
            assert.throws(() => { parentMonitorIdProvider.getParentSubjectId(unknownMonitorSubject); });
        });

        test('It returns parent type id as subject for key-label-less parent', () => {
            /** arrange */
            const parentMonitorIdProvider = new ParentHealthMonitorIdProvider(mockHealthModel);

            /** act */
            const parentMonitorSubjectId = parentMonitorIdProvider.getParentSubjectId(mockChildMonitorSubject);

            /** assert */
            assert.isNotNull(parentMonitorSubjectId);
            assert.equal(parentMonitorSubjectId, mockParentMonitorTypeId);
        });

        test('It returns parent full subject id for parent with key-labels', () => {
            /** arrange */
            const parentMonitorIdProvider = new ParentHealthMonitorIdProvider(mockHealthModel);
            const expectedSubjectId = `${mockParentWithLabelsMonitorTypeId}-${mockKeyLabelValue1}-${mockKeyLabelValue2}`;

            /** act */
            const parentMonitorSubjectId = parentMonitorIdProvider.getParentSubjectId(mockChildWithLabelsSubject);

            /** assert */
            assert.isNotNull(parentMonitorSubjectId);
            assert.equal(parentMonitorSubjectId, expectedSubjectId);
        });
    });
});
