import { ISeriesSelectorOption } from '../../../shared/ISeriesSelectorOption';

export interface IGetChangeSelectionResult {

    /**
     * the new selections after the toggling of the optionId parameter
     */
    newSelections: ISeriesSelectorOption[];

    /**
     * true if the option has been turned on
     */
    isOptionSelected: boolean;
}

/**
 * Shared utility methods for ChartPanes
 */
export class ChartUtility {
    /**
     * Given the current selection and an optionId for a selection that has just been toggled
     * returns the new selection and a string indicating if the optionId has just been
     * turned on or off
     *
     * @param {ISeriesSelectorOption[]} currentSelections current selection
     * @param {string} optionId optionId for an option htat has just been toggled
     */
    public static GetChangeSelectionResult(currentSelections: ISeriesSelectorOption[], optionId: string): IGetChangeSelectionResult {
        const newSelections = new Array<ISeriesSelectorOption>();

        let isOptionSelected: boolean = false;
        for (let option of currentSelections || []) {
            if (optionId === option.id) {
                isOptionSelected = !option.isSelected;
            }

            const resultingOption: ISeriesSelectorOption = {
                id: option.id,
                displayName: option.displayName,
                isSelected: optionId === option.id ? !option.isSelected : option.isSelected,
            };

            newSelections.push(resultingOption);
        }

        return { newSelections: newSelections, isOptionSelected: isOptionSelected };
    }

    public static GetChangeSelectionResultTopNChart(currentSelections: ISeriesSelectorOption[], 
        optionId: string): IGetChangeSelectionResult {
        const newSelections = new Array<ISeriesSelectorOption>();

        let isOptionSelected: boolean = false;
        for (let option of currentSelections || []) {
            if (optionId === option.id) {
                isOptionSelected = !option.isSelected;
            } else {
                option.isSelected = option.isSelected ? !option.isSelected : option.isSelected;
            }

            const resultingOption: ISeriesSelectorOption = {
                id: option.id,
                displayName: option.displayName,
                isSelected: optionId === option.id ? !option.isSelected : option.isSelected,
            };
            newSelections.push(resultingOption);
        }
        return { newSelections: newSelections, isOptionSelected: isOptionSelected };
    }
}
