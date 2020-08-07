/** Maintain consistency with azure-wlm\src\UI\WorkloadMonitoringUI\Client\ForExport\TimeData.d.ts */

declare namespace BladeParameters {

    export interface TimeRange {
        startTime: Date;
        endTime: Date;
    }

    export interface TimeDataRelative {
        /** A relative time range. */
        relative: {
            duration: number;
        };
        options?: any;
    }

    export interface TimeDataAbsolute {
        /** An absolute time range. */
        absolute: TimeRange;
        options?: any;
    }

    export type TimeData = TimeDataRelative | TimeDataAbsolute;
}