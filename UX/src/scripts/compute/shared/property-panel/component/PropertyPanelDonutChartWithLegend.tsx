/** block / third party */
import * as React from 'react';
/**
 * shared imports
 */
import { DisplayStrings } from '../../../../shared/DisplayStrings';
/**
* Compute imports
*/
import { IDonutChartSlice, DonutChart } from './DonutChart';

/**
 * Donut Chart Properties
 */
interface IPropertyPanelDonutChartWithLegendProps {
    donutChartSlices: IDonutChartSlice[],
    innerRadius: number;
    outerRadius: number;
}

/**
 * standard scale, if 80, the pass in number unit should be px.
 */
const svgChartScale = 80;

/**
 * this component will return one svg contains a donut chart and legends. 
 * it will consumerd by the expandable component.
 */
export class PropertyPanelDonutChartWithLegend extends React.Component<IPropertyPanelDonutChartWithLegendProps> {
    private sideLegendX: number;
    private sideLegendInterval: number;
    private sideLegendIconWidth: number;
    private sideLegendIconHeight: number;
    private sideLegendIconTextInterval: number;
    private sideLegendTextLabelY: number;
    private sideLegendTextCountY: number;
    private centerLegendCountY: number;
    private centerLegendTitleY: number;

    constructor(props) {
        super(props);
        /**side legend start point x coordinate, 175 px from the left */
        this.sideLegendX = this.props.outerRadius * 175 / svgChartScale;

        /**the distance between different side legends, 50 px */
        this.sideLegendInterval = this.props.outerRadius * 50 / svgChartScale;

        /**the side Legend rect icon's width, 7px */
        this.sideLegendIconWidth = this.props.outerRadius * 7 / svgChartScale;

        /**the side Legend rect icon's Height, 45px */
        this.sideLegendIconHeight = this.props.outerRadius * 45 / svgChartScale;

        /**the distance between icon and legend text */
        this.sideLegendIconTextInterval = this.props.outerRadius * 15 / svgChartScale;

        /**
         * each side legend contains two text, one label and one number
         * these define Y coordinate of the text, the base is top of each side legend 
         * 10 will be 10 px from the top board of each side legend
         * 40 will be 40 px form the top board of each side legend
        */
        this.sideLegendTextLabelY = this.props.outerRadius * 10 / svgChartScale;
        this.sideLegendTextCountY = this.props.outerRadius * 40 / svgChartScale;

        /**
         * the center summary legend contains two text, one label and one number
         * these define Y coordinate of the text, the base is center of the donut chart.
         * -2 will be 2 px up of the donut center.
         * 15 will be 15 px below of the donut center.
         */
        this.centerLegendCountY = this.props.outerRadius * (-2) / svgChartScale;
        this.centerLegendTitleY = this.props.outerRadius * 15 / svgChartScale;
    }

    public render(): JSX.Element {
        let result = this.normalizeSlices();
        return (<svg className='donut-chart-section' tabIndex={0} aria-label='Donut Chart'>
            <DonutChart innerRadius={this.props.innerRadius}
                outerRadius={this.props.outerRadius}
                donutChartSlices={result.donutChartSlices} />
            {this.renderSliceLegend(result.donutChartLegendSlices)}
            {this.renderSummaryLegend(result.totalCount)}
        </svg>);
    }

    /**
     * Pre-Process the props. If property's count<0, transfer it to 0.
     * add all proerty's count, if total equals 0, show default donut chart.
     */
    private normalizeSlices() {
        let totalCount = 0;
        let donutChartLegendSlices: IDonutChartSlice[] = [];
        let donutChartSlices: IDonutChartSlice[] = [];
        if (this.props.donutChartSlices && this.props.donutChartSlices.length > 0) {
            for (let property of this.props.donutChartSlices) {
                let propertyCount = property.value < 0 ? 0 : property.value;
                donutChartLegendSlices.push({
                    label: property.label,
                    color: property.color,
                    value: propertyCount
                });
                totalCount += propertyCount;
            }
        }

        if (totalCount === 0) {
            donutChartSlices = [{ label: '', color: '#D9D9D9', value: 1 }];
        } else {
            donutChartSlices = donutChartLegendSlices;
        }
        return { donutChartLegendSlices: donutChartLegendSlices, totalCount: totalCount, donutChartSlices: donutChartSlices };
    }

    private renderSliceLegend(donutChartSlices: IDonutChartSlice[]): JSX.Element[] {
        let elements: JSX.Element[] = [];
        for (let i = 0; i < donutChartSlices.length; i++) {
            let property = donutChartSlices[i];
            let transform = 'translate(' + this.sideLegendX + ',' + i * this.sideLegendInterval + ')';
            let rectStyle = {
                fill: property.color,
                stroke: property.color
            };
            elements.push(<g transform={transform} key={i}>
                <rect width={this.sideLegendIconWidth} height={this.sideLegendIconHeight} style={rectStyle} />
                <text x={this.sideLegendIconTextInterval} y={this.sideLegendTextLabelY} className='legend-label' >
                    {property.label}</text>
                <text x={this.sideLegendIconTextInterval} y={this.sideLegendTextCountY} className='legend-count' >
                    {property.value}</text>
            </g>);
        }
        return elements;
    }

    private renderSummaryLegend(totalCount: number): JSX.Element {
        let centerSummaryLegendTransform = 'translate(' + this.props.outerRadius + ',' + this.props.outerRadius + ')';
        return <>
            <g transform={centerSummaryLegendTransform}>
                <text transform={'translate(0,' + this.centerLegendCountY + ')'}
                    textAnchor='middle' className='donut-chart-center-legend'>{totalCount}</text>
                <text transform={'translate(0,' + this.centerLegendTitleY + ')'}
                    textAnchor='middle' className='donut-chart-center-legend-title'>{DisplayStrings.Total}</text>
            </g>
        </>;
    }
}
