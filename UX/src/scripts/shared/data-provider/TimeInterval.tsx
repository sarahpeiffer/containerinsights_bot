import * as moment from 'moment';

/**
 * INTERNAL USE: Used internally to track kusto specific and more generic time based metrics more clear
 * to developers of TimeInterval.  External users should make use of getGrainKusto() and getGrainMinutes()
 */
interface IGranularityOption {
    /**
     * Generic number of minutes for a defined grain
     */
    intervalDurationMinutes: number;

    /**
     * Kusto specific string for a given by minute grain
     */
    kustoInterval?: string;

    /**
     * Timespan representation for a defined grain
     */
    realInterval?: string;
    /**
     * ISO 8601 interval : https://en.wikipedia.org/wiki/ISO_8601#Durations
     * Durations define the amount of intervening time in a time interval and are represented by the format P[n]Y[n]M[n]DT[n]H[n]M[n]S
     * (eg. PT24H, PT12H, PT5M)
     */
    isoInterval?: string;
}

/**
 * Created so all of the *ControlPanel objects can share a comon set of values until ranges go custom...
 * there were a few cases where the numbers had been mistyped; this should ensure accuracy and consistency
 */
export enum DayFriendlyNameSeconds {
    /**
     * 12 hours
     */
    Half = 60 * 60 * 12,
    /**
     * 24 hours
     */
    One = 60 * 60 * 24,
    /**
     * Three Days
     */
    Three = 60 * 60 * 24 * 3,

    /**
     * Seven Days
     */
    Seven = 60 * 60 * 24 * 7,

    /**
     * Thirty Days
     */
    Thirty = 60 * 60 * 24 * 30,
}

/**
 * Static mapings to Kusto
 */
const standardGranularityOptions: IGranularityOption[] = [
    /**
     * 1 day
     */
    { intervalDurationMinutes: 1 * 24 * 60, kustoInterval: '1d', realInterval: '1.00:00:00' , isoInterval: 'PT24H' },
    /**
     * 12 hours
     */
    { intervalDurationMinutes: 12 * 60, kustoInterval: '12h', realInterval: '12:00:00', isoInterval: 'PT12H' },
    /**
     * 8 hours
     */
    { intervalDurationMinutes: 8 * 60, kustoInterval: '8h', realInterval: '08:00:00', isoInterval: 'PT8H' },
    /**
     * 4 hours
     */
    { intervalDurationMinutes: 4 * 60, kustoInterval: '4h', realInterval: '04:00:00', isoInterval: 'PT4H' },
    /**
     * 2 hours
     */
    { intervalDurationMinutes: 2 * 60, kustoInterval: '2h', realInterval: '02:00:00', isoInterval: 'PT2H' },
    /**
     * 1 hour
     */
    { intervalDurationMinutes: 1 * 60, kustoInterval: '1h', realInterval: '01:00:00', isoInterval: 'PT1H' },
    /**
     * 30 minutes
     */
    { intervalDurationMinutes: 30, kustoInterval: '30m', realInterval: '00:30:00', isoInterval: 'PT30M' },
    /**
     * 15 minutes
     */
    { intervalDurationMinutes: 15, kustoInterval: '15m', realInterval: '00:15:00', isoInterval: 'PT15M' },
    /**
     * 5 minutes
     */
    { intervalDurationMinutes: 5, kustoInterval: '5m', realInterval: '00:05:00', isoInterval: 'PT5M' },
    /**
     * 1 minute
     */
    { intervalDurationMinutes: 1, kustoInterval: '1m', realInterval: '00:01:00', isoInterval: 'PT1M' },
];

/**
 * Static mapings to Mdm
 */
