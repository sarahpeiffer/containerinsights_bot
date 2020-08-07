import { IWorkspaceInfo } from '../../../../shared/IWorkspaceInfo';
import { ComputerGroup } from '../../../../shared/ComputerGroup';
import { TimeInterval } from '../../../../shared/data-provider/TimeInterval';
import { IKustoQueryOptions } from '../../../../shared/data-provider/KustoDataProvider';

export interface IPropertiesPanelQueryParams {
    workspace?: IWorkspaceInfo;
    resourceId?: string;
    computerName?: string;
    computerGroup?: ComputerGroup;
    timeInterval?: TimeInterval;
    kustoQueryOptions?: IKustoQueryOptions;
    agentId?: string
}
