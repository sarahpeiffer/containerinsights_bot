import * as React from 'react';
import * as Constants from '../../Constants';

import { WorkbookTemplates, IWorkbookCategory } from '../WorkbookTemplates';
import { WorkbooksDropdown } from './WorkbooksDropdown';
import { MessagingProvider } from '../../../shared/MessagingProvider';
import { ITelemetry } from '../../../shared/Telemetry';
import { IWorkspaceInfo } from '../../../shared/IWorkspaceInfo';
import { DisplayStrings } from '../../../shared/DisplayStrings';
import { SwitchToggle } from '../SwitchToggle';
import { SolutionType } from '../ControlPanelUtility';
import { GalleryTypes } from '../workbooks/WorkbookIndex';
import { ISubscriptionInfo } from '../../../shared/ISubscriptionInfo';
import { ResourceInfo, VmInsightsResourceType } from '../ResourceInfo';
import { AtScaleUtils } from '../AtScaleUtils';

import '../../../../styles/shared/ControlPanel.less';
import '../../../../styles/shared/SwitchToggle.less';
import { InfoTooltip } from '../InfoTooltip';

export interface IControlPanelCommandBarProperties {
    selectedWorkspace: IWorkspaceInfo;
    featureFlags: StringMap<boolean>;
    showWorkbookDropDown: boolean;
    showSwitchToggle: boolean;
    vmScaleSetResourceId?: string;
    messagingProvider: MessagingProvider;
    telemetry: ITelemetry;
    logPrefix: string;
    /**
     * TODO ak: this needs to be replaced by an array of resources to pass into the workbook
     *
     * @deprecated
     * @type {string}
     * @memberof IControlPanelCommandBarProperties
     */
    resourceId: string;
    solutionType: string;
    onSolutionTypeChanged: (solutionType: string) => void;
    subscriptionInfo?: ISubscriptionInfo;
    resourceGroupInfo?: ResourceInfo;
    workspaceId?: string;
}

export class ControlPanelCommandBar extends React.Component<IControlPanelCommandBarProperties, any> {

    constructor(props: IControlPanelCommandBarProperties) {
        super(props);
        this.onSolutionTypeChanged = this.onSolutionTypeChanged.bind(this);
    }

    public render(): JSX.Element {
        return <div className='control-panel-commands'>
            <div className='control-panel-command'>{this.props.showWorkbookDropDown && this.renderWorkbook()}</div>
            <div className='control-panel-command'>{this.props.showSwitchToggle && this.renderSolutionType()}</div>
            <div className='control-panel-command'>{this.props.showSwitchToggle && this.getToggleButtonInfoBox()}</div>
        </div>
    }

    private renderWorkbook(): JSX.Element {
        let workbooksCategoryList: IWorkbookCategory[];
        if (this.props.solutionType === 'azure') {
            if (this.props.featureFlags['devWorkbooks']) {
                workbooksCategoryList = WorkbookTemplates.AtScaleDevCategoryList;
            } else {
                workbooksCategoryList = WorkbookTemplates.AtScaleAzureModeCategoryList;
            }
        } else {
            workbooksCategoryList = this.props.vmScaleSetResourceId
                ? WorkbookTemplates.VmssCategoryList
                : WorkbookTemplates.AtScaleCategoryList;
            if (this.props.featureFlags[Constants.FeatureMap.enableInsightsMetricsQuery]) {
                workbooksCategoryList = this.props.vmScaleSetResourceId
                    ? WorkbookTemplates.VmssInsightsMetricsCategoryList
                    : WorkbookTemplates.AtScaleInsightsMetricsCategoryList;
            }
        }

        /**
         * Currently LA agent sometimes write wrong ResourceId - instead of 'virtualmachinescalesets' they put 'virtualmachines'
         * Since we query perf table and that is populated by LA agent, even that will have wrong resourceId
         * Because of this reason, we pass wrong(similar to LA) resource id from WLM
         * Hence adding a comment here to explain why we might have wrong resource id
         * This task: https://msazure.visualstudio.com/InfrastructureInsights/_workitems/edit/4563861 will take care of fixing resourceIds
         */
        let resourceId: string = undefined;
        if (this.props.vmScaleSetResourceId) {
            resourceId = this.props.vmScaleSetResourceId
                .toLowerCase()
                .replace('/providers/microsoft.computer/virtualmachines/', '/providers/microsoft.computer/virtualmachinescalesets/');
        } else if (this.props.resourceId) {
            resourceId = this.props.resourceId;
        }

        // ak: if not vmss, then set componentId to azure monitor
        const componentId: string = this.props.vmScaleSetResourceId ? undefined : GalleryTypes.azureMonitor;

        const resourceIds: string[] = [];
        if (this.props.subscriptionInfo) {
            resourceIds.push('/subscriptions/' + this.props.subscriptionInfo.subscriptionId);
        }

        let resourceGroupLocation: string;
        if (this.props.resourceGroupInfo?.type === VmInsightsResourceType.ResourceGroup
            && this.props.resourceGroupInfo?.id !== 'all') {
            resourceIds.push(this.props.resourceGroupInfo.id);
            resourceGroupLocation = this.props.resourceGroupInfo.location;
        }

        if (this.props.workspaceId) {
            resourceIds.push(this.props.workspaceId);

            const subscriptionId: string = AtScaleUtils.getSubscriptionId(this.props.workspaceId);
            resourceIds.push(subscriptionId);
        }

        return <WorkbooksDropdown
            messagingProvider={this.props.messagingProvider}
            logPrefix={this.props.logPrefix}
            workspaceId={this.props.selectedWorkspace && this.props.selectedWorkspace.id}
            telemetry={this.props.telemetry}
            workbookCategories={workbooksCategoryList}
            resourceId={resourceId}
            componentId={componentId}
            resourceIds={resourceIds}
            location={resourceGroupLocation}
        />
    }

    private renderSolutionType(): JSX.Element {
        return <SwitchToggle
            labelFalse={DisplayStrings.AzureSolutionType}
            labelTrue={DisplayStrings.HybridSolutionType}
            toggleState={this.getToggleState()}
            onClick={this.onSolutionTypeChanged}
            tooltipTrue={DisplayStrings.AzureSolutionTypeTooltip}
            tooltipFalse={DisplayStrings.HybridSolutionTypeTooltip}
        />;
    }

    private onSolutionTypeChanged(): void {
        if (!this.props.solutionType || !this.props.onSolutionTypeChanged) {
            return;
        }
        const newSolType: string = this.props.solutionType === SolutionType.Hybrid ? SolutionType.Azure : SolutionType.Hybrid;
        this.props.onSolutionTypeChanged(newSolType);
    }

    private getToggleState(): boolean {
        return this.props.solutionType === 'azure' ? false : true;
    }

    private getToggleButtonInfoBox() {
        return <InfoTooltip description={DisplayStrings.AzureSolutionTypeHelpText} />;
    }
}
