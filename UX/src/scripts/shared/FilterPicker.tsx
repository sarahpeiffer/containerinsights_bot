import * as React from 'react';
/**
 * shared
 */
import { DisplayStrings } from './DisplayStrings';

export interface IFilterPickerOption {
    name: string,
    displayName: string
}

interface IFilterPickerProperties {
    filters: IFilterPickerOption[],
    onSelectionChanged: (FilterName: string) => void,
    selectedFilterName?: string
}


export class FilterPicker extends React.Component<IFilterPickerProperties, {}> {
    constructor(props) {
        super(props);

        this.selectionChanged = this.selectionChanged.bind(this);

    }
   public render(): JSX.Element {
        return (
            <select 
                className='grid-control-panel-input'
                aria-label={DisplayStrings.MetricFilterDropdown}
                value={ this.props.selectedFilterName }
                onChange={ this.selectionChanged }>
                { this.renderFilterOptions() }
            </select>
        );
    }

    private selectionChanged(e: any): void {
        const FilterName: string = e.target.value;

        this.props.onSelectionChanged(FilterName);
    }

    private renderFilterOptions(): any {
        const options = [];

        for (let i = 0; i < this.props.filters.length; i++) {
            const filter = this.props.filters[i];
            const optionElement = <option key={ filter.name } value={ filter.name }>{ filter.displayName }</option>
            options.push(optionElement);
        }

        return options;
    }
}
