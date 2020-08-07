import * as React from 'react';
import { TooltipService, InfoSvg } from 'appinsights-iframe-shared';

import { IWorkspaceInfo } from '../../shared/IWorkspaceInfo';
import { WorkspaceListManager } from '../../shared/WorkspaceListManager';
import { ITelemetry } from '../../shared/Telemetry';
import { ErrorSeverity } from '../../shared/data-provider/TelemetryErrorSeverity';
import { ICommonComputeTabProps } from '../ICommonComputeTabProps';
import { SolutionType } from './ControlPanelUtility';
import { VmInsightsResourceType, IResourceInfo, IAzureResourceDescriptor } from './ResourceInfo';
import { ISubscriptionInfo } from '../../shared/ISubscriptionInfo';
import { StringHelpers } from '../../shared/Utilities/StringHelpers';
import { ResourceInfo } from './ResourceInfo';

export interface IDefaultAzureScopeSelection {
    selectedResourceGroup: IResourceInfo;
    selectedSubscription: ISubscriptionInfo;
    selectedResourceType: string;
    selectedResource: IResourceInfo;
    // ak: just copying this over from wlm, doesn't seem to be used
    selectedResourceWorkspaceList?: IWorkspaceInfo[];
}

/**
 * @param workspaceManager workspace manager to sync with
 * @param workspaceList cached workspace list first, might be empty, might be rot, but newly list will come
 * @param selectedWorkspace cached selected workspace. might be null, might be rot. we should autoSelect
 * @param isLoaded flag to indicate if newly workspace list ready
 * @param errors
 * @param telemetry
 * @param parentTelemetrySource
 */
export interface ISyncLocalWorkspaceManagerParams {
    workspaceManager: WorkspaceListManager;
    workspaceList: any[];
    selectedWorkspace: IWorkspaceInfo;
    isLoaded: any;
    telemetry: ITelemetry;
    parentTelemetrySource: string;
}

export const defaultVmssInstance: ResourceInfo = new ResourceInfo({
    id: 'all',
    displayName: 'All',
    location: 'all',
    type: VmInsightsResourceType.VmScaleSetInstance,
    fqdn: 'All'
});

export const defaultResourceGroupInfo: ResourceInfo = new ResourceInfo({
    id: 'all',
    displayName: 'All',
    location: 'all',
    type: VmInsightsResourceType.ResourceGroup,
    fqdn: 'All'
});

export class AtScaleUtils {
    /**
     * Returns a workpace object in the two occasions when we should try to use it to set the state
     * of the component initially: the first time when isLoaded is false and a second time when isLoaded is true
     *
     * @returns a Workspace object in two occasions:
     *  - The first call with isLoaded false
     *  - A second time when isLoaded is true
     */
    public static syncLocalWorkspaceManager(params: ISyncLocalWorkspaceManagerParams): IWorkspaceInfo {
        if (!params.workspaceManager) {
            throw 'invalid page state, no workspace manager present';
        }

        if (!params.workspaceList || params.workspaceList.length === 0) {
            return params.selectedWorkspace;
        }
        const source: string = params.parentTelemetrySource + '.syncLocalworkspaceManager';

        if (params.selectedWorkspace && !(params.selectedWorkspace.id || !params.selectedWorkspace.name)) {
            params.telemetry.logException('workspace must have id and name', source, ErrorSeverity.Error, {}, {});
            params.selectedWorkspace = null;
        }

        // Update the workspace list with the one we just received
        const refreshRequired: boolean = params.workspaceManager.modifyWorkspaceList(params.workspaceList, params.isLoaded);

        if (params.isLoaded) {
            if (!refreshRequired) {
                return null;
            }

            // Once isLoaded is true, we pass force = true
            params.workspaceManager.setSelectedWorkspace(params.selectedWorkspace, true);
        } else if (!params.workspaceManager.setSelectedWorkspace(params.selectedWorkspace)) {
            // Not passing the force argument to setSelectedWorkspace will
            // cause it to return true only the first time we are calling it
            return null;
        }

        let actualSelection = params.workspaceManager.getSelectedWorkspace();
        if (params?.selectedWorkspace?.id?.toLowerCase() !== actualSelection?.id?.toLowerCase()) {
            params.telemetry.logException(`workspace '${params?.selectedWorkspace?.id}' not found`, source, ErrorSeverity.Error, {}, {});
        }

        return actualSelection;
    }

