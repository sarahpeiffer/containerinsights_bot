import { NodePropertyPanelKustoResponseColumnMap } from './KustoPropertyPanelResponseInterpreter';
import { DisplayStrings } from '../../shared/DisplayStrings';
import { StringHelpers } from '../../shared/Utilities/StringHelpers';
import * as update from 'immutability-helper';

export enum DiskStatus {
    OutOfDisk = 'outofdisk',
    DiskPressure = 'pressure',
    // nibs: Ok and Unknown statuses do not actually come from Kusto, but they are useful here in the code
    Ok = 'ok',
    Unknown = 'unknown'
}

export enum NodeDiskMetrics {
    UsedPercent = 'used_percent',
    Used = 'used',
    Free = 'free',
    // nibs: DiskStatus is not actually a node disk metric from Kusto, but this is the best place 
    // for this string right now
    DiskStatus = 'disk_status'
}

const statusFinalString = {
    outofdisk: 'OutOfDisk',
    pressure: 'DiskPressure',
    ready: 'Ready',
    networkunavailable: 'NetworkUnavailable'
}

const diskPressurePercentThreshold: number = 90;
const outOfDiskPercentThreshold: number = 99;

export class DiskMetricsInterpreter {
    /**
     * Extract disk data from Kusto response rows and pack it nice and tight in an object 
     * N.B. if a row from the disk metrics table is missing any information, we skip that row
     * @param kustoResponseRows rseponse Rows from Kusto that ostensibly have disk data in them 
     */
    public static getDiskDataObject(kustoResponseRows: [any[]]): any {
        kustoResponseRows = this.sortKustoResponseRows(kustoResponseRows);

        let diskDataObject: any = {};
        diskDataObject = this.buildDiskDataObject(diskDataObject, kustoResponseRows);

        return diskDataObject;
    }

    /**
     * Determines disk status from disk data
     * @param diskData processed and repackaged disk data from kusto
     */
    public static getNodeDiskStatusFromDiskData(diskData: any): string[] {
        let diskStatus: string[] = [];

        // Evaluate disk data to determine disk status
        for (let device in diskData) {
            if (diskData.hasOwnProperty(device)) {
                for (let path in diskData[device]) {
                    if (diskData[device].hasOwnProperty(path)) {
                        if (!this.isKubeletMountPath(path)) { // Already get this status from Kubernetes, from Status in KubeNodeInventory
                            if (diskData[device][path].hasOwnProperty(NodeDiskMetrics.DiskStatus)) { 
                                let deviceStatus = diskData[device][path][NodeDiskMetrics.DiskStatus];
                                if (deviceStatus === DiskStatus.OutOfDisk) {
                                    diskStatus.push(DiskStatus.OutOfDisk);
                                } else if (deviceStatus === DiskStatus.DiskPressure) {
                                    diskStatus.push(DiskStatus.DiskPressure);
                                }
                            }
                        }
                    }
                }
            }
        }

        return diskStatus;
    }

    /**
     * 1st Merge node status with disk status from mount points besides the kubelet
     * 2nd 
     * @param nodeStatus node status we get from Kusto
     * @param diskStatus disk status we calculate from Telegraf disk metrics 
     */
    public static mergeNodeStatusWithDiskStatus(nodeStatus: string, diskStatus: string[]): string {
        if (StringHelpers.isNullOrEmpty(nodeStatus)) { throw new Error('Invalid node status') };
        if (!diskStatus || diskStatus.length <= 0) {
            return nodeStatus;
        } else {
            
            const nodeStatusArray: string[] = nodeStatus.split(', ');
            const nodeStatusPlusDiskStatusArray: string[] = nodeStatusArray.concat(diskStatus);
            const aggStatusArray: string[] = this.aggregateStatuses(nodeStatusPlusDiskStatusArray);
            const finalNodeStatus: string = aggStatusArray.join(', ');
            return finalNodeStatus;
        }
    }

    /**
     * When the mount point for the kubelet is encountering disk pressure or out of disk issues, it will startt
     * shutting down and restarting pods, most likely taking down our containerized agent providing our disk metrics.
     * In this event, we will not receive the disk metrics that would inform us of these disk problems, and thus
     * we will not be able to correctly determine if we should show a disk status warning icon, or not.
     * Fortunately, the disk problems for the kubelet will be surfaced by Kubernetes itself.
     * @param nodeStatus node status returned by Kubernetes 
     */
    public static nodeStatusHasDiskProblems(nodeStatus: string): boolean {
        if (!nodeStatus) {
            return false;
        }
        const lowerNodeStatus: string = nodeStatus.toLocaleLowerCase();
        const hasPressure: boolean = lowerNodeStatus.indexOf('pressure') >= 0;
        const outOfDisk: boolean = lowerNodeStatus.indexOf('outofdisk') >= 0;
        return (hasPressure || outOfDisk);
    }

