import { DisplayStrings } from './DisplayStrings';
import { StringHelpers } from './Utilities/StringHelpers';

export class MetricValueFormatter {
    public static formatMillicoreValue(value: number, precision?: number): string {

        if (typeof value !== 'number') {
            return value;
        }

        if (value < 0) {
            console.error('Number of host CPU cores utilized cannot be negative');
            value = 0;
        }

        if (!precision) {
            precision = (value < 1) ? 1 : 0;
        }

        return MetricValueFormatter.round(value, precision) + DisplayStrings.MetricValueMillicoreSuffix;
    }

    public static formatMBytesValue(value: number): string {
        if (value < 0) {
            console.error('Memory values cannot be negative');
            value = 0;
        }
        if (value === 0) {
            return '0' + DisplayStrings.MetricValueMBSuffix;
        }

        return value > 1024
            ? MetricValueFormatter.round(value / 1024.0, value >= 1024 * 10 ? 0 : 1) + DisplayStrings.MetricValueGBSuffix
            : MetricValueFormatter.round(value, (value < 1) ? 1 : 0) + DisplayStrings.MetricValueMBSuffix;
    }

    public static formatMilliSecondsValue(value: number): string {
        if (value < 0) {
            console.error('Time values cannot be negative');
            value = 0;
        }
        if (value === 0) {
            return '0' + DisplayStrings.MetricValueMillisecondsSuffix;
        }

        return value > 1000
            ? MetricValueFormatter.round(value / 1000.0, value >= 1000 * 10 ? 0 : 1) + DisplayStrings.MetricValueSecondsSuffix
            : MetricValueFormatter.round(value, (value < 1) ? 1 : 0) + DisplayStrings.MetricValueMillisecondsSuffix;
    }


    public static formatPercentageValue(value: number): string {
        if (typeof value !== 'number') {
            return value;
        }

        if (value < 0) {
            console.error('Negative values are invalid for formatPercentageValue');
            value = 0;
        }
        if (value === 0) {
            return '0%';
        }

        return MetricValueFormatter.round(value, (value < 1) ? 1 : 0) + '%';
    }

    public static formatValue(value: number): string {

        if (typeof value !== 'number') {
            return value;
        }


        if (value >= 0) {
            return MetricValueFormatter.round(value, (value < 1) ? 1 : 0) + '';
        } else {
            return MetricValueFormatter.round(value, (value <= -1) ? 0 : 1) + '';
        }
    }

    public static formatBytesValue(value: number, decimals?: number): string {

        const suffixes = [
            DisplayStrings.MetricValueNoSuffix,
            DisplayStrings.MetricValueKBSuffix,
            DisplayStrings.MetricValueMBSuffix,
            DisplayStrings.MetricValueGBSuffix,
            DisplayStrings.MetricValueTBSuffix,
            DisplayStrings.MetricValuePBSuffix,
            DisplayStrings.MetricValueEBSuffix,
            DisplayStrings.MetricValueZBSuffix,
            DisplayStrings.MetricValueYBSuffix
        ];


        if (typeof value !== 'number') {
            return value;
        }

        if (value <= 0) {
            return '0' + DisplayStrings.MetricValueKBSuffix;
        }

        const k = 1024;

        let dm = decimals ? decimals : 2;

        const factor = Math.pow(10, dm);

        const roundedValue = Math.round(value * factor) / factor;

        if (roundedValue < k) {
            return roundedValue + DisplayStrings.MetricValueNoSuffix;
        }

        let index = Math.floor(Math.log(roundedValue) / Math.log(k));

        return parseFloat((roundedValue / Math.pow(k, index)).toFixed(dm)) + suffixes[index];
    }

    public static formatCountsValue(value: number, decimals?: number): string {

        const suffixes = [DisplayStrings.MetricValueNoSuffix,
        DisplayStrings.MetricValueThousandSuffix,
        DisplayStrings.MetricValueMillionSuffix,
        DisplayStrings.MetricValueBillionSuffix,
        DisplayStrings.MetricValueTrillionSuffix
        ];

        if (value <= 0) {
            return '0' + DisplayStrings.MetricValueNoSuffix;
        }


        const k = 1000;

        let dm = decimals ? decimals : 2;

        const factor = Math.pow(10, dm);

        const roundedValue = Math.round(value * factor) / factor;

        if (roundedValue < k) {
            return roundedValue + DisplayStrings.MetricValueNoSuffix;
        }


        let index = Math.floor(Math.log(roundedValue) / Math.log(k));

        return parseFloat((roundedValue / Math.pow(k, index)).toFixed(dm)) + suffixes[index];
    }

