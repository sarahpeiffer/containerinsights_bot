import * as D3 from 'd3';
import { GridTrendLineColor }  from './GridTrendLineColor';

export interface IMetricDescriptor {
    name: string,
    isHigherValueBetter: boolean,    
    colorCodeRange: string[],
    getTrendBarHeightFraction(value: number, maxValue?: number): number,
    getTrendBarColor(value: number, maxValue?: number): string,
    formatValue(value: number): string
}

export interface IMetric {
    name: string,
    displayName: string,
    descriptor: IMetricDescriptor
}

export interface IMetricMap {
    [K: string]: IMetric
}

export class FixedMaxValueMetricDescriptor implements IMetricDescriptor {
    private _name: string;
    private _isHigherValueBetter: boolean;
    private _maxValueToNormalize: number;
    private _formatValue: (value: number) => string;
    private _colorCodeRange: string[];

    constructor(
        name: string,
        isHigherValueBetter: boolean, 
        maxValueToNormalize: number,
        formatValue: (value: number) => string,
        colorCodeRange?: string[]
    ) {
        this._name = name;
        this._isHigherValueBetter = isHigherValueBetter;
        this._formatValue = formatValue;
        this._maxValueToNormalize = maxValueToNormalize > 0 ? maxValueToNormalize : 1;      
        
         if ( colorCodeRange && (colorCodeRange.length >= 2) ) {
             this._colorCodeRange = colorCodeRange; 
         } else {
             this._colorCodeRange = this._isHigherValueBetter ? [GridTrendLineColor.Red, GridTrendLineColor.Green] : 
             [GridTrendLineColor.Green, GridTrendLineColor.Red];
         }
    }

    get name(): string {
        return this._name;
    }

    get isHigherValueBetter(): boolean {
        return this._isHigherValueBetter;
    }
     
    get colorCodeRange(): string[] {
        return this._colorCodeRange;
    }

    public getTrendBarHeightFraction(value: number): number {
        let adjustedValue = value > 0 ? value : 0;
        if (adjustedValue > this._maxValueToNormalize) {
            adjustedValue = this._maxValueToNormalize;
        }

        return adjustedValue / this._maxValueToNormalize;
    }

    public getTrendBarColor(value: number): string {
        const colorCode = D3.scale.linear<string>().interpolate(D3.interpolateHsl)
        .domain([0, this._maxValueToNormalize])
        .range(this._colorCodeRange).clamp(true);

        return colorCode(value);
    }

    public formatValue(value: number): string {
        return this._formatValue(value);
    }
}

export class VariableMaxValueMetricDescriptor implements IMetricDescriptor {
    private _name: string;
    private _isHigherValueBetter: boolean;    
    private _formatValue: (value: number) => string;
    private _colorCodeRange: string[];

    constructor(
        name: string,
        isHigherValueBetter: boolean, 
        formatValue: (value: number) => string,
        colorCodeRange?: string[]
    ) {
        this._name = name;
        this._isHigherValueBetter = isHigherValueBetter;
        this._formatValue = formatValue;        
        
        if ( colorCodeRange && (colorCodeRange.length >= 2) ) {
             this._colorCodeRange = colorCodeRange; 
         } else {        
             this._colorCodeRange = this._isHigherValueBetter ? [GridTrendLineColor.Red, GridTrendLineColor.Green] :
              [GridTrendLineColor.Green, GridTrendLineColor.Red];
         }
        
    }

    get name(): string {
        return this._name;
    }

    get isHigherValueBetter(): boolean {
        return this._isHigherValueBetter;
    }  

    get colorCodeRange(): string[] {
        return this._colorCodeRange;
    }

    public getTrendBarHeightFraction(value: number, maxValue: number): number {
        let maxValueToNormalize = maxValue;

        let adjustedValue = value > 0 ? value : 0;
        if (adjustedValue > maxValueToNormalize) {
            adjustedValue = maxValueToNormalize;
        }

        return adjustedValue / maxValueToNormalize;
    }


    public getTrendBarColor(value: number, maxValue: number): string {
        let maxValueToNormalize = maxValue;

        const colorCode = D3.scale.linear<string>().interpolate(D3.interpolateHsl)
            .domain([0, maxValueToNormalize])
            .range(this._colorCodeRange).clamp(true);

        return colorCode(value);
    }    

    public formatValue(value: number): string {
        return this._formatValue(value);
    }
}
