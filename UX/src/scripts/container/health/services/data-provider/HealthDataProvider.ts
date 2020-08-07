/** tpl */
import { Promise } from 'es6-promise'

import { IKustoDataProvider, IKustoQueryOptions } from '../../../../shared/data-provider/v2/KustoDataProvider';
import { Prefer } from '../../../../shared/data-provider/v2/KustoDataProvider';
import { ITimeInterval, TimeInterval } from '../../../../shared/data-provider/TimeInterval'
import { HealthQueryTemplate } from './QueryTemplates/HealthQueryTemplate';
import { GlobalFilterPlaceholder } from '../../../data-provider/QueryTemplates/GlobalFilterPlaceholder';
import { IAzureResource } from '../../../../shared/IAzureResource';
import { IKubernetesCluster } from '../../../IBladeContext';
import { HealthState } from '../../HealthState';
import { IBladeLoadManager } from '../../../messaging/IBladeLoadManager';

/** query timeout in milliseconds */
const TIMEOUT_MS: number = 30000;

/** time range of the query in hours */
const LATEST_STATE_QUERY_RANGE_HOURS: number = 6;

/**
 * defines health data provider functionality
 */
export interface IHealthDataProvider {
    /**
     * gets latests states for health model monitors
     * @param workspace log analytics workspace information
     * @param cluster cluster information
     * @param requestId arm request id
     * @returns promise of operation completion
     */
    getLatestMonitorStates(
        workspace: IAzureResource,
        cluster: IKubernetesCluster,
        requestId?: string): Promise<any>;
}

/**
 * provides health data provider functionality
 */
export class HealthDataProvider implements IHealthDataProvider {
    /** underlying Kusto data provider */
    private kustoDataProvider: IKustoDataProvider;

    /**
     * initializes a new instance of the class
     * @param kustoDataProvider underlying Kusto store data provider
     * @param bladeLoadManager singleton tracks page load performance (Cheating unit tests here)
     */
    constructor(kustoDataProvider: IKustoDataProvider, private bladeLoadManager: IBladeLoadManager) {
        if (!kustoDataProvider) { throw new Error('@kustoDataProvider may not be null at HealthDataProvider.ctor()'); }

        this.kustoDataProvider = kustoDataProvider;
    }

    /**
     * converts data store monitor status to MonitorState enumeration
     * @param status value read from the data store
     * @returns monitor state
     */
    public static getMonitorState(status: string): HealthState {
        if (status.toLowerCase() === 'pass') {
            return HealthState.Healthy;
        } else if (status.toLowerCase() === 'fail') {
            return HealthState.Critical;
        } else if (status.toLowerCase() === 'warn') {
            return HealthState.Warning;
        } else if (status.toLowerCase() === 'err') {
            return HealthState.Error;
        } else if (status.toLowerCase() === 'none') {
            return HealthState.None;
        } else {
            return HealthState.Unknown;
        }
    }

    /**
     * gets latests states for health model monitors
     * @param workspace log analytics workspace information
     * @param cluster cluster information
     * @param requestId arm request id
     * @returns promise of operation completion
     */
    public getLatestMonitorStates(
        workspace: IAzureResource,
        cluster: IKubernetesCluster,
        requestId?: string
    ): Promise<any> {
        if (!workspace) { throw new Error('@workspace may not be null at HealthDataProvider.getLatestMonitorStates()'); }
        if (!cluster) { throw new Error('@cluster may not be null at HealthDataProvider.getLatestMonitorStates()'); }

        const queryTemplate = HealthQueryTemplate.LatestMonitorStateQuery;

        const timeInterval = this.getLatestStateQueryTimeInterval();

        const query = GlobalFilterPlaceholder.replacePlaceholders(
            queryTemplate,
            timeInterval,
            cluster);

        const queryOptions =
            this.getQueryOptions(timeInterval, 'latestState', requestId);

        return this.kustoDataProvider.executeQuery(workspace.resourceId, query, TIMEOUT_MS, queryOptions);
    }

    /**
     * constructs query time interval
     * @returns {ITimeInterval} time interval of the query
     */
    private getLatestStateQueryTimeInterval(): ITimeInterval {
        const endDateTime = new Date();
        const startDateTime = new Date(endDateTime.getTime());

        startDateTime.setHours(endDateTime.getHours() - LATEST_STATE_QUERY_RANGE_HOURS);

        return new TimeInterval(startDateTime, endDateTime, LATEST_STATE_QUERY_RANGE_HOURS * 60);
    }

    /**
     * Constructs Kusto query options set
     * @param timeInterval time interval of the query
     * @param tabName ux tab name
     * @param queryName query name
     * @param requestId request id
     * @param sessionId session id
     * @returns {IKustoQueryOptions} query options for Kusto query
     */
    private getQueryOptions(
        timeInterval: ITimeInterval,
        queryName?: string,
        requestId?: string,
    ): IKustoQueryOptions {
        let queryOptions: IKustoQueryOptions = {
            timeInterval: timeInterval
        };

        // tslint:disable-next-line:max-line-length
        queryOptions.requestInfo = `exp=containerinsights,blade=singlecontainer,tabName=health,initial=${this.bladeLoadManager.fetchIsInitialLoadComplete().toString()}`;

        if (queryName) {
            queryOptions.requestInfo += ',query=' + queryName;
        }

        if (requestId) { queryOptions.requestId = requestId; }

        // TODO-TASK-4648520: Add other prefer headers once transitioned to predefined type
        queryOptions.preferences = [Prefer.ExcludeFunctions].join(',');

        return queryOptions;
    }
}
