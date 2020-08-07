import { ICommonTabProps } from '../../shared/ICommonTabProps';
import { IWorkspaceInfo } from '../../shared/IWorkspaceInfo';

/**
 * Common set of properties for all tabs on container insights
 */
export interface ICommonContainerTabProps extends ICommonTabProps {
    startDateTimeUtc: Date;
    endDateTimeUtc: Date;
    workspace: IWorkspaceInfo;
    clusterName: string;
    clusterResourceId: string,
    nameSpace: string;
    serviceName: string;
    hostName: string;
    nodePool: string;
    controllerName: string;
    controllerKind: string;
    isTimeRelative: boolean;
    shouldApplyExactNameSearchFilterMatch?: boolean;
    nameSearchFilterValue?: string;
}
