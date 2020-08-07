/**
 * tpl
 */
import { 
    ChartTypes,
    Positions,
    AxisType,
    IChartVisualization 
} from '@appinsights/aichartcore';

/**
 * shared
 */
import { AggregationOption } from '../shared/AggregationOption';
import { DisplayStrings } from '../shared/DisplayStrings';
import { ISeriesSelectorOption } from '../shared/ISeriesSelectorOption';
import { IContainerMetricChartDescriptor } from '../container/ContainerMetricChart';
import * as Palette from '../shared/AzureColors';

/**
 * List of series available for 'node count' metric
 */
export enum ReplicaCountMetricSeries {
    All = 'All',
    Ready = 'Ready',
    NotReady = 'NotReady'
}

/**
 * List of series available for 'pod count' metric
 */
export enum StatusCountMetricSeries {
    Starting = 'starting',
    Started = 'started',
    Stopping = 'stopping', 
    Stopped = 'stopped',
    Pending = 'pending',
    Invalid = 'invalid',
    Total = 'total',
}

/**
 * Mesh metric chart line colors
 */
export const MeshMetricColors = {
    total: Palette.DARK_ORANGE,
    running: Palette.BLUE,
    pending: Palette.YELLOW,
    failed: Palette.PINK,
    succeeded: Palette.GREEN,
    unknown: Palette.LIGHT_BLUE,
    Min: Palette.DARK_ORANGE,
    Avg: Palette.BLUE,
    Max: Palette.YELLOW
};

/** same as container
 * string map of chart descriptors organized by chart id
 */
interface ISFMeshMetricChartDescriptorMap {
    [K: string]: IContainerMetricChartDescriptor
}

/**
 * All chart ids
 */
export enum SFMeshMetricChartId {
    Cpu = 'CpuUtilization',
    Memory = 'MemoryUtilization',
    Replica = 'ServiceInstance',
    Status = 'ContainerStatus'
}

/** same as container
 * Visualization properties for 0-100% type of chart
 */
const percentVisualization: IChartVisualization = {
    chartType: ChartTypes.Line,
    legend: { 
        isVisible: true,
        position: Positions.Bottom
    },
    axis: {
        x: {
            isVisible: true,
            axisType: AxisType.DateLocal
        },
        y: { 
            isVisible: true,
            axisType: AxisType.Number,
            min: 0,
            max: 100
        }
    },
    size: {
        height: 270
    }
};

/** same as container
 * Visualization properties for 'count' type of chart
 */
const countVisualization: IChartVisualization = {
    chartType: ChartTypes.Line,
    legend: { 
        isVisible: true,
        position: Positions.Bottom
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
        height: 270
    }
};

/**
 * Provides services around container metric charts
 */
export class SFMeshMetricChart {
    /** chart map oranized by chart ids */
    private static chartMap: ISFMeshMetricChartDescriptorMap;

    /** chart list in order of visualization */
    private static chartList: IContainerMetricChartDescriptor[];

    /**
     * Initializes static instance of the class
     */
    static initialize() {
        SFMeshMetricChart.chartMap = {};
        SFMeshMetricChart.chartList = new Array<IContainerMetricChartDescriptor>();

        // cpu chart
        SFMeshMetricChart.add(
            SFMeshMetricChartId.Cpu,
            DisplayStrings.MeshChartCpuUtilization,
            percentVisualization,
            SFMeshMetricChart.getDefaultAppPerformanceMetricSeriesSelections);

        // memory chart
        SFMeshMetricChart.add(
            SFMeshMetricChartId.Memory,
            DisplayStrings.MeshChartMemoryUtilization,
            percentVisualization,
            SFMeshMetricChart.getDefaultAppPerformanceMetricSeriesSelections);

        // replica count chart
        SFMeshMetricChart.add(
            SFMeshMetricChartId.Replica,
            DisplayStrings.MeshChartReplicaCount,
            countVisualization,
            SFMeshMetricChart.getReplicaCountMetricSeriesSelections);

        // container status count chart
        SFMeshMetricChart.add(
            SFMeshMetricChartId.Status,
            DisplayStrings.MeshChartStatusCount,
            countVisualization,
            SFMeshMetricChart.getStatusCountMetricSeriesSelections);
    }

    /**
     * Gets chart descriptor
     * @param chartId Chart id
     * @returns {IContainerMetricChartDescriptor} chart descriptor
     */
    public static get(chartId: string): IContainerMetricChartDescriptor {
        return SFMeshMetricChart.chartMap[chartId];
    }

    /**
     * Provides a list of all container metric charts in display order
     * @returns {IContainerMetricChartDescriptor[]} list of chart descriptors
     */
    public static list(): IContainerMetricChartDescriptor[] {
        return SFMeshMetricChart.chartList;
    }

    private static add (
        chartId: string,
        chartDisplayName: string,
        visualization: IChartVisualization,
        defaultSeriesSelectionsFactory: () => any
    ): void {
        SFMeshMetricChart.chartMap[chartId] = {
            chartId,
            chartDisplayName,
            visualization,
            defaultSeriesSelections: defaultSeriesSelectionsFactory()
        };

        SFMeshMetricChart.chartList.push(SFMeshMetricChart.chartMap[chartId]);
    }

    /**
     * Constructs selection options for cluster performance metrics (cpu, memory)
     * @returns {string[]} array of possible selection options
     */
    private static getDefaultAppPerformanceMetricSeriesSelections(): ISeriesSelectorOption[] {
        return [
            { id: AggregationOption.Min, displayName: DisplayStrings.OptionMin, isSelected: false},
            { id: AggregationOption.Avg, displayName: DisplayStrings.OptionAvg, isSelected: true},
            { id: AggregationOption.Max, displayName: DisplayStrings.OptionMax, isSelected: false},
        ];
    }

    /**
     * Constructs selection options for replica count metric
     * @returns Array consisting of an empty string as all replica lines must be visualized
     */
    private static getReplicaCountMetricSeriesSelections(): ISeriesSelectorOption[] {
        return [
            { id: undefined, displayName: undefined, isSelected: false }
        ];
    }
    
     /**
     * Constructs selection options for status count metric
     * @returns {string[]} array of possible selection options
     */
    private static getStatusCountMetricSeriesSelections(): ISeriesSelectorOption[] {
        return [
            { id: StatusCountMetricSeries.Total, displayName: DisplayStrings.OptionAll, isSelected: false},
            { id: StatusCountMetricSeries.Starting, displayName: DisplayStrings.OptionStarting, isSelected: true},
            { id: StatusCountMetricSeries.Started, displayName: DisplayStrings.OptionStarted, isSelected: true},
            { id: StatusCountMetricSeries.Stopping, displayName: DisplayStrings.OptionStopping, isSelected: true},
            { id: StatusCountMetricSeries.Stopped, displayName: DisplayStrings.OptionStopped, isSelected: true},
            { id: StatusCountMetricSeries.Pending, displayName: DisplayStrings.OptionPending, isSelected: true},
            { id: StatusCountMetricSeries.Invalid, displayName: DisplayStrings.OptionInvalid, isSelected: true},
        ];
    }
}

// initialize static Container metric chart class
SFMeshMetricChart.initialize();
