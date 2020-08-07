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

/**
 * List of series available for 'node count' metric
 */
export enum NodeCountMetricSeries {
    All = 'All',
    Ready = 'Ready',
    NotReady = 'NotReady'
}

/**
 * List of series available for 'pod count' metric
 */
export enum PodCountMetricSeries {
    All = 'all',
    Pending = 'pending',
    Running = 'running',
    Succeeded = 'succeeded',
    Failed = 'failed',
    Unknown = 'unknown',
}

/**
 * Describes container metric chart
 */
export interface IContainerMetricChartDescriptor {
    /** chart id for internal use */
    chartId: string;

    /** display chart name */
    chartDisplayName: string;

    /** chart visualization properties */
    visualization?: IChartVisualization;

    /** initial (default) set of data series selectors */
    defaultSeriesSelections: any;
}

/**
 * string map of chart descriptors organized by chart id
 */
interface IContainerMetricChartDescriptorMap {
    [K: string]: IContainerMetricChartDescriptor
}

/**
 * All chart ids
 */
export enum ContainerMetricChartId {
    Cpu = 'cpu',
    Memory = 'memory',
    NodeCount = 'node-count',
    PodCount = 'pod-count'
}

/**
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

/**
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
export class ContainerMetricChart {
    /** chart map oranized by chart ids */
    private static chartMap: IContainerMetricChartDescriptorMap;

    /** chart list in order of visualization */
    private static chartList: IContainerMetricChartDescriptor[];

    /** live data chart map oranized by chart ids */
    private static chartMapLive: IContainerMetricChartDescriptorMap;

    /** live data chart list in order of visualization */
    private static chartListLive: IContainerMetricChartDescriptor[];

    /**
     * Initializes static instance of the class
     */
    static initialize() {
        ContainerMetricChart.chartMap = {};
        ContainerMetricChart.chartList = new Array<IContainerMetricChartDescriptor>();

        ContainerMetricChart.chartMapLive = {};
        ContainerMetricChart.chartListLive = new Array<IContainerMetricChartDescriptor>();
        // live cpu chart
        ContainerMetricChart.addLive(
            ContainerMetricChartId.Cpu,
            DisplayStrings.ContainerChartPodCpuUtilization,
            countVisualization,
            ContainerMetricChart.getPodMetricSeriesSelections);

        // live memory chart
        ContainerMetricChart.addLive(
            ContainerMetricChartId.Memory,
            DisplayStrings.ContainerChartPodMemoryUtilization,
            countVisualization,
            ContainerMetricChart.getPodMetricSeriesSelections);
        
        // cpu chart
        ContainerMetricChart.add(
            ContainerMetricChartId.Cpu,
            DisplayStrings.ContainerChartNodeCpuUtilization,
            percentVisualization,
            ContainerMetricChart.getDefaultClusterPerformanceMetricSeriesSelections);

        // memory chart
        ContainerMetricChart.add(
            ContainerMetricChartId.Memory,
            DisplayStrings.ContainerChartNodeMemoryUtilization,
            percentVisualization,
            ContainerMetricChart.getDefaultClusterPerformanceMetricSeriesSelections);

        // node count chart
        ContainerMetricChart.add(
            ContainerMetricChartId.NodeCount,
            DisplayStrings.ContainerChartNodeCount,
            countVisualization,
            ContainerMetricChart.getNodeCountMetricSeriesSelections);

        // pod count chart
        ContainerMetricChart.add(
            ContainerMetricChartId.PodCount,
            DisplayStrings.ContainerChartPodCount,
            countVisualization,
            ContainerMetricChart.getPodCountMetricSeriesSelections);
    }

    /**
     * Gets chart descriptor
     * @param chartId Chart id
     * @returns {IContainerMetricChartDescriptor} chart descriptor
     */
    public static get(chartId: string): IContainerMetricChartDescriptor {
        return ContainerMetricChart.chartMap[chartId];
    }

    /**
     * Provides a list of all container metric charts in display order
     * @returns {IContainerMetricChartDescriptor[]} list of chart descriptors
     */
    public static list(): IContainerMetricChartDescriptor[] {
        return ContainerMetricChart.chartList;
    }

    /**
     * Provides a list of all container metric charts in display order
     * @returns {IContainerMetricChartDescriptor[]} list of chart descriptors
     */
    public static listLive(): IContainerMetricChartDescriptor[] {
            return ContainerMetricChart.chartListLive;
    }


    private static add (
        chartId: string,
        chartDisplayName: string,
        visualization: IChartVisualization,
        defaultSeriesSelectionsFactory: () => any
    ): void {
        ContainerMetricChart.chartMap[chartId] = {
            chartId,
            chartDisplayName,
            visualization,
            defaultSeriesSelections: defaultSeriesSelectionsFactory()
        };
        ContainerMetricChart.chartList.push(ContainerMetricChart.chartMap[chartId]);        
    }

    /**
     * add default chart live list
     * @param chartId chart id
     * @param chartDisplayName display name 
     * @param visualization visualization
     * @param defaultSeriesSelectionsFactory 
     */

    private static addLive (
        chartId: string,
        chartDisplayName: string,
        visualization: IChartVisualization,
        defaultSeriesSelectionsFactory: () => any
    ): void {
        ContainerMetricChart.chartMapLive[chartId] = {
            chartId,
            chartDisplayName,
            visualization,
            defaultSeriesSelections: defaultSeriesSelectionsFactory(),
        };    
        ContainerMetricChart.chartListLive.push(ContainerMetricChart.chartMapLive[chartId]);
    }

    /**
     * Constructs selection options for cluster performance metrics (cpu, memory)
     * @returns {string[]} array of possible selection options
     */
    private static getDefaultClusterPerformanceMetricSeriesSelections(): ISeriesSelectorOption[] {
        return [
            { id: AggregationOption.Avg, displayName: DisplayStrings.OptionAvg, isSelected: true},
            { id: AggregationOption.Min, displayName: DisplayStrings.OptionMin, isSelected: false},
            { id: AggregationOption.P50, displayName: DisplayStrings.OptionP50, isSelected: false},
            { id: AggregationOption.P90, displayName: DisplayStrings.OptionP90, isSelected: false},
            { id: AggregationOption.P95, displayName: DisplayStrings.OptionP95, isSelected: false},
            { id: AggregationOption.Max, displayName: DisplayStrings.OptionMax, isSelected: true},
        ];
    }

    /**
     * Constructs selection options for cluster node count metric
     * @returns {string[]} array of possible selection options
     */
    private static getNodeCountMetricSeriesSelections(): ISeriesSelectorOption[] {
        return [
            { id: NodeCountMetricSeries.All,      displayName: DisplayStrings.OptionAll,      isSelected: false},
            { id: NodeCountMetricSeries.Ready,    displayName: DisplayStrings.OptionReady,    isSelected: true},
            { id: NodeCountMetricSeries.NotReady, displayName: DisplayStrings.OptionNotReady, isSelected: true},
        ];
    }

    /**
     * Constructs selection options for cluster pod count metric
     * @returns {string[]} array of possible selection options
     */
    private static getPodCountMetricSeriesSelections(): ISeriesSelectorOption[] {
        return [
            { id: PodCountMetricSeries.All,       displayName: DisplayStrings.OptionAll,       isSelected: false},
            { id: PodCountMetricSeries.Pending,   displayName: DisplayStrings.OptionPending,   isSelected: true},
            { id: PodCountMetricSeries.Running,   displayName: DisplayStrings.OptionRunning,   isSelected: true},
            { id: PodCountMetricSeries.Unknown,   displayName: DisplayStrings.OptionUnknown,   isSelected: true},
            { id: PodCountMetricSeries.Succeeded, displayName: DisplayStrings.OptionSucceeded, isSelected: true},
            { id: PodCountMetricSeries.Failed,    displayName: DisplayStrings.OptionFailed,    isSelected: true},
        ];
    }

    /**
     * Constructs selection options for pod metric
     * @returns {string[]} array of possible selection options
     */
    private static getPodMetricSeriesSelections(): ISeriesSelectorOption[] {
        return [
            { id: AggregationOption.Usage, displayName: DisplayStrings.OptionUsage, isSelected: true},
            { id: AggregationOption.Limits, displayName: DisplayStrings.OptionLimits, isSelected: false},
            { id: AggregationOption.Requests, displayName: DisplayStrings.OptionRequests, isSelected: false}
        ];
    }
}

// initialize static Container metric chart class
ContainerMetricChart.initialize();
