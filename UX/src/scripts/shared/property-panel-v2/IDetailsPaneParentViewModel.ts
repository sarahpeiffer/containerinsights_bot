import { IDetailsPanelTab } from './IDetailsPaneTab';
import { TelemetrySubArea } from '../Telemetry';

export interface ITelemetryData {
    name: string;
    data: any;
}

/**
 * describes what the property panel (details pane) requires
 */
export interface IDetailsPaneParentViewModel {
    
    propertyPanes: IDetailsPanelTab[];
    propertyPanelHeader?: JSX.Element;

    propertyPanelVisible: boolean;
    getTelemetryDataForTabChange: () => ITelemetryData;
    getTelemetrySubArea: () => TelemetrySubArea;
}
