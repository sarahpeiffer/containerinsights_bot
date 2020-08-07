/** 
 * tpl 
 */
import * as React from 'react';

/**
 * styles
 */
import '../../../styles/shared/PropertyPanel.less';

/** 
 * Properties of the tabular property component
    */
export interface ITabularPropertyProps {
    propertyName: string;
    columnNames: string[];
    tabularValues: JSX.Element[][];
    onRowSelected?: (rowNum: number) => void;
}

/**
 * A component to visualize tabular property (grid) on the property panel
 * @param props Visualization properties
 */
export const TabularProperty: React.StatelessComponent<ITabularPropertyProps> = (props) => {
    /**
     * Generates headers row
     */
    function generateHeaders(): JSX.Element {
        let columns: JSX.Element[] = [];

        props.columnNames.forEach((columnName: string) => {
            columns.push(
                <th>{columnName}</th>
            );
        });

        return <thead><tr className='header-row'>{columns}</tr></thead>;
    }

    /**
     * Generates value row
     */
    function generateRow(values: JSX.Element[]): JSX.Element[] {
        let row: JSX.Element[] = [];

        values.forEach((item: JSX.Element) => {
            row.push(
                <td aria-label={item != null && item.props != null && item.props.title != null
                                    ? item.props.title
                                    : ''}
                    tabIndex={0}
                    >
                    {item}
                </td>
            );
        });

        return row;
    }

    /**
     * Generates all value rows
     */
    function generateRows(): JSX.Element[] {
        let rows: JSX.Element[] = [];

        props.tabularValues.forEach((row: JSX.Element[], index: number) => {
            let opts = {};
            if (props.onRowSelected) {
                opts['onClick'] = () => props.onRowSelected(index);
            }
            rows.push(<tr {...opts}>
                {generateRow(row)}
            </tr>);
        });
        return rows;
    }

    /**
     * Checks whether component can be visualized given its contents
     */
    function canVisualize(): boolean {
        let valid = props.columnNames &&
            props.columnNames.length > 0 &&
            props.tabularValues &&
            props.tabularValues.length > 0;

        if (!valid) { return false; }

        props.tabularValues.forEach((row: JSX.Element[]) => {
            //check if row's length matches column length
            if (row.length !== props.columnNames.length) {
                valid = false;
            }
        });

        return valid;
    }

    return canVisualize() ? (
        <div className='tabular-property'>
            <div className='tabular-property-title'>{props.propertyName}</div>
            <div className='tabular-property-grid'><table>{generateHeaders()}<tbody>{generateRows()}</tbody></table></div>
        </div>
    ) : <div></div>;
}
