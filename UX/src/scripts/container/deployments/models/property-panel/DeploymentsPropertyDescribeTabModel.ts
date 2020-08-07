import { IDescribeData } from '../../interfaces/IDescribeData';

/**
 * model in mvvm chain for property panel in deployments feature (describe tab)
 */
export class DeploymentsPropertyDescribeTabModel {
    /**
     * .ctor()
     * @param loading loading state
     * @param visible visibility of the tab
     * @param data data for the tab
     */
    constructor(public loading: boolean, public visible: boolean, public data?: IDescribeData
    ) { }

}