const MdmGranularityOptions: IGranularityOption[] = [
    /**
     * 1 day
     */
    { intervalDurationMinutes: 1 * 24 * 60, kustoInterval: '1d', realInterval: '1.00:00:00' , isoInterval: 'PT24H' },
    /**
     * 12 hours
     */
    { intervalDurationMinutes: 12 * 60, kustoInterval: '12h', realInterval: '12:00:00', isoInterval: 'PT12H' },
    /**
     * 6 hours
     */
    { intervalDurationMinutes: 6 * 60, kustoInterval: '6h', realInterval: '06:00:00', isoInterval: 'PT6H' },
    /**
     * 1 hour
     */
    { intervalDurationMinutes: 1 * 60, kustoInterval: '1h', realInterval: '01:00:00', isoInterval: 'PT1H' },
    /**
     * 30 minutes
     */
    { intervalDurationMinutes: 30, kustoInterval: '30m', realInterval: '00:30:00', isoInterval: 'PT30M' },
    /**
     * 15 minutes
     */
    { intervalDurationMinutes: 15, kustoInterval: '15m', realInterval: '00:15:00', isoInterval: 'PT15M' },
    /**
     * 5 minutes
     */
    { intervalDurationMinutes: 5, kustoInterval: '5m', realInterval: '00:05:00', isoInterval: 'PT5M' },
    /**
     * 1 minute
     */
    { intervalDurationMinutes: 1, kustoInterval: '1m', realInterval: '00:01:00', isoInterval: 'PT1M' },
];

/**
 * Interface to ownership of TimeInterval code to line up random dates and times
 * to a given grain bucket interval based on how Kusto handles bins
 */
export interface ITimeInterval {
    /**
     * Return the real grain interval in minutes
     * @returns implementation should return number of minutes for a granularity bucket
     */
    getGrainMinutes(): number;

    /**
     * Return the real kusto grain details
     * @returns implementation should return a string kusto can consume for bins
     */
    getGrainKusto(): string;
    /**
     * Return the iso interval details
     * @returns implementation should return a string following ISO formatting for charts grains
     */
    getISOInterval(): string;

    /**
     * Return the real grain in timespan format 
     * @returns implementation should return a string in timespan format (d.hh:mm:ss) 
     */
    getGrainRealInterval(): string;

    /**
     * Return the real start date
     * @return implementation should return a raw un-altered start time for this range
     */
    getRealStart(): Date;

    /**
     * Return the real end date
     * @return implementation should return a raw un-altered end time for this range
     */
    getRealEnd(): Date;

    /**
     * Return the best granular end date by shifting backward (make the window a bit bigger)
     * @return impementation should return a slightly older start date which adheres to a kusto bin boundry
     */
    getBestGranularStartDate(): Date;

    /**
     * Return the best granular end date by shifting forward (make the window a bit bigger)... optionally
     * do not expand the date beyond now()
     * @param stopGrainGrowthAtNow [optional] stop growth of the end range at NOW
     * @return implementation should return a slightly newer end date adhering to kusto bins (optionally maxing at now)
     */
    getBestGranularEndDate(stopGrainGrowthAtNow?: boolean): Date;

    /**
     * Based on the grain and our times return the number of buckets created
     * Ensure the smallest number of buckets is 1; people can and will divide by this number
     * @return implementation should return the number of buckets the range / grain results in (not the ideal)
     */
    getBucketCount(): number;
}

/**
 * Granularity levels which are possible in this library
 */
export enum GranularityTypes {
    /** Grains of at least a day in duration */
    Day,
    /** Grains of at least an hour but not more then 24 hours in duration */
    Hour,
    /** Grains of at least a minute but not more then 60 minutes in duration */
    Minute,
};

/**
 * used as a typings file for containment of end and start times used in deep linking
 */
export interface IRealTimeRange {
    /**
     * the most future time we want to look at
     */
    endDateTimeUtc: moment.Moment;

    /**
     * the most distant into the past we want to look at
     */
    startDateTimeUtc: moment.Moment;
}

/**
 * Wrapper class around the FriendlyTime enumeration to help the control panels share as much code
 * as possible when converting and utilizing friendly times... a lot of this new code is used more
 * for deep linking then anything else; before DL the main pages didn't ever need to understand anything
 * about "friendly" time ranges (12h, 1d, 3d, etc) and the control panels didn't need to understand anything
 * about real time ranges... with the advent of deeplinking both needed a little knowledge of the other and
 * I tried to keep as much of that knowledge here instead so neither really needed to change much
 */
export class FriendlyTimeHelper {

