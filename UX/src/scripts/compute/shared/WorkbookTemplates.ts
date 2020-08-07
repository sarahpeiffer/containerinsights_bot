/** Local */
import { Category } from './workbooks/Category';
import { Templates } from './workbooks/Templates';
import { WorkbookTemplateId, WorkbookCategoryId } from './workbooks/WorkbookIndex';

/**
 * Workbook template which is referenced by its TemplatePath. The GalleryType typically describes what kind of
 * Azure resource can view this particular workbook by default. The WorkbookType can be viewed as a 'folder'
 * of the Workbook. The TemplateId is used internally to reference to this particular workbook.
 *
 * @export
 * @interface IWorkbookTemplate
 */
export interface IWorkbookTemplate {
    TemplateId: string;
    GalleryType: string;
    WorkbookType: string;
    DisplayName: string;
    TemplatePath?: string;
    NewNotebookData?: string;
}

/**
 * Contains multiple workbook templates. CategoryId is only used internally to reference
 * this particular category.
 *
 * @export
 * @interface IWorkbookCategory
 */
export interface IWorkbookCategory {
    CategoryId: string;
    DisplayName: string;
    WorkbookTemplates: IWorkbookTemplate[];
}

/**
 * You can think of this as an uninstantiated workbook category before it becomes an actual
 * workbook category. There was no way to neatly pre-define workbook categories into a separate
 * file. So we use WorkbookDescriptors array and translate each of them into WorkbookTemplates
 * as IWorkbookCategory type.
 *
 * @export
 * @interface IWorkbookCategoryDescriptor
 */
export interface IWorkbookCategoryDescriptor {
    CategoryId: string;
    DisplayName: string;
    WorkbookDescriptors: WorkbookTemplateId[]
}

export class WorkbookTemplates {
    private static templateMap: Map<WorkbookTemplateId, IWorkbookCategory> = new Map();
    private static templateList: IWorkbookTemplate[] = [];

    private static atScaleTemplateCategoryMap: Map<WorkbookCategoryId, IWorkbookCategory> = new Map();
    private static atScaleTemplateCategoryList: IWorkbookCategory[] = [];

    private static atScaleInsightsMetricsTemplateCategoryMap: Map<WorkbookCategoryId, IWorkbookCategory> = new Map();
    private static atScaleInsightsMetricsTemplateCategoryList: IWorkbookCategory[] = [];

    private static atScaleAzureModeTemplateCategoryMap: Map<WorkbookCategoryId, IWorkbookCategory> = new Map();
    private static atScaleAzureModeTemplateCategoryList: IWorkbookCategory[] = [];

    private static atScaleDevTemplateCategoryMap: Map<WorkbookCategoryId, IWorkbookCategory> = new Map();
    private static atScaleDevTemplateCategoryList: IWorkbookCategory[] = [];

    private static singleVmTemplateCategoryMap: Map<WorkbookCategoryId, IWorkbookCategory> = new Map();
    private static singleVmTemplateCategoryList: IWorkbookCategory[] = [];

    private static singleVmInsightsMetricsTemplateCategoryMap: Map<WorkbookCategoryId, IWorkbookCategory> = new Map();
    private static singleVmInsightsMetricsTemplateCategoryList: IWorkbookCategory[] = [];

    private static vmssTemplateCategoryMap: Map<WorkbookCategoryId, IWorkbookCategory> = new Map();
    private static vmssTemplateCategoryList: IWorkbookCategory[] = [];

    private static vmssInsightsMetricsTemplateCategoryMap: Map<WorkbookCategoryId, IWorkbookCategory> = new Map();
    private static vmssInsightsMetricsTemplateCategoryList: IWorkbookCategory[] = [];

    static initialize() {
        Templates.initialize();
        Category.initialize();

        this.templateMap = new Map();
        this.templateList = [];

        this.atScaleTemplateCategoryMap = new Map();
        this.atScaleTemplateCategoryList = [];

        this.atScaleInsightsMetricsTemplateCategoryMap = new Map();
        this.atScaleInsightsMetricsTemplateCategoryList = [];

        this.atScaleAzureModeTemplateCategoryMap = new Map();
        this.atScaleAzureModeTemplateCategoryList = [];

        this.atScaleDevTemplateCategoryMap = new Map();
        this.atScaleDevTemplateCategoryList = [];

        this.singleVmTemplateCategoryMap = new Map();
        this.singleVmTemplateCategoryList = [];

        this.singleVmInsightsMetricsTemplateCategoryMap = new Map();
        this.singleVmInsightsMetricsTemplateCategoryList = [];

        this.vmssTemplateCategoryMap = new Map();
        this.vmssTemplateCategoryList = [];

        this.vmssInsightsMetricsTemplateCategoryMap = new Map();
        this.vmssInsightsMetricsTemplateCategoryList = [];

        this.initializeTemplates();

        this.initializeAtScaleCategories();
        this.initializeAtScaleInsightsMetricsCategories();
        this.initializeAtScaleAzureModeCategories();
        this.initializeAtScaleDevCategories();
        this.initializeSingleVmCategories();
        this.initializeSingleVmInsightsMetricsCategories();
        this.initializeVmssCategories();
        this.initializeVmssInsightsMetricsCategories();
    }

