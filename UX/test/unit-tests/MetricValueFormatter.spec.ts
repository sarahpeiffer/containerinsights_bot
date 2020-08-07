import * as chai from 'chai';
import { MetricValueFormatter } from '../../src/scripts/shared/MetricValueFormatter';

const assert = chai.assert;

suite('unit | MetricValueFormatter', () => {

    suite('formatMBytesValue', () => {
        test('If the value is 0, it should return "0 MB"', () => {
            let value = 0.000000000000;

            let formattedValue = MetricValueFormatter.formatMBytesValue(value);

            assert.equal(formattedValue, '0 MB', 'It should return "0 MB"');
        });
        test('If the value is less than 0 MB, it should return "0 MB"', () => {
            let value = -0.000001;

            let formattedValue = MetricValueFormatter.formatMBytesValue(value);

            assert.equal(formattedValue, '0 MB', 'It should return "0 MB"');
        });
        test('If the value is 0.949999 MB, it should return "0.9 MB"', () => {
            let value = 0.949999;

            let MBformattedValue = MetricValueFormatter.formatMBytesValue(value);


            assert.equal(MBformattedValue, '0.9 MB', 'It should return "0.9 MB"');
        });
        test('If the value is 0.95 MB, it should return "1 MB"', () => {
            let value = 0.95;

            let MBformattedValue = MetricValueFormatter.formatMBytesValue(value);

            assert.equal(MBformattedValue, '1 MB', 'It should return "1 MB"');
        });
        test('If the value is 0.999999, it should return "1 MB"', () => {
            let value = 0.999999;

            let MBformattedValue = MetricValueFormatter.formatMBytesValue(value);

            assert.equal(MBformattedValue, '1 MB', 'It should return "1 MB"');
        });
        test('If the value is 1, it should return "1 MB"', () => {
            let value = 1;

            let MBformattedValue = MetricValueFormatter.formatMBytesValue(value);

            assert.equal(MBformattedValue, '1 MB', 'It should return "1 MB"');
        });
        test('If the value is 1.000001 MB, it should return "1MB"', () => {
            let value = 1.000001;

            let MBformattedValue = MetricValueFormatter.formatMBytesValue(value);

            assert.equal(MBformattedValue, '1 MB', 'It should return "1 MB"');
        });
        test('If the value is 1023.499999 MB, it should return "1023 MB"', () => {
            let value = 1023.499999;

            let MBformattedValue = MetricValueFormatter.formatMBytesValue(value);

            assert.equal(MBformattedValue, '1023 MB', 'It should return "1023 MB"');
        });
        test('If the value is 1023.5 MB, it should return "1024MB"', () => { 
            let value = 1023.5;

            let MBformattedValue = MetricValueFormatter.formatMBytesValue(value);

            assert.equal(MBformattedValue, '1024 MB', 'It should return "1024 MB"');
        });
        test('If the value is 1023.999999 MB, it should return "1024MB"', () => { 
            let value = 1023.999999;

            let MBformattedValue = MetricValueFormatter.formatMBytesValue(value);

            assert.equal(MBformattedValue, '1024 MB', 'It should return "1024 MB"');
        });
        test('If the value is 1 GB, it should return "1024 MB"', () => { 
            let value = 1024;

            let MBformattedValue = MetricValueFormatter.formatMBytesValue(value);

            assert.equal(MBformattedValue, '1024 MB', 'It should return "1024 MB"');
        });
        test('If the value is 1.000001 GB, it should return "1 GB"', () => { 
            let value = 1024.000001;

            let MBformattedValue = MetricValueFormatter.formatMBytesValue(value);

            assert.equal(MBformattedValue, '1 GB', 'It should return "1 GB"');
        });
        test('If the value is 9.949999 GB, it should return "9.9 GB"', () => {
            let value = 1024 * 9.949999;

            let MBformattedValue = MetricValueFormatter.formatMBytesValue(value);

            assert.equal(MBformattedValue, '9.9 GB', 'It should return "9.9 GB"');
        });
        test('If the value is 9.95 GB, it should return "10 GB"', () => {
            let value = 1024 * 9.95;

            let MBformattedValue = MetricValueFormatter.formatMBytesValue(value);

            assert.equal(MBformattedValue, '10 GB', 'It should return "10 GB"');
        });

        test('If the value is equal to 10 GB, it should return "10GB"', () => {
            let value = 1024 * 10;

            let MBformattedValue = MetricValueFormatter.formatMBytesValue(value);

            assert.equal(MBformattedValue, '10 GB', 'It should return "10 GB"');
        });
        test('If the value is equal to 10.49 GB, it should return "10 GB"', () => {
            let value = 1024 * 10.49;

            let MBformattedValue = MetricValueFormatter.formatMBytesValue(value);

            assert.equal(MBformattedValue, '10 GB', 'It should return "10 GB"');
        });
        test('If the value is equal to 10.5 GB, it should return "11 GB"', () => {
            let value = 1024 * 10.5;

            let MBformattedValue = MetricValueFormatter.formatMBytesValue(value);

            assert.equal(MBformattedValue, '11 GB', 'It should return "11 GB"');
        });
        // a random decimal to ensure rounding at really large numbers
        test('If the value is 11.301001 GB, it should return "11 GB"', () => {
            let value = 1024 * 11.301001;

            let MBformattedValue = MetricValueFormatter.formatMBytesValue(value);

            assert.equal(MBformattedValue, '11 GB', 'It should return "11 GB"');
        });
    });

    suite('formatMillisecondsValue', () => {
        test('If the value is less than 0, it should return "0ms"', () => {
            let value = -0.000001;

            let formattedValue = MetricValueFormatter.formatMilliSecondsValue(value);

            assert.equal(formattedValue, '0ms', 'It should return "0ms"');
        });
        test('If the value is equal to 0, it should return "0ms"', () => {
            let value = 0;

            let formattedValue = MetricValueFormatter.formatMilliSecondsValue(value);

            assert.equal(formattedValue, '0ms', 'It should return "0ms"');
        });
        test('If the value is 0.949999, it should return "0.9ms"', () => {
            let value = 0.949999;

            let formattedValue = MetricValueFormatter.formatMilliSecondsValue(value);

            assert.equal(formattedValue, '0.9ms', 'It should return "0.9ms"');
        });
        test('If the value is 0.95, it should return "1ms"', () => {
            let value = 0.95;

            let formattedValue = MetricValueFormatter.formatMilliSecondsValue(value);

            assert.equal(formattedValue, '1ms', 'It should return "1ms"');
        });
        test('If the value is 1, it should return "1ms"', () => {
            let value = 1;

            let formattedValue = MetricValueFormatter.formatMilliSecondsValue(value);

            assert.equal(formattedValue, '1ms', 'It should return "1ms"');
        });
        test('If the value is 1.000001, it should return "1ms"', () => {
            let value = 1.000001;

            let formattedValue = MetricValueFormatter.formatMilliSecondsValue(value);

            assert.equal(formattedValue, '1ms', 'It should return "1ms"');
        });
        test('If the value is 999.4999999, it should return "999ms"', () => {
            let value = 999.499999;

            let formattedValue = MetricValueFormatter.formatMilliSecondsValue(value);

            assert.equal(formattedValue, '999ms', 'It should return "999ms"');
        });
        test('If the value is 999.5, it should return "1000ms"', () => {
            let value = 999.5;

            let formattedValue = MetricValueFormatter.formatMilliSecondsValue(value);

            assert.equal(formattedValue, '1000ms', 'It should return "1000ms"');
        });
        test('If the value is 1000, it should return "1000ms"', () => {
            let value = 1000;

            let formattedValue = MetricValueFormatter.formatMilliSecondsValue(value);

            assert.equal(formattedValue, '1000ms', 'It should return "1000ms"');
        });
        test('If the value is 1000.000001, it should return "1s"', () => {
            let value = 1000.000001;

            let formattedValue = MetricValueFormatter.formatMilliSecondsValue(value);

            assert.equal(formattedValue, '1s', 'It should return "1s"');
        });
        test('If the value is 1000 * 9.949999, it should return "9.9s"', () => {
            let value = 1000 * 9.949999;

            let formattedValue = MetricValueFormatter.formatMilliSecondsValue(value);

            assert.equal(formattedValue, '9.9s', 'It should return "9.9s"');
        });
        test('If the value is 1000 * 9.95, it should return "10s"', () => {
            let value = 1000 * 9.95;

            let formattedValue = MetricValueFormatter.formatMilliSecondsValue(value);

            assert.equal(formattedValue, '10s', 'It should return "10s"');
        });
        test('If the value is 10000, it should return "10s"', () => {
            let value = 10000;

            let formattedValue = MetricValueFormatter.formatMilliSecondsValue(value);

            assert.equal(formattedValue, '10s', 'It should return "10s"');
        });
        test('If the value is 10000.000001, it should return "10s"', () => {
            let value = 10000.000001;

            let formattedValue = MetricValueFormatter.formatMilliSecondsValue(value);

            assert.equal(formattedValue, '10s', 'It should return "10s"');
        });
        test('If the value is 11234.345234, it should return "11s"', () => {
            let value = 11234.345234;

            let formattedValue = MetricValueFormatter.formatMilliSecondsValue(value);

            assert.equal(formattedValue, '11s', 'It should return "11s"');
        });   
    });
    suite('formatePercentageValue', () => {
        test('If the value is -0.000001, it should return 0%', () => {
            let value = -0.000001;

            let formattedValue = MetricValueFormatter.formatPercentageValue(value);

            assert.equal(formattedValue, '0%', 'It should return "0%"');
        });
        test('If the value is 0, it should return 0%', () => {
            let value = 0;

            let formattedValue = MetricValueFormatter.formatPercentageValue(value);

            assert.equal(formattedValue, '0%', 'It should return "0%"');
        });
        test('If the value is 0.949999, it should return 0.9%', () => {
            let value = 0.949999;

            let formattedValue = MetricValueFormatter.formatPercentageValue(value);

            assert.equal(formattedValue, '0.9%', 'It should return "0.9%"');
        });
        test('If the value is 0.95, it should return 1%', () => {
            let value = 0.95;

            let formattedValue = MetricValueFormatter.formatPercentageValue(value);

            assert.equal(formattedValue, '1%', 'It should return "1%"');
        });
        test('If the value is 1.000001, it should return 1%', () => {
            let value = 1.000001;

            let formattedValue = MetricValueFormatter.formatPercentageValue(value);

            assert.equal(formattedValue, '1%', 'It should return "1%"');
        });
        test('If the value is 99.499999, it should return 99%', () => {
            let value = 99.499999;

            let formattedValue = MetricValueFormatter.formatPercentageValue(value);

            assert.equal(formattedValue, '99%', 'It should return "99%"');
        });
        test('If the value is 99.5, it should return 100%', () => {
            let value = 99.5;

            let formattedValue = MetricValueFormatter.formatPercentageValue(value);

            assert.equal(formattedValue, '100%', 'It should return "100%"');
        });
        test('If the value is 200, it should return 200%', () => {
            let value = 200;

            let formattedValue = MetricValueFormatter.formatPercentageValue(value);

            assert.equal(formattedValue, '200%', 'It should return "200%"');
        });
    });

    suite('formatValue', () => {
        test('If the value is -0.000001, it should return "0"', () => {
            let value = -0.000001;

            let formattedValue = MetricValueFormatter.formatValue(value);

            assert.equal(formattedValue, '0', 'It should return "0"');
        });
        test('If the value is -0.949999, it should return "-0.9"', () => {
            let value = -0.949999;

            let formattedValue = MetricValueFormatter.formatValue(value);

            assert.equal(formattedValue, '-0.9', 'It should return "-0.9"');
        });
        test('If the value is -0.951, it should return "-0.9"', () => {
            let value = -0.95;

            let formattedValue = MetricValueFormatter.formatValue(value);

            assert.equal(formattedValue, '-0.9', 'It should return "-0.9"');
        });
        test('If the value is -0.951, it should return "-1"', () => {
            let value = -0.951;

            let formattedValue = MetricValueFormatter.formatValue(value);

            assert.equal(formattedValue, '-1', 'It should return "-1"');
        });
        test('If the value is -1, it should return "-1"', () => {
            let value = -1;

            let formattedValue = MetricValueFormatter.formatValue(value);

            assert.equal(formattedValue, '-1', 'It should return "-1"');
        });
        test('If the value is -1.000001, it should return "-1"', () => {
            let value = -1.000001;

            let formattedValue = MetricValueFormatter.formatValue(value);

            assert.equal(formattedValue, '-1', 'It should return "-1"');
        });
        test('If the value is -1.5, it should return "-1"', () => {
            let value = -1.5;

            let formattedValue = MetricValueFormatter.formatValue(value);

            assert.equal(formattedValue, '-1', 'It should return "-1"');
        });
        test('If the value is 0.000001, it should return "0"', () => {
            let value = 0.000001;

            let formattedValue = MetricValueFormatter.formatValue(value);

            assert.equal(formattedValue, '0', 'It should return "0"');
        });
        test('If the value is 0.54, it should return "0.5"', () => {
            let value = 0.54;

            let formattedValue = MetricValueFormatter.formatValue(value);

            assert.equal(formattedValue, '0.5', 'It should return "0.5"');
        });
        test('If the value is 0.56, it should return "0.6"', () => {
            let value = 0.56;

            let formattedValue = MetricValueFormatter.formatValue(value);

            assert.equal(formattedValue, '0.6', 'It should return "0.6"');
        });
        test('If the value is 0.949999, it should return "0.9"', () => {
            let value = 0.949999;

            let formattedValue = MetricValueFormatter.formatValue(value);

            assert.equal(formattedValue, '0.9', 'It should return "0.9"');
        });
        test('If the value is 0.95, it should return "1"', () => {
            let value = 0.95;

            let formattedValue = MetricValueFormatter.formatValue(value);

            assert.equal(formattedValue, '1', 'It should return "1"');
        });
        test('If the value is 1, it should return "1"', () => {
            let value = 1;

            let formattedValue = MetricValueFormatter.formatValue(value);

            assert.equal(formattedValue, '1', 'It should return "1"');
        });
        test('If the value is 1.000001, it should return "1"', () => {
            let value = 1.000001;

            let formattedValue = MetricValueFormatter.formatValue(value);

            assert.equal(formattedValue, '1', 'It should return "1"');
        });
        test('If the value is 2.22, it should return "2"', () => {
            let value = 2.22;

            let formattedValue = MetricValueFormatter.formatValue(value);

            assert.equal(formattedValue, '2', 'It should return "2"');
        });
        test('If the value is 2.56, it should return "2.3"', () => {
            let value = 2.56;

            let formattedValue = MetricValueFormatter.formatValue(value);

            assert.equal(formattedValue, '3', 'It should return "3"');
        });
    });
});
