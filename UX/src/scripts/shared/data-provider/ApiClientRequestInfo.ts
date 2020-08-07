
export enum ApiClientRequestInfoBladeName {
    AtScale = 'atscale',
    Vm = 'vm',
    Vmss = 'vmss',
    VmssInstance = 'vmssinstance',
    Dashboard = 'dashboard'
}

export interface IApiClientRequestInfoParams {
    bladeName?: string;
    queryName: string;
    isInitialBladeLoad?: boolean;
}

export class ApiClientRequestInfo {
    public bladeName: string;
    public queryName: string;
    public isInitialBladeLoad: boolean = false;

    constructor(info: IApiClientRequestInfoParams) {
        this.bladeName = info.bladeName;
        this.queryName = info.queryName;
        this.isInitialBladeLoad = info.isInitialBladeLoad === undefined ? false : info.isInitialBladeLoad;
    }

    public get ClientRequestInfoString() {
        if (!this.bladeName) {
            return this.queryName;
        }
        return `exp=vminsights,blade=${this.bladeName},query=${this.queryName},initial=${this.isInitialBladeLoad}`;
    }
}
