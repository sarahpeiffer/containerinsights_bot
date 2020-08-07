/**
 * 3rd party
 */
import * as React from 'react';

/**
 * Local
 */
import { ISeriesSelectorOption } from './ISeriesSelectorOption';
import { AggregationOption } from '../shared/AggregationOption';
/**
 * Component properties
 */
export interface IMetricSeriesSelectorProps {
    /** id of the chart selector is for */
    selectorId: string;

    /** selection options */
    seriesOptions: ISeriesSelectorOption[];

    /** callback to invoke when option is toggled */
    onToggleOption: (chartId: string, optionId: string) => void;
    
    /** Selector is disabled if true */
    isLoading?: boolean;
}

/**
 * Visual component displaying a set of on/off series selectors
*/
export const MetricSeriesSelector: React.StatelessComponent<IMetricSeriesSelectorProps> = (props) => {
    let optionElements: JSX.Element[] = [];
    const {isLoading = false} = props;

    if (!props.seriesOptions) { return null; }

    for (let option of props.seriesOptions) {        
        if (option.id === AggregationOption.Usage) {
            continue;
        }

        let classStyle = option.isSelected ? 'series-option selected-option' : 'series-option';            
        optionElements.push(
            <div key={option.id}
                className={classStyle} 
                tabIndex={0}                
                onClick={(e) => {
                    if (isLoading) {
                        return;
                    }
                    e.stopPropagation();
                    props.onToggleOption(props.selectorId, option.id);
                }}
                onKeyPress={(e) => {
                    if (isLoading) {
                        return;
                    }
                    let keycode = (e.keyCode ? e.keyCode : e.which);
                    if (keycode === 13 || keycode === 32) {
                        e.stopPropagation();
                        props.onToggleOption(props.selectorId, option.id);
                    }
                }}
                aria-pressed={option.isSelected}
                role='button'
            >
                <span>{option.displayName}</span>
            </div>
        );
    }

    const classNames: string = isLoading ? 'series-selector disabled' : 'series-selector';

    return (
        <div className={classNames} >
            {optionElements}
        </div>
    );
};
