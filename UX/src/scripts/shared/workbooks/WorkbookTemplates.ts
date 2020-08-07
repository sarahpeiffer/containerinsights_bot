/**
 * Local
 */
import { WorkbookTemplateId, WorkbookCategoryId } from './WorkbookIndex';
import {
    AtScaleCategories,
    SingleVmCategories,
    VmssCategories,
    AKSClusterCategories,
    AKSEngineClusterCategories
} from './WorkbookCategories';
import { Templates } from './Templates';

/**
 * Workbook template which is referenced by its TemplatePath. The GalleryType typically describes what kind of
 * Azure resource can view this particular workbook by default. The WorkbookType can be viewed as a 'folder'
 * of the Workbook. The TemplateId is used internally to reference to this particular workbook.
 *
 * @export
 * @interface IWorkbookTemplate
 * @WorkBookType (Optional) If a template was opened via a template ConfigurationId parameter,
 *  this is the default name the new workbook will have
 * @TemplatePath (Optional) - If specified, this is the saved guid id of an item that workbooks should open instead of showing the gallery.
 *  If this value begins with the text "Community-" it is treated as a template id and the content is retrieved from the gallery.
 *  If not starting with "Community-", this is a saved id and will be looked up using the saved workbooks infrastructure
 */
export interface IWorkbookTemplate {
    TemplateId: string;
    GalleryType: string;
    WorkbookType: string;
    DisplayName: string;
    TemplatePath?: string;
    NewNotebookData?: string;
    ViewerMode?: string;
    TelemetryId?: string;
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

export enum Application {
    VMInsights = 'vm-insights',
    ContainerInsights = 'container-insights'
}

export class WorkbookTemplates {
    private static templateMap: Map<WorkbookTemplateId, IWorkbookCategory> = new Map();
    private static templateList: IWorkbookTemplate[] = [];

    private static atScaleTemplateCategoryMap: Map<WorkbookCategoryId, IWorkbookCategory> = new Map();
    private static atScaleTemplateCategoryList: IWorkbookCategory[] = [];

    private static singleVmTemplateCategoryMap: Map<WorkbookCategoryId, IWorkbookCategory> = new Map();
    private static singleVmTemplateCategoryList: IWorkbookCategory[] = [];
    private static aksClusterTemplateCategoryMap: Map<WorkbookCategoryId, IWorkbookCategory> = new Map();

    private static aksClusterTemplateCategoryList: IWorkbookCategory[] = [];
    private static aksEngineClusterTemplateCategoryList: IWorkbookCategory[] = [];
    private static aksEngineClusterTemplateCategoryMap: Map<WorkbookCategoryId, IWorkbookCategory> = new Map();

    private static vmssTemplateCategoryMap: Map<WorkbookCategoryId, IWorkbookCategory> = new Map();
    private static vmssTemplateCategoryList: IWorkbookCategory[] = [];

    static initialize() {
        this.initializeTemplates();

        this.initializeAtScaleCategories();
        this.initializeSingleVmCategories();
        this.initializeAKSClusterCategories();
        this.initializeAKSEngineClusterCategories();
        this.initializeVmssCategories();
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

    public static get SingleVmCategoryList(): IWorkbookCategory[] {
        return WorkbookTemplates.singleVmTemplateCategoryList;
    }

    public static get AKSClusterCategoryList(): IWorkbookCategory[] {
        return WorkbookTemplates.aksClusterTemplateCategoryList;
    }

    public static get AKSEngineClusterCategoryList(): IWorkbookCategory[] {
        return WorkbookTemplates.aksEngineClusterTemplateCategoryList;
    }

    public static get VmssCategoryList(): IWorkbookCategory[] {
        return WorkbookTemplates.vmssTemplateCategoryList;
    }

    private static initializeTemplates(): void {
        for (let workbookTemplate of Templates) {
            this.addTemplate(workbookTemplate);
        }
    }

    private static initializeAtScaleCategories(): void {
        for (let atScaleCategory of AtScaleCategories) {
            this.addAtScaleCategory(atScaleCategory);
        }
    }

    private static initializeSingleVmCategories(): void {
        for (let singleVmCategory of SingleVmCategories) {
            this.addSingleVmCategory(singleVmCategory);
        }
    }

    private static initializeAKSClusterCategories(): void {
        for (let aksClusterCategory of AKSClusterCategories) {
            this.addAKSClusterCategory(aksClusterCategory);
        }
    }

    private static initializeAKSEngineClusterCategories(): void {
        for (let aksEngineClusterCategory of AKSEngineClusterCategories) {
            this.addAKSEngineClusterCategory(aksEngineClusterCategory);
        }
    }


    private static initializeVmssCategories(): void {
        for (let vmssCategory of VmssCategories) {
            this.addVmssCategory(vmssCategory);
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

    private static addSingleVmCategory(newCategoryDescriptor: IWorkbookCategoryDescriptor): void {
        const newCategory: IWorkbookCategory = this.convertToWorkbookCategory(newCategoryDescriptor);
        WorkbookTemplates.singleVmTemplateCategoryList.push(newCategory);
        WorkbookTemplates.singleVmTemplateCategoryMap[newCategory.CategoryId] = newCategory;
    }

    private static addAKSClusterCategory(newCategoryDescriptor: IWorkbookCategoryDescriptor): void {
        const newCategory: IWorkbookCategory = this.convertToWorkbookCategory(newCategoryDescriptor);
        WorkbookTemplates.aksClusterTemplateCategoryList.push(newCategory);
        WorkbookTemplates.aksClusterTemplateCategoryMap[newCategory.CategoryId] = newCategory;
    }

    private static addAKSEngineClusterCategory(newCategoryDescriptor: IWorkbookCategoryDescriptor): void {
        const newCategory: IWorkbookCategory = this.convertToWorkbookCategory(newCategoryDescriptor);
        WorkbookTemplates.aksEngineClusterTemplateCategoryList.push(newCategory);
        WorkbookTemplates.aksEngineClusterTemplateCategoryMap[newCategory.CategoryId] = newCategory;
    }

    private static addVmssCategory(newCategoryDescriptor: IWorkbookCategoryDescriptor): void {
        const newCategory: IWorkbookCategory = this.convertToWorkbookCategory(newCategoryDescriptor);
        WorkbookTemplates.vmssTemplateCategoryList.push(newCategory);
        WorkbookTemplates.vmssTemplateCategoryMap[newCategory.CategoryId] = newCategory;
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
