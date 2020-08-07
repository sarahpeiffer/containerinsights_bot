import { ICommonTabProps } from '../shared/ICommonTabProps';
import { IWorkspaceInfo } from '../shared/IWorkspaceInfo';
import { ComputerGroup } from '../shared/ComputerGroup';
import { IResourceInfo, VmInsightsResourceType } from './shared/ResourceInfo';
import { SolutionType } from './shared/ControlPanelUtility';

export interface ICommonComputeTabProps extends ICommonTabProps {
    workspace: IWorkspaceInfo;

    computerGroup: ComputerGroup;

    /**
     * If the selected scope is Azure resource then this value must be specified.
     */
    azureResourceInfo: IResourceInfo;

    azureResourceType: VmInsightsResourceType;

    solutionType: SolutionType;
    isDefaultExperienceOfBlade: boolean;
}
