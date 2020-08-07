import { SGDataRow } from 'appinsights-iframe-shared';

/** 
 * This extended SGDataRow is a hacked version that will enable the selectable-grid to recognize
 * it has children if ALL of the children are collapsed when the grid is first displayed
*/
export class SGDataRowExt extends SGDataRow {

    /**
     * 
     * @param columnData 
     * @param value 
     * @param selected 
     * @param expanded 
     * @param children 
     * @param disabled 
     */
     constructor(columnData, value, selected?, expanded?, children?, disabled?) {
        super(columnData, value, selected, expanded, children, disabled);

        // bbax: why does this exist?  the selectable-grid today has a bug that causes the
        // initial grid to believe it has no children if all children are collapsed on first load
        // and it never gives up on this belief.  this hack will convince the selectable-grid that
        // it does have children even if ALL those children are collapsed.
        // NOTE: I made this code unreadable more or less by design... if you need to know how it works
        // your better off asking the selectable-grid people to fix this bug (if they haven't already)
        // Bug: TODO
        this.traverse = (a, b, c, d, e) => {
            this.realTraverse((it, d) => {
                a(it, d + 1);
            }, b, c, d, e);
        }
    }

    // bbax: why does this exist?  the selectable grid today has ANOTHER bug whereby children
    // are only sorted when the selected column (as they understand it) is changed.  it causes
    // a few wierd behaviors... imagine sorting with one collapsed and another expanded then
    // expanding and changing the sort order.  in the end I decided to override this entire behavior
    // and just made children sort everytime a parent will sort
    // Bug: TODO (see above)
    private realTraverse(fn, onlyExpandedChildren, sortColumn, sortFn, depth) {
        if (onlyExpandedChildren === void 0) { onlyExpandedChildren = true; }
        if (sortColumn === void 0) { sortColumn = null; }
        if (sortFn === void 0) { sortFn = null; }
        if (depth === void 0) { depth = 0; }
        // Call fn for ourselves
        fn(this, depth);
        // Recurse into children
        if (!onlyExpandedChildren || (this.children && this.expanded)) {
            // Sort children first (if we haven't already sorted)
            if (sortColumn !== null && sortFn) {
                this.children = this.children.sort(function (a, b) { return sortFn(a.columnData[sortColumn], b.columnData[sortColumn]); });
                (this as any).sortedColumn = sortColumn;
            }
            this.children.forEach(function (child) {
                child.traverse(fn, onlyExpandedChildren, sortColumn, sortFn, depth + 1);
            });
        }
    };
}
