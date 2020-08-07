/*
* AI Chart Imports
*/
import {
    MetricUnit,
    ISeriesVisualization,
    MissingDataFillingType
} from '@appinsights/aichartcore';

/**
 * Shared Imports
 */
import { DisplayStrings } from '../../../shared/DisplayStrings';
import * as AzureColors from '../../../shared/AzureColors';
import { AggregationOption } from '../../../shared/AggregationOption';


/**
 * All Connection Metrics
 * Added aggregation levels as metrics and metrics as metrics
 * because these metrics can be aggregated on a single chart
 * Like: All 4 link metrics
 */
export const ConnectionMetricName = {
    ResponseTime: 'responseTime',
    AvgResponseTime: 'avgResponseTime',
    MinResponseTime: 'minResponseTime',
    MaxResponseTime: 'maxResponseTime',
    Requests: 'requests',
    BytesSent: 'bytesSent',
    BytesReceived: 'bytesReceived',
    LinksEstablished: 'linksEstablished',
    LinksTerminated: 'linksTerminated',
    LinksLive: 'linksLive',
    LinksFailed: 'linksFailed'
};

/**
 * Connection Metric Descriptor
 * Ideally an IMetric, but since it has more data changed it as a descriptor
 * mappedApiAggregation refers to the type of Aggregation (Avg, Min, Max, Total, Count...)
 * coming from API response
 */
export interface IMetricDescriptor {
    name: string;
    displayName: string;
    mappedAggregation: AggregationOption;
    visualization: ISeriesVisualization;
};

/**
 * A stric class used to initialize connection metrics
 */
export class ConnectionMetrics {
    private static metricMap: StringMap<IMetricDescriptor>;

    public static initialize() {
        ConnectionMetrics.metricMap = {};

        // Average Response Time
        ConnectionMetrics.metricMap[ConnectionMetricName.AvgResponseTime] = {
            name: ConnectionMetricName.AvgResponseTime,
            displayName: DisplayStrings.LegendAvg,
            mappedAggregation: AggregationOption.Avg,
            visualization: this.generateVisualization(
                DisplayStrings.LegendAvg, AzureColors.PINK, MetricUnit.MilliSeconds
            )
        };

        // Maximum Response Time
        ConnectionMetrics.metricMap[ConnectionMetricName.MaxResponseTime] = {
            name: ConnectionMetricName.MaxResponseTime,
            displayName: DisplayStrings.LegendMax,
            mappedAggregation: AggregationOption.Max,
            visualization: this.generateVisualization(
                DisplayStrings.LegendMax, AzureColors.YELLOW, MetricUnit.MilliSeconds
            )
        };

        // Minimum Response Time
        ConnectionMetrics.metricMap[ConnectionMetricName.MinResponseTime] = {
            name: ConnectionMetricName.MinResponseTime,
            displayName: DisplayStrings.LegendMin,
            mappedAggregation: AggregationOption.Min,
            visualization: this.generateVisualization(
                DisplayStrings.LegendMin, AzureColors.LIGHT_GREEN, MetricUnit.MilliSeconds
            )
        };

        // Requests
        ConnectionMetrics.metricMap[ConnectionMetricName.Requests] = {
            name: ConnectionMetricName.Requests,
            displayName: DisplayStrings.ConnectionRequests,
            mappedAggregation: AggregationOption.Requests,
            visualization: this.generateVisualization(
                DisplayStrings.ConnectionRequests, AzureColors.PINK, MetricUnit.Count
            )
        };

        // Bytes Sent
        ConnectionMetrics.metricMap[ConnectionMetricName.BytesSent] = {
            name: ConnectionMetricName.BytesSent,
            displayName: DisplayStrings.ConnectionBytesSent,
            mappedAggregation: AggregationOption.BytesSent,
            visualization: this.generateVisualization(
                DisplayStrings.ConnectionBytesSent, AzureColors.PINK, MetricUnit.Bytes
            )
        };

        // Bytes Received
        ConnectionMetrics.metricMap[ConnectionMetricName.BytesReceived] = {
            name: ConnectionMetricName.BytesReceived,
            displayName: DisplayStrings.ConnectionBytesReceived,
            mappedAggregation: AggregationOption.BytesReceived,
            visualization: this.generateVisualization(
                DisplayStrings.ConnectionBytesReceived, AzureColors.YELLOW, MetricUnit.Bytes
            )
        };

        // Links Live
        ConnectionMetrics.metricMap[ConnectionMetricName.LinksLive] = {
            name: ConnectionMetricName.LinksLive,
            displayName: DisplayStrings.ConnectionLinksLive,
            mappedAggregation: AggregationOption.LinksLive,
            visualization: this.generateVisualization(
                DisplayStrings.ConnectionLinksLive, AzureColors.YELLOW, MetricUnit.Count
            )
        };

        // Links Failed
        ConnectionMetrics.metricMap[ConnectionMetricName.LinksFailed] = {
            name: ConnectionMetricName.LinksFailed,
            displayName: DisplayStrings.ConnectionLinksFailed,
            mappedAggregation: AggregationOption.LinksFailed,
            visualization: this.generateVisualization(
                DisplayStrings.ConnectionLinksFailed, AzureColors.PINK, MetricUnit.Count
            )
        };

        // Links Terminated
        ConnectionMetrics.metricMap[ConnectionMetricName.LinksTerminated] = {
            name: ConnectionMetricName.LinksTerminated,
            displayName: DisplayStrings.ConnectionLinksTerminated,
            mappedAggregation: AggregationOption.LinksTerminated,
            visualization: this.generateVisualization(
                DisplayStrings.ConnectionLinksTerminated, AzureColors.LIGHT_GREEN, MetricUnit.Count
            )
        };

        // Links Established
        ConnectionMetrics.metricMap[ConnectionMetricName.LinksEstablished] = {
            name: ConnectionMetricName.LinksEstablished,
            displayName: DisplayStrings.ConnectionLinksEstablished,
            mappedAggregation: AggregationOption.LinksEstablished,
            visualization: this.generateVisualization(
                DisplayStrings.ConnectionLinksEstablished, AzureColors.GREEN, MetricUnit.Count
            )
        };
    }

    public static get(metricName: string): IMetricDescriptor {
        return ConnectionMetrics.metricMap[metricName];
    }

    private static generateVisualization(
        displayName: string,
        color: string,
        unit: MetricUnit): ISeriesVisualization {
            return {
                displayName: displayName,
                resourceDisplayName: '',
                color: color,
                unit: unit,
                displaySIUnit: true,
                missingDataFillType: MissingDataFillingType.FillWithZero
            };
        }
}

// initialize static connection metrics class
ConnectionMetrics.initialize();