    /**
     * Removes duplicates from a string array and returns the deduped array 
     * with a count of each string from the original array appended to that string
     * @param array array of strings
     */
    private static aggregateStatuses(array: string[]): string[] {
        let dict = {};
        for (let element of array) {
            if (!(element.toLowerCase() in dict)) {
                dict[element.toLowerCase()] = 1;
            } else {
                dict[element.toLowerCase()] += 1;
            }
        }
        let answerArray = [];
        for (let item in dict) {
            if (dict.hasOwnProperty(item)) {
                let finalString = (item in statusFinalString) ? statusFinalString[item] : item;
                dict[item] > 1 ?
                    answerArray.push(`${finalString} x ${dict[item]}`) :
                    answerArray.push(`${finalString}`); 
            }
        }
        return answerArray;
    }

    /**
     * Determines whether or not the mount path is the Kubelet mount path
     * @param mountPath 
     */
    private static isKubeletMountPath(mountPath: string) {
        return mountPath === '\/';
    }

    /**
     * Sort by device asc, then by path asc
     * Sorts so that the disk metrics table rendered in the property panel lists the items in the table in the right order, i.e.
     * the order that linux systems would display them in
     * @param kustoResponseRows 
     */
    private static sortKustoResponseRows(kustoResponseRows: any[]) {
        const kustoResponseRowsCopy = update(kustoResponseRows, {});
        kustoResponseRowsCopy.sort((a: any[], b: any[]) => {
            if (a[NodePropertyPanelKustoResponseColumnMap.Device] < b[NodePropertyPanelKustoResponseColumnMap.Device]) {
                return -1;
            } else if (a[NodePropertyPanelKustoResponseColumnMap.Device] > b[NodePropertyPanelKustoResponseColumnMap.Device]) {
                return 1; 
            }

            if (a[NodePropertyPanelKustoResponseColumnMap.Path] < b[NodePropertyPanelKustoResponseColumnMap.Path]) {
                return -1;
            } else if (a[NodePropertyPanelKustoResponseColumnMap.Path] > b[NodePropertyPanelKustoResponseColumnMap.Path]) {
                return 1;
            }
            
            return 0;
        });
        return kustoResponseRowsCopy;
    }

    /**
     * Performs the bulk of the work of interpreting the disk metrics we get from Kusto by
     * packaging them into an object that is easier to pass around and work with in the rest of the codebase
     * @param diskDataObject 
     * @param kustoResponseRows 
     */
    private static buildDiskDataObject(diskDataObject: any, kustoResponseRows: any[]): any {
        for (let row of kustoResponseRows) {
            // Get device, set key
            let device = row[NodePropertyPanelKustoResponseColumnMap.Device];
            if (StringHelpers.isNullOrEmpty(device)) {
                continue;
            }
            if (!(device in diskDataObject)) {
                diskDataObject[device] = {};
            }
            
            // Get path, set key
            let path = row[NodePropertyPanelKustoResponseColumnMap.Path];
            if (StringHelpers.isNullOrEmpty(path)) {
                continue;
            }
            if (!(path in diskDataObject[device])) {
                diskDataObject[device][path] = {};
            }

            // Get disk metric name, set key
            let diskMetricName = row[NodePropertyPanelKustoResponseColumnMap.DiskMetricName];
            if (StringHelpers.isNullOrEmpty(diskMetricName)) {
                continue;               
            }
            if (!(diskMetricName in diskDataObject[device][path])) {
                diskDataObject[device][path][diskMetricName] = DisplayStrings.PropertyPanelEmptyPropertyString;
            }
            
            // Get disk metric value, set value of final key. 
            // If the disk metric name DiskStatus.Unknown, determine status and set that key's value, too.
            let diskMetricValue = row[NodePropertyPanelKustoResponseColumnMap.DiskMetricValue];
            if (StringHelpers.isNullOrEmpty(diskMetricValue)) {
                diskDataObject[device][path][diskMetricName] = DisplayStrings.PropertyPanelEmptyPropertyString;
                if (diskMetricName === NodeDiskMetrics.UsedPercent) {
                    diskDataObject[device][path][NodeDiskMetrics.DiskStatus] = DiskStatus.Unknown;
                }
            } else {
                diskDataObject[device][path][diskMetricName] = diskMetricValue;
                if (diskMetricName === NodeDiskMetrics.UsedPercent) {
                    let usedPercent: number = diskMetricValue;
                    let diskStatus: DiskStatus = this.getDiskStatusFromUsedPercent(usedPercent);
                    diskDataObject[device][path][NodeDiskMetrics.DiskStatus] = diskStatus;
                } 
            }
        }

        return diskDataObject;
    }

    /**
     * Assigns a disk status based on the disk used percent metric 
     * @param usedPercent 
     */
    private static getDiskStatusFromUsedPercent(usedPercent: number): DiskStatus {
        if (usedPercent == null) {
            return DiskStatus.Unknown;
        } else if (usedPercent >= outOfDiskPercentThreshold) {
            return DiskStatus.OutOfDisk;
        } else if (usedPercent > diskPressurePercentThreshold && usedPercent < outOfDiskPercentThreshold) {
            return DiskStatus.DiskPressure;
        } else {
            return DiskStatus.Ok;
        }
    }
}