    /**
     * given a real time range, find the "friendly" range for it... throw if the time range doesn't
     * correspond exactly to one of the friendly time ranges... used by deep linking to help the menu
     * understand what time ranged we are linked to
     * @param range a real start and end time
     * @returns {DayFriendlyNameSeconds} the friendly name for this range
     */
    public static findFriendlyNameForRange(range: IRealTimeRange): DayFriendlyNameSeconds {
        const delta = range.endDateTimeUtc.unix() - range.startDateTimeUtc.unix();

        let keys = Object.keys(DayFriendlyNameSeconds);
        let found = undefined;

        keys.forEach((key) => {
            const seconds = DayFriendlyNameSeconds[key];
            if (seconds === delta) {
                found = DayFriendlyNameSeconds[key];
            }
        });

        if (!found) {
            throw 'Invalid date range specified!';
        }
        return found;
    }
    /**
     * Convert an abstract concept like "3 days" into an actual time range and optionally end on a given date/time
     * @param range range to convert to to a real time range
     * @param endTime [optional] the time you want to end at (defaults to now)
     * @returns {IRealTimeRange} the start and end real times
     */
    public static convertFriendlyTimeToRealRange(range: DayFriendlyNameSeconds, endTime?: moment.Moment): IRealTimeRange {
        const endDateTimeUtc = endTime || moment.utc();
        const startDateTimeUtc = moment(endDateTimeUtc).add(-range, 's');
        return { startDateTimeUtc, endDateTimeUtc };
    }
}

/**
 * Functional ownership of TimeInterval code to line up random dates and times
 * to a given grain bucket interval based on how Kusto handles bins
 */
export class TimeInterval implements ITimeInterval {
    private idealNumberOfDataPoints;
    private startTime: Date;
    private endTime: Date;
    private nowAtCtor: moment.Moment;
    private grain: IGranularityOption;
    private useMdmGrain: boolean;

    /**
     * .ctor initialize the state of the TimeInterval and ensure we can speak coherently about
     * kusto bin start/end based on the real start/end selected here
     * @param startTime start of the time range we want to kusto-size
     * @param endTime end of the time range we want to kusto-size
     * @param idealNumberOfDataPoints number of buckets we would ideally want to be as close to as possible
     * @param grain [optional] a forced value to set the grain to (when picked idealNumberOfPoints does nothing)
     */
    constructor(startTime: Date, endTime: Date, idealNumberOfDataPoints: number, grain?: number, useMdmGrain?: boolean) {
        this.idealNumberOfDataPoints = idealNumberOfDataPoints;
        this.startTime = startTime;
        this.endTime = endTime;
        this.nowAtCtor = moment();
        this.useMdmGrain = useMdmGrain;

        this.grain = this.getMatchingGrainOrCalculate(grain);
    }

    /**
    * Helper to convert from TimeData time range type from pill control) to a start and end 
    * date. This is used directly by components that use a start and end date 
    * and also by getInterval
    * @private
    * @param  {TimeData} time time to be converted
    * @return {start:Date, end: Date} start and end time
    */
    public static getStartAndEndDate(time: any, isRelative: boolean): { start: Date, end: Date } {
        let startDate: moment.Moment;
        let endDate: moment.Moment;

        if (isRelative) {
            endDate = moment.utc();
            startDate = moment(endDate).subtract(time.relative.duration, 'ms')
        } else {
            startDate = moment(time.absolute.startTime).utc();
            endDate = moment(time.absolute.endTime).utc();
        }

        return { start: startDate.toDate(), end: endDate.toDate() };
    }

    /**
     * Returns a TimeInterval out of a TimeData (time range type from pill control) parameter
     * @static
     * @param  {TimeData} time start and end times from DateTimeRange's pill control
     * @param  {number} idealNumberOfDataPoints number of buckets we would ideally want to be as close to as possible
     * @param  {number} [grain] [optional] a forced value to set the grain to (when picked idealNumberOfPoints does nothing)
     * @return ITimeInterval 
     * @memberof TimeInterval
     */
    public static getInterval(time: any, isRelative: boolean, idealNumberOfDataPoints: number, grain?: number): ITimeInterval {
        let startAndEnd = TimeInterval.getStartAndEndDate(time, isRelative);

        return new TimeInterval(startAndEnd.start, startAndEnd.end, idealNumberOfDataPoints);
    }

