import * as React from 'react';
import '../../../../styles/shared/TrendLineToolTipBody.less';
import { DisplayStrings } from '../../../shared/DisplayStrings';
class IToolTipState {
}

class IToolTipProps {
    val: number;
    maxVal: number;
    barColor: any;
    formattedVal: string;
    formattedMaxVal: string;
}

export class TrendLineToolTipBody extends React.Component<IToolTipProps, IToolTipState> {
    constructor(props?: any) {
        super(props);
    }

    public render(): JSX.Element {
        let coloredHeight;
        this.props.val > 0
            ? coloredHeight = Math.floor((this.props.val / (this.props.maxVal ? this.props.maxVal : this.props.val) * 100))
            : coloredHeight = 0;
        if (coloredHeight > 100) { 
            coloredHeight = 100; 
        }
        
        const unColoredHeight = 100 - (coloredHeight > 100 ? 100 : coloredHeight);

        const unColoredDivHeight: any = {
            height: unColoredHeight + 'px'
        };

        const coloredDivStyle: any = {
            backgroundColor: this.props.barColor,
            height: coloredHeight + 'px'
        };

        const usageStyle: any = {
            backgroundColor: this.props.barColor
        }

        return (
            <div>
                <div>
                    <div className='bar-divs'>
                        <div className='uncolored-div' style={unColoredDivHeight}></div>
                        <div className='colored-div' style={coloredDivStyle}></div>
                    </div>
                    <div>
                        <div className='flex'>
                            <div className='limit-style'></div>
                            <div className='limit-value-div'>{DisplayStrings.trendBarChartTooltipLimit}: {this.props.formattedMaxVal}</div>
                        </div>
                        <div className='second-value'>
                            <div className='usage' style={usageStyle}></div>
                            <div className='limit-value-div'>{DisplayStrings.trendBarChartTooltipUsage}: {this.props.formattedVal}</div>
                        </div>
                    </div>
                </div>
            </div>

        );
    }
}
