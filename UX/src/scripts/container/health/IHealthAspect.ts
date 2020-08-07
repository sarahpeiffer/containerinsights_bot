import { HealthState } from './HealthState';

/**
 * defines health aspect data structure
 */
export interface IHealthAspect {
    /** gets health aspect identifier (== monitor type id == monitor instance id) */
    readonly aspectIdentifier: string;

    /** gets aspect display name */
    readonly displayName: string;

    /** gets aspect health state */
    readonly state: HealthState;

    /** gets aspect health state display name */
    readonly stateDisplayName: string;
}
