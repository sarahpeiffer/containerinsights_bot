/**
 * defines functionality for obtaining monitor visualization display strings
 */
export interface IHealthMonitorVisualizationDefinition {
    /** 
     * gets monitor in-tree (in-hierarchy context) display name 
     */
    readonly inContextDisplayNameTemplate: string;

    /** 
     * gets monitor standalone (outside hierarchy context) display name
     */
    readonly standaloneDisplayNameTemplate: string;

    /** 
     * gets monitor description 
     */
    readonly descriptionTemplate: string;

    /**
     * gets name of the ui component (react component) for rendering monitor state details 
     */
    readonly detailsViewTypeName: string;
}
