import * as React from 'react';
import { SGCellProps } from '../selectable-grid';

/** 
 * A Grid Cell which is a simple span
*/
export const SimpleSpan: React.StatelessComponent<SGCellProps> = ({ value }) => {
    return <span title={value}>{value}</span>
}