    public static GetWorkbookTemplate(templateId: string): IWorkbookTemplate {
        return WorkbookTemplates.templateMap[templateId];
    }

    public static get TemplateList(): IWorkbookTemplate[] {
        return WorkbookTemplates.templateList;
    }

    public static GetAtScaleCategory(categoryId: string): IWorkbookCategory {
        return WorkbookTemplates.atScaleTemplateCategoryMap[categoryId];
    }

    public static get AtScaleCategoryList(): IWorkbookCategory[] {
        return WorkbookTemplates.atScaleTemplateCategoryList;
    }

    public static get AtScaleInsightsMetricsCategoryList(): IWorkbookCategory[] {
        return WorkbookTemplates.atScaleInsightsMetricsTemplateCategoryList;
    }

    public static get AtScaleAzureModeCategoryList(): IWorkbookCategory[] {
        return WorkbookTemplates.atScaleAzureModeTemplateCategoryList;
    }

    public static get AtScaleDevCategoryList(): IWorkbookCategory[] {
        return WorkbookTemplates.atScaleDevTemplateCategoryList;
    }

    public static get SingleVmCategoryList(): IWorkbookCategory[] {
        return WorkbookTemplates.singleVmTemplateCategoryList;
    }

    public static get SingleVmInsightsMetricsCategoryList(): IWorkbookCategory[] {
        return WorkbookTemplates.singleVmInsightsMetricsTemplateCategoryList;
    }

    public static get VmssCategoryList(): IWorkbookCategory[] {
        return WorkbookTemplates.vmssTemplateCategoryList;
    }

    public static get VmssInsightsMetricsCategoryList(): IWorkbookCategory[] {
        return WorkbookTemplates.vmssInsightsMetricsTemplateCategoryList
    }

    private static initializeTemplates(): void {
        for (const workbookTemplate of Templates.Templates) {
            this.addTemplate(workbookTemplate);
        }
    }

    private static initializeAtScaleCategories(): void {
        for (const atScaleCategory of Category.AtScaleCategories) {
            this.addAtScaleCategory(atScaleCategory);
        }
    }

    private static initializeAtScaleInsightsMetricsCategories(): void {
        for (const atScaleInsightsMetricsCategory of Category.AtScaleInsightsMetricsCategories) {
            this.addAtScaleInsightsMetricsCategory(atScaleInsightsMetricsCategory)
        }
    }

    private static initializeAtScaleAzureModeCategories(): void {
        for (const atScaleAzureModeCategory of Category.AtScaleAzureModeCategories) {
            this.addAtScaleAzureModeCategory(atScaleAzureModeCategory)
        }
    }

    private static initializeAtScaleDevCategories(): void {
        for (const atScaleDevCategory of Category.AtScaleDevCategories) {
            this.addAtScaleDevCategory(atScaleDevCategory);
        }
    }

    private static initializeSingleVmCategories(): void {
        for (const singleVmCategory of Category.SingleVmCategories) {
            this.addSingleVmCategory(singleVmCategory);
        }
    }

    private static initializeSingleVmInsightsMetricsCategories(): void {
        for (const singleVmInsightsMetricsCategory of Category.SingleVmInsightsMetricsCategories) {
            this.addSingleVmInsightsMetricsCategory(singleVmInsightsMetricsCategory);
        }
    }

    private static initializeVmssCategories(): void {
        for (const vmssCategory of Category.VmssCategories) {
            this.addVmssCategory(vmssCategory);
        }
    }

    private static initializeVmssInsightsMetricsCategories(): void {
        for (const vmssInsightsMetricsCategory of Category.VmssInsightsMetricsCategories) {
            this.addVmssInsightsMetricsCategory(vmssInsightsMetricsCategory);
        }
    }

