/** test tooling */
import * as chai from 'chai';

/** code for testing */
import { KubernetesParsingAndAggregation } from '../../../src/scripts/shared/data-provider/KubernetesParsingAndAggregation';
import { UnitParser } from '../../../src/scripts/container/shared/openapi-parser/UnitParser';
import { QuantitySuffixer } from '../../../src/scripts/container/shared/openapi-parser/QuantitySuffixer';

const assert = chai.assert;

suite('unit | KubernetesParsingAndAggregation', () => {
    suite('Parse String', () => {
        const delta = 0.0001;
        const kubernetesParsingAndAggregation = new KubernetesParsingAndAggregation(
            new UnitParser(QuantitySuffixer.Instance()),
            {
                logEvent: (() => { }) as any,
                logException: (() => { }) as any,
                logExceptionLimited: (() => { }) as any,
                startLogEvent: (() => { }) as any,
                logPageView: (() => { }) as any,
                logDependency: (() => { }) as any,
                setContext: (() => { }) as any,
                flush: (() => { }) as any,
                logNavigationEvent: (() => { }) as any
            }
        );
        const nodeListResponse = {
            items: [
                { metadata: { name: 'node1' }, status: { allocatable: { cpu: '1900m', memory: '2Gi' } } },
                { metadata: { name: 'node2' }, status: { allocatable: { cpu: '1901m', memory: '1900Mi' } } },
                { metadata: { name: 'node3' }, status: { allocatable: { cpu: '1902m', memory: '800Mi' } } },
                { metadata: { name: 'node4' }, status: { allocatable: { cpu: '1903m', memory: '1000Mi' } } },
                { metadata: { name: 'node5' }, status: { allocatable: { cpu: '1904m', memory: '5Gi' } } },
            ],
        };
        const nodeMetricsResponse = {
            items: [
                { metadata: { name: 'node1' }, usage: { cpu: '123m', memory: '123Mi' } },
                { metadata: { name: 'node2' }, usage: { cpu: '101m', memory: '900000Ki' } },
                { metadata: { name: 'node3' }, usage: { cpu: '12m', memory: '123Mi' } },
                { metadata: { name: 'node4' }, usage: { cpu: '1m', memory: '123Mi' } },
                { metadata: { name: 'node5' }, usage: { cpu: '1001m', memory: '1900Mi' } },
            ],
        };

        //********************************************************************************************************** 
        // CPU PARSE
        //********************************************************************************************************** 
        test('parseCpuString() should evaluate CPU string properly', () => {

            // *****************   nano 10 ^ -9
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('1000000000n'), 1000000000 * Math.pow(10, -9), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('000000000n'), 0, delta);
            // bbax: 1n is the smallest possible number, see comment on 0.1n
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('1n'), Math.pow(10, -9), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('1.n'), Math.pow(10, -9), delta);
            // bbax: note we draw the line in the sand at Nano... anything smaller then 1n we truncate to zero. if you would like smaller
            // then this you can remove the check if (scale >= Nano) in the UnitParser.ts file... frankly i'm not sure the charting engine
            // can even handle 1n... we shall see if this ever comes up :)
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0.1n'), 0, delta);

            // *****************   micro?? 10 ^ -6
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('100u'), 100.0 * Math.pow(10, -6), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('100.u'), 100.0 * Math.pow(10, -6), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0.1u'), 0.1 * Math.pow(10, -6), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('.1u'), 0.1 * Math.pow(10, -6), delta);
            // bbax: this is the smallest possible number (see comment on 1n)
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('.001u'), 0.001 * Math.pow(10, -6), delta);
            // bbax: this is too small... its .1n (see comment on 0.1n)
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('.0001u'), 0, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0u'), 0, delta);

            // *****************   milli 10^-3
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('100m'), 100 * Math.pow(10, -3), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('100.m'), 100 * Math.pow(10, -3), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0.1m'), 0.1 * Math.pow(10, -3), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('.1m'), 0.1 * Math.pow(10, -3), delta);
            // bbax: 1n smallest possible
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0.000001m'), 0.000001 * Math.pow(10, -3), delta);
            // bbax: 0.1n too small
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0.0000001m'), 0, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0m'), 0, delta);


            // *****************   base (deca) 10^0
            // bbax: too many levels of precision (sub-nano)
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0.9999999999'), 0, delta);
            // bbax: biggest number
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('999999999999999'), 999999999999999, delta);
            // bbax: edge case slider
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('999999999999999.999'), 999999999999999.999, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('999999999.999999999'), 999999999.999999999, delta);
            // bbax: too big
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('1000000000000000'), 0, delta);
            // bbax: nano levels of precision
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0.999999999'), 0.99999999999, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('100'), 100, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0'), 0, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('000000000000000'), 0, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('1'), 1, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('1.'), 1, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('1c'), 1, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0.1c'), 0.1, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0.1'), 0.1, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('.1'), 0.1, delta);

            // *****************  k (terra) 10^3
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('999k'), 999 * Math.pow(10, 3), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('100k'), 100 * Math.pow(10, 3), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('100.k'), 100 * Math.pow(10, 3), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0.1k'), 0.1 * Math.pow(10, 3), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('.1k'), 0.1 * Math.pow(10, 3), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0k'), 0, delta);

            // *****************  M (terra) 10^6
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('999M'), 999 * Math.pow(10, 6), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('100M'), 100 * Math.pow(10, 6), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('100.M'), 100 * Math.pow(10, 6), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0.1M'), 0.1 * Math.pow(10, 6), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('.1M'), 0.1 * Math.pow(10, 6), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0M'), 0, delta);

            // *****************  G (terra) 10^9
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('999G'), 999 * Math.pow(10, 9), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('100G'), 100 * Math.pow(10, 9), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('100.G'), 100 * Math.pow(10, 9), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0.1G'), 0.1 * Math.pow(10, 9), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('.1G'), 0.1 * Math.pow(10, 9), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0G'), 0, delta);

            // *****************  T (terra) 10^12
            // bbax: too big, 1P... see comment on 1P
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('1000T'), 0, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('999T'), 999 * Math.pow(10, 12), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('100T'), 100 * Math.pow(10, 12), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('100.T'), 100 * Math.pow(10, 12), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0.1T'), 0.1 * Math.pow(10, 12), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('.1T'), 0.1 * Math.pow(10, 12), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0T'), 0, delta);

            // ***************** P (Peta) 10^15 (the line must be drawn here! we choose 0.9P to avoid overflowing javascript
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('1P'), 0, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('1.1P'), 0, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0000.9P'), 0.9 * Math.pow(10, 15), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('0000.1P'), 0.1 * Math.pow(10, 15), delta);

            // ***************** W (??) 10^18 (these are just plain to big for javascript)
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('1W'), 0, delta);

            // *****************  invalid input
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('1t'), 0, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('k'), 0, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('test'), 0, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseCpuString('.'), 0, delta);
        });

        //********************************************************************************************************** 
        // MEMORY PARSE
        //********************************************************************************************************** 
        test('parseMemoryString() should evaluate memory string properly', () => {
            // *****************   base (deca) 10^0
            // bbax: too many levels of precision (sub-nano)
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('0.9999999999'), 0, delta);
            // bbax: biggest number
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('999999999999999'), 999999999999999, delta);
            // bbax: edge case slider
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('999999999999999.999'), 999999999999999.999, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('999999999.999999999'), 999999999.999999999, delta);
            // bbax: too big
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('1000000000000000'), 0, delta);
            // bbax: nano levels of precision
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('0.999999999'), 0.99999999999, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('100'), 100, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('0'), 0, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('000000000000000'), 0, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('1'), 1, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('1.'), 1, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('1c'), 1, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('0.1c'), 0.1, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('0.1'), 0.1, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('.1'), 0.1, delta);

            // *****************  Ki (kila) 2^10
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('999Ki'), 999 * Math.pow(2, 10), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('100Ki'), 100 * Math.pow(2, 10), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('100.Ki'), 100 * Math.pow(2, 10), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('0.1Ki'), 0.1 * Math.pow(2, 10), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('.1Ki'), 0.1 * Math.pow(2, 10), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('0Ki'), 0, delta);

            // *****************  Mi (terra) 2^20
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('999Mi'), 999 * Math.pow(2, 20), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('100Mi'), 100 * Math.pow(2, 20), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('100.Mi'), 100 * Math.pow(2, 20), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('0.1Mi'), 0.1 * Math.pow(2, 20), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('.1Mi'), 0.1 * Math.pow(2, 20), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('0Mi'), 0, delta);

            // *****************  Gi (giga) 2^30
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('999Gi'), 999 * Math.pow(2, 30), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('100Gi'), 100 * Math.pow(2, 30), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('100.Gi'), 100 * Math.pow(2, 30), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('0.1Gi'), 0.1 * Math.pow(2, 30), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('.1Gi'), 0.1 * Math.pow(2, 30), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('0Gi'), 0, delta);

            // *****************  Ti (terra) 2^40
            // bbax: too big, 1P... see comment on 1P
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('1000Ti'), 0, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('999Ti'), 999 * Math.pow(2, 40), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('100Ti'), 100 * Math.pow(2, 40), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('100.Ti'), 100 * Math.pow(2, 40), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('0.1Ti'), 0.1 * Math.pow(2, 40), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('.1Ti'), 0.1 * Math.pow(2, 40), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('0Ti'), 0, delta);

            // ***************** Pi (petta) 2^50 (these are just plain to big for javascript)
            // bbax: same deal as CPU... we need to ensure we dont overflow the limit of javascript
            // we would cross that limit inside the single digit Pi range, so we chop out the entire range
            // for simplicity and disallow the Pi range unless its fractional
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('1Pi'), 0, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('1.1Pi'), 0, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('0.9Pi'), 0.9 * Math.pow(2, 50), delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('000000.9Pi'), 0.9 * Math.pow(2, 50), delta);

            // ***************** Ei (exa) 2^60 (these are just plain to big for javascript)
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('1Ei'), 0, delta);

            // *****************  invalid input
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('1t'), 0, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('Ki'), 0, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('test'), 0, delta);
            assert.closeTo(kubernetesParsingAndAggregation.parseMemoryString('.'), 0, delta);
        });

        test('aggregations should return correct values', () => {
            const values = [1, 5, 1, 7, 4, 9, 0, 2, 3];
            assert.equal(kubernetesParsingAndAggregation.aggregateMin(values), 0);
            assert.equal(kubernetesParsingAndAggregation.aggregateMax(values), 9);
            assert.closeTo(kubernetesParsingAndAggregation.aggregateAvg(values), 3.55556, delta);
            assert.closeTo(kubernetesParsingAndAggregation.aggregatePercentile(values, 50), 3, delta);
            assert.closeTo(kubernetesParsingAndAggregation.aggregatePercentile(values, 90), 7.4, delta);
            assert.closeTo(kubernetesParsingAndAggregation.aggregatePercentile(values, 95), 8.2, delta);
        });

        test('nodeCpu() should return correct percentage values', () => {
            const cpu = kubernetesParsingAndAggregation.nodeCpu(nodeListResponse, nodeMetricsResponse);
            const expected = [6.473684, 5.312993, 0.630915, 0.052549, 52.573529];
            assert.equal(cpu.length, expected.length);
            for (let i = 0; i < cpu.length; i++) {
                assert.closeTo(cpu[i], expected[i], delta);
            }
        });

        test('nodeMemory() should return correct percentage values', () => {
            const memory = kubernetesParsingAndAggregation.nodeMemory(nodeListResponse, nodeMetricsResponse);
            const expected = [6.0058, 46.25822, 15.375, 12.3, 37.1093];
            assert.equal(memory.length, expected.length);
            for (let i = 0; i < memory.length; i++) {
                assert.closeTo(memory[i], expected[i], delta);
            }
        });
    });
});
