
/**
 * model in the mvvm chain for an item on the main grid
 */
export class DeploymentsItemModel {

    /**
     * .ctor()
     * @param deploymentId deployment id as seen by k8s
     * @param name name of the deployment
     * @param namespace namespace of the deployment
     * @param readyActual mapped to k8s api
     * @param readyDesired mapped to k8s api
     * @param upToDate mapped to k8s api
     * @param available mapped to k8s api
     * @param age mapped to k8s api
     */
    constructor(
        public deploymentId: string,
        public name: string,
        public namespace: string,
        public readyActual: string,
        public readyDesired: string,
        public upToDate: string,
        public available: string,
        public age: string) { }
}
