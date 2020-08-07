import * as chai from 'chai';
import { PillProvider, IFilterRecord } from '../../src/scripts/container/control-panel/PillProvider';

const assert = chai.assert;

class PillDataWrapper {
    private pillData: IFilterRecord[];

    constructor() {
        this.pillData = [];
    }

    public add(
        Namespace: string, 
        Cluster: string, 
        Service: string, 
        Node: string, 
        AgentPool: string, 
        ControllerKind: string
    ) {
        this.pillData.push({ Namespace, Cluster, Service, Node, 'Node Pool': AgentPool, ControllerKind });
    }

    public final() {
        return this.pillData;
    }
}

suite('unit | PillProvider', () => {

    suite('applySelectionFilters', () => {
        const provider = new PillProvider(null);
        test('no pills to filter is sensible', () => {
            assert.doesNotThrow(() => {
                const result = provider.applySelectionFilters(
                        null, 
                        { Node: '', Namespace: '', Cluster: '', Service: '', 'Node Pool': '', ControllerKind: '' }
                    );
                assert.isNull(result);
            })
        });

        test('empty pills to filter is sensible', () => {
            const result = provider.applySelectionFilters(
                [], 
                { Node: '', Namespace: '', Cluster: '', Service: '', 'Node Pool': '', ControllerKind: '' }
            );
            assert.deepEqual(result, {
                Cluster: [],
                Namespace: [],
                Node: [],
                Service: [],
                'Node Pool': [],
                ControllerKind: []
            });
        });

        test('empty pills to filter is sensible', () => {
            const result = provider.applySelectionFilters(
                [], 
                { Node: '1', Namespace: '1', Cluster: '1', Service: '1', 'Node Pool': '1', ControllerKind: '1' }
            );
            assert.deepEqual(result, {
                Cluster: [],
                Namespace: [],
                Node: [],
                Service: [],
                'Node Pool': [],
                ControllerKind: []
            });
        });

        test('single pill not filtered', () => {
            const pillWrapper = new PillDataWrapper();
            pillWrapper.add('1', 'A', 'a', '11', 'G', 'Y');
            const result = provider.applySelectionFilters(
                pillWrapper.final(),
                { Node: '', Namespace: '', Cluster: '', Service: '', 'Node Pool': '', ControllerKind: '' }
            );
            assert.deepEqual(result, {
                Namespace: ['1'],
                Cluster: ['A'],
                Service: ['a'],
                Node: ['11'],
                'Node Pool': ['G'],
                ControllerKind: ['Y']
            });
        });

        test('single pill node filtered', () => {
            const pillWrapper = new PillDataWrapper();
            pillWrapper.add('1', 'A', 'a', '11', 'G', 'Y');
            const result = provider.applySelectionFilters(
                pillWrapper.final(),
                { Node: '1', Namespace: '', Cluster: '', Service: '', 'Node Pool': '', ControllerKind: '' }
            );
            assert.deepEqual(result, {
                Cluster: [],
                Namespace: [],
                Node: ['11'],
                Service: [],
                'Node Pool': [],
                ControllerKind: []
            });
        });

        test('single pill cluster filter matched', () => {
            const pillWrapper = new PillDataWrapper();
            pillWrapper.add('1', 'A', 'a', '11', 'G', 'Y');
            const result = provider.applySelectionFilters(
                pillWrapper.final(),
                { Node: '', Namespace: '', Cluster: 'A', Service: '', 'Node Pool': '', ControllerKind: '' });
            assert.deepEqual(result, {
                Cluster: ['A'],
                Namespace: ['1'],
                Node: ['11'],
                Service: ['a'],
                'Node Pool': ['G'],
                ControllerKind: ['Y']
            });
        });

        test('simple two pill cluster no filter', () => {
            const pillWrapper = new PillDataWrapper();
            pillWrapper.add('1', 'A', 'a', '11', 'G', 'Y');
            pillWrapper.add('2', 'B', 'b', '12', 'J', 'W');
            const result = provider.applySelectionFilters(
                pillWrapper.final(),
                { Node: '', Namespace: '', Cluster: '', Service: '', 'Node Pool': '', ControllerKind: '' }
            );
            assert.deepEqual(result, {
                Cluster: ['A', 'B'],
                Namespace: ['1', '2'],
                Node: ['11', '12'],
                Service: ['a', 'b'],
                'Node Pool': ['G', 'J'],
                ControllerKind: ['Y', 'W']
            });
        });

        test('simple two pill cluster simple filter', () => {
            const pillWrapper = new PillDataWrapper();
            pillWrapper.add('1', 'A', 'a', '11', 'G', 'Y');
            pillWrapper.add('2', 'B', 'b', '12', 'J', 'W');
            const result = provider.applySelectionFilters(
                pillWrapper.final(),
                { Node: '11', Namespace: '', Cluster: '', Service: '', 'Node Pool': '', ControllerKind: '' }
            );
            assert.deepEqual(result, {
                Cluster: ['A'],
                Namespace: ['1'],
                Node: ['11', '12'],
                Service: ['a'],
                'Node Pool': ['G'],
                ControllerKind: ['Y']
            });
        });

        /**
         * NB
         * This test isn't possible to achieve through the UI.
         * Filters can only be configured one at a time. If the node pill is configured first, 
         * then there won't be an option to filter by Cluster B
         */
        test('simple two pill cluster complex filter', () => {
            const pillWrapper = new PillDataWrapper();
            pillWrapper.add('1', 'A', 'a', '11', 'G', 'Y');
            pillWrapper.add('2', 'B', 'b', '12', 'J', 'W');
            const result = provider.applySelectionFilters(
                pillWrapper.final(),
                { Node: '11', Namespace: '', Cluster: 'B', Service: '', 'Node Pool': '', ControllerKind: '' }
            );
            assert.deepEqual(result, {
                Cluster: ['A'],
                Namespace: [],
                Node: ['12'],
                Service: [],
                'Node Pool': [],
                ControllerKind: []
            });
        });

        test('complex two pill cluster complex filter', () => {
            const pillWrapper = new PillDataWrapper();
            pillWrapper.add('1', 'A', 'a', '11', 'G', 'Y');
            pillWrapper.add('', 'B', 'b', '12', 'J', 'W');
            const result = provider.applySelectionFilters(
                pillWrapper.final(),
                { Node: '', Namespace: '1', Cluster: '', Service: '', 'Node Pool': '', ControllerKind: '' }
            );
            assert.deepEqual(result, {
                Cluster: ['A'],
                Namespace: ['1'],
                Node: ['11'],
                Service: ['a'],
                'Node Pool': ['G'],
                ControllerKind: ['Y']
            });
        });

        test('complex two pill cluster complex filter', () => {
            const pillWrapper = new PillDataWrapper();
            pillWrapper.add('1', 'A', 'a', '11', 'G', 'Y');
            pillWrapper.add('', 'B', 'b', '12', 'J', 'W');
            const result = provider.applySelectionFilters(
                pillWrapper.final(),
                { Node: '11', Namespace: '', Cluster: '', Service: '', 'Node Pool': '', ControllerKind: '' }
            );
            assert.deepEqual(result, {
                Cluster: ['A'],
                Namespace: ['1'],
                Node: ['11', '12'],
                Service: ['a'],
                'Node Pool': ['G'],
                ControllerKind: ['Y']
            });
        });

        test('complex three pill duplicate cluster complex filter', () => {
            const pillWrapper = new PillDataWrapper();
            pillWrapper.add('1', 'A', 'a', '11', 'G', 'Y');
            pillWrapper.add('', 'B', 'b', '12', 'J', 'W');
            pillWrapper.add('1', '', 'c', '12', 'L', 'Z');
            const result = provider.applySelectionFilters(
                pillWrapper.final(),
                { Node: '12', Namespace: '', Cluster: '', Service: '', 'Node Pool': '', ControllerKind: '' });
            assert.deepEqual(result, {
                Cluster: ['B'],
                Namespace: ['1'],
                Node: ['11', '12'],
                Service: ['b', 'c'],
                'Node Pool': ['J', 'L'],
                ControllerKind: ['W', 'Z']
            });
        });

        test('two pill test kube-system complex filter', () => {
            const pillWrapper = new PillDataWrapper();
            pillWrapper.add('kube-system', 'A', 'a', '11', 'Finn', 'Arwen');
            pillWrapper.add('happy-fun-time', 'B', 'b', '12', 'Jake', 'Frodo');
            const result = provider.applySelectionFilters(
                pillWrapper.final(),
                { Node: '', Namespace: '~', Cluster: '', Service: '', 'Node Pool': '', ControllerKind: '' }
            );
            assert.deepEqual(result, {
                Cluster: ['B'],
                Namespace: ['kube-system', 'happy-fun-time'],
                Node: ['12'],
                Service: ['b'],
                'Node Pool': ['Jake'],
                ControllerKind: ['Frodo']
            });
        });
    });
});
