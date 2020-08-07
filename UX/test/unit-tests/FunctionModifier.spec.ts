import FunctionGates from '../../src/scripts/shared/Utilities/FunctionGates';
import { assert } from 'chai';

const _a: number = 1;
const _b = {
    attr1: 'hi',
    attr2: ['t']
};
const _c: string = 'testStr';

suite('unit | FunctionModifier', () => {
    suite('CreateLimitedFunction', () => {
        test('It should pass down the correct arguments to the function', (done: MochaDone) => {
            function testFn(a: number, b: any, c: string) {
                assert.equal(a, _a, 'CreateLimitedFunction did not pass in correct number');
                assert.deepEqual(b, _b, 'CreateLimitedFunction did not pass in correct object');
                assert.deepEqual(c, _c, 'CreateLimitedFunction did not pass in correct string');
                done();
            }
            const limitedFunction = FunctionGates.CreateLimitedFunction(testFn, 250);
            limitedFunction(_a, _b, _c);
        });
        test('It should execute the first function invocation immediately', (done: MochaDone) => {
            const delay = 10;
            function testFn(startTimeMS: number) {
                const diff = Date.now() - startTimeMS;
                assert.isAtMost(diff, delay);
                done();
            }
            const limitedFunction = FunctionGates.CreateLimitedFunction(testFn, delay);
            limitedFunction(Date.now());
        });
        test('It should execute the second function invocation at least 30 MS later', (done: MochaDone) => {
            const delay = 30;
            let isFirstFn = true;
            function testFn(startTimeMS: number) {
                if (isFirstFn) {
                    isFirstFn = false;
                } else {
                    const diff = Date.now() - startTimeMS;
                    assert.isAtLeast(diff, delay);
                    done();
                }
            }
            const limitedFunction = FunctionGates.CreateLimitedFunction(testFn, delay);
            const firstFunctionCall = Date.now();
            limitedFunction(firstFunctionCall);
            limitedFunction(firstFunctionCall);
        });
        test('It should have only two function calls, and delete the arguments of the second function', (done: MochaDone) => {
            const delay = 250;
            function testFn(id: number) {
                if (id === 2) {
                    assert.fail('Second function was not deleted', 
                                'Second function should have been deleted',
                                'LimitedFunction function does not remove intermediate function invocations'
                            );
                    done();
                } else if (id === 3) {
                    done();
                }
            }
            const limitedFunction = FunctionGates.CreateLimitedFunction(testFn, delay);
            limitedFunction(1);
            limitedFunction(2);
            limitedFunction(3);
        });
    });
    suite('CreateThrottledFunction', () => {
        test('It should pass down the correct arguments to the function', (done: MochaDone) => {
            function testFn(a: number, b: any, c: string) {
                assert.equal(a, _a, 'CreateLimitedFunction did not pass in correct number');
                assert.deepEqual(b, _b, 'CreateLimitedFunction did not pass in correct object');
                assert.deepEqual(c, _c, 'CreateLimitedFunction did not pass in correct string');
                done();
            }
            const throttledFunction = FunctionGates.CreateThrottledFunction(testFn, 250);
            throttledFunction(_a, _b, _c);
        });
        test('It should execute the first function invocation immediately', (done: MochaDone) => {
            const delay = 10;
            function testFn(startTimeMS: number) {
                const diff = Date.now() - startTimeMS;
                assert.isAtMost(diff, delay);
                done();
            }
            const throttledFunction = FunctionGates.CreateThrottledFunction(testFn, delay);
            throttledFunction(Date.now());
        });
        test('It should execute the second function invocation at least 30ms later', (done: MochaDone) => {
            const delay = 30;
            let isFirstFn = true;
            function testFn(startTimeMS: number) {
                if (isFirstFn) {
                    isFirstFn = false;
                } else {
                    const diff = Date.now() - startTimeMS;
                    assert.isAtLeast(diff, delay);
                    done();
                }
            }
            const throttledFunction = FunctionGates.CreateThrottledFunction(testFn, delay);
            const firstFunctionCall = Date.now();
            throttledFunction(firstFunctionCall);
            throttledFunction(firstFunctionCall);
        });
        test('It should have three function calls, each with a delay of 30ms', (done: MochaDone) => {
            const delay = 30;
            function testFn(startTimeMS: number, fnCallNum: number) {
                const diff = Date.now() - startTimeMS;
                assert.isAtLeast(diff, delay * (fnCallNum - 1));
                if (fnCallNum === 3) {
                    done();
                }
            }
            const throttledFunction = FunctionGates.CreateThrottledFunction(testFn, delay);
            const firstFunctionCall = Date.now();
            throttledFunction(firstFunctionCall, 1);
            throttledFunction(firstFunctionCall, 2);
            throttledFunction(firstFunctionCall, 3);
        });
    });
    suite('Create debounced function', () => {
        test('It should pass down the correct arguments to the function', (done: MochaDone) => {
            function testFn(a: number, b: any, c: string) {
                assert.equal(a, _a, 'CreateLimitedFunction did not pass in correct number');
                assert.deepEqual(b, _b, 'CreateLimitedFunction did not pass in correct object');
                assert.deepEqual(c, _c, 'CreateLimitedFunction did not pass in correct string');
                done();
            }
            const debouncedFunction = FunctionGates.CreateDebouncedFunction(testFn, 10);
            debouncedFunction(_a, _b, _c);
        });
        test('It should execute only the last function', (done: MochaDone) => {
            const delay = 10;
            let numFnCalls = 0;
            function testFn(startTimeMS: number) {
                numFnCalls++;
                if (numFnCalls === 1 && startTimeMS === 3) {
                    assert.isTrue(true, 'Success!');
                    done();
                } else {
                    assert.fail(numFnCalls, 1, 'Number of function calls should only be 1');
                    assert.fail(startTimeMS, 3, 'Incorrent instance of function invoked');
                    done();
                }
                // if (numFnCalls > 1) {
                //     assert.fail(numFnCalls, 1, 'Number of function calls should only be 1');
                //     done();
                // } else {
                //     done();    
                // }
            }
            const debouncedFunction = FunctionGates.CreateDebouncedFunction(testFn, delay);
            debouncedFunction(1);
            debouncedFunction(2);
            debouncedFunction(3);
        });
        test('It should execute the last function with a delay of 10ms since the last function call', (done: MochaDone) => {
            const delay = 10;
            function testFn(startTimeMS: number) {
                const diff = Date.now() - startTimeMS;
                assert.isAtLeast(diff, delay);
                done();    
            }
            const debouncedFunction = FunctionGates.CreateDebouncedFunction(testFn, delay);
            debouncedFunction(Date.now());
            debouncedFunction(Date.now());
            debouncedFunction(Date.now());
        });
    });
});
