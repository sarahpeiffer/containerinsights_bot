/**
 * tpl
 */
import * as React from 'react';

/**
 * local
 */
import { ContainerHostMetrics } from '../../shared/ContainerHostMetrics';

/**
 * shared
 */
import { AggregationOption } from '../../../shared/AggregationOption';
import { DisplayStrings } from '../../../shared/DisplayStrings';
import { FilterPicker } from '../../../shared/FilterPicker'
import { MetricSeriesSelector } from '../../../shared/MetricSeriesSelector';
import { ISeriesSelectorOption } from '../../../shared/ISeriesSelectorOption';

/**
 * styles
 */
import '../../../../styles/shared/GridControlPanel.less';
import '../../../../styles/shared/SeriesSelector.less'

/**
 * Container grid control panel
 */
interface IContainerGridControlPanelProps {
    /** callback invoked when name search filter value is changed */
    onNameSearchFilterChanged: (filterValue: string) => void;

    /** callback invoked when metric selection is changed */
    onMetricSelectionChanged: (metricName: string) => void;

    /** callback invoked when metric aggregation option is toggled */
    onToggleAggregationOption: (selectorId: string, option: AggregationOption) => void;

    /** name search filter value */
    nameSearchFilterValue: string;

    /** selected metric name */
    selectedMetricName: string;

    /** selected metric aggregation option */
    selectedAggregationOption: AggregationOption;

    /** boolean which decides if the name search filter needs animation */
    animateSearchFilter?: boolean;
}

/**
 * Set of aggregation options avaialble for grid metric
 */
const aggregationSelectorOptions: ISeriesSelectorOption[] = [
    { id: AggregationOption.Min, displayName: DisplayStrings.OptionMin, isSelected: false },
    { id: AggregationOption.Avg, displayName: DisplayStrings.OptionAvg, isSelected: false },
    { id: AggregationOption.P50, displayName: DisplayStrings.OptionP50, isSelected: false },
    { id: AggregationOption.P90, displayName: DisplayStrings.OptionP90, isSelected: false },
    { id: AggregationOption.P95, displayName: DisplayStrings.OptionP95, isSelected: false },
    { id: AggregationOption.Max, displayName: DisplayStrings.OptionMax, isSelected: false },
];

/**
 * Container grid control panel component
 * @param props component properties
 */
export const ContainerGridControlPanel: React.StatelessComponent<IContainerGridControlPanelProps> = (props) => {
    const seriesOptions = new Array<ISeriesSelectorOption>();

    for (const aggregationOption of aggregationSelectorOptions) {
        seriesOptions.push({
            id: aggregationOption.id,
            displayName: aggregationOption.displayName,
            isSelected: props.selectedAggregationOption.toString() === aggregationOption.id,
        });
    }

    let searchBoxCss = 'search-for-name-filter';

    if (props.animateSearchFilter) {
        searchBoxCss = searchBoxCss + ' search-filter-animation';
    }

    return (
        <div className='pane-control-panel'>
            <div className='control-container'>
                <input type='text' className={searchBoxCss}
                    aria-label={DisplayStrings.EnterNameToSearchFor}
                    value={props.nameSearchFilterValue}
                    placeholder={DisplayStrings.EnterNameToSearchFor}
                    onChange={(e) => { 
                        if (e && e.target) { 
                            props.onNameSearchFilterChanged(e.target.value); 
                        }
                    }}
                />
            </div>
            <div className='label-container'>
                <label aria-label={DisplayStrings.MetricSelectorTitle}>{DisplayStrings.MetricSelectorTitle}</label>
            </div>
            <div className='control-container metric-dropdown-container'>
                <FilterPicker
                    filters={ContainerHostMetrics.list()}
                    onSelectionChanged={props.onMetricSelectionChanged}
                    selectedFilterName={props.selectedMetricName}
                />
            </div>
            <div className='grid-series-selector'>
                <MetricSeriesSelector
                    selectorId={'grid-ggregation'} 
                    seriesOptions={seriesOptions}
                    onToggleOption={props.onToggleAggregationOption}
                />
            </div>
        </div>
    );
}
