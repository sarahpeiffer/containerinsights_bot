import { IDetailsPaneParentViewModel, ITelemetryData } from '../IDetailsPaneParentViewModel';
import { DetailsPaneModel } from '../Model/DetailsPaneModel';
import { IDetailsPanelTab } from '../IDetailsPaneTab';
import { BaseViewModel, reactForceUpdateHandler } from '../../BaseViewModel';
import { DetailsPaneBindables } from '../PropertyPanelV2Bindables';
import { ITelemetry, TelemetryMainArea } from '../../Telemetry';
import { TelemetryFactory } from '../../TelemetryFactory';

/**
 * view model in mvvm chain for property panel
 */
export class DetailsPaneViewModel extends BaseViewModel {
    private _model: DetailsPaneModel = { 
        isCollapsed: false,
        selectedTabIndex: 0
    };

    /**
     * .ctor()
     * @param parentContext required by base view model
     * @param forceUpdate required by base view model
     */
    constructor(parentContext: IDetailsPaneParentViewModel, forceUpdate: reactForceUpdateHandler, private _telemetry?: ITelemetry) {
        super(forceUpdate, parentContext);

        if (!_telemetry) {
            this._telemetry = TelemetryFactory.get(TelemetryMainArea.Global);
        }

        this.setSelectedIndex = this.setSelectedIndex.bind(this);
        this.toggleCollapse = this.toggleCollapse.bind(this);
    }

    /**
     * mvvm read binding point
     */
    public get selectedTabIndex() {
        return this._model.selectedTabIndex;
    }

    /** 
     * mvvm read binding point
     */
    public get isCollapsed() {
        return this._model.isCollapsed;
    }
    
    /**
     * mvvm "calculated field"
     */
    public get contents(): IDetailsPanelTab[] {
        const castedParentContext = this.parentContext as IDetailsPaneParentViewModel;
        return castedParentContext.propertyPanes;
    }

    /**
     * change the tab selection
     * @param index index to select
     */
    public setSelectedIndex(index: number) {
        this._model.selectedTabIndex = index;

        // Telemetry
        const telemetryData: ITelemetryData = this.castedParentContext().getTelemetryDataForTabChange();
        this._telemetry.logEvent(
            'DetailsPanelTabSelectionChanged', 
            { 
                ...telemetryData.data, 
                tabName: this.castedParentContext().propertyPanes[index].tabName,
                telemetryName: this.castedParentContext().propertyPanes[index].telemetryName,
                telemetrySubArea: this.castedParentContext().getTelemetrySubArea()
            }, 
            { selectionIndex: index }
        );

        this.propertyChanged(DetailsPaneBindables.SelectedTabIndex);
        // this.invokeCommandAction('SetSelectedTabIndex', index);
    }

    /**
     * collapse the property panel
     */
    public toggleCollapse() {
        this._model.isCollapsed = !this._model.isCollapsed;
        this.propertyChanged(DetailsPaneBindables.IsCollapsed);

        this._telemetry.logEvent(
            `DetailsPane${this._model.isCollapsed ? 'Collapsed' : 'Expanded'}`, 
            { telemetrySubArea: this.castedParentContext().getTelemetrySubArea() }, 
            null
        );
    }

    // Casts the parent context as IDetailsPaneParentViewModel
    private castedParentContext(): IDetailsPaneParentViewModel {
        return this.parentContext as IDetailsPaneParentViewModel;
    }
}
