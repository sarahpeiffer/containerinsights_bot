import { assert } from 'chai';
import * as moment from 'moment';

import { TimeInterval, 
    GranularityTypes, 
    IRealTimeRange, 
    FriendlyTimeHelper, 
    DayFriendlyNameSeconds 
} from '../../src/scripts/shared/data-provider/TimeInterval';

suite('unit | TrendGranularityCalculator', () => {

    suite ('getRealFromFriendly', () => {
        test('It should return a range including 12 hours', () => {
            const realRange: IRealTimeRange = FriendlyTimeHelper.convertFriendlyTimeToRealRange(DayFriendlyNameSeconds.Half);
            const seconds = realRange.endDateTimeUtc.unix() - realRange.startDateTimeUtc.unix();
            assert.strictEqual(seconds, 60 * 60 * 12);
        });

        test('It should return a range including 24 hours', () => {
            const realRange: IRealTimeRange = FriendlyTimeHelper.convertFriendlyTimeToRealRange(DayFriendlyNameSeconds.One);
            const seconds = realRange.endDateTimeUtc.unix() - realRange.startDateTimeUtc.unix();
            assert.strictEqual(seconds, 60 * 60 * 24);
        });

        test('It should return a range including 3 days', () => {
            const realRange: IRealTimeRange = FriendlyTimeHelper.convertFriendlyTimeToRealRange(DayFriendlyNameSeconds.Three);
            const seconds = realRange.endDateTimeUtc.unix() - realRange.startDateTimeUtc.unix();
            assert.strictEqual(seconds, 60 * 60 * 24 * 3);
        });

        test('It should return a range including 7 days', () => {
            const realRange: IRealTimeRange = FriendlyTimeHelper.convertFriendlyTimeToRealRange(DayFriendlyNameSeconds.Seven);
            const seconds = realRange.endDateTimeUtc.unix() - realRange.startDateTimeUtc.unix();
            assert.strictEqual(seconds, 60 * 60 * 24 * 7);
        });

        test('It should return a range including 30 days', () => {
            const realRange: IRealTimeRange = FriendlyTimeHelper.convertFriendlyTimeToRealRange(DayFriendlyNameSeconds.Thirty);
            const seconds = realRange.endDateTimeUtc.unix() - realRange.startDateTimeUtc.unix();
            assert.strictEqual(seconds, 60 * 60 * 24 * 30);
        });

        test('It should adjust a range based on optional end', () => {
            const fakeEnd = moment().utc().add(-10, 'd');
            const realRange: IRealTimeRange = FriendlyTimeHelper.convertFriendlyTimeToRealRange(DayFriendlyNameSeconds.One, fakeEnd);
            const seconds = realRange.endDateTimeUtc.unix() - realRange.startDateTimeUtc.unix();
            assert.strictEqual(seconds, 60 * 60 * 24);

            const fakeStart = moment(fakeEnd).add(-1, 'd').unix();
            assert.strictEqual(realRange.startDateTimeUtc.unix(), fakeStart);
        });
    });

    suite ('getFriendlyRangeFromRealRange', () => {

        const now: moment.Moment = moment.utc();

        test('It should throw for anything random', () => {
            const randomHours: IRealTimeRange = { endDateTimeUtc: moment(now), startDateTimeUtc: moment(now).add(-11, 'h') };

            assert.throws(() => {
                FriendlyTimeHelper.findFriendlyNameForRange(randomHours);
            });
        });
        

        test('It should work for 12 hours', () => {
            const twelveHours: IRealTimeRange = { endDateTimeUtc: moment(now), startDateTimeUtc: moment(now).add(-12, 'h') };
            assert.strictEqual(FriendlyTimeHelper.findFriendlyNameForRange(twelveHours), DayFriendlyNameSeconds.Half);
        });

        test('It should work for 1 day', () => {
            const oneDay: IRealTimeRange = { endDateTimeUtc: moment(now), startDateTimeUtc: moment(now).add(-1, 'd') };
            assert.strictEqual(FriendlyTimeHelper.findFriendlyNameForRange(oneDay), DayFriendlyNameSeconds.One);
        });

        test('It should work for 3 days', () => {
            const threeDays: IRealTimeRange = { endDateTimeUtc: moment(now), startDateTimeUtc: moment(now).add(-3, 'd') };
            assert.strictEqual(FriendlyTimeHelper.findFriendlyNameForRange(threeDays), DayFriendlyNameSeconds.Three);
        });

        test('It should work for 7 days', () => {
            const seventDays: IRealTimeRange = { endDateTimeUtc: moment(now), startDateTimeUtc: moment(now).add(-7, 'd') };
            assert.strictEqual(FriendlyTimeHelper.findFriendlyNameForRange(seventDays), DayFriendlyNameSeconds.Seven);
        });

        test('It should work for 30 days', () => {
            const thirtyDays: IRealTimeRange = { endDateTimeUtc: moment(now), startDateTimeUtc: moment(now).add(-30, 'd') };
            assert.strictEqual(FriendlyTimeHelper.findFriendlyNameForRange(thirtyDays), DayFriendlyNameSeconds.Thirty);
        });

    });

    suite('getGranularityType', () => {
        const granularityHelper = new TimeInterval(new Date(), new Date(), 0);
        test('It should be hourly granularity', () => {
            assert.strictEqual(granularityHelper.getGranularityType(60), GranularityTypes.Hour);
        });
        test('It should be hourly granularity', () => {
            assert.strictEqual(granularityHelper.getGranularityType(240), GranularityTypes.Hour);
        });
        test('It should be minute granularity', () => {
            assert.strictEqual(granularityHelper.getGranularityType(1), GranularityTypes.Minute);
        });
        test('It should be minute granularity', () => {
            assert.strictEqual(granularityHelper.getGranularityType(59), GranularityTypes.Minute);
        });
        test('It should be day granularity', () => {
            assert.strictEqual(granularityHelper.getGranularityType(1440), GranularityTypes.Day);
        });
        test('It should be day granularity', () => {
            assert.strictEqual(granularityHelper.getGranularityType(2880), GranularityTypes.Day);
        });
    });

    suite('chooseGranularBucketDateExistsWithin', () => {
        test('It should return nearest point by minute grain', () => {
            const date: TimeInterval = new TimeInterval(new Date('2017-10-18T15:37:14.331Z'), null, 100, 1);

            const expectedDate: Date = new Date('2017-10-18T15:37:00.000Z')

            assert.strictEqual(date.getBestGranularStartDate().getTime(), expectedDate.getTime());
        });

        test('It should return nearest point by minute grain', () => {
            const date: TimeInterval = new TimeInterval(new Date('2017-10-18T15:37:59.999Z'), null, 100, 1);

            const expectedDate: Date = new Date('2017-10-18T15:37:00.000Z')

            assert.strictEqual(date.getBestGranularStartDate().getTime(), expectedDate.getTime());
        });

        test('It should return nearest point by minute grain', () => {
            const date: TimeInterval = new TimeInterval(new Date('2017-10-18T15:37:00.000Z'), null, 100, 1);

            const expectedDate: Date = new Date('2017-10-18T15:37:00.000Z')

            assert.strictEqual(date.getBestGranularStartDate().getTime(), expectedDate.getTime());
        });

        test('It should return nearest point by 5 minute grain', () => {
            const date: TimeInterval = new TimeInterval(new Date('2017-10-18T15:37:14.331Z'), null, 100, 5);

            const expectedDate: Date = new Date('2017-10-18T15:35:00.000Z')

            assert.strictEqual(date.getBestGranularStartDate().getTime(), expectedDate.getTime());
        });

        test('It should return nearest point by 5 minute grain', () => {
            const date: TimeInterval = new TimeInterval(new Date('2017-10-18T15:35:00.000Z'), null, 100, 5);

            const expectedDate: Date = new Date('2017-10-18T15:35:00.000Z')

            assert.strictEqual(date.getBestGranularStartDate().getTime(), expectedDate.getTime());
        });

        test('It should return nearest point by 15 minute grain', () => {
            const date: TimeInterval = new TimeInterval(new Date('2017-10-18T15:37:14.331Z'), null, 100, 15);

            const expectedDate: Date = new Date('2017-10-18T15:30:00.000Z')

            assert.strictEqual(date.getBestGranularStartDate().getTime(), expectedDate.getTime());
        });

        test('It should return nearest point by 1 hour grain', () => {
            const date: TimeInterval = new TimeInterval(new Date('2017-10-18T15:37:14.331Z'), null, 100, 60);

            const expectedDate: Date = new Date('2017-10-18T15:00:00.000Z')

            assert.strictEqual(date.getBestGranularStartDate().getTime(), expectedDate.getTime());
        });

        test('It should return nearest point by 1 hour grain', () => {
            const date: TimeInterval = new TimeInterval(new Date('2017-10-18T15:59:59.999Z'), null, 100, 60);

            const expectedDate: Date = new Date('2017-10-18T15:00:00.000Z')

            assert.strictEqual(date.getBestGranularStartDate().getTime(), expectedDate.getTime());
        });

        test('It should return nearest point by 1 hour grain', () => {
            const date: TimeInterval = new TimeInterval(new Date('2017-10-18T15:00:00.000Z'), null, 100, 60);

            const expectedDate: Date = new Date('2017-10-18T15:00:00.000Z')

            assert.strictEqual(date.getBestGranularStartDate().getTime(), expectedDate.getTime());
        });

        test('It should return nearest point by 4 hour grain', () => {
            const date: TimeInterval = new TimeInterval(new Date('2017-10-18T15:37:14.331Z'), null, 100, 240);

            const expectedDate: Date = new Date('2017-10-18T12:00:00.000Z')

            assert.strictEqual(date.getBestGranularStartDate().getTime(), expectedDate.getTime());
        });

        test('It should return nearest point by 1 day grain', () => {
            const date: TimeInterval = new TimeInterval(new Date('2017-10-18T15:37:14.331Z'), null, 100, 1440);

            const expectedDate: Date = new Date('2017-10-18T00:00:00.000Z')

            assert.strictEqual(date.getBestGranularStartDate().getTime(), expectedDate.getTime());
        });

        test('It should return nearest point by 1 day grain', () => {
            const date: TimeInterval = new TimeInterval(new Date('2017-10-18T23:59:59.999Z'), null, 100, 1440);

            const expectedDate: Date = new Date('2017-10-18T00:00:00.000Z')

            assert.strictEqual(date.getBestGranularStartDate().getTime(), expectedDate.getTime());
        });

        test('It should return nearest point by 1 day grain', () => {
            const date: TimeInterval = new TimeInterval(new Date('2017-10-18T00:00:00.000Z'), null, 100, 1440);

            const expectedDate: Date = new Date('2017-10-18T00:00:00.000Z')

            assert.strictEqual(date.getBestGranularStartDate().getTime(), expectedDate.getTime());
        });
    });

    suite('calculateBestRangeToQueryFromGrain', () => {
        test('It should return 1 minute bucket range', () => {
            const startDate: Date = new Date('2017-10-18T15:37:14.331Z');
            const endDate: Date = new Date('2017-10-18T15:38:14.331Z');
            const intervalTime: TimeInterval = new TimeInterval(startDate, endDate, 100, 1);

            const expectedStart = new Date('2017-10-18T15:37:00.000Z');
            const expectedEnd = new Date('2017-10-18T15:39:00.000Z');

            assert.strictEqual(intervalTime.getBestGranularEndDate().getTime(), expectedEnd.getTime());
            assert.strictEqual(intervalTime.getBestGranularStartDate().getTime(), expectedStart.getTime());
        });

        test('It should return 1 minute bucket range edges', () => {
            const startDate: Date = new Date('2017-10-18T15:37:00.000Z');
            const endDate: Date = new Date('2017-10-18T15:38:59.999Z');
            const intervalTime: TimeInterval = new TimeInterval(startDate, endDate, 100, 1);

            const expectedStart = new Date('2017-10-18T15:37:00.000Z');
            const expectedEnd = new Date('2017-10-18T15:39:00.000Z');

            assert.strictEqual(intervalTime.getBestGranularEndDate().getTime(), expectedEnd.getTime());
            assert.strictEqual(intervalTime.getBestGranularStartDate().getTime(), expectedStart.getTime());
        });

        test('It should return 5 minute bucket range', () => {
            const startDate: Date = new Date('2017-10-18T13:36:14.331Z');
            const endDate: Date = new Date('2017-10-18T15:38:14.331Z');
            const intervalTime: TimeInterval = new TimeInterval(startDate, endDate, 100, 5);

            const expectedStart = new Date('2017-10-18T13:35:00.000Z');
            const expectedEnd = new Date('2017-10-18T15:40:00.000Z');

            assert.strictEqual(intervalTime.getBestGranularEndDate().getTime(), expectedEnd.getTime());
            assert.strictEqual(intervalTime.getBestGranularStartDate().getTime(), expectedStart.getTime());
        });

        test('It should return 1 hour bucket range', () => {
            const startDate: Date = new Date('2017-10-18T13:36:14.331Z');
            const endDate: Date = new Date('2017-10-18T15:38:14.331Z');
            const intervalTime: TimeInterval = new TimeInterval(startDate, endDate, 100, 60);

            const expectedStart = new Date('2017-10-18T13:00:00.000Z');
            const expectedEnd = new Date('2017-10-18T16:00:00.000Z');

            assert.strictEqual(intervalTime.getBestGranularEndDate().getTime(), expectedEnd.getTime());
            assert.strictEqual(intervalTime.getBestGranularStartDate().getTime(), expectedStart.getTime());
        });

        test('It should return 4 hour bucket range', () => {
            const startDate: Date = new Date('2017-10-18T13:36:14.331Z');
            const endDate: Date = new Date('2017-10-18T14:38:14.331Z');
            const intervalTime: TimeInterval = new TimeInterval(startDate, endDate, 100, 240);

            const expectedStart = new Date('2017-10-18T12:00:00.000Z');
            const expectedEnd = new Date('2017-10-18T16:00:00.000Z');

            assert.strictEqual(intervalTime.getBestGranularEndDate().getTime(), expectedEnd.getTime());
            assert.strictEqual(intervalTime.getBestGranularStartDate().getTime(), expectedStart.getTime());
        });

        test('It should return 1 day bucket range', () => {
            const startDate: Date = new Date('2017-10-17T13:36:14.331Z');
            const endDate: Date = new Date('2017-10-19T14:38:14.331Z');
            const intervalTime: TimeInterval = new TimeInterval(startDate, endDate, 100, 1440);

            const expectedStart = new Date('2017-10-17T00:00:00.000Z');
            const expectedEnd = new Date('2017-10-20T00:00:00.000Z');

            assert.strictEqual(intervalTime.getBestGranularEndDate().getTime(), expectedEnd.getTime());
            assert.strictEqual(intervalTime.getBestGranularStartDate().getTime(), expectedStart.getTime());
        });
    });
});
