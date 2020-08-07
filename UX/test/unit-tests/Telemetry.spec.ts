import { assert } from 'chai';

import { IApplicationInsightsProvider } from '../../src/scripts/shared/data-provider/TelemetryProvider';
import { IPerformanceMeasureProvider } from '../../src/scripts/shared/Telemetry';
import { Telemetry } from '../../src/scripts/shared/ApplicationInsightsTelemetry';

import { StringMap } from '../../src/scripts/shared/StringMap';

const mockPerfromanceMeasureProvider: IPerformanceMeasureProvider = {
    now: () => { return Date.now(); }
};

suite('unit | Telemetry Context Wrapper', () => {
    suite('.ctor', () => {
        const nullInsightsProvider: IApplicationInsightsProvider = {
            logEvent: () => { },
            logPageView: () => { },
            logException: () => { },
            logDependency: () => { },
            logExceptionLimited: () => { },
            flush: () => { }
        };

        test('it should handle undefined list for custom context', () => {
            const telemetry = new Telemetry(nullInsightsProvider, undefined);
            assert.isNotNull(telemetry);
        });
        test('it should handle empty list for custom context', () => {
            const telemetry = new Telemetry(nullInsightsProvider, {});
            assert.isNotNull(telemetry);
        });
        test('it should handle proper list for custom context', () => {
            const telemetry = new Telemetry(nullInsightsProvider, { someAttr: 'hello' });
            assert.isNotNull(telemetry);
        });
    });

    suite('logEvent', () => {
        test('it should work if no global context exists', () => {
            let worked = false;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: (nameOfEvent: string, properties: StringMap<string>, metrics: StringMap<number>) => {
                    worked = true;
                },
                logPageView: () => { },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };
            const telemetry = new Telemetry(mockInsightsProvider, undefined);
            telemetry.logEvent('test', undefined, undefined);
            assert.isTrue(worked);
        });

        test('it should use global context if exists', () => {
            let worked = false;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: (nameOfEvent: string, properties: StringMap<string>, metrics: StringMap<number>) => {
                    if ('testContext' in properties) {
                        worked = true;
                    }
                },
                logPageView: () => { },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };
            const telemetry = new Telemetry(mockInsightsProvider, { testContext: 'test' });
            telemetry.logEvent('test', undefined, undefined);
            assert.isTrue(worked);
        });

        test('it should use local and global context if exists', () => {
            let worked = false;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: (nameOfEvent: string, properties: StringMap<string>, metrics: StringMap<number>) => {
                    if ('localContext' in properties &&
                        'testContext' in properties) {
                        worked = true;
                    }
                },
                logPageView: () => { },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };
            const telemetry = new Telemetry(mockInsightsProvider, { testContext: 'test' });
            telemetry.logEvent('test', { localContext: 'local' }, undefined);
            assert.isTrue(worked);
        });

        test('it should use local context still if global context undefined', () => {
            let worked = false;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: (nameOfEvent: string, properties: StringMap<string>, metrics: StringMap<number>) => {
                    if ('localContext' in properties) {
                        worked = true;
                    }
                },
                logPageView: () => { },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };
            const telemetry = new Telemetry(mockInsightsProvider, undefined);
            telemetry.logEvent('test', { localContext: 'local' }, undefined);
            assert.isTrue(worked);
        });

        test('local context should not leak to next call', () => {
            let worked = 0;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: (nameOfEvent: string, properties: StringMap<string>, metrics: StringMap<number>) => {
                    if ('localContext' in properties) {
                        worked++;
                    }
                },
                logPageView: () => { },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };
            const telemetry = new Telemetry(mockInsightsProvider, undefined);
            telemetry.logEvent('test', { localContext: 'local' }, undefined);
            telemetry.logEvent('test', undefined, undefined);
            assert.equal(worked, 1);
        });

        test('global context should not disappear', () => {
            let worked = 0;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: (nameOfEvent: string, properties: StringMap<string>, metrics: StringMap<number>) => {
                    if ('testContext' in properties) {
                        worked++;
                    }
                },
                logPageView: () => { },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };
            const telemetry = new Telemetry(mockInsightsProvider, { testContext: 'test' });
            telemetry.logEvent('test', undefined, undefined);
            telemetry.logEvent('test', undefined, undefined);
            assert.equal(worked, 2);
        });
    });

    suite('logPageView', () => {
        test('it should work if no global context exists', () => {
            let worked = false;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: () => { },
                logPageView: (pageName: string, url: string, properties: StringMap<string>,
                    metrics: StringMap<number>, loadTime: number) => {
                    worked = true;
                },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };
            const telemetry = new Telemetry(mockInsightsProvider, undefined);
            telemetry.logPageView('test', undefined, undefined, undefined, undefined);
            assert.isTrue(worked);
        });

        test('it should use global context if exists', () => {
            let worked = false;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: () => { },
                logPageView: (pageName: string, url: string, properties: StringMap<string>,
                    metrics: StringMap<number>, loadTime: number) => {
                    worked = true;
                },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };
            const telemetry = new Telemetry(mockInsightsProvider, { testContext: 'test' });
            telemetry.logPageView('test', undefined, undefined, undefined, undefined);
            assert.isTrue(worked);
        });

        test('it should use local and global context if exists', () => {
            let worked = false;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: () => { },
                logPageView: (pageName: string, url: string, properties: StringMap<string>,
                    metrics: StringMap<number>, loadTime: number) => {
                    if ('localContext' in properties &&
                        'testContext' in properties) {
                        worked = true;
                    }
                },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };
            const telemetry = new Telemetry(mockInsightsProvider, { testContext: 'test' });
            telemetry.logPageView('test', undefined, { localContext: 'local' }, undefined, undefined);
            assert.isTrue(worked);
        });

        test('it should use local context still if global context undefined', () => {
            let worked = false;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: () => { },
                logPageView: (pageName: string, url: string, properties: StringMap<string>,
                    metrics: StringMap<number>, loadTime: number) => {
                    if ('localContext' in properties) {
                        worked = true;
                    }
                },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };
            const telemetry = new Telemetry(mockInsightsProvider, undefined);
            telemetry.logPageView('test', undefined, { localContext: 'local' }, undefined, undefined);
            assert.isTrue(worked);
        });

        test('local context should not leak to next call', () => {
            let worked = 0;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: () => { },
                logPageView: (pageName: string, url: string, properties: StringMap<string>,
                    metrics: StringMap<number>, loadTime: number) => {
                    if ('localContext' in properties) {
                        worked++;
                    }
                },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };
            const telemetry = new Telemetry(mockInsightsProvider, undefined);
            telemetry.logPageView('test', undefined, { localContext: 'local' }, undefined, undefined);
            telemetry.logPageView('test', undefined, undefined, undefined, undefined);
            assert.equal(worked, 1);
        });

        test('global context should not disappear', () => {
            let worked = 0;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: () => { },
                logPageView: (pageName: string, url: string, properties: StringMap<string>,
                    metrics: StringMap<number>, loadTime: number) => {
                    if ('testContext' in properties) {
                        worked++;
                    }
                },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };
            const telemetry = new Telemetry(mockInsightsProvider, { testContext: 'test' });
            telemetry.logPageView('test', undefined, undefined, undefined, undefined);
            telemetry.logPageView('test', undefined, undefined, undefined, undefined);
            assert.equal(worked, 2);
        });
    });

    suite('setContext', () => {
        test('it should append to global context', () => {
            let worked = false;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: () => { },
                logPageView: (pageName: string, url: string, properties: StringMap<string>,
                    metrics: StringMap<number>, loadTime: number) => {
                    if ('testContext' in properties &&
                        'addedContext' in properties) {
                        worked = true;
                    }
                },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };

            const telemetry = new Telemetry(mockInsightsProvider, { testContext: 'test' });
            telemetry.setContext({ addedContext: 'added' }, false);
            telemetry.logPageView('test');
            assert.isTrue(worked);
        });

        test('it should replace global context', () => {
            let worked = false;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: () => { },
                logPageView: (pageName: string, url: string, properties: StringMap<string>,
                    metrics: StringMap<number>, loadTime: number) => {
                    if ('addedContext' in properties) {
                        worked = true;
                    }

                    if ('testContext' in properties) {
                        worked = false;
                    }
                },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };

            const telemetry = new Telemetry(mockInsightsProvider, { testContext: 'test' });
            telemetry.setContext({ addedContext: 'added' }, true);
            telemetry.logPageView('test');
            assert.isTrue(worked);
        });

        test('it should append to empty global context', () => {
            let worked = false;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: () => { },
                logPageView: (pageName: string, url: string, properties: StringMap<string>,
                    metrics: StringMap<number>, loadTime: number) => {
                    if ('addedContext' in properties) {
                        worked = true;
                    }
                },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };

            const telemetry = new Telemetry(mockInsightsProvider, undefined);
            telemetry.setContext({ addedContext: 'added' }, false);
            telemetry.logPageView('test');
            assert.isTrue(worked);
        });

        test('it should clear global context', () => {
            let worked = false;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: () => { },
                logPageView: (pageName: string, url: string, properties: StringMap<string>,
                    metrics: StringMap<number>, loadTime: number) => {
                    if (properties === undefined) {
                        worked = true;
                    }
                },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };

            const telemetry = new Telemetry(mockInsightsProvider, {testContext: 'test'});
            telemetry.setContext(undefined, true);
            telemetry.logPageView('test');
            assert.isTrue(worked);
        });

        test('it should not cause problems with the context issue when null', () => {
            let worked = false;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: () => { },
                logPageView: (pageName: string, url: string, properties: StringMap<string>,
                    metrics: StringMap<number>, loadTime: number) => {
                    if ('testContext' in properties) {
                        worked = true;
                    }
                },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };

            const telemetry = new Telemetry(mockInsightsProvider, {testContext: 'test'});
            telemetry.setContext(undefined, false);
            telemetry.logPageView('test');
            assert.isTrue(worked);
        });
    });

    suite('startLogEvent', () => {
        test('it should work if no global context exists', () => {
            let worked = false;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: (nameOfEvent: string, properties: StringMap<string>, metrics: StringMap<number>) => {
                    worked = true;
                },
                logPageView: () => { },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };

            const telemetry = new Telemetry(mockInsightsProvider, undefined);
            const timedEvent = telemetry.startLogEvent('test', undefined, undefined, mockPerfromanceMeasureProvider);
            timedEvent.complete();

            assert.isTrue(worked);
        });

        test('it should set duration measure to non-negative number', () => {
            let worked = false;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: (nameOfEvent: string, properties: StringMap<string>, metrics: StringMap<number>) => {
                    assert.isTrue('duration' in metrics);
                    assert.isTrue(typeof(metrics.duration) === 'number');
                    assert.isTrue(metrics.duration >= 0);
                    worked = true;
                },
                logPageView: () => { },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };

            const telemetry = new Telemetry(mockInsightsProvider, undefined);
            const timedEvent = telemetry.startLogEvent('test', undefined, undefined, mockPerfromanceMeasureProvider);
            timedEvent.complete();

            assert.isTrue(worked);
        });

        test('it should merge start properties with completion properties', () => {
            let worked = false;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: (nameOfEvent: string, properties: StringMap<string>, metrics: StringMap<number>) => {
                    worked = ('start' in properties) && ('complete' in properties);
                },
                logPageView: () => { },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };

            const telemetry = new Telemetry(mockInsightsProvider, undefined);
            const timedEvent = telemetry.startLogEvent('test', { start: 'start' }, undefined, mockPerfromanceMeasureProvider);
            timedEvent.complete({ complete: 'complete' });

            assert.isTrue(worked);
        });

        test('it should override start properties with completion properties', () => {
            let worked = false;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: (nameOfEvent: string, properties: StringMap<string>, metrics: StringMap<number>) => {
                    worked = ('start' in properties) && 
                             ('complete' in properties) &&
                             (properties.override === 'complete');
                },
                logPageView: () => { },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };

            const telemetry = new Telemetry(mockInsightsProvider, undefined);
            const timedEvent = telemetry.startLogEvent(
                'test', 
                { start: 'start', override: 'start' }, 
                undefined, 
                mockPerfromanceMeasureProvider);

            timedEvent.complete({ complete: 'complete', override: 'complete' });

            assert.isTrue(worked);
        });

        test('it should override start and completion properties with global context', () => {
            let worked = false;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: (nameOfEvent: string, properties: StringMap<string>, metrics: StringMap<number>) => {
                    worked = ('start' in properties) && 
                             ('complete' in properties) &&
                             (properties.override === 'global');
                },
                logPageView: () => { },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };

            const telemetry = new Telemetry(mockInsightsProvider, undefined);
            telemetry.setContext({ override: 'global' }, false);

            const timedEvent = telemetry.startLogEvent(
                'test', 
                { start: 'start', override: 'start' }, 
                undefined, 
                mockPerfromanceMeasureProvider);

            timedEvent.complete({ complete: 'complete', override: 'complete' });

            assert.isTrue(worked);
        });

        test('it should merge start measures with completion measures', () => {
            let worked = false;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: (nameOfEvent: string, properties: StringMap<string>, metrics: StringMap<number>) => {
                    worked = ('start' in metrics) && ('complete' in metrics);
                },
                logPageView: () => { },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };

            const telemetry = new Telemetry(mockInsightsProvider, undefined);
            const timedEvent = telemetry.startLogEvent('test', undefined, { start: 1 }, mockPerfromanceMeasureProvider);
            timedEvent.complete(undefined, { complete: 2 });

            assert.isTrue(worked);
        });

        test('it should override start measures with completion measures', () => {
            let worked = false;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: (nameOfEvent: string, properties: StringMap<string>, metrics: StringMap<number>) => {
                    worked = ('start' in metrics) && 
                             ('complete' in metrics) &&
                             (metrics.override === 3);
                },
                logPageView: () => { },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };

            const telemetry = new Telemetry(mockInsightsProvider, undefined);
            const timedEvent = telemetry.startLogEvent(
                'test',
                undefined,
                { start: 1, override: 42 }, 
                mockPerfromanceMeasureProvider);

            timedEvent.complete(undefined, { complete: 2, override: 3 });

            assert.isTrue(worked);
        });

        test('it should override start and completion measures with final duration', () => {
            let worked = false;
            const mockInsightsProvider: IApplicationInsightsProvider = {
                logEvent: (nameOfEvent: string, properties: StringMap<string>, metrics: StringMap<number>) => {
                    worked = ('start' in metrics) && 
                             ('complete' in metrics) &&
                             (metrics.duration < 1000);
                },
                logPageView: () => { },
                logException: () => { },
                logExceptionLimited: () => { },
                logDependency: () => { },
                flush: () => { }
            };

            const telemetry = new Telemetry(mockInsightsProvider, undefined);
            const timedEvent = telemetry.startLogEvent(
                'test',
                undefined,
                { start: 1, duration: 1000000 }, 
                mockPerfromanceMeasureProvider);

            timedEvent.complete(undefined, { complete: 2, duration: 1000000 });

            assert.isTrue(worked);
        });
    });
});
