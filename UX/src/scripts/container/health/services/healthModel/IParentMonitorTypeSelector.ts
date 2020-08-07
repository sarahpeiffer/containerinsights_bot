/**
 * defines a rule for parent monitor selection
 * 
 * @example the following rule defines 'master_node_pool' as a parent for all monitors that have
 *          label 'kubernetes.is/role' equalling 'master'
 * {
 *   labelName: 'kubernetes.io/role',
 *   operator: '==',
 *   operand: 'master',
 *   parentMonitorTypeId: 'master_node_pool'
 * }
 */
export interface IParentHealthMonitorTypeSelector {
    /** target parent monitor type id */
    parentMonitorTypeId: string;

    /** label of the child monitor which value will be evaluated by the rule */
    labelName: string;

    /** operator for evaluation (NOTE: == is the only currently supported operator) */
    operator: string;

    /** value to evaluate against */
    operand: string;
}
