import * as React from 'react';
import { Promise } from 'es6-promise';
import {
    PillContainer, PillContainerProps, IPillContentProvider, AddButtonStatus,
    DropdownPillProps, DropdownPillConfig, PillOption
} from '@appinsights/pillscontrol-es5';
import { DropdownPill } from '@appinsights/pillscontrol-es5/dist/DropdownPill';
import { OptionValues } from '@appinsights/react-select';

export interface DropDownOption extends PillOption {
    icon?: JSX.Element;
}

export interface IDropDownResult {
    options: DropDownOption[];
    selectedItem: DropDownOption;
}

export interface TextDropDownPillProps {
    /**container Id */
    containerId: string;
    /**selected item, shouldn't be empty */
    selectedItem: DropDownOption;
    /**
     * the all drop down options
     */
    dropDownOptions: DropDownOption[];
    /**
     * selected call back, value can be string, number, boolean
     */
    onSelectionChanged: (value: OptionValues) => void;
    /**
     * is drop down finish loading
     */
    areValuesLoading: boolean;
    /**
     * This value enables or disables dropdown.
     */
    disableEdit?: boolean;
    /**
     * pill Label
     */
    pillLabel: string;

    onEditModeChange? (inEditMode: boolean);

    onInputTextChange? (newValue: string);
}

/**
 * Creates the IPillContentProvider for creating DropdownPill components.
 */
function getDropdownContentProvider(contentProps: DropdownPillConfig): IPillContentProvider<DropdownPillConfig> {
    const pillContent: IPillContentProvider<DropdownPillConfig> = {
        createContent: (
            editMode: boolean,
            props: DropdownPillProps,
            updateConfiguredStatus: (configured: boolean) => void,
            updateAriaLabel: (newLabel: string) => void,
            editingComplete?: () => void,
            removeSelf?: () => void): Promise<JSX.Element> => {
            return new Promise((resolve) => { resolve(); }).then(() => {
                return <DropdownPill
                    editMode={editMode}
                    disableEdit={props.disableEdit}
                    enableValueMultiSelect={props.enableValueMultiSelect}
                    areValuesLoading={props.areValuesLoading}
                    valuesList={props.valuesList}
                    selection={props.selection}
                    onSelectionChange={props.onSelectionChange}
                    removeSelf={removeSelf}
                    updateAriaLabel={updateAriaLabel}
                    showLabels={props.showLabels}
                    autoOpen={props.autoOpen}
                    optionRenderer={props.optionRenderer}
                    valueRenderer={props.valueRenderer}
                    updateConfiguredStatus={updateConfiguredStatus}
                    onDropdownPillInputChange={props.onDropdownPillInputChange}/>;
            });
        },
        contentProps: contentProps,
    };
    return pillContent;
}

/**
 * render pill like component
 */
export class TextDropDownPill extends React.Component<TextDropDownPillProps> {
    constructor(props) {
        super(props);
        this.onSelectionChange = this.onSelectionChange.bind(this);
    }

    public render() {
        const dropDownProps: DropdownPillConfig = {
            onSelectionChange: this.onSelectionChange,
            showLabels: false, //the small value label when render expand, no need to set
            enableValueMultiSelect: false,
            disableEdit: this.props.disableEdit,
            areValuesLoading: this.props.areValuesLoading,
            selection: [this.props.selectedItem],
            valuesList: this.props.dropDownOptions,
            ariaLabel: null,
            autoOpen: true,
            optionRenderer: this.customOption,
            onDropdownPillInputChange: this.props.onInputTextChange
        }

        let selectIcon = null;
        if (this.props.selectedItem && this.props.selectedItem.icon) {
            selectIcon = this.props.selectedItem.icon;
        }
        const pillContainerProps: PillContainerProps = {
            containerId: this.props.containerId,
            pills: [
                {
                    pillId: this.props.containerId + '-pill', //Add -pill to make id's diff for accesisbility
                    pillContent: getDropdownContentProvider(dropDownProps),
                    unRemovable: true,
                    icon: selectIcon,
                    ariaLabel: null,
                    pillLabel: this.props.pillLabel,
                }
            ],
            addButtonStatus: AddButtonStatus.Hidden,
            addIcon: null,
            addLabel: null,
            alwaysShowLabel: false,
            className: 'drop-down-pill',
            onRemove: null, //must assign selected value, otherwise, this will be called.
            onAdd: null,
            onEditModeChange: (containerId: string, pillId: string, inEditMode: boolean) => {
                if (this.props.onEditModeChange) { this.props.onEditModeChange(inEditMode) }
            }
        }

        return (<div className='drop-down-container'><PillContainer  {...pillContainerProps} /></div>);
    }

    private onSelectionChange(newSelection: PillOption[]) {
        if (newSelection && newSelection[0] && this.props.onSelectionChanged) {
            this.props.onSelectionChanged(newSelection[0].value);
        }
    }

    private customOption(option: DropDownOption, index: number, inputValue: string): JSX.Element {
        const optionTooltip: string = option.label;
        const iconElement = option.icon ? <div className='drop-down-option-icon'>{option.icon}</div> : <div></div>
        const customOptionElement: JSX.Element =
            <div className={'drop-down-option'} title={optionTooltip}>
                {iconElement}
                <div className='drop-down-option-label'>{option.label}</div>
            </div>;
        return customOptionElement;
    }
}
