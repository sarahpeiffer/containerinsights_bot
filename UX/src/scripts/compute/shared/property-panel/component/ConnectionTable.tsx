/** block / third party */
import * as React from 'react';

/**
 * shared 
 */
import { TabularProperty } from '../../../../shared/property-panel/TabularProperty';


export interface ConnnectionTableData {
    connections: DependencyMap.Connection[];
    tableValue: JSX.Element[][];
}
/** 
 * Properties of the ConnectionTable component
*/
export interface IConnectionTableProps {
    tableData: ConnnectionTableData;
    columnNames: string[];
    onMemberMachineConnectionSelected: (selectedConnection: DependencyMap.Connection) => void;
}

/**
 * once row selected it will trigger (selectedConnection: DependencyMap.Connection)=> void call back
 * @param props Visualization properties
 */
export class ConnectionTable extends React.Component<IConnectionTableProps> {
    constructor(props?: IConnectionTableProps) {
        super(props);
        this.connectionSelected = this.connectionSelected.bind(this);
    }

    /**
     * use TabularProperty, and cache the connection result, 
     */
    public render() {
        return (<div>
            <TabularProperty
                propertyName={''}
                columnNames={this.props.columnNames}
                tabularValues={this.props.tableData.tableValue}
                onRowSelected={this.connectionSelected} />
        </div>);
    }

    /**
     * warp the rowSelected method, look up the local cache, trigger the callback func.
     * @param rowNum row index from the TabularProperty
     */
    private connectionSelected(rowNum: number) {
        const connections = this.props.tableData.connections;
        if (connections && rowNum >= 0 && connections.length > rowNum &&
            this.props.onMemberMachineConnectionSelected) {
            let connection = connections[rowNum];
            this.props.onMemberMachineConnectionSelected(connection);
        }
    }
}

