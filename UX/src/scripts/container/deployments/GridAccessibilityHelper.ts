import { KeyboardEvent } from 'react';
import { KeyCodes } from '../../shared/KeyCodes';


export function getCellInGrid(grid: HTMLElement, column: number, row: number): HTMLElement {
    return <HTMLElement>grid.querySelector(`[aria-rowindex="${row}"][aria-colindex="${column}"]`);
}

export function getCellFromCell(cell: HTMLElement, column: number, row: number): HTMLElement {
    let grid = cell;
    while (grid.className !== 'deployments-grid-wrapper') {
        grid = grid.parentElement;
        if (!grid) {
            return null;
        }
    }
    return getCellInGrid(grid, column, row);
}

export function handleKeyboardNavigation(event: KeyboardEvent<HTMLElement>) {
    if (!event) {
        return;
    }

    let newCell: HTMLElement = null;
    let currentCell = <HTMLElement>event.target;

    let curRow = parseInt(currentCell.getAttribute('aria-rowindex'), 10);
    let curCol = parseInt(currentCell.getAttribute('aria-colindex') || '0', 10);

    let key = event.which || event.keyCode;
    switch (key) {
        case KeyCodes.UP_ARROW:
            newCell = getCellFromCell(currentCell, curCol, curRow - 1);
            break;
        case KeyCodes.DOWN_ARROW:
            newCell = getCellFromCell(currentCell, curCol, curRow + 1);
            break;
        case KeyCodes.LEFT_ARROW:
            newCell = getCellFromCell(currentCell, curCol - 1, curRow);
            break;
        case KeyCodes.RIGHT_ARROW:
            newCell = getCellFromCell(currentCell, curCol + 1, curRow);
            break;
        default:
            return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (newCell) {
        currentCell.setAttribute('tabIndex', '-1');
        newCell.setAttribute('tabIndex', '0');
        newCell.focus();
    }
}
