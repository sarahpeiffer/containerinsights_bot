/**
 * 3rd party
 */
import { String } from 'typescript-string-operations';

/**
 * shared
 */
import { MetricValueFormatter } from '../../shared/MetricValueFormatter';
import { DisplayStrings } from '../../shared/DisplayStrings';
import { SGDataRowExt } from '../grids/shared/SgDataRowExt';
import { ContainerMetaData } from '../shared/metadata/ContainerMetaData';
import findIndex = require('array.prototype.findindex');
import { DiskMetricsInterpreter } from './DiskMetricsInterpreter';
import { StringHelpers } from '../../shared/Utilities/StringHelpers';
import { IMetaDataBase } from '../shared/metadata/Shared';


/**
 * enums
 */

/**
 * Provides a means of referencing the data in a row taken from the Kusto response object for property panel
 * by column name, as opposed to a cryptic and seeminlgy arbitrary index
 * So, it's a map of the column names in the Kusto table that's queried to the index where that column's data is stored
 * in the array of arrays of row data that is received from the Kusto response :)
*/
export enum ContainerPropertyPanelKustoResponseColumnIndicesMap {
    ContainerName,
    ContainerID,
    Namespace,
    ContainerStatus,
    ContainerStatusReason,
    Image,
    ImageTag,
    ContainerCreationTimeStamp,
    StartedTime,
    FinishedTime,
    CPULimit,
    CPURequest,
    MemoryLimit,
    MemoryRequest,
    EnvironmentVar
}

/**
 * Provides a way for referencing the keys in the container interpreted response
 */
export enum ContainerPropertyPanelInterpretedResponseKeyMap {
    ContainerName = 'ContainerName',
    ContainerID = 'ContainerID',
    Namespace = 'Namespace',
    ContainerStatus = 'ContainerStatus',
    ContainerStatusReason = 'ContainerStatusReason',
    Image = 'Image',
    ImageTag = 'ImageTag',
    ContainerCreationTimeStamp = 'ContainerCreationTimeStamp',
    StartedTime = 'StartedTime',
    FinishedTime = 'FinishedTime',
    CPULimit = 'CPULimit',
    CPURequest = 'CPURequest',
    MemoryLimit = 'MemoryLimit',
    MemoryRequest = 'MemoryRequest',
    EnvironmentVar = 'EnvironmentVar',
    containerNameWithPodUID = 'containerNameWithPodUID',
    metaData = 'metaData'
}

/**
 * Allows to go from the Kusto column names to analogous strings that make more sense and are more nicely formatted
 */
export const ContainerPropertyPanelKustoResponseColumnNamesToPropertyPanelPropertyTitleNamesMap = {
    ContainerName: DisplayStrings.ContainerPropertyPanelContainerName,
    ContainerID: DisplayStrings.ContainerPropertyPanelContainerID,
    Namespace: DisplayStrings.NameSpaceSelectorTitle,
    ContainerStatus: DisplayStrings.ContainerPropertyPanelContainerStatus,
    ContainerStatusReason: DisplayStrings.ContainerPropertyPanelContainerStatusReason,
    Image: DisplayStrings.ContainerPropertyPanelImage,
    ImageTag: DisplayStrings.ContainerPropertyPanelImageTag,
    ContainerCreationTimeStamp: DisplayStrings.ContainerPropertyPanelContainerCreationTimeStamp,
    StartedTime: DisplayStrings.ContainerPropertyPanelStartedTime,
    FinishedTime: DisplayStrings.ContainerPropertyPanelFinishedTime,
    CPULimit: DisplayStrings.ContainerPropertyPanelCPULimit,
    CPURequest: DisplayStrings.ContainerPropertyPanelCPURequest,
    MemoryLimit: DisplayStrings.ContainerPropertyPanelMemoryLimit,
    MemoryRequest: DisplayStrings.ContainerPropertyPanelMemoryRequest,
    EnvironmentVar: DisplayStrings.ContainerPropertyPanelEnvironmentVar
}

/**
 * Provides a means of referencing the data in a row taken from the Kusto response object for property panel
 * by column name, as opposed to a cryptic and seeminlgy arbitrary index
 * So, it's a map of the column names in the Kusto table that's queried to the index where that column's data is stored
 * in the array of arrays of row data that is received from the Kusto response :)
*/
export enum PodPropertyPanelKustoResponseColumnIndicesMap {
    PodName,
    PodStatus,
    ControllerName,
    ControllerKind,
    PodLabel,
    PodCreationTimeStamp,
    PodStartTimestamp,
    PodUid,
    NodeIP,
    ContainerName,
    CPULimit,
    CPURequest,
    MemoryLimit,
    MemoryRequest
}

