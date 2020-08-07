/**
 * Shared
 */
import { ComputerGroup } from '../../shared/ComputerGroup';
import { DropDownOption } from '../../shared/pill-component/TextDropDownPill';

export enum SolutionType {
    Azure = 'azure',
    Hybrid = 'hybrid'
}

export class ControlPanelUtility {
    /**
     * Generate an array of options for use in a dropdown
     * @param computerGroups An array of ComputerGroup type
     */
    public static generateComputerGroupDropDownOptions(computerGroups: Array<ComputerGroup>): Array<DropDownOption> {
        const options: Array<DropDownOption> = [];
        for (let i = 0; i < computerGroups.length; i++) {
            const group: ComputerGroup = computerGroups[i];
            if (group && group.id && group.displayName) {
                const option: DropDownOption = ControlPanelUtility.createComputerGroupDropDownOption(group);
                options.push(option);
            }
        }
        return options;
    }

    /**
     * Retrieves the selected option using the group ID, else return null
     * @param selectedGroupId The selected ComputerGroup.id
     * @param options An array of DropDownOptions
     */
    public static retrieveDropDownOptionById(id: string, options: Array<DropDownOption>): DropDownOption {
        if (!id || !options) {
            return null;
        }

        for (let option of options) {
            let optionString: string = option.value.toString();
            if (optionString.toLowerCase() === id.toLowerCase()) {
                return option;
            }
        }

        return null;
    }

    // Create a dropdown option for a computer group
    private static createComputerGroupDropDownOption(group: ComputerGroup): DropDownOption {
        const option: DropDownOption = { label: group.displayName, value: group.id, icon: group.icon };
        return option;
    }
}
