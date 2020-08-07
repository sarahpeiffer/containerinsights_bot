/** 
 * Used by property panel main and associated components to define each "tab" on the panel
*/

export interface IDetailsPanelTab {
    tabName?: string;
    telemetryName?: string;
    tabIcon?: JSX.Element;
    forceRender?: boolean;
    body: JSX.Element[] | JSX.Element;
    onAfterSelection?: () => void;
    telemetryPageView?: string;
}