/**
 * Provides a way for referencing the keys in the pod interpreted response
 */
export enum PodPropertyPanelInterpretedResponseKeyMap {
    PodName = 'PodName',
    PodStatus = 'PodStatus',
    ControllerName = 'ControllerName',
    ControllerKind = 'ControllerKind',
    PodLabel = 'PodLabel',
    PodCreationTimeStamp = 'PodCreationTimeStamp',
    PodStartTimestamp = 'PodStartTimestamp',
    PodUid = 'PodUid',
    NodeIP = 'NodeIP',
    ContainersName = 'ContainerName',
    CPULimit = 'CPULimit',
    CPURequest = 'CPURequest',
    MemoryLimit = 'MemoryLimit',
    MemoryRequest = 'MemoryRequest',
    containers = 'containers',
    metaData = 'metaData'
}

/**
 * Allows to go from the Kusto column names to analogous strings that make more sense and are more nicely formatted
 */
export const PodPropertyPanelKustoResponseColumnNamesToPropertyPanelPropertyTitleNamesMap = {
    PodName: DisplayStrings.PodPropertyPanelPodName,
    PodStatus: DisplayStrings.PodPropertyPanelPodStatus,
    ControllerName: DisplayStrings.PodPropertyPanelControllerName,
    ControllerKind: DisplayStrings.PodPropertyPanelControllerKind,
    PodLabel: DisplayStrings.PodPropertyPanelPodLabel,
    PodCreationTimeStamp: DisplayStrings.PodPropertyPanelPodCreationTimeStamp,
    PodStartTimestamp: DisplayStrings.PodPropertyPanelPodStartTimestamp,
    PodUid: DisplayStrings.PodPropertyPanelPodUid,
    // TODO: Reinstate nodeIP field once it has correct private IP address
    // NodeIP: DisplayStrings.PodPropertyPanelNodeIP,
    ContainerName: DisplayStrings.PodPropertyPanelContainerName,
    CPULimit: DisplayStrings.PodPropertyPanelCPULimit,
    CPURequest: DisplayStrings.PodPropertyPanelCPURequest,
    MemoryLimit: DisplayStrings.PodPropertyPanelMemoryLimit,
    MemoryRequest: DisplayStrings.PodPropertyPanelMemoryRequest,
}

/**
 * Provides a means of referencing the data in a row taken from the Kusto response object for property panel
 * by column name, as opposed to a cryptic and seeminlgy arbitrary index
 * So, it's a map of the column names in the Kusto table that's queried to the index where that column's data is stored
 * in the array of arrays of row data that is received from the Kusto response :)
*/
export enum ControllerPropertyPanelKustoResponseColumnIndicesMap {
    ControllerName,
    Namespace,
    ControllerKind,
    PodCount,
    ContainerCount,
    ServiceName
}

/**
 * Provides a way for referencing the keys in the controller interpreted response
 */
export enum ControllerPropertyPanelInterpretedResponseKeyMap {
    ControllerName = 'ControllerName',
    Namespace = 'Namespace',
    ControllerKind = 'ControllerKind',
    PodCount = 'PodCount',
    ContainerCount = 'ContainerCount',
    ServiceName = 'ServiceName',
    metaData = 'metaData'
}

/**
 * Allows to go from the Kusto column names to analogous strings that make more sense and are more nicely formatted
 */
export const ControllerPropertyPanelKustoResponseColumnNamesToPropertyPanelPropertyTitleNamesMap = {
    ControllerName: DisplayStrings.ControllerPropertyPanelControllerName,
    Namespace: DisplayStrings.ControllerPropertyPanelNamespace,
    ControllerKind: DisplayStrings.ControllerPropertyPanelControllerKind,
    PodCount: DisplayStrings.ControllerPropertyPanelPodCount,
    ContainerCount: DisplayStrings.ControllerPropertyPanelContainerCount,
    ServiceName: DisplayStrings.ControllerPropertyPanelServiceName
}

/**
 * Provides a means of referencing the data in a row taken from the Kusto response object for property panel
 * by column name, as opposed to a cryptic and seeminlgy arbitrary index
 * So, it's a map of the column names in the Kusto table that's queried to the index where that column's data is stored
 * in the array of arrays of row data that is received from the Kusto response :)
*/
export enum NodePropertyPanelKustoResponseColumnMap {
    Computer,
    Status,
    ClusterName,
    KubeletVersion,
    KubeProxyVersion,
    DockerVersion,
    OperatingSystem,
    NodeIP,
    Labels,
    ComputerEnvironment,
    Image,
    ImageTag,
    Device,
    Path,
    DiskMetricName,
    DiskMetricValue
}

/**
 * Provides a way for referencing the keys in the node interpreted response
 */
