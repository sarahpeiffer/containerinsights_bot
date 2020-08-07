/** block / third party */
import * as React from 'react';

/**
 * Styles
 */
import '../../../styles/shared/PropertyPanel.less';

export interface IAllServerPortsTablePropertyProps {
    /**
     * property name
     */
    tableHeaders: string[];

    /**
     * property values
     */
    tableData: IPortDetails[];
}

export interface ICheckboxPropertyValueProps {
    displayName: string;
    id: string;
    checked?: boolean;
    onChange: (id: string, checked: boolean) => void;
}



export interface IPortDetails extends ICheckboxPropertyValueProps {
    dependenciesCount: number;
}

export interface ICheckboxPropertyValueState {
}

export class CheckboxPropertyValue extends React.Component<ICheckboxPropertyValueProps, ICheckboxPropertyValueState> {

    constructor(props: ICheckboxPropertyValueProps) {
        super(props);
        this.state = {
        }
    }

    public render(): JSX.Element {
        let checkboxPropertyValue: JSX.Element = <label
            className='checkbox-property-value'
            id={this.props.displayName}>
            <input
                className='checkbox'
                type='checkbox'
                checked={!!this.props.checked}
                value={this.props.id}
                onChange={
                    (event) => {
                        if (event && event.target && event.target.type === 'checkbox'
                            && event.target.value === this.props.id && this.props.onChange) {
                            this.props.onChange(event.target.value, event.target.checked);
                        }
                    }
                }
            ></input>
            {this.props.displayName}
        </label>;
        return checkboxPropertyValue;
    }
}

/**
 * Visualization component to display simple property (name + 1 or more values) on the property panel
 * @param props property's props
 */
export const CheckboxPropertiesTable: React.StatelessComponent<IAllServerPortsTablePropertyProps> = (props) => {

    /**
     * Generates visualization for property values
     */
    function generateRows(): JSX.Element[] {
        if (!props.tableData || props.tableData.length === 0) {
            return null;
        }

        let rows: JSX.Element[] = [];

        props.tableData.forEach((value: IPortDetails) => {
            let columns: JSX.Element[] = [];
            let selectablePort = <td aria-label={value.displayName || ''} tabIndex={0}>
                <CheckboxPropertyValue
                    displayName={value.displayName}
                    checked={value.checked}
                    id={value.id}
                    onChange={value.onChange}/>
            </td>;
            let dependenciesCount = <td>
                {
                    value.dependenciesCount
                }
            </td>
            columns.push(selectablePort);
            columns.push(dependenciesCount);
            rows.push(<tr>
                {columns}
            </tr>);
        });
        return rows;
    }

    function generateHeaders(): JSX.Element {

        let columns: JSX.Element[] = [];

        props.tableHeaders.forEach((columnName: string) => {
            columns.push(
                <th>{columnName}</th>
            );
        });

        return <thead><tr className='header-row'>{columns}</tr></thead>;
    }

    return (
        <div className='allserverports-propertypanel-table'>
            <div className='tabular-property-grid'>
                <table>
                    {generateHeaders()}
                    <tbody>
                        {generateRows()}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