    private static addTemplate(newTemplate: IWorkbookTemplate): void {
        WorkbookTemplates.templateList.push(newTemplate);
        WorkbookTemplates.templateMap[newTemplate.TemplateId] = newTemplate;
    }

    private static addAtScaleCategory(newCategoryDescriptor: IWorkbookCategoryDescriptor): void {
        const newCategory: IWorkbookCategory = this.convertToWorkbookCategory(newCategoryDescriptor);
        WorkbookTemplates.atScaleTemplateCategoryList.push(newCategory);
        WorkbookTemplates.atScaleTemplateCategoryMap[newCategoryDescriptor.CategoryId] = newCategory;
    }

    private static addAtScaleInsightsMetricsCategory(newCategoryDescriptor: IWorkbookCategoryDescriptor): void {
        const newCategory: IWorkbookCategory = this.convertToWorkbookCategory(newCategoryDescriptor);
        WorkbookTemplates.atScaleInsightsMetricsTemplateCategoryList.push(newCategory);
        WorkbookTemplates.atScaleInsightsMetricsTemplateCategoryMap[newCategoryDescriptor.CategoryId] = newCategory;
    }

    private static addAtScaleAzureModeCategory(newCategoryDescriptor: IWorkbookCategoryDescriptor): void {
        const newCategory: IWorkbookCategory = this.convertToWorkbookCategory(newCategoryDescriptor);
        WorkbookTemplates.atScaleAzureModeTemplateCategoryList.push(newCategory);
        WorkbookTemplates.atScaleAzureModeTemplateCategoryMap[newCategoryDescriptor.CategoryId] = newCategory;
    }

    private static addAtScaleDevCategory(newCategoryDescriptor: IWorkbookCategoryDescriptor): void {
        const newCategory: IWorkbookCategory = this.convertToWorkbookCategory(newCategoryDescriptor);
        WorkbookTemplates.atScaleDevTemplateCategoryList.push(newCategory);
        WorkbookTemplates.atScaleDevTemplateCategoryMap[newCategoryDescriptor.CategoryId] = newCategory;
    }

    private static addSingleVmCategory(newCategoryDescriptor: IWorkbookCategoryDescriptor): void {
        const newCategory: IWorkbookCategory = this.convertToWorkbookCategory(newCategoryDescriptor);
        WorkbookTemplates.singleVmTemplateCategoryList.push(newCategory);
        WorkbookTemplates.singleVmTemplateCategoryMap[newCategory.CategoryId] = newCategory;
    }

    private static addSingleVmInsightsMetricsCategory(newCategoryDescriptor: IWorkbookCategoryDescriptor): void {
        const newCategory: IWorkbookCategory = this.convertToWorkbookCategory(newCategoryDescriptor);
        WorkbookTemplates.singleVmInsightsMetricsTemplateCategoryList.push(newCategory);
        WorkbookTemplates.singleVmInsightsMetricsTemplateCategoryMap[newCategory.CategoryId] = newCategory;
    }

    private static addVmssCategory(newCategoryDescriptor: IWorkbookCategoryDescriptor): void {
        const newCategory: IWorkbookCategory = this.convertToWorkbookCategory(newCategoryDescriptor);
        WorkbookTemplates.vmssTemplateCategoryList.push(newCategory);
        WorkbookTemplates.vmssTemplateCategoryMap[newCategory.CategoryId] = newCategory;
    }

    private static addVmssInsightsMetricsCategory(newCategoryDescriptor: IWorkbookCategoryDescriptor): void {
        const newCategory: IWorkbookCategory = this.convertToWorkbookCategory(newCategoryDescriptor);
        WorkbookTemplates.vmssInsightsMetricsTemplateCategoryList.push(newCategory);
        WorkbookTemplates.vmssInsightsMetricsTemplateCategoryMap[newCategory.CategoryId] = newCategory;
    }

    private static convertToWorkbookCategory(newCategoryDescriptor: IWorkbookCategoryDescriptor): IWorkbookCategory {
        const newCategoryWorkbookTemplates: IWorkbookTemplate[] = [];
        for (let workbookDescriptor of newCategoryDescriptor.WorkbookDescriptors) {
            newCategoryWorkbookTemplates.push(this.GetWorkbookTemplate(workbookDescriptor));
        }
        const newCategory: IWorkbookCategory = {
            CategoryId: newCategoryDescriptor.CategoryId,
            DisplayName: newCategoryDescriptor.DisplayName,
            WorkbookTemplates: newCategoryWorkbookTemplates
        }
        return newCategory;
    }
}

// initialize static workbook templates class
WorkbookTemplates.initialize();
