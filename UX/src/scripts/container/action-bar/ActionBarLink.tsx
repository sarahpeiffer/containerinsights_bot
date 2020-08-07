/** tpl */
import * as React from 'react';

/** local */
import { IActionItem } from './ActionBar';

/** styles */
import '../../../styles/container/ActionBar';

/** props for ActionBarLink */
interface IActionBarLinkProps {
    actionItem: IActionItem
}

export const ActionBarLink: React.StatelessComponent<IActionBarLinkProps> = ({actionItem}) => {
    return (
        <div 
        className='item' 
        onClick={actionItem.action} 
        onKeyPress={(e) => {
            let keycode = (e.keyCode ? e.keyCode : e.which);
            if (keycode === 13) {
                actionItem.action();
            }
        }}
        aria-label={actionItem.text}
        role='link'
        tabIndex={0}>
            <a className='item-container'>
                <div className='item-icon'>{actionItem.svg}</div>
                <div className='item-text'>{actionItem.text}</div>
            </a>
        </div>
    );
};
