/** local */
import { IHealthMonitor } from './IHealthMonitor';

/**
 * defines health model functionality
 */
export interface IHealthModel {
    /**
     * set of health model monitors
     */
    monitors: StringMap<IHealthMonitor>;

    /**
     * top-level monitor subject (instance) id
     */
    topLevelMonitorSubjectId: string;

    /**
     * errors in the model (missing parent, inconsistent parent state
     * details as compared to member states, etc.)
     */
    errors?: string[];
}
