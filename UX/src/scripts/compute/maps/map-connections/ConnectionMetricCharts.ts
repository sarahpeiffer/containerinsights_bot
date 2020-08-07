import {
    ChartTypes,
    Positions,
    AxisType,
    IChartVisualization
} from '@appinsights/aichartcore';

import { DisplayStrings } from '../../../shared/DisplayStrings';
import { AggregationOption } from '../../../shared/AggregationOption';
import { ConnectionMetricName } from './ConnectionMetrics';

export const ConnectionMetricChartName = {
    ResponseTime: 'responseTime',
    Requests: 'requests',
    Traffic: 'traffic',
    Links: 'links'
};

export interface IMetricChartDescriptor {
    chartName: string,
    displayName: string,
    info: string,
    metrics: string[],
    availableAggregationOptions: AggregationOption[],
    defaultSelectedAggregationOptions: AggregationOption[],
    visualization?: IChartVisualization
};

const valueVisualization: IChartVisualization = {
    chartType: ChartTypes.Line,
    legend: {
        isVisible: true,
        position: Positions.Bottom,
        hideSubtitle: true
    },
    containerSize: {
        height: 200
    },
    axis: {
        x: {
            isVisible: true,
            axisType: AxisType.DateLocal
        },
        y: {
            isVisible: true,
            axisType: AxisType.Number
        }
    },
    size: {
        height: 200
    }
};

export class ConnectionMetricCharts {
    private static chartMap: StringMap<IMetricChartDescriptor>;
    private static chartList = new Array<IMetricChartDescriptor>();

    static initialize() {
        ConnectionMetricCharts.chartMap = {};

        // Traffic
        let aggregationOptions = [AggregationOption.BytesSent, AggregationOption.BytesReceived];
        let connectionMetrics = [ConnectionMetricName.BytesSent, ConnectionMetricName.BytesReceived];

        ConnectionMetricCharts.chartMap[ConnectionMetricChartName.Traffic] = {
            chartName: ConnectionMetricChartName.Traffic,
            displayName: DisplayStrings.ConnectionTraffic,
            info: DisplayStrings.ConnectionTrafficInfo,
            metrics: connectionMetrics,
            availableAggregationOptions: aggregationOptions,
            defaultSelectedAggregationOptions: aggregationOptions,
            visualization: valueVisualization
        };

        ConnectionMetricCharts.chartList.push(
            ConnectionMetricCharts.chartMap[ConnectionMetricChartName.Traffic]
        );

        // Links
        aggregationOptions = [AggregationOption.LinksFailed,
        AggregationOption.LinksLive,
        AggregationOption.LinksEstablished,
        AggregationOption.LinksTerminated];

        connectionMetrics = [ConnectionMetricName.LinksFailed,
        ConnectionMetricName.LinksLive,
        ConnectionMetricName.LinksEstablished,
        ConnectionMetricName.LinksTerminated];

        ConnectionMetricCharts.chartMap[ConnectionMetricChartName.Links] = {
            chartName: ConnectionMetricChartName.Links,
            displayName: DisplayStrings.ConnectionLinks,
            info: DisplayStrings.ConnectionLinksInfo,
            metrics: connectionMetrics,
            availableAggregationOptions: aggregationOptions,
            defaultSelectedAggregationOptions: aggregationOptions,
            visualization: valueVisualization
        };

        ConnectionMetricCharts.chartList.push(
            ConnectionMetricCharts.chartMap[ConnectionMetricChartName.Links]
        );

        // Requests
        aggregationOptions = [AggregationOption.Requests];
        connectionMetrics = [ConnectionMetricName.Requests];

        ConnectionMetricCharts.chartMap[ConnectionMetricChartName.Requests] = {
            chartName: ConnectionMetricChartName.Requests,
            displayName: DisplayStrings.ConnectionRequests,
            info: DisplayStrings.ConnectionRequestsInfo,
            metrics: connectionMetrics,
            availableAggregationOptions: aggregationOptions,
            defaultSelectedAggregationOptions: aggregationOptions,
            visualization: valueVisualization
        };

        ConnectionMetricCharts.chartList.push(
            ConnectionMetricCharts.chartMap[ConnectionMetricChartName.Requests]
        );

        // Response Time
        aggregationOptions = [AggregationOption.Avg, AggregationOption.Max, AggregationOption.Min];
        connectionMetrics = [ConnectionMetricName.AvgResponseTime,
        ConnectionMetricName.MaxResponseTime,
        ConnectionMetricName.MinResponseTime];

        let defaultAggregationOptions = [AggregationOption.Avg, AggregationOption.Max]

        ConnectionMetricCharts.chartMap[ConnectionMetricChartName.ResponseTime] = {
            chartName: ConnectionMetricChartName.ResponseTime,
            displayName: DisplayStrings.ConnectionResponseTime,
            info: DisplayStrings.ConnectionResponseTimeInfo,
            metrics: connectionMetrics,
            availableAggregationOptions: aggregationOptions,
            defaultSelectedAggregationOptions: defaultAggregationOptions,
            visualization: valueVisualization
        };

        ConnectionMetricCharts.chartList.push(
            ConnectionMetricCharts.chartMap[ConnectionMetricChartName.ResponseTime]
        );
    }

    public static get(metricName: string): IMetricChartDescriptor {
        return ConnectionMetricCharts.chartMap[metricName];
    }

    public static list(): IMetricChartDescriptor[] {
        return ConnectionMetricCharts.chartList;
    }
}

// initialize static connection metric chart class
ConnectionMetricCharts.initialize();
