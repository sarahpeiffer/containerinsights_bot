import { ILogItem, LogItem } from '../Utilities/LogBufferManager';

/**
 * Shared
 */
import { TelemetryMainArea } from '../Telemetry';
import { ErrorSeverity } from './TelemetryErrorSeverity';
import { TelemetryFactory } from '../TelemetryFactory';
import { StringHelpers } from '../Utilities/StringHelpers';
import { AggregationOption } from '../../shared/AggregationOption';
import { NodeCountMetricSeries, PodCountMetricSeries } from '../../container/ContainerMetricChart';
import { KubernetesParsingAndAggregation } from './KubernetesParsingAndAggregation';
import { UnitParser } from '../../container/shared/openapi-parser/UnitParser';
import { QuantitySuffixer } from '../../container/shared/openapi-parser/QuantitySuffixer';


export interface IEventItem {
    encodedContinueToken: string;
    formattedEventItems: ILogItem[];
}

/**
 * the contents of the deployment describe we are interested in?
 */
export interface IDeploymentItem {
    creationTimestamp: string;
    name: string;
    namespace: string;
    uid: string;
    replicasRequested: number;
    available: number;
    ready: number;
    updated: number;

}

export interface IInterprettedDeployments {
    data: IDeploymentItem[];
    metadata: {
        //responseCode: [],
        continue: string;
    }
}

/**
 * Holds aggregated data which describes the state of
 * a cluster for a specific point in time.
 */
export interface ILiveDataPoint {
    readonly cpu: StringMap<number>;
    readonly memory: StringMap<number>;
    readonly nodeCount: StringMap<number>;
    readonly podCount: StringMap<number>;
    readonly timestamp: Date;
}

/**
 * Interprets response data from the kubernetes API server.
 */
export class KubernetesResponseInterpreter {
    private telemetryArea: TelemetryMainArea;
    private kubernetesParsingAndAggregation: KubernetesParsingAndAggregation;
    private podLimitsCpu: number = -1;
    private podLimitsMemory: number = -1;
    private podRequestsCpu: number = -1;
    private podRequestsMemory: number = -1;

    constructor(telemetryArea: TelemetryMainArea) {
        this.telemetryArea = telemetryArea;
        // tslint:disable-next-line:max-line-length
        this.kubernetesParsingAndAggregation = new KubernetesParsingAndAggregation(new UnitParser(QuantitySuffixer.Instance()), TelemetryFactory.get(this.telemetryArea));
    }

    /**
     * TODO: hackFix the cache data
     * clear cache data when open the live tab
     */
    public clearCache(): void {
        this.podLimitsCpu = -1;
        this.podLimitsMemory = -1;
        this.podRequestsCpu = -1;
        this.podRequestsMemory = -1;
    }

    public interpretDeployments(deploymentsResponse: any): IInterprettedDeployments {
        if (
            !deploymentsResponse ||
            !deploymentsResponse.items ||
            !deploymentsResponse.items.length ||
            deploymentsResponse.items.length < 1
        ) {
            return null;
        }

        const interprettedDeployments: IDeploymentItem[] = deploymentsResponse.items.map((deployItem) => {
            const metaData: any = deployItem.metadata;
            return {
                name: metaData.name,
                namespace: metaData.namespace,
                creationTimestamp: metaData.creationTimestamp,
                uid: metaData.uid,
                replicasRequested: deployItem.spec.replicas || 0,
                available: deployItem.status.availableReplicas || 0,
                ready: deployItem.status.readyReplicas || 0,
                updated: deployItem.status.updatedReplicas || 0
            };
        });

        return {
            data: interprettedDeployments,
            metadata: {
                continue: deploymentsResponse.metadata.continue || null
            }
        }
    }

    /**
     * translate the response from events api into something our application can understand
     * @param eventsResponse response from events ep
     */
    public interpretEvents(eventsResponse: any): IEventItem {
        if (
            eventsResponse !== undefined
            && eventsResponse !== null
            && eventsResponse.items !== undefined
            && eventsResponse.items !== null
            && eventsResponse.items.length > 0
        ) {
            const eventItems = eventsResponse.items;
            const formattedEventItems: ILogItem[] = [];
            let eventItem: LogItem;
            let currentItemName: string;
            let currentItemKind: string;
            eventItems.forEach((item) => {
                if (!item) { return; }

                currentItemName = '';
                currentItemKind = '';
                if (item.involvedObject !== undefined && item.involvedObject !== null) {
                    if (!StringHelpers.isNullOrEmpty(item.involvedObject.name)) {
                        currentItemName = item.involvedObject.name;
                    }
                    if (!StringHelpers.isNullOrEmpty(item.involvedObject.kind)) {
                        currentItemKind = item.involvedObject.kind;
                    }
                }

                // bbax: some events appear with null for last and first timestamp?? really?? anyway lets
                // just fill it with now() for sake of sorting and such
                if (!item.lastTimestamp) { item.lastTimestamp = Date(); }
                
                eventItem = new LogItem(
                    item.lastTimestamp,
                    ' [' + currentItemKind + '] [' + currentItemName + '] ' + item.reason + ': ' + item.message
                );
                formattedEventItems.push(eventItem);
            });

            let encodedContinueToken = '';
            if (eventsResponse.metadata.continue !== undefined && eventsResponse.metadata.continue !== null) {
                encodedContinueToken = eventsResponse.metadata.continue;
            }

            return {
                encodedContinueToken: encodedContinueToken,
                formattedEventItems: formattedEventItems
            };
        }
        return {
            encodedContinueToken: null,
            formattedEventItems: []
        };
    }

