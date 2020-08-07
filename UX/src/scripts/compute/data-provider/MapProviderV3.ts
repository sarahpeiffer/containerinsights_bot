import { IWorkspaceInfo } from '../../shared/IWorkspaceInfo';
import { InitializationInfo, AuthorizationTokenType } from '../../shared/InitializationInfo';
import * as Constants from '../../shared/GlobalConstants';
import { EnvironmentConfig } from '../../shared/EnvironmentConfig';
import { ITelemetry, IFinishableTelemetry } from '../../shared/Telemetry';
import { ErrorSeverity } from '../../shared/data-provider/TelemetryErrorSeverity';
import { MessagingProvider } from '../../shared/MessagingProvider';
import { MapType } from '../maps/compute-map/ComputeMapsElement';
import { RetryARMDataProvider } from '../../shared/data-provider/RetryARMDataProvider';
import { ARMDataProvider } from '../../shared/data-provider/ARMDataProvider';
import { RetryPolicyFactory } from '../../shared/data-provider/RetryPolicyFactory';
import { IApiClientRequestInfoParams, ApiClientRequestInfo } from '../../shared/data-provider/ApiClientRequestInfo';

const armApiVersion: string = '2017-01-01-preview';
const queryTimeoutMs: number = Constants.MaxArmRequestTimeoutMs;

export class MapProviderV3 implements DependencyMap.IMapApiDataProvider {
    startDateTimeUtc: Date;
    endDateTimeUtc: Date;

    private workspace: IWorkspaceInfo;
    private mapId: string;
    private mapType: MapType;
    private logPrefix: string;
    private armDataProvider: RetryARMDataProvider;
    private telemetry: ITelemetry;
    private onMapIdChanged: (id: string) => void;
    private onMapRenderCompleted: () => void;
    private solutionName: string = 'VmInsights';
    private requestInfoHeaderParams: IApiClientRequestInfoParams;

    constructor(telemetry: ITelemetry,
        logPrefix: string,
        requestInfoHeaderParams: IApiClientRequestInfoParams,
        onMapIdChangedCallback?: (id: string) => void,
        onMapRenderCompleted?: () => void) {
        this.requestInfoHeaderParams = requestInfoHeaderParams;
        this.onMapIdChanged = onMapIdChangedCallback;
        this.onMapRenderCompleted = onMapRenderCompleted;
        this.logPrefix = logPrefix;
        this.telemetry = telemetry;
        this.armDataProvider = new RetryARMDataProvider(new ARMDataProvider(), new RetryPolicyFactory());
    }

    public getCoarseMapRequestDescriptor(id?: string): object {
        return this.getMapRequestDescriptor(this.workspace, this.startDateTimeUtc.toISOString(),
            this.endDateTimeUtc.toISOString(), id || this.mapId);
    }

    public getClientGroupDetailsRequestDescriptor(clientGroupId: string): object {
        return this.getGroupRequestDescriptor(
            this.workspace, this.startDateTimeUtc.toISOString(), this.endDateTimeUtc.toISOString(), 'clientGroups', clientGroupId)
    }

    public getServerGroupDetailsRequestDescriptor(serverGroupId: string): object {
        return this.getGroupRequestDescriptor(
            this.workspace, this.startDateTimeUtc.toISOString(), this.endDateTimeUtc.toISOString(), 'serverGroups', serverGroupId)
    }

    public getMachineDetailsRequestDescriptor(machineId: string, getFullMap?: boolean): object {
        const groupId: string = this.mapType === MapType.groupmap ? this.mapId : undefined;
        return this.getDetailMapRequestDescriptor(this.workspace, this.startDateTimeUtc.toISOString(),
            this.endDateTimeUtc.toISOString(), machineId, groupId, getFullMap)
    }

    public onMapIdUpdated(id: string): void {
        if (this.onMapIdChanged) {
            this.onMapIdChanged(id);
        }
    }

