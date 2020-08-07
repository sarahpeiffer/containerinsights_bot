/**
 * props of the ResourceStatusObj.
 * Resource can be Node, User Pod and System Pod
 */
export interface IResourceStatusObj {
    /** status of the Resource (Node, User Pod, System Pod) */
    status: string;
    /** count of the resources by status*/
    count: number;
}

