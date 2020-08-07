import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {
    AiTimeSeriesChart,
    ChartSeriesData,
    IAiChartInteractionsSeriesData,
    ILegendSummaryData,
    ISeriesVisualization
} from '@appinsights/aichartcore';

import { IChartTooltip } from '../shared/IChartTooltip';
import { ITimeInterval } from '../shared/data-provider/TimeInterval';
import { DisplayStrings } from '../shared/DisplayStrings';
import { IVmMetricChartDescriptor } from './VirtualMachineMetricCharts';

class IToolTipState {
}

class IToolTipProps {
    chartControl: AiTimeSeriesChart;
    chartTitle: string;
    data: StringMap<ChartSeriesData>;
    displayResource: boolean;
    id: string;
    interactionsData: IAiChartInteractionsSeriesData;
    selectedSeries: ChartSeriesData[];
    timeInterval: ITimeInterval;
}

/**
 * Component to render data from user interaction within chart tooltip
 */
export class ComputeChartPaneToolTipBody extends React.Component<IToolTipProps, IToolTipState> {
    constructor(props?: any) {
        super(props);
    }

    render(): JSX.Element {
        let date: string = '';
        let time: string = '';
        let data: JSX.Element[] = [];
        if (this.props.interactionsData && this.props.interactionsData.x) {
            const xData = this.props.interactionsData.x;
            date = xData.toLocaleDateString();
            time = xData.toLocaleTimeString();
            data = this.fillDataPoints();
            if (data.length === 0) {
                const key: string = this.props.id + '-no-data';
                data.push(<div key={key} className='no-data'>{DisplayStrings.NoData}</div>)
            }
        }

        return <div className='compute-chart-tooltip-body'>
            <div className='compute-chart-tooltip-head'>{this.props.chartTitle}</div>
            <div className='subtitle'>{date} {time}</div>
            <div>{data}</div>
        </div>
    }

    // Populates tooltip with data from current user interaction on respective chart
    private fillDataPoints(): JSX.Element[] {
        const data: JSX.Element[] = [];
        const stackedDataColumn: any[] = this.props.interactionsData.stackedDataColumn;
        const mergedStackedDataColumn: any[] = this.mergeDataAndVisualization(stackedDataColumn);
        mergedStackedDataColumn.forEach((dataColumn) => {
            const visualization: ISeriesVisualization = dataColumn.visualization;
            const legendElement = this.createLegendElement(dataColumn);
            const key = this.generateUniqueKeyValue(dataColumn.metric, visualization);
            const cssBorderColor = this.createCssBorderColor(visualization);
            const nameElement = this.createNameElement(dataColumn.metric, visualization);
            data.push(<div key={key} className='entry' style={cssBorderColor}>{nameElement}: {legendElement}</div>);
        });
        return data;
    }

    // Merge stacked data columns with their respective visualization and legend conversion function
    private mergeDataAndVisualization(stackedDataColumn: any[]): any[] {
        let mergedData: any[] = [];
        mergedData = stackedDataColumn.map((dataColumn, index) => {
            dataColumn.visualization = this.props.selectedSeries[index].visualization;
            dataColumn.configureLegend = (yValue: number) => {
                return this.props.chartControl._configureLegend(yValue, index);
            };
            return dataColumn
        });
        return mergedData;
    }

    // Creates an element containing value and unit in proper form
    private createLegendElement(dataColumn: any): JSX.Element {
        let value: string = DisplayStrings.NoData;
        let unit: string = '';
        if (!dataColumn.missingValue) {
            const yValue: number = dataColumn.y;
            const legend: ILegendSummaryData = dataColumn.configureLegend(yValue);
            value = legend.value;
            unit = legend.unit;
        }
        const legendElement: JSX.Element = <span><span className='value'>{value}</span>
            <span className='unit'>{unit}</span></span>;
        return legendElement;
    }

    // Generates unique key for React list
    private generateUniqueKeyValue(metricId: any, visualization: ISeriesVisualization): string {
        let id: string = metricId;
        if (this.props.displayResource) {
            id = visualization.resourceDisplayName;
        }
        let key: string = this.props.id + '-' + id;
        return key;
    }

    // Border color for this particular data should match the color in the chart
    private createCssBorderColor(visualization: ISeriesVisualization): React.CSSProperties {
        const color: string = visualization.color;
        const cssBorderColor: React.CSSProperties = { borderColor: color };
        return cssBorderColor;
    }

    // Name element can depend on which type of chart is being rendered
    private createNameElement(metricId: any, visualization: ISeriesVisualization): JSX.Element {
        let name: string = metricId;
        if (this.props.displayResource) {
            name = visualization.resourceDisplayName;
        }
        return <span className='name'>{name}</span>;
    }
}

/**
 * Adapted from StorageErrorToolTipWrapper
 */
export class ComputeChartToolTipWrapper implements IChartTooltip {
    protected displayResourceName: boolean = false;
    private chartControl: AiTimeSeriesChart;
    private chartTitle: string;
    private data: StringMap<ChartSeriesData>;
    private id: string;
    private interactionsData: IAiChartInteractionsSeriesData;
    private selectedSeries: ChartSeriesData[];
    private timeInterval: ITimeInterval;

    constructor(chartDescriptor: IVmMetricChartDescriptor, data: StringMap<ChartSeriesData>, timeInterval: ITimeInterval) {
        this.chartTitle = chartDescriptor.chartDisplayName;
        this.data = data;
        this.id = chartDescriptor.chartId;
        this.timeInterval = timeInterval;
    }

    public bodyDivId(): string {
        return 'tooltip-root-compute-' + this.id;
    }

    public dispose(): void {
        const tooltip: Element = document.getElementById(this.bodyDivId());
        const tooltipBody: Element = tooltip.parentElement;
        const tooltipPadding: Element = tooltipBody.parentElement;
        const tooltipRoot: Element = tooltipPadding.parentElement;
        ReactDOM.unmountComponentAtNode(tooltip);
        ReactDOM.unmountComponentAtNode(tooltipBody);
        tooltipRoot.parentElement.removeChild(tooltipRoot);
    }

    public setInteractionsData(
        interactionsData: IAiChartInteractionsSeriesData,
        selectedSeries: ChartSeriesData[],
        chartControl: AiTimeSeriesChart
    ): void {
        this.chartControl = chartControl;
        this.interactionsData = interactionsData;
        this.selectedSeries = selectedSeries;
        this.render();
    }

    public setPrimaryState(data: StringMap<ChartSeriesData>, timeInterval: ITimeInterval): void {
        this.data = data;
        this.timeInterval = timeInterval;
        this.render();
    }

    public getBodyDivDefinition(): string {
        return '<div id=\"' + this.bodyDivId() + '\"></div>';
    }

    private render() {
        ReactDOM.render(
            <ComputeChartPaneToolTipBody
                chartControl={this.chartControl}
                chartTitle={this.chartTitle}
                data={this.data}
                displayResource={this.displayResourceName}
                id={this.id}
                interactionsData={this.interactionsData}
                selectedSeries={this.selectedSeries}
                timeInterval={this.timeInterval}
            />,
            document.getElementById(this.bodyDivId())
        );
    }
}

/**
 * Contains flag to display resource name instead of the metric within the tooltip
 */
export class ComputeTopNChartToolTipWrapper extends ComputeChartToolTipWrapper {
    constructor(chartDescriptor: IVmMetricChartDescriptor, data: StringMap<ChartSeriesData>, timeInterval: ITimeInterval) {
        super(chartDescriptor, data, timeInterval);
        this.displayResourceName = true;
    }
}
