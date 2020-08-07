import { RetryARMDataProvider } from '../../shared/data-provider/RetryARMDataProvider';
import { IWorkspaceInfo } from '../../shared/IWorkspaceInfo';
import { StringHelpers } from '../../shared/Utilities/StringHelpers';
import { LimitedCache } from '../shared/LimitedDataCacheUtil';
import { IFinishableTelemetry, ITelemetry } from '../../shared/Telemetry';

export interface IVmInsightsOnboardedWorkspace {
    id: string;
    location: string;
    properties: any;
}

export interface IVMInsightsOnboardingStatusDataItem {
    workspace: IVmInsightsOnboardedWorkspace;
}

export interface IVmInsightsOnboardingStatusProperties {
    data: IVMInsightsOnboardingStatusDataItem[];
    dataStatus: string;
    onboardingStatus: string;
    resourceId: string;
}

export interface IVmInsightsOnboardingStatus {
    id: string;
    name: string;
    type: string;
    properties: IVmInsightsOnboardingStatusProperties;
}

export interface IGetVmInsightsOnboardingStatusParams {
    resourceId: string;
    headers: StringMap<string>;
    telemetryPrefix: string;
}

export class VmInsightsOnboardingDataProvider {

    private _armDataProvider: RetryARMDataProvider;
    private _queryTimeoutInMilliseconds: number = 30000;
    private _limitedCache: LimitedCache<IWorkspaceInfo[]>;
    private _telemetry: ITelemetry;

    constructor(armDataProvider: RetryARMDataProvider, telemetry: ITelemetry) {
        this._armDataProvider = armDataProvider;
        this._limitedCache = new LimitedCache<IWorkspaceInfo[]>();
        this._telemetry = telemetry;
    }

    /**
     * Gets the onboarding status of vm insights for the specified resource (scope)
     * @param resourceId resourceId of resource scope, e.g., subscription/resource group
     */
    public GetVmInsightsOnboardingStatus(params: IGetVmInsightsOnboardingStatusParams): Promise<IWorkspaceInfo[]> {
        const cachedResult: IWorkspaceInfo[] = this._limitedCache.get(params?.resourceId);
        if (cachedResult) {
            this._telemetry.logEvent(`${params?.telemetryPrefix}.GetVmInsightsOnboardingStatus - Cached`,
                { resourceId: params?.resourceId }, {});
            return Promise.resolve(cachedResult);
        }

        const telemetryContext: IFinishableTelemetry = this._telemetry.startLogEvent(`${params?.telemetryPrefix}.GetVmInsightsOnboardingStatus`,
            { resourceId: params?.resourceId, headers: JSON.stringify(params?.headers) }, {});
        const uri: string = params?.resourceId +
            '/providers/Microsoft.Insights/vmInsightsOnboardingStatuses/default?api-version=2018-11-27-preview';

        let workspaces: IWorkspaceInfo[] = [];
        return this._armDataProvider.executeGet(uri, this._queryTimeoutInMilliseconds, params?.headers).then(
            (response: IVmInsightsOnboardingStatus) => {
                if (response && response.properties && response.properties.dataStatus === 'present'
                    && response.properties.data && response.properties.data.length) {
                    for (let dataItem of response.properties.data) {
                        let workspace: IVmInsightsOnboardedWorkspace = dataItem.workspace;
                        if (!StringHelpers.isNullOrEmpty(workspace.id)) {
                            let workspaceName: string = workspace.id.split('/').pop();
                            workspaces.push({
                                id: workspace.id,
                                name: workspaceName,
                                location: workspace.location
                            });
                        }
                    }
                }
                this._limitedCache.insert(params?.resourceId, workspaces);
                telemetryContext.complete({ workspaces: JSON.stringify(workspaces) });
                return workspaces;
            }).catch((error) => {
                telemetryContext.fail(error);
                return workspaces;
            });
    }
}