    /**
     * Return the real grain interval in minutes
     * @returns real kusto grain interval in minutes (does not support anything less then 1m)
     */
    public getGrainMinutes(): number {
        return this.grain.intervalDurationMinutes;
    }

    /**
     *  Return the real kusto grain details
     * @return real kusto grain string (eg. 1m, 5m, 2d, etc)
     */
    public getGrainKusto(): string {
        return this.grain.kustoInterval;
    }

    /**
     * Return the ISO interval following the code : https://en.wikipedia.org/wiki/ISO_8601
     * @return ISO interval (eg. PT24H, PT12H, PT5M)
     */
    public getISOInterval(): string {
        return this.grain.isoInterval;
    }

    /**
     *  Return the real grain timespan
     * @return real grain timespan string (eg. 00:01:00 for 1min, 12:00:00 for 12hours etc)
     */
    public getGrainRealInterval(): string {
        return this.grain.realInterval;
    }

    /**
     * Return the real start date
     * @return the actual start time originally provided
     */
    public getRealStart(): Date {
        return this.startTime;
    }

    /**
     * Return the real end date
     * @returns the actual end time originally provided
     */
    public getRealEnd(): Date {
        return this.endTime;
    }

    /**
     * Return the best granular end date by shifting backward (make the window a bit bigger)
     * @returns correspending ideal startDate target for this grain
     */
    public getBestGranularStartDate(): Date {
        return this.chooseGranularBucketDateExistsWithin(this.getRealStart(), this.getGrainMinutes());
    }

    /**
     * Return the best granular end date by shifting forward (make the window a bit bigger)... optionally
     * do not expand the date beyond now()
     * @param stopGrainGrowthAtNow [optional] when true the engine will not give you a date in the future
     * @returns correspending date grain for your endDate target
     */
    public getBestGranularEndDate(stopGrainGrowthAtNow?: boolean): Date {
        const dt = this.chooseGranularBucketDateExistsWithin(this.getRealEnd(), this.getGrainMinutes());
        let result = moment(dt).add(this.getGrainMinutes(), 'minutes');

        // bbax: in certain situations (like kusto) the future is not something
        // we want to try to predict
        if (stopGrainGrowthAtNow) {
            if (result.isAfter(this.nowAtCtor)) {
                result = this.nowAtCtor;
            }
        }
        return result.toDate();
    }

    /**
     * Based on a grain time return the type (supports days, hours, minutes)
     * If you require week support, you will have to add it to the sister functions in this class too
     * @param grainInMinutes Number of minutes we want to understand the grain of
     * @return The type of grain we are looking at (eg. Days/Minutes/Hours)
     */
    public getGranularityType(grainInMinutes: number): GranularityTypes {
        if (grainInMinutes >= 60) {
            if (grainInMinutes >= 1440) {
                return GranularityTypes.Day;
            }
            return GranularityTypes.Hour;
        }
        return GranularityTypes.Minute;
    }

    /**
     * Based on the grain and our times return the number of buckets created
     * Ensure the smallest number of buckets is 1; people can and will divide by this number
     * @returns number of buckets in this grain for this time range
     */
    public getBucketCount(): number {
        const startMoment = moment(this.getBestGranularStartDate());
        const endMoment = moment(this.getBestGranularEndDate());
        const totalMinutes = moment.duration(endMoment.diff(startMoment)).asMinutes();
        const granularity = this.getGrainMinutes();

        const result = totalMinutes / granularity;
        if (result < 1) {
            return 1;
        }
        return result;
    }

    /**
     * Determines whether to use Kusto granularity options or MDM granularity options
     * @returns corresponding array of granularity options
     */
    private getGranularityOptions(): IGranularityOption[] {
        if (this.useMdmGrain) {
            return MdmGranularityOptions;
        }
        return standardGranularityOptions;
    }

