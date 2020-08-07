/**
 * defines a set of data used to visualize monitor state
 */
export interface IHealthMonitorDisplayStrings {
    /** gets monitor in-tree (in-hierarchy context) display name */
    readonly inContextDisplayName: string;

    /** gets monitor standalone (outside hierarchy context) display name */
    readonly standaloneDisplayName: string;

    /** gets monitor description */
    readonly description: string;

    /** gets name of the ui component (react component) for rendering monitor state details */
    readonly detailsViewTypeName: string;
}
