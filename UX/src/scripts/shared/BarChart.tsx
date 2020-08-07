/** tpl */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as $ from 'jquery';
import * as d3 from 'd3';
import * as uuid from 'uuid';

/** local */
import { DisplayStrings } from './DisplayStrings';
import { MetricValueFormatter } from './MetricValueFormatter';

/** TODO: not cool to refer to containers from shared code */
import { TrendLineToolTipBody } from '../container/grids/shared/TrendLineToolTipBody';

/** styles */
import '../../styles/shared/TrendBarChart.less';
import { ITrendBarChartDataPoint } from '../container/grids/shared/SGTrendChartCell';

/** containers */
interface IBarChartProps {
    data: any[];
    maxValue?: number;
    svgWidthPx?: number;
    getBarWidthFraction(dataPoint: any): number;
    getBarHeightFraction(dataPoint: any, maxValue?: number): number;
    getBarXPositionFraction(dataPoint: any): number;
    getBarColor(dataPoint: any, maxValue?: number): string;
    getFormattedValue?(dataPoint: any): string;
}

interface IBarChartState {
    svg: any;
    selectedBarIndex: number;
}

const MaxBarHeightPx: number = 32; // 37 - 5: top padding 
const SvgWidthPx: number = 175; // default width for sg column for trendline
const SvgHeightPx: number = 37;

export class BarChart extends React.Component<IBarChartProps, IBarChartState> {
    private id: string;
    private svgWidthPx: number;
    private altKeyDepressed: boolean;
    private sortedData: any[];

    constructor(props) {
        super(props);

        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.svgWidthPx = this.props.svgWidthPx || SvgWidthPx;

        this.state = {
            svg: undefined,
            selectedBarIndex: -1
        }

        this.id = `id${uuid()}`;
        this.altKeyDepressed = false;
    }

    private static getNewSelectedBarIndex(
        prevState: IBarChartState,
        props: IBarChartProps,
        indexDelta: number
    ): number {
        if (!prevState) { throw new Error(`Parameter @prevState may not be null`); }
        if (!props) { throw new Error(`Parameter @props may not be null`); }

        if (!props.data || !props.data.length) { return -1; }

        let desiredSelectedBarIndex = prevState.selectedBarIndex + indexDelta;

        if (desiredSelectedBarIndex < 0) { desiredSelectedBarIndex = 0; }
        if (desiredSelectedBarIndex > props.data.length - 1) { desiredSelectedBarIndex = props.data.length - 1; }

        return desiredSelectedBarIndex;
    }

    componentDidMount() {

        $('.sg-barchart').keydown((event) => {
            if (!event) { return; }
            if (!this.isEventThis(event.target)) { return; }

            this.onKeyDown(event);
        });

        $('.sg-barchart').keyup((event) => {
            if (!event) { return; }
            if (!this.isEventThis(event.target)) { return; }

            this.onKeyUp(event);
        });

        $('.sg-barchart').blur((event) => {
            if (!event) { return; }
            if (!this.isEventThis(event.target)) { return; }

            this.onBlur();
        });

        this.setState({
            svg: d3.select(`#${this.id}`)
                .append('svg')
                .attr('width', this.svgWidthPx)
                .attr('height', SvgHeightPx)
        });
    }

    public componentDidUpdate(): void {
        // sort data points
        if (this.props.data instanceof Array) {
            this.sortedData = this.props.data
                ? this.props.data.sort((a, b) => { return a.dateTimeUtc - b.dateTimeUtc; })
                : null;
        }
    }

