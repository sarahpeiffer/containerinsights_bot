/** tpl */
import * as React from 'react';

/** local */
import { ActionBarButton } from './ActionBarButton';
import { ActionBarLink } from './ActionBarLink';
import { ActionBarDivider } from './ActionBarDivider';

/** styles */
import '../../../styles/container/ActionBar';

/** shared */
import { FeedbackDropdown } from '../../shared/FeedbackDropdown';
import { IMessagingProvider } from '../../shared/MessagingProvider';
import { WorkbooksDropdown } from '../../shared/workbooks/WorkbooksDropdown';
import { IWorkbookNotebookParams } from '../control-panel/ContainerControlPanel';
import { IWorkbookCategory, WorkbookTemplates } from '../../shared/workbooks/WorkbookTemplates';
import * as TelemetryStrings from '../../shared/TelemetryStrings';
import { ITelemetry } from '../../shared/Telemetry';
import { BladeContext } from '../BladeContext';
import { ContainerControlPanelSelections } from '../control-panel/ContainerControlPanelSelections';
import { WorkbookHelper, ITimeRange } from '../../shared/workbooks/WorkbookHelper';
import { DropdownWithLinks, ComboBoxHeader, DropdownOption } from 'appinsights-iframe-shared';
import { DisplayStrings } from '../../shared/DisplayStrings';
import { ClusterType } from '../../multicluster/metadata/IManagedCluster';

// svg
import { HelpSvg } from '../../shared/svg/help';

export interface IActionItemGroup {
    items: IActionItem[];
}

export interface IActionItem {
    svg: JSX.Element;
    text: string;
    action: () => void,
    actionType: ActionItemType,
    actionGroup: ActionGroup,
    isDisabled?: boolean
}

export enum ActionItemType {
    Button,
    Link
}

export enum ActionGroup {
    One,
    Two
}

/** ActionBar props */
export interface IActionBarProps {
    /** an array of objects that can be converted to action bar buttons */
    actionItems: IActionItem[];
    /** temporary prop for generating the feedback dropdown action bar component */
    messagingProvider: IMessagingProvider;
    // show workbooks
    isSingleClusterPage: boolean;
    // help dropdown options
    helpDropdownoptions: DropdownOption[];
    // workbooks drop down hack
    wokbooksDropwonTimeOptions?: ITimeRange;
    // Telemetry provider
    telemetry?: ITelemetry;
}

/** ActionBar state */
interface IActionBarState { }

/** Houses the action buttons (refresh, monitor RG) for the CI page */
export class ActionBar extends React.Component<IActionBarProps, IActionBarState> {
    constructor(props) {
        super(props);
    }

    public render() {
        // nib: hard-coded logic until we complete the task of converting this dropdown into a button that opens a feedback context blade
        // https://msazure.visualstudio.com/InfrastructureInsights/_workitems/edit/5477439​​​​​​​​​​​​​​ - Re-factor task
        let feedbackDropdown: JSX.Element =
            <>
                <div className='item'>
                    <FeedbackDropdown
                        messageProvider={this.props.messagingProvider}
                    />
                </div>
            </>;

        const comboBoxHeader = <ComboBoxHeader displayName={DisplayStrings.containerActionBarHelpText} icon={<HelpSvg />} />

        let helpLinksDropdown: JSX.Element =
            <>
                <div className='item'>
                    <DropdownWithLinks
                        header={comboBoxHeader}
                        wrapperClassName={'combobox-dropdown-wrapper'}
                        flyoutClassName={'dropdown-flyout right-flyout-direction'}
                        options={this.props.helpDropdownoptions}
                        onChange={this.gotHelpLink.bind(this)}
                        label={DisplayStrings.containerActionBarHelpText}
                        role={'combobox'}
                        messageService={this.props.messagingProvider.getAppInsightsProvider()}
                    />
                </div>
            </>;

        return (
            <div className='action-bar'>
                <div className='item-list'>
                    {this.generateActionBarComponents(this.props.actionItems)}
                    <ActionBarDivider />
                    {this.props.isSingleClusterPage ? this.renderWorkbooksDropdown(this.props.wokbooksDropwonTimeOptions) : ''}
                    {helpLinksDropdown}
                    {feedbackDropdown}
                </div>
            </div>
        );
    }

