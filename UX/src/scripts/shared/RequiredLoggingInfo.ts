import { RowType } from '../container/shared/metadata/Shared';

/**
 * Immutable object containing logging information 
 */
export class RequiredLoggingInfo {
    /** Type of console === Type of row from where it was opened */
    public readonly consoleType: RowType;

    /** The cluster's subscription id */
    public readonly subscriptionId: string;

    /** The cluster's resource group */
    public readonly resourceGroup: string;

    /** The cluster name */
    public readonly clusterName: string;

    /** The pod name that the container is in */
    public readonly podName?: string;

    /** The container's name */
    public readonly containerInstanceName?: string;

    /** The namespace that the container is in */
    public readonly nameSpace: string;

    /** The node name */
    public readonly nodeName?: string;

    /**
     * Creates a new RequiredLoggingInfo object.
     * @param subscriptionId The cluster's subscription id
     * @param resourceGroup The cluster's resource group
     * @param clusterName The cluster name
     * @param podName The pod name that the container is in
     * @param containerInstanceName The container's name
     * @param nameSpace The namespace that the container is in
     * @param nodeName the node that the current object is on
     */
    constructor(
        subscriptionId: string,
        resourceGroup: string,
        clusterName: string,
        podName: string,
        containerInstanceName: string,
        nameSpace: string,
        nodeName: string,
        consoleType: RowType
    ) {
        this.subscriptionId = subscriptionId;
        this.resourceGroup = resourceGroup;
        this.clusterName = clusterName;
        this.podName = podName;
        this.containerInstanceName = containerInstanceName;
        this.nameSpace = nameSpace;
        this.nodeName = nodeName;
        this.consoleType = consoleType;
    }
    /**
     * Returns boolean representing whether all attributes are non-empty strings.
     */
    public isValidLiveLog(): boolean {
        if ((!this.clusterName)
            || (!this.nameSpace)
            || (!this.subscriptionId)
            || (!this.resourceGroup)
            || (!this.podName)
            || (!this.containerInstanceName)
            || (!this.consoleType)) {
            return false;
        }
        return true;
    }

    /**
     * Returns a boolean representing whether all attributes are non-empty strings
     * and checks for the validity of event logging info
     */
    public isvalidEventLog(): boolean {

        if (!this.clusterName ||
            !this.resourceGroup ||
            !this.subscriptionId ||
            !this.consoleType) {
            return false;
        }
        return true;
    }

    /**
     * Returns a boolean representing whether all attributes are non-empty strings
     * and checks for the validity of pod info
     */
    public isvalidLiveTabMetric(): boolean {
        if (!this.subscriptionId ||
            !this.resourceGroup ||
            !this.nameSpace ||
            !this.podName ||
            this.consoleType !== RowType.Pod) {
            return false;
        }
        return true;
    }

    /**
     * Compare two RequiredLoggingInfos to see if they contain the same data
     * @param other The other RequiredLoggingInfo to compare against
     */
    public equals(other: RequiredLoggingInfo): boolean {
        if (!other) {
            return false;
        }
        if (this.clusterName === other.clusterName
            && this.nameSpace === other.nameSpace
            && this.subscriptionId === other.subscriptionId
            && this.resourceGroup === other.resourceGroup
            && this.podName === other.podName
            && this.containerInstanceName === other.containerInstanceName
        ) {
            return true;
        } else {
            return false;
        }
    }
}