    render() {

        if (this.state.svg) {
            const svg = this.state.svg;
            const data = this.props.data;

            const tooltip = d3.select('#chartToolTipContainer');

            svg.selectAll('rect').remove();
            svg.selectAll('circle').remove();

            if (data) {
                svg.selectAll('rect')
                    .data(data)
                    .enter()
                    .append('rect')
                    .attr('width', (d) => { return this.props.getBarWidthFraction(d) * this.svgWidthPx * 0.75 + 'px'; })
                    .attr('height', (d) => {
                        let barHeightFraction = this.props.maxValue ?
                            this.props.getBarHeightFraction(d, this.props.maxValue) :
                            this.props.getBarHeightFraction(d);
                        let height = barHeightFraction * MaxBarHeightPx;

                        if (height < 1) {
                            height = 1;
                        }
                        return height + 'px';
                    })
                    .attr('x', (d) => { return this.props.getBarXPositionFraction(d) * this.svgWidthPx; })
                    .attr('y', (d, i) => {
                        let barHeightFraction = this.props.maxValue ?
                            this.props.getBarHeightFraction(d, this.props.maxValue) :
                            this.props.getBarHeightFraction(d);

                        return SvgHeightPx - MaxBarHeightPx * barHeightFraction;
                    })
                    .attr('fill', (d) => {
                        let barColor = this.props.maxValue ?
                            this.props.getBarColor(d, this.props.maxValue) :
                            this.props.getBarColor(d);
                        return barColor;
                    })
                    .on('mouseover', (d) => {
                        // no tooltip displayed if metric formatter is not provided
                        if (!this.props.getFormattedValue) { return; }
                        if (!d || !d.value || !d.value.valueItem) { return; }

                        const maxValue = d.value.maxValue || this.props.maxValue;

                        const barColor = this.props.getBarColor(d, maxValue);

                        ReactDOM.render(
                            <TrendLineToolTipBody
                                val={Number(d.value.valueItem)}
                                maxVal={Number(maxValue)}
                                formattedVal={this.getFormattedValue(d)}
                                formattedMaxVal={this.getMaxFormattedValue(d)}
                                barColor={barColor} />,
                            document.getElementById('chartToolTipContainer')
                        );

                        tooltip.style('visibility', 'visible');
                    })
                    .on('mousemove', () => {
                        let event: MouseEvent = d3.event as MouseEvent;
                        tooltip.style('top', (event.clientY - 170) + 'px').style('left', (event.clientX) + 'px');
                    })
                    .on('mouseout', () => {
                        if (document.getElementById('chartToolTipContainer')) {
                            ReactDOM.unmountComponentAtNode(document.getElementById('chartToolTipContainer'));
                            tooltip.style('visibility', 'hidden');
                        }
                    })
                    .on('mouseleave', () => {
                        if (document.getElementById('chartToolTipContainer')) {
                            ReactDOM.unmountComponentAtNode(document.getElementById('chartToolTipContainer'));
                            tooltip.style('visibility', 'hidden');
                        }
                    });
                this.createAccessibilityCover(svg);
            }
        }

        const narratorDescriptionId = this.id + '_desc';
        const narratorLabelId = this.id + '_label';
        const narratorSelectedBarDescriptionId = this.id + '_selectedBarDesc';

        const isBarSelected = (this.state.selectedBarIndex > -1) && (this.state.selectedBarIndex < Infinity);

        const dataPointDescriptionBackgroundClassName = 'data-point-desc-background ' + (isBarSelected ? '' : 'not-visible');
        const dataPointDescriptionAriaClassName = 'data-point-desc ' + (isBarSelected ? '' : 'aria-notread not-visible');
        const chartDescriptionAriaClassName = 'aria-hidden ' + (isBarSelected ? 'aria-notread' : '');

        const chartDescribedById = isBarSelected ? narratorSelectedBarDescriptionId : narratorDescriptionId;

        const barChartClassName = isBarSelected ? ' barchart-opaque' : '';

        return (
            <div className='bar-chart'
                aria-live='polite'
                aria-labelledby={narratorLabelId}
                aria-describedby={chartDescribedById}>
                <div id={this.id} className={barChartClassName}></div>
                <div id={narratorLabelId} className='aria-hidden'>{DisplayStrings.TrendBarChartChartAriaTitle}</div>
                <div id={narratorDescriptionId} className={chartDescriptionAriaClassName}>
                    {this.getChartAriaDescription()}
                </div>
                <div className={dataPointDescriptionBackgroundClassName}></div>
                <div id={narratorSelectedBarDescriptionId}
                    className={dataPointDescriptionAriaClassName}
                    aria-label={this.getDataPointAriaDescription()} // important. Narrator does not want to read div contents here
                    aria-live='polite'>
                    {this.getDataPointDescription()}
                </div>
            </div>
        );
    }

    private getFormattedValue(d: ITrendBarChartDataPoint) {
        if (!d || !d.value || (d.value.valueItem === undefined) || (d.value.valueItem === null)) { return null; }

        return this.props.getFormattedValue(d.value.valueItem);
    }

    private getMaxFormattedValue(d: ITrendBarChartDataPoint) {
        if (!d || !d.value || (d.value.maxValue === undefined) || (d.value.maxValue === null)) { return null; }

        const maxValue = d.value.maxValue || this.props.maxValue;

        return maxValue ? this.props.getFormattedValue(maxValue) : '-';
    }

    private getFormattedPercentValue(d: ITrendBarChartDataPoint) {
        if (!d || !d.value || (d.value.valueItem === undefined) || (d.value.valueItem === null)) { return null; }

        const absoluteValue = d.value.valueItem;
        const maxValue = d.value.maxValue || this.props.maxValue;

        if (!maxValue) { return null; }

        return MetricValueFormatter.formatPercentageValue(100.0 * absoluteValue / maxValue);
    }