export enum NodePropertyPanelInterpretedResponseKeyMap {
    NodeName = 'Computer',
    Status = 'Status',
    ClusterName = 'ClusterName',
    KubeletVersion = 'KubeletVersion',
    KubeProxyVersion = 'KubeProxyVersion',
    DockerVersion = 'DockerVersion',
    OperatingSystem = 'OperatingSystem',
    NodeIP = 'NodeIP',
    Labels = 'Labels',
    ComputerEnvironment = 'ComputerEnvironment',
    Image = 'Image',
    ImageTag = 'ImageTag',
    DiskData = 'DiskData',
    metaData = 'metaData'
}

/**
 * Allows to go from the Kusto column names to analogous strings that make more sense and are more nicely formatted
 */
export const NodePropertyPanelKustoResponseColumnNamesToPropertyPanelPropertyTitleNamesMap = {
    Computer: DisplayStrings.NodePropertyPanelNodeName,
    Status: DisplayStrings.NodePropertyPanelStatus,
    ClusterName: DisplayStrings.NodePropertyPanelClusterName,
    KubeletVersion: DisplayStrings.NodePropertyPanelKubeletVersion,
    KubeProxyVersion: DisplayStrings.NodePropertyPanelKubeProxyVersion,
    DockerVersion: DisplayStrings.NodePropertyPanelDockerVersion,
    OperatingSystem: DisplayStrings.NodePropertyPanelOperatingSystem,
    // TODO: Reinstate nodeIP field once it has correct private IP address
    //NodeIP: DisplayStrings.NodePropertyPanelNodeIP,
    Labels: DisplayStrings.NodePropertyPanelLabels,
    ComputerEnvironment: DisplayStrings.NodePropertyPanelComputerEnvironment,
    Image: DisplayStrings.NodePropertyPanelAgentImage,
    ImageTag: DisplayStrings.NodePropertyPanelAgentImageTag
}

export const VirtualKubletNamesMap = {
    NodeName: DisplayStrings.NodePropertyPanelNodeName,
    Status: DisplayStrings.NodePropertyPanelStatus,
    ClusterName: DisplayStrings.NodePropertyPanelClusterName,
    KubeletVersion: DisplayStrings.NodePropertyPanelKubeletVersion,
    Labels: DisplayStrings.NodePropertyPanelLabels,
}

/**
 * Enumerates the different types of property panel that can exist
 */
export enum PropertyPanelType {
    Container = 'container',
    Pod = 'pod',
    Controller = 'controller',
    Node = 'node',
    Unsupported = 'unsupported'
}

/**
 * interfaces
 */
// Describes the interpreted Kusto response object that is returned from this class
export interface IPropertyPanelInterpretedResponse {
    type: PropertyPanelType;
    data: IPropertyPanelContainerInterpretedResponse | IPropertyPanelPodInterpretedResponse |
    IPropertyPanelControllerInterpretedResponse | IPropertyPanelNodeInterpretedResponse;
}

export interface IPropertyPanelContainerInterpretedResponse {
    ContainerName: string;
    ContainerID: string;
    Namespace: string;
    ContainerStatus: string;
    ContainerStatusReason: string;
    Image: string;
    ImageTag: string;
    ContainerCreationTimeStamp: string;
    StartedTime: string;
    FinishedTime: string;
    CPULimit: string;
    CPURequest: string;
    MemoryLimit: string;
    MemoryRequest: string;
    EnvironmentVar: StringMap<string>;
    containerNameWithoutPodUID?: string, // TODO: how to not make optional...
    metaData?: ContainerMetaData
}

export interface IPropertyPanelPodInterpretedResponse {
    PodName: string;
    PodStatus: string;
    ControllerName: string;
    ControllerKind: string;
    PodLabel: StringMap<string>;
    PodCreationTimeStamp: string;
    PodStartTimestamp: string;
    PodUid: string;
    NodeIP: string;
    containers: StringMap<IContainerPerfData>
}

export interface IContainerPerfData {
    CPULimit: string;
    CPURequest: string;
    MemoryLimit: string;
    MemoryRequest: string;
}

export interface IPropertyPanelControllerInterpretedResponse {
    ControllerName: string
    Namespace: string;
    ControllerKind: string;
    PodCount: string;
    ContainerCount: string;
    ServiceName: string;
}

export interface IPropertyPanelNodeInterpretedResponse {
    Computer: string;
    Status: string;
    ClusterName: string;
    KubeletVersion: string;
    KubeProxyVersion: string;
    DockerVersion: string;
    OperatingSystem: string;
    NodeIP: string;
    Labels: StringMap<string>;
    ComputerEnvironment: string;
    Image: string;
    ImageTag: string;
    DiskData: any;
}

