/** test tooling */
import * as chai from 'chai';
import * as moment from 'moment';

/** code for testing */
import { HttpVerb, IHttpRequestContent } from '../../../src/scripts/shared/data-provider/v2/HttpDataProvider';
import { ArmDataProvider } from '../../../src/scripts/shared/data-provider/v2/ArmDataProvider';
import { KustoArmDataProvider, KustoDraftDataProvider, IKustoQuery } from '../../../src/scripts/shared/data-provider/v2/KustoDataProvider';
import { IKustoQueryOptions } from '../../../src/scripts/shared/data-provider/KustoDataProvider';
import { TimeInterval } from '../../../src/scripts/shared/data-provider/TimeInterval';

/** mocks */
import { LoggingHttpDataProvider } from './MockHttpDataProviders';

const assert = chai.assert;

suite('unit | KustoDataProvider', () => {
    suite('KustoArmDataProvider', () => {
        // test defaults
        const endpoint = 'http://test';
        const applicationId = 'test-app';
        const workspaceResourceId = '/workspaces/test-one';
        const workspaces = ['wks1', 'wks2'];
        const query = 'table | where 0 > 1';
        const timeoutMs: number = 1000;
        const authorizationHeaderProvider = () => { return 'authHeader'; }
        const requestInfo = 'request-info';
        const requestId = 'request-id';
        const sessionId = 'session-id';

        const intervalStartDate = moment('20180827 13:30:45', 'YYYYMMDD hh:mm:ss');
        const intervalEndDate = moment('20180927 13:30:45', 'YYYYMMDD hh:mm:ss');
        const interval = new TimeInterval(intervalStartDate.toDate(), intervalEndDate.toDate(), 10);

        const kustoOverArmApiVersion = '2017-10-01';

        const logDataProvider = new LoggingHttpDataProvider();
        const armDataProvider = new ArmDataProvider(endpoint, authorizationHeaderProvider, logDataProvider);
        const kustoArmDataProvider = new KustoArmDataProvider(applicationId, armDataProvider);

        suite('ctor()', () => {
            test('It should use applicationId passed to ctor in http request headers', () => {
                logDataProvider.reset();

                return new Promise((resolve, reject) => {
                    kustoArmDataProvider.executeQuery(workspaceResourceId, query, timeoutMs)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.isDefined(request.headers, 'must have headers');
                            assert.equal(request.headers['x-ms-app'], applicationId, 'must set x-ms-app header to app name');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });
        });

        suite('executeQuery()', () => {
            test('It should use POST verb', () => {
                logDataProvider.reset();

                return new Promise((resolve, reject) => {
                    kustoArmDataProvider.executeQuery(workspaceResourceId, query, timeoutMs)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.equal(request.verb, HttpVerb.Post, 'must use POST verb');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should use path of workspace resource id plus /query', () => {
                logDataProvider.reset();

                return new Promise((resolve, reject) => {
                    kustoArmDataProvider.executeQuery(workspaceResourceId, query, timeoutMs)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.isTrue(
                                request.url.startsWith(endpoint + workspaceResourceId + '/query?'),
                                'must set request path to workspace resource id + /query');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should set correct api version in query', () => {
                logDataProvider.reset();

                return new Promise((resolve, reject) => {
                    kustoArmDataProvider.executeQuery(workspaceResourceId, query, timeoutMs)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.isTrue(
                                request.url.endsWith('?api-version=' + kustoOverArmApiVersion),
                                'must set correct api version in query');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should set prefer header timeout value in seconds', () => {
                logDataProvider.reset();

                return new Promise((resolve, reject) => {
                    kustoArmDataProvider.executeQuery(workspaceResourceId, query, timeoutMs)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.isDefined(request.headers, 'must have headers');
                            assert.equal(
                                request.headers['Prefer'],
                                'wait=' + timeoutMs / 1000,
                                'must set prefer header timeout value in seconds');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should pass query in body', () => {
                logDataProvider.reset();

                const expectedRequestContent = {
                    contentType: 'application/json',
                    content: JSON.stringify({ query })
                };

                return new Promise((resolve, reject) => {
                    kustoArmDataProvider.executeQuery(workspaceResourceId, query, timeoutMs)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.deepEqual(request.content, expectedRequestContent, 'must pass query in request content');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should pass workspaces in body', () => {
                logDataProvider.reset();

                const expectedRequestContent = {
                    contentType: 'application/json',
                    content: JSON.stringify({ query, workspaces })
                };

                return new Promise((resolve, reject) => {
                    kustoArmDataProvider.executeQuery(workspaceResourceId, query, timeoutMs, undefined, workspaces)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.deepEqual(request.content, expectedRequestContent, 'must pass workspaces in request content');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should pass request info in header', () => {
                logDataProvider.reset();

                const options: IKustoQueryOptions = { requestInfo };

                return new Promise((resolve, reject) => {
                    kustoArmDataProvider.executeQuery(workspaceResourceId, query, timeoutMs, options)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.isDefined(request.headers, 'must have request headers');
                            assert.equal(request.headers['x-ms-client-request-info'], requestInfo, 'must pass request info header');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should pass request id in header', () => {
                logDataProvider.reset();

                const options: IKustoQueryOptions = { requestId };

                return new Promise((resolve, reject) => {
                    kustoArmDataProvider.executeQuery(workspaceResourceId, query, timeoutMs, options)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.isDefined(request.headers, 'must have request headers');
                            assert.equal(request.headers['x-ms-client-request-id'], requestId, 'must pass request id header');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should pass session id in header', () => {
                logDataProvider.reset();

                const options: IKustoQueryOptions = { sessionId };

                return new Promise((resolve, reject) => {
                    kustoArmDataProvider.executeQuery(workspaceResourceId, query, timeoutMs, options)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.isDefined(request.headers, 'must have request headers');
                            assert.equal(request.headers['x-ms-client-session-id'], sessionId, 'must pass session id header');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should pass timespan in body', () => {
                logDataProvider.reset();

                const options: IKustoQueryOptions = { timeInterval: interval };

                const startTime = interval.getBestGranularStartDate();
                const endTime = interval.getBestGranularEndDate(true);

                const expectedTimesspan = startTime.toISOString() + '/' + endTime.toISOString();
                const expectedContent = JSON.stringify({
                    query,
                    timespan: expectedTimesspan
                });

                return new Promise((resolve, reject) => {
                    kustoArmDataProvider.executeQuery(workspaceResourceId, query, timeoutMs, options)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.equal(request.content.content, expectedContent, 'must pass timespan in content');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });
        });
    });

    suite('KustoDraftDataProvider', () => {
        // test defaults
        const endpoint = 'http://test';
        const applicationId = 'test-app';
        const workspaceResourceId = '/workspaces/test-one';
        const workspaceResourceId2 = '/workspaces/test-two';
        const workspaces = ['wks1', 'wks2'];
        const query = 'table | where 0 > 1';
        const timeoutMs: number = 1000;
        const authHeaderValue = 'authHeader';
        const authorizationHeaderProvider = () => { return authHeaderValue; }
        const requestInfo = 'request-info';
        const requestId = 'request-id';
        const sessionId = 'session-id';

        const intervalStartDate = moment('20180827 13:30:45', 'YYYYMMDD hh:mm:ss');
        const intervalEndDate = moment('20180927 13:30:45', 'YYYYMMDD hh:mm:ss');
        const interval = new TimeInterval(intervalStartDate.toDate(), intervalEndDate.toDate(), 10);

        const logDataProvider = new LoggingHttpDataProvider();
        const kustoDataProvider = new KustoDraftDataProvider(() => endpoint, applicationId, authorizationHeaderProvider, logDataProvider);

        suite('ctor()', () => {
            test('It should use applicationId passed to ctor in http request headers', () => {
                logDataProvider.reset();

                return new Promise((resolve, reject) => {
                    kustoDataProvider.executeQuery(workspaceResourceId, query, timeoutMs)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.isDefined(request.headers, 'must have headers');
                            assert.equal(request.headers['x-ms-app'], applicationId, 'must set x-ms-app header to app name');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should use endpoint passed to constructor', () => {
                logDataProvider.reset();

                return new Promise((resolve, reject) => {
                    kustoDataProvider.executeQuery(workspaceResourceId, query, timeoutMs)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];


                            assert.isTrue(request.url.startsWith(endpoint), 'must use endpoint provided to make requests');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should use authorization header passed to constructor', () => {
                logDataProvider.reset();

                return new Promise((resolve, reject) => {
                    kustoDataProvider.executeQuery(workspaceResourceId, query, timeoutMs)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.equal(
                                request.headers.Authorization,
                                authHeaderValue,
                                'must use authorization header provided to make requests');

                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });
        });

        suite('executeQuery()', () => {
            test('It should use POST verb', () => {
                logDataProvider.reset();

                return new Promise((resolve, reject) => {
                    kustoDataProvider.executeQuery(workspaceResourceId, query, timeoutMs)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.equal(request.verb, HttpVerb.Post, 'must use POST verb');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should use path of workspace resource id plus /query', () => {
                logDataProvider.reset();

                return new Promise((resolve, reject) => {
                    kustoDataProvider.executeQuery(workspaceResourceId, query, timeoutMs)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.isTrue(
                                request.url.startsWith(endpoint + '/v1' + workspaceResourceId + '/query'),
                                'must set request path to workspace resource id + /query');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should set prefer header timeout value in seconds', () => {
                logDataProvider.reset();

                return new Promise((resolve, reject) => {
                    kustoDataProvider.executeQuery(workspaceResourceId, query, timeoutMs)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.isDefined(request.headers, 'must have headers');
                            assert.equal(
                                request.headers['Prefer'],
                                'wait=' + timeoutMs / 1000,
                                'must set prefer header timeout value in seconds');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should pass query in body', () => {
                logDataProvider.reset();

                const expectedRequestContent = {
                    contentType: 'application/json',
                    content: JSON.stringify({ query })
                };

                return new Promise((resolve, reject) => {
                    kustoDataProvider.executeQuery(workspaceResourceId, query, timeoutMs)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.deepEqual(request.content, expectedRequestContent, 'must pass query in request content');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should pass workspaces in body', () => {
                logDataProvider.reset();

                const expectedRequestContent = {
                    contentType: 'application/json',
                    content: JSON.stringify({ query, workspaces })
                };

                return new Promise((resolve, reject) => {
                    kustoDataProvider.executeQuery(workspaceResourceId, query, timeoutMs, undefined, workspaces)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.deepEqual(request.content, expectedRequestContent, 'must pass workspaces in request content');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should pass request info in header', () => {
                logDataProvider.reset();

                const options: IKustoQueryOptions = { requestInfo };

                return new Promise((resolve, reject) => {
                    kustoDataProvider.executeQuery(workspaceResourceId, query, timeoutMs, options)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.isDefined(request.headers, 'must have request headers');
                            assert.equal(request.headers['x-ms-client-request-info'], requestInfo, 'must pass request info header');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should pass request id in header', () => {
                logDataProvider.reset();

                const options: IKustoQueryOptions = { requestId };

                return new Promise((resolve, reject) => {
                    kustoDataProvider.executeQuery(workspaceResourceId, query, timeoutMs, options)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.isDefined(request.headers, 'must have request headers');
                            assert.equal(request.headers['x-ms-client-request-id'], requestId, 'must pass request id header');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should pass session id in header', () => {
                logDataProvider.reset();

                const options: IKustoQueryOptions = { sessionId };

                return new Promise((resolve, reject) => {
                    kustoDataProvider.executeQuery(workspaceResourceId, query, timeoutMs, options)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.isDefined(request.headers, 'must have request headers');
                            assert.equal(request.headers['x-ms-client-session-id'], sessionId, 'must pass session id header');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should pass timespan in body', () => {
                logDataProvider.reset();

                const options: IKustoQueryOptions = { timeInterval: interval };

                const startTime = interval.getBestGranularStartDate();
                const endTime = interval.getBestGranularEndDate(true);

                const expectedTimesspan = startTime.toISOString() + '/' + endTime.toISOString();
                const expectedContent = JSON.stringify({
                    query,
                    timespan: expectedTimesspan
                });

                return new Promise((resolve, reject) => {
                    kustoDataProvider.executeQuery(workspaceResourceId, query, timeoutMs, options)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.equal(request.content.content, expectedContent, 'must pass timespan in content');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });
        });

        suite('executeBatch()', () => {
            test('It should use POST verb', () => {
                logDataProvider.reset();

                const queries: IKustoQuery[] = [{
                    queryId: Math.floor((Math.random() * 100) + 1).toString(),
                    workspaceResourceId: workspaceResourceId,
                    queryStatement: query,
                    timeoutMs: timeoutMs

                }];

                return new Promise((resolve, reject) => {
                    kustoDataProvider.executeBatch(queries, timeoutMs)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.equal(request.verb, HttpVerb.Post, 'must use POST verb');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should use v1/$batch endpoint', () => {
                logDataProvider.reset();

                const queryId = Math.floor((Math.random() * 100) + 1);

                const queries: IKustoQuery[] = [{
                    queryId: queryId.toString(),
                    workspaceResourceId: workspaceResourceId,
                    queryStatement: query,
                    timeoutMs: timeoutMs

                }, {
                    queryId: (queryId + 1).toString(),
                    workspaceResourceId: workspaceResourceId2,
                    queryStatement: query,
                    timeoutMs: timeoutMs
                }];

                return new Promise((resolve, reject) => {
                    kustoDataProvider.executeBatch(queries, timeoutMs)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            assert.isTrue(
                                request.url.startsWith(endpoint + '/v1' + '/$batch'),
                                'must set request path to /v1/$batch');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should set prefer header timeout value in seconds', () => {
                logDataProvider.reset();

                const queries: IKustoQuery[] = [{
                    queryId: Math.floor((Math.random() * 100) + 1).toString(),
                    workspaceResourceId: workspaceResourceId,
                    queryStatement: query,
                    timeoutMs: timeoutMs

                }];

                return new Promise((resolve, reject) => {
                    kustoDataProvider.executeBatch(queries, timeoutMs)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            const requestContent: IHttpRequestContent = request.content;
                            const content = JSON.parse(requestContent.content);

                            assert.isDefined(content.requests[0].headers, 'must have headers');

                            assert.equal(
                                content.requests[0].headers['Prefer'],
                                'wait=' + timeoutMs / 1000,
                                'must set prefer header timeout value in seconds');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should pass query in body', () => {
                logDataProvider.reset();

                const queryId = Math.floor((Math.random() * 100) + 1);

                const queries: IKustoQuery[] = [{
                    queryId: queryId.toString(),
                    workspaceResourceId: workspaceResourceId,
                    queryStatement: query,
                    timeoutMs: timeoutMs
                }];

                const expectedRequestContent = {
                    'requests': [{
                        id: queryId.toString(),
                        headers: {
                            'x-ms-app': applicationId,
                            Prefer: 'wait=' + timeoutMs / 1000,
                            'Content-Type': 'application/json',
                        },
                        body: {
                            query: query
                        },
                        method: 'POST',
                        path: '/query',
                        workspace: workspaceResourceId

                    }]
                };


                return new Promise((resolve, reject) => {
                    kustoDataProvider.executeBatch(queries, timeoutMs)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];
                            const requestContent: IHttpRequestContent = request.content;

                            assert.equal(requestContent.contentType,
                                'application/json', 'content type must be application/json');
                            const actualContent = JSON.parse(requestContent.content);
                            assert.deepEqual(actualContent, expectedRequestContent, 'must pass query in request content');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });


            test('It should pass request info in header', () => {
                logDataProvider.reset();

                const options: IKustoQueryOptions = { requestInfo };

                const queryId = Math.floor((Math.random() * 100) + 1);

                const queries: IKustoQuery[] = [{
                    queryId: queryId.toString(),
                    workspaceResourceId: workspaceResourceId,
                    queryStatement: query,
                    timeoutMs: timeoutMs,
                    options: options
                }];

                return new Promise((resolve, reject) => {
                    kustoDataProvider.executeBatch(queries, timeoutMs)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            const requestContent: IHttpRequestContent = request.content;
                            const content = JSON.parse(requestContent.content);

                            assert.isDefined(content.requests[0].headers, 'must have request headers');
                            assert.equal(content.requests[0].headers['x-ms-client-request-info'],
                                requestInfo, 'must pass request info header');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should pass request id in header', () => {
                logDataProvider.reset();

                const options: IKustoQueryOptions = { requestId };

                const queryId = Math.floor((Math.random() * 100) + 1);

                const queries: IKustoQuery[] = [{
                    queryId: queryId.toString(),
                    workspaceResourceId: workspaceResourceId,
                    queryStatement: query,
                    timeoutMs: timeoutMs,
                    options: options
                }];

                return new Promise((resolve, reject) => {
                    kustoDataProvider.executeBatch(queries, timeoutMs)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            const requestContent: IHttpRequestContent = request.content;
                            const content = JSON.parse(requestContent.content);

                            assert.isDefined(content.requests[0].headers, 'must have request headers');
                            assert.equal(content.requests[0].headers['x-ms-client-request-id'],
                                requestId, 'must pass request id header');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should pass session id in header', () => {
                logDataProvider.reset();

                const options: IKustoQueryOptions = { sessionId };

                const queryId = Math.floor((Math.random() * 100) + 1);

                const queries: IKustoQuery[] = [{
                    queryId: queryId.toString(),
                    workspaceResourceId: workspaceResourceId,
                    queryStatement: query,
                    timeoutMs: timeoutMs,
                    options: options
                }];

                return new Promise((resolve, reject) => {
                    kustoDataProvider.executeBatch(queries, timeoutMs)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];

                            const requestContent: IHttpRequestContent = request.content;
                            const content = JSON.parse(requestContent.content);

                            assert.isDefined(content.requests[0].headers, 'must have request headers');
                            assert.equal(content.requests[0].headers['x-ms-client-session-id'],
                                sessionId,
                                'must pass session id header');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });

            test('It should pass timespan in body', () => {
                logDataProvider.reset();

                const options: IKustoQueryOptions = { timeInterval: interval };

                const queryId = Math.floor((Math.random() * 100) + 1);

                const queries: IKustoQuery[] = [{
                    queryId: queryId.toString(),
                    workspaceResourceId: workspaceResourceId,
                    queryStatement: query,
                    timeoutMs: timeoutMs,
                    options: options
                }];

                const startTime = interval.getBestGranularStartDate();
                const endTime = interval.getBestGranularEndDate(true);

                const expectedTimesspan = startTime.toISOString() + '/' + endTime.toISOString();
                const expectedContent = JSON.stringify({
                    query,
                    timespan: expectedTimesspan
                });

                return new Promise((resolve, reject) => {
                    kustoDataProvider.executeBatch(queries, timeoutMs)
                        .then((result) => {
                            const log = logDataProvider.getLog();
                            assert.equal(log.length, 1, 'must execute/log one request');
                            const request = log[0];
                            const requestContent: IHttpRequestContent = request.content;
                            const content = JSON.parse(requestContent.content);

                            assert.equal(JSON.stringify(content.requests[0].body), expectedContent, 'must pass timespan in body');
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });
        });

    });
});