    /**
     * Calculate the appropriate grain based on start to end range and the number
     * of desired buckets we want to be as close to as possible
     * @param grain [optional] override the grain calculator and force to this value
     * @returns IGranularityOption object which contains a kusto string and grain in minutes
     */
    private getMatchingGrainOrCalculate(grain?: number): IGranularityOption {
        const granularityOptions: IGranularityOption[] = this.getGranularityOptions();
        if (grain) {
            for (let item of granularityOptions) {
                if (item.intervalDurationMinutes === grain) {
                    return item;
                }
            }
        }
        return this.getTrendGranularity(moment(this.getRealStart()), moment(this.getRealEnd()));
    }

    /**
     * Calculate the appropriate grain based on start to end range and the number
     * of desired buckets we want to be as close to as possible
     * @param startDateTimeUtc Start of the range we need to expand
     * @param endDateTimeUtc  End of the range we need to expand
     * @returns IGranularityOption object which contains a kusto string and grain in minutes
     */
    private getTrendGranularity(startDateTimeUtc: moment.Moment, endDateTimeUtc: moment.Moment): IGranularityOption {
        // calculate total number of minutes between start and end dates
        const totalMinutes = moment.duration(endDateTimeUtc.diff(startDateTimeUtc)).asMinutes();

        const granularityOptions: IGranularityOption[] = this.getGranularityOptions();

        // assume the best granularity is daily
        let bestGranularityOption: IGranularityOption = granularityOptions[0];

        // find 'best' granularity - it is the one that gives number
        // of trend data points closest to ideal
        for (let candidateGranularityOption of granularityOptions) {
            const bestDataPointCount: number = totalMinutes / bestGranularityOption.intervalDurationMinutes;
            const candidateDataPointCount = totalMinutes / candidateGranularityOption.intervalDurationMinutes;

            // candidate option is better if it is closer to ideal number of data points
            const bestDistance: number = Math.abs(this.idealNumberOfDataPoints - bestDataPointCount);
            const candidateDistance: number = Math.abs(this.idealNumberOfDataPoints - candidateDataPointCount);

            if (bestDistance > candidateDistance) {
                bestGranularityOption = candidateGranularityOption;
            } else if (bestDistance < candidateDistance) {
                // number of data points can only increase as we go through
                // all available options in order - stop processing
                // if we see degradation in the next step
                break;
            }
        }

        return bestGranularityOption;
    }

    /**
     * Based on a grain, calculate the best starting bucket for your given time.
     * @param date Single date to find the begining of the grain for
     * @param grainIntervalMinutes Grain interval being targetteg
     * @returns The start date/time index for the granularity bucket for this target date/time
     */
    private chooseGranularBucketDateExistsWithin(date: Date, grainIntervalMinutes: number): Date {

        let grain: number = grainIntervalMinutes;
        let adjustedDate: Date = new Date(date as any);

        const grainType = this.getGranularityType(grain);
        if (grainType === GranularityTypes.Day) {
            grain = grain / 1440;
        } else if (grainType === GranularityTypes.Hour) {
            grain = grain / 60;
        }

        // bbax: our charting system doesn't care about seconds or ms... we can
        // discard these completely... if you require that precision the sister
        // functions in this class need to be reworked.
        adjustedDate.setMilliseconds(0);
        adjustedDate.setSeconds(0);

        let subtractType: moment.DurationInputArg2 = 'minutes';
        let startedReal: number = adjustedDate.getMinutes();
        switch (grainType) {
            case GranularityTypes.Day:
                subtractType = 'days';
                startedReal = adjustedDate.getUTCDay();
                adjustedDate.setMinutes(0);
                adjustedDate.setUTCHours(0);
                break;
            case GranularityTypes.Hour:
                subtractType = 'hours';
                adjustedDate.setMinutes(0);
                startedReal = adjustedDate.getUTCHours();
                break;
        }

        // bbax: at this point the date is shifted based on 1x grain (where x is hour/minute/day)
        // but we have to support 5x, 15x, etc, etc... so we use remainer here.  If the grain is a 1x
        // it will return minus zero, no shift.  if say we are doing 15 minute grain, 7 % 15 will
        // tell us how far we need to shift the working grain
        const shifter: number = startedReal % grain;
        return moment(adjustedDate).subtract(shifter, subtractType).toDate();
    }
}