    /**
     * Separates the response string by newline (\n).
     * @param logResponse raw response representing log items. 
     */
    public interpretLogs(logResponse: any): ILogItem[] {
        if (typeof logResponse === 'string') {
            const formattedLogItems: ILogItem[] = [];
            //split based on newline character which is followed by RFC3339 timestamp
            const newLogRegex = /\n/;
            const logArr = logResponse.split(newLogRegex);
            logArr.forEach((logString) => {
                if (logString.length !== 0) {
                    const timestamp = logString.substr(0, logString.indexOf(' '));
                    const logData = logString.substr(logString.indexOf(' ') + 1);
                    // Verify that we can split the string by timestamp and log data
                    // tslint:disable-next-line:max-line-length
                    const RFC3339 = new RegExp(/^(\d+)-(0[1-9]|1[012])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d|60)(.\d+)?([Zz])$/);
                    if (!RFC3339.test(timestamp)) {
                        //Are we allowed to store the logitem that failed validation?
                        TelemetryFactory.get(this.telemetryArea).logExceptionLimited(
                            'interpretLogsBadTimestamp',
                            new Error('Unable to parse log item properly (The timestamp did not match the RFC3339 format).'),
                            'KubernetesResponseInterpreter.interpretLogs',
                            ErrorSeverity.Error,
                            undefined
                        );
                    } else {
                        const newLogItem = new LogItem(timestamp, logData);
                        formattedLogItems.push(newLogItem);
                    }
                }
            });
            return formattedLogItems;
        } else {
            const err = new Error('Could not interpret the logs because the log response was not a string');
            TelemetryFactory.get(this.telemetryArea).logExceptionLimited(
                'interpretLogsBadType',
                err,
                'KubernetesResponseInterpreter.interpretLogs',
                ErrorSeverity.Error,
                undefined,
                undefined
            );
            console.error(err);
            return [];
        }
    }
    public interpretLiveMetrics(response: any[],
        timestamp: Date,
        nameSpace?: string,
        podName?: string): ILiveDataPoint {
        if (nameSpace !== undefined && podName !== undefined) {
            return this.getLiveTabMetrics(response);
        }
        return this.getLiveMetrics(response, timestamp);
    }

    public isLimitAndRequestCached(): boolean {
        return this.podLimitsCpu !== -1
            && this.podLimitsMemory !== -1
            && this.podRequestsCpu !== -1
            && this.podRequestsMemory !== -1;
    }

    /**
     * Interprets the response payload from the kubernetes API.
     * Expects the following of response:
     * response[0] is the NodeList API result
     * response[1] is the NodeMetricsList API result
     * response[2] is the PodList API result
     * @param response raw response representing current metric data
     * @param timestamp time stamp of when the request was made
     */
    public getLiveMetrics(response: any[], timestamp: Date): ILiveDataPoint {
        if (!response) {
            throw new Error('Parameter response should not be null.');
        }
        if (response.length !== 3) {
            throw new Error('There should be three live metric api responses');
        }
        if (!response[0] || !response[1]) {
            throw new Error('Response should not be undefined.');
        }
        if (!response[0].items || !response[1].items) {
            throw new Error('Response has incorrect format.');
        }

        if (response[0].items.length < 1) {
            throw new Error(`Response contained no active nodes for the CPU or Memory charts`);
        }

        const podCountAggregations = [
            PodCountMetricSeries.All,
            PodCountMetricSeries.Failed,
            PodCountMetricSeries.Pending,
            PodCountMetricSeries.Running,
            PodCountMetricSeries.Succeeded,
            PodCountMetricSeries.Unknown,
        ];

        const { ready, notReady } = this.kubernetesParsingAndAggregation.nodeCounts(response[0]);
        const nodeCpu = this.kubernetesParsingAndAggregation.nodeCpu(response[0], response[1]);
        const nodeMemory = this.kubernetesParsingAndAggregation.nodeMemory(response[0], response[1]);
        const podCounts = this.kubernetesParsingAndAggregation.podCounts(response[2], podCountAggregations);
        const dataPoint: ILiveDataPoint = {
            cpu: {
                [AggregationOption.Min]: this.kubernetesParsingAndAggregation.aggregateMin(nodeCpu),
                [AggregationOption.Max]: this.kubernetesParsingAndAggregation.aggregateMax(nodeCpu),
                [AggregationOption.Avg]: this.kubernetesParsingAndAggregation.aggregateAvg(nodeCpu),
                [AggregationOption.P50]: this.kubernetesParsingAndAggregation.aggregatePercentile(nodeCpu, 50),
                [AggregationOption.P90]: this.kubernetesParsingAndAggregation.aggregatePercentile(nodeCpu, 90),
                [AggregationOption.P95]: this.kubernetesParsingAndAggregation.aggregatePercentile(nodeCpu, 95),
            },
            memory: {
                [AggregationOption.Min]: this.kubernetesParsingAndAggregation.aggregateMin(nodeMemory),
                [AggregationOption.Max]: this.kubernetesParsingAndAggregation.aggregateMax(nodeMemory),
                [AggregationOption.Avg]: this.kubernetesParsingAndAggregation.aggregateAvg(nodeMemory),
                [AggregationOption.P50]: this.kubernetesParsingAndAggregation.aggregatePercentile(nodeMemory, 50),
                [AggregationOption.P90]: this.kubernetesParsingAndAggregation.aggregatePercentile(nodeMemory, 90),
                [AggregationOption.P95]: this.kubernetesParsingAndAggregation.aggregatePercentile(nodeMemory, 95),
            },
            nodeCount: {
                [NodeCountMetricSeries.All]: ready + notReady,
                [NodeCountMetricSeries.Ready]: ready,
                [NodeCountMetricSeries.NotReady]: notReady,
            },
            podCount: podCounts,
            timestamp: timestamp
        };
        return dataPoint;
    }

    /**
    * 
    * Get pod's metrics
    * @param response 
    */
    private getLiveTabMetrics(response: any[]): ILiveDataPoint {
        if (!response) {
            throw new Error('Parameter response should not be null.');
        }

        const podCpuUage = this.kubernetesParsingAndAggregation.parsePodUsage(response[0],
            KubernetesParsingAndAggregation.CpuOrMemory.cpu);
        const podMemoryUsage = this.kubernetesParsingAndAggregation.parsePodUsage(response[0],
            KubernetesParsingAndAggregation.CpuOrMemory.memory)

        this.podLimitsCpu = this.isLimitAndRequestCached()
            ? this.podLimitsCpu
            : this.kubernetesParsingAndAggregation.aggregate(
                this.kubernetesParsingAndAggregation.parsePodLimitsOrRequests(response[1],
                    KubernetesParsingAndAggregation.LimitsOrRequests.limits,
                    KubernetesParsingAndAggregation.CpuOrMemory.cpu));
        this.podLimitsMemory = this.isLimitAndRequestCached()
            ? this.podLimitsMemory
            : this.kubernetesParsingAndAggregation.aggregate(
                this.kubernetesParsingAndAggregation.parsePodLimitsOrRequests(response[1],
                    KubernetesParsingAndAggregation.LimitsOrRequests.limits,
                    KubernetesParsingAndAggregation.CpuOrMemory.memory));
        this.podRequestsCpu = this.isLimitAndRequestCached()
            ? this.podRequestsCpu
            : this.kubernetesParsingAndAggregation.aggregate(
                this.kubernetesParsingAndAggregation.parsePodLimitsOrRequests(response[1],
                    KubernetesParsingAndAggregation.LimitsOrRequests.requests,
                    KubernetesParsingAndAggregation.CpuOrMemory.cpu));

        this.podRequestsMemory = this.isLimitAndRequestCached()
            ? this.podRequestsMemory
            : this.kubernetesParsingAndAggregation.aggregate(
                this.kubernetesParsingAndAggregation.parsePodLimitsOrRequests(response[1],
                    KubernetesParsingAndAggregation.LimitsOrRequests.requests,
                    KubernetesParsingAndAggregation.CpuOrMemory.memory));

        const dataPoint: ILiveDataPoint = {
            cpu: {
                [AggregationOption.Usage]: this.kubernetesParsingAndAggregation.aggregate(podCpuUage),
                [AggregationOption.Limits]: this.podLimitsCpu,
                [AggregationOption.Requests]: this.podRequestsCpu
            },
            memory: {
                [AggregationOption.Usage]: this.kubernetesParsingAndAggregation.aggregate(podMemoryUsage),
                [AggregationOption.Limits]: this.podLimitsMemory,
                [AggregationOption.Requests]: this.podRequestsMemory
            },
            nodeCount: {},
            podCount: {},
            timestamp: null
        };
        return dataPoint;
    }
}