    private gotHelpLink(selected: DropdownOption): void {
        if (this.props.telemetry) {
            // P.S. aka.ms links have their own telemetry
            this.props.telemetry.logNavigationEvent('HelpDropdown', selected.id);
        }
        window.open(selected.id);
    }

    /**
     * Generates parameters that can be passed into workbooks
     */
    private generateNotebookParams(wokbooksDropwonTimeOptions: ITimeRange): IWorkbookNotebookParams {
        const bladeContext = BladeContext.instance();
        const defaultControlPanelSelections = ContainerControlPanelSelections.getDefaultSelections();

        let timeRange: ITimeRange = wokbooksDropwonTimeOptions;
        if (timeRange === null || timeRange === undefined) {
            timeRange = WorkbookHelper.convertCITimeStateToTimeRange(
                defaultControlPanelSelections.startDateTimeUtc,
                defaultControlPanelSelections.endDateTimeUtc,
                defaultControlPanelSelections.isTimeRelative,
                defaultControlPanelSelections.timeRangeSeconds
            );
        }

        return {
            timeRange,
            workspaceId: bladeContext.workspace.resourceId,
            clusterId: bladeContext.cluster.resourceId,
            subscriptionId: bladeContext.cluster.subscriptionId
        }
    }

    private renderWorkbooksDropdown(wokbooksDropwonTimeOptions: ITimeRange): JSX.Element {
        const bladeContext = BladeContext.instance();

        // Generate workbook dropdown parameters
        const notebookParams: IWorkbookNotebookParams = this.generateNotebookParams(wokbooksDropwonTimeOptions);
        let workbookCategories: IWorkbookCategory[] = WorkbookTemplates.AKSClusterCategoryList;
        let logPrefix: string = TelemetryStrings.workbookLogPrefixAKSCluster;

        //gangams- TBD --find out how to use AKS like workbooks for other managed clusters like ARO, Arc
        if (bladeContext.cluster.clusterType !== ClusterType.AKS) {
            workbookCategories = WorkbookTemplates.AKSEngineClusterCategoryList;
            logPrefix = TelemetryStrings.workbookLogPrefixAKSEngineCluster;
        }
     
        return (
            <div className='item workbooks-dropdown-container'>
                <WorkbooksDropdown
                    workbookCategories={workbookCategories}
                    componentId={bladeContext.workspace.resourceId}
                    notebookParams={notebookParams}
                    logPrefix={logPrefix}
                    messagingProvider={this.props.messagingProvider}
                    telemetry={this.props.telemetry}
                />
            </div>
        );  
    }

    private generateActionBarComponents(actionItems: IActionItem[]): JSX.Element[] {
        let actionItemGroups = this.putActionItemsIntoActionGroups(actionItems);
        let actionBarComponents: JSX.Element[] = [];

        for (let actionItemGroup of actionItemGroups) {
            for (let actionItem of actionItemGroup.items) {
                let actionBarComponent: JSX.Element;
                if (actionItem.actionType === ActionItemType.Button) {
                    actionBarComponent = <ActionBarButton actionItem={actionItem} />;
                } else if (actionItem.actionType === ActionItemType.Link) {
                    actionBarComponent = <ActionBarLink actionItem={actionItem} />;
                } else {
                    throw new Error('Action item action type is unsupported');
                }
                actionBarComponents.push(actionBarComponent);
            }
            if (actionItemGroup !== actionItemGroups[actionItemGroups.length - 1]) { // Don't put a divider after the last action item group
                actionBarComponents.push(<ActionBarDivider />);
            }
        }

        return actionBarComponents;
    }

    private putActionItemsIntoActionGroups(actionItems: IActionItem[]) {
        let actionItemGroups: IActionItemGroup[] = [];
        let actionItemGroupsDictionary: StringMap<IActionItemGroup> = {};

        actionItems.forEach((actionItem: IActionItem) => {
            let actionItemGroupId = actionItem.actionGroup;
            if (!(actionItemGroupId in actionItemGroupsDictionary)) {
                actionItemGroupsDictionary[actionItemGroupId] = { items: [actionItem] };
            } else {
                actionItemGroupsDictionary[actionItemGroupId].items.push(actionItem);
            }
        });

        for (let actionItemGroup in actionItemGroupsDictionary) {
            if (actionItemGroupsDictionary.hasOwnProperty(actionItemGroup)) {
                actionItemGroups.push(actionItemGroupsDictionary[actionItemGroup]);
            }
        }

        return actionItemGroups;
    }
}
