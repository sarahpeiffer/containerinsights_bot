/**
 * TODO: far more people will need this, share
 */
export interface IThemeStyles {
    textColor: string;
    backgroundColor: string;
}

/**
 * model in mvvm chain for property panel in deployments feature (raw tab)
 */
export class DeploymentsPropertyRawTabModel {

    /**
     * .ctor()
     * @param loading loading state
     * @param visible visibility of the tab
     * @param data data for the tab
     * @param theme current theme (hack for raw control, most dark theme managed through css)
     */
    constructor(public loading: boolean, public visible: boolean, public data?: any, public theme?: IThemeStyles) { }

}