    /**
     * Returns tooltip icon that shows description upon hover
     *
     * @static
     * @param {string} description
     * @returns {JSX.Element}
     * @memberof AtScaleUtils
     */
    public static CreateInfoTooltipElement(description: string): JSX.Element {
        let infoTooltipElementWrapper: JSX.Element = null;
        if (description) {
            let infoTooltipDOMElement = null;
            let infoTooltipProps = {};
            TooltipService.registerTooltipForElement(
                infoTooltipProps,
                () => infoTooltipDOMElement,
                description
            );
            const infoTooltipElement: JSX.Element = <div {...infoTooltipProps} className='grid-tooltip'
                ref={(r) => infoTooltipDOMElement = r}><InfoSvg /></div>;

            infoTooltipElementWrapper = <div className='grid-tooltip-wrapper'
                onClick={(e) => { e.stopPropagation(); }}>{infoTooltipElement}</div>;
        }
        return infoTooltipElementWrapper;
    }

    public static getAzureResourceId(props: ICommonComputeTabProps): string {
        return (props.solutionType === SolutionType.Azure
            && props.azureResourceInfo && props.azureResourceInfo.id)
    }

    public static getAzureResourceType(vmInsightsResourceType: VmInsightsResourceType): string {
        let resourceType: string = '';
        switch (vmInsightsResourceType) {
            case VmInsightsResourceType.VirtualMachine:
                resourceType = '/providers/Microsoft.Compute/virtualMachines/';
                break;
            case VmInsightsResourceType.VirtualMachineScaleSet:
                resourceType = '/providers/Microsoft.Compute/virtualMachineScaleSets/';
                break;
            case VmInsightsResourceType.AzureArcMachine:
                resourceType = '/providers/Microsoft.HybridCompute/machines/';
                break;
            default:
                resourceType = '';
                break;
        }

        return resourceType;
    }


    // If solutionType is azure but there is no selected resource then return.
    // If solutionType is hybrid but there is no selected workspace then return.
    public static validatePropsToQueryData(props: ICommonComputeTabProps): boolean {
        return (props.solutionType === SolutionType.Hybrid && !!props.workspace)
            || (props.solutionType === SolutionType.Azure && !!props.azureResourceInfo);
    }

    // TODO bb: This equal util methods should be implemeted by WorkspaceInfo class.
    public static areWorkspacesEqual(w1: IWorkspaceInfo, w2: IWorkspaceInfo): boolean {
        if ((!w1 && w2) || (w1 && !w2)) {
            return false;
        }
        if (!w1 && !w2) {
            return true;
        }
        if (!w1.id || !w2.id) {
            return false;
        }
        return w1.id.toUpperCase() === w2.id.toUpperCase();
    }

    public static areAzureResourcesEqual(resource1: IResourceInfo, resource2: IResourceInfo): boolean {
        if ((!resource1 && resource2) || (resource1 && !resource2)) {
            return false;
        }
        if (!resource1 && !resource2) {
            return true;
        }
        if (!resource1.id || !resource2.id) {
            return false;
        }
        return resource1.id.toUpperCase() === resource2.id.toUpperCase();
    }

    /**
     * Get the azure resource as subscription if there is no resourceGroup selected. Otherwise get the selected azure resource
     * as selected resource group.
     */
    public static getSelectedAzureResource(selectedSubscription: ISubscriptionInfo, selectedResourceGroup: ResourceInfo): ResourceInfo {
        if (!selectedSubscription) {
            return undefined;
        }
        let selectedAzureResource: ResourceInfo;
        if (!selectedResourceGroup || selectedResourceGroup.id === 'all') {
            selectedAzureResource = new ResourceInfo({
                id: selectedSubscription.subscriptionId,
                displayName: selectedSubscription.displayName,
                type: VmInsightsResourceType.Subscription
            });
        } else {
            selectedAzureResource = selectedResourceGroup;
        }
        return selectedAzureResource;
    }

    public static getSolutionTypeEnum(solutionType: string): SolutionType {
        return solutionType === 'azure' ? SolutionType.Azure : SolutionType.Hybrid;
    }

