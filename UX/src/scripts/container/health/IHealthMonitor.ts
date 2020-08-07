import { HealthState } from './HealthState';

/** 
 * defines health monitor - part of the health model 
 */
export interface IHealthMonitor {
    /** monitor type id */
    readonly typeId: string;

    /** monitor subject (instance) id */
    readonly subjectId: string;

    /** monitor state */
    state: HealthState;

    /** timestamp current monitor state was last delivered to store */
    lastUpdatedDateTimeUtc: Date,

    /** date and time current state was first observed */
    firstObservedDateTimeUtc: Date;

    /** member monitor subject (instance) ids */
    memberSubjectIds: string[];

    /** monitor labels */
    readonly labels?: StringMap<string>;

    /** monitor state details */
    readonly details?: any;

    /** monitor config at the time current state was reported */
    readonly config?: StringMap<number | string>;
}
