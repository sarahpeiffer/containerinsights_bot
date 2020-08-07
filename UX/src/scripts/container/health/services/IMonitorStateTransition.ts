/** local */
import { HealthState } from '../HealthState';

/**
 * Defines monitor state transition information obtained from the store
 */
export interface IMonitorStateTransition {
    /** timestamp state transition was generated (by agent clock) */
    agentDateTimeUtc: Date,

    // TODO-TASK-4648491: ensure the next two are also named this way in Kusto
    /** monitor type id */
    monitorTypeId: string;

    /** monitor subject (instance) id */
    monitorSubjectId: string;

    /** transition time to current state */
    transitionDateTimeUtc: Date;

    /** state transitioned from */
    oldState: HealthState;

    /** current monitor state */
    newState: HealthState;

    /** monitor labels */
    labels: StringMap<string>;

    /** monitor configuration properties */
    config?: StringMap<number | string>;

    /** monitor state details */
    details?: any;
}
