import * as moment from 'moment';
import { TimeDataAbsolute, RangeValidation, Validation, TimeValues, TimeData, TimeDataRelative } from '@appinsights/pillscontrol-es5';
import { isAbsolute } from '@appinsights/pillscontrol-es5/dist/TimeUtils';
import { DisplayStrings } from '../../shared/DisplayStrings';

/**
 * Time validation and other time utilities
 */
export class TimeUtils {
    /**
     * Returns a value indicating it can use timeData given the supported times and time validation
     * @param  {TimeData} timeData
     * @param  {TimeValues[]} supportedTimes
     * @param  {(time: TimeDataAbsolute) => RangeValidation} validation
     * @return boolean
     */
    public static canUseTimeData(
        timeData: TimeData,
        supportedTimes: TimeValues[],
        validation: (time: TimeDataAbsolute) => RangeValidation): boolean {
        if (!timeData || !supportedTimes || !validation) {
            return false;
        }

        if (isAbsolute(timeData)) {
            const validationResult = validation(timeData);
            return validationResult.startValidation.isValid && validationResult.endValidation.isValid;
        }

        return supportedTimes.find(
            (supportedTime: TimeValues) =>
                (supportedTime !== TimeValues.Custom) &&
                (supportedTime === timeData.relative.duration)) !== undefined;
    }
    /**
     * Fixes a TimeData that was serialized with json
     * @param  {TimeData} timeData
     */
    public static reconstructAbsoluteDates(timeData: TimeData): void {
        if (isAbsolute(timeData)) {
            if (typeof (timeData.absolute.endTime) === 'string') {
                timeData.absolute.endTime = new Date(timeData.absolute.endTime);
            }

            if (typeof (timeData.absolute.startTime) === 'string') {
                timeData.absolute.startTime = new Date(timeData.absolute.startTime);
            }
        }
    }

    /**
     * check if user selected start time/ end time difference is greater than 30 days.
     * @param timeData contains start time/ end time
     */
    public static notMoreThanThirtyDaysApart(timeData: TimeDataAbsolute): RangeValidation {
        let endTimeValidation: Validation = { isValid: true };

        if (moment(timeData.absolute.endTime).diff(timeData.absolute.startTime) > TimeValues.Last30Days) {
            endTimeValidation = { isValid: false, reason: DisplayStrings.DateTimeRangeValidateWithinOneMonth };
        }

        return { startValidation: { isValid: true }, endValidation: endTimeValidation };
    }

    /**
     * check if start/end time difference is less than one hour
     * @param timeData
     */
    public static notMoreThanOneHourApart(timeData: TimeDataAbsolute): RangeValidation {
        let endTimeValidation: Validation = { isValid: true };

        if (moment(timeData.absolute.endTime).diff(timeData.absolute.startTime) > TimeValues.LastHour) {
            endTimeValidation = { isValid: false, reason: DisplayStrings.DateTimeRangeValidateWithinOneHour };
        }

        return { startValidation: { isValid: true }, endValidation: endTimeValidation };
    }

    /**
     * convert time date to Timespan in Iso format
     * @param timeData 
     */
    public static convertTimeDateToTimespanInIsoFormat(timeData: TimeData): string | undefined {
        const timeRelative: TimeDataRelative = timeData as TimeDataRelative;
        if (timeRelative.relative) {
            switch (timeRelative.relative.duration) {
                case TimeValues.Last30Minutes:
                    return 'PT30M';
                case TimeValues.LastHour:
                    return 'PT1H';
                case TimeValues.Last4Hours:
                    return 'PT4H';
                case TimeValues.Last6Hours:
                    return 'PT6H';
                case TimeValues.Last12Hours:
                    return 'PT12H';
                case TimeValues.LastDay:
                    return 'P1D';
                case TimeValues.Last2Days:
                    return 'P2D';
                case TimeValues.Last3Days:
                    return 'P3D';
                case TimeValues.Last7Days:
                    return 'P7D';
                case TimeValues.Last30Days:
                    return 'P30D';
                case TimeValues.Last90Days:
                    return 'P90D';                    
            }
        } 
        const timeAbsolute: TimeDataAbsolute = timeData as TimeDataAbsolute;
        if (timeAbsolute.absolute) {
            return `${moment(timeAbsolute.absolute.startTime).format()}/${moment(timeAbsolute.absolute.endTime).format()}`;
        }
        return undefined;
    }
}
