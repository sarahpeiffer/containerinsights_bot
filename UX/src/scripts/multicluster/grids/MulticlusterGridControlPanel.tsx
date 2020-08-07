/** tpl */
import * as React from 'react';

/** shared */
import { DisplayStrings } from '../../shared/DisplayStrings';

/**
 * styles
 */
import '../../../styles/shared/GridControlPanel.less';

/**
 * MultiCluster grid summary panel
 */
interface IMulticlusterGridControlPanelProps {
    /** callback invoked when name search filter value is changed */
    onNameSearchFilterChanged: (filterValue: string) => void;

    /** name search filter value */
    nameSearchFilterValue: string;
}

/**
 * Container grid control panel component
 * @param props component properties
 */
export const MulticlusterGridControlPanel: React.StatelessComponent<IMulticlusterGridControlPanelProps> = (props) => {
    return (
        <div className='pane-control-panel'>
            <div className='control-container'>
                <input type='text' className='search-for-name-filter'
                    aria-label={DisplayStrings.EnterNameToSearchFor}
                    value={props.nameSearchFilterValue}
                    placeholder={DisplayStrings.EnterNameToSearchFor}
                    onChange={(e) => {
                        if (e && e.target) {
                            props.onNameSearchFilterChanged(e.target.value);
                        }
                    }}
                />
            </div>
        </div>
    );
}