// Describes the meta data that is available on the columns property from a Kusto response object
export interface IKustoColumnMetaData {
    ColumnName: string;
    ColumnType: string;
    DataType: string;
}

const DATE_ZERO = '0001-01-01T00:00:00Z';

/**
 * Interprets the response returned from the Kusto query for Property Panel data.
 * Transforms the response into a format that will be easy to reason about and map to UX components
 */
export class KustoPropertyPanelResponseInterpreter {

    /**
     * Routes to the proper method for interpreting the Kusto response based on the type of property panel that is being generated
     * @param responseRows row data from the Kusto response object
     * @param responseCols column data from the Kusto response object
     * @param propertyPanelType the type of the property panel being generated
     * @return IPropertyPanelInterpretedResponse interpreted Kusto response object
     */
    public static processPropertyPanelQueryResponse(
        responseRows: any,
        responseCols: any,
        propertyPanelType: PropertyPanelType,
        row?: SGDataRowExt // nib: In the special case that we need some of the meta data associated with the row,
        // like in the case of container live logs
    ): IPropertyPanelInterpretedResponse {
        let interpretedResponse: IPropertyPanelInterpretedResponse;
        switch (propertyPanelType) {
            case PropertyPanelType.Container:
                interpretedResponse = this.interpretContainerPropertyPanelQueryResponse(responseRows, responseCols, row);
                break;
            case PropertyPanelType.Pod:
                interpretedResponse = this.interpretPodPropertyPanelQueryResponse(responseRows, responseCols, row);
                break;
            case PropertyPanelType.Controller:
                interpretedResponse = this.interpretControllerPropertyPanelQueryResponse(responseRows, responseCols, row);
                break;
            case PropertyPanelType.Node:
                interpretedResponse = this.interpretNodePropertyPanelQueryResponse(responseRows, responseCols, row);
                break;
            case PropertyPanelType.Unsupported:
                interpretedResponse = { type: PropertyPanelType.Unsupported, data: undefined };
                break;
            default:
                interpretedResponse = { type: undefined, data: undefined };
        }
        return interpretedResponse;
    }

    /**
     * Validates Kusto response contents to match property panel expectations
     * @param responseRows row data from the Kusto response object
     * @param responseCols column data from the Kusto response object
     * @param propertyPanelType property panel type data belongs to
     */
    private static validateResultRowsAndCols(
        responseRows: Array<Array<any>>,
        responseCols: IKustoColumnMetaData[],
        propertyPanelType: PropertyPanelType
    ): void {
        if (!responseRows || !responseRows.length) {
            throw new Error(`Parameter @responseRows may not be null or empty array. `
                + `Prop panel type: '${propertyPanelType}'`);
        }

        if (!responseCols || !responseCols.length) {
            throw new Error(`Parameter @responseCols may not be null or empty array. `
                + `Prop panel type: '${propertyPanelType}'`);
        }

        if (propertyPanelType === PropertyPanelType.Pod) {
            // must have > 0 rows in the result set
            if (responseRows.length < 1) {
                throw new Error(`@responseRows.length has value of ${responseRows.length || 'null'}. `
                    + `Expected > 0 for '${propertyPanelType}' props panel`);
            }
        } else if (propertyPanelType === PropertyPanelType.Node) {
            // must have > 0 rows in the result set
            if (responseRows.length < 1) {
                throw new Error(`@responseRows.length has value of ${responseRows.length || 'null'}. `
                    + `Expected > 0 for '${propertyPanelType}' props panel`);
            }
        } else {
            // all property panels except one for pod expect 1 result row
            if (responseRows.length !== 1) {
                throw new Error(`@responseRows.length has value of ${responseRows.length || 'null'}. `
                    + `Expected = 1 for '${propertyPanelType}' props panel`);
            }
        }

        if (responseRows[0].length !== responseCols.length) {
            throw new Error(`@responseRows has different number of columns than @responseCols. `
                + `Prop panel type: '${propertyPanelType}'`);
        }
    }

