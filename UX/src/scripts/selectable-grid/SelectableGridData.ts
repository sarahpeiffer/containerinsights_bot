export enum SGSortOrder {
    Ascending = 0,
    Descending = 1
}

export interface SGHeaderPluginProps {
    isSelected: boolean;
    sortOrder: SGSortOrder;
}

export interface SGColumn {
    name: string;
    width: number;
    resizable?: boolean;
    sortable?: boolean;
    sortOrder?: SGSortOrder;
    sortFunc?: (v1: any, v2: any) => number;
    showSortBar?: boolean;
    sortBarColor?: string;
    cell: React.StatelessComponent<SGCellProps>;
    headerPlugin?: React.StatelessComponent<SGHeaderPluginProps>;
}

export interface SGCellProps {
    value: any;
    maxValue?: number;
    rowSelected: boolean;
}

export class SGDataRow {
    public selected?: boolean;
    public columnData: any[];
    public children?: SGDataRow[];
    public expanded?: boolean;
    public value: any;

    private sortedColumn: number = null;

    public constructor(columnData: any[], value: any, selected = false, expanded = false, children: SGDataRow[] = null) {

        this.columnData = columnData;
        this.value = value;
        this.children = children;
        this.selected = selected;
        this.expanded = expanded;
    }

    public traverse(fn: (row: SGDataRow, depth: number) => void, onlyExpandedChildren = true,
        sortColumn: number = null, sortFn: (a, b) => number = null, depth = 0) {

        // Call fn for ourselves
        fn(this, depth);

        // Recurse into children
        if (!onlyExpandedChildren || (this.children && this.expanded)) {
            // Sort children first (if we haven't already sorted)
            if (sortColumn !== null && sortColumn !== this.sortedColumn && sortFn) {
                this.children = this.children.sort((a, b) => sortFn(a.columnData[sortColumn], b.columnData[sortColumn]));
                this.sortedColumn = sortColumn;
            }
            this.children.forEach((child) => {
                child.traverse(fn, onlyExpandedChildren, depth + 1);
            });
        }
    }
}
