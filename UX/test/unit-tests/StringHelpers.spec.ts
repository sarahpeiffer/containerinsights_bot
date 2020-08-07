import * as chai from 'chai';

import { StringHelpers } from '../../src/scripts/shared/Utilities/StringHelpers';

const assert = chai.assert;

suite('unit | StringHelpers', () => {

    suite('replaceAll()', () => {

        test('It should take null source string', () => {
            const source: string = null;
            const searchValue: string = ' not yet ';
            const expected: string = null;

            const result = StringHelpers.replaceAll(source, searchValue, 'X');

            assert.strictEqual(result, expected);
        });

        test('It should take undefined source string', () => {
            const source: string = undefined;
            const searchValue: string = ' not yet ';
            const expected: string = undefined;

            const result = StringHelpers.replaceAll(source, searchValue, 'X');

            assert.strictEqual(result, expected);
        });

        test('It should take empty source string', () => {
            const source: string = '';
            const searchValue: string = ' not yet ';
            const expected: string = '';

            const result = StringHelpers.replaceAll(source, searchValue, 'X');

            assert.strictEqual(result, expected);
        });

        test('Matches replace() behavior in case of null search string', () => {
            const source: string = 'It is not yet done.';
            const searchValue: string = null;

            const actual = StringHelpers.replaceAll(source, searchValue, 'X');
            const expected = source.replace(searchValue, 'X');

            assert.strictEqual(actual, expected);
        });

        test('Matches replace() behavior in case of undefined search string', () => {
            const source: string = 'It is not yet done.';
            const searchValue: string = undefined;

            const actual = StringHelpers.replaceAll(source, searchValue, 'X');
            const expected = source.replace(searchValue, 'X');

            assert.strictEqual(actual, expected);
        });

        test('Matches replace() behavior in case of empty search string', () => {
            const source: string = 'It is not yet done.';
            const searchValue: string = '';

            const actual = StringHelpers.replaceAll(source, searchValue, 'X');
            const expected = source.replace(searchValue, 'X');

            assert.strictEqual(actual, expected);
        });

        test('Matches replace() behavior in case of null replace-with string', () => {
            const source: string = 'It is not yet done.';
            const searchValue: string = ' not yet ';
            const newValue: string = null;

            const actual = StringHelpers.replaceAll(source, searchValue, newValue);
            const expected = source.replace(searchValue, newValue);

            assert.strictEqual(actual, expected);
        });

        test('Matches replace() behavior in case of undefined replace-with string', () => {
            const source: string = 'It is not yet done.';
            const searchValue: string = ' not yet ';
            const newValue: string = undefined;

            const actual = StringHelpers.replaceAll(source, searchValue, newValue);
            const expected = source.replace(searchValue, newValue);

            assert.strictEqual(actual, expected);
        });

        test('Matches replace() behavior in case of empty replace-with string', () => {
            const source: string = 'It is not yet done.';
            const searchValue: string = ' not yet ';
            const newValue: string = '';

            const actual = StringHelpers.replaceAll(source, searchValue, newValue);
            const expected = source.replace(searchValue, newValue);

            assert.strictEqual(actual, expected);
        });

        test('Matches replace() behavior in case of empty search string and null replace string', () => {
            const source: string = 'It is not yet done.';
            const searchValue: string = '';
            const newValue: string = null;

            const actual = StringHelpers.replaceAll(source, searchValue, newValue);
            const expected = source.replace(searchValue, newValue);

            assert.strictEqual(actual, expected);
        });

        test('Matches replace() behavior in case of empty search string and undefined replace string', () => {
            const source: string = 'It is not yet done.';
            const searchValue: string = '';
            const newValue: string = undefined;

            const actual = StringHelpers.replaceAll(source, searchValue, newValue);
            const expected = source.replace(searchValue, newValue);

            assert.strictEqual(actual, expected);
        });

        test('Matches replace() behavior in case of empty search string and empty replace string', () => {
            const source: string = 'It is not yet done.';
            const searchValue: string = '';
            const newValue: string = '';

            const actual = StringHelpers.replaceAll(source, searchValue, newValue);
            const expected = source.replace(searchValue, newValue);

            assert.strictEqual(actual, expected);
        });

        test('It should leave the string as is if search string is not found', () => {
            const source: string = 'It is not yet done.';
            const searchValue: string = 'abc';
            const newValue: string = 'def';
            const expected = source;

            const actual = StringHelpers.replaceAll(source, searchValue, newValue);

            assert.strictEqual(actual, expected);
        });

        test('It should replace single occurrence of a string', () => {
            const source: string = 'It is not yet done.';
            const searchValue: string = ' not yet ';
            const expected: string = 'It is done.';

            const result = StringHelpers.replaceAll(source, searchValue, ' ');

            assert.strictEqual(result, expected);
        });

        test('It should replace multiple occurrences of a string', () => {
            const source: string = 'It is not yet done. It is not yet done. It is not yet done.';
            const searchValue: string = ' not yet ';
            const expected: string = 'It is done. It is done. It is done.';

            const result = StringHelpers.replaceAll(source, searchValue, ' ');

            assert.strictEqual(result, expected);
        });

        test('It should find and replace string with RegEx special chars', () => {
            const source: string = 'I am sick of [$]\\!.';
            const searchValue: string = '[$]\\!';
            const expected: string = 'I am sick of garbage.';

            const result = StringHelpers.replaceAll(source, searchValue, 'garbage');

            assert.strictEqual(result, expected);
        });

        test('It should work correctly for the basic InfraInsights case', () => {
            const source: string = 'abc $[abc] cde $[abc]';
            const searchValue: string = '$[abc]';
            const newValue: string = '17-12-22';
            const expected: string = 'abc 17-12-22 cde 17-12-22';

            const result = StringHelpers.replaceAll(source, searchValue, newValue);

            assert.strictEqual(result, expected);
        });
    });
});