    public onMapRendered(): void {
        if (this.onMapRenderCompleted) {
            this.onMapRenderCompleted();
        }
    }

    public updateTime(workspace: IWorkspaceInfo,
        startDateTimeUtc: Date,
        endDateTimeUtc: Date,
        mapId?: string,
        mapType?: MapType) {
        this.workspace = workspace;
        this.startDateTimeUtc = startDateTimeUtc;
        this.endDateTimeUtc = endDateTimeUtc;
        this.mapId = mapId;
        this.mapType = mapType;
    }

    /**
     * Gets ServiceMap machine details from ServiceMap API.
     * @param workspace 
     * @param machineId 
     * @param queryStartTime 
     * @param queryEndTime 
     */
    public getMachine(workspace: IWorkspaceInfo, machineId: string, queryStartTime: Date, queryEndTime: Date)
        : Promise<DependencyMap.Api.v2.Machine> {
        if (!workspace || !workspace.id) {
            return new Promise((resolve, reject) => { reject('Invalid workspace') });
        }

        const endTimeISOStr: string = queryEndTime ? queryEndTime.toISOString() : undefined;
        let url = workspace.id + '/features/serviceMap/machines/' + machineId + '?api-version=' + armApiVersion;

        if (endTimeISOStr) {
            url += '&timestamp=' + endTimeISOStr;
        }

        const telemetryContext: IFinishableTelemetry = this.telemetry.startLogEvent(
            `${this.logPrefix}.ServiceMapComputeGridGetMachine`,
            {
                workspace_id: workspace.id,
                workspace_name: workspace.name,
                machine_id: machineId,
                url
            },
            undefined
        );
        const apiRequestInfo: ApiClientRequestInfo = new ApiClientRequestInfo({
            queryName: 'GetServiceMapMachine',
            bladeName: this.requestInfoHeaderParams?.bladeName
        });
        return this.armDataProvider.executeGet(url, queryTimeoutMs,
            { 'x-ms-client-request-info': apiRequestInfo.ClientRequestInfoString }).then((result) => {
                telemetryContext.complete();
                return result;
            }, (error) => {
                telemetryContext.fail(error);
                return undefined;
            });
    }

    private getMapRequestDescriptor(workspace: IWorkspaceInfo,
        startDateTimeUtc: string,
        endDateTimeUtc: string,
        mapId: string): any {
        const queryUrl =
            EnvironmentConfig.Instance().getARMEndpoint() + workspace.id
            + '/features/serviceMap/generateMap?api-version=' + armApiVersion + '&startTime=' + startDateTimeUtc
            + '&endTime=' + endDateTimeUtc;

        if (!mapId) {
            throw new Error('Cannot identify id of resource fo which to generate coarse map request');
        }
        const apiRequestInfo: ApiClientRequestInfo = new ApiClientRequestInfo({
            queryName: 'generateMap',
            bladeName: this.requestInfoHeaderParams?.bladeName
        });
        const data: any = {
            startTime: startDateTimeUtc,
            endTime: endDateTimeUtc,
            kind: 'map:scope-dependency',
            scopes: [
                {
                    id: mapId
                }
            ]
        };

        return {
            contentType: 'application/json',
            data: JSON.stringify(data),
            headers: {
                Authorization: InitializationInfo.getInstance().getAuthorizationHeaderValue(AuthorizationTokenType.Arm),
                'x-ms-adm-caller-id': this.solutionName,
                'x-ms-client-request-info': apiRequestInfo.ClientRequestInfoString
            },
            timeout: queryTimeoutMs,
            type: 'POST',
            url: queryUrl
        };
    }