    /**
     * Checks if the given resourceId is of a compute resourceId and returns descriptor
     * @param resourceId 
     */
    public static getAzureComputeResourceDescriptor(resourceId: string): IAzureResourceDescriptor | null {
        if (StringHelpers.isNullOrEmpty(resourceId)) {
            return null;
        }

        const vmOrVmssRegex: RegExp = new RegExp(['^\/subscriptions\/(.*)\/resourcegroups\/(.*)\/providers\/microsoft.compute\/',
            '([a-zA-Z0-9-]*)\/([a-zA-Z0-9-]*)$'].join(''), 'i');
        const vmssInstanceRegex: RegExp = new RegExp(['^\/subscriptions\/(.*)\/resourcegroups\/(.*)\/providers\/microsoft.compute\/',
            'virtualmachinescalesets\/([a-zA-Z0-9-]*)\/virtualmachines\/([a-zA-Z0-9-]*)$'].join(''), 'i');
        const subscriptionRegex: RegExp = /^\/subscriptions\/([a-zA-Z0-9-]*)$/i;
        const resourceGroupRegex: RegExp = /^\/subscriptions\/([a-zA-Z0-9-]*)\/resourcegroups\/([a-zA-Z0-9-]*)$/i;
        const hybridRpRegex: RegExp = new RegExp(['^\/subscriptions\/(.*)\/resourcegroups\/(.*)\/providers\/microsoft.hybridcompute\/',
        'machines\/([a-zA-Z0-9-]*)$'].join(''), 'i');

        const vmOrVmssResult: RegExpMatchArray = resourceId.match(vmOrVmssRegex);
        if (vmOrVmssResult) {
            return {
                subscription: vmOrVmssResult[1],
                resourceGroup: vmOrVmssResult[2],
                type: `microsoft.compute/${vmOrVmssResult[3]}`,
                resources: [vmOrVmssResult[4]],
                resourceId
            };
        }

        const vmssInstanceResult: RegExpMatchArray = resourceId.match(vmssInstanceRegex);
        if (vmssInstanceResult) {
            return {
                subscription: vmssInstanceResult[1],
                resourceGroup: vmssInstanceResult[2],
                type: 'microsoft.compute/virtualmachinescalesets/virtualmachines',
                resources: [vmssInstanceResult[3], vmssInstanceResult[4]],
                resourceId: resourceId
            };
        }

        const subscriptionResult: RegExpMatchArray = resourceId.match(subscriptionRegex);
        if (subscriptionResult) {
            return {
                subscription: subscriptionResult[1],
                resourceId: resourceId
            };
        }

        const resourceGroupResult: RegExpMatchArray = resourceId.match(resourceGroupRegex);
        if (resourceGroupResult) {
            return {
                resourceId: resourceId,
                subscription: resourceGroupResult[1],
                resourceGroup: resourceGroupResult[2]
            }
        }

        const hybridRpResult: RegExpMatchArray = resourceId.match(hybridRpRegex);
        if (hybridRpResult) {
            return {
                resourceId: resourceId,
                subscription: hybridRpResult[1],
                resourceGroup: hybridRpResult[2],
                type: 'microsoft.hybridcompute',
                resources: [hybridRpResult[3]]
            }
        }

        return null;
    }

    /**
     * Get Subscription ID (not GUID) from an ARM ID
     *
     * @static
     * @param {string} resourceId
     * @returns {(string | undefined)}
     * @memberof AtScaleUtils
     */
    public static getSubscriptionId(resourceId: string): string | undefined {
        const subscriptionRegex: RegExp = /^\/subscriptions\/([a-zA-Z0-9-]*)/i;
        const subscriptionResult: RegExpMatchArray = resourceId.match(subscriptionRegex);
        return subscriptionResult?.[0];
    }

    /**
     * Get Resource Group ID from an ARM ID
     *
     * @static
     * @param {string} resourceId
     * @returns {(string | undefined)}
     * @memberof AtScaleUtils
     */
    public static getResourceGroupId(resourceId: string): string | undefined {
        const resourceGroupRegex: RegExp = /^\/subscriptions\/([a-zA-Z0-9-]*)\/resourcegroups\/([a-zA-Z0-9-]*)/i;
        const resourceGroupResult: RegExpMatchArray = resourceId.match(resourceGroupRegex);
        return resourceGroupResult?.[0];
    }


    /**
     *
     * To check if the Azure resource is Azure Arc.
     * 
     * @static
     * @param {string} resourceId
     * @returns {boolean}
     * @memberof AtScaleUtils
     */
    public static isArcVirtualMachine(resourceId: string): boolean {
        return resourceId.toLowerCase().indexOf('/providers/microsoft.hybridcompute/') !== -1;
    }
}
