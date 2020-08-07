/** 
 * wrapper class used to replace the AdmPropertiesPanel object
*/
export class AdmPropertiesPanelShim {
    
    /**
     * container for the binding... ComputeMapsPage will bind to this event which is just
     * a vaneer overtop of the knockout obervable selectionContext
     */
    private static selectionCallback: (selectionContext: DependencyMap.SelectionContext, mapData: DependencyMap.IMap) => void;

    // bbax: the AdmWorkspace ctor subscribes to this (do not remove!)
    public panelCollapsed: KnockoutObservable<boolean> = ko.observable(true);
    /**
     * bbax; this one here is our primary goal; we want to subscribe to this ko object
     * and somehow route it over to computemapspage so it can generate a property panel
     */
    private selectionContext: KnockoutObservable<any> = ko.observable();

    private mapModel: DependencyMap.IMap;

    /**
     * .ctor() defined by AdmPropertiesPanel (we just obey)
     * @param $element defined by AdmPropertiesPanel (we just obey)
     * @param options defined by AdmPropertiesPanel (we just obey)
     */
    constructor($element: any, options: any) {
        this.selectionContext.subscribe((context: any) => {
            if (AdmPropertiesPanelShim.selectionCallback) {
                AdmPropertiesPanelShim.selectionCallback(context as DependencyMap.SelectionContext, this.mapModel || null);
            }
        });
        ko.applyBindings(this, $element[0]);
    }

    /**
     * bind a function which will be used when the ko changes are triggered
     * @param selectionsCallback function to be invoked when the ko is triggered
     * @returns {void}
     */
    public static Bind(selectionsCallback: (selectionContext: DependencyMap.SelectionContext, mapData: DependencyMap.IMap) => void): void {
        AdmPropertiesPanelShim.selectionCallback = selectionsCallback;
    }
}