    private getDataPointDescription(): string {
        if (!this.props.getFormattedValue) { return null; }
        if (this.state.selectedBarIndex < 0) { return DisplayStrings.TrendBarChartKeyboardTip; }

        const dataPoint = this.sortedData[this.state.selectedBarIndex];

        const formattedValue = this.getFormattedValue(dataPoint);
        const formattedMaxValue = this.getMaxFormattedValue(dataPoint);

        let percentFormatted = this.getFormattedPercentValue(dataPoint);

        return DisplayStrings.TrendBarChartDataPointDescription
            .replace('${val}', formattedValue)
            .replace('${pval}', percentFormatted ? ` (${percentFormatted})` : '')
            .replace('${lim}', formattedMaxValue);
    }

    private createAccessibilityCover(rect) {
        if (this.state.selectedBarIndex < 0) {
            return;
        }

        rect
            .append('rect')
            .attr('width', () => { return 1 + 'px'; })
            .attr('height', () => { return MaxBarHeightPx + 'px'; })
            .attr('x', () => {
                const fraction = this.props.getBarWidthFraction(null);
                const start = (fraction * this.state.selectedBarIndex) * this.svgWidthPx;
                const end = (fraction * (this.state.selectedBarIndex + 1)) * this.svgWidthPx;
                return ((end + start) / 2) - 2;
            })
            .attr('y', () => {
                const delta = SvgHeightPx - MaxBarHeightPx;
                return (delta / 2);
            })
            .attr('fill', () => {
                return 'rgb(77, 144, 254)';
            });


        rect.
            append('circle')
            .attr('cx', () => {
                const fraction = this.props.getBarWidthFraction(null);
                const start = (fraction * this.state.selectedBarIndex) * this.svgWidthPx;
                const end = (fraction * (this.state.selectedBarIndex + 1)) * this.svgWidthPx;
                return ((end + start) / 2) - 2;
            })
            .attr('cy', () => {
                const delta = (SvgHeightPx - MaxBarHeightPx) / 2;
                return (MaxBarHeightPx / 2) + delta;
            })
            .attr('r', () => {
                return 3;
            })
            .attr('fill', () => {
                return 'rgb(77, 144, 254)';
            });
    }

    private getDataPointAriaDescription(): string {
        if (!this.props.data || !this.props.data.length || (this.state.selectedBarIndex < 0)) {
            return null;
        }

        const dataPoint = this.sortedData[this.state.selectedBarIndex];

        let percentFormatted = this.getFormattedPercentValue(dataPoint);

        return (
            DisplayStrings.TrendBarChartDataPointAriaDescription
                .replace('${val}', this.getFormattedValue(dataPoint))
                .replace('${pval}', percentFormatted ? ` (${percentFormatted})` : '')
                .replace('${limitval}', this.getMaxFormattedValue(dataPoint))
                .replace('${dt}', dataPoint.dateTimeUtc.toLocaleString())
                .replace('${idx}', (this.state.selectedBarIndex + 1).toString())
                .replace('${cnt}', this.props.data.length.toString())
        );
    }

    private getChartAriaDescription(): string {
        return (
            (this.props.data && this.props.data.length)
                ? DisplayStrings.TrendBarChartChartAriaDescription
                : DisplayStrings.TrendBarChartEmptyChartAriaDescription
        );
    }

    /**
     * search the dom starting at a given element downward hoping to find
     * this.id somewhere in the chain... if found, return true otherwise false
     * @param element starting element to search for this.id over
     */
    private isEventThis(element) {
        if (!element) { return false; }

        const id = element.id;
        if (id === this.id) { return true; }

        const children = element.children;
        if (children && children.length) {
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                const subIsThis = this.isEventThis(child);
                if (subIsThis) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * triggered onblur... should only be triggered when the target
     * chain includes this element
     */
    private onBlur(): void {
        this.setState({ selectedBarIndex: -1 });
    }

    /**
     * triggered on keydown... should only be triggered when the target
     * chain includes this element
     * @param event jquery event
     */
    private onKeyDown(event: any): void {
        if (!event) { return; }

        if (event.which === 18) {
            this.altKeyDepressed = true;
        } else if ((event.which === 33) && this.altKeyDepressed) {
            this.setState((prevState, props) => {
                return { selectedBarIndex: BarChart.getNewSelectedBarIndex(prevState, props, 1) };
            });
        } else if ((event.which === 34) && this.altKeyDepressed) {
            this.setState((prevState, props) => {
                return { selectedBarIndex: BarChart.getNewSelectedBarIndex(prevState, props, -1) };
            });
        }
    }

    /**
     * triggered on keyup... should only be triggered when the target
     * chain includes this element
     * @param event jquery event
     */
    private onKeyUp(event: any): void {
        if (!event) { return; }

        if (event.which === 18) {
            this.altKeyDepressed = false;
        }
    }
}

export default BarChart;
