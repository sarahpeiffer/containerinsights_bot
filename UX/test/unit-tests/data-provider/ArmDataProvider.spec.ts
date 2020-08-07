/** test tooling */
import * as chai from 'chai';

/** code for testing */
import { ArmDataProvider } from '../../../src/scripts/shared/data-provider/v2/ArmDataProvider';

/** mocks */
import { LoggingHttpDataProvider } from './MockHttpDataProviders';
import { HttpVerb, IHttpRequestContent } from '../../../src/scripts/shared/data-provider/v2/HttpDataProvider';

const assert = chai.assert;

suite('unit | ArmDataProvider', () => {
    suite('ctor()', () => {
        test('It should use endpoint passed to constructor', () => {
            const logDataProvider = new LoggingHttpDataProvider();
            const endpoint = 'http://test';

            const armDataProvider = new ArmDataProvider(endpoint, () => { return ''; }, logDataProvider);

            return new Promise((resolve, reject) => {
                armDataProvider.executeRequest(HttpVerb.Get, '/path?query=query', 10)
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
            const logDataProvider = new LoggingHttpDataProvider();
            const endpoint = 'http://test';
            const authHeaderValue = 'authHeader';

            const armDataProvider = new ArmDataProvider(endpoint, () => { return authHeaderValue; }, logDataProvider);

            return new Promise((resolve, reject) => {
                armDataProvider.executeRequest(HttpVerb.Get, '/path?query=query', 10)
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

    suite('executeRequest()', () => {
        test('It should pass http verb provided down to HttpProvider', () => {
            const logDataProvider = new LoggingHttpDataProvider();
            const armDataProvider = new ArmDataProvider('endpoint', () => { return ''; }, logDataProvider);

            return new Promise((resolve, reject) => {
                armDataProvider.executeRequest(HttpVerb.Options, '/path', 10)
                    .then((result) => {
                        const log = logDataProvider.getLog();
                        assert.equal(log.length, 1, 'must execute/log one request');
                        const request = log[0];

                        assert.equal(request.verb, HttpVerb.Options, 'must use verb passed in executeRequest()');

                        resolve();
                    })
                    .catch((error) => {
                        reject(error);
                    });
            });
        });

        test('It should include path-and-query provided in the url', () => {
            const logDataProvider = new LoggingHttpDataProvider();
            const armDataProvider = new ArmDataProvider('endpoint', () => { return ''; }, logDataProvider);
            const pathAndQuery = '/path?query=my';

            return new Promise((resolve, reject) => {
                armDataProvider.executeRequest(HttpVerb.Options, pathAndQuery, 10)
                    .then((result) => {
                        const log = logDataProvider.getLog();
                        assert.equal(log.length, 1, 'must execute/log one request');
                        const request = log[0];

                        assert.isTrue(request.url.endsWith(pathAndQuery), 'must include path-and-query provided in the url');

                        resolve();
                    })
                    .catch((error) => {
                        reject(error);
                    });
            });
        });

        test('It should pass timeout provided down to HttpProvider', () => {
            const logDataProvider = new LoggingHttpDataProvider();
            const armDataProvider = new ArmDataProvider('endpoint', () => { return ''; }, logDataProvider);
            const timeout: number = 10;

            return new Promise((resolve, reject) => {
                armDataProvider.executeRequest(HttpVerb.Options, '/path', timeout)
                    .then((result) => {
                        const log = logDataProvider.getLog();
                        assert.equal(log.length, 1, 'must execute/log one request');
                        const request = log[0];

                        assert.equal(request.timeoutMs, timeout, 'must use timeout value passed in executeRequest()');

                        resolve();
                    })
                    .catch((error) => {
                        reject(error);
                    });
            });
        });

        test('It should pass request headers provided down to HttpProvider', () => {
            const logDataProvider = new LoggingHttpDataProvider();
            const armDataProvider = new ArmDataProvider('endpoint', () => { return ''; }, logDataProvider);
            const headers = { myheader: 'my-header-value' };
            const expectedHeaders: StringMap<string> = {
                myheader: 'my-header-value',
                Authorization: '',
            };

            return new Promise((resolve, reject) => {
                armDataProvider.executeRequest(HttpVerb.Options, '/path', 10, headers)
                    .then((result) => {
                        const log = logDataProvider.getLog();
                        assert.equal(log.length, 1, 'must execute/log one request');
                        const request = log[0];

                        assert.deepEqual(request.headers, expectedHeaders, 'must pass request headers provided down to HttpProvider');

                        resolve();
                    })
                    .catch((error) => {
                        reject(error);
                    });
            });
        });

        test('It should pass request content provided down to HttpProvider', () => {
            const logDataProvider = new LoggingHttpDataProvider();
            const armDataProvider = new ArmDataProvider('endpoint', () => { return ''; }, logDataProvider);
            const content = { mycontent: 10 };
            const expectedContent: IHttpRequestContent = {
                contentType: 'application/json',
                content: JSON.stringify(content),
            };

            return new Promise((resolve, reject) => {
                armDataProvider.executeRequest(HttpVerb.Post, '/path', 10, undefined, content)
                    .then((result) => {
                        const log = logDataProvider.getLog();
                        assert.equal(log.length, 1, 'must execute/log one request');
                        const request = log[0];

                        assert.deepEqual(request.content, expectedContent, 'must pass request content provided down to HttpProvider');

                        resolve();
                    })
                    .catch((error) => {
                        reject(error);
                    });
            });
        });
    });
});
