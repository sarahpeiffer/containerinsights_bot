/** block / third party */
import * as React from 'react';
import * as d3 from 'd3';

/**
 * Donut Chart Properties
 */
interface IDonutChartProps {
    /**
     * inner radius of donut
     */
    innerRadius: number,
    /**
     * outer radius of donut
     */
    outerRadius: number,
    /**
     * donut chart data
     */
    donutChartSlices: IDonutChartSlice[]
}

/**
 * donut chart Slice properties
 */
export interface IDonutChartSlice {
    /**label of the Donut slice */
    label: string,
    /**count of this slice */
    value: number,
    /**the color of this slice */
    color: string
}

/**
 * DonutChart component draw single Donut Chart svg
 */
export class DonutChart extends React.Component<IDonutChartProps> {
    /**
     * Component ctor
     * @param props Properties of the component
     */
    constructor(props) {
        super(props);
    }

    /** 
     * public render method (react)
     * @returns {JSX.Element}
    */
    public render(): JSX.Element {
        let paths = this.getDonutChartPaths();

        return (
            <g transform={'translate(' + this.props.outerRadius + ',' + this.props.outerRadius + ')'}>
                {paths}
            </g>
        )
    }

    /**
     * use d3 to calculate the path of the donut chart
     * @returns {JSX.Element}
     */
    private getDonutChartPaths(): JSX.Element[] {
        let paths: JSX.Element[] = [];
        //based on innerRadius and outerRadius, create a arc function. will used to caculate the path of the donut chart.             
        let arc = d3.svg.arc().innerRadius(this.props.innerRadius).outerRadius(this.props.outerRadius);
        //use slice's value to calculate the share of the donut chart, don't sort the order we pass in.
        let pie = d3.layout.pie<IDonutChartSlice>()
            .value(function (slice) { return slice.value; })
            .sort(null);
        //use d3 pie function to get the arc data(seems like it already consider the percentage not absolute value). 
        const arcData: d3.layout.pie.Arc<IDonutChartSlice>[] = pie(this.props.donutChartSlices);
        //used to store the color for different label
        let labelColorMap = {};
        for (let property of this.props.donutChartSlices) {
            labelColorMap[property.label] = property.color;
        }
        //add the <path> for the donut chart. 
        for (let i = 0; i < arcData.length; i++) {
            const data: d3.layout.pie.Arc<IDonutChartSlice> = arcData[i];
            paths.push(<path key={data.data.label} fill={labelColorMap[data.data.label]} d={arc(data as any)} />);
        }

        return paths;
    }
};
