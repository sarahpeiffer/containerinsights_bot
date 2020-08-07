import * as React from 'react';
import { ComboBoxHeader, DropdownWithLinks, DropdownMessage, DropdownOption, DropdownDivider } from 'appinsights-iframe-shared';

/** Local */
import { WorkbookHelper, IWorkbookParams } from '../workbooks/WorkbookHelper';
import { IWorkbookCategory, IWorkbookTemplate, WorkbookTemplates } from './WorkbookTemplates';
import { WorkbookTemplateId } from '../workbooks/WorkbookIndex';

/** Shared */
import { ITelemetry } from '../Telemetry';
import { DisplayStrings } from '../DisplayStrings';
import { WorkbookGallerySvg } from '../svg/workbook-gallery';
import { LinkSVG } from '../svg/Link';
import { IMessagingProvider } from '../MessagingProvider';

export interface IWorkbooksDropdownProps {
    // the categories (and their workbooks) that will show up in the dropwdown
    workbookCategories: IWorkbookCategory[],
    // by default, workspaceId. Otherwise, use the resource of whatever resource your workbook is targeting
    componentId: string,
    // the resource the workbook will target
    resourceIds?: string[]
    // map of parameter names and values passed to workbooks
    notebookParams?: any, 
    // messages portal for navigating to workbooks
    messagingProvider: IMessagingProvider,
    // customizes onNavigate telemetry
    logPrefix: string,
    telemetry: ITelemetry
}

export class WorkbooksDropdown extends React.Component<IWorkbooksDropdownProps> {
    constructor(props: IWorkbooksDropdownProps) {
        super(props);

        this.goToWorkbook = this.goToWorkbook.bind(this);
    }

    public render(): JSX.Element {
        const comboBoxHeader: JSX.Element = <ComboBoxHeader displayName={DisplayStrings.ViewWorkbooks} icon={<WorkbookGallerySvg />} />;
        const wrapperClassName: string = 'combobox-dropdown-wrapper';
        const workbookDropdownOptions: DropdownOption[] = this.getWorkbooksDropdown(this.props.workbookCategories);

        return workbookDropdownOptions.length > 0 ? <div className='workbooks-dropdown'>
            <DropdownWithLinks
                header={comboBoxHeader}
                wrapperClassName={wrapperClassName}
                flyoutClassName={'dropdown-flyout right-flyout-direction'}
                options={workbookDropdownOptions}
                onChange={this.goToWorkbook}
                label={DisplayStrings.ViewWorkbooks}
                role={'combobox'}
                messageService={this.props.messagingProvider.getAppInsightsProvider()}
            />
        </div> : null;
    }

    /**
     * Builds the 'navigate to workbooks' message that will be sent to the portal for processing
     * @param selected workbook selected in the dropdown
     */
    private goToWorkbook(selected: DropdownOption): void {
        const workbookTemplate: IWorkbookTemplate = WorkbookTemplates.GetWorkbookTemplate(selected.id);

        const workbookParams: IWorkbookParams = {
            configurationId: workbookTemplate.TemplatePath,
            workbookTemplateName: workbookTemplate.DisplayName,
            componentId: this.props.componentId,
            resourceIds: this.props.resourceIds,
            timeContext: this.props.notebookParams.timeContext,
            notebookParams: this.props.notebookParams,
            type: workbookTemplate.WorkbookType,
            galleryResourceType: workbookTemplate.GalleryType,
            source: `${this.props.logPrefix}.onNavigateToWorkbook.${selected.id}`,
            viewerMode: workbookTemplate.ViewerMode,
            newNotebookData: workbookTemplate.NewNotebookData
        };

        WorkbookHelper.sendOpenWorkbookMessage(
            workbookParams, 
            this.props.messagingProvider, 
            this.props.telemetry,
            workbookTemplate.TelemetryId
        );
    }

    private getWorkbooksDropdown(workbookCategories: IWorkbookCategory[]): DropdownOption[] {
        let workbookOptions: DropdownOption[] = [];

        for (const workbookCategory of workbookCategories) {
            const workbookTemplates: IWorkbookTemplate[] = workbookCategory.WorkbookTemplates;
            const optionDivider: DropdownDivider = new DropdownDivider(workbookCategory.CategoryId, workbookCategory.DisplayName, null);
            workbookOptions.push(optionDivider);

            if (workbookTemplates.length > 0) {
                for (const workbookTemplate of workbookTemplates) {
                    let icon: JSX.Element = <WorkbookGallerySvg />;
                    if (workbookTemplate.TemplateId === WorkbookTemplateId.WorkspaceWorkbookGallery
                        || workbookTemplate.TemplateId === WorkbookTemplateId.VirtualMachineWorkbookGallery) {
                        icon = <LinkSVG />;
                    }
                    const workbookOption: DropdownMessage = new DropdownMessage(
                        workbookTemplate.TemplateId, 
                        workbookTemplate.DisplayName, 
                        'openWorkbookAction', 
                        {}, 
                        icon
                    );
                    workbookOptions.push(workbookOption);
                }
            }
        }

        return workbookOptions;
    }
}