    /**
   * helper function to convert to UpTime string from last reported time and creationOrTransitionTime
   * * @param durationInMilliSeconds  is lastTimeReported - creationOrRebootTime
   * * @param status status of the node or container
   * * @returns formatted uptime string
   */
    public static formatUpTimeValue(durationInMilliSeconds: number): string {

        // show ?  as upTime if this function invoked with strict data type
        if (typeof durationInMilliSeconds !== 'number') {
            return DisplayStrings.UnknownUpTimeTitle;
        }
        // this value will be -1 for other running(or ready for host) states
        if (durationInMilliSeconds < 0) {
            return DisplayStrings.NoUpTimeTitle;
        }
        let totalMilliseconds = durationInMilliSeconds;

        if (totalMilliseconds === 0) {
            return StringHelpers.replaceAll(DisplayStrings.ContainerUpTimeMilliSecondsTitle, '{0}', '0');
        }

        const days = Math.floor(totalMilliseconds / (1000 * 60 * 60 * 24));
        totalMilliseconds -= days * (1000 * 60 * 60 * 24);

        const hours = Math.floor(totalMilliseconds / (1000 * 60 * 60));
        totalMilliseconds -= hours * (1000 * 60 * 60);

        const mins = Math.floor(totalMilliseconds / (1000 * 60));
        totalMilliseconds -= mins * (1000 * 60);

        const seconds = Math.floor(totalMilliseconds / (1000));
        totalMilliseconds -= seconds * (1000);

        const milliSeconds = totalMilliseconds;

        if (days > 0) {
            const baseDayString = days > 1 ? DisplayStrings.ContainerUpTimeDaysTitlePlural : DisplayStrings.ContainerUpTimeDaysTitle;
            return StringHelpers.replaceAll(baseDayString, '{0}', days.toFixed(0));
        }
        if (hours > 0) {
            const baseDayString = hours > 1 ? DisplayStrings.ContainerUpTimeHoursTitlePlural : DisplayStrings.ContainerUpTimeHoursTitle;
            return StringHelpers.replaceAll(baseDayString, '{0}', hours.toFixed(0));
        }
        if (mins > 0) {
            // tslint:disable-next-line:max-line-length
            const baseDayString = mins > 1 ? DisplayStrings.ContainerUpTimeMinutesTitlePlural : DisplayStrings.ContainerUpTimeMinutesTitle;
            return StringHelpers.replaceAll(baseDayString, '{0}', mins.toFixed(0));
        }
        if (seconds > 0) {
            // tslint:disable-next-line:max-line-length
            const baseDayString = seconds > 1 ? DisplayStrings.ContainerUpTimeSecondsTitlePlural : DisplayStrings.ContainerUpTimeSecondsTitle;
            return StringHelpers.replaceAll(baseDayString, '{0}', seconds.toFixed(0));
        }

        if (milliSeconds > 0) {
            const baseDayString = milliSeconds > 1 ?
                DisplayStrings.ContainerUpTimeMilliSecondsTitlePlural : DisplayStrings.ContainerUpTimeMilliSecondsTitle;
            return StringHelpers.replaceAll(baseDayString, '{0}', milliSeconds.toFixed(0));
        }

        return DisplayStrings.UnknownUpTimeTitle;

    }

    /**
     * Hack: the current UI has a pretty tight coupling between the display of data and the data itself... in this case
     * the status code is being translated below but this isn't helpful for icon selection which is done with substring
     * searches of status strings... we need to refactor all of this
     * @param statusCode status code as seen by kusto
     */
    public static getEnglishOnlyContainerStatus(statusCode: number): string {
        let status: string = 'unknown';

        switch (statusCode) {
            case 0:
                status = 'running';
                break;
            case 1:
                status = 'waiting';
                break;
            case 2:
                status = 'terminated';
                break;
            default:
                break;
        }

        return status;
    }

    /**
    * helper function to format the status code to status string
    * @param statusCode status code
    * @returns formatted container status string 
    */
    public static formatContainerStatusCode(statusCode: number): string {
        let status: string = DisplayStrings.ContainerStatusUnknownTitle;

        switch (statusCode) {
            case 0:
                status = DisplayStrings.ContainerStatusRunningTitle;
                break;
            case 1:
                status = DisplayStrings.ContainerStatusWaitingTitle;
                break;
            case 2:
                status = DisplayStrings.ContainerStatusTerminatedTitle;
                break;
            default:
                break;
        }

        return status;

    }

    private static round(value: number, precision: number): number {
        const factor = Math.pow(10, precision);
        const tempNumber = value * factor;
        const roundedTempNumber = Math.round(tempNumber);

        return roundedTempNumber / factor;
    }


}