    /**
     * Interprets the Kusto response for a container property panel
     * @param responseRows row data from the Kusto response object
     * @param responseCols column data from the Kusto response object
     */
    private static interpretContainerPropertyPanelQueryResponse(
        responseRows: [
            [string, string, string, string, string, string, string, string, string, string, number, number, number, number, string]
        ],
        responseCols: IKustoColumnMetaData[],
        row?: SGDataRowExt
    ): IPropertyPanelInterpretedResponse {
        this.validateResultRowsAndCols(responseRows, responseCols, PropertyPanelType.Container);

        const soleResponseRow = responseRows[0];

        const type = PropertyPanelType.Container;
        let data: IPropertyPanelContainerInterpretedResponse = {
            ContainerName: '',
            ContainerID: '',
            Namespace: '',
            ContainerStatus: '',
            ContainerStatusReason: '',
            Image: '',
            ImageTag: '',
            ContainerCreationTimeStamp: '',
            StartedTime: '',
            FinishedTime: '',
            CPULimit: '',
            CPURequest: '',
            MemoryLimit: '',
            MemoryRequest: '',
            EnvironmentVar: {},
        };
        let interpretedResponse: IPropertyPanelInterpretedResponse = { type, data };

        for (let i = 0; i < soleResponseRow.length; i++) {
            let column: any = responseCols[i];
            if (!column) {
                throw new Error('Mismatch between Kusto response row and column objects');
            }
            let columnName: string = column.ColumnName;
            if (columnName === ContainerPropertyPanelInterpretedResponseKeyMap.EnvironmentVar) { // Process this manually below
                continue;
            }
            let rowData: any = soleResponseRow[ContainerPropertyPanelKustoResponseColumnIndicesMap[columnName]];
            if (rowData == null || rowData === '') {
                rowData = DisplayStrings.PropertyPanelEmptyPropertyString;
            }
            data[columnName] = rowData;
        }

        // Process environment variables
        const envVarResponse: string = soleResponseRow[ContainerPropertyPanelKustoResponseColumnIndicesMap.EnvironmentVar];

        // note: JSON.parse cannot deal with empty string and env vars can be that at times
        const envVarsStrings: string[] = String.IsNullOrWhiteSpace(envVarResponse) ?
            {} :
            JSON.parse(soleResponseRow[ContainerPropertyPanelKustoResponseColumnIndicesMap.EnvironmentVar]);
        let envVars: StringMap<string> = {};
        for (let envVarString of envVarsStrings) {
            let envVarParts = envVarString.split('=');
            if (envVarParts.length !== 2) {
                console.error('Environment variable is in an unexpected format');
                continue;
            }
            let envVarKey = envVarParts[0];
            let envVarValue = envVarParts[1];
            envVars[envVarKey] = envVarValue;
        }
        data[responseCols[ContainerPropertyPanelKustoResponseColumnIndicesMap.EnvironmentVar].ColumnName] = envVars;

        // Reprocess container name
        const containerNameKey: string =
            responseCols[ContainerPropertyPanelKustoResponseColumnIndicesMap.ContainerName].ColumnName;
        const containerNameWithPodUID: string = data[containerNameKey];
        const justContainerName: string = containerNameWithPodUID.replace(/.*\//, ''); // removing everything up to /, aka the podUID
        data[containerNameKey] = justContainerName;
        // Enables access, but removes this property from for in loops
        Object.defineProperty(data, 'containerNameWithPodUID', { value: containerNameWithPodUID, enumerable: false });

        // Creation of the container live event logs link requires info from the row meta data
        const metaData: ContainerMetaData = row.columnData[0].metaData; // TODO: null, undefined, safety checks
        Object.defineProperty(data, 'metaData', { value: metaData, enumerable: false });

        // Reprocess creation time
        const creationTimeKey: string =
            responseCols[ContainerPropertyPanelKustoResponseColumnIndicesMap.ContainerCreationTimeStamp].ColumnName;
        let creationTime = data[creationTimeKey];
        if (creationTime === DisplayStrings.PropertyPanelEmptyPropertyString) {
            data[creationTimeKey] = creationTime;
        } else if (creationTime == null || creationTime === '') {
            creationTime = DisplayStrings.PropertyPanelEmptyPropertyString;
            data[creationTimeKey] = creationTime;
        } else {
            const creationTimeLocal = KustoPropertyPanelResponseInterpreter.convertTimetoLocal(creationTime);
            data[creationTimeKey] = creationTimeLocal;
        }

        // Reprocess started time
        const startedTimeKey: string = responseCols[ContainerPropertyPanelKustoResponseColumnIndicesMap.StartedTime].ColumnName;
        let startedTime = data[startedTimeKey];
        if (startedTime === DisplayStrings.PropertyPanelEmptyPropertyString) {
            data[startedTimeKey] = startedTime;
        } else if (startedTime == null || startedTime === '') {
            startedTime = DisplayStrings.PropertyPanelEmptyPropertyString;
            data[startedTimeKey] = startedTime;
        } else {
            const startedTimeLocal = KustoPropertyPanelResponseInterpreter.convertTimetoLocal(startedTime);
            data[startedTimeKey] = startedTimeLocal;
        }

        // Reprocess finished time
        const finishedTimeKey: string = responseCols[ContainerPropertyPanelKustoResponseColumnIndicesMap.FinishedTime].ColumnName;
        let finishedTime = data[finishedTimeKey];
        if (finishedTime === DisplayStrings.PropertyPanelEmptyPropertyString) {
            data[finishedTimeKey] = finishedTime;
        } else if (finishedTime === DATE_ZERO) {
            finishedTime = DisplayStrings.PropertyPanelEmptyPropertyString;
            data[finishedTimeKey] = finishedTime;
        } else {
            const finishedTimeLocal = KustoPropertyPanelResponseInterpreter.convertTimetoLocal(finishedTime);
            data[finishedTimeKey] = finishedTimeLocal;
        }

        // Reprocess CPU limit
        const cpuLimitKey: string = responseCols[ContainerPropertyPanelKustoResponseColumnIndicesMap.CPULimit].ColumnName;
        const cpuLimit = data[cpuLimitKey];
        if (!isNaN(cpuLimit) && cpuLimit != null) {
            const cpuLimitFormatted = MetricValueFormatter.formatMillicoreValue(cpuLimit / 1000000);
            data[cpuLimitKey] = cpuLimitFormatted;
        } else {
            const cpuLimitFormatted = MetricValueFormatter.formatMillicoreValue(0);
            data[cpuLimitKey] = cpuLimitFormatted;
        }

        // Reprocess CPU request
        const cpuRequestKey: string = responseCols[ContainerPropertyPanelKustoResponseColumnIndicesMap.CPURequest].ColumnName;
        const cpuRequest = data[cpuRequestKey];
        if (!isNaN(cpuRequest) && cpuRequest != null) {
            const cpuRequestFormatted = MetricValueFormatter.formatMillicoreValue(cpuRequest / 1000000);
            data[cpuRequestKey] = cpuRequestFormatted;
        } else {
            const cpuRequestFormatted = MetricValueFormatter.formatMillicoreValue(0);
            data[cpuRequestKey] = cpuRequestFormatted;
        }

        // Reprocess memory limit
        const memLimitKey: string = responseCols[ContainerPropertyPanelKustoResponseColumnIndicesMap.MemoryLimit].ColumnName;
        const memLimit = data[memLimitKey];
        if (!isNaN(memLimit) && memLimit != null) {
            const memLimitFormatted = MetricValueFormatter.formatBytesValue(memLimit);
            data[memLimitKey] = memLimitFormatted;
        } else {
            const memLimitFormatted = MetricValueFormatter.formatBytesValue(0);
            data[memLimitKey] = memLimitFormatted;
        }

        // Reprocess memory request
        const memRequestKey: string = responseCols[ContainerPropertyPanelKustoResponseColumnIndicesMap.MemoryRequest].ColumnName;
        const memRequest = data[memRequestKey];
        if (!isNaN(memRequest) && memRequest != null) {
            const memRequestFormatted = MetricValueFormatter.formatBytesValue(memRequest);
            data[memRequestKey] = memRequestFormatted;
        } else {
            const memRequestFormatted = MetricValueFormatter.formatBytesValue(0);
            data[memRequestKey] = memRequestFormatted;
        }

        return interpretedResponse;
    }

    /**
     * Interprets the Kusto response for a pod property panel
     * @param responseRows row data from the Kusto response object
     * @param responseCols column data from the Kusto response object
     */
    private static interpretPodPropertyPanelQueryResponse(
        responseRows: [[string, string, string, string, string, string, string, string, string, string, number, number, number, number]],
        responseCols: IKustoColumnMetaData[],
        row?: SGDataRowExt
    ): IPropertyPanelInterpretedResponse {
        this.validateResultRowsAndCols(responseRows, responseCols, PropertyPanelType.Pod);

        const firstRow = responseRows[0];

        const type = PropertyPanelType.Pod;
        let data: IPropertyPanelPodInterpretedResponse = {
            PodName: '',
            PodStatus: '',
            ControllerName: '',
            ControllerKind: '',
            PodLabel: {},
            PodCreationTimeStamp: '',
            PodStartTimestamp: '',
            PodUid: '',
            NodeIP: '',
            containers: {}
        };
        let interpretedResponse: IPropertyPanelInterpretedResponse = { type, data };

        // Copy over the data in the Kusto response object into the interpreted response object
        for (let row of responseRows) { // There is one pod, but there may be multiple rows, one for each unique pod-container pair
            let containerName: string;
            let justContainerName: string;
            for (let i = 0; i < row.length; i++) {
                let column: any = responseCols[i];
                if (!column) {
                    throw new Error('Mismatch between Kusto response row and column objects');
                }
                let columnName: string = column.ColumnName;
                let rowData: any = row[PodPropertyPanelKustoResponseColumnIndicesMap[columnName]];
                if (rowData == null || rowData === '') {
                    rowData = DisplayStrings.PropertyPanelEmptyPropertyString;
                }
                if (i === PodPropertyPanelKustoResponseColumnIndicesMap.ContainerName) { // Special processing for containers
                    containerName = rowData;
                    // PodUID/ContainerName format is not human friendly. Give the customers just the container name
                    justContainerName = containerName.replace(/.*\//, ''); // Removing everything up to /, aka the podUID
                    data.containers[justContainerName] = { // Each container has perf data associated with it
                        CPULimit: '',
                        CPURequest: '',
                        MemoryLimit: '',
                        MemoryRequest: '',
                    };
                } else if (i === PodPropertyPanelKustoResponseColumnIndicesMap.CPULimit ||
                    i === PodPropertyPanelKustoResponseColumnIndicesMap.CPURequest
                ) { // Special processing for container perf data
                    if (!isNaN(rowData) && rowData != null) {
                        data.containers[justContainerName][columnName] = MetricValueFormatter.formatMillicoreValue(rowData / 1000000);
                    } else {
                        data.containers[justContainerName][columnName] = MetricValueFormatter.formatMillicoreValue(0);
                    }
                } else if (i === PodPropertyPanelKustoResponseColumnIndicesMap.MemoryLimit ||
                    i === PodPropertyPanelKustoResponseColumnIndicesMap.MemoryRequest
                ) { // Special processing for container perf data
                    if (!isNaN(rowData) && rowData != null) {
                        data.containers[justContainerName][columnName] = MetricValueFormatter.formatBytesValue(rowData);
                    } else {
                        data.containers[justContainerName][columnName] = MetricValueFormatter.formatBytesValue(0);
                    }
                } else { // If not a special case, just copy over the data in the Kusto Response Object into the interpreted response object
                    data[columnName] = rowData;
                }
            }
        }

        // Reprocess labels
        let labelsJSON = firstRow[PodPropertyPanelKustoResponseColumnIndicesMap.PodLabel];
        if (String.IsNullOrWhiteSpace(labelsJSON)) {
            labelsJSON = '[{}]';
        }
        const labels = JSON.parse(labelsJSON)[0];
        const labelsKey = responseCols[PodPropertyPanelKustoResponseColumnIndicesMap.PodLabel].ColumnName;
        data[labelsKey] = labels;

        // Creation of the container live event logs link requires info from the row meta data
        const metaData: IMetaDataBase = row.columnData[0].metaData; // TODO: null, undefined, safety checks
        Object.defineProperty(data, 'metaData', { value: metaData, enumerable: false });

        // Reprocess pod creation timestamp
        const podCreationTimestampKey: string = responseCols[PodPropertyPanelKustoResponseColumnIndicesMap.PodCreationTimeStamp].ColumnName;
        let podCreationTimestamp = data[podCreationTimestampKey];
        if (podCreationTimestamp === DisplayStrings.PropertyPanelEmptyPropertyString) {
            data[podCreationTimestampKey] = podCreationTimestamp;
        } else if (podCreationTimestamp == null || podCreationTimestamp === '') {
            podCreationTimestamp = DisplayStrings.PropertyPanelEmptyPropertyString;
            data[podCreationTimestampKey] = podCreationTimestamp;
        } else {
            const podCreationTimestampLocal = KustoPropertyPanelResponseInterpreter.convertTimetoLocal(podCreationTimestamp);
            data[podCreationTimestampKey] = podCreationTimestampLocal;
        }

        // Reprocess pod start timestamp
        const podStartTimestampKey: string = responseCols[PodPropertyPanelKustoResponseColumnIndicesMap.PodStartTimestamp].ColumnName;
        let podStartTimestamp = data[podStartTimestampKey];
        if (podStartTimestamp === DisplayStrings.PropertyPanelEmptyPropertyString) {
            data[podStartTimestampKey] = podStartTimestamp;
        } else if (podStartTimestamp == null || podStartTimestamp === '') {
            podStartTimestamp = DisplayStrings.PropertyPanelEmptyPropertyString;
            data[podStartTimestampKey] = podStartTimestamp;
        } else {
            const podStartTimestampLocal = KustoPropertyPanelResponseInterpreter.convertTimetoLocal(podStartTimestamp);
            data[podStartTimestampKey] = podStartTimestampLocal;
        }

        return interpretedResponse;
    }

    /**
     * Interprets the Kusto response for a controller property panel
     * @param responseRows row data from the Kusto response object
     * @param responseCols column data from the Kusto response object
     */
    private static interpretControllerPropertyPanelQueryResponse(
        responseRows: [[string, string, string, number, number, string]],
        responseCols: IKustoColumnMetaData[],
        row?: SGDataRowExt
    ): IPropertyPanelInterpretedResponse {
        this.validateResultRowsAndCols(responseRows, responseCols, PropertyPanelType.Controller);

        const soleResponseRow = responseRows[0];

        const type = PropertyPanelType.Controller;
        let data: IPropertyPanelControllerInterpretedResponse = {
            ControllerName: '',
            Namespace: '',
            ControllerKind: '',
            PodCount: '',
            ContainerCount: '',
            ServiceName: ''
        };
        let interpretedResponse: IPropertyPanelInterpretedResponse = { type, data };

        // Copy over the data in the Kusto response object into the interpreted response object
        for (let i = 0; i < soleResponseRow.length; i++) {
            let column: any = responseCols[i];
            if (!column) {
                throw new Error('Mismatch between Kusto response row and column objects');
            }
            let columnName: string = column.ColumnName;
            let rowData = soleResponseRow[ControllerPropertyPanelKustoResponseColumnIndicesMap[columnName]];
            if (rowData == null || rowData === '') {
                rowData = DisplayStrings.PropertyPanelEmptyPropertyString;
            }
            data[columnName] = rowData;

        }

        // Creation of the container live event logs link requires info from the row meta data
        const metaData: IMetaDataBase = row.columnData[0].metaData; // TODO: null, undefined, safety checks
        Object.defineProperty(data, 'metaData', { value: metaData, enumerable: false });
        return interpretedResponse;
    }


    /**
     * Interprets the Kusto response for a node property panel
     * @param responseRows row data from the Kusto response object
     * @param responseCols column data from the Kusto response object
     */
    private static interpretNodePropertyPanelQueryResponse(
        responseRows: [any[]],
        responseCols: IKustoColumnMetaData[],
        row?: SGDataRowExt
    ): IPropertyPanelInterpretedResponse {
        this.validateResultRowsAndCols(responseRows, responseCols, PropertyPanelType.Node);

        const firstResponseRow = responseRows[0];

        const type = PropertyPanelType.Node;
        let data: IPropertyPanelNodeInterpretedResponse = {
            Computer: '',
            Status: '',
            ClusterName: '',
            KubeletVersion: '',
            KubeProxyVersion: '',
            DockerVersion: '',
            OperatingSystem: '',
            NodeIP: '',
            Labels: {},
            ComputerEnvironment: '',
            Image: '',
            ImageTag: '',
            DiskData: {}
        };
        let interpretedResponse: IPropertyPanelInterpretedResponse = { type, data };

        const diskColumns: number[] = [
            NodePropertyPanelKustoResponseColumnMap.Device,
            NodePropertyPanelKustoResponseColumnMap.Path,
            NodePropertyPanelKustoResponseColumnMap.DiskMetricName,
            NodePropertyPanelKustoResponseColumnMap.DiskMetricValue
        ];
        // Copy over the data in the Kusto response object into the interpreted response object
        for (let i = 0; i < firstResponseRow.length; i++) {
            if (findIndex(diskColumns, (column: number) => i === column) !== -1) { // Skip these columns
                continue;
            }
            let column: any = responseCols[i];
            if (!column) {
                throw new Error('Mismatch between Kusto response row and column objects');
            }
            let columnName: string = column.ColumnName;
            let rowData = firstResponseRow[NodePropertyPanelKustoResponseColumnMap[columnName]];
            if (StringHelpers.isNullOrEmpty(rowData)) {
                rowData = DisplayStrings.PropertyPanelEmptyPropertyString;
            }
            data[columnName] = rowData;
        }

        // Extract disk data from Kusto response rows and pack it nice and tight in an object
        data.DiskData = DiskMetricsInterpreter.getDiskDataObject(responseRows);

        // Reprocess labels
        let labelsJSON = firstResponseRow[NodePropertyPanelKustoResponseColumnMap.Labels];
        if (String.IsNullOrWhiteSpace(labelsJSON)) {
            labelsJSON = '[{}]';
        }
        const labels = JSON.parse(labelsJSON)[0];
        const labelsKey = responseCols[NodePropertyPanelKustoResponseColumnMap.Labels].ColumnName;
        data[labelsKey] = labels;

        // Creation of the container live event logs link requires info from the row meta data
        const metaData: IMetaDataBase = row.columnData[0].metaData; // TODO: null, undefined, safety checks
        Object.defineProperty(data, 'metaData', { value: metaData, enumerable: false });

        return interpretedResponse;
    }



    /**
     * Converts utc time to local time in the format, 'dddd, MMMM Do YYYY, h:mm:ss a'
     * @param time time
     */
    private static convertTimetoLocal(time: string): string {
        return new Date(time).toLocaleString();
    }
}