    private getDetailMapRequestDescriptor(workspace: IWorkspaceInfo,
        startDateTimeUtc: string,
        endDateTimeUtc: string,
        machineID: string,
        computerGroupId: string,
        getFullMap: boolean): any {
        const queryUrl =
            EnvironmentConfig.Instance().getARMEndpoint() + workspace.id
            + '/features/serviceMap/generateMap?api-version=' + armApiVersion + '&live=true' + '&startTime=' + startDateTimeUtc
            + '&endTime=' + endDateTimeUtc;

        let data: string = null;

        data = '{ "startTime": "' + startDateTimeUtc + '",'
            + '"endTime": "' + endDateTimeUtc + '",';
        if (!getFullMap && computerGroupId) {
            data += '"machineGroupId": "' + computerGroupId + '",';
        }
        data += '"kind": "map:single-machine-detailed-map",'
            + '"machineId": "' + machineID + '"}';
        const apiRequestInfo: ApiClientRequestInfo = new ApiClientRequestInfo({
            queryName: 'generateMap',
            bladeName: this.requestInfoHeaderParams?.bladeName
        });
        return {
            contentType: 'application/json',
            data: data,
            headers: {
                Authorization: InitializationInfo.getInstance().getAuthorizationHeaderValue(AuthorizationTokenType.Arm),
                'x-ms-adm-caller-id': this.solutionName,
                'x-ms-client-request-info': apiRequestInfo.ClientRequestInfoString
            },
            timeout: queryTimeoutMs,
            type: 'POST',
            url: queryUrl
        };
    }

    private getGroupRequestDescriptor(workspace: IWorkspaceInfo,
        startDateTimeUtc: string,
        endDateTimeUtc: string, groupType: string,
        groupName: string): any {

        const queryUrl =
            EnvironmentConfig.Instance().getARMEndpoint() + workspace.id
            + '/features/serviceMap/'
            + groupType + '/' + groupName
            + '/members?api-version=' + armApiVersion + '&live=true' + '&startTime=' + startDateTimeUtc
            + '&endTime=' + endDateTimeUtc;
        const apiRequestInfo: ApiClientRequestInfo = new ApiClientRequestInfo({
            queryName: `get${groupType}Members`,
            bladeName: this.requestInfoHeaderParams?.bladeName
        });
        return {
            contentType: 'application/json',
            headers: {
                Authorization: InitializationInfo.getInstance().getAuthorizationHeaderValue(AuthorizationTokenType.Arm),
                'x-ms-adm-caller-id': this.solutionName,
                'x-ms-client-request-info': apiRequestInfo.ClientRequestInfoString
            },
            timeout: queryTimeoutMs,
            type: 'GET',
            url: queryUrl
        };
    }
}

export class MapTelemetryListener implements DependencyMap.ITelemetry {
    private telemetry: ITelemetry;
    private messagingProvider: MessagingProvider;
    private telemetryEventsPrefix: string;

    constructor(telemetryEventsPrefix: string, telemetry: ITelemetry, messagingProvider: MessagingProvider) {
        this.telemetry = telemetry;
        this.messagingProvider = messagingProvider;
        this.telemetryEventsPrefix = telemetryEventsPrefix;
    }

    public trackException(exception: object | string, source: string, properties: StringMap<any>) {
        if (this.telemetry) {
            this.telemetry.logException(<any>exception, source, ErrorSeverity.Error, properties, {});
        }
    }

    public trackEvent(eventName: string, properties: StringMap<any>) {
        if (this.telemetry) {
            this.telemetry.logEvent(`${this.telemetryEventsPrefix}.${eventName}`, properties, {});
        }
    }

    public trackDependency(id: string, method: string, absoluteUrl: string, pathName: string,
        totalTime: number, success: boolean, resultCode: number) {
        if (this.telemetry) {
            this.telemetry.logDependency(id, method, absoluteUrl, pathName, totalTime, success, resultCode);
        }
    }

    public notifyClient(title: string, message: string, level: DependencyMap.NotificationStatus) {
        if (this.messagingProvider) {
            this.messagingProvider.sendClientNotification(title, message, level);
        }
    }
}
