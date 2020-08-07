import * as React from 'react';
import { StringHelpers } from './Utilities/StringHelpers';

const COLORED_BACKGROUND_VALUE_THRESHOLD: number = 0.3;

export interface SGCellProps {
    value: any;
    maxValue?: number;
    rowSelected: boolean;
}

export const SGColoredCell: React.StatelessComponent<SGCellProps> = ({ value }) => {
    let additionalClassNames: string = '';
    if (value.color) {
        additionalClassNames += ' colored-sg-cell-formatting';
    } else if (value.isFormatted) {
        additionalClassNames += ' center-text';
    }
    return <div
        className={'sg-text' + additionalClassNames}
        style={value.color ? { backgroundColor: value.color } : {}}
        title={value.displayValue}
    >
        {value.displayValue}
    </div>;
};

export const SGFormattedColoredCellContainers = (formatter: (data: any) => string, colorPicker: (data: any) => string,
    dataNormalizer: (data: any) => any, isHigherValueBetter: () => boolean):
    React.StatelessComponent<SGCellProps> => {
    return (props: SGCellProps) => {
        let color;
        if (isHigherValueBetter()) {
            color = (dataNormalizer(props.value) <= COLORED_BACKGROUND_VALUE_THRESHOLD ? colorPicker(props.value) : undefined);
        } else {
            color = (dataNormalizer(props.value) >= (1 - COLORED_BACKGROUND_VALUE_THRESHOLD)
                ? colorPicker(props.value) : undefined);
        }

        return SGColoredCell({
            value: {
                displayValue: formatter(props.value),
                color,
                isFormatted: false
            },
            rowSelected: props.rowSelected,
        });
    };
};

export const SGFormattedColoredCell = (formatter: (data: any) => string, colorPicker: (data: any) => string,
    dataNormalizer: (data: any) => any, isHigherValueBetter: () => boolean):
    React.StatelessComponent<SGCellProps> => {
    return (props: SGCellProps) => {
        let color;
        if (isHigherValueBetter()) {
            color = (dataNormalizer(props.value) <= COLORED_BACKGROUND_VALUE_THRESHOLD ? colorPicker(props.value) : undefined);
        } else {
            color = (dataNormalizer(props.value) >= (1 - COLORED_BACKGROUND_VALUE_THRESHOLD)
                ? colorPicker(props.value) : undefined);
        }

        return SGColoredCell({
            value: {
                displayValue: formatter(props.value),
                color,
                isFormatted: true
            },
            rowSelected: props.rowSelected,
        });
    };
};

export const SGFormattedMaxValuedColoredCell = (formatter: (data: any) => string, colorPicker: (data: any, maxValue: number) => string,
    dataNormalizer: (data: any, maxValue: number) => any, isHigherValueBetter: () => boolean):
    React.StatelessComponent<SGCellProps> => {
    return (props: SGCellProps) => {
        let color;
        if (isHigherValueBetter()) {
            color = (dataNormalizer(props.value, props.maxValue) <= COLORED_BACKGROUND_VALUE_THRESHOLD
                ? colorPicker(props.value, props.maxValue) :
                undefined);
        } else {
            color = (dataNormalizer(props.value, props.maxValue) >= (1 - COLORED_BACKGROUND_VALUE_THRESHOLD)
                ? colorPicker(props.value, props.maxValue) : undefined);
        }

        return SGColoredCell({
            value: {
                displayValue: formatter(props.value),
                color,
                isFormatted: true
            },
            rowSelected: props.rowSelected,
        });
    };
};

export const SGTabChangeLinkCell = (
    formatter: (data: any) => string,
    onClick: (e, data: any) => void
): React.StatelessComponent<SGCellProps> => {
    return (props: SGCellProps) => {
        let textElem: string = '-';
        if (props && props.value && props.value.value && props.value.metaData) {
            textElem = props.value.value;
        }

        if (StringHelpers.equal(textElem, '-')) {
            return <span title={textElem}>{textElem}</span>;
        }

        return <div className='superimpose-z-index'
            role='link'
            aria-label={textElem}
            title={textElem}
            onClick={(event) => {
                event.stopPropagation();
                onClick(event, props.value);
            }}
            tabIndex={0}>
            <div className='sg-text' aria-label={textElem}>
                {textElem && <span className='sg-link'>{textElem}</span>}
            </div></div>;
    };
};
