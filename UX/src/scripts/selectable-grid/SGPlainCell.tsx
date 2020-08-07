import * as React from 'react';

import { SGCellProps } from './SelectableGridData';

export const SGPlainCell: React.StatelessComponent<SGCellProps> =
    ({ value }) => {
        if (value.title) {
            return <div className='sg-text' title={value.title}>{value.displayValue}</div>;
        } else if (value.displayValue) {
            return <div className='sg-text'>{value.displayValue}</div>;
        } else {
            return <div className='sg-text'>{value}</div>;
        }
    };

export const SGFormattedPlainCell = (formatter: (data: any) => string, titler: (data: any) => string):
    React.StatelessComponent<SGCellProps> => {
    return (props: SGCellProps) => {
        return SGPlainCell({
            value: {
                displayValue: formatter(props.value),
                title: titler(props.value),
            }, rowSelected: props.rowSelected
        });
    };
};
