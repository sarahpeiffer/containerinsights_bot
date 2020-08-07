import { Promise } from 'es6-promise';

import * as GlobalConstants from '../../../shared/GlobalConstants';
import { KustoDataProvider, IKustoDataProvider, IKustoQueryOptions } from '../../../shared/data-provider/KustoDataProvider';
import { RetryARMDataProvider } from '../../../shared/data-provider/RetryARMDataProvider';
import { RetryPolicyFactory } from '../../../shared/data-provider/RetryPolicyFactory';
import { ARMDataProvider } from '../../../shared/data-provider/ARMDataProvider';
import { ITelemetry } from '../../../shared/Telemetry';
import { ErrorSeverity } from '../../../shared/data-provider/TelemetryErrorSeverity';
import { ComputeKustoQueryOptions } from '../ComputeKustoQueryOptions';
import { TelemetryUtils } from '../TelemetryUtils';
import { IWorkspaceInfo } from '../../../shared/IWorkspaceInfo';

const TelemetryEventsPrefix = 'Compute.PropertiesPanel.QueryLogEvents';
export interface IEventLogQueryResults {
    /**
     * logEvents
     */
    logEvents: DependencyMap.Integrations.ILogEvents[];

    isError: boolean;
}

export class LogEventPanelQueryHelper {

    private telemetry: ITelemetry;
    private queryGuid: string = '';
    private kustoDataProvider: IKustoDataProvider;
    private logPrefix: string;

    constructor(telemetry: ITelemetry, logPrefix: string) {
        this.telemetry = telemetry;
        this.logPrefix = logPrefix;
        this.kustoDataProvider =
            new KustoDataProvider(
                new RetryARMDataProvider(new ARMDataProvider(), new RetryPolicyFactory()),
                GlobalConstants.VMInsightsApplicationId
            );
    }

    public query(
        machineName: string,
        workspace: IWorkspaceInfo,
        resourceId: string,
        startDateTimeUtc: Date,
        endDateTimeUtc: Date
    ): Promise<IEventLogQueryResults> {
        const eventName = `${TelemetryEventsPrefix}.${this.logPrefix}.LogEventPanelTableLoad`;

        const queryOptions: IKustoQueryOptions = new ComputeKustoQueryOptions({ queryName: eventName }, startDateTimeUtc, endDateTimeUtc);
        this.queryGuid = queryOptions.requestId;

        if (!machineName) {
            const reason = 'Query Log Events, MachineName can not be null or empty '
            this.telemetry.logException(reason, eventName, ErrorSeverity.Error, null, null);
            return Promise.resolve({ logEvents: [], isError: true });
        }

        const query = DependencyMap.AdmLogEventsManager.generateQuery(machineName,
            startDateTimeUtc, endDateTimeUtc);

        // Start telemetry
        const customProperties = {
            workspace_id: workspace && workspace.id,
            computer_name: machineName,
            startDateTimeUtc: startDateTimeUtc.toDateString(),
            endDateTimeUtc: endDateTimeUtc.toDateString(),
            requestId: queryOptions.requestId
        };
        const kustoQueryTelemetry = this.telemetry.startLogEvent(eventName,
            customProperties,
            undefined);

        return this.kustoDataProvider.executeDraftQuery({ workspace, resourceId, query, queryOptions })
            .then((data: any): any => {
                if (TelemetryUtils.completeApiTelemetryEvent(kustoQueryTelemetry,
                    queryOptions.requestId !== this.queryGuid, false)) {
                    const logEvents: DependencyMap.Integrations.ILogEvents[]
                        = DependencyMap.AdmLogEventsManager.convertKustoResponseToLogEvents(data) || [];

                    const normalizeLogEvents = this.getNormalizeLogEvents(logEvents);

                    return Promise.resolve({ logEvents: normalizeLogEvents, isError: false });
                }
            }).catch((err) => {
                kustoQueryTelemetry.fail(err);
                return Promise.resolve({ logEvents: [], isError: true });
            });
    }

    /**
     * remove the null value
     * @param logEvents 
     */
    private getNormalizeLogEvents(logEvents: DependencyMap.Integrations.ILogEvents[])
        : DependencyMap.Integrations.ILogEvents[] {
        const normalizeLogEvents = [];
        for (let logEvent of logEvents) {
            if (!logEvent || !logEvent.Type || !logEvent.AggregatedValue) {
                continue;
            }
            normalizeLogEvents.push(logEvent);
        }
        return normalizeLogEvents;
    }
}
