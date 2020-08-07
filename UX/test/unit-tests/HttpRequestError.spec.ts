import { assert } from 'chai';

import { HttpRequestError } from '../../src/scripts/shared/data-provider/HttpRequestError';

suite('unit | HttpRequestError', () => {

    suite('unit | isHttpRequestError', () => {
        test('It treats UNDEFINED object without as not a valid http error', () => {
            const error = undefined;
            assert.isFalse(HttpRequestError.isHttpRequestError(error));
        });

        test('It treats NULL object without as not a valid http error', () => {
            const error = null;
            assert.isFalse(HttpRequestError.isHttpRequestError(error));
        });

        test('It treats object without "httpRequestError" property as not a valid http error', () => {
            const error = {a: 123};
            assert.isFalse(HttpRequestError.isHttpRequestError(error));
        });

        test('It treats object with "httpRequestError" property set to NULL as not a valid http error', () => {
            const error = { httpRequestError: null };
            assert.isFalse(HttpRequestError.isHttpRequestError(error));
        });

        test('It treats object with "httpRequestError" but no "status" property as not a valid http error', () => {
            const error = { httpRequestError: {a: 123} };
            assert.isFalse(HttpRequestError.isHttpRequestError(error));
        });

        test('It treats object with "httpRequestError" but no "status" property as not a valid http error', () => {
            const error = { httpRequestError: {a: 123} };
            assert.isFalse(HttpRequestError.isHttpRequestError(error));
        });

        test('It treats object with "httpRequestError" but null "status" property as not a valid http error', () => {
            const error = { httpRequestError: {status: null} };
            assert.isFalse(HttpRequestError.isHttpRequestError(error));
        });

        test('It treats object with "httpRequestError" but negative "status" property as not a valid http error', () => {
            const error = { httpRequestError: {status: -1} };
            assert.isFalse(HttpRequestError.isHttpRequestError(error));
        });

        test('It treats object with "httpRequestError" but negative "status" property as not a valid http error', () => {
            const error = { httpRequestError: {status: -1} };
            assert.isFalse(HttpRequestError.isHttpRequestError(error));
        });

        test('It treats object with "httpRequestError" and positive "status" property as a valid http error', () => {
            const error = { httpRequestError: {status: 1} };
            assert.isTrue(HttpRequestError.isHttpRequestError(error));
        });
    });

    suite('unit | fromJQueryError', () => {
        test('All inputs undefined result in non-http error', () => {
            const error = HttpRequestError.fromJQueryError(undefined, undefined, undefined);
            assert.isNotNull(error);
            assert.isFalse(HttpRequestError.isHttpRequestError(error));
        });

        test('jqXHR with no status porperty result in non-http error', () => {
            const jqXHR = {a: 123};
            const error = HttpRequestError.fromJQueryError(jqXHR, undefined, undefined);

            assert.isNotNull(error);
            assert.isFalse(HttpRequestError.isHttpRequestError(error));
            assert.deepEqual(error.jqXHR, jqXHR);
        });

        test('jqXHR is present in the error constructed', () => {
            const jqXHR = {a: 123};
            const error = HttpRequestError.fromJQueryError(jqXHR, undefined, undefined);

            assert.isNotNull(error);
            assert.deepEqual(error.jqXHR, jqXHR);
        });

        test('jqXHR with status porperty result in http error', () => {
            const jqXHR = {status: 500};
            const error = HttpRequestError.fromJQueryError(jqXHR, undefined, undefined);

            assert.isNotNull(error);
            assert.isTrue(HttpRequestError.isHttpRequestError(error));
        });

        test('jqXHR is present in the http error constructed', () => {
            const jqXHR = {status: 500, xyz: 3};
            const error = HttpRequestError.fromJQueryError(jqXHR, undefined, undefined);

            const expectedOrigin = { 
                jqXHR: jqXHR,
                textStatus: undefined,
                errorThrown: undefined
            };

            assert.isNotNull(error);
            assert.deepEqual(error.httpRequestError.origin, expectedOrigin);
        });

        test('textStatus is present in the http error constructed', () => {
            const jqXHR = {status: 500};
            const textStatus = 'error';
            const error = HttpRequestError.fromJQueryError(jqXHR, textStatus, undefined);

            const expectedOrigin = { 
                jqXHR: jqXHR,
                textStatus: textStatus,
                errorThrown: undefined
            };

            assert.isNotNull(error);
            assert.deepEqual(error.httpRequestError.origin, expectedOrigin);
        });

        test('errorThrown is present in the http error constructed', () => {
            const jqXHR = {status: 500};
            const errorThrown = 'bad request';
            const error = HttpRequestError.fromJQueryError(jqXHR, null, errorThrown);

            const expectedOrigin = { 
                jqXHR: jqXHR,
                textStatus: null,
                errorThrown: errorThrown
            };

            assert.isNotNull(error);
            assert.deepEqual(error.httpRequestError.origin, expectedOrigin);
        });

        test('jqXHR.status is present in the http error constructed', () => {
            const jqXHR = {status: 500};
            const error = HttpRequestError.fromJQueryError(jqXHR, null, null);

            assert.isNotNull(error);
            assert.deepEqual(error.httpRequestError.status, 500);
        });

        test('jqXHR.statusText is present in the http error constructed', () => {
            const statusText = 'bad request';
            const jqXHR = {status: 500, statusText};
            const error = HttpRequestError.fromJQueryError(jqXHR, null, null);

            assert.isNotNull(error);
            assert.equal(error.httpRequestError.statusText, statusText);
        });

        test('jqXHR.responseText is present in the http error constructed', () => {
            const responseText = 'bad request';
            const jqXHR = {status: 500, responseText};
            const error = HttpRequestError.fromJQueryError(jqXHR, null, null);

            assert.isNotNull(error);
            assert.equal(error.httpRequestError.responseText, responseText);
        });
    });

    suite('unit | isAccessDenied', () => {
        test('non-http error is not considered access denied', () => {
            const error = { err: 'fake access denied'};
            assert.isFalse(HttpRequestError.isAccessDenied(error));
        });

        test('http error with status other then 401, 403 is not considered access denied', () => {
            const error = { httpRequestError: { status: 500}};
            assert.isFalse(HttpRequestError.isAccessDenied(error));
        });

        test('http error with status 401 is considered access denied', () => {
            const error = { httpRequestError: { status: 401}};
            assert.isTrue(HttpRequestError.isAccessDenied(error));
        });

        test('http error with status 403 is considered access denied', () => {
            const error = { httpRequestError: { status: 403}};
            assert.isTrue(HttpRequestError.isAccessDenied(error));
        });
    });
});
