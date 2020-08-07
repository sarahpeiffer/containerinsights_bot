import * as React from 'react';
import { ComboBoxHeader, DropdownWithLinks, DropdownMessage, DropdownOption, DropdownDivider } from 'appinsights-iframe-shared';

/**
 * Local
 */
import { WorkbookConstant, WorkbookHelper } from '../WorkbookHelper';
import { IWorkbookCategory, IWorkbookTemplate, WorkbookTemplates } from '../WorkbookTemplates';
import { WorkbookTemplateId } from '../workbooks/WorkbookIndex';

/**
 * Shared
 */
import { ITelemetry } from '../../../shared/Telemetry';
import { DisplayStrings } from '../../../shared/DisplayStrings';
import { MessagingProvider } from '../../../shared/MessagingProvider';
import { WorkbookGallerySvg } from '../../../shared/svg/workbook-gallery';
import { LinkSVG } from '../../../shared/svg/Link';

export interface IWorkbooksDropdownProperties {
    messagingProvider: MessagingProvider,
    logPrefix: string,
    telemetry: ITelemetry,
    workbookCategories: IWorkbookCategory[]
    /**
     * TODO ak: remove this in order to simplify logic, use `resourceIds`
     *
     * @deprecated
     * @type {string}
     * @memberof IWorkbooksDropdownProperties
     */
    resourceId?: string;
    componentId?: string;
    workspaceId?: string;
    resourceIds?: string[];
    location?: string;
}

export class WorkbooksDropdown extends React.Component<IWorkbooksDropdownProperties> {
    constructor(props: IWorkbooksDropdownProperties) {
        super(props);

        this.goToWorkbook = this.goToWorkbook.bind(this);
        this.showWorkbookDropdown = this.showWorkbookDropdown.bind(this);
    }

    public render(): JSX.Element {
        const comboBoxHeader: JSX.Element = <ComboBoxHeader displayName={DisplayStrings.ViewWorkbooks} icon={<WorkbookGallerySvg />} />;
        const wrapperClassName: string = 'combobox-dropdown-wrapper';
        const workbookDropdownOptions: DropdownOption[] = this.getWorkbooksDropdown(this.props.workbookCategories);

        return this.showWorkbookDropdown(workbookDropdownOptions) ? <div className='workbooks-dropdown'>
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

    private showWorkbookDropdown(workbookDropdownOptions: DropdownOption[]): boolean {
        return workbookDropdownOptions.length > 0 && !!this.props.resourceId;
    }

    private goToWorkbook(selected: DropdownOption): void {
        const sourceName: string = `${this.props.logPrefix}.onNavigateToWorkbook.${selected.id}`;
        const workbookTemplate: IWorkbookTemplate = WorkbookTemplates.GetWorkbookTemplate(selected.id);

        const params: StringMap<any> = {};
        params[WorkbookConstant.template] = workbookTemplate.TemplatePath;
        params[WorkbookConstant.source] = sourceName;
        params[WorkbookConstant.templateName] = workbookTemplate.DisplayName;
        params[WorkbookConstant.componentId] = this.props.componentId ? this.props.componentId :
            (this.props.resourceId ? this.props.resourceId : this.props.workspaceId);

        params[WorkbookConstant.resourceIds] = this.props.resourceIds || [this.props.resourceId];
        if (this.props.resourceIds?.indexOf(this.props.resourceId) < 0) {
            params[WorkbookConstant.resourceIds].push(this.props.resourceId);
        }

        if (this.props.location) {
            params[WorkbookConstant.location] = this.props.location;
        }

        WorkbookHelper.SendOpenWorkbookMessage(params, workbookTemplate,
            {messagingProvider: this.props.messagingProvider, telemetry: this.props.telemetry});
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
                    if (workbookTemplate.TemplateId === WorkbookTemplateId.AtScaleVmInsightsGallery
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
