/**
 * Block imports
 */
import * as $ from 'jquery';
import * as Constants from '../../../shared/GlobalConstants';

/**
 * Third Party Libraries
 */
import { Promise } from 'es6-promise'
import { reject } from 'q';

/*
* Connection Analytics Api Import
*/
import { ICAApiResponse } from './IConnectionAnalyticsApi';

/**
 * Shared Imports
 */
import { IWorkspaceInfo } from '../../../shared/IWorkspaceInfo';
import { InitializationInfo, AuthorizationTokenType } from '../../../shared/InitializationInfo';
import { EnvironmentConfig } from '../../../shared/EnvironmentConfig';
import { ITimeInterval } from '../../../shared/data-provider/TimeInterval'; 

const armApiVersion: string = '2015-11-01-preview';
const queryTimeoutMs: number = Constants.MaxArmRequestTimeoutMs;

export interface IConnectionDataProvider {
    evaluateConnectionMetrics(workspace: IWorkspaceInfo, 
        timeInterval: ITimeInterval, 
        metricNames: string[], 
        source: string[], 
        destination: string[]): IConnectionWrapper
}

export interface IConnectionWrapper {
    connection: ICAApiResponse
}

export class ConnectionDataProvider implements IConnectionDataProvider {

    // Naga TODO: Add Telemetry  support
    // Task188939 (https://msecg.visualstudio.com/DefaultCollection/OMS/_workitems/edit/188939)
    constructor() {
    }

    public evaluateConnectionMetrics(workspace: IWorkspaceInfo, 
        timeInterval: ITimeInterval, 
        metricNames: string[], 
        source: string[], 
        destination: string[]): any {

        const getConnectionMetrics = this.evaluateConnectionMetricsNow(
            workspace, timeInterval, metricNames, source, destination);
        
        if (!getConnectionMetrics) {
            reject('getConnectionMetrics object unexpected null');
        }

        return new Promise<IConnectionWrapper>((resolve, reject) => {
            getConnectionMetrics.success = (data: any) => {
                if (!data) {
                    resolve({ connection: undefined });
                    return;
                }
                resolve({ connection: data });
            };
            getConnectionMetrics.error = (err) => {
                reject(err);
                throw err;
            };

            $.ajax(getConnectionMetrics);
        });
    }

    private evaluateConnectionMetricsNow(workspace: IWorkspaceInfo, 
        timeInterval: ITimeInterval, 
        metricNames: string[], 
        source: string[], 
        destination: string[]): any {

        const queryUrl =
            EnvironmentConfig.Instance().getARMEndpoint() + workspace.id
            + '/features/serviceMap/evaluateConnectionMetrics?api-version=' + armApiVersion;
        
        // This is to optimize API requests
        // 'ids: []' is a bit slower to compute in the backend when compared to 'id: ""'
        // so send 'id: ""' whenever possible
        const connectionSource = ((source.length > 1)
            ? '"ids": ' +  JSON.stringify(source)
            : '"id":' + JSON.stringify(source[0]));

        const connectionDestination = ((destination.length > 1)
            ? '"ids": ' +  JSON.stringify(destination)
            : '"id":' + JSON.stringify(destination[0]));
        
        return {
            contentType: 'application/json',
            accept: 'application/json',
            data: '{ "startTime": "' + timeInterval.getBestGranularStartDate().toISOString() + '",'
                + '"endTime": "' + timeInterval.getBestGranularEndDate().toISOString() + '",'
                + '"timeGrain": "' + timeInterval.getGrainRealInterval() + '",'
                + '"metricNames": ' + JSON.stringify(metricNames) + ','
                + '"connections": [{' 
                + '"source": {' + connectionSource + '}, ' 
                + '"destination": {' + connectionDestination + '}'
                + '}]}',
            headers: {
                Authorization: InitializationInfo.getInstance().getAuthorizationHeaderValue(AuthorizationTokenType.Arm),
            },
            timeout: queryTimeoutMs,
            type: 'POST',
            url: queryUrl,
        };
    }
}
