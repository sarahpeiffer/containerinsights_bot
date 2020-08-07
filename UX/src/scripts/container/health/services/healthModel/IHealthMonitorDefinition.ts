import { IParentHealthMonitorTypeSelector } from './IParentMonitorTypeSelector';

/**
 * defines health monitor definition as bases for defining cluster health model
 */
export interface IHealthMonitorDefinition {
    /** 
     * aggregation algorithm 
     * 
     * possible values: 'worstOf' and 'percentage' (default: worstOf)
     * NOTE: not defined as enumeration to provide better way 
     *       to share model definition between agent and UX
     * 
     * TODO-TASK-4754064: given a monitor w/o specified value for agg algorithm it
     *       is not clear if we're looking at a unit or agg monitor -
     *       can we do this better by, say, specifying monitor kind?
     * */
    aggregationAlgorithm?: string;

    /**
     * parent monitor type id
     * 
     * specified either directly (as a string) or as a more complicated
     * multi-step algorithm (as array of selectors) to allow conditional
     * selection of the parent monitor based on child's labels
     */
    parentMonitorTypeId: string | Array<IParentHealthMonitorTypeSelector>;

    /** 
     * monitor labels the define instance of the monitor - key labels
     * if omitted, monitor is defined as singleton
     */
    keyLabels?: string[];

    defaultParentMonitorTypeId?: string;
}
